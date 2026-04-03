import HttpError from "../models/http-error.js";
import axios from "axios";

export const getAISolution = async (req, res, next) => {
  const { question, category, image } = req.body;
  
  // Clean the API Key (remove quotes and spaces)
  const apiKey = process.env.GEMINI_API_KEY?.replace(/['"]/g, '').trim();

  if (!apiKey) {
    return next(new HttpError("GEMINI_API_KEY is not defined in server environment", 500));
  }

  if (!question && !image) {
    return next(new HttpError("Question text or image is required", 400));
  }

  const prompt = `
    You are an expert Math Tutor. Solve the following math problem step-by-step.
    If an image is provided, first describe the math problem you see in it.
    Use LaTeX for all mathematical formulas. Wrap inline math in $...$ and block math in $$...$$.
    Provide a clear and concise explanation for each step.
    
    Category: ${category || 'General Math'}
    Question Text: ${question || 'Problem is in the attached image'}
    
    Solution:
  `;

  try {
    let response;
    let lastError;
    let modelsToTry = [];

    // 1. DISCOVERY: Ask Google exactly what models this key can use
    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
      const listResponse = await axios.get(listUrl);
      if (listResponse.data.models) {
        // Get all models that support generating content, prioritized by newer versions
        modelsToTry = listResponse.data.models
          .filter(m => m.supportedGenerationMethods.includes("generateContent"))
          .map(m => m.name)
          .reverse(); 
        
        console.log("Found valid models for your key:", modelsToTry.join(", "));
      }
    } catch (discoveryErr) {
      console.warn("Model discovery failed, using defaults:", discoveryErr.message);
      modelsToTry = ['models/gemini-1.5-flash', 'models/gemini-pro', 'models/gemini-1.0-pro'];
    }

    // Prepare the parts for the request (text + optional image)
    const parts = [{ text: prompt }];
    if (image) {
      // image is expected to be a data URL like "data:image/jpeg;base64,..."
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];
      parts.push({
        inline_data: {
          mime_type: mimeType,
          data: base64Data
        }
      });
    }

    // 2. EXECUTION: Loop through discovered models and API versions
    const apiVersions = ['v1beta', 'v1'];
    
    for (const modelPath of modelsToTry) {
      for (const version of apiVersions) {
        try {
          const url = `https://generativelanguage.googleapis.com/${version}/${modelPath}:generateContent?key=${apiKey}`;
          
          response = await axios.post(url, {
            contents: [{ parts }]
          });
          
          if (response.data?.candidates?.[0]?.content) {
            console.log(`Successfully used: ${version}/${modelPath}`);
            const text = response.data.candidates[0].content.parts[0].text;
            return res.status(200).json({ solution: text });
          }
        } catch (err) {
          lastError = err;
          // Silently try next combination
        }
      }
    }

    throw lastError || new Error("No available models responded. Please ensure your API key is valid and has 'Generative Language API' enabled.");

  } catch (err) {
    console.error("Gemini API Error details:", {
      message: err.message,
      response: err.response?.data || "No response data"
    });
    
    const error = new HttpError(
      `AI generation failed: ${err.response?.data?.error?.message || err.message}`,
      err.response?.status || 500
    );
    return next(error);
  }
};


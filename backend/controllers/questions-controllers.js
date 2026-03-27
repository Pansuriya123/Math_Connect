import mongoose from 'mongoose';
import HttpError from "../models/http-error.js";
import User from "../models/user.js";
import Question from "../models/question.js";

const getQuestions = async (req, res, next) => {
  let questions;
  try {
    questions = await Question.find().populate('userId', 'username');
  } catch (err) {
    const error = new HttpError(
      "Fetching questions failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    questions: questions.map((q) => q.toObject({ getters: true }))
      .map(q => ({ ...q, userId: q.userId.username })),
  });
};

const getUserQuestions = async (req, res, next) => {
  const username = req.params.username;

  let questions;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ error: "User does not exist" });
    }
    questions = await Question.find({ userId: user._id });
  } catch (err) {
    const error = new HttpError(
      "Fetching user's questions failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({
    questions: questions.map((q) => q.toObject({ getters: true })),
  });
};

const createUserQuestion = async (req, res, next) => {
  const { question, category, answer } = req.body;
  const username = req.params.username;

  if (category === "Error") {
    return res.status(404).json({ error: "Enter valid Mathematics Question!!!" });
  }

  if (!question || !category) {
    return res.status(400).json({ error: "Question and category are required" });
  }

  const user = await User.findOne({ username });
  if (!user) {
    return res.status(404).json({ error: "User does not exist" });
  }

  const createdQuestion = new Question({
    userId: user._id,
    question,
    category,
    answer: answer || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  try {
    await createdQuestion.save();
  } catch (err) {
    const error = new HttpError("Creating question failed, please try again.", 500);
    return next(error);
  }

  res.status(201).json({ question: createdQuestion.toObject({ getters: true }) });
};

const getQuestionById = async (req, res) => {
  const questionId = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ error: 'Invalid question id.' });
  }

  try {
    const question = await Question.findById(questionId).populate('userId', 'username');
    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    const questionObj = question.toObject({ getters: true });
    questionObj.userId = questionObj.userId.username;
    res.json({ question: questionObj });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Server error while fetching question.' });
  }
};

export { getQuestions, getUserQuestions, createUserQuestion, getQuestionById };
export const deleteQuestion = async (req, res) => {
  const id = req.params.id;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: 'Invalid question id.' });
  }
  try {
    const question = await Question.findById(id);
    if (!question) {
      return res.status(404).json({ error: 'Question not found.' });
    }
    const username = req.query.username;
    if (!username) {
      return res.status(401).json({ error: 'Unauthorized: username required' });
    }
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (String(question.userId) !== String(user._id)) {
      return res.status(403).json({ error: 'Forbidden: not owner' });
    }
    await Question.findByIdAndDelete(id);
    return res.json({ message: 'Question removed.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Server error while deleting question.' });
  }
};

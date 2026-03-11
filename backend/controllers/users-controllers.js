import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';

import HttpError from "../models/http-error.js";
import User from "../models/user.js";

import crypto from 'crypto';
import nodemailer from 'nodemailer';

import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();
const upload = multer({ storage });

const JWT_SECRET = process.env.JWT_SECRET;

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (err) {
    const error = new HttpError(
      "Fetching users failed, please try again later.",
      500
    );
    return next(error);
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  const trimmedPassword = password.trim();
  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logging in failed, please try again later.",
      500
    );
    return next(error);
  }
  const isValidPassword = await bcrypt.compare(trimmedPassword, existingUser.password);
  console.log(isValidPassword)
  console.log(trimmedPassword,existingUser.password)
  if (!existingUser || !isValidPassword) {
    const error = new HttpError(
      "Invalid credentials, could not log you in.",
      401
    );
    return next(error);
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: existingUser.id, email: existingUser.email },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
  console.log("Generated JWT Token: ", token);
  // Set token in cookie
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax', // Changed from 'None' to 'lax' for localhost development
    secure: false, // Set to false for localhost development
    maxAge: 3600000 // 1 hour
  });

  res.json({ message: "Logged in!", userId: existingUser.id, email: existingUser.email });
};

const logout = async (req, res, next) => {
  // Clear the token cookie
  res.clearCookie('token', {
    sameSite: 'lax',
    secure: false
  });
  res.json({ message: "Logged out!" });
};

const editName = async (req, res, next) => {
  const { userId, Name } = req.params;
  
  let user;
  try {
    user = await User.findById(userId);
    
    if (!user) {
      const error = new HttpError("User not found.", 404);
      return next(error);
    }

    user.full_name = Name;
    await user.save();

    res.status(200).json({ message: "User name updated successfully!", user });
  } catch (err) {
    const error = new HttpError(
      "Updating user's name failed, please try again later.",
      500
    );
    return next(error);
  }
};

// Middleware to check if user is authenticated
const isAuth = (req, res, next) => {
  console.log('isAuth middleware called');
  console.log('Cookies:', req.cookies);  // Add this to debug cookies

  const token = req.cookies.token;

  if (!token) {
    console.log('No token found in cookies');
    return next(new HttpError('Authentication failed!', 401));
  }

  try {
    const decodedToken = jwt.verify(token, JWT_SECRET);
    console.log('Decoded token:', decodedToken);
    req.userData = { userId: decodedToken.userId };
    next();
  } catch (err) {
    console.error('Error verifying token:', err);
    return next(new HttpError('Authentication failed!', 401));
  }
};


const getCurrentUser = async (req, res, next) => {
  
  const userId = req.userData.userId;

  let user;
  try {
     
      // Auth-only mode: no badge dependency
      user = await User.findById(userId).select('-password');
      
      if (!user) {
          return next(new HttpError('User not found.', 404));
      }

      res.json({ 
          user: user.toObject({ getters: true })
      });
  } catch (err) {
      return next(new HttpError('Fetching user failed, please try again later.', 500));
  }
};


const updatePassword = async (req, res, next) => {
  const { userId } = req.params; // Assuming the user ID is passed in the URL
  const { currentPassword, newPassword } = req.body; // The current and new passwords are passed in the request body

  // Check if the new password meets the required criteria
  if (newPassword.length < 8 || 
      !/[A-Z]/.test(newPassword) || 
      !/[a-z]/.test(newPassword) || 
      !/[0-9]/.test(newPassword) || 
      !/[\W_]/.test(newPassword)) {
    return res.status(400).json({
      message: "New password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one number, and one special character."
    });
  }

  let user;
  try {
    // Find the user by ID
    user = await User.findById(userId);

    if (!user) {
      const error = new HttpError("User not found.", 404);
      return next(error);
    }

    // Check if the current password is correct
    const isPasswordCorrect = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordCorrect) {
      return res.status(403).json({ message: "Current password is incorrect." });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update the user's password and save it
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ message: "Password updated successfully!" });
  } catch (err) {
    console.error(err);
    const error = new HttpError(
      "Updating password failed, please try again later.",
      500
    );
    return next(error);
  }
};

const sendOtpEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined;
    const smtpSecure = process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : undefined;
    const allowInsecureTls = process.env.SMTP_ALLOW_INSECURE_TLS === 'true';
    const smtpUser = process.env.SMTP_USER || process.env.EMAIL_USER;
    const smtpPass = process.env.SMTP_PASS || process.env.EMAIL_PASSWORD;

    if (!smtpUser || !smtpPass) {
      return res.status(500).json({ message: 'Email service not configured. Set SMTP_USER/SMTP_PASS or EMAIL_USER/EMAIL_PASSWORD.' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User with this email does not exist.' });
    }

    // Generate OTP and expiration time
    const otp = crypto.randomInt(100000, 999999); // 6-digit OTP
    const otpExpires = Date.now() + 10 * 60 * 1000; // OTP valid for 10 minutes

    // Generate JWT token containing OTP and expiration (hashed)
    const otpToken = jwt.sign({ otp: otp.toString(), otpExpires, email }, process.env.JWT_SECRET, { expiresIn: '10m' });

    // Send OTP via email
    const candidates = [];
    if (smtpHost) {
      candidates.push({
        host: smtpHost,
        port: smtpPort || 587,
        secure: typeof smtpSecure === 'boolean' ? smtpSecure : false,
        auth: { user: smtpUser, pass: smtpPass },
        tls: allowInsecureTls ? { rejectUnauthorized: false } : undefined,
      });
    } else {
      candidates.push({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: { user: smtpUser, pass: smtpPass },
        tls: allowInsecureTls ? { rejectUnauthorized: false } : undefined,
      });
      candidates.push({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        auth: { user: smtpUser, pass: smtpPass },
        tls: allowInsecureTls ? { rejectUnauthorized: false } : undefined,
      });
      candidates.push({
        service: 'gmail',
        auth: { user: smtpUser, pass: smtpPass },
        tls: allowInsecureTls ? { rejectUnauthorized: false } : undefined,
      });
    }

    let transporter;
    let verified = false;
    let lastError;
    for (const cfg of candidates) {
      try {
        transporter = nodemailer.createTransport(cfg);
        await transporter.verify();
        verified = true;
        break;
      } catch (e) {
        lastError = e;
      }
    }
    if (!verified) {
      return res.status(500).json({ message: 'Email transport verification failed', error: lastError ? lastError.message : 'Unknown error' });
    }

    const mailOptions = {
      from: smtpUser,
      to: email,
      subject: 'Password Reset OTP',
      text: `Your password reset OTP is: ${otp}. It will expire in 10 minutes.`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        return res.status(500).json({ message: 'Failed to send OTP email.', error: error.message || String(error) });
      }
      res.status(200).json({ message: 'OTP sent to your email.', otpToken });
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error.', error: error.message || String(error) });
  }
};

const verifyOtp = async (req, res) => {
  const { email, otp, otpToken } = req.body;

  try {
    // Verify the JWT token
    const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);

    // Check if the email matches the one stored in the token
    if (decoded.email !== email) {
      return res.status(400).json({ message: 'Invalid email or OTP.' });
    }

    // Check if OTP matches and is not expired
    if (decoded.otp !== otp || Date.now() > decoded.otpExpires) {
      return res.status(400).json({ message: 'Invalid or expired OTP.' });
    }

    // OTP is valid, proceed to the password reset step
    res.status(200).json({ message: 'OTP verified'});
  } catch (error) {
    console.error(error)
    res.status(500).json({ message: 'Server error during OTP verification.' });
  }
};

const resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    const salt = bcrypt.genSaltSync(10);
    const hashPassword = bcrypt.hashSync(newPassword, salt);

    // Update the user's password
    user.password = hashPassword;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error during password reset.' });
  }
};

const editPhoto = async (req, res) => {
  const userId = req.params.userId;

  try {
      // Check if a file was uploaded
      if (!req.file) {
          return res.status(400).json({ message: 'No file uploaded.' });
      }

      // Optional: Validate the uploaded file type and size here

      // Process the image if needed (e.g., resizing, format conversion)
      const profilePhoto = req.file.buffer.toString('base64'); // Convert to base64 if needed

      // Update the user's profile photo
      const updatedUser = await User.findByIdAndUpdate(
          userId,
          { profile_photo: profilePhoto },
          { new: true } // Return the updated user
      );

      if (!updatedUser) {
          return res.status(404).json({ message: 'User not found.' });
      }

      res.status(200).json({ message: 'Profile photo updated successfully!', user: updatedUser });
  } catch (error) {
      console.error('Error updating profile photo:', error);
      res.status(500).json({ message: 'Server error while updating profile photo.' });
  }
};


// exports removed in ESM; use named export at bottom
const removePhoto = async (req, res) => {
  const userId = req.params.userId;
  try {
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $unset: { profile_photo: 1 } },
      { new: true }
    ).select('-password');
    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(200).json({ message: 'Profile photo removed successfully!', user: updatedUser });
  } catch (error) {
    console.error('Error removing profile photo:', error);
    return res.status(500).json({ message: 'Server error while removing profile photo.' });
  }
};
export {
  getCurrentUser,
  getUsers,
  login,
  logout,
  editName,
  isAuth,
  updatePassword,
  sendOtpEmail,
  resetPassword,
  verifyOtp,
  editPhoto,
  removePhoto
};

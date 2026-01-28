const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const HttpError = require('../models/http-error');
const User = require('../models/user');
const { validationResult } = require('express-validator');

// Signup function
const signup = async (req, res, next) => {
  // Handle validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log(errors.array());
    return next(new HttpError('Invalid inputs passed, please check your data.', 422));
  }

  const { username, email, password, full_name, profile_photo } = req.body;

  // Check if the user already exists
  let existingUser;
  try {
    existingUser = await User.findOne({ email: email }).populate('badgeId','position');
  } catch (err) {
    console.log(err);
    return next(new HttpError('Signing up failed, please try again later.', 500));
  }

  if (existingUser) {
    return next(new HttpError('User exists already, please login instead.', 422));
  }

  const salt = bcrypt.genSaltSync(10);
  const hashPassword = bcrypt.hashSync(password, salt);

  // Auth-only mode:
  // - do NOT depend on Cloudinary or Badge
  // - store profile photo directly if provided (base64 data URL or plain string)
  const profilePhotoValue = profile_photo || null;

  // Create a new user
  const createdUser = new User({
    username,
    password: hashPassword,
    full_name: full_name || null,
    email,
    profile_photo: profilePhotoValue,
  });

  try {
    await createdUser.save();
  } catch (err) {
    console.log(err);
    return next(new HttpError('Signing up failed, please try again.', 500));
  }

  // Generate JWT token
  const token = jwt.sign(
    { userId: createdUser.id, email: createdUser.email },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Set token in cookie
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: 3600000, // 1 hour
  });

  res.status(201).json({
    message: 'User created successfully',
    userId: createdUser.id,
    email: createdUser.email,
  });
};

module.exports = { signup };

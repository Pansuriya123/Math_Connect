import HttpError from "../models/http-error.js";
import Answer from "../models/answer.js";
import Question from "../models/question.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";

import mongoose from 'mongoose';

const getAllAnswersOfUser = async (req, res, next) => {
  const userId = req.userData.userId;
  try {
    const answers = await Answer.find({ userId });
    if (!answers.length) {
      return res.json({ message: "No changes" });
    }
    let total_upvotes = 0;
    for (const a of answers) {
      total_upvotes += (a.upvotes || 0) - (a.downvotes || 0);
    }
    const message = total_upvotes > 0 ? "Updates available" : "No changes";
    return res.json({ message });
  } catch (err) {
    return next(new HttpError("Failed to fetch answers summary", 500));
  }
};

const getAllAnswersOfQuestion = async (req, res, next) => {
  const { questionId } = req.params;
  try {
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }
    const answers = await Answer.find({ questionId }).populate('userId', 'username');
    const formattedAnswers = answers.map(answer => ({
      answerId: answer._id,
      answer: answer.answer,
      user: answer.userId.username,
      upvotes: answer.upvotes,
      downvotes: answer.downvotes,
      createdAt: new Date(),
      verifiedByExpert: answer.verifiedByExpert,
      image: answer.image
    }));
    res.json({
      question: {
        id: question._id,
        title: question.question,
        answer: question.answer,
        category: question.category,
        userId: question.userId,
        createdAt: question.createdAt,
        updatedAt: question.updatedAt,
        answerCount: question.answerCount
      },
      answers: formattedAnswers
    });
  } catch (err) {
    return res.status(500).json({ message: "Fetching answers failed." });
  }
};

export { getAllAnswersOfUser, getAllAnswersOfQuestion };

const createAnswer = async (req, res, next) => {
  const { questionId } = req.params;
  const { answer, image } = req.body;
  const userId = req.userData.userId;

  if (!mongoose.Types.ObjectId.isValid(questionId)) {
    return res.status(400).json({ message: "Invalid question id." });
  }
  if (!answer || !answer.trim()) {
    return res.status(400).json({ message: "Answer content is required." });
  }

  try {
    const question = await Question.findById(questionId);
    if (!question) {
      return res.status(404).json({ message: "Question not found." });
    }
    const newAnswer = new Answer({
      questionId,
      userId,
      answer,
      image: image || null,
      createdAt: new Date(),
      updatedAt: new Date(),
      upvotes: 0,
      downvotes: 0,
      upvotedBy: [],
      downvotedBy: [],
      verifiedByExpert: false
    });
    await newAnswer.save();
    question.answerCount = (question.answerCount || 0) + 1;
    await question.save();

    // Award XP for answering a question
    const user = await User.findById(userId);
    if (user) {
      user.xp += 20;
      user.level = Math.floor(user.xp / 100) + 1;
      await user.save();
    }

    // Create a real-time notification for the question owner
    if (question.userId.toString() !== userId.toString()) {
      const notification = new Notification({
        recipient: question.userId,
        sender: userId,
        type: 'answer',
        questionId: question._id,
        answerId: newAnswer._id,
        content: `replied to your question: "${question.question.substring(0, 30)}..."`
      });
      await notification.save();
      
      // Emit real-time notification
      req.io.to(`notifications-${question.userId}`).emit('new-notification', {
        id: notification._id,
        type: 'answer',
        content: notification.content,
        senderName: user ? user.username : 'Someone',
        createdAt: notification.createdAt
      });
    }

    return res.status(201).json({ message: "Answer created", answerId: newAnswer._id });
  } catch (err) {
    return next(new HttpError("Failed to create answer", 500));
  }
};

const deleteAnswer = async (req, res, next) => {
  const { answerId } = req.params;
  const userId = req.userData.userId;
  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(400).json({ message: "Invalid answer id." });
  }
  try {
    const ans = await Answer.findById(answerId);
    if (!ans) {
      return res.status(404).json({ message: "Answer not found." });
    }
    if (String(ans.userId) !== String(userId)) {
      return res.status(403).json({ message: "Forbidden: not owner" });
    }
    const qid = ans.questionId;
    await Answer.findByIdAndDelete(answerId);
    if (qid) {
      await Question.findByIdAndUpdate(qid, { $inc: { answerCount: -1 } });
    }
    return res.json({ message: "Answer deleted." });
  } catch (err) {
    return next(new HttpError("Failed to delete answer", 500));
  }
};

const voteAnswer = async (req, res, next) => {
  const { answerId, voteType } = req.params;
  const userId = req.userData.userId;
  if (!mongoose.Types.ObjectId.isValid(answerId)) {
    return res.status(400).json({ message: "Invalid answer id." });
  }
  if (!['upvote', 'downvote'].includes(voteType)) {
    return res.status(400).json({ message: "Invalid vote type." });
  }
  try {
    const ans = await Answer.findById(answerId);
    if (!ans) {
      return res.status(404).json({ message: "Answer not found." });
    }
    const uid = new mongoose.Types.ObjectId(userId);
    const hasUp = ans.upvotedBy.some(id => String(id) === String(uid));
    const hasDown = ans.downvotedBy.some(id => String(id) === String(uid));

    if (voteType === 'upvote') {
      if (hasUp) {
        ans.upvotedBy = ans.upvotedBy.filter(id => String(id) !== String(uid));
        ans.upvotes = Math.max(0, (ans.upvotes || 0) - 1);
      } else {
        ans.upvotedBy.push(uid);
        ans.upvotes = (ans.upvotes || 0) + 1;
        if (hasDown) {
          ans.downvotedBy = ans.downvotedBy.filter(id => String(id) !== String(uid));
          ans.downvotes = Math.max(0, (ans.downvotes || 0) - 1);
        }
      }
    } else {
      if (hasDown) {
        ans.downvotedBy = ans.downvotedBy.filter(id => String(id) !== String(uid));
        ans.downvotes = Math.max(0, (ans.downvotes || 0) - 1);
      } else {
        ans.downvotedBy.push(uid);
        ans.downvotes = (ans.downvotes || 0) + 1;
        if (hasUp) {
          ans.upvotedBy = ans.upvotedBy.filter(id => String(id) !== String(uid));
          ans.upvotes = Math.max(0, (ans.upvotes || 0) - 1);
        }
      }
    }
    await ans.save();
    return res.json({ message: "Vote updated", upvotes: ans.upvotes, downvotes: ans.downvotes });
  } catch (err) {
    return next(new HttpError("Failed to update vote", 500));
  }
};

export { createAnswer, deleteAnswer, voteAnswer };

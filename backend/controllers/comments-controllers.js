import HttpError from "../models/http-error.js";
import Comment from "../models/comment.js";
import Answer from "../models/answer.js";
import Question from "../models/question.js";
import User from "../models/user.js";
import Notification from "../models/notification.js";

export const getComments = async (req, res, next) => {
  const answerId = req.params.answerId;

  try {
    const comments = await Comment.find({ answerId }).populate('userId', 'username');
    const answer = await Answer.findById(answerId);
    if (!answer) {
      return res.status(404).json({ message: "Answer not found." });
    }
    const question = await Question.findById(answer.questionId);
    const response = {
      questionId: question?._id || null,
      answer: answer.answer,
      comments: comments.map((c) => ({
        _id: c._id,
        username: c.userId.username,
        content: c.content,
        createdAt: c.createdAt,
      })),
    };
    res.json(response);
  } catch (err) {
    const error = new HttpError("Fetching the comments failed, please try again later.", 500);
    return next(error);
  }
};

export const postComments = async (req, res, next) => {
  const { answerId } = req.params;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Content is required.' });
  }

  try {
    const uid = req.userData.userId;
    const newComment = new Comment({
      answerId,
      userId: uid,
      content,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await newComment.save();

    // Award XP for commenting
    const user = await User.findById(uid);
    if (user) {
      user.xp += 5;
      user.level = Math.floor(user.xp / 100) + 1;
      await user.save();
    }

    // Create a real-time notification for the answer owner
    const answer = await Answer.findById(answerId);
    if (answer && answer.userId.toString() !== uid.toString()) {
      const notification = new Notification({
        recipient: answer.userId,
        sender: uid,
        type: 'comment',
        answerId: answerId,
        content: `commented on your answer: "${content.substring(0, 30)}..."`
      });
      await notification.save();

      // Emit real-time notification
      req.io.to(`notifications-${answer.userId}`).emit('new-notification', {
        id: notification._id,
        type: 'comment',
        content: notification.content,
        senderName: user ? user.username : 'Someone',
        createdAt: notification.createdAt
      });
    }

    res.status(201).json({ message: "Comment added successfully.", comment: newComment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Adding the comment failed." });
  }
};

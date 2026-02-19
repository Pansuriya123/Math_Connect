import HttpError from "../models/http-error.js";
import Comment from "../models/comment.js";
import Answer from "../models/answer.js";
import Question from "../models/question.js";

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
    res.status(201).json({ message: "Comment added successfully.", comment: newComment });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Adding the comment failed." });
  }
};

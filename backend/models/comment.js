import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const Schema = mongoose.Schema;

const commentSchema = new Schema({
  answerId: { type: mongoose.Types.ObjectId, ref: 'answers', required: true },
  userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date },
  updatedAt: { type: Date },
});

commentSchema.plugin(uniqueValidator);

const Comment = mongoose.model('comments', commentSchema);
export default Comment;

import mongoose from 'mongoose';

const Schema = mongoose.Schema;

const answerSchema = new Schema({
    questionId: { type: mongoose.Types.ObjectId, required: true, ref: "Question" },
    userId: { type: mongoose.Types.ObjectId, required: true, ref: "User" },
    answer: { type: String, required: true},
    createdAt: { type: Date },
    updatedAt: { type: Date },
    upvotes: { type: Number, default: 0 },
    downvotes: { type: Number, default: 0 },
    upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    downvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    verifiedByExpert: { type: Boolean, default: false },
    image: { type: String },
});

const Answer = mongoose.model("answers", answerSchema);
export default Answer;

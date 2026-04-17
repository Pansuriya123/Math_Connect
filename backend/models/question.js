import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const Schema = mongoose.Schema;

const questionSchema = new Schema({
    userId: { type: mongoose.Types.ObjectId, required: true, ref: "User"},
    question: { type: String, required: true },
    category: {type:String,required:true},
    answer: { type: String },
    image: { type: String }, // Store base64 or Cloudinary URL
    createdAt: { type: Date },
    updatedAt: { type: Date },
    answerCount: {type:Number,default:0}
});

questionSchema.plugin(uniqueValidator);

const Question = mongoose.model("questions", questionSchema);
export default Question;

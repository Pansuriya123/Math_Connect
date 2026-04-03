import mongoose from 'mongoose';
import uniqueValidator from 'mongoose-unique-validator';

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true, unique: true},
    password: { type: String, required: true },
    full_name: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    // Auth-only mode: badge is optional
    badgeId: { type: mongoose.Types.ObjectId, required: false, ref: 'Badge'},
    profile_photo: { type: String },
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
})

userSchema.plugin(uniqueValidator);

const User = mongoose.model("User", userSchema);
export default User;

const mongoose = require('mongoose');
const uniqueValidator = require('mongoose-unique-validator');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: { type: String, required: true, unique: true},
    password: { type: String, required: true },
    full_name: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    // Auth-only mode: badge is optional
    badgeId: { type: mongoose.Types.ObjectId, required: false, ref: 'Badge'},
    profile_photo: { type: String },
})

userSchema.plugin(uniqueValidator);

const User = mongoose.model("User", userSchema)
module.exports = User
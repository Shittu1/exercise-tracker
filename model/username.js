const shortId = require("shortid");
const mongoose = require('mongoose');
const { Schema } = mongoose;

const userSchema = new Schema({
    _id : { type: String, 'default': shortId.generate },
    username: { type: String, required: true, unique: true },
    exercise: [{
        description: { type: String },
        duration: { type: Number },
        date: { type: Date }
      }]
});

const user = mongoose.model('user', userSchema);

module.exports = user;

// models/Faculty.js
const mongoose = require("mongoose");
const User = require("./BaseUser.model.js");

const BotSchema = new mongoose.Schema({
  history: { type:String,required: true },
});

module.exports = mongoose.model("Bot", BotSchema);


// models/BaseUser.model.js
const mongoose = require("mongoose");

const baseOptions = {
  discriminatorKey: "__t", // ✅ Correct
  collection: "users",
  timestamps: true,
};

const BaseUserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
}, baseOptions);

const User = mongoose.model("User", BaseUserSchema);
module.exports = User;

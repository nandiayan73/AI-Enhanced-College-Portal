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
  photo:{type:String,default:"https://cengage.my.site.com/resource/1607465003000/loginIcon"},
}, baseOptions);

const User = mongoose.model("User", BaseUserSchema);
module.exports = User;

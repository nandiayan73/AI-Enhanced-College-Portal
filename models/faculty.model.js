// models/Faculty.js
const mongoose = require("mongoose");
const User = require("./BaseUser.model.js");

const facultySchema = new mongoose.Schema({
  department: { type:String,required: true },
  designation: { type: String, default: "Assistant Professor" },
  isApproved: { type: Boolean, default: true }, // Faculties don't require approval
});

module.exports = User.discriminator("Faculty", facultySchema);

// models/Student.js
const User = require("./BaseUser.model");
const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema({
  text: { type: String, required: true },
  date: { type: String, default: () => new Date().toISOString() }, // ISO date format
  img: { type: String }, // Optional image URL
  subject: {type:String}
});

const studentSchema = new mongoose.Schema({
  department: { type: String, required: true },

  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AcademicYear",
    required: true,
  },

  isApproved: { type: Boolean, default: false },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HOD",
  },

  notices: [noticeSchema], 
});

module.exports = User.discriminator("Student", studentSchema);

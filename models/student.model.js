// models/Student.js
const User = require("./BaseUser.model");
const mongoose = require("mongoose");

const studentSchema = new mongoose.Schema({
  department: {type:String, required: true },
  // academicYear: { type: String, required: true }, // e.g. 2024-2028
  academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
  // currentSemester: { type: Number, default: 1 },
  // feeSlipUrl: { type: String, required: true },
  isApproved: { type: Boolean, default: false }, // Approved by HOD
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "HOD" },
});

module.exports = User.discriminator("Student", studentSchema);

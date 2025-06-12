const mongoose = require("mongoose");

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    enum: ["CSE", "ECE", "ME", "EEE", "IT", "CE"], 
  },
  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AcademicYear",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "HOD",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
   session: {
    type: String,
    // required: true,
    match: /^[0-9]{4}-[0-9]{2}$/, // e.g., 2021-22
    unique: true,
  }
});

module.exports = mongoose.model("Department", departmentSchema);

const mongoose=require("mongoose");
const semesterSchema = new mongoose.Schema({
  number: { type: Number, required: true }, // e.g., 1, 2, 3...
  // academicYear: { type: String, required: true }, // e.g., "2024-2025"
  session: {
    type: String,
    required: true,
    match: /^[0-9]{4}-[0-9]{2}$/, // e.g., 2021-22
    unique: true,
  },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], // Auto add after 1st sem
});

module.exports = mongoose.model("Semester", semesterSchema);

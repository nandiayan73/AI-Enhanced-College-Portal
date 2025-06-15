const mongoose = require("mongoose");

const academicYearSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    enum: [1, 2, 3, 4], // 1st to 4th year
  },
  session: {
    type: String,
    match: /^[0-9]{4}-[0-9]{2}$/, // e.g., 2021-22
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Principal",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

// ✅ Avoid OverwriteModelError during hot-reload / Nodemon
module.exports = mongoose.models.AcademicYear || mongoose.model("AcademicYear", academicYearSchema);

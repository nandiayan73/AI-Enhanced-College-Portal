const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    photo: { type: String }, // optional image
    caption: { type: String, required: true }, // required caption or message
    date: { type: Date, default: Date.now }, // auto-filled date

    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      refPath: "publisherModel", // dynamically reference either Principal or HOD
    },

    publisherModel: {
      type: String,
      required: true,
      enum: ["Faculty", "HOD"], // only allow these two types
    },

   academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    department:{type:String,required:true}
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notice", noticeSchema);

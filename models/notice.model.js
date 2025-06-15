const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    photo: { type: String }, // optional image
    caption: { type: String, required: true }, // required caption or message
    date: { type: Date, default: Date.now }, // auto-filled date
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Principal",
      required: true,
    }, // who posted the notice
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notice", noticeSchema);

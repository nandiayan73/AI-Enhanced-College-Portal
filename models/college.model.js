const mongoose = require("mongoose");

const CollegeSchema = new mongoose.Schema({
  singletonKey: {
    type: String,
    default: "COLLEGE_SINGLETON",
    unique: true,
  },
  session_id: {
    type: String,
    default: "SVIST",
  },
  session: {
    type: String,
    default: "2025-26",
  },
});

// Static method to get or create singleton
CollegeSchema.statics.getSingleton = async function () {
  let college = await this.findOne();
  if (!college) {
    college = await this.create({});
  }
  return college;
};

module.exports = mongoose.model("College", CollegeSchema);

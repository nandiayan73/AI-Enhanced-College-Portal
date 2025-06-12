// models/HOD.js
const User = require("./BaseUser.model");
const mongoose = require("mongoose");

const hodSchema = new mongoose.Schema({
  department: { type:String,required: true },
  isApproved: { type: Boolean, default: false }, // Approved by Principal
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Principal" },
});

module.exports = User.discriminator("HOD", hodSchema);

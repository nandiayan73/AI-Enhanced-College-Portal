const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["photo", "file", "caption", "video"],
    required: true,
  },
  contentUrl: {
    type: String,
    required: function () {
      return this.type !== "caption";
    },
  },
  captionText: {
    type: String,
    required: function () {
      return this.type === "caption";
    },
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: "posts.role",
    required: true,
  },
  role: {
    type: String,
    enum: ["HOD", "Faculty"],
    required: true,
  },
});

const attendanceSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Student",
    required: true,
  },
  attendanceRecords: [{
    date: {
      type: Date,
      required: true,
    },
    present: {
      type: Boolean,
      default: false,
    }
  }],
  totalPercentage:{type:Number,default:0}
});

const subjectSchema = new mongoose.Schema({
  subjectName: { type: String, required: true },
  subjectCode: { type: String, required: true, unique: true },
  credits: { type: Number, default: 3 },

  department: { type: String, required: true },
  semester: { type: mongoose.Schema.Types.ObjectId, ref: "Semester" },

  academicYear: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "AcademicYear",
    required: true,
  },

  faculty: [{
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    refPath: "facultyRole",
    default: null,
  }],
  facultyRole: {
    type: String,
    enum: ["HOD", "Faculty"],
    required: function () {
      return this.faculty != null;
    }
  },
  students: [attendanceSchema],
  session:{
    type: String,
    // required: true,
    match: /^[0-9]{4}-[0-9]{2}$/, // e.g., 2021-22
    unique: true,
  },

  posts: [postSchema],
  syllabus:{
    url:{type:String},
    text:{type:String}
  },
  questionPapers:[{
    url:{type:String},
    text:{type:String}
  }]
});

module.exports = mongoose.model("Subject", subjectSchema);

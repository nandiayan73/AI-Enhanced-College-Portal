const BaseUser = require("../models/BaseUser.model");
const Principal=require("../models/principal.model");
const Student=require("../models/student.model");
const Faculty=require("../models/faculty.model");
const HOD=require("../models/hod.model");
const AcademicYear = require("../models/academicYear.model"); // Make sure it's imported at the top
const Subject = require("../models/subject.model");



const getAcademicYearId=async(req,res)=>{
     const academicYear = await AcademicYear.findOne({ session, year });
        if (!academicYear) {
          return res.status(404).json({
                message: `Academic year not found for session "${session}" and year "${year}".`
              });
            }
        return res.status(400).json({ academicYear});
}

const getStudentSubjects = async (req, res) => {
  const { studentId } = req.body;
  try {
    const student = await Student.findById(studentId).populate("academicYear");
    console.log(student);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!student.academicYear) {
      return res.status(400).json({ message: "Academic year not assigned for this student" });
    }

    const department = student.department;
    const academicYearId = student.academicYear._id;

    const subjects = await Subject.find({
      department: department,
      academicYear: academicYearId,
      "students.student": studentId
    });

    res.status(200).json({
      department: department,
      academicYear: student.academicYear,
      subjects: subjects
    });
  } catch (err) {
    console.error("Error fetching student subjects:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const notifyLowAttendent= async (req, res) => {
  try {
    const subjects = await Subject.find().populate("students.student");

    const noticeText = "⚠️ Your attendance is below 75%. Please meet your faculty advisor.";

    for (const subject of subjects) {
      for (const studentRecord of subject.students) {
        const { student, totalPercentage } = studentRecord;

        if (totalPercentage < 75 && student) {
          await Student.findByIdAndUpdate(student._id, {
            $push: {
              notices: {
                text: noticeText,
                date: new Date().toISOString(),
                subject:subject.subjectName
              },
            },
          });
        }
      }
    }

    res.status(200).json({ message: "Notices sent to students with attendance below 75%" });
  } catch (err) {
    console.error("Error notifying students:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
  
  const getStudentNotices=async (req, res) => {
  try {
    const { studentId } = req.body;
    const id=studentId;

    if (!id) {
      return res.status(400).json({ message: "Student ID is required" });
    }

    const student = await Student.findById(id).select("notices");

    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    res.status(200).json({ notices: student.notices });
  } catch (err) {
    console.error("Error fetching notices:", err);
    res.status(500).json({ message: "Server error" });
  }
};


module.exports = { getStudentSubjects ,notifyLowAttendent,getStudentNotices};

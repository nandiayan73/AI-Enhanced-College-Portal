// const authenticate = require("../Middlewares/auth");
const HOD = require("../models/hod.model");
const Student = require("../models/student.model");
const Semester = require("../models/semester.model");

// ✅ Principal approves HOD
const approveHOD = async (req, res) => {
  try {
    const { hodId } = req.body;
    console.log(hodId);
    // const hod = await HOD.findById(hodId);
    const hod = await HOD.findOne({ _id: hodId });
    if (!hod) return res.status(404).json({ message: "HOD not found" });

    hod.isApproved = true;
    await hod.save();

    res.status(200).json({ message: "HOD approved successfully", hod });
  } catch (err) {
    console.error("HOD Approval Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// ✅ HOD approves Student & enrolls into Semester 1
const approveStudent = async (req, res) => {
  try {
    const { studentId } = req.body;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });

    // Check if already approved
    if (student.isApproved) {
      return res.status(400).json({ message: "Student already approved" });
    }

    // Mark as approved
    student.isApproved = true;
    await student.save();

    // Find or create Semester 1 for the same academic year
    // let semester = await Semester.findOne({
    //   name: "Semester 1",
    //   academicYear: student.academicYear,
    // });

    // if (!semester) {
    //   semester = new Semester({
    //     name: "Semester 1",
    //     academicYear: student.academicYear,
    //     students: [],
    //   });
    // }

    // // Enroll student
    // semester.students.push(student._id);
    // await semester.save();

    res.status(200).json({ message: "Student approved and enrolled in Semester 1", student });
  } catch (err) {
    console.error("Student Approval Error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getPendingStudentsForHOD = async (req, res) => {
  try {
    const hodId = req.userId; // Assuming userId is set by middleware (e.g. JWT middleware)

    // 1. Find HOD to get department
    const hod = await HOD.findById(hodId);
    if (!hod) return res.status(404).json({ message: "HOD not found" });

    // 2. Find students in the same department who are not approved
    const pendingStudents = await Student.find({
      department: hod.department,
      isApproved: false,
    }).populate("academicYear", "session year") // optional: populate academic year
      .populate("department", "name"); // optional: populate department name

    return res.status(200).json({
      count: pendingStudents.length,
      students: pendingStudents
    });
  } catch (err) {
    console.error("Error fetching pending students:", err);
    return res.status(500).json({ message: "Server error" });
  }
};


const getUnapprovedHODs = async (req, res) => {
  try {
    // This assumes req.userId is the Principal's ID (set by JWT middleware)
    const principalId = req.userId;

    // Fetch all HODs not yet approved
    const pendingHODs = await HOD.find({ isApproved: false });

    return res.status(200).json({
      count: pendingHODs.length,
      hods: pendingHODs,
    });
  } catch (err) {
    console.error("Error fetching unapproved HODs:", err);
    return res.status(500).json({ message: "Server error" });
  }
};

module.exports={approveHOD,approveStudent,getPendingStudentsForHOD,getUnapprovedHODs};
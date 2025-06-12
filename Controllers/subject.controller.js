const Subject = require("../models/subject.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const AcademicYear = require("../models/academicyear.model");
const Student = require("../models/student.model");
const genAI = new  GoogleGenerativeAI("AIzaSyBZdtCA6YrZjBSr2igkeMn3a9xn21CsntY");

const createSubject = async (req, res) => {
  try {
    const {
      subjectName,
      subjectCode,
      credits,
      department,
      academicYearId,
      session,
      faculty,
      facultyRole
    } = req.body;

    // const hod = req.rootUser;
    const hod=
    {
      department:"CSE"
    }

    console.log("Hod Department:\t"+hod.department);
    if(hod.department!=department)
      return res.status(400).json({message:"ONLY DEPARMENT HOD CAN MAKE DEPARTMENT SUBJECTS"});

    // 1. Validate required fields
    if (!subjectName || !subjectCode || !department || !academicYearId || !session) {
      return res.status(400).json({ message: "All required fields must be filled." });
    }

    // 2. Check if subject code already exists for the same session
    const existing = await Subject.findOne({ subjectCode, session });
    if (existing) {
      return res.status(409).json({ message: "Subject code already exists for this session." });
    }

    // 3. Get Academic Year
    const academicYearDoc = await AcademicYear.findById(academicYearId);
    if (!academicYearDoc) {
      return res.status(404).json({ message: "Academic Year not found." });
    }

    // 4. Get eligible students
    const eligibleStudents = await Student.find({
      department,
      academicYear: academicYearId,
      isApproved: true
    });

    const studentsWithAttendance = eligibleStudents.map(student => ({
      student: student._id,
      attendanceRecords: []
    }));

    // 5. Create subject
    const newSubject = new Subject({
      subjectName,
      subjectCode,
      credits,
      department,
      academicYear: academicYearId,
      session,
      faculty: faculty || [],
      facultyRole: facultyRole || (faculty?.length ? "Faculty" : "HOD"),
      students: studentsWithAttendance
    });

    await newSubject.save();

    return res.status(201).json({
      message: "Subject created and students enrolled successfully.",
      data: newSubject
    });

  } catch (err) {
    console.error("Subject Create Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
const markAttendance = async (req, res) => {
  try {
    const { subjectId, date, presentStudentNames } = req.body;

    if (!subjectId || !date || !Array.isArray(presentStudentNames)) {
      return res.status(400).json({ message: "All fields are required." });
    }

    const subject = await Subject.findById(subjectId).populate("students.student");

    if (!subject) {
      return res.status(404).json({ message: "Subject not found." });
    }

    const attendanceDate = new Date(date);

    // 🔍 Get department and academicYear from subject
    const { department, academicYear } = subject;

    // 🔁 Recheck for eligible students in that department & year
    const eligibleStudents = await Student.find({
      department,
      academicYear,
      isApproved: true
    });

    // ✅ Add missing eligible students into subject.students
    eligibleStudents.forEach((student) => {
      const alreadyEnrolled = subject.students.some((s) =>
        s.student._id.toString() === student._id.toString()
      );

      if (!alreadyEnrolled) {
        subject.students.push({
          student: student._id,
          attendanceRecords: [],
          totalPercentage: 0
        });
      }
    });

    // Mark attendance
    subject.students.forEach((entry) => {
      const studentName = entry.student.name;
      const isPresent = presentStudentNames.includes(studentName);

      const alreadyMarked = entry.attendanceRecords.find(
        (record) => new Date(record.date).toDateString() === attendanceDate.toDateString()
      );

      if (!alreadyMarked) {
        entry.attendanceRecords.push({
          date: attendanceDate,
          present: isPresent,
        });
      }
    });

    // ✅ Recalculate totalPercentage for each student
    subject.students.forEach((entry) => {
      const totalDays = entry.attendanceRecords.length;
      const presentDays = entry.attendanceRecords.filter(r => r.present).length;
      const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      entry.totalPercentage = Math.round(percentage * 100) / 100; // Round to 2 decimal places
    });

    await subject.save();
    return res.status(200).json({ message: "Attendance and percentages updated successfully." });

  } catch (error) {
    console.error("Attendance Error:", error);
    res.status(500).json({ message: "Server error while updating attendance." });
  }
};


const markPresent = async (req, res) => {
  const { subjectId, date, imageUrl } = req.body;

  if (!subjectId || !date || !imageUrl) {
    return res.status(400).json({ message: "Subject ID, date, and image URL are required." });
  }

  try {
    const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' });

    // 🔍 Fetch the image
    const imageResp = await fetch(imageUrl).then((res) => res.arrayBuffer());

    // 🧠 Ask Gemini to extract names from image
    const result = await model.generateContent([
      {
        inlineData: {
          data: Buffer.from(imageResp).toString("base64"),
          mimeType: "image/jpeg",
        },
      },
      `This image contains the handwritten or printed names of students who are present today. Extract only the **full names** in order (one per line, no commas or extra formatting). Do not generate names, extract exactly what you see.`,
    ]);

    const text = result.response.text();
    const extractedNames = text
      .split("\n")
      .map(name => name.trim())
      .filter(name => name.length > 0);

    console.log("Extracted Names:", extractedNames);

    // Load subject and students
    const subject = await Subject.findById(subjectId).populate("students.student");
    if (!subject) return res.status(404).json({ message: "Subject not found." });

    const attendanceDate = new Date(date);

    // 🔁 Update attendance
    subject.students.forEach((entry) => {
      const studentName = entry.student.name;
      const isPresent = extractedNames.includes(studentName);

      const alreadyMarked = entry.attendanceRecords.find(
        (record) => new Date(record.date).toDateString() === attendanceDate.toDateString()
      );

      if (!alreadyMarked) {
        entry.attendanceRecords.push({
          date: attendanceDate,
          present: isPresent,
        });
      }
    });

    // 🧮 Recalculate total percentage for each student
    subject.students.forEach((entry) => {
      const totalRecords = entry.attendanceRecords.length;
      const totalPresent = entry.attendanceRecords.filter(r => r.present).length;

      const percentage = totalRecords > 0
        ? (totalPresent / totalRecords) * 100
        : 0;

      entry.totalPercentage = Number(percentage.toFixed(2)); // rounded to 2 decimal places
    });

    await subject.save();

    res.status(200).json({
      message: "Attendance successfully marked based on image.",
      present: extractedNames,
    });

  } catch (err) {
    console.error("Error marking attendance via image:", err);
    res.status(500).json({ message: "Failed to process attendance." });
  }
};


module.exports={createSubject, markAttendance,markPresent};
const Subject = require("../models/subject.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const AcademicYear = require("../models/academicyear.model");
const Student = require("../models/student.model");
const genAI = new  GoogleGenerativeAI("AIzaSyCM48oPGZCBbe0fNiHLWhEC5AtGlMVowPc");
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

    const imageResp = await fetch(imageUrl).then((res) => res.arrayBuffer());

    const result = await model.generateContent([
      {
        inlineData: {
          data: Buffer.from(imageResp).toString("base64"),
          mimeType: "image/jpeg",
        },
      },
      `This image contains the handwritten or printed names of students who are present today. Extract only the full names in order (one per line, no commas or extra formatting). Do not generate names, extract exactly what you see.`,
    ]);

    const text = result.response.text();
    const presentStudentNames = text
      .split("\n")
      .map(name => name.trim())
      .filter(name => name.length > 0);

    console.log("✅ Extracted Present Names:", presentStudentNames);

    // ⏬ Call markAttendance by passing new req and res objects
    const newReq = {
      body: {
        subjectId,
        date,
        presentStudentNames
      }
    };

    // Wrap res to capture the output or just forward the final response
    await markAttendance(newReq, res);

  } catch (err) {
    console.error("Error in markPresent:", err);
    return res.status(500).json({ message: "Failed to mark attendance from image." });
  }
};
const createPost = async (req, res) => {
  try {
    const { subjectId, type, contentUrl, captionText } = req.body;

    const user = req.rootUser; // From auth middleware
    const role = user.role;    // Should be "HOD" or "Faculty"

    if (!subjectId || !type) {
      return res.status(400).json({ message: "Subject ID and post type are required." });
    }

    // Validate post content based on type
    if (type === "caption" && !captionText) {
      return res.status(400).json({ message: "Caption text is required for caption posts." });
    }

    if (type !== "caption" && !contentUrl) {
      return res.status(400).json({ message: "Content URL is required for this type of post." });
    }

    // Find subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(404).json({ message: "Subject not found." });
    }

    // Optional: Check if user is authorized to post on this subject
    const isHOD = role === "HOD";
    const isFaculty = role === "Faculty" && subject.faculty.includes(user._id.toString());

    if (!isHOD && !isFaculty) {
      return res.status(403).json({ message: "Only assigned faculty or HOD can post." });
    }

    // Create post object
    const newPost = {
      type,
      createdAt: new Date(),
      role,
      postedBy: user._id,
    };

    if (type === "caption") {
      newPost.captionText = captionText;
    } else {
      newPost.contentUrl = contentUrl;
    }

    // Push to subject
    subject.posts.unshift(newPost); // Add at beginning
    await subject.save();

    res.status(201).json({ message: "Post added successfully.", post: newPost });

  } catch (error) {
    console.error("Error in createPost:", error);
    res.status(500).json({ message: "Failed to create post." });
  }
};


const uploadSyllabus = async (req, res) => {
  const { subjectId, syllabusUrl } = req.body;

  if (!subjectId || !syllabusUrl) {
    return res.status(400).json({ message: "Subject ID and syllabus URL are required." });
  }

  try {
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found." });

    // 📷 Fetch image and convert to base64
    const imageResp = await fetch(syllabusUrl).then(res => res.arrayBuffer());

    // const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' });
    const model=genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' })


    const result = await model.generateContent([
      {
        inlineData: {
          data: Buffer.from(imageResp).toString("base64"),
          mimeType: "image/jpeg",
        },
      },
      "Extract all the text content from this syllabus image clearly, maintain module-wise structure if available."
    ]);

    const extractedText = result.response.text();

    // 💾 Save to subject
    subject.syllabus = {
      url: syllabusUrl,
      text: extractedText,
    };

    await subject.save();

    return res.status(200).json({
      message: "Syllabus uploaded and processed successfully.",
      syllabus: subject.syllabus,
    });

  } catch (err) {
    console.error("Syllabus Upload Error:", err);
    return res.status(500).json({ message: "Server error while uploading syllabus." });
  }
};

const addQuestionPaper = async (req, res) => {
  const { subjectId, questionPaperUrl } = req.body;

  if (!subjectId || !questionPaperUrl) {
    return res.status(400).json({ message: "Subject ID and question paper URL are required." });
  }

  try {
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found." });

    // 📷 Fetch image and convert to base64
    const imageResp = await fetch(questionPaperUrl).then(res => res.arrayBuffer());

    // const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' });
    const model=genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' })


    const result = await model.generateContent([
      {
        inlineData: {
          data: Buffer.from(imageResp).toString("base64"),
          mimeType: "image/jpeg",
        },
      },
      "Extract all questions from this question paper. Include question numbers, sections, and marks if mentioned."
    ]);

    const extractedText = result.response.text();

    // 💾 Add to question papers
    subject.questionPapers.push({
      url: questionPaperUrl,
      text: extractedText,
    });

    await subject.save();

    return res.status(200).json({
      message: "Question paper uploaded and processed successfully.",
      questionPapers: subject.questionPapers,
    });

  } catch (err) {
    console.error("Add Question Paper Error:", err);
    return res.status(500).json({ message: "Server error while adding question paper." });
  }
};



module.exports={createSubject, markAttendance,markPresent,createPost,uploadSyllabus,addQuestionPaper};
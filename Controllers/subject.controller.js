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
    console.log("✅ Extracted Present Names:", presentStudentNames);

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

    // 🔁 Get eligible students
    const eligibleStudents = await Student.find({
      department,
      academicYear,
      isApproved: true,
    });

    // ✅ Add missing students to subject
    eligibleStudents.forEach((student) => {
      const alreadyEnrolled = subject.students.some(
        (s) => s.student._id.toString() === student._id.toString()
      );

      if (!alreadyEnrolled) {
        subject.students.push({
          student: student._id,
          attendanceRecords: [],
          totalPercentage: 0,
        });
      }
    });

    // ⚙️ Normalize helper
    const normalizeName = (name) =>
      name?.replace(/\s+/g, " ").trim().toLowerCase();

    const normalizedPresentNames = presentStudentNames.map(normalizeName);

    // ✅ Mark attendance
    subject.students.forEach((entry) => {
      const studentName = normalizeName(entry.student.name || "");
      const isPresent = normalizedPresentNames.includes(studentName);

      const existingRecord = entry.attendanceRecords.find(
        (record) =>
          new Date(record.date).toDateString() === attendanceDate.toDateString()
      );

      if (existingRecord) {
        existingRecord.present = isPresent; // 🛠 Update if already marked
      } else {
        entry.attendanceRecords.push({
          date: attendanceDate,
          present: isPresent,
        });
      }

      console.log(`📌 ${entry.student.name}: ${isPresent ? "Present" : "Absent"}`);
    });

    // ✅ Recalculate attendance percentages
    subject.students.forEach((entry) => {
      const totalDays = entry.attendanceRecords.length;
      const presentDays = entry.attendanceRecords.filter((r) => r.present).length;
      const percentage = totalDays > 0 ? (presentDays / totalDays) * 100 : 0;
      entry.totalPercentage = Math.round(percentage * 100) / 100;
    });

    await subject.save();
    return res
      .status(200)
      .json({ message: "Attendance and percentages updated successfully." });
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
    const model=genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });

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
    console.log(user);
    const role = user.__t;    // Should be "HOD" or "Faculty"

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
    // const isHOD = role === "HOD";
    // const isFaculty = role === "Faculty" && subject.faculty.includes(user._id.toString());

    // if (!isHOD && !isFaculty) {
    //   return res.status(403).json({ message: "Only assigned faculty or HOD can post." });
    // }

    // Create post object
    const newPost = {
      type,
      createdAt: new Date(),
      role,
      postedBy: user._id,
    };

    if (type === "caption") {
      newPost.contentUrl = contentUrl;
      newPost.captionText = captionText;
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

const getAllSubjects =async (req, res) => {
  try {
    const facultyId = req.params.id;

    const subjects = await Subject.find({
      faculty: facultyId,
      facultyRole: "Faculty"
    }).select("subjectName subjectCode credits");

    res.json(subjects);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
};

const getSubjectsBySessionYear = async (req, res) => {
  const { session, year } = req.query;

  try {
    // Find all semesters that belong to this academic year (e.g., year 2)
    const semesters = await Semester.find({ year: parseInt(year) });

    const semesterIds = semesters.map(s => s._id);

    // Fetch all subjects that match session and one of those semesters
    const subjects = await Subject.find({
      session,
      semester: { $in: semesterIds },
    });

    res.status(200).json(subjects);
  } catch (err) {
    console.error("Error fetching subjects:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};
const getSubjectsById= async (req, res) => {
  try {
    const academicYearId = req.params.id;
    const subjects = await Subject.find({ academicYear: academicYearId });
    res.status(200).json(subjects);
  } catch (err) {
    console.error("Error fetching subjects by academicYear ID:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const getPostById =async (req, res) => {
  try {
    const subjectId = req.params.id;

    const subject = await Subject.findById(subjectId)
      .populate("posts.postedBy", "name email role") // populate user info
      .lean();

    if (!subject) {
      return res.status(404).json({ message: "Subject not found" });
    }

    // Reverse posts to show newest first (optional if already unshifted during creation)
    const posts = subject.posts || [];
    res.status(200).json({ posts: posts.reverse() });
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ message: "Server error" });
  }
};

  const studentInfo=  async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id)
      .populate("students.student", "name roll")
      .populate("posts.postedBy", "name role")
      .lean();

    if (!subject) return res.status(404).json({ message: "Subject not found" });

    // Format the posts list
    const posts = (subject.posts || []).map((p) => ({
      _id: p._id,
      captionText: p.captionText,
      contentUrl: p.contentUrl,
      type: p.type,
      createdAt: p.createdAt,
      role: p.postedBy?.role || "Faculty",
    }));

    res.json({
      subjectId: subject._id,
      subjectName: subject.name,
      students: subject.students || [],
      posts: posts.reverse(), // show latest first
    });
  } catch (err) {
    console.error("Error fetching subject:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

const enrollAllStudents= async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found." });

    // Find eligible students matching department and academic year
    const eligibleStudents = await Student.find({
      academicYear: subject.academicYear,
      department: subject.department,
    });

    // Filter out already enrolled students
    const alreadyEnrolledIds = subject.students.map(s => s.student.toString());

    const newStudents = eligibleStudents.filter(
      (stu) => !alreadyEnrolledIds.includes(stu._id.toString())
    );

    // Add new students to subject
    newStudents.forEach((student) => {
      subject.students.push({
        student: student._id,
        attendanceRecords: [],
        totalPercentage: 0,
      });
    });

    await subject.save();

    return res.status(200).json({
      message: `${newStudents.length} students enrolled.`,
      enrolledCount: newStudents.length,
    }); 
  } catch (err) {
    console.error("Enrollment Error:", err);
    res.status(500).json({ message: "Failed to enroll students." });
  }
};


module.exports={enrollAllStudents,studentInfo,getPostById,getSubjectsById,createSubject, markAttendance,markPresent,createPost,uploadSyllabus,addQuestionPaper,getAllSubjects,getSubjectsBySessionYear};
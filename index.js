const express=require("express");
const app=express();
const mongoose=require("mongoose");
const cors=require("cors");
const cookieParser = require('cookie-parser')
const bodyParser = require("body-parser");
const jwt=require("jsonwebtoken");
const db=require("./db");
require('dotenv').config();
const port = process.env.PORT;

// importing the files:
const {registerUser, loginUser, isLogged, logout, deleteUserById} =require("./Controllers/authControllers");
const { createAcademicYear, getAcademicYearsBySession } = require("./Controllers/academicyear.controller");
const { createDepartment } = require("./Controllers/deparment.controllers");
const { approveHOD, approveStudent, getPendingStudentsForHOD, getUnapprovedHODs } = require("./Controllers/approvalControllers");
const { createSubject, markAttendance, createPost, uploadSyllabus, addQuestionPaper, getAllSubjects, getSubjectsBySessionYear, getSubjectsById, getPostById, studentInfo, markPresent, enrollAllStudents } = require("./Controllers/subject.controller");
const { predictQuestions, getSubjectResources, deleteQsPaper } = require("./Controllers/paper.controller");
const Authenticate = require("./Middlewares/auth");
const { facultyUpdatePhoto, principalUpdatePhoto, HODUpdatePhoto, StudentUpdatePhoto, getUsersByType, getCurrentSession, updateSession } = require("./Controllers/update.controllers");
const { publishNotice, getAllNotices, getNotices } = require("./Controllers/notice.controllers");
const { getStudentSubjects, notifyLowAttendent, getStudentNotices } = require("./Controllers/student.controller");
const { charBot, updateBotHistory } = require("./Controllers/bot.controller");
const College = require("./models/college.model");

// Setting the database:
db();
// Make singleton class object:
(async () => {
  try {
    const singletonCollege = await College.getSingleton();
    console.log("✅ College Singleton Loaded:", singletonCollege);
  } catch (error) {
    console.error("❌ Failed to load College singleton:", error);
  }
})();


// for parsing the cookies and data:
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({extended: true}));

// for request from frontend
app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));


// API REQUESTS:

// Make the session for the academic year:
app.get("/college/session", getCurrentSession);
app.post("/college/updatesession", updateSession);
// register user:
app.post("/user/register",registerUser);

//login user:
app.post("/user/login",loginUser);
app.get("/user/auth",Authenticate,isLogged);
app.get("/user/logout",logout);

// Approvals:
app.post("/user/approveHOD",approveHOD);
app.get("/user/allunapprovedHODs",getUnapprovedHODs);
// create departments
app.post("/user/createacademicyear",Authenticate,createAcademicYear);
app.post("/user/createdepartments",createDepartment);

// Approve Student:
app.post("/user/approvestudent",approveStudent);
app.post("/user/getpendingstudents",getPendingStudentsForHOD);

// created subject by HODs:
app.post("/subjects/createsubjects",Authenticate,createSubject);
app.post("/subjects/markattendance",markAttendance);
app.post("/subjects/markpresent",markPresent);
app.post("/subjects/post",Authenticate,createPost);
app.post("/subjects/:id/posts",getPostById);
app.post("/subjects/:subjectId/enroll",enrollAllStudents);

// add syllabus and questions papers:
app.post("/paper/addsyllabus",uploadSyllabus);
app.post("/paper/addquestionpapers",addQuestionPaper);

// paper analysis and prediction:
app.post("/paper/prediction",predictQuestions);

// get all subjects of faculty:
app.get("/subjects/by-faculty/:id",getAllSubjects);

// update user credentials:
app.post("/faculty/updatephoto",facultyUpdatePhoto);
app.post("/principal/update-photo",principalUpdatePhoto);
app.post("/hod/update-photo",HODUpdatePhoto);
app.post("/student/update-photo",StudentUpdatePhoto);

// Notice:
app.post("/principal/uploadnotice",publishNotice);
app.get("/principal/getallnotices",getAllNotices);
app.get("/notice/getnotices",getNotices);

app.get("/subject/getbysessionyear",getSubjectsBySessionYear);
app.get("/allacademyyear",getAcademicYearsBySession);
app.get("/subjects/by-academicyear/:id",getSubjectsById);
app.post("/subjects/createpost",createPost);
app.get("/subjects/:subjectId/resources", getSubjectResources);

app.delete("/paper/deletequestionpaper",deleteQsPaper);
app.post("/principal/notify-low-attendance",notifyLowAttendent);
app.post("/student/getnotices",getStudentNotices);


app.get("/subjects/:id",studentInfo);
// Student details:
app.post("/student/allsubjects",getStudentSubjects);

// Chatbot:
app.post("/api/chatbot/chat",charBot);
app.post("/api/chatbot/update-history",updateBotHistory);

// manage users
app.get("/user/:type",getUsersByType);
app.delete("/user/delete/:id",deleteUserById);

app.listen(3000,(req,res)=>{
    console.log("Server is set at port number\t"+port);
})
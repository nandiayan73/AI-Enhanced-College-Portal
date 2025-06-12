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
const {registerUser} =require("./Controllers/authControllers");
const { createAcademicYear } = require("./Controllers/academicyear.controller");
const { createDepartment } = require("./Controllers/deparment.controllers");
const { approveHOD, approveStudent } = require("./Controllers/approvalControllers");
const { createSubject, markAttendance, createPost, uploadSyllabus, addQuestionPaper } = require("./Controllers/subject.controller");
const { predictQuestions } = require("./Controllers/paper.controller");

// Setting the database:
db();


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
// register user
app.post("/user/register",registerUser);

// Approvals:
app.post("/user/approveHOD",approveHOD);
// create departments
app.post("/user/createacademicyear",createAcademicYear);
app.post("/user/createdepartments",createDepartment);

// Approve Student:
app.post("/user/approvestudent",approveStudent);

// created subject by HODs:
app.post("/subjects/createsubjects",createSubject);
app.post("/subjects/markattendance",markAttendance);
app.post("/subjects/post",createPost);

// add syllabus and questions papers:
app.post("/paper/addsyllabus",uploadSyllabus);
app.post("/paper/addquestionpapers",addQuestionPaper);

// paper analysis and prediction:
app.post("/paper/prediction",predictQuestions);

app.listen(3000,(req,res)=>{
    console.log("Server is set at port number\t"+port);
})
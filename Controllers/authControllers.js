const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const BaseUser = require("../models/BaseUser.model");
require("dotenv").config();
const Principal=require("../models/principal.model");
const Student=require("../models/student.model");
const Faculty=require("../models/faculty.model");
const HOD=require("../models/hod.model");

const jwtSecret = process.env.JWT_SECRET || "secret_key";

const AcademicYear = require("../models/academicYear.model"); // Make sure it's imported at the top

const registerUser = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      role,
      department,
      session,
      year, // Year of study (1–4)
      designation,
      HODStream
    } = req.body;

    // 1. Validate base fields
    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: "Please fill all required fields." });
    }

    // 2. Check if user exists
    const existingUser = await BaseUser.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already registered." });
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    let newUser;

    // 4. Role-specific logic
    switch (role) {
      case "Student":
        if (!department || !session || !year) {
          return res.status(400).json({ message: "Missing fields for student registration." });
        }

        // 🔍 Find AcademicYear by session and year
        const academicYear = await AcademicYear.findOne({ session, year });
        if (!academicYear) {
          return res.status(404).json({
            message: `Academic year not found for session "${session}" and year "${year}".`
          });
        }

        newUser = new Student({
          name,
          email,
          password: hashedPassword,
          department, // Assuming HODStream is the correct department ID
          academicYear: academicYear._id,
          isApproved: false,
        });
        break;

      case "HOD":
        if (!department) {
          return res.status(400).json({ message: "Department required for HOD." });
        }
        newUser = new HOD({
          name,
          email,
          password: hashedPassword,
          department,
          isApproved: false,
        });
        break;

      case "Principal":
        newUser = new Principal({
          name,
          email,
          password: hashedPassword,
        });
        break;

      case "Faculty":
        if (!department) {
          return res.status(400).json({ message: "Department required for Faculty." });
        }
        newUser = new Faculty({
          name,
          email,
          password: hashedPassword,
          department,
          designation: designation || "Assistant Professor",
        });
        break;

      default:
        return res.status(400).json({ message: "Invalid role specified." });
    }

    // 5. Save user
    await newUser.save();

    // 6. Return response
    return res.status(201).json({
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        isApproved: newUser.isApproved ?? true,
      },
    });

  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ message: "Server error. Try again later." });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Validate input
    if (!email || !password) {
      return res.status(400).json({ message: "Please provide email and password." });
    }

    // 2. Find the user (regardless of role)
    const user = await BaseUser.findOne({ email });

    if (!user) {
      return res.status(400).json({ message: "User not found." });
    }

    // 3. Check approval status
    if (user.role === "Student" || user.role === "HOD") {
      if (!user.isApproved) {
        return res.status(403).json({ message: `Your ${user.role} account is not yet approved.` });
      }
    }

    // 4. Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials." });
    }

    // 5. Generate JWT token
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      jwtSecret,
      { expiresIn: "7d" }
    );

    // 6. Set cookie
    res.cookie("HareKrishna", token, {
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 7. Return response
    res.status(200).json({
      message: `${user.role} login successful.`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
      token
    });

  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server error. Try again later." });
  }
};

//Should be used with Autenticate function
const isLogged=async(req,res)=>{
    try
    {
        if(req.rootUser)
        {
            res.status(201);
            res.send(req.rootUser);
        }
        else
        {
            res.status(400);
            throw new Error("Unauthorized!");
        }
    }
    catch(err)
    {
        throw new Error("Network Error!");
    }
}
const logout = (req, res) => {
    try {
      res.clearCookie(cookieSecret);
      
      res.status(200).json({
        success: true,
        message: "Logged out successfully"
      });
    } catch (err) {
      console.error("Logout error:", err);
      res.status(500).json({
        success: false,
        message: "Failed to logout"
      });
    }
  };
module.exports={registerUser,loginUser,isLogged,logout};
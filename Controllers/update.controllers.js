const Faculty=require("../models/faculty.model");
const Principal = require("../models/principal.model");
const HOD = require("../models/hod.model");
const Student=require("../models/student.model");
const BaseUser = require("../models/BaseUser.model");
const College = require("../models/college.model");


const facultyUpdatePhoto= async (req, res) => {
  const { photo ,id} = req.body;

  if (!photo) {
    return res.status(400).json({ message: "Photo URL is required" });
  }

  try {
    const updated = await Faculty.findByIdAndUpdate(
      id,
      { photo },
      { new: true }
    ).select("-password");

    res.status(200).json(updated);
  } catch (err) {
    console.error("Error updating photo:", err);
    res.status(500).json({ message: "Server error" });
  }
};

const principalUpdatePhoto = async (req, res) => {
  try {
    const {id}=req.body;
    const principal = await Principal.findById(id);
    if (!principal) return res.status(404).json({ message: "Principal not found" });
    console.log("Photo Updated successfully!");
    principal.photo = req.body.photo;
    await principal.save();
    res.json({ message: "Photo updated successfully", photo: principal.photo });
  } catch (error) {
    console.error("Error updating photo:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const HODUpdatePhoto = async (req, res) => {
  try {
    const {id}=req.body;
    const principal = await HOD.findById(id);
    if (!principal) return res.status(404).json({ message: "HOD not found" });
    console.log("Photo Updated successfully!");
    principal.photo = req.body.photo;
    await principal.save();
    res.json({ message: "Photo updated successfully", photo: principal.photo });
  } catch (error) {
    console.error("Error updating photo:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const StudentUpdatePhoto = async (req, res) => {
  try {
    const {id}=req.body;
    const principal = await Student.findById(id);
    if (!principal) return res.status(404).json({ message: "Student not found" });
    console.log("Photo Updated successfully!");
    principal.photo = req.body.photo;
    await principal.save();
    res.json({ message: "Photo updated successfully", photo: principal.photo });
  } catch (error) {
    console.error("Error updating photo:", error);
    res.status(500).json({ message: "Server error" });
  }
};
const getUsersByType = async (req, res) => {
  const { type } = req.params;

  // Only allow certain types to prevent misuse
  const allowedTypes = ["Faculty", "Student", "HOD"];
  if (!allowedTypes.includes(type)) {
    return res.status(400).json({ error: "Invalid user type" });
  }

  try {
    let query = BaseUser.find({ __t: type });

    // If the type is Student, populate academicYear
    if (type === "Student") {
      query = query.populate("academicYear");
    }

    const users = await query.exec();
    res.json(users);
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({ error: "Server error" });
  }
};

const getCurrentSession = async (req, res) => {
  try {
    const college = await College.getSingleton();
    res.json({ session: college.session });
  } catch (error) {
    console.error("Error fetching session:", error);
    res.status(500).json({ error: "Failed to get session" });
  }
};
const updateSession = async (req, res) => {
  try {
    const { session } = req.body;

    // Check if session is in correct format
    const sessionRegex = /^\d{4}-\d{2}$/;
    if (!sessionRegex.test(session)) {
      return res.status(400).json({ message: "Invalid session format. Use YYYY-YY." });
    }

    const college = await College.getSingleton();
    college.session = session;
    await college.save();

    res.json({ message: "Session updated successfully", session: college.session });
  } catch (error) {
    console.error("Failed to update session:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
module.exports={StudentUpdatePhoto,facultyUpdatePhoto,principalUpdatePhoto,HODUpdatePhoto,getUsersByType,getCurrentSession,updateSession};
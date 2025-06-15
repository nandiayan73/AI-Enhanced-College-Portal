const Faculty=require("../models/faculty.model");
const Principal = require("../models/principal.model");
const HOD = require("../models/hod.model");


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

module.exports={facultyUpdatePhoto,principalUpdatePhoto,HODUpdatePhoto};
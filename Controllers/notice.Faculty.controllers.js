// controllers/noticeController.js

const Notice = require("../models/Notice");

const postHodNotice = async (req, res) => {
  try {
    const { caption, academicYear, department } = req.body;
    const photo = req.file?.path || null;

    if (!caption || !academicYear || !department) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newNotice = new Notice({
      caption,
      photo,
      academicYear,
      department,
      publishedBy: req.user._id, // assuming req.user is HOD and is set by auth middleware
      publisherModel: "HOD",
    });

    await newNotice.save();
    res.status(201).json({ message: "Notice posted successfully", notice: newNotice });
  } catch (error) {
    console.error("Error posting HOD notice:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = { postHodNotice };

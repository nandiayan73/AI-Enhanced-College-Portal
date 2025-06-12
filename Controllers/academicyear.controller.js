const AcademicYear = require("../models/academicyear.model");
const Principal = require("../models/principal.model");

const createAcademicYear = async (req, res) => {
  try {
    let { year, session } = req.body;
    const principalId = req.rootUser._id; // From auth middleware

    // --- Input Validation ---
    if (!year || !session) {
      return res.status(400).json({ message: "Year and session are required." });
    }
    year = parseInt(year, 10); 
    
    if (![1, 2, 3, 4,5,6,7,8].includes(year)) {
      return res.status(400).json({ message: "Year must be 1, 2, 3 or 4." });
    }

    const sessionRegex = /^[0-9]{4}-[0-9]{2}$/;
    if (!session.match(sessionRegex)) {
      return res.status(400).json({ message: "Session format must be YYYY-YY (e.g., 2021-22)." });
    }

    // --- Combined Uniqueness Check ---
    // Check if an AcademicYear with the SAME year AND SAME session already exists
    const alreadyExists = await AcademicYear.findOne({ year, session });
    if (alreadyExists) {
      return res.status(409).json({ message: `Academic Year ${year} for session ${session} already exists.` });
    }

    // --- Create and Save ---
    const newYear = new AcademicYear({
      year,
      session,
      createdBy: principalId
    });

    await newYear.save();
    res.status(201).json({ message: `Academic Year ${year} for session ${session} created successfully.`, data: newYear });

  } catch (err) {
    console.error("AcademicYear Creation Error:", err);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ message: err.message });
    }
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = { createAcademicYear };
const Department = require("../models/department.model");
const AcademicYear = require("../models/academicyear.model");

const createDepartment = async (req, res) => {
  try {
    const { name, academicYearId, session } = req.body;
    const hodId = req.rootUser._id;

    // Validate
    if (!name || !academicYearId) {
      return res.status(400).json({ message: "All fields are required." });
    }

    // Check if Academic Year exists
    const yearExists = await AcademicYear.findById(academicYearId);
    if (!yearExists) {
      return res.status(404).json({ message: "Academic Year not found." });
    }

    // Prevent duplicate department creation for same year
    const existingDept = await Department.findOne({ name, academicYear: academicYearId });
    if (existingDept) {
      return res.status(409).json({ message: `Department ${name} already exists for that year.` });
    }

    const department = new Department({
      name,
      academicYear: academicYearId,
      createdBy: hodId,
      session
    });

    await department.save();
    res.status(201).json({ message: `${name} Department created successfully.`, data: department });

  } catch (err) {
    console.error("Create Department Error:", err);
    res.status(500).json({ message: "Server error." });
  }
};

module.exports={createDepartment};
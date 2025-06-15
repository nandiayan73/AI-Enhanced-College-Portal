const Subject = require("../models/subject.model");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const AcademicYear = require("../models/academicyear.model");
const Student = require("../models/student.model");
const genAI = new  GoogleGenerativeAI("AIzaSyBZdtCA6YrZjBSr2igkeMn3a9xn21CsntY");

const predictQuestions = async (req, res) => {
  const { subjectId } = req.body;

  if (!subjectId) {
    return res.status(400).json({ message: "Subject ID is required." });
  }

  try {
    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found." });

    const { syllabus, questionPapers } = subject;

    if (!syllabus?.text || !Array.isArray(questionPapers) || questionPapers.length === 0) {
      return res.status(400).json({ message: "Syllabus text and question papers are required." });
    }

    const allQuestions = questionPapers.map((paper, index) => 
      `--- Paper ${index + 1} ---\n${paper.text}`).join("\n\n");

    // const model = genAI.getGenerativeModel({ model: 'models/gemini-1.5-pro' });
    const model=genAI.getGenerativeModel({ model: 'models/gemini-1.5-flash' });


    const result = await model.generateContent([
      `These are the extracted question papers:\n\n${allQuestions}`,

      `This is the syllabus content:\n\n${syllabus.text}\n\nBased on these previous question papers and the syllabus, do the following:

1. List the **most important topics from each module**, based on frequency and weight.
2. Identify **most repeated questions** with topics.
3. Give a **short list of predicted questions** for the next exam (label as predictions).
4. Structure the answer like a professor advising a student. Avoid greetings or unnecessary language.`
    ]);
    console.log(result.response.text());
    res.status(200).json({
      prediction: result.response.text(),
    });

  } catch (err) {
    console.error("Prediction Error:", err);
    res.status(500).json({ message: "Failed to generate predictions." });
  }
};

const getSubjectResources = async (req, res) => {
  try {
    const { subjectId } = req.params;

    const subject = await Subject.findById(subjectId).select("syllabus questionPapers");

    if (!subject) {
      return res.status(404).json({ message: "Subject not found." });
    }

    res.status(200).json({
      message: "Subject resources fetched successfully.",
      syllabus: subject.syllabus,
      questionPapers: subject.questionPapers
    });
  } catch (err) {
    console.error("Error fetching subject resources:", err);
    res.status(500).json({ message: "Server error while fetching subject resources." });
  }
};
// DELETE /paper/deletequestionpaper
const deleteQsPaper = async (req, res) => {
  try {
    const { subjectId, url } = req.query;

    const subject = await Subject.findById(subjectId);
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    subject.questionPapers = subject.questionPapers.filter(p => p.url !== url);
    await subject.save();

    res.json({ message: "Question paper deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



module.exports={predictQuestions,getSubjectResources,deleteQsPaper};
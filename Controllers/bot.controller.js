const { GoogleGenerativeAI } = require("@google/generative-ai");
const Bot = require("../models/bot.model"); // This is your Bot model with history

const genAI = new GoogleGenerativeAI("AIzaSyBZdtCA6YrZjBSr2igkeMn3a9xn21CsntY");
const model = genAI.getGenerativeModel({ model: "models/gemini-1.5-flash" });

const charBot = async (req, res) => {
  const { message,role } = req.body;
  console.log(role);

  if (!message) return res.status(400).json({ error: "Message is required" });

  try {
    // Check if bot exists
    let bot = await Bot.findOne();

    // If not found or history is null/empty, create/update bot info
    if (!bot) {
      bot = new Bot({
        history:
          "Svist is an engineering college at Baruipur, South 24 Parganas, West Bengal. It offers undergraduate engineering programs like B.Tech in CSE, ECE, EE, ME, and CE. Affiliated to MAKAUT and approved by AICTE, the college has a green campus, placement cell, library, labs, and academic clubs. Known for student-friendly environment and academic focus.",
      });
      await bot.save();
    } else if (!bot.history) {
      bot.history =
        "Svist is an engineering college at Baruipur, South 24 Parganas, West Bengal. It offers undergraduate engineering programs like B.Tech in CSE, ECE, EE, ME, and CE. Affiliated to MAKAUT and approved by AICTE, the college has a green campus, placement cell, library, labs, and academic clubs. Known for student-friendly environment and academic focus.";
      await bot.save();
    }
    let userRole=role;
    if(role==null)
        userRole='User';

    // Build the prompt
    const prompt = `
You are the Professional SVIST ChatBot of SVIST college. Use the following official information of the college to answer student queries. Be helpful, kind, and professional.

College Info:
${bot.history}

User's Role:
${userRole}
If the role is principal or HOD or Faculty, you can give all the informations about everything of the college. Be more polite and gentel.

Student Question:
"${message}"

Respond as Principal of SVIST, avoid unnecessary greetings, be direct and helpful.
Only answer questions related to the SVIST college, and in case you dont have it, you can google it.
`;

    const result = await model.generateContent(prompt);
    const response = await result.response.text();

    res.status(200).json({ reply: response });
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Failed to generate response." });
  }
};

    
const updateBotHistory=async (req, res) => {
  const { message } = req.body;

  if (!message || message.trim() === "") {
    return res.status(400).json({ error: "Message is required to update history." });
  }

  try {
    let bot = await Bot.findOne();

    if (!bot) {
      bot = new Bot({ history: message });
    } else {
      bot.history = `${bot.history}\n\n${message}`; // Append new info
    }

    await bot.save();

    res.status(200).json({ message: "History updated successfully." });
  } catch (err) {
    console.error("Error updating history:", err);
    res.status(500).json({ error: "Failed to update history." });
  }
};

module.exports={charBot,updateBotHistory};
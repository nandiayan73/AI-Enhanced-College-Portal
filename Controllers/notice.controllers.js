const Notice = require("../models/notice.model");
const Principal = require("../models/principal.model");

const publishNotice = async (req, res) => {
  try {
    const { caption, photo ,id} = req.body;
    const principalId = id; // Assumes authentication middleware sets req.user

    if (!caption) return res.status(400).json({ message: "Caption is required" });

    const newNotice = new Notice({
      photo,
      caption,
      publishedBy: principalId,
    });

    await newNotice.save();

    res.status(201).json({ message: "Notice published", notice: newNotice });
  } catch (err) {
    console.error("Error publishing notice:", err);
    res.status(500).json({ message: "Failed to publish notice" });
  }
};

const getAllNotices = async (req, res) => {
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ message: "Principal ID is required" });
  }

  try {
    const notices = await Notice.find({ publishedBy: id })
      .populate("publishedBy", "name photo")
      .sort({ createdAt: -1 });

    res.json(notices);
  } catch (err) {
    console.error("Error fetching notices:", err);
    res.status(500).json({ message: "Failed to load notices" });
  }
};

const getNotices= async (req, res) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 });
    res.json(notices);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notices" });
  }
};

module.exports = { publishNotice, getAllNotices, getNotices };

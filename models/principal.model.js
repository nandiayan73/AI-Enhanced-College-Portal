// models/principal.model.js
const mongoose = require("mongoose");
const User = require("./BaseUser.model");

const principalSchema = new mongoose.Schema({});

module.exports = User.discriminator("Principal", principalSchema);

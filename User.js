// backend/Models/User.js
const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, // hashed password
  role: {
    type: String,
    enum: ["plantation", "factory", "delivery", "finance", "support", "consultation", "inventory", "user"],
    required: true,
  },
});

module.exports = mongoose.model("User", userSchema);

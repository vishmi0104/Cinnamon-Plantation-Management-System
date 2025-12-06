// backend/seedUsers.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./Models/User");

const users = [
  { username: "plantation", role: "plantation" },
  { username: "factory", role: "factory" },
  { username: "inventory", role: "inventory" },
  { username: "finance", role: "finance" },
  { username: "support", role: "support" },
  { username: "consultation", role: "consultation" },
];

async function seedUsers() {
  try {
    const hash = await bcrypt.hash("1234", 10);

    for (const u of users) {
      await User.findOneAndUpdate(
        { username: u.username },
        { username: u.username, password: hash, role: u.role },
        { upsert: true, new: true }
      );
    }

    console.log("✅ Default users seeded (password = 1234)");
  } catch (err) {
    console.error("❌ Error seeding users:", err.message);
  }
}

module.exports = seedUsers;

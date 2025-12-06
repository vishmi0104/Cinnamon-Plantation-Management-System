// backend/Controllers/authController.js
const User = require("../Models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { username, password } = req.body;
  try {
    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      console.log("❌ User not found:", username);
      return res.status(400).json({ msg: "User not found" });
    }

    // Debug logs
    console.log("👉 Incoming username:", username);
    console.log("👉 Incoming password (plain):", password);
    console.log("👉 Stored hash in DB:", user.password);

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("👉 Password match result:", isMatch);

    if (!isMatch) {
      return res.status(400).json({ msg: "Invalid credentials" });
    }

    // JWT Secret
    const secret = process.env.JWT_SECRET || "defaultSecretKey";

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      secret,
      { expiresIn: "1h" }
    );

    console.log(`✅ Login success for user: ${username}, role: ${user.role}`);

    res.json({ token, role: user.role });
  } catch (err) {
    console.error("🔥 Server error during login:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

exports.register = async (req, res) => {
  const { username, password, role } = req.body;
  try {
    // Check if user already exists
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ msg: "User already exists" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username,
      password: hashedPassword,
      role,
    });

    await newUser.save();

    console.log(`✅ User registered: ${username}, role: ${role}`);

    res.status(201).json({ msg: "User registered successfully" });
  } catch (err) {
    console.error("🔥 Server error during registration:", err.message);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

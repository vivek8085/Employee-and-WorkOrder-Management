import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Employee from "../models/Employee.js";
import Department from "../models/Department.js";

const router = express.Router();

// Register new user (Admin creates accounts)
router.post("/register", async (req, res) => {
  try {
    let { name, email, password, role, department } = req.body;

    // Normalize department: convert empty string to undefined so Mongoose won't try to cast it
    if (department === "" || department === null) {
      department = undefined;
    }

    // require department for manager/employee roles
    if ((role === "manager" || role === "employee") && !department) {
      return res.status(400).json({ error: "Department is required for manager/employee roles" });
    }

    // if department provided, validate it exists
    if (department) {
      const dept = await Department.findById(department);
      if (!dept) return res.status(400).json({ error: "Invalid department id" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Build create object — only set department when present
    const createObj = { name, email, password: hashed, role };
    if (department) createObj.department = department;

    const user = await Employee.create(createObj);
    // hide password in response
    const userResp = user.toObject();
    delete userResp.password;
    res.status(201).json({ message: "User registered", user: userResp });
  } catch (err) {
    console.error("Register error:", err);
    // Return useful message for frontend debugging
    res.status(400).json({ error: err.message || "Registration failed" });
  }
});

// Login route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  const user = await Employee.findOne({ email }).populate("department");
  if (!user) return res.status(401).json({ error: "Invalid email or password" });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: "Invalid email or password" });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
    },
  });
});

export default router;

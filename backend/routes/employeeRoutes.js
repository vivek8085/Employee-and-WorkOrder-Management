import express from "express";
import Employee from "../models/Employee.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", verifyToken, async (req, res) => {
  const employees = await Employee.find().populate("department");
  res.json(employees);
});

// DELETE /api/employees/:id — admin only
router.delete('/:id', verifyToken, authorizeRoles('admin'), async (req, res) => {
  try {
    const emp = await Employee.findByIdAndDelete(req.params.id);
    if (!emp) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted' });
  } catch (err) {
    console.error('Failed to delete employee:', err);
    // Surface the real error message to help debugging (safe for development)
    res.status(500).json({ message: err.message || 'Server error', stack: err.stack });
  }
});

export default router;

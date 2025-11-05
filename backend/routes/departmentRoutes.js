import express from "express";
import Department from "../models/Department.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const dept = await Department.create(req.body);
  res.json(dept);
});

router.get("/", verifyToken, async (req, res) => {
  const depts = await Department.find();
  res.json(depts);
});

export default router;

import express from "express";
import WorkOrder from "../models/WorkOrder.js";
import Employee from "../models/Employee.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";
import { io } from "../server.js";

const router = express.Router();

router.post("/admin", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const { assignedManager, department } = req.body;

  // If assignedManager provided, ensure manager belongs to the department
  if (assignedManager) {
    const mgr = await Employee.findById(assignedManager);
    if (!mgr) return res.status(400).json({ message: "Assigned manager not found" });
    if (!mgr.department || mgr.department.toString() !== department) {
      return res.status(400).json({ message: "Assigned manager must belong to the selected department" });
    }
  }

  const order = await WorkOrder.create({ ...req.body, createdBy: req.user.id });
  io.emit("workorder_created", order);
  res.status(201).json(order);
});

router.put("/:id/assign-employee", verifyToken, authorizeRoles("manager"), async (req, res) => {
  const order = await WorkOrder.findById(req.params.id).populate("department");
  if (!order) return res.status(404).json({ message: "WorkOrder not found" });
  const emp = await Employee.findById(req.body.assignedEmployee);
  if (!emp) return res.status(400).json({ message: "Employee not found" });
  if (!emp.department || emp.department.toString() !== order.department._id.toString()) {
    return res.status(400).json({ message: "Employee must belong to the work order's department" });
  }
  const updated = await WorkOrder.findByIdAndUpdate(
    req.params.id,
    { assignedEmployee: req.body.assignedEmployee },
    { new: true }
  ).populate("assignedManager assignedEmployee assignedEmployees department");
  io.emit("workorder_updated", updated);
  res.json(updated);
});

// Assign multiple employees at once (manager)
router.put("/:id/assign-employees", verifyToken, authorizeRoles("manager"), async (req, res) => {
  const { assignedEmployees } = req.body; // expect array of employee IDs
  const order = await WorkOrder.findById(req.params.id).populate("department");
  if (!order) return res.status(404).json({ message: "WorkOrder not found" });

  // validate each employee belongs to the order's department
  for (const empId of assignedEmployees || []) {
    const emp = await Employee.findById(empId);
    if (!emp) return res.status(400).json({ message: `Employee ${empId} not found` });
    if (!emp.department || emp.department.toString() !== order.department._id.toString()) {
      return res.status(400).json({ message: `Employee ${emp.name} does not belong to order's department` });
    }
  }

  const updated = await WorkOrder.findByIdAndUpdate(
    req.params.id,
    { assignedEmployees },
    { new: true }
  ).populate("assignedManager assignedEmployee assignedEmployees department");
  io.emit("workorder_updated", updated);
  res.json(updated);
});

router.put("/:id/status", verifyToken, authorizeRoles("employee", "manager"), async (req, res) => {
  const { status, materials, totalCost } = req.body;
  const fields = { status };
  if (materials) fields.materials = materials;
  if (totalCost) fields.totalCost = totalCost;
  const updated = await WorkOrder.findByIdAndUpdate(req.params.id, fields, { new: true })
    .populate("assignedManager assignedEmployee assignedEmployees department");
  io.emit("workorder_updated", updated);
  res.json(updated);
});

router.get("/", verifyToken, authorizeRoles("admin"), async (req, res) => {
  const orders = await WorkOrder.find().populate("department assignedManager assignedEmployee assignedEmployees");
  res.json(orders);
});

router.get("/manager", verifyToken, authorizeRoles("manager"), async (req, res) => {
  const orders = await WorkOrder.find({ assignedManager: req.user.id }).populate("department assignedEmployee assignedEmployees");
  res.json(orders);
});

router.get("/employee", verifyToken, authorizeRoles("employee"), async (req, res) => {
  // Return work orders where the employee is either the single assignedEmployee
  // or included in the assignedEmployees array (managers may assign multiple employees)
  const orders = await WorkOrder.find({
    $or: [
      { assignedEmployee: req.user.id },
      { assignedEmployees: req.user.id },
    ],
  }).populate("department assignedManager assignedEmployees assignedEmployee");
  res.json(orders);
});

export default router;

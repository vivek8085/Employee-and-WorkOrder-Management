import express from "express";
import Employee from "../models/Employee.js";
import WorkOrder from "../models/WorkOrder.js";
import { verifyToken, authorizeRoles } from "../middleware/authMiddleware.js";
import Department from "../models/Department.js";

const router = express.Router();

// GET /api/dashboard/summary
// Returns counts for dashboard summary used by frontend
router.get("/summary", verifyToken, authorizeRoles("admin"), async (req, res) => {
  try {
    const employees = await Employee.countDocuments({ role: "employee" });
    const managers = await Employee.countDocuments({ role: "manager" });
    const workOrders = await WorkOrder.countDocuments();

    // Sum total materials across all work orders
    const agg = await WorkOrder.aggregate([
      { $project: { materialsCount: { $size: { $ifNull: ["$materials", []] } } } },
      { $group: { _id: null, totalMaterials: { $sum: "$materialsCount" } } },
    ]);
    const inventoryItems = agg[0]?.totalMaterials || 0;

    res.json({
      adminName: req.user?.name || "",
      employees,
      managers,
      workOrders,
      inventoryItems,
    });
  } catch (err) {
    console.error("Failed to load dashboard summary:", err);
    res.status(500).json({ message: "Server error" });
  }
});

// GET /api/dashboard/manager-summary
// Returns per-department stats for the logged-in manager
router.get("/manager-summary", verifyToken, authorizeRoles("manager"), async (req, res) => {
  try {
    // Determine manager's department from req.user
    const managerDeptId = req.user.department;
    if (!managerDeptId) return res.status(200).json({ managerName: req.user?.name || "", managerDepartment: null });

    const dept = await Department.findById(managerDeptId);
    if (!dept) return res.status(404).json({ message: "Department not found for manager" });

    const employeesCount = await Employee.countDocuments({ department: dept._id });
    const assignedCount = await WorkOrder.countDocuments({ department: dept._id, assignedManager: req.user.id });
    const completedCount = await WorkOrder.countDocuments({ department: dept._id, assignedManager: req.user.id, status: "Completed" });

    const managerDepartment = {
      departmentId: dept._id,
      departmentName: dept.name,
      employeesCount,
      assignedWorkOrders: assignedCount,
      completedWorkOrders: completedCount,
    };

    res.json({ managerName: req.user?.name || "", managerDepartment });
  } catch (err) {
    console.error("Failed to load manager summary:", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;

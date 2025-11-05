import mongoose from "mongoose";

const workOrderSchema = new mongoose.Schema({
  product: String,
  description: String,
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
  assignedManager: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  assignedEmployee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  assignedEmployees: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  status: { type: String, default: "Pending" },
  materials: [{ name: String, quantity: Number, price: Number }],
  totalCost: Number,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("WorkOrder", workOrderSchema);

import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["admin", "manager", "employee"], default: "employee" },
  department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
});

export default mongoose.model("Employee", employeeSchema);

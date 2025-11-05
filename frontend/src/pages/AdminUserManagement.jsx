import React, { useEffect, useState } from "react";
import {
  createDepartment,
  getDepartments,
  registerUser,
  getEmployees,
  deleteUser,
} from "../api/admin";

const AdminUserManagement = () => {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [depName, setDepName] = useState("");
  const [depDesc, setDepDesc] = useState("");
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
    department: "",
  });

  const token = localStorage.getItem("token");

  // Load departments & employees
  useEffect(() => {
    const fetchData = async () => {
      const deps = await getDepartments(token);
      const emps = await getEmployees(token);
      setDepartments(deps);
      setEmployees(emps);
    };
    fetchData();
  }, [token]);

  // Create Department
  const handleAddDepartment = async (e) => {
    e.preventDefault();
    if (!depName) return;
    await createDepartment({ name: depName, description: depDesc }, token);
    setDepName("");
    setDepDesc("");
    const deps = await getDepartments(token);
    setDepartments(deps);
  };

  // Register User
  const handleAddUser = async (e) => {
    e.preventDefault();
    await registerUser(newUser, token);
    setNewUser({ name: "", email: "", password: "", role: "employee", department: "" });
    const emps = await getEmployees(token);
    setEmployees(emps);
  };

  const handleDeleteUser = async (id) => {
    // Open modal instead - this function kept for backwards compat but will open modal
    setDeleteTarget(id);
  };

  const [deleteTarget, setDeleteTarget] = useState(null); // holds user id to delete

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await deleteUser(deleteTarget, token);
      // If backend returns an error message, show it
      if (res?.message && res.message.toLowerCase().includes("error")) {
        alert(res.message || "Failed to delete user");
        return;
      }
      // success
      setDeleteTarget(null);
      const emps = await getEmployees(token);
      setEmployees(emps);
    } catch (err) {
      console.error("Delete user error:", err);
      alert(err.message || "Failed to delete user");
    }
  };

  const cancelDelete = () => setDeleteTarget(null);

  return (
    <div className="p-6 space-y-10">
      <h1 className="text-2xl font-bold mb-4">Admin: Manage Users & Departments</h1>

      {/* Department Form */}
      <div className="bg-base-100 p-6 rounded-xl shadow-xl">
        <h2 className="text-xl font-semibold mb-3">➕ Add Department</h2>
        <form onSubmit={handleAddDepartment} className="flex gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Department Name"
            className="input input-bordered"
            value={depName}
            onChange={(e) => setDepName(e.target.value)}
            required
          />
          <input
            type="text"
            placeholder="Description"
            className="input input-bordered"
            value={depDesc}
            onChange={(e) => setDepDesc(e.target.value)}
          />
          <button className="btn btn-primary">Add</button>
        </form>

        {/* Department Table */}
        <div className="mt-5 overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200">
                <th>#</th>
                <th>Name</th>
                <th>Manager</th>
              </tr>
            </thead>
            <tbody>
              {departments.map((d, i) => {
                // find manager(s) for this department from employees array
                const mgrs = employees
                  .filter((e) => e.role === "manager" && (e.department === d._id || e.department?._id === d._id))
                  .map((m) => m.name);
                return (
                  <tr key={d._id}>
                    <td>{i + 1}</td>
                    <td>{d.name}</td>
                    <td>{mgrs.length ? mgrs.join(", ") : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Registration */}
      <div className="bg-base-100 p-6 rounded-xl shadow-xl">
  <h2 className="text-xl font-semibold mb-3"><svg className="w-5 h-5 inline mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Register User</h2>
        <form onSubmit={handleAddUser} className="grid grid-cols-2 gap-3">
          <input
            type="text"
            placeholder="Full Name"
            className="input input-bordered"
            value={newUser.name}
            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
            required
          />
          <input
            type="email"
            placeholder="Email"
            className="input input-bordered"
            value={newUser.email}
            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input input-bordered"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            required
          />
          <select
            className="select select-bordered"
            value={newUser.role}
            onChange={(e) => {
              const role = e.target.value;
              // If an admin is being created, clear department since admins don't belong to one
              if (role === "admin") {
                setNewUser({ ...newUser, role, department: "" });
              } else {
                setNewUser({ ...newUser, role });
              }
            }}
          >
            <option value="employee">Employee</option>
            <option value="manager">Manager</option>
            <option value="admin">Admin</option>
          </select>
          <select
            className="select select-bordered"
            value={newUser.department}
            onChange={(e) => setNewUser({ ...newUser, department: e.target.value })}
            disabled={newUser.role === "admin"}
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>
          <button className="btn btn-success col-span-2 mt-2">Register User</button>
        </form>

        {/* Employee Table */}
        <div className="mt-6 overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-base-200">
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((e, i) => (
                <tr key={e._id}>
                  <td>{i + 1}</td>
                  <td>{e.name}</td>
                  <td>{e.email}</td>
                  <td>{e.role}</td>
                  <td>{e.department?.name || "—"}</td>
                  <td>
                    <button className="btn btn-sm btn-error" onClick={() => handleDeleteUser(e._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete confirmation modal (DaisyUI) */}
      <input type="checkbox" id="delete-modal" className="modal-toggle" checked={!!deleteTarget} readOnly />
      <div className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg">Confirm Delete</h3>
          <p className="py-4">Are you sure you want to delete this user? This action cannot be undone.</p>
          <div className="modal-action">
            <button className="btn" onClick={cancelDelete}>Cancel</button>
            <button className="btn btn-error" onClick={confirmDelete}>Delete</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUserManagement;

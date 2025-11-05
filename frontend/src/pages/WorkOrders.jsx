import React, { useState, useEffect, useContext } from "react";
import { API_BASE } from "../api/admin";
import { socket } from "../socket";
import { AlertContext } from "../context/AlertContext";
import { ClipboardIcon, BillIcon } from "../components/Icons";

const WorkOrders = () => {
  const token = localStorage.getItem("token");
  const { showAlert } = useContext(AlertContext);
  const [departments, setDepartments] = useState([]);
  const [managers, setManagers] = useState([]);
  const [materials, setMaterials] = useState([{ name: "", quantity: "", price: "" }]);
  const [form, setForm] = useState({
    product: "",
    description: "",
    department: "",
    assignedManager: "",
  });
  const [workOrders, setWorkOrders] = useState([]);

  // fetch all departments, managers, and existing orders
  useEffect(() => {
    fetchDepartments();
    fetchManagers();
    fetchWorkOrders();

    socket.on("workorder_created", fetchWorkOrders);
    socket.on("workorder_updated", fetchWorkOrders);

    return () => {
      socket.off("workorder_created", fetchWorkOrders);
      socket.off("workorder_updated", fetchWorkOrders);
    };
  }, []);

  // When department changes, ensure the assigned manager belongs to that department
  useEffect(() => {
    if (!form.department) return;
    // if assigned manager is not part of selected department, clear it
    const stillValid = managers.some((m) => {
      const depId = m.department?._id || m.department;
      return m._id === form.assignedManager && String(depId) === String(form.department);
    });
    if (!stillValid && form.assignedManager) {
      setForm((f) => ({ ...f, assignedManager: "" }));
    }
  }, [form.department, managers]);

  const fetchDepartments = async () => {
    const res = await fetch(`${API_BASE}/departments`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setDepartments(await res.json());
  };

  const fetchManagers = async () => {
    const res = await fetch(`${API_BASE}/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const all = await res.json();
    setManagers(all.filter((e) => e.role === "manager"));
  };

  const fetchWorkOrders = async () => {
    const res = await fetch(`${API_BASE}/workorders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    setWorkOrders(await res.json());
  };

  const handleMaterialChange = (index, field, value) => {
    const updated = [...materials];
    updated[index][field] = value;
    setMaterials(updated);
  };

  const addMaterial = () => setMaterials([...materials, { name: "", quantity: "", price: "" }]);
  const removeMaterial = (index) => setMaterials(materials.filter((_, i) => i !== index));

  const totalCost = materials.reduce(
    (acc, mat) => acc + (mat.quantity && mat.price ? mat.quantity * mat.price : 0),
    0
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const body = { ...form, materials, totalCost };
    const res = await fetch(`${API_BASE}/workorders/admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setForm({ product: "", description: "", department: "", assignedManager: "" });
      setMaterials([{ name: "", quantity: "", price: "" }]);
      fetchWorkOrders();
      try { showAlert('success','Work order created'); } catch(e) {}
    } else {
      try { showAlert('error','Failed to create work order'); } catch(e) {}
    }
  };

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold"><ClipboardIcon/>Create Work Order</h1>

      <form onSubmit={handleSubmit} className="bg-base-100 p-6 rounded-xl shadow space-y-4">
        <input
          type="text"
          placeholder="Product Name"
          className="input input-bordered w-full"
          value={form.product}
          onChange={(e) => setForm({ ...form, product: e.target.value })}
          required
        />
        <textarea
          placeholder="Description"
          className="textarea textarea-bordered w-full"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
        <div className="grid grid-cols-2 gap-3">
          <select
            className="select select-bordered"
            value={form.department}
            onChange={(e) => setForm({ ...form, department: e.target.value })}
            required
          >
            <option value="">Select Department</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            className="select select-bordered"
            value={form.assignedManager}
            onChange={(e) => setForm({ ...form, assignedManager: e.target.value })}
            required
          >
            <option value="">Select Manager</option>
            {managers
              .filter((m) => {
                const depId = m.department?._id || m.department;
                // show only managers that belong to the selected department
                return String(depId) === String(form.department);
              })
              .map((m) => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
          </select>
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-2"><BillIcon/>Bill of Materials</h2>
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Material</th>
                <th>Quantity</th>
                <th>Price</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {materials.map((mat, i) => (
                <tr key={i}>
                  <td>
                    <input
                      type="text"
                      placeholder="Material Name"
                      className="input input-bordered w-full"
                      value={mat.name}
                      onChange={(e) => handleMaterialChange(i, "name", e.target.value)}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      placeholder="Qty"
                      className="input input-bordered w-full"
                      value={mat.quantity}
                      onChange={(e) =>
                        handleMaterialChange(i, "quantity", Number(e.target.value))
                      }
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      placeholder="Price"
                      className="input input-bordered w-full"
                      value={mat.price}
                      onChange={(e) =>
                        handleMaterialChange(i, "price", Number(e.target.value))
                      }
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-error btn-sm"
                      onClick={() => removeMaterial(i)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addMaterial} className="btn btn-sm mt-3">
            ➕ Add Material
          </button>
          <div className="text-right font-bold mt-3">
            Total Cost: ₹{totalCost.toFixed(2)}
          </div>
        </div>

        <button className="btn btn-primary w-full mt-4">Create Work Order</button>
      </form>
    </div>
  );
};

export default WorkOrders;

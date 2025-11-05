import React, { useEffect, useState } from "react";
import { API_BASE } from "../api/admin";
import { socket } from "../socket";

const ProductionTracking = () => {
  const token = localStorage.getItem("token");
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();

    socket.on("workorder_created", fetchOrders);
    socket.on("workorder_updated", fetchOrders);

    return () => {
      socket.off("workorder_created", fetchOrders);
      socket.off("workorder_updated", fetchOrders);
    };
  }, []);

  const fetchOrders = async () => {
    const res = await fetch(`${API_BASE}/workorders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setOrders(data);
  };

  return (
    <div className="p-6">
  <h1 className="text-2xl font-bold mb-4"><svg className="w-5 h-5 inline mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 16V8l-6-3-4 2-6-3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 13v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>Production Tracking</h1>

      <div className="overflow-x-auto bg-base-100 rounded-xl shadow p-4">
        <table className="table table-zebra w-full">
          <thead>
            <tr>
              <th>#</th>
              <th>Product</th>
              <th>Department</th>
              <th>Manager</th>
              <th>Employee</th>
              <th>Status</th>
              <th>Total Cost</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o, i) => (
              <tr key={o._id}>
                <td>{i + 1}</td>
                <td>{o.product}</td>
                <td>{o.department?.name}</td>
                <td>{o.assignedManager?.name}</td>
                <td>
                  {o.assignedEmployee?.name
                    || (o.assignedEmployees && o.assignedEmployees.length > 0 && o.assignedEmployees.map(a => a.name || a).join(', '))
                    || o.assignedEmployeeName
                    || (o.assignedEmployeesNames && o.assignedEmployeesNames.join(', '))
                    || "—"}
                </td>
                <td>
                  <span
                    className={`badge ${
                      o.status === "Completed"
                        ? "badge-success"
                        : o.status === "In Progress"
                        ? "badge-warning"
                        : "badge-neutral"
                    }`}
                  >
                    {o.status}
                  </span>
                </td>
                <td>₹{o.totalCost?.toFixed(2) || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductionTracking;

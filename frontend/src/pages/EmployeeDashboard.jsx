import React, { useEffect, useState, useContext } from "react";
import { API_BASE } from "../api/admin";
import { socket } from "../socket";
import { AlertContext } from "../context/AlertContext";
import { UserIcon, BillIcon } from "../components/Icons";

const EmployeeDashboard = () => {
  const token = localStorage.getItem("token");
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('all');
  const { showAlert } = useContext(AlertContext);

  useEffect(() => {
    fetchOrders();

    socket.on("workorder_updated", fetchOrders);
    return () => {
      socket.off("workorder_updated", fetchOrders);
    };
  }, []);

  const fetchOrders = async () => {
    const res = await fetch(`${API_BASE}/workorders/employee`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setOrders(data);
  };

  const handleStatusChange = async (id, newStatus) => {
    await fetch(`${API_BASE}/workorders/${id}/status`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchOrders();
    try { showAlert('success', 'Status updated'); } catch(e) {}
  };

  // derive visible orders based on selected status filter
  const visibleOrders = statusFilter === 'all' ? orders : orders.filter(o => o.status === statusFilter);

  return (
    <div className="p-6 space-y-6">
  <div className="bg-base-100 p-6 rounded-2xl shadow-md">
    <h1 className="text-3xl font-bold mb-2">👋 Welcome back, {JSON.parse(localStorage.getItem('user') || 'null')?.name || 'Employee'}!</h1>
    <p className="text-gray-500">Here are your assigned work orders and progress.</p>
  </div>
  <h1 className="text-2xl font-bold mb-4"><UserIcon/>Employee Dashboard</h1>

            <div className="flex items-center justify-between">
              <div></div>
              <div className="flex items-center gap-2">
                <label className="text-sm">Filter:</label>
                <select className="select select-sm select-bordered w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">All</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                </select>
              </div>
            </div>

            {visibleOrders.length === 0 ? (
              <p>No assigned work orders match the selected filter.</p>
            ) : (
              visibleOrders.map((order) => (
                <div key={order._id} className="bg-base-100 p-6 rounded-xl shadow space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold">{order.product}</h2>
                      <p className="text-sm text-gray-500">{order.description}</p>
                    </div>
                    <span className={`badge ${order.status === "Completed" ? "badge-success" : order.status === "In Progress" ? "badge-warning" : "badge-neutral"}`}>{order.status}</span>
                  </div>

                  <div className="mt-3">
                    <h3 className="font-bold">Department: </h3>
                    <p>{order.department?.name || "N/A"}</p>
                    <h3 className="font-bold mt-2">Manager: </h3>
                    <p>{order.assignedManager?.name || "N/A"}</p>
                  </div>

                  <div className="mt-4">
                    <h3 className="font-bold mb-2"><BillIcon/>Bill of Materials</h3>
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Quantity</th>
                          <th>Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.materials.map((mat, i) => (
                          <tr key={i}>
                            <td>{mat.name}</td>
                            <td>{mat.quantity}</td>
                            <td>₹{mat.price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    <div className="text-right font-bold mt-3">
                      Total Cost: ₹{order.totalCost?.toFixed(2) || 0}
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end gap-3">
                    {order.status !== "Completed" && (
                      <select
                        className="select select-bordered"
                        value={order.status}
                        onChange={(e) => handleStatusChange(order._id, e.target.value)}
                      >
                        <option>Pending</option>
                        <option>In Progress</option>
                        <option>Completed</option>
                      </select>
                    )}
                  </div>
                </div>
              ))
            )}
    </div>
  );
};

export default EmployeeDashboard;

import React, { useEffect, useState } from "react";
import DashboardCard from "../components/DashboardCard";
import { API_BASE } from "../api/admin";

const Dashboard = ({ onNavigate }) => {
  const [adminName, setAdminName] = useState("");
  const [stats, setStats] = useState({
    employees: 0,
    managers: 0,
    workOrders: 0,
    inventoryItems: 0,
  });

  // Fetch admin name & dashboard summary
  useEffect(() => {
    const token = localStorage.getItem("token");

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_BASE}/dashboard/summary`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setAdminName(data.adminName);
        setStats({
          employees: data.employees,
          managers: data.managers,
          workOrders: data.workOrders,
          inventoryItems: data.inventoryItems,
        });
      } catch (err) {
        console.error("Failed to load dashboard summary:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div className="bg-base-100 p-6 rounded-2xl shadow-md">
        <h1 className="text-3xl font-bold mb-2">
          👋 Welcome back, {adminName || "Admin"}!
        </h1>
        <p className="text-gray-500">
          Here’s an overview of your factory performance today.
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Employees"
          desc={`${stats.employees} Active`}
          color="info/20"
          onClick={() => onNavigate("users")}
        />
        <DashboardCard
          title="Managers"
          desc={`${stats.managers} Assigned`}
          color="secondary/20"
          onClick={() => onNavigate("users")}
        />
        <DashboardCard
          title="Products Released"
          desc={`${stats.workOrders} Work Orders`}
          color="primary/20"
          onClick={() => onNavigate("production")}
        />
        <DashboardCard
          title="Inventory Items"
          desc={`${stats.inventoryItems} Materials`}
          color="warning/20"
          onClick={() => onNavigate("plugins")}
        />
      </div>

      {/* Inventory Overview Panel */}
      <div className="bg-base-100 rounded-2xl shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">📦 Inventory Overview</h2>
          <button
            onClick={() => onNavigate("plugins")}
            className="btn btn-outline btn-sm"
          >
            Open Inventory Module
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Material</th>
                <th>Available Qty</th>
                <th>Unit</th>
                <th>Consumed</th>
                <th>Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {/* Example Data — You’ll fetch from backend later */}
              <tr>
                <td>Steel Rods</td>
                <td>1250</td>
                <td>kg</td>
                <td>400</td>
                <td>2 hrs ago</td>
              </tr>
              <tr>
                <td>Aluminum Sheets</td>
                <td>750</td>
                <td>pcs</td>
                <td>200</td>
                <td>1 hr ago</td>
              </tr>
              <tr>
                <td>Copper Wires</td>
                <td>980</td>
                <td>m</td>
                <td>120</td>
                <td>30 mins ago</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

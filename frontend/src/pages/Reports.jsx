import React, { useEffect, useState } from "react";
import { ChartIcon } from "../components/Icons";
import { API_BASE } from "../api/admin";
import { socket } from "../socket";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// small helper to show status badge styles
const StatusBadge = ({ working }) => (
  <span className={`text-xs px-2 py-1 rounded-full ${working ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
    {working ? 'Working' : 'Not Working'}
  </span>
);

// ManagerTooltip will be declared inside the Reports component so it can access managerOrdersMap

const COLORS = ["#FBBF24", "#3B82F6", "#22C55E"]; // Pending, In Progress, Completed

const Reports = () => {
  const token = localStorage.getItem("token");
  const [orders, setOrders] = useState([]);
  const [statusData, setStatusData] = useState([]);
  const [costData, setCostData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [managers, setManagers] = useState([]);
  const [employeeWorkingData, setEmployeeWorkingData] = useState([]);
  const [managerWorkingData, setManagerWorkingData] = useState([]);
  const [empPieSelection, setEmpPieSelection] = useState(null);
  const [mgrPieSelection, setMgrPieSelection] = useState(null);
  const [managerOrdersMap, setManagerOrdersMap] = useState({});
  const [socketConnected, setSocketConnected] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Fetch orders and listen for real-time changes
  useEffect(() => {
    fetchOrders();
    fetchEmployeesAndManagers();

    // socket connection status
    const onConnect = () => { setSocketConnected(true); };
    const onDisconnect = () => { setSocketConnected(false); };

    const onCreated = (order) => {
      if (order && order._id) {
        setOrders((prev) => {
          // avoid duplicate
          if (prev.find((p) => String(p._id) === String(order._id))) return prev;
          return [order, ...prev];
        });
        setLastUpdated(new Date());
      } else {
        fetchOrders();
      }
    };

    const onUpdated = (updated) => {
      if (updated && updated._id) {
        setOrders((prev) => prev.map((o) => (String(o._id) === String(updated._id) ? updated : o)));
        setLastUpdated(new Date());
      } else {
        fetchOrders();
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("workorder_created", onCreated);
    socket.on("workorder_updated", onUpdated);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("workorder_created", onCreated);
      socket.off("workorder_updated", onUpdated);
    };
  }, []);

  const fetchEmployeesAndManagers = async () => {
    try {
      const res = await fetch(`${API_BASE}/employees`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      const emps = (data || []).filter(u => u.role === 'employee');
      const mgrs = (data || []).filter(u => u.role === 'manager');
      setEmployees(emps);
      setManagers(mgrs);
    } catch (e) {
      console.error('fetchEmployeesAndManagers error', e);
    }
  };

  const fetchOrders = async () => {
    const res = await fetch(`${API_BASE}/workorders`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setOrders(data);
  };

  // recompute derived chart data whenever orders/employees/managers change
  useEffect(() => {
    const data = orders || [];
    // set lastUpdated when orders array updates (fallback when fetchOrders used)
    setLastUpdated(new Date());
    // status
    const statusSummary = [
      { name: "Pending", value: data.filter((o) => o.status === "Pending").length },
      { name: "In Progress", value: data.filter((o) => o.status === "In Progress").length },
      { name: "Completed", value: data.filter((o) => o.status === "Completed").length },
    ];
    setStatusData(statusSummary);

    // cost
    const costSummary = Object.values(
      data.reduce((acc, o) => {
        const dept = o.department?.name || "Unknown";
        if (!acc[dept]) acc[dept] = { name: dept, totalCost: 0 };
        acc[dept].totalCost += o.totalCost || 0;
        return acc;
      }, {})
    );
    setCostData(costSummary);

    // employees
    const empCounts = (employees || []).map(emp => {
      const empId = String(emp._id);
      const count = (data || []).reduce((acc, o) => {
        if (o.status === 'Completed') return acc;
        const arr = o.assignedEmployees || [];
        const arrIds = arr.map(x => x._id ? String(x._id) : String(x));
        const single = o.assignedEmployee && (o.assignedEmployee._id ? String(o.assignedEmployee._id) : String(o.assignedEmployee));
        return acc + (arrIds.includes(empId) || String(single) === empId ? 1 : 0);
      }, 0);
      return { name: emp.name || emp.email || emp._id, value: count, _id: emp._id, email: emp.email };
    }).sort((a,b) => b.value - a.value);
    setEmployeeWorkingData(empCounts);

    // managers
    const mgrCounts = (managers || []).map(mgr => {
      const mgrId = String(mgr._id);
      const count = (data || []).reduce((acc, o) => {
        if (o.status === 'Completed') return acc;
  if (o.assignedManager && String(o.assignedManager._id || o.assignedManager) === mgrId) return acc + 1;
        const arr = o.assignedEmployees || [];
        const arrIds = arr.map(x => x._id ? String(x._id) : String(x));
        const single = o.assignedEmployee && (o.assignedEmployee._id ? String(o.assignedEmployee._id) : String(o.assignedEmployee));
        const allIds = arrIds.concat(single ? [single] : []);
        const match = allIds.some(eid => {
          const emp = employees.find(x => String(x._id) === String(eid));
          return emp && (String(emp.manager) === mgrId || (emp.manager && String(emp.manager._id) === mgrId));
        });
        return acc + (match ? 1 : 0);
      }, 0);
      return { name: mgr.name || mgr.email || mgr._id, value: count, _id: mgr._id, email: mgr.email };
    }).sort((a,b) => b.value - a.value);
    setManagerWorkingData(mgrCounts);

    // build map of managerId -> active orders list for tooltip
    const map = {};
    (data || []).filter(o => o.status !== 'Completed').forEach(o => {
      // direct assignedManager
      const m = o.assignedManager || null;
      if (m) {
        const id = String(m._id || m);
        if (!map[id]) map[id] = [];
        map[id].push({ _id: o._id, product: o.product });
      } else {
        // try to infer manager via assignedEmployees -> employee.manager
        const arr = o.assignedEmployees || [];
        const arrIds = arr.map(x => x._id ? String(x._id) : String(x));
        const single = o.assignedEmployee && (o.assignedEmployee._id ? String(o.assignedEmployee._id) : String(o.assignedEmployee));
        const all = arrIds.concat(single ? [single] : []);
        all.forEach(eid => {
          const emp = employees.find(x => String(x._id) === String(eid));
          if (emp && emp.manager) {
            const mgrId = String(emp.manager._id || emp.manager);
            if (!map[mgrId]) map[mgrId] = [];
            map[mgrId].push({ _id: o._id, product: o.product });
          }
        });
      }
    });
    setManagerOrdersMap(map);

  }, [orders, employees, managers]);

  // Tooltip component that reads managerOrdersMap from closure
  const ManagerTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) return null;
    const mgrName = label;
    const mgrDatum = payload[0]?.payload || {};
    const mgrId = mgrDatum._id;
    const map = managerOrdersMap[mgrId] || [];
    return (
      <div className="bg-white p-2 rounded shadow text-sm">
        <div className="font-semibold">{mgrName}</div>
        {map.length === 0 ? <div className="text-xs text-gray-500">No active orders</div> : (
          <ul className="text-xs mt-1">
            {map.map(o => <li key={o._id}>{o.product} ({o._id})</li>)}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-10">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold"><ChartIcon/>Real-Time Production Reports</h1>
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-sm font-medium ${socketConnected ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
            {socketConnected ? 'LIVE' : 'STALE'}
          </div>
          <div className="text-sm text-gray-500">{lastUpdated ? `Updated: ${new Date(lastUpdated).toLocaleString()}` : 'No data yet'}</div>
        </div>
      </div>

      {/* PIE CHART - STATUS */}
      <div className="bg-base-100 p-6 rounded-xl shadow-xl">
        <h2 className="text-lg font-semibold mb-4 text-center">Work Order Status Overview</h2>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
              label
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>

      {/* BAR CHART - DEPARTMENT COST */}
      <div className="bg-base-100 p-6 rounded-xl shadow-xl">
        <h2 className="text-lg font-semibold mb-4 text-center">Department-Wise Total Cost</h2>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={costData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="totalCost" fill="#10B981" name="Total Cost (₹)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Employee Working Rate */}
      <div className="bg-base-100 p-6 rounded-xl shadow-xl">
        <h2 className="text-lg font-semibold mb-4 text-center">Employee Working Rate (All Departments)</h2>
        <div style={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <BarChart data={employeeWorkingData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="value" fill="#3B82F6" name="Active Work Orders" />
            </BarChart>
          </ResponsiveContainer>
        </div>

          <div className="mt-6">
          <h3 className="font-semibold mb-2 text-center">Manager Working Rate</h3>
          <div style={{ width: '100%', height: 240 }}>
            <ResponsiveContainer>
              {/* managerOrdersMap available in closure for ManagerTooltip */}
              <BarChart data={managerWorkingData} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip content={<ManagerTooltip/>} />
                <Bar dataKey="value" fill="#8B5CF6" name="Active Work Orders" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-6">
          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Employees: Working vs Not Working</h3>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[
                    { name: 'Working', value: (employees || []).filter(e => {
                      const rec = employeeWorkingData.find(x => String(x._id) === String(e._id));
                      return rec && rec.value > 0;
                    }).length },
                    { name: 'Not Working', value: (employees || []).length - (employees || []).filter(e => {
                      const rec = employeeWorkingData.find(x => String(x._id) === String(e._id));
                      return rec && rec.value > 0;
                    }).length }
                  ]} dataKey="value" nameKey="name" outerRadius={80} onClick={(d) => setEmpPieSelection(d && d.name)}>
                    <Cell fill="#06b6d4" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {empPieSelection && (
              <div className="mt-3 bg-base-200 p-3 rounded max-h-64 overflow-auto">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">Details: {empPieSelection}</div>
                  <button className="btn btn-xs" onClick={() => setEmpPieSelection(null)}>Clear</button>
                </div>
                {(employees || []).filter(e => {
                  const rec = employeeWorkingData.find(x => String(x._id) === String(e._id));
                  const working = rec && rec.value > 0;
                  return empPieSelection === 'Working' ? working : !working;
                }).map(e => (
                  <div key={e._id} className="p-2 border-b flex justify-between items-center">
                    <div>
                      <div className="font-medium">{e.name}</div>
                      <div className="text-xs text-gray-500">{e.email}</div>
                    </div>
                    <div className="text-right">
                      <StatusBadge working={!!(employeeWorkingData.find(x => String(x._id) === String(e._id))?.value)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="p-4 border rounded">
            <h3 className="font-semibold mb-2">Managers: Working vs Not Working</h3>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={[
                    { name: 'Working', value: (managers || []).filter(m => managerWorkingData.find(x => String(x._id) === String(m._id))?.value > 0).length },
                    { name: 'Not Working', value: (managers || []).length - (managers || []).filter(m => managerWorkingData.find(x => String(x._id) === String(m._id))?.value > 0).length }
                  ]} dataKey="value" nameKey="name" outerRadius={80} onClick={(d) => setMgrPieSelection(d && d.name)}>
                    <Cell fill="#06b6d4" />
                    <Cell fill="#ef4444" />
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {mgrPieSelection && (
              <div className="mt-3 bg-base-200 p-3 rounded max-h-64 overflow-auto">
                <div className="flex justify-between items-center mb-2">
                  <div className="font-medium">Details: {mgrPieSelection}</div>
                  <button className="btn btn-xs" onClick={() => setMgrPieSelection(null)}>Clear</button>
                </div>
                {(managers || []).filter(m => {
                  const rec = managerWorkingData.find(x => String(x._id) === String(m._id));
                  const working = rec && rec.value > 0;
                  return mgrPieSelection === 'Working' ? working : !working;
                }).map(m => (
                  <div key={m._id} className="p-2 border-b flex justify-between items-center">
                    <div>
                      <div className="font-medium">{m.name}</div>
                      <div className="text-xs text-gray-500">{m.email}</div>
                    </div>
                    <div className="text-right">
                      <StatusBadge working={!!(managerWorkingData.find(x => String(x._id) === String(m._id))?.value)} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;

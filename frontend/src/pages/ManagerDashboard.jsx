import React, { useEffect, useState, useContext } from "react";
import { HourglassIcon, CheckIcon } from "../components/Icons";
import { AlertContext } from "../context/AlertContext";
import { socket } from "../socket";
import ManagerSidebar from "../components/ManagerSidebar";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

const API_BASE = "http://localhost:5000/api";

const ManagerDashboard = () => {
  const token = localStorage.getItem("token");
  const { showAlert } = useContext(AlertContext);
  const [orders, setOrders] = useState([]);
  // baseEmployees holds the raw fetched employees; employees holds the enriched version with assignedOrders
  const [baseEmployees, setBaseEmployees] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeQueryGlobal, setEmployeeQueryGlobal] = useState("");
  const [employeeFilter, setEmployeeFilter] = useState("all"); // all | working | notWorking
  const [sortByAssigned, setSortByAssigned] = useState(false);
  const [expandedEmployees, setExpandedEmployees] = useState({});
  const [selectedSingle, setSelectedSingle] = useState({});
  const [pieSelection, setPieSelection] = useState(null);
  const [quickAssignEmployeeId, setQuickAssignEmployeeId] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [editingMaterialsFor, setEditingMaterialsFor] = useState(null); // orderId being edited
  const [managerSummary, setManagerSummary] = useState({ departments: [] });
  const [selectedEmployees, setSelectedEmployees] = useState({}); // { orderId: [empId,...] }
  const [employeeSearch, setEmployeeSearch] = useState({}); // { orderId: searchTerm }
  const [showEmployeeList, setShowEmployeeList] = useState({}); // { orderId: boolean }
  const [page, setPage] = useState("dashboard");
  const [managerInfo, setManagerInfo] = useState({ name: "", departmentName: "", departmentId: null });

  useEffect(() => {
    fetchManagerSummary();
    fetchOrders();
    // fetchEmployees will run again when managerInfo.departmentId is available

    const refreshAll = () => {
      fetchOrders();
      fetchManagerSummary();
      // also refresh employees so working/not-working counts update
      if (managerInfo.departmentId) fetchEmployees();
    };

    socket.on("workorder_created", refreshAll);
    socket.on("workorder_updated", refreshAll);

    return () => {
      socket.off("workorder_created", refreshAll);
      socket.off("workorder_updated", refreshAll);
    };
  }, []);

  // when managerInfo becomes available (departmentId), refetch employees for that department
  useEffect(() => {
    if (managerInfo.departmentId) {
      fetchEmployees();
    }
  }, [managerInfo.departmentId]);

  const fetchOrders = async () => {
    const res = await fetch(`${API_BASE}/workorders/manager`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    setOrders(data);
  };

  const fetchManagerSummary = async () => {
    const res = await fetch(`${API_BASE}/dashboard/manager-summary`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    // API now returns { managerName, managerDepartment }
    if (data.managerDepartment) {
      setManagerSummary({ departments: [data.managerDepartment] });
      setManagerInfo({ name: data.managerName, departmentName: data.managerDepartment.departmentName, departmentId: data.managerDepartment.departmentId });
    } else {
      setManagerSummary({ departments: [] });
      setManagerInfo({ name: data.managerName || "", departmentName: "", departmentId: null });
    }
  };

  const fetchEmployees = async () => {
    const res = await fetch(`${API_BASE}/employees`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    // Filter employees by manager's department if available
    const deptId = managerInfo.departmentId;
    const employeesOnly = data.filter((u) => u.role === "employee");
    const filtered = deptId ? employeesOnly.filter((e) => e.department === deptId || e.department?._id === deptId) : employeesOnly;
    setBaseEmployees(filtered);
  };

  // derive assigned orders per employee whenever orders or employees update
  useEffect(() => {
    if (!baseEmployees || !orders) return;
    // For convenience add assignedOrders array to each employee object
    const enriched = baseEmployees.map((e) => {
      const empId = e._id;
      // Only consider active orders (not 'Completed') when deciding if an employee is currently working
      const assigned = orders
        .filter((o) => o.status !== "Completed")
        .filter((o) => {
          // o.assignedEmployees may be populated objects or ids
          const arr = o.assignedEmployees || [];
          const arrIds = arr.map((x) => (x._id ? String(x._id) : String(x)));
          const single = o.assignedEmployee && (o.assignedEmployee._id ? String(o.assignedEmployee._id) : String(o.assignedEmployee));
          return arrIds.includes(String(empId)) || String(single) === String(empId);
        });
      return { ...e, assignedOrders: assigned };
    });
    setEmployees(enriched);
  }, [orders, baseEmployees]);

  const handlePieClick = (name) => {
    if (!name) return;
    const next = pieSelection === name ? null : name;
    setPieSelection(next);
    if (!next) {
      setEmployeeFilter("all");
    } else if (next === "Working") {
      setEmployeeFilter("working");
    } else if (next === "Not Working") {
      setEmployeeFilter("notWorking");
    }
  };

  const toggleExpand = (empId) => {
    setExpandedEmployees((s) => ({ ...s, [empId]: !s[empId] }));
  };

  const filteredEmployeesList = employees
    .filter((e) => {
      const isWorking = (e.assignedOrders || []).length > 0;
      if (employeeFilter === "working" && !isWorking) return false;
      if (employeeFilter === "notWorking" && isWorking) return false;
      if (!employeeQueryGlobal) return true;
      const q = employeeQueryGlobal.toLowerCase();
      return (e.name || "").toLowerCase().includes(q) || (e.email || "").toLowerCase().includes(q);
    })
    .sort((a, b) => {
      if (!sortByAssigned) return 0;
      return (b.assignedOrders || []).length - (a.assignedOrders || []).length;
    });

  const assignEmployee = async (orderId, empId) => {
    await fetch(`${API_BASE}/workorders/${orderId}/assign-employee`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ assignedEmployee: empId }),
    });
    fetchOrders();
    try { showAlert('success', 'Employee assigned'); } catch (e) {}
  };

  const assignEmployees = async (orderId) => {
    const arr = selectedEmployees[orderId] || [];
    await fetch(`${API_BASE}/workorders/${orderId}/assign-employees`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ assignedEmployees: arr }),
    });
    fetchOrders();
    fetchManagerSummary();
    try { showAlert('success', 'Employees assigned'); } catch (e) {}
    // clear selection and hide the list for this order
    setSelectedEmployees(s => ({ ...s, [orderId]: [] }));
    setEmployeeSearch(s => ({ ...s, [orderId]: '' }));
    setShowEmployeeList(s => ({ ...s, [orderId]: false }));
  };

  const toggleSelectedEmployee = (orderId, empId) => {
    const curr = selectedEmployees[orderId] || [];
    const exists = curr.includes(empId);
    const updated = exists ? curr.filter((e) => e !== empId) : [...curr, empId];
    setSelectedEmployees({ ...selectedEmployees, [orderId]: updated });
  };

  const updateMaterials = async (orderId) => {
    const totalCost = materials.reduce(
      (sum, m) => sum + m.quantity * m.price,
      0
    );
    await fetch(`${API_BASE}/workorders/${orderId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ materials, totalCost }),
    });
    setMaterials([]);
    fetchOrders();
    try { showAlert('success', 'Materials updated'); } catch (e) {}
  };

  const addMaterial = () => {
    setMaterials([...materials, { name: "", quantity: 0, price: 0 }]);
  };

  const removeMaterial = (index) => setMaterials(materials.filter((_, i) => i !== index));

  const updateMaterialField = (index, key, value) => {
    const updated = [...materials];
    updated[index][key] = value;
    setMaterials(updated);
  };

  // Helper to render a small colored DaisyUI badge for order status
  const renderStatusBadge = (status) => {
    const s = (status || "").toLowerCase();
    if (s === "pending") return <span className="badge badge-warning badge-sm">{status}</span>;
    if (s === "in progress") return <span className="badge badge-primary badge-sm">{status}</span>;
    if (s === "completed") return <span className="badge badge-success badge-sm">{status}</span>;
    return <span className="badge badge-ghost badge-sm">{status}</span>;
  };

  return (
    <div>
      <ManagerSidebar page={page} setPage={setPage} managerName={managerInfo.name} departmentName={managerInfo.departmentName} />
  <div className="ml-64 h-screen overflow-auto p-6 space-y-6 no-scrollbar">
        {page === "dashboard" && (
            <div>
              <div className="bg-base-100 p-6 rounded-2xl shadow-md mb-4">
                <h1 className="text-3xl font-bold mb-2">👋 Welcome back, {managerInfo.name || 'Manager'}!</h1>
                <p className="text-gray-500">Overview for {managerInfo.departmentName || 'your department'}.</p>
              </div>
              <h1 className="text-2xl font-bold mb-4">Manager Dashboard</h1>
              <div className="grid gap-4 grid-cols-1">
                {managerSummary.departments.map((d) => {
                  // compute department-specific values when possible
                  const deptId = d.departmentId;
                  const deptEmployeesCount = Array.isArray(baseEmployees)
                    ? baseEmployees.filter((e) => e.department === deptId || e.department?._id === deptId).length
                    : d.employeesCount;
                  const deptBOMCost = orders
                    .filter((o) => (o.department && (String(o.department._id || o.department) === String(deptId))) || o.departmentName === d.departmentName)
                    .reduce((sum, o) => sum + (o.totalCost || 0), 0);

                  return (
                    <div key={d.departmentId} className="bg-base-100 p-4 rounded-lg shadow">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-semibold">{d.departmentName}</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          <div className="text-xs text-gray-600 dark:text-gray-300">Employees</div>
                          <div className="text-2xl font-bold">{deptEmployeesCount}</div>
                        </div>
                        <div className="p-4 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          <div className="text-xs text-gray-600 dark:text-gray-300">Total BOM</div>
                          <div className="text-2xl font-bold">₹{deptBOMCost.toFixed(2)}</div>
                        </div>
                        <div className="p-4 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          <div className="text-xs text-gray-600 dark:text-gray-300">Assigned WorkOrders</div>
                          <div className="text-2xl font-bold">{d.assignedWorkOrders}</div>
                        </div>
                        <div className="p-4 rounded-lg shadow-sm bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                          <div className="text-xs text-gray-600 dark:text-gray-300">Completed WorkOrders</div>
                          <div className="text-2xl font-bold">{d.completedWorkOrders}</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Embedded Reports: status overview and department costs */}
          {page === "dashboard" && (
            <div className="space-y-6">
              <div className="bg-base-100 p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-3">Work Order Status Overview</h3>
                <div style={{ width: '100%', height: 240 }}>
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Pending', value: orders.filter((o) => o.status === 'Pending').length },
                          { name: 'In Progress', value: orders.filter((o) => o.status === 'In Progress').length },
                          { name: 'Completed', value: orders.filter((o) => o.status === 'Completed').length },
                        ]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        label
                      >
                        <Cell fill="#FBBF24" />
                        <Cell fill="#3B82F6" />
                        <Cell fill="#22C55E" />
                      </Pie>
                      <Legend />
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-base-100 p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-3">Employee Working Rate</h3>
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer>
                    <BarChart
                      data={
                        (baseEmployees || [])
                          .map((emp) => {
                            const empId = emp._id;
                            const count = (orders || []).reduce((acc, o) => {
                              const arr = o.assignedEmployees || [];
                              const arrIds = arr.map((x) => (x._id ? String(x._id) : String(x)));
                              const single = o.assignedEmployee && (o.assignedEmployee._id ? String(o.assignedEmployee._id) : String(o.assignedEmployee));
                              return acc + (arrIds.includes(String(empId)) || String(single) === String(empId) ? 1 : 0);
                            }, 0);
                            return { name: emp.name || emp.email || emp._id, value: count };
                          })
                          .sort((a, b) => b.value - a.value)
                      }
                      margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
                    >
                      <XAxis dataKey="name" />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3B82F6" name="Work Orders" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="bg-base-100 p-4 rounded-lg shadow">
                <h3 className="font-semibold mb-3">Employees: Working vs Not Working</h3>
                <div className="flex justify-center mb-4">
                  <div style={{ width: 320, height: 240 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Working', value: employees.filter((e) => (e.assignedOrders || []).length > 0).length },
                            { name: 'Not Working', value: (employees || []).length - employees.filter((e) => (e.assignedOrders || []).length > 0).length },
                          ]}
                          dataKey="value"
                          nameKey="name"
                          cx="50%"
                          cy="50%"
                          outerRadius={90}
                          label
                          onClick={(data) => handlePieClick(data && data.name)}
                        >
                          <Cell fill="#06b6d4" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Details panel: show employee list when a segment is selected */}
                {pieSelection && (
                  <div className="mt-4 bg-base-200 p-3 rounded">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-semibold">Details: {pieSelection}</div>
                      <div className="flex items-center gap-2">
                        <button className="btn btn-xs" onClick={() => { setPieSelection(null); setEmployeeFilter('all'); }}>Clear</button>
                        <div className="text-sm text-gray-500">Showing {filteredEmployeesList.length} employees</div>
                      </div>
                    </div>
                    <div className="max-h-48 overflow-auto">
                      {filteredEmployeesList.map((e) => (
                        <div key={e._id} className="p-2 border-b flex justify-between items-center">
                          <div>
                            <div className="font-medium">{e.name}</div>
                            <div className="text-xs text-gray-500">{e.email}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">Active: {(e.assignedOrders || []).length}</div>
                            <div className="flex gap-2 mt-2">
                              <button className="btn btn-xs" onClick={() => toggleExpand(e._id)}>{expandedEmployees[e._id] ? 'Collapse' : 'Details'}</button>
                            </div>
                            {expandedEmployees[e._id] && (
                              <div className="mt-2 text-xs text-left">
                                <div>Assigned Orders:</div>
                                <ul>
                                      {(e.assignedOrders || []).map((o) => (
                                        <div key={o._id} className="grid grid-cols-2 gap-x-2 gap-y-1 items-center text-xs">
                                          <div className="font-medium truncate">{o.product}</div>
                                          <div className="text-right">{renderStatusBadge(o.status)}</div>
                                        </div>
                                      ))}
                                  {(e.assignedOrders || []).length === 0 && <li className="text-gray-400">No active assignments</li>}
                                </ul>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      {filteredEmployeesList.length === 0 && <div className="p-3 text-gray-500">No employees match</div>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

        {page === "remaining" && (
          <div>
              <h1 className="text-2xl font-bold mb-4"><HourglassIcon/>Remaining Work Orders</h1>
            <div className="space-y-4">
              {orders.filter((o) => o.status !== "Completed").map((o) => (
                <div key={o._id} className="border p-4 rounded">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-semibold">{o.product}</h4>
                      <div className="text-sm text-gray-500">{o.description}</div>
                    </div>
                    <div className="text-sm">Status: {o.status}</div>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-semibold">Bill of Materials (BOM):</div>
                    <div className="mt-2">
                      <table className="table w-full">
                        <thead>
                          <tr>
                            <th>Material</th>
                            <th>Qty</th>
                            <th>Price</th>
                            <th>Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(o.materials || []).map((m, i) => (
                            <tr key={i}>
                              <td>{m.name}</td>
                              <td>{m.quantity}</td>
                              <td>₹{m.price}</td>
                              <td>₹{(m.quantity * m.price).toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="text-right font-bold mt-2">BOM Total: ₹{(o.totalCost || 0).toFixed(2)}</div>
                    </div>
                    <div className="mt-3">
                        {editingMaterialsFor === o._id ? (
                        <div>
                          <h4 className="font-semibold">Edit BOM</h4>
                          <div className="space-y-2">
                            {(materials || []).map((mat, idx) => (
                              <div key={idx} className="grid grid-cols-4 gap-2">
                                <input className="input input-bordered" value={mat.name} onChange={(e) => updateMaterialField(idx, 'name', e.target.value)} />
                                <input className="input input-bordered" type="number" value={mat.quantity} onChange={(e) => updateMaterialField(idx, 'quantity', Number(e.target.value))} />
                                <input className="input input-bordered" type="number" value={mat.price} onChange={(e) => updateMaterialField(idx, 'price', Number(e.target.value))} />
                                <button className="btn btn-error" onClick={() => removeMaterial(idx)}>Remove</button>
                              </div>
                            ))}
                            <div className="flex gap-2">
                              <button className="btn btn-sm" onClick={addMaterial}>Add Material</button>
                              <button className="btn btn-primary btn-sm" onClick={() => { updateMaterials(o._id); setEditingMaterialsFor(null); }}>Save BOM</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => { setEditingMaterialsFor(null); setMaterials([]); }}>Cancel</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <div className="flex gap-2 items-center mb-2">
                            <button className="btn btn-sm btn-info" onClick={() => { setEditingMaterialsFor(o._id); setMaterials(o.materials || []); }}>Edit BOM</button>
                            <div className="flex-1 relative">
                              <input
                                className="input input-sm w-full"
                                placeholder="Search employees..."
                                value={employeeSearch[o._id] || ''}
                                onChange={(e) => setEmployeeSearch(s => ({ ...s, [o._id]: e.target.value }))}
                                onFocus={() => setShowEmployeeList(s => ({ ...s, [o._id]: true }))}
                                onBlur={() => {
                                  // small delay so click on checkbox registers before hiding
                                  setTimeout(() => setShowEmployeeList(s => ({ ...s, [o._id]: false })), 150);
                                }}
                              />

                              {/* dropdown list appears when focused or when there is a search term */}
                              {showEmployeeList[o._id] && (
                                <div className="absolute left-0 right-0 bg-base-100 border rounded mt-1 z-50 max-h-48 overflow-auto p-2">
                                  {(baseEmployees || [])
                                    .filter((emp) => {
                                      const q = (employeeSearch[o._id] || '').toLowerCase();
                                      if (q && !(emp.name || '').toLowerCase().includes(q) && !(emp.email || '').toLowerCase().includes(q)) return false;
                                      return true;
                                    })
                                    .map((emp) => {
                                      const isWorking = (employees.find(e => String(e._id) === String(emp._id))?.assignedOrders || []).length > 0;
                                      return (
                                        <label key={emp._id} className="flex items-center justify-between gap-2 p-1 hover:bg-base-200 rounded">
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="checkbox"
                                              className="checkbox checkbox-sm"
                                              checked={(selectedEmployees[o._id] || []).includes(String(emp._id))}
                                              onChange={() => toggleSelectedEmployee(o._id, String(emp._id))}
                                            />
                                            <div className="text-sm">
                                              <div>{emp.name}</div>
                                              <div className="text-xs text-gray-400">{emp.email}</div>
                                            </div>
                                          </div>
                                          <div>
                                            <span className={`text-xs px-2 py-1 rounded-full ${isWorking ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                              {isWorking ? 'Working' : 'Not Working'}
                                            </span>
                                          </div>
                                        </label>
                                      );
                                    })}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2">
                            <button className="btn btn-sm btn-primary" onClick={() => assignEmployees(o._id)}>Assign Selected</button>
                            {quickAssignEmployeeId && (
                              <button className="btn btn-sm btn-secondary" onClick={() => assignEmployee(o._id, quickAssignEmployeeId)}>Assign Quick ({baseEmployees.find(b => b._id === quickAssignEmployeeId)?.name || 'Selected'})</button>
                            )}
                          </div>

                          {/* Show already assigned employee names on card (below Edit BOM as requested) */}
                          <div className="mt-3 text-sm">
                            <div className="text-xs text-gray-500">Assigned Employees:</div>
                            <div className="mt-1">
                              {((o.assignedEmployees && o.assignedEmployees.length) ? (o.assignedEmployees.map(a => a.name || a).join(', ')) : (o.assignedEmployee?.name || o.assignedEmployee || '—'))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === "completed" && (
          <div>
            <h1 className="text-2xl font-bold mb-4"><CheckIcon/>Completed Work Orders</h1>
            <div className="space-y-4">
              {orders.filter((o) => o.status === "Completed").map((o) => (
                <div key={o._id} className="border p-4 rounded">
                  <div className="flex justify-between">
                    <div>
                      <h4 className="font-semibold">{o.product}</h4>
                      <div className="text-sm text-gray-500">{o.description}</div>
                    </div>
                    <div className="text-sm">Completed</div>
                  </div>
                  <div className="mt-3">
                    <div className="text-sm font-semibold">BOM Total: ₹{(o.totalCost || 0).toFixed(2)}</div>
                    <div className="mt-2 text-sm">
                      <div className="text-xs text-gray-500">Completed By:</div>
                      <div className="mt-1">
                        {((o.assignedEmployees && o.assignedEmployees.length)
                          ? (o.assignedEmployees.map(a => a.name || a).join(', '))
                          : (o.assignedEmployee?.name || o.assignedEmployee || '—'))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {page === "employees" && (
          <div>
            <h1 className="text-2xl font-bold mb-4">Manage Employees</h1>
            <div className="bg-base-100 p-4 rounded-lg shadow">
              <h3 className="font-semibold mb-3">Employees in {managerInfo.departmentName}</h3>
              <ul className="space-y-2">
                {employees.map((e) => (
                  <li key={e._id} className="p-2 border rounded flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{e.name}</div>
                      <div className="text-sm text-gray-500">{e.email}</div>
                    </div>
                    <div className="text-sm text-right">
                      <div>{e.role}</div>
                      <div className="text-xs mt-1">Assigned Work Orders:</div>
                      <ul className="text-xs">
                        {(e.assignedOrders || []).length === 0 && <li className="text-gray-400">None</li>}
                        {(e.assignedOrders || []).map((o) => (
                          <div key={o._id} className="grid grid-cols-2 gap-x-2 gap-y-1 items-center text-xs">
                            <div className="font-medium truncate">{o.product}</div>
                            <div className="text-right">{renderStatusBadge(o.status)}</div>
                          </div>
                        ))}
                      </ul>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        
      </div>
    </div>
  );
};

export default ManagerDashboard;
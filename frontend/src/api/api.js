export const API_BASE = "http://localhost:5000/api";

export const getDepartments = async () => {
  const res = await fetch(`${API_BASE}/departments`);
  return res.json();
};

export const getEmployees = async () => {
  const res = await fetch(`${API_BASE}/employees`);
  return res.json();
};

export const getWorkOrders = async () => {
  const res = await fetch(`${API_BASE}/workorders`);
  return res.json();
};

export const createWorkOrder = async (data) => {
  const res = await fetch(`${API_BASE}/workorders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const updateWorkStatus = async (id, status) => {
  const res = await fetch(`${API_BASE}/workorders/${id}/status`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  return res.json();
};

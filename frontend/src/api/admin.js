export const API_BASE = "https://employee-and-workorder-management-s71h.onrender.com/api";

export const createDepartment = async (data, token) => {
  const res = await fetch(`${API_BASE}/departments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getDepartments = async (token) => {
  const res = await fetch(`${API_BASE}/departments`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const registerUser = async (data, token) => {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });
  return res.json();
};

export const getEmployees = async (token) => {
  const res = await fetch(`${API_BASE}/employees`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
};

export const deleteUser = async (userId, token) => {
  const res = await fetch(`${API_BASE}/employees/${userId}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // throw detailed error
    const err = new Error(body.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = body;
    throw err;
  }
  return body;
};

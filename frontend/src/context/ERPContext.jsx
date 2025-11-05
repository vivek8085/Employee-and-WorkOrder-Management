import React, { createContext, useState, useEffect } from "react";

export const ERPContext = createContext();

export const ERPProvider = ({ children }) => {
  const [workOrders, setWorkOrders] = useState([]);
  const [stock, setStock] = useState([]);

  // 🧩 Load from localStorage (optional)
  useEffect(() => {
    const savedOrders = JSON.parse(localStorage.getItem("workOrders") || "[]");
    const savedStock = JSON.parse(localStorage.getItem("stock") || "[]");
    setWorkOrders(savedOrders);
    setStock(savedStock);
  }, []);

  // 💾 Save automatically
  useEffect(() => {
    localStorage.setItem("workOrders", JSON.stringify(workOrders));
    localStorage.setItem("stock", JSON.stringify(stock));
  }, [workOrders, stock]);

  // 📊 Derived data for dashboard
  const totalOrders = workOrders.length;
  const pending = workOrders.filter((o) => o.status === "Pending").length;
  const inProgress = workOrders.filter((o) => o.status === "In Progress").length;
  const completed = workOrders.filter((o) => o.status === "Completed").length;
  const totalCost = workOrders.reduce((sum, o) => sum + parseFloat(o.total || 0), 0);

  const totalMaterialsUsed = stock.reduce(
    (sum, s) => sum + parseFloat(s.quantity || 0),
    0
  );

  return (
    <ERPContext.Provider
      value={{
        workOrders,
        setWorkOrders,
        stock,
        setStock,
        totalOrders,
        pending,
        inProgress,
        completed,
        totalCost,
        totalMaterialsUsed,
      }}
    >
      {children}
    </ERPContext.Provider>
  );
};

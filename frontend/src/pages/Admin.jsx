import React, { useState } from "react";
import Dashboard from "./Dashboard";
import WorkOrders from "./WorkOrders";
import Reports from "./Reports";
import ProductionTracking from "./ProductionTracking";
import AdminUserManagement from "./AdminUserManagement";
import Sidebar from "../components/Sidebar";

const Admin = () => {
  const [page, setPage] = useState("dashboard");

  const renderPage = () => {
    switch (page) {
      case "dashboard":
        return <Dashboard />;
      case "workorders":
        return <WorkOrders />;
      case "production":
        return <ProductionTracking />;
      case "reports":
        return <Reports />;
      case "users":
        return <AdminUserManagement />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div>
      <Sidebar setPage={setPage} />
  <div className="ml-64 h-screen overflow-auto p-6 no-scrollbar">{renderPage()}</div>
    </div>
  );
};

export default Admin;

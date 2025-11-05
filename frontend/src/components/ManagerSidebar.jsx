import React from "react";
import { ChartIcon, HourglassIcon, CheckIcon, UserIcon } from "./Icons";

const ManagerSidebar = ({ page, setPage, managerName, departmentName }) => {
  return (
  <div className="fixed left-0 top-0 bottom-0 w-64 bg-base-100 p-4 border-r overflow-auto no-scrollbar">
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="avatar">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-700">
            { (managerName || 'M').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() }
          </div>
        </div>
        <div className="text-lg font-semibold">{managerName || "Manager"}</div>
        {departmentName && <div className="text-sm text-gray-500">{departmentName}</div>}
      </div>
      <ul className="menu space-y-2">
        <li>
          <button className={`btn btn-ghost justify-start w-full ${page === "dashboard" ? "font-semibold neon-accent" : ""}`} onClick={() => setPage("dashboard")}><UserIcon/>Dashboard</button>
        </li>
        <li>
          <button className={`btn btn-ghost justify-start w-full ${page === "employees" ? "font-semibold neon-accent" : ""}`} onClick={() => setPage("employees")}><UserIcon/>Manage Employees</button>
        </li>
        <li>
          <button className={`btn btn-ghost justify-start w-full ${page === "remaining" ? "font-semibold neon-accent" : ""}`} onClick={() => setPage("remaining")}><HourglassIcon/>Remaining</button>
        </li>
        <li>
          <button className={`btn btn-ghost justify-start w-full ${page === "completed" ? "font-semibold neon-accent" : ""}`} onClick={() => setPage("completed")}><CheckIcon/>Completed</button>
        </li>
      </ul>
    </div>
  );
};

export default ManagerSidebar;

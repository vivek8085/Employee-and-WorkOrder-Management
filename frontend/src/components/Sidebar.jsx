import React from 'react';
import { ChartIcon, ClipboardIcon, FactoryIcon, UserIcon, HourglassIcon } from './Icons';

const Sidebar = ({ setPage }) => {
  return (
  <div className="fixed left-0 top-0 bottom-0 w-64 bg-base-100 p-4 border-r overflow-auto no-scrollbar">
      {/* Profile block */}
      <div className="flex flex-col items-center gap-2 mb-6">
        <div className="avatar">
          <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-semibold text-gray-700">
            { (JSON.parse(localStorage.getItem('user') || 'null')?.name || 'A').split(' ').map(s=>s[0]).slice(0,2).join('').toUpperCase() }
          </div>
        </div>
        <div className="text-lg font-semibold">{JSON.parse(localStorage.getItem('user') || 'null')?.name || 'Admin'}</div>
        <div className="text-sm text-gray-500">{JSON.parse(localStorage.getItem('user') || 'null')?.role || ''}</div>
      </div>
      <ul className="menu space-y-2">
        <li><button onClick={() => setPage("dashboard")}><FactoryIcon/> Dashboard</button></li>
        <li><button onClick={() => setPage("workorders")}><ClipboardIcon/> Work Orders</button></li>
        <li><button onClick={() => setPage("production")}><HourglassIcon/> Production</button></li>
        <li><button onClick={() => setPage("reports")}><ChartIcon/> Reports</button></li>
        <li><button onClick={() => setPage("users")}><UserIcon/> Manage Users</button></li>
      </ul>
    </div>
  );
};
export default Sidebar;

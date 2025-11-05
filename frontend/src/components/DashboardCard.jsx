import React from "react";

const DashboardCard = ({ title, desc, color, onClick }) => (
  <div
    onClick={onClick}
    className={`card bg-${color} backdrop-blur-md cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg`}
  >
    <div className="card-body">
      <h2 className="card-title">{title}</h2>
      <p className="text-sm">{desc}</p>
    </div>
  </div>
);

export default DashboardCard;

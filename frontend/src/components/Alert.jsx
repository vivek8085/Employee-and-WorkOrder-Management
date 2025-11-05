import React, { useContext } from "react";
import { AlertContext } from "../context/AlertContext";

const Alert = () => {
  const { alerts, removeAlert } = useContext(AlertContext);

  return (
    <div className="fixed right-4 top-16 z-50 space-y-2 w-96">
      {alerts.map((a) => (
        <div key={a.id} className={`alert shadow-lg ${a.type === 'success' ? 'alert-success' : a.type === 'error' ? 'alert-error' : 'alert-info'}`}>
          <div className="flex-1">
            <label>{a.message}</label>
          </div>
          <div className="flex-none">
            <button className="btn btn-ghost btn-sm" onClick={() => removeAlert(a.id)}>Dismiss</button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Alert;

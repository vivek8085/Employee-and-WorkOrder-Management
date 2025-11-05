import React, { createContext, useState, useCallback } from "react";

export const AlertContext = createContext();

export const AlertProvider = ({ children }) => {
  const [alerts, setAlerts] = useState([]);

  const showAlert = useCallback((type, message, timeout = 4000) => {
    const id = Date.now() + Math.random();
    setAlerts((a) => [...a, { id, type, message }]);
    if (timeout > 0) {
      setTimeout(() => {
        setAlerts((a) => a.filter((al) => al.id !== id));
      }, timeout);
    }
    return id;
  }, []);

  const removeAlert = useCallback((id) => {
    setAlerts((a) => a.filter((al) => al.id !== id));
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, showAlert, removeAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

import React, { useEffect, useState, useContext } from "react";
import { ThemeContext } from "./context/ThemeContext";
import Admin from "./pages/Admin";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ManagerDashboard from "./pages/ManagerDashboard";
import Login from "./pages/Login";
import Navbar from "./components/Navbar";

const App = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  if (!user) return <Login setUser={setUser} />;

  const { role } = user;

  const renderDashboard = () => {
    switch (role) {
      case "admin":
        return <Admin />;
      case "manager":
        return <ManagerDashboard />;
      case "employee":
        return <EmployeeDashboard />;
      default:
        return <EmployeeDashboard />;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-base-200">
      <Navbar user={user} onLogout={handleLogout} />
      {renderDashboard()}
    </div>
  );
};

export default App;

function ThemeToggle() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  return (
    <button onClick={toggleTheme} aria-label="Toggle theme" className="btn btn-sm btn-ghost" title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}>
      {theme === 'dark' ? (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      ) : (
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 4V2M12 22v-2M4.93 4.93L3.51 3.51M20.49 20.49l-1.42-1.42M4 12H2M22 12h-2M4.93 19.07l-1.42 1.42M20.49 3.51l-1.42 1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
      )}
    </button>
  );
}

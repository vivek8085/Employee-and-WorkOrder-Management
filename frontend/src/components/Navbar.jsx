import React, { useContext } from "react";
import { ThemeContext } from "../context/ThemeContext";

const Navbar = ({ user, onLogout }) => {
  const name = user?.name || 'Guest';
  const role = user?.role || '';
  // try to find a photo URL on user object, otherwise use initials avatar
  const photo = user?.photo || null;

  const initials = (name || '')
    .split(' ')
    .map(s => s[0])
    .slice(0,2)
    .join('')
    .toUpperCase();

  return (
    <div className="navbar bg-base-100 shadow-md hover-card">
      <div className="w-full flex items-center justify-between pl-0 md:pl-64 pr-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center">
            <svg className="w-6 h-6 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 21h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 16V8l-6-3-4 2-6-3v12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 13v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M11 11v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
          <div className="text-xl font-bold neon text-base-content">Factory ERP</div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <button onClick={onLogout} className="btn btn-sm btn-error">
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;

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

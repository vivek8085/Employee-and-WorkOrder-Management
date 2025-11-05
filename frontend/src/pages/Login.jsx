import React, { useState, useContext } from "react";
import { AlertContext } from "../context/AlertContext";
import { LockIcon } from "../components/Icons";

const Login = ({ setUser }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const { showAlert } = useContext(AlertContext);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
        try { showAlert('success', 'Logged in successfully'); } catch(e) {}
      } else {
        setError(data.error);
        try { showAlert('error', data.error || 'Login failed'); } catch(e) {}
      }
    } catch {
      setError("Login failed. Try again.");
      try { showAlert('error', 'Login failed. Try again.'); } catch(e) {}
    }
  };

  return (
    <div className="flex items-center justify-center h-screen bg-base-200">
      <div className="card w-96 bg-base-100 shadow-xl p-6">
  <h2 className="text-xl font-bold mb-4 text-center"><LockIcon className="w-5 h-5 mr-2 inline"/>ERP Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="input input-bordered w-full mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="input input-bordered w-full mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button className="btn btn-primary w-full">Login</button>
        </form>
        {error && <p className="text-error mt-3 text-center">{error}</p>}
      </div>
    </div>
  );
};

export default Login;

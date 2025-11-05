import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { ERPProvider } from "./context/ERPContext";
import { AlertProvider } from "./context/AlertContext";
import Alert from "./components/Alert";
import { ThemeProvider } from "./context/ThemeContext";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider>
      <ERPProvider>
        <AlertProvider>
          <App />
          <Alert />
        </AlertProvider>
      </ERPProvider>
    </ThemeProvider>
  </React.StrictMode>
);

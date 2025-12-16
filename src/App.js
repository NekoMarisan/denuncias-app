import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AlertasPanico from "./pages/AlertasPanico";
import Usuarios from "./pages/Usuarios";
import Denuncias from "./pages/Denuncias";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/alertas-panico" element={<AlertasPanico />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route path="/denuncias" element={<Denuncias />} />
        <Route path="*" element={<Login />} />
      </Routes>
    </Router>
  );
}

export default App;

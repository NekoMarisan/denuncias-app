import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import AlertasPanico from "./pages/AlertasPanico";
import Usuarios from "./pages/Usuarios";

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Login />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/alertas-panico" element={<AlertasPanico />} />  
                <Route path="/usuarios" element={<Usuarios />} />
            </Routes>
        </Router>
    );
}

export default App;

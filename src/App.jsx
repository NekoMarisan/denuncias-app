import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import GestionAlertas from "./pages/GestionAlertas";
import CentroDespacho from "./pages/CentroDespacho";
import Tabulacion from "./pages/Tabulacion";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
};


function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/dashboard"
        element={
<ProtectedRoute
  allowedRoles={[
    "admin",
    "operador",
    "despachador",
    "tabulador"
  ]}
>
            <Layout>
              <Dashboard />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/gestion-alertas"
        element={
          <ProtectedRoute allowedRoles={["admin", "operador"]}>
            <Layout>
              <GestionAlertas />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/centro-despacho"
        element={
          <ProtectedRoute allowedRoles={["admin", "despachador"]}>
            <Layout>
              <CentroDespacho />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/tabulacion"
        element={
          <ProtectedRoute allowedRoles={["admin", "tabulador"]}>
            <Layout>
              <Tabulacion />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/usuarios"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <Usuarios />
            </Layout>
          </ProtectedRoute>
        }
      />

      

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </Router>
  );
}

export default App;
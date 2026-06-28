import React, { useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastProvider, useToast } from "./context/ToastContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Usuarios from "./pages/Usuarios";
import GestionAlertas from "./pages/GestionAlertas";
import CentroDespacho from "./pages/CentroDespacho";
import Tabulacion from "./pages/Tabulacion";
import ActividadLog from "./pages/ActividadLog";
import Reporte from "./pages/Reporte";

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  const { user, logout, sessionStart, DURACION_SESION_MS } = useAuth();

  if (!user) return <Navigate to="/" replace />;

  if (sessionStart) {
    const tiempoTranscurrido = Date.now() - parseInt(sessionStart, 10);
    if (tiempoTranscurrido >= DURACION_SESION_MS) {
      logout("expiracion");
      return <Navigate to="/" replace />;
    }
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  const { showToast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    const handler = (e) => {
      const { motivo } = e.detail;
      if (motivo === "fuera_de_servicio") {
        showToast("Su cuenta está fuera de servicio temporalmente.", "error");
      } else if (motivo === "de_baja") {
        showToast("Su cuenta ha sido dada de baja. Ya no tiene acceso.", "error");
      }
    };
    window.addEventListener("sesion_bloqueada", handler);
    return () => window.removeEventListener("sesion_bloqueada", handler);
  }, []);

  return (
    <Routes>
      <Route path="/" element={<Login />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["admin", "operador", "despachador", "tabulador"]}>
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

      <Route
        path="/actividad-log"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Layout>
              <ActividadLog />
            </Layout>
          </ProtectedRoute>
        }
      />

<Route path="/reporte" element={<Reporte />} />

      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <ToastProvider>
          <AppRoutes />
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
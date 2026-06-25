import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children }) => {
  const { user, logout, sessionStart, DURACION_SESION_MS } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (sessionStart) {
    const tiempoTranscurrido = Date.now() - parseInt(sessionStart, 10);
    if (tiempoTranscurrido >= DURACION_SESION_MS) {
      logout("expiracion");
      return <Navigate to="/" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
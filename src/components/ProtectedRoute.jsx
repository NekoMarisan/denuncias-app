import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, module }) => {
  const { user, hasAccess } = useAuth();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (module && !hasAccess(module)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default ProtectedRoute;
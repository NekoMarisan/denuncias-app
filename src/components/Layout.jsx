import React, { useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaBell,
  FaUsers,
  FaSignOutAlt,
  FaCarSide,
  FaFileAlt,
  FaChevronLeft,
  FaHistory,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [verTodoState, setVerTodoState] = React.useState(false);

  useEffect(() => {
    const handler = () => setVerTodoState(!!window.__tabulacionVerTodo);
    window.addEventListener("tabulacion_view_change", handler);
    return () => window.removeEventListener("tabulacion_view_change", handler);
  }, []);

  useEffect(() => {
    const handler = () => {
      showToast(
        "Tu sesión expirará en 2 minutos. Guarda tu proceso de gestión.",
        "warning",
      );
    };
    window.addEventListener("sesion_por_expirar", handler);
    return () => window.removeEventListener("sesion_por_expirar", handler);
  }, [showToast]);

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "DASHBOARD PRINCIPAL";
    if (path === "/gestion-alertas") return "GESTIÓN DE ALERTAS";
    if (path === "/centro-despacho") return "CENTRO DE DESPACHO TÁCTICO";
    if (path === "/tabulacion")
      return verTodoState ? "ARCHIVO HISTÓRICO" : "TABULACIÓN Y ESTADÍSTICAS";
    if (path === "/usuarios") return "GESTIÓN INTEGRAL DE USUARIOS";
    if (path === "/actividad-log") return "REGISTRO DE ACTIVIDAD";
    if (path === "/archivo-historico") return "ARCHIVO HISTÓRICO";
    return "SISTEMA POLICIAL";
  };

  const shouldShowBackButton = () => location.pathname !== "/dashboard";
  const getBackTarget = () => {
    if (location.pathname === "/tabulacion" && window.__tabulacionVerTodo)
      return null;
    return "/dashboard";
  };

  // Determinar si el usuario es administrador
  const esAdmin = user?.rol === "admin";

  return (
    <div className="flex min-h-screen bg-[#f4f7f6] font-sans">
      {/* SIDEBAR */}
      <aside className="w-[13.9rem] bg-[#113e27] text-white flex flex-col fixed h-full shadow-xl z-30">
        <div className="mt-4 flex flex-col items-center justify-center p-4">
          <span className="text-[12px] font-bold tracking-wider uppercase opacity-90 text-center leading-tight">
            Sistema Policial
          </span>
          <img src="/logo_of.png" alt="Logo" className="mt-6 w-24 h-24 mb-1" />
        </div>

        <div className="border-b border-white/10 my-4 mx-4"></div>

        <nav className="mt-1 flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Dashboard visible para todos los roles autorizados */}
          {["admin", "operador", "despachador", "tabulador"].includes(
            user?.rol,
          ) && (
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm tracking-wider ${
                location.pathname === "/dashboard"
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              }`}
            >
              <FaHome className="text-base" size={12} />
              <span className="font-semibold">Inicio</span>
            </Link>
          )}

          {/* Alertas: solo para operador (admin ya no lo ve) */}
          {!esAdmin && user?.rol === "operador" && (
            <Link
              to="/gestion-alertas"
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm tracking-wider ${
                location.pathname === "/gestion-alertas"
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              }`}
            >
              <FaBell className="text-base" size={12} />
              <span className="font-semibold">Alertas</span>
            </Link>
          )}

          {/* Despacho: solo para despachador (admin ya no lo ve) */}
          {!esAdmin && user?.rol === "despachador" && (
            <Link
              to="/centro-despacho"
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm tracking-wider ${
                location.pathname === "/centro-despacho"
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              }`}
            >
              <FaCarSide className="text-base" size={12} />
              <span className="font-semibold">Despacho</span>
            </Link>
          )}

          {/* Tabulación: solo para tabulador (admin ya no lo ve) */}
          {!esAdmin && user?.rol === "tabulador" && (
            <Link
              to="/tabulacion"
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm tracking-wider ${
                location.pathname === "/tabulacion"
                  ? "bg-white/20"
                  : "hover:bg-white/10"
              }`}
            >
              <FaFileAlt className="text-base" size={12} />
              <span className="font-semibold">Tabulación</span>
            </Link>
          )}

          {/* Usuarios y Actividad Log: solo admin */}
          {esAdmin && (
            <>
              <Link
                to="/usuarios"
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm tracking-wider ${
                  location.pathname === "/usuarios"
                    ? "bg-white/20"
                    : "hover:bg-white/10"
                }`}
              >
                <FaUsers className="text-base" size={12} />
                <span className="font-semibold">Usuarios</span>
              </Link>
              <Link
                to="/actividad-log"
                className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm tracking-wider ${
                  location.pathname === "/actividad-log"
                    ? "bg-white/20"
                    : "hover:bg-white/10"
                }`}
              >
                <FaHistory className="text-base" size={12} />
                <span className="font-semibold">Actividad Log</span>
              </Link>
            </>
          )}
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              logout();
              navigate("/");
            }}
            className="w-full flex items-center gap-3 hover:bg-white-500/10 p-2.5 rounded-lg transition-all text-sm tracking-wider"
          >
            <FaSignOutAlt className="text-base" size={12} />{" "}
            <span className="font-bold">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-auto ml-56 min-h-screen flex flex-col">
        {/* HEADER */}
        <header className="bg-white h-[4.5rem] border-b border-gray-200 shadow-sm flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {shouldShowBackButton() && (
              <button
                onClick={() => {
                  if (
                    location.pathname === "/tabulacion" &&
                    window.__tabulacionVerTodo
                  ) {
                    window.__tabulacionOnBack();
                  } else {
                    navigate("/dashboard");
                  }
                }}
                className="p-2 bg-gray-50 rounded-lg text-slate-500 hover:bg-gray-100 transition-all border border-gray-100"
              >
                <FaChevronLeft size={12} />
              </button>
            )}
            <div>
              <h1 className="text-lg font-black text-slate-800 tracking-tight uppercase">
                {getHeaderTitle()}
              </h1>
              <p className="text-[9px] font-semibold text-slate-500 tracking-[0.15em] uppercase">
                Panel de Control Operativo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-gray-50/50 px-4 py-1.5 rounded-lg border border-gray-100">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-800 leading-none">
                {user?.nombre_completo || "Cargando..."}
              </p>
              <p className="text-[9px] text-[#1a4d33] font-bold uppercase mt-0.5 tracking-tighter">
                {user?.rol || "Sin Rol"}
              </p>
            </div>
            <div className="w-8 h-8 bg-[#1a4d33] rounded-full flex items-center justify-center text-white font-black border border-white shadow-md text-sm">
              {user?.nombre_completo?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        {/* CONTENIDO */}
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

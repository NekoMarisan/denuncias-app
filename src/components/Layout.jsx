import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  FaHome,
  FaBell,
  FaUsers,
  FaSignOutAlt,
  FaCarSide,
  FaFileAlt,
  FaChevronLeft,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "DASHBOARD PRINCIPAL";
    if (path === "/gestion-alertas") return "GESTIÓN DE ALERTAS";
    if (path === "/centro-despacho") return "CENTRO DE DESPACHO TÁCTICO";
    if (path === "/tabulacion") return "TABULACIÓN Y ESTADÍSTICAS";
    if (path === "/usuarios") return "GESTIÓN INTEGRAL DE USUARIOS";
    if (path === "/archivo-historico") return "ARCHIVO HISTÓRICO";
    return "SISTEMA POLICIAL";
  };

  const shouldShowBackButton = () => location.pathname !== "/dashboard";
  const getBackTarget = () =>
    location.pathname === "/archivo-historico" ? "/tabulacion" : "/dashboard";

  return (
    <div className="flex min-h-screen bg-[#f4f7f6] font-sans">
      {/* SIDEBAR */}
      <aside className="w-[13.9rem] bg-[#103b27] text-white flex flex-col fixed h-full shadow-xl z-30">
        <div className="mt-4 flex flex-col items-center justify-center p-4">
          <span className="text-[12px] font-bold tracking-wider uppercase opacity-90 text-center leading-tight">
            Sistema Policial
          </span>
          <img src="/logo_of.png" alt="Logo" className="mt-6 w-24 h-24 mb-1" />
        </div>

        <div className="border-b border-white/10 my-4 mx-4"></div>

        <nav className="mt-1 flex-1 p-4 space-y-2 overflow-y-auto">
          {["admin", "operador"].includes(user?.rol) && (
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm tracking-wider ${location.pathname === "/dashboard" ? "bg-white/20" : "hover:bg-white/10"}`}
            >
              <FaHome className="text-base" size={12} />{" "}
              <span className="font-semibold">Inicio</span>
            </Link>
          )}
          {["admin", "operador"].includes(user?.rol) && (
            <Link
              to="/gestion-alertas"
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm tracking-wider ${location.pathname === "/gestion-alertas" ? "bg-white/20" : "hover:bg-white/10"}`}
            >
              <FaBell className="text-base" size={12} />{" "}
              <span className="font-semibold">Alertas</span>
            </Link>
          )}
          {["admin", "despachador"].includes(user?.rol) && (
            <Link
              to="/centro-despacho"
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm tracking-wider ${location.pathname === "/centro-despacho" ? "bg-white/20" : "hover:bg-white/10"}`}
            >
              <FaCarSide className="text-base" size={12} />{" "}
              <span className="font-semibold">Despacho</span>
            </Link>
          )}
          {["admin", "tabulador"].includes(user?.rol) && (
            <Link
              to="/tabulacion"
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm tracking-wider ${location.pathname === "/tabulacion" ? "bg-white/20" : "hover:bg-white/10"}`}
            >
              <FaFileAlt className="text-base" size={12} />{" "}
              <span className="font-semibold">Tabulación</span>
            </Link>
          )}
          {user?.rol === "admin" && (
            <Link
              to="/usuarios"
              className={`flex items-center gap-3 p-2.5 rounded-lg transition-all text-sm tracking-wider ${location.pathname === "/usuarios" ? "bg-white/20" : "hover:bg-white/10"}`}
            >
              <FaUsers className="text-base" size={12} />{" "}
              <span className="font-semibold">Usuarios</span>
            </Link>
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
        {/* HEADER - altura reducida, padding menor */}
        <header className="bg-white h-[4.5rem] border-b border-gray-200 shadow-sm flex items-center justify-between px-6 sticky top-0 z-20">
          <div className="flex items-center gap-4">
            {shouldShowBackButton() && (
              <button
                onClick={() => navigate(getBackTarget())}
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
                {user?.nombre || "Cargando..."}
              </p>
              <p className="text-[9px] text-[#1a4d33] font-bold uppercase mt-0.5 tracking-tighter">
                {user?.rol || "Sin Rol"}
              </p>
            </div>
            <div className="w-8 h-8 bg-[#1a4d33] rounded-full flex items-center justify-center text-white font-black border border-white shadow-md text-sm">
              {user?.nombre?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        {/* CONTENIDO - padding reducido */}
        <main className="p-6 flex-1">{children}</main>
      </div>
    </div>
  );
};

export default Layout;

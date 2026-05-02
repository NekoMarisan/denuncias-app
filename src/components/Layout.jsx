import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  FaHome, FaBell, FaUsers, FaSignOutAlt, 
  FaCarSide, FaFileAlt, FaChevronLeft 
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

  // Determinar si mostrar el botón de retroceso y a dónde debe ir
  const shouldShowBackButton = () => {
    return location.pathname !== "/dashboard";
  };

  const getBackTarget = () => {
    if (location.pathname === "/archivo-historico") {
      return "/tabulacion";
    }
    return "/dashboard";
  };

  return (
    <div className="flex min-h-screen bg-[#f4f7f6] font-sans">
      {/* SIDEBAR: Se mantiene fijo a la izquierda */}
      <aside className="w-72 bg-[#1a4d33] text-white flex flex-col fixed h-full shadow-xl z-30">
        <div className="flex flex-col items-center justify-center p-8 border-b border-white/10">
          <span className="text-[14px] font-black tracking-[0.3em] uppercase opacity-90 text-center leading-tight">
            Sistema Policial
          </span>
          <img src="/logo_of.png" alt="Logo" className="mt-10 w-28 h-28 mb-2" />
        </div>

        <nav className="mt-8 flex-1 p-6 space-y-3 overflow-y-auto">
          {["admin", "operador"].includes(user?.rol) && (
            <Link to="/dashboard" className={`flex items-center gap-4 p-3.5 rounded-xl transition-all ${location.pathname === '/dashboard' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              <FaHome className="text-xl" /> <span className="text-lg font-semibold">Inicio</span>
            </Link>
          )}
          {["admin", "operador"].includes(user?.rol) && (
            <Link to="/gestion-alertas" className={`flex items-center gap-4 p-3.5 rounded-xl transition-all ${location.pathname === '/gestion-alertas' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              <FaBell className="text-xl" /> <span className="text-lg font-semibold">Alertas</span>
            </Link>
          )}
          {["admin", "despachador"].includes(user?.rol) && (
            <Link to="/centro-despacho" className={`flex items-center gap-4 p-3.5 rounded-xl transition-all ${location.pathname === '/centro-despacho' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              <FaCarSide className="text-xl" /> <span className="text-lg font-semibold">Centro de Despacho</span>
            </Link>
          )}
          {["admin", "tabulador"].includes(user?.rol) && (
            <Link to="/tabulacion" className={`flex items-center gap-4 p-3.5 rounded-xl transition-all ${location.pathname === '/tabulacion' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              <FaFileAlt className="text-xl" /> <span className="text-lg font-semibold">Tabulación</span>
            </Link>
          )}
          {user?.rol === "admin" && (
            <Link to="/usuarios" className={`flex items-center gap-4 p-3.5 rounded-xl transition-all ${location.pathname === '/usuarios' ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              <FaUsers className="text-xl" /> <span className="text-lg font-semibold">Usuarios</span>
            </Link>
          )}
        </nav>

        <div className="p-6 border-t border-white/10">
          <button onClick={() => { logout(); navigate("/"); }} className="w-full flex items-center gap-4 hover:bg-rose-500/10 p-4 rounded-xl transition-all text-rose-100">
            <FaSignOutAlt /> <span className="text-lg font-bold">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* CONTENEDOR PRINCIPAL */}
      <div className="flex-auto ml-72 min-h-screen flex flex-col px-1 w-10">
        {/* HEADER */}
        <header className="bg-white h-24 border-b border-gray-200 shadow-sm flex items-center justify-between px-10 sticky top-0 z-20 w-full">
          <div className="flex items-center gap-6">
            {/* Botón Atrás: solo se muestra si la ruta actual no es Dashboard */}
            {shouldShowBackButton() && (
              <button 
                onClick={() => navigate(getBackTarget())} 
                className="p-3 bg-gray-50 rounded-xl text-slate-500 hover:bg-gray-100 transition-all border border-gray-100"
              >
                <FaChevronLeft size={16} />
              </button>
            )}
            <div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight uppercase">{getHeaderTitle()}</h1>
              <p className="text-[11px] font-semibold text-slate-500 tracking-[0.2em] uppercase">Panel de Control Operativo</p>
            </div>
          </div>

          <div className="mt-1 flex items-center gap-4 bg-gray-50/50 px-6 py-2 rounded-lg border border-gray-100">
            <div className="text-right">
              <p className="text-sm font-bold text-slate-800 leading-none">{user?.nombre || "Cargando..."}</p>
              <p className="text-[10px] text-[#1a4d33] font-bold uppercase mt-1 tracking-tighter">{user?.rol || "Sin Rol"}</p>
            </div>
            <div className="w-11 h-11 bg-[#1a4d33] rounded-full flex items-center justify-center text-white font-black border-2 border-white shadow-md">
              {user?.nombre?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        {/* CONTENIDO DE LAS PÁGINAS */}
        <main className="p-10 flex-1">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
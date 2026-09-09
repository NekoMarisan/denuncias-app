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
  FaBars,
  FaTimes,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { supabase } from "../services/supabase";

const Layout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [verTodoState, setVerTodoState] = React.useState(false);
  const [menuAbierto, setMenuAbierto] = React.useState(false);
  const [pendientesCount, setPendientesCount] = React.useState(0);
  const [confirmarLogout, setConfirmarLogout] = React.useState(false);

  useEffect(() => {
    setMenuAbierto(false);
  }, [location.pathname]);

  useEffect(() => {
    const esAdminUser = user?.rol === "admin";
    if (!esAdminUser) return;

    const cargarPendientes = async () => {
      const { count, error } = await supabase
        .from("oficial")
        .select("id_oficial", { count: "exact", head: true })
        .eq("acceso", "PENDIENTE");
      if (!error) setPendientesCount(count || 0);
    };

    cargarPendientes();
    const interval = setInterval(cargarPendientes, 10000);
    return () => clearInterval(interval);
  }, [user?.rol]);

  useEffect(() => {
    const handler = () => setVerTodoState(!!window.__tabulacionVerTodo);
    window.addEventListener("tabulacion_view_change", handler);
    return () => window.removeEventListener("tabulacion_view_change", handler);
  }, []);

  const getHeaderTitle = () => {
    const path = location.pathname;
    if (path === "/dashboard") return "DASHBOARD PRINCIPAL";
    if (path === "/gestion-alertas") return "GESTIÓN DE ALERTAS";
    if (path === "/centro-despacho") return "CENTRO DE DESPACHO";
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

  const activeKey =
    location.pathname === "/tabulacion"
      ? verTodoState
        ? "/archivo-historico"
        : "/tabulacion"
      : location.pathname;

  // Helper para clases de los ítems de navegación (acento dorado en el activo)
  const navItemClass = (path) =>
    `group relative flex items-center gap-3 pl-4 pr-3 py-2.5 rounded-r-lg transition-all text-[13px] tracking-wide ${
      activeKey === path
        ? "bg-white/[0.08] text-white"
        : "text-white/60 hover:text-white hover:bg-white/[0.05]"
    }`;

  const activeBar = (path) => (
    <span
      className={`absolute left-0 top-1/2 -translate-y-1/2 h-8 w-[1px] rounded-full bg-[#ceaa43] transition-opacity ${
        activeKey === path ? "opacity-100" : "opacity-0"
      }`}
    />
  );

return (
    <div className="flex h-screen overflow-hidden bg-[#f6f5f1] font-sans">
      {/* Overlay oscuro solo en mobile cuando el menú está abierto */}
      {menuAbierto && (
        <div
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`w-[15rem] bg-gradient-to-b from-[#474b29] from-70% to-[#32351d] text-white flex flex-col fixed h-full z-30 transition-transform duration-300 ${
          menuAbierto ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0`}
      >
        {/* Botón cerrar (solo mobile, dentro del panel desplegado) */}
        <button
          onClick={() => setMenuAbierto(false)}
          className="absolute top-4 right-4 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-all lg:hidden"
          aria-label="Cerrar menú"
        >
          <FaChevronLeft size={14} />
        </button>

        {/* Marca */}
        <div className="flex flex-col items-center justify-center px-6 pt-8 pb-6">
          <img src="/logo_of.png" alt="Logo" className="w-20 h-20 mb-3 drop-shadow-lg" />
          <span className="mt-1 text-[11px] font-semibold tracking-[0.2em] uppercase text-white/70 text-center leading-tight">
            Sistema Policial
          </span>
          <div className="mt-3 h-px w-52 bg-[#ceaa43]/60" />
        </div>

        {/* Navegación */}
        <nav className="mt-2 flex-1 px-3 space-y-1 overflow-y-auto">
          {["admin", "operador", "despachador", "tabulador"].includes(
            user?.rol,
          ) && (
            <Link to="/dashboard" className={navItemClass("/dashboard")}>
              {activeBar("/dashboard")}
              <FaHome size={13} />
              <span className="font-medium">Dashboard</span>
            </Link>
          )}

          {!esAdmin && user?.rol === "operador" && (
            <Link to="/gestion-alertas" className={navItemClass("/gestion-alertas")}>
              {activeBar("/gestion-alertas")}
              <FaBell size={13} />
              <span className="font-medium">Alertas</span>
            </Link>
          )}

          {!esAdmin && user?.rol === "despachador" && (
            <Link to="/centro-despacho" className={navItemClass("/centro-despacho")}>
              {activeBar("/centro-despacho")}
              <FaCarSide size={13} />
              <span className="font-medium">Despacho</span>
            </Link>
          )}

          {!esAdmin && user?.rol === "tabulador" && (
            <>
              <Link
                to="/tabulacion"
                onClick={(e) => {
                  if (
                    location.pathname === "/tabulacion" &&
                    window.__tabulacionVerTodo
                  ) {
                    e.preventDefault();
                    window.__tabulacionOnBack();
                  }
                }}
                className={navItemClass("/tabulacion")}
              >
                {activeBar("/tabulacion")}
                <FaFileAlt size={13} />
                <span className="font-medium">Tabulación</span>
              </Link>
              <Link to="/tabulacion" state={{ verTodo: true }} className={navItemClass("/archivo-historico")}>
                {activeBar("/archivo-historico")}
                <FaHistory size={13} />
                <span className="font-medium">Archivo Histórico</span>
              </Link>
            </>
          )}

{esAdmin && (
            <>
              <Link to="/usuarios" className={navItemClass("/usuarios")}>
                {activeBar("/usuarios")}
                <FaUsers size={13} />
                <span className="font-medium">Usuarios</span>
                {pendientesCount > 0 && (
<span className="ml-auto flex items-center justify-center min-w-[16px] h-[16px] px-1 rounded-full bg-[#EBB615] shrink-0">
  <span className="-mt-0.5 text-white text-[10px] font-bold">
    {pendientesCount}
  </span>
</span>
                )}
              </Link>
              <Link to="/actividad-log" className={navItemClass("/actividad-log")}>
                {activeBar("/actividad-log")}
                <FaHistory size={13} />
                <span className="font-medium">Actividad Log</span>
              </Link>
            </>
          )}
        </nav>

        {/* Usuario + logout */}
<div className="px-4 py-4 border-t border-white/10">
          <div className="flex items-center gap-2.5 px-2 py-2 mb-2 rounded-lg bg-white/[0.04]">
            <div className="w-8 h-8 rounded-full bg-[#c9a227]/90 flex items-center justify-center text-[#1b1d13] font-black text-sm shrink-0">
              {user?.nombre_completo?.charAt(0) || "U"}
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-[11.5px] font-semibold text-white truncate leading-tight">
                {user?.nombre_completo || "Cargando..."}
              </span>
              <span className="text-[9.5px] font-semibold text-white/50 uppercase tracking-wider leading-tight mt-0.5">
                {{ admin: "Administrador", operador: "Operador", despachador: "Despachador", tabulador: "Tabulador" }[user?.rol] || "Sin Rol"}
              </span>
            </div>
          </div>
<button
            onClick={() => setConfirmarLogout(true)}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-lg text-orange/60 hover:text-white hover:bg-white/[0.06] transition-all text-[13px] tracking-wide"
          >
            <FaSignOutAlt size={13} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

{/* CONTENEDOR PRINCIPAL */}
      <div className="flex-auto h-screen overflow-hidden flex flex-col lg:ml-[15rem]">
        {/* HEADER */}
        <header className="bg-white/80 backdrop-blur-sm h-16 sm:h-[4.5rem] border-b border-gray-200/70 flex items-center justify-between gap-2 px-3 sm:px-7 sticky top-0 z-20">
          <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
            <button
              onClick={() => setMenuAbierto(true)}
              className="p-2 bg-[#474b29] rounded-lg text-white hover:bg-[#32351d] transition-all shadow-sm shrink-0 lg:hidden"
              aria-label="Abrir menú"
            >
              <FaBars size={14} />
            </button>
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
                className="hidden lg:flex p-2 bg-white rounded-lg text-slate-400 hover:text-[#474b29] hover:bg-gray-50 transition-all border border-gray-200 shadow-sm shrink-0"
                aria-label="Volver"
              >
                <FaChevronLeft size={12} />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="text-[12px] sm:text-[17px] font-bold text-slate-800 tracking-tight uppercase truncate">
                {getHeaderTitle()}
              </h1>
              <p className="text-[7px] sm:text-[9px] font-semibold text-slate-400 tracking-[0.15em] sm:tracking-[0.2em] uppercase mt-0.5 truncate">
                Panel de Control Operativo
              </p>
            </div>
          </div>

         <div className="flex items-center gap-2 sm:gap-3 shrink-0 pl-2 pr-1 py-1 sm:pl-4 sm:pr-1.5 sm:py-1.5 rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="text-right">
              <p className="text-[10px] sm:text-xs font-bold text-slate-800 leading-none truncate max-w-[110px] sm:max-w-none">
                {user?.nombre_completo || "Cargando..."}
              </p>
              <p className="text-[7px] sm:text-[9px] text-[#474b29] font-bold uppercase mt-1 tracking-wider">
                {{ admin: "Administrador", operador: "Operador", despachador: "Despachador", tabulador: "Tabulador" }[user?.rol] || "Sin Rol"}
              </p>
            </div>
            <div className="w-8 h-8 bg-[#474b29] rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0">
              {user?.nombre_completo?.charAt(0) || "U"}
            </div>
          </div>
        </header>

{/* CONTENIDO */}
        <main className="p-6 flex-1 min-h-0 overflow-hidden">{children}</main>
      </div>

      {/* MODAL CONFIRMAR CIERRE DE SESIÓN — mismo estilo que el modal de eliminar en Usuarios.jsx */}
      {confirmarLogout && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <style>
            {`
              @keyframes overlayFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes modalPopIn {
                from { opacity: 0; transform: scale(0.94) translateY(16px); }
                to { opacity: 1; transform: scale(1) translateY(0); }
              }
            `}
          </style>
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-[overlayFadeIn_0.25s_ease-out]" />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-[380px] mx-auto overflow-hidden flex flex-col animate-[modalPopIn_0.35s_cubic-bezier(0.16,1,0.3,1)]">
            {/* Barra verde */}
            <div className="bg-[#474b29] py-4 px-5 sm:px-6 text-white shrink-0">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 p-2 rounded-md flex items-center justify-center shrink-0">
                    <FaSignOutAlt className="text-white" size={18} />
                  </div>
                  <h2 className="text-[15px] font-bold uppercase tracking-wider leading-none">
                    Cerrar Sesión
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setConfirmarLogout(false)}
                  className="hover:bg-white/20 p-1.5 rounded-md transition-colors shrink-0"
                >
                  <FaTimes size={15} />
                </button>
              </div>
            </div>

            <div className="px-7 py-7 flex flex-col items-center justify-center text-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#474b29]/10 flex items-center justify-center">
                <FaSignOutAlt className="text-[#474b29]" size={22} />
              </div>

              <div className="flex flex-col gap-1.5 mb-2">
                <h2 className="text-[16px] font-semibold text-slate-700 uppercase tracking-wider">
                  ¿Cerrar sesión?
                </h2>
<p className="text-[12px] text-slate-400 font-medium leading-snug max-w-[340px] tracking-wider mt-1">
  Deberá ingresar nuevamente su número de escalafón y contraseña para acceder al sistema.
</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 pb-6 flex justify-end gap-4 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0 -mb-2">
              <button
                onClick={() => setConfirmarLogout(false)}
                className="px-4 py-2.5 rounded-lg font-medium text-[11.5px] border uppercase border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors tracking-wider"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  setConfirmarLogout(false);
                  logout();
                  navigate("/");
                }}
                className="px-4 py-2.5 rounded-lg font-medium text-[11.5px] bg-[#474b29] uppercase hover:bg-[#3a3e21] text-white transition-colors tracking-wider flex items-center justify-center gap-2"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
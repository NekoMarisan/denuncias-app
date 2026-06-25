import React, { useState, useEffect, useCallback } from "react";
import {
  FaSearch,
  FaFileDownload,
  FaFileExcel,
  FaFilePdf,
  FaCalendarAlt,
} from "react-icons/fa";
import { supabase } from "../services/supabase";
import { useToast } from "../context/ToastContext";

// Mapeo solo para acciones especiales (las que no son roles)
const accionMeta = {
  DERIVO: "Derivó",
  CONSULTO: "Consultó",
  VIO: "Vio",
  RECIBIO_INFORME: "Recibió Informe",
  ENVIO_ALERTA_DESPACHO: "Envió Alerta a Despacho",
  ENVIO_ALERTA_TABULADOR: "Envió Alerta a Tabulador",
  OPERADOR: "Operador",
  ADMINISTRADOR: "Administrador",
  SESION: "Sesión",
  REPORTE: "Exportación",
  DESPACHO: "Despacho",
  ASIGNACION: "Asignación",
  "TABULACIÓN": "Tabulación",
};

const ActividadLog = () => {
  const { showToast } = useToast();
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroAccion, setFiltroAccion] = useState("todas");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [fecha, setFecha] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [accionesUnicas, setAccionesUnicas] = useState([]);
  const [rolesUnicos, setRolesUnicos] = useState([]);
  const itemsPorPagina = 10;

  const cargarLogs = useCallback(async () => {
    setCargando(true);
    try {
      let query = supabase
        .from("log_actividad")
        .select(
          "id_actividad, accion, descripcion, fecha_hora, id_oficial, id_alerta",
          { count: "exact" }
        )
        .order("fecha_hora", { ascending: false });

      // Filtro por acción
      if (filtroAccion !== "todas") {
        query = query.eq("accion", filtroAccion);
      }

      // BÚSQUEDA MEJORADA: incluye nombre del oficial
      if (busqueda.trim()) {
        // 1. Buscar oficiales cuyo nombre coincida con la búsqueda
        const { data: oficialesCoincidentes, error: errBusqueda } = await supabase
          .from("oficial")
          .select("id_oficial")
          .ilike("nombre_completo", `%${busqueda}%`);
        
        if (errBusqueda) {
          console.error("Error buscando oficiales:", errBusqueda);
        }

        const idsOficialesCoincidentes = (oficialesCoincidentes || []).map(o => o.id_oficial);

        if (idsOficialesCoincidentes.length > 0) {
          query = query.or(
            `accion.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%,id_oficial.in.(${idsOficialesCoincidentes.join(",")})`
          );
        } else {
          query = query.or(
            `accion.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%`
          );
        }
      }

      // Filtro por fecha
      if (fecha) {
        query = query
          .gte("fecha_hora", `${fecha}T00:00:00`)
          .lte("fecha_hora", `${fecha}T23:59:59`);
      }

      const from = (paginaActual - 1) * itemsPorPagina;
      const to = from + itemsPorPagina - 1;
      const { data: logsRaw, count, error: errLogs } = await query.range(from, to);
      if (errLogs) throw errLogs;

      const idsOficiales = [
        ...new Set((logsRaw || []).map((l) => l.id_oficial).filter(Boolean)),
      ];
      let oficialesMap = {};
      if (idsOficiales.length > 0) {
        const { data: oficiales, error: errOf } = await supabase
          .from("oficial")
          .select("id_oficial, nombre_completo, rol")
          .in("id_oficial", idsOficiales);
        if (errOf) throw errOf;
        (oficiales || []).forEach((o) => {
          oficialesMap[o.id_oficial] = o;
        });
      }

      let logsConRol = (logsRaw || []).map((item) => ({
        id: item.id_actividad,
        usuario_nombre:
          oficialesMap[item.id_oficial]?.nombre_completo || "Desconocido",
        usuario_rol: oficialesMap[item.id_oficial]?.rol || "",
        accion: item.accion || "—",
        descripcion: item.descripcion || "",
        id_alerta: item.id_alerta,
        fecha: item.fecha_hora,
      }));

      if (filtroRol !== "todos") {
        logsConRol = logsConRol.filter((log) => log.usuario_rol === filtroRol);
      }

      setLogs(logsConRol);
      setTotalPaginas(Math.ceil((count || 0) / itemsPorPagina));

      if (accionesUnicas.length === 0) {
        const { data: accionesData, error: accErr } = await supabase
          .from("log_actividad")
          .select("accion");
        if (!accErr && accionesData) {
          const acciones = [
            ...new Set(accionesData.map((a) => a.accion).filter(Boolean)),
          ];
          setAccionesUnicas(acciones);
        }
      }

      if (rolesUnicos.length === 0) {
        const { data: rolesData, error: rolesErr } = await supabase
          .from("oficial")
          .select("rol");
        if (!rolesErr && rolesData) {
          const roles = [
            ...new Set(rolesData.map((r) => r.rol).filter(Boolean)),
          ];
          setRolesUnicos(roles);
        }
      }
    } catch (error) {
      console.error("ActividadLog error:", error?.message || error);
      showToast(`Error: ${error?.message || "al cargar actividades"}`, "error");
    } finally {
      setCargando(false);
    }
  }, [
    filtroAccion,
    filtroRol,
    busqueda,
    fecha,
    paginaActual,
    showToast,
    accionesUnicas.length,
    rolesUnicos.length,
  ]);

  useEffect(() => {
    cargarLogs();
  }, [cargarLogs]);

  useEffect(() => {
    const canal = supabase
      .channel("log-actividad-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "log_actividad" },
        () => cargarLogs()
      )
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [cargarLogs]);

  const limpiarFiltros = () => {
    setFiltroAccion("todas");
    setFiltroRol("todos");
    setBusqueda("");
    setFecha("");
    setPaginaActual(1);
  };

  const formatFecha = (fechaISO) => {
    if (!fechaISO) return "—";
    const fechaUTC = fechaISO.endsWith("Z") ? fechaISO : fechaISO + "Z";
    return new Date(fechaUTC).toLocaleString("es-BO", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "America/La_Paz",
    });
  };

  const exportarExcel = () => {
    showToast("Funcionalidad de exportación en desarrollo", "info");
  };
  const exportarPDF = () => {
    showToast("Funcionalidad de exportación en desarrollo", "info");
  };

  return (
    <div className="-mt-4 w-full px-1 py-4 space-y-5 animate-fadeIn pb-6 bg-slate-50/30">
      {/* ENCABEZADO CON FILTROS */}
      <div className="w-full bg-white p-3 rounded-2xl shadow-md border border-slate-100">
        <div className="flex flex-wrap items-center gap-3">
          {/* Búsqueda */}
          <div className="relative flex-1 min-w-[200px]">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, acción o descripción..."
              className="w-full h-10 pl-8 pr-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none text-[11px] font-bold text-slate-400 transition-all focus:bg-white focus:border-slate-400"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* Filtro de acción */}
          <div className="relative inline-block">
            <select
              value={filtroAccion}
              onChange={(e) => setFiltroAccion(e.target.value)}
              className={`appearance-none text-left px-3 py-2.5 pr-8 rounded-lg text-[11px] font-bold uppercase outline-none transition-all cursor-pointer border ${
                filtroAccion !== "todas"
                  ? "bg-[#113e27] text-white border-[#113e27]"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              <option value="todas" className="bg-white text-slate-600">
                TODAS LAS ACCIONES
              </option>
              {accionesUnicas.map((acc) => (
                <option
                  key={acc}
                  value={acc}
                  className="bg-white text-slate-700"
                >
                  {accionMeta[acc] || acc}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg
                className={`w-3 h-3 ${filtroAccion !== "todas" ? "text-white" : "text-slate-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>

          {/* Filtro de rol */}
          <div className="relative inline-block">
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className={`appearance-none px-3 py-2.5 rounded-lg text-[11px] font-bold uppercase outline-none transition-all cursor-pointer border pr-8 ${
                filtroRol !== "todos"
                  ? "bg-[#113e27] text-white border-[#113e27]"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              <option value="todos" className="bg-white text-slate-600">
                TODOS LOS ROLES
              </option>
              {rolesUnicos.map((rol) => (
                <option
                  key={rol}
                  value={rol}
                  className="bg-white text-slate-700"
                >
                  {rol}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-2 flex items-center">
              <svg
                className={`w-3 h-3 ${filtroRol !== "todos" ? "text-white" : "text-slate-400"}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 9l-7 7-7-7"
                ></path>
              </svg>
            </div>
          </div>

          {/* Filtro de fecha */}
          <div className="relative">
            <FaCalendarAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className={`pl-8 pr-3 py-2.5 bg-gray-50 border rounded-lg text-[11px] font-bold outline-none focus:bg-white transition-all ${
                fecha
                  ? "border-[#113e27] text-[#113e27]"
                  : "border-gray-200 text-slate-600 hover:border-slate-300"
              }`}
            />
          </div>

          {/* Botón limpiar */}
          <button
            onClick={limpiarFiltros}
            className="px-3 py-2.5 bg-[#113e27] hover:bg-[#164a2f] text-white rounded-md text-[11px] font-bold uppercase tracking-wider transition-all shadow-sm"
          >
            Limpiar
          </button>

          {/* Exportaciones */}
          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2.5 bg-white border-2 border-gray-200 text-slate-700 rounded-lg font-bold uppercase text-[11px] hover:border-slate-300 transition-all">
              <FaFileDownload size={11} /> <span>Exportar</span>
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={exportarExcel}
                className="w-full px-3 py-2 text-left hover:bg-green-50 text-slate-600 font-bold text-[10px] flex items-center gap-2"
              >
                <FaFileExcel className="text-green-700" size={11} /> Excel
                (.xls)
              </button>
              <button
                onClick={exportarPDF}
                className="w-full px-3 py-2 text-left hover:bg-red-50 text-slate-700 font-bold text-[10px] flex items-center gap-2"
              >
                <FaFilePdf className="text-red-700" size={11} /> Guardar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla de logs */}
      <div className="w-full bg-white rounded-2xl shadow-md border border-gray-50 overflow-hidden !mt-7">
        <div className="relative w-full bg-white px-4 md:px-7 py-4 md:py-6 flex flex-col max-h-[76vh] min-h-0">
          <h2 className="text-lg font-extrabold uppercase text-[#1e293b] mb-4 md:mb-6 tracking-wider flex-shrink-0">
            Historial de Acciones
          </h2>

          <div className="overflow-auto flex-1 min-h-0 -mx-4 md:mx-0 px-4 md:px-0">
            <table className="min-w-full border-collapse text-left">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                  <th className="py-2 w-[28%] md:w-[30%]">OFICIAL</th>
                  <th className="py-2 w-[10%] md:w-[15%]">ACCIÓN</th>
                  <th className="py-2 w-[20%] md:w-[30%]">DESCRIPCIÓN</th>
                  <th className="py-2 w-[10%]">ALERTA</th>
                  <th className="py-2 w-[15%]">FECHA / HORA</th>
                </tr>
              </thead>
              <tbody>
                {cargando ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-400 font-medium">
                      Cargando registros...
                    </td>
                  </tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-400 font-medium">
                      No se encontraron actividades
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr
                      key={log.id}
                      className="bg-white group transition-all duration-200 border-b border-slate-100 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-8 rounded-md flex items-center justify-center font-black text-xs shadow-inner shrink-0 bg-blue-50 text-[#0C3DC2]">
                            {log.usuario_nombre?.charAt(0) || "U"}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-bold text-[#1e293b] truncate max-w-[120px] md:max-w-none">
                              {log.usuario_nombre}
                            </span>
                            <span className="mt-0.5 text-[8px] text-gray-400 font-semibold uppercase tracking-wider">
                              {log.usuario_rol}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 align-middle">
                        <span className="inline-block px-2 py-1 rounded-md bg-[#113e27]/10 text-[#113e27] text-[10px] font-black uppercase tracking-wide">
                          {accionMeta[log.accion] || log.accion}
                        </span>
                      </td>
                      <td className="py-4 text-[11px] font-medium text-slate-600 align-middle max-w-[250px] tracking-wide">
                        <span className="line-clamp-2">
                          {log.descripcion || "—"}
                        </span>
                      </td>
                      <td className="py-4 text-[11px] font-mono text-slate-500 align-middle tracking-wider">
                        {log.id_alerta ? `#${log.id_alerta}` : "—"}
                      </td>
                      <td className="py-4 text-[11px] font-mono text-slate-500 whitespace-nowrap align-middle tracking-wider">
                        {formatFecha(log.fecha)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/30 mt-4">
              <button
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-lg text-xs font-bold uppercase disabled:opacity-40 hover:bg-gray-100 transition"
              >
                Anterior
              </button>
              <span className="text-xs text-slate-500 font-medium">
                Página {paginaActual} de {totalPaginas}
              </span>
              <button
                onClick={() =>
                  setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                }
                disabled={paginaActual === totalPaginas}
                className="px-4 py-2 bg-white border border-gray-200 text-slate-600 rounded-lg text-xs font-bold uppercase disabled:opacity-40 hover:bg-gray-100 transition"
              >
                Siguiente
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActividadLog;
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  FaSearch,
  FaFileDownload,
  FaFileExcel,
  FaFilePdf,
  FaCalendarAlt,
  FaShieldAlt,
  FaUserShield,
  FaBroom,
  FaTimes,
} from "react-icons/fa";
import { supabase } from "../services/supabase";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";
import { exportPDFLog } from "../utils/exports/exportPDFLog";
import { exportExcelLog } from "../utils/exports/exportExcelLog";
import {
  TablaActividadLogSkeleton,
  ToolbarActividadLogSkeleton,
} from "../components/ui/Skeleton";
const normalizarRol = (rol) => {
  const r = (rol || "").trim().toUpperCase();
  if (r === "ADMIN") return "ADMINISTRADOR";
  return r;
};

const generarUltimosMeses = (cantidad = 12) => {
  const nombresMes = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];
  const hoy = new Date();
  const meses = [];
  for (let i = 0; i < cantidad; i++) {
    const d = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1);
    const valor = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    meses.push({
      valor,
      label: `${nombresMes[d.getMonth()]} ${d.getFullYear()}`,
    });
  }
  return meses;
};

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
  TABULACIÓN: "Tabulación",
};

const ActividadLog = () => {
  const { showToast } = useToast();
  const { user } = useAuth();
  const nombreAdminActual = user?.nombre_completo || "ADMINISTRADOR DE TURNO";
  const [logs, setLogs] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cargandoInicial, setCargandoInicial] = useState(true);
  const [filtroRol, setFiltroRol] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [fechaDesde, setFechaDesde] = useState("");
  const [fechaHasta, setFechaHasta] = useState("");
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [rolesUnicos, setRolesUnicos] = useState([]);
  const [hoverTabla, setHoverTabla] = useState(false);
  const [busquedaMovilAbierta, setBusquedaMovilAbierta] = useState(false);
  const [menuAccionesAbierto, setMenuAccionesAbierto] = useState(false);
  const [rolMovilAbierto, setRolMovilAbierto] = useState(false);
  const desdeRef = useRef(null);
  const hastaRef = useRef(null);
  const itemsPorPagina = 10;
  const hoyISO = new Date().toISOString().slice(0, 10); // YYYY-MM-DD, tope para no elegir fechas futuras

  const cargarLogs = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCargando(true);
      try {
        let query = supabase
          .from("log_actividad")
          .select(
            "id_actividad, accion, descripcion, fecha_hora, id_oficial, id_alerta",
            { count: "exact" },
          )
          .order("fecha_hora", { ascending: false });

        // BÚSQUEDA MEJORADA: incluye nombre del oficial
        if (busqueda.trim()) {
          // 1. Buscar oficiales cuyo nombre coincida con la búsqueda
          const { data: oficialesCoincidentes, error: errBusqueda } =
            await supabase
              .from("oficial")
              .select("id_oficial")
              .ilike("nombre_completo", `%${busqueda}%`);

          if (errBusqueda) {
            console.error("Error buscando oficiales:", errBusqueda);
          }

          const idsOficialesCoincidentes = (oficialesCoincidentes || []).map(
            (o) => o.id_oficial,
          );

          if (idsOficialesCoincidentes.length > 0) {
            query = query.or(
              `accion.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%,id_oficial.in.(${idsOficialesCoincidentes.join(",")})`,
            );
          } else {
            query = query.or(
              `accion.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%`,
            );
          }
        }

        // Filtro por rango de fechas
        if (fechaDesde) {
          query = query.gte("fecha_hora", `${fechaDesde}T00:00:00`);
        }
        if (fechaHasta) {
          query = query.lte("fecha_hora", `${fechaHasta}T23:59:59`);
        }

        // Filtro por rol (a nivel de base de datos, no en el navegador)
        if (filtroRol !== "todos") {
          const { data: oficialesConRol, error: errRolBusq } = await supabase
            .from("oficial")
            .select("id_oficial, rol");
          if (errRolBusq) throw errRolBusq;

          const idsConRol = (oficialesConRol || [])
            .filter((o) => normalizarRol(o.rol) === filtroRol)
            .map((o) => o.id_oficial);

          if (idsConRol.length > 0) {
            query = query.in("id_oficial", idsConRol);
          } else {
            // Nadie tiene ese rol → forzar resultado vacío
            query = query.eq("id_oficial", -1);
          }
        }

        const from = (paginaActual - 1) * itemsPorPagina;
        const to = from + itemsPorPagina - 1;
        const {
          data: logsRaw,
          count,
          error: errLogs,
        } = await query.range(from, to);
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
        const idsAlertas = [
          ...new Set((logsRaw || []).map((l) => l.id_alerta).filter(Boolean)),
        ];
        let alertasMap = {};
        if (idsAlertas.length > 0) {
          const { data: alertas, error: errAl } = await supabase
            .from("alerta")
            .select("id_alerta, codigo_alerta")
            .in("id_alerta", idsAlertas);
          if (errAl) throw errAl;
          (alertas || []).forEach((a) => {
            alertasMap[a.id_alerta] = a;
          });
        }

        const logsConRol = (logsRaw || []).map((item) => ({
          id: item.id_actividad,
          usuario_nombre:
            oficialesMap[item.id_oficial]?.nombre_completo || "Desconocido",
          usuario_rol: normalizarRol(oficialesMap[item.id_oficial]?.rol),
          accion: item.accion || "—",
          descripcion: item.descripcion || "",
          id_alerta: item.id_alerta,
          codigo_alerta: alertasMap[item.id_alerta]?.codigo_alerta || null,
          fecha: item.fecha_hora,
        }));

        setLogs(logsConRol);
        setTotalPaginas(Math.ceil((count || 0) / itemsPorPagina));

        if (rolesUnicos.length === 0) {
          const { data: rolesData, error: rolesErr } = await supabase
            .from("oficial")
            .select("rol");
          if (!rolesErr && rolesData) {
            const roles = [
              ...new Set(rolesData.map((r) => normalizarRol(r.rol))),
            ];
            setRolesUnicos(roles);
          }
        }
      } catch (error) {
        console.error("ActividadLog error:", error?.message || error);
        showToast(
          `Error: ${error?.message || "al cargar actividades"}`,
          "error",
        );
      } finally {
        setCargando(false);
        setCargandoInicial(false);
      }
    },
    [
      filtroRol,
      busqueda,
      fechaDesde,
      fechaHasta,
      paginaActual,
      showToast,
      rolesUnicos.length,
    ],
  );

  useEffect(() => {
    cargarLogs();
  }, [cargarLogs]);

  useEffect(() => {
    const canal = supabase
      .channel("log-actividad-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "log_actividad" },
        () => cargarLogs(true),
      )
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, [cargarLogs]);

  const limpiarFiltros = () => {
    setFiltroRol("todos");
    setBusqueda("");
    setFechaDesde("");
    setFechaHasta("");
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

  const exportarExcel = async () => {
    if (!fechaDesde || !fechaHasta) {
      showToast(
        "Selecciona un rango de fechas (Desde y Hasta) antes de exportar",
        "warning",
      );
      return;
    }

    try {
      let query = supabase
        .from("log_actividad")
        .select(
          "id_actividad, accion, descripcion, fecha_hora, id_oficial, id_alerta",
        )
        .order("fecha_hora", { ascending: false })
        .gte("fecha_hora", `${fechaDesde}T00:00:00`)
        .lte("fecha_hora", `${fechaHasta}T23:59:59`);

      if (busqueda.trim()) {
        query = query.or(
          `accion.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%`,
        );
      }

      if (filtroRol !== "todos") {
        const { data: oficialesConRol, error: errRolBusq } = await supabase
          .from("oficial")
          .select("id_oficial, rol");
        if (errRolBusq) throw errRolBusq;

        const idsConRol = (oficialesConRol || [])
          .filter((o) => normalizarRol(o.rol) === filtroRol)
          .map((o) => o.id_oficial);

        if (idsConRol.length > 0) {
          query = query.in("id_oficial", idsConRol);
        } else {
          query = query.eq("id_oficial", -1);
        }
      }

      const { data: logsRaw, error } = await query;
      if (error) throw error;

      if (!logsRaw || logsRaw.length === 0) {
        showToast("No hay registros en el rango seleccionado", "info");
        return;
      }

      if (logsRaw.length > 2000) {
        showToast(
          "El rango seleccionado tiene demasiados registros. Reduce el rango de fechas.",
          "warning",
        );
        return;
      }

      const idsOficiales = [
        ...new Set(logsRaw.map((l) => l.id_oficial).filter(Boolean)),
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

      const idsAlertas = [
        ...new Set(logsRaw.map((l) => l.id_alerta).filter(Boolean)),
      ];
      let alertasMap = {};
      if (idsAlertas.length > 0) {
        const { data: alertas, error: errAl } = await supabase
          .from("alerta")
          .select("id_alerta, codigo_alerta")
          .in("id_alerta", idsAlertas);
        if (errAl) throw errAl;
        (alertas || []).forEach((a) => {
          alertasMap[a.id_alerta] = a;
        });
      }

      const logsParaExcel = logsRaw.map((item) => ({
        usuario_nombre:
          oficialesMap[item.id_oficial]?.nombre_completo || "Desconocido",
        usuario_rol: normalizarRol(oficialesMap[item.id_oficial]?.rol),
        descripcion: item.descripcion,
        codigo_alerta: alertasMap[item.id_alerta]?.codigo_alerta,
        fecha: item.fecha_hora,
      }));

      await exportExcelLog({
        logs: logsParaExcel,
        titulo: "HISTORIAL DE ACTIVIDAD DEL SISTEMA",
        filename: `historial-actividad_${fechaDesde}_a_${fechaHasta}.xlsx`,
        nombreAdmin: nombreAdminActual,
      });

      await supabase.from("log_actividad").insert([
        {
          id_oficial: user?.id_oficial || null,
          id_alerta: null,
          accion: "ADMINISTRADOR",
          descripcion: `Exportó reporte Excel del historial de actividad (${fechaDesde} al ${fechaHasta})`,
        },
      ]);
    } catch (err) {
      console.error("Error al exportar Excel:", err);
      showToast(
        `Error al generar Excel: ${err.message || "revisa la consola"}`,
        "error",
      );
    }
  };

  const exportarPDF = async () => {
    if (!fechaDesde || !fechaHasta) {
      showToast(
        "Selecciona un rango de fechas (Desde y Hasta) antes de exportar",
        "warning",
      );
      return;
    }

    try {
      // Cargar logo institucional (igual que en Tabulacion.jsx)
      let logoBase64 = null;
      try {
        const res = await fetch("/logo_of.png");
        const blob = await res.blob();
        logoBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(blob);
        });
      } catch (_) {}

      let query = supabase
        .from("log_actividad")
        .select(
          "id_actividad, accion, descripcion, fecha_hora, id_oficial, id_alerta",
        )
        .order("fecha_hora", { ascending: false })
        .gte("fecha_hora", `${fechaDesde}T00:00:00`)
        .lte("fecha_hora", `${fechaHasta}T23:59:59`);

      if (busqueda.trim()) {
        query = query.or(
          `accion.ilike.%${busqueda}%,descripcion.ilike.%${busqueda}%`,
        );
      }

      // Filtro por rol (igual que en cargarLogs)
      if (filtroRol !== "todos") {
        const { data: oficialesConRol, error: errRolBusq } = await supabase
          .from("oficial")
          .select("id_oficial, rol");
        if (errRolBusq) throw errRolBusq;

        const idsConRol = (oficialesConRol || [])
          .filter((o) => normalizarRol(o.rol) === filtroRol)
          .map((o) => o.id_oficial);

        if (idsConRol.length > 0) {
          query = query.in("id_oficial", idsConRol);
        } else {
          query = query.eq("id_oficial", -1);
        }
      }

      const { data: logsRaw, error } = await query;
      if (error) throw error;

      if (!logsRaw || logsRaw.length === 0) {
        showToast("No hay registros en el rango seleccionado", "info");
        return;
      }

      if (logsRaw.length > 2000) {
        showToast(
          "El rango seleccionado tiene demasiados registros. Reduce el rango de fechas.",
          "warning",
        );
        return;
      }

      // ── Oficiales (con guardia de array vacío) ──
      const idsOficiales = [
        ...new Set(logsRaw.map((l) => l.id_oficial).filter(Boolean)),
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

      // ── Alertas (con guardia de array vacío) ──
      const idsAlertas = [
        ...new Set(logsRaw.map((l) => l.id_alerta).filter(Boolean)),
      ];
      let alertasMap = {};
      if (idsAlertas.length > 0) {
        const { data: alertas, error: errAl } = await supabase
          .from("alerta")
          .select("id_alerta, codigo_alerta")
          .in("id_alerta", idsAlertas);
        if (errAl) throw errAl;
        (alertas || []).forEach((a) => {
          alertasMap[a.id_alerta] = a;
        });
      }

      const logsParaPDF = logsRaw.map((item) => ({
        usuario_nombre:
          oficialesMap[item.id_oficial]?.nombre_completo || "Desconocido",
        usuario_rol: normalizarRol(oficialesMap[item.id_oficial]?.rol),
        accion: item.accion,
        descripcion: item.descripcion,
        codigo_alerta: alertasMap[item.id_alerta]?.codigo_alerta,
        fecha: item.fecha_hora,
      }));

      const filtroTexto = [
        `Periodo: ${fechaDesde} al ${fechaHasta}`,
        filtroRol !== "todos" ? `Rol: ${filtroRol}` : null,
        busqueda ? `Búsqueda: "${busqueda}"` : null,
      ]
        .filter(Boolean)
        .join(" · ");

      const codigoReporte = `${fechaDesde}_a_${fechaHasta}`;
      const nombreArchivo = `reportes/historial_log.pdf`;
      const filenameFinal = `historial-actividad_${codigoReporte}.pdf`;

      // 1. Obtener URL pública antes de generar (mismo patrón que Usuarios.jsx / ArchivoHistorico.jsx)
      const { data: urlData } = supabase.storage
        .from("reportes")
        .getPublicUrl(nombreArchivo);
      const urlPublica = `${urlData.publicUrl}?t=${Date.now()}`;

      // 2. Generar PDF ya con el QR incluido
      const pdfBlob = await exportPDFLog({
        logs: logsParaPDF,
        titulo: "HISTORIAL DE ACTIVIDAD DEL SISTEMA",
        subtitulo: filtroTexto,
        filename: filenameFinal,
        logoBase64,
        nombreAdmin: nombreAdminActual,
        qrData: urlPublica,
      });

      // 3. Subir ese mismo PDF a Supabase
      const { error: uploadError } = await supabase.storage
        .from("reportes")
        .upload(nombreArchivo, pdfBlob, {
          contentType: "application/pdf",
          upsert: true,
        });
      if (uploadError) console.error("Error al subir PDF:", uploadError);

      // 4. Descargar (una sola vez)
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filenameFinal;
      a.click();
      URL.revokeObjectURL(url);

      await supabase.from("log_actividad").insert([
        {
          id_oficial: user?.id_oficial || null,
          id_alerta: null,
          accion: "ADMINISTRADOR",
          descripcion: `Exportó reporte PDF del historial de actividad (${fechaDesde} al ${fechaHasta})`,
        },
      ]);
    } catch (err) {
      console.error("Error al exportar PDF:", err);
      showToast(
        `Error al generar PDF: ${err.message || "revisa la consola"}`,
        "error",
      );
    }
  };

  return (
    <div className="w-full h-full flex flex-col animate-fadeIn bg-gray-50/30 overflow-y-auto p-1 pb-3">
      {/* BARRA DE HERRAMIENTAS */}
      {cargandoInicial ? (
        <ToolbarActividadLogSkeleton />
      ) : (
        <div className="w-full bg-white p-2 sm:p-3 rounded-2xl shadow-md border xl:py-[18.5px] border-gray-100 flex items-center gap-3 sm:gap-4 xl:gap-3 flex-shrink-0 -mt-1.5">
          {/* Filtro de rol compacto — solo md/lg (en xl+ va la versión completa) */}
          <div className="hidden md:flex xl:hidden relative shrink-0 w-[140px] lg:w-[160px]">
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              title="Filtrar por rol"
              className={`w-full appearance-none h-10 lg:h-11 pl-3 lg:pl-5 pr-7 rounded-lg text-[11px] lg:text-[12px] font-medium uppercase outline-none transition-all cursor-pointer border tracking-wider truncate ${
                filtroRol !== "todos"
                  ? "bg-[#474b29] text-white border-[#474b29] shadow-md"
                  : "bg-gray-50/50 text-slate-700 border-gray-200 hover:border-slate-300"
              }`}
            >
              <option value="todos" className="bg-white text-slate-600 px-8">
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
            <div className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center">
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

          {/* Fechas compactas — solo md/lg (en xl+ va la versión completa) */}
          <div className="hidden md:flex xl:hidden items-center gap-1.5 shrink-0">
            <input
              type="date"
              value={fechaDesde}
              max={fechaHasta || hoyISO}
              onChange={(e) => {
                const nuevaFecha = e.target.value;
                if (nuevaFecha && fechaHasta && nuevaFecha > fechaHasta) {
                  showToast(
                    "La fecha 'Desde' no puede ser posterior a 'Hasta'",
                    "warning",
                  );
                  return;
                }
                if (nuevaFecha && nuevaFecha > hoyISO) {
                  showToast(
                    "No puedes seleccionar una fecha futura",
                    "warning",
                  );
                  return;
                }
                setFechaDesde(nuevaFecha);
                setPaginaActual(1);
              }}
              className={`h-10 lg:h-11 px-3 lg:px-5 bg-gray-50/50 border rounded-lg text-[11px] lg:text-[12px] font-medium outline-none focus:bg-white transition-all tracking-wider ${
                fechaDesde
                  ? "border-[#474b29] text-[#474b29]"
                  : "border-gray-200 text-slate-700 hover:border-slate-300"
              }`}
            />
            <span className="text-slate-300 text-xs font-bold">–</span>
            <input
              type="date"
              value={fechaHasta}
              min={fechaDesde || undefined}
              max={hoyISO}
              onChange={(e) => {
                const nuevaFecha = e.target.value;
                if (nuevaFecha && fechaDesde && nuevaFecha < fechaDesde) {
                  showToast(
                    "La fecha 'Hasta' no puede ser anterior a 'Desde'",
                    "warning",
                  );
                  return;
                }
                if (nuevaFecha && nuevaFecha > hoyISO) {
                  showToast(
                    "No puedes seleccionar una fecha futura",
                    "warning",
                  );
                  return;
                }
                setFechaHasta(nuevaFecha);
                setPaginaActual(1);
              }}
              className={`h-10 lg:h-11 px-3 lg:px-5 bg-gray-50/50 border rounded-lg text-[11px] lg:text-[12px] font-medium outline-none focus:bg-white transition-all tracking-wider ${
                fechaHasta
                  ? "border-[#474b29] text-[#474b29]"
                  : "border-gray-200 text-slate-700 hover:border-slate-300"
              }`}
            />
          </div>

          {/* Búsqueda compacta — visible de base a lg, colapsada a lupa, posición fija */}
          <div className="relative flex items-center xl:hidden shrink-0">
            {busquedaMovilAbierta ? (
              <div className="relative w-[150px] sm:w-[200px]">
                <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Buscar por nombre, acción o descripción..."
                  className="w-full h-9 sm:h-11 pl-9 pr-8 py-1.5 bg-gray-50/50 border border-gray-200 rounded-lg outline-none text-[11px] sm:text-[12px] font-medium text-slate-700 transition-all focus:bg-white focus:border-[#474b29] tracking-wider"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  onBlur={() => {
                    if (!busqueda) setBusquedaMovilAbierta(false);
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    setBusqueda("");
                    setBusquedaMovilAbierta(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <FaFileDownload size={0} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setBusquedaMovilAbierta(true)}
                className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-lg border border-gray-200 bg-gray-50/50 text-slate-400 hover:text-slate-600 hover:border-slate-300 transition-all shrink-0"
                title="Buscar"
              >
                <FaSearch size={14} />
              </button>
            )}
          </div>

          {/* Rol compacto — icono, solo base a sm (a partir de md ya está la versión de select visible) */}
          {!busquedaMovilAbierta && (
            <div className="md:hidden relative shrink-0">
              {rolMovilAbierto ? (
                <div className="relative">
                  <select
                    autoFocus
                    value={filtroRol}
                    onChange={(e) => {
                      setFiltroRol(e.target.value);
                      setRolMovilAbierto(false);
                    }}
                    onBlur={() => setRolMovilAbierto(false)}
                    className={`appearance-none h-14 sm:h-11 pl-3 pr-7 rounded-lg px-1 text-[10px] sm:text-[11px] font-medium uppercase outline-none border tracking-wider ${
                      filtroRol !== "todos"
                        ? "bg-[#474b29] text-white border-[#474b29] shadow-md"
                        : "bg-gray-50/50 text-slate-700 border-gray-200"
                    }`}
                  >
                    <option value="todos">ROLES</option>
                    {rolesUnicos.map((rol) => (
                      <option key={rol} value={rol}>
                        {rol}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setRolMovilAbierto(true)}
                  className={`flex items-center justify-center w-12 h-9 sm:w-11 sm:h-11 px-4 rounded-lg border transition-all shrink-0 text-[9px] sm:text-[10px] font-medium uppercase tracking-wider ${
                    filtroRol !== "todos"
                      ? "bg-[#474b29] text-white border-[#474b29] shadow-md"
                      : "bg-gray-50/50 border-gray-200 text-slate-400 hover:text-slate-600 hover:border-slate-300"
                  }`}
                  title="Filtrar por rol"
                >
                  ROLES
                </button>
              )}
            </div>
          )}

          {/* Fechas compactas — dos íconos independientes, solo base a sm */}
          {!busquedaMovilAbierta && (
            <div className="md:hidden flex items-center gap-1.5 shrink-0">
              <div className="relative">
                <div
                  className={`flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-lg border transition-all shrink-0 pointer-events-none ${
                    fechaDesde
                      ? "bg-[#474b29] text-white border-[#474b29] shadow-md"
                      : "bg-gray-50/50 border-gray-200 text-slate-400"
                  }`}
                  title="Fecha desde"
                >
                  <FaCalendarAlt size={14} /> 
                </div>
                <input
                  ref={desdeRef}
                  type="date"
                  value={fechaDesde}
                  max={fechaHasta || hoyISO}
                  onChange={(e) => {
                    const nuevaFecha = e.target.value;
                    if (nuevaFecha && fechaHasta && nuevaFecha > fechaHasta) {
                      showToast(
                        "La fecha 'Desde' no puede ser posterior a 'Hasta'",
                        "warning",
                      );
                      return;
                    }
                    if (nuevaFecha && nuevaFecha > hoyISO) {
                      showToast(
                        "No puedes seleccionar una fecha futura",
                        "warning",
                      );
                      return;
                    }
                    setFechaDesde(nuevaFecha);
                    setPaginaActual(1);
                  }}
                  className="absolute inset-0 w-9 h-9 sm:w-11 sm:h-11 opacity-0 cursor-pointer"
                />
              </div>

              <span className="text-slate-300 text-xs font-bold">–</span>

              <div className="relative">
                <div
                  className={`flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-lg border transition-all shrink-0 pointer-events-none ${
                    fechaHasta
                      ? "bg-[#474b29] text-white border-[#474b29] shadow-md"
                      : "bg-gray-50/50 border-gray-200 text-slate-400"
                  }`}
                  title="Fecha hasta"
                >
                  <FaCalendarAlt size={14} />
                </div>
                <input
                  ref={hastaRef}
                  type="date"
                  value={fechaHasta}
                  min={fechaDesde || undefined}
                  max={hoyISO}
                  onChange={(e) => {
                    const nuevaFecha = e.target.value;
                    if (nuevaFecha && fechaDesde && nuevaFecha < fechaDesde) {
                      showToast(
                        "La fecha 'Hasta' no puede ser anterior a 'Desde'",
                        "warning",
                      );
                      return;
                    }
                    if (nuevaFecha && nuevaFecha > hoyISO) {
                      showToast(
                        "No puedes seleccionar una fecha futura",
                        "warning",
                      );
                      return;
                    }
                    setFechaHasta(nuevaFecha);
                    setPaginaActual(1);
                  }}
                  className="absolute inset-0 w-9 h-9 sm:w-11 sm:h-11 opacity-0 cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Escoba (limpiar filtros) — solo ícono, visible en xs y sm */}
          {!busquedaMovilAbierta && (
            <button
              type="button"
              onClick={limpiarFiltros}
              className="md:hidden flex items-center justify-center w-16 font-medium tracking-widest text-[10px] h-8 sm:w-11 sm:h-11 rounded-lg bg-[#474b29] text-white border border-[#474b29] shadow-md hover:bg-[#3a3e21] transition-all shrink-0"
              title="Limpiar filtros"
            >
              LIMPIAR
            </button>
          )}

          {/* Búsqueda original — solo desde xl */}
          <div className="hidden xl:block relative flex-1 min-w-[160px]">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, acción o descripción..."
              className="w-full h-11 pl-10 pr-3 md:pr-5 py-2 md:py-3 bg-gray-50/50 border border-gray-200 rounded-lg outline-none text-[12px] font-medium text-slate-700 transition-all focus:bg-white focus:border-[#474b29] tracking-wider"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {/* Filtro de rol original — solo desde xl */}
          <div className="hidden xl:block relative shrink-0">
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className={`appearance-none h-11 pl-5 pr-8 rounded-lg text-[12px] font-medium uppercase outline-none transition-all cursor-pointer border tracking-wider ${
                filtroRol !== "todos"
                  ? "bg-[#474b29] text-white border-[#474b29] shadow-md"
                  : "bg-gray-50/50 text-slate-700 border-gray-200 hover:border-slate-300"
              }`}
            >
              <option value="todos" className="bg-white text-slate-600 px-6">
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
            <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center">
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

          {/* Fechas originales — solo desde xl */}
          <div className="hidden xl:flex items-center gap-1.5 shrink-0">
            <input
              type="date"
              value={fechaDesde}
              max={fechaHasta || hoyISO}
              onChange={(e) => {
                const nuevaFecha = e.target.value;
                if (nuevaFecha && fechaHasta && nuevaFecha > fechaHasta) {
                  showToast(
                    "La fecha 'Desde' no puede ser posterior a 'Hasta'",
                    "warning",
                  );
                  return;
                }
                if (nuevaFecha && nuevaFecha > hoyISO) {
                  showToast(
                    "No puedes seleccionar una fecha futura",
                    "warning",
                  );
                  return;
                }
                setFechaDesde(nuevaFecha);
                setPaginaActual(1);
              }}
              className={`h-11 px-5 md:px-6 bg-gray-50/50 border rounded-lg text-[12px] font-medium outline-none focus:bg-white transition-all tracking-wider ${
                fechaDesde
                  ? "border-[#474b29] text-[#474b29]"
                  : "border-gray-200 text-slate-700 hover:border-slate-300"
              }`}
            />
            <span className="text-slate-300 text-xs font-bold">–</span>
            <input
              type="date"
              value={fechaHasta}
              min={fechaDesde || undefined}
              max={hoyISO}
              onChange={(e) => {
                const nuevaFecha = e.target.value;
                if (nuevaFecha && fechaDesde && nuevaFecha < fechaDesde) {
                  showToast(
                    "La fecha 'Hasta' no puede ser anterior a 'Desde'",
                    "warning",
                  );
                  return;
                }
                if (nuevaFecha && nuevaFecha > hoyISO) {
                  showToast(
                    "No puedes seleccionar una fecha futura",
                    "warning",
                  );
                  return;
                }
                setFechaHasta(nuevaFecha);
                setPaginaActual(1);
              }}
              className={`h-11 px-5 md:px-6 bg-gray-50/50 border rounded-lg text-[13px] font-medium outline-none focus:bg-white transition-all tracking-wider ${
                fechaHasta
                  ? "border-[#474b29] text-[#474b29]"
                  : "border-gray-200 text-slate-700 hover:border-slate-300"
              }`}
            />
          </div>

          {/* Botón Limpiar con texto — desde md en adelante */}
          <button
            onClick={limpiarFiltros}
            className="hidden md:flex items-center justify-center h-11 lg:h-10 lg:py-3 px-4 lg:px-5 rounded-lg tracking-widest font-medium text-[11px] lg:text-[12px] uppercase shadow text-white bg-[#474b29] hover:bg-[#3a3e21] transition-all shrink-0"
          >
            LIMPIAR
          </button>

          {/* Separador vertical + menú de exportación — de base a lg */}
          <div className="xl:hidden flex items-center gap-3 sm:gap-4 pl-3 sm:pl-4 ml-auto border-l border-gray-200 shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuAccionesAbierto((v) => !v)}
                className="flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-lg border-2 border-gray-200 bg-white text-slate-700 hover:border-slate-300 transition-all shrink-0"
                title="Exportar"
              >
                <FaFileDownload size={14} />
              </button>

              {menuAccionesAbierto && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setMenuAccionesAbierto(false)}
                  />
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-2 px-1 z-50">
                    <p className="px-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Exportar
                    </p>
                    <button
                      onClick={() => {
                        exportarExcel();
                        setMenuAccionesAbierto(false);
                      }}
                      disabled={!fechaDesde || !fechaHasta}
                      className={`w-full px-2 py-2 text-left font-medium text-[12px] flex items-center gap-2 rounded-lg ${
                        !fechaDesde || !fechaHasta
                          ? "opacity-40 text-slate-500 cursor-not-allowed"
                          : "hover:bg-green-50 text-slate-600 cursor-pointer"
                      }`}
                    >
                      <FaFileExcel className="text-green-800" size={11} /> Excel
                      (.xls)
                    </button>
                    <button
                      onClick={() => {
                        exportarPDF();
                        setMenuAccionesAbierto(false);
                      }}
                      disabled={!fechaDesde || !fechaHasta}
                      className={`w-full px-2 py-2 text-left font-medium text-[12px] flex items-center gap-2 rounded-lg ${
                        !fechaDesde || !fechaHasta
                          ? "opacity-40 text-slate-500 cursor-not-allowed"
                          : "hover:bg-red-50 text-slate-700 cursor-pointer"
                      }`}
                    >
                      <FaFilePdf className="text-red-700" size={11} /> Guardar
                      PDF
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Exportar — solo ícono en xl */}
          <div className="hidden xl:flex 2xl:hidden relative group shrink-0">
            <button
              className="flex items-center justify-center w-11 h-11 bg-white border-2 border-gray-200 text-slate-700 rounded-lg hover:border-slate-300 transition-all disabled:opacity-70 disabled:cursor-wait"
              title="Exportar"
            >
              <FaFileDownload size={14} />
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={exportarExcel}
                title={
                  !fechaDesde || !fechaHasta
                    ? "Selecciona un rango de fechas primero"
                    : ""
                }
                className={`w-full px-3 py-2 text-left font-medium text-[12px] flex items-center gap-2 transition-opacity ${
                  !fechaDesde || !fechaHasta
                    ? "opacity-40 text-slate-500 cursor-not-allowed hover:bg-transparent"
                    : "hover:bg-green-50 text-slate-600 cursor-pointer"
                }`}
              >
                <FaFileExcel className="text-green-800" size={11} /> Excel
                (.xls)
              </button>
              <button
                onClick={exportarPDF}
                title={
                  !fechaDesde || !fechaHasta
                    ? "Selecciona un rango de fechas primero"
                    : ""
                }
                className={`w-full px-3 py-2 text-left font-medium text-[12px] flex items-center gap-2 transition-opacity ${
                  !fechaDesde || !fechaHasta
                    ? "opacity-40 text-slate-500 cursor-not-allowed hover:bg-transparent"
                    : "hover:bg-red-50 text-slate-700 cursor-pointer"
                }`}
              >
                <FaFilePdf className="text-red-700" size={11} /> Guardar PDF
              </button>
            </div>
          </div>

          {/* Exportar — con texto desde 2xl */}
          <div className="hidden 2xl:block relative group shrink-0">
            <button className="flex items-center gap-2 px-3 py-2.5 bg-white border-2 border-gray-200 text-slate-700 rounded-lg font-medium uppercase text-[12px] hover:border-slate-300 transition-all disabled:opacity-70 disabled:cursor-wait tracking-widest">
              <FaFileDownload size={11} /> <span>Exportar</span>
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={exportarExcel}
                title={
                  !fechaDesde || !fechaHasta
                    ? "Selecciona un rango de fechas primero"
                    : ""
                }
                className={`w-full px-3 py-2 text-left font-medium text-[12px] flex items-center gap-2 transition-opacity ${
                  !fechaDesde || !fechaHasta
                    ? "opacity-40 text-slate-500 cursor-not-allowed hover:bg-transparent"
                    : "hover:bg-green-50 text-slate-600 cursor-pointer"
                }`}
              >
                <FaFileExcel className="text-green-800" size={11} /> Excel
                (.xls)
              </button>
              <button
                onClick={exportarPDF}
                title={
                  !fechaDesde || !fechaHasta
                    ? "Selecciona un rango de fechas primero"
                    : ""
                }
                className={`w-full px-3 py-2 text-left font-medium text-[12px] flex items-center gap-2 transition-opacity ${
                  !fechaDesde || !fechaHasta
                    ? "opacity-40 text-slate-500 cursor-not-allowed hover:bg-transparent"
                    : "hover:bg-red-50 text-slate-700 cursor-pointer"
                }`}
              >
                <FaFilePdf className="text-red-700" size={11} /> Guardar PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabla de logs */}
      <div className="relative top-1 w-full bg-white rounded-2xl shadow-lg flex flex-col flex-1 min-h-0 max-h-[79svh] mt-6">
        <div className="px-4 md:px-7 py-4 md:py-6 flex flex-col flex-1 min-h-0 overflow-hidden">
          <h2 className="text-[18px] font-bold uppercase text-[#1e293b] mb-6 tracking-wider flex-shrink-0">
            Historial de Acciones
          </h2>

          <div className="relative flex-1 min-h-0 overflow-hidden rounded-lg">
            <div
              onMouseEnter={() => setHoverTabla(true)}
              onMouseLeave={() => setHoverTabla(false)}
              className={`h-full overflow-y-auto overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 pb-3 pr-1.5 ${
                hoverTabla ? "scroll-visible" : "scroll-hover"
              }`}
            >
              <table className="min-w-full border-collapse table-fixed">
                <thead>
                  <tr className="text-slate-400 text-[11px] font-medium uppercase tracking-widest">
                    <th className="sticky top-0 z-10 bg-white px-3 pb-3 pt-1 border-b border-slate-200 w-[24%] text-left md:pr-2">
                      OFICIAL
                    </th>
                    <th className="sticky top-0 z-10 bg-white pb-3 pt-1 border-b border-slate-200 w-[18%] text-left">
                      ROL
                    </th>
                    <th className="sticky top-0 z-10 bg-white pb-3 pt-1 border-b border-slate-200 w-[37%] text-left">
                      DESCRIPCIÓN
                    </th>
                    <th className="sticky top-0 z-10 bg-white pb-3 pt-1 border-b border-slate-200 w-[19%] text-left">
                      ALERTA
                    </th>
                    <th className="sticky top-0 z-10 bg-white pb-3 pt-1 border-b border-slate-200 w-[23%] text-left">
                      FECHA / HORA
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cargando ? (
                    <TablaActividadLogSkeleton filas={8} />
                  ) : logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="text-center py-12 text-gray-400 font-medium"
                      >
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
                            <div className="w-6 h-8 rounded-md flex items-center justify-center font-black text-xs shadow-inner shrink-0r bg-[#474b29]/10 text-[#474b29]">
                              <FaShieldAlt size={12} />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[12px] font-medium text-[#1e293b] truncate tracking-wider flex gap-[3px]">
                                {(log.usuario_nombre || "")
                                  .split(" ")
                                  .slice(0, 2)
                                  .map((palabra, i) => (
                                    <span key={i}>{palabra}</span>
                                  ))}
                              </span>
                              <span className="text-[12px] font-medium text-[#1e293b] truncate tracking-wider">
                                {(log.usuario_nombre || "")
                                  .split(" ")
                                  .slice(-2)
                                  .join(" ")}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 align-middle">
                          <span className="inline-block px-2 py-1 rounded-md bg-gray-200/60 text-[#113e27] text-[10px] font-medium uppercase tracking-wider truncate max-w-full">
                            {log.usuario_rol || "—"}
                          </span>
                        </td>
                        <td className="py-4 pr-3 text-[11.5px] font-medium text-[#1e293b] align-middle tracking-wider">
                          <div className="flex flex-col min-w-0">
                            <span className="block truncate">
                              {(log.descripcion || "—")
                                .split(" ")
                                .slice(0, 3)
                                .join(" ")}
                            </span>
                            <span className="block truncate text-[11px] text-[#1e293b]">
                              {(log.descripcion || "")
                                .split(" ")
                                .slice(3, 4)
                                .join(" ")}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 pl-0 pr-2 text-[11px] font-medium text-[#1e293b] align-middle tracking-wider">
                          <span className="block truncate">
                            {log.codigo_alerta || "—"}
                          </span>
                        </td>
                        <td className="py-4 pl-2 pr-2 text-[10.5px] sm:text-[11px] font-medium text-[#1e293b] align-middle tracking-wider">
                          <span className="block truncate">
                            {formatFecha(log.fecha)}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Paginación */}
          {totalPaginas > 1 && (
            <div className="px-6 h-12 pt-4 pb-1 flex justify-between items-center border-t border-slate-200 bg-white mt-4">
              <button
                onClick={() => setPaginaActual((p) => Math.max(1, p - 1))}
                disabled={paginaActual === 1}
                className="mt-3 px-4 py-2.5 bg-slate-100 text-slate-500 rounded-lg text-[11.5px] font-medium uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors
                           border tracking-wider"
              >
                Anterior
              </button>
              <span className="text-[12px] text-slate-500 font-medium tracking-wider flex flex-col md:flex-row items-center md:gap-1 leading-tight">
                <span className="text-[9px] uppercase tracking-widest text-slate-400 sm:hidden">
                  Pag
                </span>
                <span className="hidden md:inline">Página</span>
                <span>
                  {paginaActual} de {totalPaginas}
                </span>
              </span>
              <button
                onClick={() =>
                  setPaginaActual((p) => Math.min(totalPaginas, p + 1))
                }
                disabled={paginaActual === totalPaginas}
                className="mt-3 px-4 py-2.5 bg-slate-100 border text-slate-500 rounded-lg text-[11.5px] font-medium uppercase disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-200 transition-colors tracking-wider"
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

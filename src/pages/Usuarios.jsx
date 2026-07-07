import React, { useState, useEffect, useCallback } from "react";
import {
  FaEdit,
  FaTrashAlt,
  FaShieldAlt,
  FaUserTie,
  FaUsers,
  FaSearch,
  FaPlus,
  FaFileDownload,
  FaCheckCircle,
  FaFilePdf,
  FaFileExcel,
  FaPowerOff,
  FaUserSlash,
  FaEye,
  FaTimes,
} from "react-icons/fa";
import { exportPDF } from "../utils/exports/exportPDF";
import { exportExcel } from "../utils/exports/exportExcel";
import { supabase } from "../services/supabase";
import PerfilCiudadano from "../components/modals/PerfilCiudadano";
import NuevoPolicia from "../components/modals/NuevoPolicia";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

// ─── Modal de perfil de oficial (solo lectura) ───────────────────────────────
function PerfilOficial({ oficial, onClose }) {
  if (!oficial) return null;

  const estaConectado = oficial.estado === true;
  const accesoLabel =
    oficial.acceso === "FUERA DE SERVICIO"
      ? "Fuera de servicio"
      : oficial.acceso === "DE BAJA"
      ? "De baja"
      : "En servicio";
  const accesoColor =
    oficial.acceso === "EN SERVICIO"
      ? "text-green-700 bg-green-50"
      : "text-red-700 bg-red-50";

  return (
    // ─── NUEVA ESTRUCTURA DE FONDO (igual que PerfilCiudadano) ───
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col h-fit max-h-[85vh] animate-fadeIn">
        {/* Header (sin cambios) */}
        <div className="bg-[#113e27] px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20">
              <FaShieldAlt size={22} className="text-white" />
            </div>
            <div>
              <p className="text-white font-black text-base uppercase tracking-widest">
                Perfil del Oficial
              </p>
              <p className="text-white/50 text-[11px] font-bold uppercase tracking-wider mt-0.5">
                ROF-{String(oficial.id_oficial).padStart(4, "0")} · {oficial.rol || "—"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
          >
            <FaTimes size={13} />
          </button>
        </div>

        {/* Banner estado (sin cambios) */}
{(() => {
          const deBaja = oficial.acceso === "DE BAJA";
          return (
            <div className={`px-6 py-2.5 flex items-center gap-2 ${deBaja ? "bg-slate-100 border-b border-slate-200" : estaConectado ? "bg-[#113e27]/10 border-b border-green-100" : "bg-[#C90A0A]/5 border-b border-red-100"}`}>
              <span className={`w-2 h-2 rounded-full ${deBaja ? "bg-slate-400" : estaConectado ? "bg-[#113e27] animate-pulse" : "bg-[#b40909]"}`} />
              <span className={`text-[11px] font-black uppercase tracking-widest ${deBaja ? "text-slate-500" : estaConectado ? "text-green-900" : "text-[#b40909]"}`}>
                {deBaja ? "Oficial dado de baja" : estaConectado ? "Oficial en línea" : "Oficial desconectado"}
              </span>
            </div>
          );
        })()}

{/* Body */}
        <div className="px-6 py-6 space-y-4 overflow-y-auto">
          <div>
            <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Nombre Completo</label>
            <div className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md font-bold text-[12px] text-slate-600">
              {oficial.nombre_completo || "—"}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">CI</label>
              <div className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md font-bold text-[12px] text-slate-600">
                {oficial.ci || "—"}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Celular</label>
              <div className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md font-bold text-[12px] text-slate-600">
                {oficial.celular || "—"}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Escalafón</label>
              <div className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md font-bold text-[12px] text-slate-600">
                {oficial.numero_escalafon || "—"}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Rango</label>
              <div className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md font-bold text-[12px] text-slate-600">
                {oficial.cargo || "—"}
              </div>
            </div>
          </div>
<div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Rol en el sistema</label>
              <div className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-md font-bold text-[12px] text-slate-600">
                {oficial.rol || "—"}
              </div>
            </div>
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1">Estado de servicio</label>
              <div className="mt-1 w-full px-4 py-3 bg-slate-50 border border-slate-200 uppercase rounded-md font-bold text-[12px] text-slate-600">
                {oficial.acceso === "EN SERVICIO"
                  ? "En servicio"
                  : oficial.acceso === "FUERA DE SERVICIO"
                  ? "Fuera de servicio"
                  : oficial.acceso === "DE BAJA"
                  ? "De baja"
                  : "—"}
              </div>
            </div>
          </div>
        </div>

        {/* Footer (sin cambios) */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-100 hover:bg-[#113e27] hover:text-white text-slate-500 font-bold text-[11px] uppercase rounded-xl transition-all duration-200 tracking-wider"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}

function Usuarios() {
const { showToast } = useToast();
const { user } = useAuth();
  const [tabActiva, setTabActiva] = useState("oficiales");
  const [filtroActivo, setFiltroActivo] = useState("Todos");
  const [busquedaOficiales, setBusquedaOficiales] = useState("");
  const [busquedaCiudadanos, setBusquedaCiudadanos] = useState("");
  const busqueda =
    tabActiva === "oficiales" ? busquedaOficiales : busquedaCiudadanos;
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [ciudadanoSeleccionado, setCiudadanoSeleccionado] = useState(null);
  const [oficialSeleccionado, setOficialSeleccionado] = useState(null);
  const [mostrarModalPolicia, setMostrarModalPolicia] = useState(false);
const [editandoPolicia, setEditandoPolicia] = useState(null);
const [adminActivo, setAdminActivo] = useState({ nombre: "ADMINISTRADOR DE TURNO", cargo: "Administrador del Sistema" });
const [confirmarEliminar, setConfirmarEliminar] = useState(null);

  const [oficiales, setOficiales] = useState([]);
  const [ciudadanos, setCiudadanos] = useState([]);

  const cargarOficiales = useCallback(async () => {
    const { data, error } = await supabase
      .from("oficial")
      .select("*")
      .order("id_oficial", { ascending: true });
if (error) {
      console.error("Error oficiales:", error);
      showToast("Error al cargar oficiales", "error");
    } else {
      setOficiales(data || []);
      const admin = (data || []).find((o) => {
        const rolLower = (o.rol || "").trim().toLowerCase();
        return o.estado === true && (rolLower === "admin" || rolLower === "administrador");
      });
      if (admin) {
        setAdminActivo({
          nombre: admin.nombre_completo || "ADMINISTRADOR DE TURNO",
          cargo: "Administrador del Sistema",
        });
      }
    }
  }, [showToast]);

  const obtenerAdvertencias = async (idUsuario) => {
    try {
      const { data: alertas, error: alertasError } = await supabase
        .from("alerta")
        .select("id_alerta")
        .eq("id_usuario", idUsuario);
      if (alertasError) throw alertasError;
      if (!alertas || alertas.length === 0) return 0;

      const idsAlertas = alertas.map((a) => a.id_alerta);
      let { count, error: desError } = await supabase
        .from("alerta_desestimada")
        .select("*", { count: "exact", head: true })
        .in("id_alerta", idsAlertas);

      if (desError) {
        const result = await supabase
          .from("alerta_desestimada")
          .select("*", { count: "exact", head: true })
          .in("alerta_id", idsAlertas);
        count = result.count;
        desError = result.error;
      }
      if (desError) throw desError;
      return count || 0;
    } catch (error) {
      console.error("Error en obtenerAdvertencias:", error);
      return 0;
    }
  };

  const actualizarEstadoSegunAdvertencias = async (
    idUsuario,
    advertencias,
    estadoActual
  ) => {
    if (estadoActual === 1 || estadoActual === 5) return estadoActual;

    let nuevoEstado = null;
    if (advertencias === 0) nuevoEstado = 2;
    else if (advertencias === 1 || advertencias === 2) nuevoEstado = 3;
    else if (advertencias >= 3) nuevoEstado = 4;

    if (nuevoEstado !== null && nuevoEstado !== estadoActual) {
      const { error } = await supabase
        .from("usuario_ciudadano")
        .update({ id_estado_ciudadano: nuevoEstado })
        .eq("id_usuario", idUsuario);
      if (error) {
        console.error("Error al actualizar estado:", error);
      } else {
        await supabase.from("historial_estado_ciudadano").insert([
          {
            id_ciudadano: idUsuario,
            id_estado: nuevoEstado,
            motivo: "Actualización automática por número de advertencias",
            fecha_cambio: new Date().toISOString(),
          },
        ]);

        const ciudadano = ciudadanos.find(c => c.id_usuario === idUsuario);
        const nombre = ciudadano?.nombre_completo || `Ciudadano #${idUsuario}`;
        if (nuevoEstado === 3) showToast(`${nombre} tiene ${advertencias} advertencia(s)`, "error");
        if (nuevoEstado === 4) showToast(`${nombre} ha sido suspendido`, "error");

        return nuevoEstado;
      }
    }
    return estadoActual;
  };

  const cargarCiudadanos = useCallback(async () => {
    const { data, error } = await supabase
      .from("usuario_ciudadano")
      .select("*")
      .order("id_usuario", { ascending: true });
    if (error) {
      console.error("Error ciudadanos:", error);
      showToast("Error al cargar ciudadanos", "error");
    } else {
      const ciudadanosActualizados = [];
      for (const ciudadano of data || []) {
        const advertencias = await obtenerAdvertencias(ciudadano.id_usuario);
        const estadoAnterior = ciudadano.id_estado_ciudadano;
        const nuevoEstado = await actualizarEstadoSegunAdvertencias(
          ciudadano.id_usuario,
          advertencias,
          estadoAnterior
        );
        ciudadanosActualizados.push({
          ...ciudadano,
          advertencias,
          id_estado_ciudadano: nuevoEstado || estadoAnterior,
        });
      }
      setCiudadanos(ciudadanosActualizados);
    }
  }, [showToast]);

  const recargarTodo = useCallback(async () => {
    setRefrescando(true);
    await Promise.all([cargarOficiales(), cargarCiudadanos()]);
    setRefrescando(false);
  }, [cargarOficiales, cargarCiudadanos]);

  useEffect(() => {
    const cargarInicial = async () => {
      setCargando(true);
      await recargarTodo();
      setCargando(false);
    };
    cargarInicial();
  }, [recargarTodo]);

  useEffect(() => {
    const interval = setInterval(() => {
      recargarTodo();
    }, 10000);
    return () => clearInterval(interval);
  }, [recargarTodo]);

  useEffect(() => {
    const handleFocus = () => recargarTodo();
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [recargarTodo]);

const eliminarOficial = async (id) => {
    const oficial = oficiales.find(o => o.id_oficial === id);
    setConfirmarEliminar(oficial);
  };

  const confirmarEliminarOficial = async () => {
    const id = confirmarEliminar?.id_oficial;
    const oficial = confirmarEliminar;
    setConfirmarEliminar(null);

const { error } = await supabase
      .from("oficial")
      .delete()
      .eq("id_oficial", id);
    if (error) {
      console.error("Error al eliminar:", error);
      showToast("Error al eliminar oficial", "error");
    } else {
      showToast(`**Oficial** ${oficial?.nombre_completo} eliminado del sistema`, "error");
      await supabase.from("log_actividad").insert([{
        id_oficial: user?.id_oficial || null, 
        id_alerta: null,
        accion: "ADMINISTRADOR",
        descripcion: `Eliminó al oficial con escalafón ${oficial?.numero_escalafon || id} — ${oficial?.nombre_completo}`,
      }]);
      await cargarOficiales();
    }
  };

const exportarPDF = async () => {
    await supabase.from("log_actividad").insert([{
      id_oficial: user?.id_oficial || null,
      id_alerta: null,
      accion: "ADMINISTRADOR",
      descripcion: `Exportó reporte PDF de ${tabActiva}`,
    }]);

    let logoBase64 = null;
    try {
      const res = await fetch("/logo_of.png");
      const blob = await res.blob();
      logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (_) { logoBase64 = null; }

const headers =
      tabActiva === "oficiales"
        ? ["Escalafón", "Oficial", "Rol", "Rango", "Celular", "Estado"]
        : ["Ciudadano", "Cédula", "Celular", "Estado"];

    const body = datosFiltrados.map((item) =>
      tabActiva === "oficiales"
        ? [
            item.numero_escalafon || "—",
            item.nombre_completo,
            item.rol || "—",
            item.cargo || "—",
            item.celular || "—",
            item.estado === true ? "Conectado" : "Desconectado",
          ]
        : [
            item.nombre_completo,
            item.ci || "—",
            item.celular || "—",
            getEstadoDisplay(item),
          ]
    );

const nombreArchivo = `reportes/${tabActiva}_reporte.pdf`;

    // 1. Obtener la URL pública del archivo en Supabase Storage (mismo patrón que ActividadLog.jsx)
    const { data: urlData } = supabase.storage
      .from("reportes")
      .getPublicUrl(nombreArchivo);
    const urlPublica = `${urlData.publicUrl}?t=${Date.now()}`;

    // 2. Generar el PDF ya con el QR apuntando a esa URL
    const pdfBlob = await exportPDF({
      titulo: tabActiva === "oficiales" ? "PERSONAL POLICIAL" : "REGISTRO DE CIUDADANOS",
      subtitulo: tabActiva === "oficiales"
        ? "Listado completo del personal policial registrado en el sistema"
        : "Listado completo de ciudadanos registrados en el sistema",
      headers,
      body,
      nombreAdmin: user?.nombre_completo || "ADMINISTRADOR DE TURNO",
      cargoAdmin: user?.cargo || "Administrador del Sistema",
      filename: `Reporte_${tabActiva}.pdf`,
      logoBase64,
      qrData: urlPublica,
    });

    // 3. Subir ese mismo PDF
    const { error: uploadError } = await supabase.storage
      .from("reportes")
      .upload(nombreArchivo, pdfBlob, { contentType: "application/pdf", upsert: true });

    if (uploadError) {
      showToast("Error al subir el reporte", "error");
    }

    // 4. Descargar
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Reporte_${tabActiva}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

const exportarExcel = async () => {
    await supabase.from("log_actividad").insert([{
      id_oficial: user?.id_oficial || null,
      id_alerta: null,
      accion: "ADMINISTRADOR",
      descripcion: `Exportó reporte Excel de ${tabActiva}`,
    }]);

    const headers =
      tabActiva === "oficiales"
        ? ["ESCALAFÓN", "OFICIAL", "ROL", "RANGO", "CELULAR", "ESTADO"]
        : ["CIUDADANO", "CÉDULA", "CELULAR", "ESTADO"];

    const body = datosFiltrados.map((item) =>
      tabActiva === "oficiales"
        ? [
            item.numero_escalafon || "—",
            item.nombre_completo,
            item.rol || "—",
            item.cargo || "—",
            item.celular || "—",
            item.estado === true ? "Conectado" : "Desconectado",
          ]
        : [
            item.nombre_completo,
            item.ci || "—",
            item.celular || "—",
            getEstadoDisplay(item),
          ]
    );

    exportExcel({
      titulo: tabActiva === "oficiales" ? "PERSONAL POLICIAL" : "REGISTRO DE CIUDADANOS",
      headers,
      body,
      nombreAdmin: user?.nombre_completo || "ADMINISTRADOR DE TURNO",
      filename: `Reporte_${tabActiva}.xlsx`,
    });
  };

  const getEstadoDisplay = (ciudadano) => {
    const estadoId = ciudadano.id_estado_ciudadano;
    if (estadoId === 1) return "NO VERIFICADO";
    if (estadoId === 2) return "VERIFICADO";
    if (estadoId === 3) return "ADVERTIDO";
    if (estadoId === 4) return "SUSPENDIDO";
    if (estadoId === 5) return "CORRECCION";
    return "DESCONOCIDO";
  };

  const datosFiltrados = (
    tabActiva === "oficiales" ? oficiales : ciudadanos
  ).filter((item) => {
    const termino = busqueda.toLowerCase().trim();

    if (tabActiva === "oficiales") {
      const estaConectado = item.estado === true;
      const cumpleFiltro =
        filtroActivo === "Todos" ||
        (filtroActivo === "conectado" && estaConectado) ||
        (filtroActivo === "desconectado" && !estaConectado);

      if (termino === "") return cumpleFiltro;

      const palabras = termino.split(/\s+/);
      const campos = [
        item.nombre_completo?.toLowerCase() || "",
        item.ci?.toLowerCase() || "",
        item.numero_escalafon?.toLowerCase() || "",
        item.rol?.toLowerCase() || "",
        item.cargo?.toLowerCase() || "",
      ];
      const cumpleBusqueda = palabras.every((palabra) =>
        campos.some((campo) => campo.includes(palabra))
      );

      return cumpleBusqueda && cumpleFiltro;
    }

    // Ciudadanos
    if (termino === "") return true;
    const palabras = termino.split(/\s+/);
    const campos = [
      item.nombre_completo?.toLowerCase() || "",
      item.ci?.toLowerCase() || "",
    ];
    return palabras.every((palabra) =>
      campos.some((campo) => campo.includes(palabra))
    );
  });

  if (cargando) {
    return (
      <div className="-mt-4 w-full px-1 py-5 bg-gray-50/30 min-h-screen flex items-center justify-center">
        <div className="text-green-800 font-bold text-lg">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="-mt-4 w-full px-1 py-4 space-y-5 animate-fadeIn pb-6 bg-slate-50/30">
      {/* SELECTOR DE TABS */}
      <div className="w-full bg-white p-3 rounded-2xl shadow-md border border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-100 shrink-0">
            <button
              onClick={() => {
                setTabActiva("oficiales");
                setFiltroActivo("Todos");
                setBusquedaCiudadanos("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-[12px] transition-all tracking-wider ${
                tabActiva === "oficiales"
                  ? "bg-[#113e27] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <FaUserTie size={12} />
              <span className="hidden sm:inline">OFICIALES</span>
            </button>
            <button
              onClick={() => {
                setTabActiva("ciudadanos");
                setFiltroActivo("Todos");
                setBusquedaOficiales("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-[12px] transition-all tracking-wider ${
                tabActiva === "ciudadanos"
                  ? "bg-[#113e27] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <FaUsers size={12} />
              <span className="hidden sm:inline">CIUDADANOS</span>
            </button>
          </div>

          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input
              type="text"
              placeholder={
                tabActiva === "oficiales"
                  ? "Buscar por nombre, CI, escalafón, rol o rango..."
                  : "Buscar por nombre o CI..."
              }
              className="w-full h-10 pl-8 pr-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none text-[11px] font-bold text-slate-700 transition-all border-b focus:bg-white focus:border-slate-400"
              value={busqueda}
              onChange={(e) =>
                tabActiva === "oficiales"
                  ? setBusquedaOficiales(e.target.value)
                  : setBusquedaCiudadanos(e.target.value)
              }
            />
          </div>

          {tabActiva === "oficiales" && (
            <button
              onClick={() => {
                setEditandoPolicia(null);
                setMostrarModalPolicia(true);
              }}
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg font-bold text-[11px] uppercase shadow text-white bg-[#113e27] hover:bg-[#164a2f] transition-all shrink-0"
            >
              <FaPlus size={10} /> Nuevo oficial
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {tabActiva === "oficiales" && (
            <div className="flex bg-gray-50 p-0.5 rounded-xl border border-gray-100">
              {["Todos", "conectado", "desconectado"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroActivo(f)}
                  className={`px-6 py-2.5 rounded-lg font-bold text-[11px] uppercase transition-all ${
                    filtroActivo === f
                      ? "bg-[#113e27] text-white"
                      : "text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {f === "conectado"
                    ? "Conectado"
                    : f === "desconectado"
                    ? "Desconectado"
                    : "Todos"}
                </button>
              ))}
            </div>
          )}

          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2.5 bg-white border-2 border-gray-200 text-slate-700 rounded-lg font-bold uppercase text-[11px] hover:border-slate-300 transition-all">
              <FaFileDownload size={11} /> <span>Exportar</span>
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={exportarExcel}
                className="w-full px-3 py-2 text-left hover:bg-green-50 text-black font-bold text-[10px] flex items-center gap-2"
              >
                <FaFileExcel className="text-green-800" size={11} /> Excel (.xls)
              </button>
              <button
                onClick={exportarPDF}
                className="w-full px-3 py-2 text-left hover:bg-red-50 text-black font-bold text-[10px] flex items-center gap-2"
              >
                <FaFilePdf className="text-red-700" size={11} /> PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-50 text-left">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-black uppercase tracking-tight text-[#1e293b]">
            {tabActiva === "oficiales" ? "Personal Policial" : "Registro de Ciudadanos"}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3 table-fixed">
            <thead>
              <tr className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wider">
                <th className="px-3 pb-2 w-[8%] text-left">ID</th>
                <th className="pb-2 w-[22%] text-left">
                  {tabActiva === "oficiales" ? "Oficial" : "Ciudadano"}
                </th>
                {tabActiva === "oficiales" ? (
                  <>
                    <th className="pb-2 w-[18%] text-left">Escalafón / Rol</th>
                    <th className="pb-2 w-[12%] text-left">Rango</th>
                    <th className="pb-2 w-[12%] text-left">Celular</th>
                    <th className="px-0 pb-2 w-[12%] text-left">Estado</th>
                  </>
                ) : (
                  <>
                    <th className="pb-2 w-[12%] text-left">Cédula</th>
                    <th className="pb-2 w-[12%] text-left">Celular</th>
                    <th className="px-0 pb-2 w-[14%] text-left">Estado</th>
                  </>
                )}
                <th className="px-4 pb-2 w-[10%] text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.map((item, i) => {
                const esOficial = tabActiva === "oficiales";
                const idMostrar = esOficial
                  ? `ROF-${String(item.id_oficial).padStart(4, "0")}`
                  : `REGC-${String(item.id_usuario).padStart(4, "0")}`;

                let estaConectado = false;
                if (esOficial) {
                  estaConectado = item.estado === true;
                }

                const advertencias = !esOficial ? (item.advertencias ?? 0) : 0;
                const estadoDisplay = !esOficial ? getEstadoDisplay(item) : null;
                const mostrarContador =
                  !esOficial && estadoDisplay === "ADVERTIDO";

                return (
                  <tr
                    key={i}
                    className="bg-white group transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    <td className="px-3 py-3 text-[10px] font-bold text-slate-400 border-y border-l rounded-l-xl border-gray-50 uppercase text-left">
                      {idMostrar}
                    </td>
                    <td className="py-3 border-y border-gray-50">
                      <div className="flex items-center gap-3 text-left">
                        <div
                          className={`w-6 h-8 rounded-md flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${
                            !esOficial
                              ? "bg-blue-50 text-[#0C3DC2]"
                              : "bg-green-50 text-green-700"
                          }`}
                        >
                          {!esOficial ? (
                            item.nombre_completo?.charAt(0)
                          ) : (
                            <FaShieldAlt size={14} />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[#1e293b] leading-tight truncate">
                            {item.nombre_completo}
                          </span>
                        </div>
                      </div>
                    </td>
                    {esOficial ? (
                      <>
                        <td className="py-3 text-[10px] font-bold text-slate-500 border-y border-gray-50 text-left">
                          {item.numero_escalafon || "—"} - {item.rol || "—"}
                        </td>
                        <td className="py-3 text-[11px] font-extrabold text-slate-600 border-y border-gray-50 text-left">
                          {item.cargo || "—"}
                        </td>
                        <td className="py-3 text-[10px] font-bold text-slate-500 border-y border-gray-50 text-left">
                          {item.celular || "—"}
                        </td>
                        <td className="py-3 border-y border-gray-50 text-left">
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex py-1.5 w-16px md:w-24 rounded-md text-[9px] font-bold tracking-wider text-white justify-center uppercase shadow-sm ${
                                  estaConectado ? "bg-[#007942]" : "bg-[#C90A0A]"
                                }`}
                              >
                                {estaConectado ? "Conectado" : "Desconectado"}
                              </span>
                              {item.acceso === "FUERA DE SERVICIO" && (
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-[#C90A0A] text-[#C90A0A] shadow-sm">
                                  <FaPowerOff size={10} />
                                </div>
                              )}
                              {item.acceso === "DE BAJA" && (
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-[#C90A0A] text-[#C90A0A] shadow-sm">
                                  <FaUserSlash size={10} />
                                </div>
                              )}
                            </div>
                            {item.acceso === "FUERA DE SERVICIO" && (
                              <span className="text-[8px] font-bold uppercase tracking-wide text-[#C90A0A] leading-none">
                                FUERA DE SERVICIO
                              </span>
                            )}
                            {item.acceso === "DE BAJA" && (
                              <span className="text-[8px] font-bold uppercase tracking-wide text-[#C90A0A] leading-none">
                                DADO DE BAJA
                              </span>
                            )}
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 text-[11px] font-bold text-slate-500 border-y border-gray-50 text-left">
                          {item.ci || "—"}
                        </td>
                        <td className="py-3 text-[11px] font-extrabold text-slate-600 border-y border-gray-50 text-left">
                          {item.celular || "—"}
                        </td>
                        <td className="py-3 border-y border-gray-50 text-left">
                          <div className="flex flex-col items-start justify-center gap-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`inline-flex py-1.5 px-2.5 rounded-md text-[10px] font-bold tracking-wider uppercase text-white ${
                                  estadoDisplay === "VERIFICADO"
                                    ? "bg-[#0172e3]"
                                    : estadoDisplay === "NO VERIFICADO"
                                    ? "bg-[#9da1a3]"
                                    : estadoDisplay === "ADVERTIDO"
                                    ? "bg-[#c64114]"
                                    : estadoDisplay === "SUSPENDIDO"
                                    ? "bg-[#C90A0A]"
                                    : "bg-[#9da1a3]"
                                }`}
                              >
                                {estadoDisplay}
                              </span>
                              {mostrarContador && (
                                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-[#e67402] text-[#e67402] text-[10px] font-black shadow-sm">
                                  {advertencias}
                                </div>
                              )}
                            </div>
                            {estadoDisplay === "ADVERTIDO" && (
                              <span className="text-[8px] font-bold uppercase tracking-wide text-[#e67402] leading-none">
                                ALERTAS DESESTIMADAS
                              </span>
                            )}
                            {estadoDisplay === "SUSPENDIDO" && (
                              <span className="text-[8px] font-black uppercase tracking-tighter text-[#C90A0A] leading-none">
                                LÍMITE DE ADVERTENCIAS
                              </span>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 border-y border-r rounded-r-xl border-gray-50 text-left">
                      <div className="flex items-center gap-2">
                        {esOficial ? (
                          <>
                            <button
                              onClick={() => setOficialSeleccionado(item)}
                              className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-[#113e27] hover:text-white transition-all duration-200"
                              title="Ver perfil"
                            >
                              <FaEye size={11} />
                            </button>
                            <button
                              onClick={() => {
                                setEditandoPolicia(item);
                                setMostrarModalPolicia(true);
                              }}
                              className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-[#113e27] hover:text-white transition-all duration-200"
                              title="Editar"
                            >
                              <FaEdit size={11} />
                            </button>
                            <button
                              onClick={() => eliminarOficial(item.id_oficial)}
                              className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-[#C90A0A] hover:text-white transition-all duration-200"
                              title="Eliminar"
                            >
                              <FaTrashAlt size={11} />
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() =>
                              setCiudadanoSeleccionado({
                                nombre: item.nombre_completo,
                                id: item.id_usuario,
                                ci: item.ci,
                                celular: item.celular,
                                email: item.email,
                                foto_ci: item.foto_ci,
                                selfie: item.selfie,
                                id_estado_ciudadano: item.id_estado_ciudadano,
                                fecha_registro: item.fecha_registro,
                                advertencias: item.advertencias,
                                motivo_rechazo: item.motivo_rechazo,
                              })
                            }
                            className="p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-[#113e27] hover:text-white transition-all duration-200"
                            title="Ver perfil"
                          >
                            <FaEye size={11} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {datosFiltrados.length === 0 && (
                <tr>
                  <td
                    colSpan={tabActiva === "oficiales" ? 7 : 6}
                    className="text-center py-12 text-gray-400 font-medium"
                  >
                    No hay registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NuevoPolicia
  isOpen={mostrarModalPolicia}
  onClose={() => setMostrarModalPolicia(false)}
  onGuardado={cargarOficiales}
  editandoPolicia={editandoPolicia}
  onToast={showToast}
  usuarioActual={user}
/>

      <PerfilCiudadano
  ciudadano={ciudadanoSeleccionado}
  onClose={() => setCiudadanoSeleccionado(null)}
  onActualizar={cargarCiudadanos}
  usuarioActual={user}
/>

      {/* MODAL PERFIL OFICIAL */}
      <PerfilOficial
        oficial={oficialSeleccionado}
        onClose={() => setOficialSeleccionado(null)}
      />

      {/* MODAL CONFIRMAR ELIMINAR */}
      {confirmarEliminar && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
          <div className="relative bg-white rounded-2xl shadow-2xl min-w-[500px] max-w-sm overflow-hidden min-h-[360px] flex flex-col justify-between">
            <div className="bg-[#113e27] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaTrashAlt className="text-white" size={16} />
                <h2 className="text-white font-extrabold text-[15px] uppercase tracking-wider">Eliminar Oficial</h2>
              </div>
              <button
                onClick={() => setConfirmarEliminar(null)}
                className="hover:bg-white/20 p-1.5 rounded-md transition-colors text-white"
              >
                <FaTimes size={14} />
              </button>
            </div>
            <div className="p-6 space-y-4" style={{ paddingBottom: "115px" }}>
              <p className="text-slate-500 text-[15px] tracking-wide font-bold text-center pb-2">
                ¿Está seguro que desea eliminar al oficial?
              </p>
              <div className="w-full mt-6 px-2 py-4 bg-slate-50 uppercase border border-slate-200 rounded-xl text-center font-extrabold text-[14px] text-[#113e27]">
                {confirmarEliminar.nombre_completo}
              </div>
              <p className="text-[11px] text-slate-400 text-center font-bold uppercase tracking-wider">
                Esta acción no se puede deshacer
              </p>
             <div className="flex justify-center bg-slate-100/80 -mx-6 gap-6 px-3 py-4 absolute bottom-0 left-0 right-0">
                <button
                  onClick={() => setConfirmarEliminar(null)}
                  className="w-40 px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-300 transition-all shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminarOficial}
                  className="w-64 px-12 py-3 bg-[#113e27] hover:bg-[#164a2f] rounded-lg font-bold text-[11px] uppercase tracking-wider text-white transition-all shadow-md"
                >
                  Sí, eliminar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;
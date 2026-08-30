import React, { useState, useEffect, useCallback } from "react";
import {
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
  FaTrashAlt,
  FaTimes,
  FaUserShield,
  FaClock,
} from "react-icons/fa";
import { FiEye, FiEdit2, FiTrash2 } from "react-icons/fi";
import { exportPDF } from "../utils/exports/exportPDF";
import { exportExcel } from "../utils/exports/exportExcel";
import { supabase } from "../services/supabase";
import PerfilCiudadano from "../components/modals/PerfilCiudadano";
import NuevoPolicia from "../components/modals/NuevoPolicia";
import { useToast } from "../context/ToastContext";
import { useAuth } from "../context/AuthContext";

// ─── Modal de perfil de oficial — ALTERNATIVA 2 "ficha de reporte" ──────────
// Mismo contrato de props que el original: { oficial, onClose }
function PerfilOficial({ oficial, onClose }) {
  if (!oficial) return null;

  const estaConectado = oficial.estado === true;
  const deBaja = oficial.acceso === "DE BAJA";
  const fueraDeServicio = oficial.acceso === "FUERA DE SERVICIO";
  const pendiente = oficial.acceso === "PENDIENTE";

  const estadoTexto = deBaja
    ? "Dado de baja"
    : pendiente
      ? "Pendiente de activación"
      : fueraDeServicio
        ? "Fuera de servicio"
        : estaConectado
          ? "En línea"
          : "Desconectado";

  const estadoColor = deBaja
    ? "#6b7280"
    : pendiente
      ? "#d97706"
      : fueraDeServicio
        ? "#C90A0A"
        : estaConectado
          ? "#007942"
          : "#94a3b8";

  const Fila = ({ label, value }) => (
    <div className="space-y-1">
      <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
        {label}
      </label>
      <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[12px] font-medium text-slate-600">
        {value || "—"}
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />

      <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col h-fit max-h-[92vh] animate-fadeIn">
        {/* Barra verde */}
        <div className="relative bg-[#474b29] py-4 shrink-0 flex items-center pl-24 pr-4">
          <div>
            <h2 className="text-white text-[17px] font-bold uppercase tracking-wider leading-none ml-1">
              Perfil Oficial
            </h2>
            <p className="text-[11px] font-bold text-white/70 uppercase tracking-wider mt-2 ml-1">
              ROF-{String(oficial.id_oficial).padStart(4, "0")} ·{" "}
              {oficial.rol || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 hover:bg-white/20 p-1.5 rounded-md transition-colors text-white"
          >
            <FaTimes size={15} />
          </button>
        </div>

        {/* Ícono cuadrado, sobresaliendo de la barra */}
        <div className="relative pl-4 pt-2 pb-6 shrink-0">
          <div className="relative w-16 h-16 -mt-12 ml-2">
            <div className="w-16 h-16 rounded-2xl bg-[#474b29] border-[3px] border-white shadow-lg flex items-center justify-center">
              <FaUserShield className="text-white" size={26} />
            </div>
            <span
              className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white"
              style={{ backgroundColor: estadoColor }}
            />
          </div>
        </div>

        {/* Datos en formato de tarjetas tipo "textbox" */}
        <div className="px-6 pb-4 overflow-y-auto">
          <div className="mt-1 grid grid-cols-2 gap-x-7 gap-y-4">
            <div className="col-span-2">
              <Fila label="Nombre completo" value={oficial.nombre_completo} />
            </div>
            <Fila label="Cédula de identidad" value={oficial.ci} />
            <Fila label="Celular" value={oficial.celular} />
            <Fila label="N.º de escalafón" value={oficial.numero_escalafon} />
            <Fila label="Rango" value={oficial.cargo} />
            <Fila label="Rol en el sistema" value={oficial.rol} />
            <Fila
              label="Estado de servicio"
              value={
                oficial.acceso === "EN SERVICIO"
                  ? "En servicio"
                  : oficial.acceso === "FUERA DE SERVICIO"
                    ? "Fuera de servicio"
                    : oficial.acceso === "DE BAJA"
                      ? "De baja"
                      : oficial.acceso === "PENDIENTE"
                        ? "Pendiente de activación"
                        : "—"
              }
            />
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex justify-end gap-4 px-5 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg font-medium text-[11.5px] border uppercase border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors tracking-wider"
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
  const [adminActivo, setAdminActivo] = useState({
    nombre: "ADMINISTRADOR DE TURNO",
    cargo: "Administrador del Sistema",
  });
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
        return (
          o.estado === true &&
          (rolLower === "admin" || rolLower === "administrador")
        );
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
    estadoActual,
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

        const ciudadano = ciudadanos.find((c) => c.id_usuario === idUsuario);
        const nombre = ciudadano?.nombre_completo || `Ciudadano #${idUsuario}`;
        if (nuevoEstado === 3)
          showToast(`${nombre} tiene ${advertencias} advertencia(s)`, "error");
        if (nuevoEstado === 4)
          showToast(`${nombre} ha sido suspendido`, "error");

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
          estadoAnterior,
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

  // Fuerza un re-render cada 10s para que el badge Conectado/Desconectado
  // "venza" solo aunque no lleguen cambios nuevos desde Supabase.
  const [, forzarRefrescoVisual] = useState(0);
  useEffect(() => {
    const intervaloVisual = setInterval(() => {
      forzarRefrescoVisual((n) => n + 1);
    }, 10000);
    return () => clearInterval(intervaloVisual);
  }, []);

  const eliminarOficial = async (id) => {
    const oficial = oficiales.find((o) => o.id_oficial === id);
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
      showToast(
        `**Oficial** ${oficial?.nombre_completo} eliminado del sistema`,
        "error",
      );
      await supabase.from("log_actividad").insert([
        {
          id_oficial: user?.id_oficial || null,
          id_alerta: null,
          accion: "ADMINISTRADOR",
          descripcion: `Eliminó al oficial con escalafón ${oficial?.numero_escalafon || id} — ${oficial?.nombre_completo}`,
        },
      ]);
      await cargarOficiales();
    }
  };

  const exportarPDF = async () => {
    await supabase.from("log_actividad").insert([
      {
        id_oficial: user?.id_oficial || null,
        id_alerta: null,
        accion: "ADMINISTRADOR",
        descripcion: `Exportó reporte PDF de ${tabActiva}`,
      },
    ]);

    let logoBase64 = null;
    try {
      const res = await fetch("/logo_of.png");
      const blob = await res.blob();
      logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (_) {
      logoBase64 = null;
    }

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
          ],
    );

    const nombreArchivo = `reportes/${tabActiva}_reporte.pdf`;

    // 1. Obtener la URL pública del archivo en Supabase Storage (mismo patrón que ActividadLog.jsx)
    const { data: urlData } = supabase.storage
      .from("reportes")
      .getPublicUrl(nombreArchivo);
    const urlPublica = `${urlData.publicUrl}?t=${Date.now()}`;

    // 2. Generar el PDF ya con el QR apuntando a esa URL
    const pdfBlob = await exportPDF({
      titulo:
        tabActiva === "oficiales"
          ? "PERSONAL POLICIAL"
          : "REGISTRO DE CIUDADANOS",
      subtitulo:
        tabActiva === "oficiales"
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
      .upload(nombreArchivo, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

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
    await supabase.from("log_actividad").insert([
      {
        id_oficial: user?.id_oficial || null,
        id_alerta: null,
        accion: "ADMINISTRADOR",
        descripcion: `Exportó reporte Excel de ${tabActiva}`,
      },
    ]);

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
          ],
    );

    exportExcel({
      titulo:
        tabActiva === "oficiales"
          ? "PERSONAL POLICIAL"
          : "REGISTRO DE CIUDADANOS",
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

  const getWhatsappLink = (celular) => {
    if (!celular) return null;
    let soloNumeros = celular.replace(/\D/g, "");
    if (!soloNumeros) return null;
    // Evita duplicar el código de país si ya viene incluido,
    // y evita anteponerlo si el número ya tiene más de 8 dígitos con otro prefijo válido
    if (!soloNumeros.startsWith("591")) {
      soloNumeros = `591${soloNumeros}`;
    }
    return `https://wa.me/${soloNumeros}`;
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
        item.celular?.toLowerCase() || "",
      ];
      const cumpleBusqueda = palabras.every((palabra) =>
        campos.some((campo) => campo.includes(palabra)),
      );

      return cumpleBusqueda && cumpleFiltro;
    }

    // Ciudadanos
    if (termino === "") return true;
    const palabras = termino.split(/\s+/);
    const campos = [
      item.nombre_completo?.toLowerCase() || "",
      item.ci?.toLowerCase() || "",
      item.celular?.toLowerCase() || "",
    ];
    return palabras.every((palabra) =>
      campos.some((campo) => campo.includes(palabra)),
    );
  });

  if (cargando) {
    return (
      <div className="-mt-4 w-full px-1 py-5 bg-gray-50/30 min-h-screen flex items-center justify-center">
        <div className="text-green-800 font-bold text-lg">
          Cargando usuarios...
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col animate-fadeIn bg-gray-50/30 overflow-hidden px-0 py-1">
      {/* SELECTOR DE TABS */}
      <div className="w-full bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 -mt-1.5">
        <div className="flex items-center gap-4 flex-1 min-w-[200px] shrink-0">
          {/* Tabs Oficiales / Ciudadanos */}
          <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200 shrink-0">
            <button
              onClick={() => {
                setTabActiva("oficiales");
                setFiltroActivo("Todos");
                setBusquedaCiudadanos("");
              }}
              className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-3 rounded-lg font-medium text-[12.5px] transition-all tracking-widest ${
                tabActiva === "oficiales"
                  ? "bg-[#474b29] text-white shadow-md"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="hidden sm:inline">OFICIALES</span>
            </button>
            <button
              onClick={() => {
                setTabActiva("ciudadanos");
                setFiltroActivo("Todos");
                setBusquedaOficiales("");
              }}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-[12px] transition-all tracking-widest ${
                tabActiva === "ciudadanos"
                  ? "bg-[#474b29] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <span className="hidden sm:inline">CIUDADANOS</span>
            </button>
          </div>

          {/* Buscador */}
          <div className="relative flex-1 min-w-[160px]">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-slate-400" />
            <input
              type="text"
              placeholder={
                tabActiva === "oficiales"
                  ? "Buscar por nombre, CI, celular, escalafón, rol o rango..."
                  : "Buscar por nombre, CI o celular..."
              }
              className="w-full h-11 pl-10 pr-3 md:pr-5 py-2 md:py-3 bg-gray-50/50 border border-gray-200 rounded-xl outline-none text-[12px] font-medium text-slate-700 transition-all focus:bg-white focus:border-[#474b29] tracking-wider"
              value={busqueda}
              onChange={(e) =>
                tabActiva === "oficiales"
                  ? setBusquedaOficiales(e.target.value)
                  : setBusquedaCiudadanos(e.target.value)
              }
            />
          </div>

          {/* Nuevo oficial -> ahora a la izquierda */}
          {tabActiva === "oficiales" && (
            <button
              onClick={() => {
                setEditandoPolicia(null);
                setMostrarModalPolicia(true);
              }}
              className="relative flex items-center gap-2 px-5 py-2 h-11 rounded-lg tracking-wider font-medium text-[12px] uppercase shadow text-white bg-[#474b29] hover:bg-[#3a3e21] transition-all shrink-0"
            >
              <FaPlus size={11} /> Nuevo oficial
            </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Filtros Todos / Conectado / Desconectado -> ahora a la derecha */}
          {tabActiva === "oficiales" && (
            <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200 shrink-0 whitespace-nowrap text-[12px] tracking-wider font-medium">
              {["Todos", "conectado", "desconectado"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroActivo(f)}
                  className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-3 rounded-lg uppercase font-bold text-xs transition-all tracking-wider whitespace-nowrap ${
                    filtroActivo === f
                      ? "bg-[#474b29] text-white shadow-md"
                      : "text-slate-400 hover:text-slate-600"
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

          {/* Exportar */}
          <div className="relative group shrink-0">
            <button className="flex items-center gap-2 px-1 md:px-5 py-2 md:py-3 bg-white border-2 border-gray-200 text-slate-700 rounded-lg font-medium uppercase text-[12px] hover:border-slate-300 transition-all disabled:opacity-70 disabled:cursor-wait tracking-wider">
              <FaFileDownload size={11} /> <span>Exportar</span>
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={exportarExcel}
                className="w-full px-3 py-2 text-left hover:bg-green-50 text-black font-bold text-[10px] flex items-center gap-2"
              >
                <FaFileExcel className="text-green-800" size={11} /> Excel
                (.xls)
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
      <div className="relative top-1 w-full bg-white px-4 md:px-7 py-4 md:py-6 rounded-2xl shadow-md flex flex-col flex-1 min-h-0 max-h-[79svh] overflow-hidden mt-6">
        <div className="flex items-center justify-between mb-4 md:mb-6 flex-shrink-0 flex-wrap gap-2">
          <h2 className="text-[18px] font-bold uppercase text-[#1e293b] tracking-wider flex-shrink-0">
            {tabActiva === "oficiales"
              ? "Personal Policial"
              : "Registro de Ciudadanos"}
          </h2>
          {tabActiva === "oficiales" &&
            oficiales.filter((o) => o.acceso === "PENDIENTE").length > 0 && (
              <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-lg border bg-gray-50  font-extrabold uppercase tracking-wider  border-gray-200">
                <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wide">
                  ● {oficiales.filter((o) => o.acceso === "PENDIENTE").length}{" "}
                  pendiente(s) a activar
                </span>
              </div>
            )}
        </div>

        <div className="relative flex-1 min-h-0">
          <div className="h-full overflow-auto -mx-4 md:mx-0 px-4 md:px-0 pb-3 scroll-hover">
            <table className="min-w-full border-separate border-spacing-0 table-fixed">
              <thead>
                <tr className="text-slate-400 text-[11px] font-medium uppercase tracking-widest">
                  <th className="sticky top-0 z-10 bg-white px-3 pb-3 pt-1 border-b border-slate-200 w-[10%] text-left md:pr-2">
                    ID
                  </th>
                  <th className="sticky top-0 z-10 bg-white pb-3 pt-1 border-b border-slate-200 w-[30%] text-left">
                    {tabActiva === "oficiales" ? "Oficial" : "Ciudadano"}
                  </th>
                  {tabActiva === "oficiales" ? (
                    <>
                      <th className="sticky top-0 z-10 bg-white pb-3 pt-1 border-b border-slate-200 w-[12%] text-left">
                        Escalafón / Rol
                      </th>
                      <th className="sticky top-0 z-10 bg-white pb-3 pt-1 border-b border-slate-200 w-[10%] text-left">
                        Rango
                      </th>
                      <th className="sticky top-0 z-10 bg-white pb-3 pt-1 border-b border-slate-200 w-[10%] text-left">
                        Celular
                      </th>
                      <th className="sticky top-0 z-10 bg-white px-0 pb-3 pt-1 border-b border-slate-200 w-[10%] text-left">
                        Estado
                      </th>
                    </>
                  ) : (
                    <>
                      <th className="sticky top-0 z-10 bg-white pb-3 pt-1 border-b border-slate-200 w-[10%] text-left">
                        Cédula
                      </th>
                      <th className="sticky top-0 z-10 bg-white pb-3 pt-1 border-b border-slate-200 w-[10%] text-left">
                        Celular
                      </th>
                      <th className="sticky top-0 z-10 bg-white px-0 pb-3 pt-1 border-b border-slate-200 w-[12%] text-left">
                        Estado
                      </th>
                    </>
                  )}
                  <th className="sticky top-0 z-10 bg-white px-4 pb-3 pt-1 border-b border-slate-200 w-[10%] text-left">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody>
                {datosFiltrados.map((item, i) => {
                  const esOficial = tabActiva === "oficiales";
                  const idMostrar = esOficial
                    ? `ROF-${String(item.id_oficial).padStart(4, "0")}`
                    : `REGC-${String(item.id_usuario).padStart(4, "0")}`;

                  const UMBRAL_CONEXION_MS = 45000; // 3x el intervalo del heartbeat (15s)
                  const estaConectado =
                    esOficial &&
                    item.estado === true &&
                    item.ultima_actividad &&
                    Date.now() - new Date(item.ultima_actividad).getTime() <
                      UMBRAL_CONEXION_MS;

                  const advertencias = !esOficial
                    ? (item.advertencias ?? 0)
                    : 0;
                  const estadoDisplay = !esOficial
                    ? getEstadoDisplay(item)
                    : null;
                  const mostrarContador =
                    !esOficial && estadoDisplay === "ADVERTIDO";

                  return (
                    <tr
                      key={i}
                      className="bg-white group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-6 md:py-7 text-[11px] font-medium text-slate-500/90 uppercase tracking-wider align-middle border-b border-slate-200/60">
                        {idMostrar}
                      </td>
                      <td className="py-5 md:py-6 border-b border-slate-200/60 align-middle">
                        <div className="flex items-center gap-3 text-left">
                          <div
                            className={`w-6 h-8 rounded-md flex items-center justify-center font-black text-xs shadow-inner shrink-0r ${
                              !esOficial
                                ? "bg-blue-50 text-[#270cb2]"
                                : "bg-[#474b29]/10 text-[#474b29]"
                            }`}
                          >
                            {!esOficial ? (
                              item.nombre_completo?.charAt(0)
                            ) : (
                              <FaShieldAlt size={14} />
                            )}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12.5px] font-medium text-[#1e293b] truncate max-w-[120px] md:max-w-none">
                              {item.nombre_completo}
                            </span>
                            {esOficial && item.ci && (
                              <span className="mt-0.5 text-[8.5px] font-medium uppercase tracking-wider text-slate-400">
                                CI {item.ci}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      {esOficial ? (
                        <>
                          <td className="py-5 md:py-6 align-middle border-b border-slate-200/60">
                            <div className="flex flex-col">
                              <span className="text-[11px] font-extrabold tracking-wider text-slate-500 mb-0.5">
                                {item.numero_escalafon || "—"}
                              </span>
                              <span className="text-[12px] font-medium text-slate-500 uppercase tracking-wider">
                                {item.rol || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="border-b border-slate-200/60 py-5 md:py-6 text-[11px] uppercase font-medium tracking-wider text-slate-600 align-middle">
                            {item.cargo || "—"}
                          </td>
                          <td className="border-b border-slate-200/60 py-5 md:py-6 text-[11px] uppercase font-medium tracking-wider text-slate-600 align-middle">
                            {item.celular ? (
                              <a
                                href={getWhatsappLink(item.celular)}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-[#474b29] hover:underline transition-colors"
                                title="Abrir en WhatsApp"
                              >
                                {item.celular}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-5 md:py-6 align-middle border-b border-slate-200/60">
                            <div className="flex flex-col items-start gap-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center justify-center gap-1.5 py-1.5 uppercase rounded-md text-[11px] font-medium tracking-wider ${
                                    estaConectado
                                      ? "px-2 bg-[#007942] text-white"
                                      : "px-2.5 bg-slate-100 text-slate-600 border borde-slate-200"
                                  }`}
                                >
                                  {estaConectado ? "Conectado" : "Desconectado"}
                                </span>
                                {item.acceso === "FUERA DE SERVICIO" && (
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-slate-500/80 text-slate-500/80">
                                    <FaPowerOff size={10} />
                                  </div>
                                )}
                                {item.acceso === "DE BAJA" && (
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-[#C90A0A] text-[#C90A0A]">
                                    <FaUserSlash size={10} />
                                  </div>
                                )}
                                {item.acceso === "PENDIENTE" && (
                                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-white border-2 border-amber-500 text-amber-500">
                                    <FaClock size={10} />
                                  </div>
                                )}
                              </div>
                              {item.acceso === "FUERA DE SERVICIO" && (
                                <span className="text-[9px] font-medium uppercase tracking-wider text-slate-500/80 leading-none mt-0.5">
                                  FUERA DE SERVICIO
                                </span>
                              )}
                              {item.acceso === "DE BAJA" && (
                                <span className="text-[9px] font-medium uppercase tracking-wider text-[#C90A0A] leading-none mt-0.5">
                                  DADO DE BAJA
                                </span>
                              )}
                              {item.acceso === "PENDIENTE" && (
                                <span className="text-[9px] font-medium uppercase tracking-wider text-amber-500 leading-none mt-0.5">
                                  PENDIENTE DE ACTIVACIÓN
                                </span>
                              )}
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          <td className="py-5 border-b border-slate-200/60 md:py-6 text-[11px] uppercase font-medium tracking-wider text-slate-500 align-middle">
                            {item.ci || "—"}
                          </td>
                          <td className="border-b border-slate-200/60 py-5 md:py-6 text-[12px] font-bold text-slate-500 align-middle">
                            {item.celular || "—"}
                          </td>
                          <td className="py-5 md:py-6 border-b border-slate-200/60 align-middle">
                            <div className="flex flex-col items-start justify-center gap-1">
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`inline-flex items-center justify-center gap-1.5 py-1.5 uppercase rounded-md text-[11px] font-medium tracking-wider text-white ${
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
                                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wide text-[#e67402] leading-none">
                                  ALERTAS DESESTIMADAS
                                </span>
                              )}
                              {estadoDisplay === "SUSPENDIDO" && (
                                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-tighter text-[#C90A0A] leading-none">
                                  LÍMITE DE ADVERTENCIAS
                                </span>
                              )}
                            </div>
                          </td>
                        </>
                      )}
                      <td className="px-4 py-5 md:py-6 border-b border-slate-200/60 align-middle">
                        <div className="flex items-center gap-3">
                          {esOficial ? (
                            <>
                              <button
                                onClick={() => setOficialSeleccionado(item)}
                                className="p-2 md:p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-[#474B29] hover:text-white transition-all duration-200 flex items-center justify-center"
                                title="Ver perfil"
                              >
                                <FiEye size={14} />
                              </button>
                              <button
                                onClick={() => {
                                  setEditandoPolicia(item);
                                  setMostrarModalPolicia(true);
                                }}
                                className="p-2 md:p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-[#474B29] hover:text-white transition-all duration-200 flex items-center justify-center"
                                title="Editar"
                              >
                                <FiEdit2 size={14} />
                              </button>
                              <button
                                onClick={() => eliminarOficial(item.id_oficial)}
                                className="p-2 md:p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-[#C90A0A] hover:text-white transition-all duration-200 flex items-center justify-center"
                                title="Eliminar"
                              >
                                <FiTrash2 size={14} />
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
                              className="p-1.5 md:p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-[#474B29] hover:text-white transition-all duration-200 flex items-center justify-center"
                              title="Ver perfil"
                            >
                              <FiEye size={14} />
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
                      className="border-b border-slate-200/60 text-center py-12 text-gray-400 font-medium"
                    >
                      No hay registros
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
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
            <div className="bg-[#474b29] px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FaTrashAlt className="text-white" size={16} />
                <h2 className="text-white font-extrabold text-[15px] uppercase tracking-wider">
                  Eliminar Oficial
                </h2>
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
                  className="w-40 px-6 py-3 bg-slate-200 hover:bg-slate-300 rounded-full font-bold text-[11px] uppercase tracking-wider text-slate-600 border-b border-slate-300 transition-all shadow-sm"
                >
                  Cancelar
                </button>
                <button
                  onClick={confirmarEliminarOficial}
                  className="w-64 px-12 py-3 bg-[#474b29] hover:bg-[#3a3e21] rounded-full font-bold text-[11px] uppercase tracking-wider text-white transition-all shadow-md"
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

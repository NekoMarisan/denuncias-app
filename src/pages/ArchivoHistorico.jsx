import React, { useState, useEffect } from "react";
import {
  FaEye,
  FaFilePdf,
  FaSearch,
  FaFileExcel,
  FaDownload,
  FaFileDownload,
  FaClipboardCheck,
  FaBan,
  FaSpinner,
} from "react-icons/fa";
import { supabase } from "../services/supabase";
import {
  ArchivoHistoricoSkeleton,
  ArchivoHistoricoCardSkeleton,
} from "../components/ui/Skeleton";
import { exportPDFDesestimacion } from "../utils/exports/exportPDFDesestimacion";
import FormularioDesestimados from "../components/modals/FormularioDesestimados";
import FormularioTabulacion from "../components/modals/FormularioTabulacion";
import { exportPDFArchivoHis } from "../utils/exports/exportPDFArchivoHis";
import { exportExcelArchivoHis } from "../utils/exports/exportExcelArchivoHis";
import { useAuth } from "../context/AuthContext";
const ArchivoHistorico = ({
  alertasTabuladas,
  tabuladasCompletas = [],
  onGenerarPDFTabulada,
  onBack,
}) => {
  const { user } = useAuth();
  const [busqueda, setBusqueda] = useState("");
  const [tabActiva, setTabActiva] = useState("TABULADO");
  const [tabCargando, setTabCargando] = useState(false); // ✅ loading al cambiar de tab
  const [filtroTiempo, setFiltroTiempo] = useState("TODO");
  const [desestimadas, setDesestimadas] = useState([]);
  const [cargandoDesestimadas, setCargandoDesestimadas] = useState(true);
  const [selectedDesestimada, setSelectedDesestimada] = useState(null);
  const [showModalDesestimada, setShowModalDesestimada] = useState(false);
  const [selectedTabulada, setSelectedTabulada] = useState(null);
  const [showModalTabulada, setShowModalTabulada] = useState(false);
  const [clasificacionTabuladorModal, setClasificacionTabuladorModal] =
    useState(null);
  const [derivacionModal, setDerivacionModal] = useState(null);

  // ✅ Estados de carga para acciones puntuales
  const [modalLoadingId, setModalLoadingId] = useState(null); // id de la tarjeta cuyo modal "Ver" está abriendo
  const [pdfLoadingId, setPdfLoadingId] = useState(null); // id de la tarjeta cuyo PDF se está generando
  const [exportLoading, setExportLoading] = useState(null); // null | 'excel' | 'pdf'

  useEffect(() => {
    const cargarDesestimadas = async () => {
      setCargandoDesestimadas(true);
      try {
        const { data, error } = await supabase
          .from("alerta_desestimada")
          .select(
            `
            id_desestimado,
            id_alerta,
            motivo,
            justificacion_adicional,
            fecha_hora,
            id_operador,
            alerta:alerta (
              id_alerta,
              codigo_alerta,
              fecha_hora,
              descripcion,
              ubicacion,
              contravenciones,
              delitos,
              prioridad,
              id_operador_receptor,
              usuario_ciudadano (
                nombre_completo,
                ci,
                celular
              )
            )
          `,
          )
          .order("fecha_hora", { ascending: false });
        if (error) throw error;

        const desestimadasConAsignacion = await Promise.all(
          (data || []).map(async (item) => {
            const alertaData = item.alerta;
            let id_despachador = null,
              id_patrullero = null;
            if (alertaData?.id_alerta) {
              const { data: asigData } = await supabase
                .from("asignacion_patrulla")
                .select("id_despachador, id_patrullero")
                .eq("id_alerta", alertaData.id_alerta)
                .order("id_asignacion", { ascending: false })
                .limit(1)
                .maybeSingle();
              if (asigData) {
                id_despachador = asigData.id_despachador;
                id_patrullero = asigData.id_patrullero;
              }
            }
            return {
              id_alerta: alertaData?.id_alerta,
              id: alertaData?.codigo_alerta || `DES-${item.id_alerta}`,
              ciudadano:
                alertaData?.usuario_ciudadano?.nombre_completo || "Desconocido",
              fecha: new Date(item.fecha_hora).toLocaleDateString("es-BO"),
              incidente: item.motivo,
              estado: "DESESTIMADO",
              prioridad: alertaData?.prioridad,
              motivoDesestimacion: item.motivo,
              justificacion: item.justificacion_adicional,
              fecha_desestimo: item.fecha_hora,
              id_operador_desestimo: item.id_operador,
              alerta_completa: alertaData,
              ci: alertaData?.usuario_ciudadano?.ci,
              celular: alertaData?.usuario_ciudadano?.celular,
              id_operador_receptor: alertaData?.id_operador_receptor,
              id_despachador,
              id_patrullero,
            };
          }),
        );

        const ids = new Set();
        desestimadasConAsignacion.forEach((d) => {
          if (d.id_operador_receptor) ids.add(d.id_operador_receptor);
          if (d.id_despachador) ids.add(d.id_despachador);
          if (d.id_patrullero) ids.add(d.id_patrullero);
          if (d.id_operador_desestimo) ids.add(d.id_operador_desestimo);
        });
        const { data: oficiales } = await supabase
          .from("oficial")
          .select("id_oficial, nombre_completo")
          .in("id_oficial", [...ids]);
        const nombresMap = {};
        oficiales?.forEach((o) => {
          nombresMap[o.id_oficial] = o.nombre_completo;
        });

        const formateadas = desestimadasConAsignacion.map((d) => ({
          ...d,
          nombre_operador_receptor: nombresMap[d.id_operador_receptor] || "—",
          nombre_despachador: nombresMap[d.id_despachador] || "—",
          nombre_patrullero: nombresMap[d.id_patrullero] || "—",
          nombre_operador_desestimo: nombresMap[d.id_operador_desestimo] || "—",
        }));
        setDesestimadas(formateadas);
      } catch (err) {
        console.error("Error cargando desestimadas:", err);
      } finally {
        setCargandoDesestimadas(false);
      }
    };
    cargarDesestimadas();
  }, []);

  // Combinar alertas
  const alertasTabuladasConFormato = (alertasTabuladas || []).map((a) => ({
    ...a,
    estado: "TABULADO",
  }));
  const todasLasAlertas = [...alertasTabuladasConFormato, ...desestimadas];

  // Filtros (corregido para usar fechas ISO)
  const alertasFiltradas = todasLasAlertas.filter((a) => {
    const cumpleEstado = (a.estado || "TABULADO") === tabActiva;
    const ciudadano = (a.ciudadano || "").toLowerCase();
    const idAlerta = (a.id || "").toLowerCase();
    const busquedaLower = busqueda.toLowerCase();
    const cumpleBusqueda =
      ciudadano.includes(busquedaLower) || idAlerta.includes(busquedaLower);

    if (filtroTiempo !== "TODO") {
      let fechaComparar;
      if (a.estado === "DESESTIMADO") {
        // fecha_desestimo es ISO string
        fechaComparar = a.fecha_desestimo ? new Date(a.fecha_desestimo) : null;
      } else {
        // a.fecha es string "YYYY-MM-DD"
        fechaComparar = a.fecha ? new Date(a.fecha + "T00:00:00") : null;
      }
      if (!fechaComparar || isNaN(fechaComparar.getTime())) return true; // si no hay fecha válida, lo incluye
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (filtroTiempo === "HOY") {
        const inicioHoy = new Date(hoy);
        const finHoy = new Date(hoy);
        finHoy.setDate(finHoy.getDate() + 1);
        if (fechaComparar < inicioHoy || fechaComparar >= finHoy) return false;
      } else if (filtroTiempo === "ESTE MES") {
        if (
          fechaComparar.getMonth() !== hoy.getMonth() ||
          fechaComparar.getFullYear() !== hoy.getFullYear()
        )
          return false;
      }
    }
    return cumpleEstado && cumpleBusqueda;
  });

  // ✅ Cambiar de tab mostrando una pequeña carga (skeleton) para dar sensación
  // de que el contenido se está refrescando, en vez de un salto brusco.
  const handleCambiarTab = (tab) => {
    if (tab === tabActiva || tabCargando) return;
    setTabCargando(true);
    setTabActiva(tab);
    setTimeout(() => setTabCargando(false), 350);
  };

  // Funciones para tabuladas
  const abrirDetalleTabulada = (alerta) => {
    const idAlertaCard = String(alerta.id_alerta);
    const tabuladaCompleta = tabuladasCompletas.find(
      (t) => String(t.id_alerta) === idAlertaCard,
    );
    if (tabuladaCompleta) {
      const ciudadano =
        tabuladaCompleta.alerta?.usuario_ciudadano?.nombre_completo ||
        "Ciudadano";
      let clasificacion =
        tabuladaCompleta.alerta?.contravenciones ||
        tabuladaCompleta.alerta?.delitos;
      if (!clasificacion)
        clasificacion = tabuladaCompleta.resultado_final || "Sin clasificar";

      const alertaDetalle = {
        id_alerta: tabuladaCompleta.id_alerta,
        codigo_alerta: tabuladaCompleta.alerta?.codigo_alerta,
        ciudadano: ciudadano,
        prioridad: tabuladaCompleta.alerta?.prioridad, // ✅ antes no se pasaba y el badge siempre mostraba "—"
        ci: tabuladaCompleta.alerta?.usuario_ciudadano?.ci,
        celular: tabuladaCompleta.alerta?.usuario_ciudadano?.celular,
        incidente: clasificacion,
        descripcion: tabuladaCompleta.alerta?.descripcion,
        ubicacion: tabuladaCompleta.alerta?.ubicacion,
        contravenciones: tabuladaCompleta.alerta?.contravenciones,
        delitos: tabuladaCompleta.alerta?.delitos,
        id_patrullero: tabuladaCompleta.id_patrullero,
        id_despachador: tabuladaCompleta.id_despachador,
        id_operador_receptor: tabuladaCompleta.id_operador_receptor,
        placa: tabuladaCompleta.placa,
        epi: tabuladaCompleta.epi,
        numero_escalafon: tabuladaCompleta.numero_escalafon,
        comuna: tabuladaCompleta.comuna,
        distrito: tabuladaCompleta.distrito,
        subdistrito: tabuladaCompleta.subdistrito,
        area_urbana: tabuladaCompleta.area_urbana,
        area_rural: tabuladaCompleta.area_rural,
        protagonistas: tabuladaCompleta.protagonistas,
        remision_caso: tabuladaCompleta.remision_caso,
        resumen_administrativo: tabuladaCompleta.resumen_administrativo,
        resultado_final: tabuladaCompleta.resultado_final,
      };
      setSelectedTabulada(alertaDetalle);
      setClasificacionTabuladorModal(tabuladaCompleta.resultado_final || null);
      setDerivacionModal(tabuladaCompleta.remision_caso || null);
      setShowModalTabulada(true);
    } else {
      console.warn(
        "No se encontraron datos completos para esta tabulación",
        idAlertaCard,
      );
    }
  };

  const generarPDFTabulada = (alerta) => {
    const idAlertaCard = String(alerta.id_alerta);
    const tabuladaCompleta = tabuladasCompletas.find(
      (t) => String(t.id_alerta) === idAlertaCard,
    );
    if (tabuladaCompleta && onGenerarPDFTabulada) {
      onGenerarPDFTabulada(tabuladaCompleta);
    } else {
      console.log("PDF para tabulada (sin datos completos)", alerta);
    }
  };

  // Funciones para desestimadas
  const generarPDFDesestimada = async (alerta) => {
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

    const codigoAlerta = alerta.id || alerta.id_alerta;
    const nombreArchivo = `reportes/desestimada_${codigoAlerta}.pdf`;

    const alertaData = {
      codigo_alerta: alerta.id,
      ciudadano: alerta.ciudadano,
      ci: alerta.ci,
      celular: alerta.celular,
      ubicacion: alerta.alerta_completa?.ubicacion,
      descripcion: alerta.alerta_completa?.descripcion,
      contravenciones: alerta.alerta_completa?.contravenciones,
      delitos: alerta.alerta_completa?.delitos,
      fecha_hora: alerta.alerta_completa?.fecha_hora,
      motivo_desestimo: alerta.motivoDesestimacion,
      justificacion: alerta.justificacion,
      fecha_desestimo: alerta.fecha_desestimo,
      nombre_operador_desestimo: alerta.nombre_operador_desestimo,
      prioridad: alerta.alerta_completa?.prioridad,
    };

    // 1. Obtener URL pública antes de generar
    const { data: urlData } = supabase.storage
      .from("reportes")
      .getPublicUrl(nombreArchivo);
    const urlPublica = `${urlData.publicUrl}?t=${Date.now()}`;

    // 2. Generar PDF con QR incluido
    const pdfBlob = await exportPDFDesestimacion({
      alerta: alertaData,
      logoBase64,
      filename: `Desestimada_${codigoAlerta}.pdf`,
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

    // 4. Descargar
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Desestimada_${codigoAlerta}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const abrirDetalleDesestimada = (alerta) => {
    setSelectedDesestimada({
      codigo_alerta: alerta.id,
      ciudadano: alerta.ciudadano,
      fecha_hora: alerta.alerta_completa?.fecha_hora
        ? new Date(alerta.alerta_completa.fecha_hora).toLocaleString("es-BO")
        : "—",
      ubicacion: alerta.alerta_completa?.ubicacion,
      descripcion: alerta.alerta_completa?.descripcion,
      contravenciones: alerta.alerta_completa?.contravenciones,
      delitos: alerta.alerta_completa?.delitos,
      prioridad: alerta.alerta_completa?.prioridad, // ✅ ahora sí viaja hasta el modal
      motivo_desestimo: alerta.motivoDesestimacion,
      justificacion: alerta.justificacion,
      fecha_desestimo: new Date(alerta.fecha_desestimo).toLocaleString("es-BO"),
      ci: alerta.ci,
      celular: alerta.celular,
      nombre_operador_desestimo: alerta.nombre_operador_desestimo,
    });
    setShowModalDesestimada(true);
  };

  const handleVerClick = (alerta, esDesestimado) => {
    if (esDesestimado) {
      abrirDetalleDesestimada(alerta);
    } else {
      abrirDetalleTabulada(alerta);
    }
  };
  // Wrapper con loading para el botón "PDF" de cada tarjeta
  const handleGenerarPDFClick = async (alerta, esDesestimado, idMostrar) => {
    if (pdfLoadingId) return;
    setPdfLoadingId(idMostrar);
    try {
      if (esDesestimado) {
        await generarPDFDesestimada(alerta);
      } else {
        generarPDFTabulada(alerta);
      }
    } catch (err) {
      console.error("Error al generar PDF de la tarjeta:", err);
    } finally {
      setPdfLoadingId(null);
    }
  };

  const exportarExcel = async () => {
    try {
      await exportExcelArchivoHis(alertasFiltradas, tabActiva, {
        nombreAdmin: user?.nombre_completo || "ADMINISTRADOR DE TURNO",
      });
    } catch (err) {
      console.error("Error al generar Excel de Archivo Histórico:", err);
    }
  };

  const exportarPDF = async () => {
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

    try {
      const nombreArchivo = `reportes/historico_${tabActiva.toLowerCase()}.pdf`;
      const filenameFinal = `historico_${tabActiva.toLowerCase()}_${Date.now()}.pdf`;

      // 1. Obtener URL pública antes de generar
      const { data: urlData } = supabase.storage
        .from("reportes")
        .getPublicUrl(nombreArchivo);
      const urlPublica = `${urlData.publicUrl}?t=${Date.now()}`;

      // 2. Generar PDF ya con el QR incluido
      const pdfBlob = await exportPDFArchivoHis(alertasFiltradas, tabActiva, {
        nombreAdmin: "ADMINISTRADOR DE TURNO",
        nombreTabulador: user?.nombre_completo || "TABULADOR NO IDENTIFICADO",
        logoBase64,
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
    } catch (err) {
      console.error("Error al generar PDF de Archivo Histórico:", err);
    }
  };

  // Wrappers con loading para el menú de exportación
  const handleExportarExcelClick = async () => {
    if (exportLoading) return;
    setExportLoading("excel");
    try {
      await exportarExcel();
    } finally {
      setExportLoading(null);
    }
  };

  const handleExportarPDFClick = async () => {
    if (exportLoading) return;
    setExportLoading("pdf");
    try {
      await exportarPDF();
    } finally {
      setExportLoading(null);
    }
  };

  if (cargandoDesestimadas) {
    return <ArchivoHistoricoSkeleton />;
  }

  return (
    <div className="w-full h-full flex flex-col animate-fadeIn bg-gray-50/30 overflow-hidden px-0 py-1">
      {/* SELECTOR DE TABS */}
      <div className="w-full bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 -mt-1.5">
        <div className="flex items-center gap-4 flex-1 min-w-[200px] shrink-0">
          <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200 shrink-0">
            <button
              onClick={() => handleCambiarTab("TABULADO")}
              disabled={tabCargando}
              className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-3 rounded-lg font-medium text-[12.5px] transition-all tracking-widest ${
                tabActiva === "TABULADO"
                  ? "bg-[#474b29] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tabCargando && tabActiva === "TABULADO" && (
                <FaSpinner className="animate-spin" size={10} />
              )}
              TABULADOS
            </button>
            <button
              onClick={() => handleCambiarTab("DESESTIMADO")}
              disabled={tabCargando}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-[12px] transition-all tracking-widest disabled:opacity-70 disabled:cursor-wait ${
                tabActiva === "DESESTIMADO"
                  ? "bg-[#474b29] text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              {tabCargando && tabActiva === "DESESTIMADO" && (
                <FaSpinner className="animate-spin" size={10} />
              )}
              DESESTIMADOS
            </button>
          </div>

          <div className="relative flex-1">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[13px] text-slate-400" />
            <input
              type="text"
              placeholder={`Buscar en ${tabActiva === "TABULADO" ? "archivados" : "desestimados"}...`}
              className="w-full h-11 pl-10 pr-3 md:pr-5 bg-gray-50/50 border border-gray-200 rounded-xl outline-none text-[12px] font-medium text-slate-700 transition-all focus:bg-white focus:border-[#474b29]"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-gray-50 p-1.5 rounded-lg border border-gray-200">
            {["TODO", "ESTE MES", "HOY"].map((f) => (
              <button
                key={f}
                onClick={() => setFiltroTiempo(f)}
                className={`flex items-center gap-2 px-3 md:px-5 py-2 md:py-3 rounded-lg font-medium text-[12px] transition-all tracking-widest ${
                  filtroTiempo === f
                    ? "bg-[#474b29] text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative group">
            <button
              disabled={!!exportLoading}
              className="flex items-center gap-2 px-1 md:px-5 py-2 md:py-3 bg-white border-2 border-gray-200 text-slate-700 rounded-lg font-medium uppercase text-[12px] hover:border-slate-300 transition-all disabled:opacity-70 disabled:cursor-wait tracking-wider"
            >
              {exportLoading ? (
                <>
                  <FaSpinner className="animate-spin" size={11} />
                  <span>Generando...</span>
                </>
              ) : (
                <>
                  <FaFileDownload size={11} /> <span>Exportar</span>
                </>
              )}
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button
                onClick={handleExportarExcelClick}
                disabled={!!exportLoading}
                className="w-full px-3 py-2 text-left hover:bg-green-50 text-slate-600 font-bold text-[10px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
              >
                {exportLoading === "excel" ? (
                  <FaSpinner
                    className="animate-spin text-green-600"
                    size={12}
                  />
                ) : (
                  <FaFileExcel className="text-green-600" size={12} />
                )}
                {exportLoading === "excel" ? "Generando..." : "Excel (.xls)"}
              </button>
              <button
                onClick={handleExportarPDFClick}
                disabled={!!exportLoading}
                className="w-full px-3 py-2 text-left hover:bg-red-50 text-slate-700 font-bold text-[10px] flex items-center gap-2 disabled:opacity-50 disabled:cursor-wait"
              >
                {exportLoading === "pdf" ? (
                  <FaSpinner className="animate-spin text-red-700" size={12} />
                ) : (
                  <FaFilePdf className="text-red-700" size={12} />
                )}
                {exportLoading === "pdf" ? "Generando..." : "Guardar PDF"}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cuadrícula de tarjetas */}
      <div className="overflow-y-auto scroll-hover flex-1 min-h-0 mt-6 pb-6 pr-1.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-3.5 gap-x-6">
          {tabCargando ? (
            // Skeleton mientras se "carga" el cambio de tab
            Array.from({ length: alertasFiltradas.length || 4 }).map((_, i) => (
              <ArchivoHistoricoCardSkeleton key={`tab-skel-${i}`} />
            ))
          ) : (
            <>
              {alertasFiltradas.map((alerta) => {
                const esDesestimado = alerta.estado === "DESESTIMADO";
                const idMostrar = alerta.id || "SIN ID";
                const ciudadanoMostrar = alerta.ciudadano || "Desconocido";
                const fechaMostrar = esDesestimado
                  ? alerta.fecha_desestimo
                    ? new Date(alerta.fecha_desestimo).toLocaleDateString(
                        "es-BO",
                      )
                    : "—"
                  : alerta.fecha || "—";
                const incidenteMostrar = esDesestimado
                  ? alerta.motivoDesestimacion || "Sin motivo"
                  : alerta.incidente || "Sin clasificar";
                const verCargando = modalLoadingId === idMostrar;
                const pdfCargando = pdfLoadingId === idMostrar;
                const accionesDeshabilitadas =
                  (modalLoadingId && !verCargando) ||
                  (pdfLoadingId && !pdfCargando);

                return (
                  <div
                    key={idMostrar}
                    onClick={() => {
                      if (!accionesDeshabilitadas)
                        handleVerClick(alerta, esDesestimado, idMostrar);
                    }}
                    className="p-2 h-[14svh] bg-white rounded-xl border border-slate-200 relative transition-all duration-200 hover:scale-[1.01] hover:z-10 shadow-sm hover:shadow-md group overflow-hidden flex flex-col cursor-pointer"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#474b29] rounded-l-2xl" />
                    <div className="pl-5 pr-3 py-3 flex-1 flex flex-col justify-center -mt-1">
                      <div className="flex justify-between items-center -mt-0.5">
                        <span className="text-[11px] font-medium text-slate-500/80 uppercase tracking-widest">
                          {verCargando ? (
                            <FaSpinner
                              className="inline animate-spin mr-1"
                              size={10}
                            />
                          ) : null}
                          {idMostrar}
                        </span>
                        <span className="bg-slate-200/60 text-[#474b29] px-2 py-0.5 rounded-md text-[9px] font-medium uppercase border border-green-100 tracking-wider">
                          {esDesestimado ? "Desestimado" : "Archivado"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-3 mt-2">
                        <div className="w-6 h-8 rounded-md bg-blue-50 text-[#0C3DC2] flex items-center justify-center font-black text-xs border border-gray-50 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shrink-0 shadow-inner">
                          {ciudadanoMostrar.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-[12px] font-medium text-slate-600 leading-tight mb-0.5 truncate tracking-wider">
                            {ciudadanoMostrar}
                          </h3>
                          <p className="text-[10px] font-medium text-slate-400 mt-0.5 tracking-wider">
                            {fechaMostrar}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3 p-1.5 bg-[#474b29]/5 border-[#474b29]/20 rounded-lg border border-slate-100">
                        <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                          {esDesestimado ? "Motivo" : "Clasificación"}
                        </p>
                        <p className="text-[10px] font-medium tracking-wider text-slate-500 uppercase leading-relaxed truncate">
                          {incidenteMostrar}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}

              {alertasFiltradas.length === 0 && (
                <div className="col-span-full py-12 text-center">
                  <p className="text-slate-400 font-black uppercase tracking-widest italic text-[10px]">
                    No se encontraron registros en {tabActiva.toLowerCase()}
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Modales */}
      {showModalDesestimada && (
        <FormularioDesestimados
          alerta={selectedDesestimada}
          onClose={() => setShowModalDesestimada(false)}
          onGenerarPDF={() => generarPDFDesestimada(selectedDesestimada)}
        />
      )}
      {showModalTabulada && (
        <FormularioTabulacion
          isOpen={showModalTabulada}
          onClose={() => setShowModalTabulada(false)}
          alerta={selectedTabulada}
          readOnly={true}
          onConfirm={() => {}}
          clasificacionTabulador={clasificacionTabuladorModal}
          derivacion={derivacionModal}
          onGenerarPDF={() => generarPDFTabulada(selectedTabulada)}
        />
      )}
    </div>
  );
};

export default ArchivoHistorico;

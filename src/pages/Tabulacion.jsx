import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  FaEye, FaClipboardList, FaChartLine, FaClock, FaFilePdf, FaChevronRight, FaSpinner
} from "react-icons/fa";
import FormularioTabulacion from "../components/modals/FormularioTabulacion";
import { contravenciones, delitos } from "../constants/CategoriasDelitos";
import ArchivoHistorico from "./ArchivoHistorico";
import { supabase } from '../services/supabase';
import { useAuth } from "../context/AuthContext";
import { exportPDFTabulacion } from "../utils/exports/exportPDFTabulacion";

const getColorByCategoria = (categoria) => {
  if (!categoria) return "bg-gray-300";
  const upperCat = (categoria || "").toUpperCase().trim();

  const esContravencion = contravenciones.some(c => upperCat === c.toUpperCase() || upperCat.includes(c.toUpperCase()));
  if (esContravencion) return "bg-orange-500";

  const esDelito = delitos.some(d => upperCat === d.toUpperCase() || upperCat.includes(d.toUpperCase()));
  if (esDelito) return "bg-red-600";

  if (upperCat.includes("VIOLENCIA FAMILIAR")) return "bg-slate-400";
  if (upperCat.includes("ALERTA CIUDADANA")) return "bg-teal-500";
  if (upperCat.includes("INTENTO DE SUICIDIO")) return "bg-purple-600";

  return "bg-gray-300";
};

function Tabulacion() {
  const { user } = useAuth();
  const [renderKey] = useState(Date.now());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [alertaVista, setAlertaVista] = useState(null);
  const [verTodo, setVerTodo] = useState(false);
  const [cargando, setCargando] = useState(true);

  const [alertasPendientes, setAlertasPendientes] = useState([]);
  const [tabuladas, setTabuladas] = useState([]);

  const fechaHoy = new Date().toISOString().split('T')[0];

useEffect(() => {
  window.__tabulacionVerTodo = verTodo;
  window.__tabulacionOnBack = () => setVerTodo(false);
  window.dispatchEvent(new Event("tabulacion_view_change"));
}, [verTodo]);

  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {
      // 1. Obtener alertas ya tabuladas
      const { data: tabData, error: tabErr } = await supabase
        .from("tabulacion_caso")
        .select(`
          id_tabulacion,
          id_alerta,
          fecha_tabulacion,
          resultado_final,
          resumen_administrativo,
          id_patrullero,
          id_despachador,
          id_operador_receptor,
          comuna,
          distrito,
          subdistrito,
          area_urbana,
          area_rural,
          protagonistas,
          remision_caso,
          alerta:id_alerta (
  id_alerta,
  codigo_alerta,
  categoria,
  contravenciones,
  delitos,
  descripcion,
  fecha_hora,
  ubicacion,
  prioridad,
  id_operador_receptor,
  usuario_ciudadano:id_usuario (
    nombre_completo,
    ci,
    celular
  )
),
          patrullero:patrullero!id_patrullero (
            placa,
            epi,
            id_oficial,
            oficial:oficial (
              numero_escalafon
            )
          )
        `)
        .order("fecha_tabulacion", { ascending: false });

      if (tabErr) console.error("Error tabuladas:", tabErr);
      
      const tabuladasFormateadas = (tabData || []).map(t => ({
        ...t,
        placa: t.patrullero?.placa || '—',
        epi: t.patrullero?.epi || '—',
        numero_escalafon: t.patrullero?.oficial?.numero_escalafon || '—',
        id_despachador: t.id_despachador || null,
        id_operador_receptor: t.id_operador_receptor || null,
        comuna: t.comuna || '',
        distrito: t.distrito || '',
        subdistrito: t.subdistrito || '',
        area_urbana: t.area_urbana || false,
        area_rural: t.area_rural || false,
        protagonistas: t.protagonistas || '',
        remision_caso: t.remision_caso || '',
        resumen_administrativo: t.resumen_administrativo || ''
      }));
      
      setTabuladas(tabuladasFormateadas);

      const idsTabulados = new Set((tabData || []).map(t => t.id_alerta));

      // 2. Obtener todas las asignaciones activas (sin filtrar por estado de alerta)
      const { data: asigData, error: asigErr } = await supabase
        .from("asignacion_patrulla")
        .select(`
          id_asignacion,
          id_patrullero,
          id_oficial_asignador,
          alerta:id_alerta (
  id_alerta,
  codigo_alerta,
  categoria,
  contravenciones,
  delitos,
  descripcion,
  fecha_hora,
  ubicacion,
  prioridad,
  id_operador_receptor,
  usuario_ciudadano:id_usuario (
    nombre_completo,
    ci,
    celular
  )
),
          patrullero:patrullero!id_patrullero (
            oficial:oficial (
              numero_escalafon
            )
          )
        `)
        .order("id_asignacion", { ascending: false });

      if (asigErr) {
        console.error("Error asignaciones:", asigErr);
        setAlertasPendientes([]);
        return;
      }

      // Obtener alertas desestimadas
      const { data: desestimadas, error: desErr } = await supabase
        .from("alerta_desestimada")
        .select("id_alerta");
      if (desErr) console.error("Error al obtener desestimadas:", desErr);
      const idsDesestimadas = new Set((desestimadas || []).map(d => d.id_alerta));

      // Pendientes: todas las alertas con asignación que NO estén tabuladas
      const pendientes = (asigData || [])
        .filter(a => a.alerta && !idsTabulados.has(a.alerta.id_alerta))
        .map(a => {
          let clasificacion = a.alerta.contravenciones || a.alerta.delitos;
          if (!clasificacion) clasificacion = a.alerta.categoria || a.alerta.descripcion || "Sin clasificar";
          
          const numeroEscalafon = a.patrullero?.oficial?.numero_escalafon || '—';
          const estaDesestimada = idsDesestimadas.has(a.alerta.id_alerta);
          
          return {
  id: a.alerta.codigo_alerta || `ALT-${String(a.alerta.id_alerta).padStart(4, "0")}`,
  id_alerta: a.alerta.id_alerta,
  id_asignacion: a.id_asignacion,
  id_patrullero: a.id_patrullero,
  id_despachador: a.id_oficial_asignador,
  incidente: clasificacion,
  contravenciones: a.alerta.contravenciones,
  delitos: a.alerta.delitos,
  descripcion: a.alerta.descripcion || "",
  patrulla: numeroEscalafon,
  estado: estaDesestimada ? "DESESTIMADA" : "ATENDIDO",
  ciudadano: a.alerta.usuario_ciudadano?.nombre_completo || "Ciudadano desconocido",
  ci: a.alerta.usuario_ciudadano?.ci || "—",
  celular: a.alerta.usuario_ciudadano?.celular || "—",
  id_usuario: a.alerta.id_usuario,
  ubicacion: a.alerta.ubicacion || "",
  prioridad: a.alerta.prioridad || "—",
  fecha: a.alerta.fecha_hora?.split("T")[0] || fechaHoy,
};
        });

      setAlertasPendientes(pendientes);
    } catch (err) {
      console.error("Error crítico:", err);
    } finally {
      setCargando(false);
    }
  }, [fechaHoy]);

  // Suscripción en tiempo real
  useEffect(() => {
    const subscription = supabase
      .channel('tabulacion-realtime')
      .on('postgres_changes', 
  { event: 'INSERT', schema: 'public', table: 'alerta' }, 
  () => cargarDatos()
)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'alerta_desestimada' }, 
        () => cargarDatos()
      )
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'tabulacion_caso' }, 
        () => cargarDatos()
      )
      .subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [cargarDatos]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Métricas (sin cambios)
  const metricas = useMemo(() => {
    const tabuladasHoy = tabuladas.filter(t =>
      t.fecha_tabulacion?.split("T")[0] === fechaHoy
    ).length;
    const pendientes = alertasPendientes.length;

    const conteo = {};

    alertasPendientes.forEach(a => {
      const key = (a.incidente || "").toUpperCase();
      conteo[key] = (conteo[key] || 0) + 1;
    });

    tabuladas.forEach(t => {
      if (t.alerta) {
        let clasificacion = t.alerta.contravenciones || t.alerta.delitos;
        if (!clasificacion) clasificacion = t.alerta.categoria || "OTROS";
        const key = (clasificacion || "").toUpperCase();
        conteo[key] = (conteo[key] || 0) + 1;
      }
    });

    const ranking = Object.entries(conteo)
      .map(([nombre, total]) => ({
        nombre,
        total,
        color: getColorByCategoria(nombre)
      }))
      .sort((a, b) => b.total - a.total);

    return { tabuladasHoy, pendientes, ranking };
  }, [alertasPendientes, tabuladas, fechaHoy]);

  const handleTabular = useCallback(async () => {
    setIsModalOpen(false);
    await cargarDatos();
  }, [cargarDatos]);

  const ultimasTabuladas = useMemo(() => tabuladas.slice(0, 4), [tabuladas]);

const handleGenerarPDF = async (tab) => {
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

    // Resolver nombres desde IDs
    const ids = [tab.id_operador_receptor, tab.id_despachador, tab.id_patrullero].filter(Boolean);
    let nombresMap = {};
    if (ids.length > 0) {
      const { data: oficiales } = await supabase
        .from("oficial")
        .select("id_oficial, nombre_completo")
        .in("id_oficial", ids);
      (oficiales || []).forEach(o => { nombresMap[o.id_oficial] = o.nombre_completo; });
    }

    // Resolver nombre patrullero desde patrullero -> oficial
    let nombrePatrullero = tab.numero_escalafon || "—";
    if (tab.id_patrullero) {
      const { data: pat } = await supabase
        .from("patrullero")
        .select("id_oficial")
        .eq("id_patrullero", tab.id_patrullero)
        .maybeSingle();
      if (pat?.id_oficial) {
        const { data: of } = await supabase
          .from("oficial")
          .select("nombre_completo")
          .eq("id_oficial", pat.id_oficial)
          .maybeSingle();
        if (of) nombrePatrullero = of.nombre_completo;
      }
    }

    let reportePatrullero = "—";
if (tab.id_patrullero && tab.id_alerta) {
  const { data: reporte } = await supabase
    .from("reporte_alerta")
    .select("descripcion_reporte")
    .eq("id_alerta", tab.id_alerta)
    .eq("id_patrullero", tab.id_patrullero)
    .order("fecha_reporte", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (reporte?.descripcion_reporte) reportePatrullero = reporte.descripcion_reporte;
}

const codigoAlerta = tab.alerta?.codigo_alerta || tab.id_alerta;
const nombreArchivo = `reportes/tabulacion_${codigoAlerta}.pdf`;

// 1. Generar sin QR y subir
const pdfBlob = await exportPDFTabulacion({
  tab: { ...tab, reporte_patrullero: reportePatrullero },
  nombreOperador: nombresMap[tab.id_operador_receptor] || "—",
  nombreDespachador: nombresMap[tab.id_despachador] || "—",
  nombrePatrullero,
  nombreTabulador: user?.nombre_completo || "—",
  logoBase64,
  filename: `Tabulacion_${codigoAlerta}.pdf`,
  qrData: null,
  returnBlob: true,
});

const { error: uploadError } = await supabase.storage
  .from("reportes")
  .upload(nombreArchivo, pdfBlob, { contentType: "application/pdf", upsert: true });

if (uploadError) {
  console.error("Error al subir PDF:", uploadError);
}

const { data: urlData } = supabase.storage
  .from("reportes")
  .getPublicUrl(nombreArchivo);

const urlPublica = urlData.publicUrl;

// 2. Generar con QR y descargar
await exportPDFTabulacion({
  tab: { ...tab, reporte_patrullero: reportePatrullero },
  nombreOperador: nombresMap[tab.id_operador_receptor] || "—",
  nombreDespachador: nombresMap[tab.id_despachador] || "—",
  nombrePatrullero,
  nombreTabulador: user?.nombre_completo || "—",
  logoBase64,
  filename: `Tabulacion_${codigoAlerta}.pdf`,
  qrData: urlPublica,
});
  };

  const historicoAlertas = useMemo(() => {
    return tabuladas.map(t => ({
      id_alerta: t.id_alerta,
      id: t.alerta?.codigo_alerta || `ALT-${String(t.id_alerta).padStart(4, "0")}`,
      ciudadano: t.alerta?.usuario_ciudadano?.nombre_completo || "Anónimo",
      fecha: t.fecha_tabulacion?.split("T")[0] || "—",
      incidente: t.resultado_final || t.alerta?.contravenciones || t.alerta?.delitos || "Sin clasificar",
      estado: "TABULADO",
      motivoDesestimacion: null
    }));
  }, [tabuladas]);

  useEffect(() => {
  document.title = verTodo ? "ARCHIVO HISTÓRICO" : "TABULACIÓN Y ESTADÍSTICAS";
}, [verTodo]);

if (verTodo) {
  return (
    <ArchivoHistorico
        alertasTabuladas={historicoAlertas}
        tabuladasCompletas={tabuladas}
        onGenerarPDFTabulada={handleGenerarPDF}
        onBack={() => setVerTodo(false)}
      />
    );
  }

  return (
    <div key={renderKey} className="-mt-4 px-1 min-h-screen bg-slate-50/50 font-sans text-left w-full py-4 space-y-5 animate-fadeIn pb-6">
      {cargando ? (
        <div className="flex items-center justify-center py-24">
          <FaSpinner className="animate-spin text-green-800 text-3xl" />
        </div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-6 mb-4">
            <div className="lg:w-3/4 flex flex-col gap-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex items-center justify-between px-5">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-green-50 rounded-md flex items-center justify-center text-[#088226]">
                      <FaChartLine size={18} />
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Tabuladas Hoy</p>
                      <p className="text-2xl font-black text-slate-800">{metricas.tabuladasHoy}</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-[#088226] rounded-full animate-pulse shadow-[0_0_6px_rgba(22,163,74,0.7)]" />
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex items-center justify-between px-5">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-amber-50 rounded-md flex items-center justify-center text-[#e9b301]">
                      <FaClock size={18} />
                    </div>
                    <div>
                      <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Pendientes</p>
                      <p className="text-2xl font-black text-slate-800">{metricas.pendientes}</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-[#e9b301] rounded-full animate-pulse" />
                </div>
              </div>

              <div className="relative top-1 w-full bg-white px-4 md:px-7 py-4 md:py-6 rounded-2xl shadow-md flex flex-col max-h-[618px]">
                <h2 className="text-lg font-extrabold uppercase text-[#1e293b] mb-4 md:mb-6 tracking-wide flex-shrink-0">
                  Tabulación de Alertas
                </h2>

                <div className="overflow-auto flex-1 min-h-0 -mx-4 md:mx-0 px-4 md:px-0">
                  <table className="min-w-full border-collapse text-left">
                    <thead className="sticky top-0 bg-white z-10 shadow-sm">
                      <tr className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                        <th className="pl-3 md:pl-4 pr-1 md:pr-2 py-2 w-[12%] md:w-[15%]">ID</th>
                        <th className="py-2 w-[28%] md:w-[30%]">Ciudadano</th>
                        <th className="px-1 md:px-2 py-2 w-[20%]">Incidente</th>
                        <th className="py-2 w-[18%] md:w-[15%]">Patrulla</th>
                        <th className="py-2 w-[12%] md:w-[15%]">Estado</th>
                        <th className="px-3 md:px-4 py-2 w-[10%]">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertasPendientes.length === 0 ? (
                        <tr>
                          <td colSpan="6" className="text-center py-12 text-gray-400 font-medium">
                            No hay alertas pendientes de tabulación
                          </td>
                        </tr>
                      ) : (
                        alertasPendientes.map((alerta) => (
                          <tr
                            key={alerta.id_alerta}
                            className="bg-white group transition-all duration-200 border-b border-gray-100 hover:shadow-lg hover:-translate-y-0.5"
                          >
                            <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-5 md:py-6 text-[11px] font-bold text-slate-400 uppercase align-middle">
                              {alerta.id}
                            </td>
                            <td className="py-5 md:py-6 align-middle">
                              <div className="flex items-center gap-2 md:gap-3">
                                <div className="w-6 h-8 rounded-md flex items-center justify-center font-black text-xs shadow-inner shrink-0 bg-blue-50 text-[#0C3DC2]">
                                  {alerta.ciudadano.charAt(0)}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-[12px] font-bold text-[#1e293b] leading-tight truncate max-w-[120px] md:max-w-none">
                                    {alerta.ciudadano}
                                  </span>
                                  <span className="mt-0.5 text-[8px] text-gray-400 font-semibold uppercase tracking-wider">
                                    Verificado
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="py-5 md:py-6 align-middle">
                              <div className="px-1 md:px-2">
                                <span className="truncate block max-w-[100px] md:max-w-none text-[11px] font-bold text-slate-500 tracking-wider uppercase">
                                  {alerta.incidente}
                                </span>
                              </div>
                            </td>
                            <td className="py-5 md:py-6 align-middle text-left">
                              <span className="font-bold text-[11px] tracking-wider text-slate-500 uppercase">
                                {alerta.patrulla}
                              </span>
                            </td>
                            <td className="py-5 md:py-6 align-middle">
                              <span className={`inline-flex justify-center w-24 py-1.5 rounded-md text-[9px] font-bold text-white tracking-wider ${
                                alerta.estado === "DESESTIMADA" ? "bg-gray-500" : "bg-[#088226]"
                              }`}>
                                {alerta.estado}
                              </span>
                            </td>
                            <td className="px-3 md:px-4 py-5 md:py-6 align-middle">
                              <button
                                onClick={() => {
                                  setAlertaSeleccionada({
                                    ...alerta,
                                    id_tabulador: user?.id_oficial || null
                                  });
                                  setIsModalOpen(true);
                                }}
                                className="p-1.5 md:p-2 bg-amber-500 text-white rounded-lg shadow hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                              >
                                <FaClipboardList size={14} />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="lg:w-1/4 bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col h-[729px]">
              <div className="mb-3">
                <h2 className="text-base font-extrabold text-slate-800 uppercase">Alertas Comunes</h2>
                <p className="text-[9px] font-bold text-slate-300 uppercase mt-1">Clasificaciones del hecho</p>
                <div className="border-b border-gray-100 mt-2"></div>
              </div>
              {metricas.ranking.length === 0 ? (
                <p className="text-[10px] text-slate-300 font-black uppercase text-center mt-6">Sin datos aún</p>
              ) : (
                <div className="space-y-4 mt-2">
                  {metricas.ranking.slice(0, 10).map((item, idx) => {
                    const coloresVivos = [
                      "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
                      "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-teal-500",
                      "bg-orange-500", "bg-cyan-500"
                    ];
                    const colorClass = coloresVivos[idx % coloresVivos.length];
                    return (
                      <div key={idx} className="flex items-center justify-between p-2.5 h-12 bg-slate-50/50 rounded-md border border-transparent hover:border-slate-100 transition-all ">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`w-1 h-1 rounded-full ${colorClass} shrink-0 shadow-sm`} />
                          <span className="text-[11px] font-extrabold text-slate-600 uppercase leading-tight break-words">
                            {item.nombre}
                          </span>
                        </div>
                        <span className="text-[14px] font-black text-slate-800 ml-2 shrink-0 tracking-wider">{item.total}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-50 relative !mt-6">
            <button
              onClick={() => setVerTodo(true)}
              className="absolute top-4 right-5 font-bold flex items-center gap-1.5 uppercase text-slate-400 hover:text-slate-500 text-[10px] tracking-wider transition-colors"> Ver todo <FaChevronRight size={8} />
            </button>
            <div className="mb-4">
              <h2 className="text-lg font-extrabold uppercase tracking-tight text-[#1e293b]">Alertas Tabuladas</h2>
            </div>
            {ultimasTabuladas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-200 shadow-sm mb-2">
                  <FaClipboardList size={20} />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin alertas tabuladas</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn">
                {ultimasTabuladas.map((tab) => {
                  const ciudadano = tab.alerta?.usuario_ciudadano?.nombre_completo || "Ciudadano";
                  const codigo = tab.alerta?.codigo_alerta || `ALT-${String(tab.id_alerta).padStart(4, "0")}`;
                  let clasificacion = tab.resultado_final || tab.alerta?.contravenciones || tab.alerta?.delitos || "Sin clasificar";
                  const fecha = tab.fecha_tabulacion?.split("T")[0] || "—";
                  return (
                    <div key={tab.id_tabulacion} className="h-60 bg-white rounded-lg p-4 border border-slate-200 relative transition-all duration-200 hover:scale-[1.01] shadow-sm hover:shadow-md group overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#113e27] rounded-l-2xl" />
                      <div className="flex justify-between items-center mb-3 pl-3">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{codigo}</span>
                        <span className="bg-slate-200 text-[#113e27] px-2 py-0.5 rounded-md text-[8px] font-black uppercase border border-green-100">
                          Archivado
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-4 pl-3">
                        <div className="w-6 h-8 rounded-md bg-blue-50 text-[#0C3DC2] flex items-center justify-center font-black text-[12px] border border-gray-50 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shrink-0 shadow-inner mt-2">
                          {ciudadano.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-[12px] font-extrabold text-slate-700 leading-tight mb-0.5 truncate block max-w-[200px] tracking-wider">{ciudadano}</h3>
                          <p className="text-[10px] font-bold text-slate-400">{fecha}</p>
                        </div>
                      </div>
                      <div className="mb-6 p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 ml-3">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Clasificación</p>
                        <p className="text-[10px] font-black text-slate-600 uppercase leading-relaxed">{clasificacion}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 ml-3 mb-2">
                        <button
                          onClick={() => {
                            setAlertaVista({
  id_alerta: tab.id_alerta,
  codigo_alerta: tab.alerta?.codigo_alerta,
  ciudadano: ciudadano,
  ci: tab.alerta?.usuario_ciudadano?.ci,
  celular: tab.alerta?.usuario_ciudadano?.celular,
  incidente: clasificacion,
  descripcion: tab.alerta?.descripcion,
  ubicacion: tab.alerta?.ubicacion,
  prioridad: tab.alerta?.prioridad,
  contravenciones: tab.alerta?.contravenciones,
  delitos: tab.alerta?.delitos,
  resultado_final: tab.resultado_final,
                              id_patrullero: tab.id_patrullero,
                              id_despachador: tab.id_despachador,
                              id_operador_receptor: tab.id_operador_receptor,
                              placa: tab.placa,
                              epi: tab.epi,
                              numero_escalafon: tab.numero_escalafon,
                              comuna: tab.comuna,
                              distrito: tab.distrito,
                              subdistrito: tab.subdistrito,
                              area_urbana: tab.area_urbana,
                              area_rural: tab.area_rural,
                              protagonistas: tab.protagonistas,
                              remision_caso: tab.remision_caso,
                              resumen_administrativo: tab.resumen_administrativo
                            });
                            setIsViewModalOpen(true);
                          }}
                          className="flex items-center justify-center gap-1 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-md border border-gray-300 transition-colors"
                        >
                          <FaEye size={10} />
                          <span className="text-[11px] font-bold uppercase tracking-wider">Ver</span>
                        </button>
                        <button
                          onClick={() => handleGenerarPDF(tab)}
                          className="flex items-center justify-center gap-1 py-2 bg-[#113e27] hover:bg-[#164a2f] text-white rounded-md shadow-sm transition-all"
                        >
                          <FaFilePdf size={10} />
                          <span className="text-[11px] font-bold uppercase tracking-wider">PDF</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}

      <FormularioTabulacion
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        alerta={alertaSeleccionada}
        onConfirm={handleTabular}
        readOnly={false}
      />

      <FormularioTabulacion
        isOpen={isViewModalOpen}
  onClose={() => setIsViewModalOpen(false)}
  alerta={alertaVista}
  readOnly={true}
  onConfirm={() => {}}
  clasificacionTabulador={alertaVista?.resultado_final}
      />
    </div>
  );
}

export default Tabulacion;
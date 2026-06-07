import React, { useState, useMemo, useEffect, useCallback } from "react";
import { 
  FaEye, FaClipboardList, FaChartLine, FaClock, FaFilePdf, FaChevronRight, FaSpinner
} from "react-icons/fa";
import FormularioTabulacion from "../components/modals/FormularioTabulacion";
import ArchivoHistorico from "./ArchivoHistorico";
import { supabase } from '../services/supabase';

const colorMap = {
  "CONSUMO DE BEBIDAS ALCOHÓLICAS EN UN PARQUE": "bg-blue-600",
  "RIÑAS Y PELEAS":      "bg-orange-500",
  "INTENTO DE SUICIDIO": "bg-purple-600",
  "ESTADO DE EBRIEDAD":  "bg-yellow-400",
  "VIOLENCIA FAMILIAR":  "bg-slate-400",
  "ALERTA CIUDADANA":    "bg-teal-500",
  "OTROS":               "bg-gray-300",
};

function Tabulacion() {
  const [renderKey]                               = useState(Date.now());
  const [isModalOpen, setIsModalOpen]             = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [verTodo, setVerTodo]                     = useState(false);
  const [cargando, setCargando]                   = useState(true);

  // Alertas atendidas pendientes de tabular
  const [alertasPendientes, setAlertasPendientes] = useState([]);
  // Registros ya tabulados
  const [tabuladas, setTabuladas]                 = useState([]);

  const fechaHoy = new Date().toISOString().split('T')[0];

  // ── Carga de datos desde Supabase ──────────────────────────────────────────
  const cargarDatos = useCallback(async () => {
    setCargando(true);
    try {

      // 1. IDs de alertas ya tabuladas (para excluirlas de pendientes)
      const { data: tabData, error: tabErr } = await supabase
        .from("tabulacion")
        .select(`
          id_tabulacion,
          id_alerta,
          fecha_tabulacion,
          resultado_final,
          resumen_administrativo,
          alerta:id_alerta (
            codigo_alerta,
            categoria,
            descripcion,
            fecha_hora,
            usuario_ciudadano:id_usuario (
              nombre_completo
            )
          )
        `)
        .order("fecha_tabulacion", { ascending: false });

      if (tabErr) console.error("Error tabuladas:", tabErr);
      setTabuladas(tabData || []);

      const idsTabulados = new Set((tabData || []).map(t => t.id_alerta));

      // 2. Asignaciones con estado ATENDIDO (id_estado = 3, ajustar si difiere)
      //    Traemos alerta + ciudadano + estado actual
      const { data: asigData, error: asigErr } = await supabase
        .from("asignacion_patrullero")
        .select(`
          id_asignacion,
          id_patrullero,
          id_operador_receptor,
          id_despachador,
          alerta:id_alerta (
            id_alerta,
            codigo_alerta,
            categoria,
            descripcion,
            fecha_hora,
            ubicacion,
            id_usuario,
            id_estado_actual,
            usuario_ciudadano:id_usuario (
              nombre_completo,
              ci,
              celular
            )
          )
        `)
        .order("id_asignacion", { ascending: false });

      if (asigErr) console.error("Error asignaciones:", asigErr);

      // Filtrar: solo alertas con estado ATENDIDO (id_estado_actual = 3)
      // y que aún no tengan tabulacion
      const ESTADO_ATENDIDO = 3; // Cambia este número si tu BD usa otro id
      const pendientes = (asigData || [])
        .filter(a =>
          a.alerta &&
          a.alerta.id_estado_actual === ESTADO_ATENDIDO &&
          !idsTabulados.has(a.alerta.id_alerta)
        )
        .map(a => ({
          id:               a.alerta.codigo_alerta || `ALT-${String(a.alerta.id_alerta).padStart(4,"0")}`,
          id_alerta:        a.alerta.id_alerta,
          id_asignacion:    a.id_asignacion,
          id_patrullero:    a.id_patrullero,
          id_operador_receptor: a.id_operador_receptor,
          id_despachador:   a.id_despachador,
          incidente:        a.alerta.categoria || a.alerta.descripcion || "Sin categoría",
          descripcion:      a.alerta.descripcion || "",
          patrulla:         `PAT-${a.id_patrullero}`,
          estado:           "ATENDIDO",
          ciudadano:        a.alerta.usuario_ciudadano?.nombre_completo || "Ciudadano desconocido",
          ci:               a.alerta.usuario_ciudadano?.ci    || "—",
          celular:          a.alerta.usuario_ciudadano?.celular || "—",
          id_usuario:       a.alerta.id_usuario,
          ubicacion:        a.alerta.ubicacion || "",
          fecha:            a.alerta.fecha_hora?.split("T")[0] || fechaHoy,
        }));

      setAlertasPendientes(pendientes);

    } catch (err) {
      console.error("Error crítico:", err);
    } finally {
      setCargando(false);
    }
  }, [fechaHoy]);

  useEffect(() => { cargarDatos(); }, [cargarDatos]);

  // ── Métricas ───────────────────────────────────────────────────────────────
  const metricas = useMemo(() => {
    // Tabuladas hoy
    const tabuladasHoy = tabuladas.filter(t =>
      t.fecha_tabulacion?.split("T")[0] === fechaHoy
    ).length;

    // Pendientes
    const pendientes = alertasPendientes.length;

    // Ranking por categoría de las tabuladas
    const conteo = tabuladas.reduce((acc, curr) => {
      const key = (curr.alerta?.categoria || "OTROS").toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    // Si no hay tabuladas, usar las pendientes para el ranking
    const conteoFinal = Object.keys(conteo).length > 0
      ? conteo
      : alertasPendientes.reduce((acc, curr) => {
          const key = (curr.incidente || "OTROS").toUpperCase();
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {});

    const ranking = Object.entries(conteoFinal)
      .map(([nombre, total]) => ({
        nombre,
        total,
        color: colorMap[nombre] || "bg-slate-300"
      }))
      .sort((a, b) => b.total - a.total);

    return { tabuladasHoy, pendientes, ranking };
  }, [alertasPendientes, tabuladas, fechaHoy]);

  // ── Confirmar tabulación desde el modal ───────────────────────────────────
  const handleTabular = useCallback(async (id_alerta) => {
    setIsModalOpen(false);
    await cargarDatos(); // refresca ambas listas
  }, [cargarDatos]);

  // ── Últimas 3 tabuladas para las tarjetas ─────────────────────────────────
  const ultimasTabuladas = useMemo(() => tabuladas.slice(0, 3), [tabuladas]);

  if (verTodo) {
    return <ArchivoHistorico alertas={tabuladas} onBack={() => setVerTodo(false)} />;
  }

  return (
    <div key={renderKey} className="-mt-4 px-1 min-h-screen bg-slate-50/50 font-sans text-left w-full py-4 space-y-5 animate-fadeIn pb-6">

      {cargando ? (
        <div className="flex items-center justify-center py-24">
          <FaSpinner className="animate-spin text-green-800 text-3xl" />
        </div>
      ) : (
        <>
          <div className="flex flex-col lg:flex-row gap-4 mb-4">
            <div className="lg:w-3/4 flex flex-col gap-4">

              {/* ── Tarjetas métricas ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between px-5">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                      <FaChartLine size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Tabuladas Hoy</p>
                      <p className="text-2xl font-black text-slate-800">{metricas.tabuladasHoy}</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse shadow-[0_0_6px_rgba(22,163,74,0.7)]" />
                </div>

                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between px-5">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
                      <FaClock size={18} />
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-wider">Pendientes</p>
                      <p className="text-2xl font-black text-slate-800">{metricas.pendientes}</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                </div>
              </div>

              {/* ── Tabla alertas atendidas pendientes de tabular ── */}
              <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-50">
                <div className="mb-4">
                  <h2 className="text-xl font-black uppercase tracking-tight text-[#1e293b]">Tabulación de Alertas</h2>
                </div>

                <div className="overflow-y-auto max-h-[450px] pr-1">
                  <table className="w-full border-separate border-spacing-y-3">
                    <thead>
                      <tr className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">
                        <th className="pb-2 text-left">ID</th>
                        <th className="pb-2 text-left pl-6">Ciudadano</th>
                        <th className="pb-2 text-left">Incidente</th>
                        <th className="pb-2 text-left">Patrulla</th>
                        <th className="pb-2 text-left">Estado</th>
                        <th className="pb-2 text-left">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alertasPendientes.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-12 text-slate-300 text-[11px] font-black uppercase tracking-widest">
                            No hay alertas atendidas pendientes de tabulación
                          </td>
                        </tr>
                      ) : (
                        alertasPendientes.map((alerta) => (
                          <tr key={alerta.id_alerta} className="bg-white group transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5">
                            <td className="px-0 py-3 text-[11px] font-bold text-slate-400 border-y border-l rounded-l-xl border-gray-50 uppercase">
                              {alerta.id}
                            </td>
                            <td className="py-3 border-y border-gray-50 pl-6">
                              <div className="flex items-center gap-3">
                                <div className="w-7 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shrink-0">
                                  {alerta.ciudadano.charAt(0)}
                                </div>
                                <div className="flex flex-col min-w-0">
                                  <span className="text-xs font-bold text-[#1e293b] leading-tight block w-[130px] truncate">
                                    {alerta.ciudadano}
                                  </span>
                                  <span className="text-[8px] text-slate-400 font-semibold uppercase mt-0.5">Verificado</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 border-y border-gray-50">
                              <span className="text-[10px] font-bold text-slate-500 uppercase leading-tight block w-[140px] truncate">
                                {alerta.incidente}
                              </span>
                            </td>
                            <td className="py-3 border-y border-gray-50">
                              <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg font-black text-[10px] border border-gray-200 uppercase">
                                {alerta.patrulla}
                              </span>
                            </td>
                            <td className="py-3 border-y border-gray-50">
                              <span className="inline-flex justify-center w-20 py-1.5 rounded-lg text-[9px] font-extrabold uppercase text-white shadow-sm bg-[#00a65a]">
                                Atendido
                              </span>
                            </td>
                            <td className="px-3 py-3 border-y border-r rounded-r-xl border-gray-50 text-left">
                              <button
                                onClick={() => {
                                  setAlertaSeleccionada(alerta);
                                  setIsModalOpen(true);
                                }}
                                className="p-2 bg-amber-500 text-white rounded-lg shadow shadow-amber-100 hover:scale-105 transition-all"
                              >
                                <FaClipboardList size={12} />
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

            {/* ── Panel lateral ranking ── */}
            <div className="lg:w-1/4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
              <div className="mb-5">
                <h2 className="text-base font-black text-slate-800 uppercase">Reportes Comunes</h2>
                <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">Estadísticas</p>
              </div>
              {metricas.ranking.length === 0 ? (
                <p className="text-[10px] text-slate-300 font-black uppercase text-center mt-6">Sin datos aún</p>
              ) : (
                <div className="space-y-3">
                  {metricas.ranking.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                        <span className="text-[9px] font-black text-slate-600 uppercase leading-tight break-words">
                          {item.nombre}
                        </span>
                      </div>
                      <span className="text-base font-black text-slate-800 ml-2 shrink-0">{item.total}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Sección Alertas Tabuladas ── */}
          <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-50 relative">
            <button
              onClick={() => setVerTodo(true)}
              className="absolute top-4 right-5 flex items-center gap-1 transition-all"
            >
              <span className="text-green-600 font-black text-[9px] uppercase tracking-wider">Ver todo</span>
              <FaChevronRight className="text-green-600 text-[8px]" />
            </button>

            <div className="mb-4">
              <h2 className="text-lg font-black uppercase tracking-tight text-[#1e293b]">Alertas Tabuladas</h2>
            </div>

            {ultimasTabuladas.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-200 shadow-sm mb-2">
                  <FaClipboardList size={20} />
                </div>
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sin alertas tabuladas</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fadeIn">
                {ultimasTabuladas.map((tab) => {
                  const ciudadano = tab.alerta?.usuario_ciudadano?.nombre_completo || "Ciudadano";
                  const codigo    = tab.alerta?.codigo_alerta    || `TAB-${String(tab.id_tabulacion).padStart(4,"0")}`;
                  const categoria = tab.alerta?.categoria        || "Sin categoría";
                  const fecha     = tab.fecha_tabulacion?.split("T")[0] || "—";
                  return (
                    <div key={tab.id_tabulacion} className="bg-white rounded-2xl p-4 border border-gray-100 relative transition-all duration-200 hover:scale-[1.01] shadow-sm hover:shadow-md group overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#00a65a] rounded-l-2xl" />
                      <div className="flex justify-between items-center mb-3 pl-3">
                        <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider">{codigo}</span>
                        <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border border-green-100">
                          Archivado
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mb-4 pl-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-black text-base border border-gray-50 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors shrink-0">
                          {ciudadano.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <h3 className="text-xs font-black text-slate-700 leading-tight mb-0.5 truncate w-[110px]">{ciudadano}</h3>
                          <p className="text-[8px] font-bold text-slate-400">{fecha}</p>
                        </div>
                      </div>
                      <div className="mb-4 p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 ml-3">
                        <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Categoría</p>
                        <p className="text-[9px] font-black text-slate-600 uppercase leading-relaxed">{categoria}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-2 ml-3">
                        <button className="flex items-center justify-center gap-1 py-2 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-gray-100 transition-colors">
                          <FaEye size={10} />
                          <span className="text-[8px] font-black uppercase tracking-wider">Ver</span>
                        </button>
                        <button className="flex items-center justify-center gap-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl shadow-sm transition-all">
                          <FaFilePdf size={10} />
                          <span className="text-[8px] font-black uppercase tracking-wider">PDF</span>
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
      />
    </div>
  );
}

export default Tabulacion;
import React, { useState, useMemo } from "react";
import { 
  FaEye, FaClipboardList, FaChartLine, FaClock, FaFilePdf, FaChevronRight 
} from "react-icons/fa";
import FormularioTabulacion from "../components/modals/FormularioTabulacion";
import ArchivoHistorico from "./ArchivoHistorico";

function Tabulacion() {
  const [renderKey] = useState(Date.now());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [verTodo, setVerTodo] = useState(false);

  const [alertas, setAlertas] = useState([
    { id: "ALT-0001", incidente: "Consumo de bebidas alcohólicas en un parque", patrulla: "PAT-5", estado: "ATENDIDO", ciudadano: "Cristian Alberto Andia Salvatierra", fecha: "2026-04-23" },
    { id: "ALT-0002", incidente: "Riñas y peleas", patrulla: "PAT-3", estado: "ATENDIDO", ciudadano: "Marco Antonio Lopez Flores", fecha: "2026-04-23" },
    { id: "ALT-0003", incidente: "Consumo de bebidas alcohólicas en un parque", patrulla: "PAT-1", estado: "ATENDIDO", ciudadano: "Ana Maria Villarroel Sansuste", fecha: "2026-04-23" },
    { id: "ALT-0004", incidente: "Riñas y peleas", patrulla: "PAT-5", estado: "ATENDIDO", ciudadano: "Juan Carlos Rodriguez Terrazas", fecha: "2026-04-23" },
    { id: "ALT-0005", incidente: "Estado de Ebriedad", patrulla: "PAT-2", estado: "ATENDIDO", ciudadano: "Luis Alberto Paredes Villanueva", fecha: "2026-04-22" },
    { id: "ALT-0006", incidente: "Consumo de bebidas alcohólicas en un parque", patrulla: "PAT-4", estado: "ATENDIDO", ciudadano: "Patricia Amalia Flores Soliz", fecha: "2026-04-23" },
    { id: "ALT-0007", incidente: "Violencia Familiar", patrulla: "PAT-10", estado: "ATENDIDO", ciudadano: "Roberto Carlos Unzueta Suarez", fecha: "2026-04-23" },
  ]);

  const fechaHoy = new Date().toISOString().split('T')[0];

  const metricas = useMemo(() => {
    const tabuladasHoy = alertas.filter(a => a.estado === "TABULADO" && a.fecha === fechaHoy).length;
    const pendientes = alertas.filter(a => a.estado === "ATENDIDO").length;
    
    const colorMap = {
      "CONSUMO DE BEBIDAS ALCOHÓLICAS EN UN PARQUE": "bg-blue-600",
      "RIÑAS Y PELEAS": "bg-orange-500",
      "INTENTO DE SUICIDIO": "bg-purple-600",
      "ESTADO DE EBRIEDAD": "bg-yellow-400",
      "VIOLENCIA FAMILIAR": "bg-slate-300",
      "OTROS": "bg-gray-200"
    };

    const conteo = alertas.reduce((acc, curr) => {
      const key = curr.incidente.toUpperCase();
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const ranking = Object.entries(conteo)
      .map(([nombre, total]) => ({ nombre, total, color: colorMap[nombre] || "bg-slate-300" }))
      .sort((a, b) => b.total - a.total);

    return { tabuladasHoy, pendientes, ranking };
  }, [alertas, fechaHoy]);

  const handleTabular = (id) => {
    setAlertas(prev => prev.map(a => a.id === id ? { ...a, estado: "TABULADO", fecha: fechaHoy } : a));
    setIsModalOpen(false);
  };

  const ultimasTabuladas = useMemo(() => {
    return alertas.filter(a => a.estado === "TABULADO").reverse().slice(0, 3);
  }, [alertas]);

  if (verTodo) {
    return <ArchivoHistorico alertas={alertas} onBack={() => setVerTodo(false)} />;
  }

  return (
    <div key={renderKey} className="-mt-4 px-1 min-h-screen bg-slate-50/50 font-sans text-left w-full py-4 space-y-5 animate-fadeIn pb-6">
      
      <div className="flex flex-col lg:flex-row gap-4 mb-4">
        <div className="lg:w-3/4 flex flex-col gap-4">
          {/* Tarjetas métricas */}
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
              <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse shadow-[0_0_6px_rgba(22,163,74,0.7)]"></div>
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
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
            </div>
          </div>

          {/* Tabla de alertas pendientes */}
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
                  {alertas
                    .filter((a) => a.estado === "ATENDIDO")
                    .map((alerta) => (
                      <tr key={alerta.id} className="bg-white group transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5">
                        <td className="px-0 py-3 text-[11px] font-bold text-slate-400 border-y border-l rounded-l-xl border-gray-50 uppercase">
                          {alerta.id}
                        </td>
                        <td className="py-3 border-y border-gray-50 pl-6">
                          <div className="flex items-center gap-3">
                            <div className="w-7 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">
                              {alerta.ciudadano.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-xs font-bold text-[#1e293b] leading-tight block w-[130px]">
                                {alerta.ciudadano}
                              </span>
                              <span className="text-[8px] text-slate-400 font-semibold uppercase mt-0.5">Verificado</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 border-y border-gray-50">
                          <span className="text-[10px] font-bold text-slate-500 uppercase leading-tight block w-[140px]">
                            {alerta.incidente}
                          </span>
                        </td>
                        <td className="py-3 border-y border-gray-50">
                          <span className="bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg font-black text-[10px] border border-gray-200 uppercase">
                            {alerta.patrulla}
                          </span>
                        </td>
                        <td className="py-3">
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
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Panel lateral - ranking */}
        <div className="lg:w-1/4 bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-5">
            <h2 className="text-base font-black text-slate-800 uppercase">Reportes Comunes</h2>
            <p className="text-[8px] font-bold text-slate-300 uppercase mt-1">Estadísticas</p>
          </div>
          <div className="space-y-3">
            {metricas.ranking.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-50/50 rounded-xl border border-transparent hover:border-slate-100 transition-all">
                <div className="flex items-center gap-2 min-0">
                  <div className={`w-2 h-2 rounded-full ${item.color} shrink-0`} />
                  <span className="text-[9px] font-black text-slate-600 uppercase leading-tight break-words">
                    {item.nombre}
                  </span>
                </div>
                <span className="text-base font-black text-slate-800 ml-2">{item.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sección de Alertas Tabuladas */}
      <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-50 relative">
        <button 
          onClick={() => setVerTodo(true)} 
          className="absolute top-4 right-5 flex items-center gap-1 group transition-all"
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
            {ultimasTabuladas.map((alerta) => (
              <div key={alerta.id} className="bg-white rounded-2xl p-4 border border-gray-100 relative transition-all duration-200 hover:scale-[1.01] shadow-sm hover:shadow-md group overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#00a65a] rounded-l-2xl" />
                <div className="flex justify-between items-center mb-3 pl-3">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider">{alerta.id}</span>
                  <span className="bg-green-50 text-green-600 px-2 py-0.5 rounded-full text-[8px] font-black uppercase border border-green-100">
                    Archivado
                  </span>
                </div>
                <div className="flex items-center gap-3 mb-4 pl-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-black text-base border border-gray-50 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                    {alerta.ciudadano.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-xs font-black text-slate-700 leading-tight mb-0.5">{alerta.ciudadano}</h3>
                    <p className="text-[8px] font-bold text-slate-400">{alerta.fecha}</p>
                  </div>
                </div>
                <div className="mb-4 p-2.5 bg-slate-50/50 rounded-xl border border-slate-100 ml-3">
                  <p className="text-[7px] font-black text-slate-400 uppercase tracking-wider mb-0.5">Categoría</p>
                  <p className="text-[9px] font-black text-slate-600 uppercase leading-relaxed">{alerta.incidente}</p>
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
            ))}
          </div>
        )}
      </div>

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
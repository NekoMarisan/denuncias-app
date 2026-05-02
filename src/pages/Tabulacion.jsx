import React, { useState, useMemo } from "react";
import { 
  FaPrint, FaEye, FaClipboardList, FaCheckCircle, FaExclamationCircle,
  FaChartLine, FaClock, FaFilePdf, FaChevronRight 
} from "react-icons/fa";
import FormularioTabulacion from "../components/modals/FormularioTabulacion";
import ArchivoHistorico from "./ArchivoHistorico";

function Tabulacion() {
  const [renderKey] = useState(Date.now());
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);

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
      .map(([nombre, total]) => ({ 
        nombre, 
        total, 
        color: colorMap[nombre] || "bg-slate-300" 
      }))
      .sort((a, b) => b.total - a.total);

    return { tabuladasHoy, pendientes, ranking };
  }, [alertas, fechaHoy]);

  const handleTabular = (id) => {
    setAlertas(prev => prev.map(a => 
 
      a.id === id ? { ...a, estado: "TABULADO", fecha: fechaHoy } : a
    ));
    setIsModalOpen(false); 
  };

  const ultimasTabuladas = useMemo(() => {
    return alertas.filter(a => a.estado === "TABULADO").reverse().slice(0, 3);
  }, [alertas]);

  const [verTodo, setVerTodo] = useState(false);

  if (verTodo) {
    return <ArchivoHistorico alertas={alertas} onBack={() => setVerTodo(false)} />;
  }

  return (
    <div key={renderKey} className="-mt-9 px-2 min-h-screen bg-slate-50/50 font-sans text-left w-full py-8 space-y-8 animate-fadeIn pb-10">
      
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="lg:w-3/4 flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* CARD: TABULADAS HOY (SUBIRÁ CUANDO SE TABULE UNA) */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between px-10 transition-all hover:shadow-md">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 shadow-inner">
                  <FaChartLine size={24} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Tabuladas Hoy</p>
                  <p className="text-3xl font-black text-slate-800">{metricas.tabuladasHoy}</p>
                </div>
              </div>
              <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse shadow-[0_0_10px_rgba(22,163,74,0.7)]" style={{animationDuration: '2s'}}></div>
            </div>

            {/* CARD: PENDIENTES */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between px-10 transition-all hover:shadow-md">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 shadow-inner">
                  <FaClock size={24} />
                </div>
                <div>
                  <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Pendientes</p>
                  <p className="text-3xl font-black text-slate-800">{metricas.pendientes}</p>
                </div>
              </div>
              <div className="w-3 h-3 bg-amber-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(245,158,11,0.7)]" style={{animationDuration: '2s'}}></div>
            </div>
          </div>

          <div className="w-full bg-white p-12 rounded-3xl shadow-sm border border-gray-50 text-left">
            <div className="mb-10">
              <h2 className="text-3xl font-black uppercase tracking-tight text-[#1e293b]">Tabulación de Alertas</h2>
            </div>

            <div className="overflow-y-auto max-h-[550px] pr-2">
              <table className="w-full border-separate border-spacing-y-4">
                <thead>
                  <tr className="text-slate-400 text-[13.5px] font-extrabold uppercase tracking-[0.1em]">
                    <th className="pb-4 text-left uppercase tracking-[0.2em]">ID</th>
                    <th className="pb-4 text-left pl-10">Ciudadano</th>
                    <th className="pb-4 text-left">Incidente</th>
                    <th className="pb-4 text-left">Patrulla</th>
                    <th className="pb-4 text-left">Estado</th>
                    <th className="pb-4 text-left">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {alertas
                    .filter((a) => a.estado === "ATENDIDO")
                    .map((alerta) => (
                      <tr key={alerta.id} className="bg-white group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                        <td className="px-0 py-8 text-[15px] font-bold text-slate-400 border-y border-l rounded-l-[2.5rem] border-gray-50 uppercase">
                          {alerta.id}
                        </td>
                        <td className="py-5 border-y border-gray-50 pl-10">
                          <div className="flex items-center gap-5">
                            <div className="w-10 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
                              {alerta.ciudadano.charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-lg font-bold text-[#1e293b] leading-tight block w-[170px]">
                                {alerta.ciudadano}
                              </span>
                              <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">
                                Ciudadano Verificado
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-5 border-y border-gray-50">
                          <span className="text-sm font-bold text-slate-500 uppercase leading-tight block w-[160px]">
                            {alerta.incidente}
                          </span>
                        </td>
                        <td className="py-5 border-y border-gray-50">
                          <span className="bg-slate-100 text-slate-500 px-5 py-2.5 rounded-xl font-black text-sm border border-gray-300 uppercase">
                            {alerta.patrulla}
                          </span>
                        </td>
                        <td className="py-5">
                          <span className="inline-flex justify-center w-24 py-3 rounded-xl text-[12px] font-extrabold uppercase text-white shadow-md bg-[#00a65a]">
                            Atendido
                          </span>
                        </td>
                        <td className="px-4 py-5 border-y border-r rounded-r-[2.5rem] border-gray-50 text-left">
                          <button 
                            onClick={() => {
                              setAlertaSeleccionada(alerta);
                              setIsModalOpen(true);
                            }} 
                            className="p-4 bg-amber-500 text-white rounded-2xl shadow-lg shadow-amber-100 hover:scale-110 transition-all"
                          >
                            <FaClipboardList size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="lg:w-1/4 bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col">
          <div className="mb-8">
            <h2 className="text-xl font-black text-slate-800 uppercase">Reportes Comunes</h2>
            <p className="text-[10px] font-bold text-slate-300 uppercase mt-1">Estadísticas de incidentes</p>
          </div>
          <div className="space-y-4">
            {metricas.ranking.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 bg-slate-50/50 rounded-2xl border border-transparent hover:border-slate-100 transition-all">
                <div className="flex items-center gap-3 min-0">
                  <div className={`w-3 h-3 rounded-full ${item.color} shrink-0`} />
                  <span className="text-[11px] font-black text-slate-600 uppercase leading-[1.3] break-words">
                    {item.nombre}
                  </span>
                </div>
                <span className="text-xl font-black text-slate-800 ml-2">{item.total}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full bg-white p-10 rounded-3xl shadow-sm border border-gray-50 relative">
        <button 
          onClick={() => setVerTodo(true)} 
          className="absolute top-10 right-12 flex items-center gap-2 group transition-all"
        >
          <span className="text-green-600 font-black text-xs uppercase tracking-widest">Ver todo</span>
          <FaChevronRight className="text-green-600 text-[10px]" />
        </button>

        <div className="mb-10">
          <h2 className="text-2xl font-black uppercase tracking-tight text-[#1e293b]">Alertas Tabuladas</h2>
        </div>

        {ultimasTabuladas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-200 shadow-sm mb-4">
              <FaClipboardList size={32} />
            </div>
            <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Sin alertas tabuladas por el momento</h3>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-fadeIn">
            {ultimasTabuladas.map((alerta) => (
              <div key={alerta.id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 relative transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-[0_20px_40px_rgba(0,0,0,0.12)] group overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-3 bg-[#00a65a] rounded-l-[2.5rem]" />
                <div className="flex justify-between items-center mb-6 pl-4">
                  <span className="text-[11px] font-black text-slate-300 uppercase tracking-widest">{alerta.id}</span>
                  <span className="bg-green-50 text-green-600 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-tighter border border-green-100">
                    Archivado
                  </span>
                </div>
                <div className="flex items-center gap-5 mb-8 pl-4">
                  <div className="w-14 h-14 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center font-black text-xl shadow-inner border border-gray-50 group-hover:text-blue-600 group-hover:bg-blue-50 transition-colors">
                    {alerta.ciudadano.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-base font-black text-slate-700 leading-tight mb-1">{alerta.ciudadano}</h3>
                    <p className="text-[10px] font-bold text-slate-400">{alerta.fecha}</p>
                  </div>
                </div>
                <div className="mb-8 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 ml-4">
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Categoría</p>
                  <p className="text-[10px] font-black text-slate-600 uppercase leading-relaxed">{alerta.incidente}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 ml-4">
                  <button className="flex items-center justify-center gap-2 py-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-2xl border border-gray-100 transition-colors">
                    <FaEye size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Ver</span>
                  </button>
                  <button className="flex items-center justify-center gap-2 py-4 bg-green-600 hover:bg-green-700 text-white rounded-2xl shadow-lg shadow-green-100 transition-all">
                    <FaFilePdf size={14} />
                    <span className="text-[10px] font-black uppercase tracking-widest">PDF</span>
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
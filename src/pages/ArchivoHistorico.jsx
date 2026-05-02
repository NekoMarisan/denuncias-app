import React, { useState } from 'react';
import { 
  FaEye, FaFilePdf, FaSearch, 
  FaFileExcel, FaDownload, FaFileDownload,
  FaCheckCircle, FaTimesCircle, FaClipboardCheck, FaBan
} from 'react-icons/fa';

const ArchivoHistorico = ({ alertas, onBack }) => {
  const [busqueda, setBusqueda] = useState("");
  const [tabActiva, setTabActiva] = useState("TABULADO");
  const [filtroTiempo, setFiltroTiempo] = useState("TODO");

  // Filtrado de alertas según la pestaña activa y la búsqueda
  const alertasFiltradas = alertas.filter(a => {
    const cumpleEstado = a.estado === tabActiva;
    const cumpleBusqueda = 
      a.ciudadano.toLowerCase().includes(busqueda.toLowerCase()) || 
      a.id.toLowerCase().includes(busqueda.toLowerCase());
    return cumpleEstado && cumpleBusqueda;
  });

  const exportarExcel = () => console.log("Exportando a Excel...");
  const exportarPDF = () => console.log("Exportando a PDF...");

  return (
    <div className="-mt-9 w-full px-2 py-8 space-y-8 animate-fadeIn pb-10 bg-gray-50/30">
      
      {/* BARRA DE HERRAMIENTAS - Estilo Adaptado */}
      <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6 flex-1">
          {/* Selector de Pestañas (Tabs) */}
          <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shrink-0">
            <button 
              onClick={() => setTabActiva("TABULADO")} 
              className={`flex items-center gap-3 px-10 py-3.5 rounded-xl font-extrabold transition-all ${
                tabActiva === "TABULADO" 
                ? "bg-green-800 text-white shadow-green-100 shadow-lg" 
                : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <FaClipboardCheck size={16} /> FINALIZADOS
            </button>
            <button 
              onClick={() => setTabActiva("DESESTIMADO")} 
              className={`flex items-center gap-3 px-10 py-3.5 rounded-xl font-extrabold transition-all ${
                tabActiva === "DESESTIMADO" 
                ? "bg-orange-600 text-white shadow-lg shadow-orange-100" 
                : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <FaBan size={16} /> DESESTIMADOS
            </button>
          </div>

          {/* Buscador Dinámico */}
          <div className="relative flex-1">
            <FaSearch className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${
              tabActiva === "TABULADO" ? "text-green-700" : "text-orange-600"
            }`} />
            <input 
              type="text" 
              placeholder={`Buscar en ${tabActiva === "TABULADO" ? 'finalizados' : 'desestimados'}...`} 
              className={`w-full pl-14 pr-4 py-4 bg-gray-50/50 border rounded-2xl outline-none text-md font-bold text-slate-700 transition-all focus:bg-white ${
                tabActiva === "TABULADO" ? "border-gray-300 focus:border-green-600" : "border-gray-300 focus:border-orange-600"
              }`} 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
            />
          </div>
        </div>

        {/* Filtros de Tiempo y Exportación */}
        <div className="flex items-center gap-3">
          <div className="flex bg-gray-50 p-2 rounded-[1.5rem] border border-gray-100">
            {["TODO", "ESTE MES", "HOY"].map((f) => (
              <button 
                key={f} 
                onClick={() => setFiltroTiempo(f)} 
                className={`px-8 py-3 rounded-2xl font-extrabold text-[12px] uppercase transition-all ${
                  filtroTiempo === f 
                  ? (tabActiva === "TABULADO" ? "bg-green-800 text-white" : "bg-orange-600 text-white") 
                  : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative group">
            <button className="flex items-center gap-2 p-4 bg-white border-[3px] border-gray-200 text-slate-700 rounded-2xl font-black uppercase text-[12px] hover:border-blue-600 transition-all">
              <FaFileDownload size={18} /> <span>Exportar</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button onClick={exportarExcel} className="w-full px-4 py-3 text-left hover:bg-green-50 text-slate-600 font-bold text-sm flex items-center gap-3 transition-colors">
                <FaFileExcel className="text-green-600" size={16} /> Excel (.xls)
              </button>
              <button onClick={exportarPDF} className="w-full px-4 py-3 text-left hover:bg-red-50 text-slate-600 font-bold text-sm flex items-center gap-3 transition-colors">
                <FaFilePdf className="text-red-600" size={16} /> Guardar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CUADRICULA DE ALERTAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-10">
        {alertasFiltradas.map((alerta) => {
          const esDesestimado = alerta.estado === "DESESTIMADO";

          return (
            <div key={alerta.id} className="bg-white rounded-2xl border border-gray-100 relative transition-all duration-300 hover:scale-[1.02] shadow-sm hover:shadow-md overflow-hidden flex flex-col">
              <div className={`absolute left-0 top-0 bottom-0 w-2 ${esDesestimado ? 'bg-orange-500' : 'bg-green-700'}`} />
              
              <div className="p-5 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{alerta.id}</span>
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-tighter border ${
                    esDesestimado 
                      ? "bg-orange-50 text-orange-600 border-orange-100" 
                      : "bg-green-50 text-green-700 border-green-100"
                  }`}>
                    {esDesestimado ? 'Desestimado' : 'Finalizado'}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center font-black text-md shadow-inner border border-gray-50">
                    {alerta.ciudadano.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-sm font-black text-slate-700 leading-tight">{alerta.ciudadano}</h3>
                    <p className="text-[9px] font-bold text-slate-400">{alerta.fecha}</p>
                  </div>
                </div>

                <div className={`mb-4 p-2 rounded-xl border ${esDesestimado ? 'bg-orange-50/50 border-orange-100' : 'bg-green-50/30 border-green-100'}`}>
                  <p className={`text-[7px] font-black uppercase tracking-widest mb-0.5 ${esDesestimado ? 'text-orange-400' : 'text-green-700'}`}>
                    {esDesestimado ? 'Motivo de Rechazo' : 'Categoría'}
                  </p>
                  <p className="text-[9px] font-black text-slate-600 uppercase leading-tight truncate">
                    {esDesestimado ? (alerta.motivoDesestimacion || "SIN ESPECIFICAR") : alerta.incidente}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <button className="flex items-center justify-center gap-2 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl border border-gray-100 transition-colors text-[9px] font-black uppercase">
                    <FaEye size={12} /> Ver
                  </button>
                  <button className={`flex items-center justify-center gap-2 py-2.5 text-white rounded-xl shadow-md transition-all text-[9px] font-black uppercase ${
                    esDesestimado ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-800 hover:bg-green-900'
                  }`}>
                    <FaFilePdf size={12} /> PDF
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {alertasFiltradas.length === 0 && (
          <div className="col-span-full py-20 text-center">
            <p className="text-slate-400 font-black uppercase tracking-widest italic">
              No se encontraron registros en {tabActiva.toLowerCase()}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArchivoHistorico;
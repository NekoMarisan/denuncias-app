import React, { useState } from 'react';
import { 
  FaEye, FaFilePdf, FaSearch, 
  FaFileExcel, FaDownload, FaFileDownload,
  FaClipboardCheck, FaBan
} from 'react-icons/fa';

const ArchivoHistorico = ({ alertas, onBack }) => {
  const [busqueda, setBusqueda] = useState("");
  const [tabActiva, setTabActiva] = useState("TABULADO");
  const [filtroTiempo, setFiltroTiempo] = useState("TODO");

  // Filtrado robusto: verifica que existan las propiedades antes de llamar a toLowerCase
  const alertasFiltradas = alertas.filter(a => {
    const estadoAlerta = a.estado || "TABULADO";
    const cumpleEstado = estadoAlerta === tabActiva;
    
    // Protección contra undefined en ciudadano o id
    const ciudadano = a.ciudadano ? a.ciudadano.toLowerCase() : "";
    const idAlerta = a.id ? a.id.toLowerCase() : "";
    const busquedaLower = busqueda.toLowerCase();
    const cumpleBusqueda = ciudadano.includes(busquedaLower) || idAlerta.includes(busquedaLower);
    
    return cumpleEstado && cumpleBusqueda;
  });

  // Filtro por tiempo (a implementar según necesidad, por ahora solo placeholder)
  const exportarExcel = () => console.log("Exportando a Excel...");
  const exportarPDF = () => console.log("Exportando a PDF...");

  return (
    <div className="-mt-4 w-full px-1 py-4 space-y-4 animate-fadeIn pb-6 bg-gray-50/30">
      
      {/* BARRA DE HERRAMIENTAS - TAMAÑO REDUCIDO */}
      <div className="w-full bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          {/* Selector de Pestañas */}
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 shrink-0">
            <button 
              onClick={() => setTabActiva("TABULADO")} 
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-extrabold text-[10px] transition-all ${
                tabActiva === "TABULADO" 
                ? "bg-green-800 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <FaClipboardCheck size={12} /> FINALIZADOS
            </button>
            <button 
              onClick={() => setTabActiva("DESESTIMADO")} 
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-extrabold text-[10px] transition-all ${
                tabActiva === "DESESTIMADO" 
                ? "bg-orange-600 text-white shadow-sm" 
                : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <FaBan size={12} /> DESESTIMADOS
            </button>
          </div>

          {/* Buscador */}
          <div className="relative flex-1">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${
              tabActiva === "TABULADO" ? "text-green-700" : "text-orange-600"
            }`} />
            <input 
              type="text" 
              placeholder={`Buscar en ${tabActiva === "TABULADO" ? 'finalizados' : 'desestimados'}...`} 
              className={`w-full pl-8 pr-3 py-2 bg-gray-50/50 border rounded-xl outline-none text-[11px] font-bold text-slate-700 transition-all focus:bg-white ${
                tabActiva === "TABULADO" ? "border-gray-300 focus:border-green-600" : "border-gray-300 focus:border-orange-600"
              }`} 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
            />
          </div>
        </div>

        {/* Filtros de Tiempo y Exportación */}
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
            {["TODO", "ESTE MES", "HOY"].map((f) => (
              <button 
                key={f} 
                onClick={() => setFiltroTiempo(f)} 
                className={`px-4 py-1.5 rounded-lg font-extrabold text-[9px] uppercase transition-all ${
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
            <button className="flex items-center gap-1.5 p-2 bg-white border-2 border-gray-200 text-slate-700 rounded-xl font-black uppercase text-[9px] hover:border-blue-600 transition-all">
              <FaFileDownload size={12} /> <span>Exportar</span>
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button onClick={exportarExcel} className="w-full px-3 py-2 text-left hover:bg-green-50 text-slate-600 font-bold text-[10px] flex items-center gap-2 transition-colors">
                <FaFileExcel className="text-green-600" size={12} /> Excel (.xls)
              </button>
              <button onClick={exportarPDF} className="w-full px-3 py-2 text-left hover:bg-red-50 text-slate-600 font-bold text-[10px] flex items-center gap-2 transition-colors">
                <FaFilePdf className="text-red-600" size={12} /> Guardar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CUADRICULA DE ALERTAS - TAMAÑO REDUCIDO */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-6">
        {alertasFiltradas.map((alerta) => {
          const esDesestimado = (alerta.estado || "") === "DESESTIMADO";
          // Valores por defecto para evitar errores
          const idMostrar = alerta.id || "SIN ID";
          const ciudadanoMostrar = alerta.ciudadano || "Desconocido";
          const fechaMostrar = alerta.fecha || "—";
          const incidenteMostrar = alerta.incidente || "Sin clasificar";
          const motivoMostrar = alerta.motivoDesestimacion || "SIN ESPECIFICAR";

          return (
            <div key={idMostrar} className="bg-white rounded-xl border border-gray-100 relative transition-all duration-200 hover:scale-[1.01] shadow-sm hover:shadow-md overflow-hidden flex flex-col">
              <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${esDesestimado ? 'bg-orange-500' : 'bg-green-700'}`} />
              
              <div className="p-3 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[8px] font-black text-slate-300 uppercase tracking-wider">{idMostrar}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase tracking-tighter border ${
                    esDesestimado 
                      ? "bg-orange-50 text-orange-600 border-orange-100" 
                      : "bg-green-50 text-green-700 border-green-100"
                  }`}>
                    {esDesestimado ? 'Desestimado' : 'Finalizado'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-lg bg-slate-50 text-slate-400 flex items-center justify-center font-black text-xs border border-gray-50">
                    {ciudadanoMostrar.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[11px] font-black text-slate-700 leading-tight">{ciudadanoMostrar}</h3>
                    <p className="text-[7px] font-bold text-slate-400">{fechaMostrar}</p>
                  </div>
                </div>

                <div className={`mb-3 p-1.5 rounded-lg border ${esDesestimado ? 'bg-orange-50/50 border-orange-100' : 'bg-green-50/30 border-green-100'}`}>
                  <p className={`text-[6px] font-black uppercase tracking-wider mb-0.5 ${esDesestimado ? 'text-orange-400' : 'text-green-700'}`}>
                    {esDesestimado ? 'Motivo' : 'Categoría'}
                  </p>
                  <p className="text-[8px] font-black text-slate-600 uppercase leading-tight truncate">
                    {esDesestimado ? motivoMostrar : incidenteMostrar}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-auto">
                  <button className="flex items-center justify-center gap-1 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg border border-gray-100 transition-colors text-[8px] font-black uppercase">
                    <FaEye size={9} /> Ver
                  </button>
                  <button className={`flex items-center justify-center gap-1 py-1.5 text-white rounded-lg shadow-md transition-all text-[8px] font-black uppercase ${
                    esDesestimado ? 'bg-orange-600 hover:bg-orange-700' : 'bg-green-800 hover:bg-green-900'
                  }`}>
                    <FaFilePdf size={9} /> PDF
                  </button>
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
      </div>
    </div>
  );
};

export default ArchivoHistorico;
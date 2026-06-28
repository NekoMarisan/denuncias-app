import React from "react";
import { useLocation } from "react-router-dom";

const ICONOS = {
  oficiales:  { emoji: "🛡️", label: "Personal Policial",      color: "#113e27" },
  ciudadanos: { emoji: "👥", label: "Registro de Ciudadanos",  color: "#0172e3" },
  denuncias:  { emoji: "📋", label: "Alertas y Denuncias",     color: "#c64114" },
  alertas:    { emoji: "🚨", label: "Reporte de Alertas",      color: "#b40909" },
};

function Reporte() {
  const params  = new URLSearchParams(useLocation().search);
  const tipo    = params.get("tipo")   || "reporte";
  const fecha   = params.get("fecha")  ? new Date(params.get("fecha")).toLocaleString("es-ES") : "—";
  const total   = params.get("total")  || "0";
  const admin   = params.get("admin")  || "ADMINISTRADOR";
  const modulo  = params.get("modulo") || "Sistema";
  const extra   = params.get("extra")  || "";

  const icono = ICONOS[tipo] || { emoji: "📄", label: tipo.toUpperCase(), color: "#334155" };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">

        <div className="px-6 py-5 flex items-center gap-4" style={{ backgroundColor: icono.color }}>
          <span className="text-3xl">{icono.emoji}</span>
          <div>
            <p className="text-white font-black text-base uppercase tracking-widest">
              Central Radio Patrullas
            </p>
            <p className="text-white/70 text-xs font-bold mt-0.5 uppercase tracking-wider">
              {icono.label}
            </p>
          </div>
        </div>

        <div className="bg-green-50 border-b border-green-100 px-6 py-2 flex items-center gap-2">
          <span className="text-green-600 text-xs">✓</span>
          <p className="text-[11px] font-black text-green-700 uppercase tracking-widest">
            Documento verificado
          </p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Módulo</p>
              <p className="font-bold text-slate-700 mt-1 text-sm">{modulo}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</p>
              <p className="font-black text-slate-800 uppercase mt-1 text-sm">{icono.label}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total registros</p>
              <p className="font-black text-2xl mt-1" style={{ color: icono.color }}>{total}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generado por</p>
              <p className="font-bold text-slate-700 mt-1 text-sm">{admin}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha de generación</p>
            <p className="font-bold text-slate-700 mt-1 text-sm">{fecha}</p>
          </div>

          {extra && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Información adicional</p>
              <p className="font-bold text-slate-700 mt-1 text-sm">{decodeURIComponent(extra)}</p>
            </div>
          )}

          <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[10px] text-slate-400 text-center">
              Central de Radio Patrullas · 110 · Documento de uso interno
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Reporte;
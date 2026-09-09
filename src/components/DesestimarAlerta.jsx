import React from "react";
import { FaTimes } from "react-icons/fa";

const motivosDesestimo = [
  "Falsa alarma",
  "Datos insuficientes",
  "Fuera del ámbito institucional",
  "La alerta no corresponde a un hecho real",
];

const DesestimarAlerta = ({
  motivo,
  onMotivoChange,
  justificacion,
  onJustificacionChange,
  topSpacingClass = "pt-2",
}) => {
return (
    <div className="flex flex-col gap-5 w-full">
      {/* Motivo de desestimación */}
<div>
                <div className={`border-t border-slate-200 ${topSpacingClass}`}>
                  <h4 className="text-[14px] font-medium uppercase text-slate-600 tracking-wider">Motivo de desestimación</h4>
                </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
          {motivosDesestimo.map((m) => (
         <label
              key={m}
              className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-[12px] text-slate-500 cursor-pointer transition-colors font-medium tracking-wider
                           ${
                motivo === m
                  ? "border-[#474b29] bg-[#474b29]/5"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <input
                type="radio"
                name="motivoDesestimo"
                className="accent-[#474b29] w-3.5 h-3.5 cursor-pointer shrink-0"
                checked={motivo === m}
                onChange={() => onMotivoChange(m)}
              />
              <span className="leading-tight">{m}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Justificación */}
      <div>
        <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
          Justificación adicional
        </label>
        <div className="relative border border-slate-200 rounded-xl px-3.5 py-3 focus-within:border-slate-300">
<textarea
  className="block w-full min-h-[44px] text-[12px] text-slate-500 font-medium bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 resize-y tracking-wider  
              "
  placeholder="Agregue el detalle de la desestimación (obligatorio)"
  value={justificacion}
  onChange={(e) => onJustificacionChange(e.target.value)}
  required
/>
          {justificacion && (
            <button
              type="button"
              onClick={() => onJustificacionChange("")}
              className="absolute top-2.5 sm:top-3 right-3 text-slate-400 hover:text-slate-500 transition-colors"
              title="Limpiar justificación"
            >
              <FaTimes size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default DesestimarAlerta;
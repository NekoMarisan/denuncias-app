import React from "react";
import { FaCircle, FaLock } from "react-icons/fa";

export const AlertaCard = ({
  alerta,
  seleccionada,
  onClick,
  bloqueadaPorOtro,
  bloqueadoNombre,
}) => {
  const nombre = alerta?.nombre || "Usuario";
  const partes = nombre.split(" ");

  const baseClasses =
  "p-2.5 rounded-xl border cursor-pointer transition-all duration-300";
  const shadowClasses = "shadow hover:shadow-lg";

  const stateClasses = seleccionada
    ? alerta.tipo === "EMERGENCIA"
      ? "border-red-300 bg-red-100/20 shadow-md"
      : "border-blue-300 bg-blue-100/20 shadow-md"
    : "border-slate-200 bg-white hover:border-slate-300";

return (
    <div
      onClick={bloqueadaPorOtro ? undefined : onClick}
      className={`${baseClasses} ${shadowClasses} ${stateClasses} ${
        bloqueadaPorOtro ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
    <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-6 h-8 rounded-md bg-blue-50 text-[#270cb2] flex items-center shadow-inner justify-center font-black text-sm shrink-0">
            {nombre.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="text-[11.5px] text-slate-600 font-medium tracking-wider block leading-tight truncate">
              {partes.slice(0, 2).join(" ")}
            </span>
            <span className="text-[11.5px] text-slate-600 font-medium tracking-wider block leading-tight truncate">
              {partes.slice(2).join(" ")}
            </span>
          </div>
        </div>
        <span
          className={`px-1.5 py-0.5 rounded-[5px] text-[9px] font-medium tracking-wider uppercase whitespace-nowrap text-white shrink-0 ${
            alerta.tipo === "EMERGENCIA" ? "bg-[#C90A0A]" : "bg-[#0C3DC2]"
          }`}
        >
          {alerta.tipo === "EMERGENCIA" ? "EMERGENCIA" : "INTERVENCIÓN"}
        </span>
      </div>

      <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 bg-white/50 p-1.5 rounded-lg border border-slate-100">
        <FaCircle className="text-[6px]" />
        <span>{alerta.clasificacionHecho || "—"}</span>
      </div>

      {bloqueadaPorOtro && (
        <div className="flex items-center gap-1.5 text-[9.5px] font-medium text-slate-400 mt-1.5 px-0.5">
          <FaLock className="text-[9px]" />
          <span className="truncate">
            {bloqueadoNombre ? `Gestionada por ${bloqueadoNombre}` : "Gestionada por otro despachador"}
          </span>
        </div>
      )}
    </div>
  );
};
import React from "react";
import { FaCircle } from "react-icons/fa";

export const AlertaCard = ({ alerta, seleccionada, onClick }) => {
  const nombre = alerta?.nombre || "Usuario";
  const partes = nombre.split(" ");

  // Clases base para el efecto de tarjeta
  const baseClasses = "p-3 rounded-xl border cursor-pointer transition-all duration-300";
  
  // Sombra base y sombra al hacer hover
  const shadowClasses = "shadow hover:shadow-lg";

  // Lógica de colores según el estado (seleccionada o normal)
  const stateClasses = seleccionada
    ? alerta.tipo === "EMERGENCIA"
      ? "border-red-300 bg-red-100/20 shadow-md"
      : "border-blue-300 bg-blue-100/20 shadow-md"
    : "border-slate-200 bg-white hover:border-slate-300";

  return (
    <div
      onClick={onClick}
      className={`${baseClasses} ${shadowClasses} ${stateClasses}`}
    >
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center shadow-inner justify-center font-black text-sm shrink-0">
          {nombre.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <span className="text-[12px] font-bold text-[#1e293b] block leading-tight">
            {partes.slice(0, 2).join(" ")}
          </span>
          <span className="text-[12px] font-bold text-[#1e293b] block leading-tight">
            {partes.slice(2).join(" ")}
          </span>
        </div>
        <span
          className={`-mt-4 px-1.5 py-0.5 rounded-[5px] text-[9px] font-bold uppercase whitespace-nowrap text-white ${
            alerta.tipo === "EMERGENCIA" ? "bg-[#C90A0A]" : "bg-[#0C3DC2]"
          }`}
        >
          {alerta.tipo === "EMERGENCIA" ? "EMERGENCIA" : "INTERVENCIÓN"}
        </span>
      </div>
      <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white/50 p-1.5 rounded-lg border border-slate-100">
        <FaCircle className="text-[6px]" />
        <span>{alerta.clasificacionHecho}</span>
      </div>
    </div>
  );
};
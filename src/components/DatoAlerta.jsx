import React, { forwardRef } from "react";
import { FaUser, FaFileAlt, FaMapMarkerAlt, FaExclamationCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export const DatoAlerta = forwardRef(({ alerta, visible, onClose }, ref) => {
  const getPrioridadStyles = (prioridad) => {
    if (!prioridad) return "bg-amber-400 text-white";
    const p = prioridad.toString().toLowerCase().trim();
    if (p === "alta" || p === "alto") return "bg-[#C90A0A] text-white";
    if (p === "media" || p === "medio") return "bg-[#0C3DC2] text-white";
    if (p === "baja" || p === "bajo") return "bg-[#e9b301] text-white";
    return "bg-amber-400 text-white";
  };

  // Determinar tipo y texto de clasificación
  let tipoClasificacion = "Clasificación";
  let textoClasificacion = "—";
  if (alerta?.contravenciones) {
    tipoClasificacion = "Contravención";
    textoClasificacion = alerta.contravenciones;
  } else if (alerta?.delitos) {
    tipoClasificacion = "Delito";
    textoClasificacion = alerta.delitos;
  } else if (alerta?.clasificacionHecho) {
    textoClasificacion = alerta.clasificacionHecho;
  }

  return (
    <AnimatePresence>
      {visible && alerta && (
        <motion.div
          ref={ref}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          style={{ overflow: "visible" }}
        >
          <div className="pt-3 relative z-20">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl font-extrabold text-[#1e293b] uppercase">
                      {alerta.tipo === "EMERGENCIA" ? "Alerta de Emergencia" : "Alerta Ciudadana"} — {alerta.codigo}
                    </h2>
                    <div className={`px-2.5 py-1 rounded-md text-[11px] tracking-wider font-extrabold text-white ${alerta.tipo === "EMERGENCIA" ? "bg-[#C90A0A]" : "bg-[#0C3DC2]"}`}>
                      {alerta.tipo === "EMERGENCIA" ? "EMERGENCIA" : "INTERVENCIÓN"}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-3">
                    <div className="flex items-center gap-2 border-l-2 border-slate-300 pl-2">
                      <FaUser size={12} className="text-slate-400" />
                      <span className="text-sm font-bold text-[#474d56]">{alerta.nombre}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${getPrioridadStyles(alerta.prioridad)}`}>
                      {alerta.prioridad || "N/A"}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-slate-400 hover:text-slate-600 text-[10px] font-bold uppercase tracking-wider transition-colors"
                >
                  Cerrar
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Columna izquierda */}
                <div className="flex-1 flex flex-col gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-wider">
                      {tipoClasificacion}
                    </p>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                      <FaFileAlt className="text-[#0C3DC2] text-sm shrink-0" />
                      <span className="text-sm font-semibold text-slate-700 uppercase">
                        {textoClasificacion}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Coordenadas</p>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                      <FaMapMarkerAlt className="text-[#C90A0A] text-sm shrink-0" />
                      <span className="text-sm font-semibold text-slate-700">
                        {alerta.lat?.toFixed(6)}, {alerta.lng?.toFixed(6)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Separador vertical */}
                <div className="hidden md:block w-px bg-slate-200 self-stretch"></div>

                {/* Columna derecha */}
                <div className="w-[500px] shrink-0">
                  <p className="text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Descripción</p>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm h-[130px] overflow-y-auto">
                    <p className="text-sm text-slate-600 leading-relaxed">{alerta.relato || "—"}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

export const DetalleAlerta = DatoAlerta;
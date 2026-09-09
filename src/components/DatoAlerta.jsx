import React, { forwardRef } from "react";
import { FaUser, FaFileAlt, FaMapMarkerAlt, FaExclamationCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export const DatoAlerta = forwardRef(({ alerta, visible, onClose, onExitComplete }, ref) => {
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
    <AnimatePresence mode="wait" onExitComplete={onExitComplete}>
      {visible && alerta && (
        <motion.div
          key={alerta.id}
          ref={ref}
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          style={{ overflow: "visible" }}
          layout
        >
          <div className="relative z-20 pt-1 mb-3 mt-1">
            <div className="relative bg-white p-5 py-4 rounded-2xl border border-slate-200 shadow-md max-h-[450px] overflow-y-auto scroll-hover">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-2">
                <div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-xl font-extrabold text-[#1e293b] uppercase tracking-wider">
                      {alerta.tipo === "EMERGENCIA" ? "Alerta de Emergencia" : "Alerta Ciudadana"} — {alerta.codigo}
                    </h2>
                    <div className={`px-2.5 py-1 rounded-md text-[11px] tracking-wider font-medium text-white ${alerta.tipo === "EMERGENCIA" ? "bg-[#C90A0A]" : "bg-[#0C3DC2]"}`}>
                      {alerta.tipo === "EMERGENCIA" ? "EMERGENCIA" : "INTERVENCIÓN"}
                    </div>
                  </div>

                </div>
                <button 
                  onClick={onClose} 
                  className="text-slate-400 hover:text-slate-600 text-[11px] font-medium uppercase tracking-widest transition-colors"
                >
                  Cerrar
                </button>
              </div>

              <div className="flex flex-col md:flex-row gap-6 -mt-2">
                {/* Columna izquierda */}
                <div className="flex-1 flex flex-col gap-4 mt-4">
                  <div>
                    <p className="text-[11px] font-medium text-slate-400 uppercase mb-2 tracking-wider">
                      {tipoClasificacion}
                    </p>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">

                      <span className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                        {textoClasificacion}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-5 mt-2 mb-1">
                    <div className="flex-1">
                      <p className="text-[11px] font-medium text-slate-400 uppercase mb-2 tracking-wider">Coordenadas</p>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-800 tracking-wider">
                          {alerta.lat?.toFixed(6)}, {alerta.lng?.toFixed(6)}
                        </span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[11px] font-medium text-slate-400 uppercase mb-2 tracking-wider">Prioridad</p>
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                        <span className="text-sm font-semibold text-slate-800 uppercase tracking-wider">
                          {alerta.prioridad || "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Separador vertical */}
                <div className="hidden md:block w-px h-36 bg-slate-200 self-stretch mt-6"></div>

                {/* Columna derecha */}
                <div className="w-full md:w-[630px] shrink-0 mt-4">
                  <p className="text-[11px] font-medium text-slate-400 uppercase mb-2 tracking-wider">Descripción</p>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm h-[140px] overflow-y-auto">
                    <p className="text-sm text-slate-800 leading-relaxed">{alerta.relato || "—"}</p>
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
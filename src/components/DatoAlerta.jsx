import React, { forwardRef } from "react";
import { FaUser, FaFileAlt, FaMapMarkerAlt, FaExclamationCircle } from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

export const DatoAlerta = forwardRef(({ alerta, visible, onClose }, ref) => {
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
                    <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-white ${alerta.tipo === "EMERGENCIA" ? "bg-red-600" : "bg-blue-600"}`}>
                      {alerta.tipo === "EMERGENCIA" ? "EMERGENCIA" : "INTERVENCIÓN"}
                    </div>
                  </div>
                  <div className="mt-3 flex items-center gap-2 border-l-2 border-slate-300 pl-3">
                    <FaUser size={12} className="text-slate-400" />
                    <span className="text-sm font-bold text-[#474d56]">{alerta.nombre}</span>
                  </div>
                </div>
                <button 
                  onClick={onClose} 
                  className="text-slate-400 hover:text-slate-600 text-xs font-bold uppercase tracking-wide transition-colors"
                >
                  Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Columna izquierda */}
                <div className="flex flex-col gap-4">
                  {/* CLASIFICACIÓN con tipo */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-wider">
                      {alerta.tipoClasificacion || "Clasificación"}
                    </p>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                      <FaFileAlt className="text-blue-500 text-sm shrink-0" />
                      <span className="text-sm font-semibold text-slate-700 uppercase">
                        {alerta.clasificacionHecho || "—"}
                      </span>
                    </div>
                  </div>

                  {/* PRIORIDAD (nuevo) */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-wider">
                      Prioridad
                    </p>
                    <div className={`p-3 rounded-lg border shadow-sm flex items-center gap-3 ${
                      alerta.prioridad?.toUpperCase() === "ALTA"
                        ? "bg-red-50 border-red-200"
                        : alerta.prioridad?.toUpperCase() === "MEDIA"
                        ? "bg-blue-50 border-blue-200"
                        : "bg-amber-50 border-amber-200"
                    }`}>
                      <FaExclamationCircle className={`text-sm shrink-0 ${
                        alerta.prioridad?.toUpperCase() === "ALTA"
                          ? "text-red-500"
                          : alerta.prioridad?.toUpperCase() === "MEDIA"
                          ? "text-blue-500"
                          : "text-amber-500"
                      }`} />
                      <span className="text-sm font-bold text-slate-700 uppercase">
                        {alerta.prioridad || "—"}
                      </span>
                    </div>
                  </div>

                  {/* Coordenadas */}
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Coordenadas</p>
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 shadow-sm flex items-center gap-3">
                      <FaMapMarkerAlt className="text-red-500 text-sm shrink-0" />
                      <span className="text-sm font-semibold text-slate-700">{alerta.lat?.toFixed(6)}, {alerta.lng?.toFixed(6)}</span>
                    </div>
                  </div>
                </div>

                {/* Columna derecha */}
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Descripción</p>
                    <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm h-32 overflow-y-auto">
                      <p className="text-sm text-slate-600 leading-relaxed">{alerta.relato || "—"}</p>
                    </div>
                  </div>

                  {/* Reporte del patrullero (solo si existe) */}
                  {alerta.reportePatrullero && (
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-wider">Reporte del patrullero</p>
                      <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 shadow-sm">
                        <p className="text-sm text-slate-600 leading-relaxed">{alerta.reportePatrullero}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});

// Exportación para que funcione con el nombre DetalleAlerta en CentroDespacho
export const DetalleAlerta = DatoAlerta;
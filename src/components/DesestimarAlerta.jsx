import React, { useState } from "react";
import { FaTimes } from "react-icons/fa";

const motivosDesestimo = [
  "Falsa alarma",
  "Datos insuficientes",
  "Fuera del ámbito institucional",
  "La alerta no corresponde a un hecho real",
];

const DesestimarAlerta = ({
  onConfirm,
  onCancel,
  cargandoInicial = false,
  showToast,
}) => {
  const [motivoSeleccionado, setMotivoSeleccionado] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [cargando, setCargando] = useState(cargandoInicial);

  const handleConfirm = async () => {
    if (!motivoSeleccionado) {
      if (showToast) showToast("Seleccionar un MOTIVO", "error");
      return;
    }
    if (!justificacion.trim()) {
      if (showToast) showToast("Completar el campo JUSTIFICACIÓN ADICIONAL", "error");
      return;
    }
    setCargando(true);
    await onConfirm(motivoSeleccionado, justificacion);
    setCargando(false);
  };

  const limpiarJustificacion = () => {
    setJustificacion("");
  };

  return (
    <div className="flex flex-col h-full w-full -mt-1">
      <div className="mb-2">
        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-500 ">
          Desestimar Alerta
        </h3>
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-md flex-1">
        <div className="border-l-4 border-[#c64114] pl-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">
          Motivo de desestimación (único)
        </div>
        <div className="space-y-2 mb-2 -mt-1">
          {motivosDesestimo.map((motivo) => (
            <label
              key={motivo}
              className={`flex items-center gap-3 p-2 rounded-md border text-[11px] font-semibold cursor-pointer transition-all ${
                motivoSeleccionado === motivo
                  ? "bg-white border-slate-300 text-slate-700 shadow-sm"
                  : "text-slate-600 hover:bg-white hover:border-white"
              }`}
            >
              <input
                type="radio"
                name="motivoDesestimo"
                className="accent-[#c64114] w-3.5 h-3.5 cursor-pointer"
                checked={motivoSeleccionado === motivo}
                onChange={() => setMotivoSeleccionado(motivo)}
              />
              <span>{motivo}</span>
            </label>
          ))}
        </div>

        <div className="mb-3">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Justificación adicional
          </label>
          <div className="relative">


            
            <textarea
              className="mt-1 w-full h-14 min-h-14 p-2 pr-8 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:border-slate-300 resize-y bg-white"
              placeholder="Agregue el detalle de la desestimación (obligatorio)"
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              required
            />
            {justificacion && (
              <button
                type="button"
                onClick={limpiarJustificacion}
                className="absolute top-3 right-2 text-slate-400 hover:text-slate-600 transition-colors"
                title="Limpiar justificación"
              >
                <FaTimes size={12} />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 -mt-1">
          <button
            type="button"
            onClick={onCancel}
            disabled={cargando}
            className="flex-1 py-2 bg-slate-200 hover:bg-slate-300 rounded-md text-[11px] font-bold uppercase tracking-wider text-slate-700 transition-colors disabled:opacity-40"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={cargando} 
            className="flex-1 py-2 bg-[#c64114] hover:bg-[#c03e12] text-white rounded-md text-[11px] font-bold uppercase tracking-wider disabled:opacity-40 transition-all flex items-center justify-center"
          >
            {cargando ? "Desestimando..." : "Desestimar alerta"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DesestimarAlerta;
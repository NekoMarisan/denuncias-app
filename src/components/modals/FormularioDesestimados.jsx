import React from "react";
import {
  FaTimes, FaUser, FaPhone, FaMapMarkerAlt,
  FaExclamationTriangle, FaUserCheck, FaInfoCircle, FaShieldAlt, FaHistory
} from "react-icons/fa";

// Componentes auxiliares (mismos estilos que en FormularioTabulacion)
const HeaderSection = ({ icon, title, bgColor }) => (
  <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-4 shrink-0">
    <div className={`w-7 h-7 ${bgColor} rounded-lg flex items-center justify-center`}>{icon}</div>
    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h2>
  </div>
);

const Field = ({ label, value }) => (
  <div className="space-y-0.5">
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1.5">{label}</label>
    <input
      type="text"
      readOnly
      value={value || '—'}
      className="w-full rounded-xl p-2.5 text-xs font-bold outline-none border bg-slate-100/40 border-slate-100 text-slate-600"
    />
  </div>
);

const FormularioDesestimados = ({ alerta, onClose, onGenerarPDF }) => {
  if (!alerta) return null;

  const {
    codigo_alerta,
    ciudadano,
    ubicacion,
    descripcion,
    contravenciones,
    delitos,
    motivo_desestimo,
    justificacion,
    fecha_desestimo,
    ci,
    nombre_operador_desestimo
  } = alerta;

  // Formatear fecha/hora si existe
  const formatFechaHora = (isoString) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "—";
    return date.toLocaleString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  const splitNameLines = (fullName) => {
  if (!fullName || fullName === '—') return { first: fullName, last: '' };
  const parts = fullName.trim().split(' ');
  if (parts.length === 1) return { first: parts[0], last: '' };
  return { first: parts[0], last: parts.slice(1).join(' ') };
};

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[85vh]">
        {/* BARRA SUPERIOR - mismo estilo que en tabulación */}
        <div className="bg-[#113e27] py-4 px-6 text-white w-full shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-md flex items-center justify-center shrink-0">
                <FaShieldAlt className="text-white" size={30} />
              </div>
              <div className="flex flex-col gap-1.5">
                <h2 className="text-[18px] font-bold uppercase tracking-wideR leading-none mt-0.5">
                  ALERTA DESESTIMADA - REPORTE FINAL
                </h2>
                <div className="flex flex-wrap gap-3 text-[11px] font-bold text-white/70 mt-0.5">
  {codigo_alerta && (
    <span>ID: {codigo_alerta}</span>
  )}
  {fecha_desestimo && (
    <span className="ml-3">Desestimado: {fecha_desestimo}</span>
  )}
</div>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hover:bg-white/20 p-1.5 rounded-md transition-colors shrink-0 mt-1"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* CUERPO CON SCROLL */}
        <div className="overflow-y-auto p-6 bg-white">
          {/* DATOS DE LA ALERTA */}
          <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full mb-6">
            <HeaderSection icon={<FaInfoCircle className="text-blue-600 text-sm" />} title="DATOS DE LA ALERTA" bgColor="bg-blue-50" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="CIUDADANO" value={ciudadano} />
              <Field label="CÉDULA" value={ci} />
              <div className="md:col-span-2">
                <Field label="UBICACIÓN" value={ubicacion} />
              </div>
              <div className="md:col-span-2">
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-2">DESCRIPCIÓN DEL HECHO</label>
                  <textarea readOnly value={descripcion || "Sin descripción"}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-medium italic text-slate-400 outline-none mt-1 h-24 resize-none" />
                </div>
              </div>
              {(contravenciones || delitos) && (
                <div className="md:col-span-2">
                  <Field label="CLASIFICACIÓN ORIGINAL" value={contravenciones || delitos} />
                </div>
              )}
            </div>
          </section>

          {/* INFORMACIÓN DE DESESTIMACIÓN */}
          <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full mb-6">
            <HeaderSection icon={<FaExclamationTriangle className="text-red-600 text-sm" />} title="INFORMACIÓN DE DESESTIMACIÓN" bgColor="bg-red-50" />
            <div className="grid grid-cols-1 gap-4">
  <Field label="MOTIVO" value={motivo_desestimo} />
  <Field label="FECHA DE DESESTIMACIÓN" value={fecha_desestimo} />
  <div className="space-y-0.5">
    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1.5">JUSTIFICACIÓN ADICIONAL</label>
    <textarea
      readOnly
      value={justificacion || "No especificada"}
      className="w-full bg-slate-100/40 border border-slate-100 rounded-xl p-3 text-xs font-medium italic text-slate-500 outline-none h-20 resize-none"
    />
  </div>
</div>
          </section>

          {/* HISTORIAL DE PROCESO - estilo similar al de tabulación */}
          <div className="pt-6 px-2 mt-4">
  <h2 className="flex items-center gap-3 font-bold text-slate-400 uppercase text-[11px] tracking-wider mb-5">
    HISTORIAL DE PROCESO
  </h2>
  <div className="flex flex-wrap md:flex-nowrap justify-center gap-5">
    <HistoryCard
      role="OPERADOR QUE DESESTIMÓ"
      name={nombre_operador_desestimo || "—"}
      icon={<FaUserCheck size={12} />}
      highlight
      splitName={splitNameLines(nombre_operador_desestimo || "—")}
    />
  </div>
</div>

          {/* BOTONES */}
          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 font-black rounded-xl uppercase text-[9px] tracking-[0.15em] transition-all"
            >
              CERRAR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const HistoryCard = ({ role, name, icon, highlight, splitName }) => (
  <div className={`flex-1 flex flex-col items-center min-w-[96px] rounded-xl p-2 transition-all ${highlight ? 'bg-green-50 border border-green-200 shadow-md' : 'bg-white border border-slate-300 shadow-md'}`}>
    <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${highlight ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
      {icon}
    </div>
    <p className="text-[9px] font-bold text-slate-400 uppercase text-center">{role}</p>
    <div className="text-center mt-1">
      <p className={`text-[9px] font-bold uppercase leading-tight ${highlight ? 'text-green-700' : 'text-slate-600'}`}>
        {splitName.first}
      </p>
      {splitName.last && (
        <p className={`text-[9px] font-bold uppercase leading-tight ${highlight ? 'text-green-700' : 'text-slate-600'}`}>
          {splitName.last}
        </p>
      )}
    </div>
  </div>
);

export default FormularioDesestimados;
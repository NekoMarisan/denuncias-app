import React, { useState, useEffect } from "react";
import {
  FaTimes, FaUser, FaPhone, FaMapMarkerAlt,
  FaExclamationTriangle, FaUserCheck, FaInfoCircle, FaShieldAlt, FaHistory,
  FaFilePdf, FaSpinner
} from "react-icons/fa";
import { FormularioDesestimadosSkeleton } from '../ui/Skeleton';

// Componentes auxiliares (mismos estilos que en FormularioTabulacion)
const HeaderSection = ({ title }) => (
  <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-2 shrink-0">
    <h2 className="text-[18px] font-bold uppercase text-[#1e293b] tracking-wider">
      {title}
    </h2>
  </div>
);

const Field = ({ label, value }) => (
  <div className="space-y-1">
    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">
      {label}
    </label>
    <input
      type="text"
      readOnly
      value={value || '—'}
      className="w-full rounded-xl px-3.5 py-2.5 text-[12px] font-medium tracking-wider outline-none border border-slate-200 bg-slate-50 text-slate-600"
    />
  </div>
);

const FormularioDesestimados = ({ alerta, onClose, onGenerarPDF }) => {
  // Estado de carga para el botón de generar PDF de este modal
  const [generandoPDF, setGenerandoPDF] = useState(false);

  // Estado de carga (esqueleto) al abrir el modal, igual que en FormularioTabulacion
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (alerta) {
      setCargando(true);
      const timer = setTimeout(() => setCargando(false), 500);
      return () => clearTimeout(timer);
    }
  }, [alerta]);

  if (!alerta) return null;

  const {
    codigo_alerta,
    ciudadano,
    ci,
    celular,
    ubicacion,
    latitud,
    longitud,
    descripcion,
    contravenciones,
    delitos,
    prioridad, // ✅ prioridad real de la alerta (ALTA / MEDIA / BAJA)
    motivo_desestimo,
    justificacion,
    fecha_desestimo,
    nombre_operador_desestimo
  } = alerta;

  // Formatear fecha/hora si existe (mismo formato que en FormularioTabulacion: "08 jul 2026, 14:47")
  // Parsea también fechas ya formateadas como "3/7/2026, 2:15 p. m." (D/M/YYYY, h:mm a.m./p.m.)
  const parseFechaLocalPersonalizada = (str) => {
    const match = String(str).match(
      /^(\d{1,2})\/(\d{1,2})\/(\d{4}),?\s*(\d{1,2}):(\d{2})(?::\d{2})?\s*([ap])\.?\s*m\.?/i
    );
    if (!match) return null;
    let [, day, month, year, hour, minute, ampm] = match;
    hour = parseInt(hour, 10);
    ampm = ampm.toLowerCase();
    if (ampm === 'p' && hour !== 12) hour += 12;
    if (ampm === 'a' && hour === 12) hour = 0;
    return new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10), hour, parseInt(minute, 10));
  };

  const formatFechaHora = (value) => {
    if (!value) return "—";
    let date = new Date(value);
    if (isNaN(date.getTime())) {
      date = parseFechaLocalPersonalizada(value);
    }
    if (!date || isNaN(date.getTime())) return value;
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

  // Igual que en FormularioTabulacion: usa latitud/longitud directos de la BD,
  // y si no vienen, los extrae del campo "ubicacion" tipo "lat, lng"
  let latitudFinal = latitud !== undefined && latitud !== null ? latitud.toString() : '';
  let longitudFinal = longitud !== undefined && longitud !== null ? longitud.toString() : '';

  if (ubicacion && ubicacion.includes(',')) {
    const [lat, lng] = ubicacion.split(',').map(s => s.trim());
    if (!latitudFinal) latitudFinal = lat;
    if (!longitudFinal) longitudFinal = lng;
  }

  // ✅ Wrapper con loading para el botón "Generar PDF" del modal
  const handleGenerarPDFClick = async () => {
    if (generandoPDF || !onGenerarPDF) return;
    setGenerandoPDF(true);
    try {
      await onGenerarPDF();
    } catch (err) {
      console.error("Error al generar PDF desde el modal de desestimados:", err);
    } finally {
      setGenerandoPDF(false);
    }
  };

  const prioridadUpper = (prioridad || "").toUpperCase();
  const prioridadBg =
    prioridadUpper === "ALTA"
      ? "bg-[#C90A0A]"
      : prioridadUpper === "MEDIA"
      ? "bg-[#0C3DC2]"
      : "bg-[#e9b301]";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <style>
        {`
          @keyframes overlayFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          @keyframes modalPopIn {
            from { opacity: 0; transform: scale(0.94) translateY(16px); }
            to { opacity: 1; transform: scale(1) translateY(0); }
          }
        `}
      </style>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm animate-[overlayFadeIn_0.25s_ease-out]" />

      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[85vh] animate-[modalPopIn_0.35s_cubic-bezier(0.16,1,0.3,1)]">
        {/* BARRA SUPERIOR - mismo estilo que en tabulación */}
        <div className="bg-[#474b29] py-4 px-5 sm:px-6 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-md flex items-center justify-center shrink-0">
                <FaShieldAlt className="text-white" size={22} />
              </div>
              <div>
                <h2 className="text-[17px] font-bold uppercase tracking-wider leading-none">
                  ALERTA DESESTIMADA · REPORTE FINAL
                </h2>
                <p className="text-[11px] font-medium text-white/70 mt-1.5">
                  {codigo_alerta && (
                    <span>Código: {codigo_alerta}</span>
                  )}
                  {fecha_desestimo && (
                    <span className="ml-3">Desestimado: {formatFechaHora(fecha_desestimo)}</span>
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={generandoPDF}
              className="hover:bg-white/20 p-1.5 rounded-md transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FaTimes size={15} />
            </button>
          </div>
        </div>

        {/* CUERPO CON SCROLL */}
<div className="overflow-y-auto scroll-hover p-4 pr-3 bg-slate-50/60">
          {cargando ? (
            <FormularioDesestimadosSkeleton />
          ) : (
          <>
          {/* DATOS DE LA ALERTA */}
          <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_10px_10px_-8px_rgba(15,23,42,0.25)] flex flex-col h-full">
          <HeaderSection title="DATOS DE LA ALERTA" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="NOMBRE DEL CIUDADANO" value={ciudadano} />
              <Field label="CÉDULA" value={ci} />
              <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label="CELULAR" value={celular} />
                <Field label="LATITUD" value={latitudFinal} />
                <Field label="LONGITUD" value={longitudFinal} />
              </div>
              <div className="md:col-span-2">
                <div className="space-y-1">
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">RELATO DEL HECHO</label>
                  <div className="relative border border-slate-200 rounded-xl px-3.5 py-3 mt-1">
                    <textarea readOnly value={descripcion || "Sin descripción"}
                      className="block w-full h-10 text-[12px] font-medium tracking-wider text-slate-600 bg-transparent border-none focus:outline-none resize-y" />
                  </div>
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
          <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_10px_10px_-8px_rgba(15,23,42,0.25)] flex flex-col h-full mt-3.5">
            <HeaderSection title="INFORMACIÓN DE DESESTIMACIÓN" />
            <div className="grid grid-cols-1 gap-4">
              <Field label="MOTIVO" value={motivo_desestimo} />
              <Field label="FECHA DE DESESTIMACIÓN" value={formatFechaHora(fecha_desestimo)} />
              <div className="space-y-1">
                <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">JUSTIFICACIÓN ADICIONAL</label>
                <div className="relative border border-slate-200 rounded-xl px-3.5 py-3">
                  <textarea
                    readOnly
                    value={justificacion || "No especificada"}
                    className="block w-full h-10 text-[12px] font-medium tracking-wider text-slate-600 bg-transparent border-none focus:outline-none resize-y"
                  />
                </div>
              </div>
            </div>
          </section>

          {/* HISTORIAL DE PROCESO */}
          <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_10px_10px_-8px_rgba(15,23,42,0.25)] flex flex-col h-full mt-3.5">
            <HeaderSection title="HISTORIAL DE PROCESO" />
            <div className="flex items-start justify-center pt-2">
              <HistoryCard
                role="OPERADOR QUE DESESTIMÓ"
                name={nombre_operador_desestimo || "—"}
                icon={<FaUserCheck size={14} />}
                splitName={splitNameLines(nombre_operador_desestimo || "—")}
              />
            </div>
          </section>
          </>
          )}
        </div>

        {/* BOTONES */}
          <div className="flex justify-end gap-3.5 px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
  <button
    type="button"
    onClick={onClose}
    disabled={generandoPDF}
    className="px-4 py-3 rounded-lg font-medium text-[11.5px] border uppercase border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors tracking-wider"
  >
    CERRAR
  </button>
  {onGenerarPDF && (
    <button
      type="button"
      onClick={handleGenerarPDFClick}
      disabled={generandoPDF || cargando}
      className="px-8 py-3 rounded-lg font-medium text-[11.5px] bg-[#474b29] uppercase hover:bg-[#3a3e21] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed tracking-wider flex items-center justify-center gap-2"
    >
      {generandoPDF ? (
        <>
          <FaSpinner className="animate-spin" size={11} />
          <span>Generando...</span>
        </>
      ) : (
        <>
          <span>Generar PDF</span>
        </>
      )}
    </button>
  )}
</div>
      </div>
    </div>
  );
};

const HistoryCard = ({ role, name, icon, highlight, splitName }) => (
  <div className="flex-1 flex flex-col items-center min-w-[88px]">
    <div
      className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ring-4 ring-white shadow-sm transition-transform hover:scale-105 ${
        highlight ? "bg-[#474b29] text-white" : "bg-slate-100 text-slate-500"
      }`}
    >
      {icon}
    </div>
    <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider text-center">
      {role}
    </p>
    <div className="text-center mt-1">
      <p
        className={`text-[10px] font-medium uppercase tracking-wider leading-tight ${highlight ? "text-[#474b29]" : "text-slate-600"}`}
      >
        {splitName.first}
      </p>
      {splitName.last && (
        <p
          className={`text-[10px] font-medium uppercase tracking-wider leading-tight ${highlight ? "text-[#474b29]" : "text-slate-600"}`}
        >
          {splitName.last}
        </p>
      )}
    </div>
  </div>
);

export default FormularioDesestimados;
import React, { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaPhone,
  FaPlay,
  FaPause,
  FaExclamationTriangle,
  FaTimes,
  FaShieldAlt,
  FaCheckCircle,
  FaAddressCard,
} from "react-icons/fa";
import { contravenciones, delitos } from "../../constants/CategoriasDelitos";

const motivosDesestimo = [
  "Falsa alarma",
  "Información duplicada",
  "Prueba de sistema",
  "No requiere intervención policial",
  "Ya atendido por otra unidad",
  "Datos insuficientes",
  "Otro",
];

const DetalleEmergencia = ({
  alerta,
  onBack,
  onEnviarDespacho,
  onDesestimar,
}) => {
  const [playing, setPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [relatoEditado, setRelatoEditado] = useState(alerta?.relato || "");
  const [contravencion, setContravencion] = useState("");
  const [delito, setDelito] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [estadoValidacion, setEstadoValidacion] = useState("pendiente");
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [motivosSeleccionados, setMotivosSeleccionados] = useState([]);
  const audioInterval = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const toggleAudio = () => {
    if (!playing) {
      setPlaying(true);
      audioInterval.current = setInterval(() => {
        setAudioProgress((prev) =>
          prev >= 100
            ? (clearInterval(audioInterval.current), setPlaying(false), 0)
            : prev + 2
        );
      }, 200);
    } else {
      setPlaying(false);
      clearInterval(audioInterval.current);
    }
  };

  const handleValidar = () => {
    const clasificacion = contravencion || delito;
    if (!clasificacion || !prioridad) {
      alert(
        "Por favor, seleccione la clasificación y prioridad antes de validar la alerta"
      );
      return;
    }
    setEstadoValidacion("validado");
  };

  const abrirModalDesestimo = () => {
    setMotivosSeleccionados([]);
    setShowReasonModal(true);
  };

  const toggleMotivo = (motivo) => {
    setMotivosSeleccionados((prev) =>
      prev.includes(motivo)
        ? prev.filter((m) => m !== motivo)
        : [...prev, motivo]
    );
  };

  const confirmarDesestimo = () => {
    if (motivosSeleccionados.length === 0) {
      alert("Debe seleccionar al menos un motivo");
      return;
    }
    const motivoTexto = motivosSeleccionados.join(", ");
    if (onDesestimar) {
      onDesestimar(alerta?.id, motivoTexto);
    } else {
      onBack();
    }
    setShowReasonModal(false);
  };

  const handleEnviarDespacho = () => {
    const clasificacion = contravencion || delito;
    alert(
      `Alerta de emergencia transferida al centro de despacho.\nClasificación: ${clasificacion}\nPrioridad: ${prioridad}`
    );
    if (onEnviarDespacho) {
      onEnviarDespacho(alerta?.id);
    }
  };

  const data = {
    id: alerta?.id || "N/A",
    ciudadano: alerta?.ciudadano || "Usuario Desconocido",
    celular: alerta?.celular || "S/N",
    relato: alerta?.relato || "Sin relato adjunto",
    ci: alerta?.ci || "No registrada",
    ubicacion: alerta?.ubicacion || "Coordenadas no disponibles",
    ...alerta,
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onBack}
      />

      {/* Modal con tamaño fijo en ancho y altura mínima para igualar a DetalleAlerta */}
      <div className="relative w-full max-w-5xl min-h-[600px] max-h-[98vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Cabecera verde (estilo DetalleAlerta) */}
        <div className="bg-[#113e27] py-4 px-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <FaShieldAlt className="text-white/80" size={16} />
            <span className="text-sm font-extrabold uppercase tracking-wide">
              Detalle de Emergencia
            </span>
          </div>
          <button
            onClick={onBack}
            className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <FaTimes size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 md:p-6">
          <div className="-mt-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-5">
              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Datos del Ciudadano
                </h3>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-16 rounded-2xl bg-white flex items-center justify-center text-slate-200 shadow-sm border border-slate-50">
                      <FaUser size={32} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-base font-bold text-slate-600">
                        {data.ciudadano}
                      </h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-500">
                          <FaAddressCard className="text-slate-400" size={12} />
                          <span className="text-[11px] font-bold">
                            CI: {data.ci}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <FaPhone className="text-emerald-600" size={11} />
                          <span className="text-[11px] font-medium">
                            {data.celular}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Audio del Reporte
                </h3>
                <div className="bg-[#1a5336] rounded-xl p-4 flex items-center gap-4 shadow-md">
                  <button
                    onClick={toggleAudio}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1a5336]"
                  >
                    {playing ? (
                      <FaPause size={12} />
                    ) : (
                      <FaPlay size={12} className="ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex justify-between text-[9px] font-semibold text-white/60 mb-1.5 uppercase">
                      <span>
                        {playing ? "Reproduciendo..." : "Audio del ciudadano"}
                      </span>
                      <span>
                        {Math.floor((audioProgress / 100) * 120)}s / 120s
                      </span>
                    </div>
                    <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all"
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* Columna derecha */}
            <div className="space-y-5">
              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Relato del hecho (transcripción automática - editable)
                </h3>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 relative">
                  <FaExclamationTriangle
                    className="absolute -top-1.5 -left-1.5 text-green-900 bg-white rounded-md p-0.5 shadow-sm"
                    size={16}
                  />
                  <textarea
                    className="w-full p-2 text-[13px] font-medium text-slate-600 bg-transparent border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-200 focus:border-green-600"
                    rows="3"
                    value={relatoEditado}
                    onChange={(e) => setRelatoEditado(e.target.value)}
                    disabled={estadoValidacion === "validado"}
                  />
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Clasificación del Hecho
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <select
                      className={`w-full p-2.5 pr-8 bg-white border-2 border-slate-200 rounded-xl text-[12px] font-bold outline-none appearance-none tracking-wide duration-0 focus:border-green-600 focus:ring-1 focus:ring-green-200 ${
                        !contravencion ? "text-slate-500" : "text-slate-600"
                      }`}
                      value={contravencion}
                      onChange={(e) => {
                        setContravencion(e.target.value);
                        setDelito("");
                        setEstadoValidacion("pendiente");
                      }}
                      disabled={!!delito || estadoValidacion === "validado"}
                    >
                      <option value="" className="text-gray-400">
                        Seleccionar Contravención
                      </option>
                      {contravenciones.map((c) => (
                        <option
                          key={c}
                          value={c}
                          className="text-slate-700 text-[11px]"
                        >
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg
                        className="w-3 h-3 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>

                  <div className="relative">
                    <select
                      className={`w-full p-2.5 pr-8 bg-white border-2 border-slate-200 rounded-xl text-[12px] font-bold outline-none appearance-none tracking-wide duration-0 focus:border-green-600 focus:ring-1 focus:ring-green-200 ${
                        !delito ? "text-slate-500" : "text-slate-600"
                      }`}
                      value={delito}
                      onChange={(e) => {
                        setDelito(e.target.value);
                        setContravencion("");
                        setEstadoValidacion("pendiente");
                      }}
                      disabled={
                        !!contravencion || estadoValidacion === "validado"
                      }
                    >
                      <option value="" className="text-gray-400">
                        Seleccionar Delito
                      </option>
                      {delitos.map((d) => (
                        <option
                          key={d}
                          value={d}
                          className="text-slate-700 text-[11px]"
                        >
                          {d}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg
                        className="w-3 h-3 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Nivel de Prioridad
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {["ALTA", "MEDIA", "BAJA"].map((p) => (
                    <button
                      key={p}
                      disabled={estadoValidacion === "validado"}
                      onClick={() => {
                        setPrioridad(p);
                        setEstadoValidacion("pendiente");
                      }}
                      className={`py-2 rounded-xl border-2 font-bold text-[11px] tracking-wider transition-all ${
                        prioridad === p
                          ? p === "ALTA"
                            ? "bg-red-600 border-red-600 text-white"
                            : p === "MEDIA"
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-amber-500 border-amber-500 text-white"
                          : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Botones inferiores */}
        <div className="p-5 bg-slate-50 border-t flex flex-wrap md:flex-nowrap gap-3">
          <button
            onClick={abrirModalDesestimo}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-xl font-bold uppercase text-[11px] tracking-wider border-2 transition-all ${
              estadoValidacion === "validado"
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                : "bg-white text-orange-600 border-orange-500 hover:bg-orange-50"
            }`}
            disabled={estadoValidacion === "validado"}
          >
            Desestimar Reporte
          </button>

          <button
            onClick={handleValidar}
            className={`flex-1 py-1.5 rounded-xl font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-1.5 border-2 transition-all ${
              estadoValidacion === "validado"
                ? "bg-blue-600 border-blue-600 text-white shadow-md"
                : "bg-white border-blue-600 text-blue-600 hover:bg-blue-50"
            }`}
          >
            {estadoValidacion === "validado"
              ? "Alerta Validada"
              : "Validar Clasificación"}
          </button>

          <button
            onClick={handleEnviarDespacho}
            disabled={estadoValidacion !== "validado"}
            className={`flex-[1.5] py-3 rounded-xl font-bold uppercase text-[11px] tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all ${
              estadoValidacion !== "validado"
                ? "bg-gray-300 text-white cursor-not-allowed shadow-none"
                : "bg-emerald-900 text-white hover:bg-emerald-800"
            }`}
          >
            <FaCheckCircle size={12} /> Enviar a Despacho
          </button>
        </div>
      </div>

      {/* Modal de motivos múltiples para desestimar */}
      {showReasonModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-5">
            <h3 className="text-lg font-bold mb-3">Motivos de desestimación</h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {motivosDesestimo.map((motivo) => (
                <label key={motivo} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={motivosSeleccionados.includes(motivo)}
                    onChange={() => toggleMotivo(motivo)}
                  />
                  {motivo}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-3 mt-5">
              <button
                onClick={() => setShowReasonModal(false)}
                className="px-4 py-2 bg-gray-200 rounded-lg"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarDesestimo}
                className="px-4 py-2 bg-red-600 text-white rounded-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DetalleEmergencia;
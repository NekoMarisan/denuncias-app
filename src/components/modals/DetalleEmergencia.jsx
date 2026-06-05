import React, { useState, useEffect, useRef } from "react";
import {
  FaUser, FaPhone, FaPlay, FaPause, FaExclamationTriangle,
  FaTimes, FaShieldAlt, FaCheckCircle, FaAddressCard,
  FaSpinner, FaChevronDown
} from "react-icons/fa";
import { contravenciones, delitos } from "../../constants/CategoriasDelitos";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../services/supabase";

const motivosDesestimo = [
  "Falsa alarma",
  "Información duplicada",
  "Datos insuficientes",
  "Otro",
];

const DetalleEmergencia = ({ alerta, onBack, onEnviarDespacho, onDesestimar }) => {
  const { showToast } = useToast();

  const [datos, setDatos] = useState(null);
  const [ciudadano, setCiudadano] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [nombreEstado, setNombreEstado] = useState("");

  const [playing, setPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const audioRef = useRef(null);
  const audioInterval = useRef(null);

  const [relatoEditado, setRelatoEditado] = useState("");
  const [contravencion, setContravencion] = useState("");
  const [delito, setDelito] = useState("");
  const [prioridad, setPrioridad] = useState("");
  
  const [showDesestimoPanel, setShowDesestimoPanel] = useState(false);
  const [motivosSeleccionados, setMotivosSeleccionados] = useState([]);
  const [transcribiendoAudio, setTranscribiendoAudio] = useState(false);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  const obtenerNombreEstado = async (idEstado) => {
    if (!idEstado) return "EMERGENCIA";
    const { data, error } = await supabase
      .from("estado_alerta")
      .select("nombre_estado")
      .eq("id_estado", idEstado)
      .single();
    if (error) {
      console.error("Error obteniendo estado:", error);
      return "EMERGENCIA";
    }
    return data.nombre_estado;
  };

  useEffect(() => {
    if (!alerta?.id_alerta && !alerta?.id) return;

    const cargar = async () => {
      setCargando(true);
      const idAlerta = alerta?.id_alerta ?? alerta?.id;

      const { data: alertaData, error: alertaError } = await supabase
        .from("alerta")
        .select("*")
        .eq("id_alerta", idAlerta)
        .single();

      if (alertaError) {
        console.error("Error al cargar alerta:", alertaError);
        setCargando(false);
        return;
      }

      setDatos(alertaData);
      setRelatoEditado(alertaData.descripcion || "");
      setPrioridad(alertaData.prioridad || "");

      const estadoNombre = await obtenerNombreEstado(alertaData.id_estado_actual);
      let estadoMostrado = "EMERGENCIA";
      if (alertaData.categoria !== "Panico" && estadoNombre) {
        estadoMostrado = estadoNombre.toUpperCase();
      }
      setNombreEstado(estadoMostrado);

      if (alertaData.id_usuario) {
        const { data: ciudadanoData, error: ciudadanoError } = await supabase
          .from("usuario_ciudadano")
          .select("nombre_completo, ci, celular, selfie")
          .eq("id_usuario", alertaData.id_usuario)
          .single();

        if (!ciudadanoError) setCiudadano(ciudadanoData);
      }

      setCargando(false);
    };

    cargar();
  }, [alerta?.id_alerta, alerta?.id]);

  const toggleAudio = () => {
    if (datos?.audio_30s) {
      if (!audioRef.current) {
        audioRef.current = new Audio(datos.audio_30s);
        audioRef.current.addEventListener("loadedmetadata", () => {
          setAudioDuration(audioRef.current.duration);
        });
        audioRef.current.addEventListener("timeupdate", () => {
          const current = audioRef.current.currentTime;
          setAudioProgress((current / audioRef.current.duration) * 100);
          setAudioCurrentTime(current);
        });
        audioRef.current.addEventListener("ended", () => {
          setPlaying(false);
          setAudioProgress(0);
          setAudioCurrentTime(0);
        });
      }
      if (playing) {
        audioRef.current.pause();
        setPlaying(false);
      } else {
        audioRef.current.play();
        setPlaying(true);
      }
    } else {
      if (!playing) {
        setPlaying(true);
        setAudioDuration(30);
        const startTime = Date.now() - audioCurrentTime * 1000;
        audioInterval.current = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed >= 30) {
            clearInterval(audioInterval.current);
            setPlaying(false);
            setAudioProgress(0);
            setAudioCurrentTime(0);
          } else {
            setAudioCurrentTime(elapsed);
            setAudioProgress((elapsed / 30) * 100);
          }
        }, 200);
      } else {
        setPlaying(false);
        clearInterval(audioInterval.current);
      }
    }
  };

  const handleSeek = (e) => {
    const newTime = parseFloat(e.target.value);
    if (datos?.audio_30s && audioRef.current) {
      audioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);
      setAudioProgress((newTime / audioDuration) * 100);
    } else {
      if (audioInterval.current) {
        clearInterval(audioInterval.current);
      }
      setAudioCurrentTime(newTime);
      setAudioProgress((newTime / 30) * 100);
      if (playing) {
        const startTime = Date.now() - newTime * 1000;
        audioInterval.current = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed >= 30) {
            clearInterval(audioInterval.current);
            setPlaying(false);
            setAudioProgress(0);
            setAudioCurrentTime(0);
          } else {
            setAudioCurrentTime(elapsed);
            setAudioProgress((elapsed / 30) * 100);
          }
        }, 200);
      }
    }
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const transcribirAudio = async () => {
    if (!datos?.audio_30s) {
      showToast("No hay audio disponible para transcribir", "error");
      return;
    }

    setTranscribiendoAudio(true);
    try {
      const response = await fetch(datos.audio_30s);
      if (!response.ok) throw new Error(`HTTP ${response.status}: No se pudo descargar el audio`);
      const audioBlob = await response.blob();

      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.mp3");

      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: formData,
      });

      if (error) throw new Error(`Error en la función edge: ${error.message}`);
      if (!data?.texto) throw new Error("La respuesta no contiene texto transcrito");

      setRelatoEditado(data.texto);
      showToast("Audio transcrito correctamente", "success");
    } catch (err) {
      console.error("Error en transcripción:", err);
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setTranscribiendoAudio(false);
    }
  };

  const toggleMotivo = (motivo) => {
    setMotivosSeleccionados(prev =>
      prev.includes(motivo) ? prev.filter(m => m !== motivo) : [...prev, motivo]
    );
  };

  const confirmarDesestimo = () => {
    if (motivosSeleccionados.length === 0) {
      showToast("Debe seleccionar al menos un motivo para desestimar", "error");
      return;
    }
    const motivoTexto = motivosSeleccionados.join(", ");
    if (onDesestimar) onDesestimar(datos?.id_alerta, motivoTexto);
    else onBack();
    setShowDesestimoPanel(false);
  };

  const handleEnviarDespacho = () => {
    if (!contravencion && !delito) {
      showToast("Seleccione un Delito o Contravención", "error");
      return;
    }
    if (!prioridad) {
      showToast("Seleccione un nivel de prioridad (Alta, Media o Baja)", "error");
      return;
    }
    showToast(`Alerta ${datos?.codigo_alerta || datos?.id_alerta} enviada al despacho`, "success");
    if (onEnviarDespacho) onEnviarDespacho(datos?.id_alerta);
  };

  const formatoFechaHoraBolivia = (fechaISO) => {
    if (!fechaISO) return { fecha: "—", hora: "—" };
    const date = new Date(fechaISO);
    return {
      fecha: date.toLocaleDateString("es-BO", {
        day: "2-digit", month: "short", year: "numeric",
        timeZone: "America/La_Paz"
      }),
      hora: date.toLocaleTimeString("es-BO", {
        hour: "2-digit", minute: "2-digit",
        timeZone: "America/La_Paz"
      })
    };
  };
  const { fecha: fechaFormateada, hora: horaFormateada } = formatoFechaHoraBolivia(datos?.fecha_hora);

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <style>
        {`
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 0;
            height: 0;
            opacity: 0;
          }
          input[type="range"]::-moz-range-thumb {
            width: 0;
            height: 0;
            opacity: 0;
          }
        `}
      </style>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />

      {/* TARJETA PRINCIPAL */}
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[85vh]">

        {/* BARRA SUPERIOR VERDE */}
        <div className="bg-[#113e27] py-4 px-6 text-white w-full shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-md flex items-center justify-center shrink-0">
                <FaShieldAlt className="text-white" size={30} />
              </div>
              <div className="flex flex-col gap-1.5">
                <h2 className="text-[18px] font-extrabold uppercase tracking-wide leading-none mt-0.5">
                  Detalle de Emergencia
                </h2>
                <div className="flex flex-wrap gap-2 text-[10px] font-medium text-white/70 mt-0.5">
                  {datos?.codigo_alerta && (
                    <span>{datos.codigo_alerta}</span>
                  )}
                  <span>{fechaFormateada} - {horaFormateada}</span>
                </div>
              </div>
            </div>
            <button 
              type="button" 
              onClick={onBack} 
              className="hover:bg-white/20 p-1.5 rounded-md transition-colors shrink-0 mt-1"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {cargando ? (
          <div className="p-20 flex items-center justify-center">
            <FaSpinner className="animate-spin text-green-800 text-3xl" />
          </div>
        ) : (
          /* CONTENIDO DEL MODAL */
          <div className="overflow-y-auto p-6 bg-white">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
              
              {/* COLUMNA IZQUIERDA */}
              <div className="flex flex-col gap-5">
                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 leading-none">
                    Datos del Ciudadano
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-md">
                    <div className="flex gap-4">
                      {ciudadano?.selfie ? (
                        <img
                          src={ciudadano.selfie}
                          alt="Foto"
                          className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center text-slate-200 shadow-sm border border-slate-100 shrink-0">
                          <FaUser size={28} />
                        </div>
                      )}
                      <div className="flex-1 space-y-1">
                        <div className="font-bold text-slate-700 text-sm">
                          {ciudadano?.nombre_completo || "Usuario Desconocido"}
                        </div>
                        <div className="flex items-center gap-2 text-[12px]">
                          <FaAddressCard className="text-slate-400" size={12} />
                          <span className="font-medium text-slate-600">CI: {ciudadano?.ci || "—"}</span>
                        </div>
                        <div className="flex items-center gap-2 text-[12px]">
                          <FaPhone className="text-slate-400" size={12} />
                          <span className="font-medium text-slate-600">{ciudadano?.celular || "—"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 leading-none">
                    Audio del Reporte
                  </h3>
                  {datos?.audio_30s ? (
                    <div className="bg-[#113e27] rounded-xl p-4 flex flex-col gap-3 shadow-md">
                      <div className="flex items-center gap-4">
                        <button
                          type="button"
                          onClick={toggleAudio}
                          className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#113e27] shrink-0"
                        >
                          {playing ? <FaPause size={12} /> : <FaPlay size={12} className="ml-0.5" />}
                        </button>
                        <div className="flex-1">
                          <div className="flex justify-between text-[9px] font-semibold text-white/60 mt-1.5 uppercase">
                            <span>{playing ? "Reproduciendo..." : "Audio del ciudadano"}</span>
                            <span>{formatTime(audioCurrentTime)} / {formatTime(audioDuration)}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={audioDuration || 30}
                            step="0.01"
                            value={audioCurrentTime}
                            onChange={handleSeek}
                            className="w-full h-1 bg-white/20 rounded-lg appearance-none cursor-pointer accent-white"
                            style={{ background: `linear-gradient(to right, white 0%, white ${audioProgress}%, rgba(255,255,255,0.2) ${audioProgress}%, rgba(255,255,255,0.2) 100%)` }}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={transcribirAudio}
                          disabled={transcribiendoAudio}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white transition-all flex items-center gap-1 disabled:opacity-50"
                        >
                          {transcribiendoAudio ? <FaSpinner className="animate-spin" size={10} /> : "Transcribir"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-100 rounded-xl p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide shadow-md">
                      Sin audio adjunto
                    </div>
                  )}
                </section>

                <section className="flex flex-col flex-1">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 leading-none">
                    Descripción del hecho
                  </h3>
                  <div className="bg-slate-50 border border-slate-300 rounded-xl p-3 relative shadow-md flex-1 min-h-[110px]">
                    <div className="absolute top-4 left-3 text-[#195838] pointer-events-none">
                      <FaExclamationTriangle size={14} />
                    </div>
                    <textarea
                      className="w-full pl-7 pr-6 h-full text-[13px] font-medium text-slate-600 bg-transparent border-none focus:outline-none resize-none"
                      placeholder="Sin descripción del hecho..."
                      value={relatoEditado}
                      onChange={(e) => setRelatoEditado(e.target.value)}
                    />
                    {relatoEditado && (
                      <button
                        type="button"
                        onClick={() => setRelatoEditado("")}
                        className="absolute top-4 right-3 text-slate-400 hover:text-slate-600 transition-colors"
                        title="Limpiar texto"
                      >
                        <FaTimes size={12} />
                      </button>
                    )}
                  </div>
                </section>
              </div>

              {/* COLUMNA DERECHA */}
              <div className="flex flex-col gap-5 border-l border-slate-100 lg:pl-6">
                
                <div>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 leading-none text-left">
                    Estado Actual
                  </h3>
                  <div className="px-4 py-2 bg-[#C90A0A] text-white text-xs font-extrabold uppercase tracking-widest rounded-[8px] shadow-md text-center inline-flex items-center justify-center min-w-32">
                    {nombreEstado || "EMERGENCIA"}
                  </div>
                </div>

                <div className="w-full flex-1 flex flex-col">
                  {showDesestimoPanel ? (
                    /* VISTA B: PROTOCOLO DE ANULACIÓN REESTRUCTURADO */
                    <div className="bg-[#fff8f5] border border-[#fbeee9] rounded-xl p-4 shadow-md flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start gap-3 mb-3">
                          <FaExclamationTriangle className="text-[#b43c14] shrink-0 mt-0.5" size={16} />
                          <div>
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-[#b43c14]">
                              Protocolo de Cancelación de Emergencia
                            </h4>
                            <p className="text-[10px] text-[#b43c14]/90 font-medium mt-0.5 leading-relaxed">
                              Por seguridad y auditoría, seleccione el motivo oficial por el cual se desestimará esta alerta.
                            </p>
                          </div>
                        </div>

                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2">
                          Seleccione el motivo de desestimación
                        </div>

                        <div className="space-y-1.5">
                          {motivosDesestimo.map(motivo => {
                            const isChecked = motivosSeleccionados.includes(motivo);
                            return (
                              <label 
                                key={motivo} 
                                className={`flex items-center gap-3 p-2 rounded-xl border text-[11px] font-semibold cursor-pointer transition-all ${
                                  isChecked 
                                    ? "bg-white border-[#b43c14] text-[#b43c14] shadow-sm ring-1 ring-[#b43c14]/10" 
                                    : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  className="accent-[#b43c14] w-3.5 h-3.5 rounded shrink-0"
                                  checked={isChecked}
                                  onChange={() => toggleMotivo(motivo)}
                                />
                                <span className="truncate">{motivo}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* VISTA A: CLASIFICACIÓN Y PRIORIDAD */
                    <div className="space-y-5 flex-1 flex flex-col justify-start">
                      <section>
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 leading-none">
                          Clasificación del Hecho
                        </h3>
                        <div className="flex flex-col gap-3">
                          <div className="relative">
                            <select
                              className="w-full h-11 p-2.5 pr-8 bg-white border-2 border-slate-200 rounded-xl text-[12px] font-bold outline-none appearance-none focus:border-slate-300 transition-all text-slate-700"
                              value={contravencion}
                              onChange={(e) => { setContravencion(e.target.value); setDelito(""); }}
                              disabled={!!delito}
                            >
                              <option value="">Seleccionar Contravención</option>
                              {contravenciones.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                          </div>
                          <div className="relative">
                            <select
                              className="w-full h-11 p-2.5 pr-8 bg-white border-2 border-slate-200 rounded-xl text-[12px] font-bold outline-none appearance-none focus:border-slate-300 transition-all text-slate-700"
                              value={delito}
                              onChange={(e) => { setDelito(e.target.value); setContravencion(""); }}
                              disabled={!!contravencion}
                            >
                              <option value="">Seleccionar Delito</option>
                              {delitos.map(d => <option key={d} value={d}>{d}</option>)}
                            </select>
                            <FaChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={12} />
                          </div>
                        </div>
                      </section>

                      <section>
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 leading-none">
                          Nivel de Prioridad
                        </h3>
                        <div className="grid grid-cols-3 gap-1.5">
                          {["ALTA", "MEDIA", "BAJA"].map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPrioridad(p)}
                              className={`py-2.5 rounded-xl border-2 font-extrabold text-[10px] tracking-wider transition-all flex items-center justify-center shadow-sm ${
                                prioridad === p
                                  ? p === "ALTA" ? "bg-red-600 border-red-600 text-white shadow-md"
                                    : p === "MEDIA" ? "bg-blue-600 border-blue-600 text-white shadow-md"
                                    : "bg-amber-500 border-amber-500 text-white shadow-md"
                                  : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                              }`}
                            >
                              {p}
                            </button>
                          ))}
                        </div>
                      </section>
                    </div>
                  )}
                </div>

              </div>

            </div>
          </div>
        )}

        {/* BARRA DE BOTONES SUPER PEGADA AL CONTENIDO */}
        <div className="p-4 bg-slate-50 border-t flex gap-3 w-full shrink-0">
          <button
            type="button"
            onClick={() => {
              setMotivosSeleccionados([]);
              setShowDesestimoPanel(!showDesestimoPanel);
            }}
            className={`w-2/5 py-3.5 px-2 rounded-xl font-bold uppercase text-[11px] tracking-wider border-2 transition-all shadow-sm ${
              showDesestimoPanel 
                ? "bg-[#b43c14] text-white border-[#b43c14] shadow-md" 
                : "bg-white text-[#b43c14] border-[#b43c14] hover:bg-[#fff8f5]"
            }`}
          >
            {showDesestimoPanel ? "Volver al Detalle" : "Desestimar Reporte"}
          </button>
          
          <button
            type="button"
            onClick={showDesestimoPanel ? confirmarDesestimo : handleEnviarDespacho}
            disabled={cargando || (showDesestimoPanel && motivosSeleccionados.length === 0)}
            className={`w-3/5 py-3.5 px-4 rounded-xl font-bold uppercase text-[11px] tracking-wider shadow-md flex items-center justify-center gap-2 transition-all ${
              showDesestimoPanel 
                ? "bg-[#b43c14] hover:bg-[#9a320f] text-white disabled:opacity-40" 
                : "bg-[#113e27] hover:bg-[#15472d] text-white disabled:opacity-40"
            }`}
          >
            <FaCheckCircle size={12} /> {showDesestimoPanel ? "Confirmar Anulación" : "Enviar a Despacho"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DetalleEmergencia;
// arreglar desestimado
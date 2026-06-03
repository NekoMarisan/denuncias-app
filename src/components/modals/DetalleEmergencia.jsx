import React, { useState, useEffect, useRef } from "react";
import {
  FaUser, FaPhone, FaPlay, FaPause, FaExclamationTriangle,
  FaTimes, FaShieldAlt, FaCheckCircle, FaAddressCard,
  FaMapMarkerAlt, FaCalendarAlt, FaSpinner, FaTag
} from "react-icons/fa";
import { contravenciones, delitos } from "../../constants/CategoriasDelitos";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../services/supabase";

const motivosDesestimo = [
  "Falsa alarma",
  "Información duplicada",
  "Prueba de sistema",
  "No requiere intervención policial",
  "Ya atendido por otra unidad",
  "Datos insuficientes",
  "Otro",
];

const DetalleEmergencia = ({ alerta, onBack, onEnviarDespacho, onDesestimar }) => {
  const { showToast } = useToast();

  const [datos, setDatos]                       = useState(null);
  const [ciudadano, setCiudadano]               = useState(null);
  const [cargando, setCargando]                 = useState(true);

  const [playing, setPlaying]                   = useState(false);
  const [audioProgress, setAudioProgress]       = useState(0);
  const audioRef                                = useRef(null);
  const audioInterval                           = useRef(null);

  const [relatoEditado, setRelatoEditado]       = useState("");
  const [contravencion, setContravencion]       = useState("");
  const [delito, setDelito]                     = useState("");
  const [prioridad, setPrioridad]               = useState("");
  const [showReasonModal, setShowReasonModal]   = useState(false);
  const [motivosSeleccionados, setMotivosSeleccionados] = useState([]);

  // Nuevo estado para controlar la transcripción
  const [transcribiendoAudio, setTranscribiendoAudio] = useState(false);

  // ── Bloquear scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  // ── Cargar alerta + ciudadano desde Supabase ───────────────────────────────
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

      if (alertaData.id_usuario) {
        const { data: ciudadanoData, error: ciudadanoError } = await supabase
          .from("usuario_ciudadano")
          .select("nombre_completo, ci, celular, email, selfie")
          .eq("id_usuario", alertaData.id_usuario)
          .single();

        if (!ciudadanoError) setCiudadano(ciudadanoData);
      }

      setCargando(false);
    };

    cargar();
  }, [alerta?.id_alerta, alerta?.id]);

  // ── Audio (reproducción real o simulada) ──────────────────────────────────
  const toggleAudio = () => {
    if (datos?.audio_30s) {
      if (!audioRef.current) {
        audioRef.current = new Audio(datos.audio_30s);
        audioRef.current.addEventListener("timeupdate", () => {
          const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setAudioProgress(isNaN(pct) ? 0 : pct);
        });
        audioRef.current.addEventListener("ended", () => {
          setPlaying(false);
          setAudioProgress(0);
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
        audioInterval.current = setInterval(() => {
          setAudioProgress(prev => {
            if (prev >= 100) {
              clearInterval(audioInterval.current);
              setPlaying(false);
              return 0;
            }
            return prev + 2;
          });
        }, 200);
      } else {
        setPlaying(false);
        clearInterval(audioInterval.current);
      }
    }
  };

  // ── Transcripción del audio usando Edge Function de Supabase ───────────────
  const transcribirAudio = async () => {
    if (!datos?.audio_30s) {
      showToast("No hay audio disponible para transcribir", "error");
      return;
    }

    setTranscribiendoAudio(true);
    try {
      // 1. Descargar el archivo de audio desde la URL pública
      const response = await fetch(datos.audio_30s);
      if (!response.ok) throw new Error("No se pudo descargar el audio");
      const audioBlob = await response.blob();

      // 2. Preparar FormData para enviar a la Edge Function
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.mp3");

      // 3. Llamar a la Edge Function "transcribe-audio"
      const { data, error } = await supabase.functions.invoke("transcribe-audio", {
        body: formData,
      });

      if (error) throw new Error(error.message);
      if (!data?.texto) throw new Error("No se recibió transcripción");

      // 4. Actualizar el campo de relato con el texto transcrito
      setRelatoEditado(prev => {
        // Opcional: concatenar si ya había texto
        // return prev ? `${prev}\n\n[Transcripción]: ${data.texto}` : data.texto;
        return data.texto; // Reemplaza completamente
      });

      showToast("Audio transcrito correctamente", "success");
    } catch (err) {
      console.error("Error en transcripción:", err);
      showToast("Error al transcribir el audio", "error");
    } finally {
      setTranscribiendoAudio(false);
    }
  };

  // ── Desestimar ─────────────────────────────────────────────────────────────
  const abrirModalDesestimo = () => {
    setMotivosSeleccionados([]);
    setShowReasonModal(true);
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
    setShowReasonModal(false);
  };

  // ── Enviar a despacho ──────────────────────────────────────────────────────
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

  // ── Fecha formateada ───────────────────────────────────────────────────────
  const fechaFormateada = datos?.fecha_hora
    ? new Date(datos.fecha_hora).toLocaleString("es-ES", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      })
    : "—";

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-5xl min-h-[600px] max-h-[98vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Cabecera */}
        <div className="bg-[#113e27] py-4 px-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="text-white/80" size={16} />
            <span className="text-sm font-extrabold uppercase tracking-wide">Detalle de Emergencia</span>
            {datos?.codigo_alerta && (
              <span className="px-2 py-0.5 bg-white/10 rounded-lg text-[10px] font-black tracking-widest">
                {datos.codigo_alerta}
              </span>
            )}
          </div>
          <button type="button" onClick={onBack} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <FaTimes size={16} />
          </button>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div className="flex-1 flex items-center justify-center">
            <FaSpinner className="animate-spin text-green-800 text-3xl" />
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-5 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* ── Columna izquierda ── */}
              <div className="space-y-5">

                {/* Datos del ciudadano */}
                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Datos del Ciudadano
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
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
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <h4 className="text-sm font-bold text-slate-700 truncate">
                        {ciudadano?.nombre_completo || "Usuario Desconocido"}
                      </h4>
                      <div className="flex items-center gap-2 text-slate-500">
                        <FaAddressCard className="text-slate-400 shrink-0" size={11} />
                        <span className="text-[11px] font-bold">CI: {ciudadano?.ci || "—"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <FaPhone className="text-emerald-600 shrink-0" size={11} />
                        <span className="text-[11px] font-medium">{ciudadano?.celular || "—"}</span>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Ubicación y fecha */}
                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Ubicación y Fecha
                  </h3>
                  <div className="grid grid-cols-1 gap-2">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <FaMapMarkerAlt className="text-red-500 mt-0.5 shrink-0" size={13} />
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Coordenadas / Dirección</p>
                        <p className="text-[11px] font-bold text-slate-700 break-all">{datos?.ubicacion || "No disponible"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <FaCalendarAlt className="text-purple-500 shrink-0" size={13} />
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Fecha y Hora</p>
                        <p className="text-[11px] font-bold text-slate-700">{fechaFormateada}</p>
                      </div>
                    </div>
                    {datos?.categoria && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <FaTag className="text-blue-500 shrink-0" size={13} />
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Categoría</p>
                          <p className="text-[11px] font-bold text-slate-700">{datos.categoria}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </section>

                {/* Audio con botón de transcripción */}
                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Audio del Reporte
                  </h3>
                  {datos?.audio_30s ? (
                    <div className="bg-[#1a5336] rounded-xl p-4 flex items-center gap-4 shadow-md">
                      <button
                        type="button"
                        onClick={toggleAudio}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1a5336] shrink-0"
                      >
                        {playing ? <FaPause size={12} /> : <FaPlay size={12} className="ml-0.5" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex justify-between text-[9px] font-semibold text-white/60 mb-1.5 uppercase">
                          <span>{playing ? "Reproduciendo..." : "Audio del ciudadano"}</span>
                        </div>
                        <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                          <div className="h-full bg-white transition-all" style={{ width: `${audioProgress}%` }} />
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={transcribirAudio}
                        disabled={transcribiendoAudio}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-[10px] font-bold uppercase tracking-wider text-white transition-all flex items-center gap-1 disabled:opacity-50"
                      >
                        {transcribiendoAudio ? (
                          <FaSpinner className="animate-spin" size={10} />
                        ) : (
                          "🎤 Transcribir audio"
                        )}
                      </button>
                    </div>
                  ) : (
                    <div className="bg-slate-100 rounded-xl p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Sin audio adjunto
                    </div>
                  )}
                </section>

                {/* Relato */}
                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Descripción del hecho (editable)
                  </h3>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 relative">
                    <FaExclamationTriangle className="absolute -top-1.5 -left-1.5 text-green-900 bg-white rounded-md p-0.5 shadow-sm" size={16} />
                    <textarea
                      className="w-full p-2 text-[13px] font-medium text-slate-600 bg-transparent border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-green-200 focus:border-green-600 resize-none"
                      rows="3"
                      value={relatoEditado}
                      onChange={(e) => setRelatoEditado(e.target.value)}
                    />
                  </div>
                </section>
              </div>

              {/* ── Columna derecha ── */}
              <div className="space-y-5">

                {/* Clasificación */}
                <section className="space-y-3">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Clasificación del Hecho
                  </h3>
                  <div className="flex flex-col gap-2">
                    <select
                      className={`w-full p-2.5 bg-white border-2 border-slate-200 rounded-xl text-[12px] font-bold outline-none appearance-none ${!contravencion ? "text-slate-400" : "text-slate-700"}`}
                      value={contravencion}
                      onChange={(e) => { setContravencion(e.target.value); setDelito(""); }}
                      disabled={!!delito}
                    >
                      <option value="">Seleccionar Contravención</option>
                      {contravenciones.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <select
                      className={`w-full p-2.5 bg-white border-2 border-slate-200 rounded-xl text-[12px] font-bold outline-none appearance-none ${!delito ? "text-slate-400" : "text-slate-700"}`}
                      value={delito}
                      onChange={(e) => { setDelito(e.target.value); setContravencion(""); }}
                      disabled={!!contravencion}
                    >
                      <option value="">Seleccionar Delito</option>
                      {delitos.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                </section>

                {/* Prioridad */}
                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Nivel de Prioridad
                  </h3>
                  <div className="grid grid-cols-3 gap-3">
                    {["ALTA", "MEDIA", "BAJA"].map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPrioridad(p)}
                        className={`py-2 rounded-xl border-2 font-bold text-[11px] tracking-wider transition-all ${
                          prioridad === p
                            ? p === "ALTA" ? "bg-red-600 border-red-600 text-white"
                              : p === "MEDIA" ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-amber-500 border-amber-500 text-white"
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Info extra de la alerta */}
                {(datos?.id_estado_actual || datos?.codigo_alerta) && (
                  <section>
                    <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                      Info del Sistema
                    </h3>
                    <div className="grid grid-cols-2 gap-2">
                      {datos?.codigo_alerta && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Código</p>
                          <p className="text-[11px] font-black text-slate-700">{datos.codigo_alerta}</p>
                        </div>
                      )}
                      {datos?.id_estado_actual && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[8px] font-black text-slate-400 uppercase">Estado ID</p>
                          <p className="text-[11px] font-black text-slate-700">{datos.id_estado_actual}</p>
                        </div>
                      )}
                    </div>
                  </section>
                )}

              </div>
            </div>
          </div>
        )}

        {/* Botones de acción */}
        <div className="p-5 bg-slate-50 border-t flex flex-wrap md:flex-nowrap gap-3">
          <button
            type="button"
            onClick={abrirModalDesestimo}
            className="flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl font-bold uppercase text-[11px] tracking-wider border-2 bg-white text-orange-600 border-orange-500 hover:bg-orange-50 transition-all"
          >
            Desestimar Reporte
          </button>
          <button
            type="button"
            onClick={handleEnviarDespacho}
            disabled={cargando}
            className="flex-1 py-3 bg-emerald-900 text-white hover:bg-emerald-800 rounded-xl font-bold uppercase text-[11px] tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <FaCheckCircle size={12} /> Enviar a Despacho
          </button>
        </div>
      </div>

      {/* Modal desestimar */}
      {showReasonModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-xl max-w-md w-full p-5 shadow-2xl">
            <h3 className="text-base font-black uppercase tracking-tight text-slate-800 mb-4">
              Motivos de desestimación
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {motivosDesestimo.map(motivo => (
                <label key={motivo} className="flex items-center gap-3 text-sm font-medium text-slate-600 cursor-pointer hover:text-slate-800 transition-colors">
                  <input
                    type="checkbox"
                    className="accent-red-600 w-4 h-4"
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
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-[11px] font-black uppercase transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarDesestimo}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-black uppercase transition-all"
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
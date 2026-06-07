import React, { useState, useEffect, useRef } from "react";
import {
  FaUser, FaPhone, FaPlay, FaPause, FaFileImage, FaVideo,
  FaFilePdf, FaExclamationTriangle, FaTimes, FaShieldAlt,
  FaCheckCircle, FaFile, FaAddressCard, FaEye,
  FaSpinner, FaChevronDown
} from "react-icons/fa";
import { contravenciones, delitos } from "../../constants/CategoriasDelitos";
import { supabase } from "../../services/supabase";
import { useToast } from "../../context/ToastContext";

const motivosDesestimo = [
  "Falsa alarma",
  "Información duplicada",
  "Datos insuficientes",
  "Otro",
];

const DetalleAlerta = ({ alerta, onBack, onEnviarDespacho, onDesestimar }) => {
  const { showToast } = useToast();

  const [datos, setDatos] = useState(null);
  const [ciudadano, setCiudadano] = useState(null);
  const [evidencias, setEvidencias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [evidenciasVistas, setEvidenciasVistas] = useState([]);

  const [playing, setPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [audioCurrentTime, setAudioCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(60);
  const audioRef = useRef(null);
  const audioInterval = useRef(null);

  const [relatoEditado, setRelatoEditado] = useState("");
  const [contravencion, setContravencion] = useState("");
  const [delito, setDelito] = useState("");
  const [prioridad, setPrioridad] = useState("");

  const [estadoValidacion, setEstadoValidacion] = useState("verificacion");

  // ── Desestimación ───────────────────────────────────────────
  const [showDesestimoPanel, setShowDesestimoPanel] = useState(false);
  const [motivosSeleccionados, setMotivosSeleccionados] = useState([]);

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
  // ──────────────────────────────────────────────────────────

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
      if (audioInterval.current) clearInterval(audioInterval.current);
    };
  }, []);

  useEffect(() => {
    const idAlerta = alerta?.id_alerta ?? alerta?.id;
    if (!idAlerta) return;

    const cargar = async () => {
      setCargando(true);
      try {
        const { data: alertaData, error: alertaErr } = await supabase
          .from("alerta").select("*").eq("id_alerta", idAlerta).single();

        if (alertaErr) { console.error("Error alerta:", alertaErr); setCargando(false); return; }
        setDatos(alertaData);
        setRelatoEditado(alertaData.descripcion || "");
        setPrioridad(alertaData.prioridad || "");

        if (alertaData.id_usuario) {
          const { data: ciudadanoData } = await supabase
            .from("usuario_ciudadano")
            .select("nombre_completo, ci, celular, email, selfie")
            .eq("id_usuario", alertaData.id_usuario).single();
          if (ciudadanoData) setCiudadano(ciudadanoData);
        }

        const { data: evidenciaData } = await supabase
          .from("evidencia").select("*").eq("id_alerta", idAlerta);
        setEvidencias(evidenciaData || []);
      } catch (err) {
        console.error("Error crítico:", err);
      } finally {
        setCargando(false);
      }
    };
    cargar();
  }, [alerta?.id_alerta, alerta?.id]);

  const getFileInfo = (tipoEvidencia, archivo) => {
    const tipo = tipoEvidencia?.toLowerCase() || "";
    const ext  = archivo?.split(".").pop().toLowerCase() || "";
    if (tipo === "imagen" || ["jpg","jpeg","png","webp"].includes(ext))
      return { icon: <FaFileImage size={16} />, color: "text-blue-500", bg: "bg-blue-50", label: "IMAGEN" };
    if (tipo === "video"  || ["mp4","mov","avi"].includes(ext))
      return { icon: <FaVideo size={16} />,     color: "text-rose-500", bg: "bg-rose-50",  label: "VIDEO"  };
    if (tipo === "pdf"    || ext === "pdf")
      return { icon: <FaFilePdf size={16} />,   color: "text-amber-500", bg: "bg-amber-50", label: "PDF"   };
    return     { icon: <FaFile size={16} />,    color: "text-slate-400", bg: "bg-slate-50", label: "ARCHIVO" };
  };

  const registrarVistaEvidencia = (id) => {
    if (!evidenciasVistas.includes(id)) setEvidenciasVistas(prev => [...prev, id]);
  };

  const fechaFormateada = datos?.fecha_hora
    ? new Date(datos.fecha_hora).toLocaleString("es-ES", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      })
    : "—";

  const toggleAudio = () => {
    if (datos?.audio_30s) {
      if (!audioRef.current) {
        audioRef.current = new Audio(datos.audio_30s);
        audioRef.current.addEventListener("loadedmetadata", () => setAudioDuration(audioRef.current.duration));
        audioRef.current.addEventListener("timeupdate", () => {
          const current = audioRef.current.currentTime;
          setAudioProgress((current / audioRef.current.duration) * 100);
          setAudioCurrentTime(current);
        });
        audioRef.current.addEventListener("ended", () => {
          setPlaying(false); setAudioProgress(0); setAudioCurrentTime(0);
        });
      }
      if (playing) { audioRef.current.pause(); setPlaying(false); }
      else          { audioRef.current.play();  setPlaying(true);  }
    } else {
      if (audioInterval.current) clearInterval(audioInterval.current);
      if (!playing) {
        setPlaying(true);
        const totalDuration = audioDuration || 60;
        const startTime = Date.now() - audioCurrentTime * 1000;
        audioInterval.current = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed >= totalDuration) {
            clearInterval(audioInterval.current);
            setPlaying(false); setAudioProgress(0); setAudioCurrentTime(0);
          } else {
            setAudioCurrentTime(elapsed);
            setAudioProgress((elapsed / totalDuration) * 100);
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
    const totalDuration = audioDuration || 60;
    if (datos?.audio_30s && audioRef.current) {
      audioRef.current.currentTime = newTime;
      setAudioCurrentTime(newTime);
      setAudioProgress((newTime / audioDuration) * 100);
    } else {
      if (audioInterval.current) clearInterval(audioInterval.current);
      setAudioCurrentTime(newTime);
      setAudioProgress((newTime / totalDuration) * 100);
      if (playing) {
        const startTime = Date.now() - newTime * 1000;
        audioInterval.current = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          if (elapsed >= totalDuration) {
            clearInterval(audioInterval.current);
            setPlaying(false); setAudioProgress(0); setAudioCurrentTime(0);
          } else {
            setAudioCurrentTime(elapsed);
            setAudioProgress((elapsed / totalDuration) * 100);
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

  // ✅ CORREGIDO: Envía objeto con clasificacion, esContravencion y prioridad
  const handleEnviarDespachoLocal = () => {
    if (!contravencion && !delito) {
      if (showToast) showToast("Seleccione un Delito o Contravención antes de enviar", "error");
      return;
    }
    if (!prioridad) {
      if (showToast) showToast("Seleccione un nivel de prioridad antes de enviar", "error");
      return;
    }
    if (onEnviarDespacho) {
      onEnviarDespacho(
        datos?.id_alerta ?? alerta?.id,
        {
          clasificacion: contravencion || delito,
          esContravencion: !!contravencion,
          prioridad: prioridad
        }
      );
    }
    if (showToast) showToast(`Alerta ${datos?.codigo_alerta || datos?.id_alerta} enviada al despacho`, "success");
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <style>{`
        input[type="range"]::-webkit-slider-thumb { -webkit-appearance:none; appearance:none; width:0; height:0; opacity:0; }
        input[type="range"]::-moz-range-thumb { width:0; height:0; opacity:0; }
      `}</style>
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onBack} />

      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[90vh]">

        {/* BARRA SUPERIOR */}
        <div className="bg-[#113e27] py-4 px-6 text-white w-full shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-md flex items-center justify-center shrink-0">
                <FaShieldAlt className="text-white" size={30} />
              </div>
              <div className="flex flex-col gap-1.5">
                <h2 className="text-[18px] font-extrabold uppercase tracking-wide leading-none mt-0.5">Detalle de Alerta</h2>
                <div className="flex flex-wrap gap-2 text-[10px] font-medium text-white/70 mt-0.5">
                  {datos?.codigo_alerta && <span>{datos.codigo_alerta}</span>}
                  <span>{fechaFormateada}</span>
                </div>
              </div>
            </div>
            <button type="button" onClick={onBack} className="hover:bg-white/20 p-1.5 rounded-md transition-colors shrink-0 mt-1">
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {cargando ? (
          <div className="p-20 flex items-center justify-center">
            <FaSpinner className="animate-spin text-green-800 text-3xl" />
          </div>
        ) : (
          <div className="p-6 bg-white overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">

              {/* ── COLUMNA IZQUIERDA ── */}
              <div className="flex flex-col gap-5 h-full">

                {/* Ciudadano */}
                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 leading-none">
                    Datos del Ciudadano
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 shadow-md">
                    <div className="flex gap-4">
                      {ciudadano?.selfie ? (
                        <img src={ciudadano.selfie} alt="Foto" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center text-slate-200 shadow-sm border border-slate-100 shrink-0">
                          <FaUser size={28} />
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="font-bold text-slate-700 text-[16px] capitalize">
                          {ciudadano?.nombre_completo ? ciudadano.nombre_completo.toLowerCase() : "Usuario Desconocido"}
                        </div>
                        <div className="mt-1 space-y-1">
                          <div className="flex items-center gap-2 text-[11px]">
                            <FaAddressCard className="text-slate-400" size={12} />
                            <span className="font-medium text-slate-600">CI: {ciudadano?.ci || "—"}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px]">
                            <FaPhone className="text-green-700" size={12} />
                            <span className="font-medium text-slate-600">{ciudadano?.celular || "—"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* Evidencia */}
                <section className="flex flex-col flex-1 min-h-0">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 leading-none flex items-center gap-1 shrink-0">
                    Evidencia Adjunta
                    {evidencias.length > 0 && (
                      <span className="text-gray-400 text-[11px] font-black tracking-wider shrink-0">
                        ({evidencias.length})
                      </span>
                    )}
                  </h3>
                  {evidencias.length > 0 ? (
                    <div className="flex flex-col flex-1 gap-5">
                      {evidencias.map((ev) => {
                        const info = getFileInfo(ev.tipo_evidencia, ev.archivo);
                        const nombreArchivo = ev.archivo?.split("/").pop() || ev.archivo || "archivo";
                        const yaVisto = evidenciasVistas.includes(ev.id_evidencia);
                        return (
                          <div
                            key={ev.id_evidencia}
                            className={`flex items-center justify-between px-3 rounded-xl transition-all border shadow-sm flex-1 ${
                              yaVisto ? "border-[#195c39] bg-emerald-50/30" : "border-slate-200 bg-slate-50 hover:shadow-md"
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1 py-3">
                              <div className={`w-9 h-9 rounded-md flex items-center justify-center shrink-0 ${info.bg} ${info.color}`}>
                                {info.icon}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-bold text-slate-700 uppercase truncate" title={nombreArchivo}>
                                  {nombreArchivo}
                                </p>
                                <p className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">{info.label}</p>
                              </div>
                            </div>
                            {ev.archivo && (
                              <div className="flex items-center gap-1.5 ml-4 shrink-0">
                                <a
                                  href={ev.archivo}
                                  target="_blank"
                                  rel="noreferrer"
                                  onClick={() => registrarVistaEvidencia(ev.id_evidencia)}
                                  className="flex items-center gap-1 text-[10px] font-bold text-white bg-[#113e27] hover:bg-[#113e27] px-3 py-1.5 rounded-md shadow-sm transition-colors cursor-pointer"
                                >
                                  <FaEye size={11} /> Ver
                                </a>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="flex-1 bg-slate-50 rounded-xl p-4 flex items-center justify-center text-[10px] font-bold text-slate-400 uppercase tracking-wide shadow-sm border border-slate-200">
                      No se adjuntaron archivos.
                    </div>
                  )}
                </section>

              </div>

              {/* ── COLUMNA DERECHA ── */}
              <div className="flex flex-col gap-5 border-l border-slate-100 lg:pl-6">

                {/* Estado de Validación */}
                <div>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 leading-none">
                    Estado de Validación
                  </h3>
                  <div className={`px-4 py-2 text-white text-xs font-extrabold uppercase tracking-widest rounded-[8px] shadow-md text-center inline-flex items-center justify-center min-w-32 ${
                    estadoValidacion === "validado"
                      ? "bg-green-700"
                      : estadoValidacion === "verificacion"
                        ? "bg-[#EAB308] text-slate-900"
                        : "bg-[#C90A0A]"
                  }`}>
                    {estadoValidacion === "validado" ? "VALIDADO" : estadoValidacion === "verificacion" ? "VERIFICACIÓN" : "PENDIENTE"}
                  </div>
                </div>

                {/* Audio */}
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
                          <div className="flex justify-between text-[9px] font-semibold text-white/60 mb-1.5 uppercase">
                            <span>{playing ? "Reproduciendo..." : "Audio del ciudadano"}</span>
                            <span>{formatTime(audioCurrentTime)} / {formatTime(audioDuration || 60)}</span>
                          </div>
                          <input
                            type="range"
                            min="0"
                            max={audioDuration || 60}
                            step="0.01"
                            value={audioCurrentTime}
                            onChange={handleSeek}
                            className="w-full h-1 rounded-lg appearance-none cursor-pointer"
                            style={{ background: `linear-gradient(to right, white 0%, white ${audioProgress}%, rgba(255,255,255,0.2) ${audioProgress}%, rgba(255,255,255,0.2) 100%)` }}
                          />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-100 rounded-xl p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide shadow-md">
                      Sin audio adjunto
                    </div>
                  )}
                </section>

                {/* Descripción */}
                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 leading-none">
                    Descripción del hecho
                  </h3>
                  <div className="bg-white border border-slate-200 rounded-xl p-3 relative transition-all shadow-md">
                    <div className="absolute top-4 left-3 text-[#113e27] pointer-events-none">
                      <FaExclamationTriangle size={14} />
                    </div>
                    <textarea
                      className="w-full pl-7 pr-8 text-[13px] font-medium text-slate-600 bg-transparent border-none focus:outline-none resize-y min-h-[65px] max-h-[180px] overflow-y-auto"
                      placeholder="Sin descripción del hecho..."
                      value={relatoEditado}
                      onChange={(e) => setRelatoEditado(e.target.value)}
                    />
                    {relatoEditado && (
                      <div className="absolute top-3.5 right-3">
                        <button type="button" onClick={() => setRelatoEditado("")} className="text-slate-400 hover:text-slate-600 transition-colors">
                          <FaTimes size={12} />
                        </button>
                      </div>
                    )}
                  </div>
                </section>

                {/* Clasificación y Prioridad / Panel Desestimación */}
                <div className="w-full flex-1 flex flex-col">
                  {showDesestimoPanel ? (
                    <section className="flex flex-col flex-1">
                      <div className="mb-2.5">
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 leading-none">
                          Desestimación de Alerta
                        </h3>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 shadow-md flex-1 flex flex-col justify-between">
                        <div>
                          <div className="border-l-4 border-[#C13100] pl-2 text-[11px] font-black text-slate-400 uppercase tracking-wider mb-2.5">
                            Seleccione el motivo
                          </div>
                          <div className="space-y-1.5">
                            {motivosDesestimo.map(motivo => {
                              const isChecked = motivosSeleccionados.includes(motivo);
                              return (
                                <label
                                  key={motivo}
                                  className={`flex items-center gap-3 p-2.5 rounded-md border text-[11px] font-semibold cursor-pointer transition-all ${
                                    isChecked
                                      ? "bg-white border-slate-300 text-slate-700 shadow-sm font-bold"
                                      : "text-slate-600 hover:bg-white hover:border-white"
                                  }`}
                                >
                                  <input
                                    type="checkbox"
                                    className="accent-[#C13100] w-3.5 h-3.5 rounded shrink-0 cursor-pointer"
                                    checked={isChecked}
                                    onChange={() => {
                                      if (isChecked) {
                                        toggleMotivo(motivo);
                                      } else {
                                        motivosSeleccionados.forEach(m => toggleMotivo(m));
                                        toggleMotivo(motivo);
                                      }
                                    }}
                                  />
                                  <span className="truncate">{motivo}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                        <p className="-mb-1 mt-3 text-[11px] text-slate-400 font-medium leading-relaxed">
                          Por seguridad y auditoría, seleccione el motivo oficial por el cual se desestimará esta alerta.
                        </p>
                      </div>
                    </section>
                  ) : (
                    <div className="space-y-5 flex-1 flex flex-col">
                      <section>
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 leading-none">
                          Clasificación del Hecho
                        </h3>
                        <div className="flex flex-col gap-4 mt-2">
                          <div className="relative">
                            <select
                              className="w-full h-12 p-2.5 pr-8 bg-white border-2 border-slate-200 rounded-xl text-[12px] font-bold outline-none appearance-none focus:border-slate-300 transition-all text-slate-700"
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
                              className="w-full h-12 p-2.5 pr-8 bg-white border-2 border-slate-200 rounded-xl text-[12px] font-bold outline-none appearance-none focus:border-slate-300 transition-all text-slate-700"
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
                        <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2.5 leading-none mt-1">
                          Nivel de Prioridad
                        </h3>
                        <div className="grid grid-cols-3 gap-4 mt-2">
                          {["ALTA", "MEDIA", "BAJA"].map(p => (
                            <button
                              key={p}
                              type="button"
                              onClick={() => setPrioridad(p)}
                              className={`py-2.5 rounded-xl border-2 font-extrabold text-[10px] tracking-wider transition-all flex items-center justify-center h-10 shadow-sm cursor-pointer ${
                                prioridad === p
                                  ? p === "ALTA"
                                    ? "bg-[#C90A0A] border-red-700 text-white shadow-md hover:brightness-90"
                                    : p === "MEDIA"
                                      ? "bg-[#0C3DC2] border-blue-600 text-white shadow-md hover:brightness-90"
                                      : "bg-[#EAB308] border-yellow-600 text-slate-900 shadow-md hover:brightness-90"
                                  : "bg-white border-slate-200 text-slate-400 hover:bg-slate-50 hover:text-slate-600"
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

        {/* BOTONES INFERIORES */}
        <div className="p-4 bg-slate-50 border-t flex gap-3 w-full shrink-0">
          <button
            type="button"
            onClick={() => {
              setMotivosSeleccionados([]);
              setShowDesestimoPanel(!showDesestimoPanel);
            }}
            className={`w-2/5 py-3.5 px-2 rounded-xl font-bold uppercase text-[11px] tracking-wider border transition-all shadow-sm ${
              showDesestimoPanel
                ? "bg-slate-500 text-white shadow-md hover:bg-slate-600"
                : "bg-white text-[#C13100] border-[#C13100] hover:bg-[#fff8f5]"
            }`}
          >
            {showDesestimoPanel ? "Cancelar" : "Desestimar alerta"}
          </button>

          <button
            type="button"
            onClick={showDesestimoPanel ? confirmarDesestimo : handleEnviarDespachoLocal}
            disabled={cargando || (showDesestimoPanel && motivosSeleccionados.length === 0)}
            className={`w-3/5 py-3.5 px-4 rounded-xl font-bold uppercase text-[11px] tracking-wider shadow-md flex items-center justify-center gap-2 transition-all ${
              showDesestimoPanel
                ? "bg-[#b43c14] hover:bg-[#9a320f] text-white disabled:opacity-40"
                : "bg-[#113e27] hover:bg-[#b43c14] text-white disabled:opacity-40"
            }`}
          >
            <FaCheckCircle size={12} />
            {showDesestimoPanel ? "Desestimar alerta" : "Enviar a Despacho"}
          </button>
        </div>

      </div>
    </div>
  );
};

export default DetalleAlerta;
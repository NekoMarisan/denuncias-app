import React, { useState, useEffect, useRef } from "react";
import {
  FaUser, FaPhone, FaPlay, FaPause, FaFileImage, FaVideo,
  FaFilePdf, FaExclamationTriangle, FaTimes, FaShieldAlt,
  FaCheckCircle, FaFile, FaAddressCard, FaDownload,
  FaMapMarkerAlt, FaCalendarAlt, FaTag, FaSpinner
} from "react-icons/fa";
import { contravenciones, delitos } from "../../constants/CategoriasDelitos";
import { supabase } from "../../services/supabase";

const DetalleAlerta = ({ alerta, onBack, onEnviarDespacho, onDesestimar }) => {
  const [datos, setDatos]             = useState(null);
  const [ciudadano, setCiudadano]     = useState(null);
  const [evidencias, setEvidencias]   = useState([]);
  const [cargando, setCargando]       = useState(true);

  const [playing, setPlaying]         = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const audioRef                      = useRef(null);
  const audioInterval                 = useRef(null);

  const [contravencion, setContravencion] = useState("");
  const [delito, setDelito]           = useState("");
  const [prioridad, setPrioridad]     = useState("");
  const [estadoValidacion, setEstadoValidacion] = useState("pendiente");

  // ── Bloquear scroll ────────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = "unset"; };
  }, []);

  // ── Cargar datos desde Supabase ────────────────────────────────────────────
  useEffect(() => {
    const idAlerta = alerta?.id_alerta ?? alerta?.id;
    if (!idAlerta) return;

    const cargar = async () => {
      setCargando(true);

      const { data: alertaData, error: alertaErr } = await supabase
        .from("alerta")
        .select("*")
        .eq("id_alerta", idAlerta)
        .single();

      if (alertaErr) {
        console.error("Error alerta:", alertaErr);
        setCargando(false);
        return;
      }
      setDatos(alertaData);
      setPrioridad(alertaData.prioridad || "");

      if (alertaData.id_usuario) {
        const { data: ciudadanoData } = await supabase
          .from("usuario_ciudadano")
          .select("nombre_completo, ci, celular, email, selfie")
          .eq("id_usuario", alertaData.id_usuario)
          .single();
        if (ciudadanoData) setCiudadano(ciudadanoData);
      }

      const { data: evidenciaData } = await supabase
        .from("evidencia")
        .select("*")
        .eq("id_alerta", idAlerta);
      setEvidencias(evidenciaData || []);

      setCargando(false);
    };

    cargar();
  }, [alerta?.id_alerta, alerta?.id]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getFileInfo = (tipoEvidencia, archivo) => {
    const tipo = tipoEvidencia?.toLowerCase() || "";
    const ext  = archivo?.split(".").pop().toLowerCase() || "";

    if (tipo === "imagen" || ["jpg","jpeg","png","webp"].includes(ext))
      return { icon: <FaFileImage />, color: "text-blue-500",  label: "IMAGEN"   };
    if (tipo === "video"  || ["mp4","mov","avi"].includes(ext))
      return { icon: <FaVideo />,     color: "text-rose-500",  label: "VIDEO"    };
    if (tipo === "pdf"    || ext === "pdf")
      return { icon: <FaFilePdf />,   color: "text-amber-500", label: "PDF"      };
    return   { icon: <FaFile />,      color: "text-slate-400", label: "ARCHIVO"  };
  };

  const fechaFormateada = datos?.fecha_hora
    ? new Date(datos.fecha_hora).toLocaleString("es-ES", {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit"
      })
    : "—";

  // ── Audio ──────────────────────────────────────────────────────────────────
  const toggleAudio = () => {
    if (datos?.audio_30s) {
      if (!audioRef.current) {
        audioRef.current = new Audio(datos.audio_30s);
        audioRef.current.addEventListener("timeupdate", () => {
          const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
          setAudioProgress(isNaN(pct) ? 0 : pct);
        });
        audioRef.current.addEventListener("ended", () => {
          setPlaying(false); setAudioProgress(0);
        });
      }
      if (playing) { audioRef.current.pause(); setPlaying(false); }
      else         { audioRef.current.play();  setPlaying(true);  }
    } else {
      if (!playing) {
        setPlaying(true);
        audioInterval.current = setInterval(() => {
          setAudioProgress(prev => {
            if (prev >= 100) { clearInterval(audioInterval.current); setPlaying(false); return 0; }
            return prev + 2;
          });
        }, 200);
      } else {
        setPlaying(false);
        clearInterval(audioInterval.current);
      }
    }
  };

  // ── Acciones ───────────────────────────────────────────────────────────────
  const handleValidar = () => {
    if (!contravencion && !delito) {
      alert("Por favor, seleccione la clasificación antes de validar");
      return;
    }
    if (!prioridad) {
      alert("Por favor, seleccione un nivel de prioridad");
      return;
    }
    setEstadoValidacion("validado");
  };

  const handleDesestimar = () => {
    if (estadoValidacion === "validado") return;
    if (window.confirm("¿Desestimar este reporte? Se eliminará de la lista.")) {
      if (onDesestimar) onDesestimar(datos?.id_alerta ?? alerta?.id);
      else onBack();
    }
  };

  const handleEnviarDespachoLocal = () => {
    if (onEnviarDespacho) {
      onEnviarDespacho(datos?.id_alerta ?? alerta?.id, {
        clasificacion: contravencion || delito,
        prioridad
      });
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onBack} />

      <div className="relative w-full max-w-5xl max-h-[98vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* Cabecera */}
        <div className="bg-[#113e27] py-4 px-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="text-white/80" size={16} />
            <span className="text-sm font-extrabold uppercase tracking-wide">Gestión de Alerta Entrante</span>
            {datos?.codigo_alerta && (
              <span className="px-2 py-0.5 bg-white/10 rounded-lg text-[10px] font-black tracking-widest">
                {datos.codigo_alerta}
              </span>
            )}
          </div>
          <button onClick={onBack} className="hover:bg-white/20 p-1.5 rounded-full transition-colors">
            <FaTimes size={16} />
          </button>
        </div>

        {/* Contenido */}
        {cargando ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <FaSpinner className="animate-spin text-green-800 text-3xl" />
          </div>
        ) : (
          <div className="overflow-y-auto flex-1 p-5 md:p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* Columna izquierda */}
              <div className="space-y-5">
                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Datos del Ciudadano
                  </h3>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 shadow-sm flex items-center gap-4">
                    {ciudadano?.selfie ? (
                      <img src={ciudadano.selfie} alt="Foto"
                        className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0" />
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

                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Información de la Alerta
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <FaMapMarkerAlt className="text-red-500 mt-0.5 shrink-0" size={13} />
                      <div>
                        <p className="text-[8px] font-black text-slate-400 uppercase">Ubicación</p>
                        <p className="text-[11px] font-bold text-slate-700 break-all">{datos?.ubicacion || "No disponible"}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <FaCalendarAlt className="text-purple-500 shrink-0" size={12} />
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Fecha / Hora</p>
                          <p className="text-[10px] font-bold text-slate-700">{fechaFormateada}</p>
                        </div>
                      </div>
                      {datos?.categoria && (
                        <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <FaTag className="text-blue-500 shrink-0" size={12} />
                          <div>
                            <p className="text-[8px] font-black text-slate-400 uppercase">Categoría</p>
                            <p className="text-[10px] font-bold text-slate-700">{datos.categoria}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </section>

                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Evidencia Adjunta
                  </h3>
                  {evidencias.length > 0 ? (
                    <div className="space-y-2">
                      {evidencias.map((ev) => {
                        const info = getFileInfo(ev.tipo_evidencia, ev.archivo);
                        const nombreArchivo = ev.archivo?.split("/").pop() || ev.archivo || "archivo";
                        return (
                          <div key={ev.id_evidencia}
                            className="flex items-center justify-between p-3 bg-white border border-green-100 rounded-xl">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center shrink-0 ${info.color}`}>
                                {info.icon}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-700 uppercase truncate">{nombreArchivo}</p>
                                <p className="text-[8px] font-bold text-slate-400">{info.label}</p>
                              </div>
                            </div>
                            {ev.archivo && (
                              <a href={ev.archivo} target="_blank" rel="noreferrer"
                                className="text-slate-300 hover:text-emerald-600 transition-colors shrink-0 ml-2">
                                <FaDownload size={12} />
                              </a>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="text-[12px] font-medium text-slate-400">No se adjuntaron archivos.</p>
                  )}
                </section>
              </div>

              {/* Columna derecha */}
              <div className="space-y-5">
                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Audio del Reporte
                  </h3>
                  {datos?.audio_30s ? (
                    <div className="bg-[#1a5336] rounded-xl p-4 flex items-center gap-4 shadow-md">
                      <button onClick={toggleAudio}
                        className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1a5336] shrink-0">
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
                    </div>
                  ) : (
                    <div className="bg-slate-100 rounded-xl p-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                      Sin audio adjunto
                    </div>
                  )}
                </section>

                <section>
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                    Descripción del hecho
                  </h3>
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 relative">
                    <FaExclamationTriangle
                      className="absolute -top-1.5 -left-1.5 text-green-900 bg-white rounded-md p-0.5 shadow-sm"
                      size={16}
                    />
                    <p className="text-[13px] font-bold text-slate-500 leading-relaxed">
                      {datos?.descripcion || "Sin descripción adjunta."}
                    </p>
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    Clasificación del Hecho
                  </h3>
                  <div className="flex flex-col gap-2">
                    <div className="relative">
                      <select
                        className={`w-full p-2.5 pr-8 bg-white border-2 border-slate-200 rounded-xl text-[12px] font-bold outline-none appearance-none ${!contravencion ? "text-slate-400" : "text-slate-700"}`}
                        value={contravencion}
                        onChange={(e) => { setContravencion(e.target.value); setDelito(""); setEstadoValidacion("pendiente"); }}
                        disabled={!!delito || estadoValidacion === "validado"}
                      >
                        <option value="">Seleccionar Contravención</option>
                        {contravenciones.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                    <div className="relative">
                      <select
                        className={`w-full p-2.5 pr-8 bg-white border-2 border-slate-200 rounded-xl text-[12px] font-bold outline-none appearance-none ${!delito ? "text-slate-400" : "text-slate-700"}`}
                        value={delito}
                        onChange={(e) => { setDelito(e.target.value); setContravencion(""); setEstadoValidacion("pendiente"); }}
                        disabled={!!contravencion || estadoValidacion === "validado"}
                      >
                        <option value="">Seleccionar Delito</option>
                        {delitos.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                        <svg className="w-3 h-3 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" />
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
                    {["ALTA", "MEDIA", "BAJA"].map(p => (
                      <button key={p} type="button"
                        disabled={estadoValidacion === "validado"}
                        onClick={() => { setPrioridad(p); setEstadoValidacion("pendiente"); }}
                        className={`py-2 rounded-xl border-2 font-bold text-[11px] tracking-wider transition-all ${
                          prioridad === p
                            ? p === "ALTA"  ? "bg-red-600 border-red-600 text-white"
                            : p === "MEDIA" ? "bg-blue-600 border-blue-600 text-white"
                            :                 "bg-amber-500 border-amber-500 text-white"
                            : "bg-white border-slate-200 text-slate-400 hover:border-slate-300"
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
        )}

        {/* Botones inferiores */}
        <div className="p-5 bg-slate-50 border-t flex flex-wrap md:flex-nowrap gap-3">
          <button
            onClick={handleDesestimar}
            disabled={estadoValidacion === "validado"}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-xl font-bold uppercase text-[11px] tracking-wider border-2 transition-all ${
              estadoValidacion === "validado"
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed"
                : "bg-white text-orange-600 border-orange-500 hover:bg-orange-50"
            }`}
          >
            Desestimar Reporte
          </button>

          <button
            onClick={handleValidar}
            disabled={cargando}
            className={`flex-1 py-1.5 rounded-xl font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-1.5 border-2 transition-all ${
              estadoValidacion === "validado"
                ? "bg-blue-600 border-blue-600 text-white shadow-md"
                : "bg-white border-blue-600 text-blue-600 hover:bg-blue-50"
            }`}
          >
            {estadoValidacion === "validado" ? "Alerta Validada" : "Validar Clasificación"}
          </button>

          <button
            onClick={handleEnviarDespachoLocal}
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
    </div>
  );
};

export default DetalleAlerta;
import React, { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaPhone,
  FaPlay,
  FaPause,
  FaTimes,
  FaShieldAlt,
  FaAddressCard,
  FaSpinner,
  FaChevronDown,
  FaCheckCircle,
} from "react-icons/fa";
import { contravenciones, delitos } from "../../constants/CategoriasDelitos";
import { useToast } from "../../context/ToastContext";
import { supabase } from "../../services/supabase";
import DesestimarAlerta from "../../components/DesestimarAlerta";
import { useAuth } from "../../context/AuthContext";
import { DetalleEmergenciaSkeleton } from '../ui/Skeleton';

const DetalleEmergencia = ({
  alerta,
  onBack,
  onEnviarDespacho,
  onDesestimar,
}) => {
  const { showToast } = useToast();
  const { user } = useAuth();

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
  const [desestimando, setDesestimando] = useState(false);
  const [transcribiendoAudio, setTranscribiendoAudio] = useState(false);
  const [motivoDesestimo, setMotivoDesestimo] = useState("");
  const [justificacionDesestimo, setJustificacionDesestimo] = useState("");

  const debounceTimeout = useRef(null);

  const guardarDescripcion = async (texto) => {
    if (!datos?.id_alerta) return;
    try {
      const { error } = await supabase
        .from("alerta")
        .update({ descripcion: texto })
        .eq("id_alerta", datos.id_alerta);
      if (error) throw error;
      setDatos((prev) => ({ ...prev, descripcion: texto }));
    } catch (err) {
      console.error("Error guardando descripción:", err);
      showToast("Error al guardar la descripción", "error");
    }
  };

  const handleDescripcionChange = (texto) => {
    setRelatoEditado(texto);
    if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
    debounceTimeout.current = setTimeout(() => {
      guardarDescripcion(texto);
    }, 800);
  };

  const handleContravencionChange = (valor) => {
    setContravencion(valor);
    setDelito("");
  };

  const handleDelitoChange = (valor) => {
    setDelito(valor);
    setContravencion("");
  };

  const handlePrioridadChange = (valor) => {
    setPrioridad(valor);
  };

  const confirmarDesestimo = async (motivoTexto, justificacion) => {
    setDesestimando(true);
    try {
      const { error } = await supabase.from("alerta_desestimada").insert({
        id_alerta: datos?.id_alerta,
        id_operador: user?.id_oficial || user?.id,
        motivo: motivoTexto,
        justificacion_adicional: justificacion || null,
      });
      if (error) throw error;
      showToast("Alerta desestimada correctamente", "success");
      if (onDesestimar) onDesestimar(datos?.id_alerta, motivoTexto);
      else onBack();
      setShowDesestimoPanel(false);
      setMotivoDesestimo("");
      setJustificacionDesestimo("");
    } catch (err) {
      console.error("Error guardando desestimación:", err);
      showToast("Error al desestimar la alerta", "error");
    } finally {
      setDesestimando(false);
    }
  };

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
      if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (audioInterval.current) clearInterval(audioInterval.current);
    };
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
      setPrioridad("");
      setContravencion("");
      setDelito("");

      const estadoNombre = await obtenerNombreEstado(
        alertaData.id_estado_actual,
      );
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
        audioRef.current.addEventListener("loadedmetadata", () =>
          setAudioDuration(audioRef.current.duration),
        );
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
      if (audioInterval.current) clearInterval(audioInterval.current);
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
      if (audioInterval.current) clearInterval(audioInterval.current);
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
      if (!response.ok)
        throw new Error(
          `HTTP ${response.status}: No se pudo descargar el audio`,
        );
      const audioBlob = await response.blob();
      const formData = new FormData();
      formData.append("audio", audioBlob, "audio.mp3");
      const { data, error } = await supabase.functions.invoke(
        "transcribe-audio",
        {
          body: formData,
        },
      );
      if (error) throw new Error(`Error en la función edge: ${error.message}`);
      if (!data?.texto)
        throw new Error("La respuesta no contiene texto transcrito");
      setRelatoEditado(data.texto);
      handleDescripcionChange(data.texto);
      showToast("Audio transcrito correctamente", "success");
    } catch (err) {
      console.error("Error en transcripción:", err);
      showToast(`Error: ${err.message}`, "error");
    } finally {
      setTranscribiendoAudio(false);
    }
  };

  const handleEnviarDespacho = () => {
    if (!contravencion && !delito) {
      showToast("Seleccionar un DELITO o CONTRAVENCIÓN", "error");
      return;
    }
    if (!prioridad) {
      showToast(
        "Seleccionar un nivel de prioridad (ALTA, MEDIA, BAJA)",
        "error",
      );
      return;
    }
    if (onEnviarDespacho) {
      onEnviarDespacho(datos?.id_alerta, {
        clasificacion: contravencion || delito,
        esContravencion: !!contravencion,
        prioridad: prioridad,
      });
    }
    showToast(
      `Alerta ${datos?.codigo_alerta || datos?.id_alerta} enviada al despacho`,
      "success",
    );
  };

  const handleSubmitDesestimo = async () => {
    if (!motivoDesestimo) {
      showToast("Seleccionar MOTIVO DE DESESTIMACIÓN", "error");
      return;
    }
    if (!justificacionDesestimo.trim()) {
      showToast("Completar el campo JUSTIFICACIÓN ADICIONAL", "error");
      return;
    }
    await confirmarDesestimo(motivoDesestimo, justificacionDesestimo);
  };

  const formatoFechaHoraBolivia = (fechaISO) => {
    if (!fechaISO) return { fecha: "—", hora: "—" };
    const date = new Date(fechaISO);
    return {
      fecha: date.toLocaleDateString("es-BO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        timeZone: "America/La_Paz",
      }),
      hora: date.toLocaleTimeString("es-BO", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "America/La_Paz",
      }),
    };
  };

  const { fecha: fechaFormateada = "—", hora: horaFormateada = "—" } =
    datos?.fecha_hora
      ? formatoFechaHoraBolivia(datos.fecha_hora)
      : { fecha: "—", hora: "—" };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4">
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
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" />

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[92vh]">
        {/* BARRA SUPERIOR — con icono e info, como la original */}
        <div className="bg-[#474b29] py-4 px-5 sm:px-6 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-md flex items-center justify-center shrink-0">
                <FaShieldAlt className="text-white" size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[17px] font-bold uppercase tracking-wider leading-none">
                    Detalle de Emergencia
                  </h2>
                </div>
                <p className="text-[11px] font-medium text-white/70 mt-1.5">
                  {datos?.codigo_alerta && <span>{datos.codigo_alerta} · </span>}
                  {fechaFormateada} - {horaFormateada}
                </p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="hover:bg-white/20 p-1.5 rounded-md transition-colors shrink-0"
            >
              <FaTimes size={15} />
            </button>
          </div>
        </div>

{cargando ? (
          <DetalleEmergenciaSkeleton />
        ) : (
          <div className="px-5 sm:px-6 py-5 overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 items-start">
              {/* COLUMNA IZQUIERDA */}
              <div className="flex flex-col gap-5">

                  {/* Ciudadano */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                      Datos del ciudadano
                    </label>
                    <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-3.5 py-3.5">
                      {ciudadano?.selfie ? (
                        <img
                          src={ciudadano.selfie}
                          alt="Foto"
                          className="w-14 h-14 rounded-lg object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-300 shrink-0">
                          <FaUser size={16} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[14px] font-medium text-slate-500 capitalize truncate tracking-wider">
                          {ciudadano?.nombre_completo
                            ? ciudadano.nombre_completo.toLowerCase()
                            : "Usuario desconocido"}
                        </p>
                        <div className="flex items-center gap-4 mt-1 tracking-wider">
                          <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                            <FaAddressCard size={10} /> {ciudadano?.ci || "—"}
                          </span>
                          <span className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium">
                            <FaPhone size={10} /> {ciudadano?.celular || "—"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                {/* Audio */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                      Audio del reporte
                    </label>
                    {datos?.audio_30s ? (
                      <div className="border border-slate-200 rounded-xl px-3.5 py-3 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={toggleAudio}
                          className="w-10 h-10 bg-[#474b29] rounded-full flex items-center justify-center text-white shrink-0"
                        >
                          {playing ? (
                            <FaPause size={12} />
                          ) : (
                            <FaPlay size={12} className="ml-0.5" />
                          )}
                        </button>
                        <div className="flex-1">
                          <input
                            type="range"
                            min="0"
                            max={audioDuration || 60}
                            step="0.01"
                            value={audioCurrentTime}
                            onChange={handleSeek}
                            className="w-full h-1 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                            style={{
                              background: `linear-gradient(to right, #474b29 0%, #474b29 ${audioProgress}%, #f1f5f9 ${audioProgress}%, #f1f5f9 100%)`,
                            }}
                          />
                          <div className="flex justify-between text-[11px] text-slate-400 mt-1 tracking-wider font-medium">
                            <span>{formatTime(audioCurrentTime)}</span>
                            <span>{formatTime(audioDuration || 60)}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-200 rounded-xl px-3.5 py-3 text-[11px] text-slate-400 text-center">
                        Sin audio adjunto
                      </div>
                    )}
                  </div>

                {/* Descripción */}
                  <div className="flex-1 flex flex-col">
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                      RELATO del hecho
                    </label>
                    <div className="relative border border-slate-200 rounded-xl px-3.5 py-3 focus-within:border-slate-300">
  <textarea
  className="block w-full min-h-[50px] text-[12px] text-slate-500 font-medium bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 resize-y tracking-wider"
    placeholder="Sin descripción del hecho..."
    value={relatoEditado}
    onChange={(e) => {
      if (showDesestimoPanel) return;
      handleDescripcionChange(e.target.value);
    }}
    readOnly={showDesestimoPanel}
    onClick={() => {
      if (showDesestimoPanel) {
        showToast("No puedes editar la descripción mientras estás desestimando la alerta", "error");
      }
    }}
  />
                    </div>
                  </div>
              </div>

              {/* COLUMNA DERECHA */}
              <div className="flex flex-col gap-5 md:border-l md:border-slate-100 md:pl-8">
                {/* Estado */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                    Estado Actual
                  </label>
                  <div className="w-1/3 px-4 py-2 bg-[#C90A0A] text-white text-[11.5px] font-bold uppercase tracking-widest rounded-lg text-center">
                    {nombreEstado || "EMERGENCIA"}
                  </div>
                </div>

                {/* Clasificación del hecho*/}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                      Clasificación del hecho
                    </label>
                    <div className="flex flex-col gap-3">
                      <div className="relative">
                        <select
                          className={`w-full h-11 pl-3 pr-7 border rounded-xl text-[12px] text-slate-500 outline-none appearance-none focus:border-[#474b29] transition-colors font-medium tracking-wider ${
                            contravencion ? "border-slate-400" : "border-slate-200"
                          }`}
                          value={contravencion}
                          onChange={(e) => handleContravencionChange(e.target.value)}
                        >
                          <option value="">Seleccionar Contravención</option>
                          {contravenciones.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <FaChevronDown
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
                          size={11}
                        />
                      </div>
                      <div className="relative">
                        <select
                          className={`w-full h-11 pl-3 pr-7 border rounded-xl text-[12px] text-slate-500 outline-none appearance-none focus:border-[#474b29] transition-colors font-medium tracking-wider ${
                            delito ? "border-slate-400" : "border-slate-200"
                          }`}
                          value={delito}
                          onChange={(e) => handleDelitoChange(e.target.value)}
                        >

                          <option value="">Seleccionar Delito</option>
                          {delitos.map((d) => (
                            <option key={d} value={d}>
                              {d}
                            </option>
                          ))}
                        </select>
                        <FaChevronDown
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
                          size={11}
                        />
                      </div>
                    </div>
                  </div>

                {/* Prioridad — segmented control minimal */}
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                      Nivel de prioridad
                    </label>
                    <div className="flex border border-slate-200 rounded-xl h-10 overflow-hidden text-[12px] tracking-wider">
                      {["ALTA", "MEDIA", "BAJA"].map((p, i) => (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePrioridadChange(p)}
                          className={`flex-1 py-2 text-[11px] font-medium tracking-wider transition-colors ${
                            i !== 0 ? "border-l border-slate-200" : ""
                          } ${
                            prioridad === p
                              ? "bg-[#474b29] text-white"
                              : "bg-white text-slate-500 hover:bg-slate-50"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>
              </div>
            </div>

            {/* PANEL DE DESESTIMO — se despliega debajo del grid, no lo reemplaza */}
            <div
              className={`grid transition-all duration-300 ease-in-out ${
                showDesestimoPanel
                  ? "grid-rows-[1fr] opacity-100 mt-5"
                  : "grid-rows-[0fr] opacity-0 mt-0"
              }`}
            >
<div className="overflow-hidden">
                <div>
                  <DesestimarAlerta
                    motivo={motivoDesestimo}
                    onMotivoChange={setMotivoDesestimo}
                    justificacion={justificacionDesestimo}
                    onJustificacionChange={setJustificacionDesestimo}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FOOTER — cambia de botones según el modo (normal vs. desestimando) */}
        <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex justify-end gap-3.5 shrink-0 bg-slate-50">
          {showDesestimoPanel ? (
            <>
              <button
                onClick={() => {
                  setShowDesestimoPanel(false);
                  setMotivoDesestimo("");
                  setJustificacionDesestimo("");
                }}
                disabled={desestimando}
                className="px-6 py-2.5 rounded-lg font-medium text-[11.5px] border uppercase tracking-wider border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-40"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmitDesestimo}
                disabled={desestimando}
                className="px-8 py-2.5 rounded-lg font-medium text-[11.5px] bg-[#474b29] uppercase hover:bg-[#3a3e21] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed tracking-wider flex items-center justify-center gap-2"
              >
                {desestimando ? "Desestimando..." : "Desestimar alerta"}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setShowDesestimoPanel(true)}
                className="px-4 py-2.5 rounded-lg font-medium text-[11.5px] border uppercase border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors tracking-wider"
              >
                Desestimar alerta
              </button>
              <button
                onClick={handleEnviarDespacho}
                disabled={cargando}
                className="px-8 py-2.5 rounded-lg font-medium text-[11.5px] bg-[#474b29] uppercase hover:bg-[#3a3e21] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed tracking-wider flex items-center justify-center gap-2"
              >
                 Enviar a despacho
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default DetalleEmergencia;
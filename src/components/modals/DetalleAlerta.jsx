  import React, { useState, useEffect, useRef } from "react";
  import {
    FaUser,
    FaPhone,
    FaPlay,
    FaPause,
    FaFileImage,
    FaVideo,
    FaFilePdf,
    FaTimes,
    FaShieldAlt,
    FaCheckCircle,
    FaFile,
    FaAddressCard,
    FaEye,
    FaSpinner,
    FaChevronDown,
  } from "react-icons/fa";
  import { contravenciones, delitos } from "../../constants/CategoriasDelitos";
  import { supabase } from "../../services/supabase";
  import { useToast } from "../../context/ToastContext";
  import DesestimarAlerta from "../../components/DesestimarAlerta";
  import { useAuth } from "../../context/AuthContext";
  import { DetalleAlertaSkeleton } from '../ui/Skeleton';
  const DetalleAlerta = ({ alerta, onBack, onEnviarDespacho, onDesestimar }) => {
    const { showToast } = useToast();
    const { user } = useAuth();

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

    const [showDesestimoPanel, setShowDesestimoPanel] = useState(false);
    const [desestimando, setDesestimando] = useState(false);
    const [motivoDesestimo, setMotivoDesestimo] = useState("");
    const [justificacionDesestimo, setJustificacionDesestimo] = useState("");

    const debounceTimeout = useRef(null);
    const scrollContenedorRef = useRef(null); // referencia al contenedor scrollable del modal
    const wrapperPanelRef = useRef(null); // referencia al wrapper con la transición grid-rows

    // Sigue el crecimiento REAL del panel (via ResizeObserver) y mueve el scroll
    // exactamente lo mismo, frame a frame — así nunca hay desfase ni salto.
    const sincronizarScrollConPanel = (abriendo) => {
      const contenedor = scrollContenedorRef.current;
      const wrapper = wrapperPanelRef.current;
      if (!contenedor || !wrapper) return;

      let altoAnterior = wrapper.offsetHeight;
      const observer = new ResizeObserver(() => {
        const altoActual = wrapper.offsetHeight;
        const delta = altoActual - altoAnterior;
        if (delta !== 0) {
          contenedor.scrollTop += delta;
          altoAnterior = altoActual;
        }
      });
      observer.observe(wrapper);

      // Se desconecta solo cuando termina la transición CSS (500ms + margen)
      setTimeout(() => {
        observer.disconnect();
        if (abriendo) {
          contenedor.scrollTop = contenedor.scrollHeight;
        }
      }, 600);
    };

    // Solo guarda la descripción automáticamente
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

    const handleAbrirDesestimo = () => {
      setShowDesestimoPanel((prev) => {
        const abriendo = !prev;
        requestAnimationFrame(() => sincronizarScrollConPanel(abriendo));
        return abriendo;
      });
    };

    const handleCancelarDesestimo = () => {
      requestAnimationFrame(() => sincronizarScrollConPanel(false));
      setShowDesestimoPanel(false);
      setMotivoDesestimo("");
      setJustificacionDesestimo("");
    };

    useEffect(() => {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "unset";
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
        if (audioInterval.current) clearInterval(audioInterval.current);
        if (debounceTimeout.current) clearTimeout(debounceTimeout.current);
      };
    }, []);

    useEffect(() => {
      const idAlerta = alerta?.id_alerta ?? alerta?.id;
      if (!idAlerta) return;

      const cargar = async () => {
        setCargando(true);
        try {
          const { data: alertaData, error: alertaErr } = await supabase
            .from("alerta")
            .select("*")
            .eq("id_alerta", idAlerta)
            .single();
          if (alertaErr) throw alertaErr;
          setDatos(alertaData);
          setRelatoEditado(alertaData.descripcion || "");
          setPrioridad("");
          setContravencion("");
          setDelito("");

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
        } catch (err) {
          console.error("Error cargando:", err);
        } finally {
          setCargando(false);
        }
      };
      cargar();
    }, [alerta?.id_alerta, alerta?.id]);

    const getFileInfo = (tipoEvidencia, archivo) => {
      const tipo = tipoEvidencia?.toLowerCase() || "";
      const ext = archivo?.split(".").pop().toLowerCase() || "";
      if (tipo === "imagen" || ["jpg", "jpeg", "png", "webp"].includes(ext))
        return {
          icon: <FaFileImage size={14} />,
          color: "text-blue-500",
          bg: "bg-blue-50",
          label: "IMAGEN",
        };
      if (tipo === "video" || ["mp4", "mov", "avi"].includes(ext))
        return {
          icon: <FaVideo size={14} />,
          color: "text-rose-500",
          bg: "bg-rose-50",
          label: "VIDEO",
        };
    if (tipo === "pdf" || ext === "pdf")
        return {
          icon: <FaFilePdf size={16} />,
          color: "text-slate-500",
          bg: "bg-slate-50",
          label: "PDF",
        };
      return {
        icon: <FaFile size={14} />,
        color: "text-slate-400",
        bg: "bg-slate-50",
        label: "ARCHIVO",
      };
    };

    const registrarVistaEvidencia = (id) => {
      if (!evidenciasVistas.includes(id))
        setEvidenciasVistas((prev) => [...prev, id]);
    };

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
          const totalDuration = audioDuration || 60;
          const startTime = Date.now() - audioCurrentTime * 1000;
          audioInterval.current = setInterval(() => {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed >= totalDuration) {
              clearInterval(audioInterval.current);
              setPlaying(false);
              setAudioProgress(0);
              setAudioCurrentTime(0);
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
              setPlaying(false);
              setAudioProgress(0);
              setAudioCurrentTime(0);
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

    const handleEnviarDespachoLocal = () => {
      if (!contravencion && !delito) {
        showToast(
          "Seleccionar un DELITO o CONTRAVENCIÓN",
          "error",
        );
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
        onEnviarDespacho(datos?.id_alerta ?? alerta?.id, {
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

  const estadoBadge =
      estadoValidacion === "validado"
        ? { texto: "VALIDADO", clase: "bg-green-700" }
        : { texto: "VERIFICACIÓN", clase: "bg-[#EAB308] text-white text-[12px]" };

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
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm animate-[overlayFadeIn_0.25s_ease-out]" />

        <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[92vh] animate-[modalPopIn_0.35s_cubic-bezier(0.16,1,0.3,1)]">
          {/* BARRA SUPERIOR */}
          <div className="bg-[#474b29] py-4 px-5 sm:px-6 text-white shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-md flex items-center justify-center shrink-0">
                  <FaShieldAlt className="text-white" size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-2.5">
                    <h2 className="text-[17px] font-bold uppercase tracking-wider leading-none">
                      Detalle de Alerta
                    </h2>
                  </div>
                  <p className="text-[11px] font-medium text-white/70 mt-1.5">
                    {datos?.codigo_alerta && <span>{datos.codigo_alerta} · </span>}
                    {fechaFormateada} - {horaFormateada}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onBack}
                className="hover:bg-white/20 p-1.5 rounded-md transition-colors shrink-0"
              >
                <FaTimes size={15} />
              </button>
            </div>
          </div>

        {cargando ? (
            <DetalleAlertaSkeleton />
          ) : (
            <div ref={scrollContenedorRef} className="overflow-y-auto scroll-hover max-h-[650px] px-5 sm:px-6 py-5 bg-white">
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
                    <div
                      className={`w-1/3 px-4 py-2 text-[11.5px] font-bold uppercase tracking-widest rounded-lg text-center ${estadoBadge.clase}`}
                    >
                      {estadoBadge.texto}
                    </div>
                  </div>

                  {/* Clasificación */}
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

                  {/* Prioridad */}
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

              {/* Evidencia — ocupa ambas columnas */}
              <div className="mt-5">
                <label className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                  Evidencia adjunta
                  {evidencias.length > 0 && (
                    <span className="text-slate-400 font-semibold">
                      ({evidencias.length})
                    </span>
                  )}
                </label>
                {evidencias.length > 0 ? (
                  <div className="grid grid-cols-5 gap-3">
                    {evidencias.map((ev) => {
                      const info = getFileInfo(ev.tipo_evidencia, ev.archivo);
                      const esImagen = info.label === "IMAGEN";
                      const esVideo = info.label === "VIDEO";
                      const yaVisto = evidenciasVistas.includes(
                        ev.id_evidencia,
                      );
                      const [hoverEv, setHoverEv] = [false, () => {}];
                      return (
                        <div
                          key={ev.id_evidencia}
                          onMouseEnter={(e) => {
                            const media = e.currentTarget.querySelector("img, video");
                            if (media) media.style.transform = "scale(1.08)";
                          }}
                          onMouseLeave={(e) => {
                            const media = e.currentTarget.querySelector("img, video");
                            if (media) media.style.transform = "scale(1)";
                          }}
                        className={`relative w-full h-24 rounded-lg border overflow-hidden transition-colors ${
                            yaVisto
                              ? "border-[#474b29]/30"
                              : "border-slate-200"
                          }`}
                        >
                          {esImagen ? (
                            <img
                              src={ev.archivo}
                              alt="Evidencia"
                              style={{ transition: "transform 0.2s ease" }}
                              className="w-full h-full object-cover"
                            />
                          ) : esVideo ? (
                            <video
                              src={ev.archivo}
                              style={{ transition: "transform 0.2s ease" }}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div
                              className={`w-full h-full flex flex-col items-center justify-center gap-1.5 ${info.bg} ${info.color}`}
                            >
                              {info.icon}
                              <span className="text-[9px] font-bold uppercase tracking-wider">
                                {info.label}
                              </span>
                            </div>
                          )}
                        {ev.archivo ? (
                            <a
                              href={ev.archivo}
                              target="_blank"
                              rel="noreferrer"
                              onClick={() => registrarVistaEvidencia(ev.id_evidencia)}
                              className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center"
                            >
                              <span className="bg-gray-200 hover:bg-slate-50 text-gray-800 py-1.5 px-2 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-md">
                                <FaEye size={10} /> Ver {info.label.toLowerCase()}
                              </span>
                            </a>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="border border-dashed border-slate-200 rounded-xl px-3.5 py-3 text-[11px] text-slate-400 text-center">
                    No se adjuntaron archivos.
                  </div>
                )}
              </div>

              {/* PANEL DE DESESTIMO — acordeón debajo del grid */}
<div
                ref={wrapperPanelRef}
                className={`grid transition-all duration-500 ease-in-out ${
                  showDesestimoPanel
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
<div className="overflow-hidden">
                  <div className="mt-5">
                    <DesestimarAlerta
                      motivo={motivoDesestimo}
                      onMotivoChange={setMotivoDesestimo}
                      justificacion={justificacionDesestimo}
                      onJustificacionChange={setJustificacionDesestimo}
                      topSpacingClass="pt-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* FOOTER */}
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100 flex justify-end gap-3.5 shrink-0 bg-slate-50">
            {showDesestimoPanel ? (
              <>
                <button
                  type="button"
                  onClick={handleCancelarDesestimo}
                  disabled={desestimando}
                  className="px-6 py-2.5 rounded-lg font-medium text-[11.5px] border uppercase tracking-wider border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-40"
                >
                  Cancelar
                </button>
                <button
                  type="button"
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
                  type="button"
                  onClick={handleAbrirDesestimo}
                  className="px-4 py-2.5 rounded-lg font-medium text-[11.5px] border uppercase border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors tracking-wider"
                >
                  Desestimar alerta
                </button>
                <button
                  type="button"
                  onClick={handleEnviarDespachoLocal}
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

  export default DetalleAlerta;
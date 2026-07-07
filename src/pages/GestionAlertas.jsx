import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { LuZoomIn } from "react-icons/lu";
import { FaLock, FaSpinner } from "react-icons/fa";
import DetalleAlertaModal from "../components/modals/DetalleAlerta";
import DetalleEmergencia from "../components/modals/DetalleEmergencia";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";

const cacheDuracionAudio = new Map();

const AudioDuration = ({ audioUrl }) => {
  const [duracion, setDuracion] = useState(() => cacheDuracionAudio.get(audioUrl) || null);
  const [cargando, setCargando] = useState(false);
  const [errorCarga, setErrorCarga] = useState(false);

  useEffect(() => {
    if (!audioUrl) {
      setDuracion(null);
      setErrorCarga(false);
      return;
    }

    if (cacheDuracionAudio.has(audioUrl)) {
      setDuracion(cacheDuracionAudio.get(audioUrl));
      setCargando(false);
      setErrorCarga(false);
      return;
    }

    let cancelado = false;
    setCargando(true);
    setErrorCarga(false);

    const audio = new Audio();
    audio.preload = "metadata";

    const guardarDuracion = (segundos) => {
      if (cancelado) return;
      const mins = Math.floor(segundos / 60);
      const secs = Math.floor(segundos % 60);
      const texto = mins > 0 ? `${mins}:${secs.toString().padStart(2, "0")}` : `${secs}s`;
      cacheDuracionAudio.set(audioUrl, texto);
      setDuracion(texto);
      setCargando(false);
    };

    const handleLoadedMetadata = () => {
      const segundos = audio.duration;
      // Bug conocido del navegador con audios grabados (webm/opus de MediaRecorder):
      // a veces reporta duration = Infinity. Forzamos el cálculo real con este truco.
      if (!isFinite(segundos)) {
        audio.currentTime = 1e101;
        audio.addEventListener(
          "timeupdate",
          function onTimeUpdate() {
            audio.removeEventListener("timeupdate", onTimeUpdate);
            audio.currentTime = 0;
            if (isFinite(audio.duration)) {
              guardarDuracion(audio.duration);
            } else if (!cancelado) {
              setErrorCarga(true);
              setCargando(false);
            }
          },
          { once: true }
        );
        return;
      }
      guardarDuracion(segundos);
    };

    const handleError = () => {
      if (!cancelado) {
        setErrorCarga(true);
        setCargando(false);
      }
    };

    const timeoutId = setTimeout(() => {
      if (!cancelado && !cacheDuracionAudio.has(audioUrl)) {
        setErrorCarga(true);
        setCargando(false);
      }
    }, 8000);

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("error", handleError);
    audio.src = audioUrl;

    return () => {
      cancelado = true;
      clearTimeout(timeoutId);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("error", handleError);
      audio.pause();
      audio.src = "";
    };
  }, [audioUrl]);

  if (!audioUrl) return <span className="text-slate-400">—</span>;
  if (cargando) return <FaSpinner className="animate-spin text-slate-400" size={14} />;
  if (duracion) return <span className="text-sm font-bold text-slate-700">{duracion}</span>;
  return <span className="text-slate-400" title={errorCarga ? "No se pudo leer la duración" : undefined}>—</span>;
};

const calcularTiempoTranscurrido = (fechaHoraISO) => {
  if (!fechaHoraISO) return "—";
  const fecha = new Date(fechaHoraISO);
  const ahora = new Date();
  const diffMs = ahora - fecha;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHoras = Math.floor(diffMin / 60);
  const diffDias = Math.floor(diffHoras / 24);

  if (diffMin < 1) return "hace unos segundos";
  if (diffMin < 60) return `hace ${diffMin} minuto${diffMin !== 1 ? "s" : ""}`;
  if (diffHoras < 24) return `hace ${diffHoras} hora${diffHoras !== 1 ? "s" : ""}`;
  if (diffDias < 7) return `hace ${diffDias} día${diffDias !== 1 ? "s" : ""}`;
  return fecha.toLocaleDateString("es-BO");
};

function GestionAlertas() {
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tabActiva, setTabActiva] = useState("emergencia");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [alertasArchivadas, setAlertasArchivadas] = useState([]);
  const [filaResaltada, setFilaResaltada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const [alertasPanico, setAlertasPanico] = useState([]);
  const [alertasCiudadanas, setAlertasCiudadanas] = useState([]);

  const dataActual = tabActiva === "ciudadana" ? alertasCiudadanas : alertasPanico;

  const transformarAlertas = (data) => {
    const panico = [];
    const ciudadanas = [];

    data.forEach((item) => {
      const base = {
        id: item.id_alerta,
        ciudadano: item.usuario_ciudadano?.nombre_completo || `Usuario #${item.id_usuario}`,
        ubicacion: item.ubicacion || "Sin ubicación",
        fecha: item.fecha_hora ? new Date(item.fecha_hora).toLocaleDateString("es-BO") : "—",
        hora: item.fecha_hora
          ? new Date(item.fecha_hora).toLocaleTimeString("es-BO", { hour: "2-digit", minute: "2-digit" })
          : "—",
        descripcion: item.descripcion || "",
        categoria: item.categoria || "",
        audio_30s: item.audio_30s || null,
        prioridad: item.prioridad || "Media",
        codigo: item.codigo_alerta || "",
        fecha_hora: item.fecha_hora,
        bloqueadoPor: item.bloqueado_por || null,
        bloqueadoRol: item.bloqueado_rol || null,
        bloqueadoNombre: item.oficial_bloqueador?.nombre_completo || null,
      };

      if (item.categoria === "Panico") {
        panico.push({ ...base, estado: "Emergencia" });
      } else if (item.categoria === "Alerta Ciudadana") {
        ciudadanas.push({ ...base, estado: "Verificación" });
      }
    });

    return { panico, ciudadanas };
  };

const liberarBloqueos = async () => {
    const idOficialActivo = alertaSeleccionadaRef.current ? user?.id_oficial : null;
    let query = supabase
      .from("alerta")
      .update({ bloqueado_por: null, bloqueado_en: null, bloqueado_rol: null })
      .eq("id_estado_actual", 1)
      .lt("bloqueado_en", new Date(Date.now() - 8000).toISOString())
      .not("bloqueado_por", "is", null);
    if (idOficialActivo) query = query.neq("bloqueado_por", idOficialActivo);
    await query;
  };

  const cargarAlertas = async (silencioso = false) => {
    if (!silencioso) setCargando(true);
    setErrorCarga(null);
    try {
      const { data, error } = await supabase
        .from("alerta")
        .select(`*, usuario_ciudadano (nombre_completo), oficial_bloqueador:bloqueado_por (nombre_completo)`)
        .eq("id_estado_actual", 1)
        .order("fecha_hora", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setAlertasPanico([]);
        setAlertasCiudadanas([]);
        return;
      }

      const { panico, ciudadanas } = transformarAlertas(data);
      setAlertasPanico(panico);
      setAlertasCiudadanas(ciudadanas);
    } catch (err) {
      console.error(err);
      setErrorCarga(err.message);
    } finally {
      setCargando(false);
    }
  };

const mostrarModalRef = useRef(false);
  const alertaSeleccionadaRef = useRef(null);

  // Sincronización inmediata (no en useEffect para evitar delay de un render)
  mostrarModalRef.current = mostrarModal;
  alertaSeleccionadaRef.current = alertaSeleccionada;

  useEffect(() => {
    cargarAlertas();

    const canal = supabase
      .channel("alertas-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "alerta" }, () => {
        if (!mostrarModalRef.current) {
          cargarAlertas(true);
        }
      })
      .subscribe();

    // Cada 5s libera bloqueos vencidos y recarga si no hay modal abierto
    const intervalo = setInterval(async () => {
      await liberarBloqueos();
      if (!mostrarModalRef.current) {
        cargarAlertas(true);
      }
    }, 5000);

    return () => {
      supabase.removeChannel(canal);
      clearInterval(intervalo);
    };
  }, []);

  useEffect(() => {
    const state = location.state;
    if (state?.activeTab) {
      setTabActiva(state.activeTab);
      if (state.selectedId) {
        setFilaResaltada(state.selectedId);
        setTimeout(() => {
          const fila = document.getElementById(`fila-${state.selectedId}`);
          if (fila) fila.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
        setTimeout(() => setFilaResaltada(null), 2000);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Bloquea el scroll de la página mientras esta vista está activa
useEffect(() => {
  const bodyOverflowOriginal = document.body.style.overflow;
  const htmlOverflowOriginal = document.documentElement.style.overflow;
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  return () => {
    document.body.style.overflow = bodyOverflowOriginal;
    document.documentElement.style.overflow = htmlOverflowOriginal;
  };
}, []);

  const abrirModal = async (alerta) => {
    const idOficial = user?.id_oficial;
    if (!idOficial) {
      alert("Error: No se pudo identificar al operador");
      return;
    }

    const { data: alertaActual, error: fetchError } = await supabase
      .from("alerta")
      .select("bloqueado_por")
      .eq("id_alerta", alerta.id)
      .maybeSingle();

    if (fetchError) {
      console.error("Error al verificar bloqueo:", fetchError);
      alert("Error al verificar el estado de la alerta");
      return;
    }

    const bloqueadoPor = alertaActual?.bloqueado_por;
    if (bloqueadoPor && bloqueadoPor !== idOficial) {
      alert("Esta alerta ya está siendo atendida por otro operador");
      return;
    }

    const updateFields = {
      bloqueado_por: idOficial,
      bloqueado_en: new Date().toISOString(),
      bloqueado_rol: "operador",
      id_operador_receptor: idOficial,
    };

    let updateQuery = supabase.from("alerta").update(updateFields).eq("id_alerta", alerta.id);

    if (!bloqueadoPor) {
      updateQuery = updateQuery.is("bloqueado_por", null);
    } else {
      updateQuery = updateQuery.eq("bloqueado_por", idOficial);
    }

    const { data, error } = await updateQuery.select().single();

    if (error || !data) {
      alert("Esta alerta ya está siendo atendida por otro operador");
      return;
    }

await supabase.from("log_actividad").insert([{
      id_oficial: idOficial,
      id_alerta: alerta.id,
      accion: "OPERADOR",
      descripcion: `Abrió la alerta — Ciudadano: ${alerta.ciudadano}`,
    }]);

    setAlertaSeleccionada(alerta);
    setMostrarModal(true);
  };

  useEffect(() => {
    if (!mostrarModal || !alertaSeleccionada || !user?.id_oficial) return;

// Renueva el bloqueo cada 4s (umbral de expiración: 8s)
    const heartbeat = setInterval(async () => {
      await supabase
        .from("alerta")
        .update({ bloqueado_en: new Date().toISOString() })
        .eq("id_alerta", alertaSeleccionada.id)
        .eq("bloqueado_por", user.id_oficial);
    }, 4000);
    
    return () => clearInterval(heartbeat);
  }, [mostrarModal, alertaSeleccionada, user?.id_oficial]);

  const cerrarModal = async () => {
    if (alertaSeleccionada && user?.id_oficial) {
      await supabase
        .from("alerta")
        .update({
          bloqueado_por: null,
          bloqueado_en: null,
          bloqueado_rol: null,
        })
        .eq("id_alerta", alertaSeleccionada.id)
        .eq("bloqueado_por", user.id_oficial);
    }
    setMostrarModal(false);
    setAlertaSeleccionada(null);
  };

  const manejarDesestimar = async (idAlerta, motivo) => {
    const { error } = await supabase
      .from("alerta")
      .update({
        id_estado_actual: 4,
        bloqueado_por: null,
        bloqueado_en: null,
        bloqueado_rol: null,
      })
      .eq("id_alerta", idAlerta);

    if (error) {
      console.error("Error al desestimar:", error);
      return;
    }

await supabase.from("log_actividad").insert([{
      id_oficial: user?.id_oficial,
      id_alerta: idAlerta,
      accion: "OPERADOR",
      descripcion: `Desestimó la alerta — Motivo: ${motivo}`,
    }]);


    const listaOrigen = tabActiva === "emergencia" ? alertasPanico : alertasCiudadanas;
    const alertaEncontrada = listaOrigen.find((a) => a.id === idAlerta);
    if (alertaEncontrada) {
      setAlertasArchivadas((prev) => [
        ...prev,
        {
          ...alertaEncontrada,
          estado: "DESESTIMADO",
          motivoDesestimacion: motivo || "Sin motivo especificado",
          fechaArchivo: new Date().toLocaleDateString(),
        },
      ]);
      if (tabActiva === "emergencia") {
        setAlertasPanico(alertasPanico.filter((a) => a.id !== idAlerta));
      } else {
        setAlertasCiudadanas(alertasCiudadanas.filter((a) => a.id !== idAlerta));
      }
    }
    cerrarModal();
  };

  const manejarTransferencia = async (idAlerta, datosClasificacion) => {
    // Actualizar estado a 2 (en despacho) y guardar prioridad/clasificación
    const updateData = {
      id_estado_actual: 2,
      bloqueado_por: null,
      bloqueado_en: null,
      bloqueado_rol: null,
    };
    if (datosClasificacion) {
      updateData.prioridad = datosClasificacion.prioridad;
      if (datosClasificacion.esContravencion) {
        updateData.contravenciones = datosClasificacion.clasificacion;
        updateData.delitos = null;
      } else {
        updateData.delitos = datosClasificacion.clasificacion;
        updateData.contravenciones = null;
      }
    }

    const { error } = await supabase.from("alerta").update(updateData).eq("id_alerta", idAlerta);

    if (error) {
      console.error("Error al enviar a despacho:", error);
      return;
    }

    await supabase.from("log_actividad").insert([
      {
        id_oficial: user?.id_oficial,
        id_alerta: idAlerta,
        accion: "OPERADOR",
        descripcion: `Validó la alerta y la envió a despacho`,
      },
    ]);

    if (tabActiva === "emergencia") {
      setAlertasPanico(alertasPanico.filter((a) => a.id !== idAlerta));
    } else {
      setAlertasCiudadanas(alertasCiudadanas.filter((a) => a.id !== idAlerta));
    }

    cerrarModal();
  };

  if (cargando) {
    return (
<div className="-mt-4 w-full px-1 py-5 space-y-5 pb-8 bg-gray-50/30 h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col">
        <div className="flex justify-center items-center h-64">
          <div className="text-[#113e27] font-bold text-lg">Cargando alertas...</div>
        </div>
      </div>
    );
  }

  if (errorCarga) {
    return (
<div className="-mt-4 w-full px-1 py-5 space-y-5 pb-8 bg-gray-50/30 h-[100dvh] max-h-[100dvh] overflow-hidden flex flex-col">
        <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded shadow-md mx-4">
          <p className="text-red-700 font-bold">Error al cargar las alertas</p>
          <p className="text-sm text-red-600">{errorCarga}</p>
          <button
            onClick={cargarAlertas}
            className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
<div className="-mt-4 w-full px-1 py-5 space-y-5 pb-8 bg-gray-50/30 h-[100dvh] max-h-[90dvh] overflow-hidden flex flex-col">
      {/* SELECTOR DE TABS */}
      <div className="px-4 w-full bg-white p-3 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200 shrink-0">
          <button
            onClick={() => setTabActiva("emergencia")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold text-xs transition-all tracking-wider ${
              tabActiva === "emergencia" ? "bg-[#113e27] text-white shadow-md" : "text-slate-400"
            }`}
          >
            <span className="hidden sm:inline">ALERTAS DE PÁNICO</span>
            <span className="sm:hidden">PÁNICO</span>
          </button>
          <button
            onClick={() => setTabActiva("ciudadana")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg font-bold text-xs transition-all tracking-wider ${
              tabActiva === "ciudadana" ? "bg-[#113e27] text-white shadow-md" : "text-slate-400"
            }`}
          >
            <span className="hidden sm:inline">ALERTAS CIUDADANAS</span>
            <span className="sm:hidden">CIUDADANAS</span>
          </button>
        </div>
        <div className="bg-gray-50 text-gray-500 px-4 py-2.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border border-gray-200">
          ● {dataActual.length} Registros activos
        </div>
      </div>

      {/* TABLA */}
    <div className="relative top-1 w-full bg-white px-4 md:px-7 py-4 md:py-6 rounded-2xl shadow-md flex flex-col flex-1 min-h-0">

        <h2 className="text-lg font-extrabold uppercase text-[#1e293b] mb-4 md:mb-6 tracking-wider flex-shrink-0">
          {tabActiva === "emergencia" ? "Bandeja de Emergencias" : "Reportes Ciudadanos"}
        </h2>

        <div className="overflow-auto flex-1 min-h-0 -mx-4 md:mx-0 px-4 md:px-0">
          <table className="min-w-full border-collapse text-left">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="pl-3 md:pl-4 pr-1 md:pr-2 py-2 w-[12%] md:w-[15%]">ID</th>
                <th className="py-2 w-[28%] md:w-[30%]">Ciudadano</th>
                <th className="py-2 w-[15%]">Duración del audio</th>
                <th className="py-2 w-[20%]">Tiempo</th>
                <th className="py-2 w-[12%] md:w-[15%]">Estado</th>
                <th className="px-3 md:px-4 py-2 w-[10%]">Acciones</th>
               </tr>
            </thead>
            <tbody>
              {dataActual.map((item) => {
                const bloqueadaPorOtro = item.bloqueadoPor && item.bloqueadoPor !== user?.id_oficial;
                return (
                  <tr
                    key={item.id}
                    id={`fila-${item.id}`}
                    className={`bg-white group transition-all duration-200 border-b border-slate-100 ${
                      filaResaltada === item.id
                        ? "ring-2 bg-slate-50"
                        : bloqueadaPorOtro
                        ? "opacity-50"
                        : "hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-5 md:py-6 text-[11px] font-bold text-slate-400 uppercase tracking-wider align-middle">
                      {item.codigo || item.id}
                    </td>
                    <td className="py-5 md:py-6 align-middle">
                      <div className="flex items-center gap-2 md:gap-3">
                        <div className="w-6 h-8 rounded-md flex items-center justify-center font-black text-xs shadow-inner shrink-0 bg-blue-50 text-[#0C3DC2]">
                          {item.ciudadano.charAt(0)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-[12px] font-bold text-[#1e293b] truncate max-w-[120px] md:max-w-none">
                            {item.ciudadano}
                          </span>
                          <span className="mt-0.5 text-[8px] text-gray-400 font-semibold uppercase tracking-wider">
                            {item.prioridad} prioridad
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 md:py-6 align-middle">
                      <span className="text-[10px] font-mono">
                        <AudioDuration audioUrl={item.audio_30s} />
                      </span>
                    </td>
                    <td className="py-5 md:py-6 text-[11px] font-bold text-slate-500 align-middle">
                      {calcularTiempoTranscurrido(item.fecha_hora)}
                    </td>
                    <td className="py-5 md:py-6 align-middle">
                      <span
                        className={`inline-flex justify-center w-16 md:w-20 py-1.5 rounded-md text-[9px] font-bold text-white tracking-wider ${
                          item.estado.toUpperCase() === "EMERGENCIA" ? "bg-[#C90A0A]" : "bg-[#EBB615]"
                        }`}
                      >
                        {item.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-5 md:py-6 align-middle">
                      {bloqueadaPorOtro ? (
                        <button
                          onClick={() => {
                            showToast(`Operador: ${item.bloqueadoNombre || "Otro operador"} ya está gestionando esta alerta`, "error");
                          }}
                          className="p-1.5 md:p-2 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center hover:bg-green-50 hover:text-[#113e27] transition-all duration-200"
                          title={`En uso por ${item.bloqueadoNombre || "otro operador"}`}
                        >
                          <FaLock size={13} />
                        </button>
                      ) : (
                        <button
                          onClick={() => abrirModal(item)}
                          className="p-1.5 md:p-2 bg-slate-100 text-slate-500 rounded-lg hover:bg-[#113e27] hover:text-white transition-all duration-200 flex items-center justify-center"
                        >
                          <LuZoomIn size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {dataActual.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400 font-medium">
                    No hay alertas en esta bandeja
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {mostrarModal && alertaSeleccionada &&
        (tabActiva === "emergencia" ? (
          <DetalleEmergencia
            alerta={alertaSeleccionada}
            onBack={cerrarModal}
            onEnviarDespacho={manejarTransferencia}
            onDesestimar={manejarDesestimar}
          />
        ) : (
          <DetalleAlertaModal
            alerta={alertaSeleccionada}
            onBack={cerrarModal}
            onEnviarDespacho={manejarTransferencia}
            onDesestimar={manejarDesestimar}
          />
        ))}
    </div>
  );
}

export default GestionAlertas;
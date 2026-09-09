import React, { useState, useEffect } from "react";
import {
  FaTimes,
  FaUsers,
  FaCheckCircle,
  FaBan,
  FaEdit,
  FaEye,
  FaExclamationTriangle,
  FaClock,
} from "react-icons/fa";
import { supabase } from "../../services/supabase";
import { useToast } from "../../context/ToastContext";
import { PerfilCiudadanoSkeleton } from "../ui/Skeleton";

// Campo tipo "ficha de reporte" — mismo componente que usa PerfilOficial
const Fila = ({ label, value }) => (
  <div className="space-y-1">
    <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 min-h-[14px] leading-tight">
      {label}
    </label>
    <div className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-3 text-[12px] font-medium text-slate-500 tracking-wider">
      {value || "—"}
    </div>
  </div>
);

  const PerfilCiudadano = ({ ciudadano, onClose, onActualizar, usuarioActual = null }) => {
  const { showToast } = useToast();
  const [estadoActual, setEstadoActual] = useState(ciudadano?.id_estado_ciudadano || 1);
  const [advertencias, setAdvertencias] = useState(ciudadano?.advertencias || 0);
  const [guardando, setGuardando] = useState(false);
  const [cargandoPerfil, setCargandoPerfil] = useState(true);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [mostrarPanelMotivo, setMostrarPanelMotivo] = useState(false);
  const [motivoCorreccion, setMotivoCorreccion] = useState("");
  const [motivoPersonalizado, setMotivoPersonalizado] = useState("");
  // 🧪 SIMULACIÓN TEMPORAL — fija el alto de las cuadrículas de fotos en h-36. QUITAR AL TERMINAR.
  const alturaFotoSim = "h-36";
  const panelMotivoRef = React.useRef(null);
  const scrollContenedorRef = React.useRef(null); // NUEVO: referencia al contenedor scrollable del modal
  const mensajeEstadoRef = React.useRef(null); // NUEVO: referencia al mensaje de estado (debajo del panel)
  const wrapperPanelRef = React.useRef(null); // NUEVO: referencia al wrapper con la transición grid-rows
const MOTIVOS_CORRECCION = [
  "Selfie borrosa",
  "Selfie no coincide",
  "Carnet ilegible",
  "Carnet vencido",
  "Datos no coinciden",
  "Foto incompleta",
];

  const cargarAdvertenciasReales = async () => {
    if (!ciudadano?.id) return;
    try {
      const { data: alertas, error: alertasError } = await supabase
        .from("alerta")
        .select("id_alerta")
        .eq("id_usuario", ciudadano.id);

      if (alertasError) throw alertasError;
      if (!alertas || alertas.length === 0) {
        setAdvertencias(0);
        return;
      }

      const idsAlertas = alertas.map((a) => a.id_alerta);
      let { count, error: desError } = await supabase
        .from("alerta_desestimada")
        .select("*", { count: "exact", head: true })
        .in("id_alerta", idsAlertas);

      if (desError) {
        const result = await supabase
          .from("alerta_desestimada")
          .select("*", { count: "exact", head: true })
          .in("alerta_id", idsAlertas);
        count = result.count;
        desError = result.error;
      }

      if (desError) throw desError;
      setAdvertencias(count || 0);
    } catch (error) {
      console.error("Error al cargar advertencias reales:", error);
      setAdvertencias(ciudadano?.advertencias || 0);
    }
  };

  useEffect(() => {
    if (ciudadano) {
      setCargandoPerfil(true);
      setEstadoActual(ciudadano.id_estado_ciudadano || 1);
      cargarAdvertenciasReales().finally(() => setCargandoPerfil(false));
    }
  }, [ciudadano]);

  if (!ciudadano) return null;

  const SUPABASE_URL = "https://rkmcak1svwqrtpprsymv.supabase.co";
  const resolverUrlFoto = (url, bucket) => {
    if (!url) return null;
    if (url.includes("storage.test")) {
      const nombreArchivo = url.split("/").pop();
      return `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${nombreArchivo}`;
    }
    return url;
  };
  const urlSelfie = resolverUrlFoto(ciudadano.selfie, "selfie");
  const urlFotoCi = resolverUrlFoto(ciudadano.foto_ci, "foto_carnet");

  const fechaFormateada = ciudadano.fecha_registro
    ? new Date(ciudadano.fecha_registro).toLocaleDateString("es-ES", {
        day: "2-digit", month: "long", year: "numeric",
      })
    : "—";

  const obtenerNombreEstado = (idEstado) => {
    const estados = {
      1: "No verificado",
      2: "Verificado",
      3: "Advertido",
      4: "Suspendido",
      5: "Correccion",
    };
    return estados[idEstado] || "Desconocido";
  };

  const mostrarEstado = () => obtenerNombreEstado(estadoActual);

  // Color del punto de estado sobre el ícono (mismo patrón que el punto de
  // conectado/desconectado en PerfilOficial)
  const estadoColorHex = () => {
    switch (estadoActual) {
      case 2: return "#0974e0"; // verificado
      case 1: return "#9da1a3"; // no verificado
      case 3: return "#d7650d"; // advertido
      case 4: return "#C90A0A"; // suspendido
      case 5: return "#EBB615"; // corrección
      default: return "#94a3b8";
    }
  };

  const registrarHistorialEstado = async (nuevoEstadoId, motivo = null) => {
    try {
      const { error } = await supabase.from("historial_estado_ciudadano").insert([
        {
          id_ciudadano: ciudadano.id,
          id_estado: nuevoEstadoId,
          motivo: motivo,
          fecha_cambio: new Date().toISOString(),
        },
      ]);
      if (error) console.error("Error al guardar historial:", error);
    } catch (err) {
      console.error("Error en historial:", err);
    }
  };

  const handleVerificar = async () => {
    if (estadoActual === 2) {
      showToast("El ciudadano ya está verificado", "error");
      return;
    }
    setGuardando(true);
    try {
      const nuevoEstadoId = 2;
      const { error: updateError } = await supabase
        .from("usuario_ciudadano")
        .update({ id_estado_ciudadano: nuevoEstadoId })
        .eq("id_usuario", ciudadano.id);
      if (updateError) throw updateError;

      await registrarHistorialEstado(nuevoEstadoId, "Verificación de cuenta");
      await supabase.from("log_actividad").insert([{
        id_oficial: usuarioActual?.id_oficial || null,
        id_alerta: null,
        accion: "ADMINISTRADOR",
        descripcion: `Habilitó suspensión de ${ciudadano.nombre} (REGC-${String(ciudadano.id).padStart(4, "0")}) — advertencias eliminadas`,
      }]);
      setEstadoActual(nuevoEstadoId);
      showToast(`${ciudadano.nombre} verificado correctamente`, "success");
      if (onActualizar) onActualizar();
      await cargarAdvertenciasReales();
    } catch (error) {
      console.error(error);
      showToast("Error al verificar ciudadano", "error");
    } finally {
      setGuardando(false);
    }
  };

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
      // Ajuste instantáneo (sin "smooth") por si quedó un resto de píxeles,
      // así no compite con el scroll que ya venía moviéndose y no genera salto.
      if (abriendo) {
        contenedor.scrollTop = contenedor.scrollHeight;
      }
    }, 600);
  };

  const handleCorregir = () => {
    setMotivoCorreccion("");
    setMotivoPersonalizado("");
    setMostrarPanelMotivo((prev) => {
      const abriendo = !prev;
      requestAnimationFrame(() => sincronizarScrollConPanel(abriendo));
      return abriendo;
    });
  };

  const handleCancelarCorreccion = () => {
    requestAnimationFrame(sincronizarScrollConPanel);
    setMostrarPanelMotivo(false);
  };

  const handleConfirmarCorreccion = async () => {
    if (!motivoCorreccion) {
      showToast("Selecciona un motivo de corrección", "error");
      return;
    }
    if (!motivoPersonalizado.trim()) {
      showToast("Completa la justificación adicional", "error");
      return;
    }

    const motivoFinal = `${motivoCorreccion} — ${motivoPersonalizado.trim()}`;
    setGuardando(true);
    setMostrarPanelMotivo(false);
    try {
      const nuevoEstadoId = 5;
      const { error: updateError } = await supabase
        .from("usuario_ciudadano")
        .update({ id_estado_ciudadano: nuevoEstadoId, motivo_rechazo: motivoFinal })
        .eq("id_usuario", ciudadano.id);
      if (updateError) throw updateError;

      await registrarHistorialEstado(nuevoEstadoId, motivoFinal);
      await supabase.from("log_actividad").insert([{
        id_oficial: usuarioActual?.id_oficial || null,
        id_alerta: null,
        accion: "CORRIGIO",
        descripcion: `Solicitó corrección a ${ciudadano.nombre} (REGC-${String(ciudadano.id).padStart(4, "0")}) — Motivo: ${motivoFinal}`,
      }]);
      setEstadoActual(nuevoEstadoId);
      showToast(`Corrección enviada a ${ciudadano.nombre} correctamente`, "success");
      if (onActualizar) onActualizar();
      await cargarAdvertenciasReales();
    } catch (error) {
      console.error(error);
      showToast("Error al marcar para corrección", "error");
    } finally {
      setGuardando(false);
    }
  };

  const handleHabilitarSuspension = async () => {
    if (estadoActual !== 4) {
      showToast("El ciudadano no está suspendido", "error");
      return;
    }
    setGuardando(true);
    try {
      const { data: alertas, error: alertasError } = await supabase
        .from("alerta")
        .select("id_alerta")
        .eq("id_usuario", ciudadano.id);
      if (alertasError) throw alertasError;

      if (alertas && alertas.length > 0) {
        const idsAlertas = alertas.map((a) => a.id_alerta);
        const { error: deleteError } = await supabase
          .from("alerta_desestimada")
          .delete()
          .in("id_alerta", idsAlertas);
        if (deleteError) {
          const { error: deleteError2 } = await supabase
            .from("alerta_desestimada")
            .delete()
            .in("alerta_id", idsAlertas);
          if (deleteError2) throw deleteError2;
        }
      }

      const nuevoEstadoId = 2;
      const { error: updateError } = await supabase
        .from("usuario_ciudadano")
        .update({ id_estado_ciudadano: nuevoEstadoId })
        .eq("id_usuario", ciudadano.id);
      if (updateError) throw updateError;

      await registrarHistorialEstado(nuevoEstadoId, "Habilitación de suspensión - Se eliminaron las advertencias");
      await supabase.from("log_actividad").insert([{
        id_oficial: usuarioActual?.id_oficial || null,
        id_alerta: null,
        accion: "HABILITO_SUSPENSION",
        descripcion: `Habilitó suspensión de ${ciudadano.nombre} (REGC-${String(ciudadano.id).padStart(4, "0")}) — advertencias eliminadas`,
      }]);
      setEstadoActual(nuevoEstadoId);
      setAdvertencias(0);
      showToast(`${ciudadano.nombre} habilitado — advertencias eliminadas`, "success");
      if (onActualizar) onActualizar();
    } catch (error) {
      console.error(error);
      showToast("Error al habilitar suspensión", "error");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
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

<div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-auto overflow-hidden flex flex-col h-fit max-h-[92vh] animate-[modalPopIn_0.35s_cubic-bezier(0.16,1,0.3,1)]">
          {/* Barra verde */}
          <div className="relative bg-[#474b29] py-4 shrink-0 flex items-center pl-24 pr-4">
            <div>
              <h2 className="text-white text-[17px] font-bold uppercase tracking-wider leading-none ml-1">
                Perfil Ciudadano
              </h2>
              <p className="text-[11px] font-bold text-white/70 uppercase tracking-wider mt-2 ml-1">
                REGC-{String(ciudadano.id).padStart(4, "0")} · {mostrarEstado()}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="absolute top-3 right-3 hover:bg-white/20 p-1.5 rounded-md transition-colors text-white"
            >
              <FaTimes size={15} />
            </button>
          </div>

          {/* Ícono cuadrado, sobresaliendo de la barra */}
          <div className="relative pl-4 pt-2 pb-6 shrink-0">
            <div className="relative w-16 h-16 -mt-12 ml-2">
              <div className="w-16 h-16 rounded-xl bg-[#474b29] border-[3px] border-white shadow-lg flex items-center justify-center">
                <FaUsers className="text-white" size={26} />
              </div>
              <span
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: estadoColorHex() }}
              />
            </div>
          </div>

          <div ref={scrollContenedorRef} className="overflow-y-auto scroll-hover max-h-[650px] px-6 pb-4 pt-1 bg-white">
            {cargandoPerfil ? (
              <PerfilCiudadanoSkeleton />
            ) : (
              <>
            {/* Datos en formato de tarjetas tipo "textbox" */}
            <div className="mt-1 grid grid-cols-2 gap-x-7 gap-y-5">
              <div className="col-span-2">
                <Fila label="Nombre completo" value={ciudadano.nombre} />
              </div>
              <Fila label="Cédula de identidad" value={ciudadano.ci} />
              <Fila label="Celular" value={ciudadano.celular} />
              <Fila label="Fecha de registro" value={fechaFormateada} />
              <Fila label="Estado del ciudadano" value={mostrarEstado()} />
              {ciudadano.email && (
                <div className="col-span-2">
                  <Fila label="Correo electrónico" value={ciudadano.email} />
                </div>
              )}
            </div>

            {/* Contador de advertencias — solo relevante si el estado fue causado por advertencias */}
            {(estadoActual === 3 || estadoActual === 4) && (
              <div className="mt-7 flex items-center justify-between bg-orange-50/70 border border-orange-500/10 rounded-xl px-4 py-3.5">
                <div className="flex items-center gap-3">
                  <div>
                    <p className="text-[14px] font-semibold uppercase text-[#e78e1a] tracking-wider leading-none">Advertencias</p>
                    <p className="text-[11px] font-medium text-slate-600/60 tracking-wide mt-1">Alertas desestimadas</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[19px] tracking-widest font-medium text-orange-600 leading-none">{advertencias}</span>
                  <span className="text-[13px] mt-1 tracking-widest font-medium text-[#e78e1a]">/3</span>
                </div>
              </div>
            )}

            {/* Documentos de Verificación */}
            <div className="md:col-span-2 mt-7 pt-2 border-t border-slate-200 ">
              <h4 className="text-[14px] font-medium uppercase text-slate-600 tracking-wider">
                Documentos de Verificación
              </h4>
              <div className="grid grid-cols-2 gap-5 mt-2 uppercase">
                <div className="space-y-1 mt-2">
                  <p className="text-[11px] text-slate-400 font-medium tracking-wider mb-1.5">Selfie</p>
                  {urlSelfie ? (
                    <div
                      onClick={() => setFotoAmpliada(urlSelfie)}
                      className={`relative w-full ${alturaFotoSim} rounded-lg border border-slate-200 overflow-hidden transition-colors cursor-pointer`}
                      onMouseEnter={(e) => {
                        const img = e.currentTarget.querySelector("img");
                        if (img) img.style.transform = "scale(1.08)";
                      }}
                      onMouseLeave={(e) => {
                        const img = e.currentTarget.querySelector("img");
                        if (img) img.style.transform = "scale(1)";
                      }}
                    >
                      <img
                        src={urlSelfie}
                        alt="Selfie"
                        style={{ transition: "transform 0.2s ease" }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`flex items-center justify-center w-full ${alturaFotoSim} border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400 text-center`}>
                      Sin foto
                    </div>
                  )}
                </div>
                <div className="space-y-1 mt-2">
                  <p className="text-[11px] text-slate-400 font-medium tracking-wider mb-1.5">Foto Carnet (CI)</p>
                  {urlFotoCi ? (
                    <div
                      onClick={() => setFotoAmpliada(urlFotoCi)}
                      className={`relative w-full ${alturaFotoSim} rounded-lg border border-slate-200 overflow-hidden transition-colors cursor-pointer`}
                      onMouseEnter={(e) => {
                        const img = e.currentTarget.querySelector("img");
                        if (img) img.style.transform = "scale(1.08)";
                      }}
                      onMouseLeave={(e) => {
                        const img = e.currentTarget.querySelector("img");
                        if (img) img.style.transform = "scale(1)";
                      }}
                    >
                      <img
                        src={urlFotoCi}
                        alt="Foto CI"
                        style={{ transition: "transform 0.2s ease" }}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className={`flex items-center justify-center w-full ${alturaFotoSim} border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400 text-center`}>
                      Sin foto
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Panel de motivo de corrección (estados 1 y 5) — ancla arriba, se despliega hacia abajo */}
            {(estadoActual === 1 || estadoActual === 5) && (
              <div
                ref={wrapperPanelRef}
                className={`grid transition-all duration-500 ease-in-out ${
                  mostrarPanelMotivo
                    ? "grid-rows-[1fr] opacity-100"
                    : "grid-rows-[0fr] opacity-0"
                }`}
              >
                <div className="overflow-hidden">
                  <div
                    ref={panelMotivoRef}
                    className="pt-2 mt-7 border-t border-slate-200 flex flex-col gap-5 w-full"
                  >
                    <div>
                      <h4 className="text-[14px] font-medium uppercase text-slate-600 tracking-wider mt-2">
                        Motivo de corrección
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-5">
                        {MOTIVOS_CORRECCION.map((motivo) => (
                          <label
                            key={motivo}
                            className={`flex items-center gap-2 px-3 py-3 rounded-xl border text-[12px] text-slate-500 cursor-pointer transition-colors font-medium tracking-wider ${
                              motivoCorreccion === motivo
                                ? "border-[#474b29] bg-[#474b29]/5"
                                : "border-slate-200 hover:bg-slate-50"
                            }`}
                          >
                            <input
                              type="radio"
                              name="motivoCorreccion"
                              className="accent-[#474b29] w-3.5 h-3.5 cursor-pointer shrink-0"
                              checked={motivoCorreccion === motivo}
                              onChange={() => setMotivoCorreccion(motivo)}
                            />
                            <span className="leading-tight">{motivo}</span>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* Justificación — siempre visible y obligatoria, mismo estilo que DetalleAlerta */}
                    <div>
                      <label className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 min-h-[14px] leading-tight">
                        Justificación adicional
                      </label>
                      <div className="relative border border-slate-200 rounded-xl px-3.5 py-3 focus-within:border-slate-300">
                        <textarea
                          className="block w-full min-h-[44px] text-[12px] text-slate-500 font-medium bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 resize-y tracking-wider"
                          placeholder="Agregue el detalle de la corrección (obligatorio)"
                          value={motivoPersonalizado}
                          onChange={(e) => setMotivoPersonalizado(e.target.value)}
                          required
                        />
                        {motivoPersonalizado && (
                          <button
                            type="button"
                            onClick={() => setMotivoPersonalizado("")}
                            className="absolute top-2.5 sm:top-3 right-3 text-slate-400 hover:text-slate-500 transition-colors"
                            title="Limpiar justificación"
                          >
                            <FaTimes size={11} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Mensaje de estado — DENTRO del contenedor scrollable, justo debajo del panel de motivo */}
            {(estadoActual === 1 || estadoActual === 2 || estadoActual === 3 || estadoActual === 4 || estadoActual === 5) && (
              <div className="mt-7 space-y-2 -mb-2.5">
                {estadoActual === 2 && (
                  <div className="flex items-center gap-3 bg-blue-100/20 border-l-4 border-[#0172e3] rounded-xl px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-medium text-[#0066cc] tracking-wider uppercase leading-snug">
                      Cuenta verificada correctamente
                    </p>
                  </div>
                )}
                {estadoActual === 3 && (
                  <div className="flex items-center gap-3 bg-orange-50/50 border-l-4 border-orange-500 rounded-xl px-4 py-3 shadow-sm">

                    <p className="text-[11px] font-medium text-[#e78e1a] tracking-wider uppercase leading-snug">
                      Ciudadano con reportes malintencionados
                    </p>
                  </div>
                )}
                {estadoActual === 4 && (
                  <div className="flex items-center gap-3 bg-red-50/40 border-l-4 border-[#C90A0A] rounded-xl px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-medium text-[#C90A0A] tracking-wider uppercase leading-snug">
                      Suspendido por acumulación de advertencias
                    </p>
                  </div>
                )}
                {estadoActual === 1 && (
                  <div className="flex items-center gap-3 bg-slate-50 border-l-4 border-slate-400 rounded-xl px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-medium text-slate-600 tracking-wider uppercase leading-snug">
                      Cuenta pendiente de verificación
                    </p>
                  </div>
                )}
                {estadoActual === 5 && (
                  <div className="flex items-center gap-3 bg-[#fff5d8]/20 border-l-4 border-[#EBB615] rounded-xl px-4 py-3 shadow-sm">
                    <p className="text-[11px] font-medium text-[#EBB615] tracking-wider uppercase leading-snug">
                      Requiere corrección de datos (fotos o información)
                    </p>
                  </div>
                )}
              </div>
            )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 px-5 sm:px-6 py-3 border-t border-slate-200 flex justify-end gap-3.5 shrink-0 bg-slate-50">
            {/* Estados 1 y 5: flujo de corrección/verificación */}
            {(estadoActual === 1 || estadoActual === 5) && (
              <>
                {mostrarPanelMotivo ? (
                  <>
                    <button
                      onClick={handleCancelarCorreccion}
                      disabled={guardando}
                      className="px-4 py-2.5 rounded-lg font-medium text-[11.5px] uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleConfirmarCorreccion}
                      disabled={guardando || !motivoCorreccion || !motivoPersonalizado.trim()}
                      className="px-8 py-2.5 rounded-lg font-medium text-[11.5px] bg-[#474b29] uppercase hover:bg-[#3a3e21] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed tracking-wider flex items-center justify-center gap-2"
                    >
                      Confirmar corrección
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleCorregir}
                      disabled={guardando}
                      className="px-4 py-2.5 rounded-lg font-medium text-[11.5px] uppercase tracking-wider transition-colors disabled:opacity-40 disabled:cursor-not-allowed border border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200"
                    >
                      Corregir
                    </button>
                    <button
                      onClick={handleVerificar}
                      disabled={guardando}
                      className="px-8 py-2.5 rounded-lg font-medium text-[11.5px] bg-[#474b29] uppercase hover:bg-[#3a3e21] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed tracking-wider flex items-center justify-center gap-2"
                    >
                      {estadoActual === 5 ? "Verificar corrección" : "Verificar"}
                    </button>
                  </>
                )}
              </>
            )}

            {/* Estados 2 (Verificado) y 3 (Advertido): solo cerrar */}
            {(estadoActual === 2 || estadoActual === 3) && (
              <button
                onClick={onClose}
                className="px-4 py-2.5 rounded-lg font-medium text-[11.5px] border uppercase border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors tracking-wider"
              >
                Cerrar
              </button>
            )}

            {/* Estado 4 (Suspendido): cerrar + reactivar cuenta */}
            {estadoActual === 4 && (
              <>
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-lg font-medium text-[11.5px] border uppercase border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors tracking-wider"
                >
                  Cerrar
                </button>
                <button
                  onClick={handleHabilitarSuspension}
                  disabled={guardando}
                  className="px-8 py-2.5 rounded-lg font-medium text-[11.5px] bg-[#474b29] uppercase hover:bg-[#3a3e21] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed tracking-wider flex items-center justify-center gap-2"
                >
                  Reactivar cuenta
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal de foto ampliada */}
      {fotoAmpliada && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={() => setFotoAmpliada(null)}
        >
          <img
            src={fotoAmpliada}
            alt="Vista ampliada"
            className="max-w-[90vw] max-h-[90vh] rounded-2xl shadow-2xl object-contain"
          />
          <button
            onClick={() => setFotoAmpliada(null)}
            className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/40 rounded-full text-white transition-all"
          >
            <FaTimes size={18} />
          </button>
        </div>
      )}
    </>
  );
};

export default PerfilCiudadano;
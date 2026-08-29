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

// Campo tipo "ficha de reporte" — mismo componente que usa PerfilOficial
const Fila = ({ label, value }) => (
  <div className="space-y-1">
    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
      {label}
    </label>
    <div className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[12px] font-medium text-slate-600">
      {value || "—"}
    </div>
  </div>
);

const PerfilCiudadano = ({ ciudadano, onClose, onActualizar, usuarioActual = null }) => {
  const { showToast } = useToast();
  const [estadoActual, setEstadoActual] = useState(ciudadano?.id_estado_ciudadano || 1);
  const [advertencias, setAdvertencias] = useState(ciudadano?.advertencias || 0);
  const [guardando, setGuardando] = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);
  const [mostrarPanelMotivo, setMostrarPanelMotivo] = useState(false);
  const [motivoCorreccion, setMotivoCorreccion] = useState("");
  const [motivoPersonalizado, setMotivoPersonalizado] = useState("");

  const MOTIVOS_CORRECCION = [
    "La selfie no es clara o está borrosa",
    "La foto del carnet (CI) no es legible",
    "La selfie y la foto del carnet no coinciden",
    "Los datos personales no coinciden con el carnet",
    "El carnet está vencido o no es válido",
    "Otro motivo",
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
      setEstadoActual(ciudadano.id_estado_ciudadano || 1);
      cargarAdvertenciasReales();
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
      case 2: return "#0172e3"; // verificado
      case 1: return "#9da1a3"; // no verificado
      case 3: return "#c64114"; // advertido
      case 4: return "#C90A0A"; // suspendido
      case 5: return "#d97706"; // corrección
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

  const handleCorregir = () => {
    if (estadoActual === 5) {
      showToast("El ciudadano ya está en estado 'Corrección'", "error");
      return;
    }
    setMotivoCorreccion("");
    setMotivoPersonalizado("");
    setMostrarPanelMotivo((prev) => !prev);
  };

  const handleConfirmarCorreccion = async () => {
    const motivoFinal =
      motivoCorreccion === "Otro motivo"
        ? motivoPersonalizado.trim()
        : motivoCorreccion;

    if (!motivoFinal) {
      showToast("Selecciona o escribe un motivo", "error");
      return;
    }

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
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />

        <div className="relative bg-white rounded-lg shadow-2xl w-full max-w-lg mx-auto overflow-hidden flex flex-col h-fit max-h-[92vh] animate-fadeIn">
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
          <div className="relative pl-4 pt-2 pb-4 shrink-0">
            <div className="relative w-16 h-16 -mt-12 ml-2">
              <div className="w-16 h-16 rounded-2xl bg-[#474b29] border-[3px] border-white shadow-lg flex items-center justify-center">
                <FaUsers className="text-white" size={26} />
              </div>
              <span
                className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white"
                style={{ backgroundColor: estadoColorHex() }}
              />
            </div>
          </div>

          {/* Contenido scrolleable */}
          <div className="px-6 pb-4 overflow-y-auto">
            {/* Datos en formato de tarjetas tipo "textbox" */}
            <div className="mt-1 grid grid-cols-2 gap-x-7 gap-y-4">
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
{/* Contador de advertencias */}
<div className="mt-5 flex items-center justify-between bg-orange-50 border border-orange-600/20 border-l-4 border-l-orange-600 rounded-xl px-4 py-3.5">
  <div className="flex items-center gap-3">
    <div> 
      <p className="text-[11px] font-bold uppercase text-orange-700 tracking-wider leading-none">Advertencias</p>
      <p className="text-[10px] font-medium text-slate-500 tracking-wide mt-1">Alertas desestimadas</p>
    </div>
  </div>
  <div className="text-right">
    <span className="text-[18px] tracking-wider font-bold text-orange-600 leading-none">{advertencias}</span>
    <span className="text-[11px] font-medium text-orange-400">/3</span>
  </div>
</div>

            {/* Documentos de Verificación */}
            <div className="md:col-span-2 mt-5 pt-2 border-t border-slate-200">
              <p className="text-[12px] font-bold uppercase text-slate-500 tracking-wider mb-3">
                Documentos de Verificación
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 font-semibold tracking-wideR">Selfie</p>
                  {urlSelfie ? (
                    <div className="group relative overflow-hidden rounded-xl border border-slate-200 w-full h-32 shadow-md hover:shadow-lg transition-shadow duration-200">
                      <img
                        src={urlSelfie}
                        alt="Selfie"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <button
                          onClick={() => setFotoAmpliada(urlSelfie)}
                          className="bg-gray-200 hover:bg-slate-50 text-gray-800 py-1.5 px-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                        >
                          <FaEye size={12} /> Ver imagen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">
                      Sin foto
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] text-slate-400 font-semibold tracking-wideR">Foto Carnet (CI)</p>
                  {urlFotoCi ? (
                    <div className="group relative overflow-hidden rounded-xl border border-slate-200 w-full h-32 shadow-md">
                      <img
                        src={urlFotoCi}
                        alt="Foto CI"
                        className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                        <button
                          onClick={() => setFotoAmpliada(urlFotoCi)}
                          className="bg-gray-200 hover:bg-slate-50 text-gray-800 py-1.5 px-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
                        >
                          <FaEye size={12} /> Ver imagen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full h-32 rounded-xl bg-slate-50 border-2 border-dashed border-slate-200 flex items-center justify-center text-[10px] text-slate-400 font-bold uppercase">
                      Sin foto
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Panel compartido para estado 1 y 5 */}
          {(estadoActual === 1 || estadoActual === 5) && (
            <div className="border-t border-slate-200 shrink-0">
              {/* Botones principales */}
              <div className="p-4 bg-slate-50 flex gap-3 w-full">
                <button
                  onClick={handleVerificar}
                  disabled={guardando}
                  className="flex-1 py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-wider shadow-md hover:shadow-lg flex items-center justify-center gap-2 transition-all duration-200 bg-[#474b29] hover:bg-[#3a3e21] text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FaCheckCircle size={10} /> Verificar
                </button>
                <button
                  onClick={handleCorregir}
                  disabled={guardando}
                  className={`flex-1 py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-2 transition-all ${
                    mostrarPanelMotivo
                      ? "bg-yellow-600 text-white hover:bg-slate-200 hover:text-slate-700"
                      : "bg-slate-200 text-slate-600 hover:bg-yellow-600 hover:text-white"
                  }`}
                >
                  <FaEdit size={12} />
                  {estadoActual === 5 ? "Pedir corrección" : "Corregir"}
                </button>
              </div>

              {/* Panel desplegable de motivo */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  mostrarPanelMotivo ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <div className="px-4 pb-4 bg-slate-100 border-t border-slate-200 space-y-3 pt-3 rounded-xl p-4 shadow-md">
                  <p className="border-l-4 border-[#474b29] pl-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">
                    Motivo que verá el ciudadano en la app
                  </p>

                  {/* Opciones radio */}
                  <div className="space-y-1.5">
                    {MOTIVOS_CORRECCION.map((motivo) => (
                      <label
                        key={motivo}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-md border cursor-pointer transition-all p-2 text-[11px] font-semibold ${
                          motivoCorreccion === motivo
                            ? "bg-white border-slate-300 text-slate-700 shadow-sm"
                            : "text-slate-600 hover:bg-white hover:border-white"
                        }`}
                      >
                        <input
                          type="radio"
                          name="motivoCorreccion"
                          value={motivo}
                          checked={motivoCorreccion === motivo}
                          onChange={() => {
                            setMotivoCorreccion(motivo);
                            setMotivoPersonalizado("");
                          }}
                          className="accent-[#474b29] w-3.5 h-3.5 cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-slate-400">{motivo}</span>
                      </label>
                    ))}
                  </div>

                  {/* Textarea si elige "Otro motivo" */}
                  {motivoCorreccion === "Otro motivo" && (
                    <textarea
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-lg font-bold text-[11px] text-slate-600 outline-none focus:border-slate-300 resize-none transition-all"
                      placeholder="Describe el motivo de corrección..."
                      value={motivoPersonalizado}
                      onChange={(e) => setMotivoPersonalizado(e.target.value)}
                      maxLength={200}
                    />
                  )}

                  {/* Botón confirmar */}
                  <button
                    onClick={handleConfirmarCorreccion}
                    disabled={
                      guardando ||
                      !motivoCorreccion ||
                      (motivoCorreccion === "Otro motivo" && !motivoPersonalizado.trim())
                    }
                    className="w-full py-3 rounded-xl font-bold uppercase text-[11px] tracking-wider bg-[#474b29] hover:bg-[#3a3e21] text-white shadow-md transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    <FaEdit size={10} /> Confirmar corrección
                  </button>
                </div>
              </div>
            </div>
          )}

          {estadoActual === 4 && (
            <div className="px-6 pb-4 pt-1 bg-white shrink-0">
              <button
                onClick={handleHabilitarSuspension}
                disabled={guardando}
                className="w-full py-3.5 rounded-lg font-bold uppercase text-[11px] tracking-wider shadow-md flex items-center justify-center gap-2 transition-all bg-[#0C3DC2] hover:bg-blue-700 text-white"
              >
                <FaBan size={12} /> Habilitar suspensión
              </button>
            </div>
          )}

{/* Mensajes de estado adicionales */}
<div className="px-6 pb-4 bg-white space-y-2 shrink-0">
{estadoActual === 3 && (
    <div className="flex items-center gap-3 bg-orange-50 border-l-4 border-orange-400 rounded-xl px-4 py-3 shadow-sm">
      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
        <FaExclamationTriangle size={13} />
      </div>
      <p className="text-[10.5px] font-bold text-orange-700 tracking-wide uppercase leading-snug">
        Ciudadano con reportes malintencionados
      </p>
    </div>
  )}
  {estadoActual === 4 && (
    <div className="flex items-center gap-3 bg-red-50 border-l-4 border-[#C90A0A] rounded-xl px-4 py-3 shadow-sm">
      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center text-[#C90A0A] shrink-0">
        <FaBan size={13} />
      </div>
      <p className="text-[10.5px] font-bold text-[#C90A0A] tracking-wide uppercase leading-snug">
        Suspendido por acumulación de advertencias
      </p>
    </div>
  )}
  {estadoActual === 1 && (
    <div className="flex items-center gap-3 bg-slate-50 border-l-4 border-slate-400 rounded-xl px-4 py-3 shadow-sm">
      <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 shrink-0">
        <FaClock size={13} />
      </div>
      <p className="text-[10.5px] font-bold text-slate-600 tracking-wide uppercase leading-snug">
        Cuenta pendiente de verificación
      </p>
    </div>
  )}
  {estadoActual === 5 && (
    <div className="flex items-center gap-3 bg-yellow-50 border-l-4 border-yellow-500 rounded-xl px-4 py-3 shadow-sm">
      <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-700 shrink-0">
        <FaEdit size={13} />
      </div>
      <p className="text-[10.5px] font-bold text-yellow-700 tracking-wide uppercase leading-snug">
        Requiere corrección de datos (fotos o información)
      </p>
    </div>
  )}
</div>

          {/* Footer */}
          <div className="mt-1 flex justify-end gap-4 px-5 sm:px-6 py-3 border-t border-slate-200 bg-slate-50 shrink-0">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-[11.5px] border uppercase border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors tracking-wider"
            >
              Cerrar
            </button>
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
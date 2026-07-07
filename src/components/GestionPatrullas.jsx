import React, { useState, useEffect } from "react";
import { FaTruck, FaCheckCircle, FaRoute, FaFileImage, FaFile, FaEye } from "react-icons/fa";
import { supabase } from "../services/supabase";
import { useToast } from "../context/ToastContext";

//cambios actualizados

const ESTADO_DISPONIBLE = 1;
const ESTADO_NOTIFICADO = 2;
const ESTADO_EN_CAMINO  = 3;
const ESTADO_EN_LUGAR   = 4;
const ESTADO_REVISION   = 5;

export const GestionPatrullas = ({
  tabActiva,
  patrulleros,
  alertaSeleccionada,
  alertaActual,
  pendingAsignaciones,
  asignaciones,
  onDespachar,
  onCancelarAsignaciones,
  onFinalizarAsignacion,
  onCargarRuta,
  onDerivar,
  onEnviarATabulacion,
  idOficialActual,
}) => {
  const { showToast } = useToast();
  const isNuevas = tabActiva === "nuevas";
  const [instituciones, setInstituciones] = useState([]);
  const [Derivacion, setDerivacion] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const { data, error } = await supabase
        .from("instituciones")
        .select("id, nombre")
        .order("nombre");
      if (!error && data) setInstituciones(data);
      else
        setInstituciones([
  { id: 1, nombre: "FELCC (Fuerza Especial de Lucha Contra el Crimen)" },
  { id: 2, nombre: "FELCV (Fuerza Especial de Lucha Contra la Violencia)" },
  { id: 3, nombre: "FELCN (Fuerza Especial de Lucha Contra el Narcotráfico)" },
  { id: 4, nombre: "Defensoría de la Niñez y Adolescencia" },
  { id: 5, nombre: "SLIM (Servicio Legal Integral Municipal)" },
  { id: 6, nombre: "Tránsito" },
]);
    };
    cargar();
  }, []);

  useEffect(() => {
    setDerivacion("");
  }, [alertaSeleccionada]);

  const evidencias = alertaActual?.evidencias || [];
  const patrullasAsignadas = patrulleros.filter(
    (p) => asignaciones[p.id_patrullero] === alertaSeleccionada
  );

const handleEnviarTabulacion = async () => {
    if (!alertaSeleccionada) return;

    if (!alertaActual?.reportePatrullero) {
      showToast("Aún no se ha recibido el reporte policial. No es posible enviar a tabulación.", "error");
      return;
    }

    if (!Derivacion) {
      showToast("Debe seleccionar una opción de derivación (o 'Sin derivación') antes de continuar.", "error");
      return;
    }

    setEnviando(true);
    try {
      await supabase
        .from("alerta")
        .update({ id_estado_actual: 3 })
        .eq("id_alerta", alertaSeleccionada);

for (const p of patrullasAsignadas) {
  await supabase
    .from("asignacion_patrulla")
    .update({ id_estado_asignacion: ESTADO_DISPONIBLE })
    .eq("id_alerta", alertaSeleccionada)
    .eq("id_patrullero", p.id_patrullero);
await supabase
  .from("patrullero")
  .update({ id_estado_patrullero: ESTADO_DISPONIBLE })
  .eq("id_patrullero", p.id_patrullero);
}
      if (Derivacion) {
        await supabase
          .from("asignacion_patrulla")
          .update({ derivacion: Derivacion, derivacion_por: idOficialActual || null })
          .eq("id_alerta", alertaSeleccionada);
      }

await supabase.from("log_actividad").insert([{
        id_oficial: idOficialActual || null,
        id_alerta: alertaSeleccionada,
        accion: "DESPACHO",
        descripcion: `Derivó la alerta a ${Derivacion}`,
      }]);
      
      showToast("Alerta enviada a tabulación correctamente", "success");
      if (onEnviarATabulacion) onEnviarATabulacion();
    } catch (err) {
      console.error("Error enviando a tabulación:", err);
      showToast("Error al enviar a tabulación", "error");
    } finally {
      setEnviando(false);
    }
  };

  const renderEvidencia = (ev, idx) => {
    const tipo = ev.tipo_evidencia || "";
    const esImagen =
      tipo.startsWith("image") ||
      ["jpg", "jpeg", "png", "webp", "gif"].some((ext) =>
        ev.archivo?.toLowerCase().endsWith(ext)
      );
    const esVideo =
      tipo.startsWith("video") ||
      ["mp4", "mov", "avi", "webm"].some((ext) =>
        ev.archivo?.toLowerCase().endsWith(ext)
    );

    let preview;
    if (esImagen) {
      preview = (
        <img
          src={ev.archivo}
          alt={`Evidencia ${idx + 1}`}
          className="w-full h-28 object-cover rounded-md transition-transform duration-200 group-hover:scale-105"
        />
      );
    } else if (esVideo) {
      preview = (
        <video
          src={ev.archivo}
          controls
          className="w-full h-28 object-cover rounded-md"
        />
      );
    } else {
      preview = (
        <div className="w-full h-28 bg-slate-100 flex items-center justify-center rounded-md">
          <FaFile size={32} className="text-slate-400" />
        </div>
      );
    }

    if (esVideo) {
      return (
        <div
          key={idx}
          className="border border-slate-200 shadow-md rounded-md p-2 bg-white"
        >
          {preview}
        </div>
      );
    }

    return (
      <div
        key={idx}
        className="border border-slate-200 shadow-md rounded-md p-2 bg-white group relative"
      >
        <div className="relative overflow-hidden rounded-md">
          {preview}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
            <a
              href={ev.archivo}
              target="_blank"
              rel="noreferrer"
              className="bg-gray-200 hover:bg-slate-50 text-gray-800 py-1.5 px-2 rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all shadow-md hover:shadow-lg"
            >
              <FaEye size={12} /> Ver imagen
            </a>
          </div>
        </div>
      </div>
    );
  };

  // Función para obtener el color y texto del estado (para el botón y para el borde)
  const getEstadoInfo = (p) => {
    if (!p.activo) return { texto: "NO CONECTADO", claseBtn: "bg-gray-300 text-gray-500 cursor-not-allowed", borde: "border-gray-300", deshab: true };
    switch (p.id_estado) {
      case ESTADO_DISPONIBLE:
        return {
          texto: pendingAsignaciones[p.id_patrullero] === alertaSeleccionada ? "SELECCIONADA" : "DESPACHAR",
          claseBtn: alertaSeleccionada ? "bg-[#164a2f] hover:bg-green-900 text-white" : "bg-slate-300 text-white cursor-not-allowed",
          borde: "border-green-800",
          deshab: !alertaSeleccionada
        };
      case ESTADO_NOTIFICADO:
        return { texto: "NOTIFICADO", claseBtn: "bg-blue-600 text-white cursor-not-allowed", borde: "border-blue-600", deshab: true };
      case ESTADO_EN_CAMINO:
        return { texto: "EN CAMINO", claseBtn: "bg-orange-600 text-white cursor-not-allowed", borde: "border-orange-600", deshab: true };
      case ESTADO_EN_LUGAR:
        return { texto: "EN EL LUGAR", claseBtn: "bg-purple-700 text-white cursor-not-allowed", borde: "border-purple-700", deshab: true };
      case ESTADO_REVISION:
        return { texto: "EN REVISIÓN", claseBtn: "bg-gray-600 text-white cursor-not-allowed", borde: "border-gray-600", deshab: true };
      default:
        return { texto: "NO DISPONIBLE", claseBtn: "bg-slate-300 text-white cursor-not-allowed", borde: "border-slate-300", deshab: true };
    }
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200 relative z-0 mt-3">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[15px] font-black uppercase flex items-center gap-2 tracking-tight text-[#1e293b]">
          <span className="w-7 h-7 flex items-center justify-center bg-green-50 rounded-md">
            <FaTruck className="text-[#164a2f]" size={16} />
          </span>
          {isNuevas ? "Gestión de Patrullas" : "Seguimiento de Intervención"}
        </h3>
        {isNuevas && alertaSeleccionada && (
          <div className="bg-gray-50 text-gray-500 px-3 py-1.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider border border-gray-200">
            {Object.keys(pendingAsignaciones).length} seleccionada(s)
          </div>
        )}
      </div>

      {isNuevas ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-1">
            {patrulleros.map((p) => {
              const pendiente =
                alertaSeleccionada &&
                pendingAsignaciones[p.id_patrullero] === alertaSeleccionada;
              const asignada =
                asignaciones[p.id_patrullero] === alertaSeleccionada;
              const resaltar = pendiente || asignada;
              const estadoInfo = getEstadoInfo(p);
              const fueraServicio = !p.activo;
              const estadoBadge = fueraServicio
                ? "INACTIVO"
                : p.estado_disponibilidad || "—";

              const bordeClase = estadoInfo.borde;

              return (
                <div
                  key={p.id_patrullero}
                  className={`h-32 p-3 rounded-lg border shadow-md transition-all ${bordeClase} ${
                    resaltar ? "bg-blue-50/30" : fueraServicio ? "bg-slate-50/30 opacity-60" : "bg-slate-50/50"
                  }`}
                >
                  <div className="flex justify-between items-start mt-1">
                    <span className="text-[11px] font-extrabold tracking-wider text-slate-400 uppercase">
                      {p.placa || "S/P"}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        fueraServicio
                          ? "bg-gray-400"
                          : p.id_estado === ESTADO_DISPONIBLE
                          ? "bg-green-800"
                          : p.id_estado === ESTADO_NOTIFICADO
                          ? "bg-blue-600 animate-pulse"
                          : p.id_estado === ESTADO_EN_CAMINO
                          ? "bg-orange-600 animate-pulse"
                          : p.id_estado === ESTADO_EN_LUGAR
                          ? "bg-purple-700 animate-pulse"
                          : p.id_estado === ESTADO_REVISION
                          ? "bg-gray-500 animate-pulse"
                          : ""
                      }`}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-[#1e293b] leading-tight truncate mt-4 tracking-wide">
                    {p.nombre_oficial}
                  </p>
                  <p
                    className={`text-[8px] font-bold uppercase mt-0.5 tracking-wider ${
                      fueraServicio ? "text-gray-300" : "text-slate-400"
                    }`}
                  >
                    {estadoBadge}
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      disabled={estadoInfo.deshab || fueraServicio}
                      onClick={() => onDespachar(p.id_patrullero)}
                      className={`flex-1 py-1.5 text-[11px] font-bold tracking-wider rounded-md uppercase transition-all shadow active:scale-95 ${estadoInfo.claseBtn}`}
                    >
                      {estadoInfo.texto}
                    </button>
                    {/* Botón de ruta eliminado */}
                  </div>
                </div>
              );
            })}
            {patrulleros.length === 0 && (
              <p className="col-span-4 text-center text-slate-400 text-[11px] py-4">
                No se encontraron unidades registradas
              </p>
            )}
          </div>

          {alertaSeleccionada &&
            Object.keys(pendingAsignaciones).length > 0 && (
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={onCancelarAsignaciones}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-500 px-4 py-2 rounded-lg font-extrabold text-[11px] uppercase"
                >
                  CANCELAR
                </button>
                <button
                  onClick={onFinalizarAsignacion}
                  className="bg-[#113e27] hover:bg-[#164a2f] text-white px-4 py-2.5 rounded-lg font-bold text-[11px] uppercase flex items-center gap-1 shadow tracking-wider"
                >
                  <FaCheckCircle size={10} /> FINALIZAR ASIGNACIÓN
                </button>
              </div>
            )}
        </>
      ) : (
        alertaSeleccionada ? (
          <div className="flex flex-col lg:flex-row items-stretch gap-4">
  {/* COLUMNA IZQUIERDA */}
  <div className="flex-1 min-w-0 flex flex-col gap-4">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Patrullas asignadas
                </p>
                {patrullasAsignadas.length > 0 ? (
                  <div className="space-y-2">
                    {patrullasAsignadas.map((p) => {
                      let badge = !p.activo
                        ? "INACTIVO"
                        : p.estado_disponibilidad || "—";
                      let estadoColor = "";
                      if (!p.activo) estadoColor = "text-gray-400";
                      else if (p.id_estado === ESTADO_EN_LUGAR) estadoColor = "text-purple-600";
                      else if (p.id_estado === ESTADO_EN_CAMINO) estadoColor = "text-yellow-600";
                      else if (p.id_estado === ESTADO_NOTIFICADO) estadoColor = "text-blue-600";
                      else if (p.id_estado === ESTADO_REVISION) estadoColor = "text-gray-500";
                      else estadoColor = "text-slate-400";
                      return (
                        <div
                          key={p.id_patrullero}
                          className="flex items-center justify-between p-2.5 bg-slate-50 rounded-md shadow-sm border border-slate-200"
                        >
                          <div className="min-w-0">
                            <p className="text-[11px] font-extrabold text-[#1e293b] uppercase tracking-wider">
                              {p.placa
                                ? `PAT-${p.placa}`
                                : `PAT-${p.id_patrullero}`}
                            </p>
                            <p className={`text-[11px] font-extrabold uppercase ${estadoColor}`}>
                              {badge}
                            </p>
                          </div>
                          <div
                            className={`w-2.5 h-2.5 rounded-full shrink-0 ml-2 ${
                              p.id_estado === ESTADO_EN_LUGAR
                                ? "bg-purple-500 animate-pulse"
                                : p.id_estado === ESTADO_EN_CAMINO
                                ? "bg-yellow-500 animate-pulse"
                                : p.id_estado === ESTADO_NOTIFICADO
                                ? "bg-blue-500 animate-pulse"
                                : p.id_estado === ESTADO_REVISION
                                ? "bg-gray-500 animate-pulse"
                                : ""
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 tracking-wider">
                    Sin unidades asignadas
                  </p>
                )}
              </div>

              <div className="border-t border-slate-100 my-4"></div>

              <div className="mt-0">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                  Reporte del patrullero
                </p>
                <div className="p-3 bg-slate-50 rounded-md border border-slate-200 min-h-[100px] shadow-sm overflow-y-auto">
                  {alertaActual?.reportePatrullero ? (
                    <p className="text-sm text-slate-700 leading-relaxed">
                      {alertaActual.reportePatrullero}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 italic">
                      Sin reporte enviado aún.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mt-0">
  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
    Derivar (opcional)
  </p>
<select
  value={Derivacion}
  onChange={async (e) => {
    const valor = e.target.value;
    console.log("idOficialActual:", idOficialActual);
    setDerivacion(valor);
    if (alertaSeleccionada) {
      await supabase
        .from("asignacion_patrulla")
        .update({
          derivacion: valor,
          derivacion_por: idOficialActual || null,
        })
        .eq("id_alerta", alertaSeleccionada);
    }
  }}
  className="w-full text-sm font-semibold border border-slate-200 rounded-md shadow-sm bg-white text-slate-500 appearance-none focus:border-slate-300 transition-all h-12 p-2.5 pr-8 text-[12px] outline-none"
>
    <option value="">Seleccionar derivación</option>
    <option value="SIN DERIVACIÓN">Sin derivación</option>
    {instituciones.map((inst) => (
      <option key={inst.id} value={inst.nombre}>
        {inst.nombre}
      </option>
    ))}
  </select>

  <div className="">
    <button
      onClick={handleEnviarTabulacion}
      disabled={enviando || !alertaActual?.reportePatrullero}
      className={`mt-4 w-full h-11 py-2.5 rounded-lg font-bold text-[11px] uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all ${
        alertaActual?.reportePatrullero 
          ? 'bg-[#113e27] hover:bg-[#164a2f] text-white' 
          : 'bg-gray-300 text-white cursor-not-allowed'
      }`}
    >
      <FaCheckCircle size={11} />
      {enviando 
        ? "Enviando..." 
        : alertaActual?.reportePatrullero 
          ? "ENVIAR ALERTA A TABULACIÓN" 
          : "ESPERANDO REPORTE DEL PATRULLERO"}
    </button>
  </div>
</div>
            </div>

            <div className="mx-6 flex flex-col gap-5 border border-slate-100"></div>

            {/* COLUMNA DERECHA (evidencias) */}
            <div className="w-full lg:w-72 shrink-0">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                Evidencias
                <span>({evidencias.length})</span>
              </p>
              {evidencias.length > 0 ? (
                <div className="h-[338px] overflow-y-auto pr-2 custom-scroll space-y-3">
                  {evidencias.map((ev, idx) => renderEvidencia(ev, idx))}
                </div>
              ) : (
                <div className="h-[400px] flex items-center justify-center bg-slate-50 rounded-md border border-slate-200 border-dashed">
                  <div className="text-center text-slate-400">
                    <FaFileImage size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-[11px] font-bold uppercase tracking-wider">Sin evidencias</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
  <div className="flex items-stretch">
    <div className="w-[905px] flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Patrullas asignadas</p>
        <p className="text-[11px] text-slate-400 tracking-wider">Sin unidades asignadas</p>
      </div>
      <div className="border-t border-slate-100 my-4"></div>
      <div>
        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">Reporte del patrullero</p>
        <div className="p-3 bg-slate-50 rounded-md border border-slate-200 min-h-[100px] shadow-sm">
          <p className="text-[11px] text-slate-400 italic">Sin reporte enviado aún.</p>
        </div>
      </div>
      
      <div className="space-y-2">
  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Derivar (opcional)</p>
  <select disabled className="w-full p-3 text-sm font-semibold border border-slate-200 rounded-md shadow-sm bg-white text-slate-300 outline-none cursor-not-allowed">
    <option>Seleccionar derivación</option>
  </select>
  <button disabled className="mt-4 w-full h-11 py-2.5 bg-gray-300 text-gray-500 rounded-lg font-bold text-[11px] uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 cursor-not-allowed">
    <FaCheckCircle size={11} /> ESPERANDO REPORTE DEL PATRULLERO
  </button>
</div>
    </div>
    <div className="mx-6 flex flex-col gap-5 border border-slate-100"></div>
    <div className="w-72 shrink-0">
      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Evidencias <span>(0)</span></p>
      <div className="h-[400px] flex items-center justify-center bg-slate-50 rounded-md border border-slate-200 border-dashed">
        <div className="text-center text-slate-400">
          <FaFileImage size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-[11px] font-bold uppercase">Sin evidencias</p>
        </div>
      </div>
    </div>
  </div>
)
      )}
    </div>
  );
};
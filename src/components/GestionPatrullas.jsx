import React, { useState, useEffect } from "react";
import { FaTruck, FaCheckCircle, FaRoute, FaFileImage, FaFile, FaEye, FaChevronDown } from "react-icons/fa";
import { supabase } from "../services/supabase";
import { useToast } from "../context/ToastContext";
import { PatrulleroCardSkeleton } from "./ui/Skeleton";

//cambios actualizados

const ESTADO_DISPONIBLE = 1;
const ESTADO_NOTIFICADO = 2;
const ESTADO_EN_CAMINO  = 3;
const ESTADO_EN_LUGAR   = 4;
const ESTADO_REVISION   = 5;

export const GestionPatrullas = ({
  tabActiva,
  patrulleros,
  cargandoPatrulleros,
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
  const [hoverEvidencias, setHoverEvidencias] = useState(false);

  useEffect(() => {
    const cargar = async () => {
      const { data, error } = await supabase
        .from("instituciones")
        .select("id, nombre")
        .order("nombre");
      if (!error && data) setInstituciones(data);
      else
        setInstituciones([
  { id: 1, nombre: "FELCC (FUERZA ESPECIAL DE LUCHA CONTRA EL CRIMEN)" },
  { id: 2, nombre: "FELCV (FUERZA ESPECIAL DE LUCHA CONTRA LA VIOLENCIA)" },
  { id: 3, nombre: "FELCN (FUERZA ESPECIAL DE LUCHA CONTRA EL NARCOTRÁFICO)" },
  { id: 4, nombre: "DEFENSORÍA DE LA NIÑEZ Y ADOLESCENCIA" },
  { id: 5, nombre: "SLIM (SERVICIO LEGAL INTEGRAL MUNICIPAL)" },
  { id: 6, nombre: "TRÁNSITO" },
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
          className="w-full h-36 object-cover rounded-md transition-transform duration-200 group-hover:scale-105"
        />
      );
    } else if (esVideo) {
      preview = (
        <video
          src={ev.archivo}
          controls
          className="w-full h-36 object-cover rounded-lg"
        />
      );
    } else {
      preview = (
        <div className="w-full h-36 bg-slate-100 flex items-center justify-center rounded-md">
          <FaFile size={32} className="text-slate-400" />
        </div>
      );
    }

    if (esVideo) {
      return (
        <div
          key={idx}
          className="border border-slate-200 shadow-md rounded-lg p-0.5 bg-white"
        >
          {preview}
        </div>
      );
    }

    return (
      <div
        key={idx}
        className="border border-slate-200 shadow-md rounded-lg p-0.5 bg-white group relative"
      >
        
        <a    href={ev.archivo}
            target="_blank"
            rel="noreferrer"
            className="block overflow-hidden rounded-lg cursor-pointer"
          >
            {preview}
          </a>
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
          claseBtn: alertaSeleccionada ? " text-xs bg-[#474b29] hover:bg-[#3a3e21] text-white tracking-widest" : "text-xs bg-slate-300 text-white cursor-not-allowed tracking-widest",
          borde: "border-[#474b29]",
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
    <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200 relative z-0 mt-0.5">
     <div className="flex flex-wrap justify-between items-center gap-2 mb-4 ">
        <h3 className="font-bold uppercase flex items-center gap-2 tracking-wider text-[#1e293b] 
        text-[18px] mb-2 flex-shrink-0">
          <span className="w-7 h-7 flex items-center justify-center bg-[#474b29]/10 rounded-md">
            <FaTruck className="text-[#474b29]" size={16} />
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
         <div className="-mt-2 grid grid-cols-1 gap-4 px-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 md:gap-3.5">
            {cargandoPatrulleros ? (
              [0, 1, 2, 3].map((i) => <PatrulleroCardSkeleton key={i} />)
            ) : patrulleros.map((p) => {
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
                  className={`h-[141px] p-3 rounded-lg border shadow-md transition-all flex flex-col justify-start ${bordeClase} ${
                    resaltar ? "bg-blue-50/30" : fueraServicio ? "bg-slate-50/30 opacity-60" : "bg-slate-50/50"
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[12px] font-medium tracking-wider text-slate-500 uppercase">
                        {p.placa ? `PAT-${p.placa}` : "S/P"}
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${
                          fueraServicio
                            ? "bg-gray-400"
                            : p.id_estado === ESTADO_DISPONIBLE
                            ? "bg-[#474b29] animate-pulse"
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
                    <p className="text-[11.5px] font-medium text-[#1e293b] leading-tight truncate mt-3 tracking-wider">
                      {p.nombre_oficial}
                    </p>
                    <p
                      className={`text-[10px] font-medium uppercase mt-1.5 tracking-wider ${
                        fueraServicio ? "text-gray-300" : "text-slate-400"
                      }`}
                    >
                      {estadoBadge}
                    </p>
                  </div>
                                    <button
                    disabled={estadoInfo.deshab || fueraServicio}
                    onClick={() => onDespachar(p.id_patrullero)}
                    className={`w-full py-2 text-[11px] font-medium tracking-wider rounded-md uppercase transition-all shadow active:scale-95 mt-4 mb-1 ${estadoInfo.claseBtn}`}
                  >
                    {estadoInfo.texto}
                  </button>
                </div>
              );
            })}
           {!cargandoPatrulleros && patrulleros.length === 0 && (
              <p className="col-span-4 text-center text-slate-400 text-[11px] py-4">
                No se encontraron unidades registradas
              </p>
            )}
          </div>

          {alertaSeleccionada &&
            Object.keys(pendingAsignaciones).length > 0 && (
              <div className="mt-2 flex justify-end gap-2">
                <button
                  onClick={onCancelarAsignaciones}
                  className="
                  px-6 py-2.5 rounded-lg font-medium text-[11.5px] border uppercase tracking-wider border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-40"
                >
                  CANCELAR
                </button>
                <button
                  onClick={onFinalizarAsignacion}
                  className="px-8 py-2.5 rounded-lg font-medium text-[11.5px] bg-[#474b29] uppercase hover:bg-[#3a3e21] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed tracking-wider flex items-center justify-center gap-2"
                >
                 FINALIZAR ASIGNACIÓN
                </button>
              </div>
            )}
        </>
      ) : (
        alertaSeleccionada ? (
          <div className="flex flex-col lg:flex-row items-stretch gap-4">
  {/* COLUMNA IZQUIERDA */}
  <div className="flex-1 min-w-0 flex flex-col gap-3">
              <div>
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
                  Patrullas asignadas
                </p>
                                {patrullasAsignadas.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {patrullasAsignadas.map((p) => {
                      let badge = !p.activo
                        ? "INACTIVO"
                        : p.estado_disponibilidad || "—";
                      let estadoColor = "";
                      if (!p.activo) estadoColor = "text-gray-400";
                      else if (p.id_estado === ESTADO_EN_LUGAR) estadoColor = "text-purple-700";
                      else if (p.id_estado === ESTADO_EN_CAMINO) estadoColor = "text-orange-600";
                      else if (p.id_estado === ESTADO_NOTIFICADO) estadoColor = "text-blue-600";
                      else if (p.id_estado === ESTADO_REVISION) estadoColor = "text-gray-500";
                      else estadoColor = "text-slate-400";
                      return (
                        <div
                          key={p.id_patrullero}
                          className="min-w-0 p-3 bg-slate-50 rounded-xl shadow-sm border border-slate-200"
                        >
                          <div className="flex items-start justify-between gap-1">
                            <p className="text-[11px] font-medium text-[#1e293b] uppercase tracking-wider truncate ">
                              {p.placa ? `PAT-${p.placa}` : `PAT-${p.id_patrullero}`}
                            </p>
                            <div
                              className={`w-2 h-2 rounded-full shrink-0 mt-0.5 ${
                                p.id_estado === ESTADO_EN_LUGAR
                                  ? "bg-purple-700 animate-pulse"
                                  : p.id_estado === ESTADO_EN_CAMINO
                                  ? "bg-orange-500 animate-pulse"
                                  : p.id_estado === ESTADO_NOTIFICADO
                                  ? "bg-blue-500 animate-pulse"
                                  : p.id_estado === ESTADO_REVISION
                                  ? "bg-gray-500 animate-pulse"
                                  : ""
                              }`}
                            />
                          </div>
                          {p.numero_escalafon && (
                            <p className="text-[11px] text-slate-400 font-medium tracking-wider truncate mt-0.5">
                              {p.numero_escalafon}
                            </p>
                          )}
                          <p className={`text-[10px] font-medium tracking-wider uppercase mt-1 truncate ${estadoColor}`}>
                            {badge}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[11px] text-slate-400 font-medium tracking-wider">
                    Sin unidades asignadas
                  </p>
                )}
              </div>

              <div className="border-t border-slate-200 my-4"></div>

              <div className="-mt-2">
                <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">
                  Reporte del patrullero
                  {alertaActual?.reportePatrullero && alertaActual?.idPatrulleroReporte && (
                    <span className="normal-case text-slate-400">
                      {" "}— PAT-{patrulleros.find(p => p.id_patrullero === alertaActual.idPatrulleroReporte)?.placa || alertaActual.idPatrulleroReporte}
                    </span>
                  )}
                </p>
                <div className="p-3 bg-white rounded-xl border border-slate-200 min-h-[100px] shadow-sm overflow-y-auto">
                  {alertaActual?.reportePatrullero ? (
                    <p className="text-[12px] text-slate-500 leading-relaxed font-medium tracking-wider">
                      {alertaActual.reportePatrullero}
                    </p>
                  ) : (
                    <p className="text-[11px] text-slate-400 font-medium tracking-wider">
                      Sin reporte enviado aún.
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2 mt-1">
  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
    Derivar alerta 
  </p>
<div className="relative">
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
    className="w-full h-11 pl-3 pr-7 border border-slate-200 rounded-xl text-[12px] text-slate-500 outline-none appearance-none focus:border-[#474b29] transition-colors font-medium tracking-wider"
  >
      <option value="">Seleccionar derivación</option>
      <option value="SIN DERIVACIÓN">SIN DERIVACIÓN</option>
      {instituciones.map((inst) => (
        <option key={inst.id} value={inst.nombre}>
          {inst.nombre}
        </option>
      ))}
    </select>
    <FaChevronDown
      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
      size={11}
    />
</div>
  <div className="">
    <button
      onClick={handleEnviarTabulacion}
      disabled={enviando || !alertaActual?.reportePatrullero}
      className={`mt-5 w-full h-11 py-2.5 rounded-lg font-medium text-[11.5px] uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
        alertaActual?.reportePatrullero 
          ? 'bg-[#474b29] hover:bg-[#3a3e21] text-white disabled:opacity-40 disabled:cursor-not-allowed' 
          : 'border border-slate-300 text-slate-500 bg-slate-100 cursor-not-allowed'
      }`}
    >
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
            <div className="w-full lg:w-72 shrink-0 flex flex-col">
              <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                Evidencias
                <span>({alertaActual?.reportePatrullero ? evidencias.length : 0})</span>
              </p>
              {!alertaActual?.reportePatrullero ? (
                <div className="flex-1 min-h-[240px] flex items-center justify-center bg-slate-50 rounded- border border-slate-200 border-dashed">
                  <div className="text-center text-slate-400 px-4">
                    <FaFileImage size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-[11px] font-bold uppercase tracking-wider">Esperando reporte</p>
                  </div>
                </div>
              ) : evidencias.length > 0 ? (
                <div className="relative flex-1 min-h-[240px] max-h-[400px]">
                  <div
                    onMouseEnter={() => setHoverEvidencias(true)}
                    onMouseLeave={() => setHoverEvidencias(false)}
                    className="h-full overflow-y-auto pr-2 space-y-3 scroll-hover"
                  >
                    {evidencias.map((ev, idx) => renderEvidencia(ev, idx))}
                  </div>
                  <div
                    className={`absolute top-0 right-0 bottom-0 w-3.5 bg-white pointer-events-none transition-opacity duration-150 ${
                      hoverEvidencias ? "opacity-0" : "opacity-100"
                    }`}
                  />
                </div>
              ) : (
                <div className="flex-1 min-h-[240px] flex items-center justify-center bg-slate-50 rounded-md border border-slate-200 border-dashed">
                  <div className="text-center text-slate-400">
                    <FaFileImage size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Sin evidencias</p>
                  </div>
                </div>
              )}
            </div>
          </div>
) : (
  <div className="flex flex-col lg:flex-row items-stretch gap-4">
    <div className="flex-1 min-w-0 flex flex-col gap-4">
      <div>
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Patrullas asignadas</p>
        <p className="text-[11px] text-slate-400 font-medium tracking-wider">Sin unidades asignadas</p>
      </div>
      <div className="border-t border-slate-100 my-4"></div>
      <div>
        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1 mb-2">Reporte del patrullero</p>
        <div className="p-3 bg-slate-50 rounded-md border border-slate-200 min-h-[100px] shadow-sm">
          <p className="text-[11px] text-slate-400 font-medium tracking-wider">Sin reporte enviado aún.</p>
        </div>
      </div>
      
      <div className="space-y-2">
  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Derivar alerta</p>
  <div className="relative">
    <select disabled className="w-full font-medium border border-slate-200 rounded-xl shadow-sm bg-white text-slate-400 outline-none cursor-not-allowed appearance-none
                                h-11 pl-3 pr-7 text-[12px] tracking-wider">
      <option>Seleccionar derivación</option>
    </select>
    <FaChevronDown
      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
      size={11}
    />
  </div>

  <button disabled className="!mt-5 w-full h-11 py-2.5 rounded-xl font-medium text-[11.5px] uppercase tracking-wider border border-slate-300 text-slate-500 bg-slate-200 flex items-center justify-center gap-2 cursor-not-allowed">
    ESPERANDO REPORTE DEL PATRULLERO
  </button>
</div>
    </div>
   <div className="hidden lg:block mx-6 border-l border-slate-100"></div>
    <div className="w-full lg:w-72 shrink-0 flex flex-col">
      <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">Evidencias <span>(0)</span></p>
      <div className="flex-1 min-h-[240px] flex items-center justify-center bg-slate-50 rounded-md border border-slate-200 border-dashed">
        <div className="text-center text-slate-400">
          <FaFileImage size={24} className="mx-auto mb-2 opacity-50" />
          <p className="text-[11px] font-medium tracking-wider">Sin evidencias</p>
        </div>
      </div>
    </div>
  </div>
)
      )}
    </div>
  );
};
import React, { useState, useEffect } from "react";
import { FaTruck, FaCheckCircle, FaRoute, FaFileAlt, FaImage, FaFile, FaEye } from "react-icons/fa";
import { supabase } from "../services/supabase";

const ESTADO_DISPONIBLE = 1;
const ESTADO_NOTIFICADO = 2;
const ESTADO_EN_CAMINO  = 3;
const ESTADO_EN_LUGAR   = 4;

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
}) => {
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
          { id: 2, nombre: "FELCN (Fuerza Especial de Lucha Contra el Narcotráfico)" },
          { id: 3, nombre: "Unidad de Prevención de Robos (UPR)" },
          { id: 4, nombre: "Dirección de Seguridad Ciudadana" },
          { id: 5, nombre: "Diprove (División de Prevención de Robo de Vehículos)" },
          { id: 6, nombre: "SLIM (Servicio Legal Integral Municipal)" },
          { id: 7, nombre: "Defensoría de la Niñez y Adolescencia" },
          { id: 8, nombre: "Fiscalía" },
          { id: 9, nombre: "Hospital de Clínicas" },
          { id: 10, nombre: "Bomberos" },
          { id: 11, nombre: "Tránsito" },
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
    setEnviando(true);
    try {
      // 1. Cambiar estado de la alerta a ATENDIDO (3)
      await supabase
        .from("alerta")
        .update({ id_estado_actual: 3 })
        .eq("id_alerta", alertaSeleccionada);

      // 2. Liberar patrulleros (cambiar estados a disponible)
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

      // 3. GUARDAR DERIVACIÓN si se seleccionó alguna
      if (Derivacion) {
        await supabase
          .from("asignacion_patrulla")
          .update({ derivacion: Derivacion })
          .eq("id_alerta", alertaSeleccionada);
      }

      // 4. Notificar al padre si es necesario
      if (Derivacion && onDerivar) onDerivar(Derivacion);
      if (onEnviarATabulacion) onEnviarATabulacion();
    } catch (err) {
      console.error("Error enviando a tabulación:", err);
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

  return (
    <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-200 mt-2 relative z-0">
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {patrulleros.map((p) => {
              const pendiente =
                alertaSeleccionada &&
                pendingAsignaciones[p.id_patrullero] === alertaSeleccionada;
              const asignada =
                asignaciones[p.id_patrullero] === alertaSeleccionada;
              const resaltar = pendiente || asignada;
              const disponible = p.activo && p.id_estado === ESTADO_DISPONIBLE;
              const fueraServicio = !p.activo;

              let texto = "NO DISPONIBLE";
              let clase = "bg-slate-300 text-white cursor-not-allowed";
              let deshab = true;

              if (fueraServicio) {
                texto = "NO CONECTADO";
                clase = "bg-gray-300 text-gray-500 cursor-not-allowed";
              } else if (disponible) {
                if (pendiente) {
                  texto = "SELECCIONADA";
                  clase = "bg-slate-400 text-white";
                } else {
                  texto = "DESPACHAR";
                  clase = alertaSeleccionada
                    ? "bg-green-700 hover:bg-green-800 text-white"
                    : "bg-slate-300 text-white cursor-not-allowed";
                  deshab = !alertaSeleccionada;
                }
              } else if (p.id_estado === ESTADO_NOTIFICADO) {
                texto = "NOTIFICADO";
                clase = "bg-blue-500 text-white cursor-not-allowed";
              } else if (p.id_estado === ESTADO_EN_CAMINO) {
                texto = "EN CAMINO";
                clase = "bg-orange-600 text-white cursor-not-allowed";
              } else if (p.id_estado === ESTADO_EN_LUGAR) {
                texto = "EN LUGAR";
                clase = "bg-purple-600 text-white cursor-not-allowed";
              }

              const estadoBadge = fueraServicio
                ? "INACTIVO"
                : p.estado_disponibilidad || "—";

              return (
                <div
                  key={p.id_patrullero}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    resaltar
                      ? "border-blue-500 bg-blue-50/30 shadow-md"
                      : fueraServicio
                      ? "border-slate-100 bg-slate-50/30 opacity-60"
                      : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[11px] font-black text-slate-300 uppercase">
                      {p.placa || "S/P"}
                    </span>
                    <div
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        fueraServicio
                          ? "bg-gray-400"
                          : p.id_estado === ESTADO_DISPONIBLE
                          ? "bg-green-500"
                          : p.id_estado === ESTADO_NOTIFICADO
                          ? "bg-blue-500 animate-pulse"
                          : p.id_estado === ESTADO_EN_CAMINO
                          ? "bg-yellow-500 animate-pulse"
                          : p.id_estado === ESTADO_EN_LUGAR
                          ? "bg-purple-500 animate-pulse"
                          : "bg-gray-400"
                      }`}
                    />
                  </div>
                  <p className="text-[11px] font-bold text-[#1e293b] leading-tight truncate">
                    {p.nombre_oficial}
                  </p>
                  <p
                    className={`text-[9px] font-extrabold uppercase mt-0.5 ${
                      fueraServicio ? "text-gray-400" : "text-slate-500"
                    }`}
                  >
                    {estadoBadge}
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      disabled={deshab || fueraServicio}
                      onClick={() => onDespachar(p.id_patrullero)}
                      className={`flex-1 py-1.5 text-[9px] font-extrabold rounded-lg uppercase transition-all shadow active:scale-95 ${clase}`}
                    >
                      {texto}
                    </button>
                    {pendiente && !fueraServicio && (
                      <button
                        onClick={() =>
                          onCargarRuta(p.id_patrullero, alertaActual)
                        }
                        className="bg-blue-600 hover:bg-blue-700 text-white px-1.5 py-1 rounded-lg text-[9px] font-black flex items-center gap-0.5 shadow"
                        title="Ver ruta"
                      >
                        <FaRoute size={9} />
                      </button>
                    )}
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
              <div className="mt-4 flex justify-end gap-2">
                <button
                  onClick={onCancelarAsignaciones}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-4 py-2 rounded-lg font-extrabold text-[11px] uppercase"
                >
                  CANCELAR
                </button>
                <button
                  onClick={onFinalizarAsignacion}
                  className="bg-green-800 hover:bg-green-900 text-white px-4 py-2 rounded-lg font-black text-[11px] uppercase flex items-center gap-1 shadow"
                >
                  <FaCheckCircle size={12} /> FINALIZAR ASIGNACIÓN
                </button>
              </div>
            )}
        </>
      ) : (
        alertaSeleccionada ? (
          <div className="flex items-stretch">
            {/* COLUMNA IZQUIERDA */}
            <div className="w-[905px] flex flex-col gap-4">
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Patrullas asignadas
                </p>
                {patrullasAsignadas.length > 0 ? (
                  <div className="space-y-2">
                    {patrullasAsignadas.map((p) => {
                      const badge = !p.activo
                        ? "INACTIVO"
                        : p.estado_disponibilidad || "—";
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
                            <p
                              className={`text-[11px] font-extrabold uppercase ${
                                !p.activo
                                  ? "text-gray-400"
                                  : p.id_estado === ESTADO_EN_LUGAR
                                  ? "text-purple-600"
                                  : p.id_estado === ESTADO_EN_CAMINO
                                  ? "text-yellow-600"
                                  : p.id_estado === ESTADO_NOTIFICADO
                                  ? "text-blue-600"
                                  : "text-slate-400"
                              }`}
                            >
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
                                : "bg-gray-400"
                            }`}
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 tracking-wider">
                    Sin unidades asignadas
                  </p>
                )}
              </div>

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
                    <p className="text-[10px] text-slate-400 italic">
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
                  onChange={(e) => setDerivacion(e.target.value)}
                  className="w-full p-3 text-sm font-semibold border border-slate-200 rounded-md shadow-sm bg-white text-slate-400 outline-none focus:border-slate-300 transition-all"
                >
                  <option value="">Seleccionar derivación</option>
                  {instituciones.map((inst) => (
                    <option key={inst.id} value={inst.nombre}>
                      {inst.nombre}
                    </option>
                  ))}
                </select>

                <div className="">
                  <button
                    onClick={handleEnviarTabulacion}
                    disabled={enviando}
                    className="mt-4 w-full h-11 py-2.5 bg-[#113e27] hover:bg-[#164a2f] text-white rounded-lg font-bold text-[11px] uppercase tracking-wider shadow-md flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    <FaCheckCircle size={11} />
                    {enviando
                      ? "Enviando..."
                      : Derivacion
                      ? "ENVIAR ALERTA A TABULACIÓN"
                      : "ENVIAR ALERTA A TABULACIÓN"}
                  </button>
                </div>
              </div>
            </div>

            <div className="mx-6 flex flex-col gap-5 border border-slate-100 "></div>

            {/* COLUMNA DERECHA (evidencias) */}
            <div className="w-72 shrink-0">
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
                    <FaImage size={24} className="mx-auto mb-2 opacity-50" />
                    <p className="text-[11px] font-bold uppercase">Sin evidencias</p>
                  </div>
                </div>
              )}
            </div>
            
          </div>
        ) : (
          <p className="text-center text-slate-400 text-[11px] py-6">
            Selecciona una alerta de la lista para ver el seguimiento, evidencias y opciones de cierre.
          </p>
        )
      )}
    </div>
  );
};
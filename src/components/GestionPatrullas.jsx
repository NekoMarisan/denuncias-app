import React, { useState, useEffect } from "react";
import { FaTruck, FaCheckCircle, FaRoute, FaFileAlt, FaImage, FaVideo, FaFile, FaEye } from "react-icons/fa";
import { supabase } from "../services/supabase";

const ESTADO_DISPONIBLE = 1;
const ESTADO_NOTIFICADO = 2;
const ESTADO_EN_CAMINO = 3;
const ESTADO_EN_LUGAR = 4;

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
  const [destinoDerivacion, setDestinoDerivacion] = useState("");

  useEffect(() => {
    const cargarInstituciones = async () => {
      const { data, error } = await supabase
        .from("instituciones")
        .select("id, nombre")
        .order("nombre");
      if (!error && data) setInstituciones(data);
      else {
        setInstituciones([
          { id: 1, nombre: "Fiscalía" },
          { id: 2, nombre: "Defensoría de la Niñez" },
          { id: 3, nombre: "Hospital de Clínicas" },
          { id: 4, nombre: "Bomberos" },
          { id: 5, nombre: "Tránsito" },
        ]);
      }
    };
    cargarInstituciones();
  }, []);

  const evidencias = alertaActual?.evidencias || [];

  const verEvidencia = (url) => {
    window.open(url, "_blank");
  };

  const renderEvidencia = (ev) => {
    const tipo = ev.tipo_evidencia || "";
    let preview = null;
    if (tipo.startsWith("image")) {
      preview = <img src={ev.archivo} alt="Evidencia" className="w-20 h-20 object-cover rounded-md border border-slate-200" />;
    } else if (tipo.startsWith("video")) {
      preview = <video src={ev.archivo} className="w-20 h-20 object-cover rounded-md border border-slate-200" />;
    } else {
      preview = (
        <div className="w-20 h-20 bg-slate-100 rounded-md border border-slate-200 flex flex-col items-center justify-center">
          <FaFile size={24} className="text-slate-500" />
        </div>
      );
    }
    return (
      <div className="flex flex-col items-center gap-1">
        {preview}
        <button
          onClick={() => verEvidencia(ev.archivo)}
          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
        >
          <FaEye size={10} /> Ver
        </button>
      </div>
    );
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 mt-4 relative z-0">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-[15px] font-black uppercase flex items-center gap-2 tracking-tight text-[#1e293b]">
          <span className="w-7 h-7 flex items-center justify-center bg-green-50 rounded-lg">
            <FaTruck className="text-green-700" size={16} />
          </span>
          {isNuevas ? "Gestión de Patrullas" : "Seguimiento de Intervención"}
        </h3>
        {isNuevas && alertaSeleccionada && (
          <div className="bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border border-gray-200">
            {Object.keys(pendingAsignaciones).length} seleccionada(s)
          </div>
        )}
      </div>

      {isNuevas ? (
        // --- PESTAÑA "ALERTAS VALIDADAS" (sin cambios) ---
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {patrulleros.map((p, idx) => {
              const pendiente = alertaSeleccionada && pendingAsignaciones[p.id_patrullero] === alertaSeleccionada;
              const asignada = asignaciones[p.id_patrullero] === alertaSeleccionada;
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

              const estadoBadge = fueraServicio ? "INACTIVO" : p.estado_disponibilidad || "—";

              return (
                <div
                  key={p.id_patrullero}
                  className={`p-3 rounded-xl border-2 transition-all ${
                    resaltar
                      ? "border-blue-500 bg-blue-50/30 shadow-md"
                      : fueraServicio
                      ? "border-slate-100 bg-slate-50/30 opacity-60"
                      : "border-slate-100 bg-slate-50/50"
                  }`}
                >
                  <div className="flex justify-between items-start mb-1.5">
                    <span className="text-[9px] font-black text-slate-300 uppercase">{p.placa || "S/P"}</span>
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
                  <p className="text-[11px] font-bold text-[#1e293b] leading-tight truncate">{p.nombre_oficial}</p>
                  <p className={`text-[8px] font-black uppercase mt-0.5 ${fueraServicio ? "text-gray-400" : "text-slate-500"}`}>
                    {estadoBadge}
                  </p>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      disabled={deshab || fueraServicio}
                      onClick={() => onDespachar(p.id_patrullero)}
                      className={`flex-1 py-1.5 text-[8px] font-black rounded-lg uppercase transition-all shadow active:scale-95 ${clase}`}
                    >
                      {texto}
                    </button>
                    {pendiente && !fueraServicio && (
                      <button
                        onClick={() => onCargarRuta(p.id_patrullero, alertaActual)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-1.5 py-1 rounded-lg text-[8px] font-black flex items-center gap-0.5 shadow"
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
              <p className="col-span-4 text-center text-slate-400 text-xs py-4">No se encontraron unidades registradas</p>
            )}
          </div>

          {alertaSeleccionada && Object.keys(pendingAsignaciones).length > 0 && (
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
        // --- PESTAÑA "EN INTERVENCIÓN" (simplificada) ---
        <div>
          {alertaSeleccionada ? (
            <>
              {/* 1. Lista de patrullas asignadas (simple) */}
              <div className="mb-5">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Patrullas asignadas</h4>
                <div className="space-y-2">
                  {patrulleros
                    .filter(p => asignaciones[p.id_patrullero] === alertaSeleccionada)
                    .map((p) => {
                      const estadoBadge = !p.activo ? "INACTIVO" : p.estado_disponibilidad || "—";
                      return (
                        <div key={p.id_patrullero} className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div>
                            <span className="text-sm font-bold text-slate-700">Placa: {p.placa || "—"}</span>
                            <p className="text-xs text-slate-500">{p.nombre_oficial} • {estadoBadge}</p>
                          </div>
                          <div className={`w-2 h-2 rounded-full ${
                            p.id_estado === ESTADO_EN_LUGAR
                              ? "bg-purple-500 animate-pulse"
                              : p.id_estado === ESTADO_EN_CAMINO
                              ? "bg-yellow-500 animate-pulse"
                              : p.id_estado === ESTADO_NOTIFICADO
                              ? "bg-blue-500 animate-pulse"
                              : "bg-gray-400"
                          }`} />
                        </div>
                      );
                    })}
                </div>
                {patrulleros.filter(p => asignaciones[p.id_patrullero] === alertaSeleccionada).length === 0 && (
                  <p className="text-center text-slate-400 text-xs py-3">No hay unidades asignadas a esta alerta</p>
                )}
              </div>

              {/* 2. Reporte + Evidencias en dos columnas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                {/* Reporte textual */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                    <FaFileAlt className="text-blue-500" /> Reporte del patrullero
                  </h4>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 h-32 overflow-y-auto">
                    {alertaActual?.reportePatrullero ? (
                      <p className="text-sm text-slate-700 leading-relaxed">{alertaActual.reportePatrullero}</p>
                    ) : (
                      <p className="text-sm text-slate-400 italic">Aún no se ha enviado ningún reporte.</p>
                    )}
                  </div>
                </div>

                {/* Evidencias (scroll horizontal con botón Ver) */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                    <FaImage className="text-green-500" /> Evidencias adjuntas ({evidencias.length})
                  </h4>
                  <div className="overflow-x-auto pb-2">
                    <div className="flex gap-3 min-w-min">
                      {evidencias.length > 0 ? (
                        evidencias.map((ev, idx) => (
                          <div key={idx} className="flex-shrink-0">
                            {renderEvidencia(ev)}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-slate-400 italic">No hay evidencias adjuntas.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Acciones de cierre */}
              <div className="border-t border-slate-200 pt-4 mt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase mb-3">Cierre del caso</h4>
                <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                  <div className="flex-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Derivar a institución especializada</label>
                    <select
                      value={destinoDerivacion}
                      onChange={(e) => setDestinoDerivacion(e.target.value)}
                      className="w-full p-2 text-sm border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="">-- Seleccione una institución --</option>
                      {instituciones.map(inst => (
                        <option key={inst.id} value={inst.nombre}>{inst.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <button
                    onClick={() => {
                      if (destinoDerivacion) onDerivar(destinoDerivacion);
                      else alert("Debe seleccionar una institución");
                    }}
                    className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg font-black text-[11px] uppercase shadow"
                    disabled={!destinoDerivacion}
                  >
                    DERIVAR
                  </button>
                  <button
                    onClick={() => onEnviarATabulacion()}
                    className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg font-black text-[11px] uppercase shadow"
                  >
                    ENVIAR A TABULACIÓN
                  </button>
                </div>
              </div>
            </>
          ) : (
            <p className="text-center text-slate-400 text-xs py-6">
              Selecciona una alerta en la lista de la izquierda para ver el seguimiento, evidencias y opciones de cierre.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
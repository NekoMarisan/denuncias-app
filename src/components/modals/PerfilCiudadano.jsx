import React, { useState } from "react";
import { FaTimes, FaIdCard, FaPhone, FaShieldAlt, FaEnvelope, FaCalendarAlt, FaUserCheck } from "react-icons/fa";
import { supabase } from "../../services/supabase";

const ESTADOS = [
  { value: "VERIFICADO", label: "Verificado",  color: "bg-green-600"  },
  { value: "ADVERTIDO",  label: "Advertido",   color: "bg-orange-500" },
  { value: "SUSPENDIDO", label: "Suspendido",  color: "bg-red-600"    },
];

const getBadgeColor = (estado) => {
  switch (estado) {
    case "VERIFICADO":
    case "ACTIVO":     return "bg-green-600";
    case "ADVERTIDO":  return "bg-orange-500";
    case "SUSPENDIDO": return "bg-red-600";
    default:           return "bg-gray-400";
  }
};

const PerfilCiudadano = ({ ciudadano, onClose, onActualizar }) => {
  const [estadoActual, setEstadoActual] = useState(ciudadano?.estado || null);
  const [guardando, setGuardando]       = useState(false);
  const [fotoAmpliada, setFotoAmpliada] = useState(null);

  if (!ciudadano) return null;

  const fechaFormateada = ciudadano.fecha_registro
    ? new Date(ciudadano.fecha_registro).toLocaleDateString("es-ES", {
        day: "2-digit", month: "long", year: "numeric"
      })
    : "—";

  const cambiarEstado = async (nuevoEstado) => {
    setGuardando(true);
    const { error } = await supabase
      .from("usuario_ciudadano")
      .update({ estado_cuenta: nuevoEstado })
      .eq("id_usuario", ciudadano.id);

    if (error) {
      console.error("Error al cambiar estado:", error);
      setGuardando(false);
      return;
    }
    setEstadoActual(nuevoEstado);
    setGuardando(false);
    if (onActualizar) onActualizar();
  };

  return (
    <>
      {/* Modal principal */}
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden border border-gray-100">

          {/* Cabecera */}
          <div className="bg-blue-800 p-4 flex justify-between items-center text-white">
            <h3 className="text-lg font-black uppercase tracking-tight flex items-center gap-2">
              <FaShieldAlt size={16} /> Perfil Ciudadano
            </h3>
            <button onClick={onClose} className="p-1.5 bg-blue-700 hover:bg-red-500 rounded-lg transition-all">
              <FaTimes size={14} />
            </button>
          </div>

          <div className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">

            {/* Avatar + nombre + estado */}
            <div className="flex items-center gap-4 pb-3 border-b border-gray-100">
              <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-2xl shrink-0">
                {ciudadano.nombre?.charAt(0) || "?"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black text-slate-800 truncate">{ciudadano.nombre}</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                  ID: REGC-{String(ciudadano.id).padStart(4, "0")}
                </p>
                <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-white ${getBadgeColor(estadoActual)}`}>
                  {estadoActual || "SIN VERIFICAR"}
                </span>
              </div>
            </div>

            {/* Datos personales */}
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg col-span-2">
                <FaIdCard className="text-blue-500 text-sm shrink-0" />
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Cédula de Identidad</p>
                  <p className="text-xs font-bold text-slate-700">{ciudadano.ci || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <FaPhone className="text-green-600 text-sm shrink-0" />
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Celular</p>
                  <p className="text-xs font-bold text-slate-700">{ciudadano.celular || "—"}</p>
                </div>
              </div>

              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg">
                <FaCalendarAlt className="text-purple-500 text-sm shrink-0" />
                <div>
                  <p className="text-[8px] font-black text-slate-400 uppercase">Fecha Registro</p>
                  <p className="text-xs font-bold text-slate-700">{fechaFormateada}</p>
                </div>
              </div>

              {ciudadano.email && (
                <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg col-span-2">
                  <FaEnvelope className="text-indigo-500 text-sm shrink-0" />
                  <div>
                    <p className="text-[8px] font-black text-slate-400 uppercase">Correo Electrónico</p>
                    <p className="text-xs font-bold text-slate-700">{ciudadano.email}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Fotos */}
            <div>
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                <FaUserCheck size={10} /> Documentos de Verificación
              </p>
              <div className="grid grid-cols-2 gap-3">

                {/* Selfie */}
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase text-center">Selfie</p>
                  {ciudadano.selfie ? (
                    <img
                      src={ciudadano.selfie}
                      alt="Selfie"
                      onClick={() => setFotoAmpliada(ciudadano.selfie)}
                      className="w-full h-32 object-cover rounded-xl border border-gray-100 cursor-zoom-in hover:opacity-90 transition-all"
                    />
                  ) : (
                    <div className="w-full h-32 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 text-[9px] font-bold uppercase">
                      Sin foto
                    </div>
                  )}
                </div>

                {/* Carnet */}
                <div className="space-y-1">
                  <p className="text-[8px] font-black text-slate-400 uppercase text-center">Foto Carnet (CI)</p>
                  {ciudadano.foto_ci ? (
                    <img
                      src={ciudadano.foto_ci}
                      alt="Foto CI"
                      onClick={() => setFotoAmpliada(ciudadano.foto_ci)}
                      className="w-full h-32 object-cover rounded-xl border border-gray-100 cursor-zoom-in hover:opacity-90 transition-all"
                    />
                  ) : (
                    <div className="w-full h-32 rounded-xl bg-gray-100 flex items-center justify-center text-gray-300 text-[9px] font-bold uppercase">
                      Sin foto
                    </div>
                  )}
                </div>

              </div>
            </div>

            {/* Cambiar estado */}
            <div className="pt-1">
              <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Cambiar Estado</p>
              <div className="flex gap-2">
                {ESTADOS.map(({ value, label, color }) => (
                  <button
                    key={value}
                    disabled={guardando || estadoActual === value}
                    onClick={() => cambiarEstado(value)}
                    className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase text-white transition-all shadow-sm
                      ${estadoActual === value
                        ? `${color} opacity-100 ring-2 ring-offset-1 ring-current`
                        : `${color} opacity-50 hover:opacity-100`}
                      ${guardando ? "cursor-not-allowed" : "cursor-pointer hover:scale-[1.03]"}`}
                  >
                    {guardando && estadoActual !== value ? label : label}
                  </button>
                ))}
              </div>

              {/* Alertas de estado */}
              {estadoActual === "ADVERTIDO" && (
                <div className="mt-3 bg-orange-50 border-l-4 border-orange-400 p-2 rounded">
                  <p className="text-[9px] font-bold text-orange-700 uppercase">⚠️ Ciudadano con reportes malintencionados</p>
                </div>
              )}
              {estadoActual === "SUSPENDIDO" && (
                <div className="mt-3 bg-red-50 border-l-4 border-red-400 p-2 rounded">
                  <p className="text-[9px] font-bold text-red-700 uppercase">⛔ Ciudadano suspendido por acumulación de advertencias</p>
                </div>
              )}
              {!estadoActual && (
                <div className="mt-3 bg-gray-50 border-l-4 border-gray-300 p-2 rounded">
                  <p className="text-[9px] font-bold text-gray-500 uppercase">⏳ Cuenta pendiente de verificación</p>
                </div>
              )}
            </div>

          </div>

          {/* Pie */}
          <div className="p-4 bg-gray-50 border-t border-gray-100 text-right">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase hover:bg-blue-700 transition"
            >
              Cerrar
            </button>
          </div>

        </div>
      </div>

      {/* Lightbox foto ampliada */}
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

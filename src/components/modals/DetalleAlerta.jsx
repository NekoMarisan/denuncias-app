import React, { useState, useEffect, useRef } from "react";
import {
  FaUser,
  FaPhone,
  FaPlay,
  FaPause,
  FaFileImage,
  FaVideo,
  FaFilePdf,
  FaDownload,
  FaExclamationTriangle,
  FaTimes,
  FaShieldAlt,
  FaCheckCircle,
  FaFile,
  FaAddressCard,
  FaDownload as FaDownloadIcon,
} from "react-icons/fa";
import { contravenciones, delitos } from "../../constants/CategoriasDelitos";

const DetalleAlerta = ({ alerta, onBack, onEnviarDespacho, onDesestimar }) => {
  const [playing, setPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [contravencion, setContravencion] = useState("");
  const [delito, setDelito] = useState("");
  const [prioridad, setPrioridad] = useState("");
  const [estadoValidacion, setEstadoValidacion] = useState("pendiente");
  const audioInterval = useRef(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleValidar = () => {
    const clasificacion = contravencion || delito;
    if (!clasificacion || !prioridad) {
      alert(
        "Por favor, seleccione la clasificación y prioridad antes de validar la alerta",
      );
      return;
    }
    setEstadoValidacion("validado");
  };

  const handleDesestimarAccion = () => {
    if (estadoValidacion === "validado") return;
    if (
      window.confirm(
        "¿Estás seguro de que deseas desestimar este reporte? Se eliminará de la lista actual.",
      )
    ) {
      if (onDesestimar) {
        onDesestimar(alerta?.id);
      } else {
        onBack();
      }
    }
  };

  const handleEnviarDespachoLocal = () => {
    const clasificacion = contravencion || delito;
    alert("Se ha transferido la alerta al centro de despacho exitosamente.");
    if (onEnviarDespacho) {
      onEnviarDespacho(alerta?.id, { clasificacion, prioridad });
    }
  };

  const getFileInfo = (fileName) => {
    const ext = fileName?.split(".").pop().toLowerCase();
    if (["jpg", "jpeg", "png", "webp"].includes(ext))
      return { i: <FaFileImage />, c: "text-blue-500", t: "IMAGEN" };
    if (["mp4", "mov", "avi"].includes(ext))
      return { i: <FaVideo />, c: "text-rose-500", t: "VIDEO" };
    if (ext === "pdf")
      return { i: <FaFilePdf />, c: "text-amber-500", t: "DOCUMENTO PDF" };
    return { i: <FaFile />, c: "text-slate-500", t: "ARCHIVO" };
  };

  const toggleAudio = () => {
    if (!playing) {
      setPlaying(true);
      audioInterval.current = setInterval(() => {
        setAudioProgress((prev) =>
          prev >= 100
            ? (clearInterval(audioInterval.current), setPlaying(false), 0)
            : prev + 2,
        );
      }, 200);
    } else {
      setPlaying(false);
      clearInterval(audioInterval.current);
    }
  };

  const data = {
    id: alerta?.id || "N/A",
    ciudadano: alerta?.ciudadano || "Usuario Desconocido",
    celular: alerta?.celular || "S/N",
    relato: alerta?.relato || "Sin relato adjunto",
    ci: alerta?.ci || "6945862 CB",
    archivos: alerta?.archivos || [],
    ...alerta,
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
        onClick={onBack}
      />

      <div className="relative w-full max-w-5xl max-h-[98vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="bg-[#113e27] py-4 px-6 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <FaShieldAlt className="text-white/80" size={16} />
            <span className="text-sm font-extrabold uppercase tracking-wide">
              Gestión de Alerta Entrante
            </span>
          </div>
          <button
            onClick={onBack}
            className="hover:bg-white/20 p-1.5 rounded-full transition-colors"
          >
            <FaTimes size={16} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 md:p-6">
          <div className="-mt-2 grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Columna izquierda */}
            <div className="space-y-5">
              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Datos del Ciudadano
                </h3>
                <div className="bg-slate-50 rounded-xl p-5 border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-5">
                    <div className="w-20 h-16 rounded-2xl bg-white flex items-center justify-center text-slate-200 shadow-sm border border-slate-50">
                      <FaUser size={32} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <h4 className="text-base font-bold text-slate-600">
                        {data.ciudadano}
                      </h4>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-slate-500">
                          <FaAddressCard className="text-slate-400" size={12} />
                          <span className="text-[11px] font-bold">
                            CI: {data.ci}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-slate-500">
                          <FaPhone className="text-emerald-600" size={11} />
                          <span className="text-[11px] font-medium">
                            {data.celular}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Evidencia Adjunta
                </h3>
                <div className="space-y-2">
                  {data.archivos && data.archivos.length > 0 ? (
                    data.archivos.map((archivo, idx) => {
                      const info = getFileInfo(archivo.nombre);
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-white border border-green-100 rounded-xl"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center ${info.c}`}
                            >
                              {info.i}
                            </div>
                            <div>
                              <p className="text-[9px] font-black text-slate-700 uppercase">
                                {archivo.nombre}
                              </p>
                              <p className="text-[8px] font-bold text-slate-400">
                                {info.t}
                              </p>
                            </div>
                          </div>
                          <FaDownloadIcon
                            className="text-slate-300 hover:text-emerald-600 cursor-pointer"
                            size={12}
                          />
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[12px] font-medium text-slate-400">
                      No se adjuntaron archivos.
                    </p>
                  )}
                </div>
              </section>
            </div>

            {/* Columna derecha */}
            <div className="space-y-5">
              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Audio del Reporte
                </h3>
                <div className="bg-[#1a5336] rounded-xl p-4 flex items-center gap-4 shadow-md">
                  <button
                    onClick={toggleAudio}
                    className="w-10 h-10 bg-white rounded-full flex items-center justify-center text-[#1a5336]"
                  >
                    {playing ? (
                      <FaPause size={12} />
                    ) : (
                      <FaPlay size={12} className="ml-0.5" />
                    )}
                  </button>
                  <div className="flex-1">
                    <div className="flex justify-between text-[9px] font-semibold text-white/60 mb-1.5 uppercase">
                      <span>
                        {playing ? "Reproduciendo..." : "Audio del ciudadano"}
                      </span>
                      <span>
                        {Math.floor((audioProgress / 100) * 120)}s / 120s
                      </span>
                    </div>
                    <div className="h-1 w-full bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white transition-all"
                        style={{ width: `${audioProgress}%` }}
                      />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Relato del hecho
                </h3>
                <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 relative">
                  <FaExclamationTriangle
                    className="absolute -top-1.5 -left-1.5 text-green-900 bg-white rounded-md p-0.5 shadow-sm"
                    size={16}
                  />
                  <p className="text-[13px] font-bold text-slate-500">
                    {data.relato}
                  </p>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                  Clasificación del Hecho
                </h3>
                <div className="flex flex-col gap-2">
                  <div className="relative">
                    <select
                      className={`w-full p-2.5 pr-8 bg-white border-2 border-slate-200 rounded-xl text-[12px] font-bold outline-none appearance-none tracking-wide duration-0 focus:border-slate-400 focus:ring-0 ${
                        !contravencion ? "text-slate-500" : "text-slate-600"
                      }`}
                      value={contravencion}
                      onChange={(e) => {
                        setContravencion(e.target.value);
                        setDelito("");
                        setEstadoValidacion("pendiente");
                      }}
                      disabled={!!delito || estadoValidacion === "validado"}
                    >
                      <option value="" className="text-gray-400">
                        Seleccionar Contravención
                      </option>
                      {contravenciones.map((c) => (
                        <option
                          key={c}
                          value={c}
                          className="text-slate-700 text-[11px]"
                        >
                          {c}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg
                        className="w-3 h-3 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>

                  <div className="relative">
                    <select
                      className={`w-full p-2.5 pr-8 bg-white border-2 border-slate-200 rounded-xl text-[12px] font-bold outline-none appearance-none tracking-wide duration-0 focus:border-slate-400 focus:ring-0 ${
                        !delito ? "text-slate-500" : "text-slate-600"
                      }`}
                      value={delito}
                      onChange={(e) => {
                        setDelito(e.target.value);
                        setContravencion("");
                        setEstadoValidacion("pendiente");
                      }}
                      disabled={
                        !!contravencion || estadoValidacion === "validado"
                      }
                    >
                      <option value="" className="text-gray-400">
                        Seleccionar Delito
                      </option>
                      {delitos.map((d) => (
                        <option
                          key={d}
                          value={d}
                          className="text-slate-700 text-[11px]"
                        >
                          {d}
                        </option>
                      ))}
                    </select>
                    <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none">
                      <svg
                        className="w-3 h-3 text-black"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3"
                          d="M19 9l-7 7-7-7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3">
                  Nivel de Prioridad
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {["ALTA", "MEDIA", "BAJA"].map((p) => (
                    <button
                      key={p}
                      disabled={estadoValidacion === "validado"}
                      onClick={() => {
                        setPrioridad(p);
                        setEstadoValidacion("pendiente");
                      }}
                      className={`py-2 rounded-xl border-2 font-bold text-[11px] tracking-wider transition-all ${
                        prioridad === p
                          ? p === "ALTA"
                            ? "bg-red-600 border-red-600 text-white"
                            : p === "MEDIA"
                              ? "bg-blue-600 border-blue-600 text-white"
                              : "bg-amber-500 border-amber-500 text-white"
                          : "bg-white border-slate-200 text-slate-500"
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </section>
            </div>
          </div>
        </div>

        {/* Botones inferiores */}
        <div className="p-5 bg-slate-50 border-t flex flex-wrap md:flex-nowrap gap-3">
          <button
            onClick={handleDesestimarAccion}
            disabled={estadoValidacion === "validado"}
            className={`flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-xl font-bold uppercase text-[11px] tracking-wider border-2 transition-all ${
              estadoValidacion === "validado"
                ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed shadow-none"
                : "bg-white text-orange-600 border-orange-500 hover:bg-orange-50"
            }`}
          >
            Desestimar Reporte
          </button>

          <button
            onClick={handleValidar}
            className={`flex-1 py-1.5 rounded-xl font-bold uppercase text-[11px] tracking-wider flex items-center justify-center gap-1.5 border-2 transition-all ${
              estadoValidacion === "validado"
                ? "bg-blue-600 border-blue-600 text-white shadow-md"
                : "bg-white border-blue-600 text-blue-600 hover:bg-blue-50"
            }`}
          >
            {estadoValidacion === "validado"
              ? "Alerta Validada"
              : "Validar Clasificación"}
          </button>

          <button
            onClick={handleEnviarDespachoLocal}
            disabled={estadoValidacion !== "validado"}
            className={`flex-[1.5] py-3 rounded-xl font-bold uppercase text-[11px] tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all ${
              estadoValidacion !== "validado"
                ? "bg-gray-300 text-white cursor-not-allowed shadow-none"
                : "bg-emerald-900 text-white hover:bg-emerald-800"
            }`}
          >
            <FaCheckCircle size={12} /> Enviar a Despacho
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleAlerta;

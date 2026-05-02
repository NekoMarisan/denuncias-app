import React, { useState, useEffect, useRef } from 'react';
import { 
  FaUser, FaPhone, FaPlay, FaPause,
  FaFileImage, FaVideo, FaFilePdf, FaDownload,
  FaExclamationTriangle, FaTimes, FaShieldAlt, FaCheckCircle,
  FaFile, FaAddressCard, FaDownload as FaDownloadIcon
} from 'react-icons/fa';

const contravenciones = ["RP 01 RIÑAS Y PELEAS", "RP 02 ESTADO EBRIEDAD", "RP 03 AUX. PERS. HERIDA", "RP 04 ACTOS INMORALES", "RP 05 FALTAMIENTO A LA AUTORIDAD", "RP 06 NEGARCE A PAGAR", "RP 07 DAÑOS A PROP. PRIV.", "RP 08 RUIDOS MOLESTOS", "RP 09 OBSTRUCCION VIA PUBLICA", "RP 10 SUPLANTACION A LA AUTOR.", "RP 11 JUEGOS PROHIBIDOS", "RP 12 PROST. CLANDESTINA", "RP 13 DEFICIENTE MENTAL", "RP 14 CASO MATERNIDAD", "RP 15 PROBLEMA DE MENORES", "RP 16 PERSONA EXTRAVIADA", "RP 17 PERSONA SOSPECHOZA", "RP 18 PROBLEMA EXTRANJEROS", "RP 19 VEHICULO ABANDONADO", "RP 20 COOP. A OTROS ORGANISMOS", "RP 21 PORTAR ARMA DE FUEGO", "RP 22 EJECUCION DE MANDAMIENTO", "RP 23 VAGANCIA MALENTRETENIMI.", "RP 24 PROBLEMA DE CANES", "RP 25 MANIFESTACION", "RP 26 INUNDACION", "RP 27 DERRUMBE", "RP 28 DESLIZAMIENTO", "RP 29 PROBLEMA DE ELECTRICIDAD", "RP 30 SERV. VARIOS (CASOS)", "RP 31 PROBLEMAS FAMILIARES", "RP 32 CONTROL DE JUEGOS ELECTR.", "RP 33 REDADAS DE DROGADICTOS", "RP 34 CONTROL DE ESCOLARES", "RP 35 CONTROL INASISTENCIA", "RP 36 MENORES SE CUELGAN DE VL", "RP 37 DIRIGIR TRAFICO VEHICULAR", "RP 38 REDADAS DE ANTISOCIALES"];
const delitos = ["DH 202 ROBO", "DH 203 ATRACO", "DH 204 LESIONES GRAVES", "DH 205 INTENTO DE VIOLACION", "DH 206 VIOLACION", "DH 207 INTENTO DE SUICIDIO", "DH 208 HOMICIDIO", "DH 209 ASESINATO", "DH 210 EXISTE CADAVER", "DH 211 FETO ENCONTRADO", "DH 212 RAPTO", "DH 213 SECUESTRO", "DH 214 TERRORISMO", "DH 215 FALSIFICACION DE MONEDA", "DH 216 CHEQUE EN DESCUBIERTO", "DH 217 HUELGA PARO", "DH 218 ABANDONO HOGAR", "DH 219 DIFAMACION Y CALUMNIA", "DH 220 AMENAZAS", "DH 221 ALLANAMIENTOA DOM.", "DH 222 ESTAFA", "DH 223 ABUSO DE CONFIANZA", "DH 224 ABIGEATO", "DH 225 CASO DE DROGAS", "DH 226 INCENDIO", "DH 227 HECHO DE TRANSITO", "DH 228 AGIO ESPECULACION", "DH 229 DISPARO ARMA DE FUEGO", "DH 230 GOLPES DE ESTADO", "DH 231 EXISTENSIA DE EXPLOSIVO", "DH 232 EXHIBICIONISMO", "DH 233 FUGA DE RECLUSOS", "DH 234 DESPOJO"];

const DetalleAlerta = ({ alerta, onBack, onEnviarDespacho, onDesestimar }) => {
  const [playing, setPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  const [contravencion, setContravencion] = useState('');
  const [delito, setDelito] = useState('');
  const [prioridad, setPrioridad] = useState('');
  const [estadoValidacion, setEstadoValidacion] = useState('pendiente');
  const audioInterval = useRef(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleValidar = () => {
    const clasificacion = contravencion || delito;
    if (!clasificacion || !prioridad) {
      alert("Por favor, seleccione la clasificación y prioridad antes de validar la alerta");
      return;
    }
    setEstadoValidacion('validado');
  };

  const handleDesestimarAccion = () => {
    if (estadoValidacion === 'validado') return;

    if (window.confirm("¿Estás seguro de que deseas desestimar este reporte? Se eliminará de la lista actual.")) {
      if (onDesestimar) {
        onDesestimar(alerta?.id);
      } else {
        onBack();
      }
    }
  };

  const handleEnviarDespachoLocal = () => {
    const clasificacion = contravencion || delito;
    
    // MENSAJE SOLICITADO
    alert("Se ha transferido la alerta al centro de despacho exitosamente.");

    if (onEnviarDespacho) {
      onEnviarDespacho(alerta?.id, { clasificacion, prioridad });
    }
  };

  const getFileInfo = (fileName) => {
    const ext = fileName?.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) return { i: <FaFileImage />, c: 'text-blue-500', t: 'IMAGEN' };
    if (['mp4', 'mov', 'avi'].includes(ext)) return { i: <FaVideo />, c: 'text-rose-500', t: 'VIDEO' };
    if (ext === 'pdf') return { i: <FaFilePdf />, c: 'text-amber-500', t: 'DOCUMENTO PDF' };
    return { i: <FaFile />, c: 'text-slate-500', t: 'ARCHIVO' };
  };

  const toggleAudio = () => {
    if (!playing) {
      setPlaying(true);
      audioInterval.current = setInterval(() => {
        setAudioProgress(prev => (prev >= 100 ? (clearInterval(audioInterval.current), setPlaying(false), 0) : prev + 2));
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
    ...alerta 
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onBack} />

      <div className="relative w-full max-w-5xl max-h-[95vh] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col m-4">
        
        <div className="bg-[#1a5336] py-8 px-8 flex justify-between items-center text-white">
          <div className="flex items-center gap-3">
            <FaShieldAlt className="text-white/80" size={22} />
            <span className="text-lg font-extrabold uppercase tracking-wide">Gestión de Alerta Entrante</span>
          </div>
          <button onClick={onBack} className="hover:bg-white/20 p-2 rounded-full transition-colors">
            <FaTimes size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 p-8 md:p-12">
          <div className="-mt-3 grid grid-cols-1 lg:grid-cols-2 gap-12">
            
            <div className="space-y-8">
              <section>
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Datos del Ciudadano</h3>
                <div className="bg-slate-50 rounded-2xl p-8 border border-slate-100 shadow-md">
                  <div className="flex items-center gap-8">
                    <div className="w-28 h-24 rounded-[1.8rem] bg-white flex items-center justify-center text-slate-200 shadow-sm border border-slate-50">
                      <FaUser size={45} />
                    </div>
                    <div className="flex flex-col gap-2">
                      <h4 className="pl-2 text-xl font-bold text-slate-600 mb-2">{data.ciudadano}</h4>
                      <div className="space-y-1.5">
                        <div className="pl-2 flex items-center gap-3 text-slate-500">
                          <FaAddressCard className="text-slate-400" size={16} />
                          <span className="text-[13px] font-bold">CI: {data.ci}</span>
                        </div>
                        <div className=" pl-2 flex items-center gap-3 text-slate-500">
                          <FaPhone className="text-emerald-600" size={14} />
                          <span className="text-[13px] font-medium">{data.celular}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Evidencia Adjunta</h3>
                <div className="space-y-3">
                  {data.archivos && data.archivos.length > 0 ? (
                    data.archivos.map((archivo, idx) => {
                      const info = getFileInfo(archivo.nombre);
                      return (
                        <div key={idx} className="flex items-center justify-between p-4 bg-white border border-green-100 rounded-2xl">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center ${info.c}`}>{info.i}</div>
                            <div>
                              <p className="text-[10px] font-black text-slate-700 uppercase">{archivo.nombre}</p>
                              <p className="text-[9px] font-bold text-slate-400">{info.t}</p>
                            </div>
                          </div>
                          <FaDownloadIcon className="text-slate-300 hover:text-emerald-600 cursor-pointer" size={14} />
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[14px] font-medium text-slate-400">No se adjuntaron archivos.</p>
                  )}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section>
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Audio del Reporte</h3>
                <div className="bg-[#1a5336] rounded-2xl p-6 flex items-center gap-6 shadow-md">
                  <button onClick={toggleAudio} className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-[#1a5336]">
                    {playing ? <FaPause size={16} /> : <FaPlay size={16} className="ml-1" />}
                  </button>
                  <div className="flex-1">
                    <div className="flex justify-between text-[11px] font-semibold text-white/60 mb-2 uppercase">
                      <span>{playing ? "Reproduciendo..." : "Audio del ciudadano"}</span>
                      <span>{Math.floor(audioProgress / 100 * 120)}s / 120s</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                      <div className="h-full bg-white transition-all" style={{ width: `${audioProgress}%` }} />
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider mb-4">Relato del hecho</h3>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 relative">
                  <FaExclamationTriangle className="absolute -top-2 -left-2 text-green-900 bg-white rounded-md p-1 shadow-sm" size={22} />
                  <p className="text-[15px] font-bold text-slate-400">{data.relato}</p>
                </div>
              </section>

              <section className="space-y-4">
                <h3 className="text-[13px] font-bold text-gray-400 uppercase tracking-wider">Clasificación del Hecho</h3>
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <select 
                      className={`w-full p-4 pr-10 bg-white border-2 border-slate-200 rounded-2xl text-[14px] font-bold outline-none appearance-none tracking-wider duration-0 focus:border-slate-400 focus:ring-0 ${
                        !contravencion ? 'text-slate-500' : 'text-slate-600'
                      }`}
                      value={contravencion}
                      onChange={(e) => { setContravencion(e.target.value); setDelito(''); setEstadoValidacion('pendiente'); }}
                      disabled={!!delito || estadoValidacion === 'validado'}
                    >
                      <option value="" className="text-gray-400">Seleccionar Contravención</option>
                      {contravenciones.map(c => <option key={c} value={c} className="text-slate-700">{c}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>

                  <div className="mt-2 relative">
                    <select 
                      className={`w-full p-4 pr-10 bg-white border-2 border-slate-200 rounded-2xl text-[14px] font-bold outline-none appearance-none tracking-wider duration-0 focus:border-slate-400 focus:ring-0 ${
                        !delito ? 'text-slate-500' : 'text-slate-600'
                      }`}
                      value={delito}
                      onChange={(e) => { setDelito(e.target.value); setContravencion(''); setEstadoValidacion('pendiente'); }}
                      disabled={!!contravencion || estadoValidacion === 'validado'}
                    >
                      <option value="" className="text-gray-400">Seleccionar Delito</option>
                      {delitos.map(d => <option key={d} value={d} className="text-slate-700">{d}</option>)}
                    </select>
                    <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none">
                      <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path>
                      </svg>
                    </div>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-[14px] font-bold text-gray-400 uppercase tracking-wider mb-4">Nivel de Prioridad</h3>
                <div className="grid grid-cols-3 gap-6">
                  {['ALTA', 'MEDIA', 'BAJA'].map((p) => (
                    <button 
                      key={p}
                      disabled={estadoValidacion === 'validado'}
                      onClick={() => { setPrioridad(p); setEstadoValidacion('pendiente'); }}
                      className={`py-4 rounded-2xl border-2 font-bold text-[13px] tracking-widest transition-all ${
                        prioridad === p 
                        ? (p === 'ALTA' ? 'bg-red-600 border-red-600 text-white' : p === 'MEDIA' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-amber-500 border-amber-500 text-white') 
                        : 'bg-white border-slate-200 text-slate-500'
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

        <div className="-mt-3 p-8 bg-slate-50 border-t flex flex-wrap md:flex-nowrap gap-4">
          <button 
            onClick={handleDesestimarAccion}
            disabled={estadoValidacion === 'validado'}
            className={`flex items-center justify-center gap-2 py-2 px-6 rounded-2xl font-bold uppercase text-[14px] tracking-wider border-2 transition-all ${
              estadoValidacion === 'validado' 
              ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
              : 'bg-white text-orange-600 border-orange-500 hover:bg-orange-50'
            }`}
          >
            Desestimar Reporte
          </button>

          <button 
            onClick={handleValidar}
            className={`flex-1 py-2 rounded-2xl font-bold uppercase text-[14px] tracking-wider flex items-center justify-center gap-2 border-2 transition-all ${
              estadoValidacion === 'validado' 
              ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
              : 'bg-white border-blue-600 text-blue-600 hover:bg-blue-50'
            }`}
          >
            {estadoValidacion === 'validado' ? 'Alerta Validada' : 'Validar Clasificación'}
          </button>

          <button 
            onClick={handleEnviarDespachoLocal} 
            disabled={estadoValidacion !== 'validado'}
            className={`flex-[1.5] py-5 rounded-2xl font-bold uppercase text-[14px] tracking-wider shadow-xl flex items-center justify-center gap-3 transition-all ${
              estadoValidacion !== 'validado' 
              ? 'bg-gray-300 text-white cursor-not-allowed shadow-none' 
              : 'bg-emerald-900 text-white hover:bg-emerald-800'
            }`}
          >
            <FaCheckCircle size={16} /> Enviar a Despacho
          </button>
        </div>
      </div>
    </div>
  );
};

export default DetalleAlerta;
import React, { useState, useEffect, useRef, memo } from 'react';
import {
  FaUser, FaFileAlt, FaMapMarkerAlt,
  FaShieldAlt, FaBriefcase, FaTimes, FaHistory, FaSpinner
} from 'react-icons/fa';
import { supabase } from "../../services/supabase";
import { contravenciones, delitos } from "../../constants/CategoriasDelitos";
import { useAuth } from '../../context/AuthContext';

const FormularioTabulacion = ({ isOpen, onClose, alerta, onConfirm }) => {
  const { user } = useAuth();

  const [tipoSeleccion, setTipoSeleccion] = useState(null);
  const [contravencionValue, setContravencionValue] = useState('');
  const [delitoValue, setDelitoValue] = useState('');
  const [areaUrbana, setAreaUrbana] = useState('');
  const [areaRural, setAreaRural] = useState('');
  const [comuna, setComuna] = useState('');
  const [distrito, setDistrito] = useState('');
  const [subdistrito, setSubdistrito] = useState('');
  const [protagonistas, setProtagonistas] = useState('');
  const [remisionCaso, setRemisionCaso] = useState('');
  const [resumenAdministrativo, setResumenAdministrativo] = useState('');

  const [ciudadanoData, setCiudadanoData] = useState(null);

  const [idAsignacion, setIdAsignacion] = useState(null);
  const [idPatrullero, setIdPatrullero] = useState(null);
  const [idDespachador, setIdDespachador] = useState(null);
  const [idOperadorReceptor, setIdOperadorReceptor] = useState(null);

  const [nombreOperador, setNombreOperador] = useState('—');
  const [nombreDespachador, setNombreDespachador] = useState('—');
  const [nombrePatrullero, setNombrePatrullero] = useState('—');

  const [escalafon, setEscalafon] = useState('—');
  const [placa, setPlaca] = useState('—');
  const [epi, setEpi] = useState('EPI CENTRAL');
  const [reportePatrullero, setReportePatrullero] = useState('');

  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const isLoadingRef = useRef(false);

  const idAlerta = alerta?.id_alerta ?? alerta?.id;

  // Cargar datos UNA SOLA VEZ al abrir, sin dependencia problemática
  useEffect(() => {
    if (!isOpen || !idAlerta) return;
    if (isLoadingRef.current) return;

    const abortController = new AbortController();
    isLoadingRef.current = true;

    const cargar = async () => {
  setCargandoDatos(true);
  try {
    // 1. Alerta: ciudadano y operador receptor
    const { data: alertaRow, error: errorAlerta } = await supabase
      .from("alerta")
      .select(`id_usuario, id_operador_receptor, bloqueado_por`)
      .eq("id_alerta", idAlerta)
      .maybeSingle();

    if (errorAlerta) throw errorAlerta;

    if (alertaRow) {
      if (alertaRow.id_usuario) {
        const { data: ciudadano } = await supabase
          .from("usuario")
          .select("nombre_completo, ci, celular")
          .eq("id_usuario", alertaRow.id_usuario)
          .maybeSingle();
        setCiudadanoData(ciudadano);
      }
      
      // Lógica mejorada: usa id_operador_receptor o respalda con bloqueado_por
      const idOper = alertaRow.id_operador_receptor || alertaRow.bloqueado_por;
      setIdOperadorReceptor(idOper);

      if (idOper) {
        const { data: operador } = await supabase
          .from("oficial")
          .select("nombre_completo, numero_escalafon, placa")
          .eq("id_oficial", idOper)
          .maybeSingle();
        setNombreOperador(operador?.nombre_completo || `Operador #${idOper}`);


        
      }
    }

    // 2. Asignación (despachador y patrullero)
    const { data: asigRow } = await supabase
      .from("asignacion_patrulla")
      .select("id_asignacion, id_patrullero, id_oficial_asignador")
      .eq("id_alerta", idAlerta)
      .limit(1)
      .maybeSingle();

    if (asigRow) {
          setIdAsignacion(asigRow.id_asignacion);
          setIdPatrullero(asigRow.id_patrullero);
          setIdDespachador(asigRow.id_oficial_asignador ?? null);

      // Obtener despachador
          if (asigRow.id_oficial_asignador) {
            const { data: despachador } = await supabase
              .from("oficial")
              .select("nombre_completo")
              .eq("id_oficial", asigRow.id_oficial_asignador)
              .maybeSingle();
            setNombreDespachador(despachador?.nombre_completo || `Oficial #${asigRow.id_oficial_asignador}`);
          }

// Obtener patrullero y sus datos de placa/epi
          if (asigRow.id_patrullero) {
            // PRIMERO: Buscamos en la tabla patrullero para obtener el id_oficial
            const { data: patrulleroData } = await supabase
              .from("patrullero")
              .select("placa, id_oficial")
              .eq("id_patrullero", asigRow.id_patrullero)
              .maybeSingle();
            
            if (patrulleroData) {
              setPlaca(patrulleroData.placa || '—');
              
              // SEGUNDO: Con el id_oficial, buscamos en la tabla OFICIAL los datos extra
              if (patrulleroData.id_oficial) {
                const { data: oficialData } = await supabase
                  .from("oficial")
                  .select("nombre_completo, numero_escalafon, placa, epi") // <-- AQUI AGREGAMOS 'epi'
                  .eq("id_oficial", patrulleroData.id_oficial)
                  .maybeSingle();
                  
                if (oficialData) {
                  setNombrePatrullero(oficialData.nombre_completo || `Oficial #${patrulleroData.id_oficial}`);
                  setEscalafon(oficialData.numero_escalafon || '—');
                  setEpi(oficialData.epi || oficialData.cargo || 'EPI CENTRAL'); // Usa la columna epi de la tabla oficial
                }
              }
            }
          }
        }

    // 3. Reporte del patrullero
    if (asigRow?.id_patrullero) {
      const { data: reporteData } = await supabase
        .from("reporte_alerta")
        .select("descripcion_reporte")
        .eq("id_alerta", idAlerta)
        .eq("id_patrullero", asigRow.id_patrullero)
        .order("fecha_reporte", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (reporteData?.descripcion_reporte) {
        setReportePatrullero(reporteData.descripcion_reporte);
      }
    }

    if (alerta?.contravenciones) {
      setTipoSeleccion('contravencion');
      setContravencionValue(alerta.contravenciones);
    } else if (alerta?.delitos) {
      setTipoSeleccion('delito');
      setDelitoValue(alerta.delitos);
    }
    if (alerta?.derivacion) setRemisionCaso(alerta.derivacion);

  } catch (err) {
    if (err.name !== 'AbortError') console.error("Error cargando datos:", err);
  } finally {
    setCargandoDatos(false);
    isLoadingRef.current = false;
  }
};

    cargar();
    return () => {
      abortController.abort();
      isLoadingRef.current = false;
    };
  }, [idAlerta, isOpen]);

  // Resetear estado cuando se cierra
  useEffect(() => {
    if (!isOpen) return;
    return () => {
      // Limpiar si se cierra
      setTipoSeleccion(null);
      setContravencionValue('');
      setDelitoValue('');
      setAreaUrbana('');
      setAreaRural('');
      setComuna('');
      setDistrito('');
      setSubdistrito('');
      setProtagonistas('');
      setRemisionCaso('');
      setResumenAdministrativo('');
      setCiudadanoData(null);
      setIdAsignacion(null);
      setIdPatrullero(null);
      setIdDespachador(null);
      setIdOperadorReceptor(null);
      setNombreOperador('—');
      setNombreDespachador('—');
      setNombrePatrullero('—');
      setEscalafon('—');
      setPlaca('—');
      setEpi('EPI CENTRAL');
      setReportePatrullero('');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContravencionChange = (e) => {
    const v = e.target.value;
    if (v) {
      setTipoSeleccion('contravencion');
      setContravencionValue(v);
      setDelitoValue('');
    } else {
      setTipoSeleccion(null);
      setContravencionValue('');
    }
  };

  const handleDelitoChange = (e) => {
    const v = e.target.value;
    if (v) {
      setTipoSeleccion('delito');
      setDelitoValue(v);
      setContravencionValue('');
    } else {
      setTipoSeleccion(null);
      setDelitoValue('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!tipoSeleccion) {
      alert("Por favor seleccione una Contravención o un Delito.");
      return;
    }
    if (!resumenAdministrativo.trim()) {
      alert("El resumen administrativo es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      const [latStr, lngStr] = (alerta?.ubicacion || "").split(",").map(s => s?.trim());
      const idTabulador = user?.id_oficial || alerta?.id_tabulador || null;

      const { error } = await supabase
        .from("tabulacion_caso")
        .insert([{
          id_alerta: idAlerta,
          id_asignacion: idAsignacion ?? null,
          id_patrullero: idPatrullero ?? null,
          id_operador_receptor: idOperadorReceptor ?? null,
          id_despachador: idDespachador ?? null,
          id_tabulador: idTabulador,
          id_reporte: null,
          latitud: latStr ? parseFloat(latStr) : null,
          longitud: lngStr ? parseFloat(lngStr) : null,
          comuna: comuna || null,
          distrito: distrito || null,
          subdistrito: subdistrito || null,
          area_urbana: areaUrbana.trim() !== '',
          area_rural: areaRural.trim() !== '',
          protagonistas: protagonistas || null,
          remision_caso: remisionCaso || null,
          resumen_administrativo: resumenAdministrativo,
          resultado_final: contravencionValue || delitoValue,
          clasificacion_final: contravencionValue || delitoValue,
          id_estado_final: null,
          fecha_tabulacion: new Date().toISOString(),
        }]);

      if (error) {
        console.error("Error insertando tabulacion_caso:", error);
        alert("Error al guardar: " + error.message);
        return;
      }

      await supabase
        .from("alerta")
        .update({ id_estado_actual: 4 })
        .eq("id_alerta", idAlerta);

      if (onConfirm) onConfirm(idAlerta);
      onClose();
    } catch (err) {
      console.error("Error crítico:", err);
      alert("Ocurrió un error inesperado.");
    } finally {
      setGuardando(false);
    }
  };

  const cardStyle = "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full";
  const [latStr, lngStr] = (alerta?.ubicacion || "").split(",").map(s => s?.trim());

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-2">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-[1400px] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white">
        <div className="bg-[#1a5336] p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
              <FaShieldAlt size={14} />
            </div>
            <h1 className="text-lg font-black uppercase tracking-wider">Tabulación de alertas</h1>
            {alerta?.id && (
              <span className="px-2 py-0.5 bg-white/10 rounded-lg text-[10px] font-black tracking-widest">
                {alerta.id}
              </span>
            )}
          </div>
          <button type="button" onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition-colors">
            <FaTimes size={18} />
          </button>
        </div>

        {/* Contenedor scroll con estabilización CSS */}
        <div
          className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/30 min-h-0"
          style={{ overflowAnchor: 'none', transform: 'translateZ(0)' }}
        >
          {cargandoDatos && (
            <div className="flex items-center justify-center py-4 gap-2 text-slate-400">
              <FaSpinner className="animate-spin" size={14} />
              <span className="text-[11px] font-bold uppercase">Cargando datos...</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* 1. DATOS DE LA ALERTA */}
            <section className={cardStyle}>
              <HeaderSection icon={<FaFileAlt className="text-blue-600 text-sm"/>} title="Datos de la Alerta" bgColor="bg-blue-50" />
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="col-span-2">
                  <Field label="Nombre del Ciudadano" value={ciudadanoData?.nombre_completo || alerta?.ciudadano || "—"} auto required />
                </div>
                <Field label="Cédula" value={ciudadanoData?.ci || alerta?.ci || "—"} auto />
                <Field label="Celular" value={ciudadanoData?.celular || alerta?.celular || "—"} auto />
                <div className="col-span-2">
                  <Field
                    label="Clasificación del hecho"
                    value={contravencionValue || delitoValue || alerta?.contravenciones || alerta?.delitos || alerta?.categoria || "No clasificada"}
                    auto
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-500 ml-2">Descripción del hecho</label>
                  <textarea readOnly value={alerta?.descripcion || ""}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-medium italic text-slate-400 outline-none mt-1 h-20 resize-none" />
                </div>
              </div>
            </section>

            {/* 2. DIRECCIÓN */}
            <section className={cardStyle}>
              <HeaderSection icon={<FaMapMarkerAlt className="text-green-600 text-sm"/>} title="Dirección y Descripción" bgColor="bg-green-50" />
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-1.5">Área Urbana</label>
                  <input value={areaUrbana} onChange={e => setAreaUrbana(e.target.value)} placeholder="Zona de área urbana"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500 outline-none focus:ring-1 focus:ring-green-600 transition-all" />
                </div>
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-1.5">Área Rural</label>
                  <input value={areaRural} onChange={e => setAreaRural(e.target.value)} placeholder="Zona de área rural"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500 outline-none focus:ring-1 focus:ring-green-600 transition-all" />
                </div>
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-1.5">Comuna</label>
                  <input value={comuna} onChange={e => setComuna(e.target.value)} placeholder="Comuna"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500 outline-none focus:ring-1 focus:ring-green-600 transition-all" />
                </div>
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-1.5">Distrito</label>
                  <input value={distrito} onChange={e => setDistrito(e.target.value)} placeholder="Distrito"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500 outline-none focus:ring-1 focus:ring-green-600 transition-all" />
                </div>
                <div className="col-span-2 space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-1.5">Subdistrito</label>
                  <input value={subdistrito} onChange={e => setSubdistrito(e.target.value)} placeholder="Subdistrito"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500 outline-none focus:ring-1 focus:ring-green-600 transition-all" />
                </div>
                <Field label="Latitud" value={latStr || alerta?.lat || "—"} auto />
                <Field label="Longitud" value={lngStr || alerta?.lng || "—"} auto />
              </div>
            </section>

            {/* 3. CLASIFICACIÓN - ambos selects habilitados */}
            <section className={cardStyle}>
              <HeaderSection icon={<FaShieldAlt className="text-red-500 text-sm"/>} title="Clasificación del Hecho" bgColor="bg-red-50" />
              <div className="space-y-4 flex-1 justify-center flex flex-col">
                <SelectField
                  label="Contravención (RP)"
                  options={contravenciones}
                  value={contravencionValue}
                  onChange={handleContravencionChange}
                />
                <SelectField
                  label="Delitos (DH)"
                  options={delitos}
                  value={delitoValue}
                  onChange={handleDelitoChange}
                />
                {tipoSeleccion && (
                  <div className="mt-2 p-2 bg-slate-100 rounded-xl text-center">
                    <p className="text-[9px] font-black text-slate-500 uppercase">Clasificación elegida</p>
                    <p className="text-xs font-bold text-green-700 uppercase">
                      {tipoSeleccion === 'contravencion' ? contravencionValue : delitoValue}
                    </p>
                  </div>
                )}
              </div>
            </section>

            {/* 4. INFORME POLICIAL */}
            <section className={`${cardStyle} !bg-amber-50/30 !border-amber-100`}>
              <HeaderSection icon={<FaShieldAlt className="text-amber-600 text-sm"/>} title="Informe Policial" bgColor="bg-amber-100" />
              <div className="grid grid-cols-2 gap-3 flex-1">
                <Field label="Número de Escalafón" value={escalafon} auto />
                <Field label="Placa" value={placa} auto />
                <Field label="EPI" value={epi} auto />
                <div className="col-span-2 space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-2">Reporte Patrullero</label>
                  <div className="mt-1 p-3 bg-white border border-amber-100 rounded-xl text-xs italic text-slate-400 shadow-inner h-24 overflow-y-auto">
                    {reportePatrullero ? (
                      <p className="text-xs text-slate-600 font-medium">{reportePatrullero}</p>
                    ) : (
                      <p className="text-xs text-slate-400">"No se ha registrado un reporte del patrullero."</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* 5. SECRETARÍA */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <HeaderSection icon={<FaBriefcase className="text-purple-600 text-sm"/>} title="Tabulación para Secretaría" bgColor="bg-purple-50" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-2">Protagonistas</label>
                  <input required value={protagonistas} onChange={e => setProtagonistas(e.target.value)} placeholder="Nombres..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500 outline-none focus:ring-1 focus:ring-green-600 transition-all" />
                </div>
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-2">Remisión del Caso (Derivación)</label>
                  <input value={remisionCaso} onChange={e => setRemisionCaso(e.target.value)} placeholder="Ej: FELCC, Fiscalía, Bomberos..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500 outline-none focus:ring-1 focus:ring-green-600 transition-all" />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-500 ml-2 mb-1">Resumen Administrativo *</label>
                <textarea required value={resumenAdministrativo} onChange={e => setResumenAdministrativo(e.target.value)}
                  placeholder="Resumen administrativo obligatorio..."
                  className="w-full bg-slate-50 border border-purple-100 rounded-xl p-3 text-xs font-medium text-slate-500 outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white transition-all shadow-sm flex-1 min-h-[100px]" />
              </div>
            </div>
          </section>

          {/* HISTORIAL */}
          <div className="pt-3 px-2">
            <h2 className="flex items-center gap-1.5 font-black text-slate-500 uppercase text-[9px] tracking-wider mb-5">
              <FaHistory className="text-[#1a5336] text-xs" /> Historial de proceso
            </h2>
            <div className="relative flex justify-between items-start max-w-4xl mx-auto">
              <div className="absolute top-2 left-0 w-full h-[1px] bg-slate-200 -z-10" />
              <HistoryItem role="Operador Receptor" name={nombreOperador} />
              <HistoryItem role="Despachador" name={nombreDespachador} />
              <HistoryItem role="Patrullero" name={nombrePatrullero} />
              <HistoryItem role="Tabulador" name={user?.nombre_completo || "En curso"} highlight />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 font-black rounded-xl uppercase text-[9px] tracking-[0.15em] transition-all">
              Descartar
            </button>
            <button type="submit" disabled={guardando}
              className="px-6 py-2.5 bg-[#1a5336] hover:bg-[#133d28] text-white font-black rounded-xl uppercase text-[9px] tracking-[0.15em] transition-all shadow flex items-center gap-2 disabled:opacity-60">
              {guardando && <FaSpinner className="animate-spin" size={10} />}
              {guardando ? "Guardando..." : "Finalizar Tabulación"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

// Subcomponentes memoizados para evitar renders innecesarios
const HeaderSection = memo(({ icon, title, bgColor }) => (
  <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-4 shrink-0">
    <div className={`w-7 h-7 ${bgColor} rounded-lg flex items-center justify-center`}>{icon}</div>
    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h2>
  </div>
));

const SelectField = memo(({ label, options, value, onChange }) => (
  <div className="flex flex-col">
    <label className="text-xs font-medium text-slate-500 ml-2 mb-1">{label}</label>
    <select value={value} onChange={onChange}
      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-500 outline-none focus:ring-1 focus:ring-[#1a5336] transition-all">
      <option value="">Seleccione...</option>
      {options.map((item, i) => <option key={i} value={item}>{item}</option>)}
    </select>
  </div>
));

const Field = memo(({ label, value, auto, required }) => (
  <div className="space-y-0.5">
    <label className="text-xs font-medium text-slate-500 ml-1.5 tracking-tight">{label}</label>
    <input required={required} type="text" readOnly={auto} defaultValue={value}
      className="w-full rounded-xl p-2.5 text-xs font-bold outline-none border bg-slate-100/40 border-slate-100 text-slate-500" />
  </div>
));

const HistoryItem = memo(({ role, name, highlight }) => (
  <div className="flex flex-col items-center bg-transparent z-10 px-2">
    <div className={`w-7 h-7 rounded-full flex items-center justify-center border-2 mb-1 shadow-sm ${highlight ? 'bg-green-600 border-green-600 text-white scale-105' : 'bg-white border-slate-200 text-slate-400'}`}>
      <FaUser size={11} />
    </div>
    <div className="text-center bg-white px-1">
      <p className="text-[8px] font-black text-slate-400 uppercase leading-none mb-0.5">{role}</p>
      <p className={`text-[9px] font-black uppercase ${highlight ? 'text-green-700' : 'text-slate-600'}`}>{name}</p>
    </div>
  </div>
));

export default FormularioTabulacion;
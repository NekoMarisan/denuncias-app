import React, { useState, useEffect, useRef, memo } from 'react';
import {
  FaUser, FaFileAlt, FaMapMarkerAlt,
  FaShieldAlt, FaBriefcase, FaTimes, FaHistory, FaSpinner
} from 'react-icons/fa';
import { supabase } from "../../services/supabase";
import { contravenciones, delitos } from "../../constants/CategoriasDelitos";
import { useAuth } from '../../context/AuthContext';

const FormularioTabulacion = ({ isOpen, onClose, alerta, onConfirm, readOnly = false, clasificacionTabulador = null, derivacion = null }) => {
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
  const [epi, setEpi] = useState('—');
  const [reportePatrullero, setReportePatrullero] = useState('');

  // Clasificación original (de la alerta, del operador)
  const [clasificacionOriginal, setClasificacionOriginal] = useState('—');
  const [tipoClasificacionOriginal, setTipoClasificacionOriginal] = useState('CLASIFICACIÓN');

  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const isLoadingRef = useRef(false);
  const idAlerta = alerta?.id_alerta ?? alerta?.id;

  // --------------------------------------------------------------
  // Cuando es readOnly, cargamos los nombres y los campos guardados
  // --------------------------------------------------------------
  useEffect(() => {
    if (readOnly && isOpen && alerta) {
      const loadReadOnlyNames = async () => {
        // Operador Receptor
        if (alerta.id_operador_receptor) {
          const { data } = await supabase
            .from('oficial')
            .select('nombre_completo')
            .eq('id_oficial', alerta.id_operador_receptor)
            .maybeSingle();
          if (data) setNombreOperador(data.nombre_completo);
        }
        // Despachador
        if (alerta.id_despachador) {
          const { data } = await supabase
            .from('oficial')
            .select('nombre_completo')
            .eq('id_oficial', alerta.id_despachador)
            .maybeSingle();
          if (data) setNombreDespachador(data.nombre_completo);
        }
        // Patrullero
        if (alerta.id_patrullero) {
          const { data: patData } = await supabase
            .from('patrullero')
            .select('placa, epi, id_oficial')
            .eq('id_patrullero', alerta.id_patrullero)
            .maybeSingle();
          if (patData) {
            if (patData.placa) setPlaca(patData.placa);
            if (patData.epi) setEpi(patData.epi);
            if (patData.id_oficial) {
              const { data: ofData } = await supabase
                .from('oficial')
                .select('nombre_completo, numero_escalafon')
                .eq('id_oficial', patData.id_oficial)
                .maybeSingle();
              if (ofData) {
                setNombrePatrullero(ofData.nombre_completo);
                if (ofData.numero_escalafon) setEscalafon(ofData.numero_escalafon);
              }
            }
          }
        }
        // Cargar datos de dirección (texto literal)
        if (alerta.comuna !== undefined) setComuna(alerta.comuna || '');
        if (alerta.distrito !== undefined) setDistrito(alerta.distrito || '');
        if (alerta.subdistrito !== undefined) setSubdistrito(alerta.subdistrito || '');
        // area_urbana y area_rural: son texto, no booleano
        if (alerta.area_urbana !== undefined) setAreaUrbana(alerta.area_urbana || '');
        if (alerta.area_rural !== undefined) setAreaRural(alerta.area_rural || '');
        if (alerta.protagonistas !== undefined) setProtagonistas(alerta.protagonistas || '');
        if (alerta.resumen_administrativo !== undefined) setResumenAdministrativo(alerta.resumen_administrativo || '');
        if (alerta.remision_caso !== undefined) setRemisionCaso(alerta.remision_caso || '');
        
        // Clasificación del tabulador (resultado_final)
        if (clasificacionTabulador) {
          const esContra = contravenciones.some(c => c === clasificacionTabulador);
          if (esContra) {
            setContravencionValue(clasificacionTabulador);
            setDelitoValue('');
            setTipoSeleccion('contravencion');
          } else {
            setDelitoValue(clasificacionTabulador);
            setContravencionValue('');
            setTipoSeleccion('delito');
          }
        }
        // Derivación (desde asignacion_patrulla)
        if (derivacion) setRemisionCaso(derivacion);
      };
      loadReadOnlyNames();
    }
  }, [readOnly, isOpen, alerta, clasificacionTabulador, derivacion]);

  // --------------------------------------------------------------
  // Carga normal (cuando no es readOnly) – sin cambios en area_urbana/rural
  // --------------------------------------------------------------
  useEffect(() => {
    if (!isOpen || !idAlerta || readOnly) return;
    if (isLoadingRef.current) return;

    const abortController = new AbortController();
    isLoadingRef.current = true;

    const cargar = async () => {
      setCargandoDatos(true);
      try {
        // Datos de la alerta (ciudadano, operador receptor)
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
          const idOper = alertaRow.id_operador_receptor || alertaRow.bloqueado_por;
          setIdOperadorReceptor(idOper);
          if (idOper) {
            const { data: operador } = await supabase
              .from("oficial")
              .select("nombre_completo")
              .eq("id_oficial", idOper)
              .maybeSingle();
            setNombreOperador(operador?.nombre_completo || `Operador #${idOper}`);
          }
        }

        // Obtener asignación de patrulla (incluyendo derivación)
        let idPatrulleroEncontrado = null;
        let idAsignacionEncontrada = null;
        let idDespachadorEncontrado = null;
        let derivacionEncontrada = null;

        const { data: asigRow } = await supabase
          .from("asignacion_patrulla")
          .select("id_asignacion, id_patrullero, id_oficial_asignador, derivacion")
          .eq("id_alerta", idAlerta)
          .maybeSingle();

        if (asigRow) {
          idAsignacionEncontrada = asigRow.id_asignacion;
          idPatrulleroEncontrado = asigRow.id_patrullero;
          idDespachadorEncontrado = asigRow.id_oficial_asignador;
          derivacionEncontrada = asigRow.derivacion || '';
        }

        setIdAsignacion(idAsignacionEncontrada);
        setIdPatrullero(idPatrulleroEncontrado);
        setIdDespachador(idDespachadorEncontrado);
        setRemisionCaso(derivacionEncontrada);

        if (idDespachadorEncontrado) {
          const { data: despachador } = await supabase
            .from("oficial")
            .select("nombre_completo")
            .eq("id_oficial", idDespachadorEncontrado)
            .maybeSingle();
          setNombreDespachador(despachador?.nombre_completo || `Oficial #${idDespachadorEncontrado}`);
        }

        // Datos del patrullero
        if (idPatrulleroEncontrado) {
          const { data: patrulleroData, error: errPat } = await supabase
            .from("patrullero")
            .select("placa, epi, id_oficial")
            .eq("id_patrullero", idPatrulleroEncontrado)
            .maybeSingle();
          if (!errPat && patrulleroData) {
            setPlaca(patrulleroData.placa || '—');
            setEpi(patrulleroData.epi || '—');
            if (patrulleroData.id_oficial) {
              const { data: oficialData } = await supabase
                .from("oficial")
                .select("nombre_completo, numero_escalafon")
                .eq("id_oficial", patrulleroData.id_oficial)
                .maybeSingle();
              if (oficialData) {
                setNombrePatrullero(oficialData.nombre_completo || `Oficial #${patrulleroData.id_oficial}`);
                setEscalafon(oficialData.numero_escalafon || '—');
              }
            }
          }
        }

        // Reporte del patrullero
        if (idPatrulleroEncontrado) {
          const { data: reporteData } = await supabase
            .from("reporte_alerta")
            .select("descripcion_reporte")
            .eq("id_alerta", idAlerta)
            .eq("id_patrullero", idPatrulleroEncontrado)
            .order("fecha_reporte", { ascending: false })
            .limit(1)
            .maybeSingle();
          if (reporteData?.descripcion_reporte) setReportePatrullero(reporteData.descripcion_reporte);
        }

        // Obtener la clasificación original de la alerta
        const contraOriginal = alerta?.contravenciones || null;
        const delitoOriginal = alerta?.delitos || null;
        if (contraOriginal) {
          setClasificacionOriginal(contraOriginal);
          setTipoClasificacionOriginal("CONTRAVENCIÓN");
        } else if (delitoOriginal) {
          setClasificacionOriginal(delitoOriginal);
          setTipoClasificacionOriginal("DELITO");
        } else {
          setClasificacionOriginal("NO CLASIFICADA");
          setTipoClasificacionOriginal("CLASIFICACIÓN");
        }

        // NOTA: area_urbana, area_rural, comuna, distrito, subdistrito, protagonistas, resumen_administrativo
        // NO se precargan en modo edición porque el tabulador los escribe desde cero.
        // (Si se quisiera editar una tabulación existente, habría que traerlos de tabulacion_caso,
        // pero por ahora no se usa edición.)

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
  }, [idAlerta, isOpen, alerta, readOnly]);

  // Resetear estado al cerrar
  useEffect(() => {
    if (!isOpen) return;
    return () => {
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
      setEpi('—');
      setReportePatrullero('');
      setClasificacionOriginal('—');
      setTipoClasificacionOriginal('CLASIFICACIÓN');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleContravencionChange = (e) => {
    if (readOnly) return;
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
    if (readOnly) return;
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
    if (readOnly) return;
    if (!resumenAdministrativo.trim()) {
      alert("El resumen administrativo es obligatorio.");
      return;
    }

    setGuardando(true);
    try {
      const [latStr, lngStr] = (alerta?.ubicacion || "").split(",").map(s => s?.trim());
      const idTabulador = user?.id_oficial || alerta?.id_tabulador || null;

      let clasificacionFinal = contravencionValue || delitoValue;
      if (!clasificacionFinal) {
        clasificacionFinal = clasificacionOriginal !== "NO CLASIFICADA" ? clasificacionOriginal : null;
      }

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
          // 🟢 Guardar el texto literal (sin convertir a booleano)
          area_urbana: areaUrbana || null,
          area_rural: areaRural || null,
          protagonistas: protagonistas || null,
          remision_caso: remisionCaso || null,
          resumen_administrativo: resumenAdministrativo,
          resultado_final: clasificacionFinal,
          id_estado_final: null,
          fecha_tabulacion: new Date().toISOString(),
        }]);

      if (error) throw error;

      await supabase
        .from("alerta")
        .update({ id_estado_actual: 4 })
        .eq("id_alerta", idAlerta);

      if (onConfirm) onConfirm(idAlerta);
      onClose();
    } catch (err) {
      console.error("Error al guardar tabulación:", err);
      alert("Error: " + err.message);
    } finally {
      setGuardando(false);
    }
  };

  const cardStyle = "bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full";
  const [latStr, lngStr] = (alerta?.ubicacion || "").split(",").map(s => s?.trim());

  const mostrarClasificacionElegida = () => {
    if (contravencionValue || delitoValue) {
      return {
        texto: contravencionValue || delitoValue,
        tipo: contravencionValue ? "CONTRAVENCIÓN" : "DELITO"
      };
    } else if (clasificacionOriginal && clasificacionOriginal !== "NO CLASIFICADA") {
      return {
        texto: clasificacionOriginal,
        tipo: tipoClasificacionOriginal
      };
    } else {
      return null;
    }
  };

  const clasificacionActual = mostrarClasificacionElegida();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-2">
      <form onSubmit={handleSubmit} className="bg-white w-full max-w-[1400px] h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-white">
        <div className="bg-[#1a5336] p-4 flex justify-between items-center text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center border border-white/20">
              <FaShieldAlt size={14} />
            </div>
            <h1 className="text-lg font-black uppercase tracking-wider">
              {readOnly ? "VER TABULACIÓN" : "TABULACIÓN DE ALERTAS"}
            </h1>
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

        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-slate-50/30 min-h-0">
          {cargandoDatos && (
            <div className="flex items-center justify-center py-4 gap-2 text-slate-400">
              <FaSpinner className="animate-spin" size={14} />
              <span className="text-[11px] font-bold uppercase">CARGANDO DATOS...</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* DATOS DE LA ALERTA */}
            <section className={cardStyle}>
              <HeaderSection icon={<FaFileAlt className="text-blue-600 text-sm"/>} title="DATOS DE LA ALERTA" bgColor="bg-blue-50" />
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="col-span-2">
                  <Field label="NOMBRE DEL CIUDADANO" value={ciudadanoData?.nombre_completo || alerta?.ciudadano || "—"} readOnly required />
                </div>
                <Field label="CÉDULA" value={ciudadanoData?.ci || alerta?.ci || "—"} readOnly />
                <Field label="CELULAR" value={ciudadanoData?.celular || alerta?.celular || "—"} readOnly />
                <div className="col-span-2">
                  <Field
                    label="CLASIFICACIÓN ORIGINAL DEL HECHO"
                    value={clasificacionOriginal}
                    readOnly
                  />
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-500 ml-2">DESCRIPCIÓN DEL HECHO</label>
                  <textarea readOnly value={alerta?.descripcion || ""}
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-xs font-medium italic text-slate-400 outline-none mt-1 h-20 resize-none" />
                </div>
              </div>
            </section>

            {/* DIRECCIÓN */}
            <section className={cardStyle}>
              <HeaderSection icon={<FaMapMarkerAlt className="text-green-600 text-sm"/>} title="DIRECCIÓN Y DESCRIPCIÓN" bgColor="bg-green-50" />
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-1.5">ÁREA URBANA</label>
                  <input value={areaUrbana} onChange={e => !readOnly && setAreaUrbana(e.target.value)} placeholder="Zona de área urbana"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500 outline-none focus:ring-1 focus:ring-green-600"
                    disabled={readOnly} />
                </div>
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-1.5">ÁREA RURAL</label>
                  <input value={areaRural} onChange={e => !readOnly && setAreaRural(e.target.value)} placeholder="Zona de área rural"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500 outline-none focus:ring-1 focus:ring-green-600"
                    disabled={readOnly} />
                </div>
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-1.5">COMUNA</label>
                  <input value={comuna} onChange={e => !readOnly && setComuna(e.target.value)} placeholder="Comuna"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500"
                    disabled={readOnly} />
                </div>
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-1.5">DISTRITO</label>
                  <input value={distrito} onChange={e => !readOnly && setDistrito(e.target.value)} placeholder="Distrito"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500"
                    disabled={readOnly} />
                </div>
                <div className="col-span-2 space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-1.5">SUBDISTRITO</label>
                  <input value={subdistrito} onChange={e => !readOnly && setSubdistrito(e.target.value)} placeholder="Subdistrito"
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500"
                    disabled={readOnly} />
                </div>
                <Field label="LATITUD" value={latStr || alerta?.lat || "—"} readOnly />
                <Field label="LONGITUD" value={lngStr || alerta?.lng || "—"} readOnly />
              </div>
            </section>

            {/* CLASIFICACIÓN DEL HECHO (TABULADOR) */}
            <section className={cardStyle}>
              <HeaderSection icon={<FaShieldAlt className="text-red-500 text-sm"/>} title="CLASIFICACIÓN DEL HECHO (TABULADOR)" bgColor="bg-red-50" />
              <div className="space-y-4 flex-1 justify-center flex flex-col">
                <SelectField
                  label="CONTRAVENCIÓN (RP)"
                  options={contravenciones}
                  value={contravencionValue}
                  onChange={handleContravencionChange}
                  disabled={readOnly}
                />
                <SelectField
                  label="DELITOS (DH)"
                  options={delitos}
                  value={delitoValue}
                  onChange={handleDelitoChange}
                  disabled={readOnly}
                />
                <div className="mt-2 p-2 bg-slate-100 rounded-xl text-center">
                  <p className="text-[9px] font-black text-slate-500 uppercase">
                    {contravencionValue || delitoValue ? "CLASIFICACIÓN ELEGIDA" : "CLASIFICACIÓN A GUARDAR"}
                  </p>
                  <p className="text-xs font-bold text-green-700 uppercase">
                    {clasificacionActual ? (
                      `${clasificacionActual.tipo}: ${clasificacionActual.texto}`
                    ) : (
                      "SIN CLASIFICACIÓN"
                    )}
                  </p>
                  {!contravencionValue && !delitoValue && clasificacionOriginal !== "NO CLASIFICADA" && (
                    <p className="text-[8px] text-amber-600 mt-1">(Se usará la clasificación original del operador)</p>
                  )}
                </div>
              </div>
            </section>

            {/* INFORME POLICIAL */}
            <section className={`${cardStyle} !bg-amber-50/30 !border-amber-100`}>
              <HeaderSection icon={<FaShieldAlt className="text-amber-600 text-sm"/>} title="INFORME POLICIAL" bgColor="bg-amber-100" />
              <div className="grid grid-cols-2 gap-3 flex-1">
                <Field label="NÚMERO DE ESCALAFÓN" value={escalafon} readOnly />
                <Field label="PLACA" value={placa} readOnly />
                <Field label="EPI" value={epi} readOnly />
                <div className="col-span-2 space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-2">REPORTE PATRULLERO</label>
                  <div className="mt-1 p-3 bg-white border border-amber-100 rounded-xl text-xs italic text-slate-400 shadow-inner h-24 overflow-y-auto">
                    {reportePatrullero ? (
                      <p className="text-xs text-slate-600 font-medium">{reportePatrullero}</p>
                    ) : (
                      <p className="text-xs text-slate-400">"NO SE HA REGISTRADO UN REPORTE DEL PATRULLERO."</p>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* SECRETARÍA */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <HeaderSection icon={<FaBriefcase className="text-purple-600 text-sm"/>} title="TABULACIÓN PARA SECRETARÍA" bgColor="bg-purple-50" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-2">PROTAGONISTAS</label>
                  <input required value={protagonistas} onChange={e => !readOnly && setProtagonistas(e.target.value)} placeholder="Nombres..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500 outline-none focus:ring-1 focus:ring-green-600"
                    disabled={readOnly} />
                </div>
                <div className="space-y-0.5">
                  <label className="text-xs font-medium text-slate-500 ml-2">REMISIÓN DEL CASO (DERIVACIÓN)</label>
                  <input value={remisionCaso} onChange={e => !readOnly && setRemisionCaso(e.target.value)} placeholder="Ej: FELCC, Fiscalía, Bomberos..."
                    className="w-full bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-xs font-semibold text-slate-500"
                    disabled={readOnly} />
                </div>
              </div>
              <div className="flex flex-col">
                <label className="text-xs font-medium text-slate-500 ml-2 mb-1">RESUMEN ADMINISTRATIVO *</label>
                <textarea required value={resumenAdministrativo} onChange={e => !readOnly && setResumenAdministrativo(e.target.value)}
                  placeholder="Resumen administrativo obligatorio..."
                  className="w-full bg-slate-50 border border-purple-100 rounded-xl p-3 text-xs font-medium text-slate-500 outline-none focus:ring-1 focus:ring-slate-400 focus:bg-white transition-all shadow-sm flex-1 min-h-[100px]"
                  disabled={readOnly} />
              </div>
            </div>
          </section>

          {/* HISTORIAL */}
          <div className="pt-3 px-2">
            <h2 className="flex items-center gap-1.5 font-black text-slate-500 uppercase text-[9px] tracking-wider mb-5">
              <FaHistory className="text-[#1a5336] text-xs" /> HISTORIAL DE PROCESO
            </h2>
            <div className="relative flex justify-between items-start max-w-4xl mx-auto">
              <div className="absolute top-2 left-0 w-full h-[1px] bg-slate-200 -z-10" />
              <HistoryItem role="OPERADOR RECEPTOR" name={nombreOperador} />
              <HistoryItem role="DESPACHADOR" name={nombreDespachador} />
              <HistoryItem role="PATRULLERO" name={nombrePatrullero} />
              <HistoryItem role="TABULADOR" name={user?.nombre_completo || "EN CURSO"} highlight />
            </div>
          </div>

          <div className="flex justify-end gap-4 pt-4 border-t border-slate-100">
            <button type="button" onClick={onClose}
              className="px-6 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 font-black rounded-xl uppercase text-[9px] tracking-[0.15em] transition-all">
              {readOnly ? "CERRAR" : "DESCARTAR"}
            </button>
            {!readOnly && (
              <button type="submit" disabled={guardando}
                className="px-6 py-2.5 bg-[#1a5336] hover:bg-[#133d28] text-white font-black rounded-xl uppercase text-[9px] tracking-[0.15em] transition-all shadow flex items-center gap-2 disabled:opacity-60">
                {guardando && <FaSpinner className="animate-spin" size={10} />}
                {guardando ? "GUARDANDO..." : "FINALIZAR TABULACIÓN"}
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};

// Componentes memoizados (sin cambios)
const HeaderSection = memo(({ icon, title, bgColor }) => (
  <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-4 shrink-0">
    <div className={`w-7 h-7 ${bgColor} rounded-lg flex items-center justify-center`}>{icon}</div>
    <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.15em]">{title}</h2>
  </div>
));

const SelectField = memo(({ label, options, value, onChange, disabled }) => (
  <div className="flex flex-col">
    <label className="text-xs font-medium text-slate-500 ml-2 mb-1">{label}</label>
    <select value={value} onChange={onChange} disabled={disabled}
      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-bold text-slate-500 outline-none focus:ring-1 focus:ring-[#1a5336] transition-all disabled:opacity-60 disabled:bg-gray-100">
      <option value="">SELECCIONE...</option>
      {options.map((item, i) => <option key={i} value={item}>{item}</option>)}
    </select>
  </div>
));

const Field = memo(({ label, value, readOnly = true, required = false }) => (
  <div className="space-y-0.5">
    <label className="text-xs font-medium text-slate-500 ml-1.5 tracking-tight">{label}</label>
    <input
      required={required}
      type="text"
      readOnly={readOnly}
      value={value || '—'}
      className="w-full rounded-xl p-2.5 text-xs font-bold outline-none border bg-slate-100/40 border-slate-100 text-slate-500"
    />
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
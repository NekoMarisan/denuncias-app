import React, { useState, useEffect, useRef, memo } from 'react';
import {
  FaUser, FaFileAlt, FaMapMarkerAlt, FaChevronDown,
  FaShieldAlt, FaBriefcase, FaTimes, FaHistory, FaSpinner, FaCheckCircle, FaUserShield
} from 'react-icons/fa';
import { supabase } from "../../services/supabase";
import { contravenciones, delitos } from "../../constants/CategoriasDelitos";
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { FormularioTabulacionSkeleton } from '../ui/Skeleton';

const FormularioTabulacion = ({ isOpen, onClose, alerta, onConfirm, readOnly = false, clasificacionTabulador = null, derivacion = null }) => {
  const { user } = useAuth();
  const { showToast } = useToast(); 

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
  const [nombreDerivacion, setNombreDerivacion] = useState('—');

  const [escalafon, setEscalafon] = useState('—');
  const [placa, setPlaca] = useState('—');
  const [epi, setEpi] = useState('—');
  const [reportePatrullero, setReportePatrullero] = useState('');

  const [clasificacionOriginal, setClasificacionOriginal] = useState('—');
  const [tipoClasificacionOriginal, setTipoClasificacionOriginal] = useState('CLASIFICACIÓN');

  const [cargandoDatos, setCargandoDatos] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const isLoadingRef = useRef(false);
  const idAlerta = alerta?.id_alerta ?? alerta?.id;

  const [isDerivacionLocked, setIsDerivacionLocked] = useState(false);
  const [latitudFinal, setLatitudFinal] = useState('');
  const [longitudFinal, setLongitudFinal] = useState('');
  
  const [fechaTabulacion, setFechaTabulacion] = useState(null);

  // --------------------------------------------------------------
  // Cuando es readOnly, cargamos todos los campos guardados
  // --------------------------------------------------------------
    useEffect(() => {
      if (readOnly && isOpen && alerta) {
        const loadReadOnlyData = async () => {
          setCargandoDatos(true);
          try {
          if (alerta.fecha_tabulacion) {
          setFechaTabulacion(alerta.fecha_tabulacion);
        } else {
          const { data: tabData } = await supabase
            .from('tabulacion_caso')
            .select('fecha_tabulacion')
            .eq('id_alerta', idAlerta)
            .maybeSingle();
          if (tabData?.fecha_tabulacion) setFechaTabulacion(tabData.fecha_tabulacion);
        }

        if (alerta.id_operador_receptor) {
          const { data } = await supabase
            .from('oficial')
            .select('nombre_completo')
            .eq('id_oficial', alerta.id_operador_receptor)
            .maybeSingle();
          if (data) setNombreOperador(data.nombre_completo);
        }
        if (alerta.id_despachador) {
          const { data } = await supabase
            .from('oficial')
            .select('nombre_completo')
            .eq('id_oficial', alerta.id_despachador)
            .maybeSingle();
          if (data) setNombreDespachador(data.nombre_completo);
        }
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
        if (alerta.comuna !== undefined) setComuna(alerta.comuna || '');
        if (alerta.distrito !== undefined) setDistrito(alerta.distrito || '');
        if (alerta.subdistrito !== undefined) setSubdistrito(alerta.subdistrito || '');
        if (alerta.area_urbana !== undefined) setAreaUrbana(alerta.area_urbana || '');
        if (alerta.area_rural !== undefined) setAreaRural(alerta.area_rural || '');
        if (alerta.protagonistas !== undefined) setProtagonistas(alerta.protagonistas || '');
        if (alerta.resumen_administrativo !== undefined) setResumenAdministrativo(alerta.resumen_administrativo || '');
        if (alerta.remision_caso !== undefined) setRemisionCaso(alerta.remision_caso || '');

        if (alerta.id_alerta) {
          const { data: asigDeriv } = await supabase
  .from("asignacion_patrulla")
  .select("derivacion_por")
  .eq("id_alerta", alerta.id_alerta)
  .order("fecha_asignacion", { ascending: false })
  .limit(1)
  .maybeSingle();
          if (asigDeriv?.derivacion_por) {
            const { data: ofDerivacion } = await supabase
              .from("oficial")
              .select("nombre_completo")
              .eq("id_oficial", asigDeriv.derivacion_por)
              .maybeSingle();
            setNombreDerivacion(ofDerivacion?.nombre_completo || `Oficial #${asigDeriv.derivacion_por}`);
          }
        }

if (alerta.id_patrullero && idAlerta) {
  const { data: reporteData } = await supabase
    .from("reporte_alerta")
    .select("descripcion_reporte")
    .eq("id_alerta", idAlerta)
    .eq("id_patrullero", alerta.id_patrullero)
    .order("fecha_reporte", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (reporteData?.descripcion_reporte) setReportePatrullero(reporteData.descripcion_reporte);
}
        
        if (alerta.latitud !== undefined && alerta.latitud !== null) setLatitudFinal(alerta.latitud.toString());
        else if (alerta.ubicacion && alerta.ubicacion.includes(',')) {
          const [lat, lng] = alerta.ubicacion.split(',').map(s => s.trim());
          setLatitudFinal(lat);
          setLongitudFinal(lng);
        }
        if (alerta.longitud !== undefined && alerta.longitud !== null) setLongitudFinal(alerta.longitud.toString());
        else if (alerta.ubicacion && alerta.ubicacion.includes(',')) {
          const [lat, lng] = alerta.ubicacion.split(',').map(s => s.trim());
          setLatitudFinal(lat);
          setLongitudFinal(lng);
        }

        if (clasificacionTabulador) {
          const valorNormalizado = clasificacionTabulador.trim();
          const esContra = contravenciones.some(c => c.trim().toLowerCase() === valorNormalizado.toLowerCase());
          if (esContra) {
            setContravencionValue(valorNormalizado);
            setDelitoValue('');
            setTipoSeleccion('contravencion');
          } else {
            setDelitoValue(valorNormalizado);
            setContravencionValue('');
            setTipoSeleccion('delito');
          }
        } else {
          const { data: tabDB } = await supabase
            .from("tabulacion_caso")
            .select("resultado_final")
            .eq("id_alerta", idAlerta)
            .maybeSingle();
          if (tabDB?.resultado_final) {
            const val = tabDB.resultado_final.trim();
            const esContra = contravenciones.some(c => c.trim().toLowerCase() === val.toLowerCase());
            if (esContra) {
              setContravencionValue(val);
              setDelitoValue('');
              setTipoSeleccion('contravencion');
            } else {
              setDelitoValue(val);
              setContravencionValue('');
              setTipoSeleccion('delito');
            }
          } else {
            setContravencionValue('');
            setDelitoValue('');
            setTipoSeleccion(null);
          }
        }

        // Cargar clasificación desde la alerta (contravenciones/delitos)
        const contraOriginal = alerta?.contravenciones || null;
        const delitoOriginal = alerta?.delitos || null;

        if (contraOriginal) {
          setClasificacionOriginal(contraOriginal);
          setTipoClasificacionOriginal("CONTRAVENCIÓN");
        } else if (delitoOriginal) {
          setClasificacionOriginal(delitoOriginal);
          setTipoClasificacionOriginal("DELITO");
        } else {
          const { data: alertaDB } = await supabase
            .from("alerta")
            .select("contravenciones, delitos")
            .eq("id_alerta", idAlerta)
            .maybeSingle();
          if (alertaDB?.contravenciones) {
            setClasificacionOriginal(alertaDB.contravenciones);
            setTipoClasificacionOriginal("CONTRAVENCIÓN");
          } else if (alertaDB?.delitos) {
            setClasificacionOriginal(alertaDB.delitos);
            setTipoClasificacionOriginal("DELITO");
          } else {
            setClasificacionOriginal("NO CLASIFICADA");
            setTipoClasificacionOriginal("CLASIFICACIÓN");
          }
        }

        if (derivacion) setRemisionCaso(derivacion);
          } catch (err) {
            console.error("Error cargando datos de solo lectura:", err);
          } finally {
            setCargandoDatos(false);
          }
      };
      loadReadOnlyData();
    }
  }, [readOnly, isOpen, alerta, clasificacionTabulador, derivacion, idAlerta]);

  useEffect(() => {
    if (!isOpen || !idAlerta || readOnly) return;
    if (isLoadingRef.current) return;

    const abortController = new AbortController();
    isLoadingRef.current = true;

    const cargar = async () => {
      setCargandoDatos(true);
      try {
        const { data: alertaRow, error: errorAlerta } = await supabase
          .from("alerta")
          .select(`id_usuario, id_operador_receptor, bloqueado_por, ubicacion`)
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
          if (alertaRow.ubicacion && alertaRow.ubicacion.includes(',')) {
            const [lat, lng] = alertaRow.ubicacion.split(',').map(s => s.trim());
            setLatitudFinal(lat);
            setLongitudFinal(lng);
          }
        }

        let idPatrulleroEncontrado = null;
        let idAsignacionEncontrada = null;
        let idDespachadorEncontrado = null;
        let derivacionEncontrada = null;

        const { data: asigRow } = await supabase
  .from("asignacion_patrulla")
  .select("id_asignacion, id_patrullero, id_oficial_asignador, derivacion, derivacion_por")
  .eq("id_alerta", idAlerta)
  .order("fecha_asignacion", { ascending: false })
  .limit(1)
  .maybeSingle();

        if (asigRow) {
          idAsignacionEncontrada = asigRow.id_asignacion;
          idPatrulleroEncontrado = asigRow.id_patrullero;
          idDespachadorEncontrado = asigRow.id_oficial_asignador;
          derivacionEncontrada = asigRow.derivacion || '';

          if (asigRow.derivacion_por) {
            const { data: ofDerivacion } = await supabase
              .from("oficial")
              .select("nombre_completo")
              .eq("id_oficial", asigRow.derivacion_por)
              .maybeSingle();
            setNombreDerivacion(ofDerivacion?.nombre_completo || `Oficial #${asigRow.derivacion_por}`);
          }
        }

        setIdAsignacion(idAsignacionEncontrada);
        setIdPatrullero(idPatrulleroEncontrado);
        setIdDespachador(idDespachadorEncontrado);
        
        if (derivacionEncontrada && derivacionEncontrada.trim() !== "") {
          setRemisionCaso(derivacionEncontrada);
          setIsDerivacionLocked(true);
        } else {
          setRemisionCaso("SIN DERIVACIÓN");
          setIsDerivacionLocked(false);
        }

        if (idDespachadorEncontrado) {
          const { data: despachador } = await supabase
            .from("oficial")
            .select("nombre_completo")
            .eq("id_oficial", idDespachadorEncontrado)
            .maybeSingle();
          setNombreDespachador(despachador?.nombre_completo || `Oficial #${idDespachadorEncontrado}`);
        }

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

        const contraOriginal = alerta?.contravenciones || null;
        const delitoOriginal = alerta?.delitos || null;

        if (contraOriginal) {
          setClasificacionOriginal(contraOriginal);
          setTipoClasificacionOriginal("CONTRAVENCIÓN");
        } else if (delitoOriginal) {
          setClasificacionOriginal(delitoOriginal);
          setTipoClasificacionOriginal("DELITO");
        } else {
          const { data: alertaDB } = await supabase
            .from("alerta")
            .select("contravenciones, delitos")
            .eq("id_alerta", idAlerta)
            .maybeSingle();
          if (alertaDB?.contravenciones) {
            setClasificacionOriginal(alertaDB.contravenciones);
            setTipoClasificacionOriginal("CONTRAVENCIÓN");
          } else if (alertaDB?.delitos) {
            setClasificacionOriginal(alertaDB.delitos);
            setTipoClasificacionOriginal("DELITO");
          } else {
            setClasificacionOriginal("NO CLASIFICADA");
            setTipoClasificacionOriginal("CLASIFICACIÓN");
          }
        }

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
      setNombreDerivacion('—');
      setEscalafon('—');
      setPlaca('—');
      setEpi('—');
      setReportePatrullero('');
      setClasificacionOriginal('—');
      setTipoClasificacionOriginal('CLASIFICACIÓN');
      setIsDerivacionLocked(false);
      setLatitudFinal('');
      setLongitudFinal('');
      setFechaTabulacion(null);
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

  // ✅ HANDLE SUBMIT con validaciones y toast
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (readOnly) return;

    // Validar Resumen Administrativo
    if (!resumenAdministrativo.trim()) {
      showToast("Complete el campo Resumen Administrativo", "error");
      return;
    }

    // Validar que haya una clasificación final (ya sea seleccionada o la original)
    let clasificacionFinal = contravencionValue || delitoValue;
    if (!clasificacionFinal) {
      if (clasificacionOriginal && clasificacionOriginal !== "NO CLASIFICADA") {
        clasificacionFinal = clasificacionOriginal;
      } else {
        showToast("Debe seleccionar una Contravención o un Delito, o asegurar que la alerta tenga una clasificación válida.", "error");
        return;
      }
    }

    setGuardando(true);
    try {
      const idTabulador = user?.id_oficial || alerta?.id_tabulador || null;

      // Validar y parsear coordenadas
      const lat = latitudFinal ? parseFloat(latitudFinal) : null;
      const lng = longitudFinal ? parseFloat(longitudFinal) : null;
      if (latitudFinal && isNaN(lat)) {
        showToast("Latitud inválida", "error");
        setGuardando(false);
        return;
      }
      if (longitudFinal && isNaN(lng)) {
        showToast("Longitud inválida", "error");
        setGuardando(false);
        return;
      }

      const urbana = areaUrbana || null;
      const rural = areaRural || null;

      const nuevoRegistro = {
        id_alerta: idAlerta,
        id_asignacion: idAsignacion ?? null,
        id_patrullero: idPatrullero ?? null,
        id_operador_receptor: idOperadorReceptor ?? null,
        id_despachador: idDespachador ?? null,
        id_tabulador: idTabulador,
        latitud: lat,
        longitud: lng,
        comuna: comuna || null,
        distrito: distrito || null,
        subdistrito: subdistrito || null,
        area_urbana: urbana,
        area_rural: rural,
        protagonistas: protagonistas || null,
        remision_caso: remisionCaso,
        resumen_administrativo: resumenAdministrativo,
        resultado_final: clasificacionFinal,
        fecha_tabulacion: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("tabulacion_caso")
        .insert([nuevoRegistro]);

      if (error) throw error;

      // Actualizar estado de la alerta a 4 (TABULADA / CERRADA)
      const { error: updateError } = await supabase
        .from("alerta")
        .update({ id_estado_actual: 4 })
        .eq("id_alerta", idAlerta);

      if (updateError) throw updateError;

      await supabase.from("log_actividad").insert([{
        id_oficial: idTabulador,
        id_alerta: idAlerta,
        accion: "TABULACIÓN",
        descripcion: `Tabuló caso #${idAlerta} — Resultado: ${clasificacionFinal || "—"}`,
      }]);

      showToast("Alerta tabulado correctamente", "success");
      if (onConfirm) onConfirm(idAlerta);
      onClose();
    } catch (err) {
      console.error("Error al guardar tabulación:", err);
      showToast("Error al guardar: " + err.message, "error");
    } finally {
      setGuardando(false);
    }
  };

const cardStyle = "bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_10px_10px_-8px_rgba(15,23,42,0.25)] flex flex-col h-full";

  const mostrarClasificacionElegida = () => {
    if (readOnly && clasificacionTabulador) {
      const esContra = contravenciones.some(c => c.trim().toLowerCase() === clasificacionTabulador.trim().toLowerCase());
      return {
        texto: clasificacionTabulador,
        tipo: esContra ? "CONTRAVENCIÓN" : "DELITO"
      };
    }
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
  
  const formatFechaHora = (isoString) => {
    if (!isoString) return "—";
    const date = new Date(isoString);
    return date.toLocaleString('es-BO', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    });
  };

  // Función para dividir nombre en dos líneas
  const splitNameLines = (fullName) => {
    if (!fullName || fullName === '—') return { first: fullName, last: '' };
    const parts = fullName.trim().split(' ');
    if (parts.length === 1) return { first: parts[0], last: '' };
    return { first: parts[0], last: parts.slice(1).join(' ') };
  };

const inputEditableClass = "w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-[12px] font-medium text-slate-600 outline-none focus:border-slate-300 transition-colors";
  const inputReadonlyClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-[12px] font-medium text-slate-500 outline-none";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />
      
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[85vh]">
        {/* BARRA SUPERIOR */}
       <div className="bg-[#474b29] py-4 px-5 sm:px-6 text-white shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-md flex items-center justify-center shrink-0">
                <FaShieldAlt className="text-white" size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-[17px] font-bold uppercase tracking-wider leading-none">
                    {readOnly ? "ALERTA TABULADA · REPORTE FINAL" : "TABULACIÓN DE ALERTAS"}
                  </h2>
                </div>
                {readOnly ? (
                  <p className="text-[11px] font-medium text-white/70 mt-1.5">
                    Código: {alerta?.codigo_alerta || alerta?.id || `ALT-${String(idAlerta).padStart(4, "0")}` || "—"}
                    <span className="ml-3">
                      Archivado: {formatFechaHora(fechaTabulacion || alerta?.fecha_tabulacion)}
                    </span>
                  </p>
                ) : (
                  alerta?.id && (
                    <p className="text-[11px] font-medium text-white/70 mt-1.5">
                      {alerta.id}
                    </p>
                  )
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="hover:bg-white/20 p-1.5 rounded-md transition-colors shrink-0"
            >
              <FaTimes size={15} />
            </button>
          </div>
        </div>

{/* CUERPO CON SCROLL */}
        <div className="overflow-y-auto p-6 bg-slate-50/60">
          {cargandoDatos ? (
            <FormularioTabulacionSkeleton />
          ) : (
          <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-md">
            {/* DATOS DE LA ALERTA */}
            <section className={cardStyle}>
              <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-4 shrink-0">
  <div className="flex items-center gap-2">
    <div className="w-7 h-7 bg-blue-50 rounded-lg shadow-sm flex items-center justify-center">
      <FaFileAlt className="text-[#0C3DC2] text-[14px]" />
    </div>
   <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">DATOS DE LA ALERTA</h2>
  </div>
  <span className={`px-3 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider text-white ${
    (alerta?.prioridad || "").toUpperCase() === "ALTA"
      ? "bg-[#C90A0A]"
      : (alerta?.prioridad || "").toUpperCase() === "MEDIA"
      ? "bg-[#0C3DC2]"
      : "bg-[#e9b301]"
  }`}>
    {alerta?.prioridad || "—"}
  </span>
</div>
<div className="grid grid-cols-2 gap-3 flex-1">
  <div className="col-span-2">
    <LabelField label="NOMBRE DEL CIUDADANO" value={ciudadanoData?.nombre_completo || alerta?.ciudadano || "—"} readOnly required />
  </div>
  <LabelField label="CÉDULA" value={ciudadanoData?.ci || alerta?.ci || "—"} readOnly />
  <LabelField label="CELULAR" value={ciudadanoData?.celular || alerta?.celular || "—"} readOnly />
<div className="col-span-2">
  <LabelField
    label="CLASIFICACIÓN DEL HECHO"
    value={clasificacionOriginal}
    readOnly
  />
</div>
               <div className="col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">RELATO DEL HECHO</label>
                  <div className="relative border border-slate-200 rounded-xl px-3.5 py-3 mt-1">
                   <textarea readOnly value={alerta?.descripcion || ""}
                      className="block w-full h-8 text-[12px] text-slate-600 bg-transparent border-none focus:outline-none resize-y" />
                  </div>
                </div>
              </div>
            </section>

            {/* DIRECCIÓN */}
           <section className={cardStyle}>
              <HeaderSection icon={<FaMapMarkerAlt className="text-green-900 text-sm"/>} title="DIRECCIÓN Y DESCRIPCIÓN" bgColor="bg-green-50" />
              <div className="grid grid-cols-2 gap-3 flex-1">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">ÁREA URBANA</label>
                  <input value={areaUrbana} onChange={e => !readOnly && setAreaUrbana(e.target.value)} placeholder="Zona de área urbana"
                    className={!readOnly ? inputEditableClass : inputReadonlyClass}
                    disabled={readOnly} />
                </div>
               <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">ÁREA RURAL</label>
                  <input value={areaRural} onChange={e => !readOnly && setAreaRural(e.target.value)} placeholder="Zona de área rural"
                    className={!readOnly ? inputEditableClass : inputReadonlyClass}
                    disabled={readOnly} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">COMUNA</label>
                  <input value={comuna} onChange={e => !readOnly && setComuna(e.target.value)} placeholder="Comuna"
                    className={!readOnly ? inputEditableClass : inputReadonlyClass}
                    disabled={readOnly} />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">DISTRITO</label>
                  <input value={distrito} onChange={e => !readOnly && setDistrito(e.target.value)} placeholder="Distrito"
                    className={!readOnly ? inputEditableClass : inputReadonlyClass}
                    disabled={readOnly} />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">SUBDISTRITO</label>
                  <input value={subdistrito} onChange={e => !readOnly && setSubdistrito(e.target.value)} placeholder="Subdistrito"
                    className={!readOnly ? inputEditableClass : inputReadonlyClass}
                    disabled={readOnly} />
                </div>
                <LabelField label="LATITUD" value={latitudFinal || "—"} readOnly />
                <LabelField label="LONGITUD" value={longitudFinal || "—"} readOnly />
              </div>
            </section>

            {/* CLASIFICACIÓN DEL HECHO (TABULADOR) */}
            <section className={cardStyle}>
              <HeaderSection icon={<FaShieldAlt className="text-red-500 text-sm"/>} title="CLASIFICACIÓN DEL HECHO" bgColor="bg-red-50" />
              <div className="space-y-4 flex-1 justify-center flex flex-col">
                <SelectField
                  label="CONTRAVENCIONES (RP)"
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
                <div className="h-16 mt-2 p-2 bg-slate-50 rounded-xl text-center">
                  <p className="text-[11px] font-bold text-slate-400 tracking-wider uppercase">
                    {contravencionValue || delitoValue || (readOnly && clasificacionTabulador) ? "CLASIFICACIÓN FINAL" : "CLASIFICACIÓN ACTUAL"}
                  </p>
                  <p className="mt-1 tracking-wider text-[11px] font-bold text-slate-700 uppercase">
                    {clasificacionActual ? (
                      `${clasificacionActual.tipo}: ${clasificacionActual.texto}`
                    ) : (
                      "SIN CLASIFICACIÓN"
                    )}
                  </p>
                </div>
              </div>
            </section>

            {/* INFORME POLICIAL */}
            <section className={`${cardStyle} p-6`}>
              <HeaderSection icon={<FaUserShield className="text-amber-600"/>} title="INFORME POLICIAL" bgColor="bg-amber-50" />
              <div className="grid grid-cols-2 gap-3 flex-1">
                <LabelField label="ESCALAFÓN" value={escalafon} readOnly />
                <LabelField label="PLACA" value={placa} readOnly />
                <LabelField label="EPI" value={epi} readOnly />
             <div className="col-span-2 space-y-0.5">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">REPORTE PATRULLERO</label>
                  <div className="relative border border-slate-200 rounded-xl px-3.5 py-3 mt-1">
                    <textarea
                      readOnly
                      value={reportePatrullero}
                      placeholder="Sin reporte enviado aún."
                      className="block w-full h-10 text-[12px] text-slate-600 bg-transparent border-none focus:outline-none resize-y placeholder:italic placeholder:text-slate-400"
                    />
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* TABULACIÓN PARA SECRETARÍA */}
          <section className="bg-white p-5 rounded-2xl border border-slate-200 shadow-[0_6px_16px_-4px_rgba(15,23,42,0.15)] mt-8">
            <HeaderSection icon={<FaBriefcase className="text-purple-700 text-sm"/>} title="TABULACIÓN PARA SECRETARÍA" bgColor="bg-purple-100/80" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-3">
                <div className="space-y-0.5">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">PROTAGONISTAS</label>
                  <input value={protagonistas} onChange={e => !readOnly && setProtagonistas(e.target.value)} placeholder="Nombres..."
                    className={!readOnly ? inputEditableClass : inputReadonlyClass}
                    disabled={readOnly} />
                </div>
                <div className="space-y-0.5">
                  <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">REMISIÓN DEL CASO (DERIVACIÓN)</label>
                  <input
                    value={remisionCaso}
                    onChange={e => !readOnly && !isDerivacionLocked && setRemisionCaso(e.target.value)}
                    placeholder="Ej: FELCC, Fiscalía, Bomberos..."
                    className={(!readOnly && !isDerivacionLocked) ? inputEditableClass : inputReadonlyClass}
                    disabled={readOnly || isDerivacionLocked}
                  />
                </div>
              </div>
             <div className="flex flex-col space-y-1">
                <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">RESUMEN ADMINISTRATIVO</label>
                <div className="relative border border-slate-200 rounded-lg px-3.5 py-3 focus-within:border-slate-300 transition-colors">
                  <textarea value={resumenAdministrativo} onChange={e => !readOnly && setResumenAdministrativo(e.target.value)}
                    placeholder="Resumen administrativo obligatorio..."
                    className="block w-full min-h-[86px] text-[12px] text-slate-600 bg-transparent border-none focus:outline-none resize-y"
                    disabled={readOnly} />
                </div>
              </div>
            </div>
          </section>

          {/* HISTORIAL DE PROCESO */}
          <div className="pt-6 px-2 mt-4">
           <h2 className="flex items-center gap-3 font-semibold text-slate-400 uppercase text-[11px] tracking-wider mb-5">
               HISTORIAL DE PROCESO
            </h2>
           <div className="flex flex-wrap md:flex-nowrap justify-center gap-5">
              <HistoryCard 
                role="OPERADOR" 
                name={nombreOperador} 
                icon={<FaUser size={12} />} 
                splitName={splitNameLines(nombreOperador)}
              />
              <HistoryCard 
                role="DESPACHADOR" 
                name={nombreDespachador} 
                icon={<FaShieldAlt size={12} />} 
                splitName={splitNameLines(nombreDespachador)}
              />
              <HistoryCard 
                role="PATRULLERO" 
                name={nombrePatrullero} 
                icon={<FaUser size={12} />} 
                splitName={splitNameLines(nombrePatrullero)}
              />
              <HistoryCard 
                role="DERIVACIÓN" 
                name={nombreDerivacion} 
                icon={<FaBriefcase size={12} />} 
                splitName={splitNameLines(nombreDerivacion)}
              />
              <HistoryCard 
                role="TABULADOR" 
                name={user?.nombre_completo || "EN CURSO"} 
                icon={<FaCheckCircle size={12} />} 
                highlight 
                splitName={splitNameLines(user?.nombre_completo || "EN CURSO")}
              />
            </div>
        </div>
          </>
          )}
        </div>

        {/* BOTONES */}
        <div className="flex justify-end gap-4 px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
            <button type="button" onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-[11.5px] border uppercase border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors tracking-wider">
              {readOnly ? "CERRAR" : "DESCARTAR"}
            </button>
            {!readOnly && (
              <button type="submit" disabled={guardando} onClick={handleSubmit}
                className="px-8 py-2.5 rounded-lg font-medium text-[11.5px] bg-[#474b29] uppercase hover:bg-[#3a3e21] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed tracking-wider flex items-center justify-center gap-2">
                {guardando && <FaSpinner className="animate-spin" size={10} />}
                {guardando ? "GUARDANDO..." : "FINALIZAR TABULACIÓN"}
              </button>
            )}
          </div>
      </div>
    </div>
  );
};

// Componentes auxiliares (modificados para usar las nuevas clases de label)
const HeaderSection = memo(({ icon, title, bgColor }) => (
  <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-4 shrink-0">
    <div className={`w-7 h-7 ${bgColor} rounded-lg flex items-center justify-center`}>{icon}</div>
    <h2 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{title}</h2>
  </div>
));

const SelectField = memo(({ label, options, value, onChange, disabled }) => (
  <div className="flex flex-col space-y-1">
    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
      {label}
    </label>
    <div className="relative">
      <select value={value} onChange={onChange} disabled={disabled}
        className="w-full h-11 pl-3 pr-7 border border-slate-200 rounded-xl text-[12px] text-slate-600 outline-none appearance-none focus:border-slate-400 transition-colors disabled:opacity-60 disabled:bg-slate-50 disabled:border-slate-100">
        <option value="">Seleccionar...</option>
        {options.map((item, i) => <option key={i} value={item}>{item}</option>)}
      </select>
      <FaChevronDown
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
        size={11}
      />
    </div>
  </div>
));

// Componente LabelField unificado para campos de solo lectura (ahora con label estilizado)
const LabelField = memo(({ label, value, readOnly = true, required = false }) => (
  <div className="space-y-1">
    <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</label>
    <input
      required={required}
      type="text"
      readOnly={readOnly}
      value={value || '—'}
      className="w-full rounded-xl px-3.5 py-2.5 text-[12px] font-medium outline-none border border-slate-200 bg-slate-50 text-slate-600"
    />
  </div>
));

const HistoryCard = memo(({ role, name, icon, highlight, splitName }) => {
  return (
    <div className={`flex-1 flex flex-col items-center min-w-[96px] rounded-xl p-2 transition-all ${highlight ? 'bg-green-50 border border-green-200 shadow-[0_6px_16px_-4px_rgba(15,23,42,0.15)]' : 'bg-white border border-slate-300 shadow-[0_6px_16px_-4px_rgba(15,23,42,0.15)]'}`}>
      <div className={`w-8 h-8 rounded-full flex items-center justify-center mb-1 ${highlight ? 'bg-green-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
        {icon}
      </div>
      <p className="text-[9px] font-bold text-slate-400 uppercase text-center">{role}</p>
      <div className="text-center mt-1">
        <p className={`text-[9px] font-bold uppercase leading-tight ${highlight ? 'text-green-700' : 'text-slate-600'}`}>
          {splitName.first}
        </p>
        {splitName.last && (
          <p className={`text-[9px] font-bold uppercase leading-tight ${highlight ? 'text-green-700' : 'text-slate-600'}`}>
            {splitName.last}
          </p>
        )}
      </div>
    </div>
  );
});

export default FormularioTabulacion;
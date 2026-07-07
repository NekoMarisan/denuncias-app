import React, { useState, useEffect } from 'react';
import {
  FaEye, FaFilePdf, FaSearch,
  FaFileExcel, FaDownload, FaFileDownload,
  FaClipboardCheck, FaBan, FaSpinner
} from 'react-icons/fa';
import { supabase } from '../services/supabase';
import { exportPDFDesestimacion } from '../utils/exports/exportPDFDesestimacion';
import FormularioDesestimados from '../components/modals/FormularioDesestimados';
import FormularioTabulacion from '../components/modals/FormularioTabulacion';
import { exportPDFArchivoHis } from '../utils/exports/exportPDFArchivoHis';
import { exportExcelArchivoHis } from '../utils/exports/exportExcelArchivoHis';
import { useAuth } from '../context/AuthContext';
const ArchivoHistorico = ({
  alertasTabuladas,
  tabuladasCompletas = [],
  onGenerarPDFTabulada,
  onBack
}) => {
  const { user } = useAuth();
  const [busqueda, setBusqueda] = useState("");
  const [tabActiva, setTabActiva] = useState("TABULADO");
  const [filtroTiempo, setFiltroTiempo] = useState("TODO");
  const [desestimadas, setDesestimadas] = useState([]);
  const [cargandoDesestimadas, setCargandoDesestimadas] = useState(true);
  const [selectedDesestimada, setSelectedDesestimada] = useState(null);
  const [showModalDesestimada, setShowModalDesestimada] = useState(false);
  const [selectedTabulada, setSelectedTabulada] = useState(null);
  const [showModalTabulada, setShowModalTabulada] = useState(false);
  const [clasificacionTabuladorModal, setClasificacionTabuladorModal] = useState(null);
  const [derivacionModal, setDerivacionModal] = useState(null);


  useEffect(() => {
    const cargarDesestimadas = async () => {
      setCargandoDesestimadas(true);
      try {
        const { data, error } = await supabase
          .from('alerta_desestimada')
          .select(`
            id_desestimado,
            id_alerta,
            motivo,
            justificacion_adicional,
            fecha_hora,
            id_operador,
            alerta:alerta (
              id_alerta,
              codigo_alerta,
              fecha_hora,
              descripcion,
              ubicacion,
              contravenciones,
              delitos,
              id_operador_receptor,
              usuario_ciudadano (
                nombre_completo,
                ci,
                celular
              )
            )
          `)
          .order('fecha_hora', { ascending: false });
        if (error) throw error;

        const desestimadasConAsignacion = await Promise.all((data || []).map(async (item) => {
          const alertaData = item.alerta;
          let id_despachador = null, id_patrullero = null;
          if (alertaData?.id_alerta) {
            const { data: asigData } = await supabase
              .from('asignacion_patrulla')
              .select('id_despachador, id_patrullero')
              .eq('id_alerta', alertaData.id_alerta)
              .order('id_asignacion', { ascending: false })
              .limit(1)
              .maybeSingle();
            if (asigData) {
              id_despachador = asigData.id_despachador;
              id_patrullero = asigData.id_patrullero;
            }
          }
          return {
            id_alerta: alertaData?.id_alerta,
            id: alertaData?.codigo_alerta || `DES-${item.id_alerta}`,
            ciudadano: alertaData?.usuario_ciudadano?.nombre_completo || "Desconocido",
            fecha: new Date(item.fecha_hora).toLocaleDateString('es-BO'),
            incidente: item.motivo,
            estado: "DESESTIMADO",
            motivoDesestimacion: item.motivo,
            justificacion: item.justificacion_adicional,
            fecha_desestimo: item.fecha_hora, // ✅ guardamos ISO string para comparación
            id_operador_desestimo: item.id_operador,
            alerta_completa: alertaData,
            ci: alertaData?.usuario_ciudadano?.ci,
            celular: alertaData?.usuario_ciudadano?.celular,
            id_operador_receptor: alertaData?.id_operador_receptor,
            id_despachador,
            id_patrullero
          };
        }));

        const ids = new Set();
        desestimadasConAsignacion.forEach(d => {
          if (d.id_operador_receptor) ids.add(d.id_operador_receptor);
          if (d.id_despachador) ids.add(d.id_despachador);
          if (d.id_patrullero) ids.add(d.id_patrullero);
          if (d.id_operador_desestimo) ids.add(d.id_operador_desestimo);
        });
        const { data: oficiales } = await supabase
          .from('oficial')
          .select('id_oficial, nombre_completo')
          .in('id_oficial', [...ids]);
        const nombresMap = {};
        oficiales?.forEach(o => { nombresMap[o.id_oficial] = o.nombre_completo; });

        const formateadas = desestimadasConAsignacion.map(d => ({
          ...d,
          nombre_operador_receptor: nombresMap[d.id_operador_receptor] || "—",
          nombre_despachador: nombresMap[d.id_despachador] || "—",
          nombre_patrullero: nombresMap[d.id_patrullero] || "—",
          nombre_operador_desestimo: nombresMap[d.id_operador_desestimo] || "—"
        }));
        setDesestimadas(formateadas);
      } catch (err) {
        console.error("Error cargando desestimadas:", err);
      } finally {
        setCargandoDesestimadas(false);
      }
    };
    cargarDesestimadas();
  }, []);

  // Combinar alertas
  const alertasTabuladasConFormato = (alertasTabuladas || []).map(a => ({
    ...a,
    estado: "TABULADO"
  }));
  const todasLasAlertas = [...alertasTabuladasConFormato, ...desestimadas];

  // Filtros (corregido para usar fechas ISO)
  const alertasFiltradas = todasLasAlertas.filter(a => {
    const cumpleEstado = (a.estado || "TABULADO") === tabActiva;
    const ciudadano = (a.ciudadano || "").toLowerCase();
    const idAlerta = (a.id || "").toLowerCase();
    const busquedaLower = busqueda.toLowerCase();
    const cumpleBusqueda = ciudadano.includes(busquedaLower) || idAlerta.includes(busquedaLower);
    
    if (filtroTiempo !== "TODO") {
      let fechaComparar;
      if (a.estado === "DESESTIMADO") {
        // fecha_desestimo es ISO string
        fechaComparar = a.fecha_desestimo ? new Date(a.fecha_desestimo) : null;
      } else {
        // a.fecha es string "YYYY-MM-DD"
        fechaComparar = a.fecha ? new Date(a.fecha + "T00:00:00") : null;
      }
      if (!fechaComparar || isNaN(fechaComparar.getTime())) return true; // si no hay fecha válida, lo incluye
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      if (filtroTiempo === "HOY") {
        const inicioHoy = new Date(hoy);
        const finHoy = new Date(hoy);
        finHoy.setDate(finHoy.getDate() + 1);
        if (fechaComparar < inicioHoy || fechaComparar >= finHoy) return false;
      } else if (filtroTiempo === "ESTE MES") {
        if (fechaComparar.getMonth() !== hoy.getMonth() || fechaComparar.getFullYear() !== hoy.getFullYear()) return false;
      }
    }
    return cumpleEstado && cumpleBusqueda;
  });

  // Funciones para tabuladas
  const abrirDetalleTabulada = (alerta) => {
    const idAlertaCard = String(alerta.id_alerta);
    const tabuladaCompleta = tabuladasCompletas.find(t => String(t.id_alerta) === idAlertaCard);
    if (tabuladaCompleta) {
      const ciudadano = tabuladaCompleta.alerta?.usuario_ciudadano?.nombre_completo || "Ciudadano";
      let clasificacion = tabuladaCompleta.alerta?.contravenciones || tabuladaCompleta.alerta?.delitos;
      if (!clasificacion) clasificacion = tabuladaCompleta.resultado_final || "Sin clasificar";

      const alertaDetalle = {
  id_alerta: tabuladaCompleta.id_alerta,
  codigo_alerta: tabuladaCompleta.alerta?.codigo_alerta,
  ciudadano: ciudadano,
        ci: tabuladaCompleta.alerta?.usuario_ciudadano?.ci,
        celular: tabuladaCompleta.alerta?.usuario_ciudadano?.celular,
        incidente: clasificacion,
        descripcion: tabuladaCompleta.alerta?.descripcion,
        ubicacion: tabuladaCompleta.alerta?.ubicacion,
        contravenciones: tabuladaCompleta.alerta?.contravenciones,
        delitos: tabuladaCompleta.alerta?.delitos,
        id_patrullero: tabuladaCompleta.id_patrullero,
        id_despachador: tabuladaCompleta.id_despachador,
        id_operador_receptor: tabuladaCompleta.id_operador_receptor,
        placa: tabuladaCompleta.placa,
        epi: tabuladaCompleta.epi,
        numero_escalafon: tabuladaCompleta.numero_escalafon,
        comuna: tabuladaCompleta.comuna,
        distrito: tabuladaCompleta.distrito,
        subdistrito: tabuladaCompleta.subdistrito,
        area_urbana: tabuladaCompleta.area_urbana,
        area_rural: tabuladaCompleta.area_rural,
        protagonistas: tabuladaCompleta.protagonistas,
        remision_caso: tabuladaCompleta.remision_caso,
        resumen_administrativo: tabuladaCompleta.resumen_administrativo,
        resultado_final: tabuladaCompleta.resultado_final
      };
      setSelectedTabulada(alertaDetalle);
      setClasificacionTabuladorModal(tabuladaCompleta.resultado_final || null);
      setDerivacionModal(tabuladaCompleta.remision_caso || null);
      setShowModalTabulada(true);
    } else {
      console.warn("No se encontraron datos completos para esta tabulación", idAlertaCard);
    }
  };

  const generarPDFTabulada = (alerta) => {
    const idAlertaCard = String(alerta.id_alerta);
    const tabuladaCompleta = tabuladasCompletas.find(t => String(t.id_alerta) === idAlertaCard);
    if (tabuladaCompleta && onGenerarPDFTabulada) {
      onGenerarPDFTabulada(tabuladaCompleta);
    } else {
      console.log("PDF para tabulada (sin datos completos)", alerta);
    }
  };

  // Funciones para desestimadas
  const generarPDFDesestimada = async (alerta) => {
  let logoBase64 = null;
  try {
    const res = await fetch("/logo_of.png");
    const blob = await res.blob();
    logoBase64 = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (_) {}

  const codigoAlerta = alerta.id || alerta.id_alerta;
  const nombreArchivo = `reportes/desestimada_${codigoAlerta}.pdf`;

  const alertaData = {
    codigo_alerta: alerta.id,
    ciudadano: alerta.ciudadano,
    ci: alerta.ci,
    celular: alerta.celular,
    ubicacion: alerta.alerta_completa?.ubicacion,
    descripcion: alerta.alerta_completa?.descripcion,
    contravenciones: alerta.alerta_completa?.contravenciones,
    delitos: alerta.alerta_completa?.delitos,
    fecha_hora: alerta.alerta_completa?.fecha_hora,
    motivo_desestimo: alerta.motivoDesestimacion,
    justificacion: alerta.justificacion,
    fecha_desestimo: alerta.fecha_desestimo,
    nombre_operador_desestimo: alerta.nombre_operador_desestimo,
    prioridad: alerta.alerta_completa?.prioridad,
  };

  // 1. Obtener URL pública antes de generar
const { data: urlData } = supabase.storage
    .from("reportes")
    .getPublicUrl(nombreArchivo);
  const urlPublica = `${urlData.publicUrl}?t=${Date.now()}`;

  // 2. Generar PDF con QR incluido
  const pdfBlob = await exportPDFDesestimacion({
    alerta: alertaData,
    logoBase64,
    filename: `Desestimada_${codigoAlerta}.pdf`,
    qrData: urlPublica,
  });

  // 3. Subir ese mismo PDF a Supabase
  const { error: uploadError } = await supabase.storage
    .from("reportes")
    .upload(nombreArchivo, pdfBlob, { contentType: "application/pdf", upsert: true });

  if (uploadError) console.error("Error al subir PDF:", uploadError);

  // 4. Descargar
  const url = URL.createObjectURL(pdfBlob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Desestimada_${codigoAlerta}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
};

  const abrirDetalleDesestimada = (alerta) => {
    setSelectedDesestimada({
      codigo_alerta: alerta.id,
      ciudadano: alerta.ciudadano,
      fecha_hora: alerta.alerta_completa?.fecha_hora ? new Date(alerta.alerta_completa.fecha_hora).toLocaleString('es-BO') : "—",
      ubicacion: alerta.alerta_completa?.ubicacion,
      descripcion: alerta.alerta_completa?.descripcion,
      contravenciones: alerta.alerta_completa?.contravenciones,
      delitos: alerta.alerta_completa?.delitos,
      motivo_desestimo: alerta.motivoDesestimacion,
      justificacion: alerta.justificacion,
      fecha_desestimo: new Date(alerta.fecha_desestimo).toLocaleString('es-BO'),
      ci: alerta.ci,
      celular: alerta.celular,
      nombre_operador_desestimo: alerta.nombre_operador_desestimo
    });
    setShowModalDesestimada(true);
  };

const exportarExcel = async () => {
  try {
    await exportExcelArchivoHis(alertasFiltradas, tabActiva, {
      nombreAdmin: user?.nombre_completo || "ADMINISTRADOR DE TURNO",
    });
  } catch (err) {
    console.error("Error al generar Excel de Archivo Histórico:", err);
  }
};

const exportarPDF = async () => {
    let logoBase64 = null;
    try {
      const res = await fetch("/logo_of.png");
      const blob = await res.blob();
      logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (_) {}

    try {
      const nombreArchivo = `reportes/historico_${tabActiva.toLowerCase()}.pdf`;
      const filenameFinal = `historico_${tabActiva.toLowerCase()}_${Date.now()}.pdf`;

      // 1. Obtener URL pública antes de generar
      const { data: urlData } = supabase.storage
        .from("reportes")
        .getPublicUrl(nombreArchivo);
      const urlPublica = `${urlData.publicUrl}?t=${Date.now()}`;

      // 2. Generar PDF ya con el QR incluido
      const pdfBlob = await exportPDFArchivoHis(alertasFiltradas, tabActiva, {
        nombreAdmin: "ADMINISTRADOR DE TURNO",
        nombreTabulador: user?.nombre_completo || "TABULADOR NO IDENTIFICADO",
        logoBase64,
        qrData: urlPublica,
      });

      // 3. Subir ese mismo PDF a Supabase
      const { error: uploadError } = await supabase.storage
        .from("reportes")
        .upload(nombreArchivo, pdfBlob, { contentType: "application/pdf", upsert: true });
      if (uploadError) console.error("Error al subir PDF:", uploadError);

      // 4. Descargar (una sola vez)
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filenameFinal;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Error al generar PDF de Archivo Histórico:", err);
    }
  };

  if (cargandoDesestimadas && alertasTabuladasConFormato.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <FaSpinner className="animate-spin text-green-800 text-3xl" />
        <span className="ml-2 text-slate-600">Cargando historial...</span>
      </div>
    );
  }

  return (
    <div className="-mt-4 w-full px-1 py-4 space-y-4 animate-fadeIn pb-6 bg-gray-50/30">
      {/* Barra de herramientas */}
      <div className="w-full bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1 min-w-[200px]">

  <div className="flex bg-gray-50 p-1 rounded-lg border border-gray-200 shrink-0">
            <button 
              onClick={() => setTabActiva("TABULADO")} 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-[12px] transition-all tracking-wider ${
                tabActiva === "TABULADO" ? "bg-[#113e27] text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <FaClipboardCheck size={12} /> TABULADOS
            </button>
            <button 
              onClick={() => setTabActiva("DESESTIMADO")} 
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-bold text-[12px] transition-all tracking-wider ${
                tabActiva === "DESESTIMADO" ? "bg-[#113e27] text-white shadow-sm" : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <FaBan size={12} /> DESESTIMADOS
            </button>
          </div>

          <div className="relative flex-1">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
            <input 
              type="text" 
              placeholder={`Buscar en ${tabActiva === "TABULADO" ? 'finalizados' : 'desestimados'}...`} 
              className="w-full h-10 pl-8 pr-3 py-2 bg-gray-50/50 border border-gray-200 rounded-xl outline-none text-[11px] font-bold text-slate-700 transition-all focus:bg-white focus:border-[#113e27]" 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex bg-gray-50 px-1 py-1 rounded-lg border border-gray-200">
            {["TODO", "ESTE MES", "HOY"].map((f) => (
              <button 
                key={f} 
                onClick={() => setFiltroTiempo(f)} 
                className={`px-6 py-2.5 rounded-lg font-bold text-[11px] uppercase transition-all ${
                  filtroTiempo === f 
                    ? "bg-[#113e27] text-white shadow-sm"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {f}
              </button>
            ))}
          </div>

          <div className="relative group">
            <button className="flex items-center gap-2 px-3 py-2.5 bg-white border-2 border-gray-200 text-slate-700 rounded-lg font-bold uppercase text-[11px] hover:border-slate-300 transition-all">
              <FaFileDownload size={11} /> <span>Exportar</span>
            </button>
            <div className="absolute right-0 mt-1 w-40 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button onClick={exportarExcel} className="w-full px-3 py-2 text-left hover:bg-green-50 text-slate-600 font-bold text-[10px] flex items-center gap-2">
                <FaFileExcel className="text-green-600" size={12} /> Excel (.xls)
              </button>
              <button onClick={exportarPDF} className="w-full px-3 py-2 text-left hover:bg-red-50 text-slate-700 font-bold text-[10px] flex items-center gap-2">
                <FaFilePdf className="text-red-700" size={12} /> Guardar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Cuadrícula de tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
        {alertasFiltradas.map((alerta) => {
          const esDesestimado = alerta.estado === "DESESTIMADO";
          const idMostrar = alerta.id || "SIN ID";
          const ciudadanoMostrar = alerta.ciudadano || "Desconocido";
          const fechaMostrar = esDesestimado 
            ? (alerta.fecha_desestimo ? new Date(alerta.fecha_desestimo).toLocaleDateString('es-BO') : "—")
            : (alerta.fecha || "—");
          const incidenteMostrar = esDesestimado 
            ? (alerta.motivoDesestimacion || "Sin motivo")
            : (alerta.incidente || "Sin clasificar");

          return (
            <div key={idMostrar} className="p-2 mt-2 bg-white rounded-xl border border-slate-200 relative transition-all duration-200 hover:scale-[1.01] shadow-sm hover:shadow-md overflow-hidden flex flex-col">
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#113e27]" />
              <div className="p-3 flex-1 flex flex-col">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{idMostrar}</span>
                  <span className="px-2 py-0.5 text-[8px] font-extrabold uppercase tracking-wider bg-slate-200 text-[#113e27] rounded-md">
                    {esDesestimado ? 'Desestimado' : 'Finalizado'}
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3 mt-2">
                  <div className="w-6 h-8 rounded-md bg-blue-50 text-[#0C3DC2] flex items-center justify-center font-black text-xs shadow-inner">
                    {ciudadanoMostrar.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="text-[11px] font-extrabold text-slate-700 leading-tight">{ciudadanoMostrar}</h3>
                    <p className="text-[9px] font-bold text-slate-400">{fechaMostrar}</p>
                  </div>
                </div>

                <div className="mb-3 p-1.5 rounded-md border bg-[#e6f4ea]/50 border-[#113e27]/20">
                  <p className="text-[8px] font-bold uppercase tracking-wider mb-0.5 text-[#113e27]">
                    {esDesestimado ? 'Motivo' : 'Categoría'}
                  </p>
                  <p className="text-[9px] font-extrabold text-slate-600 uppercase tracking-wider leading-tight truncate">
                    {incidenteMostrar}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <button 
                    onClick={() => esDesestimado ? abrirDetalleDesestimada(alerta) : abrirDetalleTabulada(alerta)}
                    className="flex items-center justify-center gap-1 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-md transition-colors text-[11px] font-bold uppercase"
                  >
                    <FaEye size={9} /> Ver
                  </button>
                  <button 
                    onClick={() => esDesestimado ? generarPDFDesestimada(alerta) : generarPDFTabulada(alerta)}
                    className="flex items-center justify-center gap-1 py-1.5 text-white rounded-md shadow-sm transition-all text-[11px] font-bold uppercase bg-[#113e27] hover:bg-[#164a2f]"
                  >
                    <FaFilePdf size={9} /> PDF
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {alertasFiltradas.length === 0 && (
          <div className="col-span-full py-12 text-center">
            <p className="text-slate-400 font-black uppercase tracking-widest italic text-[10px]">
              No se encontraron registros en {tabActiva.toLowerCase()}
            </p>
          </div>
        )}
      </div>

      {/* Modales */}
      {showModalDesestimada && (
        <FormularioDesestimados
          alerta={selectedDesestimada}
          onClose={() => setShowModalDesestimada(false)}
          onGenerarPDF={() => generarPDFDesestimada(selectedDesestimada)}
        />
      )}
      {showModalTabulada && (
        <FormularioTabulacion
          isOpen={showModalTabulada}
          onClose={() => setShowModalTabulada(false)}
          alerta={selectedTabulada}
          readOnly={true}
          onConfirm={() => {}}
          clasificacionTabulador={clasificacionTabuladorModal}
          derivacion={derivacionModal}
        />
      )}
    </div>
  );
};

export default ArchivoHistorico;
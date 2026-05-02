import React, { useState, useEffect, useRef } from "react";
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

import { 
  FaUserShield, 
  FaExclamationCircle, 
  FaTruck,
  FaMapMarkerAlt, 
  FaFileAlt, 
  FaExclamationTriangle, 
  FaUserCircle,
  FaInfoCircle, FaBell,
  FaImage, FaDownload, FaCheckCircle, FaShareSquare,
  FaTimesCircle,
  FaCircle      
} from "react-icons/fa";

const CentroDespacho = () => {
  const [tabActiva, setTabActiva] = useState("nuevas");
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [detalleVisible, setDetalleVisible] = useState(null);
  
  // Estado para la intervención seleccionada (independiente del detalle)
  const [intervencionSeleccionada, setIntervencionSeleccionada] = useState(null);
  
  // Sistema de notificaciones toast (sin botón)
  const [toast, setToast] = useState({ message: "", visible: false });
  
  const showToast = (message) => {
    setToast({ message, visible: true });
    setTimeout(() => {
      setToast({ message: "", visible: false });
    }, 3000);
  };
  
  const [reporteOficial, setReporteOficial] = useState("");
  const [derivacionDestino, setDerivacionDestino] = useState("");

  const mapContainer = useRef(null);
  const map = useRef(null);
  const markers = useRef({});
  const markersUnidades = useRef({});

  const [estadosUnidades, setEstadosUnidades] = useState({
    1: "DISPONIBLE", 2: "DISPONIBLE", 3: "DISPONIBLE",
    4: "DISPONIBLE", 5: "DISPONIBLE", 6: "DISPONIBLE"
  });

  const [ubicacionesUnidades, setUbicacionesUnidades] = useState({
    1: { lat: -17.3900, lng: -66.1410 },
    2: { lat: -17.3875, lng: -66.1475 },
    3: { lat: -17.3945, lng: -66.1595 },
    4: { lat: -17.3830, lng: -66.1360 },
    5: { lat: -17.3860, lng: -66.1440 },
    6: { lat: -17.3855, lng: -66.1455 },
  });

  const [asignaciones, setAsignaciones] = useState({});
  const [pendingAsignaciones, setPendingAsignaciones] = useState({});

  const [alertasData, setAlertasData] = useState([
    { 
      id: "ALTC-0001", 
      nombre: "Sebastian Sergio Montan Terrazas", 
      categoria: "CONTRAVENCIÓN/RUIDO", 
      prioridad: "BAJA",
      relato: "Personas consumiendo bebidas alcohólicas en vía pública y causando ruidos molestos en la zona.",
      lat: -17.3912, lng: -66.1420, 
      tipo: "CIUDADANA",
      enIntervencion: false,
      reportePatrullero: null,
      unidadReportante: null,
      evidencias: []
    },
    { 
      id: "ALTC-0002", 
      nombre: "Alex Kevin Velarde Diaz", 
      categoria: "AUXILIO MÉDICO", 
      prioridad: "MEDIA",
      relato: "Sujeto presenta desmayo en plaza principal, se requiere ambulancia o patrulla cercana.",
      lat: -17.3880, lng: -66.1480,
      tipo: "CIUDADANA",
      enIntervencion: false,
      reportePatrullero: null,
      unidadReportante: null,
      evidencias: []
    },
    { 
      id: "ALTC-0003", 
      nombre: "Juana Carolina Rodriguez López", 
      categoria: "VIOLENCIA DOMÉSTICA", 
      prioridad: "MEDIA",
      relato: "Reporte de agresión física en domicilio, solicitan presencia policial.",
      lat: -17.3950, lng: -66.1600, 
      tipo: "CIUDADANA",
      enIntervencion: false,
      reportePatrullero: null,
      unidadReportante: null,
      evidencias: []
    },
    { 
      id: "ALTC-0004", 
      nombre: "Miguel Ángel Rojas Gregorio", 
      categoria: "ROBO DE VEHÍCULO", 
      prioridad: "ALTA",
      relato: "Sustracción de motocicleta estacionada en la vía pública, vistas las cámaras de seguridad.",
      lat: -17.3820, lng: -66.1350, 
      tipo: "CIUDADANA",
      enIntervencion: false,
      reportePatrullero: null,
      unidadReportante: null,
      evidencias: []
    },
    { 
      id: "ALTC-0006", 
      nombre: "Mario Mariano Sansuste Valencia", 
      categoria: "ABANDONO DE MASCOTA", 
      prioridad: "BAJA",
      relato: "Perro atado a un poste sin agua ni comida, se solicita unidad para rescate.",
      lat: -17.3860, lng: -66.1440, 
      tipo: "CIUDADANA",
      enIntervencion: false,
      reportePatrullero: null,
      unidadReportante: null,
      evidencias: []
    },
    { 
      id: "EMRG-912", 
      nombre: "Carlos Luciano Merida Durán", 
      categoria: "ACCIDENTE TRÁNSITO", 
      prioridad: "ALTA", 
      relato: "Colisión múltiple en avenida principal, heridos atrapados.",
      lat: -17.3850, lng: -66.1450, 
      tipo: "EMERGENCIA",
      enIntervencion: false,
      reportePatrullero: null,
      unidadReportante: null,
      evidencias: []
    },
    { 
      id: "EMRG-913", 
      nombre: "Roberto Sebastian Cespedes Fernández", 
      categoria: "INCENDIO", 
      prioridad: "ALTA", 
      relato: "Incendio en mercado central, se requieren bomberos y patrullas.",
      lat: -17.3890, lng: -66.1520, 
      tipo: "EMERGENCIA",
      enIntervencion: false,
      reportePatrullero: null,
      unidadReportante: null,
      evidencias: []
    },
    { 
      id: "EMRG-914", 
      nombre: "Lucía Marlenne Méndez Montaño", 
      categoria: "VIOLENCIA DE GÉNERO", 
      prioridad: "ALTA", 
      relato: "Mujer agredida físicamente por su pareja, solicitan presencia urgente.",
      lat: -17.3940, lng: -66.1580, 
      tipo: "EMERGENCIA",
      enIntervencion: false,
      reportePatrullero: null,
      unidadReportante: null,
      evidencias: []
    },
    { 
      id: "EMRG-915", 
      nombre: "José Luis Torrez Aranibar", 
      categoria: "PERSONA ARMADA", 
      prioridad: "ALTA", 
      relato: "Sujeto con arma blanca amenazando en una tienda de conveniencia.",
      lat: -17.3900, lng: -66.1490, 
      tipo: "EMERGENCIA",
      enIntervencion: false,
      reportePatrullero: null,
      unidadReportante: null,
      evidencias: []
    },
    { 
      id: "EMRG-916", 
      nombre: "Marco Antonio Cespedes Yujra", 
      categoria: "SECUESTRO", 
      prioridad: "ALTA", 
      relato: "Reporte de persona secuestrada en zona sur, se necesita apoyo táctico.",
      lat: -17.4000, lng: -66.1550, 
      tipo: "EMERGENCIA",
      enIntervencion: false,
      reportePatrullero: null,
      unidadReportante: null,
      evidencias: []
    }
  ]);

  // Limpiar asignaciones pendientes al cambiar de alerta
  useEffect(() => {
    setPendingAsignaciones({});
  }, [alertaSeleccionada]);

  // Al cambiar de pestaña, limpiar selecciones
  useEffect(() => {
    if (tabActiva === "nuevas") {
      setIntervencionSeleccionada(null);
    } else {
      setAlertaSeleccionada(null);
    }
  }, [tabActiva]);

  const descargarImagen = (nombreImagen) => {
    const blob = new Blob(["Contenido de imagen simulado"], { type: "image/jpeg" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nombreImagen;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const simularReportePatrullero = () => {
    const alertaActualParaReporte = tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada;
    if (!alertaActualParaReporte) return;
    
    const unidadesAsignadasIds = Object.keys(asignaciones).filter(key => asignaciones[key] === alertaActualParaReporte);
    const unidadReportanteId = unidadesAsignadasIds[0];
    const unidadReportanteObj = unidades.find(u => u.id === parseInt(unidadReportanteId));
    const nombreUnidad = unidadReportanteObj ? unidadReportanteObj.nombre : "Patrulla desconocida";

    const reporteEjemplo = "En el lugar se encontró a las personas consumiendo alcohol en vía pública. Se procedió a la identificación y al retiro del grupo. No hubo detenidos.";
    const evidenciasMock = [
      { nombre: "evidencia_01.jpg", url: "#" },
      { nombre: "evidencia_02.jpg", url: "#" }
    ];

    setAlertasData(prev => prev.map(a => 
      a.id === alertaActualParaReporte 
        ? { 
            ...a, 
            reportePatrullero: reporteEjemplo,
            unidadReportante: nombreUnidad,
            evidencias: evidenciasMock
          }
        : a
    ));
  };

  const despacharPatrulla = (unidadId) => {
    if (!alertaSeleccionada) return;
    const alerta = alertasData.find(a => a.id === alertaSeleccionada);
    if (!alerta || alerta.enIntervencion) return;
    if (estadosUnidades[unidadId] !== "DISPONIBLE") return;

    if (pendingAsignaciones[unidadId] === alertaSeleccionada) {
      const newPending = { ...pendingAsignaciones };
      delete newPending[unidadId];
      setPendingAsignaciones(newPending);
    } else {
      setPendingAsignaciones(prev => ({ ...prev, [unidadId]: alertaSeleccionada }));
    }
  };

  const desasignarTodas = () => {
    if (!alertaSeleccionada) return;
    setPendingAsignaciones({});
  };

  const finalizarAsignacion = () => {
    if (!alertaSeleccionada) return;
    const unidadesPendientes = Object.keys(pendingAsignaciones).filter(key => pendingAsignaciones[key] === alertaSeleccionada);
    if (unidadesPendientes.length === 0) return;

    const nombresUnidades = unidadesPendientes.map(id => unidades.find(u => u.id === parseInt(id))?.nombre).filter(Boolean);
    const mensaje = unidadesPendientes.length === 1
      ? `📢 NOTIFICACIÓN ENVIADA A: ${nombresUnidades[0]}. Estado: NOTIFICADO`
      : `📢 NOTIFICACIÓN ENVIADA A: ${nombresUnidades.join(", ")}. Estado: NOTIFICADO`;
    showToast(mensaje);

    setEstadosUnidades(prev => {
      const nuevos = { ...prev };
      unidadesPendientes.forEach(uId => { nuevos[uId] = "NOTIFICADO"; });
      return nuevos;
    });

    setAsignaciones(prev => {
      const nuevas = { ...prev };
      unidadesPendientes.forEach(uId => { nuevas[uId] = alertaSeleccionada; });
      return nuevas;
    });

    setPendingAsignaciones({});

    setAlertasData(prev => prev.map(a => 
      a.id === alertaSeleccionada ? { ...a, enIntervencion: true } : a
    ));
    
    // Después de 3 segundos (cuando desaparece la notificación), cerrar el detalle
    setTimeout(() => {
      setAlertaSeleccionada(null);
    }, 3000);
  };

  const finalizarCaso = (tipoCierre) => {
    const alertaActualParaCierre = tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada;
    if (!alertaActualParaCierre) return;
    
    const alerta = alertasData.find(a => a.id === alertaActualParaCierre);
    const unidadesAsignadas = Object.entries(asignaciones)
      .filter(([_, alertId]) => alertId === alertaActualParaCierre)
      .map(([unidadId]) => unidadId);

    const datosParaTabulacion = {
      ...alerta,
      reporteFinal: reporteOficial,
      estadoCierre: tipoCierre === 'derivar' ? `DERIVADO A ${derivacionDestino}` : 'ATENDIDO',
      unidadesQueAtendieron: unidadesAsignadas.map(id => unidades.find(u => u.id === parseInt(id))?.nombre).filter(Boolean),
      fechaCierre: new Date().toISOString()
    };

    console.log("ALERTA TRANSFERIDA AL MÓDULO TABULACIÓN:", datosParaTabulacion);
    showToast(`Caso ${alerta.id} finalizado. Notificando al ciudadano: "Su caso ha sido atendido".`);

    if (unidadesAsignadas.length > 0) {
      setEstadosUnidades(prev => {
        const nuevosEstados = { ...prev };
        unidadesAsignadas.forEach(uId => { nuevosEstados[uId] = "DISPONIBLE"; });
        return nuevosEstados;
      });
      
      setAsignaciones(prev => {
        const nuevasAsignaciones = { ...prev };
        unidadesAsignadas.forEach(uId => { delete nuevasAsignaciones[uId]; });
        return nuevasAsignaciones;
      });
    }

    setAlertasData(prev => prev.filter(a => a.id !== alertaActualParaCierre));
    
    if (tabActiva === "nuevas") {
      setAlertaSeleccionada(null);
    } else {
      setIntervencionSeleccionada(null);
    }
    setReporteOficial("");
  };

  const seleccionarAlerta = (id) => {
    setAlertaSeleccionada(prev => prev === id ? null : id);
  };
  
  const seleccionarIntervencion = (id) => {
    setIntervencionSeleccionada(prev => prev === id ? null : id);
  };

  useEffect(() => {
    if (alertaSeleccionada && tabActiva === "nuevas") {
      const alertaEncontrada = alertasData.find(a => a.id === alertaSeleccionada);
      setDetalleVisible(alertaEncontrada);
      if (alertaEncontrada?.reportePatrullero) {
        setReporteOficial(alertaEncontrada.reportePatrullero);
      } else {
        setReporteOficial("");
      }
    } else if (!alertaSeleccionada) {
      const timer = setTimeout(() => setDetalleVisible(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [alertaSeleccionada, alertasData, tabActiva]);
  
  // Sincronizar reporte cuando cambia la intervención seleccionada
  useEffect(() => {
    if (intervencionSeleccionada && tabActiva === "intervencion") {
      const alertaEncontrada = alertasData.find(a => a.id === intervencionSeleccionada);
      if (alertaEncontrada?.reportePatrullero) {
        setReporteOficial(alertaEncontrada.reportePatrullero);
      } else {
        setReporteOficial("");
      }
    }
  }, [intervencionSeleccionada, alertasData, tabActiva]);

  useEffect(() => {
    if (map.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          'osm': {
            type: 'raster',
            tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '&copy; OpenStreetMap contributors'
          }
        },
        layers: [{
          id: 'osm-tiles',
          type: 'raster',
          source: 'osm',
          minzoom: 0,
          maxzoom: 19
        }]
      },
      center: [-66.1420, -17.3912],
      zoom: 14,
    });

    alertasData.forEach(alerta => {
      const el = document.createElement('div');
      el.className = 'custom-marker';
      el.style.backgroundColor = alerta.tipo === 'EMERGENCIA' ? '#dc2626' : '#2563eb';
      el.style.width = '24px';
      el.style.height = '24px';
      el.style.borderRadius = '50%';
      el.style.border = '3px solid white';
      el.style.boxShadow = '0 0 10px rgba(0,0,0,0.5)';
      el.style.cursor = 'pointer';

      el.addEventListener('click', () => {
        if (tabActiva === "nuevas") {
          seleccionarAlerta(alerta.id);
        }
      });

      const marker = new maplibregl.Marker(el)
        .setLngLat([alerta.lng, alerta.lat])
        .addTo(map.current);
      
      markers.current[alerta.id] = marker;
    });

    Object.entries(ubicacionesUnidades).forEach(([id, pos]) => {
      const unidadId = parseInt(id);
      const el = document.createElement('div');
      el.className = 'custom-marker-unidad';
      el.style.backgroundColor = '#10b981';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.border = '2px solid white';
      el.style.boxShadow = '0 0 8px rgba(0,0,0,0.4)';
      el.style.cursor = 'default';

      const marker = new maplibregl.Marker(el)
        .setLngLat([pos.lng, pos.lat])
        .addTo(map.current);
      
      markersUnidades.current[unidadId] = marker;
    });
  }, [alertasData, ubicacionesUnidades, tabActiva]);

  const alertaActual = (tabActiva === "nuevas" && alertaSeleccionada) 
    ? alertasData.find(a => a.id === alertaSeleccionada)
    : (tabActiva === "intervencion" && intervencionSeleccionada)
      ? alertasData.find(a => a.id === intervencionSeleccionada)
      : null;

  useEffect(() => {
    if (map.current && alertaActual) {
      map.current.flyTo({
        center: [alertaActual.lng, alertaActual.lat],
        zoom: 17,
        essential: true,
        speed: 1.2
      });
    }
  }, [alertaSeleccionada, intervencionSeleccionada, alertaActual]);

  const unidades = [
    { id: 1, nombre: "PAT-01", placa: "215CDS", oficial: "XX. Sergio Vargas" },
    { id: 2, nombre: "PAT-02", placa: "215CDE", oficial: "XX. Sergio Vargas" },
    { id: 3, nombre: "PAT-03", placa: "215CDF", oficial: "XX. Sergio Vargas" },
    { id: 4, nombre: "PAT-04", placa: "215CDG", oficial: "XX. Sergio Vargas" },
    { id: 5, nombre: "PAT-05", placa: "215CDH", oficial: "XX. Sergio Vargas" },
    { id: 6, nombre: "PAT-06", placa: "215CDI", oficial: "XX. Sergio Vargas" },
  ];

  const getAlertasVisibles = () => {
    if (tabActiva === "nuevas") {
      return alertasData.filter(a => !a.enIntervencion);
    } else {
      return alertasData.filter(a => a.enIntervencion);
    }
  };

  const unidadesAsignadas = (tabActiva === "nuevas" && alertaSeleccionada)
    ? Object.entries(asignaciones)
        .filter(([_, alertId]) => alertId === alertaSeleccionada)
        .map(([unidadId]) => unidades.find(u => u.id === parseInt(unidadId)))
        .filter(Boolean)
    : (tabActiva === "intervencion" && intervencionSeleccionada)
      ? Object.entries(asignaciones)
          .filter(([_, alertId]) => alertId === intervencionSeleccionada)
          .map(([unidadId]) => unidades.find(u => u.id === parseInt(unidadId)))
          .filter(Boolean)
      : [];

  const estaEnIntervencion = alertaActual?.enIntervencion || false;
  const alertaActualObj = alertaActual;

  const hayAlertasEnIntervencion = alertasData.some(a => a.enIntervencion === true);

  // Componente reutilizable para el detalle de la alerta (evita duplicar código)
  const DetalleAlerta = ({ alerta, onClose }) => {
    if (!alerta) return null;
    return (
      <div className="bg-white p-8 rounded-3xl shadow-none">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4 items-start">
            <div className={`p-4 rounded-2xl border ${alerta.tipo === "EMERGENCIA" ? 'bg-red-50 text-red-600 border-red-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
              {alerta.tipo === "EMERGENCIA" ? <FaExclamationTriangle size={24}/> : <FaUserShield size={24}/>}
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-2xl font-extrabold text-[#1e293b] uppercase">
                  Detalle {alerta.tipo === "EMERGENCIA" ? "Emergencia" : "Alerta Ciudadana"} {alerta.id}
                </h2>
                {alerta.tipo === "CIUDADANA" && (
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold text-white ${alerta.enIntervencion ? 'bg-blue-600' : 'bg-yellow-400'}`}>
                    <span>{alerta.enIntervencion ? "INTERVENCIÓN" : "VERIFICACIÓN"}</span>
                  </div>
                )}
                {alerta.tipo === "EMERGENCIA" && alerta.prioridad === "ALTA" && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md text-xs font-bold text-white bg-red-600">
                    <span>EMERGENCIA</span>
                  </div>
                )}
              </div>
              <div className="mt-3 flex flex-col items-start gap-2">
                <div className={`inline-flex items-center gap-2 px-2.5 py-1.5 rounded-md text-xs font-bold text-white ${
                  alerta.prioridad === "ALTA" ? "bg-red-600" :
                  alerta.prioridad === "MEDIA" ? "bg-blue-600" :
                  alerta.prioridad === "BAJA" ? "bg-yellow-500" : "bg-gray-500"
                }`}>
                  <FaExclamationCircle size={10} />
                  <span> {alerta.prioridad}</span>
                </div>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-400 transition-colors font-bold text-xs tracking-wide">CERRAR DETALLE</button>
        </div>

        <div className="mt-9 mb-6">
          <div className="grid grid-cols-[1fr_2fr] gap-4">
            <div className="space-y-4">
              <div>
                <p className="text-[13px] font-bold text-slate-400 uppercase mb-3 tracking-wider">Categoría del Incidente</p>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative">
                  <div className="flex items-center gap-3 text-slate-500 font-bold">
                    <FaFileAlt className={alerta.tipo === "EMERGENCIA" ? "text-red-500" : "text-blue-500"}/>
                    <span className="text-[13px] uppercase tracking-wider">{alerta.categoria}</span>
                  </div>
                </div>
              </div>
              <div>
                <p className="mt-5 text-[13px] font-bold text-slate-400 uppercase mb-3 tracking-wider">Coordenadas</p>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 relative">
                  <div className="flex items-center gap-3 text-slate-500 font-bold">
                    <FaMapMarkerAlt className="text-red-500"/>
                    <span className="text-[13px] tracking-wider">{alerta.lat}, {alerta.lng}</span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[13px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 tracking-wider">
                Descripción del suceso
              </p>
              <div className={`h-44 w-full p-6 rounded-2xl border ${alerta.tipo === "EMERGENCIA" ? 'bg-slate-50 border-slate-100' : 'bg-slate-50 border-slate-100'}`}>
                <p className="text-[13px] text-slate-400 leading-relaxed">{alerta.relato}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="-mt-6 px-2 w-full min-h-screen py-4 font-sans flex gap-6 items-stretch">
      
      {/* Toast notification (sin botón) */}
      {toast.visible && (
        <div className="fixed bottom-8 right-8 z-50 bg-gray-900 text-white px-6 py-3 rounded-xl shadow-2xl animate-in slide-in-from-bottom-2 duration-300 text-sm font-bold">
          {toast.message}
        </div>
      )}
      
      {/* SIDEBAR IZQUIERDO - Eliminado h-full para que se estire junto al contenido derecho */}
      <div className="w-[380px] shrink-0 flex flex-col bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="p-5 bg-white border-b border-slate-100 rounded-t-2xl">
          <div className="flex bg-slate-50/50 p-1.5 rounded-2xl border border-slate-200">
            <button onClick={() => setTabActiva("nuevas")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-[12px] uppercase transition-all duration-300 tracking-wide ${tabActiva === "nuevas" ? "bg-red-600 text-white shadow-lg shadow-slate-100" : "text-slate-400 hover:bg-white "}`}>
              NUEVAS ALERTAS
            </button>
            <button onClick={() => setTabActiva("intervencion")} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-extrabold text-[12px] uppercase transition-all duration-300 tracking-wide ${tabActiva === "intervencion" ? "bg-blue-700 text-white shadow-lg shadow-slate-100" : "text-slate-400 hover:bg-white"}`}>
              INTERVENCIÓN
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          {/* Emergencias */}
          <div>
            <h3 className="text-[12px] font-extrabold text-red-600 uppercase mb-4 flex items-center gap-2 tracking-wide">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></span> Alertas de Emergencia
            </h3>
            <div className="max-h-[600px] overflow-y-auto pr-1 space-y-4">
              {getAlertasVisibles().filter(a => a.tipo === "EMERGENCIA").map(alerta => (
                <div
                  key={alerta.id}
                  onClick={() => {
                    if (tabActiva === "nuevas") {
                      seleccionarAlerta(alerta.id);
                    } else {
                      seleccionarIntervencion(alerta.id);
                    }
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200
                    ${(tabActiva === "nuevas" && alertaSeleccionada === alerta.id) || (tabActiva === "intervencion" && intervencionSeleccionada === alerta.id)
                      ? 'border-red-500 bg-red-50/50 shadow-lg'
                      : 'border-slate-200 bg-white shadow-md hover:shadow-lg'
                    }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
                      {alerta.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-bold text-[#1e293b] tracking-wide leading-tight block w-[150px]">
                        {alerta.nombre}
                      </h4>
                    </div>
                    <span className="-mt-6 bg-red-600 text-white px-2 py-1 rounded-md text-[9px] font-bold uppercase whitespace-nowrap">
                      EMERGENCIA
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-white/50 p-2 rounded-lg border border-slate-100">
                    <FaCircle className="text-red-600 text-[8px]" />
                    <span className="break-words">{alerta.categoria}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-100 my-4"></div>

          {/* Ciudadanas */}
          <div>
            <h3 className="text-[12px] font-extrabold text-blue-700 uppercase mb-4 flex items-center gap-2 tracking-wide">
              <span className="w-2 h-2 bg-blue-700 rounded-full animate-pulse"></span> Alertas Ciudadanas
            </h3>
            <div className="max-h-[600px] overflow-y-auto pr-1 space-y-4">
              {getAlertasVisibles().filter(a => a.tipo === "CIUDADANA").map(alerta => (
                <div
                  key={alerta.id}
                  onClick={() => {
                    if (tabActiva === "nuevas") {
                      seleccionarAlerta(alerta.id);
                    } else {
                      seleccionarIntervencion(alerta.id);
                    }
                  }}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200
                    ${(tabActiva === "nuevas" && alertaSeleccionada === alerta.id) || (tabActiva === "intervencion" && intervencionSeleccionada === alerta.id)
                      ? 'border-blue-500 bg-blue-50/50 shadow-lg'
                      : 'border-slate-200 bg-white shadow-md hover:shadow-lg'
                    }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xl shrink-0 shadow-inner">
                      {alerta.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-[14px] font-bold text-[#1e293b] tracking-wide leading-tight block w-[150px]">
                        {alerta.nombre}
                      </h4>
                    </div>
                    <span className={`-mt-6 px-2 py-1 rounded-md text-[9px] font-bold uppercase whitespace-nowrap ${
                      alerta.enIntervencion ? 'bg-blue-600' : 'bg-yellow-400'
                    } text-white`}>
                      {alerta.enIntervencion ? "INTERVENCION" : "VERIFICACIÓN"}
                    </span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-slate-500 bg-white/50 p-2 rounded-lg border border-slate-100">
                    <FaCircle className="text-blue-500 text-[8px]" />
                    <span className="break-words">{alerta.categoria}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* PANEL CENTRAL Y DERECHO */}
      <div className="flex-1 flex flex-col gap-6 pb-10">
        
        {/* MAPA */}
        <div className="w-full h-[520px] shrink-0 bg-white rounded-3xl shadow-lg border-4 border-white overflow-hidden relative">
          <div ref={mapContainer} className="w-full h-full" />
        </div>

        {/* CONTENEDOR DETALLE ALERTA: para pestaña NUEVAS */}
        {tabActiva === "nuevas" && (
          <div className={`mt-4 grid transition-all duration-[1000ms] ease-in-out ${alertaSeleccionada ? "grid-rows-[1fr] opacity-100 mb-4" : "grid-rows-[0fr] opacity-0 mb-0"} drop-shadow-xl`}>
            <div className="overflow-hidden">
              {detalleVisible && (
                <DetalleAlerta alerta={detalleVisible} onClose={() => setAlertaSeleccionada(null)} />
              )}
            </div>
          </div>
        )}

        {/* CONTENEDOR DETALLE ALERTA: para pestaña INTERVENCIÓN */}
        {tabActiva === "intervencion" && (
          <div className={`mt-4 grid transition-all duration-[1000ms] ease-in-out ${intervencionSeleccionada ? "grid-rows-[1fr] opacity-100 mb-4" : "grid-rows-[0fr] opacity-0 mb-0"} drop-shadow-xl`}>
            <div className="overflow-hidden">
              {alertaActualObj && (
                <DetalleAlerta alerta={alertaActualObj} onClose={() => setIntervencionSeleccionada(null)} />
              )}
            </div>
          </div>
        )}

        {/* GESTIÓN DE PATRULLAS */}
        <div className="bg-white p-8 rounded-3xl shadow-lg border border-slate-100 transition-all duration-[1000ms]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-13px] font-black uppercase flex items-center gap-3 text-2xl tracking-tight text-[#1e293b]">
              <span className="w-10 h-10 flex items-center justify-center bg-green-50 rounded-lg">
                <FaTruck className="text-green-700 text-sm" size={20} />
              </span>
              {tabActiva === "nuevas" ? "Gestión de Patrullas Operativas" : "Seguimiento de Patrullas"}
            </h3>
            {tabActiva === "nuevas" && alertaSeleccionada && (
              <div className="bg-gray-50 text-gray-500 px-6 py-3 rounded-xl text-xs font-extrabold flex items-center gap-1 shadow-sm text-[12px] uppercase tracking-widest border border-gray-200">
                <span>
                  {unidadesAsignadas.length} PATRULLA{unidadesAsignadas.length !== 1 ? 'S' : ''} ASIGNADA{unidadesAsignadas.length !== 1 ? 'S' : ''}
                </span>
              </div>
            )}
          </div>

          {tabActiva === "nuevas" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {unidades.map(u => {
                  const estado = estadosUnidades[u.id];
                  const estaAsignadaReal = alertaSeleccionada && asignaciones[u.id] === alertaSeleccionada;
                  const estaPendiente = alertaSeleccionada && pendingAsignaciones[u.id] === alertaSeleccionada;
                  
                  const resaltar = estaPendiente || (estaAsignadaReal && estaEnIntervencion);
                  
                  let textoBoton = '';
                  let claseBoton = '';
                  let deshabilitado = false;
                  
                  const noOperacion = !alertaSeleccionada || estaEnIntervencion;
                  
                  if (estado === 'DISPONIBLE') {
                    if (estaPendiente) {
                      textoBoton = 'SELECCIONADA';
                      claseBoton = 'bg-slate-400 text-white cursor-not-allowed';
                      deshabilitado = true;
                    } else {
                      textoBoton = 'DESPACHAR';
                      claseBoton = 'bg-green-700 hover:bg-green-800 text-white';
                      deshabilitado = noOperacion;
                    }
                  } else if (estado === 'NOTIFICADO') {
                    textoBoton = 'NOTIFICADO';
                    claseBoton = 'bg-blue-500 text-white cursor-not-allowed';
                    deshabilitado = true;
                  } else if (estado === 'EN_CAMINO') {
                    textoBoton = 'EN CAMINO';
                    claseBoton = 'bg-orange-600 text-white cursor-not-allowed';
                    deshabilitado = true;
                  } else if (estado === 'EN_LUGAR') {
                    textoBoton = 'EN LUGAR';
                    claseBoton = 'bg-purple-600 text-white cursor-not-allowed';
                    deshabilitado = true;
                  } else {
                    textoBoton = 'NO DISPONIBLE';
                    claseBoton = 'bg-slate-400 text-white cursor-not-allowed';
                    deshabilitado = true;
                  }
                  
                  return (
                    <div key={u.id} className={`p-5 rounded-2xl border-2 transition-all ${resaltar ? 'border-blue-500 bg-blue-50/30 shadow-md scale-[1.02]' : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'}`}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="text-[14px] font-bold text-[#1e293b] tracking-wider">{u.nombre}</p>
                          <p className="text-[12px] text-slate-400 uppercase font-bold">Placa {u.placa}</p>
                        </div>
                        <div className={`w-3 h-3 rounded-full shadow-sm ${
                          estado === 'DISPONIBLE' ? 'bg-green-500' : 
                          estado === 'NOTIFICADO' ? 'bg-blue-500 animate-pulse' : 
                          estado === 'EN_CAMINO' ? 'bg-yellow-500 animate-pulse' : 
                          estado === 'EN_LUGAR' ? 'bg-purple-500 animate-pulse' : 
                          'bg-gray-500'
                        }`}></div>
                      </div>
                      <div className="space-y-1 mb-4">
                        {resaltar && <p className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">Patrulla Vinculada</p>}
                      </div>
                      <button 
                        disabled={deshabilitado}
                        onClick={() => despacharPatrulla(u.id)}
                        className={`w-full py-3 text-[10px] font-black rounded-xl uppercase transition-all shadow-lg active:scale-95 ${claseBoton}`}
                      >
                        {textoBoton}
                      </button>
                    </div>
                  );
                })}
              </div>

              {alertaSeleccionada && Object.keys(pendingAsignaciones).length > 0 && !estaEnIntervencion && (
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={desasignarTodas}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-6 py-4 rounded-xl font-extrabold text-[13px] uppercase flex items-center gap-2 shadow-md transition-all active:scale-95 tracking-wider"
                  >
                    CANCELAR ASIGNACIÓN
                  </button>
                  <button
                    onClick={finalizarAsignacion}
                    className="bg-green-800 hover:bg-green-900 text-white px-6 py-3 rounded-xl font-black text-xs uppercase flex items-center gap-2 shadow-md transition-all active:scale-95 tracking-wider"
                  >
                    <FaCheckCircle size={14} /> FINALIZAR ASIGNACIÓN
                  </button>
                </div>
              )}
            </>
          ) : (
            // PESTAÑA INTERVENCIÓN
            <>
              {!hayAlertasEnIntervencion ? (
                <div className="bg-slate-50 p-8 rounded-2xl text-center border border-slate-200">
                  <FaBell className="text-slate-400 text-5xl mx-auto mb-4" />
                  <p className="text-lg font-black text-slate-600">No hay reportes de intervención activos</p>
                  <p className="text-sm text-slate-400 mt-2">Cuando una alerta pase a intervención, aparecerá aquí.</p>
                </div>
              ) : !intervencionSeleccionada ? (
                <div className="bg-slate-50 p-8 rounded-2xl text-center border border-slate-200">
                  <FaBell className="text-slate-400 text-4xl mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">Seleccione una alerta de la lista de intervención</p>
                  <p className="text-xs text-slate-400">Haga clic en cualquier alerta de la izquierda para ver su seguimiento.</p>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-8">
                  <div className="col-span-12 lg:col-span-8 space-y-6">
                    {/* PATRULLAS ASIGNADAS (solo visualización) */}
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase mb-3 flex items-center gap-2">
                        <FaTruck className="text-blue-600"/> PATRULLAS ASIGNADAS
                      </p>
                      {unidadesAsignadas.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {unidadesAsignadas.map(u => (
                            <span key={u.id} className="bg-white px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 border border-slate-200 shadow-sm">
                              {u.nombre} ({estadosUnidades[u.id]})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">No hay patrullas asignadas a esta alerta</p>
                      )}
                    </div>

                    {/* REPORTE DEL OFICIAL */}
                    {alertaActualObj?.reportePatrullero ? (
                      <>
                        <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-2">
                            <FaFileAlt className="text-blue-600"/> Reporte del oficial 
                            {alertaActualObj.unidadReportante && (
                              <span className="ml-2 text-blue-600 font-black text-[9px] bg-blue-50 px-2 py-0.5 rounded-full">
                                Enviado por {alertaActualObj.unidadReportante}
                              </span>
                            )}
                          </p>
                          <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 min-h-[160px]">
                            <textarea 
                              className="w-full bg-transparent text-sm text-slate-600 font-bold leading-relaxed italic border-none focus:ring-0 resize-none"
                              placeholder="Reporte del oficial..."
                              value={reporteOficial}
                              onChange={(e) => setReporteOficial(e.target.value)}
                            />
                          </div>
                        </div>

                        <div className="flex gap-4">
                          <button 
                            onClick={() => finalizarCaso('atender')}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                          >
                            <FaCheckCircle size={16}/> Marcar Atendido
                          </button>
                          
                          <div className="flex-1 flex gap-2">
                            <select 
                              className="bg-slate-100 border-none rounded-2xl px-4 text-[10px] font-black uppercase text-slate-600 focus:ring-2 focus:ring-blue-500"
                              value={derivacionDestino}
                              onChange={(e) => setDerivacionDestino(e.target.value)}
                            >
                              <option value="">Derivar a...</option>
                              <option value="FELCV">FELCV</option>
                              <option value="FELCC">FELCC</option>
                              <option value="TRANSITO">TRÁNSITO</option>
                              <option value="SALUD">AMBULANCIA</option>
                            </select>
                            <button 
                              onClick={() => finalizarCaso('derivar')}
                              disabled={!derivacionDestino}
                              className={`flex-1 py-4 rounded-2xl font-black text-xs uppercase flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${derivacionDestino ? 'bg-blue-600 text-white shadow-blue-100' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                            >
                              <FaShareSquare size={16}/> Derivar
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-slate-50 p-8 rounded-2xl text-center border border-slate-200">
                        <FaBell className="text-slate-400 text-4xl mx-auto mb-3 animate-pulse" />
                        <p className="text-sm font-bold text-slate-700">⏳ Esperando reporte del oficial en terreno...</p>
                        <p className="text-xs text-slate-500 mt-1">El reporte aparecerá automáticamente cuando sea enviado desde la app del patrullero.</p>
                        <button
                          onClick={simularReportePatrullero}
                          className="mt-4 bg-slate-200 hover:bg-slate-300 text-slate-700 px-4 py-2 rounded-xl text-xs font-black inline-flex items-center gap-2 shadow-md transition-colors"
                        >
                          <FaDownload size={12} /> Simular recepción de reporte
                        </button>
                      </div>
                    )}
                  </div>

                  {/* LADO DERECHO: CATEGORÍA Y EVIDENCIA */}
                  <div className="col-span-12 lg:col-span-4 space-y-6">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Clasificación del hecho</p>
                      <div className="bg-white border-2 border-slate-100 p-4 rounded-2xl text-center">
                        <span className="text-sm font-black text-slate-700 uppercase">{alertaActualObj?.categoria || "---"}</span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <p className="text-[10px] font-black text-slate-400 uppercase">Evidencia adjunta</p>
                      {alertaActualObj?.evidencias && alertaActualObj.evidencias.length > 0 ? (
                        alertaActualObj.evidencias.map((img, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                              <div className="bg-blue-50 p-2 rounded-lg text-blue-600"><FaImage size={14}/></div>
                              <p className="text-[10px] font-black text-slate-700">{img.nombre}</p>
                            </div>
                            <button 
                              onClick={() => descargarImagen(img.nombre)}
                              className="text-slate-300 hover:text-blue-600"
                            >
                              <FaDownload size={14}/>
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white p-4 rounded-2xl border border-slate-100 text-center">
                          <p className="text-xs text-slate-500">No se adjuntaron imágenes</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default CentroDespacho;
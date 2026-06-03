import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import {
  FaUserShield,
  FaExclamationCircle,
  FaTruck,
  FaMapMarkerAlt,
  FaFileAlt,
  FaExclamationTriangle,
  FaBell,
  FaImage,
  FaDownload,
  FaCheckCircle,
  FaShareSquare,
  FaCircle,
} from "react-icons/fa";

// Configuración de íconos de Leaflet (evita errores de rutas)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const unidades = [
  { id: 1, nombre: "PAT-01", placa: "215CDS", oficial: "Sergio Vargas" },
  { id: 2, nombre: "PAT-02", placa: "215CDE", oficial: "Luis Torrez" },
  { id: 3, nombre: "PAT-03", placa: "215CDF", oficial: "Carlos López" },
  { id: 4, nombre: "PAT-04", placa: "215CDG", oficial: "Marco Rojas" },
  { id: 5, nombre: "PAT-05", placa: "215CDH", oficial: "Ana Condori" },
  { id: 6, nombre: "PAT-06", placa: "215CDI", oficial: "Pedro Mamani" },
];

const DATOS_ESTATICOS = [
  {
    id: "ALTC-0001",
    nombre: "Sebastian Sergio Montan Terrazas",
    categoria: "CONTRAVENCIÓN/RUIDO",
    prioridad: "BAJA",
    relato: "Personas consumiendo bebidas alcohólicas en vía pública...",
    lat: -17.3912,
    lng: -66.142,
    tipo: "CIUDADANA",
    enIntervencion: false,
    reportePatrullero: null,
    unidadReportante: null,
    evidencias: [],
  },
  {
    id: "ALTC-0002",
    nombre: "Alex Kevin Velarde Diaz",
    categoria: "AUXILIO MÉDICO",
    prioridad: "MEDIA",
    relato: "Sujeto presenta desmayo en plaza principal...",
    lat: -17.388,
    lng: -66.148,
    tipo: "CIUDADANA",
    enIntervencion: false,
    reportePatrullero: null,
    unidadReportante: null,
    evidencias: [],
  },
  {
    id: "ALTC-0003",
    nombre: "Juana Carolina Rodriguez López",
    categoria: "VIOLENCIA DOMÉSTICA",
    prioridad: "MEDIA",
    relato: "Reporte de agresión física en domicilio...",
    lat: -17.395,
    lng: -66.16,
    tipo: "CIUDADANA",
    enIntervencion: false,
    reportePatrullero: null,
    unidadReportante: null,
    evidencias: [],
  },
  {
    id: "ALTC-0004",
    nombre: "Miguel Ángel Rojas Gregorio",
    categoria: "ROBO DE VEHÍCULO",
    prioridad: "ALTA",
    relato: "Sustracción de motocicleta...",
    lat: -17.382,
    lng: -66.135,
    tipo: "CIUDADANA",
    enIntervencion: false,
    reportePatrullero: null,
    unidadReportante: null,
    evidencias: [],
  },
  {
    id: "ALTC-0006",
    nombre: "Mario Mariano Sansuste Valencia",
    categoria: "ABANDONO DE MASCOTA",
    prioridad: "BAJA",
    relato: "Perro atado a un poste...",
    lat: -17.386,
    lng: -66.144,
    tipo: "CIUDADANA",
    enIntervencion: false,
    reportePatrullero: null,
    unidadReportante: null,
    evidencias: [],
  },
  {
    id: "EMRG-912",
    nombre: "Carlos Luciano Merida Durán",
    categoria: "ACCIDENTE TRÁNSITO",
    prioridad: "ALTA",
    relato: "Colisión múltiple en avenida principal...",
    lat: -17.385,
    lng: -66.145,
    tipo: "EMERGENCIA",
    enIntervencion: false,
    reportePatrullero: null,
    unidadReportante: null,
    evidencias: [],
  },
  {
    id: "EMRG-913",
    nombre: "Roberto Sebastian Cespedes Fernández",
    categoria: "INCENDIO",
    prioridad: "ALTA",
    relato: "Incendio en mercado central...",
    lat: -17.389,
    lng: -66.152,
    tipo: "EMERGENCIA",
    enIntervencion: false,
    reportePatrullero: null,
    unidadReportante: null,
    evidencias: [],
  },
  {
    id: "EMRG-914",
    nombre: "Lucía Marlenne Méndez Montaño",
    categoria: "VIOLENCIA DE GÉNERO",
    prioridad: "ALTA",
    relato: "Mujer agredida físicamente...",
    lat: -17.394,
    lng: -66.158,
    tipo: "EMERGENCIA",
    enIntervencion: false,
    reportePatrullero: null,
    unidadReportante: null,
    evidencias: [],
  },
  {
    id: "EMRG-915",
    nombre: "José Luis Torrez Aranibar",
    categoria: "PERSONA ARMADA",
    prioridad: "ALTA",
    relato: "Sujeto con arma blanca amenazando...",
    lat: -17.39,
    lng: -66.149,
    tipo: "EMERGENCIA",
    enIntervencion: false,
    reportePatrullero: null,
    unidadReportante: null,
    evidencias: [],
  },
  {
    id: "EMRG-916",
    nombre: "Marco Antonio Cespedes Yujra",
    categoria: "SECUESTRO",
    prioridad: "ALTA",
    relato: "Reporte de persona secuestrada...",
    lat: -17.4,
    lng: -66.155,
    tipo: "EMERGENCIA",
    enIntervencion: false,
    reportePatrullero: null,
    unidadReportante: null,
    evidencias: [],
  },
];

const CentroDespacho = () => {
  const [tabActiva, setTabActiva] = useState("nuevas");
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [detalleVisible, setDetalleVisible] = useState(null);
  const [intervencionSeleccionada, setIntervencionSeleccionada] = useState(null);
  const [toast, setToast] = useState(null);
  const [reporteOficial, setReporteOficial] = useState("");
  const [derivacionDestino, setDerivacionDestino] = useState("");
  const [estadosUnidades, setEstadosUnidades] = useState(
    unidades.reduce((acc, u) => ({ ...acc, [u.id]: "DISPONIBLE" }), {})
  );
  const [asignaciones, setAsignaciones] = useState({});
  const [pendingAsignaciones, setPendingAsignaciones] = useState({});
  const [alertasData, setAlertasData] = useState(DATOS_ESTATICOS);

  const mapRef = useRef(null);
  const mapInstance = useRef(null);
  const markersRef = useRef({});
  const unidadesMarkersRef = useRef({});

  const showToast = useCallback((msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }, []);

  // Funciones de lógica de negocio (sin cambios relevantes)
  const descargarImagen = (nombre) => {
    const blob = new Blob(["Imagen simulada"], { type: "image/jpeg" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = nombre;
    link.click();
    URL.revokeObjectURL(url);
  };

  const simularReportePatrullero = () => {
    const alertaId = tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada;
    if (!alertaId) return;
    const unidadId = Object.keys(asignaciones).find((key) => asignaciones[key] === alertaId);
    const unidad = unidades.find((u) => u.id === parseInt(unidadId));
    const nombreUnidad = unidad ? unidad.nombre : "Patrulla desconocida";
    const reporte = "En el lugar se encontró a las personas consumiendo alcohol en vía pública. Se procedió a la identificación y al retiro del grupo.";
    const evidenciasMock = [{ nombre: "evidencia_01.jpg", url: "#" }];
    setAlertasData((prev) =>
      prev.map((a) =>
        a.id === alertaId
          ? { ...a, reportePatrullero: reporte, unidadReportante: nombreUnidad, evidencias: evidenciasMock }
          : a
      )
    );
  };

  const despacharPatrulla = (unidadId) => {
    if (!alertaSeleccionada) return;
    const alerta = alertasData.find((a) => a.id === alertaSeleccionada);
    if (!alerta || alerta.enIntervencion) return;
    if (estadosUnidades[unidadId] !== "DISPONIBLE") return;
    setPendingAsignaciones((prev) => {
      if (prev[unidadId] === alertaSeleccionada) {
        const { [unidadId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [unidadId]: alertaSeleccionada };
    });
  };

  const desasignarTodas = () => {
    if (alertaSeleccionada) setPendingAsignaciones({});
  };

  const finalizarAsignacion = () => {
    if (!alertaSeleccionada) return;
    const pendientes = Object.entries(pendingAsignaciones)
      .filter(([, alertId]) => alertId === alertaSeleccionada)
      .map(([id]) => parseInt(id));
    if (pendientes.length === 0) return;
    const nombres = pendientes.map((id) => unidades.find((u) => u.id === id)?.nombre).filter(Boolean);
    showToast(`NOTIFICACIÓN ENVIADA A: ${nombres.join(", ")}. Estado: NOTIFICADO`);
    setEstadosUnidades((prev) => {
      const nuevos = { ...prev };
      pendientes.forEach((id) => { nuevos[id] = "NOTIFICADO"; });
      return nuevos;
    });
    setAsignaciones((prev) => {
      const nuevas = { ...prev };
      pendientes.forEach((id) => { nuevas[id] = alertaSeleccionada; });
      return nuevas;
    });
    setPendingAsignaciones({});
    setAlertasData((prev) =>
      prev.map((a) => (a.id === alertaSeleccionada ? { ...a, enIntervencion: true } : a))
    );
    setTimeout(() => setAlertaSeleccionada(null), 2000);
  };

  const finalizarCaso = (tipo) => {
    const alertaId = tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada;
    if (!alertaId) return;
    const alerta = alertasData.find((a) => a.id === alertaId);
    const unidadesAsignadas = Object.entries(asignaciones)
      .filter(([, id]) => id === alertaId)
      .map(([uid]) => parseInt(uid));
    const datosTabulacion = {
      ...alerta,
      reporteFinal: reporteOficial,
      estadoCierre: tipo === "derivar" ? `DERIVADO A ${derivacionDestino}` : "ATENDIDO",
      unidadesQueAtendieron: unidadesAsignadas.map((id) => unidades.find((u) => u.id === id)?.nombre).filter(Boolean),
      fechaCierre: new Date().toISOString(),
    };
    console.log("ALERTA FINALIZADA:", datosTabulacion);
    showToast(`Caso ${alerta.id} finalizado. Notificando al ciudadano.`);
    if (unidadesAsignadas.length) {
      setEstadosUnidades((prev) => {
        const nuevos = { ...prev };
        unidadesAsignadas.forEach((id) => { nuevos[id] = "DISPONIBLE"; });
        return nuevos;
      });
      setAsignaciones((prev) => {
        const nuevas = { ...prev };
        unidadesAsignadas.forEach((id) => { delete nuevas[id]; });
        return nuevas;
      });
    }
    setAlertasData((prev) => prev.filter((a) => a.id !== alertaId));
    if (tabActiva === "nuevas") setAlertaSeleccionada(null);
    else setIntervencionSeleccionada(null);
    setReporteOficial("");
    setDerivacionDestino("");
  };

  const seleccionarAlerta = (id) => setAlertaSeleccionada((prev) => (prev === id ? null : id));
  const seleccionarIntervencion = (id) => setIntervencionSeleccionada((prev) => (prev === id ? null : id));

  // Efectos para detalle
  useEffect(() => {
    if (alertaSeleccionada && tabActiva === "nuevas") {
      const alerta = alertasData.find((a) => a.id === alertaSeleccionada);
      setDetalleVisible(alerta);
      setReporteOficial(alerta?.reportePatrullero || "");
    } else if (!alertaSeleccionada) {
      const timer = setTimeout(() => setDetalleVisible(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [alertaSeleccionada, alertasData, tabActiva]);

  useEffect(() => {
    if (intervencionSeleccionada && tabActiva === "intervencion") {
      const alerta = alertasData.find((a) => a.id === intervencionSeleccionada);
      setReporteOficial(alerta?.reportePatrullero || "");
    }
  }, [intervencionSeleccionada, alertasData, tabActiva]);

  // ===================== MAPA CON LEAFLET (OPTIMIZADO) =====================
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    try {
      mapInstance.current = L.map(mapRef.current).setView([-17.3896, -66.1552], 14);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; CartoDB',
        subdomains: "abcd",
        maxZoom: 19,
      }).addTo(mapInstance.current);

      const crearMarcador = (color, size = 20) =>
        L.divIcon({
          className: "custom-marker",
          html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
          iconSize: [size, size],
          popupAnchor: [0, -size / 2],
        });

      // Agregar alertas iniciales
      alertasData.forEach((alerta) => {
        const color = alerta.tipo === "EMERGENCIA" ? "#dc2626" : "#2563eb";
        const marker = L.marker([alerta.lat, alerta.lng], { icon: crearMarcador(color, 20) })
          .addTo(mapInstance.current)
          .bindPopup(`<b>${alerta.id}</b><br>${alerta.nombre}<br>${alerta.categoria}`);
        marker.on("click", () => {
          if (tabActiva === "nuevas") seleccionarAlerta(alerta.id);
        });
        markersRef.current[alerta.id] = marker;
      });

      // Agregar unidades
      unidades.forEach((u) => {
        const pos = {
          1: { lat: -17.39, lng: -66.141 },
          2: { lat: -17.3875, lng: -66.1475 },
          3: { lat: -17.3945, lng: -66.1595 },
          4: { lat: -17.383, lng: -66.136 },
          5: { lat: -17.386, lng: -66.144 },
          6: { lat: -17.3855, lng: -66.1455 },
        }[u.id];
        if (pos) {
          const marker = L.marker([pos.lat, pos.lng], { icon: crearMarcador("#10b981", 16) })
            .addTo(mapInstance.current)
            .bindPopup(`<b>${u.nombre}</b><br>Placa: ${u.placa}<br>Estado: ${estadosUnidades[u.id]}`);
          unidadesMarkersRef.current[u.id] = marker;
        }
      });
    } catch (err) {
      console.error("Error al inicializar el mapa:", err);
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      markersRef.current = {};
      unidadesMarkersRef.current = {};
    };
  }, []); // Solo una vez

  // Actualizar marcadores cuando cambien los datos (sin recrear el mapa)
  useEffect(() => {
    if (!mapInstance.current) return;

    // Eliminar marcadores de alertas que ya no existen
    const idsActuales = new Set(alertasData.map((a) => a.id));
    Object.keys(markersRef.current).forEach((id) => {
      if (!idsActuales.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Agregar o actualizar marcadores de alertas
    alertasData.forEach((alerta) => {
      const color = alerta.tipo === "EMERGENCIA" ? "#dc2626" : "#2563eb";
      if (!markersRef.current[alerta.id]) {
        const marcador = L.divIcon({
          className: "custom-marker",
          html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>`,
          iconSize: [20, 20],
          popupAnchor: [0, -10],
        });
        const marker = L.marker([alerta.lat, alerta.lng], { icon: marcador })
          .addTo(mapInstance.current)
          .bindPopup(`<b>${alerta.id}</b><br>${alerta.nombre}<br>${alerta.categoria}`);
        marker.on("click", () => {
          if (tabActiva === "nuevas") seleccionarAlerta(alerta.id);
        });
        markersRef.current[alerta.id] = marker;
      } else {
        markersRef.current[alerta.id].setLatLng([alerta.lat, alerta.lng]);
      }
    });
  }, [alertasData, tabActiva]);

  // Actualizar popups de unidades cuando cambie su estado
  useEffect(() => {
    if (!mapInstance.current) return;
    unidades.forEach((u) => {
      const marker = unidadesMarkersRef.current[u.id];
      if (marker) {
        marker.bindPopup(`<b>${u.nombre}</b><br>Placa: ${u.placa}<br>Estado: ${estadosUnidades[u.id]}`);
      }
    });
  }, [estadosUnidades]);

  // Vuelo a la alerta seleccionada
  const alertaActual = useMemo(() => {
    if (tabActiva === "nuevas" && alertaSeleccionada)
      return alertasData.find((a) => a.id === alertaSeleccionada);
    if (tabActiva === "intervencion" && intervencionSeleccionada)
      return alertasData.find((a) => a.id === intervencionSeleccionada);
    return null;
  }, [tabActiva, alertaSeleccionada, intervencionSeleccionada, alertasData]);

  useEffect(() => {
    if (mapInstance.current && alertaActual) {
      mapInstance.current.flyTo([alertaActual.lat, alertaActual.lng], 17, { duration: 1.2 });
    }
  }, [alertaActual]);

  // ===================== RENDER =====================
  const alertasVisibles = alertasData.filter((a) => (tabActiva === "nuevas" ? !a.enIntervencion : a.enIntervencion));
  const emergencias = alertasVisibles.filter((a) => a.tipo === "EMERGENCIA");
  const ciudadanas = alertasVisibles.filter((a) => a.tipo === "CIUDADANA");

  const unidadesAsignadas = (() => {
    const alertaId = tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada;
    if (!alertaId) return [];
    return Object.entries(asignaciones)
      .filter(([, aid]) => aid === alertaId)
      .map(([uid]) => unidades.find((u) => u.id === parseInt(uid)))
      .filter(Boolean);
  })();

  const DetalleAlerta = ({ alerta, onClose }) => {
    if (!alerta) return null;
    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold text-[#1e293b] uppercase">
                {alerta.tipo === "EMERGENCIA" ? "Emergencia" : "Alerta Ciudadana"} {alerta.id}
              </h2>
              {alerta.tipo === "CIUDADANA" && (
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-bold text-white ${alerta.enIntervencion ? "bg-blue-600" : "bg-yellow-400"}`}>
                  {alerta.enIntervencion ? "INTERVENCIÓN" : "VERIFICACIÓN"}
                </span>
              )}
              {alerta.tipo === "EMERGENCIA" && alerta.prioridad === "ALTA" && (
                <span className="px-2 py-0.5 rounded-md text-[9px] font-bold text-white bg-red-600">EMERGENCIA</span>
              )}
            </div>
            <div className="mt-2">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold text-white ${alerta.prioridad === "ALTA" ? "bg-red-600" : alerta.prioridad === "MEDIA" ? "bg-blue-600" : "bg-yellow-500"}`}>
                <FaExclamationCircle size={8} /> {alerta.prioridad}
              </span>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-400 text-[10px] font-bold uppercase">CERRAR</button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Categoría</p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 font-bold">
                  <FaFileAlt className={alerta.tipo === "EMERGENCIA" ? "text-red-500" : "text-blue-500"} />
                  <span className="text-[11px] uppercase">{alerta.categoria}</span>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Coordenadas</p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div className="flex items-center gap-2 text-slate-500 font-bold">
                  <FaMapMarkerAlt className="text-red-500" />
                  <span className="text-[11px]">{alerta.lat}, {alerta.lng}</span>
                </div>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Descripción</p>
            <div className="h-28 p-3 rounded-xl bg-slate-50 border border-slate-100 overflow-y-auto">
              <p className="text-[11px] text-slate-500">{alerta.relato}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="-mt-2 w-full px-1 min-h-screen py-3 font-sans flex gap-6 items-stretch">
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl text-xs font-bold">
          {toast}
        </div>
      )}

      {/* Sidebar izquierdo */}
      <div className="w-[320px] shrink-0 flex flex-col bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="p-3 bg-white border-b border-slate-100">
          <div className="mt-1 flex bg-slate-50/50 p-1 rounded-xl border border-slate-200">
            <button onClick={() => setTabActiva("nuevas")} className={`flex-1 py-2.5 rounded-lg font-bold text-[11px] uppercase transition-all ${tabActiva === "nuevas" ? "bg-green-900 text-white shadow-sm" : "text-slate-400 hover:bg-white"}`}>
              NUEVAS ALERTAS
            </button>
            <button onClick={() => setTabActiva("intervencion")} className={`flex-1 py-2.5 rounded-lg font-bold text-[11px] uppercase transition-all ${tabActiva === "intervencion" ? "bg-[#0a43c0] text-white shadow-sm" : "text-slate-400 hover:bg-white"}`}>
              INTERVENCIÓN
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          <div>
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase mb-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-red-700 rounded-full animate-pulse"></span> Emergencias
            </h3>
            <div className="space-y-3">
              {emergencias.map((alerta) => (
                <div key={alerta.id} onClick={() => tabActiva === "nuevas" ? seleccionarAlerta(alerta.id) : seleccionarIntervencion(alerta.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${(tabActiva === "nuevas" && alertaSeleccionada === alerta.id) || (tabActiva === "intervencion" && intervencionSeleccionada === alerta.id) ? "border-red-300 bg-red-100/20 shadow" : "border-slate-200 bg-white shadow hover:shadow-md"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">{alerta.nombre.charAt(0)}</div>
                    <div className="flex-1">
                      <div className="text-[12px] font-bold text-[#1e293b]">{alerta.nombre.split(" ").slice(0, 2).join(" ")}</div>
                      <div className="text-[12px] font-bold text-[#1e293b]">{alerta.nombre.split(" ").slice(2).join(" ")}</div>
                    </div>
                    <span className="bg-red-600 text-white px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase">EMERGENCIA</span>
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-slate-400"><FaCircle className="inline text-[6px] mr-1" /> {alerta.categoria}</div>
                </div>
              ))}
              {emergencias.length === 0 && <div className="text-center text-slate-400 text-xs py-4">Sin emergencias</div>}
            </div>
          </div>
          <div className="border-t border-slate-100"></div>
          <div>
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase mb-3 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-900 rounded-full animate-pulse"></span> Alertas Ciudadanas
            </h3>
            <div className="space-y-3">
              {ciudadanas.map((alerta) => (
                <div key={alerta.id} onClick={() => tabActiva === "nuevas" ? seleccionarAlerta(alerta.id) : seleccionarIntervencion(alerta.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${(tabActiva === "nuevas" && alertaSeleccionada === alerta.id) || (tabActiva === "intervencion" && intervencionSeleccionada === alerta.id) ? "border-blue-300 bg-blue-100/20 shadow" : "border-slate-200 bg-white shadow hover:shadow-md"}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm">{alerta.nombre.charAt(0)}</div>
                    <div className="flex-1">
                      <div className="text-[12px] font-bold text-[#1e293b]">{alerta.nombre.split(" ").slice(0, 2).join(" ")}</div>
                      <div className="text-[12px] font-bold text-[#1e293b]">{alerta.nombre.split(" ").slice(2).join(" ")}</div>
                    </div>
                    <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase text-white ${alerta.enIntervencion ? "bg-blue-600" : "bg-yellow-400"}`}>
                      {alerta.enIntervencion ? "INTERVENCION" : "VERIFICACIÓN"}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] font-bold text-slate-400"><FaCircle className="inline text-[6px] mr-1" /> {alerta.categoria}</div>
                </div>
              ))}
              {ciudadanas.length === 0 && <div className="text-center text-slate-400 text-xs py-4">Sin alertas ciudadanas</div>}
            </div>
          </div>
        </div>
      </div>

      {/* Panel central */}
      <div className="flex-1 flex flex-col gap-4 pb-6">
        <div className="w-full h-[400px] bg-white rounded-2xl shadow-md overflow-hidden">
          <div ref={mapRef} className="w-full h-full" />
        </div>

        {/* Detalle alerta (nuevas) */}
        {tabActiva === "nuevas" && detalleVisible && (
          <div className="transition-all duration-300">
            <DetalleAlerta alerta={detalleVisible} onClose={() => setAlertaSeleccionada(null)} />
          </div>
        )}

        {/* Detalle alerta (intervención) */}
        {tabActiva === "intervencion" && alertaActual && (
          <div className="transition-all duration-300">
            <DetalleAlerta alerta={alertaActual} onClose={() => setIntervencionSeleccionada(null)} />
          </div>
        )}

        {/* Gestión de patrullas */}
        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[15px] font-black uppercase flex items-center gap-2">
              <span className="w-7 h-7 flex items-center justify-center bg-green-50 rounded-lg"><FaTruck className="text-green-700" /></span>
              {tabActiva === "nuevas" ? "Gestión de Patrullas" : "Seguimiento de Patrullas"}
            </h3>
            {tabActiva === "nuevas" && alertaSeleccionada && (
              <div className="bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase border border-gray-200">
                {unidadesAsignadas.length} PATRULLA{unidadesAsignadas.length !== 1 ? "S" : ""} ASIGNADA{unidadesAsignadas.length !== 1 ? "S" : ""}
              </div>
            )}
          </div>

          {tabActiva === "nuevas" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {unidades.map((u) => {
                  const estado = estadosUnidades[u.id];
                  const pendiente = pendingAsignaciones[u.id] === alertaSeleccionada;
                  const yaAsignada = asignaciones[u.id] === alertaSeleccionada;
                  const resaltar = pendiente || (yaAsignada && alertaActual?.enIntervencion);
                  let textoBoton = "", claseBoton = "", deshabilitado = false;
                  if (estado === "DISPONIBLE") {
                    if (pendiente) {
                      textoBoton = "SELECCIONADA";
                      claseBoton = "bg-slate-400 text-white cursor-not-allowed";
                      deshabilitado = true;
                    } else {
                      textoBoton = "DESPACHAR";
                      claseBoton = "bg-green-700 hover:bg-green-800 text-white";
                      deshabilitado = !alertaSeleccionada || alertaActual?.enIntervencion;
                    }
                  } else if (estado === "NOTIFICADO") {
                    textoBoton = "NOTIFICADO";
                    claseBoton = "bg-blue-500 text-white cursor-not-allowed";
                    deshabilitado = true;
                  } else {
                    textoBoton = "NO DISPONIBLE";
                    claseBoton = "bg-slate-400 text-white cursor-not-allowed";
                    deshabilitado = true;
                  }
                  return (
                    <div key={u.id} className={`p-3 rounded-xl border-2 transition-all ${resaltar ? "border-blue-500 bg-blue-50/30 shadow-md" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"}`}>
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[12px] font-bold text-[#1e293b]">{u.nombre}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Placa {u.placa}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${estado === "DISPONIBLE" ? "bg-green-500" : estado === "NOTIFICADO" ? "bg-blue-500 animate-pulse" : "bg-gray-500"}`}></div>
                      </div>
                      <button disabled={deshabilitado} onClick={() => despacharPatrulla(u.id)} className={`w-full py-2 text-[9px] font-black rounded-lg uppercase transition-all shadow active:scale-95 ${claseBoton}`}>
                        {textoBoton}
                      </button>
                    </div>
                  );
                })}
              </div>
              {alertaSeleccionada && Object.keys(pendingAsignaciones).length > 0 && !alertaActual?.enIntervencion && (
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={desasignarTodas} className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-4 py-2 rounded-lg font-extrabold text-[11px] uppercase">CANCELAR ASIGNACIÓN</button>
                  <button onClick={finalizarAsignacion} className="bg-green-800 hover:bg-green-900 text-white px-4 py-2 rounded-lg font-black text-[11px] uppercase flex items-center gap-1 shadow"><FaCheckCircle size={12} /> FINALIZAR ASIGNACIÓN</button>
                </div>
              )}
            </>
          ) : (
            // Intervención
            <>
              {alertasData.filter(a => a.enIntervencion).length === 0 ? (
                <div className="bg-slate-50 p-5 rounded-xl text-center"><FaBell className="text-slate-400 text-3xl mx-auto mb-2" /><p className="text-sm font-black text-slate-600">No hay reportes de intervención activos</p></div>
              ) : !intervencionSeleccionada ? (
                <div className="bg-slate-50 p-5 rounded-xl text-center"><FaBell className="text-slate-400 text-2xl mx-auto mb-2" /><p className="text-xs font-bold text-slate-500">Seleccione una alerta de la lista de intervención</p></div>
              ) : (
                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-12 lg:col-span-8 space-y-4">
                    <div className="bg-slate-50 p-3 rounded-xl">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-2"><FaTruck className="inline mr-1" /> PATRULLAS ASIGNADAS</p>
                      <div className="flex flex-wrap gap-1.5">
                        {unidadesAsignadas.length ? unidadesAsignadas.map(u => <span key={u.id} className="bg-white px-2 py-1 rounded-lg text-[10px] font-bold border border-slate-200">{u.nombre} ({estadosUnidades[u.id]})</span>) : <span className="text-xs text-slate-400">Ninguna</span>}
                      </div>
                    </div>
                    {alertaActual?.reportePatrullero ? (
                      <>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase"><FaFileAlt className="inline mr-1" /> Reporte del oficial {alertaActual.unidadReportante && <span className="ml-1 text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">{alertaActual.unidadReportante}</span>}</p>
                          <textarea className="w-full bg-slate-50 p-4 rounded-xl text-xs text-slate-600 font-bold resize-none focus:ring-0" rows="4" value={reporteOficial} onChange={e => setReporteOficial(e.target.value)} />
                        </div>
                        <div className="flex gap-3">
                          <button onClick={() => finalizarCaso("atender")} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1"><FaCheckCircle size={11} /> Marcar Atendido</button>
                          <div className="flex-1 flex gap-1">
                            <select className="bg-slate-100 rounded-xl px-2 text-[9px] font-black uppercase" value={derivacionDestino} onChange={e => setDerivacionDestino(e.target.value)}>
                              <option value="">Derivar a...</option>
                              <option value="FELCV">FELCV</option>
                              <option value="FELCC">FELCC</option>
                              <option value="TRANSITO">TRÁNSITO</option>
                              <option value="SALUD">AMBULANCIA</option>
                            </select>
                            <button onClick={() => finalizarCaso("derivar")} disabled={!derivacionDestino} className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1 ${derivacionDestino ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}><FaShareSquare size={11} /> Derivar</button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-slate-50 p-5 rounded-xl text-center">
                        <FaBell className="text-slate-400 text-2xl mx-auto mb-2 animate-pulse" />
                        <p className="text-xs font-bold text-slate-700">⏳ Esperando reporte del oficial...</p>
                        <button onClick={simularReportePatrullero} className="mt-3 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-[9px] font-black inline-flex items-center gap-1"><FaDownload size={10} /> Simular reporte</button>
                      </div>
                    )}
                  </div>
                  <div className="col-span-12 lg:col-span-4 space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Clasificación</p>
                      <div className="bg-white border p-3 rounded-xl text-center"><span className="text-xs font-black uppercase">{alertaActual?.categoria || "---"}</span></div>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase">Evidencia adjunta</p>
                      {alertaActual?.evidencias?.length ? alertaActual.evidencias.map((img, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-xl border mt-1">
                          <div className="flex items-center gap-2"><FaImage className="text-blue-500" /><span className="text-[9px] font-black">{img.nombre}</span></div>
                          <button onClick={() => descargarImagen(img.nombre)}><FaDownload className="text-slate-400 hover:text-blue-600" /></button>
                        </div>
                      )) : <div className="bg-white p-3 rounded-xl border text-center text-[10px] text-slate-500">Sin evidencias</div>}
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
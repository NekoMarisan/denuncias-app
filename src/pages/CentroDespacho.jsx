import React, { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

import {
  FaUserShield,
  FaExclamationCircle,
  FaTruck,
  FaMapMarkerAlt,
  FaFileAlt,
  FaExclamationTriangle,
  FaUserCircle,
  FaInfoCircle,
  FaBell,
  FaImage,
  FaDownload,
  FaCheckCircle,
  FaShareSquare,
  FaTimesCircle,
  FaCircle,
} from "react-icons/fa";

const CentroDespacho = () => {
  const [tabActiva, setTabActiva] = useState("nuevas");
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [detalleVisible, setDetalleVisible] = useState(null);
  const [intervencionSeleccionada, setIntervencionSeleccionada] =
    useState(null);
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
    1: "DISPONIBLE",
    2: "DISPONIBLE",
    3: "DISPONIBLE",
    4: "DISPONIBLE",
    5: "DISPONIBLE",
    6: "DISPONIBLE",
  });

  const [ubicacionesUnidades, setUbicacionesUnidades] = useState({
    1: { lat: -17.39, lng: -66.141 },
    2: { lat: -17.3875, lng: -66.1475 },
    3: { lat: -17.3945, lng: -66.1595 },
    4: { lat: -17.383, lng: -66.136 },
    5: { lat: -17.386, lng: -66.144 },
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
      relato:
        "Personas consumiendo bebidas alcohólicas en vía pública y causando ruidos molestos en la zona.",
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
      relato:
        "Sujeto presenta desmayo en plaza principal, se requiere ambulancia o patrulla cercana.",
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
      relato:
        "Reporte de agresión física en domicilio, solicitan presencia policial.",
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
      relato:
        "Sustracción de motocicleta estacionada en la vía pública, vistas las cámaras de seguridad.",
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
      relato:
        "Perro atado a un poste sin agua ni comida, se solicita unidad para rescate.",
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
      relato: "Colisión múltiple en avenida principal, heridos atrapados.",
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
      relato: "Incendio en mercado central, se requieren bomberos y patrullas.",
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
      relato:
        "Mujer agredida físicamente por su pareja, solicitan presencia urgente.",
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
      relato:
        "Sujeto con arma blanca amenazando en una tienda de conveniencia.",
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
      relato:
        "Reporte de persona secuestrada en zona sur, se necesita apoyo táctico.",
      lat: -17.4,
      lng: -66.155,
      tipo: "EMERGENCIA",
      enIntervencion: false,
      reportePatrullero: null,
      unidadReportante: null,
      evidencias: [],
    },
  ]);

  useEffect(() => {
    setPendingAsignaciones({});
  }, [alertaSeleccionada]);

  useEffect(() => {
    if (tabActiva === "nuevas") {
      setIntervencionSeleccionada(null);
    } else {
      setAlertaSeleccionada(null);
    }
  }, [tabActiva]);

  const descargarImagen = (nombreImagen) => {
    const blob = new Blob(["Contenido de imagen simulado"], {
      type: "image/jpeg",
    });
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
    const alertaActualParaReporte =
      tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada;
    if (!alertaActualParaReporte) return;

    const unidadesAsignadasIds = Object.keys(asignaciones).filter(
      (key) => asignaciones[key] === alertaActualParaReporte,
    );
    const unidadReportanteId = unidadesAsignadasIds[0];
    const unidadReportanteObj = unidades.find(
      (u) => u.id === parseInt(unidadReportanteId),
    );
    const nombreUnidad = unidadReportanteObj
      ? unidadReportanteObj.nombre
      : "Patrulla desconocida";

    const reporteEjemplo =
      "En el lugar se encontró a las personas consumiendo alcohol en vía pública. Se procedió a la identificación y al retiro del grupo. No hubo detenidos.";
    const evidenciasMock = [
      { nombre: "evidencia_01.jpg", url: "#" },
      { nombre: "evidencia_02.jpg", url: "#" },
    ];

    setAlertasData((prev) =>
      prev.map((a) =>
        a.id === alertaActualParaReporte
          ? {
              ...a,
              reportePatrullero: reporteEjemplo,
              unidadReportante: nombreUnidad,
              evidencias: evidenciasMock,
            }
          : a,
      ),
    );
  };

  const despacharPatrulla = (unidadId) => {
    if (!alertaSeleccionada) return;
    const alerta = alertasData.find((a) => a.id === alertaSeleccionada);
    if (!alerta || alerta.enIntervencion) return;
    if (estadosUnidades[unidadId] !== "DISPONIBLE") return;

    if (pendingAsignaciones[unidadId] === alertaSeleccionada) {
      const newPending = { ...pendingAsignaciones };
      delete newPending[unidadId];
      setPendingAsignaciones(newPending);
    } else {
      setPendingAsignaciones((prev) => ({
        ...prev,
        [unidadId]: alertaSeleccionada,
      }));
    }
  };

  const desasignarTodas = () => {
    if (!alertaSeleccionada) return;
    setPendingAsignaciones({});
  };

  const finalizarAsignacion = () => {
    if (!alertaSeleccionada) return;
    const unidadesPendientes = Object.keys(pendingAsignaciones).filter(
      (key) => pendingAsignaciones[key] === alertaSeleccionada,
    );
    if (unidadesPendientes.length === 0) return;

    const nombresUnidades = unidadesPendientes
      .map((id) => unidades.find((u) => u.id === parseInt(id))?.nombre)
      .filter(Boolean);
    const mensaje =
      unidadesPendientes.length === 1
        ? `NOTIFICACIÓN ENVIADA A: ${nombresUnidades[0]}. Estado: NOTIFICADO`
        : `NOTIFICACIÓN ENVIADA A: ${nombresUnidades.join(", ")}. Estado: NOTIFICADO`;
    showToast(mensaje);

    setEstadosUnidades((prev) => {
      const nuevos = { ...prev };
      unidadesPendientes.forEach((uId) => {
        nuevos[uId] = "NOTIFICADO";
      });
      return nuevos;
    });

    setAsignaciones((prev) => {
      const nuevas = { ...prev };
      unidadesPendientes.forEach((uId) => {
        nuevas[uId] = alertaSeleccionada;
      });
      return nuevas;
    });

    setPendingAsignaciones({});

    setAlertasData((prev) =>
      prev.map((a) =>
        a.id === alertaSeleccionada ? { ...a, enIntervencion: true } : a,
      ),
    );

    setTimeout(() => {
      setAlertaSeleccionada(null);
    }, 3000);
  };

  const finalizarCaso = (tipoCierre) => {
    const alertaActualParaCierre =
      tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada;
    if (!alertaActualParaCierre) return;

    const alerta = alertasData.find((a) => a.id === alertaActualParaCierre);
    const unidadesAsignadas = Object.entries(asignaciones)
      .filter(([_, alertId]) => alertId === alertaActualParaCierre)
      .map(([unidadId]) => unidadId);

    const datosParaTabulacion = {
      ...alerta,
      reporteFinal: reporteOficial,
      estadoCierre:
        tipoCierre === "derivar"
          ? `DERIVADO A ${derivacionDestino}`
          : "ATENDIDO",
      unidadesQueAtendieron: unidadesAsignadas
        .map((id) => unidades.find((u) => u.id === parseInt(id))?.nombre)
        .filter(Boolean),
      fechaCierre: new Date().toISOString(),
    };

    console.log(
      "ALERTA TRANSFERIDA AL MÓDULO TABULACIÓN:",
      datosParaTabulacion,
    );
    showToast(
      `Caso ${alerta.id} finalizado. Notificando al ciudadano: "Su caso ha sido atendido".`,
    );

    if (unidadesAsignadas.length > 0) {
      setEstadosUnidades((prev) => {
        const nuevosEstados = { ...prev };
        unidadesAsignadas.forEach((uId) => {
          nuevosEstados[uId] = "DISPONIBLE";
        });
        return nuevosEstados;
      });

      setAsignaciones((prev) => {
        const nuevasAsignaciones = { ...prev };
        unidadesAsignadas.forEach((uId) => {
          delete nuevasAsignaciones[uId];
        });
        return nuevasAsignaciones;
      });
    }

    setAlertasData((prev) =>
      prev.filter((a) => a.id !== alertaActualParaCierre),
    );

    if (tabActiva === "nuevas") {
      setAlertaSeleccionada(null);
    } else {
      setIntervencionSeleccionada(null);
    }
    setReporteOficial("");
  };

  const seleccionarAlerta = (id) => {
    setAlertaSeleccionada((prev) => (prev === id ? null : id));
  };

  const seleccionarIntervencion = (id) => {
    setIntervencionSeleccionada((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (alertaSeleccionada && tabActiva === "nuevas") {
      const alertaEncontrada = alertasData.find(
        (a) => a.id === alertaSeleccionada,
      );
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

  useEffect(() => {
    if (intervencionSeleccionada && tabActiva === "intervencion") {
      const alertaEncontrada = alertasData.find(
        (a) => a.id === intervencionSeleccionada,
      );
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
          osm: {
            type: "raster",
            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors",
          },
        },
        layers: [
          {
            id: "osm-tiles",
            type: "raster",
            source: "osm",
            minzoom: 0,
            maxzoom: 19,
          },
        ],
      },
      center: [-66.142, -17.3912],
      zoom: 14,
    });

    alertasData.forEach((alerta) => {
      const el = document.createElement("div");
      el.className = "custom-marker";
      el.style.backgroundColor =
        alerta.tipo === "EMERGENCIA" ? "#dc2626" : "#2563eb";
      el.style.width = "20px";
      el.style.height = "20px";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 0 6px rgba(0,0,0,0.5)";
      el.style.cursor = "pointer";

      el.addEventListener("click", () => {
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
      const el = document.createElement("div");
      el.className = "custom-marker-unidad";
      el.style.backgroundColor = "#10b981";
      el.style.width = "16px";
      el.style.height = "16px";
      el.style.borderRadius = "50%";
      el.style.border = "2px solid white";
      el.style.boxShadow = "0 0 6px rgba(0,0,0,0.4)";
      el.style.cursor = "default";

      const marker = new maplibregl.Marker(el)
        .setLngLat([pos.lng, pos.lat])
        .addTo(map.current);

      markersUnidades.current[unidadId] = marker;
    });
  }, [alertasData, ubicacionesUnidades, tabActiva]);

  const alertaActual =
    tabActiva === "nuevas" && alertaSeleccionada
      ? alertasData.find((a) => a.id === alertaSeleccionada)
      : tabActiva === "intervencion" && intervencionSeleccionada
        ? alertasData.find((a) => a.id === intervencionSeleccionada)
        : null;

  useEffect(() => {
    if (map.current && alertaActual) {
      map.current.flyTo({
        center: [alertaActual.lng, alertaActual.lat],
        zoom: 17,
        essential: true,
        speed: 1.2,
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
      return alertasData.filter((a) => !a.enIntervencion);
    } else {
      return alertasData.filter((a) => a.enIntervencion);
    }
  };

  const unidadesAsignadas =
    tabActiva === "nuevas" && alertaSeleccionada
      ? Object.entries(asignaciones)
          .filter(([_, alertId]) => alertId === alertaSeleccionada)
          .map(([unidadId]) =>
            unidades.find((u) => u.id === parseInt(unidadId)),
          )
          .filter(Boolean)
      : tabActiva === "intervencion" && intervencionSeleccionada
        ? Object.entries(asignaciones)
            .filter(([_, alertId]) => alertId === intervencionSeleccionada)
            .map(([unidadId]) =>
              unidades.find((u) => u.id === parseInt(unidadId)),
            )
            .filter(Boolean)
        : [];

  const estaEnIntervencion = alertaActual?.enIntervencion || false;
  const alertaActualObj = alertaActual;
  const hayAlertasEnIntervencion = alertasData.some(
    (a) => a.enIntervencion === true,
  );

  // Componente interno DetalleAlerta (ícono eliminado)
  const DetalleAlerta = ({ alerta, onClose }) => {
    if (!alerta) return null;
    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-start">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-extrabold text-[#1e293b] uppercase">
                  Detalle{" "}
                  {alerta.tipo === "EMERGENCIA"
                    ? "Emergencia"
                    : "Alerta Ciudadana"}{" "}
                  {alerta.id}
                </h2>
                {alerta.tipo === "CIUDADANA" && (
                  <div
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold text-white ${alerta.enIntervencion ? "bg-blue-600" : "bg-yellow-400"}`}
                  >
                    <span>
                      {alerta.enIntervencion ? "INTERVENCIÓN" : "VERIFICACIÓN"}
                    </span>
                  </div>
                )}
                {alerta.tipo === "EMERGENCIA" &&
                  alerta.prioridad === "ALTA" && (
                    <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold text-white bg-red-600">
                      <span>EMERGENCIA</span>
                    </div>
                  )}
              </div>
              <div className="mt-2 flex flex-col items-start gap-1">
                <div
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-bold text-white ${
                    alerta.prioridad === "ALTA"
                      ? "bg-red-600"
                      : alerta.prioridad === "MEDIA"
                        ? "bg-blue-600"
                        : alerta.prioridad === "BAJA"
                          ? "bg-yellow-500"
                          : "bg-gray-500"
                  }`}
                >
                  <FaExclamationCircle size={8} />
                  <span> {alerta.prioridad}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-300 hover:text-slate-400 text-[10px] font-bold uppercase tracking-wide"
          >
            CERRAR
          </button>
        </div>

        <div className="mt-4 mb-4">
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <div className="space-y-3">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">
                  Categoría
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 font-bold">
                    <FaFileAlt
                      className={
                        alerta.tipo === "EMERGENCIA"
                          ? "text-red-500 text-xs"
                          : "text-blue-500 text-xs"
                      }
                    />
                    <span className="text-[11px] uppercase tracking-wider">
                      {alerta.categoria}
                    </span>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-wider">
                  Coordenadas
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2 text-slate-500 font-bold">
                    <FaMapMarkerAlt className="text-red-500 text-xs" />
                    <span className="text-[11px] tracking-wider">
                      {alerta.lat}, {alerta.lng}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1 tracking-wider">
                Descripción
              </p>
              <div className="h-28 w-full p-3 rounded-xl bg-slate-50 border border-slate-100">
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  {alerta.relato}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="-mt-2 w-full px-1 min-h-screen py-3 font-sans flex gap-6 items-stretch">
      {/* Toast */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl text-xs font-bold">
          {toast.message}
        </div>
      )}

      {/* SIDEBAR izquierdo */}
      <div className="w-[320px] shrink-0 flex flex-col bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="p-3 bg-white border-b border-slate-100">
          <div className="mt-1 flex bg-slate-50/50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setTabActiva("nuevas")}
              className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-lg font-bold text-[11px] uppercase transition-all tracking-wider ${tabActiva === "nuevas" ? "bg-green-900 text-white shadow-sm" : "text-slate-400 hover:bg-white"}`}
            >
              NUEVAS ALERTAS
            </button>
            <button
              onClick={() => setTabActiva("intervencion")}
              className={`flex-1 flex items-center justify-center gap-1 py-3 rounded-lg font-bold text-[11px] uppercase transition-all tracking-wider ${tabActiva === "intervencion" ? "bg-[#0a43c0] text-white shadow-sm" : "text-slate-400 hover:bg-white"}`}
            >
              INTERVENCIÓN
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {/* Emergencias */}
          <div>
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase mb-3 flex items-center gap-1 tracking-wider">
              <span className="w-1.5 h-1.5 bg-red-700 rounded-full animate-pulse"></span>{" "}
              Alertas de Emergencia
            </h3>
            <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3">
              {getAlertasVisibles()
                .filter((a) => a.tipo === "EMERGENCIA")
                .map((alerta) => (
                  <div
                    key={alerta.id}
                    onClick={() => {
                      if (tabActiva === "nuevas") seleccionarAlerta(alerta.id);
                      else seleccionarIntervencion(alerta.id);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-150
                    ${
                      (tabActiva === "nuevas" &&
                        alertaSeleccionada === alerta.id) ||
                      (tabActiva === "intervencion" &&
                        intervencionSeleccionada === alerta.id)
                        ? "border-red-300 bg-red-100/20 shadow"
                        : "border-slate-200 bg-white shadow hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shrink-0">
                        {alerta.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col leading-tight">
                          <span className="text-[12px] font-bold text-[#1e293b] tracking-wide">
                            {(() => {
                              const partes = alerta.nombre.split(" ");
                              const primeros = partes.slice(0, 2).join(" ");
                              return primeros;
                            })()}
                          </span>
                          <span className="text-[12px] font-bold text-[#1e293b] tracking-wide">
                            {(() => {
                              const partes = alerta.nombre.split(" ");
                              const apellidos = partes.slice(2).join(" ");
                              return apellidos;
                            })()}
                          </span>
                        </div>
                      </div>
                      <span className="-mt-4 bg-red-600 text-white px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase whitespace-nowrap tracking-wider">
                        EMERGENCIA
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white/50 p-1.5 rounded-lg border border-slate-100 tracking-wide">
                      <FaCircle className="text-[6px]" />
                      <span className="break-words text-[10px]">
                        {alerta.categoria}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          <div className="border-t border-slate-100 my-2"></div>

          {/* Ciudadanas */}
          <div>
            <h3 className="text-[10px] font-extrabold text-slate-400 uppercase mb-3 flex items-center gap-1 tracking-wider">
              <span className="w-1.5 h-1.5 bg-green-900 rounded-full animate-pulse "></span>{" "}
              Alertas Ciudadanas
            </h3>
            <div className="max-h-[500px] overflow-y-auto pr-1 space-y-3">
              {getAlertasVisibles()
                .filter((a) => a.tipo === "CIUDADANA")
                .map((alerta) => (
                  <div
                    key={alerta.id}
                    onClick={() => {
                      if (tabActiva === "nuevas") seleccionarAlerta(alerta.id);
                      else seleccionarIntervencion(alerta.id);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all duration-150
                    ${
                      (tabActiva === "nuevas" &&
                        alertaSeleccionada === alerta.id) ||
                      (tabActiva === "intervencion" &&
                        intervencionSeleccionada === alerta.id)
                        ? "border-blue-300 bg-blue-100/20 shadow"
                        : "border-slate-200 bg-white shadow hover:shadow-md "
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shrink-0">
                        {alerta.nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col leading-tight">
                          <span className="text-[12px] font-bold text-[#1e293b] tracking-wide">
                            {(() => {
                              const partes = alerta.nombre.split(" ");
                              const primeros = partes.slice(0, 2).join(" ");
                              return primeros;
                            })()}
                          </span>
                          <span className="text-[12px] font-bold text-[#1e293b] tracking-wide">
                            {(() => {
                              const partes = alerta.nombre.split(" ");
                              const apellidos = partes.slice(2).join(" ");
                              return apellidos;
                            })()}
                          </span>
                        </div>
                      </div>
                      <span
                        className={`-mt-4 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase whitespace-nowrap tracking-wider ${
                          alerta.enIntervencion
                            ? "bg-blue-600"
                            : "bg-yellow-400"
                        } text-white`}
                      >
                        {alerta.enIntervencion
                          ? "INTERVENCION"
                          : "VERIFICACIÓN"}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-1 text-[9px] font-bold text-slate-400 bg-white/50 p-1.5 rounded-lg border border-slate-100">
                      <FaCircle className="text-[6px]" />
                      <span className="break-words text-[10px]">
                        {alerta.categoria}
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* PANEL CENTRAL Y DERECHO */}
      <div className="flex-1 flex flex-col gap-4 pb-6">
        {/* MAPA - altura reducida */}
        <div className="w-full h-[380px] shrink-0 bg-white rounded-2xl shadow-md border-2 border-white overflow-hidden relative">
          <div ref={mapContainer} className="w-full h-full" />
        </div>

        {/* CONTENEDOR DETALLE ALERTA: nuevas */}
        {tabActiva === "nuevas" && (
          <div
            className={`mt-2 grid transition-all duration-700 ease-in-out ${alertaSeleccionada ? "grid-rows-[1fr] opacity-100 mb-3" : "grid-rows-[0fr] opacity-0 mb-0"} drop-shadow-md`}
          >
            <div className="overflow-hidden">
              {detalleVisible && (
                <DetalleAlerta
                  alerta={detalleVisible}
                  onClose={() => setAlertaSeleccionada(null)}
                />
              )}
            </div>
          </div>
        )}

        {/* CONTENEDOR DETALLE ALERTA: intervención */}
        {tabActiva === "intervencion" && (
          <div
            className={`mt-2 grid transition-all duration-700 ease-in-out ${intervencionSeleccionada ? "grid-rows-[1fr] opacity-100 mb-3" : "grid-rows-[0fr] opacity-0 mb-0"} drop-shadow-md`}
          >
            <div className="overflow-hidden">
              {alertaActualObj && (
                <DetalleAlerta
                  alerta={alertaActualObj}
                  onClose={() => setIntervencionSeleccionada(null)}
                />
              )}
            </div>
          </div>
        )}

        {/* GESTIÓN DE PATRULLAS */}
        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100 transition-all">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[15px] font-black uppercase flex items-center gap-2 tracking-tight text-[#1e293b]">
              <span className="w-7 h-7 flex items-center justify-center bg-green-50 rounded-lg">
                <FaTruck className="text-green-700 text-sm" size={16} />
              </span>
              {tabActiva === "nuevas"
                ? "Gestión de Patrullas"
                : "Seguimiento de Patrullas"}
            </h3>
            {tabActiva === "nuevas" && alertaSeleccionada && (
              <div className="bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg text-[9px] font-extrabold flex items-center gap-1 shadow-sm uppercase tracking-wider border border-gray-200">
                <span>
                  {unidadesAsignadas.length} PATRULLA
                  {unidadesAsignadas.length !== 1 ? "S" : ""} ASIGNADA
                  {unidadesAsignadas.length !== 1 ? "S" : ""}
                </span>
              </div>
            )}
          </div>

          {tabActiva === "nuevas" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {unidades.map((u) => {
                  const estado = estadosUnidades[u.id];
                  const estaAsignadaReal =
                    alertaSeleccionada &&
                    asignaciones[u.id] === alertaSeleccionada;
                  const estaPendiente =
                    alertaSeleccionada &&
                    pendingAsignaciones[u.id] === alertaSeleccionada;
                  const resaltar =
                    estaPendiente || (estaAsignadaReal && estaEnIntervencion);

                  let textoBoton = "";
                  let claseBoton = "";
                  let deshabilitado = false;
                  const noOperacion = !alertaSeleccionada || estaEnIntervencion;

                  if (estado === "DISPONIBLE") {
                    if (estaPendiente) {
                      textoBoton = "SELECCIONADA";
                      claseBoton = "bg-slate-400 text-white cursor-not-allowed";
                      deshabilitado = true;
                    } else {
                      textoBoton = "DESPACHAR";
                      claseBoton = "bg-green-700 hover:bg-green-800 text-white";
                      deshabilitado = noOperacion;
                    }
                  } else if (estado === "NOTIFICADO") {
                    textoBoton = "NOTIFICADO";
                    claseBoton = "bg-blue-500 text-white cursor-not-allowed";
                    deshabilitado = true;
                  } else if (estado === "EN_CAMINO") {
                    textoBoton = "EN CAMINO";
                    claseBoton = "bg-orange-600 text-white cursor-not-allowed";
                    deshabilitado = true;
                  } else if (estado === "EN_LUGAR") {
                    textoBoton = "EN LUGAR";
                    claseBoton = "bg-purple-600 text-white cursor-not-allowed";
                    deshabilitado = true;
                  } else {
                    textoBoton = "NO DISPONIBLE";
                    claseBoton = "bg-slate-400 text-white cursor-not-allowed";
                    deshabilitado = true;
                  }

                  return (
                    <div
                      key={u.id}
                      className={`p-3 rounded-xl border-2 transition-all ${resaltar ? "border-blue-500 bg-blue-50/30 shadow-md scale-[1.01]" : "border-slate-100 bg-slate-50/50 hover:border-slate-200"}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[12px] font-bold text-[#1e293b] tracking-wider">
                            {u.nombre}
                          </p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">
                            Placa {u.placa}
                          </p>
                        </div>
                        <div
                          className={`w-2 h-2 rounded-full shadow-sm ${
                            estado === "DISPONIBLE"
                              ? "bg-green-500"
                              : estado === "NOTIFICADO"
                                ? "bg-blue-500 animate-pulse"
                                : estado === "EN_CAMINO"
                                  ? "bg-yellow-500 animate-pulse"
                                  : estado === "EN_LUGAR"
                                    ? "bg-purple-500 animate-pulse"
                                    : "bg-gray-500"
                          }`}
                        ></div>
                      </div>
                      <button
                        disabled={deshabilitado}
                        onClick={() => despacharPatrulla(u.id)}
                        className={`w-full py-2 text-[9px] font-black rounded-lg uppercase transition-all shadow active:scale-95 ${claseBoton}`}
                      >
                        {textoBoton}
                      </button>
                    </div>
                  );
                })}
              </div>

              {alertaSeleccionada &&
                Object.keys(pendingAsignaciones).length > 0 &&
                !estaEnIntervencion && (
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      onClick={desasignarTodas}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-4 py-2 rounded-lg font-extrabold text-[11px] uppercase flex items-center gap-1 shadow transition-all active:scale-95 tracking-wider"
                    >
                      CANCELAR ASIGNACIÓN
                    </button>
                    <button
                      onClick={finalizarAsignacion}
                      className="bg-green-800 hover:bg-green-900 text-white px-4 py-2 rounded-lg font-black text-[11px] uppercase flex items-center gap-1 shadow transition-all active:scale-95 tracking-wider"
                    >
                      <FaCheckCircle size={12} /> FINALIZAR ASIGNACIÓN
                    </button>
                  </div>
                )}
            </>
          ) : (
            // PESTAÑA INTERVENCIÓN
            <>
              {!hayAlertasEnIntervencion ? (
                <div className="bg-slate-50 p-5 rounded-xl text-center border border-slate-200">
                  <FaBell className="text-slate-400 text-3xl mx-auto mb-2" />
                  <p className="text-sm font-black text-slate-600">
                    No hay reportes de intervención activos
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    Cuando una alerta pase a intervención, aparecerá aquí.
                  </p>
                </div>
              ) : !intervencionSeleccionada ? (
                <div className="bg-slate-50 p-5 rounded-xl text-center border border-slate-200">
                  <FaBell className="text-slate-400 text-2xl mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">
                    Seleccione una alerta de la lista de intervención
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-12 lg:col-span-8 space-y-4">
                    {/* PATRULLAS ASIGNADAS */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                        <FaTruck className="text-blue-600 text-xs" /> PATRULLAS
                        ASIGNADAS
                      </p>
                      {unidadesAsignadas.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {unidadesAsignadas.map((u) => (
                            <span
                              key={u.id}
                              className="bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 border border-slate-200 shadow-sm"
                            >
                              {u.nombre} ({estadosUnidades[u.id]})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">
                          No hay patrullas asignadas
                        </p>
                      )}
                    </div>

                    {/* REPORTE DEL OFICIAL */}
                    {alertaActualObj?.reportePatrullero ? (
                      <>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                            <FaFileAlt className="text-blue-600 text-xs" />{" "}
                            Reporte del oficial
                            {alertaActualObj.unidadReportante && (
                              <span className="ml-1 text-blue-600 font-black text-[8px] bg-blue-50 px-1.5 py-0.5 rounded-full">
                                {alertaActualObj.unidadReportante}
                              </span>
                            )}
                          </p>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[120px]">
                            <textarea
                              className="w-full bg-transparent text-xs text-slate-600 font-bold leading-relaxed italic border-none focus:ring-0 resize-none"
                              placeholder="Reporte del oficial..."
                              value={reporteOficial}
                              onChange={(e) =>
                                setReporteOficial(e.target.value)
                              }
                            />
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => finalizarCaso("atender")}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1 transition-all active:scale-95 shadow shadow-emerald-100"
                          >
                            <FaCheckCircle size={11} /> Marcar Atendido
                          </button>

                          <div className="flex-1 flex gap-1">
                            <select
                              className="bg-slate-100 border-none rounded-xl px-2 text-[9px] font-black uppercase text-slate-600 focus:ring-1 focus:ring-blue-500"
                              value={derivacionDestino}
                              onChange={(e) =>
                                setDerivacionDestino(e.target.value)
                              }
                            >
                              <option value="">Derivar a...</option>
                              <option value="FELCV">FELCV</option>
                              <option value="FELCC">FELCC</option>
                              <option value="TRANSITO">TRÁNSITO</option>
                              <option value="SALUD">AMBULANCIA</option>
                            </select>
                            <button
                              onClick={() => finalizarCaso("derivar")}
                              disabled={!derivacionDestino}
                              className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1 transition-all active:scale-95 shadow ${derivacionDestino ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                            >
                              <FaShareSquare size={11} /> Derivar
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-slate-50 p-5 rounded-xl text-center border border-slate-200">
                        <FaBell className="text-slate-400 text-2xl mx-auto mb-2 animate-pulse" />
                        <p className="text-xs font-bold text-slate-700">
                          ⏳ Esperando reporte del oficial...
                        </p>
                        <button
                          onClick={simularReportePatrullero}
                          className="mt-3 bg-slate-200 hover:bg-slate-300 text-slate-700 px-3 py-1.5 rounded-lg text-[9px] font-black inline-flex items-center gap-1 shadow transition-colors"
                        >
                          <FaDownload size={10} /> Simular reporte
                        </button>
                      </div>
                    )}
                  </div>

                  {/* LADO DERECHO: CATEGORÍA Y EVIDENCIA */}
                  <div className="col-span-12 lg:col-span-4 space-y-4">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-400 uppercase">
                        Clasificación
                      </p>
                      <div className="bg-white border border-slate-100 p-3 rounded-xl text-center">
                        <span className="text-xs font-black text-slate-700 uppercase">
                          {alertaActualObj?.categoria || "---"}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase">
                        Evidencia adjunta
                      </p>
                      {alertaActualObj?.evidencias &&
                      alertaActualObj.evidencias.length > 0 ? (
                        alertaActualObj.evidencias.map((img, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100 shadow-sm"
                          >
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600">
                                <FaImage size={11} />
                              </div>
                              <p className="text-[9px] font-black text-slate-700">
                                {img.nombre}
                              </p>
                            </div>
                            <button
                              onClick={() => descargarImagen(img.nombre)}
                              className="text-slate-300 hover:text-blue-600"
                            >
                              <FaDownload size={11} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                          <p className="text-[10px] text-slate-500">
                            Sin evidencias
                          </p>
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
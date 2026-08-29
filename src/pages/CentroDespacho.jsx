import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  useLoadScript,
  GoogleMap,
  Marker,
  Polyline,
} from "@react-google-maps/api";
import {
  FaTruck, FaMapMarkerAlt, FaFileAlt, FaExclamationCircle,
  FaCircle, FaSpinner, FaRoute, FaUser
} from "react-icons/fa";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { getRoute } from "../services/orsService";
import { AlertaCard } from "../components/AlertaCard";
import { DetalleAlerta } from "../components/DatoAlerta";
import { AlertaCardSkeleton } from "../components/ui/Skeleton";
import { GestionPatrullas } from "../components/GestionPatrullas";


const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: -17.3912, lng: -66.142 };
const defaultZoom = 13;
const TARGET_ZOOM = 17;
const mapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const GOOGLE_MAPS_API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
const GOOGLE_LIBRARIES = [];

const ESTADO_DISPONIBLE = 1;
const ESTADO_NOTIFICADO = 2;
const ESTADO_EN_CAMINO  = 3;
const ESTADO_EN_LUGAR   = 4;
const ESTADO_REVISION   = 5;

const COLOR_EMERGENCIA  = "#ef4444";
const COLOR_CIUDADANA   = "#3b82f6";
const COLOR_DISPONIBLE  = "#10b981";
const COLOR_OCUPADO     = "#9ca3af";
const COLOR_INACTIVO    = "#6b7280";
const COLOR_REVISION    = "#9ca3af";

const makeCircleIcon = (color, scale = 8) => ({
  path: window.google.maps.SymbolPath.CIRCLE,
  fillColor: color,
  fillOpacity: 1,
  strokeWeight: 2,
  strokeColor: "#ffffff",
  scale,
});

const makeHaloIcon = (color, scale = 10, opacity = 0.7) => ({
  path: window.google.maps.SymbolPath.CIRCLE,
  fillColor: "transparent",
  fillOpacity: 0,
  strokeWeight: 3,
  strokeColor: color,
  strokeOpacity: opacity,
  scale,
});

const CentroDespacho = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [tabActiva, setTabActiva] = useState("nuevas");
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [intervencionSeleccionada, setIntervencionSeleccionada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [derivacionDestino, setDerivacionDestino] = useState("");

  const [alertasNuevas, setAlertasNuevas] = useState([]);
  const [alertasIntervencion, setAlertasIntervencion] = useState([]);
  const [patrulleros, setPatrulleros] = useState([]);
  const [asignaciones, setAsignaciones] = useState({});
  const [pendingAsignaciones, setPendingAsignaciones] = useState({});
  const [routeGeometry, setRouteGeometry] = useState(null);

  const [map, setMap] = useState(null);
  const haloMarkersRef      = useRef({});
  const patrolHalosRef      = useRef({});
  const pingIntervalRef     = useRef(null);
  const patrolPulseRef      = useRef(null);
  const zoomIntervalRef     = useRef(null);
  const detalleRef          = useRef(null);
  const datosExtraRef       = useRef({});
  const panelCentralRef = useRef(null);
  const [sidebarHeight, setSidebarHeight] = useState(null);
  const [detalleVisible, setDetalleVisible] = useState(false);

  const parsearUbicacion = (str) => {
    if (!str) return null;
    const p = str.split(",");
    if (p.length < 2) return null;
    const lat = parseFloat(p[0].trim());
    const lng = parseFloat(p[1].trim());
    return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
  };

  const fitMapToAllAlerts = useCallback(() => {
    if (!map) return;
    const todas = [...alertasNuevas, ...alertasIntervencion];
    if (todas.length === 0) {
      map.panTo(defaultCenter);
      map.setZoom(defaultZoom);
      return;
    }
    const bounds = new window.google.maps.LatLngBounds();
    todas.forEach(a => bounds.extend({ lat: a.lat, lng: a.lng }));
    map.fitBounds(bounds, 50);
  }, [map, alertasNuevas, alertasIntervencion]);

  const panAndZoomSmoothly = useCallback((targetLat, targetLng, targetZoom = TARGET_ZOOM) => {
    if (!map) return;
    if (zoomIntervalRef.current) {
      clearInterval(zoomIntervalRef.current);
      zoomIntervalRef.current = null;
    }
    map.panTo({ lat: targetLat, lng: targetLng });
    setTimeout(() => {
      const startZoom = map.getZoom();
      if (startZoom === targetZoom) return;
      const direction = startZoom < targetZoom ? 1 : -1;
      let z = startZoom;
      zoomIntervalRef.current = setInterval(() => {
        z += direction;
        map.setZoom(z);
        if (z === targetZoom) {
          clearInterval(zoomIntervalRef.current);
          zoomIntervalRef.current = null;
        }
      }, 120);
    }, 500);
  }, [map]);

const cargarClasificacionAlerta = async (idAlerta) => {
  const { data } = await supabase
    .from("tabulacion_caso")
    .select("resultado_final")
    .eq("id_alerta", idAlerta)
    .order("fecha_tabulacion", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.resultado_final || null;
};

  const cargarRutaPatrullero = async (idPatrullero, alerta) => {
    if (!alerta?.lat || !alerta?.lng) {
      showToast("La alerta no tiene coordenadas válidas", "error");
      return;
    }
    const pat = patrulleros.find(p => p.id_patrullero === idPatrullero);
    if (!pat) {
      showToast("Patrullero no encontrado", "error");
      return;
    }
    const coordsPat = parsearUbicacion(pat.ubicacion_actual);
    if (!coordsPat) {
      showToast(`El patrullero ${pat.placa || idPatrullero} no tiene ubicación válida`, "error");
      return;
    }
    try {
      const routeData = await getRoute([coordsPat.lng, coordsPat.lat], [alerta.lng, alerta.lat]);
      if (routeData?.features?.[0]) {
        setRouteGeometry(routeData.features[0]);
        showToast("Ruta calculada exitosamente", "success");
      } else {
        showToast("No se pudo obtener la ruta", "error");
      }
    } catch (e) {
      console.error("Error ruta:", e);
      showToast("Error al calcular la ruta", "error");
    }
  };

const cargarAlertas = async (silencioso = false) => {
  if (!silencioso) setCargando(true);
  try {
      const { data: alertas, error: errAlertas } = await supabase
  .from("alerta")
  .select(`
    *,
    usuario_ciudadano ( nombre_completo ),
    oficial_bloqueador:bloqueado_por ( nombre_completo )
  `)
  .eq("id_estado_actual", 2)
  .order("fecha_hora", { ascending: false });

      if (errAlertas) throw errAlertas;
      if (!alertas) { setAlertasNuevas([]); setAlertasIntervencion([]); setAsignaciones({}); return; }

      const idsAlertas = alertas.map(a => a.id_alerta);
      const { data: asignacionesActivas, error: errAsig } = await supabase
  .from("asignacion_patrulla")
  .select("id_asignacion, id_alerta, id_patrullero, id_estado_asignacion")
  .in("id_alerta", idsAlertas)
  .neq("id_estado_asignacion", ESTADO_DISPONIBLE)
  .order("id_asignacion", { ascending: false });

      if (errAsig) throw errAsig;

      const mapaAsig    = new Map();
      const mapaPatrulla = new Map();
      for (const asig of asignacionesActivas || []) {
        if (!mapaAsig.has(asig.id_alerta)) {
          mapaAsig.set(asig.id_alerta, asig);
          mapaPatrulla.set(asig.id_patrullero, asig.id_alerta);
        }
      }

      const nuevas = [];
      const intervencion = [];

      for (const item of alertas) {
        const asig = mapaAsig.get(item.id_alerta);
        const coords = parsearUbicacion(item.ubicacion);
        const esEmergencia = (item.categoria === "Panico");

        const datosExtra = datosExtraRef.current[item.id_alerta] || {};

        const alertaObj = {
  id: item.id_alerta,
  codigo: item.codigo_alerta || String(item.id_alerta),
          nombre: item.usuario_ciudadano?.nombre_completo || `Usuario #${item.id_usuario}`,
          clasificacionHecho: item.contravenciones || item.delitos || "Sin clasificación",
          tipoClasificacion: item.contravenciones ? "Contravención" : item.delitos ? "Delito" : null,
          categoria: item.categoria || "",
          prioridad: item.prioridad || "Media",
          relato: item.descripcion || "",
          ubicacion: item.ubicacion || "",
          lat: coords?.lat || -17.3912,
          lng: coords?.lng || -66.142,
          tipo: esEmergencia ? "EMERGENCIA" : "CIUDADANA",
          enIntervencion: !!asig,
          id_asignacion: asig?.id_asignacion || null,
          id_patrullero_asignado: asig?.id_patrullero || null,
            reportePatrullero: datosExtra.reportePatrullero ?? null,
  idPatrulleroReporte: datosExtra.idPatrulleroReporte ?? null,
  evidencias: datosExtra.evidencias ?? [],
  bloqueadoPor: item.bloqueado_por || null,
  bloqueadoNombre: item.oficial_bloqueador?.nombre_completo || null,
        };

        if (asig) intervencion.push(alertaObj);
        else nuevas.push(alertaObj);
      }

      setAlertasNuevas(nuevas);
      setAlertasIntervencion(intervencion);
      setAsignaciones(Object.fromEntries(mapaPatrulla));
    } catch (err) {
      console.error("Error cargar alertas:", err);
      showToast("Error al cargar alertas", "error");
    } finally {
      setCargando(false);
    }
  };

  const cargarPatrulleros = async () => {
    try {
      const { data, error } = await supabase
  .from("patrullero")
  .select(`
    id_patrullero,
    placa,
    ubicacion_actual,
    id_estado_patrullero,
    id_oficial,
    oficial:oficial!fk_patrullero_oficial ( id_oficial, nombre_completo, cargo, estado, numero_escalafon ),
    estado_patrullero ( id_estado_patrullero, nombre_estado )
  `);

      if (error) throw error;

      let lista = (data || []).map(p => ({
        ...p,
        estado_disponibilidad: p.estado_patrullero?.nombre_estado || "DESCONOCIDO",
        id_estado: p.id_estado_patrullero,
        activo: p.oficial?.estado === true,
        nombre_oficial: p.oficial?.nombre_completo || "Sin oficial asignado",
        numero_escalafon: p.oficial?.numero_escalafon || null,
      }));

      lista.sort((a, b) => {
        if (a.activo !== b.activo) return a.activo ? -1 : 1;
        const prioridadEstado = (estado) => {
          if (estado === ESTADO_DISPONIBLE) return 0;
          if (estado === ESTADO_NOTIFICADO) return 1;
          if (estado === ESTADO_EN_CAMINO) return 2;
          if (estado === ESTADO_EN_LUGAR) return 3;
          if (estado === ESTADO_REVISION) return 4;
          return 99;
        };
        const prioridadA = prioridadEstado(a.id_estado);
        const prioridadB = prioridadEstado(b.id_estado);
        if (prioridadA !== prioridadB) return prioridadA - prioridadB;
        return a.id_patrullero - b.id_patrullero;
      });

      setPatrulleros(lista);
    } catch (err) {
      console.error("Error cargar patrulleros:", err);
      setPatrulleros([]);
    }
  };

  const cargarReporte = async (idAlerta) => {
    const { data: reporte } = await supabase
      .from("reporte_alerta")
      .select("id_reporte, id_alerta, id_patrullero, descripcion_reporte, fecha_reporte, resultado")
      .eq("id_alerta", idAlerta)
      .order("fecha_reporte", { ascending: false })
      .limit(1)
      .maybeSingle();

    const { data: evidencias } = await supabase
      .from("evidencia")
      .select("id_evidencia, id_alerta, tipo_evidencia, archivo, fecha_subida")
      .eq("id_alerta", idAlerta)
      .order("fecha_subida", { ascending: true });

    return { reporte: reporte || null, evidencias: evidencias || [] };
  };

  useEffect(() => {
    if (!map || patrulleros.length === 0) return;

    Object.values(patrolHalosRef.current).forEach(({ halo }) => halo?.setMap?.(null));
    patrolHalosRef.current = {};

    patrulleros.forEach(p => {
      if (!p.activo) return;
      const coords = parsearUbicacion(p.ubicacion_actual);
      if (!coords) return;

      let color;
      if (p.id_estado === ESTADO_DISPONIBLE) color = COLOR_DISPONIBLE;
      else if (p.id_estado === ESTADO_NOTIFICADO) color = COLOR_OCUPADO;
      else if (p.id_estado === ESTADO_EN_CAMINO) color = COLOR_OCUPADO;
      else if (p.id_estado === ESTADO_EN_LUGAR) color = COLOR_OCUPADO;
      else if (p.id_estado === ESTADO_REVISION) color = COLOR_REVISION;
      else color = COLOR_INACTIVO;

      const halo = new window.google.maps.Marker({
        position: { lat: coords.lat, lng: coords.lng },
        map,
        icon: makeHaloIcon(color, 10, 0.7),
        zIndex: 0,
      });
      patrolHalosRef.current[p.id_patrullero] = { halo, color };
    });

    let step = 0;
    if (patrolPulseRef.current) clearInterval(patrolPulseRef.current);
    patrolPulseRef.current = setInterval(() => {
      const scale   = 10 + step * 1.5;
      const opacity = Math.max(0.2, 0.7 - step * 0.1);
      Object.values(patrolHalosRef.current).forEach(({ halo, color }) => {
        halo?.setIcon?.(makeHaloIcon(color, scale, opacity));
      });
      step = (step + 1) % 5;
    }, 300);

    return () => {
      if (patrolPulseRef.current) clearInterval(patrolPulseRef.current);
      Object.values(patrolHalosRef.current).forEach(({ halo }) => halo?.setMap?.(null));
      patrolHalosRef.current = {};
    };
  }, [map, patrulleros]);

const intervencionSeleccionadaRef = useRef(null);
useEffect(() => {
  intervencionSeleccionadaRef.current = intervencionSeleccionada;
}, [intervencionSeleccionada]);

const idOficialRef = useRef(null);
useEffect(() => {
  idOficialRef.current = user?.id_oficial;
}, [user?.id_oficial]);

const alertaSeleccionadaRef = useRef(null);
useEffect(() => {
  alertaSeleccionadaRef.current = alertaSeleccionada;
}, [alertaSeleccionada]);

const trabajandoRef = useRef(false);
useEffect(() => {
  trabajandoRef.current = !!(alertaSeleccionada || intervencionSeleccionada);
}, [alertaSeleccionada, intervencionSeleccionada]);

  useEffect(() => {
    cargarAlertas();
    cargarPatrulleros();

    const canal = supabase
  .channel(`despacho-${Date.now()}`)
.on("postgres_changes", { event: "*", schema: "public", table: "alerta" }, async (payload) => {
    const idOficial = idOficialRef.current;
    const esPropioHeartbeat =
      payload.new?.bloqueado_por === idOficial &&
      payload.old?.bloqueado_por === idOficial;
    if (esPropioHeartbeat) return;

    const idAlertaCambio = payload.new?.id_alerta;
    const seLibero = payload.old?.bloqueado_por && !payload.new?.bloqueado_por;

    if (idAlertaCambio) {
      const nuevoBloqueadoPor = payload.new?.bloqueado_por || null;

      const actualizarBloqueo = (lista) => lista.map(a =>
        a.id === idAlertaCambio
          ? {
              ...a,
              bloqueadoPor: nuevoBloqueadoPor,
              bloqueadoNombre: nuevoBloqueadoPor === a.bloqueadoPor ? a.bloqueadoNombre : null,
            }
          : a
      );
      setAlertasNuevas(prev => actualizarBloqueo(prev));
      setAlertasIntervencion(prev => actualizarBloqueo(prev));

      // si cambió el dueño del bloqueo, buscamos su nombre real
      if (nuevoBloqueadoPor && nuevoBloqueadoPor !== idOficial) {
        const { data: oficialData } = await supabase
          .from("oficial")
          .select("nombre_completo")
          .eq("id_oficial", nuevoBloqueadoPor)
          .maybeSingle();
        const nombreReal = oficialData?.nombre_completo || "Otro despachador";
        const asignarNombre = (lista) => lista.map(a =>
          a.id === idAlertaCambio ? { ...a, bloqueadoNombre: nombreReal } : a
        );
        setAlertasNuevas(prev => asignarNombre(prev));
        setAlertasIntervencion(prev => asignarNombre(prev));
      }
    }

    // Un desbloqueo SIEMPRE debe refrescar, sin importar si este cliente
    // tiene otra tarjeta abierta (trabajandoRef ya no bloquea este caso)
    if (seLibero || !trabajandoRef.current) cargarAlertas(true);
  })
  .on("postgres_changes", { event: "*", schema: "public", table: "asignacion_patrulla" }, () => {
    if (!trabajandoRef.current) cargarAlertas(true);
  })
  .on("postgres_changes", { event: "*", schema: "public", table: "patrullero" }, () => cargarPatrulleros())
  .on("postgres_changes", { event: "*", schema: "public", table: "oficial" }, () => cargarPatrulleros())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "evidencia" }, (payload) => {
        const idAlerta = payload.new?.id_alerta;
        if (idAlerta && idAlerta === intervencionSeleccionadaRef.current) {
          setAlertasIntervencion(prev => prev.map(a => {
            if (a.id !== idAlerta) return a;
            const yaExiste = (a.evidencias || []).some(
              ev => ev.id_evidencia === payload.new.id_evidencia
            );
            if (yaExiste) return a;
            const nuevasEvidencias = [...(a.evidencias || []), payload.new];
            datosExtraRef.current[idAlerta] = {
              ...(datosExtraRef.current[idAlerta] || {}),
              evidencias: nuevasEvidencias,
            };
            return { ...a, evidencias: nuevasEvidencias };
          }));
        }
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "reporte_alerta" }, (payload) => {
        const idAlerta = payload.new?.id_alerta;
        if (idAlerta && idAlerta === intervencionSeleccionadaRef.current) {
          const reportePatrullero = payload.new?.descripcion_reporte || null;
          datosExtraRef.current[idAlerta] = {
            ...(datosExtraRef.current[idAlerta] || {}),
            reportePatrullero,
          };
          setAlertasIntervencion(prev => prev.map(a =>
            a.id === idAlerta ? { ...a, reportePatrullero } : a
          ));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, []);

  useEffect(() => {
    if (!map) return;
    const haySeleccion = (tabActiva === "nuevas" && alertaSeleccionada) || (tabActiva !== "nuevas" && intervencionSeleccionada);
    if (!haySeleccion) fitMapToAllAlerts();
  }, [alertasNuevas, alertasIntervencion, map, fitMapToAllAlerts, tabActiva, alertaSeleccionada, intervencionSeleccionada]);

  useEffect(() => {
    if (map && routeGeometry?.geometry?.coordinates?.length) {
      const bounds = new window.google.maps.LatLngBounds();
      routeGeometry.geometry.coordinates.forEach(c => bounds.extend({ lat: c[1], lng: c[0] }));
      map.fitBounds(bounds, 50);
    }
  }, [routeGeometry, map]);

  const detenerPing = () => {
    if (pingIntervalRef.current)  { clearInterval(pingIntervalRef.current);  pingIntervalRef.current  = null; }
    if (zoomIntervalRef.current)  { clearInterval(zoomIntervalRef.current);  zoomIntervalRef.current  = null; }
    Object.values(haloMarkersRef.current).forEach(h => h?.setMap?.(null));
    haloMarkersRef.current = {};
  };

  const iniciarPing = (alertaId, lat, lng, color) => {
    if (pingIntervalRef.current) { clearInterval(pingIntervalRef.current); pingIntervalRef.current = null; }
    Object.values(haloMarkersRef.current).forEach(h => h?.setMap?.(null));
    haloMarkersRef.current = {};

    if (!map) return;
    const halo = new window.google.maps.Marker({
      position: { lat, lng },
      map,
      icon: makeHaloIcon(color, 14, 0.8),
      zIndex: 5,
    });
    haloMarkersRef.current[alertaId] = halo;

    let step = 0;
    pingIntervalRef.current = setInterval(() => {
      if (!halo?.setIcon) { clearInterval(pingIntervalRef.current); return; }
      const scale   = 14 + step * 2.5;
      const opacity = Math.max(0, 0.8 - step * 0.12);
      halo.setIcon(makeHaloIcon(color, scale, opacity));
      step++;
      if (step > 6) step = 0;
    }, 200);
  };

const seleccionarAlerta = useCallback(async (alertaId, tipoTab) => {
  const esNuevas  = tipoTab === "nuevas";
  const selActual = esNuevas ? alertaSeleccionada : intervencionSeleccionada;
  const idOficial = user?.id_oficial;

  try {
    if (selActual === alertaId) {
      if (idOficial) {
        await supabase.from("alerta").update({
          bloqueado_por: null, bloqueado_en: null, bloqueado_rol: null,
        }).eq("id_alerta", alertaId).eq("bloqueado_por", idOficial);
      }
      if (esNuevas) setAlertaSeleccionada(null);
      else setIntervencionSeleccionada(null);
      setDetalleVisible(false);
      detenerPing();
      fitMapToAllAlerts();
      return;
    }

    if (selActual && idOficial) {
      await supabase.from("alerta").update({
        bloqueado_por: null, bloqueado_en: null, bloqueado_rol: null,
      }).eq("id_alerta", selActual).eq("bloqueado_por", idOficial);
    }

    const { data: alertaActualDb } = await supabase
      .from("alerta").select("bloqueado_por").eq("id_alerta", alertaId).maybeSingle();
    if (alertaActualDb?.bloqueado_por && alertaActualDb.bloqueado_por !== idOficial) {
      showToast("Esta alerta ya está siendo gestionada por otro despachador", "error");
      return;
    }

    if (idOficial) {
      const { error: errBloqueo } = await supabase.from("alerta").update({
        bloqueado_por: idOficial, bloqueado_en: new Date().toISOString(), bloqueado_rol: "despachador",
      }).eq("id_alerta", alertaId);
      if (errBloqueo) {
        console.error("Error de bloqueo (no bloqueante):", errBloqueo);
      }
    }

    // Selección siempre se aplica, incluso si el bloqueo falló
    if (esNuevas) setAlertaSeleccionada(alertaId);
    else setIntervencionSeleccionada(alertaId);

setDetalleVisible(true);

    const alerta = [...alertasNuevas, ...alertasIntervencion].find(a => a.id === alertaId);
    if (!alerta) return;

    const clasificacion = await cargarClasificacionAlerta(alertaId);
    if (clasificacion) {
      const update = (lista) => lista.map(a => a.id === alertaId ? { ...a, clasificacionHecho: clasificacion } : a);
      if (esNuevas) setAlertasNuevas(prev => update(prev));
      else setAlertasIntervencion(prev => update(prev));
    }

    const color = alerta.tipo === "EMERGENCIA" ? COLOR_EMERGENCIA : COLOR_CIUDADANA;
    panAndZoomSmoothly(alerta.lat, alerta.lng, TARGET_ZOOM);
    setTimeout(() => iniciarPing(alertaId, alerta.lat, alerta.lng, color), 600);
  } catch (err) {
    console.error("Error en seleccionarAlerta:", err);
    showToast("Ocurrió un error al seleccionar la alerta", "error");
    // Igual aplicamos la selección para que el panel se muestre
    if (esNuevas) setAlertaSeleccionada(alertaId);
    else setIntervencionSeleccionada(alertaId);
  }
}, [alertaSeleccionada, intervencionSeleccionada, alertasNuevas, alertasIntervencion, map, fitMapToAllAlerts, panAndZoomSmoothly]);
  const despacharPatrullero = (idPatrullero) => {
    if (!alertaSeleccionada) return;
    const pat = patrulleros.find(p => p.id_patrullero === idPatrullero);
    if (!pat?.activo || pat.id_estado !== ESTADO_DISPONIBLE) return;

    if (pendingAsignaciones[idPatrullero] === alertaSeleccionada) {
      const n = { ...pendingAsignaciones };
      delete n[idPatrullero];
      setPendingAsignaciones(n);
    } else {
      setPendingAsignaciones(prev => ({ ...prev, [idPatrullero]: alertaSeleccionada }));
    }
  };

  const finalizarAsignacion = async () => {
    if (!alertaSeleccionada) return;
    const pendientes = Object.keys(pendingAsignaciones).filter(k => pendingAsignaciones[k] === alertaSeleccionada);
    if (pendientes.length === 0) return;

    const idOficialAsignador = user?.id_oficial;
    if (!idOficialAsignador) {
      showToast("Error: No se pudo identificar al oficial asignador.", "error");
      return;
    }

    let errores = false;
    for (const idPat of pendientes) {
      const { error: errInsert } = await supabase
        .from("asignacion_patrulla")
        .insert([{
          id_alerta: alertaSeleccionada,
          id_patrullero: Number(idPat),
          id_oficial_asignador: idOficialAsignador,
          fecha_asignacion: new Date().toISOString(),
          id_estado_asignacion: ESTADO_NOTIFICADO,
        }]);
      if (errInsert) {
        showToast(`Error asignando PAT-${idPat}`, "error");
        errores = true;
        continue;
      }

      const { error: errUpdate } = await supabase
        .from("patrullero")
        .update({ id_estado_patrullero: ESTADO_NOTIFICADO })
        .eq("id_patrullero", Number(idPat));
      if (errUpdate) {
        showToast(`Error actualizando PAT-${idPat}`, "error");
        errores = true;
      }
    }

    if (!errores) {
      const nombres = pendientes
        .map(id => {
          const pat = patrulleros.find(p => p.id_patrullero === Number(id));
          return pat?.placa ? `PAT-${pat.placa}` : `PAT-${id}`;
        })
        .join(", ");
      showToast(`Notificación enviada a patrulla: ${nombres}`, "success");

await supabase.from("log_actividad").insert([{
        id_oficial: idOficialAsignador,
        id_alerta: alertaSeleccionada,
        accion: "DESPACHO",
        descripcion: `Despachó patrulla(s) ${nombres} a la alerta`,
      }]);
    }
    
    setPendingAsignaciones({});
    setAlertaSeleccionada(null);
    setDetalleVisible(false);
    setRouteGeometry(null);
    detenerPing();
    await cargarAlertas();
    await cargarPatrulleros();
  };

const enviarATabulacion = async () => {
    const idAlerta = intervencionSeleccionada;
    if (!idAlerta) return;

    const alertaObj = alertasIntervencion.find(a => a.id === idAlerta);
    // ... resto de la función igual que antes
    if (!alertaObj?.reportePatrullero) {
      showToast("Aún no se ha recibido el reporte policial. No es posible continuar.", "error");
      return;
    }

const { error } = await supabase
      .from("alerta")
      .update({ id_estado_actual: 3 })
      .eq("id_alerta", idAlerta);

    if (error) {
      showToast("Error al enviar a tabulación", "error");
      return;
    }

   await supabase.from("log_actividad").insert([{
      id_oficial: user?.id_oficial,
      id_alerta: idAlerta,
      accion: "DESPACHO",
      descripcion: `Envió la alerta a tabulación`,
    }]);

    const { data: asigs } = await supabase
      .from("asignacion_patrulla")
      .select("id_patrullero")
      .eq("id_alerta", idAlerta)
      .neq("id_estado_asignacion", ESTADO_DISPONIBLE);

    for (const asig of asigs || []) {
      await supabase
        .from("asignacion_patrulla")
        .update({ id_estado_asignacion: ESTADO_DISPONIBLE })
        .eq("id_alerta", idAlerta)
        .eq("id_patrullero", asig.id_patrullero);

      await supabase
        .from("patrullero")
        .update({ id_estado_patrullero: ESTADO_DISPONIBLE })
        .eq("id_patrullero", asig.id_patrullero);
    }

showToast("Caso enviado a tabulación", "success");
    setIntervencionSeleccionada(null);
    setDetalleVisible(false);
    setRouteGeometry(null);
    detenerPing();
    cargarAlertas();
    cargarPatrulleros();
  };

  const finalizarEnvioTabulacion = () => {
    setIntervencionSeleccionada(null);
    setDetalleVisible(false);
    setRouteGeometry(null);
    detenerPing();
    cargarAlertas();
    cargarPatrulleros();
  };

  const finalizarCaso = async (tipoCierre) => {
    const idAlerta = tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada;
    if (!idAlerta) return;

    const { error: errAlerta } = await supabase
      .from("alerta")
      .update({ id_estado_actual: 3 })
      .eq("id_alerta", idAlerta);
    if (errAlerta) {
      showToast("Error al finalizar la alerta", "error");
      return;
    }

    const { data: asigs } = await supabase
      .from("asignacion_patrulla")
      .select("id_patrullero")
      .eq("id_alerta", idAlerta)
      .neq("id_estado_asignacion", ESTADO_DISPONIBLE);

    for (const asig of asigs || []) {
      await supabase.from("asignacion_patrulla")
        .update({ id_estado_asignacion: ESTADO_DISPONIBLE })
        .eq("id_alerta", idAlerta).eq("id_patrullero", asig.id_patrullero);
      await supabase.from("patrullero")
        .update({ id_estado_patrullero: ESTADO_DISPONIBLE })
        .eq("id_patrullero", asig.id_patrullero);
    }

    showToast(`Caso finalizado: ${tipoCierre === "derivar" ? `DERIVADO A ${derivacionDestino}` : "ATENDIDO"}`, "success");
    if (tabActiva === "nuevas") setAlertaSeleccionada(null);
    else setIntervencionSeleccionada(null);
    setDetalleVisible(false);
    setDerivacionDestino("");
    setRouteGeometry(null);
    detenerPing();
    cargarAlertas();
    cargarPatrulleros();
  };

  const recalcularSidebarHeight = () => {
  if (panelCentralRef.current) {
    setSidebarHeight(panelCentralRef.current.getBoundingClientRect().height);
  }
  if (!mostrarScrollPanel) {
    setScrollActivo(false);
  }
};

  useEffect(() => {
    if (!intervencionSeleccionada || tabActiva !== "intervencion") return;
    cargarReporte(intervencionSeleccionada).then(({ reporte, evidencias }) => {
      const reportePatrullero = reporte?.descripcion_reporte || null;
      const idPatrulleroReporte = reporte?.id_patrullero || null;
      datosExtraRef.current[intervencionSeleccionada] = { reportePatrullero, idPatrulleroReporte, evidencias };
      setAlertasIntervencion(prev => prev.map(a =>
        a.id === intervencionSeleccionada
          ? { ...a, reportePatrullero, idPatrulleroReporte, evidencias }
          : a
      ));
    });
  }, [intervencionSeleccionada, tabActiva]);

useEffect(() => {
  const observer = new ResizeObserver((entries) => {
    for (const entry of entries) {
      setSidebarHeight(entry.contentRect.height);
    }
  });
  if (panelCentralRef.current) observer.observe(panelCentralRef.current);
  return () => observer.disconnect();
}, []);


useEffect(() => { setPendingAsignaciones({}); }, [alertaSeleccionada]);
useEffect(() => { setRouteGeometry(null); }, [alertaSeleccionada, tabActiva]);
useEffect(() => {
  setDetalleVisible(false);
  if (tabActiva === "nuevas") setIntervencionSeleccionada(null);
  else setAlertaSeleccionada(null);
}, [tabActiva]);

useEffect(() => {
  const idOficial = user?.id_oficial;
  const idSel = tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada;
  if (!idSel || !idOficial) return;
  const heartbeat = setInterval(async () => {
    await supabase.from("alerta").update({ bloqueado_en: new Date().toISOString() })
      .eq("id_alerta", idSel).eq("bloqueado_por", idOficial);
  }, 4000);
  return () => clearInterval(heartbeat);
}, [alertaSeleccionada, intervencionSeleccionada, tabActiva, user?.id_oficial]);

useEffect(() => {
  const liberarBloqueos = async () => {
    const idOficial = user?.id_oficial;
    let q = supabase.from("alerta").update({ bloqueado_por: null, bloqueado_en: null, bloqueado_rol: null })
      .eq("id_estado_actual", 2)
      .lt("bloqueado_en", new Date(Date.now() - 8000).toISOString())
      .not("bloqueado_por", "is", null);
    if (idOficial) q = q.neq("bloqueado_por", idOficial);
    await q;
  };
  const intervalo = setInterval(liberarBloqueos, 5000);
  return () => clearInterval(intervalo);
}, [user?.id_oficial]);

  const alertasVisibles = tabActiva === "nuevas" ? alertasNuevas : alertasIntervencion;
  const alertaActual    = tabActiva === "nuevas"
    ? alertasNuevas.find(a => a.id === alertaSeleccionada)
    : alertasIntervencion.find(a => a.id === intervencionSeleccionada);
const seleccionadaId  = tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada;
const mostrarScrollPanel = detalleVisible && !!alertaActual;
const [scrollActivo, setScrollActivo] = useState(false);

useEffect(() => {
  if (mostrarScrollPanel) {
    setScrollActivo(true);
  }
  // si mostrarScrollPanel pasa a false, NO apagamos scrollActivo aquí;
  // se apaga en recalcularSidebarHeight, que se ejecuta cuando termina la animación de salida
}, [mostrarScrollPanel]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_LIBRARIES,
  });

  if (loadError) return <div className="p-4 text-red-600">Error cargando Google Maps</div>;

return (
<div className="min-h-screen w-full overflow-y-auto font-sans no-scrollbar">
    <div className="-mt-8 w-full px-0 py-3">
      <div className="flex flex-col lg:flex-row gap-6 items-start">
{/* SIDEBAR */}
<div
  className="mt-5 w-full max-h-[88.5vh] overflow-hidden rounded-2xl bg-white shadow-md lg:sticky lg:-top-6 lg:h-[calc(100vh-2rem)] lg:w-[320px] lg:shrink-0"
>
  <div className="flex h-full flex-col">
  <div className="p-3 bg-white border-b border-slate-100 rounded-t-2xl">
    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200">
      <button
        onClick={() => setTabActiva("nuevas")}
        className={`flex-1 flex items-center justify-center py-3 rounded-lg font-medium text-[12px] uppercase transition-all tracking-wider ${tabActiva === "nuevas" ? "bg-[#474b29] text-white shadow-md" : "text-slate-400 hover:bg-white"}`}
      >
        REVISADAS
      </button>
      <button
        onClick={() => setTabActiva("intervencion")}
        className={`flex-1 flex items-center justify-center py-3 rounded-lg font-medium text-[12px] uppercase transition-all tracking-wider ${tabActiva === "intervencion" ? "bg-[#474b29] text-white shadow-md" : "text-slate-400 hover:bg-white"}`}
      >
        EN INTERVENCIÓN
      </button>
    </div>
  </div>

  {/* Área de listas */}
  <div className="flex-1 overflow-hidden flex flex-col">
{cargando ? (
      <div className="flex-1 overflow-hidden px-3 py-3 space-y-2.5">
        {[0, 1, 2].map((i) => <AlertaCardSkeleton key={i} />)}
      </div>
    ) : (
      <>
        {/* Emergencias */}
        <div className="flex flex-col py-4">
          <h3 className="text-[11px] font-medium text-slate-400 uppercase mb-3 flex items-center gap-1 tracking-wider px-3 shrink-0">
            <span className="w-1.5 h-1.5 bg-[#C90A0A] rounded-full animate-pulse" />
            Alertas de Emergencia
          </h3>
<div className="overflow-y-auto min-h-0 px-3 space-y-3.5 scroll-hover h-[380px]">
  {alertasVisibles.filter(a => a.tipo === "EMERGENCIA").map(a => (
              <AlertaCard
  key={a.id}
  alerta={a}
  seleccionada={seleccionadaId === a.id}
  onClick={() => seleccionarAlerta(a.id, tabActiva)}
  bloqueadaPorOtro={a.bloqueadoPor && a.bloqueadoPor !== user?.id_oficial}
  bloqueadoNombre={a.bloqueadoNombre}
/>
            ))}
            {alertasVisibles.filter(a => a.tipo === "EMERGENCIA").length === 0 && (
              <p className="text-[11px] text-slate-400 font-medium tracking-wider text-center py-3">Sin emergencias</p>
            )}
          </div>
        </div>

        {/* Línea divisoria */}
        <div className="border-t-2 border-slate-100 mx-3 shrink-0" />

        {/* Ciudadanas */}
        <div className="flex flex-col py-4">
          <h3 className="text-[11px] font-medium text-slate-400 uppercase mb-3 flex items-center gap-1 tracking-wider px-3 shrink-0">
            <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            Alertas Ciudadanas
          </h3>
         <div className="overflow-y-auto min-h-0 px-3 space-y-3.5 scroll-hover h-[380px]">
  {alertasVisibles.filter(a => a.tipo === "CIUDADANA").map(a => (
              <AlertaCard
  key={a.id}
  alerta={a}
  seleccionada={seleccionadaId === a.id}
  onClick={() => seleccionarAlerta(a.id, tabActiva)}
  bloqueadaPorOtro={a.bloqueadoPor && a.bloqueadoPor !== user?.id_oficial}
  bloqueadoNombre={a.bloqueadoNombre}
/>
            ))}
            {alertasVisibles.filter(a => a.tipo === "CIUDADANA").length === 0 && (
              <p className="text-[11px] text-slate-400 font-medium text-center py-3 tracking-wider">Sin alertas ciudadanas</p>
            )}
          </div>
        </div>
      </>
    )}
  </div>
  </div>
</div>

        {/* PANEL CENTRAL */}
<div
  ref={panelCentralRef}
  className="mt-5 flex-1 min-h-0 flex flex-col gap-4 lg:px-1 lg:pb-2 lg:sticky lg:-top-6 lg:h-[calc(100vh-7.2rem)]"
>
<div className="w-full h-[265px] shrink-0 overflow-hidden rounded-2xl bg-white shadow-md sm:h-[330px] lg:h-[390px]">
            {!isLoaded ? (
              <div className="flex items-center justify-center h-full gap-2">
                <FaSpinner className="animate-spin text-[#474b29] text-2xl" />
                <span className="text-sm font-medium text-slate-600">Cargando mapa...</span>
              </div>
            ) : (
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={defaultCenter}
                zoom={defaultZoom}
                options={mapOptions}
                onLoad={(m) => setMap(m)}
              >
                {[...alertasNuevas, ...alertasIntervencion].map(alerta => (
                  <Marker
                    key={alerta.id}
                    position={{ lat: alerta.lat, lng: alerta.lng }}
                    icon={makeCircleIcon(
                      alerta.tipo === "EMERGENCIA" ? COLOR_EMERGENCIA : COLOR_CIUDADANA,
                      8
                    )}
                    title={alerta.nombre}
                    onClick={() => seleccionarAlerta(alerta.id, tabActiva)}
                  />
                ))}

                {patrulleros.map(p => {
                  const coords = parsearUbicacion(p.ubicacion_actual);
                  if (!coords) return null;

                  let color, titulo;
                  if (!p.activo) {
                    color  = COLOR_INACTIVO;
                    titulo = `${p.nombre_oficial} — ${p.placa || "N/A"} (FUERA DE SERVICIO)`;
                  } else if (p.id_estado === ESTADO_DISPONIBLE) {
                    color  = COLOR_DISPONIBLE;
                    titulo = `${p.nombre_oficial} — ${p.placa || "N/A"} (DISPONIBLE)`;
                  } else if (p.id_estado === ESTADO_NOTIFICADO) {
                    color  = COLOR_OCUPADO;
                    titulo = `${p.nombre_oficial} — ${p.placa || "N/A"} (NOTIFICADO)`;
                  } else if (p.id_estado === ESTADO_EN_CAMINO) {
                    color  = COLOR_OCUPADO;
                    titulo = `${p.nombre_oficial} — ${p.placa || "N/A"} (EN CAMINO)`;
                  } else if (p.id_estado === ESTADO_EN_LUGAR) {
                    color  = COLOR_OCUPADO;
                    titulo = `${p.nombre_oficial} — ${p.placa || "N/A"} (EN LUGAR)`;
                  } else if (p.id_estado === ESTADO_REVISION) {
                    color  = COLOR_REVISION;
                    titulo = `${p.nombre_oficial} — ${p.placa || "N/A"} (REVISIÓN)`;
                  } else {
                    color  = COLOR_OCUPADO;
                    titulo = `${p.nombre_oficial} — ${p.placa || "N/A"} (${p.estado_disponibilidad})`;
                  }

                  return (
                    <Marker
                      key={p.id_patrullero}
                      position={{ lat: coords.lat, lng: coords.lng }}
                      icon={makeCircleIcon(color, 7)}
                      title={titulo}
                    />
                  );
                })}

                {routeGeometry?.geometry && (
                  <Polyline
                    path={routeGeometry.geometry.coordinates.map(c => ({ lat: c[1], lng: c[0] }))}
                    options={{ strokeColor: COLOR_CIUDADANA, strokeWeight: 5, strokeOpacity: 0.8 }}
                  />
                )}
              </GoogleMap>
            )}
          </div>

          <div className="flex gap-2.5 sm:gap-4 flex-wrap text-[8px] sm:text-[9.5px] font-medium uppercase tracking-widest text-slate-500">
            {[
              { hex: COLOR_EMERGENCIA, label: "Emergencia" },
              { hex: COLOR_CIUDADANA,  label: "Ciudadana" },
              { hex: COLOR_DISPONIBLE, label: "Patrulla Disponible" },
              { hex: COLOR_OCUPADO,    label: "Patrulla Ocupada" },
            
            ].map(({ hex, label }) => (
              <span key={label} className="flex items-center gap-1.5">
                <span style={{ background: hex }} className="w-2 h-2 rounded-full inline-block" />
                {label}
              </span>
            ))}
          </div>

       <div
  className={`flex-1 min-h-0 flex flex-col gap-4 pb-1 transition-[padding] duration-500 ease-in-out ${
    scrollActivo ? "overflow-y-auto pr-3 scroll-hover" : "overflow-hidden pr-0"
  }`}
>
          <DetalleAlerta
  ref={detalleRef}
  alerta={alertaActual}
  visible={detalleVisible && !!alertaActual}
  onExitComplete={recalcularSidebarHeight}
  onClose={() => {
    setDetalleVisible(false);
    if (tabActiva === "nuevas") setAlertaSeleccionada(null);
    else setIntervencionSeleccionada(null);
    detenerPing();
    fitMapToAllAlerts();
  }}
/>


       <GestionPatrullas
  tabActiva={tabActiva}
  patrulleros={patrulleros}
  cargandoPatrulleros={cargando}
  alertaSeleccionada={tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada}
  alertaActual={alertaActual}
  pendingAsignaciones={pendingAsignaciones}
  asignaciones={asignaciones}
  onDespachar={despacharPatrullero}
  onCancelarAsignaciones={() => setPendingAsignaciones({})}
  onFinalizarAsignacion={finalizarAsignacion}
  onCargarRuta={cargarRutaPatrullero}
  onEnviarATabulacion={finalizarEnvioTabulacion}
  idOficialActual={user?.id_oficial}
/>
        </div>
        </div>
      </div>
    </div>
    </div>
  );
};

export default CentroDespacho;
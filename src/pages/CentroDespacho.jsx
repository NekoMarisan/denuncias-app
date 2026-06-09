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
  const { showToast } = useToast(); // ✅ Usar el sistema central de notificaciones

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
      .from("tabulacion")
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

  const cargarAlertas = async () => {
    setCargando(true);
    try {
      const { data: alertas, error: errAlertas } = await supabase
        .from("alerta")
        .select(`
          *,
          usuario_ciudadano ( nombre_completo )
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
        .neq("id_estado_asignacion", ESTADO_DISPONIBLE);

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
          reportePatrullero: null,
          evidencias: [],
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
          oficial ( id_oficial, nombre_completo, cargo, estado ),
          estado_patrullero ( id_estado_patrullero, nombre_estado )
        `);

      if (error) throw error;

      let lista = (data || []).map(p => ({
        ...p,
        estado_disponibilidad: p.estado_patrullero?.nombre_estado || "DESCONOCIDO",
        id_estado: p.id_estado_patrullero,
        activo: p.oficial?.estado === true,
        nombre_oficial: p.oficial?.nombre_completo || "Sin oficial asignado",
      }));

      // Orden: activos ordenados por prioridad de estado, luego inactivos, y dentro de cada grupo por id_patrullero
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

  // Parpadeo de halos de patrullas
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

  useEffect(() => {
    cargarAlertas();
    cargarPatrulleros();

    const canal = supabase
      .channel(`despacho-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "alerta" }, () => cargarAlertas())
      .on("postgres_changes", { event: "*", schema: "public", table: "asignacion_patrulla" }, () => cargarAlertas())
      .on("postgres_changes", { event: "*", schema: "public", table: "patrullero" }, () => cargarPatrulleros())
      .on("postgres_changes", { event: "*", schema: "public", table: "oficial" }, () => cargarPatrulleros())
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "evidencia" }, (payload) => {
        const idAlerta = payload.new?.id_alerta;
        if (idAlerta && idAlerta === intervencionSeleccionada) {
          setAlertasIntervencion(prev => prev.map(a =>
            a.id === idAlerta ? { ...a, evidencias: [...(a.evidencias || []), payload.new] } : a
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

    if (selActual === alertaId) {
      if (esNuevas) setAlertaSeleccionada(null);
      else setIntervencionSeleccionada(null);
      setDetalleVisible(false);
      detenerPing();
      fitMapToAllAlerts();
      return;
    }

    if (esNuevas) setAlertaSeleccionada(alertaId);
    else setIntervencionSeleccionada(alertaId);

    setDetalleVisible(false);
    setTimeout(() => {
      setDetalleVisible(true);
      setTimeout(() => detalleRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
    }, 80);

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
        .map(id => patrulleros.find(p => p.id_patrullero === Number(id))?.placa || `PAT-${id}`)
        .join(", ");
      showToast(`📢 NOTIFICACIÓN ENVIADA A: ${nombres}`, "success");
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

    const { error } = await supabase
      .from("alerta")
      .update({ id_estado_actual: 3 })
      .eq("id_alerta", idAlerta);

    if (error) {
      showToast("Error al enviar a tabulación", "error");
      return;
    }

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

    showToast("✅ Caso enviado a tabulación", "success");
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

  useEffect(() => {
    if (!intervencionSeleccionada || tabActiva !== "intervencion") return;
    cargarReporte(intervencionSeleccionada).then(({ reporte, evidencias }) => {
      setAlertasIntervencion(prev => prev.map(a =>
        a.id === intervencionSeleccionada
          ? { ...a, reportePatrullero: reporte?.descripcion_reporte || null, evidencias }
          : a
      ));
    });
  }, [intervencionSeleccionada, tabActiva]);

  useEffect(() => { setPendingAsignaciones({}); }, [alertaSeleccionada]);
  useEffect(() => { setRouteGeometry(null); }, [alertaSeleccionada, tabActiva]);
  useEffect(() => {
    setDetalleVisible(false);
    if (tabActiva === "nuevas") setIntervencionSeleccionada(null);
    else setAlertaSeleccionada(null);
  }, [tabActiva]);

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: [],
  });

  if (loadError) return <div className="p-4 text-red-600">Error cargando Google Maps</div>;

  const alertasVisibles = tabActiva === "nuevas" ? alertasNuevas : alertasIntervencion;
  const alertaActual    = tabActiva === "nuevas"
    ? alertasNuevas.find(a => a.id === alertaSeleccionada)
    : alertasIntervencion.find(a => a.id === intervencionSeleccionada);
  const seleccionadaId  = tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada;

  return (
    <div className="-mt-2 w-full px-1 min-h-screen py-3 font-sans flex gap-6 items-stretch">
      {/* SIDEBAR - altura fija con scroll interno */}
      <div className="w-[320px] shrink-0 flex flex-col bg-white rounded-2xl shadow-md overflow-hidden h-[1170px]">
        <div className="p-3 bg-white border-b border-slate-100">
          <div className="mt-1 flex bg-slate-50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setTabActiva("nuevas")}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-lg font-bold text-[11px] uppercase transition-all tracking-wider ${tabActiva === "nuevas" ? "bg-[#113e27] text-white shadow-md" : "text-slate-400 hover:bg-white"}`}
            >
              ALERTAS VALIDADAS
            </button>
            <button
              onClick={() => setTabActiva("intervencion")}
              className={`flex-1 flex items-center justify-center py-3 rounded-lg font-bold text-[11px] uppercase transition-all tracking-wider ${tabActiva === "intervencion" ? "bg-[#113e27] text-white shadow-md" : "text-slate-400 hover:bg-white"}`}
            >
              EN INTERVENCIÓN
            </button>
          </div>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          {cargando ? (
            <div className="flex justify-center items-center flex-1">
              <FaSpinner className="animate-spin text-green-800 text-2xl" />
            </div>
          ) : (
            <>
              {/* Emergencias */}
              <div className="flex-1 flex flex-col min-h-0 py-3">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-1 tracking-wider px-3 shrink-0">
                  <span className="w-1.5 h-1.5 bg-[#C90A0A] rounded-full animate-pulse" />
                  Alertas de Emergencia
                </h3>
                <div className="flex-1 overflow-y-auto px-3 space-y-3">
                  {alertasVisibles.filter(a => a.tipo === "EMERGENCIA").map(a => (
                    <AlertaCard
                      key={a.id}
                      alerta={a}
                      seleccionada={seleccionadaId === a.id}
                      onClick={() => seleccionarAlerta(a.id, tabActiva)}
                    />
                  ))}
                  {alertasVisibles.filter(a => a.tipo === "EMERGENCIA").length === 0 && (
                    <p className="text-[10px] text-slate-400 text-center py-3">Sin emergencias</p>
                  )}
                </div>
              </div>

              {/* Línea divisoria */}
              <div className="border-t-2 border-slate-100 mx-3 my-1 mt-4 shrink-0" />

              {/* Ciudadanas */}
              <div className="flex-1 flex flex-col min-h-0 py-3">
                <h3 className="text-[11px] font-bold text-slate-400 uppercase mb-3 flex items-center gap-1 tracking-wider px-3 shrink-0">
                  <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                  Alertas Ciudadanas
                </h3>
                <div className="flex-1 overflow-y-auto px-3 space-y-3">
                  {alertasVisibles.filter(a => a.tipo === "CIUDADANA").map(a => (
                    <AlertaCard
                      key={a.id}
                      alerta={a}
                      seleccionada={seleccionadaId === a.id}
                      onClick={() => seleccionarAlerta(a.id, tabActiva)}
                    />
                  ))}
                  {alertasVisibles.filter(a => a.tipo === "CIUDADANA").length === 0 && (
                    <p className="text-[10px] text-slate-400 text-center py-3">Sin alertas ciudadanas</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* PANEL CENTRAL */}
      <div className="flex-1 flex flex-col gap-4 pb-6">
        <div className="w-full h-[380px] shrink-0 bg-white rounded-2xl shadow-md overflow-hidden">
          {!isLoaded ? (
            <div className="flex items-center justify-center h-full gap-2">
              <FaSpinner className="animate-spin text-blue-600 text-2xl" />
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

        <div className="flex gap-4 flex-wrap text-[9px] font-bold uppercase tracking-wider text-slate-500">
          {[
            { hex: COLOR_EMERGENCIA, label: "Emergencia" },
            { hex: COLOR_CIUDADANA,  label: "Ciudadana" },
            { hex: COLOR_DISPONIBLE, label: "Patrulla Disponible" },
            { hex: COLOR_OCUPADO,    label: "Patrulla Ocupada" },
            { hex: COLOR_INACTIVO,   label: "Patrulla Inactiva" },
            { hex: COLOR_REVISION,   label: "Patrulla Revisión" },
          ].map(({ hex, label }) => (
            <span key={label} className="flex items-center gap-1.5">
              <span style={{ background: hex }} className="w-2.5 h-2.5 rounded-full inline-block" />
              {label}
            </span>
          ))}
        </div>

        <DetalleAlerta
          ref={detalleRef}
          alerta={alertaActual}
          visible={detalleVisible && !!alertaActual}
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
          alertaSeleccionada={tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada}
          alertaActual={alertaActual}
          pendingAsignaciones={pendingAsignaciones}
          asignaciones={asignaciones}
          onDespachar={despacharPatrullero}
          onCancelarAsignaciones={() => setPendingAsignaciones({})}
          onFinalizarAsignacion={finalizarAsignacion}
          onCargarRuta={cargarRutaPatrullero}
        />
      </div>
    </div>
  );
};

export default CentroDespacho;
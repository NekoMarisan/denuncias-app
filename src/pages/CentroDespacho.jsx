import React, { useState, useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  FaTruck, FaMapMarkerAlt, FaFileAlt, FaExclamationCircle,
  FaBell, FaImage, FaDownload, FaCheckCircle, FaShareSquare,
  FaCircle, FaSpinner
} from "react-icons/fa";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext"; // 👈 Importar el hook


// estados patrullero: 1=DISPONIBLE 2=NOTIFICADO 3=EN_CAMINO 4=EN_LUGAR
const ESTADO_DISPONIBLE  = 1;
const ESTADO_NOTIFICADO  = 2;
const ESTADO_EN_CAMINO   = 3;
const ESTADO_EN_LUGAR    = 4;

const CentroDespacho = () => {
  const { user } = useAuth(); // 👈 Obtener el usuario autenticado

  const [tabActiva, setTabActiva]                             = useState("nuevas");
  const [alertaSeleccionada, setAlertaSeleccionada]           = useState(null);
  const [intervencionSeleccionada, setIntervencionSeleccionada] = useState(null);
  const [toast, setToast]                                     = useState({ message: "", visible: false });
  const [cargando, setCargando]                               = useState(true);
  const [reporteOficial, setReporteOficial]                   = useState("");
  const [derivacionDestino, setDerivacionDestino]             = useState("");

  const [alertasNuevas, setAlertasNuevas]               = useState([]);
  const [alertasIntervencion, setAlertasIntervencion]   = useState([]);
  const [patrulleros, setPatrulleros]                   = useState([]);
  const [asignaciones, setAsignaciones]                 = useState({});
  const [pendingAsignaciones, setPendingAsignaciones]   = useState({});

  const mapContainer       = useRef(null);
  const map                = useRef(null);
  const markersAlertas     = useRef({});
  const markersPatrulleros = useRef({});

  const showToast = (msg) => {
    setToast({ message: msg, visible: true });
    setTimeout(() => setToast({ message: "", visible: false }), 3000);
  };

  const parsearUbicacion = (str) => {
    if (!str) return null;
    const p = str.split(",");
    if (p.length < 2) return null;
    const lat = parseFloat(p[0].trim());
    const lng = parseFloat(p[1].trim());
    return isNaN(lat) || isNaN(lng) ? null : { lat, lng };
  };

  // ── CARGAR ALERTAS ─────────────────────────────────────────────────────────
  const cargarAlertas = async () => {
    setCargando(true);
    try {
      const { data, error } = await supabase
        .from("alerta")
        .select(`*, usuario_ciudadano ( nombre_completo )`)
        .eq("id_estado_actual", 2)
        .order("fecha_hora", { ascending: false });

      if (error) throw error;

      const nuevas      = [];
      const intervencion = [];
      const nuevasAsignaciones = {};

      for (const item of data || []) {
        const { data: asig } = await supabase
          .from("asignacion_patrulla")
          .select("id_asignacion, id_patrullero, id_estado_asignacion")
          .eq("id_alerta", item.id_alerta)
          .neq("id_estado_asignacion", ESTADO_DISPONIBLE)
          .limit(1)
          .maybeSingle();

        const coords = parsearUbicacion(item.ubicacion);

        const alertaObj = {
          id:          item.id_alerta,
          codigo:      item.codigo_alerta || String(item.id_alerta),
          nombre:      item.usuario_ciudadano?.nombre_completo || `Usuario #${item.id_usuario}`,
          categoria:   item.categoria    || "Sin categoría",
          prioridad:   item.prioridad    || "Media",
          relato:      item.descripcion  || "",
          ubicacion:   item.ubicacion    || "",
          lat:         coords?.lat       || -17.3912,
          lng:         coords?.lng       || -66.142,
          tipo:        item.categoria === "Panico" ? "EMERGENCIA" : "CIUDADANA",
          enIntervencion:         !!asig,
          id_asignacion:          asig?.id_asignacion          || null,
          id_patrullero_asignado: asig?.id_patrullero          || null,
          reportePatrullero:      null,
          evidencias:             []
        };

        if (asig) {
          intervencion.push(alertaObj);
          nuevasAsignaciones[asig.id_patrullero] = item.id_alerta;
        } else {
          nuevas.push(alertaObj);
        }
      }

      setAlertasNuevas(nuevas);
      setAlertasIntervencion(intervencion);
      setAsignaciones(nuevasAsignaciones);
    } catch (err) {
      console.error("Error cargar alertas:", err);
    } finally {
      setCargando(false);
    }
  };

  // ── CARGAR PATRULLEROS ─────────────────────────────────────────────────────
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
          oficial!inner (
            id_oficial,
            nombre_completo,
            cargo,
            estado
          ),
          estado_patrullero (
            id_estado_patrullero,
            nombre_estado
          )
        `)
        .eq("oficial.estado", true);

      if (error) throw error;

      const lista = (data || []).map(p => ({
        ...p,
        estado_disponibilidad: p.estado_patrullero?.nombre_estado || "DESCONOCIDO",
        id_estado:             p.id_estado_patrullero
      }));

      setPatrulleros(lista);
    } catch (err) {
      console.error("Error cargar patrulleros:", err);
      setPatrulleros([]);
    }
  };

  // ── CARGAR REPORTE ─────────────────────────────────────────────────────────
  const cargarReporte = async (idAlerta) => {
    const { data } = await supabase
      .from("reporte_alerta")
      .select(`*, evidencia ( archivo, tipo_evidencia )`)
      .eq("id_alerta", idAlerta)
      .order("fecha_reporte", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  };

  // ── INIT ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    cargarAlertas();
    cargarPatrulleros();

    const canal = supabase
      .channel(`despacho-${Date.now()}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "alerta" }, () => cargarAlertas())
      .on("postgres_changes", { event: "*", schema: "public", table: "asignacion_patrulla" }, () => cargarAlertas())
      .on("postgres_changes", { event: "*", schema: "public", table: "patrullero" }, () => cargarPatrulleros())
      .on("postgres_changes", { event: "*", schema: "public", table: "oficial" }, () => cargarPatrulleros())
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }, []);

  // ── MAPA INIT ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (map.current || !mapContainer.current) return;
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: "raster",
            tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
            tileSize: 256,
            attribution: "&copy; OpenStreetMap contributors"
          }
        },
        layers: [{ id: "osm-tiles", type: "raster", source: "osm", minzoom: 0, maxzoom: 19 }]
      },
      center: [-66.142, -17.3912],
      zoom: 13
    });
  }, []);

  // MARCADORES ALERTAS
  useEffect(() => {
    if (!map.current) return;
    Object.values(markersAlertas.current).forEach(m => m.remove());
    markersAlertas.current = {};

    const todas = [...alertasNuevas, ...alertasIntervencion];
    todas.forEach(alerta => {
      const el = document.createElement("div");
      el.style.cssText = `
        width:18px; height:18px; border-radius:50%;
        background:${alerta.tipo === "EMERGENCIA" ? "#dc2626" : "#2563eb"};
        border:2px solid white; box-shadow:0 0 6px rgba(0,0,0,0.5);
        cursor:pointer;
      `;
      el.title = alerta.nombre;
      el.addEventListener("click", () => {
        if (tabActiva === "nuevas")
          setAlertaSeleccionada(prev => prev === alerta.id ? null : alerta.id);
        else
          setIntervencionSeleccionada(prev => prev === alerta.id ? null : alerta.id);
      });
      markersAlertas.current[alerta.id] =
        new maplibregl.Marker(el).setLngLat([alerta.lng, alerta.lat]).addTo(map.current);
    });
  }, [alertasNuevas, alertasIntervencion, tabActiva]);

  // MARCADORES PATRULLEROS
  useEffect(() => {
    if (!map.current) return;
    Object.values(markersPatrulleros.current).forEach(m => m.remove());
    markersPatrulleros.current = {};

    patrulleros.forEach(p => {
      const coords = parsearUbicacion(p.ubicacion_actual);
      if (!coords) return;
      const color =
        p.id_estado === ESTADO_DISPONIBLE ? "#10b981" :
        p.id_estado === ESTADO_NOTIFICADO  ? "#3b82f6" :
        p.id_estado === ESTADO_EN_CAMINO   ? "#f59e0b" :
        p.id_estado === ESTADO_EN_LUGAR    ? "#8b5cf6" : "#6b7280";

      const el = document.createElement("div");
      el.style.cssText = `
        width:14px; height:14px; border-radius:50%;
        background:${color}; border:2px solid white;
        box-shadow:0 0 5px rgba(0,0,0,0.4);
      `;
      el.title = p.placa || `PAT-${p.id_patrullero}`;
      markersPatrulleros.current[p.id_patrullero] =
        new maplibregl.Marker(el).setLngLat([coords.lng, coords.lat]).addTo(map.current);
    });
  }, [patrulleros]);

  // FLY TO
  useEffect(() => {
    const id = tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada;
    if (!id || !map.current) return;
    const alerta = [...alertasNuevas, ...alertasIntervencion].find(a => a.id === id);
    if (alerta) map.current.flyTo({ center: [alerta.lng, alerta.lat], zoom: 16, speed: 1.2 });
  }, [alertaSeleccionada, intervencionSeleccionada]);

  // ── DESPACHAR ──────────────────────────────────────────────────────────────
  const despacharPatrullero = (idPatrullero) => {
    if (!alertaSeleccionada) return;
    const pat = patrulleros.find(p => p.id_patrullero === idPatrullero);
    if (!pat || pat.id_estado !== ESTADO_DISPONIBLE) return;

    if (pendingAsignaciones[idPatrullero] === alertaSeleccionada) {
      const n = { ...pendingAsignaciones };
      delete n[idPatrullero];
      setPendingAsignaciones(n);
    } else {
      setPendingAsignaciones(prev => ({ ...prev, [idPatrullero]: alertaSeleccionada }));
    }
  };

  // ── FINALIZAR ASIGNACION (con ID del oficial autenticado) ──────────────────
  const finalizarAsignacion = async () => {
    if (!alertaSeleccionada) return;
    const pendientes = Object.keys(pendingAsignaciones)
      .filter(k => pendingAsignaciones[k] === alertaSeleccionada);
    if (pendientes.length === 0) return;

    // ✅ Obtener el ID del oficial logueado desde el contexto
    const idOficialAsignador = user?.id_oficial;

    if (!idOficialAsignador) {
      showToast("Error: No se pudo identificar al oficial asignador");
      console.error("No hay usuario autenticado o falta id_oficial");
      return;
    }

    let errores = false;

    for (const idPat of pendientes) {
      // 1. Insertar en asignacion_patrulla
      const { error: errInsert } = await supabase
        .from("asignacion_patrulla")
        .insert([{
          id_alerta:            alertaSeleccionada,
          id_patrullero:        Number(idPat),
          id_oficial_asignador: idOficialAsignador,
          fecha_asignacion:     new Date().toISOString(),
          id_estado_asignacion: ESTADO_NOTIFICADO
        }]);

      if (errInsert) {
        console.error("❌ Error insertando asignacion_patrulla:", errInsert);
        showToast(`Error asignando patrullero ${idPat}: ${errInsert.message}`);
        errores = true;
        continue;
      }

      // 2. Actualizar estado del patrullero a NOTIFICADO
      const { error: errUpdate } = await supabase
        .from("patrullero")
        .update({ id_estado_patrullero: ESTADO_NOTIFICADO })
        .eq("id_patrullero", Number(idPat));

      if (errUpdate) {
        console.error("❌ Error actualizando patrullero:", errUpdate);
        showToast(`Error actualizando estado del patrullero ${idPat}: ${errUpdate.message}`);
        errores = true;
      } else {
        console.log(`✅ Patrullero ${idPat} actualizado a NOTIFICADO`);
      }
    }

    if (!errores) {
      const nombres = pendientes
        .map(id => patrulleros.find(p => p.id_patrullero === Number(id))?.placa || `PAT-${id}`)
        .join(", ");
      showToast(`📢 NOTIFICACIÓN ENVIADA A: ${nombres}`);
    } else {
      showToast("⚠️ Asignación completada con errores. Revisa consola.");
    }

    setPendingAsignaciones({});
    setAlertaSeleccionada(null);
    await cargarAlertas();
    await cargarPatrulleros();
  };

  // ── FINALIZAR CASO ─────────────────────────────────────────────────────────
  const finalizarCaso = async (tipoCierre) => {
    const idAlerta = tabActiva === "nuevas" ? alertaSeleccionada : intervencionSeleccionada;
    if (!idAlerta) return;

    const estadoCierre = tipoCierre === "derivar"
      ? `DERIVADO A ${derivacionDestino}`
      : "ATENDIDO";

    await supabase
      .from("alerta")
      .update({ id_estado_actual: 3 })
      .eq("id_alerta", idAlerta);

    const { data: asigs } = await supabase
      .from("asignacion_patrulla")
      .select("id_patrullero")
      .eq("id_alerta", idAlerta)
      .neq("id_estado_asignacion", ESTADO_DISPONIBLE);

    if (asigs) {
      for (const asig of asigs) {
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
    }

    showToast(`Caso finalizado: ${estadoCierre}`);
    if (tabActiva === "nuevas") setAlertaSeleccionada(null);
    else setIntervencionSeleccionada(null);
    setReporteOficial("");
    setDerivacionDestino("");
    cargarAlertas();
    cargarPatrulleros();
  };

  // ── CARGAR REPORTE AL SELECCIONAR ─────────────────────────────────────────
  useEffect(() => {
    if (!intervencionSeleccionada || tabActiva !== "intervencion") return;
    cargarReporte(intervencionSeleccionada).then(reporte => {
      if (reporte) {
        setReporteOficial(reporte.descripcion_reporte || "");
        setAlertasIntervencion(prev => prev.map(a =>
          a.id === intervencionSeleccionada
            ? { ...a, reportePatrullero: reporte.descripcion_reporte, evidencias: reporte.evidencia || [] }
            : a
        ));
      } else {
        setReporteOficial("");
      }
    });
  }, [intervencionSeleccionada, tabActiva]);

  useEffect(() => { setPendingAsignaciones({}); }, [alertaSeleccionada]);
  useEffect(() => {
    if (tabActiva === "nuevas") setIntervencionSeleccionada(null);
    else setAlertaSeleccionada(null);
  }, [tabActiva]);

  // ── HELPERS ────────────────────────────────────────────────────────────────
  const alertasVisibles = tabActiva === "nuevas" ? alertasNuevas : alertasIntervencion;
  const alertaActual    =
    tabActiva === "nuevas"
      ? alertasNuevas.find(a => a.id === alertaSeleccionada)
      : alertasIntervencion.find(a => a.id === intervencionSeleccionada);

  const unidadesAsignadas = alertaActual
    ? patrulleros.filter(p =>
        Object.entries(asignaciones).some(
          ([idPat, idAl]) => Number(idPat) === p.id_patrullero && idAl === alertaActual.id
        )
      )
    : [];

  // ── COMPONENTES INTERNOS ───────────────────────────────────────────────────
  const DetalleAlerta = ({ alerta, onClose }) => {
    if (!alerta) return null;
    return (
      <div className="bg-white p-4 rounded-2xl shadow-sm">
        <div className="flex justify-between items-start mb-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-extrabold text-[#1e293b] uppercase">
                {alerta.tipo === "EMERGENCIA" ? "Emergencia" : "Alerta Ciudadana"} — {alerta.codigo}
              </h2>
              <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold text-white ${alerta.enIntervencion ? "bg-blue-600" : "bg-yellow-400"}`}>
                {alerta.enIntervencion ? "INTERVENCIÓN" : "VERIFICACIÓN"}
              </div>
              <div className={`px-2 py-0.5 rounded-md text-[9px] font-bold text-white flex items-center gap-1 ${alerta.prioridad === "ALTA" ? "bg-red-600" : alerta.prioridad === "MEDIA" ? "bg-blue-600" : "bg-yellow-500"}`}>
                <FaExclamationCircle size={8} /> {alerta.prioridad}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 font-bold mt-1">{alerta.nombre}</p>
          </div>
          <button onClick={onClose} className="text-slate-300 hover:text-slate-400 text-[10px] font-bold uppercase">CERRAR</button>
        </div>
        <div className="grid grid-cols-[1fr_2fr] gap-3">
          <div className="space-y-3">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Categoría</p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                <FaFileAlt className="text-blue-500 text-xs" />
                <span className="text-[11px] font-bold text-slate-600 uppercase">{alerta.categoria}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Coordenadas</p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-500 text-xs" />
                <span className="text-[11px] font-bold text-slate-600">{alerta.lat?.toFixed(4)}, {alerta.lng?.toFixed(4)}</span>
              </div>
            </div>
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Descripción</p>
            <div className="h-28 w-full p-3 rounded-xl bg-slate-50 border border-slate-100">
              <p className="text-[11px] text-slate-500 leading-relaxed">{alerta.relato}</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const AlertaCard = ({ alerta, seleccionada, onClick }) => {
    const partes = alerta.nombre.split(" ");
    return (
      <div
        onClick={onClick}
        className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
          seleccionada
            ? alerta.tipo === "EMERGENCIA" ? "border-red-300 bg-red-100/20 shadow" : "border-blue-300 bg-blue-100/20 shadow"
            : "border-slate-200 bg-white shadow hover:shadow-md"
        }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-black text-sm shrink-0">
            {alerta.nombre.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[12px] font-bold text-[#1e293b] block leading-tight">{partes.slice(0,2).join(" ")}</span>
            <span className="text-[12px] font-bold text-[#1e293b] block leading-tight">{partes.slice(2).join(" ")}</span>
          </div>
          <span className={`-mt-4 px-1.5 py-0.5 rounded-md text-[8px] font-bold uppercase whitespace-nowrap text-white ${
            alerta.tipo === "EMERGENCIA" ? "bg-red-600" : alerta.enIntervencion ? "bg-blue-600" : "bg-yellow-400"
          }`}>
            {alerta.tipo === "EMERGENCIA" ? "EMERGENCIA" : alerta.enIntervencion ? "INTERVENCIÓN" : "VERIFICACIÓN"}
          </span>
        </div>
        <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 bg-white/50 p-1.5 rounded-lg border border-slate-100">
          <FaCircle className="text-[6px]" />
          <span>{alerta.categoria}</span>
        </div>
      </div>
    );
  };

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="-mt-2 w-full px-1 min-h-screen py-3 font-sans flex gap-6 items-stretch">
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg shadow-xl text-xs font-bold">
          {toast.message}
        </div>
      )}

      {/* SIDEBAR (igual) */}
      <div className="w-[320px] shrink-0 flex flex-col bg-white rounded-2xl shadow-md overflow-hidden">
        <div className="p-3 bg-white border-b border-slate-100">
          <div className="mt-1 flex bg-slate-50/50 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setTabActiva("nuevas")}
              className={`flex-1 flex items-center justify-center py-2.5 rounded-lg font-bold text-[11px] uppercase transition-all tracking-wider ${tabActiva === "nuevas" ? "bg-green-900 text-white shadow-sm" : "text-slate-400 hover:bg-white"}`}
            >
              NUEVAS ALERTAS
            </button>
            <button
              onClick={() => setTabActiva("intervencion")}
              className={`flex-1 flex items-center justify-center py-3 rounded-lg font-bold text-[11px] uppercase transition-all tracking-wider ${tabActiva === "intervencion" ? "bg-[#0a43c0] text-white shadow-sm" : "text-slate-400 hover:bg-white"}`}
            >
              INTERVENCIÓN
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-5">
          {cargando ? (
            <div className="flex justify-center py-10">
              <FaSpinner className="animate-spin text-green-800 text-2xl" />
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase mb-3 flex items-center gap-1 tracking-wider">
                  <span className="w-1.5 h-1.5 bg-red-700 rounded-full animate-pulse"></span> Alertas de Emergencia
                </h3>
                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3">
                  {alertasVisibles.filter(a => a.tipo === "EMERGENCIA").map(a => (
                    <AlertaCard
                      key={a.id} alerta={a}
                      seleccionada={tabActiva === "nuevas" ? alertaSeleccionada === a.id : intervencionSeleccionada === a.id}
                      onClick={() => {
                        if (tabActiva === "nuevas") setAlertaSeleccionada(prev => prev === a.id ? null : a.id);
                        else setIntervencionSeleccionada(prev => prev === a.id ? null : a.id);
                      }}
                    />
                  ))}
                  {alertasVisibles.filter(a => a.tipo === "EMERGENCIA").length === 0 && (
                    <p className="text-[10px] text-slate-400 text-center py-3">Sin emergencias</p>
                  )}
                </div>
              </div>

              <div className="border-t border-slate-100"></div>

              <div>
                <h3 className="text-[10px] font-extrabold text-slate-400 uppercase mb-3 flex items-center gap-1 tracking-wider">
                  <span className="w-1.5 h-1.5 bg-green-900 rounded-full animate-pulse"></span> Alertas Ciudadanas
                </h3>
                <div className="max-h-[300px] overflow-y-auto pr-1 space-y-3">
                  {alertasVisibles.filter(a => a.tipo === "CIUDADANA").map(a => (
                    <AlertaCard
                      key={a.id} alerta={a}
                      seleccionada={tabActiva === "nuevas" ? alertaSeleccionada === a.id : intervencionSeleccionada === a.id}
                      onClick={() => {
                        if (tabActiva === "nuevas") setAlertaSeleccionada(prev => prev === a.id ? null : a.id);
                        else setIntervencionSeleccionada(prev => prev === a.id ? null : a.id);
                      }}
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
        {/* MAPA */}
        <div className="w-full h-[380px] shrink-0 bg-white rounded-2xl shadow-md overflow-hidden">
          <div ref={mapContainer} className="w-full h-full" />
        </div>

        {/* LEYENDA */}
        <div className="flex gap-3 flex-wrap text-[9px] font-bold uppercase tracking-wider">
          {[
            { color: "bg-red-600",    label: "Emergencia" },
            { color: "bg-blue-600",   label: "Ciudadana" },
            { color: "bg-emerald-500",label: "Disponible" },
            { color: "bg-blue-400",   label: "Notificado" },
            { color: "bg-yellow-500", label: "En camino" },
            { color: "bg-purple-500", label: "En lugar" },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-1">
              <span className={`w-2.5 h-2.5 rounded-full ${color} inline-block`}></span> {label}
            </span>
          ))}
        </div>

        {/* DETALLE ALERTA */}
        {alertaActual && (
          <div className="drop-shadow-md">
            <DetalleAlerta
              alerta={alertaActual}
              onClose={() => {
                if (tabActiva === "nuevas") setAlertaSeleccionada(null);
                else setIntervencionSeleccionada(null);
              }}
            />
          </div>
        )}

        {/* GESTIÓN PATRULLAS (sin cambios, solo la lógica de finalizarAsignacion ya está actualizada) */}
        <div className="bg-white p-5 rounded-2xl shadow-md border border-slate-100">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[15px] font-black uppercase flex items-center gap-2 tracking-tight text-[#1e293b]">
              <span className="w-7 h-7 flex items-center justify-center bg-green-50 rounded-lg">
                <FaTruck className="text-green-700" size={16} />
              </span>
              {tabActiva === "nuevas" ? "Gestión de Patrullas" : "Seguimiento de Patrullas"}
            </h3>
            {tabActiva === "nuevas" && alertaSeleccionada && (
              <div className="bg-gray-50 text-gray-500 px-3 py-1.5 rounded-lg text-[9px] font-extrabold uppercase tracking-wider border border-gray-200">
                {Object.keys(pendingAsignaciones).length} seleccionada(s)
              </div>
            )}
          </div>

          {tabActiva === "nuevas" ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                {patrulleros.map(p => {
                  const pendiente = alertaSeleccionada && pendingAsignaciones[p.id_patrullero] === alertaSeleccionada;
                  const asignada  = asignaciones[p.id_patrullero] === alertaSeleccionada;
                  const resaltar  = pendiente || asignada;
                  const disponible = p.id_estado === ESTADO_DISPONIBLE;

                  let texto = "NO DISPONIBLE";
                  let clase  = "bg-slate-400 text-white cursor-not-allowed";
                  let deshab = true;

                  if (disponible) {
                    if (pendiente) {
                      texto = "SELECCIONADA"; clase = "bg-slate-400 text-white cursor-not-allowed";
                    } else {
                      texto = "DESPACHAR";
                      clase  = alertaSeleccionada ? "bg-green-700 hover:bg-green-800 text-white" : "bg-slate-300 text-white cursor-not-allowed";
                      deshab = !alertaSeleccionada;
                    }
                  } else if (p.id_estado === ESTADO_NOTIFICADO) {
                    texto = "NOTIFICADO"; clase = "bg-blue-500 text-white cursor-not-allowed";
                  } else if (p.id_estado === ESTADO_EN_CAMINO) {
                    texto = "EN CAMINO"; clase = "bg-orange-600 text-white cursor-not-allowed";
                  } else if (p.id_estado === ESTADO_EN_LUGAR) {
                    texto = "EN LUGAR"; clase = "bg-purple-600 text-white cursor-not-allowed";
                  }

                  const nombre = p.oficial?.nombre_completo?.split(" ").slice(0,2).join(" ") || `PAT-${p.id_patrullero}`;

                  return (
                    <div
                      key={p.id_patrullero}
                      className={`p-3 rounded-xl border-2 transition-all ${resaltar ? "border-blue-500 bg-blue-50/30 shadow-md" : "border-slate-100 bg-slate-50/50"}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[12px] font-bold text-[#1e293b]">{nombre}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold">Placa {p.placa || "—"}</p>
                        </div>
                        <div className={`w-2 h-2 rounded-full ${
                          p.id_estado === ESTADO_DISPONIBLE ? "bg-green-500" :
                          p.id_estado === ESTADO_NOTIFICADO  ? "bg-blue-500 animate-pulse" :
                          p.id_estado === ESTADO_EN_CAMINO   ? "bg-yellow-500 animate-pulse" :
                          p.id_estado === ESTADO_EN_LUGAR    ? "bg-purple-500 animate-pulse" : "bg-gray-400"
                        }`} />
                      </div>
                      <button
                        disabled={deshab}
                        onClick={() => despacharPatrullero(p.id_patrullero)}
                        className={`w-full py-2 text-[9px] font-black rounded-lg uppercase transition-all shadow active:scale-95 ${clase}`}
                      >
                        {texto}
                      </button>
                    </div>
                  );
                })}
                {patrulleros.length === 0 && (
                  <p className="col-span-3 text-center text-slate-400 text-xs py-4">
                    Sin patrulleros activos (oficiales conectados)
                  </p>
                )}
              </div>

              {alertaSeleccionada && Object.keys(pendingAsignaciones).length > 0 && (
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => setPendingAsignaciones({})}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-500 px-4 py-2 rounded-lg font-extrabold text-[11px] uppercase"
                  >
                    CANCELAR
                  </button>
                  <button
                    onClick={finalizarAsignacion}
                    className="bg-green-800 hover:bg-green-900 text-white px-4 py-2 rounded-lg font-black text-[11px] uppercase flex items-center gap-1 shadow"
                  >
                    <FaCheckCircle size={12} /> FINALIZAR ASIGNACIÓN
                  </button>
                </div>
              )}
            </>
          ) : (
            // Sección de intervención (sin cambios)
            <>
              {alertasIntervencion.length === 0 ? (
                <div className="bg-slate-50 p-5 rounded-xl text-center border border-slate-200">
                  <FaBell className="text-slate-400 text-3xl mx-auto mb-2" />
                  <p className="text-sm font-black text-slate-600">No hay alertas en intervención</p>
                </div>
              ) : !intervencionSeleccionada ? (
                <div className="bg-slate-50 p-5 rounded-xl text-center border border-slate-200">
                  <FaBell className="text-slate-400 text-2xl mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-500">Seleccione una alerta de la lista</p>
                </div>
              ) : (
                <div className="grid grid-cols-12 gap-5">
                  <div className="col-span-12 lg:col-span-8 space-y-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1">
                        <FaTruck className="text-blue-600 text-xs" /> PATRULLAS ASIGNADAS
                      </p>
                      {unidadesAsignadas.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {unidadesAsignadas.map(p => (
                            <span key={p.id_patrullero} className="bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-slate-700 border border-slate-200 shadow-sm">
                              {p.placa || `PAT-${p.id_patrullero}`} ({p.estado_disponibilidad})
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400 italic">Sin patrullas asignadas</p>
                      )}
                    </div>

                    {alertaActual?.reportePatrullero ? (
                      <>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase flex items-center gap-1">
                            <FaFileAlt className="text-blue-600 text-xs" /> Reporte del patrullero
                          </p>
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 min-h-[120px]">
                            <textarea
                              className="w-full bg-transparent text-xs text-slate-600 font-bold leading-relaxed italic border-none focus:ring-0 resize-none"
                              value={reporteOficial}
                              onChange={e => setReporteOficial(e.target.value)}
                            />
                          </div>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => finalizarCaso("atender")}
                            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1 shadow"
                          >
                            <FaCheckCircle size={11} /> Marcar Atendido
                          </button>
                          <div className="flex-1 flex gap-1">
                            <select
                              className="bg-slate-100 border-none rounded-xl px-2 text-[9px] font-black uppercase text-slate-600"
                              value={derivacionDestino}
                              onChange={e => setDerivacionDestino(e.target.value)}
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
                              className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase flex items-center justify-center gap-1 shadow ${derivacionDestino ? "bg-blue-600 text-white" : "bg-slate-200 text-slate-400 cursor-not-allowed"}`}
                            >
                              <FaShareSquare size={11} /> Derivar
                            </button>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="bg-slate-50 p-5 rounded-xl text-center border border-slate-200">
                        <FaBell className="text-slate-400 text-2xl mx-auto mb-2 animate-pulse" />
                        <p className="text-xs font-bold text-slate-700">⏳ Esperando reporte del patrullero...</p>
                        <p className="text-[9px] text-slate-400 mt-1">Se actualizará automáticamente cuando llegue</p>
                      </div>
                    )}
                  </div>
                  <div className="col-span-12 lg:col-span-4 space-y-4">
                    <div>
                      <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Clasificación</p>
                      <div className="bg-white border border-slate-100 p-3 rounded-xl text-center">
                        <span className="text-xs font-black text-slate-700 uppercase">{alertaActual?.categoria || "—"}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase">Evidencia adjunta</p>
                      {alertaActual?.evidencias?.length > 0 ? (
                        alertaActual.evidencias.map((ev, idx) => (
                          <div key={idx} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-2">
                              <div className="bg-blue-50 p-1.5 rounded-lg text-blue-600"><FaImage size={11} /></div>
                              <p className="text-[9px] font-black text-slate-700 truncate max-w-[100px]">
                                {ev.archivo?.split("/").pop() || "evidencia"}
                              </p>
                            </div>
                            {ev.archivo && (
                              <a href={ev.archivo} target="_blank" rel="noreferrer" className="text-slate-300 hover:text-blue-600">
                                <FaDownload size={11} />
                              </a>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="bg-white p-3 rounded-xl border border-slate-100 text-center">
                          <p className="text-[10px] text-slate-500">Sin evidencias</p>
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
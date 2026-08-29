import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaCarSide,
  FaUserShield,
  FaExclamationCircle,
  FaChevronRight,
  FaSyncAlt,
  FaUsers,
  FaShieldAlt,
  FaClipboardList,
} from "react-icons/fa";
import { motion } from "framer-motion";
import {
  ComposedChart,
  Bar,
  Line,
  ReferenceLine,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from "recharts";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { StatCardSkeleton, PanelSkeleton, SkeletonBlock, SkeletonLine } from "../components/ui/Skeleton";

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

const normalizarRol = (rol) => {
  const r = (rol || "").trim().toUpperCase();
  if (r === "ADMIN") return "ADMINISTRADOR";
  return r;
};

// Variación % entre el primer y último punto de una serie (segura ante ceros)
const calcVariacion = (arr) => {
  if (!arr || arr.length < 2) return 0;
  const first = arr[0] || 0;
  const last = arr[arr.length - 1] || 0;
  if (first === 0) return last > 0 ? 100 : 0;
  return Math.round(((last - first) / first) * 100);
};

function Dashboard() {
  const navigate = useNavigate();
  const { isOperador, user } = useAuth();
  const esAdmin = user?.rol === "admin";
  const esDespachador = user?.rol === "despachador";
  const esTabulador = user?.rol === "tabulador";

  const [stats, setStats] = useState({
    emergencias: 0,
    ciudadanas: 0,
    patrullasActivas: 0,
    oficialesConectados: 0,
    totalPatrullas: 0,
    totalOficiales: 0,
  });

  const [alertasPanico, setAlertasPanico] = useState([]);
  const [alertasCiudadanas, setAlertasCiudadanas] = useState([]);
  const [dataGrafica, setDataGrafica] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const primeraCargaDatos = useRef(true);
  const primeraCargaAdmin = useRef(true);
  // --- Solo para admin ---
  const [resumenUsuarios, setResumenUsuarios] = useState([]);
  const [cargandoAdmin, setCargandoAdmin] = useState(true);

  // --- Solo para despachador ---
  const [datosDespacho, setDatosDespacho] = useState({
    sinAsignar: 0,
    enIntervencion: 0,
    patrullasPorEstado: {
      disponible: 0,
      notificado: 0,
      enCamino: 0,
      enLugar: 0,
      revision: 0,
    },
  });
  const [cargandoDespacho, setCargandoDespacho] = useState(true);
  const primeraCargaDespacho = useRef(true);

  // --- Solo para tabulador ---
  const [pendientesTabular, setPendientesTabular] = useState(0);
  const [totalTabulados, setTotalTabulados] = useState(0);
  const [totalDesestimados, setTotalDesestimados] = useState(0);
  const [cargandoTabulador, setCargandoTabulador] = useState(true);
  const primeraCargaTabulador = useRef(true);

  const dividirNombre = (nombreCompleto) => {
    if (!nombreCompleto) return { nombres: "Usuario", apellidos: "" };
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length === 1) return { nombres: partes[0], apellidos: "" };
    if (partes.length === 2)
      return { nombres: partes[0], apellidos: partes[1] };
    return {
      nombres: partes.slice(0, -2).join(" "),
      apellidos: partes.slice(-2).join(" "),
    };
  };

  const cargarDatos = useCallback(async () => {
    try {
      if (primeraCargaDatos.current) setCargando(true);
      setError(null);

      const hoy = new Date();
      const hace7 = new Date(hoy);
      hace7.setDate(hoy.getDate() - 6);
      hace7.setHours(0, 0, 0, 0);

   // Las 8 consultas son independientes entre sí -> se lanzan todas a la vez.
      // allSettled: si UNA falla, las demás igual se aprovechan (no se cae todo el Dashboard)
      const resultados = await Promise.allSettled([
        supabase.from("tabulacion_caso").select("id_alerta"),
        supabase.from("alerta_desestimada").select("id_alerta"),
        supabase
          .from("alerta")
          .select(
            `
            id_alerta,
            id_usuario,
            fecha_hora,
            categoria,
            codigo_alerta,
            usuario_ciudadano (nombre_completo, id_estado_ciudadano)
          `,
          )
          .order("fecha_hora", { ascending: false }),
        supabase
          .from("oficial")
          .select("*", { count: "exact", head: true })
          .eq("estado", true),
        supabase.from("oficial").select("*", { count: "exact", head: true }),
        supabase
          .from("patrullero")
          .select("*", { count: "exact", head: true })
          .in("id_estado_patrullero", [2, 3, 4, 5]),
        supabase.from("patrullero").select("*", { count: "exact", head: true }),
        supabase
          .from("alerta")
          .select("fecha_hora, categoria")
          .gte("fecha_hora", hace7.toISOString()),
      ]);

      const nombresConsultas = [
        "tabulacion_caso",
        "alerta_desestimada",
        "alerta (listado)",
        "oficiales conectados",
        "total oficiales",
        "patrullas activas",
        "total patrullas",
        "alertas semana (gráfica)",
      ];

      const obtenerValor = (idx) => {
        const r = resultados[idx];
        if (r.status === "rejected") {
          console.error(`Fallo en consulta "${nombresConsultas[idx]}":`, r.reason);
          return null;
        }
        if (r.value?.error) {
          console.error(`Error de Supabase en "${nombresConsultas[idx]}":`, r.value.error);
          return null;
        }
        return r.value;
      };

      const { data: tabuladas } = obtenerValor(0) || {};
      const { data: desestimadas } = obtenerValor(1) || {};
      const { data: alertas } = obtenerValor(2) || {};
      const { count: oficialesCount } = obtenerValor(3) || {};
      const { count: totalOficialesCount } = obtenerValor(4) || {};
      const { count: patrullasCount } = obtenerValor(5) || {};
      const { count: totalPatrullasCount } = obtenerValor(6) || {};
      const { data: alertasGrafica } = obtenerValor(7) || {};

      // Si la consulta principal de alertas falla, sí es un error real que debe mostrarse
      if (!alertas && resultados[2].status === "rejected") {
        throw new Error("No se pudieron cargar las alertas. Verifica tu conexión.");
      }

      const idsTabuladas = new Set((tabuladas || []).map((t) => t.id_alerta));
      const idsDesestimadas = new Set(
        (desestimadas || []).map((d) => d.id_alerta),
      );
      const idsCerradas = new Set([...idsTabuladas, ...idsDesestimadas]);

      // Separar alertas activas por categoría
      const alertasActivas = (alertas || []).filter(
        (a) => !idsCerradas.has(a.id_alerta),
      );
      const panico = alertasActivas.filter((a) => a.categoria === "Panico");
      const ciudadanas = alertasActivas.filter(
        (a) => a.categoria === "Alerta Ciudadana",
      );

      // Formatear para las tablas (3 más recientes)
      const formatear = (lista, estado) =>
        lista.slice(0, 3).map((item) => ({
          id:
            item.codigo_alerta ||
            `ALT-${String(item.id_alerta).padStart(4, "0")}`,
          ciudadano:
            item.usuario_ciudadano?.nombre_completo ||
            (item.id_usuario ? `Usuario #${item.id_usuario}` : "Anónimo"),
          verificado:
            Number(item.usuario_ciudadano?.id_estado_ciudadano) === 2,
          fecha_hora: item.fecha_hora,
          estado,
        }));

      setAlertasPanico(formatear(panico, "Emergencia"));
      setAlertasCiudadanas(formatear(ciudadanas, "Verificación"));

      setStats({
        emergencias: panico.length,
        ciudadanas: ciudadanas.length,
        patrullasActivas: patrullasCount || 0,
        oficialesConectados: oficialesCount || 0,
        totalPatrullas: totalPatrullasCount || 0,
        totalOficiales: totalOficialesCount || 0,
      });

      // Construir estructura de 7 días para la gráfica
      const mapa = {};
      for (let i = 0; i < 7; i++) {
        const d = new Date(hace7);
        d.setDate(hace7.getDate() + i);
        const key = d.toISOString().split("T")[0];
        mapa[key] = { name: DIAS[d.getDay()], emergencias: 0, ciudadanas: 0 };
      }

      (alertasGrafica || []).forEach((a) => {
        const key = a.fecha_hora?.split("T")[0];
        if (mapa[key]) {
          if (a.categoria === "Panico") mapa[key].emergencias++;
          else if (a.categoria === "Alerta Ciudadana") mapa[key].ciudadanas++;
        }
      });

      setDataGrafica(Object.values(mapa));
    } catch (err) {
      console.error("Error dashboard:", err);
      setError(err.message);
    } finally {
      setCargando(false);
      primeraCargaDatos.current = false;
    }
  }, []);

  // --- Carga de datos exclusivos de admin: resumen de usuarios + actividad reciente ---
  const cargarDatosAdmin = useCallback(async () => {
    if (!esAdmin) {
      setCargandoAdmin(false);
      return;
    }
    try {
      if (primeraCargaAdmin.current) setCargandoAdmin(true);

      const { data: oficiales, error: errOficiales } = await supabase
        .from("oficial")
        .select("id_oficial, rol, estado");
      if (errOficiales) throw errOficiales;

      const conteoPorRol = {};
      (oficiales || []).forEach((o) => {
        const rol = normalizarRol(o.rol) || "SIN ROL";
        if (!conteoPorRol[rol]) {
          conteoPorRol[rol] = { rol, total: 0, activos: 0 };
        }
        conteoPorRol[rol].total += 1;
        if (o.estado) conteoPorRol[rol].activos += 1;
      });
      setResumenUsuarios(Object.values(conteoPorRol));
    } catch (err) {
      console.error("Error dashboard admin:", err);
    } finally {
      setCargandoAdmin(false);
      primeraCargaAdmin.current = false;
    }
  }, [esAdmin]);

  // --- Carga de datos exclusivos de despachador: alertas sin asignar vs en intervención + patrullas por estado ---
  const cargarDatosDespacho = useCallback(async () => {
    if (!esDespachador) {
      setCargandoDespacho(false);
      return;
    }
    try {
      if (primeraCargaDespacho.current) setCargandoDespacho(true);

      // Alertas activas (id_estado_actual = 2, mismo filtro que usa Centro de Despacho)
      const { data: alertasActivas, error: errAlertas } = await supabase
        .from("alerta")
        .select("id_alerta")
        .eq("id_estado_actual", 2);
      if (errAlertas) throw errAlertas;

      const idsAlertas = (alertasActivas || []).map((a) => a.id_alerta);

      let idsConAsignacion = new Set();
      if (idsAlertas.length > 0) {
        const { data: asigActivas, error: errAsig } = await supabase
          .from("asignacion_patrulla")
          .select("id_alerta")
          .in("id_alerta", idsAlertas)
          .neq("id_estado_asignacion", 1); // 1 = ESTADO_DISPONIBLE (sin asignación real)
        if (errAsig) throw errAsig;
        idsConAsignacion = new Set((asigActivas || []).map((a) => a.id_alerta));
      }

      const enIntervencion = idsConAsignacion.size;
      const sinAsignar = idsAlertas.length - enIntervencion;

      // Patrullas por cada uno de los 5 estados operativos
      const { data: patrullerosData, error: errPat } = await supabase
        .from("patrullero")
        .select("id_estado_patrullero");
      if (errPat) throw errPat;

      const conteoEstados = {
        disponible: 0,
        notificado: 0,
        enCamino: 0,
        enLugar: 0,
        revision: 0,
      };
      (patrullerosData || []).forEach((p) => {
        if (p.id_estado_patrullero === 1) conteoEstados.disponible += 1;
        else if (p.id_estado_patrullero === 2) conteoEstados.notificado += 1;
        else if (p.id_estado_patrullero === 3) conteoEstados.enCamino += 1;
        else if (p.id_estado_patrullero === 4) conteoEstados.enLugar += 1;
        else if (p.id_estado_patrullero === 5) conteoEstados.revision += 1;
      });

      setDatosDespacho({
        sinAsignar,
        enIntervencion,
        patrullasPorEstado: conteoEstados,
      });
    } catch (err) {
      console.error("Error dashboard despacho:", err);
    } finally {
      setCargandoDespacho(false);
      primeraCargaDespacho.current = false;
    }
  }, [esDespachador]);

  // --- Carga de datos exclusivos de tabulador: pendientes reales (mismo criterio que Tabulacion.jsx) ---
  const cargarDatosTabulador = useCallback(async () => {
    if (!esTabulador) {
      setCargandoTabulador(false);
      return;
    }
    try {
      if (primeraCargaTabulador.current) setCargandoTabulador(true);

      // IDs ya tabulados
      const { data: tabData, error: errTab } = await supabase
        .from("tabulacion_caso")
        .select("id_alerta");
      if (errTab) throw errTab;
      const idsTabulados = new Set((tabData || []).map((t) => t.id_alerta));

      // Asignaciones con alerta en estado 3 (atendida, esperando tabulación)
      const { data: asigData, error: errAsig } = await supabase
        .from("asignacion_patrulla")
        .select("id_alerta, alerta:id_alerta (id_alerta, id_estado_actual)")
        .order("id_asignacion", { ascending: false });
      if (errAsig) throw errAsig;

      const idsVistos = new Set();
      let pendientes = 0;
      (asigData || []).forEach((a) => {
        if (!a.alerta || idsVistos.has(a.alerta.id_alerta)) return;
        idsVistos.add(a.alerta.id_alerta);
        if (
          a.alerta.id_estado_actual === 3 &&
          !idsTabulados.has(a.alerta.id_alerta)
        ) {
          pendientes += 1;
        }
      });

      setPendientesTabular(pendientes);

      // Totales históricos (todo el tiempo, no solo hoy) para el resumen del dashboard
      const { count: totalTabuladosCount } = await supabase
        .from("tabulacion_caso")
        .select("*", { count: "exact", head: true });
      const { count: totalDesestimadosCount } = await supabase
        .from("alerta_desestimada")
        .select("*", { count: "exact", head: true });

      setTotalTabulados(totalTabuladosCount || 0);
      setTotalDesestimados(totalDesestimadosCount || 0);
    } catch (err) {
      console.error("Error dashboard tabulador:", err);
    } finally {
      setCargandoTabulador(false);
      primeraCargaTabulador.current = false;
    }
  }, [esTabulador]);

  useEffect(() => {
    cargarDatos();
    const channel = supabase
      .channel("dashboard-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerta" },
        cargarDatos,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patrullero" },
        cargarDatos,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "oficial" },
        cargarDatos,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tabulacion_caso" },
        cargarDatos,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerta_desestimada" },
        cargarDatos,
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [cargarDatos]);

  useEffect(() => {
    cargarDatosAdmin();

    if (!esAdmin) return;

    const canalAdmin = supabase
      .channel("dashboard-admin-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "oficial" },
        cargarDatosAdmin,
      )
      .subscribe();

    return () => supabase.removeChannel(canalAdmin);
  }, [cargarDatosAdmin, esAdmin]);

  useEffect(() => {
    cargarDatosDespacho();

    if (!esDespachador) return;

    const canalDespacho = supabase
      .channel("dashboard-despacho-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerta" },
        cargarDatosDespacho,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "asignacion_patrulla" },
        cargarDatosDespacho,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "patrullero" },
        cargarDatosDespacho,
      )
      .subscribe();

    return () => supabase.removeChannel(canalDespacho);
  }, [cargarDatosDespacho, esDespachador]);

  useEffect(() => {
    cargarDatosTabulador();

    if (!esTabulador) return;

    const canalTabulador = supabase
      .channel("dashboard-tabulador-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerta" },
        cargarDatosTabulador,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "asignacion_patrulla" },
        cargarDatosTabulador,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tabulacion_caso" },
        cargarDatosTabulador,
      )
      .subscribe();

    return () => supabase.removeChannel(canalTabulador);
  }, [cargarDatosTabulador, esTabulador]);

  const statCards = [
    {
      label: "Alertas de Emergencia",
      value: stats.emergencias,
      icon: FaExclamationCircle,
      bgColor: "bg-red-50",
      borderColor: "border-[#C90A0A]",
      textColor: "text-[#C90A0A]",
      dotColor: "bg-[#C90A0A]",
      description: "ACTIVAS",
    },
    {
      label: "Alertas Ciudadanas",
      value: stats.ciudadanas,
      icon: FaUserShield,
      bgColor: "bg-blue-50",
      borderColor: "border-[#270cb2]",
      textColor: "text-[#270cb2]",
      dotColor: "bg-[#270cb2]",
      description: "EN VERIFICACIÓN",
    },
    {
      label: "Patrullas Activas",
      value: stats.patrullasActivas,
      icon: FaCarSide,
      bgColor: "bg-yellow-50",
      borderColor: "border-[#EBB615]",
      textColor: "text-[#EBB615]",
      dotColor: "bg-[#EBB615]",
      description: "DESPLEGADAS",
    },
    {
      label: "Oficiales Conectados",
      value: stats.oficialesConectados,
      icon: FaFileAlt,
      bgColor: "bg-green-50",
      borderColor: "border-[#088226]",
      textColor: "text-[#088226]",
      dotColor: "bg-[#088226]",
      description: "EN TURNO ACTIVO",
    },
  ];

if (cargando) {
    return (
      <div className="-mt-1 space-y-6 p-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
          {[0, 1, 2, 3].map((i) => <StatCardSkeleton key={i} />)}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2">
            <PanelSkeleton heightClass="h-[320px]" />
          </div>
          <PanelSkeleton heightClass="h-[320px]" />
        </div>

        <PanelSkeleton heightClass="h-[180px]" />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-md p-5 h-[220px] flex flex-col items-center justify-center">
              <div className="self-start ml-1 mb-4">
                <div className="h-3 w-28 bg-slate-200 rounded animate-pulse" />
              </div>
              <div className="w-28 h-28 rounded-full bg-slate-100 animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- Datos derivados para gráficas/sparklines/donuts (todo real, nada inventado) ---
  const emergenciasSerie = dataGrafica.map((d) => d.emergencias);
  const ciudadanasSerie = dataGrafica.map((d) => d.ciudadanas);
  const variacionEmergencias = calcVariacion(emergenciasSerie);
  const variacionCiudadanas = calcVariacion(ciudadanasSerie);

  const promedioTotalDia =
    dataGrafica.length > 0
      ? dataGrafica.reduce((acc, d) => acc + d.emergencias + d.ciudadanas, 0) /
        dataGrafica.length
      : 0;

  const totalAlertasActivas = stats.emergencias + stats.ciudadanas;
  const pctEmergencias =
    totalAlertasActivas > 0
      ? Math.round((stats.emergencias / totalAlertasActivas) * 100)
      : 0;
  const pctPatrullas =
    stats.totalPatrullas > 0
      ? Math.round((stats.patrullasActivas / stats.totalPatrullas) * 100)
      : 0;
  const pctOficiales =
    stats.totalOficiales > 0
      ? Math.round((stats.oficialesConectados / stats.totalOficiales) * 100)
      : 0;

  const donutData = (pct) => [
    { name: "valor", value: pct },
    { name: "resto", value: 100 - pct },
  ];

  const DonutCard = ({ titulo, pct, colorFuerte, subtitulo }) => (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-5 flex h-full flex-col items-center justify-center">
      <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400 mb-2 self-start">
        {titulo}
      </p>
      <div className="relative w-28 h-28">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={donutData(pct)}
              dataKey="value"
              innerRadius={38}
              outerRadius={50}
              startAngle={90}
              endAngle={-270}
              stroke="none"
            >
              <Cell fill={colorFuerte} />
              <Cell fill="#eef0e8" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-lg font-black text-slate-800">{pct}%</span>
        </div>
      </div>
      <p className="mt-2 text-[12px] font-semibold text-slate-500 text-center">
        {subtitulo}
      </p>
    </div>
  );

  const SparklineRow = ({ label, valor, variacion, serie, color }) => (
    <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
      <div>
        <p className="text-xl font-black text-slate-800">{valor}</p>
        <p className="mt-2 text-[12px] font-semibold text-slate-500">{label}</p>
      </div>
      <div className="w-24 h-10">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={serie.map((v, i) => ({ i, v }))}>
            <Area
              type="monotone"
              dataKey="v"
              stroke={color}
              strokeWidth={2}
              fill={color}
              fillOpacity={0.12}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <span
        className={`text-[11px] font-bold px-2.5 py-1 rounded-full ${
          variacion >= 0
            ? "bg-emerald-50 text-emerald-600"
            : "bg-red-50 text-red-500"
        }`}
      >
        {variacion >= 0 ? "+" : ""}
        {variacion}%
      </span>
    </div>
  );

  return (
    <div className={`-mt-1 h-full ${esTabulador ? "" : "overflow-y-auto scroll-hover"}`}>
    <div className="space-y-6 animate-fadeIn p-2">
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md shadow-sm">
          <p className="text-yellow-700 text-sm font-medium">{error}</p>
          <button
            onClick={cargarDatos}
            className="mt-2 text-xs bg-yellow-200 px-3 py-1 rounded-md flex items-center gap-1"
          >
            <FaSyncAlt size={10} /> Reintentar
          </button>
        </div>
      )}

      {/* CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-white p-3 shadow-md border-l-8 rounded-xl ${card.borderColor} hover:shadow-lg hover:scale-105 transition-all duration-300`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p
                  className={`ml-2 font-extrabold text-[11px] uppercase tracking-wider ${card.textColor} mb-0.5`}
                >
                  {card.label}
                </p>
                <p className="ml-2 mt-1 text-2xl font-black text-slate-900">
                  {card.value}
                </p>
                <div className="ml-2 mt-3 flex items-center gap-1.5">
                  <span
                    className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${card.dotColor}`}
                  />
                  <p className="ml-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {card.description}
                  </p>
                </div>
              </div>
              <div className={`${card.bgColor} mr-3 p-2 rounded-full`}>
                <card.icon size={18} className={card.textColor} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* FILA: Gráfica principal + panel resumen */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid grid-cols-1 xl:grid-cols-3 gap-5"
      >
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-md p-6">
          <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
            <h2 className="text-[16px] font-bold text-slate-800 uppercase tracking-wide">
              Actividad
            </h2>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white bg-[#474b29] px-3 py-1.5 rounded-md">
              Últimos 7 días
            </span>
          </div>
          <div style={{ width: "100%", height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart
                data={dataGrafica}
                margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke="#f1f5f9"
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  width={30}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                  formatter={(value, name) => [
                    value,
                    name === "emergencias" ? "Emergencias" : "Ciudadanas",
                  ]}
                />
                <ReferenceLine
                  y={promedioTotalDia}
                  stroke="#c9a227"
                  strokeDasharray="5 4"
                  strokeWidth={1.5}
                />
                <Bar
                  dataKey="emergencias"
                  fill="#474b29"
                  radius={[6, 6, 0, 0]}
                  barSize={16}
                />
                <Line
                  type="monotone"
                  dataKey="ciudadanas"
                  stroke="#c9a227"
                  strokeWidth={2}
                  dot={{ r: 3, fill: "#c9a227" }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 flex flex-col">
          <h2 className="text-[16px] font-bold text-slate-800 uppercase tracking-wide mb-4 ">
            Resumen General
          </h2>
          <div className="grid grid-cols-3 gap-2 mb-5">
            <div>
              <p className="text-2xl font-black text-slate-800 tabular-nums">
                {stats.emergencias}
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                Emergencias
              </p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800 tabular-nums">
                {stats.ciudadanas}
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                Ciudadanas
              </p>
            </div>
            <div>
              <p className="text-2xl font-black text-slate-800 tabular-nums">
                {stats.patrullasActivas}
              </p>
              <p className="text-[9px] font-semibold uppercase tracking-wider text-slate-400 mt-0.5">
                Patrullas
              </p>
            </div>
          </div>
          <div className="flex-1" style={{ minHeight: 130 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={dataGrafica}
                margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorResumen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#474b29" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#474b29" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" hide />
                <Tooltip
                  contentStyle={{
                    borderRadius: "12px",
                    border: "none",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="ciudadanas"
                  stroke="#474b29"
                  strokeWidth={2}
                  fill="url(#colorResumen)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </motion.div>

      {/* Tendencia Semanal (+ donut de Operador al lado) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45 }}
        className={`grid grid-cols-1 gap-5 ${isOperador ? "lg:grid-cols-3" : ""}`}
      >
        <div
          className={`bg-white rounded-2xl border border-gray-100 shadow-md p-6 ${
            isOperador ? "lg:col-span-2" : ""
          }`}
        >
          <h2 className="text-[16px] font-bold text-slate-800 uppercase tracking-wide mb-2">
            Tendencia Semanal
          </h2>
          <SparklineRow
            label="Alertas de Emergencia"
            valor={stats.emergencias}
            variacion={variacionEmergencias}
            serie={emergenciasSerie}
            color="#dc2626"
          />
          <SparklineRow
            label="Alertas Ciudadanas"
            valor={stats.ciudadanas}
            variacion={variacionCiudadanas}
            serie={ciudadanasSerie}
            color="#2563eb"
          />
        </div>

        {isOperador && (
          <DonutCard
            titulo="Emergencias vs. Ciudadanas"
            pct={pctEmergencias}
            colorFuerte="#C90A0A"
            subtitulo="% de alertas activas que son emergencias"
          />
        )}
      </motion.div>

      {/* Donuts: no se repiten para Operador (arriba) ni para Tabulador (no le aplican) */}
      {!isOperador && !esTabulador && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className={`grid grid-cols-1 gap-5 ${esDespachador ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
        >
          <DonutCard
            titulo="Emergencias vs. Ciudadanas"
            pct={pctEmergencias}
            colorFuerte="#C90A0A"
            subtitulo="% de alertas activas que son emergencias"
          />
          <DonutCard
            titulo="Patrullas Desplegadas"
            pct={pctPatrullas}
            colorFuerte="#c9a227"
            subtitulo={`${stats.patrullasActivas} de ${stats.totalPatrullas} patrullas`}
          />

          {esDespachador && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6 flex h-full flex-col justify-center">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[15px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                  <FaExclamationCircle size={14} className="text-[#474b29]" />
                  Alertas por Atender
                </h2>
                <button
                  onClick={() => navigate("/despacho")}
                  className="font-bold flex items-center gap-1.5 uppercase text-slate-400 hover:text-slate-500 text-[10px] tracking-wider transition-colors"
                >
                  Ir a Despacho <FaChevronRight size={8} />
                </button>
              </div>
              {cargandoDespacho ? (
                <div className="grid grid-cols-2 gap-4">
                  <SkeletonBlock height="h-16" className="rounded-xl" />
                  <SkeletonBlock height="h-16" className="rounded-xl" />
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-50/70 rounded-xl px-4 py-4 text-center">
                    <p className="text-2xl font-black text-[#C90A0A] tabular-nums">
                      {datosDespacho.sinAsignar}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
                      Sin Asignar
                    </p>
                  </div>
                  <div className="bg-slate-50/70 rounded-xl px-4 py-4 text-center">
                    <p className="text-2xl font-black text-[#270cb2] tabular-nums">
                      {datosDespacho.enIntervencion}
                    </p>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 mt-1">
                      En Intervención
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      )}

      {/* TABLAS: exclusivas del módulo Operador */}
      {isOperador && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 xl:grid-cols-2 gap-6"
        >
          {/* Emergencias */}
          <div className="bg-white p-2 rounded-2xl shadow-md">
            <div className="flex justify-between items-start px-6 py-5 flex-col md:flex-row md:items-center mb-2">
              <h2 className="text-[16px] font-bold text-slate-800 uppercase tracking-wide">
                Emergencias Recientes
              </h2>
              {isOperador && (
                <button
                  onClick={() =>
                    navigate("/gestion-alertas", {
                      state: { activeTab: "emergencia" },
                    })
                  }
                  className="font-bold flex items-center gap-1.5 uppercase text-slate-400 hover:text-slate-500 text-[10px] tracking-wider transition-colors"
                >
                  Ver todo <FaChevronRight size={8} />
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <tbody>
                  {alertasPanico.length > 0 ? (
                    alertasPanico.map((item) => {
                      const { nombres, apellidos } = dividirNombre(
                        item.ciudadano,
                      );
                      return (
                        <tr
                          key={item.id}
                          className="bg-white hover:shadow-lg transition-all"
                        >
                          <td className="px-6 py-4 text-xs font-bold text-slate-400 border-b border-slate-200/60">
                            {item.id}
                          </td>
                          <td className="px-0 py-4 border-b border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-8 bg-blue-50 text-[#270cb2] flex items-center justify-center font-black rounded-md shadow-inner">
                                {item.ciudadano.charAt(0)}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium">
                                  {nombres} {apellidos}
                                </span>
                                <span className="mt-0.5 text-[8px] text-gray-400 font-semibold uppercase tracking-wider">
                                  {item.verificado ? "Verificado" : "No verificado"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-0 border-b border-slate-200/60">
                            <span className="inline-flex tracking-wider px-2 py-1.5 rounded-lg text-[10px] font-bold text-white bg-[#C90A0A] uppercase">
                              {item.estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="text-center py-6 text-slate-400 text-sm border-b border-slate-200/60"
                      >
                        No hay emergencias activas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertas Ciudadanas */}
          <div className="bg-white p-2 rounded-2xl shadow-md">
            <div className="flex justify-between items-start px-6 py-5 flex-col md:flex-row md:items-center mb-2">
              <h2 className="text-[16px] font-bold text-slate-800 uppercase tracking-wide">
                Alertas Recibidas
              </h2>
              {isOperador && (
                <button
                  onClick={() =>
                    navigate("/gestion-alertas", {
                      state: { activeTab: "ciudadana" },
                    })
                  }
                  className="font-bold flex items-center gap-1.5 uppercase text-slate-400 hover:text-slate-500 text-[10px] tracking-wider transition-colors"
                >
                  Ver todo <FaChevronRight size={8} />
                </button>
              )}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <tbody>
                  {alertasCiudadanas.length > 0 ? (
                    alertasCiudadanas.map((item) => {
                      const { nombres, apellidos } = dividirNombre(
                        item.ciudadano,
                      );
                      return (
                        <tr
                          key={item.id}
                          className="bg-white hover:shadow-lg transition-all"
                        >
                          <td className="px-6 py-4 text-xs font-bold text-slate-400 border-b border-slate-200/60">
                            {item.id}
                          </td>
                          <td className="px-0 py-4 border-b border-slate-200/60">
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-8 bg-blue-50 text-[#270cb2] flex items-center justify-center font-black rounded-md shadow-inner">
                                {item.ciudadano.charAt(0)}
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-sm font-medium text-[16px]">
                                  {nombres} {apellidos}
                                </span>
                                <span className="mt-0.5 text-[8px] text-gray-400 font-semibold uppercase tracking-wider">
                                  {item.verificado ? "Verificado" : "No verificado"}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="px-0 border-b border-slate-200/60">
                            <span className="inline-flex tracking-wider px-2 py-1.5 rounded-lg text-[10px] font-bold text-white bg-[#EBB615] uppercase">
                              {item.estado}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan="3"
                        className="text-center py-6 text-slate-400 text-sm border-b border-slate-200/60"
                      >
                        No hay alertas ciudadanas activas
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}

      {/* SECCIONES EXCLUSIVAS DE ADMINISTRADOR */}
      {esAdmin && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 gap-5"
        >
          {/* Resumen de usuarios por rol */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[16px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2">
                Resumen de Usuarios
              </h2>
              <button
                onClick={() => navigate("/usuarios")}
                className="font-bold flex items-center gap-1.5 uppercase text-slate-400 hover:text-slate-500 text-[10px] tracking-wider transition-colors"
              >
                Gestionar <FaChevronRight size={8} />
              </button>
            </div>
            {cargandoAdmin ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {[0, 1, 2, 3, 4].map((i) => (
                  <SkeletonBlock key={i} height="h-16" className="rounded-xl" />
                ))}
              </div>
            ) : resumenUsuarios.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {resumenUsuarios.map((r) => {
                  const pct =
                    r.total > 0 ? Math.round((r.activos / r.total) * 100) : 0;
                  return (
                    <div
                      key={r.rol}
                      className="rounded-xl border border-gray-100 bg-slate-50/40 px-4 py-3.5"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-600">
                          {r.rol}
                        </span>
                        <span className="text-sm font-black text-slate-800">
                          {r.total}
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-200 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#474b29] transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-2 text-[11px] font-semibold text-slate-500">
                        {r.activos} de {r.total} activos · {pct}%
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-6 text-slate-400 text-sm">
                No hay usuarios registrados
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* SECCIÓN EXCLUSIVA DE DESPACHO: Patrullas por Estado */}
      {esDespachador && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-md p-6"
        >
          <h2 className="text-[15px] font-bold text-slate-800 uppercase tracking-wide flex items-center gap-2 mb-4">
            <FaCarSide size={14} className="text-[#474b29]" />
            Patrullas por Estado
          </h2>
        {cargandoDespacho ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[0, 1, 2, 3, 4].map((i) => (
                <SkeletonBlock key={i} height="h-10" className="rounded-lg" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {[
                {
                  label: "Disponible",
                  valor: datosDespacho.patrullasPorEstado.disponible,
                  color: "bg-green-600",
                },
                {
                  label: "Notificado",
                  valor: datosDespacho.patrullasPorEstado.notificado,
                  color: "bg-blue-600",
                },
                {
                  label: "En Camino",
                  valor: datosDespacho.patrullasPorEstado.enCamino,
                  color: "bg-orange-600",
                },
                {
                  label: "En Lugar",
                  valor: datosDespacho.patrullasPorEstado.enLugar,
                  color: "bg-purple-700",
                },
                {
                  label: "Revisión",
                  valor: datosDespacho.patrullasPorEstado.revision,
                  color: "bg-gray-600",
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between bg-slate-50/70 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${item.color}`} />
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600">
                      {item.label}
                    </span>
                  </div>

                  <span className="text-sm font-black text-slate-800">
                    {item.valor}
                  </span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* SECCIONES EXCLUSIVAS DE TABULADOR: acceso directo + resumen histórico (no repite nada de /tabulacion) */}
      {esTabulador && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="grid grid-cols-1 lg:grid-cols-4 gap-5"
        >
          <button
            onClick={() => navigate("/tabulacion")}
            className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-md p-6 flex items-center gap-5 transition-all text-left"
          >
            <div className="bg-[#474b29]/10 p-3 rounded-full shrink-0">
              <FaClipboardList size={20} className="text-[#474b29]" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-[16px] font-bold uppercase tracking-wider text-slate-800">
                Alertas Pendientes de Tabular
              </h2>
              <p className="text-[11px] font-semibold text-slate-500 mt-0.5">
               {cargandoTabulador
                  ? <span className="inline-block w-40 h-2.5 bg-slate-200 rounded animate-pulse align-middle" />
                  : `${pendientesTabular} ${pendientesTabular === 1 ? "caso" : "casos"} esperando tabulación`}
              </p>
            </div>
            <div className="flex items-center gap-4 pl-5 border-l border-gray-100 shrink-0">
              <div className="text-center">
                {!cargandoTabulador && (
                  <span className="block text-2xl font-black text-[#474b29] tabular-nums leading-none">
                    {pendientesTabular}
                  </span>
                )}
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-1 block">
                  Pendientes
                </span>
              </div>
              <FaChevronRight size={14} className="text-slate-300 shrink-0" />
            </div>
          </button>

          <DonutCard
            titulo="Tabulados"
            pct={
              totalTabulados + totalDesestimados > 0
                ? Math.round(
                    (totalTabulados / (totalTabulados + totalDesestimados)) *
                      100,
                  )
                : 0
            }
            colorFuerte="#474b29"
            subtitulo={`${totalTabulados} casos en total`}
          />

          <DonutCard
            titulo="Desestimados"
            pct={
              totalTabulados + totalDesestimados > 0
                ? Math.round(
                    (totalDesestimados / (totalTabulados + totalDesestimados)) *
                      100,
                  )
                : 0
            }
            colorFuerte="#c9a227"
            subtitulo={`${totalDesestimados} casos en total`}
          />
        </motion.div>
      )}
    </div>
    </div>
  );
}

export default Dashboard;
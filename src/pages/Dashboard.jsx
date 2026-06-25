import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaCarSide,
  FaUserShield,
  FaExclamationCircle,
  FaChevronRight,
  FaSyncAlt,
} from "react-icons/fa";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { supabase } from "../services/supabase";
import { useAuth } from '../context/AuthContext';

const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function Dashboard() {
  const navigate = useNavigate();
const { isOperador } = useAuth();

  const [stats, setStats] = useState({
    emergencias: 0,
    ciudadanas: 0,
    patrullasActivas: 0,
    oficialesConectados: 0,
  });

  const [alertasPanico, setAlertasPanico] = useState([]);
  const [alertasCiudadanas, setAlertasCiudadanas] = useState([]);
  const [dataGrafica, setDataGrafica] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

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
      setCargando(true);
      setError(null);

      // IDs de alertas ya tabuladas (cerradas)
      const { data: tabuladas } = await supabase
        .from("tabulacion_caso")
        .select("id_alerta");
      const idsTabuladas = new Set((tabuladas || []).map((t) => t.id_alerta));

      // IDs de alertas desestimadas
      const { data: desestimadas } = await supabase
        .from("alerta_desestimada")
        .select("id_alerta");
      const idsDesestimadas = new Set(
        (desestimadas || []).map((d) => d.id_alerta),
      );

      const idsCerradas = new Set([...idsTabuladas, ...idsDesestimadas]);

      // Todas las alertas con ciudadano
      const { data: alertas, error: errAlertas } = await supabase
        .from("alerta")
        .select(
          `
          id_alerta,
          id_usuario,
          fecha_hora,
          categoria,
          usuario_ciudadano (nombre_completo)
        `,
        )
        .order("fecha_hora", { ascending: false });

      if (errAlertas) throw errAlertas;

      // Oficiales conectados
      const { count: oficialesCount } = await supabase
        .from("oficial")
        .select("*", { count: "exact", head: true })
        .eq("estado", true);

      // Patrullas activas (estado 2, 3, 4 o 5 = todo menos DISPONIBLE)
      const { count: patrullasCount } = await supabase
        .from("patrullero")
        .select("*", { count: "exact", head: true })
        .in("id_estado_patrullero", [2, 3, 4, 5]);

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
          id: item.id_alerta,
          ciudadano:
            item.usuario_ciudadano?.nombre_completo ||
            (item.id_usuario ? `Usuario #${item.id_usuario}` : "Anónimo"),
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
      });

      // --- GRÁFICA: alertas por día últimos 7 días ---
      const hoy = new Date();
      const hace7 = new Date(hoy);
      hace7.setDate(hoy.getDate() - 6);
      hace7.setHours(0, 0, 0, 0);

      const { data: alertasGrafica } = await supabase
        .from("alerta")
        .select("fecha_hora, categoria")
        .gte("fecha_hora", hace7.toISOString());

      // Construir estructura de 7 días
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
    }
  }, []);

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
      borderColor: "border-[#0C3DC2]",
      textColor: "text-[#0C3DC2]",
      dotColor: "bg-[#0C3DC2]",
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
      <div className="flex justify-center items-center h-64">
        <div className="text-[#113e27] font-bold text-lg animate-pulse">
          Cargando dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="-mt-1 space-y-6 animate-fadeIn p-2">
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

      {/* GRÁFICA */}
      <div className="p-6 relative top-2 bg-white rounded-2xl shadow-md">
        <div className="px-2 py-1 flex justify-between items-center mb-2 flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-extrabold text-[#1e293b] uppercase tracking-wide">
              Gráfica de Actividad
            </h2>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-md">
              <div className="w-1.5 h-1.5 bg-[#C90A0A] rounded-full" />
              <span className="text-[10px] font-bold text-red-700">
                EMERGENCIAS
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md">
              <div className="w-1.5 h-1.5 bg-[#0C3DC2] rounded-full" />
              <span className="text-[10px] font-bold text-blue-700">
                CIUDADANAS
              </span>
            </div>
          </div>
        </div>
        <div style={{ width: "100%", height: 300, minHeight: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dataGrafica}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorEmerg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorCiud" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
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
                width={40}
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
              <Area
                type="monotone"
                dataKey="emergencias"
                stroke="#dc2626"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorEmerg)"
              />
              <Area
                type="monotone"
                dataKey="ciudadanas"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorCiud)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLAS */}
      <div className="relative top-4 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Emergencias */}
        <div className="bg-white p-2 rounded-2xl shadow-md">
          <div className="flex justify-between items-start px-6 py-5 flex-col md:flex-row md:items-center mb-2">
            <h2 className="text-xl font-extrabold uppercase text-[#1e293b]">
              Emergencias Recientes
            </h2>
            {isOperador && (
  <button
    onClick={() => navigate("/gestion-alertas", { state: { activeTab: "emergencia" } })}
    className="font-bold flex items-center gap-1.5 uppercase text-slate-400 hover:text-slate-500 text-[10px] tracking-wider transition-colors"
  >
    Ver todo <FaChevronRight size={8} />
  </button>
)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-3">
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
                        <td className="px-6 py-3 text-xs font-bold text-slate-400 rounded-l-xl">
                          {item.id}
                        </td>
                        <td className="px-8 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-8 bg-blue-50 text-[#0C3DC2] flex items-center justify-center font-black rounded-md shadow-inner">
                              {item.ciudadano.charAt(0)}
                            </div>
                            <span className="text-sm font-medium">
                              {nombres} {apellidos}
                            </span>
                          </div>
                        </td>
                        <td className="px-0">
                          <span className="inline-flex px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-[#C90A0A] uppercase">
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
                      className="text-center py-6 text-slate-400 text-sm"
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
            <h2 className="text-xl font-extrabold uppercase text-[#1e293b]">
              Alertas Recibidas
            </h2>
            {isOperador && (
  <button
    onClick={() => navigate("/gestion-alertas", { state: { activeTab: "ciudadana" } })}
    className="font-bold flex items-center gap-1.5 uppercase text-slate-400 hover:text-slate-500 text-[10px] tracking-wider transition-colors"
  >
    Ver todo <FaChevronRight size={8} />
  </button>
)}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-3">
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
                        <td className="px-6 py-3 text-xs font-bold text-slate-400 rounded-l-xl">
                          {item.id}
                        </td>
                        <td className="px-8 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-8 bg-blue-50 text-[#0C3DC2] flex items-center justify-center font-black rounded-md shadow-inner">
                              {item.ciudadano.charAt(0)}
                            </div>
                            <span className="text-sm font-medium">
                              {nombres} {apellidos}
                            </span>
                          </div>
                        </td>
                        <td className="px-0">
                          <span className="inline-flex px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-[#EBB615] uppercase">
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
                      className="text-center py-6 text-slate-400 text-sm"
                    >
                      No hay alertas ciudadanas activas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

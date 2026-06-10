import React, { useState, useEffect } from "react";
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
import { supabase } from '../services/supabase';

function Dashboard() {
  const navigate = useNavigate();

  const [alertasPanico, setAlertasPanico] = useState([]);
  const [alertasCiudadanas, setAlertasCiudadanas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const dividirNombre = (nombreCompleto) => {
    if (!nombreCompleto) return { nombres: "Usuario", apellidos: "" };
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length === 1) return { nombres: partes[0], apellidos: "" };
    if (partes.length === 2) return { nombres: partes[0], apellidos: partes[1] };
    const apellidos = partes.slice(-2).join(" ");
    const nombres = partes.slice(0, -2).join(" ");
    return { nombres, apellidos };
  };

  const cargarAlertas = async () => {
    try {
      setCargando(true);
      setError(null);

      // Consulta usando la relación con usuario_ciudadano (sin campos inexistentes)
      const { data, error: fetchError } = await supabase
        .from("alerta")
        .select(`
          id_alerta,
          id_usuario,
          fecha_hora,
          categoria,
          usuario_ciudadano (
            nombre_completo
          )
        `)
        .order("fecha_hora", { ascending: false });

      if (fetchError) throw new Error(`Error al cargar alertas: ${fetchError.message}`);

      if (!data || data.length === 0) {
        setAlertasPanico([]);
        setAlertasCiudadanas([]);
        setError("No hay alertas registradas.");
        return;
      }

      let panico = [];
      let ciudadanas = [];

      data.forEach(item => {
        let nombreCiudadano = "Anónimo";
        if (item.usuario_ciudadano && item.usuario_ciudadano.nombre_completo) {
          nombreCiudadano = item.usuario_ciudadano.nombre_completo;
        } else if (item.id_usuario) {
          nombreCiudadano = `Usuario #${item.id_usuario}`;
        }

        const alertaBase = {
          id: item.id_alerta,
          ciudadano: nombreCiudadano,
          fecha_hora: item.fecha_hora,
        };

        if (item.categoria === "Panico") {
          panico.push({ ...alertaBase, estado: "Emergencia" });
        } else if (item.categoria === "Alerta Ciudadana") {
          ciudadanas.push({ ...alertaBase, estado: "Verificación" });
        }
      });

      // Ordenar por fecha descendente
      panico.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));
      ciudadanas.sort((a, b) => new Date(b.fecha_hora) - new Date(a.fecha_hora));

      // Tomar solo las 3 más recientes
      setAlertasPanico(panico.slice(0, 3));
      setAlertasCiudadanas(ciudadanas.slice(0, 3));

      if (panico.length === 0 && ciudadanas.length === 0) {
        setError("No hay alertas con las categorías 'Panico' o 'Alerta Ciudadana'.");
      }
    } catch (err) {
      console.error("❌ Error cargando alertas:", err);
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAlertas();

    const channel = supabase
      .channel("dashboard-cambios")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerta" },
        () => cargarAlertas()
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Datos estáticos de ejemplo para la gráfica (puedes cambiarlos)
  const dataGrafica = [
    { name: "Dom", denuncias: 30, alertas: 15 },
    { name: "Lun", denuncias: 45, alertas: 22 },
    { name: "Mar", denuncias: 38, alertas: 18 },
    { name: "Mié", denuncias: 52, alertas: 30 },
    { name: "Jue", denuncias: 48, alertas: 25 },
    { name: "Vie", denuncias: 60, alertas: 35 },
    { name: "Sáb", denuncias: 42, alertas: 20 },
  ];

  const statCards = [
    { label: "Alertas de Emergencia", value: alertasPanico.length, icon: FaExclamationCircle, bgColor: "bg-red-50", borderColor: "border-[#C90A0A]", textColor: "text-[#C90A0A]", dotColor: "bg-[#C90A0A]", description: "ATENCIÓN INMEDIATA" },
    { label: "Alertas Ciudadanas", value: alertasCiudadanas.length, icon: FaUserShield, bgColor: "bg-blue-50", borderColor: "border-[#0C3DC2]", textColor: "text-[#0C3DC2]", dotColor: "bg-[#0C3DC2]", description: "EN VERIFICACIÓN" },
    { label: "Patrullas Activas", value: 18, icon: FaCarSide, bgColor: "bg-yellow-50", borderColor: "border-[#EBB615]", textColor: "text-[#EBB615]", dotColor: "bg-[#EBB615]", description: "DESPLEGADAS" },
    { label: "Oficiales de Turno", value: 42, icon: FaFileAlt, bgColor: "bg-green-50", borderColor: "border-[#088226]", textColor: "text-[#088226]", dotColor: "bg-[#088226]", description: "PERSONAL ACTIVO" },
  ];

  if (cargando) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-[#113e27] font-bold text-lg animate-pulse">Cargando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="-mt-1 space-y-6 animate-fadeIn p-2">
      {error && (
        <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-md shadow-sm">
          <p className="text-yellow-700 text-sm font-medium">{error}</p>
          <button onClick={cargarAlertas} className="mt-2 text-xs bg-yellow-200 px-3 py-1 rounded-md flex items-center gap-1">
            <FaSyncAlt size={10} /> Reintentar
          </button>
        </div>
      )}

      {/* Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
        {statCards.map((card, idx) => (
          <motion.div key={idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}
            className={`bg-white p-3 shadow-md border-l-8 rounded-xl ${card.borderColor} hover:shadow-lg hover:scale-105 transition-all duration-300`}>
            <div className="flex justify-between items-center">
              <div>
                <p className={`ml-2 font-extrabold text-[11px] uppercase tracking-wider ${card.textColor} mb-0.5`}>{card.label}</p>
                <p className="ml-2 mt-1 text-2xl font-black text-slate-900">{card.value}</p>
                <div className="ml-2 mt-3 flex items-center gap-1.5">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full animate-pulse ${card.dotColor}`}></span>
                  <p className="ml-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">{card.description}</p>
                </div>
              </div>
              <div className={`${card.bgColor} mr-3 p-2 rounded-full`}><card.icon size={18} className={card.textColor} /></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Gráfica */}
      <div className="p-6 relative top-2 bg-white rounded-2xl shadow-md">
        <div className="px-2 py-1 flex justify-between items-center mb-2 flex-wrap gap-2">
          <h2 className="text-xl font-extrabold text-[#1e293b] uppercase tracking-wide">Gráfica de actividad</h2>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-md"><div className="w-1.5 h-1.5 bg-[#C90A0A] rounded-full"></div><span className="text-[10px] font-bold">Emergencias</span></div>
            <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md"><div className="w-1.5 h-1.5 bg-[#0C3DC2] rounded-full"></div><span className="text-[10px] font-bold">Ciudadanas</span></div>
          </div>
        </div>
        <div style={{ width: '100%', height: 300, minHeight: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataGrafica} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorDen" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/><stop offset="95%" stopColor="#2563eb" stopOpacity={0}/></linearGradient>
                <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/><stop offset="95%" stopColor="#dc2626" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} width={40} tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: "12px", border: "none" }} />
              <Area type="monotone" dataKey="denuncias" stroke="#2563eb" strokeWidth={2} fillOpacity={1} fill="url(#colorDen)" />
              <Area type="monotone" dataKey="alertas" stroke="#dc2626" strokeWidth={2} fillOpacity={1} fill="url(#colorAlt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Tablas */}
      <div className="relative top-4 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Emergencias */}
        <div className="bg-white p-2 rounded-2xl shadow-md">
          <div className="flex justify-between items-start px-6 py-5 flex-col md:flex-row md:items-center mb-2">
            <h2 className="text-xl font-extrabold uppercase text-[#1e293b]">Emergencias Recientes</h2>
            
            <button onClick={() => navigate("/gestion-alertas", { state: { activeTab: "emergencia" } })} className="font-bold flex items-center gap-1.5 uppercase text-slate-400 hover:text-slate-500 text-[10px] tracking-wider transition-colors">Ver todo <FaChevronRight size={8} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-3">
              <tbody>
                {alertasPanico.length > 0 ? alertasPanico.map(item => {
                  const { nombres, apellidos } = dividirNombre(item.ciudadano);
                  return (
                    <tr key={item.id} className="bg-white hover:shadow-lg transition-all">
                      <td className="px-6 py-3 text-xs font-bold text-slate-400 rounded-l-xl">{item.id}</td>
                      <td className="px-8 py-3"><div className="flex items-center gap-3"><div className="w-6 h-8 bg-blue-50 text-[#0C3DC2] flex items-center justify-center font-black rounded-md">{item.ciudadano.charAt(0)}</div><span className="text-sm font-medium">{nombres} {apellidos}</span></div></td>
                      <td className="px-0"><span className="inline-flex px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-[#C90A0A] uppercase">{item.estado}</span></td>
                    </tr>
                  );
                }) : <tr><td colSpan="3" className="text-center py-6 text-slate-400 text-sm">No hay emergencias recientes</td></tr>}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alertas Ciudadanas */}
        <div className="bg-white p-2 rounded-2xl shadow-md">
          <div className="flex justify-between items-start px-6 py-5 flex-col md:flex-row md:items-center mb-2">
            <h2 className="text-xl font-extrabold uppercase text-[#1e293b]">Alertas Recibidas</h2>
            <button onClick={() => navigate("/gestion-alertas", { state: { activeTab: "ciudadana" } })} className="font-bold flex items-center gap-1.5 uppercase text-slate-400 hover:text-slate-500 text-[10px] tracking-wider transition-colors">Ver todo <FaChevronRight size={8} /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-y-3">
              <tbody>
                {alertasCiudadanas.length > 0 ? alertasCiudadanas.map(item => {
                  const { nombres, apellidos } = dividirNombre(item.ciudadano);
                  return (
                    <tr key={item.id} className="bg-white hover:shadow-lg transition-all">
                      <td className="px-6 py-3 text-xs font-bold text-slate-400 rounded-l-xl">{item.id}</td>
                      <td className="px-8 py-3"><div className="flex items-center gap-3"><div className="w-6 h-8 bg-blue-50 text-[#0C3DC2] flex items-center justify-center font-black rounded-md">{item.ciudadano.charAt(0)}</div><span className="text-sm font-medium">{nombres} {apellidos}</span></div></td>
                      <td className="px-0"><span className="inline-flex px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-[#EBB615] uppercase">{item.estado}</span></td>
                    </tr>
                  );
                }) : <tr><td colSpan="3" className="text-center py-6 text-slate-400 text-sm">No hay alertas ciudadanas recientes</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaFileAlt,
  FaCarSide,
  FaUserShield,
  FaExclamationCircle,
  FaSearchPlus,
  FaChevronRight,
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

function Dashboard() {
  const navigate = useNavigate();

  const dividirNombre = (nombreCompleto) => {
    const partes = nombreCompleto.trim().split(/\s+/);
    if (partes.length === 1) return { nombres: partes[0], apellidos: "" };
    if (partes.length === 2)
      return { nombres: partes[0], apellidos: partes[1] };
    const apellidos = partes.slice(-2).join(" ");
    const nombres = partes.slice(0, -2).join(" ");
    return { nombres, apellidos };
  };

  const [stats] = useState({
    totalAlertas: 24,
    resueltas: 42,
    patrullas: 18,
    oficiales: 42,
  });

  const [dataGrafica] = useState(() => {
    const diasSemana = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const dataTemporal = [];
    const hoy = new Date();
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(hoy.getDate() + i);
      dataTemporal.push({
        name: diasSemana[d.getDay()],
        denuncias: Math.floor(Math.random() * 40) + 10,
        alertas: Math.floor(Math.random() * 25) + 5,
      });
    }
    return dataTemporal;
  });

  const [alertasDePanico] = useState([
    {
      id: "REGE-0001",
      ciudadano: "Alex Cristhian Velarde Diaz",
      ubicacion: "-17.3896, -66.1552",
      estado: "Emergencia",
    },
    {
      id: "REGE-0002",
      ciudadano: "Armando Benjhamin Gutierrez Valencia",
      ubicacion: "-17.3896, -66.1552",
      estado: "Emergencia",
    },
    {
      id: "REGE-0003",
      ciudadano: "Melissa Angelica Moreno Fernandez",
      ubicacion: "-17.3896, -66.1552",
      estado: "Emergencia",
    },
  ]);

  const [denunciasRecientes] = useState([
    {
      id: "ALTC-0001",
      fecha: "21/04/2026 13:25",
      usuario: "Alex Cristhian Velarde Diaz",
      estado: "Verificación",
    },
    {
      id: "ALTC-0002",
      fecha: "21/04/2026 13:40",
      usuario: "Armando Benjhamin Gutierrez Valencia",
      estado: "Verificación",
    },
    {
      id: "ALTC-0003",
      fecha: "21/04/2026 14:10",
      usuario: "Juan Perez Mamani",
      estado: "Verificación",
    },
  ]);

  const statCards = [
    {
      label: "Alertas de Emergencia",
      value: stats.totalAlertas,
      icon: FaExclamationCircle,
      bgColor: "bg-red-50",
      borderColor: "border-[#C90A0A]",
      textColor: "text-[#C90A0A]",
      dotColor: "bg-[#C90A0A]",
      description: "ATENCIÓN INMEDIATA",
    },
    {
      label: "Alertas Ciudadanas",
      value: stats.resueltas,
      icon: FaUserShield,
      bgColor: "bg-blue-50",
      borderColor: "border-[#0C3DC2]",
      textColor: "text-[#0C3DC2]",
      dotColor: "bg-[#0C3DC2]",
      description: "EN VERIFICACIÓN",
    },
    {
      label: "Patrullas Activas",
      value: stats.patrullas,
      icon: FaCarSide,
      bgColor: "bg-yellow-50",
      borderColor: "border-[#EBB615]",
      textColor: "text-[#EBB615]",
      dotColor: "bg-[#EBB615]",
      description: "DESPLEGADAS",
    },
    {
      label: "Oficiales de Turno",
      value: stats.oficiales,
      icon: FaFileAlt,
      bgColor: "bg-green-50",
      borderColor: "border-[#088226]",
      textColor: "text-[#088226]",
      dotColor: "bg-[#088226]",
      description: "PERSONAL ACTIVO",
    },
  ];

  return (
    <div className="-mt-1 space-y-6 animate-fadeIn p-2">
      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-7">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-white p-3 shadow-md border-l-8 rounded-xl ${card.borderColor} hover:shadow-lg hover:scale-105 transition-all duration-300 z-10 hover:z-20`}
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
                  ></span>
                  <p className="ml-1 text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {card.description}
                  </p>
                </div>
              </div>
              <div
                className={`${card.bgColor} mr-3 p-2 rounded-full flex items-center justify-center`}
              >
                <span className={card.textColor}>
                  <card.icon size={18} />
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* GRÁFICA DE actividad */}
      <div className="p-6 relative top-2 bg-white rounded-2xl shadow-md">
        <div className="px-2 py-1 flex flex-col md:flex-row justify-between items-start md:items-center mb-2 gap-2">
          <h2 className="text-xl font-extrabold text-[#1e293b] uppercase tracking-wide flex items-center gap-2">
            Gráfica de actividad
          </h2>
          <div className="flex gap-3">
            <div className="flex items-center gap-1.5 bg-red-50 px-2 py-1 rounded-md border border-red-100">
              <div className="w-1.5 h-1.5 bg-[#C90A0A] rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-[#C90A0A] uppercase">
                Emergencias
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
              <div className="w-1.5 h-1.5 bg-[#0C3DC2] rounded-full animate-pulse"></div>
              <span className="text-[10px] font-bold text-[#0C3DC2] uppercase">
                Ciudadanas
              </span>
            </div>
          </div>
        </div>

        <div className="p-3 h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={dataGrafica}
              margin={{ top: 10, right: 0, left: -20, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorDen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1} />
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0} />
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
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "bold" }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={40}
                tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: "bold" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 5px 10px -3px rgba(0,0,0,0.1)",
                  fontSize: "12px",
                }}
              />
              <Area
                type="monotone"
                dataKey="denuncias"
                stroke="#2563eb"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorDen)"
              />
              <Area
                type="monotone"
                dataKey="alertas"
                stroke="#dc2626"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorAlt)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLAS DE REPORTES */}
      <div className="relative top-4 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* TABLA: Emergencias */}
        <div className="bg-white p-2 rounded-2xl shadow-md">
          <div className="flex justify-between items-start px-6 py-5 flex-col md:flex-row md:items-center mb-2 gap-2">
            <h2 className="text-xl font-extrabold uppercase tracking-wide text-[#1e293b] flex items-center gap-2">
              Emergencias Recientes
            </h2>
            <button
              onClick={() =>
                navigate("/gestion-alertas", {
                  state: { activeTab: "emergencia" },
                })
              }
              className="text-[10px] font-extrabold text-slate-400 hover:text-slate-500 transition-colors flex items-center gap-1.5 uppercase tracking-wider"
            >
              Ver todo <FaChevronRight size={8} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-separate border-spacing-y-3">
              <tbody>
                {alertasDePanico.slice(0, 3).map((item) => {
                  const { nombres, apellidos } = dividirNombre(item.ciudadano);
                  return (
                    <tr
                      key={item.id}
                      className="bg-white group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <td className="px-6 py-3 text-[12px] font-bold text-slate-400 border-y border-l rounded-l-xl border-gray-50 uppercase text-left align-top whitespace-nowrap w-[90px]">
                        {item.id}
                      </td>
                      <td className="px-8 py-3 border-y border-gray-50 text-left justify-start align-top leading-tight w-[230px]">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-8 rounded-md bg-blue-50 text-[#0C3DC2] flex items-center justify-center font-black text-sm shrink-0 shadow-inner">
                            {item.ciudadano.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 leading-tight">
                              {nombres} {apellidos}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-0 py-3 border-y border-gray-50 text-left align-top w-[110px]">
                        <span className="inline-flex justify-start w-max px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-[#C90A0A] shadow-sm uppercase tracking-wide">
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-1 py-3 border-y border-r rounded-r-xl border-gray-50 text-left align-top w-[60px]">
                        <button
                          onClick={() =>
                            navigate("/gestion-alertas", {
                              state: {
                                activeTab: "emergencia",
                                selectedId: item.id,
                              },
                            })
                          }
                          className="p-2 bg-[#0C3DC2] text-white rounded-lg shadow hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                        >
                          <FaSearchPlus size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLA: Alertas Ciudadanas */}
        <div className="bg-white p-2 rounded-2xl shadow-md">
          <div className="flex justify-between items-start px-6 py-5 flex-col md:flex-row md:items-center mb-2 gap-2">
            <h2 className="text-xl font-extrabold uppercase tracking-wide text-[#1e293b] flex items-center gap-2">
              Alertas Recibidas
            </h2>
            <button
              onClick={() =>
                navigate("/gestion-alertas", {
                  state: { activeTab: "ciudadana" },
                })
              }
              className="text-[10px] font-extrabold text-slate-400 hover:text-slate-500 transition-colors flex items-center gap-1.5 uppercase tracking-wider"
            >
              Ver todo <FaChevronRight size={8} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full table-fixed border-separate border-spacing-y-3">
              <tbody>
                {denunciasRecientes.slice(0, 3).map((item) => {
                  const { nombres, apellidos } = dividirNombre(item.usuario);
                  return (
                    <tr
                      key={item.id}
                      className="bg-white group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                    >
                      <td className="px-6 py-3 text-[12px] font-bold text-slate-400 border-y border-l rounded-l-xl border-gray-50 uppercase text-left align-top whitespace-nowrap w-[90px]">
                        {item.id}
                      </td>
                      <td className="px-8 py-3 border-y border-gray-50 text-left justify-start align-top leading-tight w-[230px]">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-8 rounded-md bg-blue-50 text-[#0C3DC2] flex items-center justify-center font-black text-sm shadow-inner shrink-0">
                            {item.usuario.charAt(0)}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-700 leading-tight">
                              {nombres} {apellidos}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-0 py-3 border-y border-gray-50 text-left align-top w-[110px]">
                        <span className="inline-flex justify-start w-max px-3 py-1.5 rounded-lg text-[10px] font-bold text-white bg-[#E6B109] shadow-sm uppercase tracking-wide">
                          {item.estado}
                        </span>
                      </td>
                      <td className="px-1 py-3 border-y border-r rounded-r-xl border-gray-50 text-left align-top w-[60px]">
                        <button
                          onClick={() =>
                            navigate("/gestion-alertas", {
                              state: {
                                activeTab: "ciudadana",
                                selectedId: item.id,
                              },
                            })
                          }
                          className="p-2 bg-[#0C3DC2] text-white rounded-lg shadow hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                        >
                          <FaSearchPlus size={12} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
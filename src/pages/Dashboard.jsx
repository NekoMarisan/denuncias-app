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
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function Dashboard() {
  const navigate = useNavigate();

  // Estadísticas (Simuladas)
  const [stats] = useState({
    totalAlertas: 24,
    resueltas: 42,
    patrullas: 18,
    oficiales: 42,
  });

  const [dataGrafica] = useState(() => {
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
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
    { id: "REGE-0001", ciudadano: "Alex Cristhian Velarde Diaz", ubicacion: "-17.3896, -66.1552", estado: "EMERGENCIA" },
    { id: "REGE-0002", ciudadano: "Armando Benjhamin Gutierrez Valencia", ubicacion: "-17.3896, -66.1552", estado: "EMERGENCIA" },
    { id: "REGE-0003", ciudadano: "Melissa Angelica Moreno Fernandez", ubicacion: "-17.3896, -66.1552", estado: "EMERGENCIA" },
  ]);

  const [denunciasRecientes] = useState([
    { id: "ALTC-0001", fecha: "21/04/2026 13:25", usuario: "Alex Cristhian Velarde Diaz", estado: "PENDIENTE" },
    { id: "ALTC-0002", fecha: "21/04/2026 13:40", usuario: "Armando Benjhamin Gutierrez Valencia", estado: "PENDIENTE" },
    { id: "ALTC-0003", fecha: "21/04/2026 14:10", usuario: "Juan Perez Mamani", estado: "PENDIENTE" },
  ]);

  const statCards = [
    { label: "Alertas de Emergencia", value: stats.totalAlertas, icon: FaExclamationCircle, bgColor: "bg-red-50", borderColor: "border-red-600", textColor: "text-red-600", dotColor: "bg-red-600", description: "ATENCIÓN INMEDIATA" },
    { label: "Alertas Ciudadanas", value: stats.resueltas, icon: FaUserShield, bgColor: "bg-blue-50", borderColor: "border-blue-600", textColor: "text-blue-600", dotColor: "bg-blue-600", description: "EN REVISIÓN" },
    { label: "Patrullas Activas", value: stats.patrullas, icon: FaCarSide, bgColor: "bg-yellow-50", borderColor: "border-yellow-500", textColor: "text-yellow-500", dotColor: "bg-yellow-500", description: "DESPLEGADAS" },
    { label: "Oficiales de Turno", value: stats.oficiales, icon:  FaFileAlt, bgColor: "bg-green-50", borderColor: "border-green-600", textColor: "text-green-600", dotColor: "bg-green-600", description: "PERSONAL ACTIVO" },
  ];

  return (
    <div className="-mt-3 space-y-10 animate-fadeIn p-2">
      
      {/* TARJETAS DE ESTADÍSTICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8w-full px-2 gap-6">
        {statCards.map((card, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className={`bg-white p-6 shadow-md border-l-8 rounded-2xl ${card.borderColor} hover:shadow-lg transition-all`}
          >
            <div className="flex justify-between items-center">
              <div>
                <p className={`font-extrabold text-[14px] uppercase tracking-widest ${card.textColor} mb-1`}>{card.label}</p>
                <p className="mt-3 text-4xl font-black text-slate-900">{card.value}</p>
                <div className="mt-5 flex items-center gap-2">
                  <span className={`inline-block w-2 h-2 rounded-full animate-pulse ${card.dotColor}`}></span>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">{card.description}</p>
                </div>
              </div>
              <div className={`${card.bgColor} p-4 rounded-full flex items-center justify-center`}>
                <span className={card.textColor}><card.icon size={26} /></span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* GRÁFICA DE TENDENCIAS */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tighter">Análisis de Actividad</h2>
            <p className="mt-1 text-[12px] font-semibold text-slate-400 uppercase tracking-widest">Reportes y Emergencias (Próximos 7 días)</p>
          </div>
          <div className="flex gap-3">
            <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
              <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
              <span className="text-[12px] font-bold text-blue-600 uppercase">Ciudadanas</span>
            </div>
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100">
              <div className="w-2 h-2 bg-red-600 rounded-full"></div>
              <span className="text-[12px] font-bold text-red-600 uppercase">Emergencias</span>
            </div>
          </div>
        </div>
        
        <div className="h-[330px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dataGrafica} margin={{ left: -20 }}>
              <defs>
                <linearGradient id="colorDen" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorAlt" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#dc2626" stopOpacity={0.1}/>
                  <stop offset="95%" stopColor="#dc2626" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 'bold'}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 13, fontWeight: 'bold'}} />
              <Tooltip contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }} />
              <Area type="monotone" dataKey="denuncias" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorDen)" />
              <Area type="monotone" dataKey="alertas" stroke="#dc2626" strokeWidth={3} fillOpacity={1} fill="url(#colorAlt)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* TABLAS DE REPORTES */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        
        {/* TABLA: Emergencias */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-red-50/20">
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <div className="bg-red-100 p-2 rounded-lg flex items-center justify-center"><FaExclamationCircle className="text-red-600" /></div>
              Emergencias Recientes
            </h2>
            <button 
              onClick={() => navigate("/gestion-alertas", { state: { activeTab: 'emergencia' } })} 
              className="text-[11px] font-black text-red-500 hover:text-red-700 transition-colors flex items-center gap-2 uppercase tracking-widest"
            >
              Ver todo <FaChevronRight size={10} />
            </button>
          </div>
          <div className="p-6">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <tbody>
                {alertasDePanico.slice(0, 3).map((item) => (
                  <tr key={item.id} className="group">
                    <td className="py-4 px-4 bg-gray-50 group-hover:bg-gray-100 transition-all duration-200 rounded-l-xl text-[13px] font-bold text-gray-400">{item.id}</td>
                    <td className="py-4 px-4 bg-gray-50 group-hover:bg-gray-100 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-11 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-base">{item.ciudadano.charAt(0)}</div>
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-slate-700">{item.ciudadano}</span>
                          <span className="text-[12px] text-gray-400 italic font-mono">{item.ubicacion}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 bg-gray-50 group-hover:bg-gray-100 transition-all duration-200">
                      <span className="bg-red-600 text-white px-4 py-2 rounded-lg text-[12px] font-semibold uppercase tracking-tighter">{item.estado}</span>
                    </td>
                    <td className="py-4 px-4 bg-gray-50 group-hover:bg-gray-100 transition-all duration-200 text-right rounded-r-xl">
                      <button 
                        onClick={() => navigate("/gestion-alertas", { state: { activeTab: 'emergencia', selectedId: item.id } })} 
                        className="p-4 bg-blue-600 text-white rounded-lg hover:scale-110 transition-all duration-300 shadow-md"
                      >
                        <FaSearchPlus size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* TABLA: Alertas Ciudadanas */}
        <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-blue-50/20">
            <h2 className="text-xl font-bold text-slate-800 uppercase tracking-tighter flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg flex items-center justify-center"><FaFileAlt className="text-blue-600" /></div>
              Alertas Recibidas
            </h2>
            <button 
              onClick={() => navigate("/gestion-alertas", { state: { activeTab: 'ciudadana' } })} 
              className="text-[11px] font-black text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-2 uppercase tracking-widest"
            >
              Ver todo <FaChevronRight size={10} />
            </button>
          </div>
          <div className="p-6">
            <table className="w-full text-left border-separate border-spacing-y-3">
              <tbody>
                {denunciasRecientes.slice(0, 3).map((item) => (
                  <tr key={item.id} className="group">
                    <td className="py-4 px-4 bg-gray-50 group-hover:bg-gray-100 transition-all duration-200 rounded-l-xl text-[13px] font-bold text-gray-400">{item.id}</td>
                    <td className="py-4 px-4 bg-gray-50 group-hover:bg-gray-100 transition-all duration-200">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-11 bg-blue-100 text-blue-700 rounded-lg flex items-center justify-center font-bold text-base">{item.usuario.charAt(0)}</div>
                        <div className="flex flex-col">
                          <span className="text-lg font-bold text-slate-700">{item.usuario}</span>
                          <span className="text-[12px] text-gray-400 italic font-mono">{item.fecha}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 bg-gray-50 group-hover:bg-gray-100 transition-all duration-200">
                      <span className="bg-purple-600 text-white px-4 py-2 rounded-lg text-[12px] font-semibold uppercase tracking-tighter">{item.estado}</span>
                    </td>
                    <td className="py-4 px-4 bg-gray-50 group-hover:bg-gray-100 transition-all duration-200 text-right rounded-r-xl">
                      <button 
                        onClick={() => navigate("/gestion-alertas", { state: { activeTab: 'ciudadana', selectedId: item.id } })} 
                        className="p-3 bg-blue-600 text-white rounded-lg hover:scale-110 transition-all duration-300 shadow-md"
                      >
                        <FaSearchPlus size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Dashboard;
import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { FaHome, FaBell, FaUsers, FaCog, FaSignOutAlt, FaExclamationCircle, FaPhone, FaEye, FaEdit, FaClock, FaCheckCircle, FaMapMarkerAlt, FaArrowLeft} 
from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation(); // Obtener la ruta actual
  
  // Datos de ejemplo (podrían venir de una API real)
  const [stats, setStats] = useState({
    totalAlertas: 42,
    activas: 24,
    enProceso: 12,
    resueltas: 6,
    pendientes: 18
  });

  // Datos de alertas de pánico recientes
  const [alertasRecientes] = useState([
    { 
      id: 1, 
      usuario: "Alex Velarde Diaz", 
      activacion: "02/01/2024 13:25", 
      ubicacion: "Av. Heroínas #456", 
      estado: "Emergencia",
    },
    { 
      id: 2, 
      usuario: "María González", 
      activacion: "10/10/2025 12:25", 
      ubicacion: "Calle Bolívar #123", 
      estado: "Emergencia",
    },
    { 
      id: 3, 
      usuario: "Carlos Ruiz", 
      activacion: "12/12/2025 15:23", 
      ubicacion: "Plaza 14 de Septiembre", 
      estado: "En Proceso",
    },
  ]);

  // Datos de denuncias recientes
  const [denunciasRecientes] = useState([
    { 
      id: 1, 
      fecha: "02/01/2024 13:25", 
      usuario: "Alex Velarde Diaz", 
      tipo: "Robo", 
      ubicacion: "Av. Principal #123", 
      estado: "Pendiente" 
    },
    { 
      id: 2, 
      fecha: "02/01/2024 10:15", 
      usuario: "Ana Torres", 
      tipo: "Agresión", 
      ubicacion: "Mercado La Cancha", 
      estado: "En proceso" 
    },
    { 
      id: 3, 
      fecha: "01/01/2024 20:45", 
      usuario: "Luis Mendoza", 
      tipo: "Vandalismo", 
      ubicacion: "Parque Central", 
      estado: "Resuelta" 
    },
  ]);

  // Función para determinar si un enlace está activo
  const isActive = (path) => {
    return location.pathname === path;
  };

  const handleCall = (telefono, usuario) => {
    if (window.confirm(`¿Llamar a ${usuario} al ${telefono}?`)) {
      window.location.href = `tel:${telefono}`;
    }
  };

  // Función para cerrar sesión
  const handleLogout = () => {
    if (window.confirm("¿Estás seguro de que deseas cerrar sesión?")) {
      // Aquí podrías agregar lógica adicional como:
      // 1. Limpiar tokens de autenticación
      // 2. Limpiar datos de usuario del localStorage/sessionStorage
      // 3. Cerrar conexiones de WebSocket, etc.
      
      // Redirigir a la página de login
      navigate("/login");
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-green-900 text-white flex flex-col p-4">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-lg font-semibold mt-2">SISTEMA POLICIAL 110</h1>
          <div className="mt-6 w-28 h-28 mb-3 rounded-full overflow-hidden border-0 border-white shadow-md">
            <img
              src="logo_of.png"
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <hr className="w-full border-t-2 border-green-700 my-4 mt-4" />
        </div>
        <nav className="flex flex-col gap-4">
          <Link to="/dashboard" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaHome /> Inicio
          </Link>
          <Link to="/denuncias" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaExclamationCircle /> Denuncias
          </Link>
          <Link to="/alertas-panico" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaBell /> Alertas de Pánico
          </Link>
          <Link to="/usuarios" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaUsers /> Usuarios
          </Link>
          <a href="#" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaCog /> Configuración
          </a>
        </nav>
        
        <div className="mt-auto">
          <button 
            onClick={handleLogout}
            className="w-full text-left flex items-center gap-3 hover:bg-green-700 p-2 rounded transition-colors"
          >
            <FaSignOutAlt /> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Contenido principal*/}
      <div className="flex-1 p-6">
        {/* Botón para volver al Dashboard (solo se muestra si no estamos en dashboard) */}
        {!isActive('/dashboard') && (
          <div className="mb-6">
            <button 
              onClick={() => navigate("/dashboard")}
              className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition"
            >
              <FaArrowLeft /> Volver al Dashboard
            </button>
          </div>
        )}
        
        {/* Mostrar título diferente según la página */}
        {isActive('/dashboard') ? (
          <h1 className="text-3xl font-bold mb-8">PANEL PRINCIPAL</h1>
        ) : (
          <h1 className="text-3xl font-bold mb-8">USUARIO</h1>
        )}
        
        {/* Cards de Estadísticas - Solo en dashboard */}
        {isActive('/dashboard') && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              {/* Alerta activas */}
              <div 
                className="bg-white p-6 rounded-xl shadow-lg border-l-8 border-red-600 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
                onClick={() => navigate("/alertas-panico")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-red-600 mt-1 font-bold">ALERTAS ACTIVAS</p>
                    <p className="text-4xl font-bold mt-3 text-gray-800">{stats.totalAlertas}</p>
                    <p className="text-sm text-gray-500 mt-5">Alertas de emergencia</p>
                  </div>
                  <div className="bg-red-100 p-3 rounded-full">
                    <FaBell className="text-red-600 text-3xl" />
                  </div>
                </div>
              </div>
              
              {/* pendiente */}
              <div 
                className="bg-white p-6 rounded-xl shadow-lg border-l-8 border-blue-600 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
                onClick={() => navigate("/alertas-panico")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-600 mt-1 font-bold">PENDIENTE</p>
                    <p className="text-4xl font-bold mt-3 text-gray-800">{stats.activas}</p>
                    <p className="text-sm text-gray-500 mt-5">Necesitan atención inmediata</p>
                  </div>
                  <div className="bg-blue-100 p-3 rounded-full">
                    <FaExclamationCircle className="text-blue-600 text-3xl" />
                  </div>
                </div>
              </div>
              
              {/* En Proceso */}
              <div 
                className="bg-white p-6 rounded-xl shadow-lg border-l-8 border-yellow-500 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
                onClick={() => navigate("/alertas-panico")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-yellow-500 mt-1 font-bold">EN PROCESO</p>
                    <p className="text-4xl font-bold mt-3 text-gray-800">{stats.enProceso}</p>
                    <p className="text-sm text-gray-600 mt-5">En atención actualmente</p>
                  </div>
                  <div className="bg-yellow-100 p-3 rounded-full">
                    <FaClock className="text-yellow-500 text-3xl" />
                  </div>
                </div>
              </div>

              {/* Resueltas */}
              <div 
                className="bg-white p-6 rounded-xl shadow-lg border-l-8 border-green-600 cursor-pointer hover:shadow-xl transition-all hover:scale-[1.02]"
                onClick={() => navigate("/alertas-panico")}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-600 mt-1 font-bold">RESUELTAS</p>
                    <p className="text-4xl font-bold mt-3 text-gray-800">{stats.resueltas}</p>
                    <p className="text-sm text-gray-500 mt-5">Resuelto satisfactoriamente</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded-full">
                    <FaCheckCircle className="text-green-600 text-3xl" />
                  </div>
                </div>
              </div>
            </div>

            {/* LISTA REGISTRO: Alertas de pánico */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  Alertas de Pánico Recientes
                </h2>
                <button 
                  onClick={() => navigate("/alertas-panico")}
                  className="text-green-600 hover:text-green-800 font-medium"
                >
                  Ver todas →
                </button>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 font-bold">ID</th>
                      <th className="p-3 font-bold">Usuario</th>
                      <th className="p-3 font-bold">Activación</th>
                      <th className="p-3 font-bold">Ubicación</th>
                      <th className="p-3 font-bold">Estado</th>
                      <th className="p-3 font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertasRecientes.map((alerta) => (
                      <tr key={alerta.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">#{alerta.id}</td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium">{alerta.usuario}</p>
                            <p className="text-xs text-gray-500">{alerta.telefono}</p>
                          </div>
                        </td>
                        <td className="p-3">{alerta.activacion}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <FaMapMarkerAlt className="text-red-500" />
                            <span>{alerta.ubicacion}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            alerta.estado === 'Emergencia' ? 'bg-red-500 text-white px-2 py-1.5 rounded-md text-xs font-semibold' :
                            alerta.estado === 'En Proceso' ? 'bg-yellow-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold' :
                            'bg-green-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold'
                          }`}>
                            {alerta.estado}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleCall(alerta.telefono, alerta.usuario)}
                              className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition"
                              title="Llamar"
                            >
                              <FaPhone />
                            </button>
                            <button 
                              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition"
                              title="Ver detalles"
                            >
                              <FaEye />
                            </button>
                            <button 
                              className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition"
                              title="Editar"
                            >
                              <FaEdit />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* LISTA REGISTRO: Denuncias recientes */}
            <div className="bg-white rounded-xl shadow-md p-4">
              <h2 className="text-xl font-bold mb-4 ">Denuncias Recientes</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left font-semibold">
                  <thead>
                    <tr className="border-b">
                      <th className="p-3 font-bold">ID</th>
                      <th className="p-3 font-bold">Fecha</th>
                      <th className="p-3 font-bold">Usuario</th>
                      <th className="p-3 font-bold">Tipo</th>
                      <th className="p-3 font-bold">Ubicación</th>
                      <th className="p-3 font-bold">Estado</th>
                      <th className="p-3 font-bold">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {denunciasRecientes.map((denuncia) => (
                      <tr key={denuncia.id} className="border-b hover:bg-gray-50">
                        <td className="p-3 font-medium">#{denuncia.id}</td>
                        <td className="p-3">{denuncia.fecha}</td>
                        <td className="p-3">{denuncia.usuario}</td>
                        <td className="p-3">
                          <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded-md text-sm font-medium">
                            {denuncia.tipo}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <FaMapMarkerAlt className="text-red-500" />
                            <span>{denuncia.ubicacion}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                            denuncia.estado === 'Pendiente' ? 'bg-blue-600 text-white px-3 py-1.5 rounded-md text-xs font-semibold' :
                            denuncia.estado === 'En proceso' ? 'bg-yellow-500 text-white px-3 py-1.5 rounded-md text-xs font-semibold' :
                            'bg-green-600 text-white px-4 py-1.5 rounded-md text-xs font-semibold'
                          }`}>
                            {denuncia.estado}
                          </span>
                        </td>
                        <td className="p-3">
                          <div className="flex gap-2">
                            <button className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition">
                              <FaPhone />
                            </button>
                            <button className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition">
                              <FaEye />
                            </button>
                            <button className="bg-yellow-500 hover:bg-yellow-600 text-white p-2 rounded-lg transition">
                              <FaEdit />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
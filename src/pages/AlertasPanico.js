import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaBell, FaUsers, FaCog, FaSignOutAlt, FaExclamationCircle, FaArrowLeft, FaPhone, FaEye, FaCheckCircle, FaMapMarkerAlt, FaClock, FaUser, FaFilter, FaSearch } from "react-icons/fa";

const AlertasPanico = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-green-900 text-white flex flex-col p-4">
<div className="flex flex-col items-center mb-8">
  <h1 className=" text-lg font-semibold mt-2">SISTEMA POLICIAL</h1>
  {/* Contenedor circular */}
  <div className="mt-6 w-28 h-28 mb-3 rounded-full overflow-hidden border-0 border-white shadow-md">
    <img
      src="logo_of.png"
      alt="Logo"
      className="w-full h-full object-cover"
    />
  </div>

  {/*linea divisora */}
<hr className="w-full border-t-2 border-green-700 my-4 mt-4" />
</div>
        {/* Perfil superior derecho */}
        <div className="absolute right-6 top-6 bg-white shadow-md px-4 py-2 rounded-md flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold">
            A
          </div>
          <div>
            <p className="font-semibold text-gray-800">Administrador</p>
            <p className="text-sm text-gray-500">admin@denuncias.com</p>
          </div>
        </div>
        <nav className="flex flex-col gap-4">
          <Link to="/dashboard" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaHome /> Inicio
          </Link>
          <a href="#" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaExclamationCircle /> Denuncias
          </a>
          
          <Link to="/alertas-panico" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaBell /> Alertas de Pánico
          </Link>
          <a href="#" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaUsers /> Usuarios
          </a>
          <a href="#" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaCog /> Configuración
          </a>
        </nav>

        <div className="mt-auto">
          <a href="#" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaSignOutAlt /> Cerrar Sesión
          </a>
        </div>
      </aside>

      {/* Contenido Principal */}
      <div className="flex-1 p-6">
        {/* Botón para volver al Dashboard */}
        <div className="mb-6">
          <button 
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <FaArrowLeft /> Volver al Dashboard
          </button>
        </div>

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900"> ALERTAS DE PÁNICOS</h1>
            <p className="text-gray-600 mt-1 flex items-center gap-2">
            </p>
          </div>
        </div>
        {/* Barra de Búsqueda */}
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por usuario, ubicación o ID..."
                  className="w-full pl-10 pr-4 py-2 border rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                <FaFilter /> Filtrar
              </button>
              <select className="border rounded-lg px-4 py-2">
                <option>Estado: Todos</option>
                <option>Activo</option>
                <option>En Proceso</option>
                <option>Resuelto</option>
              </select>
            </div>
          </div>
        </div>

        {/* Mapa y Lista */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mapa Grande */}
          <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-500" /> Mapa de Alertas
              </h2>
              <div className="flex gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="text-sm">Activas</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span className="text-sm">En Proceso</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="text-sm">Resueltas</span>
                </div>
              </div>
            </div>
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="h-96 bg-gradient-to-br from-blue-50 to-gray-100 flex items-center justify-center">
                <div className="text-center">
                  <FaMapMarkerAlt className="text-5xl text-red-500 mx-auto mb-4 animate-pulse" />
                  <p className="text-xl font-semibold text-gray-700">Mapa en Tiempo Real</p>
                  <p className="text-gray-600 mt-2">Visualización de alertas activas en el mapa</p>
                  <p className="text-sm text-gray-500 mt-1">(Integrar Google Maps o Mapbox aquí)</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de Alertas */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-4 border-b">
              <h2 className="text-xl font-bold">Alertas Recientes</h2>
            </div>
            <div className="overflow-y-auto max-h-96">
              {[
                { id: 21, user: "Alex Velarde Diaz", time: "02/01/2024 13:25", status: "active", location: "Av. Principal #123" },
                { id: 22, user: "María González", time: "Hace 5 min", status: "active", location: "Zona Centro" },
                { id: 23, user: "Carlos Ruiz", time: "Hace 12 min", status: "process", location: "Plaza Mayor" },
                { id: 24, user: "Ana Torres", time: "Hace 25 min", status: "resolved", location: "Parque Central" },
                { id: 25, user: "Luis Mendoza", time: "Hace 40 min", status: "active", location: "Mercado Municipal" },
              ].map((alert) => (
                <div key={alert.id} className="p-4 border-b hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="flex items-center gap-2">
                        <FaUser className="text-gray-400" />
                        <span className="font-semibold">{alert.user}</span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          alert.status === 'active' ? 'bg-red-100 text-red-800' :
                          alert.status === 'process' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {alert.status === 'active' ? 'Activo' : 
                           alert.status === 'process' ? 'En Proceso' : 'Resuelto'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">ID: #{alert.id}</p>
                      <p className="text-sm text-gray-500">📍 {alert.location}</p>
                      <p className="text-xs text-gray-400 mt-1">🕒 {alert.time}</p>
                    </div>
                    <button className="text-blue-500 hover:text-blue-700">
                      <FaEye />
                    </button>
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white py-2 rounded text-sm">
                      <FaPhone /> Llamar
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded text-sm">
                      <FaCheckCircle /> Atender
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertasPanico;
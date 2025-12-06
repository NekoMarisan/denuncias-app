import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaBell, FaUsers, FaCog, FaSignOutAlt, FaExclamationCircle, FaPhone, FaEye, FaEdit, FaClock, FaCheckCircle } from "react-icons/fa";

function Dashboard() {
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
          <Link to="/usuarios" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaUsers /> Usuarios
          </Link>
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

      {/* Main content */}
      <div className="flex-1 p-6 mt-4">
        <h1 className="text-3xl font-bold mb-8">ADMINISTRADOR</h1>

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


        {/* Cards de Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div 
            className="bg-white p-4 rounded-xl shadow border-l-8 border-red-600 cursor-pointer hover:shadow-xl transition-shadow" 
            onClick={() => navigate("/alertas-panico")}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-red-600">ALERTAS ACTIVAS</p>
                <p className="text-4xl font-bold mt-2 text-gray-800">42</p>
              </div>
              <FaBell className="text-red-600 text-2xl ml-auto" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow border-l-8 border-yellow-500 cursor-pointer hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-yellow-500">EN PROCESO</p>
                <p className="text-4xl font-bold mt-2 text-gray-800">24</p>
              </div>
              <FaClock className="text-yellow-500 text-2xl ml-auto" />
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-xl shadow border-l-8 border-green-600 cursor-pointer hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-green-600">RESUELTOS</p>
                <p className="text-4xl font-bold mt-2 text-gray-800">42</p>
              </div>
              <FaCheckCircle className="text-green-600 text-2xl ml-auto" />
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl shadow border-l-8 border-blue-600 cursor-pointer hover:shadow-xl transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-blue-600">PENDIENTE</p>
                <p className="text-4xl font-bold mt-2 text-gray-800">18</p>
              </div>
              <FaClock className="text-blue-600 text-2xl ml-auto" />
            </div>
          </div>
        </div>

        {/* LISTA REGISTRO: Alertas de pánico */}
        <div className="bg-white mt-8 rounded shadow-md p-4 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 
              className="text-xl font-bold cursor-pointer hover:text-blue-600"
              onClick={() => navigate("/alertas-panico")}
            >
              Alertas de Pánico Recientes
            </h2>
          </div>
          
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b p-3 font-bold">ID</th>
                <th className="border-b p-3 font-bold">Usuario</th>
                <th className="border-b p-3 font-bold">Activación</th>
                <th className="border-b p-3 font-bold">Ubicación</th>
                <th className="border-b p-3 font-bold">Estado</th>
                <th className="border-b p-3 font-bold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="p-2">#1</td>
                <td className="p-2">Alex Velarde Diaz</td>
                <td className="p-2">02/01/2024 13:25</td>
                <td className="p-2">Av. Principal #123</td>
                <td className="p-2">
                  <span className="bg-red-500 text-white px-2 py-1.5 rounded text-xs">Emergencia</span>
                </td>
                <td className="p-2 flex gap-2">
                  <button className="bg-green-500 p-2 hover:bg-green-600 text-white rounded"><FaPhone /></button>
                  <button className="bg-blue-500 p-2 hover:bg-blue-600 text-white rounded"><FaEye /></button>
                  <button className="bg-yellow-500 p-2 hover:bg-yellow-600 text-white rounded"><FaEdit /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* LISTA REGISTRO: Denuncias recientes */}
        <div className="bg-white rounded shadow-md p-4">
          <h2 className="text-xl font-bold mb-4">Denuncias Recientes</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b p-2">ID</th>
                <th className="border-b p-2">Fecha</th>
                <th className="border-b p-2">Usuario</th>
                <th className="border-b p-2">Tipo</th>
                <th className="border-b p-2">Ubicación</th>
                <th className="border-b p-2">Estado</th>
                <th className="border-b p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="p-2">#1</td>
                <td className="p-2">02/01/2024 13:25</td>
                <td className="p-2">Alex Velarde Diaz</td>
                <td className="p-2">Robo</td>
                <td className="p-2">Av. Principal #123</td>
                <td className="p-2">
                  <span className="bg-blue-500 text-white px-2.5 py-1.5 rounded text-xs">Pendiente</span>
                </td>
                <td className="p-2 flex gap-2">
                  <button className="bg-green-500 p-2 hover:bg-green-600 text-white rounded"><FaPhone /></button>
                  <button className="bg-blue-500 p-2 hover:bg-blue-600 text-white rounded"><FaEye /></button>
                  <button className="bg-yellow-500 p-2 hover:bg-yellow-600 text-white rounded"><FaEdit /></button>
                </td>
              </tr>
            </tbody>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="p-2">#1</td>
                <td className="p-2">02/01/2024 13:25</td>
                <td className="p-2">Alex Velarde Diaz</td>
                <td className="p-2">Robo</td>
                <td className="p-2">Av. Principal #123</td>
                <td className="p-2">
                  <span className="bg-orange-500 text-white px-2.5 py-1.5 rounded text-xs">En proceso</span>
                </td>
                <td className="p-2 flex gap-2">
                  <button className="bg-green-500 p-2 hover:bg-green-600 text-white rounded"><FaPhone /></button>
                  <button className="bg-blue-500 p-2 hover:bg-blue-600 text-white rounded"><FaEye /></button>
                  <button className="bg-yellow-500 p-2 hover:bg-yellow-600 text-white rounded"><FaEdit /></button>
                </td>
              </tr>
            </tbody>            
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
import React from "react";
import { Link } from "react-router-dom";
import { FaHome, FaBell, FaUsers, FaCog, FaSignOutAlt, FaPhone, FaEye, FaEdit } from "react-icons/fa";

const Dashboard = () => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-green-800 text-white flex flex-col">
        <div className="flex items-center justify-center h-24 border-b border-green-600">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/0/0d/Escudo_de_Bolivia.svg/1200px-Escudo_de_Bolivia.svg.png"
            alt="Logo"
            className="w-16 h-16 rounded-full"
          />
        </div>
        <nav className="flex-1 p-4 space-y-3">
          <a href="#" className="flex items-center gap-2 hover:bg-green-700 p-2 rounded">
            <FaHome /> Inicio
          </a>
          <a href="#" className="flex items-center gap-2 hover:bg-green-700 p-2 rounded">
            <FaBell /> Denuncias
          </a>
          <Link to="/admin" className="flex items-center gap-2 hover:bg-green-700 p-2 rounded">
            <FaBell /> Alertas de Pánico
          </Link>
          <a href="#" className="flex items-center gap-2 hover:bg-green-700 p-2 rounded">
            <FaUsers /> Usuarios
          </a>
          <a href="#" className="flex items-center gap-2 hover:bg-green-700 p-2 rounded">
            <FaCog /> Configuración
          </a>
        </nav>
        <div className="p-4 border-t border-green-600">
          <a href="#" className="flex items-center gap-2 hover:bg-green-700 p-2 rounded">
            <FaSignOutAlt /> Cerrar Sesión
          </a>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 p-6">
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

        {/* Cards - CON BORDES DE COLORES a la izquierda */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* EN PROCESO - Borde amarillo */}
          <div className="card-proceso bg-white p-6 rounded-lg shadow-md border-l-4 border-yellow-500">
            <div className="flex items-start mb-4">
              <span className="text-2x2 mr-3 text-yellow-500">│</span>
              <div>
                <p className="font-bold text-yellow-500">EN PROCESO</p>
                <p className="text-4xl font-bold mt-2 text-gray-800">24</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 border-t pt-3">+3 con respecto a ayer</p>
          </div>
          
          {/* PENDIENTE - Borde azul */}
          <div className="card-proceso bg-white p-6 rounded-lg shadow-md border-l-4 border-blue-500">
            <div className="flex items-start mb-4">
              <span className="text-2x2 mr-3 text-blue-500">│</span>
              <div>
                <p className="font-bold text-blue-600">PENDIENTE</p>
                <p className="text-4xl font-bold mt-2 text-gray-800">18</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 border-t pt-3">+3 con respecto a ayer</p>
          </div>
          
          {/* RESUELTOS - Borde verde */}
          <div className="card-proceso bg-white p-6 rounded-lg shadow-md border-l-4 border-green-500">
            <div className="flex items-start mb-4">
              <span className="text-2x2 mr-3 text-green-500">│</span>
              <div>
                <p className="font-bold text-green-600">RESUELTOS</p>
                <p className="text-4xl font-bold mt-2 text-gray-800">42</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 border-t pt-3">Esta semana</p>
          </div>
          
          {/* ALERTA DE PÁNICO - Borde rojo */}
          <div className="card-proceso bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
            <div className="flex items-start mb-4">
              <span className="text-2x2 mr-3 text-red-500">│</span>
              <div>
                <p className="font-bold text-red-600">ALERTA DE PÁNICO</p>
                <p className="text-4xl font-bold mt-2 text-gray-800">42</p>
              </div>
            </div>
            <p className="text-sm text-gray-500 border-t pt-3">Esta semana</p>
          </div>
        </div>

        {/* Alertas de pánico */}
        <div className="bg-white rounded shadow p-4 mb-6">
          <h2 className="text-xl font-bold mb-4">Alertas de Pánico Recientes</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b p-2">ID</th>
                <th className="border-b p-2">Usuario</th>
                <th className="border-b p-2">Activación</th>
                <th className="border-b p-2">Ubicación</th>
                <th className="border-b p-2">Estado</th>
                <th className="border-b p-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-gray-50">
                <td className="p-2">#21</td>
                <td className="p-2">Alex Velarde Diaz</td>
                <td className="p-2">02/01/2024 13:25</td>
                <td className="p-2">Av. Principal #123</td>
                <td className="p-2">
                  <span className="bg-red-500 text-white px-2 py-1 rounded text-xs">Emergencia</span>
                </td>
                {/**/}
                <td className="p-2 flex gap-2">
                  <button className="bg-green-500 p-2 text-white rounded"><FaPhone /></button>
                  <button className="bg-blue-500 p-2 text-white rounded"><FaEye /></button>
                  <button className="bg-yellow-500 p-2 text-white rounded"><FaEdit /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Denuncias recientes */}
        <div className="bg-white rounded shadow p-4">
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
              <tr className="hover:bg-gray-50">
                <td className="p-2">#21</td>
                <td className="p-2">02/01/2024 13:25</td>
                <td className="p-2">Alex Velarde Diaz</td>
                <td className="p-2">Robo</td>
                <td className="p-2">Av. Principal #123</td>
                <td className="p-2">
                  <span className="bg-blue-500 text-white px-2 py-1 rounded text-xs">Pendiente</span>
                </td>
                <td className="p-2 flex gap-2">
                  <button className="bg-green-500 p-2 text-white rounded"><FaPhone /></button>
                  <button className="bg-blue-500 p-2 text-white rounded"><FaEye /></button>
                  <button className="bg-yellow-500 p-2 text-white rounded"><FaEdit /></button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
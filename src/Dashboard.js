import React from "react";
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
          <a href="#" className="flex items-center gap-2 hover:bg-green-700 p-2 rounded">
            <FaBell /> Alertas de Pánico
          </a>
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
        <h1 className="text-3xl font-bold mb-6">ADMINISTRADOR</h1>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 p-4 rounded shadow">
            <p className="font-bold text-yellow-800">EN PROCESO</p>
            <p className="text-3xl font-bold">24</p>
          </div>
          <div className="bg-blue-100 border-l-4 border-blue-500 p-4 rounded shadow">
            <p className="font-bold text-blue-800">PENDIENTE</p>
            <p className="text-3xl font-bold">18</p>
          </div>
          <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded shadow">
            <p className="font-bold text-green-800">RESUELTOS</p>
            <p className="text-3xl font-bold">42</p>
          </div>
          <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded shadow">
            <p className="font-bold text-red-800">ALERTA DE PÁNICO</p>
            <p className="text-3xl font-bold">42</p>
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

import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaHome, FaBell, FaUsers, FaCog, FaSignOutAlt,   FaExclamationCircle, FaArrowLeft, FaUserPlus, FaEdit, FaTrash, FaSearch, FaFilter, FaCheckCircle, FaTimesCircle, FaEye} 
from "react-icons/fa";

function Usuarios() {
const navigate = useNavigate();

  // Datos de ejemplo de usuarios
const usuarios = [
    { id: 1, nombre: "Juan Pérez", email: "juan@ejemplo.com", rol: "Oficial", activo: true, fechaRegistro: "15/01/2024" },
    { id: 2, nombre: "María López", email: "maria@ejemplo.com", rol: "Supervisor", activo: true, fechaRegistro: "10/01/2024" },
    { id: 3, nombre: "Carlos Ruiz", email: "carlos@ejemplo.com", rol: "Administrador", activo: true, fechaRegistro: "05/01/2024" },
    { id: 4, nombre: "Ana Torres", email: "ana@ejemplo.com", rol: "Oficial", activo: false, fechaRegistro: "03/01/2024" },
    { id: 5, nombre: "Luis Mendoza", email: "luis@ejemplo.com", rol: "Operador", activo: true, fechaRegistro: "20/12/2023" },
    { id: 6, nombre: "Sofía Castro", email: "sofia@ejemplo.com", rol: "Oficial", activo: true, fechaRegistro: "18/12/2023" },
    { id: 7, nombre: "Roberto Jiménez", email: "roberto@ejemplo.com", rol: "Supervisor", activo: true, fechaRegistro: "12/12/2023" },
    { id: 8, nombre: "Patricia Rios", email: "patricia@ejemplo.com", rol: "Operador", activo: false, fechaRegistro: "05/12/2023" },
    { id: 9, nombre: "Juan Pérez", email: "juan@ejemplo.com", rol: "Oficial", activo: true, fechaRegistro: "15/01/2024" },
    { id: 10, nombre: "María López", email: "maria@ejemplo.com", rol: "Supervisor", activo: true, fechaRegistro: "10/01/2024" },
];

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

      {/* Contenido principal*/}
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
        <h1 className="text-3xl font-bold mb-8">ALERTAS ACTIVAS</h1>

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

        {/* Barra de búsqueda y acciones */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar usuario por nombre o email..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                  focus:ring-green-700 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg 
              hover:bg-gray-50">
                <FaFilter /> Filtrar
              </button>
              <select className="border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 
              focus:ring-green-700">
                <option>Rol: Todos</option>
                <option>Administrador</option>
                <option>Supervisor</option>
                <option>Oficial</option>
                <option>Operador</option>
              </select>
              <button className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg">
                <FaUserPlus /> Nuevo Usuario
              </button>
            </div>
          </div>
        </div>

        {/* Tabla de Usuarios */}
        <div className="bg-white rounded shadow-md p-4">
          <h2 className="text-xl font-bold mb-4">Usuarios</h2>
          <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr>
                <th className="border-b p-2">ID</th>
                <th className="border-b p-2">Nombre</th>
                <th className="border-b p-2">E-mail</th>
                <th className="border-b p-2">Rol</th>
                <th className="border-b p-2">Estado</th>
                <th className="border-b p-2">Registro</th>
                <th className="border-b p-2">Acciones</th>
              </tr>
            </thead>
<tbody>
  {usuarios.map((usuario) => (
    <tr key={usuario.id} className="border-b text-gray-600">
      <td className="p-4 ">#{usuario.id}</td>
      <td className="p-4 ">{usuario.nombre}</td>
      <td className="p-4 ">{usuario.email}</td>
      
      {/* Rol con color fuerte */}
      <td className="p-4">
        <span className={`px-3 py-1 rounded text-xs text-gray-600 ${
          usuario.rol === 'Administrador' ? 'bg-purple-700 text-white' :
          usuario.rol === 'Supervisor' ? 'bg-blue-700 text-white' :
          usuario.rol === 'Oficial' ? 'bg-green-600 text-white' :
          usuario.rol === 'Operador' ? 'bg-yellow-500 text-white' :
          'bg-gray-800 text-white'
        }`}>
          {usuario.rol}
        </span>
      </td>
      
      {/* Estado simple */}
      <td className="p-4">
        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${
            usuario.activo ? 'hover:bg-gray-50' : 'hover:bg-gray-50'
          }`}>
            {usuario.activo ? 'Activo' : 'Inactivo'}
          </span>
          {usuario.activo ? 
            <FaCheckCircle className="text-green-600" /> : 
            <FaTimesCircle className="text-red-600" />
          }
        </div>
      </td>
      
      <td className="p-4 text-gray-600">{usuario.fechaRegistro}</td>
      
      {/* Acciones */}
<td className="p-2 flex gap-2">
  <button className="bg-blue-500 p-2 hover:bg-blue-600 text-white rounded"><FaEye /></button>
  <button className="bg-yellow-500 p-2 hover:bg-yellow-600 text-white rounded"><FaEdit /></button>
  <button className="bg-red-500 p-2 hover:bg-red-600 text-white rounded"><FaTrash /></button>
</td>
    </tr>
  ))}
</tbody>
            </table>
          </div>
        </div>

        {/* Paginación */}
        <div className="mt-6 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            Mostrando 1-{usuarios.length} de {usuarios.length} usuarios
          </div>
          <div className="flex gap-2">
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Anterior
            </button>
            <button className="px-4 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800">
              1
            </button>
            <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Usuarios;
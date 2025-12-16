import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FaHome, FaBell, FaUsers, FaCog, FaSignOutAlt,  FaExclamationCircle, FaArrowLeft, FaPhone, FaEye,  FaEdit, FaClock, FaCheckCircle, FaMapMarkerAlt,   FaUser, FaSearch, FaFilter, FaFileExport,
  FaDownload, FaPrint, FaFilePdf, FaFileExcel, FaTrash
} from "react-icons/fa";

function Denuncias() {
  const navigate = useNavigate();
  
  // Estados para filtros
  const [filtroMes, setFiltroMes] = useState("Este mes");
  const [filtroEstado, setFiltroEstado] = useState("En proceso");
  const [filtroTipo, setFiltroTipo] = useState("Todo");
  const [busqueda, setBusqueda] = useState("");
  
  // Datos de denuncias
  const [denuncias] = useState([
    { 
      id: 1, 
      usuario: "Alex Velarde Diaz", 
      activacion: "02/01/2024 13:25", 
      ubicacion: "Av. Principal #123", 
      estado: "En proceso", 
      telefono: "+59170000001", // Agregado campo de teléfono simulado
      acciones: ["ver", "llamar", "editar", "eliminar"]
    },
    { 
      id: 2, 
      usuario: "Benjhamin Torrez Aranibar", 
      activacion: "12/05/2024 16:24", 
      ubicacion: "Av. Norte #789", 
      estado: "Pendiente", 
      telefono: "+59170000002", // Agregado campo de teléfono simulado
      acciones: ["ver", "llamar", "editar", "eliminar"]
    },
    { 
      id: 3, 
      usuario: "Marcos Daniel Valencia Torrez", 
      activacion: "10/06/2024 14:00", 
      ubicacion: "Av. Circunvalación #57", 
      estado: "Resuelto", 
      telefono: "+59170000003", // Agregado campo de teléfono simulado
      acciones: ["ver", "llamar", "editar", "eliminar"]
    },
    { 
      id: 4, 
      usuario: "Ana María Gonzales", 
      activacion: "15/06/2024 09:15", 
      ubicacion: "Calle Sucre #456", 
      estado: "En proceso", 
      telefono: "+59170000004", // Agregado campo de teléfono simulado
      acciones: ["ver", "llamar", "editar", "eliminar"]
    },
    { 
      id: 5, 
      usuario: "Carlos Fernando Mendez", 
      activacion: "18/06/2024 11:30", 
      ubicacion: "Av. Blanco Galindo #789", 
      estado: "Resuelto", 
      telefono: "+59170000005", // Agregado campo de teléfono simulado
      acciones: ["ver", "llamar", "editar", "eliminar"]
    },
    { 
      id: 6, 
      usuario: "Laura Patricia Vargas", 
      activacion: "20/06/2024 16:45", 
      ubicacion: "Plaza Colón #321", 
      estado: "Pendiente", 
      telefono: "+59170000006", // Agregado campo de teléfono simulado
      acciones: ["ver", "llamar", "editar", "eliminar"]
    },
    { 
      id: 7, 
      usuario: "Roberto Antonio Cruz", 
      activacion: "22/06/2024 14:20", 
      ubicacion: "Calle Jordán #654", 
      estado: "En proceso", 
      telefono: "+59170000007", // Agregado campo de teléfono simulado
      acciones: ["ver", "llamar", "editar", "eliminar"]
    },
    { 
      id: 8, 
      usuario: "Sofia Isabel Rojas", 
      activacion: "25/06/2024 10:10", 
      ubicacion: "Av. América #987", 
      estado: "Pendiente", 
      telefono: "+59170000008", // Agregado campo de teléfono simulado
      acciones: ["ver", "llamar", "editar", "eliminar"]
    },
  ]);

  // Estados para manejar acciones
  const [alertasActivas] = useState(denuncias.length);
  
  const handleCall = (telefono, usuario) => {
    // Simulación - en producción aquí iría el teléfono real
    if (window.confirm(`¿Llamar a ${usuario}? Teléfono: ${telefono}`)) {
      window.location.href = `tel:${telefono}`;
    }
  };

  const handleView = (denunciaId) => {
    alert(`Ver detalles de denuncia #${denunciaId}`);
  };

  const handleEdit = (denunciaId) => {
    alert(`Editar denuncia #${denunciaId}`);
  };

  const handleDelete = (denunciaId) => {
    if (window.confirm(`¿Está seguro de eliminar la denuncia #${denunciaId}?`)) {
      alert(`Denuncia #${denunciaId} eliminada`);
    }
  };

  const handleExport = () => {
    alert("Exportando denuncias...");
  };

  // Filtrar denuncias basadas en la búsqueda
  const denunciasFiltradas = denuncias.filter(denuncia => 
    denuncia.usuario.toLowerCase().includes(busqueda.toLowerCase()) ||
    denuncia.ubicacion.toLowerCase().includes(busqueda.toLowerCase()) ||
    denuncia.id.toString().includes(busqueda)
  );

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar - SIN CAMBIOS */}
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
          <Link to="/denuncias" className="flex items-center gap-3 bg-green-700 p-2 rounded"> {/* Marcado como activo */}
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
          <a href="#" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaSignOutAlt /> Cerrar Sesión
          </a>
        </div>
      </aside>

      {/* Contenido principal - SIN CAMBIOS EN CABECERAS/FILTROS */}
      <div className="flex-1 p-6">
        {/* Perfil superior derecho */}
        <div className="absolute right-6 top-6 bg-white shadow-md px-4 py-2 rounded-md flex items-center gap-3 z-10">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold">
            A
          </div>
          <div>
            <p className="font-semibold text-gray-800">Administrador</p>
            <p className="text-sm text-gray-500">admin@denuncias.com</p>
          </div>
        </div>

        {/* Botón para volver al Dashboard */}
        <div className="mb-6 mt-16 md:mt-0">
          <button 
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <FaArrowLeft /> Volver al Dashboard
          </button>
        </div>

        {/* Encabezado */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold">GESTIÓN DE DENUNCIAS</h1>
        </div>

        {/* Barra de acciones y filtros */}
        <div className="bg-white p-4 rounded-xl shadow-md mb-6">
          <div className="flex flex-col lg:flex-row gap-4 justify-between items-center">
            {/* Botón de Exportar */}
            <div className="flex items-center gap-4">
              <button 
                onClick={handleExport}
                className="flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium"
              >
                <FaFileExport /> Exportar
              </button>
            </div>

            {/* Filtros */}
            <div className="flex flex-wrap gap-2 items-center">
              <span className="text-base font-medium text-gray-700">Filtrado por |</span>
              
              <select 
                value={filtroMes}
                onChange={(e) => setFiltroMes(e.target.value)}
                className="border text-base font-normal border-gray-300 rounded px-3 py-1"
              >
                <option>Este mes</option>
                <option>Última semana</option>
                <option>Último trimestre</option>
                <option>Este año</option>
              </select>

              <span className=" text-base font-medium text-gray-700">| Estado:</span>
              
              <select 
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="border text-base font-normal border-gray-300 rounded px-3 py-1"
              >
                <option>En proceso</option>
                <option>Pendiente</option>
                <option>Resuelto</option>
                <option>Todos</option>
              </select>

              <span className="text-base font-medium text-gray-700">| Tipos:</span>
              
              <select 
                value={filtroTipo}
                onChange={(e) => setFiltroTipo(e.target.value)}
                className="border text-base font-normal border-gray-300 rounded px-3 py-1"
              >
                <option>Todo</option>
                <option>Robo</option>
                <option>Agresión</option>
                <option>Vandalismo</option>
                <option>Hurto</option>
                <option>Otros</option>
              </select>
            </div>
          </div>

          {/* Barra de búsqueda */}
          <div className="mt-4">
            <div className="relative">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar denuncia o usuario..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                focus:ring-green-700 focus:border-transparent"
              />
            </div>
          </div>
        </div>
        {/* Tabla de Denuncias */}
        <div className="bg-white rounded-xl shadow-md p-4">
          <h2 className="text-xl font-bold mb-4 ">Denuncias</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-semibold">
              <thead>
                <tr className="border-b">
                  <th className="p-4 text-left font-bold">ID</th>
                  <th className="p-4 text-left font-bold">Usuario</th>
                  <th className="p-4 text-left font-bold">Activación</th>
                  <th className="p-4 text-left font-bold">Ubicación</th>
                  <th className="p-4 text-left font-bold">Estado</th>
                  <th className="p-4 text-left font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {/* Comprobar si hay denuncias para renderizar filas */}
                {denunciasFiltradas.length > 0 ? (
                  denunciasFiltradas.map((denuncia, index) => (
                    <tr 
                      key={denuncia.id} 
                      className={`border-b border-gray-200 hover:bg-gray-50`}
                    >
                      <td className="p-3 font-medium text-gray-800">#{denuncia.id}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium">{denuncia.usuario}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-3 font-normal">
                        <div className="flex items-center gap-2">
                          <span>{denuncia.activacion}</span>
                        </div>
                      </td>
                      <td className="p-4 font-normal">
                        <div className="flex items-center gap-2">
                          <FaMapMarkerAlt className="text-red-500" />
                          <span>{denuncia.ubicacion}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <span className={`px-3 py-1.5 rounded-md text-sm font-semibold text-white ${
                          denuncia.estado === 'En proceso' 
                            ? 'bg-yellow-500' 
                            : denuncia.estado === 'Resuelto' 
                              ? 'bg-green-600'
                              : 'bg-blue-600' 
                        }`}>
                          {denuncia.estado}
                        </span>
                      </td>
                      {/* INICIO DE LA CORRECCIÓN: Botones de Acción */}
                      <td className="p-4">
                        <div className="flex gap-2">
                          {/* Botón de Llamar - AHORA DENTRO DEL FLEX CONTAINER */}
                          <button 
                            title="Llamar" 
                            onClick={() => handleCall(denuncia.telefono, denuncia.usuario)} // Usa la función handleCall
                            className="bg-green-500 hover:bg-green-600 text-white p-2 rounded-lg transition-colors"
                          >
                            <FaPhone />
                          </button>
                          {/* Botón de Ver */}
                          <button 
                            title="Ver" 
                            onClick={() => handleView(denuncia.id)} 
                            className="bg-blue-500 p-2 hover:bg-blue-600 text-white rounded transition-colors"
                          >
                            <FaEye />
                          </button>
                          {/* Botón de Editar */}
                          <button 
                            title="Editar" 
                            onClick={() => handleEdit(denuncia.id)} 
                            className="bg-yellow-500 p-2 hover:bg-yellow-600 text-white rounded transition-colors"
                          >
                            <FaEdit />
                          </button>
                          {/* Botón de Eliminar */}
                          <button 
                            title="Eliminar" 
                            onClick={() => handleDelete(denuncia.id)} 
                            className="bg-red-500 p-2 hover:bg-red-600 text-white rounded transition-colors"
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </td>
                      {/* FIN DE LA CORRECCIÓN */}
                    </tr>
                  ))
                ) : (
                  // MENSAJE DE NO ENCONTRADO
                  <tr>
                    <td colSpan="6" className="p-10 text-center text-gray-500">
                      No se encontraron denuncias que coincidan con la búsqueda o filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pie de tabla - paginación */}
          <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
            <div className="text-sm text-gray-600">
              Mostrando {denunciasFiltradas.length} de {denuncias.length} denuncias
            </div>
            {/* La paginación solo se muestra si hay elementos */}
            {denunciasFiltradas.length > 0 && (
              <div className="flex gap-2">
                <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
                  Anterior
                </button>
                <button className="px-4 py-2 bg-green-700 text-white rounded hover:bg-green-800">
                  1
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
                  2
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
                  3
                </button>
                <button className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100">
                  Siguiente
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Denuncias;
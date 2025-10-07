import React from "react";
import { Link } from "react-router-dom";
import { FaHome, FaBell, FaUsers, FaCog, FaSignOutAlt, FaExclamationCircle } from "react-icons/fa";

export default function AdminDashboard() {
  return (
    <div className="flex min-h-screen bg-gray-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-green-900 text-white flex flex-col p-4">
        <div className="flex flex-col items-center mb-8">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/0/05/Escudo_de_Bolivia.svg"
            alt="Escudo"
            className="w-20 mb-3"
          />
          <h1 className="text-xl font-bold text-center">ADMINISTRADOR</h1>
        </div>

        <nav className="flex flex-col gap-2">
          <Link to="/dashboard" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaHome /> Inicio
          </Link>
          <a href="#" className="flex items-center gap-3 hover:bg-green-700 p-2 rounded">
            <FaExclamationCircle /> Denuncias
          </a>
          <Link to="/alertas" className="flex items-center gap-2 hover:bg-green-700 p-2 rounded">
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
      <main className="flex-1 p-6">
        {/* Encabezado */}
        <header className="flex justify-between items-center border-b pb-4 mb-6">
          <h2 className="text-3xl font-bold text-gray-900">Todas las Denuncias</h2>
          <button className="bg-green-800 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium">
            Ver más
          </button>
        </header>

        {/* Tarjeta de Mapa */}
        <div className="bg-white p-4 rounded-lg shadow-md border">
          <div className="border-2 border-green-800 rounded-md overflow-hidden">
            <img
              src="https://www.google.com/maps/vt/data=GFdnTMs8WotsETR1vfFAOPqnSppf2m7wpiL93yAbUWSuQICPWT_BKZzaXHp54c4bHE4cB68eA3bcjuWZNGBYS-VUNDs1rxuy4eloUVs9t86X_UiwvSWGVVd4dJDSzpkJ5xKePsaTx8zRLg4Pryx0ZHPttDrGFwRDLz2vKa2wOZUXfpxSObro93Q3_6WxmlfDhBUL2a7rOFbM1FmLOusnkHLTuYmKhSJzpLIxATxPF059qBsPz9WfcbSRs_A5MtMY1jN16NG51W0j5kbmZK4GkSVJZO6VXLjbCj8lcg"
              alt="Mapa de Denuncias"
              className="w-full h-[450px] object-cover"
            />
          </div>
        </div>
      </main>

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
    </div>
  );
}

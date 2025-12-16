import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  FaHome, FaBell, FaUsers, FaCog, FaSignOutAlt, 
  FaExclamationCircle, FaArrowLeft, FaPhone, FaCar,
  FaMapMarkerAlt, FaSearch, FaFilter, FaUser, FaCheckCircle 
} from "react-icons/fa";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Solucionar iconos de Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const AlertasPanico = () => {
  const navigate = useNavigate();
  
  // Coordenadas de Cochabamba, Bolivia
  const [mapCenter] = useState([-17.3895, -66.1568]);
  const [zoomLevel] = useState(13);
  
  // Datos de alertas de pánico.
  // 'status': 'active' | 'process' | 'completed'
  const [alertas, setAlertas] = useState([
    { 
      id: 21, 
      user: "Alex Velarde", 
      time: "Hace 2 min", 
      location: "Plaza 14 de Septiembre", 
      area: "Centro",
      lat: -17.3895, 
      lng: -66.1568,
      phone: "+591 78765432",
      detalles: "Botón de pánico activado",
      status: "active",
      notificado: false,
      patrulleroAsignado: null
    },
    { 
      id: 22, 
      user: "María González", 
      time: "Hace 5 min", 
      location: "Mercado La Cancha", 
      area: "Calacoto",
      lat: -17.3930, 
      lng: -66.1520,
      phone: "+591 68765433",
      detalles: "Emergencia activada",
      status: "active",
      notificado: false,
      patrulleroAsignado: null
    },
    { 
      id: 23, 
      user: "Carlos Ruiz", 
      time: "Hace 8 min", 
      location: "Av. América #456", 
      area: "Sarco",
      lat: -17.3850, 
      lng: -66.1480,
      phone: "+591 77712345",
      detalles: "Alerta de pánico",
      status: "process", 
      notificado: true,
      patrulleroAsignado: "Patrulla 101"
    },
    { 
      id: 24, 
      user: "Ana Torres", 
      time: "Hace 12 min", 
      location: "Parque de la Familia", 
      area: "Queru Queru",
      lat: -17.3950, 
      lng: -66.1600,
      phone: "+591 61234567",
      detalles: "Solicitud de auxilio",
      status: "active",
      notificado: false,
      patrulleroAsignado: null
    },
    { 
      id: 25, 
      user: "Luis Mendoza", 
      time: "Hace 15 min", 
      location: "UMSS", 
      area: "Muyurina",
      lat: -17.3780, 
      lng: -66.1450,
      phone: "+591 70012349",
      detalles: "Botón de emergencia",
      status: "process", 
      notificado: true,
      patrulleroAsignado: "Patrulla 102"
    },
  ]);

  // Lista de patrulleros disponibles (estado q debe actualizarse en un sistema real)
  const [patrulleros, setPatrulleros] = useState([
    { id: 1, nombre: "Patrulla 101", estado: "En ruta", ubicacion: "Centro" }, // Actualizado por alerta 23
    { id: 2, nombre: "Patrulla 102", estado: "En ruta", ubicacion: "Calacoto" }, // Actualizado por alerta 25
    { id: 3, nombre: "Patrulla 103", estado: "Disponible", ubicacion: "Sarco" },
    { id: 4, nombre: "Patrulla 104", estado: "Disponible", ubicacion: "Queru Queru" },
    { id: 5, nombre: "Patrulla 105", estado: "Disponible", ubicacion: "Muyurina" }, // Cambiado a disponible para pruebas
  ]);

  // Icono rojo para todas las alertas (solo pánico)
  const getPanicIcon = () => {
    return L.icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });
  };

  // Filtrar alertas que NO estén completadas
  const alertasActivas = alertas.filter(alerta => alerta.status !== "completed");


  const handleCall = (phoneNumber, userName) => {
    if (window.confirm(`¿Llamar a ${userName} al ${phoneNumber}?`)) {
      window.location.href = `tel:${phoneNumber}`;
    }
  };

  /**
   * FUNCIÓN PARA CERRAR LA ALERTA: Marcar como Deber Cumplido
   */
  const handleCompleteDuty = (alertId) => {
    const alerta = alertas.find(a => a.id === alertId);
    
    if (!alerta || alerta.status === "completed") return;

    if (window.confirm(`¿Confirmar que el patrullero ${alerta.patrulleroAsignado} ha completado la atención de la alerta #${alerta.id} y la situación ha sido resuelta?`)) {
      
      const patrulleroNombre = alerta.patrulleroAsignado;

      // 1. Actualizar el estado de la alerta a 'completed'
      const updatedAlertas = alertas.map(a => 
        a.id === alertId 
          ? { ...a, status: "completed" } 
          : a
      );
      
      setAlertas(updatedAlertas);

      // 2. Simular que el patrullero asignado vuelve a estar 'Disponible'
      const updatedPatrulleros = patrulleros.map(p => 
        p.nombre === patrulleroNombre
            ? { ...p, estado: "Disponible" }
            : p
      );
      
      setPatrulleros(updatedPatrulleros);
      
      // 3. Mostrar confirmación
      alert(`✅ ALERTA CERRADA.\n\nAlerta #${alerta.id} (Usuario: ${alerta.user}) marcada como COMPLETADA. El patrullero ${patrulleroNombre} está nuevamente DISPONIBLE.`);
    }
  };

  /**
   * FUNCIÓN PARA ASIGNAR/NOTIFICAR PATRULLERO
   */
  const notificarPatrullero = (alertaId) => {
    const alerta = alertas.find(a => a.id === alertaId);
    
    if (!alerta) return;

    // Encontrar patrulleros disponibles
    const patrullerosDisponibles = patrulleros.filter(p => p.estado === "Disponible");
    
    if (patrullerosDisponibles.length === 0) {
      alert("❌ No hay patrulleros disponibles en este momento. Intente nuevamente en unos minutos.");
      return;
    }
    
    // Simular la selección del patrullero más cercano (primer disponible)
    const patrulleroSeleccionado = patrullerosDisponibles[0];
    
    const confirmacion = window.confirm(
      `🚨 NOTIFICAR A ${patrulleroSeleccionado.nombre}\n\n` +
      `ALERTA DE EMERGENCIA EN ${alerta.area.toUpperCase()}:\n` +
      `ID: #${alerta.id}\n` +
      `👤 Ciudadano: ${alerta.user}\n` +
      `📍 Ubicación: ${alerta.location}\n` +
      `📞 Teléfono: ${alerta.phone}\n` +
      `📝 Detalles: ${alerta.detalles}\n\n` +
      `¿Enviar notificación y cambiar estado a 'En Ruta'?`
    );
    
    if (confirmacion) {
      // 1. Actualizar el estado de la alerta
      const updatedAlertas = alertas.map(a => 
        a.id === alertaId 
          ? { 
              ...a, 
              notificado: true, 
              patrulleroAsignado: patrulleroSeleccionado.nombre,
              status: 'process' 
            } 
          : a
      );
      setAlertas(updatedAlertas);

      // 2. Actualizar el estado del patrullero
      const updatedPatrulleros = patrulleros.map(p => 
        p.nombre === patrulleroSeleccionado.nombre
          ? { ...p, estado: "En ruta" }
          : p
      );
      setPatrulleros(updatedPatrulleros);

      alert(`✅ Notificación enviada a ${patrulleroSeleccionado.nombre}\n\n📢 El patrullero ha sido alertado y se dirige a la ubicación indicada.`);
    }
  };


  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar (Sin cambios relevantes) */}
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

      {/* Contenido principal */}
      <div className="flex-1 p-6">
        {/* Perfil superior derecho */}
        <div className="absolute right-6 top-6 bg-white shadow-md px-4 py-2 rounded-md flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-bold">
            <FaUser />
          </div>
          <div>
            <p className="font-semibold text-gray-800">Control Central</p>
            <p className="text-sm text-gray-500">central@alertas.com</p>
          </div>
        </div>

        {/* Botón para volver al Dashboard */}
        <div className="mb-6">
          <button 
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white px-4 py-2 rounded-lg font-medium transition"
          >
            <FaArrowLeft /> Volver al Dashboard
          </button>
        </div>
        
        <h1 className="text-3xl font-bold mb-8">ALERTAS DE EMERGENCIA</h1>

        {/* Barra de Búsqueda */}
        <div className="bg-white p-4 rounded-xl shadow mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por usuario, ubicación o ID..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 
                  focus:ring-green-700 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <div className="bg-red-100 text-red-800 px-10 py-2 rounded-lg font-bold">
                {alertasActivas.length} Alertas Activas
              </div>
            </div>
          </div>
        </div>

        {/* Mapa y Lista */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mapa Grande */}
          <div className="lg:col-span-2 bg-white p-4 rounded-xl shadow">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <FaMapMarkerAlt className="text-red-500" /> Mapa de Emergencias
              </h2>
              <div className="flex items-center gap-2 bg-red-50 px-3 py-1 rounded">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-red-700">Alertas Activas: {alertasActivas.length}</span>
              </div>
            </div>
            
            {/* Mapa Leaflet */}
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden h-[500px]">
              <MapContainer 
                center={mapCenter} 
                zoom={zoomLevel} 
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={true}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; OpenStreetMap'
                />
                
                {/* Marcadores de alertas activas */}
                {alertasActivas.map((alerta) => (
                  <Marker 
                    key={alerta.id} 
                    position={[alerta.lat, alerta.lng]}
                    icon={getPanicIcon()}
                  >
                    <Popup>
                      <div className="p-3">
                        <strong className="text-lg">{alerta.user}</strong>
                        <p className="text-sm">ID: #{alerta.id}</p>
                        <p className="text-sm">📍 {alerta.location}</p>
                        <p className="text-sm">📞 {alerta.phone}</p>
                        <p className="text-sm">🕒 {alerta.time}</p>
                        <p className="text-sm">📝 {alerta.detalles}</p>
                        {alerta.patrulleroAsignado && (
                          <p className={`text-sm font-medium ${alerta.status === 'process' ? 'text-yellow-600' : 'text-red-600'}`}>
                            🚓 Asignado: {alerta.patrulleroAsignado}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </div>

          {/* Lista de Alertas para notificar */}
          <div className="bg-white rounded-xl shadow">
            <div className="p-4 border-b ">
              <h1 className="text-lg font-bold flex items-center gap-2">
                <FaBell className="text-red-500" /> Notificar Patrulleros
              </h1>
            </div>
            <div className="overflow-y-auto max-h-[500px] p-4">
              {alertasActivas.length === 0 ? (
                <p className="text-center text-gray-500 py-10">🎉 No hay alertas de pánico activas.</p>
              ) : (
                alertasActivas.map((alerta) => (
                  <div key={alerta.id} className="mb-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-100 transition-all">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <FaUser className="text-blue-600" />
                          </div>
                          <div>
                            <p className="font-bold text-lg">{alerta.user}</p>
                            <p className="text-sm text-gray-600">ID: #{alerta.id} • {alerta.time}</p>
                          </div>
                        </div>
                      </div>
                      {/* Estado de la alerta */}
                      <span className={`px-3 py-1 rounded-mt text-sm font-bold ${
                          alerta.status === 'process' 
                          ? 'bg-yellow-100 text-yellow-900' 
                          : 'bg-red-100 text-red-900'
                      }`}>
                          {alerta.status === 'process' ? 'En Proceso' : 'Pendiente'}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <p className="font-medium">📍 {alerta.location}</p>
                      <p className="text-sm text-gray-600">Zona: {alerta.area}</p>
                      <p className="text-sm text-gray-600">📞 {alerta.phone}</p>
                      <p className="text-sm">📝 {alerta.detalles}</p>
                    </div>
                    
                    {alerta.patrulleroAsignado && (
                      <div className="mb-4 p-3 bg-green-50 rounded-lg">
                        <p className="font-medium text-green-700">🚓 Patrullero asignado:</p>
                        <p className="text-green-800 font-bold">{alerta.patrulleroAsignado}</p>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleCall(alerta.phone, alerta.user)}
                        className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2"
                      >
                        <FaPhone /> Llamar
                      </button>
                      
                      {alerta.patrulleroAsignado ? (
                        // BOTÓN DE DEBER CUMPLIDO (solo si ya hay patrullero asignado)
                        <button 
                          onClick={() => handleCompleteDuty(alerta.id)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-medium flex items-center justify-center gap-2 transition-colors"
                        >
                          <FaCheckCircle /> Deber Cumplido
                        </button>
                      ) : (
                        // BOTÓN ORIGINAL DE DESPACHAR (solo si no hay patrullero asignado)
                        <button 
                          onClick={() => notificarPatrullero(alerta.id)}
                          className='flex-1 py-3 rounded-lg font-medium flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white'
                        >
                          <FaCar /> Despachar
                        </button>
                      )}
                    </div>
                    
                    {alerta.patrulleroAsignado && (
                      <p className="text-center text-sm text-green-600 mt-2">
                        ✅ Patrullero notificado y en camino
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Panel de Patrulleros Disponibles */}
        <div className="mt-6 bg-white rounded-xl shadow p-4">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaCar className="text-blue-600" /> Patrulleros
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {patrulleros.map((patrullero) => (
              <div key={patrullero.id} className={`p-4 border rounded-lg ${
                patrullero.estado === "Disponible" ? 'bg-green-50 border-green-200' :
                patrullero.estado === "En ruta" ? 'bg-yellow-50 border-yellow-200' :
                'bg-gray-50 border-gray-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold">{patrullero.nombre}</p>
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    patrullero.estado === "Disponible" ? 'bg-green-100 text-green-800' :
                    patrullero.estado === "En ruta" ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {patrullero.estado}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Ubicación: {patrullero.ubicacion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AlertasPanico;

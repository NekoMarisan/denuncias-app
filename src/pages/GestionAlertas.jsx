import React, { useState } from "react";
import { FaExclamationTriangle, FaBell, FaMapMarkerAlt, FaExternalLinkAlt } from "react-icons/fa";
import { LuZoomIn } from "react-icons/lu";
import DetalleAlertaModal from "../components/modals/DetalleAlertaModal";

function GestionAlertas() {
  const [tabActiva, setTabActiva] = useState("emergencia");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);

  // Estado para las alertas que se mueven al Archivo Histórico
  const [alertasArchivadas, setAlertasArchivadas] = useState([]);

  // Listas en estados para permitir que desaparezcan al transferir o desestimar
  const [alertasCiudadanas, setAlertasCiudadanas] = useState([
    { 
      id: "ALTC-0001", ciudadano: "Sergio Alejandro Terrazas Velarde", 
      ubicacion: "-17.3935, -66.1570", hora: "13:25", estado: "PENDIENTE", 
      ci: "6945862 CB", celular: "+591 69459645", relato: "Jóvenes bebiendo en la esquina.",
      incidente: "Consumo de bebidas en vía pública"
    },
    { 
      id: "ALTC-0002", ciudadano: "Armando Benjhamin Gutierrez Valencia", 
      ubicacion: "-17.3890, -66.1510", hora: "13:40", estado: "PENDIENTE", 
      ci: "7845122 CB", celular: "+591 7845122", relato: "Robo de pertenencias.",
      incidente: "Robo Agravado"
    },
  ]);

  const [alertasPanico, setAlertasPanico] = useState([
    { 
      id: "REGE-0001", ciudadano: "Melissa Angelica Moreno Fernandez", 
      ubicacion: "-17.3940, -66.1560", hora: "14:10", estado: "EMERGENCIA", 
      ci: "1234567 CB", celular: "+591 70707070", relato: "Persona armada.",
      incidente: "Pánico - Auxilio Inmediato"
    },
    { 
      id: "REGE-0002", ciudadano: "Alex Kevin Velarde Diaz", 
      ubicacion: "-17.4010, -66.1820", hora: "14:04", estado: "EMERGENCIA", 
      ci: "7654321 CB", celular: "+591 60606060", relato: "Accidente de tránsito.",
      incidente: "Pánico - Accidente"
    },
  ]);

  const dataActual = tabActiva === "ciudadana" ? alertasCiudadanas : alertasPanico;

  // Función para desestimar y enviar a ArchivoHistorico
  const manejarDesestimar = (idAlerta, motivo) => {
    const listaOrigen = tabActiva === "emergencia" ? alertasPanico : alertasCiudadanas;
    const alertaEncontrada = listaOrigen.find(a => a.id === idAlerta);

    if (alertaEncontrada) {
      const nuevaAlertaArchivada = {
        ...alertaEncontrada,
        estado: "DESESTIMADO",
        motivoDesestimacion: motivo || "Sin motivo especificado",
        fecha: new Date().toLocaleDateString()
      };

      setAlertasArchivadas(prev => [...prev, nuevaAlertaArchivada]);

      if (tabActiva === "emergencia") {
        setAlertasPanico(alertasPanico.filter(alerta => alerta.id !== idAlerta));
      } else {
        setAlertasCiudadanas(alertasCiudadanas.filter(alerta => alerta.id !== idAlerta));
      }
    }
    cerrarModal();
  };

  // Función para eliminar de la vista del operador al transferir
  const manejarTransferencia = (idAlerta) => {
    if (tabActiva === "emergencia") {
      setAlertasPanico(alertasPanico.filter(alerta => alerta.id !== idAlerta));
      alert("Alerta de pánico transferida a Centro de Despacho");
    } else {
      setAlertasCiudadanas(alertasCiudadanas.filter(alerta => alerta.id !== idAlerta));
    }
    cerrarModal();
  };

  const abrirModal = (alerta) => {
    setAlertaSeleccionada(alerta);
    setMostrarModal(true);
  };

  const cerrarModal = () => {
    setMostrarModal(false);
    setAlertaSeleccionada(null);
  };

  return (
    <div className="-mt-9 w-full px-2 py-8 space-y-8 pb-10 bg-gray-50/30 min-h-screen overflow-x-hidden">
      {/* SELECTOR DE TABS */}
      <div className="w-full bg-white p-6 rounded-3xl shadow-sm flex items-center justify-between gap-6">
        <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-200 shrink-0">
          <button 
            onClick={() => setTabActiva("emergencia")}
            className={`flex items-center gap-3 px-10 py-3.5 rounded-xl font-extrabold transition-all ${
              tabActiva === "emergencia" ? "bg-red-600 text-white shadow-lg shadow-slate-200" : "text-slate-400"
            }`}
          >
            <FaExclamationTriangle size={16} /> ALERTAS DE PÁNICO
          </button>
          <button 
            onClick={() => setTabActiva("ciudadana")}
            className={`flex items-center gap-3 px-10 py-3.5 rounded-xl font-extrabold transition-all ${
              tabActiva === "ciudadana" ? "bg-blue-600 text-white shadow-lg shadow-slate-200" : "text-slate-400"
            }`}
          >
            <FaBell size={16} /> ALERTAS CIUDADANAS
          </button>
        </div>
        <div className="bg-gray-50 text-gray-500 px-6 py-3 rounded-xl text-[12px] font-extrabold uppercase tracking-widest border border-gray-200">
          ● {dataActual.length} Registros activos
        </div>
      </div>

      {/* TABLA */}
      <div className="w-full bg-white p-12 rounded-3xl shadow-sm border border-gray-50">
        <h2 className="text-3xl font-black uppercase tracking-tight text-[#1e293b] mb-12">
          {tabActiva === 'emergencia' ? 'Bandeja de Emergencias' : 'Reportes Ciudadanos'}
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-separate border-spacing-y-4 table-fixed">
            <thead>
              <tr className="text-slate-400 text-[13.5px] font-extrabold uppercase tracking-[0.1em]">
                <th className="px-10 pb-4 w-[15%] text-left">ID Registro</th>
                <th className="pb-4 w-[30%] text-left">Ciudadano</th>
                <th className="px-4 pb-4 w-[20%] text-left">Ubicación</th>
                <th className="pb-4 w-[10%] text-left">Hora</th>
                <th className="pb-4 w-[15%] text-left">Estado</th>
                <th className="px-10 pb-4 w-[10%] text-rigth">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {dataActual.map((item) => (
                <tr 
                  key={item.id} 
                  className="bg-white group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
                >
                  <td className="px-10 py-8 text-[15px] font-bold text-slate-400 border-y border-l rounded-l-[2.5rem] border-gray-50 uppercase text-left">
                    {item.id}
                  </td>

                  <td className="py-5 border-y border-gray-50">
                    <div className="flex items-center gap-5 text-left">
                      <div className={`w-10 h-12 rounded-xl flex items-center justify-center font-black text-xl shrink-0 shadow-inner ${tabActiva === "emergencia" ? "bg-blue-50 text-blue-600" : "bg-blue-50 text-blue-600"}`}>
                        {item.ciudadano.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-lg font-bold text-[#1e293b] leading-tight truncate">
                          {item.ciudadano}
                        </span>
                        <span className="mt-0.5 text-[10px] text-gray-400 font-semibold uppercase tracking-wider">
                          Usuario Verificado
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-5 text-[15px] font-bold text-slate-500 border-y border-gray-50 text-left">
                    <div className="px-4 flex items-center gap-2">
                      <span className="truncate">{item.ubicacion}</span>
                    </div>
                  </td>

                  <td className="py-5 text-[15px] font-bold text-slate-500 border-y border-gray-50 text-left">
                    {item.hora}
                  </td>

                  <td className="py-5 border-y border-gray-50 text-left">
                    <span className={`inline-flex justify-center w-28 py-2.5 rounded-xl text-[12px] font-extrabold text-white ${
                      item.estado === "EMERGENCIA" 
                        ? "bg-red-600 shadow-slate-200" 
                        : "bg-purple-600 shadow-slate-200"
                    }`}>
                      {item.estado}
                    </span>
                  </td>

                  <td className="px-14 py-5 border-y border-r rounded-r-[2.5rem] border-gray-50 text-rigth">
                    {tabActiva === "ciudadana" ? (
                      <button 
                        onClick={() => abrirModal(item)}
                        className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-slate-200 hover:scale-110 active:scale-95 transition-all flex items-center justify-center ml-auto"
                      >
                        <LuZoomIn size={18} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => abrirModal(item)}
                        className="p-4 bg-red-600 text-white rounded-2xl shadow-lg shadow-slate-200 hover:scale-110 active:scale-95 transition-all flex items-center justify-center ml-auto"
                      >
                        <FaExternalLinkAlt size={18} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {/* MODAL CONDICIONAL */}
      {mostrarModal && alertaSeleccionada && (
        <DetalleAlertaModal 
          alerta={alertaSeleccionada}
          onBack={cerrarModal}
          onEnviarDespacho={manejarTransferencia}
          onDesestimar={manejarDesestimar}
        />
      )}
    </div>
  );
}

export default GestionAlertas;
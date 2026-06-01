import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LuZoomIn } from "react-icons/lu";
import DetalleAlertaModal from "../components/modals/DetalleAlerta";
import DetalleEmergencia from "../components/modals/DetalleEmergencia";
import { supabase } from '../services/supabase'

function GestionAlertas() {
  const location = useLocation();

  const [tabActiva, setTabActiva] = useState("emergencia");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [alertasArchivadas, setAlertasArchivadas] = useState([]);
  const [filaResaltada, setFilaResaltada] = useState(null);

  // Alertas de pánico (emergencia)
  const [alertasPanico, setAlertasPanico] = useState([
    {
      id: "REGE-0001",
      ciudadano: "Alex Cristhian Velarde Diaz",
      ubicacion: "-17.3896, -66.1552",
      fecha: "21/04/2026",
      hora: "14:05",
      estado: "Emergencia",
      ci: "1234567 CB",
      celular: "+591 70707070",
      relato: "Persona armada en la vía pública.",
      incidente: "Pánico - Amenaza",
    },
    {
      id: "REGE-0002",
      ciudadano: "Armando Benjhamin Gutierrez Valencia",
      ubicacion: "-17.3896, -66.1552",
      fecha: "21/04/2026",
      hora: "14:12",
      estado: "Emergencia",
      ci: "7654321 CB",
      celular: "+591 60606060",
      relato: "Accidente de tránsito con heridos.",
      incidente: "Pánico - Accidente",
    },
    {
      id: "REGE-0003",
      ciudadano: "Melissa Angelica Moreno Fernandez",
      ubicacion: "-17.3896, -66.1552",
      fecha: "21/04/2026",
      hora: "14:20",
      estado: "Emergencia",
      ci: "9876543 CB",
      celular: "+591 61234567",
      relato: "Intento de robo en domicilio.",
      incidente: "Pánico - Robo",
    },
    {
      id: "REGE-0004",
      ciudadano: "Carlos Andrés López Soto",
      ubicacion: "-17.4000, -66.1600",
      fecha: "21/04/2026",
      hora: "15:00",
      estado: "Emergencia",
      ci: "1111111 CB",
      celular: "+591 71111111",
      relato: "Incendio en edificio.",
      incidente: "Pánico - Incendio",
    },
    {
      id: "REGE-0005",
      ciudadano: "María Fernanda Torrico Paz",
      ubicacion: "-17.4100, -66.1700",
      fecha: "21/04/2026",
      hora: "15:30",
      estado: "Emergencia",
      ci: "2222222 CB",
      celular: "+591 72222222",
      relato: "Secuestro familiar.",
      incidente: "Pánico - Secuestro",
    },
    {
      id: "REGE-0006",
      ciudadano: "Luis Eduardo Rojas Claure",
      ubicacion: "-17.4200, -66.1800",
      fecha: "21/04/2026",
      hora: "16:00",
      estado: "Emergencia",
      ci: "3333333 CB",
      celular: "+591 73333333",
      relato: "Ataque con arma blanca.",
      incidente: "Pánico - Agresión",
    },
    {
      id: "REGE-0007",
      ciudadano: "Patricia Jimena Arce Sánchez",
      ubicacion: "-17.4300, -66.1900",
      fecha: "21/04/2026",
      hora: "16:30",
      estado: "Emergencia",
      ci: "4444444 CB",
      celular: "+591 74444444",
      relato: "Desaparición de menor.",
      incidente: "Pánico - Desaparición",
    },
  ]);

  // Alertas ciudadanas
  const [alertasCiudadanas, setAlertasCiudadanas] = useState([
    {
      id: "ALTC-0001",
      ciudadano: "Alex Cristhian Velarde Diaz",
      ubicacion: "-17.3935, -66.1570",
      fecha: "21/04/2026",
      hora: "13:25",
      estado: "Verificación",
      ci: "6945862 CB",
      celular: "+591 69459645",
      relato: "Jóvenes bebiendo en la esquina.",
      incidente: "Consumo de bebidas en vía pública",
    },
    {
      id: "ALTC-0002",
      ciudadano: "Armando Benjhamin Gutierrez Valencia",
      ubicacion: "-17.3890, -66.1510",
      fecha: "21/04/2026",
      hora: "13:40",
      estado: "Verificación",
      ci: "7845122 CB",
      celular: "+591 7845122",
      relato: "Robo de pertenencias.",
      incidente: "Robo Agravado",
    },
    {
      id: "ALTC-0003",
      ciudadano: "Juan Perez Mamani",
      ubicacion: "-17.4010, -66.1820",
      fecha: "21/04/2026",
      hora: "14:10",
      estado: "Verificación",
      ci: "5555555 CB",
      celular: "+591 71234567",
      relato: "Ruidos molestos después de hora permitida.",
      incidente: "Alteración del orden público",
    },
  ]);

  const dataActual = tabActiva === "ciudadana" ? alertasCiudadanas : alertasPanico;

  const manejarDesestimar = (idAlerta, motivo) => {
    const listaOrigen = tabActiva === "emergencia" ? alertasPanico : alertasCiudadanas;
    const alertaEncontrada = listaOrigen.find((a) => a.id === idAlerta);
    if (alertaEncontrada) {
      const nuevaAlertaArchivada = {
        ...alertaEncontrada,
        estado: "DESESTIMADO",
        motivoDesestimacion: motivo || "Sin motivo especificado",
        fechaArchivo: new Date().toLocaleDateString(),
      };
      setAlertasArchivadas((prev) => [...prev, nuevaAlertaArchivada]);
      if (tabActiva === "emergencia") {
        setAlertasPanico(alertasPanico.filter((alerta) => alerta.id !== idAlerta));
      } else {
        setAlertasCiudadanas(alertasCiudadanas.filter((alerta) => alerta.id !== idAlerta));
      }
    }
    cerrarModal();
  };

  const manejarTransferencia = (idAlerta) => {
    if (tabActiva === "emergencia") {
      setAlertasPanico(alertasPanico.filter((alerta) => alerta.id !== idAlerta));
      alert("Alerta de pánico transferida a Centro de Despacho");
    } else {
      setAlertasCiudadanas(alertasCiudadanas.filter((alerta) => alerta.id !== idAlerta));
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

  useEffect(() => {
    const state = location.state;
    if (state && state.activeTab) {
      setTabActiva(state.activeTab);
      if (state.selectedId) {
        setFilaResaltada(state.selectedId);
        setTimeout(() => {
          const fila = document.getElementById(`fila-${state.selectedId}`);
          if (fila) {
            fila.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 200);
        setTimeout(() => {
          setFilaResaltada(null);
        }, 2000);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  return (
    <div className="-mt-4 w-full px-1 py-5 space-y-5 pb-8 bg-gray-50/30 min-h-screen overflow-x-hidden">
      {/* SELECTOR DE TABS */}
      <div className="px-4 w-full bg-white p-3 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200 shrink-0">
          <button
            onClick={() => setTabActiva("emergencia")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold text-xs transition-all tracking-wider ${
              tabActiva === "emergencia"
                ? "bg-[#113e27] text-white shadow-md"
                : "text-slate-400"
            }`}
          >
            <span className="hidden sm:inline">ALERTAS DE PÁNICO</span><span className="sm:hidden">PÁNICO</span>
          </button>
          <button
            onClick={() => setTabActiva("ciudadana")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-2 rounded-lg font-bold text-xs transition-all tracking-wider ${
              tabActiva === "ciudadana"
                ? "bg-[#113e27] text-white shadow-md"
                : "text-slate-400"
            }`}
          >
            <span className="hidden sm:inline">ALERTAS CIUDADANAS</span><span className="sm:hidden">CIUDADANAS</span>
          </button>
        </div>
        <div className="bg-gray-50 text-gray-500 px-4 py-2.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border border-gray-200">
          ● {dataActual.length} Registros activos
        </div>
      </div>

      {/* CONTENEDOR BLANCO */}
      <div className="relative top-1 w-full bg-white px-4 md:px-7 py-4 md:py-6 rounded-2xl shadow-md flex flex-col max-h-[70vh] min-h-0">
        <h2 className="text-lg font-extrabold uppercase text-[#1e293b] mb-4 md:mb-6 tracking-wide flex-shrink-0">
          {tabActiva === "emergencia"
            ? "Bandeja de Emergencias"
            : "Reportes Ciudadanos"}
        </h2>

        {/* Área de tabla con scroll propio */}
        <div className="overflow-auto flex-1 min-h-0 -mx-4 md:mx-0 px-4 md:px-0">
          <table className="min-w-full border-collapse text-left">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="pl-3 md:pl-4 pr-1 md:pr-2 py-2 w-[12%] md:w-[15%]">ID</th>
                <th className="py-2 w-[28%] md:w-[30%]">Ciudadano</th>
                <th className="px-1 md:px-2 py-2 w-[20%]">Coordenadas</th>
                <th className="py-2 w-[18%] md:w-[15%]">Fecha y Hora</th>
                <th className="py-2 w-[12%] md:w-[15%]">Estado</th>
                <th className="px-3 md:px-4 py-2 w-[10%]">Acciones</th>
               </tr>
            </thead>
            <tbody>
              {dataActual.map((item) => (
                <tr
                  key={item.id}
                  id={`fila-${item.id}`}
                  className={`bg-white group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 border-b border-gray-100 ${
                    filaResaltada === item.id ? "ring-2 bg-slate-50" : ""
                  }`}
                >
                  <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-5 md:py-6 text-[11px] font-bold text-slate-400 uppercase align-middle">
                    {item.id}
                  </td>
                  <td className="py-5 md:py-6 align-middle">
                    <div className="flex items-center gap-2 md:gap-3">
                      <div className="w-6 h-8 rounded-md flex items-center justify-center font-black text-xs shadow-inner shrink-0 bg-blue-50 text-[#0C3DC2]">
                        {item.ciudadano.charAt(0)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-[12px] font-bold text-[#1e293b] leading-tight truncate max-w-[120px] md:max-w-none">
                          {item.ciudadano}
                        </span>
                        <span className="mt-0.5 text-[8px] text-gray-400 font-semibold uppercase tracking-wider">
                          Usuario Verificado
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 md:py-6 text-[11px] font-bold text-slate-500 align-middle">
                    <div className="px-1 md:px-2 flex items-center gap-1">
                      <span className="truncate block max-w-[100px] md:max-w-none">{item.ubicacion}</span>
                    </div>
                  </td>
                  <td className="py-5 md:py-6 text-[11px] font-bold text-slate-500 align-middle whitespace-nowrap">
                    {item.fecha} {item.hora}
                  </td>
                  <td className="py-5 md:py-6 align-middle">
                    <span
                      className={`inline-flex justify-center w-16 md:w-20 py-1.5 rounded-md text-[9px] font-extrabold text-white tracking-wide ${
                        item.estado.toUpperCase() === "EMERGENCIA" ? "bg-red-600" : "bg-[#EBB615]"
                      }`}
                    >
                      {item.estado.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-3 md:px-4 py-5 md:py-6 align-middle">
                    <button
                      onClick={() => abrirModal(item)}
                      className="p-1.5 md:p-2 bg-[#0C3DC2] text-white rounded-lg shadow hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                    >
                      <LuZoomIn size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL CONDICIONAL SEGÚN TIPO DE ALERTA */}
      {mostrarModal && alertaSeleccionada && (
        tabActiva === "emergencia" ? (
          <DetalleEmergencia
            alerta={alertaSeleccionada}
            onBack={cerrarModal}
            onEnviarDespacho={manejarTransferencia}
            onDesestimar={manejarDesestimar}
          />
        ) : (
          <DetalleAlertaModal
            alerta={alertaSeleccionada}
            onBack={cerrarModal}
            onEnviarDespacho={manejarTransferencia}
            onDesestimar={manejarDesestimar}
          />
        )
      )}
    </div>
  );
}

export default GestionAlertas;
import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { LuZoomIn } from "react-icons/lu";
import { FaLock } from "react-icons/fa";
import DetalleAlertaModal from "../components/modals/DetalleAlerta";
import DetalleEmergencia from "../components/modals/DetalleEmergencia";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext"; // 👈 necesario para saber quién es el operador

function GestionAlertas() {
  const location = useLocation();
  const { user } = useAuth(); // 👈 obtener el oficial autenticado

  const [tabActiva, setTabActiva] = useState("emergencia");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [alertasArchivadas, setAlertasArchivadas] = useState([]);
  const [filaResaltada, setFilaResaltada] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);

  const [alertasPanico, setAlertasPanico] = useState([]);
  const [alertasCiudadanas, setAlertasCiudadanas] = useState([]);

  const dataActual = tabActiva === "ciudadana" ? alertasCiudadanas : alertasPanico;

  const transformarAlertas = (data) => {
    const panico = [];
    const ciudadanas = [];

    data.forEach((item) => {
      const base = {
        id:           item.id_alerta,
        ciudadano:    item.usuario_ciudadano?.nombre_completo || `Usuario #${item.id_usuario}`,
        ubicacion:    item.ubicacion  || "Sin ubicación",
        fecha:        item.fecha_hora
                        ? new Date(item.fecha_hora).toLocaleDateString("es-BO")
                        : "—",
        hora:         item.fecha_hora
                        ? new Date(item.fecha_hora).toLocaleTimeString("es-BO", {
                            hour:   "2-digit",
                            minute: "2-digit",
                          })
                        : "—",
        descripcion:  item.descripcion  || "",
        categoria:    item.categoria    || "",
        audio_30s:    item.audio_30s    || null,
        prioridad:    item.prioridad    || "Media",
        codigo:       item.codigo_alerta || "",
        // ✅ AGREGADO: campos de bloqueo
        bloqueadoPor: item.bloqueado_por  || null,
        bloqueadoRol: item.bloqueado_rol  || null,
      };

      if (item.categoria === "Panico") {
        panico.push({ ...base, estado: "Emergencia" });
      } else if (item.categoria === "Alerta Ciudadana") {
        ciudadanas.push({ ...base, estado: "Verificación" });
      }
    });

    return { panico, ciudadanas };
  };

  const cargarAlertas = async () => {
    setCargando(true);
    setErrorCarga(null);
    try {
      const { data, error } = await supabase
        .from("alerta")
        .select(`
          *,
          usuario_ciudadano (
            nombre_completo
          )
        `)
        .eq("id_estado_actual", 1)
        .order("fecha_hora", { ascending: false });

      if (error) throw error;

      if (!data || data.length === 0) {
        setAlertasPanico([]);
        setAlertasCiudadanas([]);
        return;
      }

      const { panico, ciudadanas } = transformarAlertas(data);
      setAlertasPanico(panico);
      setAlertasCiudadanas(ciudadanas);
    } catch (err) {
      console.error(err);
      setErrorCarga(err.message);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarAlertas();
  }, []);

  useEffect(() => {
    const canal = supabase
      .channel("alertas-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerta" },
        () => { cargarAlertas(); }
      )
      .subscribe();
    return () => supabase.removeChannel(canal);
  }, []);

  useEffect(() => {
    const state = location.state;
    if (state?.activeTab) {
      setTabActiva(state.activeTab);
      if (state.selectedId) {
        setFilaResaltada(state.selectedId);
        setTimeout(() => {
          const fila = document.getElementById(`fila-${state.selectedId}`);
          if (fila) fila.scrollIntoView({ behavior: "smooth", block: "center" });
        }, 200);
        setTimeout(() => setFilaResaltada(null), 2000);
      }
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // ✅ MODIFICADO: abrirModal ahora intenta tomar el bloqueo antes de abrir
  const abrirModal = async (alerta) => {
    const idOficial = user?.id_oficial;

    if (!idOficial) {
      alert("Error: No se pudo identificar al operador");
      return;
    }

    // Intentar bloquear la alerta (operación atómica)
// Intentar bloquear la alerta (operación atómica)
    const { data, error } = await supabase
      .from("alerta")
      .update({
        bloqueado_por: idOficial,
        bloqueado_en:  new Date().toISOString(),
        bloqueado_rol: "operador",
        // ESTA ES LA LÍNEA QUE FALTA PARA QUE EL NOMBRE APAREZCA
        id_operador_receptor: idOficial 
      })
      .eq("id_alerta", alerta.id)
      .is("bloqueado_por", null) // solo si nadie la tiene
      .select()
      .single();

    if (!data || error) {
      // Alguien más ya la tiene abierta
      alert("🔒 Esta alerta ya está siendo atendida por otro operador");
      return;
    }

    setAlertaSeleccionada(alerta);
    setMostrarModal(true);
  };

  // ✅ MODIFICADO: cerrarModal libera el bloqueo
  const cerrarModal = async () => {
    if (alertaSeleccionada && user?.id_oficial) {
      await supabase
        .from("alerta")
        .update({
          bloqueado_por: null,
          bloqueado_en:  null,
          bloqueado_rol: null,
        })
        .eq("id_alerta", alertaSeleccionada.id)
        .eq("bloqueado_por", user.id_oficial); // solo el dueño puede liberar
    }
    setMostrarModal(false);
    setAlertaSeleccionada(null);
  };

  // DESESTIMAR → cambia estado a 4 y libera bloqueo
  const manejarDesestimar = async (idAlerta, motivo) => {
    const { error } = await supabase
      .from("alerta")
      .update({
        id_estado_actual: 4,
        // ✅ AGREGADO: liberar bloqueo al desestimar
        bloqueado_por: null,
        bloqueado_en:  null,
        bloqueado_rol: null,
      })
      .eq("id_alerta", idAlerta);

    if (error) {
      console.error("Error al desestimar:", error);
      return;
    }

    const listaOrigen = tabActiva === "emergencia" ? alertasPanico : alertasCiudadanas;
    const alertaEncontrada = listaOrigen.find((a) => a.id === idAlerta);
    if (alertaEncontrada) {
      setAlertasArchivadas((prev) => [...prev, {
        ...alertaEncontrada,
        estado: "DESESTIMADO",
        motivoDesestimacion: motivo || "Sin motivo especificado",
        fechaArchivo: new Date().toLocaleDateString(),
      }]);
      if (tabActiva === "emergencia") {
        setAlertasPanico(alertasPanico.filter((a) => a.id !== idAlerta));
      } else {
        setAlertasCiudadanas(alertasCiudadanas.filter((a) => a.id !== idAlerta));
      }
    }
    cerrarModal();
  };

  // TRANSFERIR A DESPACHO → libera bloqueo al enviar
  const manejarTransferencia = async (idAlerta) => {
    const { error } = await supabase
      .from("alerta")
      .update({
        id_estado_actual: 2,
        // ✅ AGREGADO: liberar bloqueo al transferir
        bloqueado_por: null,
        bloqueado_en:  null,
        bloqueado_rol: null,
      })
      .eq("id_alerta", idAlerta);

    if (error) {
      console.error("Error al enviar a despacho:", error);
      return;
    }

    if (tabActiva === "emergencia") {
      setAlertasPanico(alertasPanico.filter((a) => a.id !== idAlerta));
    } else {
      setAlertasCiudadanas(alertasCiudadanas.filter((a) => a.id !== idAlerta));
    }

    cerrarModal();
  };

  if (cargando) {
    return (
      <div className="-mt-4 w-full px-1 py-5 space-y-5 pb-8 bg-gray-50/30 min-h-screen overflow-x-hidden">
        <div className="flex justify-center items-center h-64">
          <div className="text-[#113e27] font-bold text-lg">Cargando alertas...</div>
        </div>
      </div>
    );
  }

  if (errorCarga) {
    return (
      <div className="-mt-4 w-full px-1 py-5 space-y-5 pb-8 bg-gray-50/30 min-h-screen overflow-x-hidden">
        <div className="bg-red-100 border-l-4 border-red-600 p-4 rounded shadow-md mx-4">
          <p className="text-red-700 font-bold">Error al cargar las alertas</p>
          <p className="text-sm text-red-600">{errorCarga}</p>
          <button onClick={cargarAlertas} className="mt-2 bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="-mt-4 w-full px-1 py-5 space-y-5 pb-8 bg-gray-50/30 min-h-screen overflow-x-hidden">

      {/* SELECTOR DE TABS */}
      <div className="px-4 w-full bg-white p-3 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-2">
        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200 shrink-0">
          <button
            onClick={() => setTabActiva("emergencia")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 rounded-lg font-bold text-xs transition-all tracking-wider ${tabActiva === "emergencia" ? "bg-[#113e27] text-white shadow-md" : "text-slate-400"}`}
          >
            <span className="hidden sm:inline">ALERTAS DE PÁNICO</span>
            <span className="sm:hidden">PÁNICO</span>
          </button>
          <button
            onClick={() => setTabActiva("ciudadana")}
            className={`flex items-center gap-2 px-4 md:px-6 py-2 rounded-lg font-bold text-xs transition-all tracking-wider ${tabActiva === "ciudadana" ? "bg-[#113e27] text-white shadow-md" : "text-slate-400"}`}
          >
            <span className="hidden sm:inline">ALERTAS CIUDADANAS</span>
            <span className="sm:hidden">CIUDADANAS</span>
          </button>
        </div>
        <div className="bg-gray-50 text-gray-500 px-4 py-2.5 rounded-lg text-[11px] font-extrabold uppercase tracking-wider border border-gray-200">
          ● {dataActual.length} Registros activos
        </div>
      </div>

      {/* TABLA */}
      <div className="relative top-1 w-full bg-white px-4 md:px-7 py-4 md:py-6 rounded-2xl shadow-md flex flex-col max-h-[70vh] min-h-0">
        <h2 className="text-lg font-extrabold uppercase text-[#1e293b] mb-4 md:mb-6 tracking-wide flex-shrink-0">
          {tabActiva === "emergencia" ? "Bandeja de Emergencias" : "Reportes Ciudadanos"}
        </h2>

        <div className="overflow-auto flex-1 min-h-0 -mx-4 md:mx-0 px-4 md:px-0">
          <table className="min-w-full border-collapse text-left">
            <thead className="sticky top-0 bg-white z-10 shadow-sm">
              <tr className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
                <th className="pl-3 md:pl-4 pr-1 md:pr-2 py-2 w-[12%] md:w-[15%]">ID</th>
                <th className="py-2 w-[28%] md:w-[30%]">Ciudadano</th>
                <th className="px-1 md:px-2 py-2 w-[20%]">Ubicación</th>
                <th className="py-2 w-[18%] md:w-[15%]">Fecha y Hora</th>
                <th className="py-2 w-[12%] md:w-[15%]">Estado</th>
                <th className="px-3 md:px-4 py-2 w-[10%]">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {dataActual.map((item) => {
                // ✅ AGREGADO: calcular si está bloqueada por otro
                const bloqueadaPorOtro =
                  item.bloqueadoPor && item.bloqueadoPor !== user?.id_oficial;

                return (
                  <tr
                    key={item.id}
                    id={`fila-${item.id}`}
                    className={`bg-white group transition-all duration-200 border-b border-gray-100 ${
                      filaResaltada === item.id
                        ? "ring-2 bg-slate-50"
                        : bloqueadaPorOtro
                          // ✅ AGREGADO: fila atenuada si está bloqueada
                          ? "opacity-50"
                          : "hover:shadow-lg hover:-translate-y-0.5"
                    }`}
                  >
                    <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-5 md:py-6 text-[11px] font-bold text-slate-400 uppercase align-middle">
                      {item.codigo || item.id}
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
                            {item.prioridad} prioridad
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-5 md:py-6 text-[11px] font-bold text-slate-500 align-middle">
                      <div className="px-1 md:px-2">
                        <span className="truncate block max-w-[100px] md:max-w-none">{item.ubicacion}</span>
                      </div>
                    </td>
                    <td className="py-5 md:py-6 text-[11px] font-bold text-slate-500 align-middle whitespace-nowrap">
                      {item.fecha} {item.hora}
                    </td>
                    <td className="py-5 md:py-6 align-middle">
                      <span className={`inline-flex justify-center w-16 md:w-20 py-1.5 rounded-md text-[9px] font-extrabold text-white tracking-wide ${item.estado.toUpperCase() === "EMERGENCIA" ? "bg-red-600" : "bg-[#EBB615]"}`}>
                        {item.estado.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 md:px-4 py-5 md:py-6 align-middle">
                      {bloqueadaPorOtro ? (
                        // ✅ AGREGADO: candado si está bloqueada por otro operador
                        <div
                          title="En uso por otro operador"
                          className="p-1.5 md:p-2 bg-slate-300 text-white rounded-lg flex items-center justify-center cursor-not-allowed"
                        >
                          <FaLock size={14} />
                        </div>
                      ) : (
                        <button
                          onClick={() => abrirModal(item)}
                          className="p-1.5 md:p-2 bg-[#0C3DC2] text-white rounded-lg shadow hover:scale-105 active:scale-95 transition-all flex items-center justify-center"
                        >
                          <LuZoomIn size={14} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {dataActual.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400 font-medium">
                    No hay alertas en esta bandeja
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
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
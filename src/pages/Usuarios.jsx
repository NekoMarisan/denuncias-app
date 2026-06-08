import React, { useState, useEffect, useCallback } from "react";
import {
  FaEdit,
  FaTrashAlt,
  FaShieldAlt,
  FaUserTie,
  FaUsers,
  FaSearch,
  FaPlus,
  FaFileDownload,
  FaCheckCircle,
  FaFilePdf,
  FaFileExcel,
  FaPowerOff,
  FaUserSlash,
  FaSyncAlt
} from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../services/supabase";
import PerfilCiudadano from "../components/modals/PerfilCiudadano";
import NuevoPolicia from "../components/modals/NuevoPolicia";

function Usuarios() {
  const [tabActiva, setTabActiva] = useState("oficiales");
  const [filtroActivo, setFiltroActivo] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [ciudadanoSeleccionado, setCiudadanoSeleccionado] = useState(null);
  const [mostrarModalPolicia, setMostrarModalPolicia] = useState(false);
  const [editandoPolicia, setEditandoPolicia] = useState(null);

  const [oficiales, setOficiales] = useState([]);
  const [ciudadanos, setCiudadanos] = useState([]);

  const cargarOficiales = useCallback(async () => {
    const { data, error } = await supabase
      .from("oficial")
      .select("*")
      .order("id_oficial", { ascending: true });
    if (error) console.error("Error oficiales:", error);
    else {
      setOficiales(data || []);
      // Log para depuración (puedes eliminarlo)
      console.log("Oficiales cargados:", data?.map(o => ({ id: o.id_oficial, estado: o.estado })));
    }
  }, []);

  const cargarCiudadanos = useCallback(async () => {
    const { data, error } = await supabase
      .from("usuario_ciudadano")
      .select("*")
      .order("id_usuario", { ascending: true });
    if (error) console.error("Error ciudadanos:", error);
    else setCiudadanos(data || []);
  }, []);

  const recargarTodo = useCallback(async () => {
    setRefrescando(true);
    await Promise.all([cargarOficiales(), cargarCiudadanos()]);
    setRefrescando(false);
  }, [cargarOficiales, cargarCiudadanos]);

  // Carga inicial
  useEffect(() => {
    const cargarInicial = async () => {
      setCargando(true);
      await recargarTodo();
      setCargando(false);
    };
    cargarInicial();
  }, [recargarTodo]);

  // Recarga periódica cada 10 segundos (para reflejar cambios de estado)
  useEffect(() => {
    const interval = setInterval(() => {
      recargarTodo();
    }, 10000);
    return () => clearInterval(interval);
  }, [recargarTodo]);

  // Recarga cuando la ventana recupera el foco
  useEffect(() => {
    const handleFocus = () => {
      recargarTodo();
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [recargarTodo]);

  const eliminarOficial = async (id) => {
    if (!window.confirm("¿Eliminar este oficial?")) return;
    const { error } = await supabase.from("oficial").delete().eq("id_oficial", id);
    if (error) console.error("Error al eliminar:", error);
    else await cargarOficiales();
  };

  const habilitarCiudadano = async (ciudadano) => {
    if (!window.confirm(`¿Habilitar a ${ciudadano.nombre_completo}? La cuenta pasará a ACTIVO.`)) return;
    const { error } = await supabase
      .from("usuario_ciudadano")
      .update({ estado_cuenta: "ACTIVO" })
      .eq("id_usuario", ciudadano.id_usuario);
    if (error) console.error("Error al habilitar:", error);
    else await cargarCiudadanos();
  };

  // Funciones de exportación (sin cambios)
  const exportarPDF = () => {
    // ... (igual que antes)
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const titulo = tabActiva === "oficiales" ? "REPORTE DE PERSONAL POLICIAL" : "REPORTE DE REGISTRO DE CIUDADANOS";
    const fechaActual = new Date().toLocaleString("es-ES", {
      day: "numeric", month: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit", second: "2-digit", hour12: true
    });

    doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(0);
    doc.text(titulo, 20, 20);
    doc.setFontSize(9); doc.setTextColor(100, 100, 100);
    doc.text("CENTRAL RADIO PATRULLAS - COCHABAMBA", 20, 26);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(60, 60, 60);
    doc.text(`Fecha: ${fechaActual}`, 190, 20, { align: "right" });
    doc.text(`Total registros: ${datosFiltrados.length}`, 190, 26, { align: "right" });
    doc.setDrawColor(200); doc.line(20, 30, 190, 30);

    const headers = tabActiva === "oficiales"
      ? [["ID", "Oficial", "Escalafón / Rol", "Rango", "Celular", "Estado"]]
      : [["ID", "Ciudadano", "Cédula", "Celular", "Estado"]];

    const body = datosFiltrados.map(item =>
      tabActiva === "oficiales"
        ? [
            item.id_oficial,
            item.nombre_completo,
            `${item.numero_escalafon || "—"} - ${item.rol || "—"}`,
            item.cargo || "—",
            item.celular || "—",
            item.estado === true ? "Conectado" : "Desconectado"
          ]
        : [
            item.id_usuario,
            item.nombre_completo,
            item.ci,
            item.celular,
            item.estado_cuenta
          ]
    );

    autoTable(doc, {
      startY: 35, head: headers, body,
      theme: "grid",
      headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 }
    });

    const finalY = doc.lastAutoTable.finalY + 30;
    const admin = oficiales.find(o => o.rol === "Administrador")?.nombre_completo || "ADMINISTRADOR DE TURNO";
    doc.setDrawColor(0); doc.line(30, finalY, 85, finalY);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(0);
    doc.text("SISTEMA DE SEGURIDAD", 57.5, finalY + 5, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(120, 120, 120);
    doc.text(admin, 57.5, finalY + 10, { align: "center" });
    doc.line(125, finalY, 180, finalY);
    doc.setFont("helvetica", "bold"); doc.setFontSize(9); doc.setTextColor(0);
    doc.text("SELLO INSTITUCIONAL", 152.5, finalY + 5, { align: "center" });
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(120, 120, 120);
    doc.text("CENTRAL RADIO PATRULLAS", 152.5, finalY + 10, { align: "center" });
    doc.save(`Reporte_${tabActiva}.pdf`);
  };

  const exportarExcel = () => {
    const titulo = tabActiva === "oficiales" ? "PERSONAL POLICIAL" : "REGISTRO DE CIUDADANOS";
    const fecha = new Date().toLocaleString();
    const registros = datosFiltrados;

    let xmlExcel = `
      <xml xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"></head>
        <body>
          <tr><td colspan="6" style="font-size:16pt;font-weight:bold">${titulo}</td></tr>
          <tr><td colspan="6" style="color:#666">SISTEMA DE SEGURIDAD CIUDADANA - COCHABAMBA | Generado: ${fecha}</td></tr>
          <tr>
            ${tabActiva === "oficiales" 
              ? "<th>ID</th><th>OFICIAL</th><th>ESCALAFÓN / ROL</th><th>RANGO</th><th>CELULAR</th><th>ESTADO</th>"
              : "<th>ID</th><th>CIUDADANO</th><th>CÉDULA</th><th>CELULAR</th><th>ESTADO</th>"
            }
          </tr>
          ${registros.map(item => `
            <tr>
              <td>${tabActiva === "oficiales" ? item.id_oficial : item.id_usuario}</td>
              <td style="font-weight:bold">${item.nombre_completo}</td>
              ${tabActiva === "oficiales" ? `
                <td>${item.numero_escalafon || "—"} - ${item.rol || "—"}</td>
                <td>${item.cargo || "—"}</td>
                <td>${item.celular || ""}</td>
                <td style="font-weight:bold">${item.estado === true ? "Conectado" : "Desconectado"}</td>
              ` : `
                <td>${item.ci || ""}</td>
                <td>${item.celular || ""}</td>
                <td style="font-weight:bold">${item.estado_cuenta || ""}</td>
              `}
            </tr>
          `).join("")}
        </body>
      </xml>`;

    const blob = new Blob([xmlExcel], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_${tabActiva}.xls`;
    link.click();
  };

  const datosFiltrados = (tabActiva === "oficiales" ? oficiales : ciudadanos).filter((item) => {
    const nombre = item.nombre_completo?.toLowerCase() || "";
    const ci = item.ci?.toLowerCase() || "";
    const id = tabActiva === "oficiales" ? String(item.id_oficial) : String(item.id_usuario);
    const termino = busqueda.toLowerCase();
    const cumpleBusqueda = nombre.includes(termino) || ci.includes(termino) || id.includes(termino);

    if (tabActiva === "ciudadanos") return cumpleBusqueda;

    // Aseguramos la comparación booleana
    const estaConectado = item.estado === true;
    const cumpleFiltro =
      filtroActivo === "Todos" ||
      (filtroActivo === "conectado" && estaConectado) ||
      (filtroActivo === "desconectado" && !estaConectado);

    return cumpleBusqueda && cumpleFiltro;
  });

  if (cargando) {
    return (
      <div className="-mt-4 w-full px-1 py-5 bg-gray-50/30 min-h-screen flex items-center justify-center">
        <div className="text-green-800 font-bold text-lg">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="-mt-4 w-full px-1 py-4 space-y-5 animate-fadeIn pb-6 bg-gray-50/30">
      {/* Barra de herramientas con indicador de refresco */}
      <div className="w-full bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 shrink-0">
            <button
              onClick={() => { setTabActiva("oficiales"); setFiltroActivo("Todos"); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-extrabold text-[10px] transition-all ${tabActiva === "oficiales" ? "bg-green-800 text-white shadow-sm" : "text-slate-400"}`}
            >
              <FaUserTie size={12} /> OFICIALES
            </button>
            <button
              onClick={() => { setTabActiva("ciudadanos"); setFiltroActivo("Todos"); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg font-extrabold text-[10px] transition-all ${tabActiva === "ciudadanos" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400"}`}
            >
              <FaUsers size={12} /> CIUDADANOS
            </button>
          </div>

          <div className="relative flex-1">
            <FaSearch className={`absolute left-3 top-1/2 -translate-y-1/2 text-xs ${tabActiva === "oficiales" ? "text-green-700" : "text-blue-600"}`} />
            <input
              type="text"
              placeholder="Buscar por nombre, ID o CI..."
              className={`w-full pl-8 pr-3 py-2 bg-gray-50/50 border rounded-xl outline-none text-[11px] font-bold text-slate-700 transition-all focus:bg-white ${tabActiva === "oficiales" ? "border-gray-300 focus:border-green-600" : "border-gray-300 focus:border-blue-600"}`}
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>

          {tabActiva === "oficiales" && (
            <button
              onClick={() => { setEditandoPolicia(null); setMostrarModalPolicia(true); }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-extrabold text-[9px] uppercase shadow text-white bg-green-800 hover:bg-green-900 transition-all shrink-0"
            >
              <FaPlus size={10} /> Nuevo oficial
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {tabActiva === "oficiales" && (
            <div className="flex bg-gray-50 p-0.5 rounded-xl border border-gray-100">
              {["Todos", "conectado", "desconectado"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroActivo(f)}
                  className={`px-3 py-1 rounded-lg font-extrabold text-[9px] uppercase transition-all ${filtroActivo === f ? "bg-green-800 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  {f === "conectado" ? "Conectado" : f === "desconectado" ? "Desconectado" : "Todos"}
                </button>
              ))}
            </div>
          )}

          <div className="relative group">
            <button className="flex items-center gap-1.5 p-2 bg-white border-2 border-gray-200 text-slate-700 rounded-xl font-black uppercase text-[9px] hover:border-blue-600 transition-all">
              <FaFileDownload size={11} /> <span>Exportar</span>
            </button>
            <div className="absolute right-0 mt-1 w-36 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button onClick={exportarExcel} className="w-full px-3 py-1.5 text-left hover:bg-green-50 text-slate-600 font-bold text-[9px] flex items-center gap-2 transition-colors">
                <FaFileExcel className="text-green-600" size={11} /> Excel (.xls)
              </button>
              <button onClick={exportarPDF} className="w-full px-3 py-1.5 text-left hover:bg-red-50 text-slate-600 font-bold text-[9px] flex items-center gap-2 transition-colors">
                <FaFilePdf className="text-red-600" size={11} /> Guardar PDF
              </button>
            </div>
          </div>

          {/* Botón de recarga manual con indicador de refresco */}
          <button
            onClick={recargarTodo}
            disabled={refrescando}
            className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl transition-all"
            title="Recargar datos"
          >
            <FaSyncAlt className={`text-gray-600 text-xs ${refrescando ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Tabla (sin cambios) */}
      <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-50 text-left">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-black uppercase tracking-tight text-[#1e293b]">
            {tabActiva === "oficiales" ? "Personal Policial" : "Registro de Ciudadanos"}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3 table-fixed">
            <thead>
              <tr className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">
                <th className="px-3 pb-2 w-[8%] text-left">ID</th>
                <th className="pb-2 w-[22%] text-left">{tabActiva === "oficiales" ? "Oficial" : "Ciudadano"}</th>
                {tabActiva === "oficiales" ? (
                  <>
                    <th className="pb-2 w-[18%] text-left">Escalafón / Rol</th>
                    <th className="pb-2 w-[12%] text-left">Rango</th>
                    <th className="pb-2 w-[12%] text-left">Celular</th>
                    <th className="px-0 pb-2 w-[12%] text-left">Estado</th>
                  </>
                ) : (
                  <>
                    <th className="pb-2 w-[12%] text-left">Cédula</th>
                    <th className="pb-2 w-[12%] text-left">Celular</th>
                    <th className="px-0 pb-2 w-[12%] text-left">Estado</th>
                  </>
                )}
                <th className="px-4 pb-2 w-[10%] text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.map((item, i) => {
                const esOficial = tabActiva === "oficiales";
                const idMostrar = esOficial ? `ROF-${String(item.id_oficial).padStart(4, "0")}` : `REGC-${String(item.id_usuario).padStart(4, "0")}`;
                const estaConectado = item.estado === true;
                
                let IconoAcceso = null;
                if (item.acceso === "FUERA DE SERVICIO") {
                  IconoAcceso = <FaPowerOff size={12} className="text-amber-600 mr-1" title="FUERA DE SERVICIO" />;
                } else if (item.acceso === "DE BAJA") {
                  IconoAcceso = <FaUserSlash size={12} className="text-red-600 mr-1" title="DE BAJA" />;
                }

                return (
                  <tr key={i} className="bg-white group transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5">
                    <td className="px-3 py-3 text-[10px] font-bold text-slate-400 border-y border-l rounded-l-xl border-gray-50 uppercase text-left">{idMostrar}</td>
                    <td className="py-3 border-y border-gray-50">
                      <div className="flex items-center gap-3 text-left">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${!esOficial ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-700"}`}>
                          {!esOficial ? item.nombre_completo?.charAt(0) : <FaShieldAlt size={14} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-xs font-bold text-[#1e293b] leading-tight truncate">{item.nombre_completo}</span>
                        </div>
                      </div>
                    </td>
                    {esOficial ? (
                      <>
                        <td className="py-3 text-[10px] font-bold text-slate-500 border-y border-gray-50 text-left">
                          {item.numero_escalafon || "—"} - {item.rol || "—"}
                        </td>
                        <td className="py-3 text-[11px] font-extrabold text-slate-600 border-y border-gray-50 text-left">{item.cargo || "—"}</td>
                        <td className="py-3 text-[10px] font-bold text-slate-500 border-y border-gray-50 text-left">{item.celular || "—"}</td>
                        <td className="py-3 border-y border-gray-50 text-left">
                          <div className="flex items-center">
                            {IconoAcceso}
                            <span className={`inline-flex justify-center w-24 py-1.5 rounded-lg text-[9px] font-black uppercase text-white shadow-sm ${estaConectado ? "bg-[#00a65a]" : "bg-[#e00000]"}`}>
                              {estaConectado ? "Conectado" : "Desconectado"}
                            </span>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-3 text-[10px] font-bold text-slate-500 border-y border-gray-50 text-left">{item.ci || "—"}</td>
                        <td className="py-3 text-[11px] font-extrabold text-slate-600 border-y border-gray-50 text-left">{item.celular || "—"}</td>
                        <td className="py-3 border-y border-gray-50 text-left">
                          <div className="flex flex-col items-start justify-center">
                            <span className={`inline-flex justify-center w-28 py-1.5 rounded-lg text-[9px] font-black uppercase text-white shadow-sm ${
                              item.estado_cuenta === "ACTIVO" ? "bg-[#00a65a]" :
                              item.estado_cuenta === "ADVERTIDO" ? "bg-[#ff7e00]" :
                              item.estado_cuenta === "SUSPENDIDO" ? "bg-[#e00000]" : "bg-[#9da1a3]"
                            }`}>
                              {item.estado_cuenta}
                            </span>
                            {item.estado_cuenta === "ADVERTIDO" && (
                              <span className="text-[7px] font-black uppercase mt-0.5 tracking-tighter text-[#ff7e00] leading-none">REPORTES MALINTENCIONADOS</span>
                            )}
                            {item.estado_cuenta === "SUSPENDIDO" && (
                              <span className="text-[7px] font-black uppercase mt-0.5 tracking-tighter text-[#e00000] leading-none">LÍMITE DE ADVERTENCIA</span>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 border-y border-r rounded-r-xl border-gray-50 text-left">
                      <div className="flex items-center gap-2">
                        {esOficial ? (
                          <>
                            <button onClick={() => { setEditandoPolicia(item); setMostrarModalPolicia(true); }} className="p-2 bg-amber-500 text-white rounded-lg shadow shadow-amber-100 hover:scale-105 transition-all">
                              <FaEdit size={11} />
                            </button>
                            <button onClick={() => eliminarOficial(item.id_oficial)} className="p-2 bg-red-600 text-white rounded-lg shadow shadow-red-100 hover:scale-105 transition-all">
                              <FaTrashAlt size={11} />
                            </button>
                          </>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setCiudadanoSeleccionado({
                                nombre: item.nombre_completo,
                                id: item.id_usuario,
                                ci: item.ci,
                                celular: item.celular,
                                email: item.email,
                                foto_ci: item.foto_ci,
                                selfie: item.selfie,
                                estado: item.estado_cuenta,
                                fecha_registro: item.fecha_registro
                              })}
                              className="p-2 bg-blue-600 text-white rounded-lg shadow shadow-blue-100 hover:scale-105 transition-all shrink-0"
                            >
                              <FaSearch size={11} />
                            </button>
                            {item.estado_cuenta === "SUSPENDIDO" && (
                              <button
                                onClick={() => habilitarCiudadano(item)}
                                className="p-2 bg-green-600 text-white rounded-lg shadow shadow-green-100 hover:scale-105 transition-all shrink-0"
                                title="Habilitar cuenta"
                              >
                                <FaCheckCircle size={11} />
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {datosFiltrados.length === 0 && (
                <tr>
                  <td colSpan={tabActiva === "oficiales" ? 7 : 6} className="text-center py-12 text-gray-400 font-medium">
                    No hay registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <NuevoPolicia
        isOpen={mostrarModalPolicia}
        onClose={() => setMostrarModalPolicia(false)}
        onGuardado={cargarOficiales}
        editandoPolicia={editandoPolicia}
      />

      <PerfilCiudadano
        ciudadano={ciudadanoSeleccionado}
        onClose={() => setCiudadanoSeleccionado(null)}
        onActualizar={cargarCiudadanos}
      />
    </div>
  );
}

export default Usuarios;
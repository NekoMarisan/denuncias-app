import React, { useState, useEffect } from "react";
import {
  FaEdit,
  FaTrashAlt,
  FaShieldAlt,
  FaUserTie,
  FaUsers,
  FaSearch,
  FaPlus,
  FaFileDownload,
  FaTimes,
  FaCheckCircle,
  FaFilePdf,
  FaFileExcel
} from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "../services/supabase";
import PerfilCiudadano from "../components/modals/PerfilCiudadano";

function Usuarios() {
  const [tabActiva, setTabActiva]                   = useState("oficiales");
  const [filtroActivo, setFiltroActivo]             = useState("Todos");
  const [busqueda, setBusqueda]                     = useState("");
  const [mostrarModal, setMostrarModal]             = useState(false);
  const [editandoId, setEditandoId]                 = useState(null);
  const [cargando, setCargando]                     = useState(true);
  const [ciudadanoSeleccionado, setCiudadanoSeleccionado] = useState(null);

  const [nuevoOficial, setNuevoOficial] = useState({
    nombre_completo:  "",
    ci:               "",
    numero_escalafon: "",
    cargo:            "",
    rol:              "Operador",
    contrasena:       "",
    estado:           "EN SERVICIO"
  });

  const [oficiales, setOficiales]   = useState([]);
  const [ciudadanos, setCiudadanos] = useState([]);

  // ── CARGA INICIAL ──────────────────────────────────────────────────────────

  const cargarOficiales = async () => {
    const { data, error } = await supabase
      .from("oficial")
      .select("*")
      .order("id_oficial", { ascending: true });

    if (error) { console.error("Error oficiales:", error); return; }
    setOficiales(data || []);
  };

  const cargarCiudadanos = async () => {
    const { data, error } = await supabase
      .from("usuario_ciudadano")
      .select("*")
      .order("id_usuario", { ascending: true });

    if (error) { console.error("Error ciudadanos:", error); return; }
    setCiudadanos(data || []);
  };

  useEffect(() => {
    const cargar = async () => {
      setCargando(true);
      await Promise.all([cargarOficiales(), cargarCiudadanos()]);
      setCargando(false);
    };
    cargar();
  }, []);

  // ── EXPORTAR PDF ───────────────────────────────────────────────────────────

  const exportarPDF = () => {
    const doc        = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const titulo     = tabActiva === "oficiales" ? "REPORTE DE PERSONAL POLICIAL" : "REPORTE DE REGISTRO DE CIUDADANOS";
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
      ? [["ID", "Nombre", "CI", "Escalafón", "Cargo", "Rol", "Estado"]]
      : [["ID", "Nombre", "CI", "Celular", "Email", "Estado"]];

    const body = datosFiltrados.map(item =>
      tabActiva === "oficiales"
        ? [item.id_oficial, item.nombre_completo, item.ci, item.numero_escalafon, item.cargo, item.rol, item.estado]
        : [item.id_usuario, item.nombre_completo, item.ci, item.celular, item.email, item.estado_cuenta]
    );

    autoTable(doc, {
      startY: 35, head: headers, body,
      theme: "grid",
      headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 }
    });

    const finalY = doc.lastAutoTable.finalY + 30;
    const admin  = oficiales.find(o => o.rol === "Administrador")?.nombre_completo || "ADMINISTRADOR DE TURNO";
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

  // ── EXPORTAR EXCEL ─────────────────────────────────────────────────────────

  const exportarExcel = () => {
    const titulo   = tabActiva === "oficiales" ? "PERSONAL POLICIAL" : "REGISTRO DE CIUDADANOS";
    const fecha    = new Date().toLocaleString();
    const registros = datosFiltrados;

    const xmlExcel = `
      <xml xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8"></head>
        <body>
          <tr><td colspan="6" style="font-size:16pt;font-weight:bold">${titulo}</td></tr>
          <tr><td colspan="6" style="color:#666">SISTEMA DE SEGURIDAD CIUDADANA - COCHABAMBA | Generado: ${fecha}</td></tr>
          <tr>
            <th>ID</th><th>NOMBRE</th><th>CI</th>
            <th>${tabActiva === "oficiales" ? "ESCALAFÓN" : "CELULAR"}</th>
            <th>${tabActiva === "oficiales" ? "CARGO / ROL" : "EMAIL"}</th>
            <th>ESTADO</th>
          </tr>
          ${registros.map(item => `
            <tr>
              <td>${tabActiva === "oficiales" ? item.id_oficial : item.id_usuario}</td>
              <td style="font-weight:bold">${item.nombre_completo}</td>
              <td>${item.ci || ""}</td>
              <td>${tabActiva === "oficiales" ? (item.numero_escalafon || "") : (item.celular || "")}</td>
              <td>${tabActiva === "oficiales" ? `${item.cargo || ""} / ${item.rol || ""}` : (item.email || "")}</td>
              <td style="font-weight:bold">${tabActiva === "oficiales" ? (item.estado || "") : (item.estado_cuenta || "")}</td>
            </tr>
          `).join("")}
        </body>
      </xml>`;

    const blob = new Blob([xmlExcel], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href  = URL.createObjectURL(blob);
    link.download = `Reporte_${tabActiva}.xls`;
    link.click();
  };

  // ── CRUD OFICIALES ─────────────────────────────────────────────────────────

  const manejarGuardar = async (e) => {
    e.preventDefault();

    if (editandoId) {
      const { error } = await supabase
        .from("oficial")
        .update({
          nombre_completo:  nuevoOficial.nombre_completo,
          ci:               nuevoOficial.ci,
          numero_escalafon: nuevoOficial.numero_escalafon,
          cargo:            nuevoOficial.cargo,
          rol:              nuevoOficial.rol,
          estado:           nuevoOficial.estado,
          ...(nuevoOficial.contrasena ? { contrasena: nuevoOficial.contrasena } : {})
        })
        .eq("id_oficial", editandoId);

      if (error) { console.error("Error al actualizar:", error); return; }

    } else {
      const { error } = await supabase
        .from("oficial")
        .insert([{
          nombre_completo:  nuevoOficial.nombre_completo,
          ci:               nuevoOficial.ci,
          numero_escalafon: nuevoOficial.numero_escalafon,
          cargo:            nuevoOficial.cargo,
          rol:              nuevoOficial.rol,
          contrasena:       nuevoOficial.contrasena,
          estado:           "EN SERVICIO"
        }]);

      if (error) { console.error("Error al insertar:", error); return; }
    }

    await cargarOficiales();
    setMostrarModal(false);
  };

  const abrirModalEditar = (oficial) => {
    setEditandoId(oficial.id_oficial);
    setNuevoOficial({
      nombre_completo:  oficial.nombre_completo,
      ci:               oficial.ci               || "",
      numero_escalafon: oficial.numero_escalafon || "",
      cargo:            oficial.cargo            || "",
      rol:              oficial.rol              || "Operador",
      contrasena:       "",
      estado:           oficial.estado           || "EN SERVICIO"
    });
    setMostrarModal(true);
  };

  const eliminarOficial = async (id) => {
    if (!window.confirm("¿Eliminar este oficial?")) return;
    const { error } = await supabase.from("oficial").delete().eq("id_oficial", id);
    if (error) { console.error("Error al eliminar:", error); return; }
    await cargarOficiales();
  };

  // ── CIUDADANOS ─────────────────────────────────────────────────────────────

  const habilitarCiudadano = async (ciudadano) => {
    if (!window.confirm(`¿Habilitar a ${ciudadano.nombre_completo}?`)) return;
    const { error } = await supabase
      .from("usuario_ciudadano")
      .update({ estado_cuenta: "ACTIVO" })
      .eq("id_usuario", ciudadano.id_usuario);
    if (error) { console.error("Error al habilitar:", error); return; }
    await cargarCiudadanos();
  };

  // ── FILTRADO ───────────────────────────────────────────────────────────────

  const datosFiltrados = (tabActiva === "oficiales" ? oficiales : ciudadanos).filter((item) => {
    const nombre  = item.nombre_completo?.toLowerCase() || "";
    const ci      = item.ci?.toLowerCase()              || "";
    const id      = tabActiva === "oficiales"
                      ? String(item.id_oficial)
                      : String(item.id_usuario);
    const termino = busqueda.toLowerCase();

    const cumpleBusqueda = nombre.includes(termino) || ci.includes(termino) || id.includes(termino);
    const cumpleFiltro   = tabActiva === "ciudadanos" || filtroActivo === "Todos"
                            || item.estado?.toUpperCase() === filtroActivo.toUpperCase();
    return cumpleBusqueda && cumpleFiltro;
  });

  // ── RENDER ─────────────────────────────────────────────────────────────────

  if (cargando) {
    return (
      <div className="-mt-4 w-full px-1 py-5 bg-gray-50/30 min-h-screen flex items-center justify-center">
        <div className="text-green-800 font-bold text-lg">Cargando usuarios...</div>
      </div>
    );
  }

  return (
    <div className="-mt-4 w-full px-1 py-4 space-y-5 animate-fadeIn pb-6 bg-gray-50/30">

      {/* BARRA DE HERRAMIENTAS */}
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
              onClick={() => {
                setEditandoId(null);
                setNuevoOficial({ nombre_completo: "", ci: "", numero_escalafon: "", cargo: "", rol: "Operador", contrasena: "", estado: "EN SERVICIO" });
                setMostrarModal(true);
              }}
              className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-extrabold text-[9px] uppercase shadow text-white bg-green-800 hover:bg-green-900 transition-all shrink-0"
            >
              <FaPlus size={10} /> Nuevo oficial
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {tabActiva === "oficiales" && (
            <div className="flex bg-gray-50 p-0.5 rounded-xl border border-gray-100">
              {["Todos", "En servicio", "Fuera de turno"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltroActivo(f)}
                  className={`px-3 py-1 rounded-lg font-extrabold text-[9px] uppercase transition-all ${filtroActivo === f ? "bg-green-800 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
                >
                  {f}
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
        </div>
      </div>

      {/* TABLA */}
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
                <th className="px-3 pb-2 w-[12%] text-left">ID</th>
                <th className="pb-2 w-[28%] text-left">{tabActiva === "oficiales" ? "Oficial" : "Ciudadano"}</th>
                <th className="pb-2 w-[15%] text-left">Cédula</th>
                <th className="pb-2 w-[20%] text-left">{tabActiva === "oficiales" ? "Escalafón / Cargo" : "Celular"}</th>
                <th className="pb-2 w-[15%] text-left">Estado</th>
                <th className="px-4 pb-2 w-[10%] text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.map((item, i) => (
                <tr key={i} className="bg-white group transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5">

                  <td className="px-3 py-3 text-[10px] font-bold text-slate-400 border-y border-l rounded-l-xl border-gray-50 uppercase text-left">
                    {tabActiva === "oficiales" ? `ROF-${String(item.id_oficial).padStart(4,"0")}` : `REGC-${String(item.id_usuario).padStart(4,"0")}`}
                  </td>

                  <td className="py-3 border-y border-gray-50">
                    <div className="flex items-center gap-3 text-left">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${tabActiva === "ciudadanos" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-700"}`}>
                        {tabActiva === "ciudadanos" ? item.nombre_completo?.charAt(0) : <FaShieldAlt size={14} />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#1e293b] leading-tight truncate">{item.nombre_completo}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          {tabActiva === "oficiales" ? `${item.rol || ""}` : "Ciudadano Verificado"}
                        </span>
                      </div>
                    </div>
                  </td>

                  <td className="py-3 text-[10px] font-bold text-slate-500 border-y border-gray-50 text-left">
                    {item.ci || "—"}
                  </td>

                  <td className="py-3 border-y border-gray-50 text-left">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-extrabold text-slate-600 truncate">
                        {tabActiva === "oficiales" ? (item.numero_escalafon || "—") : (item.celular || "—")}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">
                        {tabActiva === "oficiales" ? (item.cargo || "") : "Contacto"}
                      </span>
                    </div>
                  </td>

                  <td className="py-3 border-y border-gray-50 text-left">
                    <div className="flex flex-col items-start justify-center">
                      <span className={`inline-flex justify-center w-24 py-1.5 rounded-lg text-[9px] font-black uppercase text-white shadow-sm ${
                        (tabActiva === "oficiales" ? item.estado : item.estado_cuenta) === "EN SERVICIO" || (tabActiva === "oficiales" ? item.estado : item.estado_cuenta) === "ACTIVO"
                          ? "bg-[#00a65a]"
                          : (tabActiva === "oficiales" ? item.estado : item.estado_cuenta) === "FUERA DE TURNO" || (tabActiva === "oficiales" ? item.estado : item.estado_cuenta) === "SUSPENDIDO"
                          ? "bg-[#e00000]"
                          : (tabActiva === "oficiales" ? item.estado : item.estado_cuenta) === "ADVERTIDO"
                          ? "bg-[#ff7e00]"
                          : "bg-[#9da1a3]"
                      }`}>
                        {tabActiva === "oficiales" ? item.estado : item.estado_cuenta}
                      </span>
                      {tabActiva === "ciudadanos" && (
                        <>
                          {item.estado_cuenta === "ADVERTIDO" && (
                            <span className="text-[7px] font-black uppercase mt-0.5 tracking-tighter text-[#ff7e00] leading-none">REPORTES MALINTENCIONADOS</span>
                          )}
                          {item.estado_cuenta === "SUSPENDIDO" && (
                            <span className="text-[7px] font-black uppercase mt-0.5 tracking-tighter text-[#e00000] leading-none">LÍMITE DE ADVERTENCIA</span>
                          )}
                        </>
                      )}
                    </div>
                  </td>

                  <td className="px-4 py-3 border-y border-r rounded-r-xl border-gray-50 text-left">
                    <div className="flex items-center gap-2">
                      {tabActiva === "oficiales" ? (
                        <>
                          <button onClick={() => abrirModalEditar(item)} className="p-2 bg-amber-500 text-white rounded-lg shadow shadow-amber-100 hover:scale-105 transition-all">
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
                              nombre:          item.nombre_completo,
                              id:              item.id_usuario,
                              ci:              item.ci,
                              celular:         item.celular,
                              email:           item.email,
                              foto_ci:         item.foto_ci,
                              selfie:          item.selfie,
                              estado:          item.estado_cuenta,
                              fecha_registro:  item.fecha_registro
                            })}
                            className="p-2 bg-blue-600 text-white rounded-lg shadow shadow-blue-100 hover:scale-105 transition-all shrink-0"
                          >
                            <FaSearch size={11} />
                          </button>
                          {item.estado_cuenta === "SUSPENDIDO" && (
                            <button onClick={() => habilitarCiudadano(item)} className="p-2 bg-green-600 text-white rounded-lg shadow shadow-green-100 hover:scale-105 transition-all shrink-0">
                              <FaCheckCircle size={11} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </td>

                </tr>
              ))}
              {datosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="6" className="text-center py-12 text-gray-400 font-medium">
                    No hay registros
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL OFICIAL */}
      {mostrarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-left border border-gray-100">
            <div className="bg-green-800 p-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-black uppercase tracking-tight">
                {editandoId ? "Editar Oficial" : "Nuevo Oficial"}
              </h3>
              <button onClick={() => setMostrarModal(false)} className="p-1.5 bg-green-700 hover:bg-red-500 rounded-lg transition-all">
                <FaTimes size={14} />
              </button>
            </div>

            <form className="p-5 grid grid-cols-2 gap-3" onSubmit={manejarGuardar}>

              <div className="col-span-2 space-y-0.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1.5">Nombre Completo</label>
                <input required type="text" className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none transition-all"
                  value={nuevoOficial.nombre_completo} onChange={(e) => setNuevoOficial({ ...nuevoOficial, nombre_completo: e.target.value })} />
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1.5">Cédula de Identidad</label>
                <input required type="text" className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none transition-all"
                  value={nuevoOficial.ci} onChange={(e) => setNuevoOficial({ ...nuevoOficial, ci: e.target.value })} />
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1.5">Número de Escalafón</label>
                <input required type="text" className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none transition-all"
                  value={nuevoOficial.numero_escalafon} onChange={(e) => setNuevoOficial({ ...nuevoOficial, numero_escalafon: e.target.value })} />
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1.5">Cargo</label>
                <input required type="text" className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none transition-all"
                  value={nuevoOficial.cargo} onChange={(e) => setNuevoOficial({ ...nuevoOficial, cargo: e.target.value })} />
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1.5">Rol</label>
                <select className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none transition-all"
                  value={nuevoOficial.rol} onChange={(e) => setNuevoOficial({ ...nuevoOficial, rol: e.target.value })}>
                  <option value="Administrador">Administrador</option>
                  <option value="Operador">Operador</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>

              <div className="space-y-0.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1.5">Estado</label>
                <select className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none transition-all"
                  value={nuevoOficial.estado} onChange={(e) => setNuevoOficial({ ...nuevoOficial, estado: e.target.value })}>
                  <option value="EN SERVICIO">En Servicio</option>
                  <option value="FUERA DE TURNO">Fuera de Turno</option>
                </select>
              </div>

              <div className="col-span-2 space-y-0.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1.5">
                  Contraseña {editandoId && <span className="text-[8px] normal-case font-normal">(dejar vacío para no cambiar)</span>}
                </label>
                <input type="password" className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none transition-all"
                  value={nuevoOficial.contrasena} onChange={(e) => setNuevoOficial({ ...nuevoOficial, contrasena: e.target.value })}
                  {...(!editandoId ? { required: true } : {})} />
              </div>

              <div className="col-span-2 pt-3 flex gap-3">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 py-2 font-black uppercase text-[9px] text-slate-400">Cancelar</button>
                <button type="submit" className="flex-[2] py-2 bg-green-800 text-white rounded-xl font-black uppercase text-[9px] shadow hover:bg-green-900 transition-all">
                  {editandoId ? "Actualizar" : "Guardar"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* MODAL PERFIL CIUDADANO */}
      <PerfilCiudadano
        ciudadano={ciudadanoSeleccionado}
        onClose={() => setCiudadanoSeleccionado(null)}
        onActualizar={cargarCiudadanos}
      />

    </div>
  );
}

export default Usuarios;

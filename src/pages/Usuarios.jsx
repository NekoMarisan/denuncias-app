import React, { useState } from "react";
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

function Usuarios() {
  const [tabActiva, setTabActiva] = useState("oficiales");
  const [filtroActivo, setFiltroActivo] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarModal, setMostrarModal] = useState(false);
  const [editandoId, setEditandoId] = useState(null);

  const [nuevoOficial, setNuevoOficial] = useState({
    nombre: "", ci: "", celular: "", rol: "Operador", usuario: "", password: "", cargo: ""
  });

  const [oficiales, setOficiales] = useState([
    { id: "ROF-0001", nombre: "Ricardo Jorge Arza Montaño", ci: "6958647 CB", escalafon: "77889944", rango: "Capitán", division: "Administrador", estado: "EN SERVICIO" },
    { id: "ROF-0002", nombre: "Luciano David Antezana Grageda", ci: "6958647 CB", escalafon: "66554433", rango: "Sargento", division: "Operador", estado: "EN SERVICIO" },
    { id: "ROF-0003", nombre: "Ricardo Jorge Arza Montaño", ci: "6958647 CB", escalafon: "71122334", rango: "Teniente", division: "Supervisor", estado: "FUERA DE TURNO" },
  ]);

  const [ciudadanos, setCiudadanos] = useState([
    { id: "REGC-0001", nombre: "Alex Cristhian Velarde Diaz", celular: "70712345", ci: "69326585 LP", estado: "ACTIVO" },
    { id: "REGC-0002", nombre: "Cristhian Luis Velarde Diaz", celular: "60654321", ci: "69326585 SC", estado: "ADVERTIDO" },
    { id: "REGC-0003", nombre: "Juan Perez", celular: "77788899", ci: "1234567 CB", estado: "SUSPENDIDO" },
    { id: "REGC-0004", nombre: "Maria Lopez", celular: "65412300", ci: "7654321 SC", estado: "INACTIVO" },
  ]);

  // ================= NUEVA FUNCIÓN EXPORTAR PDF =================
  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const titulo = tabActiva === "oficiales" ? "REPORTE DE PERSONAL POLICIAL" : "REPORTE DE REGISTRO DE CIUDADANOS";
    
    // Obtener fecha y hora actual
    const fechaActual = new Date().toLocaleString('es-ES', { 
      day: 'numeric', month: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true 
    });

    // --- ENCABEZADO IZQUIERDO ---
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(titulo, 20, 20); // x=20 es la izquierda

    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("CENTRAL RADIO PATRULLAS - COCHABAMBA", 20, 26);

    // --- INFORMACIÓN DERECHA ---
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    // Alineamos a la derecha usando x=190 y el parámetro align: 'right'
    doc.text(`Fecha: ${fechaActual}`, 190, 20, { align: 'right' });
    doc.text(`Total registros: ${datosFiltrados.length}`, 190, 26, { align: 'right' });

    // Línea divisoria decorativa
    doc.setDrawColor(200);
    doc.line(20, 30, 190, 30);

    // --- TABLA ---
    const headers = tabActiva === "oficiales" 
      ? [['ID', 'Nombre', 'CI', 'Rango/Cargo', 'División', 'Estado']]
      : [['ID', 'Nombre', 'CI', 'Celular', 'Estado']];

    const body = datosFiltrados.map(item => (
      tabActiva === "oficiales"
        ? [item.id, item.nombre, item.ci, item.rango, item.division, item.estado]
        : [item.id, item.nombre, item.ci, item.celular, item.estado]
    ));

    autoTable(doc, {
      startY: 35,
      head: headers,
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [20, 83, 45], textColor: [255, 255, 255] },
      styles: { fontSize: 8 },
      margin: { left: 20, right: 20 }
    });

    // --- SECCIÓN DE FIRMAS ---
    const finalY = doc.lastAutoTable.finalY + 30;
    const admin = oficiales.find(o => o.division === "Administrador")?.nombre || "ADMINISTRADOR DE TURNO";

    // Firma Izquierda
    doc.setDrawColor(0);
    doc.line(30, finalY, 85, finalY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text("SISTEMA DE SEGURIDAD", 57.5, finalY + 5, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text(admin, 57.5, finalY + 10, { align: 'center' });

    // Firma Derecha
    doc.line(125, finalY, 180, finalY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(0);
    doc.text("SELLO INSTITUCIONAL", 152.5, finalY + 5, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("CENTRAL RADIO PATRULLAS", 152.5, finalY + 10, { align: 'center' });

    doc.save(`Reporte_${tabActiva}.pdf`);
  };

  const exportarExcel = () => {
    const titulo = tabActiva === "oficiales" ? "PERSONAL POLICIAL" : "REGISTRO DE CIUDADANOS";
    const registros = datosFiltrados;
    const fecha = new Date().toLocaleString();

    let xmlExcel = `
      <xml xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" xmlns="http://www.w3.org/TR/REC-html40">
        <head>
          <meta http-equiv="content-type" content="application/vnd.ms-excel; charset=UTF-8">
          <style>
            .title { font-size: 16pt; font-weight: bold; }
            .subtitle { font-size: 10pt; color: #666666; }
            td { border: 0.5pt solid #e2e8f0; padding: 5px; }
            th { background-color: #f1f5f9; border: 0.5pt solid #e2e8f0; font-weight: bold; text-align: left; }
          </style>
        </head>
        <body>
          <table>
            <tr><td colspan="5" class="title">${titulo}</td></tr>
            <tr><td colspan="5" class="subtitle">SISTEMA DE SEGURIDAD CIUDADANA - COCHABAMBA | Generado: ${fecha}</td></tr>
            <thead>
              <tr>
                <th>ID REGISTRO</th>
                <th>NOMBRE</th>
                <th>CI / DOCUMENTO</th>
                <th>${tabActiva === "oficiales" ? "RANGO / CARGO" : "CELULAR"}</th>
                <th>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              ${registros.map(item => `
                <tr>
                  <td>${item.id}</td>
                  <td style="font-weight: bold;">${item.nombre}</td>
                  <td>${item.ci}</td>
                  <td>${tabActiva === "oficiales" ? item.rango : item.celular}</td>
                  <td style="font-weight: bold;">${item.estado}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </xml>`;

    const blob = new Blob([xmlExcel], { type: "application/vnd.ms-excel" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `Reporte_${tabActiva}.xls`;
    link.click();
  };

  const manejarGuardar = (e) => {
    e.preventDefault();
    if (editandoId) {
      setOficiales(oficiales.map(of => of.id === editandoId ? { ...of, nombre: nuevoOficial.nombre, ci: nuevoOficial.ci, escalafon: nuevoOficial.celular, rango: nuevoOficial.cargo, division: nuevoOficial.rol } : of));
    } else {
      setOficiales([...oficiales, { id: `ROF-000${oficiales.length + 1}`, ...nuevoOficial, escalafon: nuevoOficial.celular, rango: nuevoOficial.cargo, division: nuevoOficial.rol, estado: "EN SERVICIO" }]);
    }
    setMostrarModal(false);
  };

  const abrirModalEditar = (oficial) => {
    setEditandoId(oficial.id);
    setNuevoOficial({ nombre: oficial.nombre, ci: oficial.ci, celular: oficial.escalafon, rol: oficial.division, usuario: oficial.id, password: "", cargo: oficial.rango });
    setMostrarModal(true);
  };

  const eliminarOficial = (id) => {
    if (window.confirm("¿Eliminar registro?")) setOficiales(oficiales.filter(of => of.id !== id));
  };

  const habilitarCiudadano = (ciudadano) => {
    if (window.confirm(`¿Habilitar al ciudadano ${ciudadano.nombre}?`)) {
      setCiudadanos(ciudadanos.map(c => c.id === ciudadano.id ? { ...c, estado: "ACTIVO" } : c));
    }
  };

  const datosFiltrados = (tabActiva === "oficiales" ? oficiales : ciudadanos).filter((item) => {
    const cumpleBusqueda = item.nombre.toLowerCase().includes(busqueda.toLowerCase()) || item.id.toLowerCase().includes(busqueda.toLowerCase()) || item.ci.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleFiltro = tabActiva === "ciudadanos" || filtroActivo === "Todos" || item.estado.toUpperCase() === filtroActivo.toUpperCase();
    return cumpleBusqueda && cumpleFiltro;
  });

  return (
    <div className="-mt-9 w-full px-2 py-8 space-y-8 animate-fadeIn pb-10 bg-gray-50/30">
      
      {/* BARRA DE HERRAMIENTAS */}
      <div className="w-full bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex items-center justify-between gap-6">
        <div className="flex items-center gap-6 flex-1">
          <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100 shrink-0">
            <button onClick={() => { setTabActiva("oficiales"); setFiltroActivo("Todos"); }} className={`flex items-center gap-3 px-10 py-3.5 rounded-xl font-extrabold transition-all ${tabActiva === "oficiales" ? "bg-green-800 text-white shadow-green-100" : "text-slate-400"}`}>
              <FaUserTie size={16} /> OFICIALES
            </button>
            <button onClick={() => { setTabActiva("ciudadanos"); setFiltroActivo("Todos"); }} className={`flex items-center gap-3 px-10 py-3.5 rounded-xl font-extrabold transition-all ${tabActiva === "ciudadanos" ? "bg-blue-600 text-white shadow-lg shadow-slate-200" : "text-slate-400"}`}>
              <FaUsers size={16} /> CIUDADANOS
            </button>
          </div>

          <div className="relative flex-1">
            <FaSearch className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${tabActiva === "oficiales" ? "text-green-700" : "text-blue-600"}`} />
            <input 
              type="text" 
              placeholder="Buscar por nombre, ID o CI..." 
              className={`w-full pl-14 pr-4 py-4 bg-gray-50/50 border rounded-2xl outline-none text-md font-bold text-slate-700 transition-all focus:bg-white ${tabActiva === "oficiales" ? "border-gray-300 focus:border-green-600" : "border-gray-300 focus:border-blue-600"}`} 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
            />
          </div>

          {tabActiva === "oficiales" && (
            <button onClick={() => { setEditandoId(null); setNuevoOficial({ nombre: "", ci: "", celular: "", rol: "Operador", usuario: "", password: "", cargo: "" }); setMostrarModal(true); }} className="flex items-center gap-2 px-10 py-4 rounded-2xl font-extrabold text-[12px] uppercase shadow-lg text-white bg-green-800 hover:bg-green-900 transition-all shrink-0">
              <FaPlus /> Nuevo oficial
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {tabActiva === "oficiales" && (
            <div className="flex bg-gray-50 p-2 rounded-[1.5rem] border border-gray-100">
              {["Todos", "En servicio", "Fuera de turno"].map((f) => (
                <button key={f} onClick={() => setFiltroActivo(f)} className={`px-8 py-3 rounded-2xl font-extrabold text-[12px] uppercase transition-all ${filtroActivo === f ? "bg-green-800 text-white shadow-md" : "text-gray-400 hover:text-gray-600"}`}>{f}</button>
              ))}
            </div>
          )}

          <div className="relative group">
            <button className="flex items-center gap-2 p-4 bg-white border-[3px] border-gray-200 text-slate-700 rounded-2xl font-black uppercase text-[12px] hover:border-blue-600 transition-all">
              <FaFileDownload size={18} /> <span>Exportar</span>
            </button>
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
              <button onClick={exportarExcel} className="w-full px-4 py-3 text-left hover:bg-green-50 text-slate-600 font-bold text-sm flex items-center gap-3 transition-colors">
                <FaFileExcel className="text-green-600" size={16} /> Excel (.xls)
              </button>
              <button onClick={exportarPDF} className="w-full px-4 py-3 text-left hover:bg-red-50 text-slate-600 font-bold text-sm flex items-center gap-3 transition-colors">
                <FaFilePdf className="text-red-600" size={16} /> Guardar PDF
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="w-full bg-white p-12 rounded-3xl shadow-sm border border-gray-50 text-left">
        <div className="flex justify-between items-center mb-12">
          <h2 className="text-3xl font-black uppercase tracking-tight text-[#1e293b]">{tabActiva === "oficiales" ? "Personal Policial" : "Registro de Ciudadanos"}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-4 table-fixed">
            <thead>
              <tr className="text-slate-400 text-[13px] font-extrabold uppercase tracking-[0.2em]">
                <th className="px-8 pb-4 w-[15%] text-left">ID Registro</th>
                <th className="pb-4 w-[30%] text-left">{tabActiva === "oficiales" ? "Oficial" : "Ciudadano"}</th>
                <th className="pb-4 w-[15%] text-left">Cédula / Doc.</th>
                <th className="pb-4 w-[20%] text-left">{tabActiva === "oficiales" ? "Cargo / Rol" : "Número Celular"}</th>
                <th className="px-0 pb-4 w-[15%] text-left">Estado</th>
                <th className="px-8 pb-4 w-[10%] text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.map((item, i) => (
                <tr key={i} className="bg-white group transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                  <td className="px-8 py-8 text-md font-bold text-slate-400 border-y border-l rounded-l-[2.5rem] border-gray-50 uppercase text-left">{item.id}</td>
                  <td className="py-5 border-y border-gray-50">
                    <div className="flex items-center gap-5 text-left">
                      <div className={`w-14 h-14 rounded-[1.2rem] flex items-center justify-center font-black text-xl shrink-0 shadow-inner ${tabActiva === "ciudadanos" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-700"}`}>
                        {tabActiva === "ciudadanos" ? item.nombre.charAt(0) : <FaShieldAlt size={24} />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-lg font-bold text-[#1e293b] leading-tight truncate">{item.nombre}</span>
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          {tabActiva === "oficiales" ? "Cochabamba - Bolivia" : "Ciudadano Verificado"}
                        </span>
                      </div>
                    </div>
                   </td>
                  <td className="py-5 text-md font-bold text-slate-500 border-y border-gray-50 text-left">{item.ci}</td>
                  <td className="py-5 border-y border-gray-50 text-left">
                    <div className="flex flex-col">
                      <span className="text-base font-extrabold text-slate-600 truncate">
                        {tabActiva === "oficiales" ? item.rango : item.celular}
                      </span>
                      <span className="text-[13px] text-slate-400 font-semibold uppercase">
                        {tabActiva === "oficiales" ? item.division : "Contacto"}
                      </span>
                    </div>
                   </td>
                  <td className="py-5 border-y border-gray-50 px-0 text-left">
                    <div className="flex flex-col items-start justify-center">
                      <span className={`inline-flex justify-center w-32 py-3 rounded-xl text-[11px] font-black uppercase text-white shadow-md transition-all ${
                        item.estado === "EN SERVICIO" || item.estado === "ACTIVO" 
                          ? "bg-[#00a65a]" // Verde
                          : item.estado === "FUERA DE TURNO" || item.estado === "SUSPENDIDO"
                          ? "bg-[#e00000]" // Rojo
                          : item.estado === "ADVERTIDO"
                          ? "bg-[#ff7e00]" // Naranja
                          : "bg-[#9da1a3]" // Gris (Inactivo)
                      }`}>
                        {item.estado}
                      </span>

                      {tabActiva === "ciudadanos" && (
                        <>
                          {item.estado === "ADVERTIDO" && (
                            <span className="text-[9px] font-black uppercase mt-1 tracking-tighter text-[#ff7e00] leading-none">
                              REPORTES MALINTENCIONADOS
                            </span>
                          )}
                          {item.estado === "SUSPENDIDO" && (
                            <span className="text-[9px] font-black uppercase mt-1 tracking-tighter text-[#e00000] leading-none">
                              LÍMITE DE ADVERTENCIA EXCEDIO
                            </span>
                          )}
                        </>
                      )}
                    </div>
                   </td>
                  <td className="px-8 py-5 border-y border-r rounded-r-[2.5rem] border-gray-50 text-left">
                    <div className="flex items-center gap-3">
                      {tabActiva === "oficiales" ? (
                        <>
                          <button onClick={() => abrirModalEditar(item)} className="p-4 bg-[#f59e0b] text-white rounded-2xl shadow-lg shadow-amber-100 hover:scale-110 transition-all"><FaEdit size={18} /></button>
                          <button onClick={() => eliminarOficial(item.id)} className="p-4 bg-red-600 text-white rounded-2xl shadow-lg shadow-red-100 hover:scale-110 transition-all"><FaTrashAlt size={18} /></button>
                        </>
                      ) : (
                        <div className="flex items-center gap-3">
                          <button className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100 hover:scale-110 active:scale-95 transition-all shrink-0">
                            <FaSearch size={18} />
                          </button>
                          {item.estado === "SUSPENDIDO" && (
                            <button onClick={() => habilitarCiudadano(item)} className="p-4 bg-green-600 text-white rounded-2xl shadow-lg shadow-green-100 hover:scale-110 active:scale-95 transition-all shrink-0">
                              <FaCheckCircle size={18} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL */}
      {mostrarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden text-left border border-gray-100">
            <div className="bg-green-800 p-8 flex justify-between items-center text-white">
              <h3 className="text-2xl font-black uppercase tracking-tight">{editandoId ? "Editar Oficial" : "Nuevo Oficial"}</h3>
              <button onClick={() => setMostrarModal(false)} className="p-3 bg-green-700 hover:bg-red-500 rounded-2xl transition-all"><FaTimes size={20} /></button>
            </div>
            <form className="p-10 grid grid-cols-2 gap-5" onSubmit={manejarGuardar}>
              <div className="col-span-2 space-y-1">
                <label className="text-[12px] font-black uppercase text-slate-400 ml-2">Nombre Completo</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-gray-50 border rounded-2xl font-bold text-slate-700 focus:border-green-600 outline-none transition-all" value={nuevoOficial.nombre} onChange={(e) => setNuevoOficial({...nuevoOficial, nombre: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Cédula</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-gray-50 border rounded-2xl font-bold text-slate-700 focus:border-green-600 outline-none transition-all" value={nuevoOficial.ci} onChange={(e) => setNuevoOficial({...nuevoOficial, ci: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Celular</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-gray-50 border rounded-2xl font-bold text-slate-700 focus:border-green-600 outline-none transition-all" value={nuevoOficial.celular} onChange={(e) => setNuevoOficial({...nuevoOficial, celular: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Cargo</label>
                <input required type="text" className="w-full px-5 py-3.5 bg-gray-50 border rounded-2xl font-bold text-slate-700 focus:border-green-600 outline-none transition-all" value={nuevoOficial.cargo} onChange={(e) => setNuevoOficial({...nuevoOficial, cargo: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Rol</label>
                <select className="w-full px-5 py-3.5 bg-gray-50 border rounded-2xl font-bold text-slate-700 focus:border-green-600 outline-none transition-all" value={nuevoOficial.rol} onChange={(e) => setNuevoOficial({...nuevoOficial, rol: e.target.value})}>
                  <option value="Administrador">Administrador</option>
                  <option value="Operador">Operador</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>
              <div className="col-span-2 pt-4 flex gap-4">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 py-4 font-black uppercase text-slate-400">Cancelar</button>
                <button type="submit" className="flex-[2] py-4 bg-green-800 text-white rounded-2xl font-black uppercase shadow-xl hover:bg-green-900 transition-all">{editandoId ? "Actualizar" : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;
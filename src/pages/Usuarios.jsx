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
import { supabase } from '../services/supabase'

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

  const exportarPDF = () => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const titulo = tabActiva === "oficiales" ? "REPORTE DE PERSONAL POLICIAL" : "REPORTE DE REGISTRO DE CIUDADANOS";
    const fechaActual = new Date().toLocaleString('es-ES', { 
      day: 'numeric', month: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true 
    });

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0);
    doc.text(titulo, 20, 20);
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("CENTRAL RADIO PATRULLAS - COCHABAMBA", 20, 26);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);
    doc.text(`Fecha: ${fechaActual}`, 190, 20, { align: 'right' });
    doc.text(`Total registros: ${datosFiltrados.length}`, 190, 26, { align: 'right' });
    doc.setDrawColor(200);
    doc.line(20, 30, 190, 30);

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

    const finalY = doc.lastAutoTable.finalY + 30;
    const admin = oficiales.find(o => o.division === "Administrador")?.nombre || "ADMINISTRADOR DE TURNO";
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
          <tr>
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
    <div className="-mt-4 w-full px-1 py-4 space-y-5 animate-fadeIn pb-6 bg-gray-50/30">
      
      {/* BARRA DE HERRAMIENTAS - REDUCIDA */}
      <div className="w-full bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4 flex-1">
          <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100 shrink-0">
            <button onClick={() => { setTabActiva("oficiales"); setFiltroActivo("Todos"); }} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-extrabold text-[10px] transition-all ${tabActiva === "oficiales" ? "bg-green-800 text-white shadow-sm" : "text-slate-400"}`}>
              <FaUserTie size={12} /> OFICIALES
            </button>
            <button onClick={() => { setTabActiva("ciudadanos"); setFiltroActivo("Todos"); }} className={`flex items-center gap-2 px-5 py-2 rounded-lg font-extrabold text-[10px] transition-all ${tabActiva === "ciudadanos" ? "bg-blue-600 text-white shadow-sm" : "text-slate-400"}`}>
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
            <button onClick={() => { setEditandoId(null); setNuevoOficial({ nombre: "", ci: "", celular: "", rol: "Operador", usuario: "", password: "", cargo: "" }); setMostrarModal(true); }} className="flex items-center gap-1.5 px-5 py-2 rounded-xl font-extrabold text-[9px] uppercase shadow text-white bg-green-800 hover:bg-green-900 transition-all shrink-0">
              <FaPlus size={10} /> Nuevo oficial
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {tabActiva === "oficiales" && (
            <div className="flex bg-gray-50 p-0.5 rounded-xl border border-gray-100">
              {["Todos", "En servicio", "Fuera de turno"].map((f) => (
                <button key={f} onClick={() => setFiltroActivo(f)} className={`px-3 py-1 rounded-lg font-extrabold text-[9px] uppercase transition-all ${filtroActivo === f ? "bg-green-800 text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}>{f}</button>
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

      {/* TABLA PRINCIPAL - REDUCIDA */}
      <div className="w-full bg-white p-5 rounded-2xl shadow-sm border border-gray-50 text-left">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-black uppercase tracking-tight text-[#1e293b]">{tabActiva === "oficiales" ? "Personal Policial" : "Registro de Ciudadanos"}</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-y-3 table-fixed">
            <thead>
              <tr className="text-slate-400 text-[10px] font-extrabold uppercase tracking-wide">
                <th className="px-3 pb-2 w-[15%] text-left">ID</th>
                <th className="pb-2 w-[30%] text-left">{tabActiva === "oficiales" ? "Oficial" : "Ciudadano"}</th>
                <th className="pb-2 w-[15%] text-left">Cédula / Doc.</th>
                <th className="pb-2 w-[20%] text-left">{tabActiva === "oficiales" ? "Cargo / Rol" : "Número Celular"}</th>
                <th className="px-0 pb-2 w-[15%] text-left">Estado</th>
                <th className="px-4 pb-2 w-[10%] text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {datosFiltrados.map((item, i) => (
                <tr key={i} className="bg-white group transition-all duration-150 hover:shadow-lg hover:-translate-y-0.5">
                  <td className="px-3 py-3 text-[10px] font-bold text-slate-400 border-y border-l rounded-l-xl border-gray-50 uppercase text-left">{item.id}</td>
                  <td className="py-3 border-y border-gray-50">
                    <div className="flex items-center gap-3 text-left">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-sm shrink-0 shadow-inner ${tabActiva === "ciudadanos" ? "bg-blue-50 text-blue-600" : "bg-green-50 text-green-700"}`}>
                        {tabActiva === "ciudadanos" ? item.nombre.charAt(0) : <FaShieldAlt size={14} />}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-[#1e293b] leading-tight truncate">{item.nombre}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">
                          {tabActiva === "oficiales" ? "Cochabamba - Bolivia" : "Ciudadano Verificado"}
                        </span>
                      </div>
                    </div>
                   </td>
                  <td className="py-3 text-[10px] font-bold text-slate-500 border-y border-gray-50 text-left">{item.ci}</td>
                  <td className="py-3 border-y border-gray-50 text-left">
                    <div className="flex flex-col">
                      <span className="text-[11px] font-extrabold text-slate-600 truncate">
                        {tabActiva === "oficiales" ? item.rango : item.celular}
                      </span>
                      <span className="text-[9px] text-slate-400 font-semibold uppercase">
                        {tabActiva === "oficiales" ? item.division : "Contacto"}
                      </span>
                    </div>
                    </td>
                  <td className="py-3 border-y border-gray-50 px-0 text-left">
                    <div className="flex flex-col items-start justify-center">
                      <span className={`inline-flex justify-center w-24 py-1.5 rounded-lg text-[9px] font-black uppercase text-white shadow-sm ${
                        item.estado === "EN SERVICIO" || item.estado === "ACTIVO" 
                          ? "bg-[#00a65a]"
                          : item.estado === "FUERA DE TURNO" || item.estado === "SUSPENDIDO"
                          ? "bg-[#e00000]"
                          : item.estado === "ADVERTIDO"
                          ? "bg-[#ff7e00]"
                          : "bg-[#9da1a3]"
                      }`}>
                        {item.estado}
                      </span>
                      {tabActiva === "ciudadanos" && (
                        <>
                          {item.estado === "ADVERTIDO" && (
                            <span className="text-[7px] font-black uppercase mt-0.5 tracking-tighter text-[#ff7e00] leading-none">
                              REPORTES MALINTENCIONADOS
                            </span>
                          )}
                          {item.estado === "SUSPENDIDO" && (
                            <span className="text-[7px] font-black uppercase mt-0.5 tracking-tighter text-[#e00000] leading-none">
                              LÍMITE DE ADVERTENCIA
                            </span>
                          )}
                        </>
                      )}
                    </div>
                    </td>
                  <td className="px-4 py-3 border-y border-r rounded-r-xl border-gray-50 text-left">
                    <div className="flex items-center gap-2">
                      {tabActiva === "oficiales" ? (
                        <>
                          <button onClick={() => abrirModalEditar(item)} className="p-2 bg-amber-500 text-white rounded-lg shadow shadow-amber-100 hover:scale-105 transition-all"><FaEdit size={11} /></button>
                          <button onClick={() => eliminarOficial(item.id)} className="p-2 bg-red-600 text-white rounded-lg shadow shadow-red-100 hover:scale-105 transition-all"><FaTrashAlt size={11} /></button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button className="p-2 bg-blue-600 text-white rounded-lg shadow shadow-blue-100 hover:scale-105 transition-all shrink-0">
                            <FaSearch size={11} />
                          </button>
                          {item.estado === "SUSPENDIDO" && (
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
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL - REDUCIDO */}
      {mostrarModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden text-left border border-gray-100">
            <div className="bg-green-800 p-4 flex justify-between items-center text-white">
              <h3 className="text-lg font-black uppercase tracking-tight">{editandoId ? "Editar Oficial" : "Nuevo Oficial"}</h3>
              <button onClick={() => setMostrarModal(false)} className="p-1.5 bg-green-700 hover:bg-red-500 rounded-lg transition-all"><FaTimes size={14} /></button>
            </div>
            <form className="p-5 grid grid-cols-2 gap-3" onSubmit={manejarGuardar}>
              <div className="col-span-2 space-y-0.5">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1.5">Nombre Completo</label>
                <input required type="text" className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none transition-all" value={nuevoOficial.nombre} onChange={(e) => setNuevoOficial({...nuevoOficial, nombre: e.target.value})} />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-1.5">Cédula</label>
                <input required type="text" className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none transition-all" value={nuevoOficial.ci} onChange={(e) => setNuevoOficial({...nuevoOficial, ci: e.target.value})} />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-1.5">Celular</label>
                <input required type="text" className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none transition-all" value={nuevoOficial.celular} onChange={(e) => setNuevoOficial({...nuevoOficial, celular: e.target.value})} />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-1.5">Cargo</label>
                <input required type="text" className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none transition-all" value={nuevoOficial.cargo} onChange={(e) => setNuevoOficial({...nuevoOficial, cargo: e.target.value})} />
              </div>
              <div className="space-y-0.5">
                <label className="text-[8px] font-black uppercase text-slate-400 ml-1.5">Rol</label>
                <select className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none transition-all" value={nuevoOficial.rol} onChange={(e) => setNuevoOficial({...nuevoOficial, rol: e.target.value})}>
                  <option value="Administrador">Administrador</option>
                  <option value="Operador">Operador</option>
                  <option value="Supervisor">Supervisor</option>
                </select>
              </div>
              <div className="col-span-2 pt-3 flex gap-3">
                <button type="button" onClick={() => setMostrarModal(false)} className="flex-1 py-2 font-black uppercase text-[9px] text-slate-400">Cancelar</button>
                <button type="submit" className="flex-[2] py-2 bg-green-800 text-white rounded-xl font-black uppercase text-[9px] shadow hover:bg-green-900 transition-all">{editandoId ? "Actualizar" : "Guardar"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Usuarios;
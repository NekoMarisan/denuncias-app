import React, { useState, useRef, useEffect } from "react";
import {
  FaTimes,
  FaUser,
  FaIdCard,
  FaPhone,
  FaBriefcase,
  FaUserTag,
  FaLock
} from "react-icons/fa";
import { supabase } from "../../services/supabase";

const NuevoPolicia = ({ isOpen, onClose, onGuardado, editandoPolicia = null }) => {

  const [formData, setFormData] = useState({
    nombre_completo:  "",
    ci:               "",
    celular:          "",
    cargo:            "",
    rol:              "Operador",
    numero_escalafon: "",
    contrasena:       ""
  });

  const [guardando, setGuardando]               = useState(false);
  const [usuarioWarning, setUsuarioWarning]     = useState(false);
  const [usuarioWarningMsg, setUsuarioWarningMsg] = useState("");
  const [passwordWarning, setPasswordWarning]   = useState(false);
  const [passwordWarningMsg, setPasswordWarningMsg] = useState("");

  const usuarioTimeout  = useRef(null);
  const passwordTimeout = useRef(null);

  useEffect(() => {
    if (editandoPolicia) {
      setFormData({
        nombre_completo:  editandoPolicia.nombre_completo  || "",
        ci:               editandoPolicia.ci               || "",
        celular:          editandoPolicia.celular          || "",
        cargo:            editandoPolicia.cargo            || "",
        rol:              editandoPolicia.rol              || "Operador",
        numero_escalafon: editandoPolicia.numero_escalafon || "",
        contrasena:       ""
      });
    } else {
      setFormData({
        nombre_completo: "", ci: "", celular: "", cargo: "",
        rol: "Operador", numero_escalafon: "", contrasena: ""
      });
    }
    setUsuarioWarning(false);
    setPasswordWarning(false);
  }, [editandoPolicia, isOpen]);

  // VALIDACIÓN ESCALAFÓN — solo números
  const handleEscalafonChange = (e) => {
    const raw     = e.target.value;
    const cleaned = raw.replace(/[^0-9]/g, "");
    if (raw !== cleaned && raw.trim() !== "") {
      setUsuarioWarningMsg("* Solo se permiten números.");
      setUsuarioWarning(true);
      if (usuarioTimeout.current) clearTimeout(usuarioTimeout.current);
      usuarioTimeout.current = setTimeout(() => {
        setUsuarioWarning(false);
        setUsuarioWarningMsg("");
      }, 1500);
    }
    setFormData({ ...formData, numero_escalafon: cleaned });
  };

  // VALIDACIÓN CONTRASEÑA — letras minúsculas y números
  const handlePasswordChange = (e) => {
    const raw     = e.target.value;
    const cleaned = raw.replace(/[^a-z0-9]/g, "");
    if (raw !== cleaned && raw.trim() !== "") {
      setPasswordWarningMsg("* Solo letras minúsculas y números.");
      setPasswordWarning(true);
      if (passwordTimeout.current) clearTimeout(passwordTimeout.current);
      passwordTimeout.current = setTimeout(() => {
        setPasswordWarning(false);
        setPasswordWarningMsg("");
      }, 1500);
    }
    setFormData({ ...formData, contrasena: cleaned });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.numero_escalafon) {
      alert("El número de escalafón es obligatorio");
      return;
    }
    if (!editandoPolicia && !formData.contrasena) {
      alert("La contraseña es obligatoria para nuevos oficiales");
      return;
    }

    setGuardando(true);

    if (editandoPolicia) {

      const cambios = {
        nombre_completo:  formData.nombre_completo,
        ci:               formData.ci,
        celular:          formData.celular,
        cargo:            formData.cargo,
        rol:              formData.rol,
        numero_escalafon: formData.numero_escalafon,
        ...(formData.contrasena ? { contrasena: formData.contrasena } : {})
      };

      const { error } = await supabase
        .from("oficial")
        .update(cambios)
        .eq("id_oficial", editandoPolicia.id_oficial);

      if (error) {
        console.error("Error al actualizar:", error);
        alert("No se pudo actualizar el oficial");
        setGuardando(false);
        return;
      }

    } else {

      const { error } = await supabase
        .from("oficial")
        .insert([{
          nombre_completo:  formData.nombre_completo,
          ci:               formData.ci,
          celular:          formData.celular,
          cargo:            formData.cargo,
          rol:              formData.rol,
          numero_escalafon: formData.numero_escalafon,
          contrasena:       formData.contrasena,
          estado:           "EN SERVICIO"
        }]);
        

      if (error) {
        console.error("Error al insertar:", error);
        alert("No se pudo guardar el oficial");
        setGuardando(false);
        return;
      }

    }

    setGuardando(false);
    onGuardado(); // refresca la lista en Usuarios.jsx
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100">

        {/* HEADER */}
        <div className="bg-green-800 p-4 flex justify-between items-center text-white">
          <h3 className="text-lg font-black uppercase tracking-tight">
            {editandoPolicia ? "Editar Oficial" : "Nuevo Oficial"}
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 bg-green-700 hover:bg-red-500 rounded-lg transition-all"
          >
            <FaTimes size={14} />
          </button>
        </div>

        <form className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>

          {/* NOMBRE */}
          <div className="col-span-2 space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
              <FaUser size={10} /> Nombre Completo
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none"
              value={formData.nombre_completo}
              onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
            />
          </div>

          {/* CI */}
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
              <FaIdCard size={10} /> Cédula
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none"
              value={formData.ci}
              onChange={(e) => setFormData({ ...formData, ci: e.target.value })}
            />
          </div>

          {/* CELULAR */}
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
              <FaPhone size={10} /> Celular
            </label>
            <input
              type="tel"
              required
              className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none"
              value={formData.celular}
              onChange={(e) => setFormData({ ...formData, celular: e.target.value })}
            />
          </div>

          {/* CARGO */}
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
              <FaBriefcase size={10} /> Cargo
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
            />
          </div>

          {/* ROL */}
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
              <FaUserTag size={10} /> Rol
            </label>
            <select
              className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none"
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
            >
              <option value="Administrador">Administrador</option>
              <option value="Operador">Operador</option>
              <option value="Supervisor">Supervisor</option>
              <option value="Despachador">Despachador</option>
              <option value="Tabulador">Tabulador</option>
            </select>
          </div>

          {/* ESCALAFÓN */}
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
              <FaUser size={10} /> Número de Escalafón
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none"
              value={formData.numero_escalafon}
              onChange={handleEscalafonChange}
              placeholder="Solo números"
            />
            <div className={`overflow-hidden transition-all duration-500 ${usuarioWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
              <p className="text-[8px] text-red-500 font-medium">{usuarioWarningMsg}</p>
            </div>
          </div>

          {/* CONTRASEÑA */}
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1 flex items-center gap-1">
              <FaLock size={10} /> Contraseña
            </label>
            <input
              type="password"
              required={!editandoPolicia}
              className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none"
              value={formData.contrasena}
              onChange={handlePasswordChange}
              placeholder={editandoPolicia ? "Dejar en blanco para no cambiar" : "Mínimo 4 caracteres"}
            />
            <div className={`overflow-hidden transition-all duration-500 ${passwordWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
              <p className="text-[8px] text-red-500 font-medium">{passwordWarningMsg}</p>
            </div>
          </div>

          {/* BOTONES */}
          <div className="col-span-2 pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 font-black uppercase text-[9px] text-slate-400 hover:bg-slate-50 rounded-lg transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="flex-[2] py-2 bg-green-800 text-white rounded-xl font-black uppercase text-[9px] shadow hover:bg-green-900 transition-all disabled:opacity-60"
            >
              {guardando ? "GUARDANDO..." : editandoPolicia ? "ACTUALIZAR" : "GUARDAR"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default NuevoPolicia;

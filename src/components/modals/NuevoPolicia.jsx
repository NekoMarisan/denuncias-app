import React, { useState, useRef, useEffect } from "react";
import {
  FaTimes,
  FaEye,
  FaEyeSlash
} from "react-icons/fa";
import { supabase } from "../../services/supabase";

const NuevoPolicia = ({ isOpen, onClose, onGuardado, editandoPolicia = null }) => {

  const [formData, setFormData] = useState({
    nombre_completo:  "",
    ci:               "",
    celular:          "",
    cargo:            "",
    rol:              "",
    numero_escalafon: "",
    contrasena:       "",
    acceso:           ""
  });

  const [guardando, setGuardando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [disabledAccess, setDisabledAccess] = useState(false); // Estado para bloquear el select

  // Estados de advertencia
  const [nombreWarning, setNombreWarning] = useState(false);
  const [nombreWarningMsg, setNombreWarningMsg] = useState("");
  const [ciWarning, setCiWarning] = useState(false);
  const [ciWarningMsg, setCiWarningMsg] = useState("");
  const [celularWarning, setCelularWarning] = useState(false);
  const [celularWarningMsg, setCelularWarningMsg] = useState("");
  const [escalafonWarning, setEscalafonWarning] = useState(false);
  const [escalafonWarningMsg, setEscalafonWarningMsg] = useState("");
  const [passwordWarning, setPasswordWarning] = useState(false);
  const [passwordWarningMsg, setPasswordWarningMsg] = useState("");

  const nombreTimeout = useRef(null);
  const ciTimeout = useRef(null);
  const celularTimeout = useRef(null);
  const escalafonTimeout = useRef(null);
  const passwordTimeout = useRef(null);

  // Handlers de validación (sin cambios relevantes)
  const handleNombreChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, "");
    if (raw !== cleaned && raw.trim() !== "") {
      setNombreWarningMsg("* Solo letras y espacios.");
      setNombreWarning(true);
      if (nombreTimeout.current) clearTimeout(nombreTimeout.current);
      nombreTimeout.current = setTimeout(() => {
        setNombreWarning(false);
        setNombreWarningMsg("");
      }, 1500);
    }
    setFormData({ ...formData, nombre_completo: cleaned });
  };

  const handleCiChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^A-Z0-9\-]/g, "");
    if (raw !== cleaned && raw.trim() !== "") {
      setCiWarningMsg("* Solo números, guiones y letras mayúsculas.");
      setCiWarning(true);
      if (ciTimeout.current) clearTimeout(ciTimeout.current);
      ciTimeout.current = setTimeout(() => {
        setCiWarning(false);
        setCiWarningMsg("");
      }, 1500);
    }
    setFormData({ ...formData, ci: cleaned });
  };

  const handleCelularChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^0-9]/g, "");
    if (raw !== cleaned && raw.trim() !== "") {
      setCelularWarningMsg("* Solo números.");
      setCelularWarning(true);
      if (celularTimeout.current) clearTimeout(celularTimeout.current);
      celularTimeout.current = setTimeout(() => {
        setCelularWarning(false);
        setCelularWarningMsg("");
      }, 1500);
    }
    setFormData({ ...formData, celular: cleaned });
  };

  const handleEscalafonChange = (e) => {
    const raw = e.target.value;
    let cleaned = raw.replace(/[^a-zA-Z0-9]/g, "");
    cleaned = cleaned.toUpperCase();
    if (raw !== cleaned && raw.trim() !== "") {
      setEscalafonWarningMsg("* Solo letras y números (sin espacios ni símbolos)");
      setEscalafonWarning(true);
      if (escalafonTimeout.current) clearTimeout(escalafonTimeout.current);
      escalafonTimeout.current = setTimeout(() => {
        setEscalafonWarning(false);
        setEscalafonWarningMsg("");
      }, 1500);
    }
    setFormData({ ...formData, numero_escalafon: cleaned });
  };

  const handlePasswordChange = (e) => {
    const raw = e.target.value;
    setFormData({ ...formData, contrasena: raw });
  };

  // Efecto principal: se ejecuta cada vez que se abre el modal o cambia el oficial a editar
  useEffect(() => {
    if (editandoPolicia) {
      // MODO EDICIÓN: cargar todos los datos y habilitar el control de acceso
      setFormData({
        nombre_completo:  editandoPolicia.nombre_completo  || "",
        ci:               editandoPolicia.ci               || "",
        celular:          editandoPolicia.celular          || "",
        cargo:            editandoPolicia.cargo            || "",
        rol:              editandoPolicia.rol              || "",
        numero_escalafon: editandoPolicia.numero_escalafon || "",
        contrasena:       editandoPolicia.contrasena       || "",
        acceso:           editandoPolicia.acceso           || "FUERA DE SERVICIO"
      });
      setDisabledAccess(false); // Select habilitado
    } else {
      // MODO NUEVO OFICIAL: valores por defecto, acceso bloqueado y forzado a FUERA DE SERVICIO
      setFormData({
        nombre_completo: "", ci: "", celular: "", cargo: "",
        rol: "", numero_escalafon: "", contrasena: "",
        acceso: "FUERA DE SERVICIO"   // Valor fijo
      });
      setDisabledAccess(true); // Select deshabilitado
    }
    // Resetear advertencias y ocultar contraseña
    setNombreWarning(false);
    setCiWarning(false);
    setCelularWarning(false);
    setEscalafonWarning(false);
    setPasswordWarning(false);
    setShowPassword(false);
  }, [editandoPolicia, isOpen]);

  // Envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones comunes
    if (!formData.nombre_completo.trim()) {
      alert("El nombre completo es obligatorio");
      return;
    }
    if (!formData.ci.trim()) {
      alert("La cédula es obligatoria");
      return;
    }
    if (!formData.celular.trim()) {
      alert("El celular es obligatorio");
      return;
    }
    if (!formData.cargo) {
      alert("Debe seleccionar un rango");
      return;
    }
    if (!formData.rol) {
      alert("Debe seleccionar un rol");
      return;
    }
    if (!formData.numero_escalafon) {
      alert("El número de escalafón es obligatorio");
      return;
    }
    if (!editandoPolicia && !formData.contrasena) {
      alert("La contraseña es obligatoria para nuevos oficiales");
      return;
    }
    // Solo en edición se valida que el acceso esté seleccionado (aunque en edición siempre hay valor)
    if (editandoPolicia && !formData.acceso) {
      alert("Debe seleccionar el control de acceso");
      return;
    }

    setGuardando(true);

    // Datos a enviar
    const datos = {
      nombre_completo:  formData.nombre_completo,
      ci:               formData.ci,
      celular:          formData.celular,
      cargo:            formData.cargo,
      rol:              formData.rol,
      numero_escalafon: formData.numero_escalafon,
      acceso:           editandoPolicia ? formData.acceso : "FUERA DE SERVICIO", // Forzado en creación
    };

    // Incluir contraseña solo si se escribió algo (en edición puede estar vacío y no se actualiza)
    if (formData.contrasena && formData.contrasena.trim() !== "") {
      datos.contrasena = formData.contrasena;
    } else if (!editandoPolicia) {
      // En creación no debería ocurrir por la validación anterior
      alert("La contraseña es obligatoria");
      setGuardando(false);
      return;
    }

    try {
      if (editandoPolicia) {
        const { error } = await supabase
          .from("oficial")
          .update(datos)
          .eq("id_oficial", editandoPolicia.id_oficial);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("oficial").insert([datos]);
        if (error) throw error;
      }
      setGuardando(false);
      onGuardado(); // Refrescar la tabla
      onClose();    // Cerrar modal
    } catch (err) {
      console.error("Error al guardar:", err);
      alert(`No se pudo guardar: ${err.message}`);
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border border-gray-100">
        <div className="bg-green-800 p-4 flex justify-between items-center text-white">
          <h3 className="text-lg font-black uppercase tracking-tight">
            {editandoPolicia ? "Editar Oficial" : "Nuevo Oficial"}
          </h3>
          <button onClick={onClose} className="p-1.5 bg-green-700 hover:bg-red-500 rounded-lg transition-all">
            <FaTimes size={14} />
          </button>
        </div>

        <form className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleSubmit}>
          {/* Nombre Completo */}
          <div className="col-span-2 space-y-1">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">
              Nombre Completo
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none"
              value={formData.nombre_completo}
              onChange={handleNombreChange}
            />
            <div className="text-[8px] text-gray-400 ml-1">Solo letras y espacios</div>
            <div className={`overflow-hidden transition-all duration-500 ${nombreWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
              <p className="text-[8px] text-red-500 font-medium">{nombreWarningMsg}</p>
            </div>
          </div>

          {/* Cédula */}
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Cédula</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none"
              value={formData.ci}
              onChange={handleCiChange}
            />
            <div className="text-[8px] text-gray-400 ml-1">Números, guiones y letras mayúsculas</div>
            <div className={`overflow-hidden transition-all duration-500 ${ciWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
              <p className="text-[8px] text-red-500 font-medium">{ciWarningMsg}</p>
            </div>
          </div>

          {/* Celular */}
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Celular</label>
            <input
              type="tel"
              required
              className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none"
              value={formData.celular}
              onChange={handleCelularChange}
            />
            <div className="text-[8px] text-gray-400 ml-1">Solo números</div>
            <div className={`overflow-hidden transition-all duration-500 ${celularWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
              <p className="text-[8px] text-red-500 font-medium">{celularWarningMsg}</p>
            </div>
          </div>

          {/* Rango */}
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Rango</label>
            <select
              required
              className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none"
              value={formData.cargo}
              onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
            >
              <option value="">Seleccionar rango</option>
              <option value="General">General</option>
              <option value="Coronel">Coronel</option>
              <option value="Teniente Coronel">Teniente Coronel</option>
              <option value="Mayor">Mayor</option>
              <option value="Capitán">Capitán</option>
              <option value="Teniente">Teniente</option>
              <option value="Subteniente">Subteniente</option>
              <option value="Cadete">Cadete</option>
              <option value="Suboficial">Suboficial</option>
            </select>
          </div>

          {/* Rol */}
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Rol</label>
            <select
              required
              className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none"
              value={formData.rol}
              onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
            >
              <option value="">Seleccionar Rol</option>
              <option value="Operador">Operador</option>
              <option value="Despachador">Despachador</option>
              <option value="Tabulador">Tabulador</option>
              <option value="Patrullero">Patrullero</option>
            </select>
          </div>

          {/* Credenciales */}
          <div className="col-span-2 mt-2 pt-2 border-t border-gray-200">
            <h4 className="text-xs font-black uppercase text-gray-700">Credenciales a Asignar</h4>
          </div>

          {/* Número de Escalafón */}
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Número de Escalafón</label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none"
              value={formData.numero_escalafon}
              onChange={handleEscalafonChange}
              placeholder="12345ABC"
            />
            <div className="text-[8px] text-gray-400 ml-1">Solo letras y números, sin espacios</div>
            <div className={`overflow-hidden transition-all duration-500 ${escalafonWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
              <p className="text-[8px] text-red-500 font-medium">{escalafonWarningMsg}</p>
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Contraseña</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required={!editandoPolicia}
                className="w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none pr-8"
                value={formData.contrasena}
                onChange={handlePasswordChange}
                placeholder={editandoPolicia ? "Nueva contraseña (dejar vacío si no se cambia)" : "Mínimo 4 caracteres"}
              />
              <button
                type="button"
                className="absolute inset-y-0 right-2 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
              </button>
            </div>
            <div className="text-[8px] text-gray-400 ml-1">Mínimo 4 caracteres</div>
            {editandoPolicia && (
              <p className="text-[8px] text-gray-400 ml-1">
                Si no escribe una nueva contraseña, se conservará la actual.
              </p>
            )}
          </div>

          {/* Control de Acceso - AHORA CON BLOQUEO CORRECTO */}
          <div className="space-y-1">
            <label className="text-[8px] font-black uppercase text-slate-400 ml-1">
              Control de Acceso
            </label>
            <select
              required={!disabledAccess}
              disabled={disabledAccess}  // ← Aquí está el bloqueo
              className={`w-full px-3 py-2 bg-gray-50 border rounded-xl font-bold text-xs text-slate-700 focus:border-green-600 outline-none ${
                disabledAccess ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""
              }`}
              value={formData.acceso}
              onChange={(e) => setFormData({ ...formData, acceso: e.target.value })}
            >
              <option value="EN SERVICIO">EN SERVICIO</option>
              <option value="FUERA DE SERVICIO">FUERA DE SERVICIO</option>
              <option value="DE BAJA">DE BAJA</option>
            </select>
            <div className="text-[8px] text-gray-400 ml-1">
              {disabledAccess ? (
                <span className="text-amber-600 font-medium">
                  🔒 Bloqueado para nuevos oficiales. El administrador lo habilitará después desde edición.
                </span>
              ) : (
                <>
                  {formData.acceso === "EN SERVICIO" && "El oficial podrá acceder al sistema según su rol."}
                  {formData.acceso === "FUERA DE SERVICIO" && "Acceso bloqueado temporalmente."}
                  {formData.acceso === "DE BAJA" && "Oficial dado de baja. No podrá iniciar sesión."}
                </>
              )}
            </div>
          </div>

          {/* Botones */}
          <div className="col-span-2 pt-3 flex gap-3">
            <button type="button" onClick={onClose} className="flex-1 py-2 font-black uppercase text-[9px] text-slate-400 hover:bg-slate-50 rounded-lg transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={guardando} className="flex-[2] py-2 bg-green-800 text-white rounded-xl font-black uppercase text-[9px] shadow hover:bg-green-900 transition-all disabled:opacity-60">
              {guardando ? "GUARDANDO..." : editandoPolicia ? "ACTUALIZAR" : "GUARDAR"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NuevoPolicia;
import React, { useState, useRef, useEffect } from "react";
import { FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
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
    acceso:           "",
    placa:            "",
    epi:              ""
  });

  const [guardando, setGuardando] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [disabledAccess, setDisabledAccess] = useState(false);

  // Estados de advertencia
  const [nombreWarning, setNombreWarning] = useState(false);
  const [nombreWarningMsg, setNombreWarningMsg] = useState("");
  const [ciWarning, setCiWarning] = useState(false);
  const [ciWarningMsg, setCiWarningMsg] = useState("");
  const [celularWarning, setCelularWarning] = useState(false);
  const [celularWarningMsg, setCelularWarningMsg] = useState("");
  const [escalafonWarning, setEscalafonWarning] = useState(false);
  const [escalafonWarningMsg, setEscalafonWarningMsg] = useState("");

  const nombreTimeout = useRef(null);
  const ciTimeout = useRef(null);
  const celularTimeout = useRef(null);
  const escalafonTimeout = useRef(null);

  const handleNombreChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^a-zA-ZáéíóúñÁÉÍÓÚÑ\s]/g, "");
    const hasInvalid = (raw !== cleaned && raw.trim() !== "");
    
    // Limpiar timeout anterior
    if (nombreTimeout.current) clearTimeout(nombreTimeout.current);
    
    if (hasInvalid) {
      // Mostrar mensaje
      setNombreWarningMsg("* Solo letras y espacios.");
      setNombreWarning(true);
      // Ocultar después de 1.5s
      nombreTimeout.current = setTimeout(() => {
        setNombreWarning(false);
        setNombreWarningMsg("");
      }, 1500);
    } else {
      // Si no hay inválido, ocultar inmediatamente
      setNombreWarning(false);
      setNombreWarningMsg("");
    }
    setFormData({ ...formData, nombre_completo: cleaned });
  };

  const handleCiChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^A-Z0-9\-]/g, "");
    const hasInvalid = (raw !== cleaned && raw.trim() !== "");
    
    if (ciTimeout.current) clearTimeout(ciTimeout.current);
    
    if (hasInvalid) {
      setCiWarningMsg("* Solo números, guiones y letras mayúsculas.");
      setCiWarning(true);
      ciTimeout.current = setTimeout(() => {
        setCiWarning(false);
        setCiWarningMsg("");
      }, 1500);
    } else {
      setCiWarning(false);
      setCiWarningMsg("");
    }
    setFormData({ ...formData, ci: cleaned });
  };

  const handleCelularChange = (e) => {
    const raw = e.target.value;
    const cleaned = raw.replace(/[^0-9]/g, "");
    const hasInvalid = (raw !== cleaned && raw.trim() !== "");
    
    if (celularTimeout.current) clearTimeout(celularTimeout.current);
    
    if (hasInvalid) {
      setCelularWarningMsg("* Solo números.");
      setCelularWarning(true);
      celularTimeout.current = setTimeout(() => {
        setCelularWarning(false);
        setCelularWarningMsg("");
      }, 1500);
    } else {
      setCelularWarning(false);
      setCelularWarningMsg("");
    }
    setFormData({ ...formData, celular: cleaned });
  };

  const handleEscalafonChange = (e) => {
    const raw = e.target.value;
    let cleaned = raw.replace(/[^a-zA-Z0-9]/g, "");
    cleaned = cleaned.toUpperCase();
    const hasInvalid = (raw !== cleaned && raw.trim() !== "");
    
    if (escalafonTimeout.current) clearTimeout(escalafonTimeout.current);
    
    if (hasInvalid) {
      setEscalafonWarningMsg("* Solo letras y números (sin espacios ni símbolos)");
      setEscalafonWarning(true);
      escalafonTimeout.current = setTimeout(() => {
        setEscalafonWarning(false);
        setEscalafonWarningMsg("");
      }, 1500);
    } else {
      setEscalafonWarning(false);
      setEscalafonWarningMsg("");
    }
    setFormData({ ...formData, numero_escalafon: cleaned });
  };

  const handlePasswordChange = (e) => {
    setFormData({ ...formData, contrasena: e.target.value });
  };

  const esPatrullero = formData.rol === "Patrullero";

  useEffect(() => {
    const loadPoliciaData = async () => {
      if (editandoPolicia) {
        // Cargar datos básicos
        setFormData({
          nombre_completo:  editandoPolicia.nombre_completo  || "",
          ci:               editandoPolicia.ci               || "",
          celular:          editandoPolicia.celular          || "",
          cargo:            editandoPolicia.cargo            || "",
          rol:              editandoPolicia.rol              || "",
          numero_escalafon: editandoPolicia.numero_escalafon || "",
          contrasena:       "",
          acceso:           editandoPolicia.acceso           || "FUERA DE SERVICIO",
          placa:            "",
          epi:              ""
        });
        setDisabledAccess(false);

        // Cargar la contraseña actual (si existe)
        const { data: passData, error: passError } = await supabase
          .from("oficial")
          .select("contrasena")
          .eq("id_oficial", editandoPolicia.id_oficial)
          .maybeSingle();

        if (!passError && passData && passData.contrasena) {
          setFormData(prev => ({ ...prev, contrasena: passData.contrasena }));
        }

        // Si es patrullero, cargar placa y epi desde la tabla patrullero
        if (editandoPolicia.rol === "Patrullero") {
          const { data, error } = await supabase
            .from("patrullero")
            .select("placa, epi")
            .eq("id_oficial", editandoPolicia.id_oficial)
            .maybeSingle();

          if (!error && data) {
            setFormData(prev => ({
              ...prev,
              placa: data.placa || "",
              epi:   data.epi   || ""
            }));
          }
        }
      } else {
        // Nuevo oficial: por defecto acceso "FUERA DE SERVICIO", disabled
        setFormData({
          nombre_completo: "", ci: "", celular: "", cargo: "",
          rol: "", numero_escalafon: "", contrasena: "",
          acceso: "FUERA DE SERVICIO",
          placa: "", epi: ""
        });
        setDisabledAccess(true);
      }
      // Resetear advertencias
      setNombreWarning(false);
      setCiWarning(false);
      setCelularWarning(false);
      setEscalafonWarning(false);
      setShowPassword(false);
    };

    if (isOpen) {
      loadPoliciaData();
    }
  }, [editandoPolicia, isOpen]);

  // Verificar unicidad de número de escalafón y cédula
  const verificarUnicidad = async () => {
    // Verificar escalafón
    const { data: escalafonExistente, error: errEsc } = await supabase
      .from("oficial")
      .select("id_oficial, numero_escalafon")
      .eq("numero_escalafon", formData.numero_escalafon)
      .maybeSingle();

    if (errEsc) throw errEsc;

    if (escalafonExistente) {
      if (!(editandoPolicia && escalafonExistente.id_oficial === editandoPolicia.id_oficial)) {
        return "El número de escalafón ya está registrado. Use otro.";
      }
    }

    // Verificar cédula
    const { data: ciExistente, error: errCi } = await supabase
      .from("oficial")
      .select("id_oficial, ci")
      .eq("ci", formData.ci)
      .maybeSingle();

    if (errCi) throw errCi;

    if (ciExistente) {
      if (!(editandoPolicia && ciExistente.id_oficial === editandoPolicia.id_oficial)) {
        return "La cédula ya está registrada. Use otra.";
      }
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validaciones básicas
    if (!formData.nombre_completo.trim()) return alert("Nombre completo obligatorio");
    if (!formData.ci.trim()) return alert("Cédula obligatoria");
    if (!formData.celular.trim()) return alert("Celular obligatorio");
    if (!formData.cargo) return alert("Seleccione un rango");
    if (!formData.rol) return alert("Seleccione un rol");
    if (!formData.numero_escalafon) return alert("Número de escalafón obligatorio");
    if (!editandoPolicia && !formData.contrasena) return alert("Contraseña obligatoria");

    if (esPatrullero) {
      if (!formData.placa) return alert("Placa obligatoria");
      if (!formData.epi) return alert("EPI obligatorio");
    }

    setGuardando(true);

    // Validar unicidad
    try {
      const errorUnicidad = await verificarUnicidad();
      if (errorUnicidad) {
        alert(errorUnicidad);
        setGuardando(false);
        return;
      }
    } catch (err) {
      console.error("Error verificando unicidad:", err);
      alert("Error al validar datos únicos. Intente de nuevo.");
      setGuardando(false);
      return;
    }

    // Construir objeto para oficial
    const nuevoAcceso = editandoPolicia ? formData.acceso : "FUERA DE SERVICIO";
    let nuevoEstado = false;
    if (editandoPolicia) {
      nuevoEstado = nuevoAcceso === "EN SERVICIO" ? editandoPolicia.estado : false;
    }

    const datosOficial = {
      nombre_completo:  formData.nombre_completo,
      ci:               formData.ci,
      celular:          formData.celular,
      cargo:            formData.cargo,
      rol:              formData.rol,
      numero_escalafon: formData.numero_escalafon,
      acceso:           nuevoAcceso,
      estado:           nuevoEstado,
    };
    if (formData.contrasena && formData.contrasena.trim() !== "") {
      datosOficial.contrasena = formData.contrasena;
    }

    try {
      let id_oficial;

      if (editandoPolicia) {
        // Actualizar oficial
        const { error } = await supabase
          .from("oficial")
          .update(datosOficial)
          .eq("id_oficial", editandoPolicia.id_oficial);
        if (error) throw error;
        id_oficial = editandoPolicia.id_oficial;
      } else {
        // Insertar nuevo oficial
        const { data, error } = await supabase
          .from("oficial")
          .insert([datosOficial])
          .select("id_oficial");
        if (error) throw error;
        id_oficial = data[0].id_oficial;
      }

      // Manejar la tabla patrullero si el rol es Patrullero
      if (esPatrullero) {
        const datosPatrullero = {
          id_oficial: id_oficial,
          placa: formData.placa,
          epi:   formData.epi,
        };

        if (editandoPolicia) {
          // Verificar si ya existe un registro en patrullero
          const { data: existing } = await supabase
            .from("patrullero")
            .select("id_oficial")
            .eq("id_oficial", id_oficial)
            .maybeSingle();

          if (existing) {
            const { error } = await supabase
              .from("patrullero")
              .update(datosPatrullero)
              .eq("id_oficial", id_oficial);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from("patrullero")
              .insert([datosPatrullero]);
            if (error) throw error;
          }
        } else {
          const { error } = await supabase
            .from("patrullero")
            .insert([datosPatrullero]);
          if (error) throw error;
        }
      } else if (editandoPolicia) {
        // Si ya no es patrullero pero antes lo era, eliminar el registro de patrullero
        const { data: existing } = await supabase
          .from("patrullero")
          .select("id_oficial")
          .eq("id_oficial", id_oficial)
          .maybeSingle();
        if (existing) {
          const { error } = await supabase
            .from("patrullero")
            .delete()
            .eq("id_oficial", id_oficial);
          if (error) console.error("Error eliminando patrullero:", error);
        }
      }

await supabase.from("log_actividad").insert([{
        id_oficial: null,
        id_alerta: null,
        accion: "ADMINISTRADOR",
        descripcion: editandoPolicia
          ? `Editó datos del oficial: ${formData.nombre_completo} — Rol: ${formData.rol}`
          : `Creó nuevo oficial: ${formData.nombre_completo} — Rol: ${formData.rol}`,
      }]);
      onGuardado();
      onClose();
    } catch (err) {
      console.error("Error en handleSubmit:", err);
      alert(`Error: ${err.message}`);
    } finally {
      setGuardando(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Fondo oscuro con blur */}
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[85vh]">
        {/* BARRA SUPERIOR VERDE (estilo DetalleEmergencia) */}
        <div className="bg-[#113e27] py-4 px-6 text-white w-full shrink-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-md flex items-center justify-center shrink-0">
                {/* Icono representativo (policía) */}
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="flex flex-col gap-1.5">
                <h2 className="text-[18px] font-extrabold uppercase tracking-wide leading-none mt-0.5">
                  {editandoPolicia ? "Editar Oficial" : "Nuevo Oficial"}
                </h2>
              </div>
            </div>
            <button
              onClick={onClose}
              className="hover:bg-white/20 p-1.5 rounded-md transition-colors shrink-0 mt-1"
            >
              <FaTimes size={16} />
            </button>
          </div>
        </div>

        {/* FORMULARIO */}
        <div className="overflow-y-auto p-6 bg-white">
          <form className="grid grid-cols-1 md:grid-cols-2 gap-5" onSubmit={handleSubmit}>
            {/* Nombre Completo */}
            <div className="md:col-span-2">
              <label className="text-[11px] text-slate-400 tracking-wider font-bold uppercase ml-1">Nombre Completo</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-100/40 border border-slate-200 rounded-xl font-bold text-[11px] text-slate-500 focus:border-slate-300 outline-none transition-all"
                value={formData.nombre_completo}
                onChange={handleNombreChange}
              />
              <div className={`overflow-hidden transition-all duration-500 ${nombreWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
                <p className="text-[10px] text-slate-400 font-medium">{nombreWarningMsg}</p>
              </div>
            </div>

            {/* Cédula */}
            <div className="">
              <label className="text-[11px] text-slate-400 tracking-wider font-bold uppercase ml-1">Cédula</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-100/40 border border-slate-200 rounded-xl font-bold text-[11px] text-slate-500 focus:border-slate-300 outline-none transition-all"
                value={formData.ci}
                onChange={handleCiChange}
              />
              <div className={`overflow-hidden transition-all duration-500 ${ciWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
                <p className="text-[10px] text-slate-400 font-medium">{ciWarningMsg}</p>
              </div>
            </div>

            {/* Celular */}
            <div className="">
              <label className="text-[11px] text-slate-400 tracking-wider font-bold uppercase ml-1">Celular</label>
              <input
                type="tel"
                required
                className="w-full px-4 py-2.5 bg-slate-100/40 border border-slate-200 rounded-xl font-bold text-[11px] text-slate-500 focus:border-slate-300 outline-none transition-all"
                value={formData.celular}
                onChange={handleCelularChange}
              />
              <div className={`overflow-hidden transition-all duration-500 ${celularWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
                <p className="text-[10px] text-slate-400 font-medium">{celularWarningMsg}</p>
              </div>
            </div>

            {/* Rango */}
            <div className="">
              <label className="text-[11px] text-slate-400 tracking-wider font-bold uppercase ml-1">Rango</label>
              <select
                required
                className="w-full px-4 py-2.5 bg-slate-100/40 border border-slate-200 rounded-xl font-bold text-[11px] text-slate-500 focus:border-slate-300 outline-none transition-all"
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
            <div className="">
              <label className="text-[11px] text-slate-400 tracking-wider font-bold uppercase ml-1">Rol</label>
              <select
                required
                className="w-full px-4 py-2.5 bg-slate-100/40 border border-slate-200 rounded-xl font-bold text-[11px] text-slate-500 focus:border-slate-300 outline-none transition-all"
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

            {/* Separador credenciales */}
            <div className="md:col-span-2 mt-2 pt-2 border-t border-slate-200">
              <h4 className="text-[12px] font-bold uppercase text-slate-500 tracking-wider">Credenciales a Asignar</h4>
            </div>

            {/* Número de Escalafón */}
            <div className="">
              <label className="text-[11px] text-slate-400 tracking-wider font-bold uppercase ml-1">Número de Escalafón</label>
              <input
                type="text"
                required
                className="w-full px-4 py-2.5 bg-slate-100/40 border border-slate-200 rounded-xl font-bold text-[11px] text-slate-500 focus:border-slate-300 outline-none transition-all"
                value={formData.numero_escalafon}
                onChange={handleEscalafonChange}
                placeholder="12345ABC"
              />
              <div className={`overflow-hidden transition-all duration-500 ${escalafonWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
                <p className="text-[10px] text-slate-400 font-medium">{escalafonWarningMsg}</p>
              </div>
            </div>

            {/* Contraseña */}
            <div className="">
              <label className="text-[11px] text-slate-400 tracking-wider font-bold uppercase ml-1">Contraseña</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required={!editandoPolicia}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] outline-none transition-all pr-10 bg-slate-100/40 font-bold text-slate-500 focus:border-slate-300"
                  value={formData.contrasena}
                  onChange={handlePasswordChange}
                  placeholder={editandoPolicia ? "Nueva contraseña (dejar vacío si no se cambia)" : "Mínimo 4 caracteres"}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                </button>
              </div>
              {editandoPolicia && (
                <p className="text-[10px] text-gray-400 ml-1">Si no escribe una nueva, se conserva la actual.</p>
              )}
            </div>

              {/* Separador credenciales */}
            <div className="md:col-span-2 mt-2 pt-2 border-t border-slate-200">
              <h4 className="text-[12px] font-bold uppercase text-slate-700 tracking-wider">Credenciales a Asignar</h4>
            </div>

            {/* Control de Acceso */}
            <div className="">
              <label className="text-[11px] text-slate-400 tracking-wider font-bold uppercase ml-1">Control de Acceso</label>
              <select
                required={!disabledAccess}
                disabled={disabledAccess}
                className={`w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[11px] text-slate-700 focus:border-[#113e27] outline-none transition-all ${disabledAccess ? "bg-gray-100 text-gray-400 cursor-not-allowed" : ""}`}
                value={formData.acceso}
                onChange={(e) => setFormData({ ...formData, acceso: e.target.value })}
              >
                <option value="EN SERVICIO">EN SERVICIO</option>
                <option value="FUERA DE SERVICIO">FUERA DE SERVICIO</option>
                <option value="DE BAJA">DE BAJA</option>
              </select>
              <div className="text-[10px] text-gray-400 ml-1">
                {disabledAccess ? (
                  <span className="text-amber-600 font-bold"> 
                    El administrador debe habilitar "EN SERVICIO" para dar acceso.
                  </span>
                ) : (
                  <>
                    {formData.acceso === "EN SERVICIO" && "El oficial podrá acceder al sistema según su rol. Si ya estaba conectado, seguirá conectado."}
                    {formData.acceso === "FUERA DE SERVICIO" && "Acceso bloqueado temporalmente. Se forzará su desconexión (estado=false)."}
                    {formData.acceso === "DE BAJA" && "Oficial dado de baja. Se forzará su desconexión (estado=false)."}
                  </>
                )}
              </div>
            </div>

            {/* Campos de Patrullero (solo si el rol es Patrullero) */}
            {esPatrullero && (
              <>
                <div className="">
                  <label className="text-[11px] text-slate-400 tracking-wider font-bold uppercase ml-1">Placa <span className="text-slate-400">*</span></label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm text-slate-700 focus:border-[#113e27] outline-none transition-all"
                    value={formData.placa}
                    onChange={e => setFormData({...formData, placa: e.target.value.toUpperCase()})}
                    placeholder="Ej: 1234-ABC"
                  />
                </div>

                <div className="">
                  <label className="text-[11px] text-slate-400 tracking-wider font-bold uppercase ml-1">EPI <span className="text-red-500">*</span></label>
                  <select
                    required
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-[11px] text-slate-700 focus:border-[#113e27] outline-none transition-all"
                    value={formData.epi}
                    onChange={e => setFormData({...formData, epi: e.target.value})}
                  >
                    <option value="">Seleccionar EPI</option>
                    <option value="EPI 1 - Coña Coña">EPI 1 - Coña Coña</option>
                    <option value="EPI 2 - Pucará (Norte)">EPI 2 - Pucará (Norte)</option>
                    <option value="EPI 3 - Jaihuayco">EPI 3 - Jaihuayco</option>
                    <option value="EPI 4 - Temporal">EPI 4 - Temporal</option>
                    <option value="EPI 5 - Alalay">EPI 5 - Alalay</option>
                    <option value="EPI 6 - Central">EPI 6 - Central</option>
                  </select>
                </div>
              </>
            )}

            {/* BOTONES (estilo DetalleEmergencia) */}
            <div className="md:col-span-2 pt-4 flex gap-3">
              <button
                type="button"
                onClick={onClose}
                className="w-2/5 py-3.5 bg-slate-200 rounded-xl font-bold uppercase text-[11px] tracking-wider border-2 border-slate-200 text-slate-700 hover:bg-slate-300 transition-all shadow-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="w-3/5 py-3.5 rounded-xl font-bold uppercase text-[11px] tracking-wider shadow-md flex items-center justify-center gap-2 transition-all bg-[#113e27] hover:bg-[#164a2f] text-white disabled:opacity-60"
              >
                {guardando ? "GUARDANDO..." : (editandoPolicia ? "ACTUALIZAR" : "GUARDAR")}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NuevoPolicia;
  import React, { useState, useRef, useEffect } from "react";
  import { FaTimes, FaEye, FaEyeSlash, FaUserShield, FaSpinner, FaChevronDown } from "react-icons/fa";
  import { supabase } from "../../services/supabase";

  const NuevoPolicia = ({ isOpen, onClose, onGuardado, editandoPolicia = null, onToast, usuarioActual = null }) => {
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

      if (nombreTimeout.current) clearTimeout(nombreTimeout.current);

      if (hasInvalid) {
        setNombreWarningMsg("* Solo letras y espacios.");
        setNombreWarning(true);
        nombreTimeout.current = setTimeout(() => {
          setNombreWarning(false);
          setNombreWarningMsg("");
        }, 1500);
      } else {
        setNombreWarning(false);
        setNombreWarningMsg("");
      }

      const capitalizado = cleaned
        .toLowerCase()
        .replace(/(^|\s)([a-záéíóúñ])/g, (match, sep, letra) => sep + letra.toUpperCase());

      setFormData({ ...formData, nombre_completo: capitalizado });
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

    const [placaWarning, setPlacaWarning] = useState(false);
    const [placaWarningMsg, setPlacaWarningMsg] = useState("");
    const placaTimeout = useRef(null);

    const handlePlacaChange = (e) => {
      const raw = e.target.value;
      let cleaned = raw.replace(/[^a-zA-Z0-9\-]/g, "");
      cleaned = cleaned.toUpperCase();
      const hasInvalid = (raw !== cleaned && raw.trim() !== "");

      if (placaTimeout.current) clearTimeout(placaTimeout.current);

      if (hasInvalid) {
        setPlacaWarningMsg("* Solo letras, números y guiones.");
        setPlacaWarning(true);
        placaTimeout.current = setTimeout(() => {
          setPlacaWarning(false);
          setPlacaWarningMsg("");
        }, 1500);
      } else {
        setPlacaWarning(false);
        setPlacaWarningMsg("");
      }
      setFormData({ ...formData, placa: cleaned });
    };
    const esPatrullero = formData.rol === "Patrullero";

    useEffect(() => {
      const loadPoliciaData = async () => {
        if (editandoPolicia) {
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

          const { data: passData, error: passError } = await supabase
            .from("oficial")
            .select("contrasena")
            .eq("id_oficial", editandoPolicia.id_oficial)
            .maybeSingle();

          if (!passError && passData && passData.contrasena) {
            setFormData(prev => ({ ...prev, contrasena: passData.contrasena }));
          }

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
          setFormData({
            nombre_completo: "", ci: "", celular: "", cargo: "",
            rol: "", numero_escalafon: "", contrasena: "",
            acceso: "PENDIENTE",
            placa: "", epi: ""
          });
          setDisabledAccess(true);
        }
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

    const verificarUnicidad = async () => {
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

const nuevoAcceso = editandoPolicia ? formData.acceso : "PENDIENTE";

      const datosOficial = {
        nombre_completo:  formData.nombre_completo,
        ci:               formData.ci,
        celular:          formData.celular,
        cargo:            formData.cargo,
        rol:              formData.rol,
        numero_escalafon: formData.numero_escalafon,
        acceso:           nuevoAcceso,
        estado:           nuevoAcceso === "EN SERVICIO" ? (editandoPolicia?.estado ?? false) : false,
      };
      if (formData.contrasena && formData.contrasena.trim() !== "") {
        datosOficial.contrasena = formData.contrasena;
      }

      try {
        let id_oficial;

        if (editandoPolicia) {
          const { error } = await supabase
            .from("oficial")
            .update(datosOficial)
            .eq("id_oficial", editandoPolicia.id_oficial);
          if (error) throw error;
          id_oficial = editandoPolicia.id_oficial;
        } else {
          const { data, error } = await supabase
            .from("oficial")
            .insert([datosOficial])
            .select("id_oficial");
          if (error) throw error;
          id_oficial = data[0].id_oficial;
        }

        if (esPatrullero) {
          const datosPatrullero = {
            id_oficial: id_oficial,
            placa: formData.placa,
            epi:   formData.epi,
          };

          if (editandoPolicia) {
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
          id_oficial: usuarioActual?.id_oficial || null,
          id_alerta: null,
          accion: "ADMINISTRADOR",
          descripcion: editandoPolicia
            ? `Editó datos del oficial: ${formData.nombre_completo} — Rol: ${formData.rol}`
            : `Creó nuevo oficial: ${formData.nombre_completo} — Rol: ${formData.rol}`,
        }]);

        if (editandoPolicia) {
          const accesoAnterior = editandoPolicia.acceso;
          const accesoCambio = accesoAnterior !== nuevoAcceso;

          const camposEditados = [];
          if (formData.nombre_completo !== editandoPolicia.nombre_completo) camposEditados.push("Nombre");
          if (formData.ci !== editandoPolicia.ci) camposEditados.push("CI");
          if (formData.celular !== editandoPolicia.celular) camposEditados.push("Celular");
          if (formData.cargo !== editandoPolicia.cargo) camposEditados.push("Rango");
          if (formData.rol !== editandoPolicia.rol) camposEditados.push("Rol");
          if (formData.numero_escalafon !== editandoPolicia.numero_escalafon) camposEditados.push("Escalafón");

          if (accesoCambio && nuevoAcceso === "EN SERVICIO") {
            onToast?.(`Oficial ${formData.nombre_completo} — Cuenta EN SERVICIO`, "success");
          } else if (accesoCambio && nuevoAcceso === "FUERA DE SERVICIO") {
            onToast?.(`Oficial ${formData.nombre_completo} — Cuenta FUERA DE SERVICIO`, "error");
          } else if (accesoCambio && nuevoAcceso === "DE BAJA") {
            onToast?.(`Oficial ${formData.nombre_completo} — Cuenta DADA DE BAJA`, "error");
          } else if (camposEditados.length > 0) {
            onToast?.(`Oficial ${formData.nombre_completo} — Campo(s) ${camposEditados.join(", ")} actualizado(s)`, "success");
          } else {
            onToast?.(`Oficial ${formData.nombre_completo} — Sin cambios detectados`, "success");
          }
        } else {
          onToast?.(`Oficial ${formData.nombre_completo} — Cuenta registrada correctamente`, "success");
        }

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

    // Mismas clases que FormularioTabulacion.jsx: label + input editable + select
    const labelClass = "block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1";
    const inputEditableClass = "w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-[12px] font-medium text-slate-600 outline-none focus:border-slate-300 transition-colors";
    const selectClass = "w-full h-11 pl-3 pr-7 border border-slate-200 rounded-xl text-[12px] text-slate-600 outline-none appearance-none focus:border-slate-400 transition-colors disabled:opacity-60 disabled:bg-slate-50 disabled:border-slate-100";

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        {/* Fondo oscuro con blur */}
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" />

        <div className="relative w-full max-w-[42rem] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col h-fit max-h-[85vh]">
          {/* BARRA SUPERIOR — estilo unificado con Usuarios.jsx / FormularioTabulacion.jsx */}
          <div className="bg-[#474b29] py-4 px-5 sm:px-6 text-white shrink-0">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="bg-white/10 p-2 rounded-md flex items-center justify-center shrink-0">
                  <FaUserShield className="text-white" size={22} />
                </div>
                <div>
                  <h2 className="text-[17px] font-bold uppercase tracking-wider leading-none">
                    {editandoPolicia ? "Editar Oficial" : "Nuevo Oficial"}
                  </h2>
                  {editandoPolicia && (
                    <p className="text-[11px] font-medium text-white/70 mt-1.5">
                      ROF-{String(editandoPolicia.id_oficial).padStart(4, "0")}
                    </p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="hover:bg-white/20 p-1.5 rounded-md transition-colors shrink-0"
              >
                <FaTimes size={15} />
              </button>
            </div>
          </div>

          {/* FORMULARIO — el <form> envuelve el scroll Y el footer; el footer queda afuera del scroll */}
          <form onSubmit={handleSubmit} className="flex flex-col overflow-hidden">
            <div className="overflow-y-auto p-6 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Nombre Completo */}
                <div className="md:col-span-2">
                  <label className={labelClass}>Nombre Completo</label>
                  <input
                    type="text"
                    required
                    className={inputEditableClass}
                    value={formData.nombre_completo}
                    onChange={handleNombreChange}
                  />
                  <div className={`overflow-hidden transition-all duration-500 ${nombreWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
                    <p className="text-[10px] text-slate-400 font-medium">{nombreWarningMsg}</p>
                  </div>
                </div>

                {/* Cédula */}
                <div className="">
                  <label className={labelClass}>Cédula de Identidad</label>
                  <input
                    type="text"
                    required
                    className={inputEditableClass}
                    value={formData.ci}
                    onChange={handleCiChange}
                  />
                  <div className={`overflow-hidden transition-all duration-500 ${ciWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
                    <p className="text-[10px] text-slate-400 font-medium">{ciWarningMsg}</p>
                  </div>
                </div>

                {/* Celular */}
                <div className="">
                  <label className={labelClass}>Celular</label>
                  <input
                    type="tel"
                    required
                    className={inputEditableClass}
                    value={formData.celular}
                    onChange={handleCelularChange}
                  />
                  <div className={`overflow-hidden transition-all duration-500 ${celularWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
                    <p className="text-[10px] text-slate-400 font-medium">{celularWarningMsg}</p>
                  </div>
                </div>

                {/* Rango */}
                <div className="">
                  <label className={labelClass}>Rango</label>
                  <div className="relative">
                    <select
                      required
                      className={selectClass}
                      value={formData.cargo}
                      onChange={(e) => setFormData({ ...formData, cargo: e.target.value })}
                    >
                      <option value="">Seleccionar rango</option>
                      <option value="General">GENERAL</option>
                      <option value="Coronel">CORONEL</option>
                      <option value="Teniente Coronel">TENIENTE CORONEL</option>
                      <option value="Mayor">MAYOR</option>
                      <option value="Capitán">CAPITÁN</option>
                      <option value="Teniente">TENIENTE</option>
                      <option value="Subteniente">SUBTENIENTE</option>
                      <option value="Cadete">CADETE</option>
                      <option value="Suboficial">SUBOFICIAL</option>
                    </select>
                    <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={11} />
                  </div>
                </div>

                {/* Rol */}
                <div className="">
                  <label className={labelClass}>Rol en el Sistema</label>
                  <div className="relative">
                    <select
                      required
                      className={selectClass}
                      value={formData.rol}
                      onChange={(e) => setFormData({ ...formData, rol: e.target.value })}
                    >
                      <option value="">Seleccionar Rol</option>
                      <option value="Operador">OPERADOR</option>
                      <option value="Despachador">DESPACHADOR</option>
                      <option value="Tabulador">TABULADOR</option>
                      <option value="Patrullero">PATRULLERO</option>
                    </select>
                    <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={11} />
                  </div>
                </div>

                {/* Separador credenciales */}
                <div className="md:col-span-2 mt-2 pt-2 border-t border-slate-200">
                  <h4 className="text-[12px] font-bold uppercase text-slate-500 tracking-wider">Credenciales a Asignar</h4>
                </div>

                {/* Número de Escalafón */}
                <div className="">
                  <label className={labelClass}>Número de Escalafón</label>
                  <input
                    type="text"
                    required
                    className={inputEditableClass}
                    value={formData.numero_escalafon}
                    onChange={handleEscalafonChange}
                  />
                  <div className={`overflow-hidden transition-all duration-500 ${escalafonWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
                    <p className="text-[10px] text-slate-400 font-medium">{escalafonWarningMsg}</p>
                  </div>
                </div>

                {/* Contraseña */}
                <div className="">
                  <label className={labelClass}>Contraseña</label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required={!editandoPolicia}
                      className={`${inputEditableClass} pr-10`}
                      value={formData.contrasena}
                      onChange={handlePasswordChange}
                      placeholder={editandoPolicia ? "Nueva contraseña (dejar vacío si no se cambia)" : "Mínimo 4 caracteres"}
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
                    </button>
                  </div>
                  {editandoPolicia && (
                    <p className="text-[10px] text-slate-400 font-medium mt-1">Si no escribe una nueva, se conserva la actual.</p>
                  )}
                </div>

             {/* Campos de Patrullero (siempre montados, se despliegan con transición suave) */}
                <div
                  className={`overflow-hidden transition-all duration-700 ease-in-out ${
                    esPatrullero ? "max-h-28 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <label className={labelClass}>Placa</label>
                  <input
                    type="text"
                    required={esPatrullero}
                    className={inputEditableClass}
                    value={formData.placa}
                    onChange={handlePlacaChange}
                  />
                  <div className={`overflow-hidden transition-all duration-500 ${placaWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"}`}>
                    <p className="text-[10px] text-slate-400 font-medium">{placaWarningMsg}</p>
                  </div>
                </div>

                <div
                  className={`overflow-hidden transition-all duration-700 ease-in-out ${
                    esPatrullero ? "max-h-28 opacity-100" : "max-h-0 opacity-0"
                  }`}
                >
                  <label className={labelClass}>EPI</label>
                  <div className="relative">
                    <select
                      required={esPatrullero}
                      className={selectClass}
                      value={formData.epi}
                      onChange={e => setFormData({...formData, epi: e.target.value})}
                    >
                      <option value="">Seleccionar EPI</option>
                      <option value="EPI 2 - NORTE">EPI 2 - NORTE</option>
                      <option value="EPI 3 - JAIHUAYCO">EPI 3 - JAIHUAYCO</option>
                      <option value="EPI 4 - COÑA COÑA">EPI 4 - COÑA COÑA</option>
                      <option value="EPI 5 - ALALAY">EPI 5 - ALALAY</option>
                      <option value="EPI 6 - CENTRAL">EPI 6 - CENTRAL</option>
                    </select>
                    <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={11} />
                  </div>
                </div>

                {/* Separador control de acceso */}
                <div className="md:col-span-2 mt-2 pt-2 border-t border-slate-200">
                  <h4 className="text-[12px] font-bold uppercase text-slate-500 tracking-wider">Control de Acceso</h4>
                </div>

                {/* Control de Acceso */}
                <div className="md:col-span-2">
                  <label className={labelClass}>Estado de Acceso</label>
                  <div className="relative">
                    <select
                      required={!disabledAccess}
                      disabled={disabledAccess}
                      className={selectClass}
                      value={formData.acceso}
                      onChange={(e) => setFormData({ ...formData, acceso: e.target.value })}
                    >
                      <option value="PENDIENTE">PENDIENTE DE ACTIVACIÓN</option>
                      <option value="EN SERVICIO">EN SERVICIO</option>
                      <option value="FUERA DE SERVICIO">FUERA DE SERVICIO</option>
                      <option value="DE BAJA">DE BAJA</option>
                    </select>
                    <FaChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={11} />
                  </div>
                  <div className="text-[10px] text-slate-400 font-medium ml-1 mt-1">
                    {formData.acceso === "PENDIENTE" && "El oficial queda registrado pero bloqueado hasta que un administrador active su cuenta."}
                    {formData.acceso === "EN SERVICIO" && "El oficial queda habilitado para iniciar sesión y usar el sistema según su rol asignado."}
                    {formData.acceso === "FUERA DE SERVICIO" && "Acceso bloqueado temporalmente. Se forzará su desconexión (estado=false)."}
                    {formData.acceso === "DE BAJA" && "Oficial dado de baja. Se forzará su desconexión (estado=false)."}
                  </div>
                </div>
              </div>
            </div>

            {/* BOTONES — mismo footer que Usuarios.jsx / FormularioTabulacion.jsx, ahora fuera del scroll */}
            <div className="flex justify-end gap-4 px-5 sm:px-6 py-4 border-t border-slate-200 bg-slate-50 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg font-medium text-[11.5px] border uppercase border-slate-300 text-slate-500 bg-slate-100 hover:bg-slate-200 transition-colors tracking-wider"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={guardando}
                className="px-8 py-2.5 rounded-lg font-medium text-[11.5px] bg-[#474b29] uppercase hover:bg-[#3a3e21] text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed tracking-wider flex items-center justify-center gap-2"
              >
                {guardando && <FaSpinner className="animate-spin" size={10} />}
                {guardando ? "GUARDANDO..." : (editandoPolicia ? "ACTUALIZAR" : "GUARDAR")}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };

  export default NuevoPolicia;
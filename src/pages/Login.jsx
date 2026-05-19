import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { FaShieldAlt, FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUserWarning, setShowUserWarning] = useState(false);
  const [showPassWarning, setShowPassWarning] = useState(false);

  const userWarningTimeout = useRef(null);
  const passWarningTimeout = useRef(null);
  const errorTimeout = useRef(null);

  useEffect(() => {
    if (error) {
      if (errorTimeout.current) clearTimeout(errorTimeout.current);
      errorTimeout.current = setTimeout(() => {
        setError("");
        setUsername("");
        setPassword("");
      }, 2000);
      return () => clearTimeout(errorTimeout.current);
    }
  }, [error]);

  useEffect(() => {
    return () => {
      if (userWarningTimeout.current) clearTimeout(userWarningTimeout.current);
      if (passWarningTimeout.current) clearTimeout(passWarningTimeout.current);
      if (errorTimeout.current) clearTimeout(errorTimeout.current);
    };
  }, []);

  // Usuario: solo letras (mayúsc/minúsc), números y espacios
  const validateAndCleanUsername = (value) => {
    const cleaned = value.replace(/[^a-zA-Z0-9 ]/g, "");
    const hasInvalid = value !== cleaned;
    return { cleaned, hasInvalid };
  };

  // Contraseña: solo minúsculas y números. Las mayúsculas se eliminan (no se permiten)
  const validateAndCleanPassword = (value) => {
    // Elimina cualquier carácter que NO sea minúscula (a-z) o número (0-9)
    // Las mayúsculas desaparecen sin convertirse
    const cleaned = value.replace(/[^a-z0-9]/g, "");
    const hasInvalid = value !== cleaned;
    return { cleaned, hasInvalid };
  };

  const handleUsernameChange = (e) => {
    const rawValue = e.target.value;
    const { cleaned, hasInvalid } = validateAndCleanUsername(rawValue);

    if (hasInvalid && rawValue.trim() !== "") {
      setShowUserWarning(true);
      if (userWarningTimeout.current) clearTimeout(userWarningTimeout.current);
      userWarningTimeout.current = setTimeout(
        () => setShowUserWarning(false),
        1500,
      );
    }

    setUsername(cleaned);
    if (error) setError("");
  };

  const handlePasswordChange = (e) => {
    const rawValue = e.target.value;
    const { cleaned, hasInvalid } = validateAndCleanPassword(rawValue);

    if (hasInvalid && rawValue.trim() !== "") {
      setShowPassWarning(true);
      if (passWarningTimeout.current) clearTimeout(passWarningTimeout.current);
      passWarningTimeout.current = setTimeout(
        () => setShowPassWarning(false),
        1500,
      );
    }

    setPassword(cleaned);
    if (error) setError("");
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const normalizedUser = username.toLowerCase();
    const normalizedPass = password; // ya está limpia y solo minúsculas

    setTimeout(() => {
      const result = login(normalizedUser, normalizedPass);
      if (result.success) {
        navigate("/dashboard");
      } else {
        setError("ERROR DE ACCESO");
      }
      setLoading(false);
    }, 800);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-2 bg-cover bg-center bg-fixed transition-opacity duration-700"
      style={{ backgroundImage: "url('/fondolog.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 flex w-full max-w-4xl h-[540px] shadow-xl rounded-3xl overflow-hidden bg-white border-2 border-gray-200">
        {/* Columna izquierda */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-6 relative text-white">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage: "url('URL_IMAGEN_RADIOPATRULLAS')",
              backgroundColor: "#10b981",
            }}
          ></div>
          <div className="absolute inset-0 bg-[#113e27] backdrop-brightness-75"></div>
          <div className="mt-6 relative z-10 text-center">
            <span className="text-[23px] font-bold tracking-wider uppercase">
              Central Radio Patrullas
            </span>
          </div>
          <div className="relative z-10 text-center">
            <FaShieldAlt className="inline mb-8 text-5xl text-green-400/80 tracking-wider" />
            <div className="flex flex-col items-center text-center">
              <span className="text-[20px] font-bold uppercase leading-tight tracking-wider">
                Sistema policial
              </span>
              <span className="mt-2 text-[20px] font-bold uppercase leading-tight tracking-wider">
                de alertas ciudadanas
              </span>
            </div>
          </div>
          <div className="text-[10px] relative z-10 text-center text-green-400/80 tracking-wider">
            <p>© {new Date().getFullYear()} Comando Dptal. de Policía</p>
          </div>
        </div>

        {/* Apartado derecho */}
        <div className="mt-6 w-full lg:w-1/2 p-5 px-10 md:p-8 md:px-12 flex flex-col justify-center">
          <h2 className="text-[23px] font-bold text-green-900 mb-6 text-center uppercase tracking-wider">
            Ingreso al Sistema
          </h2>

          <form onSubmit={handleLogin} className="space-y-3">
            {/* Campo Usuario */}
            <div>
              <label className="mt-3 block text-green-800 text-[11px] font-semibold mb-1.5">
                <FaUser className="inline mr-1.5 text-xs" /> Usuario
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  className="w-full border border-gray-300 p-2.5 pl-9 rounded-lg text-sm focus:ring-1 focus:ring-green-800 outline-none transition-all duration-300"
                  required
                />
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
              </div>
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  showUserWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-[9px] text-gray-400 font-medium mt-1 tracking-wide">
                  * No se permiten símbolos.
                </p>
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="mt-5 block text-green-800 text-[11px] font-semibold mb-1.5">
                <FaLock className="inline mr-1.5 text-xs" /> Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full border border-gray-300 p-2.5 pl-9 rounded-lg text-sm focus:ring-1 focus:ring-green-800 outline-none transition-all duration-300"
                  required
                />
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-800 transition-colors text-xs"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye size={14} />}
                </button>
              </div>
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  showPassWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-[9px] text-gray-400 font-medium mt-1 tracking-wide">
                  * No se permiten mayúsculas ni símbolos.
                </p>
              </div>
            </div>

            {/* Bloque de Error */}
            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                error ? "max-h-24 opacity-100 mt-2" : "max-h-0 opacity-0 mt-0"
              }`}
            >
              <div className="w-full p-2.5 bg-red-50 border border-red-300 rounded-lg text-center">
                <p className="text-red-600 font-extrabold text-[11px] uppercase tracking-wider">
                  {error}
                </p>
                <p className="text-red-600 text-[11px] font-semibold mt-0.5 tracking-wide">
                  Usuario y contraseña incorrectos
                </p>
              </div>
            </div>

            {/* Botón de Ingreso */}
            <div className="mt-3">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-2.5 rounded-lg text-white font-bold text-sm tracking-wider transition-all duration-500 shadow-md transform active:scale-[0.98] ${
                  loading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-[#113e27] hover:bg-[#103b27]"
                }`}
              >
                {loading ? "VERIFICANDO..." : "INGRESAR"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;

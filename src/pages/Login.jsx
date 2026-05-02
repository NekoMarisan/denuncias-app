import React, { useState, useEffect } from "react";
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

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(""), 2000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleUsernameChange = (e) => {
    const val = e.target.value;
    if (/[^a-z0-9]/.test(val)) {
      setShowUserWarning(true);
      const t = setTimeout(() => setShowUserWarning(false), 1500);
      return () => clearTimeout(t); 
    }
    setUsername(val.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (error) setError(""); 
  };

  const handlePasswordChange = (e) => {
    const val = e.target.value;
    if (/[^a-z0-9]/.test(val)) {
      setShowPassWarning(true);
      const t = setTimeout(() => setShowPassWarning(false), 1500);
      return () => clearTimeout(t); // Limpieza de basura
    }
    setPassword(val.toLowerCase().replace(/[^a-z0-9]/g, ""));
    if (error) setError(""); 
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Pequeño delay para feedback visual de "Verificando"
    setTimeout(() => {
      const result = login(username, password);
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
      className="min-h-screen flex items-center justify-center p-4 bg-cover bg-center bg-fixed transition-opacity duration-700"
      style={{ backgroundImage: "url('/fondolog.jpg')" }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      <div className="relative z-10 flex w-full max-w-5xl h-[700px] shadow-2xl rounded-2xl overflow-hidden bg-white border-4 border-gray-100">
        
        {/* Columna izquierda */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative text-white">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: "url('URL_IMAGEN_RADIOPATRULLAS')", backgroundColor: "#10b981" }}
          ></div>
          <div className="absolute inset-0 bg-green-900/80 backdrop-brightness-75"></div>
          <div className="relative z-10 text-center">
            <span className="text-3xl font-extrabold tracking-wider uppercase">Central Radio Patrullas</span>
          </div>
          <div className="relative z-10 text-center">
            <FaShieldAlt className="inline mb-8 text-6xl text-green-400" />
            <h2 className="text-3xl font-bold">Sistema Policial de Cochabamba</h2>
          </div>
          <div className="relative z-10 text-center text-green-300 text-sm">
            <p>© {new Date().getFullYear()} Comando Dptal. de Policía</p>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="mt-12 w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h2 className=" text-4xl font-bold text-green-700 mb-6 text-center uppercase tracking-tighter">
            Ingreso al Sistema
          </h2>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Campo Usuario */}
            <div>
              <label className="mt-8 block text-green-800 text-sm font-semibold mb-2">
                <FaUser className="inline mr-2" /> Usuario
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  className="w-full border-2 border-gray-300 p-4 pl-12 rounded-lg focus:ring-2 focus:ring-green-800 outline-none transition-all duration-300"
                  required
                />
                <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${showUserWarning ? "max-h-10 opacity-100" : "max-h-0 opacity-0"}`}>
                <p className="text-[12px] text-gray-400 font-medium mt-2">* Sin mayúsculas ni símbolos</p>
              </div>
            </div>

            {/* Campo Contraseña */}
            <div>
              <label className="mt-5 block text-green-800 text-sm font-semibold mb-2">
                <FaLock className="inline mr-2" /> Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  className="w-full border-2 border-gray-300 p-4 pl-12 rounded-lg focus:ring-2 focus:ring-green-800 outline-none transition-all duration-300"
                  required
                />
                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-green-800 transition-colors"
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </button>
              </div>
              <div className={`overflow-hidden transition-all duration-500 ${showPassWarning ? "max-h-10 opacity-100" : "max-h-0 opacity-0"}`}>
                <p className="text-[12px] text-gray-400 font-medium mt-2">* Sin mayúsculas ni símbolos</p>
              </div>
            </div>

            {/* Bloque de Error Dinámico */}
            <div className={`overflow-hidden transition-all duration-500 ease-in-out ${error ? "max-h-32 opacity-100 mt-4" : "max-h-0 opacity-0 mt-0"}`}>
              <div className="w-full p-4 bg-red-50 border-2 border-red-300 rounded-lg text-center">
                <p className="text-red-600 font-black text-sm uppercase tracking-widest">{error}</p>
                <p className="text-red-600 text-xs font-semibold mt-1">Usuario y contraseña incorrectos</p>
              </div>
            </div>

            {/* Botón de Ingreso */}
            <div className="mt-6">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-4 rounded-lg text-white font-bold text-lg tracking-widest transition-all duration-500 shadow-md transform active:scale-[0.98] ${
                  loading ? "bg-gray-600 cursor-not-allowed" : "bg-green-800 hover:bg-green-900"
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
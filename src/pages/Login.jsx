import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { FaShieldAlt, FaUser, FaLock, FaEye, FaEyeSlash } from "react-icons/fa";

const MAX_INTENTOS = 3;
const TIEMPO_BLOQUEO_MS = 5 * 60 * 1000;
const STORAGE_KEY = "login_intentos_bloqueos";

const obtenerEstadoIntentos = () => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) return {};
  try {
    return JSON.parse(stored);
  } catch {
    return {};
  }
};

const guardarEstadoIntentos = (estado) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(estado));
};

// Firma visual: anillos de señal de radio (referencia literal a "Radio Patrullas").
// Vectorial -> nunca se recorta ni se pixela en ningún tamaño de pantalla.
function RadarSignature() {
  return (
    <div
      className="pointer-events-none absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 sm:h-[260px] sm:w-[260px] md:h-[320px] md:w-[320px]"
      aria-hidden="true"
    >
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <circle cx="100" cy="100" r="98" fill="none" stroke="#c0c29f" strokeOpacity="0.10" strokeWidth="1" />
        <circle cx="100" cy="100" r="72" fill="none" stroke="#c0c29f" strokeOpacity="0.14" strokeWidth="1" />
        <circle cx="100" cy="100" r="46" fill="none" stroke="#c0c29f" strokeOpacity="0.20" strokeWidth="1" />
        <circle
          cx="100"
          cy="100"
          r="46"
          fill="none"
          stroke="#ceaa43"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          className="rp-radar-ring"
        />
        <circle
          cx="100"
          cy="100"
          r="46"
          fill="none"
          stroke="#ceaa43"
          strokeOpacity="0.35"
          strokeWidth="1.5"
          className="rp-radar-ring rp-radar-ring-delay"
        />
      </svg>
    </div>
  );
}

function Login() {
  const navigate = useNavigate();
  const { login, user } = useAuth();
  const { showToast } = useToast();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showUserWarning, setShowUserWarning] = useState(false);
  const [userWarningMessage, setUserWarningMessage] = useState("");
  const userWarningTimeout = useRef(null);
  const errorTimeout = useRef(null);

  useEffect(() => {
    if (error) {
      if (errorTimeout.current) clearTimeout(errorTimeout.current);
      errorTimeout.current = setTimeout(() => setError(""), 2000);
      return () => clearTimeout(errorTimeout.current);
    }
  }, [error]);

  useEffect(() => {
    return () => {
      if (userWarningTimeout.current) clearTimeout(userWarningTimeout.current);
      if (errorTimeout.current) clearTimeout(errorTimeout.current);
    };
  }, []);

  const validateAndCleanUsername = (value) => {
    const cleaned = value.replace(/[^a-zA-Z0-9\-]/g, "");
    const hasInvalid = value !== cleaned;
    return { cleaned, hasInvalid };
  };

  const handleUsernameChange = (e) => {
    const rawValue = e.target.value;
    const { cleaned, hasInvalid } = validateAndCleanUsername(rawValue);

    if (hasInvalid) {
      let msg = "";
      if (rawValue.includes(" ")) {
        msg = "* No se permiten espacios.";
      } else {
        msg = "* Solo letras, números y guiones.";
      }
      setUserWarningMessage(msg);
      setShowUserWarning(true);
      if (userWarningTimeout.current) clearTimeout(userWarningTimeout.current);
      userWarningTimeout.current = setTimeout(() => {
        setShowUserWarning(false);
        setUserWarningMessage("");
      }, 1500);
    }

    setUsername(cleaned);
    if (error) setError("");
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (error) setError("");
  };

  const verificarBloqueo = (escalafon) => {
    const estado = obtenerEstadoIntentos();
    const registro = estado[escalafon];
    if (!registro) return false;
    const { bloqueadoHasta } = registro;
    if (bloqueadoHasta && Date.now() < bloqueadoHasta) {
      const minutosRestantes = Math.ceil((bloqueadoHasta - Date.now()) / 60000);
      showToast(`Cuenta bloqueada. Intente nuevamente en ${minutosRestantes} minuto(s).`, "error");
      return true;
    }
    return false;
  };

  const registrarIntentoFallido = (escalafon) => {
    const estado = obtenerEstadoIntentos();
    const registro = estado[escalafon] || { intentos: 0, bloqueadoHasta: null };
    if (registro.bloqueadoHasta && Date.now() < registro.bloqueadoHasta) return;
    registro.intentos = (registro.intentos || 0) + 1;
    if (registro.intentos >= MAX_INTENTOS) {
      registro.bloqueadoHasta = Date.now() + TIEMPO_BLOQUEO_MS;
      registro.intentos = 0;
      showToast(`Demasiados intentos fallidos. Cuenta bloqueada por 5 minutos.`, "error");
    } else {
      const restantes = MAX_INTENTOS - registro.intentos;
      showToast(`Credenciales incorrectas. Intento ${registro.intentos} de ${MAX_INTENTOS}. Restan ${restantes} intentos.`, "error");
    }
    estado[escalafon] = registro;
    guardarEstadoIntentos(estado);
  };

  const resetearIntentos = (escalafon) => {
    const estado = obtenerEstadoIntentos();
    if (estado[escalafon]) {
      delete estado[escalafon];
      guardarEstadoIntentos(estado);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const escalafon = username.trim();
    const pass = password;

    if (!escalafon || !pass) {
      setError("Complete ambos campos");
      setLoading(false);
      return;
    }

    if (verificarBloqueo(escalafon)) {
      setLoading(false);
      return;
    }

    try {
const result = await login(escalafon, pass);
      if (!result.success) {
        const esSuspendido = result.error?.includes("FUERA DE SERVICIO");
        const esBaja = result.error?.includes("DADO DE BAJA");
        const esPendiente = result.error?.includes("PENDIENTE");
        if (esSuspendido || esBaja || esPendiente) {
          showToast(result.error, "error");
        } else {
          registrarIntentoFallido(escalafon);
          setError(result.error || "Credenciales incorrectas");
        }
      } else {
        resetearIntentos(escalafon);

        const rolLabel = {
          admin: "Administrador",
          operador: "Operador",
          despachador: "Despachador",
          tabulador: "Tabulador",
        }[result.rol] || result.rol;
        showToast(`¡Bienvenido, ${rolLabel} ${result.nombre}!`, "success");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("ERROR DE CONEXIÓN");
      registrarIntentoFallido(escalafon);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="relative flex min-h-[100dvh] w-full items-center justify-center bg-cover bg-center bg-scroll p-4 sm:bg-fixed sm:p-6"
      style={{
        backgroundImage: "url('/fondolog.jpg')",
        paddingTop: "max(1rem, env(safe-area-inset-top))",
        paddingBottom: "max(1rem, env(safe-area-inset-bottom))",
      }}
    >
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(circle at 5% 25%, rgba(20,20,20,0.5) 0%, rgba(0,0,0,0.5) )" }}
      />
      <style>{`
        @keyframes rpRadarPulse {
          0% { transform: scale(0.55); opacity: 0.55; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .rp-radar-ring {
          animation: rpRadarPulse 3.2s ease-out infinite;
          transform-origin: 100px 100px;
        }
        .rp-radar-ring-delay { animation-delay: 1.6s; }
        @media (prefers-reduced-motion: reduce) {
          .rp-radar-ring, .rp-radar-ring-delay { animation: none; }
        }
      `}</style>

      {/* Card */}
      <div className="relative z-10 flex w-full max-w-[360px] flex-col overflow-hidden rounded-2xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)] sm:max-w-[420px] md:max-w-xl md:min-h-[440px] md:flex-row md:rounded-[28px] lg:max-w-3xl lg:min-h-[410px]">
        {/* Panel de marca: franja superior en móvil, columna lateral desde md */}
        <div
  className="relative flex flex-col items-center justify-center gap-1.5 overflow-hidden px-6 py-3 text-center sm:gap-2 sm:py-6 md:w-[42%] md:justify-between md:gap-0 md:px-8 md:py-10"
  style={{ background: "#474b29" }}
>
          <RadarSignature />

          {/* Espaciador superior solo visible en md, para anclar el título al centro con el copyright abajo */}
          <div className="hidden md:block" />

          <div className="relative z-10 flex flex-col items-center gap-2.5 md:mb-4">
            <FaShieldAlt className="mt-1.5 text-2xl text-[#ceaa43] sm:mt-10 sm:text-4xl md:text-5xl" />
            <div>
             <h1 className="text-xs font-bold uppercase tracking-[0.15em] text-white sm:mt-4 sm:text-base md:text-lg">
  Central Radio Patrullas
</h1>
              <div className="mx-auto mt-4 hidden h-[1.5px] w-10 bg-[#ceaa43] sm:block" />
<p className="mt-1 sm:mt-4 text-[8px] font-semibold uppercase leading-snug tracking-[0.05em] text-[#c0c29f] sm:text-[11px] sm:tracking-[0.12em] sm:leading-relaxed">
  Sistema policial de alertas<br className="hidden sm:inline" /> ciudadanas
</p>
            </div>
          </div>

         <p className="relative z-10 hidden text-[10px] tracking-wider text-[#c0c29f] md:block mt-4">
  © {new Date().getFullYear()} Comando Dptal. de Policía
</p>
        </div>

        {/* Panel de formulario */}
        <div className="flex flex-1 flex-col justify-center bg-[#fbfaf9] px-5 py-5  sm:px-10 sm:py-9 md:p-10 lg:p-12">
          <h2 className="mb-5 text-center text-[18px] font-bold uppercase tracking-widest text-[#474b29] sm:mb-6 sm:text-xl">
            Ingreso al Sistema
          </h2>

          <form onSubmit={handleLogin} className="mt-6 space-y-3.5 -px-2">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[#474b29] uppercase pl-1">
                <FaUser className="mr-1.5 -mt-1 inline text-xs" /> Número de Escalafón
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={username}
                  onChange={handleUsernameChange}
                  className="min-h-[46px] w-full rounded-xl border border-[#474b29]/50 bg-white pl-6 pr-3 text-sm text-[#16241c] outline-none transition-all duration-200 focus:border-[#474b29] focus:ring-2 focus:ring-[#474b29]/15 font-medium tracking-wider mb-2"
                  required
                />

              </div>
              <div
                className={`overflow-hidden transition-all duration-500 ${
                  showUserWarning ? "max-h-8 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="mt-1 text-[10px] font-medium tracking-wider text-[#8a6d1f]">
                  {userWarningMessage}
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-[#474b29] uppercase pl-1">
                <FaLock className="mr-1.5 -mt-1 inline text-xs" /> Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={handlePasswordChange}
                  className="min-h-[46px] w-full rounded-xl border border-[#474b29]/50 bg-white pl-6 pr-11 text-sm text-[#16241c] outline-none transition-all duration-200 focus:border-[#474b29] focus:ring-2 focus:ring-[#474b29]/15 font-medium tracking-wider"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-gray-400 transition-colors hover:text-[#474b29]"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye size={14} className="text-[#474b29]"/>}
                </button>
              </div>
            </div>

            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out ${
                error ? "mt-2 max-h-24 opacity-100" : "mt-0 max-h-0 opacity-0"
              }`}
            >
              <div className="w-full rounded-lg border border-red-200 bg-red-50 p-2.5 text-center">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#C90A0A]">
                  {error}
                </p>
              </div>
            </div>

            <div className="pt-1.5">
              <button
                type="submit"
                disabled={loading}
                className={`min-h-[46px] w-full transform rounded-xl text-[12px] font-medium uppercase tracking-wider text-white shadow-md transition-all duration-300 active:scale-[0.98] -mt-2 ${
                  loading
                    ? "cursor-not-allowed bg-gray-400"
                    : "bg-[#474b29] hover:bg-[#474b29]"
                }`}
              >
                {loading ? "VERIFICANDO..." : "INGRESAR"}
              </button>
            </div>
          </form>

          {/* Copyright: visible solo por debajo de md, donde el panel lateral está oculto en su versión completa */}
          <p className="mt-4 text-center text-[9px] tracking-wider text-gray-400 md:hidden">
            © {new Date().getFullYear()} Comando Dptal. de Policía
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
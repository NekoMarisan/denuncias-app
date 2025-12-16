import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaUser, FaLock, FaEye, FaEyeSlash, FaGoogle, FaCarSide } from "react-icons/fa";

function Login() {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    setTimeout(() => {
      const users = {
        "admin": {
          password: "1234",
          role: "admin",
          name: "Admin Policial"
        },
        "Julio Ruiz": {
          password: "super123",
          role: "supervisor",
          name: "Julio Ruiz"
        },
      };

      if (users[user] && users[user].password === password) {
        if (selectedRole && users[user].role !== selectedRole) {
          setError(`Este usuario está registrado con el rol de: ${users[user].role.toUpperCase()}. Por favor, selecciona el rol correcto.`);
          setLoading(false);
          return;
        }

        localStorage.setItem("user", JSON.stringify({
          username: user,
          role: users[user].role,
          name: users[user].name,
          loginTime: new Date().toISOString()
        }));

        navigate("/dashboard");
      } else {
        setError("Usuario o contraseña incorrectos");
      }
      setLoading(false);
    }, 800);
  };

  const handleGoogleLogin = () => {
    setLoading(true);
    setTimeout(() => {
      alert("Funcionalidad de Google Login en desarrollo");
      setLoading(false);
    }, 800);
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/fondolog.jpg')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      }}
    >
      <div className="absolute inset-0 bg-black/40"></div>
      
      <div className="relative z-10 flex w-full max-w-5xl h-[700px] shadow-2xl rounded-2xl overflow-hidden bg-white border-4 border-gray-100">

        {/* COLUMNA IZQUIERDA (Se mantiene sin cambios) */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative text-white">
          
          <div 
            className="absolute inset-0 bg-cover bg-center" 
            style={{ 
              backgroundImage: "url('URL_DE_LA_IMAGEN_DE_RADIOPATRULLAS_110_COCHABAMBA.jpg')",
              backgroundColor: '#10b981'
            }}
          ></div>
          
          <div className="absolute inset-0 bg-green-900/80 backdrop-brightness-75"></div>
          
          <div className="relative z-10">
            <div className="text-3xl font-extrabold mb-1 flex items-center">
              <FaCarSide className="inline mr- text-green-400 text-4xl" />
              <span className="text-white tracking-wider">RADIO PATRULLAS 110</span>
            </div>
          </div>

          <div className="relative z-10 text-center">
            <h1 className="text-5xl font-extrabold mb-4 tracking-tight text-white">
              <FaShieldAlt className="inline mb-2 text-6xl text-green-400" />
            </h1>
            <h2 className="text-3xl font-bold mb-3">
              Sistema Policial de Cochabamba
            </h2>
            <div className="mt-20">
                <div className="flex items-start gap-3 text-xs text-green-200">
                    <div>
                        <p className="font-semibold text-green-200 mb-1">REQUERIMIENTO DE SEGURIDAD:</p>
                        <p>El uso no autorizado de este sistema está estrictamente prohibido y será procesado legalmente.</p>
                    </div>
                </div>
            </div>
          </div>

          <div className="relative z-10 text-center">
            <p className="text-sm text-green-300">
              © {new Date().getFullYear()} Comando Dptal. de Policía
            </p>
            <p className="text-xs text-green-400 mt-1 font-mono">
              <span className="font-bold">LIVE</span> V4.1 | Cochabamba, Bolivia
            </p>
          </div>
        </div>

        {/* COLUMNA DERECHA (Formulario de Login) */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <h2 className="text-4xl font-bold text-green-700 mb-6 text-center">
            Ingreso al Sistema Táctico
          </h2>

          {/* Contenedor principal del formulario */}
          <div className="flex flex-col h-full">
            {/* Campos del formulario que NO se mueven */}
            <form onSubmit={handleLogin} className="flex-1">
              <div className="space-y-6">
                {/* Campo USUARIO */}
                <div>
                  <label className="block text-green-800 text-sm font-semibold mb-2">
                    <FaUser className="inline mr-2 text-green-700" /> Usuario
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Ingrese su usuario"
                      value={user}
                      onChange={(e) => setUser(e.target.value)}
                      className="w-full bg-white border-2 border-gray-300 text-gray-900 p-4 pl-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
                      required
                    />
                    <FaUser className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                  </div>
                </div>
                
                {/* Campo CONTRASEÑA */}
                <div>
                  <label className="block text-green-800 text-sm font-semibold mb-2">
                    <FaLock className="inline mr-2 text-green-700" /> Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Ingrese su contraseña"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full bg-white border-2 border-gray-300 text-gray-900 p-4 pl-12 pr-12 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700 focus:border-transparent"
                      required
                    />
                    <FaLock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-green-700"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>
                
                {/* Campo ROL */}
                <div>
                  <label className="block text-green-800 text-sm font-semibold mb-2">
                    Rango / Rol
                  </label>
                  <select 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold p-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-700"
                    required
                  > 
                    <option value="" disabled className="font-semibold text-gray-400">Seleccione su rol</option>
                    <option value="admin" className="font-semibold">Administrador</option>
                    <option value="supervisor" className="font-semibold">Supervisor</option>
                    <option value="oficial" className="font-semibold">Oficial</option>
                    <option value="operador" className="font-semibold">Operador</option>
                  </select>
                </div>
              </div>
              
              {/* Espacio para el mensaje de error - fijo */}
              <div className="mt-6 transition-all duration-200 ease-in-out">
                {error && (
                  <div className="p-4 bg-red-50 border-2 border-red-300 text-red-700 rounded-lg text-center shadow-md animate-fadeIn">
                    <div className="font-bold mb-1 flex items-center justify-center gap-2">
                      <span className="text-red-600">⚠️</span>
                      ERROR DE ACCESO
                      <span className="text-red-600">⚠️</span>
                    </div>
                    <div className="text-sm">{error}</div>
                  </div>
                )}
              </div>
              
              {/* Botón que SI se mueve hacia abajo */}
              <div className={`mt-${error ? '6' : '6'} transition-margin duration-200 ease-in-out`}>
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 rounded-lg text-white font-bold text-lg transition-all duration-300 shadow-lg ${loading
                    ? 'bg-gray-600 cursor-not-allowed opacity-90'
                    : 'bg-gradient-to-r from-green-700 to-green-800 hover:from-green-800 hover:to-green-900 active:scale-[0.99] transform'
                    }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                      VERIFICANDO...
                    </div>
                  ) : (
                    "INGRESAR AL SISTEMA"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Agregar estilos para la animación de fadeIn */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
}

export default Login;

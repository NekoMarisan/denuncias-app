import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaUser, FaLock, FaEye, FaEyeSlash, FaUserShield } from "react-icons/fa";

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
          name: "admin" 
        },
        "Julio Ruiz": { 
          password: "super123", 
          role: "supervisor", 
          name: "Julio Ruiz" 
        },
      };

      if (users[user] && users[user].password === password) {
        if (selectedRole && users[user].role !== selectedRole) {
          setError(`Este usuario pertenece al rol: ${users[user].role.toUpperCase()}`);
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex flex-col justify-center items-center p-5">
      <div className="text-center mb-4">
        <div className="flex justify-center items-center gap-4 mb-4">
          <div className="bg-green-800 p-4 rounded-full shadow-lg">
            <FaUserShield className="text-white text-4xl" />
          </div>
          <div className="text-left">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">
              SISTEMA POLICIAL
            </h1>
            <p className="text-gray-600 text-lg font-semibold">
              Plataforma de Gestión de Denuncias y Alertas
            </p>
          </div>
        </div>
      </div>

      <div className="-mt-2 bg-white border-2 border-green-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-green-800 p-6 text-center">
          <h2 className="text-2xl font-bold text-white flex items-center justify-center gap-3">
            <FaShieldAlt /> ACCESO RESTRINGIDO
          </h2>
          <p className="text-green-200 text-sm mt-2">
            Sistema de Seguridad - Solo personal autorizado
          </p>
        </div>

        <form onSubmit={handleLogin} className="p-8">
          <div className="mb-6">
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

          <div className="mb-6">
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

          <div className="mb-6">
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
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-300 text-red-700 rounded-lg text-center">
              <div className="font-bold mb-1">⚠️ ERROR DE ACCESO</div>
              <div className="text-sm">{error}</div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-lg text-white font-bold text-lg transition-all ${loading 
              ? 'bg-green-800 cursor-not-allowed' 
              : 'bg-green-700 hover:bg-green-800 hover:shadow-lg active:bg-green-900'
            }`}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                VERIFICANDO...
              </div>
            ) : (
              "🔐 INGRESAR AL SISTEMA"
            )}
          </button>
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-start gap-3 text-xs text-gray-500">
              <FaShieldAlt className="text-green-700 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-green-700 mb-1">NOTA DE SEGURIDAD:</p>
                <p>Sistema restringido al personal autorizado. Todas las actividades son monitoreadas y registradas.</p>
              </div>
            </div>
          </div>
        </form>
      </div>

      <div className="mt-6 text-center">
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} Comando Policial - Departamento de Sistemas
        </p>
        <p className="text-gray-600 text-xs mt-1">
          Versión 3.1.4 | Protocolo de Seguridad SSL/TLS
        </p>
      </div>
    </div>
  );
}

export default Login;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();

    // 🔐 Ejemplo simple de validación (luego se reemplaza por autenticación real)
    if (user === "admin" && password === "1234") {
      navigate("/dashboard"); // Redirige al Dashboard
    } else {
      setError("Usuario o contraseña incorrectos");
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-green-100">
      <form
        onSubmit={handleLogin}
        className="bg-white p-8 rounded-2xl shadow-lg w-96"
      >
        <h2 className="text-2xl font-bold text-center mb-6 text-green-700">
          Iniciar Sesión
        </h2>

        <input
          type="text"
          placeholder="Usuario"
          value={user}
          onChange={(e) => setUser(e.target.value)}
          className="w-full p-3 border rounded mb-4"
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-3 border rounded mb-4"
        />

        {error && (
          <p className="text-red-500 text-sm text-center mb-2">{error}</p>
        )}

        <button
          type="submit"
          className="bg-green-600 text-white w-full py-3 rounded hover:bg-green-700 transition"
        >
          Entrar
        </button>
      </form>
    </div>
  );
}

export default Login;

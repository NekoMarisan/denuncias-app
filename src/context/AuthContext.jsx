import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '../services/supabase'

const AuthContext = createContext();

// Simulamos una base de datos con los roles que tu Layout necesita
const USERS_DB = [
  { id: 1, username: "admin", password: "1234", rol: "admin", nombre: "Administrador Central" },
  { id: 2, username: "operador", password: "12", rol: "operador", nombre: "Operador de Turno" },
  { id: 3, username: "despacho", password: "12", rol: "despachador", nombre: "Despachador Táctico" },
  { id: 4, username: "tabulador", password: "12", rol: "tabulador", nombre: "Analista de Datos" }
];

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("sistema_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const login = (username, password) => {
    // Buscamos si el usuario existe en nuestra lista
    const foundUser = USERS_DB.find(u => u.username === username && u.password === password);

    if (foundUser) {
      const userWithoutPassword = { ...foundUser };
      delete userWithoutPassword.password;
      
      setUser(userWithoutPassword);
      localStorage.setItem("sistema_user", JSON.stringify(userWithoutPassword));
      return { success: true, rol: foundUser.rol };
    }
    return { success: false, error: "Credenciales incorrectas" };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("sistema_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        // ARREGLADO: Ahora detectan el rol real del usuario logueado
        isAdmin: user?.rol === "admin",
        isOperador: user?.rol === "operador",
        isDespachador: user?.rol === "despachador",
        isTabulador: user?.rol === "tabulador",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
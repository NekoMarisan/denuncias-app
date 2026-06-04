import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Leer usuario desde sessionStorage al iniciar
    const storedUser = sessionStorage.getItem("sistema_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    // Limpieza de posibles residuos de localStorage de versiones anteriores
    if (localStorage.getItem("usuario")) {
      localStorage.removeItem("usuario");
    }
  }, []);

  const login = async (numero_escalafon, contrasena) => {
    const { data, error } = await supabase
      .from("oficial")
      .select("*")
      .eq("numero_escalafon", numero_escalafon)
      .eq("contrasena", contrasena)
      .maybeSingle();

    if (error || !data) {
      console.error("Error login:", error);
      return { success: false, error: "Credenciales incorrectas" };
    }

    // Verificar acceso
    if (data.acceso === "DE BAJA" || data.acceso === "FUERA DE SERVICIO") {
      return { success: false, error: "Usuario sin acceso al sistema" };
    }

    // Normalizar rol
    let rolNormalizado = data.rol;
    if (rolNormalizado === "Administrador") rolNormalizado = "admin";
    if (rolNormalizado === "Operador") rolNormalizado = "operador";
    if (rolNormalizado === "Despachador") rolNormalizado = "despachador";
    if (rolNormalizado === "Tabulador") rolNormalizado = "tabulador";

    const cleanUser = { ...data, rol: rolNormalizado };
    delete cleanUser.contrasena;

    setUser(cleanUser);
    // Persistir en sessionStorage (se limpia al cerrar la pestaña)
    sessionStorage.setItem("sistema_user", JSON.stringify(cleanUser));

    return { success: true, rol: rolNormalizado };
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem("sistema_user");
    // Limpiar también por si quedó algún residuo anterior
    localStorage.removeItem("usuario");
    supabase.auth.signOut();
  };

  const permissions = {
    operador: ["dashboard", "alertas"],
    despachador: ["dashboard", "despacho"],
    tabulador: ["dashboard", "tabulacion"],
    admin: ["dashboard", "usuarios", "alertas", "despacho", "tabulacion"],
  };

  const hasAccess = (module) => {
    if (!user) return false;
    return permissions[user.rol]?.includes(module);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAdmin: user?.rol === "admin",
        isOperador: user?.rol === "operador",
        isDespachador: user?.rol === "despachador",
        isTabulador: user?.rol === "tabulador",
        hasAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
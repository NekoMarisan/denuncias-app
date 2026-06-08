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
    // 1. Buscar oficial por escalafón y contraseña
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

    // 2. Verificar acceso (solo "EN SERVICIO" puede ingresar)
    if (data.acceso !== "EN SERVICIO") {
      return { success: false, error: "Cuenta no habilitada. Contacte a la central." };
    }

    // 3. Actualizar estado a CONECTADO (true)
    const { error: updateError } = await supabase
      .from("oficial")
      .update({ estado: true })
      .eq("id_oficial", data.id_oficial);

    if (updateError) {
      console.error("Error al actualizar estado:", updateError);
      // No impedimos el login, solo registramos error
    }

    // 4. Normalizar rol
    let rolNormalizado = data.rol;
    if (rolNormalizado === "Administrador") rolNormalizado = "admin";
    if (rolNormalizado === "Operador") rolNormalizado = "operador";
    if (rolNormalizado === "Despachador") rolNormalizado = "despachador";
    if (rolNormalizado === "Tabulador") rolNormalizado = "tabulador";

    // 5. Construir objeto de usuario (sin contraseña)
    const cleanUser = { ...data, rol: rolNormalizado };
    delete cleanUser.contrasena;

    // 6. Guardar sesión en sessionStorage y estado
    setUser(cleanUser);
    sessionStorage.setItem("sistema_user", JSON.stringify(cleanUser));

    return { success: true, rol: rolNormalizado };
  };

  const logout = async () => {
    if (user) {
      // Actualizar estado a DESCONECTADO (false) en la BD
      await supabase
        .from("oficial")
        .update({ estado: false })
        .eq("id_oficial", user.id_oficial);
    }
    setUser(null);
    sessionStorage.removeItem("sistema_user");
    localStorage.removeItem("usuario");
    supabase.auth.signOut();
  };

  // Permisos
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
        user,               // ✅ contiene id_oficial, nombre_completo, rol, etc.
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
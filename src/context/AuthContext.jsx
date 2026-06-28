import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../services/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
const DURACION_SESION_MS = 30 * 60 * 1000;
const AVISO_MS = 28 * 60 * 1000;

  useEffect(() => {
    const storedUser = sessionStorage.getItem("sistema_user");
    const sessionStart = sessionStorage.getItem("session_start");

    if (storedUser && sessionStart) {
      const tiempoTranscurrido = Date.now() - parseInt(sessionStart, 10);
      if (tiempoTranscurrido >= DURACION_SESION_MS) {
        logout("expiracion");
        return;
      }
      setUser(JSON.parse(storedUser));
    }

    if (localStorage.getItem("usuario")) {
      localStorage.removeItem("usuario");
    }
  }, []);

// ANTES — no existe nada aquí

// DESPUÉS — agregar esto
useEffect(() => {
  if (!user) return;

  const channel = supabase
    .channel("acceso_oficial")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "oficial", filter: `id_oficial=eq.${user.id_oficial}` },
      (payload) => {
        const nuevoAcceso = payload.new.acceso;
        if (nuevoAcceso === "FUERA DE SERVICIO") {
          window.dispatchEvent(new CustomEvent("sesion_bloqueada", { detail: { motivo: "fuera_de_servicio" } }));
          logout("fuera_de_servicio");
        } else if (nuevoAcceso === "DE BAJA") {
          window.dispatchEvent(new CustomEvent("sesion_bloqueada", { detail: { motivo: "de_baja" } }));
          logout("de_baja");
        }
      }
    )
    .subscribe();

  return () => supabase.removeChannel(channel);
}, [user]);

  useEffect(() => {
    if (!user) return;

    const intervalo = setInterval(() => {
      const sessionStart = sessionStorage.getItem("session_start");
      if (!sessionStart) return;

      const tiempoTranscurrido = Date.now() - parseInt(sessionStart, 10);

      if (tiempoTranscurrido >= DURACION_SESION_MS) {
        clearInterval(intervalo);
        logout("expiracion");
      } else if (tiempoTranscurrido >= AVISO_MS) {
        if (!sessionStorage.getItem("aviso_expiracion")) {
          sessionStorage.setItem("aviso_expiracion", "1");
          window.dispatchEvent(new CustomEvent("sesion_por_expirar"));
        }
      }
    }, 60 * 1000);

    return () => clearInterval(intervalo);
  }, [user]);

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

    if (data.acceso === "FUERA DE SERVICIO") {
      return { success: false, error: "FUERA DE SERVICIO - Su cuenta está inactiva temporalmente." };
    }
    if (data.acceso === "DE BAJA") {
      return { success: false, error: "DADO DE BAJA - Su cuenta esta deshabilitada." };
    }

    const { error: updateError } = await supabase
      .from("oficial")
      .update({ estado: true })
      .eq("id_oficial", data.id_oficial);

    if (updateError) console.error("Error al actualizar estado:", updateError);

    let rolNormalizado = data.rol;
    if (rolNormalizado === "Administrador" || rolNormalizado === "Admin") rolNormalizado = "admin";
    if (rolNormalizado === "Operador") rolNormalizado = "operador";
    if (rolNormalizado === "Despachador") rolNormalizado = "despachador";
    if (rolNormalizado === "Tabulador") rolNormalizado = "tabulador";

    const cleanUser = { ...data, rol: rolNormalizado };
    delete cleanUser.contrasena;

    setUser(cleanUser);
    sessionStorage.setItem("sistema_user", JSON.stringify(cleanUser));
    sessionStorage.setItem("session_start", Date.now().toString());
    sessionStorage.removeItem("aviso_expiracion");
    sessionStorage.removeItem("bienvenida_mostrada");

    // Crear token de sesión seguro via Edge Function
    try {
      const res = await fetch(
        `${process.env.REACT_APP_SUPABASE_URL}/functions/v1/validar-acceso`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "apikey": process.env.REACT_APP_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            accion: "crear_sesion",
            id_oficial: data.id_oficial,
            rol: rolNormalizado,
          }),
        }
      );
      const json = await res.json();
      if (json.token) {
        localStorage.setItem("session_token", json.token);
      }
    } catch (fnErr) {
      console.error("Error creando token de sesión:", fnErr);
    }

    await supabase.from("log_actividad").insert({
      accion: rolNormalizado,
      descripcion: `Ha iniciado de sesión - Escalafón ${data.numero_escalafon}`,
      id_oficial: data.id_oficial,
      fecha_hora: new Date().toISOString(),
    });

    return { success: true, rol: rolNormalizado, nombre: cleanUser.nombre_completo };
  };

  const logout = async (motivo = "manual") => {
    if (user) {
      await supabase.from("log_actividad").insert({
        accion: user.rol,
        descripcion: motivo === "expiracion"
          ? `Sesión expirada automáticamente — ${user.nombre_completo || user.numero_escalafon}`
          : `Ha cerrado sesión — ${user.nombre_completo || user.numero_escalafon}`,
        id_oficial: user.id_oficial,
        fecha_hora: new Date().toISOString(),
      });

      await supabase
        .from("oficial")
        .update({ estado: false })
        .eq("id_oficial", user.id_oficial);
    }
    setUser(null);
    sessionStorage.removeItem("sistema_user");
    sessionStorage.removeItem("session_start");
    sessionStorage.removeItem("aviso_expiracion");
    localStorage.removeItem("usuario");
    localStorage.removeItem("session_token");
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
  sessionStart: sessionStorage.getItem("session_start"),
  DURACION_SESION_MS,
  userRole: user?.rol,           // <-- AGREGAR ESTA LÍNEA
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
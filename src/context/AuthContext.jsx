import React, { createContext, useState, useContext, useEffect, useRef } from "react";
import { supabase, setOficialHeader } from "../services/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
const [user, setUser] = useState(null);
  const [cargando, setCargando] = useState(true);
const DURACION_SESION_MS = 30 * 60 * 1000;   // 30 minutos total
const AVISO_MS = 28 * 60 * 1000;             // aviso en el minuto 28
const avisoDisparado = useRef(false);

useEffect(() => {
    const storedUser = sessionStorage.getItem("sistema_user");
    const sessionStart = sessionStorage.getItem("session_start");

    if (storedUser && sessionStart) {
      const tiempoTranscurrido = Date.now() - parseInt(sessionStart, 10);
      if (tiempoTranscurrido >= DURACION_SESION_MS) {
        sessionStorage.removeItem("sistema_user");
        sessionStorage.removeItem("session_start");
        sessionStorage.removeItem("aviso_expiracion");
        localStorage.removeItem("session_token");
      } else {
        try {
  const parsedUser = JSON.parse(storedUser);
  setUser(parsedUser);
  setOficialHeader(parsedUser.id_oficial);
} catch (_) {
  sessionStorage.removeItem("sistema_user");
}
      }
    }

    if (localStorage.getItem("usuario")) {
      localStorage.removeItem("usuario");
    }

    setCargando(false);
  }, []);

useEffect(() => {
  if (!user) return;

  let listo = false;
  setTimeout(() => { listo = true; }, 3000);

  const channel = supabase
    .channel("acceso_oficial")
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "oficial", filter: `id_oficial=eq.${user.id_oficial}` },
      (payload) => {
        if (!listo) return;
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

    let ultimaActividad = Date.now();
    let avisoMostrado = false;

const registrarActividad = () => {
      ultimaActividad = Date.now();
      console.log("RESET actividad:", new Date().toLocaleTimeString());
      if (avisoMostrado) {
        avisoMostrado = false;
        window.dispatchEvent(new CustomEvent("sesion_reiniciada"));
      }
    };

    const eventos = ["mousemove", "keydown", "click", "scroll", "touchstart"];
    eventos.forEach((evento) => window.addEventListener(evento, registrarActividad));

let yaExpiro = false;

    const intervalo = setInterval(() => {
      const inactivo = Date.now() - ultimaActividad;
      console.log("Chequeo inactividad:", Math.round(inactivo / 1000), "seg | aviso:", avisoMostrado);

      if (inactivo >= DURACION_SESION_MS) {
        if (yaExpiro) return;
        yaExpiro = true;
        clearInterval(intervalo);
        logout("expiracion");
      } else if (inactivo >= AVISO_MS && !avisoMostrado) {
        avisoMostrado = true;
        window.dispatchEvent(new CustomEvent("sesion_por_expirar"));
      } else if (inactivo < AVISO_MS && avisoMostrado) {
        avisoMostrado = false;
        window.dispatchEvent(new CustomEvent("sesion_reiniciada"));
      }
    }, 500);

    return () => {
      eventos.forEach((evento) => window.removeEventListener(evento, registrarActividad));
      clearInterval(intervalo);
    };
  }, [user]);

  // Heartbeat de presencia: mientras haya sesión, renueva "ultima_actividad" cada 15s.
  useEffect(() => {
    if (!user) return;

    const enviarLatido = async () => {
      await supabase
        .from("oficial")
        .update({ estado: true, ultima_actividad: new Date().toISOString() })
        .eq("id_oficial", user.id_oficial);
    };

    enviarLatido();
    const intervaloHeartbeat = setInterval(enviarLatido, 15000);

    return () => clearInterval(intervaloHeartbeat);
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

if (data.acceso === "PENDIENTE") {
      return { success: false, error: "CUENTA PENDIENTE - Su cuenta está a la espera de ser activada por el administrador." };
    }
    if (data.acceso === "FUERA DE SERVICIO") {
      return { success: false, error: "FUERA DE SERVICIO - Su cuenta esta inactiva temporalmente." };
    }
    if (data.acceso === "DE BAJA") {
      return { success: false, error: "DADO DE BAJA - Su cuenta esta deshabilitada." };
    }

const { error: updateError } = await supabase
      .from("oficial")
      .update({ estado: true, ultima_actividad: new Date().toISOString() })
      .eq("id_oficial", data.id_oficial);

    if (updateError) console.error("Error al actualizar estado:", updateError);

    let rolNormalizado = (data.rol || "").trim().toLowerCase();
    if (rolNormalizado === "admin" || rolNormalizado === "administrador") rolNormalizado = "admin";
    if (rolNormalizado === "operador") rolNormalizado = "operador";
    if (rolNormalizado === "despachador") rolNormalizado = "despachador";
    if (rolNormalizado === "tabulador") rolNormalizado = "tabulador";

    const ACCION_POR_ROL = {
      admin: "ADMINISTRADOR",
      operador: "OPERADOR",
      despachador: "DESPACHO",
      tabulador: "TABULACION",
    };

    const cleanUser = { ...data, rol: rolNormalizado };
    delete cleanUser.contrasena;

    setUser(cleanUser);
    sessionStorage.setItem("sistema_user", JSON.stringify(cleanUser));
    sessionStorage.setItem("session_start", Date.now().toString());
    sessionStorage.removeItem("aviso_expiracion");
    sessionStorage.removeItem("bienvenida_mostrada");

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
      console.error("Error creando token de sesion:", fnErr);
    }

    await supabase.from("log_actividad").insert({
      accion: ACCION_POR_ROL[rolNormalizado] || rolNormalizado.toUpperCase(),
      descripcion: `Ha iniciado de sesion - Escalafon ${data.numero_escalafon}`,
      id_oficial: data.id_oficial,
      fecha_hora: new Date().toISOString(),
    });

    return { success: true, rol: rolNormalizado, nombre: cleanUser.nombre_completo };
  };

  const ACCION_POR_ROL = {
    admin: "ADMINISTRADOR",
    operador: "OPERADOR",
    despachador: "DESPACHO",
    tabulador: "TABULACION",
  };

  const logout = async (motivo = "manual") => {
    if (user) {
      await supabase.from("log_actividad").insert({
        accion: ACCION_POR_ROL[user.rol] || (user.rol || "").toUpperCase(),
        descripcion: motivo === "expiracion"
          ? `Sesion expirada automaticamente - ${user.nombre_completo || user.numero_escalafon}`
          : `Ha cerrado sesion - ${user.nombre_completo || user.numero_escalafon}`,
        id_oficial: user.id_oficial,
        fecha_hora: new Date().toISOString(),
      });

await supabase
        .from("oficial")
        .update({ estado: false, ultima_actividad: null })
        .eq("id_oficial", user.id_oficial);
    }

    if (motivo === "expiracion") {
      window.dispatchEvent(new CustomEvent("sesion_expirada"));
    }

setOficialHeader(null);
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
  cargando,
  login,
  logout,
  sessionStart: sessionStorage.getItem("session_start"),
  DURACION_SESION_MS,
  userRole: user?.rol,
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

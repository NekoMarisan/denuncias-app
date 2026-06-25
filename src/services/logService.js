// src/services/logService.js
import { supabase } from "./supabase";

export const registrarLog = async (usuarioNombre, usuarioRol, accion, detalles = null) => {
  try {
    const { error } = await supabase.from("log_actividad").insert([
      {
        usuario_nombre: usuarioNombre,
        usuario_rol: usuarioRol,
        accion: accion,
        detalles: detalles ? JSON.stringify(detalles) : null,
        fecha: new Date().toISOString(),
      },
    ]);
    if (error) console.error("Error al guardar log:", error);
  } catch (err) {
    console.error("Error en registrarLog:", err);
  }
};
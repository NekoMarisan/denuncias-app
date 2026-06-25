const SUPABASE_URL = process.env.REACT_APP_SUPABASE_URL;
const ANON_KEY = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const consultaSegura = async (tabla, filtros = {}) => {
  const sessionToken = localStorage.getItem("session_token");
  if (!sessionToken) throw new Error("Sin sesión");

  const res = await fetch(`${SUPABASE_URL}/functions/v1/validar-acceso`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": ANON_KEY,
      "x-session-token": sessionToken,
    },
    body: JSON.stringify({ tabla, filtros }),
  });

  const { data, error } = await res.json();
  if (error) throw new Error(error);
  return data;
};
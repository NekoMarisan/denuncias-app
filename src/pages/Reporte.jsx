import React from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "../services/supabase";

const ICONOS = {
  oficiales:  { label: "Personal Policial",     color: "#113e27" },
  ciudadanos: { label: "Registro de Ciudadanos", color: "#113e27" },
  denuncias:  { label: "Alertas y Denuncias",    color: "#113e27" },
  alertas:    { label: "Reporte de Alertas",     color: "#113e27" },
  tabulacion: { label: "Tabulación de Caso",     color: "#113e27" },
};

const Seccion = ({ titulo }) => (
  <div className="px-4 py-1.5 mt-4" style={{ backgroundColor: "#113e27" }}>
    <p className="text-white text-[10px] font-black uppercase tracking-widest">{titulo}</p>
  </div>
);

const Campo = ({ label, valor, bold }) => (
  <div className="px-4 py-2 border-b border-slate-100">
    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
    <p className={`mt-0.5 text-sm ${bold ? "font-black text-slate-800" : "font-medium text-slate-700"}`}>{valor}</p>
  </div>
);

const Grid2 = ({ children }) => (
  <div className="grid grid-cols-2">{children}</div>
);

function ReporteTabulacion({ params }) {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const id = params.get("id");

  React.useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from("tabulacion_caso")
        .select(`
          *,
          alerta:id_alerta (
            codigo_alerta, fecha_hora, descripcion, prioridad,
            contravenciones, delitos, tipo_alerta,
            usuario_ciudadano:id_usuario (nombre_completo, ci, celular)
          ),
          patrullero:id_patrullero (nombre_completo),
          operador:id_operador_receptor (nombre_completo),
          despachador:id_despachador (nombre_completo),
          tabulador:id_tabulador (nombre_completo)
        `)
        .eq("id_tabulacion", id)
        .single();

      if (!error) setData(data);
      setLoading(false);
    };
    fetchData();
  }, [id]);

  if (loading) return <div className="p-6 text-center text-slate-400">Cargando...</div>;
  if (!data) return <div className="p-6 text-center text-slate-400">No se encontró la tabulación.</div>;

  const fmt = (v) => (v !== null && v !== undefined && String(v).trim() !== "") ? String(v) : "—";
  const fmtF = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).replace(",", "");
  };

  const alerta = data.alerta || {};
  const usuario = alerta.usuario_ciudadano || {};
  const categoria = (alerta.tipo_alerta || "").toLowerCase().includes("emergencia")
    ? "ALERTA DE EMERGENCIA" : "ALERTA CIUDADANA";

  return (
    <>
      <Seccion titulo="1. Datos de la Alerta" />
      <Campo label="Código de alerta" valor={fmt(alerta.codigo_alerta)} bold />
      <Campo label="Categoría" valor={categoria} />
      <Grid2>
        <Campo label="Fecha / Hora" valor={fmtF(alerta.fecha_hora)} />
        <Campo label="Prioridad" valor={fmt(alerta.prioridad)} />
      </Grid2>
      <Campo label="Nombre del Ciudadano" valor={fmt(usuario.nombre_completo)} />
      <Grid2>
        <Campo label="Cédula" valor={fmt(usuario.ci)} />
        <Campo label="Celular" valor={fmt(usuario.celular)} />
      </Grid2>

      <Seccion titulo="2. Clasificación del Hecho" />
      <Campo label="Clasificación original" valor={fmt(alerta.contravenciones || alerta.delitos)} />
      <Campo label="Clasificación final" valor={fmt(data.resultado_final)} bold />

      <Seccion titulo="3. Dirección y Descripción" />
      <Grid2>
        <Campo label="Área Urbana" valor={fmt(data.area_urbana)} />
        <Campo label="Área Rural" valor={fmt(data.area_rural)} />
      </Grid2>
      <Grid2>
        <Campo label="Comuna" valor={fmt(data.comuna)} />
        <Campo label="Distrito" valor={fmt(data.distrito)} />
      </Grid2>
      <Campo label="Subdistrito" valor={fmt(data.subdistrito)} />

      <Seccion titulo="4. Informe Policial" />
      <Campo label="Patrullero" valor={fmt(data.patrullero?.nombre_completo)} />

      <Seccion titulo="5. Tabulación para Secretaría" />
      <Campo label="Protagonistas del hecho" valor={fmt(data.protagonistas)} />
      <Campo label="Remisión / Derivación" valor={fmt(data.remision_caso)} />
      <Campo label="Resumen administrativo" valor={fmt(data.resumen_administrativo)} />

      <Seccion titulo="6. Cadena de Gestión" />
      <Grid2>
        <Campo label="Operador Receptor" valor={fmt(data.operador?.nombre_completo)} />
        <Campo label="Despachador" valor={fmt(data.despachador?.nombre_completo)} />
      </Grid2>
      <Grid2>
        <Campo label="Patrullero" valor={fmt(data.patrullero?.nombre_completo)} />
        <Campo label="Tabulador" valor={fmt(data.tabulador?.nombre_completo)} />
      </Grid2>
      <Campo label="Fecha de Tabulación" valor={fmtF(data.fecha_tabulacion)} bold />
    </>
  );
}

function Reporte() {
  const params  = new URLSearchParams(useLocation().search);
  const tipo    = params.get("tipo")   || "reporte";
  const fecha   = params.get("fecha")  ? new Date(params.get("fecha")).toLocaleString("es-ES") : "—";
  const total   = params.get("total")  || "0";
  const admin   = params.get("admin")  || "ADMINISTRADOR";
  const modulo  = params.get("modulo") || "Sistema";
  const extra   = params.get("extra")  || "";

  const icono = ICONOS[tipo] || { label: tipo.toUpperCase(), color: "#113e27" };
  const esTabulacion = tipo === "tabulacion";

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">

        <div className="px-6 py-5 flex items-center gap-4" style={{ backgroundColor: icono.color }}>
          <div>
            <p className="text-white font-black text-base uppercase tracking-widest">Central Radio Patrullas</p>
            <p className="text-white/70 text-xs font-bold mt-0.5 uppercase tracking-wider">{icono.label}</p>
          </div>
        </div>

        <div className="bg-green-50 border-b border-green-100 px-6 py-2 flex items-center gap-2">
          <span className="text-green-600 text-xs">✓</span>
          <p className="text-[11px] font-black text-green-700 uppercase tracking-widest">Documento verificado</p>
        </div>

        {esTabulacion ? (
          <ReporteTabulacion params={params} />
        ) : (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Módulo</p>
                <p className="font-bold text-slate-700 mt-1 text-sm">{modulo}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Tipo</p>
                <p className="font-black text-slate-800 uppercase mt-1 text-sm">{icono.label}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total registros</p>
                <p className="font-black text-2xl mt-1" style={{ color: icono.color }}>{total}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Generado por</p>
                <p className="font-bold text-slate-700 mt-1 text-sm">{admin}</p>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Fecha de generación</p>
              <p className="font-bold text-slate-700 mt-1 text-sm">{fecha}</p>
            </div>
            {extra && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Información adicional</p>
                <p className="font-bold text-slate-700 mt-1 text-sm">{decodeURIComponent(extra)}</p>
              </div>
            )}
            <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-[10px] text-slate-400 text-center">
                Central de Radio Patrullas · 110 · Documento de uso interno
              </p>
            </div>
          </div>
        )}

        {esTabulacion && (
          <div className="m-4 p-3 bg-slate-50 border border-slate-200 rounded-xl">
            <p className="text-[10px] text-slate-400 text-center">
              Central de Radio Patrullas · 110 · Documento de uso interno
            </p>
          </div>
        )}

      </div>
    </div>
  );
}

export default Reporte;
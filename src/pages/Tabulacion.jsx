import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  FaEye,
  FaClipboardList,
  FaChartLine,
  FaClock,
  FaFilePdf,
  FaChevronRight,
  FaSpinner,
  FaLock,
} from "react-icons/fa";
import FormularioTabulacion from "../components/modals/FormularioTabulacion";
import { contravenciones, delitos } from "../constants/CategoriasDelitos";
import ArchivoHistorico from "./ArchivoHistorico";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import { exportPDFTabulacion } from "../utils/exports/exportPDFTabulacion";
import { TabulacionPageSkeleton } from "../components/ui/Skeleton";

const getColorByCategoria = (categoria) => {
  if (!categoria) return "bg-gray-300";
  const upperCat = (categoria || "").toUpperCase().trim();

  const esContravencion = contravenciones.some(
    (c) => upperCat === c.toUpperCase() || upperCat.includes(c.toUpperCase()),
  );
  if (esContravencion) return "bg-orange-500";

  const esDelito = delitos.some(
    (d) => upperCat === d.toUpperCase() || upperCat.includes(d.toUpperCase()),
  );
  if (esDelito) return "bg-red-600";

  if (upperCat.includes("VIOLENCIA FAMILIAR")) return "bg-slate-400";
  if (upperCat.includes("ALERTA CIUDADANA")) return "bg-teal-500";
  if (upperCat.includes("INTENTO DE SUICIDIO")) return "bg-purple-600";

  return "bg-gray-300";
};

function Tabulacion() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [renderKey] = useState(Date.now());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [alertaSeleccionada, setAlertaSeleccionada] = useState(null);
  const [alertaVista, setAlertaVista] = useState(null);
  const [tabVistaCompleta, setTabVistaCompleta] = useState(null);
  const [verTodo, setVerTodo] = useState(false);
  const [cargando, setCargando] = useState(true);

  const [alertasPendientes, setAlertasPendientes] = useState([]);
  const [tabuladas, setTabuladas] = useState([]);

  const fechaHoy = new Date().toISOString().split("T")[0];

  useEffect(() => {
    window.__tabulacionVerTodo = verTodo;
    window.__tabulacionOnBack = () => setVerTodo(false);
    window.dispatchEvent(new Event("tabulacion_view_change"));
  }, [verTodo]);

  const cargarDatos = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCargando(true);
      try {
        // 1. Obtener alertas ya tabuladas
        const { data: tabData, error: tabErr } = await supabase
          .from("tabulacion_caso")
          .select(
            `
          id_tabulacion,
          id_alerta,
          fecha_tabulacion,
          resultado_final,
          resumen_administrativo,
          id_patrullero,
          id_despachador,
          id_operador_receptor,
          comuna,
          distrito,
          subdistrito,
          area_urbana,
          area_rural,
          protagonistas,
          remision_caso,
          alerta:id_alerta (
  id_alerta,
  codigo_alerta,
  categoria,
  contravenciones,
  delitos,
  descripcion,
  fecha_hora,
  ubicacion,
  prioridad,
  id_operador_receptor,
  bloqueado_por,
  bloqueado_rol,
  usuario_ciudadano:id_usuario (
    nombre_completo,
    ci,
    celular,
    id_estado_ciudadano
  )
),
         patrullero:patrullero!id_patrullero (
  placa,
  epi,
  oficial:oficial!fk_patrullero_oficial (
    numero_escalafon
  )
)
        `,
          )
          .order("fecha_tabulacion", { ascending: false });

        if (tabErr) console.error("Error tabuladas:", tabErr);

        const tabuladasFormateadas = (tabData || []).map((t) => ({
          ...t,
          placa: t.patrullero?.placa || "—",
          epi: t.patrullero?.epi || "—",
          numero_escalafon: t.patrullero?.oficial?.numero_escalafon || "—",
          nombre_patrullero: t.patrullero?.oficial?.nombre_completo || "—",
          id_despachador: t.id_despachador || null,
          id_operador_receptor: t.id_operador_receptor || null,
          comuna: t.comuna || "",
          distrito: t.distrito || "",
          subdistrito: t.subdistrito || "",
          area_urbana: t.area_urbana || false,
          area_rural: t.area_rural || false,
          protagonistas: t.protagonistas || "",
          remision_caso: t.remision_caso || "",
          resumen_administrativo: t.resumen_administrativo || "",
        }));

        setTabuladas(tabuladasFormateadas);

        const idsTabulados = new Set((tabData || []).map((t) => t.id_alerta));

        // 2. Obtener todas las asignaciones activas (sin filtrar por estado de alerta)
        const { data: asigData, error: asigErr } = await supabase
          .from("asignacion_patrulla")
          .select(
            `
    id_asignacion,
    id_patrullero,
    id_oficial_asignador,
    derivacion,
    derivacion_por,
    alerta:id_alerta (
  id_alerta,
  codigo_alerta,
  categoria,
  contravenciones,
  delitos,
  descripcion,
  fecha_hora,
  ubicacion,
  prioridad,
  id_estado_actual,
  id_operador_receptor,
  bloqueado_por,
  bloqueado_rol,
  usuario_ciudadano:id_usuario (
    nombre_completo,
    ci,
    celular,
    id_estado_ciudadano
  )
),
          patrullero:patrullero!id_patrullero (
            oficial:oficial!fk_patrullero_oficial (
              numero_escalafon
            )
          )
        `,
          )
          .order("id_asignacion", { ascending: false });

        console.log("asigData recibido:", asigData);

        // Obtener alertas desestimadas
        const { data: desestimadas, error: desErr } = await supabase
          .from("alerta_desestimada")
          .select("id_alerta");
        if (desErr) console.error("Error al obtener desestimadas:", desErr);
        const idsDesestimadas = new Set(
          (desestimadas || []).map((d) => d.id_alerta),
        );

        // Quedarnos solo con la asignación más reciente por alerta (asigData ya viene ordenado por id_asignacion DESC)
        const asignacionesUnicasPorAlerta = [];
        const idsAlertaVistos = new Set();
        for (const a of asigData || []) {
          if (a.alerta && !idsAlertaVistos.has(a.alerta.id_alerta)) {
            idsAlertaVistos.add(a.alerta.id_alerta);
            asignacionesUnicasPorAlerta.push(a);
          }
        }

        // Pendientes: todas las alertas con asignación que NO estén tabuladas
        const pendientes = asignacionesUnicasPorAlerta
          .filter(
            (a) =>
              a.alerta &&
              !idsTabulados.has(a.alerta.id_alerta) &&
              a.alerta.id_estado_actual === 3,
          )
          .map((a) => {
            let clasificacion = a.alerta.contravenciones || a.alerta.delitos;
            if (!clasificacion)
              clasificacion =
                a.alerta.categoria || a.alerta.descripcion || "Sin clasificar";

            const numeroEscalafon =
              a.patrullero?.oficial?.numero_escalafon || "—";
            const estaDesestimada = idsDesestimadas.has(a.alerta.id_alerta);

            return {
              id:
                a.alerta.codigo_alerta ||
                `ALT-${String(a.alerta.id_alerta).padStart(4, "0")}`,
              id_alerta: a.alerta.id_alerta,
              id_asignacion: a.id_asignacion,
              id_patrullero: a.id_patrullero,
              id_despachador: a.id_oficial_asignador,
              incidente: clasificacion,
              contravenciones: a.alerta.contravenciones,
              delitos: a.alerta.delitos,
              descripcion: a.alerta.descripcion || "",
              patrulla: numeroEscalafon,
              estado: estaDesestimada ? "DESESTIMADA" : "ATENDIDO",
              ciudadano:
                a.alerta.usuario_ciudadano?.nombre_completo ||
                "Ciudadano desconocido",
              verificado:
                Number(a.alerta.usuario_ciudadano?.id_estado_ciudadano) === 2,
              ci: a.alerta.usuario_ciudadano?.ci || "—",
              celular: a.alerta.usuario_ciudadano?.celular || "—",
              id_usuario: a.alerta.id_usuario,
              ubicacion: a.alerta.ubicacion || "",
              prioridad: a.alerta.prioridad || "—",
              fecha: a.alerta.fecha_hora?.split("T")[0] || fechaHoy,
              bloqueadoPor: a.alerta.bloqueado_por || null,
            };
          });

        setAlertasPendientes(pendientes);
      } catch (err) {
        console.error("Error crítico:", err);
      } finally {
        setCargando(false);
      }
    },
    [fechaHoy],
  );

  // Suscripción en tiempo real
  useEffect(() => {
    const subscription = supabase
      .channel("tabulacion-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerta" },
        () => cargarDatos(true),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "alerta_desestimada" },
        () => cargarDatos(true),
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tabulacion_caso" },
        () => cargarDatos(true),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [cargarDatos]);

  // Libera bloqueos abandonados (cualquier rol) al entrar y cada 3s
  useEffect(() => {
    const liberarBloqueos = async () => {
      const idOficial = user?.id_oficial;
      let q = supabase
        .from("alerta")
        .update({
          bloqueado_por: null,
          bloqueado_en: null,
          bloqueado_rol: null,
        })
        .lt("bloqueado_en", new Date(Date.now() - 8000).toISOString())
        .not("bloqueado_por", "is", null);
      if (idOficial) q = q.neq("bloqueado_por", idOficial);
      const { error } = await q;
      if (!error) cargarDatos(true);
    };
    liberarBloqueos();
    const intervalo = setInterval(liberarBloqueos, 3000);
    return () => clearInterval(intervalo);
  }, [user?.id_oficial, cargarDatos]);

  // Heartbeat: mantiene vivo el bloqueo mientras el modal está abierto
  useEffect(() => {
    if (!isModalOpen || !alertaSeleccionada?.id_alerta || !user?.id_oficial)
      return;
    const heartbeat = setInterval(async () => {
      await supabase
        .from("alerta")
        .update({ bloqueado_en: new Date().toISOString() })
        .eq("id_alerta", alertaSeleccionada.id_alerta)
        .eq("bloqueado_por", user.id_oficial);
    }, 4000);
    return () => clearInterval(heartbeat);
  }, [isModalOpen, alertaSeleccionada, user?.id_oficial]);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  // Métricas (sin cambios)
  const metricas = useMemo(() => {
    const tabuladasHoy = tabuladas.filter(
      (t) => t.fecha_tabulacion?.split("T")[0] === fechaHoy,
    ).length;
    const pendientes = alertasPendientes.length;

    const conteo = {};

    alertasPendientes.forEach((a) => {
      const key = (a.incidente || "").toUpperCase();
      conteo[key] = (conteo[key] || 0) + 1;
    });

    tabuladas.forEach((t) => {
      if (t.alerta) {
        let clasificacion = t.alerta.contravenciones || t.alerta.delitos;
        if (!clasificacion) clasificacion = t.alerta.categoria || "OTROS";
        const key = (clasificacion || "").toUpperCase();
        conteo[key] = (conteo[key] || 0) + 1;
      }
    });

    const ranking = Object.entries(conteo)
      .map(([nombre, total]) => ({
        nombre,
        total,
        color: getColorByCategoria(nombre),
      }))
      .sort((a, b) => b.total - a.total);

    return { tabuladasHoy, pendientes, ranking };
  }, [alertasPendientes, tabuladas, fechaHoy]);

  const handleTabular = useCallback(async () => {
    if (alertaSeleccionada?.id_alerta && user?.id_oficial) {
      await supabase
        .from("alerta")
        .update({
          bloqueado_por: null,
          bloqueado_en: null,
          bloqueado_rol: null,
        })
        .eq("id_alerta", alertaSeleccionada.id_alerta)
        .eq("bloqueado_por", user.id_oficial);
    }
    setIsModalOpen(false);
    await cargarDatos();
  }, [cargarDatos, alertaSeleccionada, user]);

  const abrirTabulacion = async (alerta) => {
    const idOficial = user?.id_oficial;

    const { data: alertaDb } = await supabase
      .from("alerta")
      .select(
        "bloqueado_por, oficial_bloqueador:bloqueado_por ( nombre_completo )",
      )
      .eq("id_alerta", alerta.id_alerta)
      .maybeSingle();

    if (alertaDb?.bloqueado_por && alertaDb.bloqueado_por !== idOficial) {
      const nombreOtro =
        alertaDb.oficial_bloqueador?.nombre_completo || "otro tabulador";
      showToast(
        `Esta alerta ya está siendo tabulada por ${nombreOtro}`,
        "error",
      );
      return;
    }

    const { error } = await supabase
      .from("alerta")
      .update({
        bloqueado_por: idOficial,
        bloqueado_en: new Date().toISOString(),
        bloqueado_rol: "tabulador",
      })
      .eq("id_alerta", alerta.id_alerta);

    if (error) {
      showToast("No se pudo bloquear la alerta", "error");
      return;
    }

    setAlertaSeleccionada({ ...alerta, id_tabulador: idOficial });
    setIsModalOpen(true);
  };

  const ultimasTabuladas = useMemo(() => tabuladas.slice(0, 4), [tabuladas]);

  const handleGenerarPDF = async (tab) => {
    let logoBase64 = null;
    try {
      const res = await fetch("/logo_of.png");
      const blob = await res.blob();
      logoBase64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(blob);
      });
    } catch (_) {}

    // Resolver nombres desde IDs
    const ids = [
      tab.id_operador_receptor,
      tab.id_despachador,
      tab.id_patrullero,
    ].filter(Boolean);
    let nombresMap = {};
    if (ids.length > 0) {
      const { data: oficiales } = await supabase
        .from("oficial")
        .select("id_oficial, nombre_completo")
        .in("id_oficial", ids);
      (oficiales || []).forEach((o) => {
        nombresMap[o.id_oficial] = o.nombre_completo;
      });
    }

    // Resolver nombre patrullero desde patrullero -> oficial
    let nombrePatrullero = tab.numero_escalafon || "—";
    if (tab.id_patrullero) {
      const { data: pat } = await supabase
        .from("patrullero")
        .select("id_oficial")
        .eq("id_patrullero", tab.id_patrullero)
        .maybeSingle();
      if (pat?.id_oficial) {
        const { data: of } = await supabase
          .from("oficial")
          .select("nombre_completo")
          .eq("id_oficial", pat.id_oficial)
          .maybeSingle();
        if (of) nombrePatrullero = of.nombre_completo;
      }
    }

    let reportePatrullero = "—";
    if (tab.id_patrullero && tab.id_alerta) {
      const { data: reporte } = await supabase
        .from("reporte_alerta")
        .select("descripcion_reporte")
        .eq("id_alerta", tab.id_alerta)
        .eq("id_patrullero", tab.id_patrullero)
        .order("fecha_reporte", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (reporte?.descripcion_reporte)
        reportePatrullero = reporte.descripcion_reporte;
    }

    // Resolver nombre de quien derivó el caso (NUEVO)
    let nombreDerivacion = "—";
    const { data: asigDeriv } = await supabase
      .from("asignacion_patrulla")
      .select("derivacion_por")
      .eq("id_alerta", tab.id_alerta)
      .order("fecha_asignacion", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (asigDeriv?.derivacion_por) {
      const { data: ofDerivacion } = await supabase
        .from("oficial")
        .select("nombre_completo")
        .eq("id_oficial", asigDeriv.derivacion_por)
        .maybeSingle();
      nombreDerivacion = ofDerivacion?.nombre_completo || "—";
    }

    const codigoAlerta = tab.alerta?.codigo_alerta || tab.id_alerta;
    const nombreArchivo = `reportes/tabulacion_${codigoAlerta}.pdf`;
    const nombreDescarga = `Tabulacion_${codigoAlerta}.pdf`;

    // 1. Obtener URL pública ANTES de generar
    const { data: urlData } = supabase.storage
      .from("reportes")
      .getPublicUrl(nombreArchivo);
    const urlPublica = `${urlData.publicUrl}?t=${Date.now()}`;

    // 2. Generar el PDF YA con el QR incluido (una sola vez)
    const pdfBlob = await exportPDFTabulacion({
      tab: { ...tab, reporte_patrullero: reportePatrullero },
      nombreOperador: nombresMap[tab.id_operador_receptor] || "—",
      nombreDespachador: nombresMap[tab.id_despachador] || "—",
      nombrePatrullero,
      nombreDerivacion,
      nombreTabulador: user?.nombre_completo || "—",
      logoBase64,
      filename: nombreDescarga,
      qrData: urlPublica,
    });

    // 3. Subir ese mismo PDF (una sola vez)
    const { error: uploadError } = await supabase.storage
      .from("reportes")
      .upload(nombreArchivo, pdfBlob, {
        contentType: "application/pdf",
        upsert: true,
      });

    if (uploadError) console.error("Error al subir PDF:", uploadError);

    // 4. Descargar (una sola vez)
    const url = URL.createObjectURL(pdfBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreDescarga;
    a.click();
    URL.revokeObjectURL(url);
  };

  const historicoAlertas = useMemo(() => {
    return tabuladas.map((t) => ({
      id_alerta: t.id_alerta,
      id:
        t.alerta?.codigo_alerta ||
        `ALT-${String(t.id_alerta).padStart(4, "0")}`,
      ciudadano: t.alerta?.usuario_ciudadano?.nombre_completo || "Anónimo",
      fecha: t.fecha_tabulacion?.split("T")[0] || "—",
      incidente:
        t.resultado_final ||
        t.alerta?.contravenciones ||
        t.alerta?.delitos ||
        "Sin clasificar",
      estado: "TABULADO",
      motivoDesestimacion: null,
      patrullero: t.numero_escalafon || "—",
      remision_caso: t.remision_caso || "—",
    }));
  }, [tabuladas]);

  useEffect(() => {
    document.title = "Sistema Policial 110";
  }, []);

  // Bloquea el scroll de la página mientras esta vista está activa
  useEffect(() => {
    const bodyOverflowOriginal = document.body.style.overflow;
    const htmlOverflowOriginal = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = bodyOverflowOriginal;
      document.documentElement.style.overflow = htmlOverflowOriginal;
    };
  }, []);

  if (verTodo) {
    return (
      <ArchivoHistorico
        alertasTabuladas={historicoAlertas}
        tabuladasCompletas={tabuladas}
        onGenerarPDFTabulada={handleGenerarPDF}
        onBack={() => setVerTodo(false)}
      />
    );
  }

  return (
    <div
      key={renderKey}
      className="-mt-1 h-full overflow-y-auto scroll-hover font-sans pr-0.5"
    >
      <div className="space-y-6 animate-fadeIn p-1">
        {cargando ? (
          <TabulacionPageSkeleton />
        ) : (
          <>
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="lg:w-4/5 flex flex-col gap-6">
                <div className="relative w-full bg-white px-4 md:px-7 py-4 md:py-6 rounded-2xl shadow-md flex flex-col h-[729px]">
                  <h2 className="text-[18px] font-bold uppercase text-[#1e293b] mb-4 md:mb-6 tracking-wider flex-shrink-0">
                    Tabulación de Alertas
                  </h2>

                  <div className="overflow-auto flex-1 min-h-0 -mx-4 md:mx-0 px-4 md:px-0 scroll-hover pr-1.5">
                    <table className="min-w-full border-collapse text-left">
                    <thead>
                      <tr className="text-slate-400 text-[11px] font-medium uppercase tracking-widest">
                        <th className="sticky top-0 z-10 bg-white pl-3 border-b border-slate-200 md:pl-4 pr-1 md:pr-2 py-2 w-[10%]">
                          ID
                        </th>
                        <th className="sticky top-0 z-10 bg-white py-2 border-b border-slate-200 w-[17%]">
                          Ciudadano
                        </th>
                        <th className="sticky top-0 z-10 bg-white pl-0 pr-1 border-b border-slate-200 w-[16%] py-2 text-left">
                          Incidente
                        </th>
                        <th className="sticky top-0 z-10 bg-white py-2 border-b border-slate-200 w-[9%]">
                          Patrulla
                        </th>
                        <th className="sticky top-0 z-10 bg-white py-2 border-b border-slate-200 w-[10%]">
                          Estado
                        </th>
                        <th className="sticky top-0 z-10 bg-white px-3 border-b border-slate-200 py-2 w-[4%]">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                      <tbody>
                        {alertasPendientes.length === 0 ? (
                          <tr>
                            <td
                              colSpan="6"
                              className="text-center py-12 text-gray-400 font-medium"
                            >
                              No hay alertas pendientes de tabulación
                            </td>
                          </tr>
                        ) : (
                          alertasPendientes.map((alerta) => {
                            const bloqueadaPorOtro =
                              alerta.bloqueadoPor &&
                              alerta.bloqueadoPor !== user?.id_oficial;
                            return (
                              <tr
                                key={alerta.id_asignacion}
                                className={`bg-white group transition-all duration-200 border-b border-gray-100 ${
                                  bloqueadaPorOtro
                                    ? "opacity-50"
                                    : "hover:shadow-lg hover:-translate-y-0.5"
                                }`}
                              >
                                <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-6 md:py-7 text-[11px] font-medium text-slate-500/90 uppercase tracking-wider align-middle border-b border-slate-200/60">
                                  {alerta.id}
                                </td>
                                <td className="py-5 md:py-6 align-middle border-b border-slate-200/60">
                                  <div className="flex items-center gap-2 md:gap-3">
                                    <div className="w-6 h-8 rounded-md flex items-center justify-center font-black text-xs shadow-inner shrink-0 bg-blue-50 text-[#270cb2]">
                                      {alerta.ciudadano.charAt(0)}
                                    </div>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-[12.5px] font-medium text-[#1e293b] truncate max-w-[110px] md:max-w-none">
                                        {alerta.ciudadano}
                                      </span>
                                      <span className="mt-0.5 text-[8.5px] font-medium uppercase tracking-wider text-slate-400">
                                        {alerta.verificado ? "Verificado" : "No verificado"}
                                      </span>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-5 md:py-6 align-middle border-b border-slate-200/60">
                                  <div className="pl-0 pr-1 md:pr-2">
                                    <span className="truncate block max-w-[110px] md:max-w-none text-[11.5px] font-medium text-slate-700 tracking-wider uppercase">
                                      {alerta.incidente}
                                    </span>
                                  </div>
                                </td>
                                <td className="py-5 md:py-6 align-middle text-left border-b border-slate-200/60">
                                  <span className="font-medium text-[11px] tracking-wider text-slate-500 uppercase">
                                    {alerta.patrulla}
                                  </span>
                                </td>
                                <td className="py-5 md:py-6 align-middle border-b border-slate-200/60">
                                  <span
                                    className={`inline-flex items-center justify-center gap-1.5 w-16 md:w-24 py-1.5 px-2 rounded-md text-[11px] font-medium tracking-wider text-white ${
                                      alerta.estado === "DESESTIMADA"
                                        ? "bg-gray-500"
                                        : "bg-[#087924]"
                                    }`}
                                  >
                                    {alerta.estado}
                                  </span>
                                </td>
                                <td className="px-3 md:px-4 py-5 md:py-6 align-middle border-b border-slate-200/60">
                                  {bloqueadaPorOtro ? (
                                    <button
                                      onClick={() => {
                                        showToast(
                                          `Esta alerta ya está siendo gestionada por otro tabulador`,
                                          "error",
                                        );
                                      }}
                                      className="p-1.5 md:p-2 bg-slate-100 text-slate-400 rounded-lg flex items-center justify-center hover:bg-green-50 hover:text-[#474b29] transition-all duration-200"
                                    >
                                      <FaLock size={13} />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={() => abrirTabulacion(alerta)}
                                      className="p-2 md:p-2.5 bg-slate-100 text-slate-500 rounded-lg hover:bg-[#474b29] hover:text-white transition-all duration-200 flex items-center justify-center"
                                    >
                                      <FaClipboardList size={14} />
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="lg:w-1/5 bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col h-[729px]
                              relative w-full px-4 md:px-7 py-4 md:py-6">
                <div className="mb-3">
                  <h2 className="text-[18px] font-bold uppercase text-[#1e293b] mb-4 md:mb-6 tracking-wider flex-shrink-0">
                    Alertas Comunes
                  </h2>
                </div>
                {metricas.ranking.length === 0 ? (
                  <p className="text-[11px] text-slate-300 font-medium tracking-wider uppercase text-center mt-6">
                    Sin datos aún
                  </p>
                ) : (
                  <div className="space-y-4 -mt-2">
                    {metricas.ranking.slice(0, 10).map((item, idx) => {
                      const coloresVivos = [
                        "bg-slate-400",
                      ];
                      const colorClass =
                        coloresVivos[idx % coloresVivos.length];
                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 h-12 bg-slate-50/50 rounded-lg border border-transparent hover:border-slate-100 transition-all "
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div
                              className={`w-1 h-1 rounded-full ${colorClass} shrink-0 shadow-sm`}
                            />
                            <span className="text-[11px] font-medium tracking-wider text-slate-600 uppercase leading-tight break-words">
                              {item.nombre}
                            </span>
                          </div>
                          <span className="text-[12.5px] font-bold text-slate-500 ml-2 shrink-0 tracking-wider">
                            {item.total}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="w-full bg-white px-4 md:px-7 py-4 md:py-6 rounded-2xl shadow-md border border-gray-50 relative flex flex-col">
              <button
                onClick={() => setVerTodo(true)}
                className="absolute top-4 md:top-6 right-4 md:right-7 font-bold flex items-center gap-1.5 uppercase text-slate-400 hover:text-slate-500 text-[10px] tracking-wider transition-colors mt-1.5"
              >
                {" "}
                Ver todo <FaChevronRight size={8} />
              </button>
              <h2 className="text-[18px] font-bold uppercase text-[#1e293b] mb-4 md:mb-6 tracking-wider flex-shrink-0">
                Alertas Tabuladas
              </h2>
              <div className="mt-3">
              {ultimasTabuladas.length === 0 ? (
                <div className="flex h-40 flex-col items-center justify-center py-10 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                  <div className="w-10 bg-white rounded-xl flex items-center justify-center text-slate-200 shadow-sm mb-2">
                    <FaClipboardList size={20} />
                  </div>
                  <h3 className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">
                    Sin alertas tabuladas
                  </h3>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fadeIn pb-0">
                  {ultimasTabuladas.map((tab) => {
                    const ciudadano =
                      tab.alerta?.usuario_ciudadano?.nombre_completo ||
                      "Ciudadano";
                    const codigo =
                      tab.alerta?.codigo_alerta ||
                      `ALT-${String(tab.id_alerta).padStart(4, "0")}`;
                    let clasificacion =
                      tab.resultado_final ||
                      tab.alerta?.contravenciones ||
                      tab.alerta?.delitos ||
                      "Sin clasificar";
                    const fecha = tab.fecha_tabulacion?.split("T")[0] || "—";
                    return (
                      <div
                        key={tab.id_tabulacion}
                        onClick={() => {
                          setAlertaVista({
                            id_alerta: tab.id_alerta,
                            codigo_alerta: tab.alerta?.codigo_alerta,
                            ciudadano: ciudadano,
                            ci: tab.alerta?.usuario_ciudadano?.ci,
                            celular: tab.alerta?.usuario_ciudadano?.celular,
                            incidente: clasificacion,
                            descripcion: tab.alerta?.descripcion,
                            ubicacion: tab.alerta?.ubicacion,
                            prioridad: tab.alerta?.prioridad,
                            contravenciones: tab.alerta?.contravenciones,
                            delitos: tab.alerta?.delitos,
                            resultado_final: tab.resultado_final,
                            id_patrullero: tab.id_patrullero,
                            id_despachador: tab.id_despachador,
                            id_operador_receptor: tab.id_operador_receptor,
                            placa: tab.placa,
                            epi: tab.epi,
                            numero_escalafon: tab.numero_escalafon,
                            comuna: tab.comuna,
                            distrito: tab.distrito,
                            subdistrito: tab.subdistrito,
                            area_urbana: tab.area_urbana,
                            area_rural: tab.area_rural,
                            protagonistas: tab.protagonistas,
                            remision_caso: tab.remision_caso,
                            resumen_administrativo: tab.resumen_administrativo,
                          });
                          setTabVistaCompleta(tab);
                          setIsViewModalOpen(true);
                        }}
                        className="h-[14.5svh] mb-1 bg-white rounded-xl p-3 border border-slate-200 relative transition-all duration-200 hover:scale-[1.01] shadow-sm hover:shadow-md group overflow-hidden cursor-pointer"
                      >
                        <div className="absolute left-0 top-0 bottom-0 w-2 bg-[#474b29] rounded-l-2xl" />
                        <div className="flex justify-between items-center mb-3 pl-3">
                          <span className="text-[10px] font-medium text-slate-500/80 uppercase tracking-widest">
                            {codigo}
                          </span>
                          <span className="bg-slate-200/60 tracking-wider text-[#474b29] px-2 py-0.5 rounded-md text-[9px] font-medium uppercase border border-green-100">
                            Archivado
                          </span>
                        </div>
                        <div className="flex items-center gap-3 mb-3 pl-3">
                          <div className="w-6 h-8 rounded-md bg-blue-50 text-[#270cb2] flex items-center justify-center font-black text-[12px] border border-gray-50 group-hover:text-[#270cb2] group-hover:bg-blue-50 transition-colors shrink-0 shadow-inner mt-0.5">
                            {ciudadano.charAt(0)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <h3 className="text-[12px] font-medium text-slate-600 leading-tight mb-0.5 truncate block max-w-[200px] tracking-wider">
                              {ciudadano}
                            </h3>
                            <p className="text-[10px] font-medium text-slate-400 mt-0.5 tracking-wider">
                              {fecha}
                            </p>
                          </div>
                        </div>
                        <div className="mb-5 p-1.5 bg-[#474b29]/5 border-[#474b29]/20 rounded-lg border border-slate-100 ml-3 mt-4">
                          <p className="text-[9px] font-medium text-slate-400 uppercase tracking-wider mb-0.5">
                            Clasificación
                          </p>
                          <p className="text-[10px] font-medium tracking-wider text-slate-500 uppercase leading-relaxed">
                            {clasificacion}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              </div>
            </div>
          </>
        )}

        <FormularioTabulacion
          isOpen={isModalOpen}
          onClose={async () => {
            if (alertaSeleccionada?.id_alerta && user?.id_oficial) {
              await supabase
                .from("alerta")
                .update({
                  bloqueado_por: null,
                  bloqueado_en: null,
                  bloqueado_rol: null,
                })
                .eq("id_alerta", alertaSeleccionada.id_alerta)
                .eq("bloqueado_por", user.id_oficial);
            }
            setIsModalOpen(false);
          }}
          alerta={alertaSeleccionada}
          onConfirm={handleTabular}
          readOnly={false}
        />

        <FormularioTabulacion
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          alerta={alertaVista}
          readOnly={true}
          onConfirm={() => {}}
          clasificacionTabulador={alertaVista?.resultado_final}
          onGenerarPDF={() => handleGenerarPDF(tabVistaCompleta)}
        />
      </div>
    </div>
  );
}

export default Tabulacion;

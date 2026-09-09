import React, { useEffect } from "react";

let shimmerStyleInjected = false;
const useShimmerKeyframes = () => {
  useEffect(() => {
    if (shimmerStyleInjected) return;
    shimmerStyleInjected = true;
    const styleEl = document.createElement("style");
    styleEl.setAttribute("data-shimmer-keyframes", "true");
    styleEl.textContent = `
      @keyframes skeletonShimmer {
        100% { transform: translateX(100%); }
      }
    `;
    document.head.appendChild(styleEl);
  }, []);
};

const Shimmer = ({ className = "" }) => {
  useShimmerKeyframes();
  return (
    <div className={`relative overflow-hidden bg-slate-200 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[skeletonShimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
    </div>
  );
};

// Piezas básicas reutilizables
export const SkeletonLine = ({ width = "w-full", height = "h-2.5" }) => (
  <Shimmer className={`${height} ${width} rounded`} />
);

export const SkeletonCircle = ({ size = "w-7 h-8" }) => (
  <Shimmer className={`${size} rounded-md shrink-0`} />
);

export const SkeletonBlock = ({ height = "h-6", className = "" }) => (
  <Shimmer className={`${height} rounded-lg ${className}`} />
);

// Skeleton compuesto: imita AlertaCard.jsx exactamente
export const AlertaCardSkeleton = () => (
  <div className="p-2.5 rounded-xl border border-slate-100 bg-white">
    <div className="flex items-start justify-between gap-2 mb-1">
      <div className="flex items-center gap-2 flex-1 min-w-0">
        <SkeletonCircle />
        <div className="min-w-0 flex-1 space-y-1.5">
          <SkeletonLine width="w-3/4" />
          <SkeletonLine width="w-1/2" />
        </div>
      </div>
      <SkeletonLine width="w-16" height="h-4" />
    </div>
    <SkeletonBlock height="h-6" className="mt-2" />
  </div>
);

// Skeleton compuesto: imita un statCard del Dashboard
export const StatCardSkeleton = () => (
  <div className="bg-white p-3 rounded-xl shadow-md h-[92px]">
    <SkeletonLine width="w-24" height="h-3" />
    <div className="mt-3">
      <SkeletonLine width="w-10" height="h-6" />
    </div>
    <div className="mt-3">
      <SkeletonLine width="w-16" height="h-2" />
    </div>
  </div>
);

// Skeleton compuesto: panel grande (gráfica, resumen, etc.)
export const PanelSkeleton = ({ heightClass = "h-[320px]" }) => (
  <div className={`bg-white rounded-2xl shadow-md p-6 ${heightClass}`}>
    <SkeletonLine width="w-32" height="h-4" />
    <div className="mt-6">
      <SkeletonBlock height="h-[220px]" />
    </div>
  </div>
);

// Skeleton compuesto: imita una tarjeta de patrullero en GestionPatrullas.jsx
export const PatrulleroCardSkeleton = () => (
  <div className="h-32 p-3 rounded-lg border border-slate-200 bg-slate-50/50">
    <div className="flex justify-between items-start mt-1">
      <SkeletonLine width="w-12" height="h-2.5" />
      <div className="w-2 h-2 rounded-full bg-slate-200 animate-pulse" />
    </div>
    <div className="mt-4">
      <SkeletonLine width="w-20" height="h-2.5" />
    </div>
    <div className="mt-1.5">
      <SkeletonLine width="w-14" height="h-2" />
    </div>
    <div className="mt-2">
      <SkeletonBlock height="h-6" />
    </div>
  </div>
);

// Skeleton para el panel "Seguimiento de Intervención" en GestionPatrullas.jsx —
// replica las 2 columnas (patrullas asignadas + reporte + derivación, y
// evidencias) para que el tamaño coincida con el contenido real y no "salte".
export const SeguimientoIntervencionSkeleton = () => (
  <div className="flex-1 min-h-0 overflow-hidden pr-1">
    <div className="flex flex-col lg:flex-row items-stretch gap-4 w-full min-w-0 h-full">
      {/* COLUMNA IZQUIERDA */}
      <div className="flex-1 min-w-0 flex flex-col gap-3">
        <div>
          <SkeletonLine width="w-36" height="h-[11px]" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <SkeletonLine width="w-12" height="h-2.5" />
                  <div className="w-2 h-2 rounded-full bg-slate-200 animate-pulse" />
                </div>
                <SkeletonLine width="w-14" height="h-2" />
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-slate-200 my-4 mt-3"></div>

        <div className="-mt-2">
          <SkeletonLine width="w-40" height="h-[11px]" />
          <div className="mt-2">
            <SkeletonBlock height="h-[100px]" className="rounded-xl" />
          </div>
        </div>

        <div className="space-y-2 mt-1">
          <SkeletonLine width="w-24" height="h-[11px]" />
          <SkeletonBlock height="h-11" className="rounded-xl" />
          <SkeletonBlock height="h-11" className="mt-5 rounded-lg" />
        </div>
      </div>

      <div className="hidden lg:block mx-4 border-l border-slate-100 shrink-0"></div>

      {/* COLUMNA DERECHA (evidencias) */}
      <div className="w-full lg:w-64 shrink-0 flex flex-col min-w-0">
        <div className="mb-2">
          <SkeletonLine width="w-20" height="h-[11px]" />
        </div>
        <div className="flex-1 min-h-[240px] grid grid-rows-3 gap-2">
          {[0, 1, 2].map((i) => (
            <SkeletonBlock key={i} height="h-full" className="rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Skeleton compuesto: imita una fila de la tabla en GestionAlertas.jsx
export const FilaAlertaSkeleton = () => (
  <tr className="bg-white">
    <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-8 md:py-9 align-middle border-b border-slate-200/60">
      <SkeletonLine width="w-14" height="h-2.5" />
    </td>
    <td className="py-8 md:py-9 align-middle border-b border-slate-200/60">
      <div className="flex items-center gap-2 md:gap-3">
        <SkeletonCircle size="w-6 h-8 rounded-md" />
        <div className="flex flex-col gap-2">
          <SkeletonLine width="w-28" height="h-2.5" />
          <SkeletonLine width="w-16" height="h-2" />
        </div>
      </div>
    </td>
    <td className="py-8 md:py-9 align-middle hidden sm:table-cell border-b border-slate-200/60">
      <SkeletonLine width="w-10" height="h-2.5" />
    </td>
    <td className="py-8 md:py-9 align-middle border-b border-slate-200/60">
      <SkeletonLine width="w-20" height="h-2.5" />
    </td>
    <td className="py-8 md:py-9 align-middle border-b border-slate-200/60">
      <SkeletonBlock height="h-6" className="w-16 md:w-24 rounded-md" />
    </td>
    <td className="px-3 md:px-4 py-8 md:py-9 align-middle text-left border-b border-slate-200/60">
      <SkeletonCircle size="w-8 h-8 rounded-lg" />
    </td>
  </tr>
);
// Skeleton compuesto: imita la tabla completa de GestionAlertas.jsx (encabezado de tabs + tabla con N filas)
export const TablaAlertasSkeleton = ({ filas = 5 }) => (
  <div className="w-full h-full flex flex-col bg-gray-50/30 overflow-hidden p-1">
    {/* Tabs */}
    <div className="w-full bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 -mt-1.5">
      <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200 shrink-0 gap-2">
        <SkeletonBlock height="h-9" className="w-40 rounded-lg" />
        <SkeletonBlock height="h-9" className="w-40 rounded-lg" />
      </div>
      <SkeletonBlock height="h-[38px]" className="w-40 rounded-xl" />
    </div>

    {/* Tabla */}
    <div className="relative top-1 w-full bg-white px-4 md:px-7 py-4 md:py-6 rounded-2xl shadow-md flex flex-col flex-1 min-h-0 max-h-[76svh] mt-6">
      <SkeletonLine width="w-52" height="h-[18px]" />
      <div className="mt-4 md:mt-6 overflow-auto flex-1 min-h-0 -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-full border-collapse table-fixed">
          <thead>
            <tr className="text-slate-400 text-[11px] font-medium uppercase tracking-widest">
              <th className="pl-3 md:pl-4 pr-1 md:pr-2 pb-2 pt-1 w-[14%]" />
              <th className="pb-2 pt-1 w-[28%]" />
              <th className="pb-2 pt-1 w-[13%] hidden sm:table-cell" />
              <th className="pb-2 pt-1 w-[12%]" />
              <th className="pb-2 pt-1 w-[12%]" />
              <th className="px-3 pb-2 pt-1 w-[8%]" />
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: filas }).map((_, i) => (
              <FilaAlertaSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);

// OPCIÓN A — simplificado, carga liviana
export const ModalSimpleSkeleton = () => (
  <div className="px-5 sm:px-6 py-8 flex flex-col items-center justify-center gap-4 min-h-[400px]">
    <SkeletonCircle size="w-14 h-14 rounded-full" />
    <SkeletonLine width="w-48" height="h-3" />
    <SkeletonLine width="w-64" height="h-2.5" />
    <div className="w-full max-w-md space-y-3 mt-4">
      <SkeletonBlock height="h-12" className="rounded-xl" />
      <SkeletonBlock height="h-12" className="rounded-xl" />
      <SkeletonBlock height="h-20" className="rounded-xl" />
    </div>
  </div>
);

// OPCIÓN B — overlay con spinner de marca
export const ModalLoaderOverlay = ({ texto = "Cargando información..." }) => (
  <div className="flex flex-col items-center justify-center gap-3 min-h-[400px]">
    <div className="w-10 h-10 border-4 border-slate-200 border-t-[#474b29] rounded-full animate-spin" />
    <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
      {texto}
    </p>
  </div>
);

// OPCIÓN C — skeleton estructural completo (ya armado antes)
export const DetalleAlertaSkeleton = () => (
  <div className="px-5 sm:px-6 py-5">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 items-start">
      <div className="flex flex-col gap-5">
        <div>
          <SkeletonLine width="w-40" height="h-2.5" />
          <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-3.5 py-3.5 mt-2">
            <SkeletonCircle size="w-11 h-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonLine width="w-1/2" />
              <div className="flex gap-3">
                <SkeletonLine width="w-16" height="h-2" />
                <SkeletonLine width="w-16" height="h-2" />
              </div>
            </div>
          </div>
        </div>
        <div>
          <SkeletonLine width="w-32" height="h-2.5" />
          <div className="border border-slate-200 rounded-xl px-3.5 py-3 flex items-center gap-3 mt-2">
            <SkeletonCircle size="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock height="h-1" />
              <div className="flex justify-between">
                <SkeletonLine width="w-8" height="h-2" />
                <SkeletonLine width="w-8" height="h-2" />
              </div>
            </div>
          </div>
        </div>
        <div>
          <SkeletonLine width="w-36" height="h-2.5" />
          <div className="border border-slate-200 rounded-xl px-3.5 py-3 mt-2">
            <SkeletonBlock height="h-[50px]" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5 md:border-l md:border-slate-100 md:pl-8">
        <div>
          <SkeletonLine width="w-28" height="h-2.5" />
          <SkeletonBlock height="h-9" className="w-1/3 mt-2 rounded-lg" />
        </div>
        <div>
          <SkeletonLine width="w-40" height="h-2.5" />
          <div className="flex flex-col gap-3 mt-2">
            <SkeletonBlock height="h-11" className="rounded-xl" />
            <SkeletonBlock height="h-11" className="rounded-xl" />
          </div>
        </div>
        <div>
          <SkeletonLine width="w-32" height="h-2.5" />
          <SkeletonBlock height="h-10" className="mt-2 rounded-xl" />
        </div>
      </div>
    </div>
    <div className="mt-5">
      <SkeletonLine width="w-36" height="h-2.5" />
      <div className="grid grid-cols-5 gap-3 mt-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <SkeletonBlock key={i} height="h-24" className="rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

// Skeleton específico para DetalleEmergencia.jsx — mismo grid de 2 columnas
// que DetalleAlertaSkeleton, pero SIN la sección de evidencia (ese modal no
// la tiene), para que el tamaño coincida exacto con el contenido real y no
// "salte" al terminar de cargar.
export const DetalleEmergenciaSkeleton = () => (
  <div className="px-5 sm:px-6 py-5">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5 items-start">
      <div className="flex flex-col gap-5">
        <div>
          <SkeletonLine width="w-40" height="h-2.5" />
          <div className="flex items-center gap-3 border border-slate-200 rounded-xl px-3.5 py-3.5 mt-2">
            <SkeletonCircle size="w-11 h-11 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonLine width="w-1/2" />
              <div className="flex gap-3">
                <SkeletonLine width="w-16" height="h-2" />
                <SkeletonLine width="w-16" height="h-2" />
              </div>
            </div>
          </div>
        </div>
        <div>
          <SkeletonLine width="w-32" height="h-2.5" />
          <div className="border border-slate-200 rounded-xl px-3.5 py-3 flex items-center gap-3 mt-2">
            <SkeletonCircle size="w-10 h-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock height="h-1" />
              <div className="flex justify-between">
                <SkeletonLine width="w-8" height="h-2" />
                <SkeletonLine width="w-8" height="h-2" />
              </div>
            </div>
          </div>
        </div>
        <div>
          <SkeletonLine width="w-36" height="h-2.5" />
          <div className="border border-slate-200 rounded-xl px-3.5 py-3 mt-2">
            <SkeletonBlock height="h-[50px]" />
          </div>
        </div>
      </div>
      <div className="flex flex-col gap-5 md:border-l md:border-slate-100 md:pl-8">
        <div>
          <SkeletonLine width="w-28" height="h-2.5" />
          <SkeletonBlock height="h-9" className="w-1/3 mt-2 rounded-lg" />
        </div>
        <div>
          <SkeletonLine width="w-40" height="h-2.5" />
          <div className="flex flex-col gap-3 mt-2">
            <SkeletonBlock height="h-11" className="rounded-xl" />
            <SkeletonBlock height="h-11" className="rounded-xl" />
          </div>
        </div>
        <div>
          <SkeletonLine width="w-32" height="h-2.5" />
          <SkeletonBlock height="h-10" className="mt-2 rounded-xl" />
        </div>
      </div>
    </div>
  </div>
);

// OPCIÓN D — tres barras verticales tipo ecualizador + texto "Cargando..."
export const ModalBarrasSkeleton = ({ texto = "Cargando..." }) => (
  <div className="flex flex-col items-center justify-center gap-4 min-h-[400px]">
    <div className="flex items-end gap-2 h-12">
      <div className="w-3 bg-slate-300 rounded-full animate-pulse" style={{ height: "60%", animationDelay: "0ms" }} />
      <div className="w-3 bg-slate-300 rounded-full animate-pulse" style={{ height: "100%", animationDelay: "150ms" }} />
      <div className="w-3 bg-slate-300 rounded-full animate-pulse" style={{ height: "40%", animationDelay: "300ms" }} />
    </div>
    <p className="text-[12px] font-semibold text-slate-400 uppercase tracking-wider">
      {texto}
    </p>
  </div>
);
const formularioCardStyle =
  "bg-white p-4 rounded-2xl border border-slate-200 shadow-[0_10px_10px_-8px_rgba(15,23,42,0.25)] flex flex-col h-full";

const FormularioHeaderSkeleton = ({ width }) => (
  <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-2 shrink-0">
    <SkeletonLine width={width} height="h-[15px]" />
  </div>
);

const HistoryCardSkeleton = () => (
  <div className="flex-1 flex flex-col items-center min-w-[88px]">
    <SkeletonCircle size="w-10 h-10 rounded-lg" />
    <div className="mt-2">
      <SkeletonLine width="w-16" height="h-[9px]" />
    </div>
    <div className="mt-1 flex flex-col items-center gap-1">
      <SkeletonLine width="w-14" height="h-[10px]" />
      <SkeletonLine width="w-12" height="h-[10px]" />
    </div>
  </div>
);

export const FormularioTabulacionSkeleton = () => (
  <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-6 gap-y-3.5 rounded-md">
      {/* DATOS DE LA ALERTA */}
      <section className={formularioCardStyle}>
        <FormularioHeaderSkeleton width="w-40" />
        <div className="grid grid-cols-2 gap-5 content-start flex-1">
          <div className="col-span-2 space-y-1">
            <SkeletonLine width="w-40" height="h-[11px]" />
            <SkeletonBlock height="h-9" className="rounded-xl" />
          </div>
          <div className="col-span-2 grid grid-cols-3 gap-5">
            <div className="space-y-1">
              <SkeletonLine width="w-14" height="h-[11px]" />
              <SkeletonBlock height="h-9" className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <SkeletonLine width="w-14" height="h-[11px]" />
              <SkeletonBlock height="h-9" className="rounded-xl" />
            </div>
            <div className="space-y-1">
              <SkeletonLine width="w-16" height="h-[11px]" />
              <SkeletonBlock height="h-9" className="rounded-xl" />
            </div>
          </div>
          <div className="col-span-2 space-y-1">
            <SkeletonLine width="w-44" height="h-[11px]" />
            <SkeletonBlock height="h-9" className="rounded-xl" />
          </div>
          <div className="col-span-2 space-y-2">
            <SkeletonLine width="w-28" height="h-[11px]" />
            <SkeletonBlock height="h-[58px]" className="rounded-xl" />
          </div>
        </div>
      </section>

      {/* DIRECCIÓN Y DESCRIPCIÓN */}
      <section className={formularioCardStyle}>
        <FormularioHeaderSkeleton width="w-52" />
        <div className="grid grid-cols-2 gap-5 content-start flex-1">
          {["w-20", "w-20", "w-16", "w-16"].map((w, i) => (
            <div key={i} className="space-y-1">
              <SkeletonLine width={w} height="h-[11px]" />
              <SkeletonBlock height="h-9" className="rounded-xl" />
            </div>
          ))}
          <div className="col-span-2 space-y-1">
            <SkeletonLine width="w-24" height="h-[11px]" />
            <SkeletonBlock height="h-9" className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <SkeletonLine width="w-14" height="h-[11px]" />
            <SkeletonBlock height="h-9" className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <SkeletonLine width="w-16" height="h-[11px]" />
            <SkeletonBlock height="h-9" className="rounded-xl" />
          </div>
        </div>
      </section>

      {/* CLASIFICACIÓN DEL HECHO */}
      <section className={formularioCardStyle}>
        <FormularioHeaderSkeleton width="w-48" />
        <div className="space-y-5 flex-1 justify-start flex flex-col">
          <div className="space-y-1">
            <SkeletonLine width="w-36" height="h-[11px]" />
            <SkeletonBlock height="h-11" className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <SkeletonLine width="w-20" height="h-[11px]" />
            <SkeletonBlock height="h-11" className="rounded-xl" />
          </div>
          <div className="h-16 p-2 rounded-xl bg-slate-50 flex flex-col items-center justify-center gap-2">
            <SkeletonLine width="w-32" height="h-[11px]" />
            <SkeletonLine width="w-24" height="h-[11px]" />
          </div>
        </div>
      </section>

      {/* INFORME POLICIAL */}
      <section className={formularioCardStyle}>
        <FormularioHeaderSkeleton width="w-32" />
        <div className="grid grid-cols-2 gap-5 content-start flex-1">
          <div className="space-y-1">
            <SkeletonLine width="w-16" height="h-[11px]" />
            <SkeletonBlock height="h-9" className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <SkeletonLine width="w-12" height="h-[11px]" />
            <SkeletonBlock height="h-9" className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <SkeletonLine width="w-10" height="h-[11px]" />
            <SkeletonBlock height="h-9" className="rounded-xl" />
          </div>
          <div className="col-span-2 space-y-2">
            <SkeletonLine width="w-36" height="h-[11px]" />
            <SkeletonBlock height="h-[66px]" className="rounded-xl" />
          </div>
        </div>
      </section>
    </div>

    {/* TABULACIÓN PARA SECRETARÍA */}
    {/* TABULACIÓN PARA SECRETARÍA */}
    <section className={`${formularioCardStyle} mt-3.5`}>
      <FormularioHeaderSkeleton width="w-56" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-5">
          <div className="space-y-1">
            <SkeletonLine width="w-24" height="h-[11px]" />
            <SkeletonBlock height="h-9" className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <SkeletonLine width="w-52" height="h-[11px]" />
            <SkeletonBlock height="h-9" className="rounded-xl" />
          </div>
        </div>
        <div className="flex flex-col space-y-1">
          <SkeletonLine width="w-40" height="h-[11px]" />
          <SkeletonBlock height="h-[112px]" className="rounded-lg" />
        </div>
      </div>
    </section>

    {/* HISTORIAL DE PROCESO */}
    <section className={`${formularioCardStyle} mt-3.5`}>
      <FormularioHeaderSkeleton width="w-44" />
      <div className="flex items-start justify-center pt-2">
        {[0, 1, 2, 3, 4].map((i) => (
          <React.Fragment key={i}>
            <HistoryCardSkeleton />
            {i < 4 && (
              <div className="flex-1 h-0.5 bg-slate-200 mt-6 max-w-[64px]" />
            )}
          </React.Fragment>
        ))}
      </div>
    </section>
  </>
);
export const FormularioDesestimadosSkeleton = () => (
  <>
    {/* DATOS DE LA ALERTA */}
    <section className={formularioCardStyle}>
      <FormularioHeaderSkeleton width="w-44" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <SkeletonLine width="w-44" height="h-[11px]" />
          <SkeletonBlock height="h-9" className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <SkeletonLine width="w-16" height="h-[11px]" />
          <SkeletonBlock height="h-9" className="rounded-xl" />
        </div>
        <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {["w-16", "w-16", "w-16"].map((w, i) => (
            <div key={i} className="space-y-1">
              <SkeletonLine width={w} height="h-[11px]" />
              <SkeletonBlock height="h-9" className="rounded-xl" />
            </div>
          ))}
        </div>
        <div className="md:col-span-2 space-y-1">
          <SkeletonLine width="w-32" height="h-[11px]" />
          <SkeletonBlock height="h-[66px]" className="rounded-xl" />
        </div>
      </div>
    </section>

    {/* INFORMACIÓN DE DESESTIMACIÓN */}
    <section className={`${formularioCardStyle} mt-3.5`}>
      <FormularioHeaderSkeleton width="w-56" />
      <div className="grid grid-cols-1 gap-4">
        <div className="space-y-1">
          <SkeletonLine width="w-16" height="h-[11px]" />
          <SkeletonBlock height="h-9" className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <SkeletonLine width="w-44" height="h-[11px]" />
          <SkeletonBlock height="h-9" className="rounded-xl" />
        </div>
        <div className="space-y-1">
          <SkeletonLine width="w-40" height="h-[11px]" />
          <SkeletonBlock height="h-[66px]" className="rounded-xl" />
        </div>
      </div>
    </section>

    {/* HISTORIAL DE PROCESO */}
    <section className={`${formularioCardStyle} mt-3.5`}>
      <FormularioHeaderSkeleton width="w-44" />
      <div className="flex items-start justify-center pt-2">
        <HistoryCardSkeleton />
      </div>
    </section>
  </>
);

// SKELETON PARA ArchivoHistorico.jsx
export const ArchivoHistoricoCardSkeleton = () => (
  <div className="p-2 h-[15.5svh] bg-white rounded-xl border border-slate-200 relative overflow-hidden flex flex-col">
    <div className="absolute left-0 top-0 bottom-0 w-2 bg-slate-200 rounded-l-2xl" />
    <div className="pl-5 pr-3 py-3 flex-1 flex flex-col justify-center -mt-1">
      <div className="flex justify-between items-center -mt-0.5">
        <SkeletonLine width="w-20" height="h-2.5" />
        <SkeletonBlock height="h-4" className="w-16 rounded-md" />
      </div>
      <div className="flex items-center gap-2 mb-3 mt-2">
        <SkeletonCircle size="w-6 h-8 rounded-md" />
        <div className="flex flex-col min-w-0 gap-1">
          <SkeletonLine width="w-24" height="h-2.5" />
          <SkeletonLine width="w-14" height="h-2" />
        </div>
      </div>
      <div className="mb-3 p-1.5 bg-slate-50 rounded-lg border border-slate-100 space-y-1.5">
        <SkeletonLine width="w-14" height="h-2" />
        <SkeletonLine width="w-28" height="h-2.5" />
      </div>
    </div>
  </div>
);

export const ArchivoHistoricoSkeleton = () => (
  <div className="w-full h-full flex flex-col bg-gray-50/30 overflow-hidden px-0 py-1">
    <div className="w-full bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 -mt-1.5">
      <div className="flex items-center gap-4 flex-1 min-w-[200px] shrink-0">
        <SkeletonBlock height="h-[46px]" className="w-56 rounded-xl" />
        <SkeletonBlock height="h-11" className="flex-1 rounded-xl" />
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 shrink-0">
          <SkeletonBlock height="h-[42px]" className="w-32 rounded-xl" />
          <span className="text-slate-300 text-xs font-bold">–</span>
          <SkeletonBlock height="h-[42px]" className="w-32 rounded-xl" />
        </div>
        <SkeletonBlock height="h-[42px]" className="w-24 rounded-xl" />
        <SkeletonBlock height="h-[42px]" className="w-28 rounded-xl" />
      </div>
    </div>
    <div className="flex-1 min-h-0 overflow-hidden mt-6 pb-6 pr-1.5">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-y-3.5 gap-x-6">
        {Array.from({ length: 20 }).map((_, i) => (
          <ArchivoHistoricoCardSkeleton key={i} />
        ))}
      </div>
    </div>
  </div>
);

// Fila de tabla — MISMAS clases td que las filas reales de Tabulacion.jsx
const FilaTabulacionSkeleton = () => (
  <tr className="bg-white border-b border-gray-100">
    <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-6 md:py-7 align-middle border-b border-slate-200/60">
      <SkeletonLine width="w-14" height="h-2.5" />
    </td>
    <td className="py-5 md:py-6 align-middle border-b border-slate-200/60">
      <div className="flex items-center gap-2 md:gap-3">
        <SkeletonCircle size="w-6 h-8 rounded-md" />
        <div className="flex flex-col min-w-0 gap-1">
          <SkeletonLine width="w-28" height="h-2.5" />
          <SkeletonLine width="w-16" height="h-2" />
        </div>
      </div>
    </td>
    <td className="py-5 md:py-6 align-middle border-b border-slate-200/60">
      <SkeletonLine width="w-24" height="h-2.5" />
    </td>
    <td className="py-5 md:py-6 align-middle text-left border-b border-slate-200/60">
      <SkeletonLine width="w-14" height="h-2.5" />
    </td>
    <td className="py-5 md:py-6 align-middle border-b border-slate-200/60">
      <SkeletonBlock height="h-[26px]" className="w-16 md:w-24 rounded-md" />
    </td>
    <td className="px-3 md:px-4 py-5 md:py-6 align-middle border-b border-slate-200/60">
      <SkeletonCircle size="w-8 h-8 rounded-lg" />
    </td>
  </tr>
);

// SKELETON PARA Tabulacion.jsx (vista principal, no el modal)
export const TabulacionPageSkeleton = () => (
  <>
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Tabla de tabulación — MISMO contenedor/alto/tabla que el real */}
      <div className="lg:w-4/5 flex flex-col gap-6">
        <div className="relative w-full bg-white px-4 md:px-7 py-4 md:py-6 rounded-2xl shadow-md flex flex-col h-[729px]">
          <SkeletonLine width="w-48" height="h-[18px]" />
          <div className="mt-4 md:mt-6 overflow-auto flex-1 min-h-0 -mx-4 md:mx-0 px-4 md:px-0 pr-1.5">
            <table className="min-w-full border-collapse text-left">
              <thead>
                <tr className="text-slate-400 text-[11px] font-medium uppercase tracking-widest">
                  <th className="sticky top-0 z-10 bg-white pl-3 border-b border-slate-200 md:pl-4 pr-1 md:pr-2 py-2 w-[10%]" />
                  <th className="sticky top-0 z-10 bg-white py-2 border-b border-slate-200 w-[17%]" />
                  <th className="sticky top-0 z-10 bg-white pl-0 pr-1 border-b border-slate-200 w-[16%] py-2" />
                  <th className="sticky top-0 z-10 bg-white py-2 border-b border-slate-200 w-[9%]" />
                  <th className="sticky top-0 z-10 bg-white py-2 border-b border-slate-200 w-[10%]" />
                  <th className="sticky top-0 z-10 bg-white px-3 border-b border-slate-200 py-2 w-[4%]" />
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 7 }).map((_, i) => (
                  <FilaTabulacionSkeleton key={i} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Panel lateral "Alertas Comunes" — MISMO alto/paddings que el real */}
      <div
        className="lg:w-1/5 bg-white p-5 rounded-2xl shadow-md border border-gray-100 flex flex-col h-[729px]
                    relative w-full px-4 md:px-7 py-4 md:py-6"
      >
        <div className="mb-3">
          <SkeletonLine width="w-32" height="h-[18px]" />
        </div>
        <div className="space-y-4 -mt-2">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-2.5 h-12 bg-slate-50/50 rounded-lg border border-transparent"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1 h-1 rounded-full bg-slate-200 shrink-0" />
                <SkeletonLine width="w-28" height="h-2.5" />
              </div>
              <SkeletonLine width="w-4" height="h-2.5" />
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Alertas Tabuladas — MISMO contenedor que el real */}
    <div className="w-full bg-white px-4 md:px-7 py-4 md:py-6 rounded-2xl shadow-md border border-gray-50 relative flex flex-col">
      <SkeletonLine width="w-44" height="h-[18px]" />
      <div className="mt-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pb-0">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[14.5svh] mb-1 bg-white rounded-xl p-3 border border-slate-200 relative overflow-hidden"
            >
              <div className="absolute left-0 top-0 bottom-0 w-2 bg-slate-200 rounded-l-2xl" />
              <div className="flex justify-between items-center mb-3 pl-3">
                <SkeletonLine width="w-16" height="h-2" />
                <SkeletonBlock height="h-4" className="w-16 rounded-md" />
              </div>
              <div className="flex items-center gap-3 mb-3 pl-3">
                <SkeletonCircle size="w-6 h-8 rounded-md" />
                <div className="flex flex-col min-w-0 gap-1">
                  <SkeletonLine width="w-24" height="h-2.5" />
                  <SkeletonLine width="w-14" height="h-2" />
                </div>
              </div>
              <div className="mb-5 p-1.5 rounded-lg border border-slate-100 ml-3 mt-4 bg-slate-50">
                <SkeletonLine width="w-16" height="h-2" />
                <div className="mt-1">
                  <SkeletonLine width="w-28" height="h-2" />
                </div>
              </div>
        </div>
      ))}
        </div>
      </div>
    </div>
  </>
);

// SKELETON PARA NuevoPolicia.jsx (mientras carga datos del oficial a editar)
export const NuevoPoliciaSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
    <div className="md:col-span-2 space-y-2">
      <SkeletonLine width="w-32" height="h-[11px]" />
      <SkeletonBlock height="h-11" className="rounded-xl" />
    </div>
    <div className="space-y-2">
      <SkeletonLine width="w-32" height="h-[11px]" />
      <SkeletonBlock height="h-11" className="rounded-xl" />
    </div>
    <div className="space-y-2">
      <SkeletonLine width="w-16" height="h-[11px]" />
      <SkeletonBlock height="h-11" className="rounded-xl" />
    </div>
    <div className="space-y-2">
      <SkeletonLine width="w-14" height="h-[11px]" />
      <SkeletonBlock height="h-11" className="rounded-xl" />
    </div>
    <div className="space-y-2">
      <SkeletonLine width="w-28" height="h-[11px]" />
      <SkeletonBlock height="h-11" className="rounded-xl" />
    </div>
    <div className="md:col-span-2 mt-2 pt-2 border-t border-slate-200">
      <SkeletonLine width="w-48" height="h-[14px]" />
    </div>
    <div className="space-y-2">
      <SkeletonLine width="w-40" height="h-[11px]" />
      <SkeletonBlock height="h-11" className="rounded-xl" />
    </div>
    <div className="space-y-2">
      <SkeletonLine width="w-24" height="h-[11px]" />
      <SkeletonBlock height="h-11" className="rounded-xl" />
    </div>
    <div className="md:col-span-2 mt-2 pt-2 border-t border-slate-200">
      <SkeletonLine width="w-40" height="h-[14px]" />
    </div>
    <div className="md:col-span-2 space-y-2">
      <SkeletonLine width="w-32" height="h-[11px]" />
      <SkeletonBlock height="h-11" className="rounded-xl" />
      <SkeletonLine width="w-64" height="h-2" />
    </div>
  </div>
);

// Fila de tabla — MISMAS clases td que las filas reales de Usuarios.jsx
const FilaUsuarioSkeleton = () => (
  <tr className="bg-white">
    <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-8 md:py-9 align-middle border-b border-slate-200/60">
      <SkeletonLine width="w-14" height="h-2.5" />
    </td>
    <td className="py-8 md:py-9 align-middle border-b border-slate-200/60">
      <div className="flex items-center gap-3">
        <SkeletonCircle size="w-6 h-8 rounded-md" />
        <div className="flex flex-col min-w-0 gap-1.5">
          <SkeletonLine width="w-28" height="h-2.5" />
          <SkeletonLine width="w-16" height="h-2" />
        </div>
      </div>
    </td>
    <td className="py-8 md:py-9 align-middle border-b border-slate-200/60">
      <div className="flex flex-col gap-2">
        <SkeletonLine width="w-14" height="h-2.5" />
        <SkeletonLine width="w-16" height="h-2" />
      </div>
    </td>
    <td className="py-8 md:py-9 align-middle border-b border-slate-200/60">
      <SkeletonLine width="w-16" height="h-2.5" />
    </td>
    <td className="py-8 md:py-9 align-middle border-b border-slate-200/60">
      <SkeletonLine width="w-16" height="h-2.5" />
    </td>
    <td className="py-8 md:py-9 align-middle border-b border-slate-200/60">
      <SkeletonBlock height="h-6" className="w-20 rounded-md" />
    </td>
    <td className="px-4 py-8 md:py-9 align-middle border-b border-slate-200/60">
      <div className="flex items-center gap-3">
        <SkeletonCircle size="w-8 h-8 rounded-lg" />
        <SkeletonCircle size="w-8 h-8 rounded-lg" />
        <SkeletonCircle size="w-8 h-8 rounded-lg" />
      </div>
    </td>
  </tr>
);

export const UsuariosSkeleton = () => (
  <div className="w-full h-full flex flex-col bg-gray-50/30 overflow-y-auto p-1 pb-3">
    {/* SELECTOR DE TABS */}
    <div className="w-full bg-white p-3 rounded-2xl shadow-md border border-gray-100 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 -mt-1.5">
      <div className="flex items-center gap-4 flex-1 min-w-[200px] shrink-0">
        <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200 shrink-0 gap-2">
          <SkeletonBlock height="h-[42px]" className="w-28 rounded-lg" />
          <SkeletonBlock height="h-[42px]" className="w-32 rounded-lg" />
        </div>
        <SkeletonBlock height="h-11" className="flex-1 min-w-[160px] rounded-xl" />
        <SkeletonBlock height="h-11" className="w-40 rounded-xl shrink-0" />
      </div>
      <div className="flex items-center gap-4">
        <SkeletonBlock height="h-[46px]" className="w-64 rounded-xl" />
        <SkeletonBlock height="h-[42px]" className="w-28 rounded-xl" />
      </div>
    </div>

    {/* Tabla */}
    <div className="relative top-1 w-full bg-white rounded-2xl shadow-lg flex flex-col flex-1 min-h-0 max-h-[79svh] mt-6">
      <div className="px-4 md:px-7 py-4 md:py-6 flex flex-col flex-1 min-h-0 overflow-hidden">
        <SkeletonLine width="w-52" height="h-[18px]" />
        <div className="mt-4 md:mt-6 overflow-auto flex-1 min-h-0 -mx-4 md:mx-0 px-4 md:px-0">
          <table className="min-w-full border-collapse table-fixed">
            <thead>
              <tr className="text-slate-400 text-[11px] font-medium uppercase tracking-widest">
                <th className="px-3 pb-3 pt-1 w-[10%]" />
                <th className="pb-3 pt-1 w-[30%]" />
                <th className="pb-3 pt-1 w-[12%]" />
                <th className="pb-3 pt-1 w-[10%]" />
                <th className="pb-3 pt-1 w-[10%]" />
                <th className="px-0 pb-3 pt-1 w-[10%]" />
                <th className="px-4 pb-3 pt-1 w-[10%]" />
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, i) => (
                <FilaUsuarioSkeleton key={i} />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
);

// Fila de tabla — MISMAS clases td que las filas reales de ActividadLog.jsx
const FilaActividadLogSkeleton = () => (
  <tr className="bg-white border-b border-slate-100">
    <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-4 align-middle">
      <div className="flex items-center gap-3">
        <SkeletonCircle size="w-6 h-8 rounded-md" />
        <SkeletonLine width="w-28" height="h-2.5" />
      </div>
    </td>
    <td className="py-4 align-middle">
      <SkeletonBlock height="h-5" className="w-16 rounded-md" />
    </td>
    <td className="py-4 align-middle max-w-[250px]">
      <div className="flex flex-col gap-1.5">
        <SkeletonLine width="w-full" height="h-2.5" />
        <SkeletonLine width="w-2/3" height="h-2.5" />
      </div>
    </td>
    <td className="py-4 pl-0 align-middle">
      <SkeletonLine width="w-12" height="h-2.5" />
    </td>
    <td className="py-4 pl-2 align-middle">
      <SkeletonLine width="w-24" height="h-2.5" />
    </td>
  </tr>
);

// SKELETON PARA la barra de herramientas de ActividadLog.jsx (solo carga inicial,
// mientras se cargan roles únicos por primera vez)
export const ToolbarActividadLogSkeleton = () => (
  <div className="w-full bg-white p-3 rounded-2xl shadow-md border py-[18.5px] border-gray-100 flex flex-wrap items-center justify-between gap-4 flex-shrink-0 -mt-1.5">
    <div className="flex items-center gap-4 flex-1 min-w-[200px] shrink-0">
      <SkeletonBlock height="h-11" className="flex-1 min-w-[160px] rounded-xl" />
    </div>
    <div className="flex items-center gap-4">
      <SkeletonBlock height="h-11" className="w-40 rounded-xl" />
      <div className="flex items-center gap-1.5 shrink-0">
        <SkeletonBlock height="h-11" className="w-36 rounded-xl" />
        <span className="text-slate-300 text-xs font-bold">–</span>
        <SkeletonBlock height="h-11" className="w-36 rounded-xl" />
      </div>
      <SkeletonBlock height="h-11" className="w-24 rounded-xl" />
      <SkeletonBlock height="h-[42px]" className="w-28 rounded-xl" />
    </div>
  </div>
);

// SKELETON PARA ActividadLog.jsx (filas de la tabla mientras cargarLogs hace fetch real)
export const TablaActividadLogSkeleton = ({ filas = 8 }) => (
  <>
    {Array.from({ length: filas }).map((_, i) => (
      <FilaActividadLogSkeleton key={i} />
    ))}
  </>
);

// SKELETON PARA PerfilCiudadano.jsx (mientras carga advertencias reales)
export const PerfilCiudadanoSkeleton = () => (
  <>
    <div className="mt-1 grid grid-cols-2 gap-x-7 gap-y-5">
      <div className="col-span-2 space-y-2">
        <SkeletonLine width="w-32" height="h-[11px]" />
        <SkeletonBlock height="h-11" className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <SkeletonLine width="w-32" height="h-[11px]" />
        <SkeletonBlock height="h-11" className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <SkeletonLine width="w-16" height="h-[11px]" />
        <SkeletonBlock height="h-11" className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <SkeletonLine width="w-28" height="h-[11px]" />
        <SkeletonBlock height="h-11" className="rounded-xl" />
      </div>
      <div className="space-y-2">
        <SkeletonLine width="w-32" height="h-[11px]" />
        <SkeletonBlock height="h-11" className="rounded-xl" />
      </div>
    </div>

    <div className="md:col-span-2 mt-7 pt-2 border-t border-slate-200">
      <SkeletonLine width="w-52" height="h-[14px]" />
      <div className="grid grid-cols-2 gap-5 mt-4">
        <SkeletonBlock height="h-36" className="rounded-lg" />
        <SkeletonBlock height="h-36" className="rounded-lg" />
      </div>
    </div>
  </>
);
import React from "react";

// Inyecta el keyframe del shimmer una sola vez en el documento
let shimmerStyleInjected = false;
const ShimmerKeyframes = () => {
  if (shimmerStyleInjected) return null;
  shimmerStyleInjected = true;
  return (
    <style>{`
      @keyframes skeletonShimmer {
        100% { transform: translateX(100%); }
      }
    `}</style>
  );
};

// Base con efecto shimmer (barrido de brillo que recorre la pieza) en vez de
// solo parpadeo — da sensación de carga "activa" en vez de algo estático
const Shimmer = ({ className = "" }) => (
  <div className={`relative overflow-hidden bg-slate-200 ${className}`}>
    <ShimmerKeyframes />
    <div className="absolute inset-0 -translate-x-full animate-[skeletonShimmer_1.4s_infinite] bg-gradient-to-r from-transparent via-white/70 to-transparent" />
  </div>
);

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

// Skeleton compuesto: imita una fila de la tabla en GestionAlertas.jsx
export const FilaAlertaSkeleton = () => (
  <tr className="bg-white border-b border-slate-100">
    <td className="pl-3 md:pl-4 pr-1 md:pr-2 py-5 md:py-6 align-middle">
      <SkeletonLine width="w-14" height="h-2.5" />
    </td>
    <td className="py-5 md:py-6 align-middle">
      <div className="flex items-center gap-2 md:gap-3">
        <SkeletonCircle size="w-6 h-8 rounded-md" />
        <div className="flex flex-col gap-1.5">
          <SkeletonLine width="w-28" height="h-2.5" />
          <SkeletonLine width="w-16" height="h-2" />
        </div>
      </div>
    </td>
    <td className="py-5 md:py-6 align-middle hidden sm:table-cell">
      <SkeletonLine width="w-10" height="h-2.5" />
    </td>
    <td className="py-5 md:py-6 align-middle">
      <SkeletonLine width="w-20" height="h-2.5" />
    </td>
    <td className="py-5 md:py-6 align-middle">
      <SkeletonBlock height="h-6" className="w-16 md:w-20 rounded-md" />
    </td>
    <td className="px-3 md:px-4 py-5 md:py-6 align-middle">
      <SkeletonCircle size="w-8 h-8 rounded-lg" />
    </td>
  </tr>
);

// Skeleton compuesto: imita la tabla completa de GestionAlertas.jsx (encabezado de tabs + tabla con N filas)
export const TablaAlertasSkeleton = ({ filas = 6 }) => (
  <div className="-mt-4 w-full px-1 py-5 space-y-5 pb-8 bg-gray-50/30 h-[100dvh] overflow-hidden flex flex-col">
    {/* Tabs */}
    <div className="px-3 sm:px-4 w-full bg-white p-3 rounded-2xl shadow-sm flex flex-wrap items-center justify-between gap-2">
      <div className="flex bg-gray-50 p-1.5 rounded-xl border border-gray-200 shrink-0 gap-2">
        <SkeletonBlock height="h-9" className="w-32 rounded-lg" />
        <SkeletonBlock height="h-9" className="w-36 rounded-lg" />
      </div>
      <SkeletonBlock height="h-9" className="w-40 rounded-lg" />
    </div>

    {/* Tabla */}
    <div className="relative top-1 w-full bg-white px-4 md:px-7 py-4 md:py-6 rounded-2xl shadow-md flex flex-col flex-1 min-h-0">
      <SkeletonLine width="w-52" height="h-4" />
      <div className="overflow-auto flex-1 min-h-0 mt-4 -mx-4 md:mx-0 px-4 md:px-0">
        <table className="min-w-full border-collapse text-left">
          <thead>
            <tr className="text-slate-400 text-[11px] font-extrabold uppercase tracking-wider">
              <th className="pl-3 md:pl-4 pr-1 md:pr-2 py-2 w-[12%] md:w-[15%]">ID</th>
              <th className="py-2 w-[28%] md:w-[30%]">Ciudadano</th>
              <th className="py-2 w-[15%] hidden sm:table-cell">Duración del audio</th>
              <th className="py-2 w-[20%]">Tiempo</th>
              <th className="py-2 w-[12%] md:w-[15%]">Estado</th>
              <th className="px-3 md:px-4 py-2 w-[10%]">Acciones</th>
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

// Skeleton compuesto: imita las tarjetas de FormularioTabulacion.jsx — mismos colores, tamaños y tracking del original
const TabulacionCardHeaderSkeleton = ({ bgColor = "bg-slate-100", titleWidth = "w-40" }) => (
  <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-4 shrink-0">
    <div className="flex items-center gap-2">
      <div className={`w-7 h-7 ${bgColor} rounded-lg flex items-center justify-center`}>
        <div className="w-3.5 h-3.5 bg-slate-300 rounded animate-pulse" />
      </div>
      <div className={`h-[11px] ${titleWidth} bg-slate-200 rounded animate-pulse tracking-[0.15em]`} />
    </div>
  </div>
);

// Tarjeta 1 — DATOS DE LA ALERTA (azul, como en el original)
export const TabulacionDatosAlertaSkeleton = () => (
  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
    <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-4 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
          <div className="w-3.5 h-3.5 bg-blue-200 rounded animate-pulse" />
        </div>
        <SkeletonLine width="w-36" height="h-[11px]" />
      </div>
      <SkeletonBlock height="h-6" className="w-16 rounded-md" />
    </div>
    <div className="grid grid-cols-2 gap-3 flex-1">
      <div className="col-span-2 space-y-1">
        <SkeletonLine width="w-40" height="h-[11px]" />
        <SkeletonBlock height="h-9" className="rounded-xl" />
      </div>
      <div className="space-y-1">
        <SkeletonLine width="w-16" height="h-[11px]" />
        <SkeletonBlock height="h-9" className="rounded-xl" />
      </div>
      <div className="space-y-1">
        <SkeletonLine width="w-16" height="h-[11px]" />
        <SkeletonBlock height="h-9" className="rounded-xl" />
      </div>
      <div className="col-span-2 space-y-1">
        <SkeletonLine width="w-44" height="h-[11px]" />
        <SkeletonBlock height="h-9" className="rounded-xl" />
      </div>
      <div className="col-span-2 space-y-1">
        <SkeletonLine width="w-32" height="h-[11px]" />
        <SkeletonBlock height="h-20" className="rounded-xl" />
      </div>
    </div>
  </div>
);

// Tarjeta 2 — DIRECCIÓN Y DESCRIPCIÓN (verde, como en el original)
export const TabulacionDireccionSkeleton = () => (
  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
    <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-4 shrink-0">
      <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center">
        <div className="w-3.5 h-3.5 bg-green-200 rounded animate-pulse" />
      </div>
      <SkeletonLine width="w-52" height="h-[11px]" />
    </div>
    <div className="grid grid-cols-2 gap-3 flex-1">
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
  </div>
);

// Tarjeta 3 — CLASIFICACIÓN DEL HECHO (rojo, como en el original)
export const TabulacionClasificacionSkeleton = () => (
  <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full">
    <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-4 shrink-0">
      <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
        <div className="w-3.5 h-3.5 bg-red-200 rounded animate-pulse" />
      </div>
      <SkeletonLine width="w-48" height="h-[11px]" />
    </div>
    <div className="space-y-4 flex-1 justify-center flex flex-col">
      <div className="space-y-1">
        <SkeletonLine width="w-36" height="h-[11px]" />
        <SkeletonBlock height="h-10" className="rounded-xl" />
      </div>
      <div className="space-y-1">
        <SkeletonLine width="w-20" height="h-[11px]" />
        <SkeletonBlock height="h-10" className="rounded-xl" />
      </div>
      <div className="mt-2 p-2 bg-slate-50 rounded-xl text-center space-y-2">
        <SkeletonLine width="w-32" height="h-[11px]" className="mx-auto" />
        <SkeletonLine width="w-24" height="h-[11px]" className="mx-auto" />
      </div>
    </div>
  </div>
);

// Tarjeta 4 — INFORME POLICIAL (ámbar, como en el original)
export const TabulacionInformePolicialSkeleton = () => (
  <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col h-full">
    <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-4 shrink-0">
      <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
        <div className="w-3.5 h-3.5 bg-amber-300 rounded animate-pulse" />
      </div>
      <SkeletonLine width="w-32" height="h-[11px]" />
    </div>
    <div className="grid grid-cols-2 gap-3 flex-1">
      <div className="space-y-1">
        <SkeletonLine width="w-16" height="h-[11px]" />
        <SkeletonBlock height="h-9" className="rounded-xl" />
      </div>
      <div className="space-y-1">
        <SkeletonLine width="w-12" height="h-[11px]" />
        <SkeletonBlock height="h-9" className="rounded-xl" />
      </div>
      <div className="col-span-2 space-y-1">
        <SkeletonLine width="w-16" height="h-[11px]" />
        <SkeletonBlock height="h-9" className="rounded-xl" />
      </div>
      <div className="col-span-2 space-y-1">
        <SkeletonLine width="w-36" height="h-[11px]" />
        <SkeletonBlock height="h-20" className="rounded-lg" />
      </div>
    </div>
  </div>
);

export const FormularioTabulacionSkeleton = () => (
  <div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 rounded-md">
      <TabulacionDatosAlertaSkeleton />
      <TabulacionDireccionSkeleton />
      <TabulacionClasificacionSkeleton />
      <TabulacionInformePolicialSkeleton />
    </div>

    {/* SECRETARÍA — morado, como en el original */}
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm mt-8">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-4 shrink-0">
        <div className="w-7 h-7 bg-purple-50 rounded-lg flex items-center justify-center">
          <div className="w-3.5 h-3.5 bg-purple-300 rounded animate-pulse" />
        </div>
        <SkeletonLine width="w-56" height="h-[11px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-3">
          <div className="space-y-1">
            <SkeletonLine width="w-24" height="h-[11px]" />
            <SkeletonBlock height="h-9" className="rounded-xl" />
          </div>
          <div className="space-y-1">
            <SkeletonLine width="w-52" height="h-[11px]" />
            <SkeletonBlock height="h-9" className="rounded-xl" />
          </div>
        </div>
        <div className="space-y-1">
          <SkeletonLine width="w-40" height="h-[11px]" />
          <SkeletonBlock height="h-[114px]" className="rounded-xl" />
        </div>
      </div>
    </div>

    {/* HISTORIAL DE PROCESO */}
    <div className="pt-6 px-2 mt-4">
      <SkeletonLine width="w-44" height="h-[11px]" />
      <div className="flex flex-wrap md:flex-nowrap justify-center gap-5 mt-5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-1 flex flex-col items-center min-w-[96px] rounded-xl p-2 bg-white border border-slate-300 shadow-md">
            <SkeletonCircle size="w-8 h-8 rounded-full" />
            <div className="mt-1 space-y-1 w-full items-center flex flex-col">
              <SkeletonLine width="w-12" height="h-[9px]" />
              <SkeletonLine width="w-16" height="h-[9px]" />
              <SkeletonLine width="w-14" height="h-[9px]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

// ✅ Skeleton específico para FormularioDesestimados.jsx — replica sección por
// sección (DATOS DE LA ALERTA con badge de prioridad, INFORMACIÓN DE
// DESESTIMACIÓN, HISTORIAL DE PROCESO con 1 tarjeta) para que el tamaño
// coincida con el contenido real y no "salte" al terminar de cargar.
export const FormularioDesestimadosSkeleton = () => (
  <div className="px-0">
    {/* DATOS DE LA ALERTA */}
    <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full mb-6">
      <div className="flex items-center justify-between border-b border-slate-50 pb-2 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center">
            <div className="w-3.5 h-3.5 bg-blue-200 rounded animate-pulse" />
          </div>
          <SkeletonLine width="w-36" height="h-[11px]" />
        </div>
        <SkeletonBlock height="h-6" className="w-16 rounded-md" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <SkeletonLine width="w-40" height="h-[11px]" />
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
          <SkeletonBlock height="h-20" className="rounded-xl" />
        </div>
        <div className="md:col-span-2 space-y-1">
          <SkeletonLine width="w-44" height="h-[11px]" />
          <SkeletonBlock height="h-9" className="rounded-xl" />
        </div>
      </div>
    </section>

    {/* INFORMACIÓN DE DESESTIMACIÓN */}
    <section className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full mb-6">
      <div className="flex items-center gap-2 border-b border-slate-50 pb-2 mb-4 shrink-0">
        <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center">
          <div className="w-3.5 h-3.5 bg-red-200 rounded animate-pulse" />
        </div>
        <SkeletonLine width="w-56" height="h-[11px]" />
      </div>
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
          <SkeletonBlock height="h-16" className="rounded-xl" />
        </div>
      </div>
    </section>

    {/* HISTORIAL DE PROCESO */}
    <div className="pt-6 px-2 mt-4">
      <SkeletonLine width="w-44" height="h-[11px]" />
      <div className="flex flex-wrap md:flex-nowrap justify-center gap-5 mt-5">
        <div className="flex-1 flex flex-col items-center min-w-[96px] rounded-xl p-2 bg-white border border-slate-300 shadow-md">
          <SkeletonCircle size="w-8 h-8 rounded-full" />
          <div className="mt-1 space-y-1 w-full items-center flex flex-col">
            <SkeletonLine width="w-16" height="h-[9px]" />
            <SkeletonLine width="w-14" height="h-[9px]" />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// SKELETON PARA ArchivoHistorico.jsx
export const ArchivoHistoricoCardSkeleton = () => (
  <div className="p-2 h-48 bg-white rounded-lg border border-slate-200 relative overflow-hidden flex flex-col">
    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-slate-200" />
    <div className="p-3 flex-1 flex flex-col justify-center -mt-1">
      <div className="flex justify-between items-center -mt-0.5">
        <SkeletonLine width="w-16" height="h-2.5" />
        <SkeletonBlock height="h-4" className="w-16 rounded-md" />
      </div>
      <div className="flex items-center gap-2 mb-3 mt-2">
        <SkeletonCircle size="w-6 h-8 rounded-md" />
        <div className="flex flex-col min-w-0 gap-1">
          <SkeletonLine width="w-24" height="h-2.5" />
          <SkeletonLine width="w-14" height="h-2" />
        </div>
      </div>
      <div className="mb-3 p-1.5 bg-slate-50 rounded-md border border-slate-100 space-y-1.5">
        <SkeletonLine width="w-14" height="h-2" />
        <SkeletonLine width="w-28" height="h-2.5" />
      </div>
      <div className="flex justify-end gap-3 mt-0.5">
        <SkeletonBlock height="h-8" className="w-20 rounded-lg" />
        <SkeletonBlock height="h-8" className="w-16 rounded-lg" />
      </div>
    </div>
  </div>
);

export const ArchivoHistoricoSkeleton = ({ cards = 8 }) => (
  <div className="-mt-4 w-full px-1 py-4 space-y-4 pb-6 bg-gray-50/30">
    <div className="w-full bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-4 flex-1 min-w-[200px]">
        <SkeletonBlock height="h-11" className="w-56 rounded-lg" />
        <SkeletonBlock height="h-10" className="flex-1 rounded-xl" />
      </div>
      <div className="flex items-center gap-4">
        <SkeletonBlock height="h-11" className="w-64 rounded-lg" />
        <SkeletonBlock height="h-10" className="w-28 rounded-lg" />
      </div>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-6">
      {Array.from({ length: cards }).map((_, i) => (
        <ArchivoHistoricoCardSkeleton key={i} />
      ))}
    </div>
  </div>
);

// SKELETON PARA Tabulacion.jsx (vista principal, no el modal)
export const TabulacionPageSkeleton = () => (
  <div className="-mt-4 px-1 min-h-screen bg-slate-50/50 w-full py-4 space-y-5 pb-6">
    <div className="flex flex-col lg:flex-row gap-6 mb-4">
      <div className="lg:w-3/4 flex flex-col gap-6">
        {/* Tarjetas "Tabuladas Hoy" / "Pendientes" */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white p-4 rounded-2xl shadow-md border border-gray-100 flex items-center justify-between px-5">
              <div className="flex items-center gap-4">
                <SkeletonCircle size="w-9 h-9 rounded-full" />
                <div className="space-y-2">
                  <SkeletonLine width="w-28" height="h-2.5" />
                  <SkeletonLine width="w-10" height="h-5" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Tabla de tabulación */}
        <div className="w-full bg-white px-4 md:px-7 py-4 md:py-6 rounded-2xl shadow-md">
          <SkeletonLine width="w-48" height="h-4" />
          <div className="mt-5 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <SkeletonLine width="w-14" height="h-2.5" />
                <SkeletonCircle size="w-6 h-8 rounded-md" />
                <SkeletonLine width="w-32" height="h-2.5" />
                <SkeletonLine width="w-20" height="h-2.5" />
                <SkeletonBlock height="h-6" className="w-20 rounded-md ml-auto" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Panel lateral "Alertas Comunes" */}
      <div className="lg:w-1/4 bg-white p-5 rounded-2xl shadow-md border border-gray-100">
        <SkeletonLine width="w-32" height="h-3.5" />
        <SkeletonLine width="w-24" height="h-2" />
        <div className="space-y-3 mt-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} height="h-12" className="rounded-lg" />
          ))}
        </div>
      </div>
    </div>

    {/* Alertas Tabuladas (grid de 4) */}
    <div className="w-full bg-white p-5 rounded-2xl shadow-md border border-gray-50">
      <SkeletonLine width="w-44" height="h-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-5">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-56 bg-white rounded-lg p-4 border border-slate-200 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-2 bg-slate-200" />
            <div className="pl-3 space-y-4">
              <div className="flex justify-between">
                <SkeletonLine width="w-16" height="h-2.5" />
                <SkeletonBlock height="h-4" className="w-16 rounded-md" />
              </div>
              <div className="flex items-center gap-3">
                <SkeletonCircle size="w-6 h-8 rounded-md" />
                <div className="space-y-1.5">
                  <SkeletonLine width="w-24" height="h-2.5" />
                  <SkeletonLine width="w-14" height="h-2" />
                </div>
              </div>
              <SkeletonBlock height="h-10" className="rounded-md" />
              <div className="flex gap-3">
                <SkeletonBlock height="h-8" className="flex-1 rounded-lg" />
                <SkeletonBlock height="h-8" className="flex-1 rounded-lg" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);
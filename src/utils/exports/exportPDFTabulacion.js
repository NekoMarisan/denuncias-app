import jsPDF from "jspdf";
import QRCode from "qrcode";

export async function exportPDFTabulacion({
  tab, nombreOperador = "—", nombreDespachador = "—",
  nombrePatrullero = "—", nombreTabulador = "—",
  nombreDerivacion = "—", // ← NUEVO
  logoBase64 = null, filename = "tabulacion.pdf", qrData = null, returnBlob = false,
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  const PW = 215.9;
  const PH = 279.4;
const ML = 18;
const MR = 18;
const CW = PW - ML - MR;

  const VERDE  = [17, 62, 39];
  const NEGRO  = [15, 15, 15];
  const BLANCO = [255, 255, 255];
  const GBORD  = [180, 180, 180]; // borde gris
  const GFILL  = [248, 248, 248]; // fondo celda
  const GTEXT  = [120, 120, 120]; // texto label

  const alerta  = tab.alerta || {};
  const usuario = alerta.usuario_ciudadano || {};

  const fmt = (v) => (v !== null && v !== undefined && String(v).trim() !== "") ? String(v) : "—";
  const fmtF = (iso) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", hour12: false,
    }).replace(",", "");
  };

  let qrBase64 = null;
  if (qrData) {
    try { qrBase64 = await QRCode.toDataURL(qrData, { width: 80, margin: 1 }); } catch (_) {}
  }

  // ════════════════════════════════════════════════════════════
  // ENCABEZADO — estilo RUDE: logo | institución | código | QR
  // ════════════════════════════════════════════════════════════
  const HDR = 35;
  const OFFSET_Y = 9;

  doc.setFillColor(...BLANCO);
  doc.rect(0, 0, PW, HDR, "F");
  doc.setFillColor(...VERDE);
  doc.rect(ML, HDR, CW, 0.35, "F");

  if (logoBase64) {
    try { doc.addImage(logoBase64, "PNG", ML, 4 + OFFSET_Y, 16, 16); } catch (_) {}
  } else {
    doc.setFillColor(...VERDE);
    doc.roundedRect(ML, 3 + OFFSET_Y, 16, 16, 1.5, 1.5, "F");
    doc.setTextColor(...BLANCO);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.text("PB", ML + 8, 12 + OFFSET_Y, { align: "center" });
  }

  const TX = ML + 20;
doc.setTextColor(...NEGRO);
doc.setFont("helvetica", "bold");
doc.setFontSize(12);  // ← CAMBIA AQUÍ el tamaño de CENTRAL DE RADIO PATRULLAS
doc.text("CENTRAL DE RADIO PATRULLAS", TX, 9 + OFFSET_Y);
doc.setTextColor(...NEGRO);
doc.setFont("helvetica", "bold");
doc.setFontSize(8);  // ← CAMBIA AQUÍ el tamaño de REPORTE DE TABULACIÓN
doc.text("REPORTE DE TABULACIÓN DE CASO", TX, 14.5 + OFFSET_Y);
doc.setTextColor(...NEGRO);
doc.setFont("helvetica", "normal");
doc.setFontSize(7.5);  // ← CAMBIA AQUÍ el tamaño de CÓDIGO · CATEGORÍA
const categoriaAlerta = (alerta.tipo_alerta || "").toLowerCase().includes("emergencia")
  ? "ALERTA DE EMRGENCIA"
  : "ALERTA CIUDADANA";  // ← lógica de categoría, ajusta el campo según tu BD
doc.text(`Categoría: ${categoriaAlerta}`, TX, 19 + OFFSET_Y);

if (qrBase64) {
  const qrSize = 16;
  const qrX = PW - MR - qrSize;
  doc.addImage(qrBase64, "PNG", qrX, 4 + OFFSET_Y, qrSize, qrSize);
}

const fechaEmision = new Date().toLocaleString("es-ES", {
  day: "2-digit", month: "2-digit", year: "numeric",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
}).replace(",", "");

const rightX = PW - MR - 14 - 6;
doc.setFont("helvetica", "normal");
doc.setFontSize(7);
doc.text(`Emisión: ${fechaEmision}`, rightX, 14.5 + OFFSET_Y, { align: "right" });
doc.text(`Tabulación: ${fmtF(tab.fecha_tabulacion)}`, rightX, 19 + OFFSET_Y, { align: "right" });

  // HELPERS tipo RUDE
 let Y = HDR + 4.5;

// ── CONFIGURACIÓN VISUAL — ajusta estos valores ──
const CFG = {
  // Alturas de filas
  filaH: 13,          // altura de celdas normales
  celdaTxtH: 16,      // altura de celdas de texto largo
  cadenaH: 16,        // altura de cards cadena de gestión
  cadenaBarH: 5,      // altura barra verde título cadena

  // Fuentes
  labelSize: 7,       // tamaño label (etiqueta gris)
  valorSize: 10,      // tamaño valor (dato principal)
  secTitSize: 8,      // tamaño título sección barra verde
  cadenaRolSize: 6.5,   // tamaño rol en cadena gestión
cadenaNomSize: 8.5,   // tamaño nombre en cadena gestión

  // Espacios internos celda
  labelY: 4,          // distancia Y del label desde arriba de celda
  valorYOffset: 2,    // distancia del valor desde abajo de celda

  // Espacio entre secciones
  secGap: 3,          // espacio antes de cada barra verde
};

  // Dibuja borde exterior de una sección completa
  const secRect = (h) => {
    doc.setDrawColor(...GBORD);
    doc.setLineWidth(0.3);
    doc.rect(ML, Y, CW, h);
  };

  // Título de sección — barra verde dentro del borde
  const secTit = (titulo) => {
  doc.setFillColor(...VERDE);
  doc.rect(ML, Y, CW, CFG.cadenaBarH, "F");
  doc.setTextColor(...BLANCO);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(CFG.secTitSize);
  doc.text(titulo.toUpperCase(), ML + 2, Y + CFG.cadenaBarH - 1);
  Y += CFG.cadenaBarH;
};

  // Dibuja una celda individual con borde
const celda = (x, y, w, h, label, valor, bold = false, fixedH = null) => {
    doc.setDrawColor(...GBORD);
    doc.setLineWidth(0.2);
    doc.rect(x, y, w, h);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(CFG.labelSize);
    doc.setTextColor(94, 94, 94); // ← CAMBIA AQUÍ el tono del label
    doc.text(label.toUpperCase(), x + 1, y + CFG.labelY);
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(CFG.valorSize);
    doc.setTextColor(...NEGRO);
    const lines = doc.splitTextToSize(fmt(valor), w - 2);
    const maxLines = Math.floor((h - 6) / 3.8);  // usa h real para cuántas líneas caben
doc.text(lines.slice(0, maxLines), x + 1, y + CFG.labelY + 5);
};

  // Fila de celdas: array de {w, label, valor, bold?}
  // Todas con la misma altura h, arrancando en Y actual
  const fila = (celdas, h = CFG.filaH, fixedH = null) => {
    let x = ML;
    celdas.forEach((c) => {
      celda(x, Y, c.w, h, c.label, c.valor, c.bold || false, fixedH);
      x += c.w;
    });
    Y += h;
  };
  // Celda de texto largo (descripción/resumen) — altura variable
  const celdaTxt = (label, valor, h = CFG.celdaTxtH) => {
    doc.setDrawColor(...GBORD);
    doc.setLineWidth(0.2);
    doc.rect(ML, Y, CW, h);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(CFG.labelSize);
    doc.setTextColor(...GTEXT);
    doc.text(label.toUpperCase(), ML + 1, Y + CFG.labelY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(CFG.valorSize);
    doc.setTextColor(...NEGRO);
    const lines = doc.splitTextToSize(fmt(valor), CW - 3);
    doc.text(lines.slice(0, Math.floor((h - 4) / 3.2)), ML + 1, Y + CFG.labelY + 5);
    Y += h;
};

  // Anchos de columna proporcionales al CW=195.9
  const C1 = CW / 4;       // ~49mm
  const C2 = CW / 4;
  const C3 = CW / 4;
  const C4 = CW / 4;
  const C12 = CW / 2;      // ~98mm
  const C13 = CW * 0.65;   // ~127mm
  const C23 = CW * 0.35;   // ~69mm

  // ════════════════════════════════════════════════════════════
  // I. DATOS DE LA ALERTA
  // ════════════════════════════════════════════════════════════
  secTit("1. Datos de la Alerta");
fila([
  { w: C13, label: "Código de alerta", valor: alerta.codigo_alerta || tab.alerta?.codigo_alerta, bold: true },
  { w: C23 / 2, label: "Fecha / Hora", valor: fmtF(alerta.fecha_hora) },
  { w: C23 / 2, label: "Prioridad", valor: alerta.prioridad || tab.alerta?.prioridad },
], 11);
fila([
  { w: C13, label: "Nombre del Ciudadano", valor: usuario.nombre_completo || tab.alerta?.usuario_ciudadano?.nombre_completo },
  { w: C23 / 2, label: "Cédula", valor: usuario.ci || tab.alerta?.usuario_ciudadano?.ci },
  { w: C23 / 2, label: "Celular", valor: usuario.celular || tab.alerta?.usuario_ciudadano?.celular },
], 11);
// Lado izquierdo: Ubicación, Latitud, Longitud
const bloqueH = 22;
const leftW = CW * 0.3;
const rightW = CW * 0.7;

// Columna izquierda — 3 celdas apiladas
const ubicParts = (alerta.ubicacion || "").split(",").map(s => s.trim());
const latValor = tab.latitud || ubicParts[0] || "—";
const lngValor = tab.longitud || ubicParts[1] || "—";

celda(ML, Y, leftW, 11, "Latitud", latValor);
celda(ML, Y + 11, leftW, 11, "Longitud", lngValor);

// Columna derecha — descripción alta
doc.setDrawColor(...GBORD);
doc.setLineWidth(0.2);
doc.rect(ML + leftW, Y, rightW, bloqueH);
doc.setFont("helvetica", "bold");
doc.setFontSize(CFG.labelSize);
doc.setTextColor(...GTEXT);
doc.text("DESCRIPCIÓN DEL HECHO", ML + leftW + 1, Y + CFG.labelY);
doc.setFont("helvetica", "normal");
doc.setFontSize(CFG.valorSize);
doc.setTextColor(...NEGRO);
const descLines = doc.splitTextToSize(fmt(alerta.descripcion), rightW - 3);
doc.text(descLines.slice(0, Math.floor((bloqueH - 4) / 3.8)), ML + leftW + 1, Y + CFG.labelY + 5);

Y += bloqueH;

  // ════════════════════════════════════════════════════════════
  // II. CLASIFICACIÓN DEL HECHO
  // ════════════════════════════════════════════════════════════
  secTit("2. Clasificación del Hecho");
  fila([
  { w: C12, label: "Clasificación original (Operador Receptor)", valor: alerta.contravenciones || alerta.delitos || tab.alerta?.contravenciones || tab.alerta?.delitos },
  { w: C12, label: "Clasificación final (Tabulador)", valor: tab.resultado_final, bold: true },
], 11);

  // ════════════════════════════════════════════════════════════
  // 3. DIRECCIÓN Y DESCRIPCIÓN

  // ════════════════════════════════════════════════════════════
  secTit("3. Dirección y descripción");
fila([
  { w: C12, label: "Área Urbana", valor: tab.area_urbana },
  { w: C12, label: "Área Rural", valor: tab.area_rural },
], 15);
fila([
  { w: CW / 3, label: "Comuna", valor: tab.comuna },
  { w: CW / 3, label: "Distrito", valor: tab.distrito },
  { w: CW / 3, label: "Subdistrito", valor: tab.subdistrito },
], 15);
  // ════════════════════════════════════════════════════════════
  // 4. INFORME POLICIAL
  // ════════════════════════════════════════════════════════════
  secTit("4. Informe policial");
fila([
  { w: CW * 0.15, label: "Nº Escalafón", valor: tab.numero_escalafon, bold: true },
  { w: CW * 0.15, label: "Placa Patrulla", valor: tab.placa },
  { w: CW * 0.15, label: "EPI", valor: tab.epi },
  { w: CW * 0.55, label: "Nombre del Patrullero", valor: nombrePatrullero },
], 11);
  celdaTxt("Reporte / Resumen del Patrullero", tab.reporte_patrullero, 18);

  // ════════════════════════════════════════════════════════════
  // V. TABULACIÓN PARA SECRETARÍA
  // ════════════════════════════════════════════════════════════
  secTit("5. Tabulación para Secretaría");
fila([
  { w: CW * 0.4, label: "Protagonistas del hecho", valor: tab.protagonistas },
  { w: CW * 0.3, label: "Remisión / Derivación del caso", valor: tab.remision_caso },
  { w: CW * 0.3, label: "Derivado por", valor: nombreDerivacion }, // ← NUEVA CASILLA
], 15);
  celdaTxt("Resumen administrativo", tab.resumen_administrativo, 23);

  // ════════════════════════════════════════════════════════════
  // VI. CADENA DE GESTIÓN
  // ════════════════════════════════════════════════════════════
  secTit("6. Cadena de Gestión del Caso");
const roles = [
  { rol: "Operador Receptor", nombre: nombreOperador },
  { rol: "Despachador",       nombre: nombreDespachador },
  { rol: "Patrullero",        nombre: nombrePatrullero },
  { rol: "Derivación",        nombre: nombreDerivacion }, // ← NUEVA CASILLA
  { rol: "Tabulador",         nombre: nombreTabulador },
];
const rW = CW / 5; // ← antes /4
  Y += 2;
  roles.forEach((r, i) => {
    const rx = ML + i * rW;
    doc.setDrawColor(...GBORD);
    doc.setLineWidth(0.2);
    doc.rect(rx, Y, rW, CFG.cadenaH);
    doc.setFillColor(...VERDE);
    doc.rect(rx, Y, rW, CFG.cadenaBarH, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(CFG.cadenaRolSize);
    doc.setTextColor(...BLANCO);
    doc.text(r.rol.toUpperCase(), rx + rW / 2, Y + CFG.cadenaBarH / 2 + 1, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(CFG.cadenaNomSize);
    doc.setTextColor(...NEGRO);
    const ls = doc.splitTextToSize(fmt(r.nombre), rW - 2);
    doc.text(ls.slice(0, 2), rx + rW / 2, Y + CFG.cadenaBarH + 5, { align: "center" });
});
Y += CFG.cadenaH;

  // ════════════════════════════════════════════════════════════
  // PIE — siempre al fondo de la hoja
  // ════════════════════════════════════════════════════════════
const PIE_Y = PH - 35;

doc.setDrawColor(...NEGRO);
doc.setLineWidth(0.25);
doc.line(ML, PIE_Y, PW - MR, PIE_Y);

doc.setFont("helvetica", "normal");
doc.setFontSize(4.5);
doc.setTextColor(100, 100, 100);
doc.text(
  "Reporte generado automáticamente por el Sistema de Gestión de alertas ciudadanas de la Central Radio Patrullas - 110  ·  Documento de uso interno y confidencial. Prohibida su reproducción sin autorización institucional.",
  ML, PIE_Y + 2, { align: "left" }
);

// Firma derecha
const firmaDerX = PW - MR - 27.5;
doc.setDrawColor(...NEGRO);
doc.setLineWidth(0.2);
doc.line(PW - MR - 55, PIE_Y + 15, PW - MR, PIE_Y + 15);
doc.setFont("helvetica", "bold");
doc.setFontSize(7);
doc.setTextColor(...NEGRO);
doc.text("SELLO INSTITUCIONAL", firmaDerX, PIE_Y + 18.5, { align: "center" });
doc.setFont("helvetica", "normal");
doc.setFontSize(6);
doc.setTextColor(80, 80, 80);
doc.text("Central de Radio Patrullas - 110", firmaDerX, PIE_Y + 22, { align: "center" });

  const pdfBlob = doc.output("blob");
  return pdfBlob;
}
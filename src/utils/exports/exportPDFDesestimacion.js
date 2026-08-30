import jsPDF from "jspdf";
import QRCode from "qrcode";

export async function exportPDFDesestimacion({
  alerta,
  logoBase64 = null,
  filename = "desestimada.pdf",
  qrData = null,
}) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  const PW = 215.9;
  const PH = 279.4;
  const ML = 18;
  const MR = 18;
  const CW = PW - ML - MR;

  const VERDE  = [71, 75, 41];
  const NEGRO  = [15, 15, 15];
  const BLANCO = [255, 255, 255];
  const GBORD  = [180, 180, 180];
const GTEXT  = [94, 94, 94];

  const fmt = (v) =>
    v !== null && v !== undefined && String(v).trim() !== "" ? String(v) : "—";

  const fmtF = (iso) => {
    if (!iso) return "—";
    try {
      return new Date(iso).toLocaleString("es-ES", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }).replace(",", "");
    } catch (_) { return "—"; }
  };

  // ── QR ──────────────────────────────────────────────────────────────────
  let qrBase64 = null;
  if (qrData) {
    try {
      qrBase64 = await QRCode.toDataURL(qrData, { width: 80, margin: 1 });
    } catch (_) {}
  }

  // ── ENCABEZADO ──────────────────────────────────────────────────────────
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
doc.setFont("helvetica", "normal");
doc.setFontSize(8);  // ← CAMBIA AQUÍ el tamaño de REPORTE DE TABULACIÓN
doc.text("REPORTE DE ALERTA DESESTIMADA", TX, 14.5 + OFFSET_Y);
doc.setTextColor(...NEGRO);
doc.setFont("helvetica", "normal");
doc.setFontSize(7.5);  // ← CAMBIA AQUÍ el tamaño de CÓDIGO · CATEGORÍ
  doc.text(`Código: ${fmt(alerta.codigo_alerta)}`, TX, 19 + OFFSET_Y);

  if (qrBase64) {
    const qrSize = 16;
    doc.addImage(qrBase64, "PNG", PW - MR - qrSize, 4 + OFFSET_Y, qrSize, qrSize);
  }

  const fechaEmision = new Date().toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  }).replace(",", "");

  const rightX = PW - MR - 14 - 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...NEGRO);
  doc.text(`Emisión: ${fechaEmision}`, rightX, 14.5 + OFFSET_Y, { align: "right" });
  doc.text(`Desestimado: ${fmtF(alerta.fecha_desestimo)}`, rightX, 19 + OFFSET_Y, { align: "right" });

  // ── HELPERS ─────────────────────────────────────────────────────────────
  let Y = HDR + 4.5;

  const CFG = {
    filaH: 13,
    celdaTxtH: 18,
    cadenaH: 14,
    cadenaBarH: 5,
    labelSize: 7,
    valorSize: 10,
    secTitSize: 8,
    labelY: 4,
  };

  const secTit = (titulo, color = VERDE) => {
    doc.setFillColor(...color);
    doc.rect(ML, Y, CW, CFG.cadenaBarH, "F");
    doc.setTextColor(...BLANCO);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(CFG.secTitSize);
    doc.text(titulo.toUpperCase(), ML + 2, Y + CFG.cadenaBarH - 1);
    Y += CFG.cadenaBarH;
  };

  const celda = (x, y, w, h, label, valor, bold = false) => {
    doc.setDrawColor(...GBORD);
    doc.setLineWidth(0.2);
    doc.rect(x, y, w, h);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(CFG.labelSize);
    doc.setTextColor(94, 94, 94);
    doc.text(label.toUpperCase(), x + 1, y + CFG.labelY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(CFG.valorSize);
    doc.setTextColor(...NEGRO);
    const lines = doc.splitTextToSize(fmt(valor), w - 2);
    const maxLines = Math.floor((h - 6) / 3.8);
    doc.text(lines.slice(0, maxLines), x + 1, y + CFG.labelY + 5);
  };

  const fila = (celdas, h = CFG.filaH) => {
    let x = ML;
    celdas.forEach((c) => {
      celda(x, Y, c.w, h, c.label, c.valor, c.bold || false);
      x += c.w;
    });
    Y += h;
  };

const celdaTxt = (label, valor, h = CFG.celdaTxtH, color = [94, 94, 94]) => {
    doc.setDrawColor(...GBORD);
    doc.setLineWidth(0.2);
    doc.rect(ML, Y, CW, h);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(CFG.labelSize);
    doc.setTextColor(...color);
    doc.text(label.toUpperCase(), ML + 1, Y + CFG.labelY);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(CFG.valorSize);
    doc.setTextColor(...NEGRO);
    const lines = doc.splitTextToSize(fmt(valor), CW - 3);
    doc.text(lines.slice(0, Math.floor((h - 4) / 3.2)), ML + 1, Y + CFG.labelY + 5);
    Y += h;
  };

  const C12 = CW / 2;
  const C13 = CW * 0.65;
  const C23 = CW * 0.35;

  // ── 1. DATOS DE LA ALERTA ────────────────────────────────────────────────
  secTit("1. Datos de la Alerta");
fila([
  { w: C13, label: "Código de Alerta", valor: alerta.codigo_alerta, bold: true },
  { w: C23, label: "Fecha / Hora", valor: fmtF(alerta.fecha_hora) },
], 11);
  fila([
    { w: C13, label: "Nombre del Ciudadano", valor: alerta.ciudadano },
    { w: C23 / 2, label: "Cédula", valor: alerta.ci },
    { w: C23 / 2, label: "Celular", valor: alerta.celular },
  ], 11);
  fila([
    { w: CW, label: "Ubicación", valor: alerta.ubicacion },
  ], 11);
  celdaTxt("Relato del Hecho", alerta.descripcion, 20, [94, 94, 94]);

  if (alerta.contravenciones || alerta.delitos) {
    fila([
      { w: CW, label: "Clasificación Original", valor: alerta.contravenciones || alerta.delitos },
    ], 11);
  }

  // ── 2. INFORMACIÓN DE DESESTIMACIÓN ──────────────────────────────────────
  secTit("2. Información de Desestimación", VERDE);
  fila([
    { w: C12, label: "Motivo de Desestimación", valor: alerta.motivo_desestimo, bold: true },
    { w: C12, label: "Fecha de Desestimación", valor: fmtF(alerta.fecha_desestimo) },
  ], 13);
  celdaTxt("Justificación Adicional", alerta.justificacion, 20, [94, 94, 94]);

  // ── 3. CADENA DE GESTIÓN ─────────────────────────────────────────────────
  secTit("3. Responsable del Proceso");
  Y += 2;
  const rW = CW / 2;
  const roles = [
    { rol: "Operador que Desestimó", nombre: alerta.nombre_operador_desestimo },
  ];

  // Centrado si solo hay uno
doc.setDrawColor(...GBORD);
doc.setLineWidth(0.2);
doc.rect(ML, Y, CW, CFG.cadenaH);
doc.setFillColor(...VERDE);
doc.rect(ML, Y, CW, CFG.cadenaBarH, "F");
doc.setFont("helvetica", "normal");
doc.setFontSize(6.5);
doc.setTextColor(...BLANCO);
doc.text("OPERADOR QUE DESESTIMÓ", ML + 2, Y + CFG.cadenaBarH / 2 + 1, { align: "left" });
doc.setFont("helvetica", "normal");
doc.setFontSize(8.5);
doc.setTextColor(...NEGRO);
const ls = doc.splitTextToSize(fmt(alerta.nombre_operador_desestimo), CW - 2);
doc.text(ls.slice(0, 2), ML + 2, Y + CFG.cadenaBarH + 5, { align: "left" });
Y += CFG.cadenaH;

  // ── PIE ──────────────────────────────────────────────────────────────────
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

  const firmaDerX = PW - MR - 27.5;
  doc.setDrawColor(...NEGRO);
  doc.setLineWidth(0.2);
  doc.line(PW - MR - 55, PIE_Y + 15, PW - MR, PIE_Y + 15);
  doc.setFont("helvetica", "normal");
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
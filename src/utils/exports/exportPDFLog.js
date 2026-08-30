import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";


// Mismo mapeo de acciones que usa ActividadLog.jsx
const accionMeta = {
  DERIVO: "Derivó",
  CONSULTO: "Consultó",
  VIO: "Vio",
  RECIBIO_INFORME: "Recibió Informe",
  ENVIO_ALERTA_DESPACHO: "Envió Alerta a Despacho",
  ENVIO_ALERTA_TABULADOR: "Envió Alerta a Tabulador",
  OPERADOR: "Operador",
  ADMINISTRADOR: "Administrador",
  SESION: "Sesión",
  REPORTE: "Exportación",
  DESPACHO: "Despacho",
  ASIGNACION: "Asignación",
  TABULACIÓN: "Tabulación",
};

const formatFechaLog = (fechaISO) => {
  if (!fechaISO) return "—";
  const fechaUTC = fechaISO.endsWith("Z") ? fechaISO : fechaISO + "Z";
  return new Date(fechaUTC).toLocaleString("es-BO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/La_Paz",
  });
};

export async function exportPDFLog({
  logs = [],
  titulo = "HISTORIAL DE ACTIVIDAD DEL SISTEMA",
  subtitulo = "",
  nombreAdmin = "ADMINISTRADOR DE TURNO",
  cargoAdmin = "Administrador del Sistema",
  logoBase64 = null,
  filename = "historial-actividad.pdf",
  qrData = null,
}) {
const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "letter" });

const PAGE_W = 279.4;
const PAGE_H = 215.9;
  const MARGIN_L = 18;
  const MARGIN_R = 18;

  const VERDE      = [71, 75, 41];
  const NEGRO      = [15, 15, 15];
  const GRIS_CLARO = [245, 245, 245];
  const BLANCO     = [255, 255, 255];

  const ahora = new Date();
  const fechaFormato = ahora
    .toLocaleString("es-ES", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
      hour12: false,
    })
    .replace(",", "");

  const totalRegistros = logs.length;

  let qrBase64 = null;
  if (qrData) {
    qrBase64 = await QRCode.toDataURL(qrData, { width: 80, margin: 1 });
  }

  // ── Encabezado (idéntico en diseño al de exportPDF.js) ──
  const dibujarEncabezado = () => {
    const HEADER_H = 35;
    const OFFSET_Y = 9;

    doc.setFillColor(...BLANCO);
    doc.rect(0, 0, PAGE_W, HEADER_H, "F");

    doc.setFillColor(...VERDE);
    doc.rect(MARGIN_L, HEADER_H, PAGE_W - MARGIN_L - MARGIN_R, 0.35, "F");

    if (logoBase64) {
      try {
        doc.addImage(logoBase64, "PNG", MARGIN_L, 4 + OFFSET_Y, 16, 16);
      } catch (_) {}
    } else {
      doc.setFillColor(...VERDE);
      doc.roundedRect(MARGIN_L, 3 + OFFSET_Y, 16, 16, 1.5, 1.5, "F");
      doc.setTextColor(...BLANCO);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(5.5);
      doc.text("PB", MARGIN_L + 8, 12 + OFFSET_Y, { align: "center" });
    }

    const textX = MARGIN_L + 20;

    doc.setTextColor(...NEGRO);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("CENTRAL DE RADIO PATRULLAS", textX, 9 + OFFSET_Y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.text(titulo, textX, 14.5 + OFFSET_Y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(subtitulo, textX, 19 + OFFSET_Y);

    if (qrBase64) {
      const qrSize = 16;
      const qrX = PAGE_W - MARGIN_R - qrSize;
      doc.addImage(qrBase64, "PNG", qrX, 4 + OFFSET_Y, qrSize, qrSize);
    }

    const rightX = PAGE_W - MARGIN_R - 14 - 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(`Fecha: ${fechaFormato}`, rightX, 14.5 + OFFSET_Y, { align: "right" });
    doc.text(`Total de registros: ${totalRegistros}`, rightX, 19 + OFFSET_Y, { align: "right" });

    return HEADER_H + 6;
  };

  // ── Pie de página (idéntico al de exportPDF.js) ──
 const dibujarPiePagina = () => {
    const PIE_Y = PAGE_H - 15;

    doc.setDrawColor(...NEGRO);
    doc.setLineWidth(0.25);
    doc.line(MARGIN_L, PIE_Y, PAGE_W - MARGIN_R, PIE_Y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.5);
    doc.setTextColor(100, 100, 100);
    doc.text(
      "Reporte generado automáticamente por el Sistema de Gestión de alertas ciudadanas de la Central Radio Patrullas - 110  ·  Documento de uso interno y confidencial. Prohibida su reproducción sin autorización institucional.",
      MARGIN_L, PIE_Y + 2, { align: "left" }
    );
  };
// ── Datos de la tabla tipo lista ──
  const headers = ["OFICIAL", "ROL", "DESCRIPCIÓN", "ALERTA", "FECHA / HORA"];
  const body = logs.map((log) => [
    log.usuario_nombre || "Desconocido",
    log.usuario_rol || "—",
    log.descripcion || "—",
    log.codigo_alerta || "—",
    formatFechaLog(log.fecha),
  ]);

  const startY = dibujarEncabezado();

autoTable(doc, {
    startY,
    head: [headers],
    body,
    theme: "grid",
    margin: { left: MARGIN_L, right: MARGIN_R, bottom: 12, top: 40 },
    rowPageBreak: "avoid",
    showHead: "everyPage",
    headStyles: {
      fillColor: VERDE,
      textColor: BLANCO,
      fontStyle: "normal",
      fontSize: 8,
      cellPadding: { top: 2, bottom: 2, left: 3, right: 3 },
      halign: "left",
    },
    alternateRowStyles: { fillColor: GRIS_CLARO },
    bodyStyles: {
      fontSize: 7,
      textColor: [30, 30, 30],
      cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
      valign: "middle",
      minCellHeight: 0, 
    },
    columnStyles: {
      0: { fontStyle: "normal", textColor: [...VERDE], cellWidth: 34, halign: "left" }, // OFICIAL
      1: { cellWidth: 26, fontSize: 6.5, halign: "left" },                            // ROL
      2: { cellWidth: "auto", halign: "left" },                                       // DESCRIPCIÓN
      3: { cellWidth: 30, halign: "left" },                                           // ALERTA
      4: { cellWidth: 26, halign: "left" },                                           // FECHA / HORA
    },
    didDrawPage: (data) => {
      dibujarEncabezado();
    },
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    dibujarPiePagina();
  }

const pdfBlob = doc.output("blob");
  return pdfBlob;
}
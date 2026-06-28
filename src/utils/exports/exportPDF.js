import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

export async function exportPDF({
  titulo,
  subtitulo = "",
  headers,
  body,
  nombreAdmin = "ADMINISTRADOR DE TURNO",
  cargoAdmin = "Administrador del Sistema",
  logoBase64 = null,
  filename = "reporte.pdf",
  qrData = null,
  boldFirstCol = true,
}) {
const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

const PAGE_W = 215.9;
  const PAGE_H = 279.4;
  const MARGIN_L = 18;
  const MARGIN_R = 18;

  const VERDE      = [17, 62, 39];
  const NEGRO      = [15, 15, 15];
const GRIS_CLARO = [245, 245, 245];
  const GRIS_MED   = [182, 182, 182];
  const BLANCO     = [255, 255, 255];

  const ahora = new Date();
  const fechaFormato = ahora.toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).replace(",", "");

  const totalRegistros = body.length;

  let qrBase64 = null;
if (qrData) {
  qrBase64 = await QRCode.toDataURL(qrData, {
    width: 120,
    margin: 1,
    color: {
      dark: "#000000",
      light: "#FFFFFF",
    },
  });
}

  const dibujarEncabezado = (pageNum) => {
    // ── Barra superior delgada (negro) ──
    const HEADER_H = 35; 
    const OFFSET_Y = 9; 
    doc.setFillColor(...BLANCO);
    doc.rect(0, 0, PAGE_W, HEADER_H, "F");

    // ── Línea negro: más arriba y más delgada ──
    doc.setFillColor(...VERDE);
    doc.rect(MARGIN_L, HEADER_H, PAGE_W - MARGIN_L - MARGIN_R, 0.35, "F"); 

    // ── Logo ──
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

    // ── Títulos institucionales (junto al logo) ──
    const textX = MARGIN_L + 20;
    doc.setTextColor(...NEGRO);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("CENTRAL DE RADIO PATRULLAS", textX, 10.5 + OFFSET_Y); // CAMBIO: +OFFSET_Y

    doc.setTextColor(...NEGRO);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(titulo, textX, 15 + OFFSET_Y); 

    doc.setTextColor(...GRIS_MED);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(subtitulo, textX, 18 + OFFSET_Y);

// ── QR extremo derecho ──
    if (qrBase64) {
      const qrSize = 16;
      const qrX = PAGE_W - MARGIN_R - qrSize;
      doc.addImage(qrBase64, "PNG", qrX, 4 + OFFSET_Y, qrSize, qrSize);
    }

    // ── Fecha y total (a la izquierda del QR con 10mm de espacio) ──
    const rightX = PAGE_W - MARGIN_R - 14 - 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...NEGRO);
    doc.text(`Fecha: ${fechaFormato}`, rightX, 14.5 + OFFSET_Y, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.text(`Total de registros: ${totalRegistros}`, rightX, 18 + OFFSET_Y, { align: "right" });

    // ── Título del reporte (debajo de la barra) ──
    return HEADER_H + 6;
  };

  const dibujarPiePagina = (pageNum, totalPages) => {
    const PIE_Y = PAGE_H - 35

// Línea separadora
doc.setDrawColor(...NEGRO);
    doc.setLineWidth(0.25);
    doc.line(MARGIN_L, PIE_Y, PAGE_W - MARGIN_R, PIE_Y);

    // ── Confidencial debajo de línea gris ──
    doc.setFont("helvetica", "normal");
    doc.setFontSize(4.5);
    doc.setTextColor(100, 100, 100);
doc.text(
      "Reporte generado automáticamente por el Sistema de Gestión de alertas ciudadanas de la Central Radio Patrullas - 110  ·  Documento de uso interno y confidencial. Prohibida su reproducción sin autorización institucional.",
      MARGIN_L, PIE_Y + 2, { align: "left" }
    );

    // ── Firma izquierda ──
    const firmaIzqX = MARGIN_L + 22;
    doc.setDrawColor(...NEGRO);
    doc.setLineWidth(0.2);
doc.line(MARGIN_L, PIE_Y + 15, MARGIN_L + 55, PIE_Y + 15);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...NEGRO);
    doc.text("ADMINISTRADOR DEL SISTEMA", firmaIzqX, PIE_Y + 18.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(80, 80, 80);
    doc.text(nombreAdmin, firmaIzqX, PIE_Y + 22, { align: "center" });

    // ── Firma derecha (sin círculo, solo texto) ──
    const firmaDerX = PAGE_W - MARGIN_R - 22;
    doc.setDrawColor(...NEGRO);
    doc.setLineWidth(0.2);
    doc.line(PAGE_W - MARGIN_R - 55, PIE_Y + 15, PAGE_W - MARGIN_R, PIE_Y + 15);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(...NEGRO);
    doc.text("SELLO INSTITUCIONAL", firmaDerX, PIE_Y + 18.5, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(80, 80, 80);
    doc.text("Central de Radio Patrullas - 110", firmaDerX, PIE_Y + 22, { align: "center" });

  };

  let pageCount = 1;
  const startY = dibujarEncabezado(pageCount);

  autoTable(doc, {
    startY,
    head: [headers],
    body,
    theme: "grid",
    margin: { left: MARGIN_L, right: MARGIN_R, bottom: 30 },
    headStyles: {
      fillColor: VERDE,
      textColor: BLANCO,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
      halign: "left",
    },
    alternateRowStyles: { fillColor: GRIS_CLARO },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 30, 30],
      cellPadding: { top: 3, bottom: 3, left: 3, right: 3 },
    },
columnStyles: {
      0: { fontStyle: boldFirstCol ? "bold" : "normal", textColor: boldFirstCol ? [...VERDE] : [30, 30, 30] },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) dibujarEncabezado(data.pageNumber);
      pageCount = data.pageNumber;
    },
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    dibujarPiePagina(i, totalPages);
  }

  const pdfBlob = doc.output("blob");
  if (qrData) {
    doc.save(filename);
  }
  return pdfBlob;
}
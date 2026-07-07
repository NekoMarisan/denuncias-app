import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import QRCode from "qrcode";

export async function exportPDFArchivoHis(alertasFiltradas, tabActiva, opciones = {}) {
  const {
    nombreAdmin = "ADMINISTRADOR DE TURNO",
    logoBase64 = null,
    qrData = null,
  } = opciones;

  const esDesestimado = tabActiva === "DESESTIMADO";

  const titulo = esDesestimado
    ? "REPORTE DE ALERTAS DESESTIMADAS"
    : "REPORTE DE ALERTAS FINALIZADAS";

const subtitulo = esDesestimado
    ? "Listado histórico de alertas desestimadas"
    : "Listado histórico de alertas tabuladas";

  const headers = esDesestimado
    ? ["Código", "Ciudadano", "Desestimado", "Motivo", "Operador que desestimó"]
    : ["Código", "Ciudadano", "Fecha", "Categoría", "Patrullero", "Derivación"];

  const body = alertasFiltradas.map((a) => {
    if (esDesestimado) {
      return [
        a.id || "—",
        a.ciudadano || "—",
        a.fecha_desestimo ? new Date(a.fecha_desestimo).toLocaleDateString("es-BO") : "—",
        a.motivoDesestimacion || "—",
        a.nombre_operador_desestimo || "—",
      ];
    }
    // a.incidente ya trae resultado_final si existe (ver historicoAlertas en Tabulacion.jsx)
    return [
      a.id || "—",
      a.ciudadano || "—",
      a.fecha || "—",
      a.incidente || "—",
      a.patrullero || "—",
      a.remision_caso || "—",
    ];
  });

  const filename = `historico_${tabActiva.toLowerCase()}_${Date.now()}.pdf`;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "letter" });

  const PAGE_W = 215.9;
  const PAGE_H = 279.4;
  const MARGIN_L = 18;
  const MARGIN_R = 18;

  const VERDE      = [17, 62, 39];
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

  const totalRegistros = body.length;

  let qrBase64 = null;
  if (qrData) {
    try {
      qrBase64 = await QRCode.toDataURL(qrData, { width: 80, margin: 1 });
    } catch (_) {}
  }

  const dibujarEncabezado = () => {
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
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("CENTRAL DE RADIO PATRULLAS", textX, 9 + OFFSET_Y);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text(titulo, textX, 14.5 + OFFSET_Y);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.text(subtitulo, textX, 19 + OFFSET_Y);

    // ── QR extremo derecho ──
    if (qrBase64) {
      const qrSize = 16;
      const qrX = PAGE_W - MARGIN_R - qrSize;
      doc.addImage(qrBase64, "PNG", qrX, 4 + OFFSET_Y, qrSize, qrSize);
    }

    // ── Fecha y total ──
    const rightX = PAGE_W - MARGIN_R - 14 - 6;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...NEGRO);
    doc.text(`Fecha: ${fechaFormato}`, rightX, 14.5 + OFFSET_Y, { align: "right" });
    doc.text(`Total de registros: ${totalRegistros}`, rightX, 19 + OFFSET_Y, { align: "right" });

    // ── Título del reporte (debajo de la barra) ──
    return HEADER_H + 6;
  };

  const dibujarPiePagina = () => {
    const PIE_Y = PAGE_H - 35;

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

    // ── Sello institucional (a la derecha) ──
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

  const startY = dibujarEncabezado();

autoTable(doc, {
    startY,
    head: [headers],
    body,
    theme: "grid",
    margin: { left: MARGIN_L, right: MARGIN_R, bottom: 30, top: 40 },  // ← agregado top: 40
    rowPageBreak: "avoid",                                             // ← agregado
    showHead: "everyPage",                                             // ← agregado (repite la fila verde en cada hoja)
    headStyles: {
      fillColor: VERDE,
      textColor: BLANCO,
      fontStyle: "bold",
      fontSize: 8,
      cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
      halign: "left",
    },
    alternateRowStyles: { fillColor: GRIS_CLARO },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 30, 30],
      cellPadding: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
      minCellHeight: 0,
    },
    columnStyles: {
      0: { fontStyle: "bold", textColor: [...VERDE] },
    },
    didDrawPage: (data) => {
      dibujarEncabezado();   // ← ahora se dibuja SIEMPRE, no solo si pageNumber > 1 (igual que en exportPDFLog.js)
    },
  });

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    dibujarPiePagina();
  }

const pdfBlob = doc.output("blob");
  if (!qrData) {
    doc.save(filename);
  }
  return pdfBlob;
}
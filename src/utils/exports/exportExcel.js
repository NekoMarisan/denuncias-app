import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export async function exportExcel({
  titulo,
  headers,
  body,
  nombreAdmin = "ADMINISTRADOR DE TURNO",
  filename = "reporte.xlsx",
}) {
  const ahora = new Date();
  const fechaFormato = ahora.toLocaleString("es-ES", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
    hour12: false,
  }).replace(",", "");

  const VERDE       = "FF113E27";
  const VERDE_CLARO = "FFE8F0EB";
  const BLANCO      = "FFFFFFFF";
  const GRIS        = "FFF5F5F5";
  const NEGRO       = "FF0F0F0F";
  const GRIS_TEXTO  = "FF555555";

  const wb = new ExcelJS.Workbook();
  wb.creator = "Central Radio Patrullas";
  const ws = wb.addWorksheet("Reporte", { views: [{ showGridLines: false }] });

 // Anchos de columna — se calcularán dinámicamente abajo
  ws.columns = headers.map(() => ({ width: 20 }));

  const aplicarFila = (valores, opciones = {}) => {
    const fila = ws.addRow(valores);
    fila.eachCell({ includeEmpty: true }, (cell) => {
      if (opciones.bgColor) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: opciones.bgColor } };
      if (opciones.fontColor || opciones.bold || opciones.size) {
        cell.font = {
          name: "Arial",
          color: { argb: opciones.fontColor || NEGRO },
          bold: opciones.bold || false,
          size: opciones.size || 10,
        };
      }
      cell.alignment = { vertical: "middle", horizontal: opciones.align || "left", wrapText: false };
      cell.border = opciones.border ? {
        top: { style: "thin", color: { argb: "FFD0D0D0" } },
        bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
        left: { style: "thin", color: { argb: "FFD0D0D0" } },
        right: { style: "thin", color: { argb: "FFD0D0D0" } },
      } : {};
    });
    fila.height = opciones.height || 18;
    return fila;
  };

  // ── Encabezado institucional ──
  aplicarFila(["CENTRAL DE RADIO PATRULLAS - 110"], {
    bgColor: VERDE, fontColor: BLANCO, bold: true, size: 13, align: "center", height: 28,
  });

  // ── Línea vacía ──
  ws.addRow([]);

  // ── Título del reporte ──
  aplicarFila([titulo], {
    bgColor: VERDE_CLARO, fontColor: NEGRO, bold: true, size: 11, align: "left", height: 22,
  });

  ws.addRow([]);

  // ── Metadata ──
  aplicarFila(["Fecha de emisión:", fechaFormato], { fontColor: NEGRO, size: 9, height: 15, align: "left" });
  aplicarFila(["Generado por:", nombreAdmin],       { fontColor: NEGRO, size: 9, height: 15, align: "left" });
  aplicarFila(["Total de registros:", body.length], {  fontColor: NEGRO, size: 9, height: 15, align: "left" });

  ws.addRow([]);

  // ── Headers de tabla ──
  aplicarFila(headers, {
    bgColor: VERDE, fontColor: BLANCO, bold: true, size: 10,
    align: "left", border: true, height: 22,
  });

// ── Filas de datos ──
  body.forEach((row, i) => {
    const fila = ws.addRow(row);
    fila.height = 18;
    fila.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? BLANCO : GRIS } };
      cell.font = {
        name: "Arial",
        color: { argb: NEGRO },
        bold: colNumber === 1, // solo primera columna (escalafón) en negrita
        size: 9.5,
      };
      cell.alignment = { vertical: "middle", horizontal: "left", wrapText: false };
      cell.border = {
        top: { style: "thin", color: { argb: "FFD0D0D0" } },
        bottom: { style: "thin", color: { argb: "FFD0D0D0" } },
        left: { style: "thin", color: { argb: "FFD0D0D0" } },
        right: { style: "thin", color: { argb: "FFD0D0D0" } },
      };
    });
  });

  ws.addRow([]);

  // Fusionar encabezados en toda la fila
  const totalCols = headers.length;
  ws.mergeCells(1, 1, 1, totalCols); 
  ws.mergeCells(3, 1, 3, totalCols);

 // Autoajustar ancho de columnas según contenido
  const metadataCol1 = ["Fecha de emisión:", "Generado por:", "Total de registros:"];
  const metadataCol2 = [fechaFormato, nombreAdmin, String(body.length)];

  ws.columns.forEach((col, colIndex) => {
    let maxLen = headers[colIndex] ? headers[colIndex].length : 10;

    // incluir metadata en columnas 0 y 1
    if (colIndex === 0) metadataCol1.forEach(v => { if (v.length > maxLen) maxLen = v.length; });
    if (colIndex === 1) metadataCol2.forEach(v => { if (v.length > maxLen) maxLen = v.length; });

    body.forEach((row) => {
      const val = row[colIndex] ? String(row[colIndex]).length : 0;
      if (val > maxLen) maxLen = val;
    });
    col.width = Math.min(Math.max(maxLen + 4, 12), 50);
  });

  const buffer = await wb.xlsx.writeBuffer();
  saveAs(new Blob([buffer], { type: "application/octet-stream" }), filename);
}
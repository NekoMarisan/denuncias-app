import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

// Mismo mapeo de acciones que usa ActividadLog.jsx / exportPDFLog.js
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

export async function exportExcelLog({
  logs = [],
  titulo = "HISTORIAL DE ACTIVIDAD DEL SISTEMA",
  nombreAdmin = "ADMINISTRADOR DE TURNO",
  filename = null,
} = {}) {
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

  const headers = ["OFICIAL", "ROL", "DESCRIPCIÓN", "ALERTA", "FECHA / HORA"];

  // Índice (0-based) de la columna que debe hacer wrap de texto
  const DESCRIPCION_COL_INDEX = 2; // "DESCRIPCIÓN"

  // Ancho máximo que puede alcanzar la columna DESCRIPCIÓN antes de que el
  // texto empiece a bajar de línea en vez de seguir estirando la columna.
  // Cambia solo este número si la quieres más angosta o más ancha.
  const DESCRIPCION_MAX_WIDTH = 45;

  const body = logs.map((log) => [
    log.usuario_nombre || "Desconocido",
    log.usuario_rol || "—",
    log.descripcion || "—",
    log.codigo_alerta || "—",
    formatFechaLog(log.fecha),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Central Radio Patrullas";
  const ws = wb.addWorksheet("Reporte", { views: [{ showGridLines: false }] });

  ws.pageSetup = {
    orientation: "landscape",
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    horizontalCentered: true,
    margins: {
      left: 0.7, right: 0.7,
      top: 0.75, bottom: 0.75,
      header: 0.3, footer: 0.3,
    },
  };

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
      cell.alignment = { vertical: "middle", horizontal: opciones.align || "left", wrapText: opciones.wrap || false };
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

  ws.addRow([]);

  // ── Título del reporte ──
  aplicarFila([titulo], {
    bgColor: VERDE_CLARO, fontColor: NEGRO, bold: true, size: 11, align: "left", height: 22,
  });

  ws.addRow([]);

  // ── Metadata ──
  aplicarFila(["Fecha de emisión:", fechaFormato], { fontColor: NEGRO, size: 9, height: 15, align: "left" });
  aplicarFila(["Generado por:", nombreAdmin],       { fontColor: NEGRO, size: 9, height: 15, align: "left" });
  aplicarFila(["Total de registros:", body.length], { fontColor: NEGRO, size: 9, height: 15, align: "left" });

  ws.addRow([]);

  // ── Headers de tabla (con wrap por si el título de columna es largo) ──
  const headerRow = aplicarFila(headers, {
    bgColor: VERDE, fontColor: BLANCO, bold: true, size: 10,
    align: "left", border: true, height: 26, wrap: true,
  });

  // ── Helper: calcula cuántas líneas ocupará un texto según el ancho de columna ──
  // (aproximación: ExcelJS/Excel no calculan auto-height con wrapText, hay que estimarlo)
  const calcularLineasNecesarias = (texto, anchoColumna) => {
    if (!texto) return 1;
    // ~1.8 caracteres por unidad de ancho de columna es una aproximación razonable
    // con fuente Arial 9.5 (ajusta este factor si ves que corta mal)
    const caracteresPorLinea = Math.max(Math.floor(anchoColumna * 1.8), 1);
    const lineasPorSaltosManual = String(texto).split("\n");
    let totalLineas = 0;
    lineasPorSaltosManual.forEach((linea) => {
      totalLineas += Math.max(Math.ceil(linea.length / caracteresPorLinea), 1);
    });
    return totalLineas;
  };

  // ── Filas de datos ──
  const ALTURA_LINEA = 14; // alto aproximado por línea de texto (ajusta si usas otro tamaño de fuente)
  const ALTURA_MIN = 28;   // misma altura fija que tenías antes cuando el texto no necesita bajar de línea

  body.forEach((row, i) => {
    const fila = ws.addRow(row);

    // Calculamos cuántas líneas necesitará la columna DESCRIPCIÓN
    const lineasNecesarias = calcularLineasNecesarias(row[DESCRIPCION_COL_INDEX], DESCRIPCION_MAX_WIDTH);
    fila.height = Math.max(lineasNecesarias * ALTURA_LINEA, ALTURA_MIN);

    fila.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const colIndex = colNumber - 1; // eachCell es 1-based
      cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: i % 2 === 0 ? BLANCO : GRIS } };
      cell.font = {
        name: "Arial",
        color: { argb: NEGRO },
        bold: colNumber === 1, // solo primera columna (OFICIAL) en negrita
        size: 9.5,
      };
      cell.alignment = {
        vertical: "middle",
        horizontal: "left",
        wrapText: colIndex === DESCRIPCION_COL_INDEX, // solo DESCRIPCIÓN hace wrap
      };
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

  // Área de impresión exacta (evita columnas vacías de más)
  const ultimaFila = ws.lastRow.number;
  const letraUltimaCol = ws.getColumn(totalCols).letter;
  ws.pageSetup.printArea = `A1:${letraUltimaCol}${ultimaFila}`;

  // Repite la fila verde de títulos en cada página si el reporte ocupa más de una hoja
  wb.definedNames.add(`'${ws.name}'!$${headerRow.number}:$${headerRow.number}`, "Print_Titles");

  // ── Autoajustar ancho de columnas según contenido (igual que el original) ──
  // Aquí es donde se define el ancho final de CADA columna.
  const metadataCol1 = ["Fecha de emisión:", "Generado por:", "Total de registros:"];
  const metadataCol2 = [fechaFormato, nombreAdmin, String(body.length)];

  ws.columns.forEach((col, colIndex) => {
    let maxLen = headers[colIndex] ? headers[colIndex].length : 10;

    if (colIndex === 0) metadataCol1.forEach(v => { if (v.length > maxLen) maxLen = v.length; });
    if (colIndex === 1) metadataCol2.forEach(v => { if (v.length > maxLen) maxLen = v.length; });

    body.forEach((row) => {
      const val = row[colIndex] ? String(row[colIndex]).length : 0;
      if (val > maxLen) maxLen = val;
    });

    if (colIndex === DESCRIPCION_COL_INDEX) {
      // DESCRIPCIÓN: no crece sin límite, se topa en DESCRIPCION_MAX_WIDTH y el resto hace wrap
      col.width = Math.min(maxLen + 4, DESCRIPCION_MAX_WIDTH);
    } else {
      // Resto de columnas: mismo autofit que el original (mín 12, máx 50)
      col.width = Math.min(Math.max(maxLen + 4, 12), 50);
    }
  });

  const buffer = await wb.xlsx.writeBuffer();
  const finalFilename = filename || `historial_actividad_${Date.now()}.xlsx`;
  saveAs(new Blob([buffer], { type: "application/octet-stream" }), finalFilename);
}
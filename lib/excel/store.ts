import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import ExcelJS from "exceljs";
import type { Category } from "@/lib/types";

export const DATA_DIR = path.join(process.cwd(), "data");
export const FILE_PATH = path.join(DATA_DIR, "finanzas.xlsx");
export const BACKUP_DIR = path.join(DATA_DIR, "backups");
const TMP_PATH = path.join(DATA_DIR, ".finanzas.tmp.xlsx");
const MAX_BACKUPS = 10;

export const SHEETS = {
  movimientos: "Movimientos",
  categorias: "Categorías",
  presupuestos: "Presupuestos",
  tareas: "Tareas",
  config: "Config",
} as const;

export const HEADERS: Record<string, string[]> = {
  [SHEETS.movimientos]: [
    "ID",
    "Fecha",
    "Tipo",
    "Categoría",
    "Descripción",
    "Monto",
    "Método de pago",
    "Contraparte",
    "Notas",
    "Creado",
  ],
  [SHEETS.categorias]: ["ID", "Nombre", "Tipo", "Color", "Activa"],
  [SHEETS.presupuestos]: ["ID", "Mes", "Categoría", "Monto"],
  [SHEETS.tareas]: [
    "ID",
    "Título",
    "Descripción",
    "Columna",
    "Prioridad",
    "Fecha límite",
    "Orden",
    "Creado",
    "Actualizado",
  ],
  [SHEETS.config]: ["Clave", "Valor"],
};

const WIDTHS: Record<string, number[]> = {
  [SHEETS.movimientos]: [38, 12, 12, 20, 40, 16, 18, 24, 40, 22],
  [SHEETS.categorias]: [38, 22, 12, 12, 10],
  [SHEETS.presupuestos]: [38, 12, 22, 16],
  [SHEETS.tareas]: [38, 36, 46, 14, 12, 14, 8, 22, 22],
  [SHEETS.config]: [24, 60],
};

const DEFAULT_CATEGORIES: Omit<Category, "id">[] = [
  { nombre: "Ventas", tipo: "Ingreso", color: "#059669", activa: true },
  { nombre: "Servicios", tipo: "Ingreso", color: "#2563eb", activa: true },
  { nombre: "Otros ingresos", tipo: "Ingreso", color: "#7c3aed", activa: true },
  { nombre: "Nómina", tipo: "Egreso", color: "#dc2626", activa: true },
  { nombre: "Arriendo", tipo: "Egreso", color: "#ea580c", activa: true },
  { nombre: "Servicios públicos", tipo: "Egreso", color: "#ca8a04", activa: true },
  { nombre: "Proveedores", tipo: "Egreso", color: "#0891b2", activa: true },
  { nombre: "Impuestos", tipo: "Egreso", color: "#475569", activa: true },
  { nombre: "Transporte", tipo: "Egreso", color: "#9333ea", activa: true },
  { nombre: "Marketing", tipo: "Egreso", color: "#db2777", activa: true },
  { nombre: "Otros gastos", tipo: "Egreso", color: "#94a3b8", activa: true },
];

/* ------------------------------------------------------------------ */
/* Helpers de Excel                                                    */
/* ------------------------------------------------------------------ */

export function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (value instanceof Date) {
    return new Date(
      value.getTime() - value.getTimezoneOffset() * 60_000,
    )
      .toISOString()
      .slice(0, 10);
  }
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText.map((part) => part.text).join("");
    }
    if ("result" in value) return String(value.result ?? "");
    if ("error" in value) return "";
  }
  return String(value);
}

export function cellNumber(value: ExcelJS.CellValue): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const text = cellText(value).replace(/\s/g, "").replace(/,/g, ".");
  const parsed = Number(text);
  return Number.isFinite(parsed) ? parsed : 0;
}

function cellBool(value: ExcelJS.CellValue): boolean {
  const text = cellText(value).trim().toLowerCase();
  return text === "true" || text === "sí" || text === "si" || text === "1";
}

export function readSheet(ws: ExcelJS.Worksheet): Record<string, string>[] {
  const headers = new Map<string, number>();
  ws.getRow(1).eachCell((cell, col) => {
    headers.set(cellText(cell.value).trim().toLowerCase(), col);
  });

  const rows: Record<string, string>[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const record: Record<string, string> = {};
    headers.forEach((col, header) => {
      record[header] = cellText(row.getCell(col).value);
    });
    const hasData = Object.values(record).some((v) => v !== "");
    if (hasData) rows.push(record);
  });
  return rows;
}

export function replaceRows(
  ws: ExcelJS.Worksheet,
  rows: (string | number | boolean | null)[][],
) {
  // ExcelJS tiene un bug al eliminar bloques de filas al final de una hoja
  // (spliceRows no limpia el rango correctamente). Reconstruimos la hoja
  // completa conservando su posición y estilos para evitar duplicados.
  const wb = ws.workbook;
  const name = ws.name;
  const orderNo = (ws as unknown as { orderNo?: number }).orderNo;
  const headers = HEADERS[name];

  wb.removeWorksheet(ws.id);
  const fresh = wb.addWorksheet(name);
  if (typeof orderNo === "number") {
    (fresh as unknown as { orderNo?: number }).orderNo = orderNo;
  }

  if (headers) {
    fresh.addRow(headers);
    styleSheet(fresh, headers, WIDTHS[name] ?? []);
  }
  rows.forEach((values) => fresh.addRow(values));
}

function styleSheet(ws: ExcelJS.Worksheet, headers: string[], widths: number[]) {
  const header = ws.getRow(1);
  header.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
  header.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF065F46" },
  };
  header.alignment = { vertical: "middle" };
  header.height = 22;

  headers.forEach((_, index) => {
    ws.getColumn(index + 1).width = widths[index] ?? 18;
  });

  ws.views = [{ state: "frozen", ySplit: 1 }];
  ws.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: headers.length },
  };
}

/* ------------------------------------------------------------------ */
/* Creación y lectura del libro                                        */
/* ------------------------------------------------------------------ */

function createWorkbook(): ExcelJS.Workbook {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Panel Finanzas + Kanban";
  wb.created = new Date();

  Object.entries(HEADERS).forEach(([name, headers]) => {
    const ws = wb.addWorksheet(name);
    ws.addRow(headers);
    styleSheet(ws, headers, WIDTHS[name] ?? []);
  });

  const categories = wb.getWorksheet(SHEETS.categorias)!;
  DEFAULT_CATEGORIES.forEach((category) => {
    categories.addRow([
      crypto.randomUUID(),
      category.nombre,
      category.tipo,
      category.color,
      category.activa,
    ]);
  });

  const config = wb.getWorksheet(SHEETS.config)!;
  config.addRow(["moneda", "COP"]);
  config.addRow(["metodosPago", "Efectivo,Transferencia,Tarjeta,Otro"]);
  config.addRow(["version", "1"]);

  return wb;
}

const globalLock = globalThis as unknown as {
  __finanzasLock?: Promise<unknown>;
};

function withLock<T>(fn: () => Promise<T>): Promise<T> {
  const previous = globalLock.__finanzasLock ?? Promise.resolve();
  const next = previous.then(fn, fn);
  globalLock.__finanzasLock = next.catch(() => undefined);
  return next;
}

async function createIfMissing(): Promise<void> {
  try {
    await fs.access(FILE_PATH);
    return;
  } catch {
    // El archivo no existe: se crea.
  }
  await fs.mkdir(DATA_DIR, { recursive: true });
  const wb = createWorkbook();
  await wb.xlsx.writeFile(FILE_PATH);
}

export async function ensureWorkbook(): Promise<void> {
  await withLock(createIfMissing);
}

export async function readWorkbook(): Promise<ExcelJS.Workbook> {
  await ensureWorkbook();
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(FILE_PATH);
  return wb;
}

async function createBackup(): Promise<void> {
  try {
    await fs.access(FILE_PATH);
  } catch {
    return;
  }
  await fs.mkdir(BACKUP_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  await fs.copyFile(FILE_PATH, path.join(BACKUP_DIR, `finanzas-${stamp}.xlsx`));

  const files = (await fs.readdir(BACKUP_DIR))
    .filter((file) => file.endsWith(".xlsx"))
    .sort()
    .reverse();
  await Promise.all(
    files.slice(MAX_BACKUPS).map((file) =>
      fs.unlink(path.join(BACKUP_DIR, file)).catch(() => undefined),
    ),
  );
}

export async function mutateWorkbook<T>(
  fn: (wb: ExcelJS.Workbook) => Promise<T> | T,
): Promise<T> {
  return withLock(async () => {
    await createIfMissing();
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(FILE_PATH);
    const result = await fn(wb);
    await createBackup();
    await wb.xlsx.writeFile(TMP_PATH);
    await fs.rename(TMP_PATH, FILE_PATH);
    return result;
  });
}

export async function backupNow(): Promise<string> {
  return withLock(async () => {
    await createIfMissing();
    await createBackup();
    const files = (await fs.readdir(BACKUP_DIR))
      .filter((file) => file.endsWith(".xlsx"))
      .sort()
      .reverse();
    return files[0] ?? "";
  });
}

export function friendlyExcelError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/EBUSY|EPERM|locked|being used/i.test(message)) {
    return "El archivo Excel está abierto o bloqueado. Ciérralo en Excel y vuelve a intentar.";
  }
  return "No se pudo guardar en el archivo Excel. Revisa que no esté abierto en otro programa.";
}

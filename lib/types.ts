export type MovementType = "Ingreso" | "Egreso";

export interface Category {
  id: string;
  nombre: string;
  tipo: MovementType;
  color: string;
  activa: boolean;
}

export interface Movement {
  id: string;
  fecha: string; // YYYY-MM-DD
  tipo: MovementType;
  categoria: string;
  descripcion: string;
  monto: number;
  metodoPago: string;
  contraparte: string;
  notas: string;
  creado: string;
}

export interface Budget {
  id: string;
  mes: string; // YYYY-MM
  categoria: string;
  monto: number;
}

export type TaskColumn = "pendiente" | "progreso" | "revision" | "hecho";
export type Priority = "Alta" | "Media" | "Baja";

export interface Task {
  id: string;
  titulo: string;
  descripcion: string;
  columna: TaskColumn;
  prioridad: Priority;
  fechaLimite: string; // YYYY-MM-DD o vacío
  orden: number;
  creado: string;
  actualizado: string;
}

export interface AppConfig {
  moneda: string;
  metodosPago: string[];
  version: string;
}

export const TASK_COLUMNS: { key: TaskColumn; label: string }[] = [
  { key: "pendiente", label: "Pendiente" },
  { key: "progreso", label: "En progreso" },
  { key: "revision", label: "En revisión" },
  { key: "hecho", label: "Hecho" },
];

export const PRIORITIES: Priority[] = ["Alta", "Media", "Baja"];

export const TASK_COLUMN_KEYS = TASK_COLUMNS.map((c) => c.key);

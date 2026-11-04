import { z } from "zod";
import { PRIORITIES, TASK_COLUMN_KEYS } from "./types";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida");

const monthString = z
  .string()
  .regex(/^\d{4}-\d{2}$/, "Mes inválido");

export const movementSchema = z.object({
  id: z.string().optional(),
  fecha: dateString,
  tipo: z.enum(["Ingreso", "Egreso"]),
  categoria: z.string().min(1, "Selecciona una categoría"),
  descripcion: z.string().trim().min(1, "La descripción es obligatoria").max(160),
  monto: z.coerce.number().positive("El monto debe ser mayor que cero"),
  metodoPago: z.string().trim().max(60).optional().default(""),
  contraparte: z.string().trim().max(120).optional().default(""),
  notas: z.string().trim().max(500).optional().default(""),
});

export type MovementInput = z.infer<typeof movementSchema>;

export const budgetSchema = z.object({
  id: z.string().optional(),
  mes: monthString,
  categoria: z.string().min(1, "Selecciona una categoría"),
  monto: z.coerce.number().min(0, "El monto no puede ser negativo"),
});

export type BudgetInput = z.infer<typeof budgetSchema>;

export const categorySchema = z.object({
  id: z.string().optional(),
  nombre: z.string().trim().min(1, "El nombre es obligatorio").max(60),
  tipo: z.enum(["Ingreso", "Egreso"]),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido")
    .default("#64748b"),
  activa: z.boolean().optional().default(true),
});

export type CategoryInput = z.infer<typeof categorySchema>;

export const taskSchema = z.object({
  id: z.string().optional(),
  titulo: z.string().trim().min(1, "El título es obligatorio").max(140),
  descripcion: z.string().trim().max(1000).optional().default(""),
  columna: z.enum(TASK_COLUMN_KEYS as [string, ...string[]]),
  prioridad: z.enum(PRIORITIES as [string, ...string[]]),
  fechaLimite: z
    .string()
    .regex(/^(\d{4}-\d{2}-\d{2})?$/, "Fecha inválida")
    .optional()
    .default(""),
});

export type TaskInput = z.infer<typeof taskSchema>;

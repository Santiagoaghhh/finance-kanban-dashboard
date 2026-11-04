"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { taskSchema } from "@/lib/schemas";
import { deleteTask, saveTask, updateTaskOrder } from "@/lib/excel/repo";
import { friendlyExcelError } from "@/lib/excel/store";
import type { ActionResult } from "@/lib/action-result";
import { TASK_COLUMN_KEYS } from "@/lib/types";

const orderingSchema = z.record(
  z.enum(TASK_COLUMN_KEYS as [string, ...string[]]),
  z.array(z.string()),
);

export async function saveTaskAction(input: unknown): Promise<ActionResult> {
  const parsed = taskSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisa los datos de la tarea.",
    };
  }

  try {
    await saveTask(parsed.data);
    revalidatePath("/kanban");
    revalidatePath("/");
    return { ok: true, message: "Tarea guardada." };
  } catch (error) {
    return { ok: false, error: friendlyExcelError(error) };
  }
}

export async function deleteTaskAction(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Tarea inválida." };
  try {
    await deleteTask(id);
    revalidatePath("/kanban");
    revalidatePath("/");
    return { ok: true, message: "Tarea eliminada." };
  } catch (error) {
    return { ok: false, error: friendlyExcelError(error) };
  }
}

export async function updateTaskOrderAction(
  ordering: Record<string, string[]>,
): Promise<ActionResult> {
  const parsed = orderingSchema.safeParse(ordering);
  if (!parsed.success) return { ok: false, error: "Orden inválido." };

  try {
    await updateTaskOrder(parsed.data);
    revalidatePath("/kanban");
    revalidatePath("/");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyExcelError(error) };
  }
}

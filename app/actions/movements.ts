"use server";

import { revalidatePath } from "next/cache";
import { movementSchema } from "@/lib/schemas";
import { deleteMovement, saveMovement } from "@/lib/excel/repo";
import { friendlyExcelError } from "@/lib/excel/store";
import type { ActionResult } from "@/lib/action-result";

function refresh() {
  revalidatePath("/");
  revalidatePath("/finanzas/movimientos");
  revalidatePath("/finanzas/presupuestos");
  revalidatePath("/finanzas/reportes");
}

export async function saveMovementAction(input: unknown): Promise<ActionResult> {
  const parsed = movementSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisa los datos del movimiento.",
    };
  }

  try {
    await saveMovement(parsed.data);
    refresh();
    return { ok: true, message: "Movimiento guardado." };
  } catch (error) {
    return { ok: false, error: friendlyExcelError(error) };
  }
}

export async function deleteMovementAction(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Movimiento inválido." };
  try {
    await deleteMovement(id);
    refresh();
    return { ok: true, message: "Movimiento eliminado." };
  } catch (error) {
    return { ok: false, error: friendlyExcelError(error) };
  }
}

"use server";

import { revalidatePath } from "next/cache";
import { budgetSchema } from "@/lib/schemas";
import { copyBudgets, deleteBudget, saveBudget } from "@/lib/excel/repo";
import { friendlyExcelError } from "@/lib/excel/store";
import type { ActionResult } from "@/lib/action-result";

function refresh() {
  revalidatePath("/finanzas/presupuestos");
  revalidatePath("/finanzas/reportes");
  revalidatePath("/");
}

export async function saveBudgetAction(input: unknown): Promise<ActionResult> {
  const parsed = budgetSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisa los datos del presupuesto.",
    };
  }

  try {
    await saveBudget(parsed.data);
    refresh();
    return { ok: true, message: "Presupuesto guardado." };
  } catch (error) {
    return { ok: false, error: friendlyExcelError(error) };
  }
}

export async function deleteBudgetAction(id: string): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Presupuesto inválido." };
  try {
    await deleteBudget(id);
    refresh();
    return { ok: true, message: "Presupuesto eliminado." };
  } catch (error) {
    return { ok: false, error: friendlyExcelError(error) };
  }
}

export async function copyBudgetsAction(
  fromMonth: string,
  toMonth: string,
): Promise<ActionResult> {
  if (!/^\d{4}-\d{2}$/.test(fromMonth) || !/^\d{4}-\d{2}$/.test(toMonth)) {
    return { ok: false, error: "Mes inválido." };
  }
  try {
    const count = await copyBudgets(fromMonth, toMonth);
    refresh();
    return {
      ok: true,
      message:
        count > 0
          ? `Se copiaron ${count} presupuestos.`
          : "El mes anterior no tenía presupuestos.",
    };
  } catch (error) {
    return { ok: false, error: friendlyExcelError(error) };
  }
}

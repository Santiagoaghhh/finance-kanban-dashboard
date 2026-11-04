"use server";

import { revalidatePath } from "next/cache";
import { backupNow } from "@/lib/excel/store";
import { savePaymentMethods } from "@/lib/excel/repo";
import { friendlyExcelError } from "@/lib/excel/store";
import type { ActionResult } from "@/lib/action-result";

export async function savePaymentMethodsAction(
  methods: string[],
): Promise<ActionResult> {
  try {
    await savePaymentMethods(methods);
    revalidatePath("/configuracion");
    revalidatePath("/finanzas/movimientos");
    return { ok: true, message: "Métodos de pago actualizados." };
  } catch (error) {
    return { ok: false, error: friendlyExcelError(error) };
  }
}

export async function backupNowAction(): Promise<ActionResult> {
  try {
    const file = await backupNow();
    return {
      ok: true,
      message: file
        ? `Respaldo creado: ${file}`
        : "No se pudo crear el respaldo.",
    };
  } catch (error) {
    return { ok: false, error: friendlyExcelError(error) };
  }
}

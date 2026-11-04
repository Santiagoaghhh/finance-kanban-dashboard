"use server";

import { revalidatePath } from "next/cache";
import { categorySchema } from "@/lib/schemas";
import { getCategories, saveCategory, setCategoryActive } from "@/lib/excel/repo";
import { friendlyExcelError } from "@/lib/excel/store";
import type { ActionResult } from "@/lib/action-result";

function refresh() {
  revalidatePath("/configuracion");
  revalidatePath("/finanzas/movimientos");
  revalidatePath("/finanzas/presupuestos");
  revalidatePath("/finanzas/reportes");
  revalidatePath("/");
}

export async function saveCategoryAction(input: unknown): Promise<ActionResult> {
  const parsed = categorySchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Revisa los datos de la categoría.",
    };
  }

  try {
    const categories = await getCategories();
    const duplicate = categories.find(
      (category) =>
        category.id !== parsed.data.id &&
        category.nombre.toLowerCase() === parsed.data.nombre.toLowerCase(),
    );
    if (duplicate) {
      return { ok: false, error: "Ya existe una categoría con ese nombre." };
    }

    await saveCategory(parsed.data);
    refresh();
    return { ok: true, message: "Categoría guardada." };
  } catch (error) {
    return { ok: false, error: friendlyExcelError(error) };
  }
}

export async function toggleCategoryAction(
  id: string,
  activa: boolean,
): Promise<ActionResult> {
  if (!id) return { ok: false, error: "Categoría inválida." };
  try {
    await setCategoryActive(id, activa);
    refresh();
    return { ok: true };
  } catch (error) {
    return { ok: false, error: friendlyExcelError(error) };
  }
}

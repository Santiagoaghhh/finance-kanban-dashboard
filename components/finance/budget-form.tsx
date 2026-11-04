"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { saveBudgetAction } from "@/app/actions/budgets";
import type { Category } from "@/lib/types";
import { monthLabel } from "@/lib/format";

export function BudgetForm({
  open,
  onClose,
  onSaved,
  month,
  categories,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  month: string;
  categories: Category[];
  initial?: { id?: string; categoria: string; monto: number } | null;
}) {
  const [categoria, setCategoria] = useState("");
  const [monto, setMonto] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const options = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.tipo === "Egreso" &&
          (category.activa || category.nombre === initial?.categoria),
      ),
    [categories, initial?.categoria],
  );

  useEffect(() => {
    if (!open) return;
    setError("");
    setCategoria(initial?.categoria ?? "");
    setMonto(initial && initial.monto > 0 ? String(initial.monto) : "");
  }, [open, initial]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const result = await saveBudgetAction({
      id: initial?.id,
      mes: month,
      categoria,
      monto,
    });
    setSaving(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onSaved();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial?.id ? "Editar presupuesto" : "Nuevo presupuesto"}
      description={`Presupuesto de ${monthLabel(month)}`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Categoría">
          <Select
            value={categoria}
            onChange={(event) => setCategoria(event.target.value)}
            disabled={Boolean(initial?.id)}
            required
          >
            <option value="">Selecciona una categoría</option>
            {options.map((category) => (
              <option key={category.id} value={category.nombre}>
                {category.nombre}
              </option>
            ))}
          </Select>
        </Field>
        <Field
          label="Monto presupuestado (COP)"
          hint="Puedes ajustarlo en cualquier momento."
        >
          <Input
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="0"
            value={monto}
            onChange={(event) => setMonto(event.target.value)}
            required
          />
        </Field>

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Guardar
          </Button>
        </div>
      </form>
    </Modal>
  );
}

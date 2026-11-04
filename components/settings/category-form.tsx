"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select } from "@/components/ui/input";
import { saveCategoryAction } from "@/app/actions/categories";
import type { Category, MovementType } from "@/lib/types";

export function CategoryForm({
  open,
  onClose,
  onSaved,
  initial,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Category | null;
}) {
  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState<MovementType>("Egreso");
  const [color, setColor] = useState("#64748b");
  const [activa, setActiva] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    setNombre(initial?.nombre ?? "");
    setTipo(initial?.tipo ?? "Egreso");
    setColor(initial?.color ?? "#64748b");
    setActiva(initial?.activa ?? true);
  }, [open, initial]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const result = await saveCategoryAction({
      id: initial?.id,
      nombre,
      tipo,
      color,
      activa,
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
      title={initial ? "Editar categoría" : "Nueva categoría"}
      description="Las categorías organizan tus movimientos y presupuestos."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Nombre">
          <Input
            value={nombre}
            onChange={(event) => setNombre(event.target.value)}
            placeholder="Ej. Seguros"
            maxLength={60}
            required
            autoFocus
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Tipo">
            <Select
              value={tipo}
              onChange={(event) => setTipo(event.target.value as MovementType)}
            >
              <option value="Ingreso">Ingreso</option>
              <option value="Egreso">Egreso</option>
            </Select>
          </Field>
          <Field label="Color">
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={color}
                onChange={(event) => setColor(event.target.value)}
                className="h-10 w-12 cursor-pointer rounded-lg border border-slate-200 bg-white p-1"
                aria-label="Color de la categoría"
              />
              <Input
                value={color}
                onChange={(event) => setColor(event.target.value)}
                pattern="^#[0-9a-fA-F]{6}$"
                className="font-mono text-xs"
              />
            </div>
          </Field>
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-600">
          <input
            type="checkbox"
            checked={activa}
            onChange={(event) => setActiva(event.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-200"
          />
          Categoría activa (disponible al registrar movimientos)
        </label>

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

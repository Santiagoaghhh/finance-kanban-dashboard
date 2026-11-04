"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { saveMovementAction } from "@/app/actions/movements";
import type { Category, Movement, MovementType } from "@/lib/types";
import { todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MovementForm({
  open,
  onClose,
  onSaved,
  categories,
  methods,
  initial,
  defaultType = "Egreso",
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  categories: Category[];
  methods: string[];
  initial?: Movement | null;
  defaultType?: MovementType;
}) {
  const [tipo, setTipo] = useState<MovementType>(defaultType);
  const [fecha, setFecha] = useState(todayISO());
  const [categoria, setCategoria] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto] = useState("");
  const [metodoPago, setMetodoPago] = useState(methods[0] ?? "");
  const [contraparte, setContraparte] = useState("");
  const [notas, setNotas] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const availableCategories = useMemo(
    () =>
      categories.filter(
        (category) =>
          category.tipo === tipo &&
          (category.activa || category.nombre === initial?.categoria),
      ),
    [categories, tipo, initial?.categoria],
  );

  useEffect(() => {
    if (!open) return;
    setError("");
    if (initial) {
      setTipo(initial.tipo);
      setFecha(initial.fecha);
      setCategoria(initial.categoria);
      setDescripcion(initial.descripcion);
      setMonto(String(initial.monto));
      setMetodoPago(initial.metodoPago || methods[0] || "");
      setContraparte(initial.contraparte);
      setNotas(initial.notas);
    } else {
      setTipo(defaultType);
      setFecha(todayISO());
      setCategoria("");
      setDescripcion("");
      setMonto("");
      setMetodoPago(methods[0] ?? "");
      setContraparte("");
      setNotas("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initial]);

  useEffect(() => {
    if (!open) return;
    if (!availableCategories.some((category) => category.nombre === categoria)) {
      setCategoria(availableCategories[0]?.nombre ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tipo, open]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const result = await saveMovementAction({
      id: initial?.id,
      fecha,
      tipo,
      categoria,
      descripcion,
      monto,
      metodoPago,
      contraparte,
      notas,
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
      title={initial ? "Editar movimiento" : "Nuevo movimiento"}
      description="Los datos se guardan directamente en el archivo Excel."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-2 rounded-lg bg-slate-100 p-1">
          {(["Ingreso", "Egreso"] as MovementType[]).map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => setTipo(option)}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                tipo === option
                  ? option === "Ingreso"
                    ? "bg-white text-emerald-700 shadow-sm"
                    : "bg-white text-rose-700 shadow-sm"
                  : "text-slate-500 hover:text-slate-800",
              )}
            >
              {option}
            </button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Fecha">
            <Input
              type="date"
              value={fecha}
              onChange={(event) => setFecha(event.target.value)}
              required
            />
          </Field>
          <Field label="Monto (COP)">
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
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Categoría">
            <Select
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              required
            >
              {availableCategories.length === 0 ? (
                <option value="">Sin categorías disponibles</option>
              ) : null}
              {availableCategories.map((category) => (
                <option key={category.id} value={category.nombre}>
                  {category.nombre}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Método de pago">
            <Select
              value={metodoPago}
              onChange={(event) => setMetodoPago(event.target.value)}
            >
              {methods.map((method) => (
                <option key={method} value={method}>
                  {method}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Descripción">
          <Input
            placeholder="Ej. Pago proveedor de insumos"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            maxLength={160}
            required
          />
        </Field>

        <Field label="Contraparte" hint="Proveedor, cliente o persona relacionada.">
          <Input
            placeholder="Opcional"
            value={contraparte}
            onChange={(event) => setContraparte(event.target.value)}
            maxLength={120}
          />
        </Field>

        <Field label="Notas">
          <Textarea
            placeholder="Opcional"
            value={notas}
            onChange={(event) => setNotas(event.target.value)}
            maxLength={500}
          />
        </Field>

        {error ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</p>
        ) : null}

        <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
          <Button type="button" variant="secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button type="submit" disabled={saving || availableCategories.length === 0}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {initial ? "Guardar cambios" : "Guardar movimiento"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

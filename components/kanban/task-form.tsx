"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/input";
import { saveTaskAction } from "@/app/actions/tasks";
import { PRIORITIES, TASK_COLUMNS } from "@/lib/types";
import type { Task, TaskColumn } from "@/lib/types";

export function TaskForm({
  open,
  onClose,
  onSaved,
  initial,
  defaultColumn = "pendiente",
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  initial?: Task | null;
  defaultColumn?: TaskColumn;
}) {
  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [columna, setColumna] = useState<TaskColumn>(defaultColumn);
  const [prioridad, setPrioridad] = useState("Media");
  const [fechaLimite, setFechaLimite] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError("");
    if (initial) {
      setTitulo(initial.titulo);
      setDescripcion(initial.descripcion);
      setColumna(initial.columna);
      setPrioridad(initial.prioridad);
      setFechaLimite(initial.fechaLimite);
    } else {
      setTitulo("");
      setDescripcion("");
      setColumna(defaultColumn);
      setPrioridad("Media");
      setFechaLimite("");
    }
  }, [open, initial, defaultColumn]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    const result = await saveTaskAction({
      id: initial?.id,
      titulo,
      descripcion,
      columna,
      prioridad,
      fechaLimite,
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
      title={initial ? "Editar tarea" : "Nueva tarea"}
      description="Organiza tus pendientes en el tablero."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Título">
          <Input
            placeholder="Ej. Revisar facturas del mes"
            value={titulo}
            onChange={(event) => setTitulo(event.target.value)}
            maxLength={140}
            required
            autoFocus
          />
        </Field>

        <Field label="Descripción">
          <Textarea
            placeholder="Detalles opcionales"
            value={descripcion}
            onChange={(event) => setDescripcion(event.target.value)}
            maxLength={1000}
          />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Columna">
            <Select
              value={columna}
              onChange={(event) => setColumna(event.target.value as TaskColumn)}
            >
              {TASK_COLUMNS.map((column) => (
                <option key={column.key} value={column.key}>
                  {column.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Prioridad">
            <Select
              value={prioridad}
              onChange={(event) => setPrioridad(event.target.value)}
            >
              {PRIORITIES.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Fecha límite" hint="Opcional. Las tareas vencidas se resaltan.">
          <Input
            type="date"
            value={fechaLimite}
            onChange={(event) => setFechaLimite(event.target.value)}
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
            {initial ? "Guardar cambios" : "Crear tarea"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  Database,
  HardDriveDownload,
  Pencil,
  Plus,
  Power,
  Save,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CategoryForm } from "@/components/settings/category-form";
import { toggleCategoryAction } from "@/app/actions/categories";
import {
  backupNowAction,
  savePaymentMethodsAction,
} from "@/app/actions/settings";
import type { Category } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SettingsView({
  categories,
  methods,
  dataPath,
  counts,
}: {
  categories: Category[];
  methods: string[];
  dataPath: string;
  counts: { movements: number; budgets: number; tasks: number };
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [methodsList, setMethodsList] = useState(methods);
  const [newMethod, setNewMethod] = useState("");
  const [message, setMessage] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [savingMethods, setSavingMethods] = useState(false);
  const [backingUp, setBackingUp] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setFormOpen(true);
  }

  async function toggle(category: Category) {
    setBusyId(category.id);
    const result = await toggleCategoryAction(category.id, !category.activa);
    setBusyId(null);
    if (!result.ok) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    router.refresh();
  }

  function addMethod() {
    const value = newMethod.trim();
    if (!value) return;
    if (
      methodsList.some(
        (method) => method.toLowerCase() === value.toLowerCase(),
      )
    ) {
      setNewMethod("");
      return;
    }
    setMethodsList([...methodsList, value]);
    setNewMethod("");
  }

  async function saveMethods() {
    setSavingMethods(true);
    setMessage(null);
    const result = await savePaymentMethodsAction(methodsList);
    setSavingMethods(false);
    setMessage(
      result.ok
        ? { type: "ok", text: result.message ?? "Métodos de pago actualizados." }
        : { type: "error", text: result.error },
    );
    if (result.ok) router.refresh();
  }

  async function createBackup() {
    setBackingUp(true);
    setMessage(null);
    const result = await backupNowAction();
    setBackingUp(false);
    setMessage(
      result.ok
        ? { type: "ok", text: result.message ?? "Respaldo creado." }
        : { type: "error", text: result.error },
    );
  }

  const order = { Ingreso: 0, Egreso: 1 };
  const sorted = [...categories].sort(
    (a, b) =>
      order[a.tipo] - order[b.tipo] ||
      Number(b.activa) - Number(a.activa) ||
      a.nombre.localeCompare(b.nombre),
  );

  return (
    <div>
      <PageHeader
        title="Configuración"
        description="Categorías, métodos de pago y respaldos de tu información."
      />

      {message ? (
        <p
          className={cn(
            "mb-4 rounded-lg px-3 py-2 text-xs",
            message.type === "ok"
              ? "bg-emerald-50 text-emerald-700"
              : "bg-rose-50 text-rose-700",
          )}
        >
          {message.text}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Categorías"
            subtitle={`${categories.filter((category) => category.activa).length} activas de ${categories.length}`}
            action={
              <Button size="sm" onClick={openNew}>
                <Plus className="h-3.5 w-3.5" /> Nueva
              </Button>
            }
          />
          <ul className="divide-y divide-slate-50">
            {sorted.map((category) => (
              <li
                key={category.id}
                className={cn(
                  "flex items-center justify-between gap-3 px-5 py-3",
                  !category.activa && "bg-slate-50/40",
                )}
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: category.color }}
                  />
                  <div className="min-w-0">
                    <p
                      className={cn(
                        "truncate text-sm font-medium",
                        category.activa ? "text-slate-800" : "text-slate-400",
                      )}
                    >
                      {category.nombre}
                    </p>
                    <div className="mt-0.5 flex items-center gap-1.5">
                      <Badge tone={category.tipo === "Ingreso" ? "emerald" : "rose"}>
                        {category.tipo}
                      </Badge>
                      {!category.activa ? <Badge tone="slate">Inactiva</Badge> : null}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(category)}
                    className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    aria-label="Editar categoría"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(category)}
                    disabled={busyId === category.id}
                    className={cn(
                      "rounded-lg p-1.5 transition-colors disabled:opacity-40",
                      category.activa
                        ? "text-slate-400 hover:bg-amber-50 hover:text-amber-600"
                        : "text-slate-400 hover:bg-emerald-50 hover:text-emerald-600",
                    )}
                    aria-label={category.activa ? "Desactivar" : "Activar"}
                    title={category.activa ? "Desactivar" : "Activar"}
                  >
                    <Power className="h-3.5 w-3.5" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader
              title="Métodos de pago"
              subtitle="Opciones disponibles al registrar movimientos."
            />
            <div className="space-y-3 p-5">
              <div className="flex flex-wrap gap-1.5">
                {methodsList.length ? (
                  methodsList.map((method) => (
                    <span
                      key={method}
                      className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-1 pl-2.5 pr-1 text-[11px] font-medium text-slate-600"
                    >
                      {method}
                      <button
                        type="button"
                        onClick={() =>
                          setMethodsList(
                            methodsList.filter((item) => item !== method),
                          )
                        }
                        className="rounded-full p-0.5 text-slate-400 hover:bg-slate-200 hover:text-slate-700"
                        aria-label={`Quitar ${method}`}
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))
                ) : (
                  <p className="text-xs text-slate-400">Agrega al menos un método.</p>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  value={newMethod}
                  onChange={(event) => setNewMethod(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addMethod();
                    }
                  }}
                  placeholder="Ej. PSE"
                  maxLength={60}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  onClick={addMethod}
                  className="shrink-0 px-3"
                  aria-label="Agregar método"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={saveMethods}
                disabled={savingMethods || methodsList.length === 0}
                size="sm"
                className="w-full"
              >
                <Save className="h-3.5 w-3.5" />
                {savingMethods ? "Guardando…" : "Guardar métodos"}
              </Button>
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Datos y respaldos"
              subtitle="Tu información vive en un archivo Excel local."
            />
            <div className="space-y-3 p-5">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-slate-50 px-2 py-2">
                  <p className="text-base font-semibold text-slate-800">
                    {counts.movements}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Movimientos
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-2">
                  <p className="text-base font-semibold text-slate-800">
                    {counts.budgets}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Presupuestos
                  </p>
                </div>
                <div className="rounded-lg bg-slate-50 px-2 py-2">
                  <p className="text-base font-semibold text-slate-800">
                    {counts.tasks}
                  </p>
                  <p className="text-[10px] uppercase tracking-wide text-slate-400">
                    Tareas
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2 rounded-lg border border-slate-100 bg-slate-50/60 p-2.5">
                <Database className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                <p className="break-all font-mono text-[10px] leading-relaxed text-slate-500">
                  {dataPath}
                </p>
              </div>

              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={createBackup}
                disabled={backingUp}
              >
                <HardDriveDownload className="h-3.5 w-3.5" />
                {backingUp ? "Creando respaldo…" : "Crear respaldo ahora"}
              </Button>

              <div className="flex items-start gap-2 text-[11px] leading-relaxed text-slate-400">
                <Archive className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <p>
                  Se guardan automáticamente los últimos 10 respaldos en{" "}
                  <code className="text-slate-500">data/backups/</code>. Para
                  restaurar uno, cierra la app y reemplaza el archivo principal.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-slate-400">
        Consejo: usa la app para editar los datos. Si abres el Excel directamente,
        mantén los encabezados y evita modificar el archivo mientras la aplicación
        guarda.
      </p>

      <CategoryForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          setMessage({ type: "ok", text: "Categoría guardada." });
          router.refresh();
        }}
        initial={editing}
      />
    </div>
  );
}

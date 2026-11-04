"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  CheckCircle2,
  GripVertical,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge, priorityTone } from "@/components/ui/badge";
import { TaskForm } from "@/components/kanban/task-form";
import { deleteTaskAction, updateTaskOrderAction } from "@/app/actions/tasks";
import { TASK_COLUMNS, TASK_COLUMN_KEYS } from "@/lib/types";
import type { Task, TaskColumn } from "@/lib/types";
import { formatShortDate, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

const columnAccent: Record<TaskColumn, string> = {
  pendiente: "bg-slate-400",
  progreso: "bg-blue-500",
  revision: "bg-purple-500",
  hecho: "bg-emerald-500",
};

function groupTasks(tasks: Task[]): Record<TaskColumn, Task[]> {
  const grouped = {
    pendiente: [],
    progreso: [],
    revision: [],
    hecho: [],
  } as Record<TaskColumn, Task[]>;
  [...tasks]
    .sort((a, b) => a.orden - b.orden)
    .forEach((task) => grouped[task.columna].push(task));
  return grouped;
}

export function KanbanBoard({
  tasks,
  initialNew,
}: {
  tasks: Task[];
  initialNew: boolean;
}) {
  const router = useRouter();
  const [columns, setColumns] = useState<Record<TaskColumn, Task[]>>(() =>
    groupTasks(tasks),
  );
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<TaskColumn | null>(null);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(initialNew);
  const [editing, setEditing] = useState<Task | null>(null);
  const [presetColumn, setPresetColumn] = useState<TaskColumn>("pendiente");
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    setColumns(groupTasks(tasks));
  }, [tasks]);

  const totals = useMemo(() => {
    const done = columns.hecho.length;
    const total = TASK_COLUMN_KEYS.reduce(
      (sum, key) => sum + columns[key].length,
      0,
    );
    return { done, total, open: total - done };
  }, [columns]);

  const today = todayISO();

  function openNew(column: TaskColumn = "pendiente") {
    setEditing(null);
    setPresetColumn(column);
    setFormOpen(true);
  }

  function openEdit(task: Task) {
    setEditing(task);
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    if (initialNew) router.replace("/kanban");
  }

  function moveTask(id: string, target: TaskColumn, beforeId?: string) {
    if (beforeId === id) return;
    const dragged = TASK_COLUMN_KEYS.flatMap((key) => columns[key]).find(
      (task) => task.id === id,
    );
    if (!dragged) return;

    const next = {} as Record<TaskColumn, Task[]>;
    TASK_COLUMN_KEYS.forEach((key) => {
      next[key] = columns[key].filter((task) => task.id !== id);
    });

    const updated: Task = { ...dragged, columna: target };
    const targetList = [...next[target]];
    if (beforeId) {
      const index = targetList.findIndex((task) => task.id === beforeId);
      if (index >= 0) targetList.splice(index, 0, updated);
      else targetList.push(updated);
    } else {
      targetList.push(updated);
    }
    next[target] = targetList;

    setColumns(next);
    void persist(next);
  }

  async function persist(next: Record<TaskColumn, Task[]>) {
    setError("");
    const ordering = Object.fromEntries(
      TASK_COLUMN_KEYS.map((key) => [key, next[key].map((task) => task.id)]),
    );
    const result = await updateTaskOrderAction(ordering);
    if (!result.ok) {
      setError(result.error);
      setColumns(groupTasks(tasks));
    }
  }

  async function handleDelete(task: Task) {
    const confirmed = window.confirm(`¿Eliminar la tarea "${task.titulo}"?`);
    if (!confirmed) return;
    setBusyId(task.id);
    const result = await deleteTaskAction(task.id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  function handleDrop(
    event: React.DragEvent,
    target: TaskColumn,
    beforeId?: string,
  ) {
    event.preventDefault();
    event.stopPropagation();
    const id = event.dataTransfer.getData("text/plain") || draggingId;
    setDraggingId(null);
    setDragOver(null);
    if (id) moveTask(id, target, beforeId);
  }

  return (
    <div>
      <PageHeader
        title="Kanban"
        description={`${totals.open} ${totals.open === 1 ? "pendiente" : "pendientes"} · ${totals.done} ${totals.done === 1 ? "completada" : "completadas"}`}
        actions={
          <Button onClick={() => openNew()}>
            <Plus className="h-4 w-4" /> Nueva tarea
          </Button>
        }
      />

      {error ? (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      ) : null}

      {totals.total === 0 ? (
        <Card className="mb-4 border-brand-200 bg-brand-50/60 p-5">
          <p className="text-sm font-semibold text-brand-900">
            Tu tablero está vacío
          </p>
          <p className="mt-1 text-xs leading-relaxed text-brand-800/80">
            Crea tu primera tarea y arrástrala entre las columnas para organizar
            tus pendientes.
          </p>
          <Button className="mt-3" size="sm" onClick={() => openNew()}>
            <Plus className="h-3.5 w-3.5" /> Crear tarea
          </Button>
        </Card>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        {TASK_COLUMNS.map((column) => {
          const items = columns[column.key];
          return (
            <div
              key={column.key}
              data-column={column.key}
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(column.key);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  setDragOver((current) =>
                    current === column.key ? null : current,
                  );
                }
              }}
              onDrop={(event) => handleDrop(event, column.key)}
              className={cn(
                "flex min-h-[420px] flex-col rounded-xl border bg-slate-100/60 p-2.5 transition-colors",
                dragOver === column.key
                  ? "border-brand-400 bg-brand-50/50"
                  : "border-slate-200",
              )}
            >
              <div className="mb-2.5 flex items-center justify-between px-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn("h-2 w-2 rounded-full", columnAccent[column.key])}
                  />
                  <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    {column.label}
                  </h2>
                  <span className="rounded-full bg-white px-1.5 py-0.5 text-[10px] font-medium text-slate-500 ring-1 ring-slate-200">
                    {items.length}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => openNew(column.key)}
                  className="rounded-md p-1 text-slate-400 transition-colors hover:bg-white hover:text-slate-700"
                  aria-label={`Agregar tarea en ${column.label}`}
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="flex flex-1 flex-col gap-2">
                {items.map((task) => {
                  const overdue =
                    task.fechaLimite !== "" &&
                    task.fechaLimite < today &&
                    task.columna !== "hecho";
                  return (
                    <article
                      key={task.id}
                      draggable
                      data-task-id={task.id}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", task.id);
                        event.dataTransfer.effectAllowed = "move";
                        setDraggingId(task.id);
                      }}
                      onDragEnd={() => {
                        setDraggingId(null);
                        setDragOver(null);
                      }}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        setDragOver(column.key);
                      }}
                      onDrop={(event) => handleDrop(event, column.key, task.id)}
                      className={cn(
                        "group cursor-grab rounded-lg border border-slate-200 bg-white p-3 shadow-sm transition-shadow hover:shadow-md active:cursor-grabbing",
                        draggingId === task.id && "opacity-40",
                      )}
                    >
                      <div className="flex items-start justify-between gap-1">
                        <div className="flex min-w-0 items-start gap-1.5">
                          <GripVertical className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-300" />
                          <h3
                            className={cn(
                              "text-xs font-semibold leading-snug text-slate-800",
                              task.columna === "hecho" && "text-slate-400 line-through",
                            )}
                          >
                            {task.titulo}
                          </h3>
                        </div>
                        <div className="flex shrink-0 gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                          <button
                            type="button"
                            onClick={() => openEdit(task)}
                            className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Editar tarea"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(task)}
                            disabled={busyId === task.id}
                            className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                            aria-label="Eliminar tarea"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>

                      {task.descripcion ? (
                        <p className="mt-1.5 line-clamp-2 pl-5 text-[11px] leading-relaxed text-slate-500">
                          {task.descripcion}
                        </p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap items-center gap-1.5 pl-5">
                        <Badge tone={priorityTone(task.prioridad)}>
                          {task.prioridad}
                        </Badge>
                        {task.fechaLimite ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 text-[10px]",
                              overdue
                                ? "font-medium text-rose-600"
                                : "text-slate-400",
                            )}
                          >
                            <CalendarDays className="h-3 w-3" />
                            {overdue ? "Vencida · " : ""}
                            {formatShortDate(task.fechaLimite)}
                          </span>
                        ) : null}
                        {task.columna === "hecho" ? (
                          <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-500" />
                        ) : null}
                      </div>
                    </article>
                  );
                })}

                {items.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-white/40 px-3 py-8 text-center">
                    <p className="text-[11px] text-slate-400">
                      {dragOver === column.key
                        ? "Suelta aquí"
                        : "Sin tareas. Arrastra una o crea una nueva."}
                    </p>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => openNew(column.key)}
                    className="mt-auto flex items-center justify-center gap-1 rounded-lg border border-dashed border-transparent py-2 text-[11px] text-slate-400 transition-colors hover:border-slate-200 hover:bg-white hover:text-slate-600"
                  >
                    <Plus className="h-3 w-3" /> Agregar tarea
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <TaskForm
        open={formOpen}
        onClose={closeForm}
        onSaved={() => {
          setFormOpen(false);
          if (initialNew) router.replace("/kanban");
          else router.refresh();
        }}
        initial={editing}
        defaultColumn={presetColumn}
      />
    </div>
  );
}

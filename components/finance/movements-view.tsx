"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Download,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { MovementForm } from "@/components/finance/movement-form";
import { deleteMovementAction } from "@/app/actions/movements";
import type { Category, Movement, MovementType } from "@/lib/types";
import { formatCOP, todayISO } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 25;

export function MovementsView({
  movements,
  categories,
  methods,
  initialOpen,
}: {
  movements: Movement[];
  categories: Category[];
  methods: string[];
  initialOpen: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(initialOpen);
  const [editing, setEditing] = useState<Movement | null>(null);
  const [query, setQuery] = useState("");
  const [tipo, setTipo] = useState<"todos" | MovementType>("todos");
  const [categoria, setCategoria] = useState("todas");
  const [desde, setDesde] = useState("");
  const [hasta, setHasta] = useState("");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return movements.filter((movement) => {
      if (tipo !== "todos" && movement.tipo !== tipo) return false;
      if (categoria !== "todas" && movement.categoria !== categoria) return false;
      if (desde && movement.fecha < desde) return false;
      if (hasta && movement.fecha > hasta) return false;
      if (normalized) {
        const haystack = [
          movement.descripcion,
          movement.categoria,
          movement.contraparte,
          movement.notas,
        ]
          .join(" ")
          .toLowerCase();
        if (!haystack.includes(normalized)) return false;
      }
      return true;
    });
  }, [movements, query, tipo, categoria, desde, hasta]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [query, tipo, categoria, desde, hasta]);

  const totals = useMemo(() => {
    const ingresos = filtered
      .filter((movement) => movement.tipo === "Ingreso")
      .reduce((sum, movement) => sum + movement.monto, 0);
    const egresos = filtered
      .filter((movement) => movement.tipo === "Egreso")
      .reduce((sum, movement) => sum + movement.monto, 0);
    return { ingresos, egresos, utilidad: ingresos - egresos };
  }, [filtered]);

  const hasFilters =
    query !== "" || tipo !== "todos" || categoria !== "todas" || desde !== "" || hasta !== "";

  function openNew() {
    setEditing(null);
    setError("");
    setOpen(true);
  }

  function openEdit(movement: Movement) {
    setEditing(movement);
    setError("");
    setOpen(true);
  }

  function closeModal() {
    setOpen(false);
    if (initialOpen) router.replace("/finanzas/movimientos");
  }

  async function handleDelete(movement: Movement) {
    const confirmed = window.confirm(
      `¿Eliminar "${movement.descripcion}" por ${formatCOP(movement.monto)}? Esta acción no se puede deshacer.`,
    );
    if (!confirmed) return;
    setBusyId(movement.id);
    const result = await deleteMovementAction(movement.id);
    setBusyId(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  function exportCsv() {
    const header = [
      "Fecha",
      "Tipo",
      "Categoría",
      "Descripción",
      "Monto",
      "Método de pago",
      "Contraparte",
      "Notas",
    ];
    const escape = (value: string | number) =>
      `"${String(value).replace(/"/g, '""')}"`;
    const lines = [
      header.join(";"),
      ...filtered.map((movement) =>
        [
          movement.fecha,
          movement.tipo,
          movement.categoria,
          movement.descripcion,
          movement.monto,
          movement.metodoPago,
          movement.contraparte,
          movement.notas,
        ]
          .map(escape)
          .join(";"),
      ),
    ];
    const blob = new Blob([`\uFEFFsep=;\n${lines.join("\n")}`], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `movimientos-${todayISO()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <PageHeader
        title="Movimientos"
        description="Ingresos y egresos registrados en tu empresa."
        actions={
          <>
            <Button variant="secondary" onClick={exportCsv} disabled={!filtered.length}>
              <Download className="h-4 w-4" /> Exportar CSV
            </Button>
            <Button onClick={openNew}>
              <Plus className="h-4 w-4" /> Nuevo movimiento
            </Button>
          </>
        }
      />

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Ingresos (filtro)
          </p>
          <p className="mt-0.5 text-lg font-semibold text-emerald-600">
            {formatCOP(totals.ingresos)}
          </p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Egresos (filtro)
          </p>
          <p className="mt-0.5 text-lg font-semibold text-rose-600">
            {formatCOP(totals.egresos)}
          </p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Utilidad (filtro)
          </p>
          <p
            className={cn(
              "mt-0.5 text-lg font-semibold",
              totals.utilidad >= 0 ? "text-slate-900" : "text-rose-600",
            )}
          >
            {formatCOP(totals.utilidad)}
          </p>
        </Card>
      </div>

      <Card className="mb-4 p-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por descripción, contraparte, nota…"
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-auto">
            <Select
              value={tipo}
              onChange={(event) => setTipo(event.target.value as typeof tipo)}
              aria-label="Tipo"
            >
              <option value="todos">Todos los tipos</option>
              <option value="Ingreso">Ingresos</option>
              <option value="Egreso">Egresos</option>
            </Select>
            <Select
              value={categoria}
              onChange={(event) => setCategoria(event.target.value)}
              aria-label="Categoría"
            >
              <option value="todas">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category.id} value={category.nombre}>
                  {category.nombre}
                </option>
              ))}
            </Select>
            <Input
              type="date"
              value={desde}
              onChange={(event) => setDesde(event.target.value)}
              aria-label="Desde"
            />
            <Input
              type="date"
              value={hasta}
              onChange={(event) => setHasta(event.target.value)}
              aria-label="Hasta"
            />
          </div>
          {hasFilters ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setQuery("");
                setTipo("todos");
                setCategoria("todas");
                setDesde("");
                setHasta("");
              }}
            >
              <X className="h-3.5 w-3.5" /> Limpiar
            </Button>
          ) : null}
        </div>
      </Card>

      {error ? (
        <p className="mb-4 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
          {error}
        </p>
      ) : null}

      <Card>
        {filtered.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title={movements.length ? "Sin resultados" : "Todavía no hay movimientos"}
              description={
                movements.length
                  ? "Prueba con otros filtros o limpia la búsqueda."
                  : "Registra tu primer ingreso o gasto para empezar a ver reportes."
              }
              action={
                !movements.length ? (
                  <Button size="sm" onClick={openNew}>
                    <Plus className="h-3.5 w-3.5" /> Registrar movimiento
                  </Button>
                ) : undefined
              }
            />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-2.5 font-medium">Fecha</th>
                    <th className="px-4 py-2.5 font-medium">Descripción</th>
                    <th className="px-4 py-2.5 font-medium">Categoría</th>
                    <th className="px-4 py-2.5 font-medium">Método</th>
                    <th className="px-4 py-2.5 text-right font-medium">Monto</th>
                    <th className="px-4 py-2.5 text-right font-medium">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, visible).map((movement) => {
                    const category = categories.find(
                      (item) => item.nombre === movement.categoria,
                    );
                    return (
                      <tr
                        key={movement.id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">
                          {movement.fecha}
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">
                            {movement.descripcion}
                          </p>
                          {movement.contraparte ? (
                            <p className="text-[11px] text-slate-400">
                              {movement.contraparte}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1.5 text-xs text-slate-600">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: category?.color ?? "#94a3b8" }}
                            />
                            {movement.categoria}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">
                          {movement.metodoPago || "—"}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-right">
                          <span
                            className={cn(
                              "text-sm font-semibold",
                              movement.tipo === "Ingreso"
                                ? "text-emerald-600"
                                : "text-rose-600",
                            )}
                          >
                            {movement.tipo === "Ingreso" ? "+" : "−"}
                            {formatCOP(movement.monto)}
                          </span>
                          <span className="ml-2">
                            <Badge
                              tone={movement.tipo === "Ingreso" ? "emerald" : "rose"}
                            >
                              {movement.tipo}
                            </Badge>
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => openEdit(movement)}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
                              aria-label="Editar"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDelete(movement)}
                              disabled={busyId === movement.id}
                              className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                              aria-label="Eliminar"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {visible < filtered.length ? (
              <div className="flex justify-center border-t border-slate-100 p-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setVisible((current) => current + PAGE_SIZE)}
                >
                  Ver {Math.min(PAGE_SIZE, filtered.length - visible)} más de{" "}
                  {filtered.length}
                </Button>
              </div>
            ) : (
              <p className="border-t border-slate-100 px-4 py-2.5 text-center text-[11px] text-slate-400">
                {filtered.length} movimiento{filtered.length === 1 ? "" : "s"}
              </p>
            )}
          </>
        )}
      </Card>

      <MovementForm
        open={open}
        onClose={closeModal}
        onSaved={() => {
          setOpen(false);
          if (initialOpen) router.replace("/finanzas/movimientos");
          else router.refresh();
        }}
        categories={categories}
        methods={methods}
        initial={editing}
      />
    </div>
  );
}

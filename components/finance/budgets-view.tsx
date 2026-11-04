"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BudgetForm } from "@/components/finance/budget-form";
import { BudgetBars } from "@/components/charts/finance-charts";
import {
  copyBudgetsAction,
  deleteBudgetAction,
} from "@/app/actions/budgets";
import type { BudgetStatus } from "@/lib/finance";
import type { Category } from "@/lib/types";
import { formatCOP, monthLabel, pct, shiftMonth } from "@/lib/format";
import { cn } from "@/lib/utils";

export function BudgetsView({
  month,
  statuses,
  categories,
  budgets,
}: {
  month: string;
  statuses: BudgetStatus[];
  categories: Category[];
  budgets: { id: string; categoria: string; monto: number; mes: string }[];
}) {
  const router = useRouter();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<{
    id?: string;
    categoria: string;
    monto: number;
  } | null>(null);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(
    null,
  );
  const [copying, setCopying] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const totals = useMemo(() => {
    const presupuesto = statuses.reduce((sum, item) => sum + item.presupuesto, 0);
    const gasto = statuses.reduce((sum, item) => sum + item.gasto, 0);
    return {
      presupuesto,
      gasto,
      disponible: presupuesto - gasto,
      porcentaje: pct(gasto, presupuesto),
    };
  }, [statuses]);

  const withBudget = statuses.filter((item) => item.presupuesto > 0);

  function openNew(status?: BudgetStatus) {
    setEditing(
      status ? { categoria: status.categoria, monto: 0 } : null,
    );
    setFormOpen(true);
  }

  function openEdit(status: BudgetStatus) {
    const budget = budgets.find(
      (item) => item.mes === month && item.categoria === status.categoria,
    );
    if (!budget) return;
    setEditing({ id: budget.id, categoria: budget.categoria, monto: budget.monto });
    setFormOpen(true);
  }

  async function handleCopy() {
    setCopying(true);
    setMessage(null);
    const result = await copyBudgetsAction(shiftMonth(month, -1), month);
    setCopying(false);
    setMessage(
      result.ok
        ? { type: "ok", text: result.message ?? "Presupuestos copiados." }
        : { type: "error", text: result.error },
    );
    if (result.ok) router.refresh();
  }

  async function handleDelete(status: BudgetStatus) {
    const budget = budgets.find(
      (item) => item.mes === month && item.categoria === status.categoria,
    );
    if (!budget) return;
    const confirmed = window.confirm(
      `¿Quitar el presupuesto de "${status.categoria}" para ${monthLabel(month)}?`,
    );
    if (!confirmed) return;
    setBusyId(budget.id);
    const result = await deleteBudgetAction(budget.id);
    setBusyId(null);
    if (!result.ok) {
      setMessage({ type: "error", text: result.error });
      return;
    }
    setMessage({ type: "ok", text: "Presupuesto eliminado." });
    router.refresh();
  }

  return (
    <div>
      <PageHeader
        title="Presupuestos"
        description="Define cuánto planeas gastar por categoría cada mes."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={handleCopy}
              disabled={copying}
            >
              <Copy className="h-4 w-4" />
              {copying ? "Copiando…" : "Copiar mes anterior"}
            </Button>
            <Button onClick={() => openNew()}>
              <Plus className="h-4 w-4" /> Nuevo presupuesto
            </Button>
          </>
        }
      />

      <Card className="mb-4 flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Link
            href={`/finanzas/presupuestos?mes=${shiftMonth(month, -1)}`}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            aria-label="Mes anterior"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <Input
            type="month"
            value={month}
            onChange={(event) => {
              if (event.target.value) {
                router.push(`/finanzas/presupuestos?mes=${event.target.value}`);
              }
            }}
            className="w-44"
          />
          <Link
            href={`/finanzas/presupuestos?mes=${shiftMonth(month, 1)}`}
            className="rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-800"
            aria-label="Mes siguiente"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <span className="hidden whitespace-nowrap text-xs text-slate-400 sm:inline">
            {withBudget.length} categoría{withBudget.length === 1 ? "" : "s"} con presupuesto
          </span>
        </div>
        <Link
          href={`/finanzas/movimientos?nuevo=1`}
          className="text-xs font-medium text-brand-700 hover:text-brand-800"
        >
          Registrar gasto
        </Link>
      </Card>

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

      <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Card className="px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Presupuestado
          </p>
          <p className="mt-0.5 text-lg font-semibold text-slate-900">
            {formatCOP(totals.presupuesto)}
          </p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Gastado
          </p>
          <p className="mt-0.5 text-lg font-semibold text-rose-600">
            {formatCOP(totals.gasto)}
          </p>
        </Card>
        <Card className="px-4 py-3">
          <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
            Disponible
          </p>
          <p
            className={cn(
              "mt-0.5 text-lg font-semibold",
              totals.disponible >= 0 ? "text-emerald-600" : "text-rose-600",
            )}
          >
            {formatCOP(totals.disponible)}
          </p>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
            <div
              className={cn(
                "h-full rounded-full",
                totals.porcentaje > 100
                  ? "bg-rose-500"
                  : totals.porcentaje >= 80
                    ? "bg-amber-500"
                    : "bg-brand-500",
              )}
              style={{ width: `${Math.min(100, totals.porcentaje)}%` }}
            />
          </div>
        </Card>
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card className="p-4">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">
            Comparativo del mes
          </h2>
          {statuses.some((item) => item.presupuesto > 0 || item.gasto > 0) ? (
            <BudgetBars data={statuses} />
          ) : (
            <p className="py-10 text-center text-xs text-slate-500">
              Define presupuestos para ver el comparativo.
            </p>
          )}
        </Card>

        <Card>
          <div className="border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">
              Detalle por categoría
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              Presupuesto, gasto real y avance.
            </p>
          </div>
          <ul className="divide-y divide-slate-50">
            {statuses.map((status) => {
              const hasBudget = status.presupuesto > 0;
              return (
                <li key={status.categoria} className="px-4 py-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: status.color }}
                      />
                      <span className="truncate text-sm font-medium text-slate-800">
                        {status.categoria}
                      </span>
                      {status.excedido ? (
                        <Badge tone="rose">Excedido</Badge>
                      ) : hasBudget && status.porcentaje >= 80 ? (
                        <Badge tone="amber">Al límite</Badge>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {hasBudget ? (
                        <>
                          <button
                            type="button"
                            onClick={() => openEdit(status)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            aria-label="Editar presupuesto"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(status)}
                            disabled={busyId !== null}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 disabled:opacity-40"
                            aria-label="Eliminar presupuesto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <Button size="sm" variant="ghost" onClick={() => openNew(status)}>
                          <Plus className="h-3 w-3" /> Definir
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                    <span>
                      {formatCOP(status.gasto)}
                      {hasBudget ? ` de ${formatCOP(status.presupuesto)}` : " sin presupuesto"}
                    </span>
                    {hasBudget ? (
                      <span
                        className={cn(
                          "font-medium",
                          status.excedido ? "text-rose-600" : "text-slate-500",
                        )}
                      >
                        {pct(status.gasto, status.presupuesto)}%
                      </span>
                    ) : null}
                  </div>
                  {hasBudget ? (
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          status.excedido
                            ? "bg-rose-500"
                            : status.porcentaje >= 80
                              ? "bg-amber-500"
                              : "bg-brand-500",
                        )}
                        style={{ width: `${Math.min(100, status.porcentaje)}%` }}
                      />
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <BudgetForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          setMessage({ type: "ok", text: "Presupuesto guardado." });
          router.refresh();
        }}
        month={month}
        categories={categories}
        initial={editing}
      />
    </div>
  );
}

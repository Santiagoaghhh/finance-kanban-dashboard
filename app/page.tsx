import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CalendarClock,
  Landmark,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge, priorityTone } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import {
  BudgetProgress,
  CashflowChart,
  CategoryDonut,
} from "@/components/charts/finance-charts";
import {
  budgetStatusForMonth,
  categoryBreakdown,
  cashflowSeries,
  monthOf,
  summarize,
  upcomingTasks,
} from "@/lib/finance";
import {
  currentMonth,
  formatCOP,
  formatDate,
  formatShortDate,
  lastMonths,
  monthLabel,
  shiftMonth,
  todayISO,
} from "@/lib/format";
import { getBudgets, getCategories, getMovements, getTasks } from "@/lib/excel/repo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const [movements, categories, budgets, tasks] = await Promise.all([
    getMovements(),
    getCategories(),
    getBudgets(),
    getTasks(),
  ]);

  const month = currentMonth();
  const previousMonth = shiftMonth(month, -1);
  const current = summarize(
    movements.filter((movement) => monthOf(movement.fecha) === month),
  );
  const previous = summarize(
    movements.filter((movement) => monthOf(movement.fecha) === previousMonth),
  );
  const balance = summarize(movements).utilidad;
  const series = cashflowSeries(movements, lastMonths(12, month));
  const breakdown = categoryBreakdown(
    movements.filter((movement) => monthOf(movement.fecha) === month),
    categories,
    "Egreso",
  );
  const budgetsStatus = budgetStatusForMonth(budgets, movements, categories, month);
  const recent = movements.slice(0, 7);
  const nextTasks = upcomingTasks(tasks, 6);
  const today = todayISO();
  const openTasks = tasks.filter((task) => task.columna !== "hecho").length;
  const isEmpty = movements.length === 0 && tasks.length === 0;

  const delta = (now: number, before: number) => {
    if (before <= 0) return null;
    const change = Math.round(((now - before) / before) * 100);
    return change;
  };
  const incomeDelta = delta(current.ingresos, previous.ingresos);
  const expenseDelta = delta(current.egresos, previous.egresos);
  const profitDelta = delta(current.utilidad, previous.utilidad);

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`Resumen de ${monthLabel(month)}`}
        actions={
          <>
            <Link
              href="/finanzas/movimientos?nuevo=1"
              className={buttonClasses("primary", "md")}
            >
              <Plus className="h-4 w-4" /> Movimiento
            </Link>
            <Link href="/kanban?nueva=1" className={buttonClasses("secondary", "md")}>
              <Plus className="h-4 w-4" /> Tarea
            </Link>
          </>
        }
      />

      {isEmpty ? (
        <Card className="mb-6 border-brand-200 bg-brand-50/60 p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-900">
                Tu panel está listo para empezar
              </p>
              <p className="mt-1 max-w-xl text-xs leading-relaxed text-brand-800/80">
                Registra tu primer ingreso o gasto y crea una tarea. Todo quedará
                guardado automáticamente en <code>data/finanzas.xlsx</code>.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Link
                href="/finanzas/movimientos?nuevo=1"
                className={buttonClasses("primary", "sm")}
              >
                Registrar movimiento
              </Link>
              <Link href="/kanban?nueva=1" className={buttonClasses("secondary", "sm")}>
                Crear tarea
              </Link>
            </div>
          </div>
        </Card>
      ) : null}

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Ingresos del mes"
          value={formatCOP(current.ingresos)}
          icon={TrendingUp}
          tone="emerald"
          hint={
            incomeDelta === null
              ? "Sin base del mes anterior"
              : `${incomeDelta >= 0 ? "+" : ""}${incomeDelta}% vs. mes anterior`
          }
          hintTone={
            incomeDelta === null ? "muted" : incomeDelta >= 0 ? "positive" : "negative"
          }
        />
        <StatCard
          label="Egresos del mes"
          value={formatCOP(current.egresos)}
          icon={TrendingDown}
          tone="rose"
          hint={
            expenseDelta === null
              ? "Sin base del mes anterior"
              : `${expenseDelta >= 0 ? "+" : ""}${expenseDelta}% vs. mes anterior`
          }
          hintTone={
            expenseDelta === null ? "muted" : expenseDelta <= 0 ? "positive" : "negative"
          }
        />
        <StatCard
          label="Utilidad del mes"
          value={formatCOP(current.utilidad)}
          icon={Wallet}
          tone={current.utilidad >= 0 ? "brand" : "rose"}
          hint={
            profitDelta === null
              ? "Ingresos menos egresos"
              : `${profitDelta >= 0 ? "+" : ""}${profitDelta}% vs. mes anterior`
          }
          hintTone={
            profitDelta === null ? "muted" : profitDelta >= 0 ? "positive" : "negative"
          }
        />
        <StatCard
          label="Saldo acumulado"
          value={formatCOP(balance)}
          icon={Landmark}
          tone="blue"
          hint="Histórico de todos los movimientos"
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Flujo de caja"
            subtitle="Últimos 12 meses · ingresos, egresos y saldo"
            action={
              <Link
                href="/finanzas/reportes"
                className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:text-brand-800"
              >
                Ver reportes <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            }
          />
          <CardContent className="pt-4">
            <CashflowChart data={series} />
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            title="Gastos por categoría"
            subtitle={monthLabel(month)}
          />
          <CardContent className="flex flex-1 flex-col justify-center">
            {breakdown.length ? (
              <CategoryDonut
                data={breakdown}
                total={breakdown.reduce((sum, item) => sum + item.total, 0)}
              />
            ) : (
              <EmptyState
                title="Sin gastos este mes"
                description="Cuando registres egresos verás aquí su distribución."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader
            title="Presupuesto vs. real"
            subtitle={monthLabel(month)}
            action={
              <Link
                href={`/finanzas/presupuestos?mes=${month}`}
                className="text-xs font-medium text-brand-700 hover:text-brand-800"
              >
                Gestionar
              </Link>
            }
          />
          <CardContent>
            <BudgetProgress data={budgetsStatus} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Próximos pendientes"
            subtitle={`${openTasks} ${openTasks === 1 ? "tarea abierta" : "tareas abiertas"}`}
            action={
              <Link
                href="/kanban"
                className="text-xs font-medium text-brand-700 hover:text-brand-800"
              >
                Ver tablero
              </Link>
            }
          />
          <CardContent className="space-y-3">
            {nextTasks.length ? (
              nextTasks.map((task) => {
                const overdue =
                  task.fechaLimite !== "" && task.fechaLimite < today;
                return (
                  <div
                    key={task.id}
                    className="flex items-start gap-2.5 rounded-lg border border-slate-100 p-2.5"
                  >
                    <CalendarClock
                      className={cn(
                        "mt-0.5 h-4 w-4 shrink-0",
                        overdue ? "text-rose-500" : "text-slate-400",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium text-slate-800">
                        {task.titulo}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge tone={priorityTone(task.prioridad)}>
                          {task.prioridad}
                        </Badge>
                        {task.fechaLimite ? (
                          <span
                            className={cn(
                              "text-[11px]",
                              overdue ? "font-medium text-rose-600" : "text-slate-400",
                            )}
                          >
                            {overdue ? "Vencida · " : ""}
                            {formatShortDate(task.fechaLimite)}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Sin fecha</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyState
                title="No hay tareas pendientes"
                description="Crea una tarea para verla aquí."
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Últimos movimientos"
            subtitle="Los más recientes"
            action={
              <Link
                href="/finanzas/movimientos"
                className="text-xs font-medium text-brand-700 hover:text-brand-800"
              >
                Ver todos
              </Link>
            }
          />
          <CardContent className="space-y-2.5">
            {recent.length ? (
              recent.map((movement) => (
                <div
                  key={movement.id}
                  className="flex items-center justify-between gap-3 border-b border-slate-50 pb-2.5 last:border-0 last:pb-0"
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <span
                      className={cn(
                        "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full",
                        movement.tipo === "Ingreso"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-rose-50 text-rose-600",
                      )}
                    >
                      {movement.tipo === "Ingreso" ? (
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      ) : (
                        <ArrowDownRight className="h-3.5 w-3.5" />
                      )}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-slate-800">
                        {movement.descripcion}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {formatDate(movement.fecha)} · {movement.categoria}
                      </p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "shrink-0 text-xs font-semibold",
                      movement.tipo === "Ingreso" ? "text-emerald-600" : "text-rose-600",
                    )}
                  >
                    {movement.tipo === "Ingreso" ? "+" : "−"}
                    {formatCOP(movement.monto)}
                  </span>
                </div>
              ))
            ) : (
              <EmptyState
                title="Sin movimientos"
                description="Registra tu primer ingreso o gasto."
                action={
                  <Link
                    href="/finanzas/movimientos?nuevo=1"
                    className={buttonClasses("primary", "sm")}
                  >
                    Registrar
                  </Link>
                }
              />
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

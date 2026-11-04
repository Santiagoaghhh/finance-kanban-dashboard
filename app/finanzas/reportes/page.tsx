import Link from "next/link";
import { ArrowDownRight, ArrowUpRight, Percent, Scale } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { StatCard } from "@/components/ui/stat-card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  BalanceChart,
  BudgetBars,
  CashflowChart,
  CategoryDonut,
} from "@/components/charts/finance-charts";
import {
  budgetStatusForYear,
  categoryBreakdown,
  cashflowSeries,
  summarize,
  yearsWithData,
} from "@/lib/finance";
import { formatCOP, monthLabel, pct } from "@/lib/format";
import { getBudgets, getCategories, getMovements } from "@/lib/excel/repo";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: { anio?: string };
}) {
  const [movements, categories, budgets] = await Promise.all([
    getMovements(),
    getCategories(),
    getBudgets(),
  ]);

  const years = yearsWithData(movements);
  const requested = Number(searchParams.anio);
  const year = years.includes(requested) ? requested : years[0];
  const months = Array.from(
    { length: 12 },
    (_, index) => `${year}-${String(index + 1).padStart(2, "0")}`,
  );
  const yearMovements = movements.filter((movement) =>
    movement.fecha.startsWith(`${year}-`),
  );
  const totals = summarize(yearMovements);
  const series = cashflowSeries(movements, months);
  const breakdown = categoryBreakdown(yearMovements, categories, "Egreso");
  const budgetsStatus = budgetStatusForYear(budgets, movements, categories, year);
  const margin = totals.ingresos > 0 ? Math.round((totals.utilidad / totals.ingresos) * 100) : 0;
  const finalBalance = series[series.length - 1]?.saldo ?? 0;

  return (
    <div>
      <PageHeader
        title="Reportes"
        description="Análisis anual de tu flujo de caja, gastos y presupuestos."
        actions={
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
            {years.map((option) => (
              <Link
                key={option}
                href={`/finanzas/reportes?anio=${option}`}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  option === year
                    ? "bg-brand-600 text-white"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                )}
              >
                {option}
              </Link>
            ))}
          </div>
        }
      />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={`Ingresos ${year}`}
          value={formatCOP(totals.ingresos)}
          icon={ArrowUpRight}
          tone="emerald"
          hint={`${yearMovements.filter((movement) => movement.tipo === "Ingreso").length} registros`}
        />
        <StatCard
          label={`Egresos ${year}`}
          value={formatCOP(totals.egresos)}
          icon={ArrowDownRight}
          tone="rose"
          hint={`${yearMovements.filter((movement) => movement.tipo === "Egreso").length} registros`}
        />
        <StatCard
          label={`Utilidad ${year}`}
          value={formatCOP(totals.utilidad)}
          icon={Scale}
          tone={totals.utilidad >= 0 ? "brand" : "rose"}
          hint="Ingresos menos egresos del año"
        />
        <StatCard
          label="Margen de utilidad"
          value={`${margin}%`}
          icon={Percent}
          tone="blue"
          hint={`Saldo final: ${formatCOP(finalBalance)}`}
        />
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader
            title="Flujo de caja mensual"
            subtitle={`Ingresos, egresos y saldo acumulado · ${year}`}
          />
          <CardContent className="pt-4">
            <CashflowChart data={series} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Evolución del saldo"
            subtitle={`Saldo acumulado al cierre de cada mes · ${year}`}
          />
          <CardContent className="pt-4">
            <BalanceChart data={series} />
          </CardContent>
        </Card>
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader
            title="Gastos por categoría"
            subtitle={`Distribución del año ${year}`}
          />
          <CardContent className="flex flex-1 flex-col justify-center">
            {breakdown.length ? (
              <CategoryDonut
                data={breakdown}
                total={breakdown.reduce((sum, item) => sum + item.total, 0)}
              />
            ) : (
              <EmptyState
                title="Sin gastos registrados"
                description={`No hay egresos en ${year}.`}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader
            title="Presupuesto vs. real"
            subtitle={`Acumulado del año ${year}`}
          />
          <CardContent>
            {budgetsStatus.some((item) => item.presupuesto > 0 || item.gasto > 0) ? (
              <BudgetBars data={budgetsStatus} />
            ) : (
              <EmptyState
                title="Sin presupuestos"
                description="Define presupuestos mensuales para comparar con lo real."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="mt-4">
        <CardHeader
          title="Detalle mensual"
          subtitle={`Cifras de ${year}`}
        />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[620px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-4 py-2.5 font-medium">Mes</th>
                <th className="px-4 py-2.5 text-right font-medium">Ingresos</th>
                <th className="px-4 py-2.5 text-right font-medium">Egresos</th>
                <th className="px-4 py-2.5 text-right font-medium">Utilidad</th>
                <th className="px-4 py-2.5 text-right font-medium">Saldo acumulado</th>
              </tr>
            </thead>
            <tbody>
              {series.map((point) => (
                <tr
                  key={point.mes}
                  className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50"
                >
                  <td className="px-4 py-2.5 text-xs font-medium text-slate-700">
                    {monthLabel(point.mes)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-emerald-600">
                    {formatCOP(point.ingresos)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-rose-600">
                    {formatCOP(point.egresos)}
                  </td>
                  <td
                    className={cn(
                      "px-4 py-2.5 text-right text-xs font-medium",
                      point.utilidad >= 0 ? "text-slate-800" : "text-rose-600",
                    )}
                  >
                    {formatCOP(point.utilidad)}
                  </td>
                  <td className="px-4 py-2.5 text-right text-xs text-slate-600">
                    {formatCOP(point.saldo)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200 bg-slate-50/70 text-xs font-semibold text-slate-800">
                <td className="px-4 py-3">Total {year}</td>
                <td className="px-4 py-3 text-right text-emerald-700">
                  {formatCOP(totals.ingresos)}
                </td>
                <td className="px-4 py-3 text-right text-rose-700">
                  {formatCOP(totals.egresos)}
                </td>
                <td className="px-4 py-3 text-right">{formatCOP(totals.utilidad)}</td>
                <td className="px-4 py-3 text-right">{formatCOP(finalBalance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
        <p className="border-t border-slate-100 px-4 py-2.5 text-[11px] text-slate-400">
          {pct(totals.egresos, totals.ingresos)}% de los ingresos se destinó a egresos.
        </p>
      </Card>
    </div>
  );
}

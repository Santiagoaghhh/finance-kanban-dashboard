import { formatCompactCOP, monthLabel, pct } from "./format";
import type { Budget, Category, Movement, Task } from "./types";

export function monthOf(date: string): string {
  return date.slice(0, 7);
}

export function summarize(movements: Movement[]) {
  const ingresos = movements
    .filter((movement) => movement.tipo === "Ingreso")
    .reduce((sum, movement) => sum + movement.monto, 0);
  const egresos = movements
    .filter((movement) => movement.tipo === "Egreso")
    .reduce((sum, movement) => sum + movement.monto, 0);
  return { ingresos, egresos, utilidad: ingresos - egresos };
}

export function movementsInMonth(movements: Movement[], month: string): Movement[] {
  return movements.filter((movement) => monthOf(movement.fecha) === month);
}

export function totalBalance(movements: Movement[]): number {
  const { utilidad } = summarize(movements);
  return utilidad;
}

export interface CashflowPoint {
  mes: string;
  label: string;
  ingresos: number;
  egresos: number;
  utilidad: number;
  saldo: number;
}

export function cashflowSeries(
  movements: Movement[],
  months: string[],
): CashflowPoint[] {
  const start = months[0];
  let running = movements
    .filter((movement) => monthOf(movement.fecha) < start)
    .reduce(
      (sum, movement) =>
        sum + (movement.tipo === "Ingreso" ? movement.monto : -movement.monto),
      0,
    );

  return months.map((month) => {
    const inMonth = movementsInMonth(movements, month);
    const { ingresos, egresos, utilidad } = summarize(inMonth);
    running += utilidad;
    return {
      mes: month,
      label: monthLabel(month, { short: true }),
      ingresos,
      egresos,
      utilidad,
      saldo: running,
    };
  });
}

export interface CategoryTotal {
  categoria: string;
  total: number;
  color: string;
  porcentaje: number;
}

export function categoryBreakdown(
  movements: Movement[],
  categories: Category[],
  filter: "Ingreso" | "Egreso" = "Egreso",
): CategoryTotal[] {
  const totals = new Map<string, number>();
  movements
    .filter((movement) => movement.tipo === filter)
    .forEach((movement) => {
      totals.set(movement.categoria, (totals.get(movement.categoria) ?? 0) + movement.monto);
    });

  const grandTotal = [...totals.values()].reduce((sum, value) => sum + value, 0);
  return [...totals.entries()]
    .map(([categoria, total]) => ({
      categoria,
      total,
      color: categories.find((category) => category.nombre === categoria)?.color ?? "#64748b",
      porcentaje: grandTotal ? Math.round((total / grandTotal) * 100) : 0,
    }))
    .sort((a, b) => b.total - a.total);
}

export interface BudgetStatus {
  categoria: string;
  color: string;
  presupuesto: number;
  gasto: number;
  disponible: number;
  porcentaje: number;
  excedido: boolean;
}

export function budgetStatusForMonth(
  budgets: Budget[],
  movements: Movement[],
  categories: Category[],
  month: string,
  includeEmpty = false,
): BudgetStatus[] {
  const activeCategories = categories.filter(
    (category) => category.activa && category.tipo === "Egreso",
  );

  const names = new Set<string>(activeCategories.map((category) => category.nombre));
  budgets
    .filter((budget) => budget.mes === month)
    .forEach((budget) => names.add(budget.categoria));
  movements
    .filter((movement) => monthOf(movement.fecha) === month && movement.tipo === "Egreso")
    .forEach((movement) => names.add(movement.categoria));

  return [...names]
    .map((categoria) => {
      const presupuesto = budgets
        .filter((budget) => budget.mes === month && budget.categoria === categoria)
        .reduce((sum, budget) => sum + budget.monto, 0);
      const gasto = movements
        .filter(
          (movement) =>
            monthOf(movement.fecha) === month &&
            movement.tipo === "Egreso" &&
            movement.categoria === categoria,
        )
        .reduce((sum, movement) => sum + movement.monto, 0);
      return {
        categoria,
        color: categories.find((category) => category.nombre === categoria)?.color ?? "#64748b",
        presupuesto,
        gasto,
        disponible: presupuesto - gasto,
        porcentaje: pct(gasto, presupuesto),
        excedido: presupuesto > 0 && gasto > presupuesto,
      };
    })
    .filter((item) => includeEmpty || item.presupuesto > 0 || item.gasto > 0)
    .sort((a, b) => b.presupuesto - a.presupuesto || b.gasto - a.gasto);
}

export function budgetStatusForYear(
  budgets: Budget[],
  movements: Movement[],
  categories: Category[],
  year: number,
): BudgetStatus[] {
  const prefix = `${year}-`;
  const expenseCategories = categories.filter(
    (category) => category.activa && category.tipo === "Egreso",
  );
  const names = new Set<string>(expenseCategories.map((category) => category.nombre));
  budgets
    .filter((budget) => budget.mes.startsWith(prefix))
    .forEach((budget) => names.add(budget.categoria));
  movements
    .filter(
      (movement) =>
        movement.fecha.startsWith(prefix) && movement.tipo === "Egreso",
    )
    .forEach((movement) => names.add(movement.categoria));

  return [...names]
    .map((categoria) => {
      const presupuesto = budgets
        .filter((budget) => budget.mes.startsWith(prefix) && budget.categoria === categoria)
        .reduce((sum, budget) => sum + budget.monto, 0);
      const gasto = movements
        .filter(
          (movement) =>
            movement.fecha.startsWith(prefix) &&
            movement.tipo === "Egreso" &&
            movement.categoria === categoria,
        )
        .reduce((sum, movement) => sum + movement.monto, 0);
      return {
        categoria,
        color: categories.find((category) => category.nombre === categoria)?.color ?? "#64748b",
        presupuesto,
        gasto,
        disponible: presupuesto - gasto,
        porcentaje: pct(gasto, presupuesto),
        excedido: presupuesto > 0 && gasto > presupuesto,
      };
    })
    .filter((item) => item.presupuesto > 0 || item.gasto > 0)
    .sort((a, b) => b.presupuesto - a.presupuesto || b.gasto - a.gasto);
}

export function yearsWithData(movements: Movement[]): number[] {
  const years = new Set<number>(movements.map((movement) => Number(movement.fecha.slice(0, 4))));
  years.add(new Date().getFullYear());
  return [...years].filter((year) => Number.isFinite(year)).sort((a, b) => b - a);
}

export function upcomingTasks(tasks: Task[], limit = 6): Task[] {
  return tasks
    .filter((task) => task.columna !== "hecho")
    .sort((a, b) => {
      if (!a.fechaLimite && !b.fechaLimite) return a.orden - b.orden;
      if (!a.fechaLimite) return 1;
      if (!b.fechaLimite) return -1;
      return a.fechaLimite < b.fechaLimite ? -1 : 1;
    })
    .slice(0, limit);
}

export function compact(value: number): string {
  return formatCompactCOP(value);
}

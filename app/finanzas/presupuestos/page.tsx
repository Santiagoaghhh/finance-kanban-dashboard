import { BudgetsView } from "@/components/finance/budgets-view";
import {
  getBudgets,
  getCategories,
  getMovements,
} from "@/lib/excel/repo";
import { budgetStatusForMonth } from "@/lib/finance";
import { currentMonth } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function BudgetsPage({
  searchParams,
}: {
  searchParams: { mes?: string };
}) {
  const month =
    searchParams.mes && /^\d{4}-\d{2}$/.test(searchParams.mes)
      ? searchParams.mes
      : currentMonth();

  const [budgets, movements, categories] = await Promise.all([
    getBudgets(),
    getMovements(),
    getCategories(),
  ]);

  const statuses = budgetStatusForMonth(
    budgets,
    movements,
    categories,
    month,
    true,
  );

  return (
    <BudgetsView
      month={month}
      statuses={statuses}
      categories={categories}
      budgets={budgets}
    />
  );
}

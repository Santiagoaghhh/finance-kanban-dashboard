import { MovementsView } from "@/components/finance/movements-view";
import { getCategories, getConfig, getMovements } from "@/lib/excel/repo";

export const dynamic = "force-dynamic";

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: { nuevo?: string };
}) {
  const [movements, categories, config] = await Promise.all([
    getMovements(),
    getCategories(),
    getConfig(),
  ]);

  return (
    <MovementsView
      movements={movements}
      categories={categories}
      methods={config.metodosPago}
      initialOpen={searchParams.nuevo === "1"}
    />
  );
}

import { SettingsView } from "@/components/settings/settings-view";
import {
  getBudgets,
  getCategories,
  getConfig,
  getDataInfo,
  getMovements,
  getTasks,
} from "@/lib/excel/repo";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const [categories, config, movements, budgets, tasks, dataInfo] =
    await Promise.all([
      getCategories(),
      getConfig(),
      getMovements(),
      getBudgets(),
      getTasks(),
      getDataInfo(),
    ]);

  return (
    <SettingsView
      categories={categories}
      methods={config.metodosPago}
      dataPath={dataInfo.path}
      counts={{
        movements: movements.length,
        budgets: budgets.length,
        tasks: tasks.length,
      }}
    />
  );
}

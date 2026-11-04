import { KanbanBoard } from "@/components/kanban/kanban-board";
import { getTasks } from "@/lib/excel/repo";

export const dynamic = "force-dynamic";

export default async function KanbanPage({
  searchParams,
}: {
  searchParams: { nueva?: string };
}) {
  const tasks = await getTasks();
  return <KanbanBoard tasks={tasks} initialNew={searchParams.nueva === "1"} />;
}

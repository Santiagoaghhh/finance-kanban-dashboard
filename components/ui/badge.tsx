import { cn } from "@/lib/utils";

type Tone =
  | "emerald"
  | "rose"
  | "amber"
  | "slate"
  | "blue"
  | "purple"
  | "orange";

const tones: Record<Tone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  slate: "bg-slate-100 text-slate-600 ring-slate-200",
  blue: "bg-blue-50 text-blue-700 ring-blue-100",
  purple: "bg-purple-50 text-purple-700 ring-purple-100",
  orange: "bg-orange-50 text-orange-700 ring-orange-100",
};

export function Badge({
  tone = "slate",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function priorityTone(priority: string): Tone {
  if (priority === "Alta") return "rose";
  if (priority === "Media") return "amber";
  return "slate";
}

export function columnTone(column: string): Tone {
  if (column === "hecho") return "emerald";
  if (column === "progreso") return "blue";
  if (column === "revision") return "purple";
  return "slate";
}

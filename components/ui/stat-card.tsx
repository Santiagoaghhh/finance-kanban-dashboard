import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const tones = {
  emerald: "bg-emerald-50 text-emerald-600",
  rose: "bg-rose-50 text-rose-600",
  blue: "bg-blue-50 text-blue-600",
  brand: "bg-brand-50 text-brand-600",
  slate: "bg-slate-100 text-slate-600",
};

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "brand",
  hintTone = "muted",
}: {
  label: string;
  value: string;
  hint?: string;
  icon: LucideIcon;
  tone?: keyof typeof tones;
  hintTone?: "muted" | "positive" | "negative";
}) {
  return (
    <Card className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500">{label}</p>
          <p className="mt-1.5 truncate text-xl font-semibold tracking-tight text-slate-900 sm:text-2xl">
            {value}
          </p>
          {hint ? (
            <p
              className={cn(
                "mt-1 text-[11px]",
                hintTone === "positive" && "text-emerald-600",
                hintTone === "negative" && "text-rose-600",
                hintTone === "muted" && "text-slate-400",
              )}
            >
              {hint}
            </p>
          ) : null}
        </div>
        <span className={cn("rounded-lg p-2", tones[tone])}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
    </Card>
  );
}

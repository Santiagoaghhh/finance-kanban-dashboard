const copFormatter = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 0,
});

const numberFormatter = new Intl.NumberFormat("es-CO", {
  maximumFractionDigits: 0,
});

export function formatCOP(value: number): string {
  return copFormatter.format(Math.round(value));
}

export function formatNumber(value: number): string {
  return numberFormatter.format(Math.round(value));
}

export function formatCompactCOP(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toLocaleString("es-CO", {
      maximumFractionDigits: 1,
    })} mil M`;
  }
  if (abs >= 1_000_000) {
    return `$${(value / 1_000_000).toLocaleString("es-CO", {
      maximumFractionDigits: 1,
    })} M`;
  }
  if (abs >= 1_000) {
    return `$${(value / 1_000).toLocaleString("es-CO", {
      maximumFractionDigits: 0,
    })} mil`;
  }
  return formatCOP(value);
}

export function formatDate(iso: string): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export function formatShortDate(iso: string): string {
  if (!iso) return "—";
  const [year, month, day] = iso.split("-").map(Number);
  if (!year || !month || !day) return iso;
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "short",
  }).format(new Date(year, month - 1, day));
}

export function todayISO(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function currentMonth(): string {
  return todayISO().slice(0, 7);
}

export function monthLabel(month: string, opts?: { short?: boolean }): string {
  const [year, m] = month.split("-").map(Number);
  if (!year || !m) return month;
  const date = new Date(year, m - 1, 1);
  const text = new Intl.DateTimeFormat("es-CO", {
    month: opts?.short ? "short" : "long",
    year: "numeric",
  }).format(date);
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function shiftMonth(month: string, delta: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(year, m - 1 + delta, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export function lastMonths(count: number, endMonth = currentMonth()): string[] {
  const months: string[] = [];
  for (let i = count - 1; i >= 0; i -= 1) {
    months.push(shiftMonth(endMonth, -i));
  }
  return months;
}

export function pct(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(999, Math.round((part / total) * 100));
}

"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { BudgetStatus, CashflowPoint, CategoryTotal } from "@/lib/finance";
import { formatCompactCOP, formatCOP, pct } from "@/lib/format";

const INCOME = "#059669";
const EXPENSE = "#e11d48";
const BALANCE = "#2563eb";

const tooltipStyle = {
  borderRadius: 10,
  border: "1px solid #e2e8f0",
  boxShadow: "0 8px 24px rgba(15,23,42,0.08)",
  fontSize: 12,
};

function money(value: number) {
  return formatCOP(value);
}

export function CashflowChart({ data }: { data: CashflowPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            width={70}
            tickFormatter={(value) => formatCompactCOP(Number(value))}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [money(Number(value)), name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#475569" }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            dataKey="ingresos"
            name="Ingresos"
            fill={INCOME}
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          />
          <Bar
            dataKey="egresos"
            name="Egresos"
            fill={EXPENSE}
            radius={[4, 4, 0, 0]}
            maxBarSize={22}
          />
          <Line
            type="monotone"
            dataKey="saldo"
            name="Saldo acumulado"
            stroke={BALANCE}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BalanceChart({ data }: { data: CashflowPoint[] }) {
  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="balanceFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={BALANCE} stopOpacity={0.25} />
              <stop offset="100%" stopColor={BALANCE} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            width={70}
            tickFormatter={(value) => formatCompactCOP(Number(value))}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value) => [money(Number(value)), "Saldo"]}
          />
          <Area
            type="monotone"
            dataKey="saldo"
            name="Saldo acumulado"
            stroke={BALANCE}
            strokeWidth={2}
            fill="url(#balanceFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function CategoryDonut({
  data,
  total,
}: {
  data: CategoryTotal[];
  total: number;
}) {
  return (
    <div className="flex flex-col gap-4">
      <div className="relative mx-auto h-40 w-40">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="total"
              nameKey="categoria"
              innerRadius={46}
              outerRadius={70}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((entry) => (
                <Cell key={entry.categoria} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value, name) => [money(Number(value)), name]}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-[10px] uppercase tracking-wide text-slate-400">Total</span>
          <span className="text-sm font-semibold text-slate-800">
            {formatCompactCOP(total)}
          </span>
        </div>
      </div>
      <ul className="space-y-2">
        {data.slice(0, 7).map((item) => (
          <li key={item.categoria} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="flex-1 truncate text-slate-600">{item.categoria}</span>
            <span className="font-medium text-slate-800">{formatCompactCOP(item.total)}</span>
            <span className="w-9 text-right text-slate-400">{item.porcentaje}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function BudgetBars({ data }: { data: BudgetStatus[] }) {
  const rows = data.filter((item) => item.presupuesto > 0 || item.gasto > 0).slice(0, 8);
  const height = Math.max(180, rows.length * 38);

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={rows}
          layout="vertical"
          margin={{ top: 4, right: 16, left: 0, bottom: 0 }}
          barGap={2}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" horizontal={false} />
          <XAxis
            type="number"
            tick={{ fontSize: 10, fill: "#64748b" }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(value) => formatCompactCOP(Number(value))}
          />
          <YAxis
            type="category"
            dataKey="categoria"
            tick={{ fontSize: 11, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
            width={120}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            formatter={(value, name) => [money(Number(value)), name]}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, color: "#475569" }}
            iconType="circle"
            iconSize={8}
          />
          <Bar
            dataKey="presupuesto"
            name="Presupuesto"
            fill="#cbd5e1"
            radius={[0, 4, 4, 0]}
            maxBarSize={12}
          />
          <Bar
            dataKey="gasto"
            name="Gasto real"
            fill={EXPENSE}
            radius={[0, 4, 4, 0]}
            maxBarSize={12}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BudgetProgress({ data }: { data: BudgetStatus[] }) {
  const visible = data.filter((item) => item.presupuesto > 0 || item.gasto > 0);
  if (!visible.length) {
    return (
      <p className="py-6 text-center text-xs text-slate-500">
        Aún no hay presupuestos ni gastos este mes.
      </p>
    );
  }

  return (
    <ul className="space-y-4">
      {visible.slice(0, 6).map((item) => {
        const percentage = Math.min(100, item.porcentaje);
        const tone = item.excedido
          ? "bg-rose-500"
          : item.porcentaje >= 80
            ? "bg-amber-500"
            : "bg-brand-500";
        return (
          <li key={item.categoria}>
            <div className="mb-1.5 flex items-center justify-between gap-2 text-xs">
              <span className="truncate font-medium text-slate-700">{item.categoria}</span>
              <span className={item.excedido ? "text-rose-600" : "text-slate-500"}>
                {formatCompactCOP(item.gasto)} / {formatCompactCOP(item.presupuesto)}
                <span className="ml-1 text-slate-400">({pct(item.gasto, item.presupuesto)}%)</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className={`h-full rounded-full ${tone}`}
                style={{ width: `${percentage}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

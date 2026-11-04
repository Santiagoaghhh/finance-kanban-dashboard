"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  KanbanSquare,
  LayoutDashboard,
  PiggyBank,
  Settings,
  Wallet,
  Database,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Finanzas",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/finanzas/movimientos", label: "Movimientos", icon: Wallet },
      { href: "/finanzas/presupuestos", label: "Presupuestos", icon: PiggyBank },
      { href: "/finanzas/reportes", label: "Reportes", icon: BarChart3 },
    ],
  },
  {
    label: "Organización",
    items: [
      { href: "/kanban", label: "Kanban", icon: KanbanSquare },
      { href: "/configuracion", label: "Configuración", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3">
      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm">
        <Database className="h-5 w-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-semibold text-slate-900">Panel Finanzas</span>
        <span className="block text-xs text-slate-500">+ Kanban personal</span>
      </span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <div className="px-5 py-6">
          <Brand />
        </div>
        <nav className="flex-1 space-y-6 px-3">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {group.label}
              </p>
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-brand-50 text-brand-700"
                            : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            active ? "text-brand-600" : "text-slate-400",
                          )}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
        <div className="m-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-500">
          <p className="font-medium text-slate-700">Datos locales</p>
          <p className="mt-1 leading-relaxed">
            Todo se guarda en{" "}
            <span className="font-mono text-[11px] text-slate-600">data/finanzas.xlsx</span>
          </p>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <Brand />
        </div>
        <nav className="flex gap-1 overflow-x-auto px-3 pb-2">
          {groups
            .flatMap((group) => group.items)
            .map((item) => {
              const Icon = item.icon;
              const active = isActive(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium",
                    active
                      ? "bg-brand-50 text-brand-700"
                      : "text-slate-600 hover:bg-slate-50",
                  )}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {item.label}
                </Link>
              );
            })}
        </nav>
      </header>
    </>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "Panel Finanzas + Kanban",
  description: "Control de ingresos, gastos, presupuestos y pendientes.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body>
        <Sidebar />
        <main className="min-h-screen lg:pl-64">
          <div className="mx-auto w-full max-w-7xl px-4 pb-16 pt-6 sm:px-6 lg:px-8 lg:pt-10">
            {children}
          </div>
        </main>
      </body>
    </html>
  );
}

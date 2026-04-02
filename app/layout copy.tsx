"use client";

import "./globals.css";
import Sidebar from "@/components/layout/sidebar";
import { usePathname } from "next/navigation";
import { Metadata } from "next";

// app/layout.tsx
export const metadata: Metadata = {
  title: "Prospekto", // ← Cambiar aquí
  description: "SaaS que automatiza respuestas con IA y organiza leads para equipos de ventas",
};


export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideSidebar = pathname === "/login";

  return (
    <html lang="es">
      <body className="bg-[#f7f5fb] text-slate-900 antialiased">
        {hideSidebar ? (
          children
        ) : (
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 pt-16 lg:pt-0 p-4 md:p-6 lg:p-8 overflow-x-hidden">
              <div className="mx-auto max-w-7xl">{children}</div>
            </main>
          </div>
        )}
      </body>
    </html>
  );
}
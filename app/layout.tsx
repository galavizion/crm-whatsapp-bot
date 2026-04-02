import "./globals.css";
import { Metadata } from "next";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "Prospekto",
  description: "SaaS que automatiza respuestas con IA y organiza leads para equipos de ventas",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="bg-[#f7f5fb] text-slate-900 antialiased">
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
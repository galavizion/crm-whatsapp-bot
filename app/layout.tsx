import "./globals.css";
import { Metadata } from "next";
import ClientLayout from "@/components/layout/ClientLayout";

export const metadata: Metadata = {
  title: "Prospekto",
  description: "SaaS que automatiza respuestas con IA y organiza leads para equipos de ventas. Bot con IA en Monterrey",
manifest: "/manifest.json",
icons: {
    icon: [
      { url: "/Prospekt-icono.ico" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/Prospekt-icono.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
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
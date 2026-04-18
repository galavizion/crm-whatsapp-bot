"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bot, Phone } from "lucide-react";

const TABS = [
  { href: "/mi-negocio/bot", label: "Configuración del Bot", icon: Bot },
  { href: "/mi-negocio/perfil", label: "Perfil de WhatsApp", icon: Phone },
];

export default function TabsNav() {
  const pathname = usePathname();

  return (
    <div className="flex gap-1 bg-white border border-slate-200 rounded-2xl p-1 shadow-sm">
      {TABS.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
              active
                ? "bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] text-white shadow-md"
                : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{label.split(" ")[0]}</span>
          </Link>
        );
      })}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  Users, 
  Bot, 
  Building2, 
  LogOut,
  Menu 
} from "lucide-react";

export default function Sidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-[#2f2944] px-4 py-3 lg:hidden border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
            <Bot className="text-white" size={18} />
          </div>
          <span className="text-base font-bold text-white">Prospekto</span>
        </div>
        <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white">
          <Menu size={18} />
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex min-h-screen w-72 flex-col border-r border-white/10 bg-[#2f2944] px-5 py-6 text-white shadow-[0_10px_40px_rgba(53,37,78,0.22)]">
        <div className="flex h-full flex-col">
          {/* Header Card */}
          <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(140,122,198,0.30)_0%,rgba(200,79,146,0.22)_100%)] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/10">
                <Bot className="text-white" size={22} />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/60">Sistema</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Prospekto</h2>
              </div>
            </div>
            <p className="mt-4 text-sm leading-6 text-white/75">
              Leads desde WhatsApp con IA, seguimiento comercial y control de conversaciones.
            </p>
          </div>

          {/* Navigation */}
          <nav className="mt-8 space-y-2">
            <Link
              href="/dashboard"
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive("/dashboard")
                  ? "bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] text-white shadow-[0_10px_25px_rgba(200,79,146,0.24)]"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  isActive("/dashboard")
                    ? "bg-white/15 text-white"
                    : "bg-white/5 text-white/75 group-hover:bg-white/10 group-hover:text-white"
                }`}
              >
                <LayoutDashboard size={18} />
              </span>
              <span>Dashboard</span>
            </Link>

            <Link
              href="/leads"
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive("/leads")
                  ? "bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] text-white shadow-[0_10px_25px_rgba(200,79,146,0.24)]"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  isActive("/leads")
                    ? "bg-white/15 text-white"
                    : "bg-white/5 text-white/75 group-hover:bg-white/10 group-hover:text-white"
                }`}
              >
                <Users size={18} />
              </span>
              <span>Leads</span>
            </Link>

            <Link
              href="/admin/bot"
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive("/admin/bot")
                  ? "bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] text-white shadow-[0_10px_25px_rgba(200,79,146,0.24)]"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  isActive("/admin/bot")
                    ? "bg-white/15 text-white"
                    : "bg-white/5 text-white/75 group-hover:bg-white/10 group-hover:text-white"
                }`}
              >
                <Bot size={18} />
              </span>
              <span>Config Bot</span>
            </Link>

            <Link
              href="/god/negocios"
              className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                isActive("/god/negocios")
                  ? "bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] text-white shadow-[0_10px_25px_rgba(200,79,146,0.24)]"
                  : "text-white/75 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  isActive("/god/negocios")
                    ? "bg-white/15 text-white"
                    : "bg-white/5 text-white/75 group-hover:bg-white/10 group-hover:text-white"
                }`}
              >
                <Building2 size={18} />
              </span>
              <span>Negocios</span>
              <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/60">
                GOD
              </span>
            </Link>
          </nav>

          {/* Footer */}
          <div className="mt-auto space-y-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">Estado</p>
              <p className="mt-3 text-sm font-medium text-white">Panel activo</p>
              <p className="mt-2 text-sm leading-6 text-white/70">
                Tu CRM está listo para revisar leads y conversaciones.
              </p>
            </div>

            <button className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white disabled:opacity-50">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
                <LogOut size={18} />
              </span>
              Cerrar sesión
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
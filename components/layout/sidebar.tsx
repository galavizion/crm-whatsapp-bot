"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Users,
  Bot,
  Building2,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import Image from "next/image";

const GOD_EMAIL = "rene.galaviz@gmail.com";

function WAIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function FBIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IGIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

const LEADS_SUBITEMS = [
  { href: "/leads/whatsapp", label: "WhatsApp", icon: "wa", color: "text-emerald-400" },
  { href: "/leads/facebook", label: "Facebook", icon: "fb", color: "text-blue-400" },
  { href: "/leads/instagram", label: "Instagram", icon: "ig", color: "text-pink-400" },
] as const;

const NEGOCIO_SUBITEMS = [
  { href: "/mi-negocio/bot", label: "Mi Bot", icon: "bot", color: "text-violet-400" },
  { href: "/mi-negocio/whatsapp", label: "WhatsApp", icon: "wa", color: "text-emerald-400" },
  { href: "/mi-negocio/facebook", label: "Facebook", icon: "fb", color: "text-blue-400" },
  { href: "/mi-negocio/instagram", label: "Instagram", icon: "ig", color: "text-pink-400" },
  { href: "/mi-negocio/equipo", label: "Equipo", icon: "users", color: "text-amber-400" },
] as const;

type IconKey = "wa" | "fb" | "ig" | "bot" | "users";

function SubIcon({ icon, size = 14 }: { icon: IconKey; size?: number }) {
  if (icon === "wa") return <WAIcon size={size} />;
  if (icon === "fb") return <FBIcon size={size} />;
  if (icon === "ig") return <IGIcon size={size} />;
  if (icon === "bot") return <Bot size={size} />;
  return <Users size={size} />;
}

function NavContent({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const [leadsOpen, setLeadsOpen] = useState(() => pathname.startsWith("/leads"));
  const [negocioOpen, setNegocioOpen] = useState(() => pathname.startsWith("/mi-negocio"));
  const [isGod, setIsGod] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (pathname.startsWith("/leads")) setLeadsOpen(true);
    if (pathname.startsWith("/mi-negocio")) setNegocioOpen(true);
  }, [pathname]);

  useEffect(() => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    supabase.auth.getUser().then(({ data }) => {
      setIsGod(data.user?.email === GOD_EMAIL);
    });
  }, []);

  const handleLogout = async () => {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await supabase.auth.signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const navItemBase = "group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition w-full text-left";
  const navItemActive = "bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] text-white shadow-[0_10px_25px_rgba(200,79,146,0.24)]";
  const navItemInactive = "text-white/75 hover:bg-white/10 hover:text-white";

  const iconBase = "flex h-9 w-9 items-center justify-center rounded-xl transition shrink-0";
  const iconActive = "bg-white/15 text-white";
  const iconInactive = "bg-white/5 text-white/75 group-hover:bg-white/10 group-hover:text-white";

  const subItemBase = "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-medium transition w-full";
  const subItemActive = "bg-white/15 text-white";
  const subItemInactive = "text-white/60 hover:bg-white/8 hover:text-white/90";

  return (
    <div className="flex h-full flex-col">
      {/* Header Card */}
      <div className="rounded-3xl border border-white/10 bg-[linear-gradient(135deg,rgba(140,122,198,0.30)_0%,rgba(200,79,146,0.22)_100%)] p-5 shadow-[0_10px_30px_rgba(0,0,0,0.18)]">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white overflow-hidden p-2">
            <Image src="/Prospekt-app.png" alt="Prospekto" width={40} height={40} className="object-contain" />
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
      <nav className="mt-8 space-y-1">
        {/* Dashboard */}
        <Link
          href="/dashboard"
          onClick={onClose}
          className={`${navItemBase} ${pathname === "/dashboard" ? navItemActive : navItemInactive}`}
        >
          <span className={`${iconBase} ${pathname === "/dashboard" ? iconActive : iconInactive}`}>
            <LayoutDashboard size={18} />
          </span>
          <span>Dashboard</span>
        </Link>

        {/* Leads con submenú */}
        <div>
          <button
            onClick={() => {
              setLeadsOpen((o) => !o);
              if (!leadsOpen) {
                // navigate to leads on first open
              }
            }}
            className={`${navItemBase} ${pathname.startsWith("/leads") ? navItemActive : navItemInactive}`}
          >
            <span className={`${iconBase} ${pathname.startsWith("/leads") ? iconActive : iconInactive}`}>
              <Users size={18} />
            </span>
            <span className="flex-1 text-left">Leads</span>
            <span className="opacity-60">
              {leadsOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          </button>

          {leadsOpen && (
            <div className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-0.5">
              {LEADS_SUBITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`${subItemBase} ${pathname === item.href ? subItemActive : subItemInactive}`}
                >
                  <span className={item.color}>
                    <SubIcon icon={item.icon} size={13} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
              <Link
                href="/leads"
                onClick={onClose}
                className={`${subItemBase} ${pathname === "/leads" ? subItemActive : subItemInactive}`}
              >
                <span className="text-white/40">
                  <LayoutDashboard size={13} />
                </span>
                <span>Todos</span>
              </Link>
            </div>
          )}
        </div>

        {/* Mi Negocio con submenú */}
        <div>
          <button
            onClick={() => setNegocioOpen((o) => !o)}
            className={`${navItemBase} ${pathname.startsWith("/mi-negocio") ? navItemActive : navItemInactive}`}
          >
            <span className={`${iconBase} ${pathname.startsWith("/mi-negocio") ? iconActive : iconInactive}`}>
              <Bot size={18} />
            </span>
            <span className="flex-1 text-left">Mi Negocio</span>
            <span className="opacity-60">
              {negocioOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            </span>
          </button>

          {negocioOpen && (
            <div className="mt-1 ml-4 pl-4 border-l border-white/10 space-y-0.5">
              {NEGOCIO_SUBITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`${subItemBase} ${pathname === item.href ? subItemActive : subItemInactive}`}
                >
                  <span className={item.color}>
                    <SubIcon icon={item.icon} size={13} />
                  </span>
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* God mode */}
        {isGod && (
          <Link
            href="/god/negocios"
            onClick={onClose}
            className={`${navItemBase} ${pathname === "/god/negocios" ? navItemActive : navItemInactive}`}
          >
            <span className={`${iconBase} ${pathname === "/god/negocios" ? iconActive : iconInactive}`}>
              <Building2 size={18} />
            </span>
            <span>Negocios</span>
            <span className="ml-auto text-[10px] bg-white/10 px-1.5 py-0.5 rounded-full text-white/60">GOD</span>
          </Link>
        )}
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
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-white/70 transition hover:bg-white/10 hover:text-white"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5">
            <LogOut size={18} />
          </span>
          Cerrar sesión
        </button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      {/* Mobile Header */}
      <div className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between bg-[#2f2944] px-4 py-3 lg:hidden border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white overflow-hidden p-1">
            <Image src="/Prospekt-app.png" alt="Prospekto" width={32} height={32} className="object-contain" />
          </div>
          <span className="text-base font-bold text-white">Prospekto</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white"
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={`
        fixed top-16 left-0 bottom-0 z-40 w-72 transform transition-transform duration-300 ease-in-out lg:hidden
        ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        flex flex-col border-r border-white/10 bg-[#2f2944] px-5 py-6 text-white shadow-[0_10px_40px_rgba(53,37,78,0.22)] overflow-y-auto
      `}>
        <NavContent onClose={() => setMobileMenuOpen(false)} />
      </aside>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex min-h-screen w-72 flex-col border-r border-white/10 bg-[#2f2944] px-5 py-6 text-white shadow-[0_10px_40px_rgba(53,37,78,0.22)] overflow-y-auto">
        <NavContent />
      </aside>
    </>
  );
}

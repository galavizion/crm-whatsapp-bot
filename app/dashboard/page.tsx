import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import {
  Users,
  PhoneCall,
  MessageSquare,
  BadgeCheck,
  XCircle,
  ArrowUpRight,
} from "lucide-react";
import { RefreshButton } from "@/components/RefreshButton";
import { AutoRefreshOnFocus } from "@/components/AutoRefreshOnFocus";

type Contacto = {
  id: string;
  nombre: string | null;
  whatsapp: string | null;
  resumen: string | null;
  necesidad: string | null;
  estado: string | null;
  assigned_user_id: string | null;
  ultima_respuesta: string | null;
  created_at: string | null;
};

type Profile = {
  id: string;
  user_id: string;
  email: string | null;
  role: "admin" | "vendedor" | null;
};

const STATUS_CONFIG = [
  {
    key: "interesado",
    label: "Interesados",
    icon: MessageSquare,
    color:
      "border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-300 hover:bg-blue-100",
  },
  {
    key: "contactar",
    label: "Contactar",
    icon: PhoneCall,
    color:
      "border-amber-200 bg-amber-50 text-amber-800 hover:border-amber-300 hover:bg-amber-100",
  },
  {
    key: "contactado",
    label: "Contactados",
    icon: Users,
    color:
      "border-violet-200 bg-violet-50 text-violet-800 hover:border-violet-300 hover:bg-violet-100",
  },
  {
    key: "cliente",
    label: "Clientes",
    icon: BadgeCheck,
    color:
      "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100",
  },
  {
    key: "perdido",
    label: "Perdidos",
    icon: XCircle,
    color:
      "border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-300 hover:bg-rose-100",
  },
];

function getStatusCount(contactos: Contacto[], status: string) {
  return contactos.filter((c) => (c.estado || "").toLowerCase() === status).length;
}

function formatDate(dateString: string | null) {
  if (!dateString) return "Sin fecha";
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(dateString));
  } catch {
    return "Sin fecha";
  }
}

function relativeDate(dateString: string | null) {
  if (!dateString) return "—";
  try {
    const d = new Date(dateString);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return "ahora";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(d);
  } catch {
    return "—";
  }
}

const AVATAR_COLORS = ["#8c7ac6", "#c84f92", "#2ec4a5", "#f59e0b", "#3b82f6"];

function getInitials(name: string | null) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function getAvatarColor(name: string | null) {
  if (!name) return AVATAR_COLORS[0];
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

function getBadgeClasses(estado: string | null) {
  const v = (estado || "").toLowerCase();
  if (v === "interesado") return "bg-blue-100 text-blue-800";
  if (v === "contactar") return "bg-amber-100 text-amber-800";
  if (v === "contactado") return "bg-violet-100 text-violet-800";
  if (v === "cliente") return "bg-emerald-100 text-emerald-800";
  if (v === "perdido") return "bg-rose-100 text-rose-800";
  return "bg-neutral-100 text-neutral-700";
}

function getEstadoLabel(estado: string | null) {
  const map: Record<string, string> = {
    interesado: "Interesado",
    contactar: "Llamar",
    contactado: "Contactado",
    cliente: "Cliente",
    perdido: "Perdido",
  };
  return map[(estado || "").toLowerCase()] || estado || "Sin estado";
}

const GOD_EMAIL = "rene.galaviz@gmail.com";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const isGod = user.email === GOD_EMAIL;

  let role = "";
  let isAdmin = false;
  let contactos: Contacto[] = [];

  if (isGod) {
    isAdmin = true;
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const { data } = await admin
      .from("contactos")
      .select("id, nombre, whatsapp, resumen, necesidad, estado, assigned_user_id, ultima_respuesta, created_at")
      .order("created_at", { ascending: false });
    contactos = (data ?? []) as Contacto[];
    role = "god";
  } else {
    const { data: userData } = await supabase
      .from("business_users")
      .select("role")
      .eq("user_id", user.id)
      .maybeSingle();

    role = String(userData?.role || "").toLowerCase().trim();
    isAdmin = role === "admin";

    let contactosQuery = supabase
      .from("contactos")
      .select("id, nombre, whatsapp, resumen, necesidad, estado, assigned_user_id, ultima_respuesta, created_at")
      .order("created_at", { ascending: false });

    if (!isAdmin) {
      contactosQuery = contactosQuery.eq("assigned_user_id", user.id);
    }

    const { data: contactosData, error: contactosError } = await contactosQuery;

    if (contactosError) {
      return (
        <div className="p-6">
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
            Error cargando dashboard: {contactosError.message}
          </div>
        </div>
      );
    }
    contactos = (contactosData ?? []) as Contacto[];
  }

  const totalLeads = contactos.length;
  const recientes = contactos.slice(0, 8);

  return (
    <main className="min-h-screen bg-neutral-50">
      {/* ✅ NUEVO: Auto-refresh al volver a la pestaña */}
      <AutoRefreshOnFocus />
      
      <div className="mx-auto max-w-7xl px-4 py-6 md:px-6 lg:px-8">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-neutral-500">
              {isGod ? "Vista God" : isAdmin ? "Vista administrador" : "Vista vendedor"}
            </p>

            <h1 className="text-3xl font-bold tracking-tight text-neutral-900">
              {isGod ? "Dashboard global" : isAdmin ? "Dashboard de leads" : "Mis leads"}
            </h1>

            <p className="mt-1 text-sm text-neutral-600">
              {isGod
                ? "Todos los leads de todos los negocios."
                : isAdmin
                ? "Resumen general del CRM y acceso rápido por estado."
                : "Aquí ves únicamente tus leads y tus pendientes."}
            </p>

          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {/* ✅ BOTÓN MEJORADO: Azul con gradiente y sombra */}
            <RefreshButton />
            
            <Link
              href="/leads"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 shadow-sm transition hover:bg-neutral-100"
            >
              Ver lista
              <ArrowUpRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mb-6">
          <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-neutral-500">
              {isGod ? "Total global" : isAdmin ? "Total de leads" : "Mis leads totales"}
            </p>

            <div className="mt-2 flex items-end gap-3">
              <span className="text-4xl font-bold tracking-tight text-neutral-900">
                {totalLeads}
              </span>

              <span className="pb-1 text-sm text-neutral-500">
                {isGod ? "en todos los negocios" : isAdmin ? "en todo el sistema" : "asignados a ti"}
              </span>
            </div>
          </div>
        </div>

        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              {isAdmin ? "Leads por estado" : "Mis leads por estado"}
            </h2>

            <p className="text-sm text-neutral-500">
              Da clic en una tarjeta para abrir la lista filtrada
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {STATUS_CONFIG.map((status) => {
              const count = getStatusCount(contactos, status.key);
              const Icon = status.icon;
              const href = `/leads?estado=${encodeURIComponent(status.key)}`;

              return (
                <Link
                  key={status.key}
                  href={href}
                  className={`group rounded-2xl border p-4 shadow-sm transition ${status.color}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-bold uppercase tracking-wide opacity-70">{status.label}</p>
                      <p className="mt-1.5 text-3xl font-bold">{count}</p>
                    </div>
                    <Icon className="h-4 w-4 opacity-50 transition group-hover:scale-110" />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              {isAdmin ? "Leads recientes" : "Mis leads recientes"}
            </h2>

            <Link
              href="/leads"
              className="text-sm font-medium text-neutral-600 transition hover:text-neutral-900"
            >
              Ver todos
            </Link>
          </div>

          <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm">
            {recientes.length === 0 ? (
              <div className="p-6 text-sm text-neutral-500">
                No hay leads para mostrar.
              </div>
            ) : (
              <div className="divide-y divide-neutral-100">
                {recientes.map((lead) => (
                  <Link
                    key={lead.id}
                    href={`/leads/${lead.id}`}
                    className="flex items-center gap-3 px-4 py-3 transition hover:bg-neutral-50/80"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
                      style={{ background: getAvatarColor(lead.nombre) }}
                    >
                      {getInitials(lead.nombre)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-sm font-semibold text-neutral-900">
                          {lead.nombre || "Sin nombre"}
                        </span>
                        <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${getBadgeClasses(lead.estado)}`}>
                          {getEstadoLabel(lead.estado)}
                        </span>
                      </div>
                      {lead.necesidad && (
                        <p className="mt-0.5 truncate text-xs text-neutral-500">{lead.necesidad}</p>
                      )}
                    </div>
                    <span
                      className="shrink-0 text-xs font-semibold text-neutral-500"
                      title={formatDate(lead.ultima_respuesta || lead.created_at)}
                    >
                      {relativeDate(lead.ultima_respuesta || lead.created_at)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { ArrowLeft, ArrowUpRight } from "lucide-react";
import StatusDropdown from "@/components/StatusDropdown";
import { ClickableRow } from "@/components/ClickableRow";

const GOD_EMAIL = "rene.galaviz@gmail.com";

type Contacto = {
  id: string;
  whatsapp: string | null;
  nombre: string | null;
  necesidad: string | null;
  estado: string | null;
  ultima_respuesta: string | null;
  created_at: string | null;
  business_id?: string | null;
};

const ESTADOS = [
  { key: "interesado", label: "Interesados", cls: "bg-blue-100 text-blue-800" },
  { key: "contactar", label: "Llamar", cls: "bg-amber-100 text-amber-800" },
  { key: "contactado", label: "Contactados", cls: "bg-violet-100 text-violet-800" },
  { key: "cliente", label: "Clientes", cls: "bg-emerald-100 text-emerald-800" },
  { key: "perdido", label: "Perdidos", cls: "bg-rose-100 text-rose-800" },
];

const AVATAR_COLORS = ["#8c7ac6", "#c84f92", "#2ec4a5", "#f59e0b", "#3b82f6"];
function getInitials(n: string | null) { return n ? n.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase() : "?"; }
function getAvatarColor(n: string | null) { return n ? AVATAR_COLORS[n.charCodeAt(0) % AVATAR_COLORS.length] : AVATAR_COLORS[0]; }
function getEstadoStyle(e: string | null) {
  const found = ESTADOS.find(s => s.key === (e || "").toLowerCase());
  return found ? { label: found.label, cls: found.cls } : { label: e || "—", cls: "bg-neutral-100 text-neutral-700" };
}
function relativeDate(d: string | null) {
  if (!d) return "—";
  try {
    const diff = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
    if (diff < 60) return "ahora";
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d`;
    return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(new Date(d));
  } catch { return "—"; }
}

export default async function LeadsFacebookPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const isGod = user.email === GOD_EMAIL;
  let contactos: Contacto[] = [];
  let businessMap: Record<string, string> = {};

  if (isGod) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    const [{ data: biz }, { data: leads }] = await Promise.all([
      admin.from("businesses").select("id, name"),
      admin.from("contactos")
        .select("id, whatsapp, nombre, necesidad, estado, ultima_respuesta, created_at, business_id")
        .eq("canal", "facebook").order("ultima_respuesta", { ascending: false }),
    ]);
    businessMap = Object.fromEntries((biz || []).map((b: any) => [b.id, b.name]));
    contactos = (leads || []) as Contacto[];
  } else {
    const { data: bu } = await supabase
      .from("business_users").select("business_id, role").eq("user_id", user.id).maybeSingle();
    if (!bu?.business_id) redirect("/dashboard");
    const role = (bu.role || "").toLowerCase();

    let q = supabase.from("contactos")
      .select("id, whatsapp, nombre, necesidad, estado, ultima_respuesta, created_at")
      .eq("business_id", bu.business_id).eq("canal", "facebook")
      .order("ultima_respuesta", { ascending: false });
    if (role !== "admin") q = q.eq("assigned_user_id", user.id);
    contactos = ((await q).data || []) as Contacto[];
  }

  return (
    <main className="min-h-screen bg-neutral-50">
      <div className="px-4 py-6 md:px-6 lg:px-8 max-w-5xl">
        <div className="mb-6">
          <Link href="/leads" className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-neutral-500 hover:text-neutral-900 transition">
            <ArrowLeft className="h-4 w-4" />Todos los leads
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900">Facebook</h1>
          <p className="mt-1 text-sm text-neutral-600">Conversaciones de Messenger.</p>
        </div>

        {contactos.length === 0 ? (
          <EmptyState text="No hay conversaciones de Messenger todavía." />
        ) : (
          <LeadsTable contactos={contactos} isGod={isGod} businessMap={businessMap} />
        )}
      </div>
    </main>
  );
}

function LeadsTable({ contactos, isGod, businessMap }: { contactos: Contacto[]; isGod: boolean; businessMap: Record<string, string> }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow-sm lg:block">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-neutral-100 bg-neutral-50">
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-neutral-500">Nombre</th>
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-neutral-500">Estado</th>
              {isGod && <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-neutral-500">Negocio</th>}
              <th className="px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wide text-neutral-500">Necesidad</th>
              <th className="px-4 py-3 text-right text-[11px] font-bold uppercase tracking-wide text-neutral-500">Actividad</th>
            </tr>
          </thead>
          <tbody>
            {contactos.map((lead) => {
              return (
                <ClickableRow key={lead.id} href={`/leads/${lead.id}`} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50/60 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: getAvatarColor(lead.nombre) }}>
                        {getInitials(lead.nombre)}
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-neutral-900">{lead.nombre || "Sin nombre"}</div>
                        <div className="text-[11px] text-neutral-400">{lead.whatsapp || "—"}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><StatusDropdown id={lead.id} current={lead.estado || ""} /></td>
                  {isGod && <td className="px-4 py-3"><span className="text-sm font-medium text-indigo-600">{lead.business_id ? (businessMap[lead.business_id] || "—") : "—"}</span></td>}
                  <td className="px-4 py-3 max-w-52"><div className="truncate text-xs text-neutral-500">{lead.necesidad || "—"}</div></td>
                  <td className="px-4 py-3 text-right"><span className="text-xs font-semibold text-neutral-700">{relativeDate(lead.ultima_respuesta || lead.created_at)}</span></td>
                </ClickableRow>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="space-y-3 lg:hidden">
        {contactos.map((lead) => {
          const est = getEstadoStyle(lead.estado);
          return (
            <div key={lead.id} className="rounded-2xl border border-neutral-200 bg-white p-4 shadow-sm">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: getAvatarColor(lead.nombre) }}>
                    {getInitials(lead.nombre)}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-neutral-900 truncate">{lead.nombre || "Sin nombre"}</h3>
                    <p className="text-xs text-neutral-500 truncate">{lead.whatsapp || "—"}</p>
                  </div>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${est.cls}`}>{est.label}</span>
              </div>
              {lead.necesidad && <p className="mb-3 text-sm text-neutral-600 line-clamp-2">{lead.necesidad}</p>}
              <div className="flex items-center justify-between gap-3">
                <StatusDropdown id={lead.id} current={lead.estado || ""} />
                <Link href={`/leads/${lead.id}`} className="inline-flex items-center gap-1 text-xs font-medium text-neutral-600 hover:text-neutral-900">
                  Ver <ArrowUpRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-10 text-center shadow-sm">
      <p className="text-sm text-neutral-500">{text}</p>
    </div>
  );
}

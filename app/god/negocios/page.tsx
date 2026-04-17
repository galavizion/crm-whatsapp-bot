import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Plus, Building2 } from "lucide-react";
import NegociosList from "@/components/god/NegociosList";

const GOD_EMAIL = "rene.galaviz@gmail.com";

export default async function GodNegociosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== GOD_EMAIL) redirect("/dashboard");

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: businesses } = await admin
    .from("businesses")
    .select("id, name, slug, status, suspended_reason, suspended_at, created_at")
    .order("created_at", { ascending: false });

  const stats = await Promise.all(
    (businesses || []).map(async (b) => {
      const [{ count: leads }, { count: users }, { data: wa }] = await Promise.all([
        admin.from("contactos").select("id", { count: "exact", head: true }).eq("business_id", b.id),
        admin.from("business_users").select("id", { count: "exact", head: true }).eq("business_id", b.id),
        admin.from("whatsapp_accounts").select("display_phone").eq("business_id", b.id).maybeSingle(),
      ]);
      return { business_id: b.id, leads: leads ?? 0, users: users ?? 0, displayPhone: wa?.display_phone ?? null };
    })
  );

  const negocios = (businesses || []).map((b) => {
    const s = stats.find((x) => x.business_id === b.id)!;
    return {
      id: b.id,
      name: b.name,
      slug: b.slug,
      status: b.status ?? "active",
      suspended_reason: b.suspended_reason,
      suspended_at: b.suspended_at,
      created_at: b.created_at,
      displayPhone: s.displayPhone,
      leads: s.leads,
      users: s.users,
    };
  });

  const activos = negocios.filter((n) => !n.status || n.status === "active").length;
  const suspendidos = negocios.filter((n) => n.status === "suspended").length;

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto p-4 md:p-6 space-y-6">

        {/* HEADER */}
        <div className="bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] rounded-2xl p-6 text-white">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-white/60">Super Admin</p>
                <h1 className="text-xl font-bold">Negocios</h1>
              </div>
            </div>
            <Link
              href="/god/negocios/nuevo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white text-indigo-900 font-semibold text-sm rounded-xl hover:bg-indigo-50 transition"
            >
              <Plus className="w-4 h-4" />
              Nuevo negocio
            </Link>
          </div>
          <div className="mt-4 flex gap-6 text-sm text-white/70">
            <span>{negocios.length} total</span>
            <span className="text-emerald-300">{activos} activos</span>
            {suspendidos > 0 && <span className="text-amber-300">{suspendidos} suspendidos</span>}
          </div>
        </div>

        <NegociosList negocios={negocios} />
      </div>
    </div>
  );
}

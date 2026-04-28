import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2 } from "lucide-react";
import { updateBusiness } from "@/app/god/negocios/actions";

const GOD_EMAIL = "rene.galaviz@gmail.com";

const inputClass = "w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-300 placeholder:text-slate-400 bg-white";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default async function EditarNegocioPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { id } = await params;
  const { saved } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (user.email !== GOD_EMAIL) redirect("/dashboard");

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: business } = await admin.from("businesses").select("*").eq("id", id).maybeSingle();
  if (!business) redirect("/god/negocios");

  const { data: waRows } = await admin.from("whatsapp_accounts").select("*").eq("business_id", id).order("created_at", { ascending: false }).limit(1);
  const wa = waRows?.[0] ?? null;
  const { data: adminUser } = await admin.from("business_users").select("email").eq("business_id", id).eq("role", "admin").maybeSingle();

  async function handleUpdate(formData: FormData) {
    "use server";
    await updateBusiness(id, formData);
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">

        <Link href="/god/negocios" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition font-medium">
          <ArrowLeft className="w-4 h-4" />
          Volver a negocios
        </Link>

        <div className="bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60">Super Admin</p>
              <h1 className="text-xl font-bold">Editar negocio</h1>
              <p className="text-sm text-white/60 mt-0.5">{business.name}</p>
            </div>
          </div>
        </div>

        {/* BANNER DE ÉXITO */}
        {saved === "true" && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="text-sm font-semibold text-emerald-700">¡Cambios guardados correctamente!</p>
            </div>
            <ul className="space-y-1.5 pl-8">
              {[
                { label: "Nombre", value: business.name },
                { label: "Slug", value: business.slug },
                { label: "Phone Number ID", value: wa?.phone_number_id || "—" },
                { label: "Número visible", value: wa?.display_phone || "—" },
                { label: "Access Token", value: wa?.access_token ? "••••••••" + wa.access_token.slice(-6) : "—" },
              ].map(({ label, value }) => (
                <li key={label} className="text-sm text-emerald-700 flex gap-2">
                  <span className="font-medium">{label}:</span>
                  <span className="text-emerald-600">{value}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <form action={handleUpdate} className="space-y-5">

          <Section title="Información del negocio">
            <Field label="Nombre del negocio">
              <input name="name" defaultValue={business.name || ""} required className={inputClass} />
            </Field>
            <Field label="Slug">
              <input name="slug" defaultValue={business.slug || ""} required className={inputClass} />
              <p className="text-xs text-slate-400 mt-1">Solo minúsculas, sin espacios.</p>
            </Field>
          </Section>

          {adminUser && (
            <Section title="Administrador actual">
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 border border-slate-200">
                {adminUser.email}
              </p>
              <p className="text-xs text-slate-400">Para cambiar el admin, hazlo desde la sección Usuarios en Gestionar.</p>
            </Section>
          )}

          <Section title="Cuenta de WhatsApp">
            <Field label="Phone Number ID">
              <input name="phone_number_id" defaultValue={wa?.phone_number_id || ""} placeholder="Ej: 1014747251727193" className={inputClass} />
            </Field>
            <Field label="Número visible">
              <input name="display_phone" defaultValue={wa?.display_phone || ""} placeholder="Ej: 8181817006" className={inputClass} />
            </Field>
            <Field label="Access Token de Meta">
              <input name="access_token" defaultValue={wa?.access_token || ""} placeholder="EAA..." className={inputClass} />
              <p className="text-xs text-slate-400 mt-1">Deja vacío para no modificar el token actual.</p>
            </Field>
          </Section>

          <div className="flex gap-3">
            <Link
              href="/god/negocios"
              className="flex-1 py-3 text-center border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              className="flex-1 py-3 bg-[linear-gradient(135deg,#1e1b4b_0%,#312e81_100%)] hover:opacity-90 text-white font-semibold rounded-xl transition shadow-lg text-sm"
            >
              Guardar cambios
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}

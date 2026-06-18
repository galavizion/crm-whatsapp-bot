import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { CheckCircle2, Circle, BookOpen } from "lucide-react";
import Link from "next/link";
import ConnectWhatsAppButton from "@/components/meta/ConnectWhatsAppButton";
import PerfilForm from "@/components/mi-negocio/PerfilForm";

const GOD_EMAIL = "rene.galaviz@gmail.com";

export default async function WhatsAppPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: businessUser } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!businessUser?.business_id) redirect("/dashboard");
  if ((businessUser.role || "").toLowerCase() !== "admin") redirect("/dashboard");

  const businessId = businessUser.business_id;
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: waAccount }, { data: business }] = await Promise.all([
    admin
      .from("whatsapp_accounts")
      .select("display_phone")
      .eq("business_id", businessId)
      .eq("is_active", true)
      .maybeSingle(),
    admin
      .from("businesses")
      .select("id, whatsapp_profile_photo, whatsapp_category, whatsapp_description, whatsapp_email, whatsapp_website, whatsapp_address, whatsapp_hours")
      .eq("id", businessId)
      .maybeSingle(),
  ]);

  if (!business) redirect("/dashboard");

  return (
    <div className="space-y-6 pb-10">

      {/* ── Conexión WhatsApp ─────────────────────────────────── */}
      <section className="space-y-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Connect WhatsApp Business</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Link your WhatsApp Business number so the bot can respond automatically.
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className={`${waAccount ? "bg-emerald-50 border-emerald-200" : "bg-slate-50 border-slate-100"} border-b px-5 py-4 flex items-center justify-between`}>
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${waAccount ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                <WAIcon />
              </div>
              <div>
                <p className="font-semibold text-slate-800 text-sm">WhatsApp Business</p>
                {waAccount?.display_phone && (
                  <p className="text-xs text-slate-500 mt-0.5">+{waAccount.display_phone}</p>
                )}
              </div>
            </div>
            {waAccount ? (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Connected
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                <Circle className="w-3.5 h-3.5" />
                Not connected
              </div>
            )}
          </div>

          <div className="px-5 py-4">
            {waAccount ? (
              <div className="flex items-center justify-between flex-wrap gap-3">
                <p className="text-xs text-slate-500">Want to change the connected number?</p>
                <ConnectWhatsAppButton businessId={businessId} />
              </div>
            ) : (
              <ConnectWhatsAppButton businessId={businessId} />
            )}
          </div>
        </div>

        <Link
          href="/mi-negocio/whatsapp/manual"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition"
        >
          <BookOpen className="w-4 h-4" />
          Prefer to do it manually? View step-by-step guide
        </Link>
      </section>

      {/* ── Perfil de WhatsApp ────────────────────────────────── */}
      <section className="space-y-1">
        <div className="border-t border-slate-200 pt-6">
          <h2 className="text-sm font-semibold text-slate-800">WhatsApp Profile</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Customize how your business appears when clients search for you on WhatsApp.
          </p>
        </div>
      </section>

      <PerfilForm
        businessId={business.id}
        isGod={user.email === GOD_EMAIL}
        initial={{
          whatsapp_profile_photo: business.whatsapp_profile_photo ?? null,
          whatsapp_category: business.whatsapp_category ?? null,
          whatsapp_description: business.whatsapp_description ?? null,
          whatsapp_email: business.whatsapp_email ?? null,
          whatsapp_website: business.whatsapp_website ?? null,
          whatsapp_address: business.whatsapp_address ?? null,
          whatsapp_hours: business.whatsapp_hours ?? null,
        }}
      />
    </div>
  );
}

function WAIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

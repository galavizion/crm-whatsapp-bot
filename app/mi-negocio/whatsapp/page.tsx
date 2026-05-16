import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { CheckCircle2, Circle, BookOpen } from "lucide-react";
import Link from "next/link";
import ConnectWhatsAppButton from "@/components/meta/ConnectWhatsAppButton";
import ConnectMetaPagesButton from "@/components/meta/ConnectMetaPagesButton";

export default async function ConexionesPage() {
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

  const [{ data: waAccount }, { data: igAccount }, { data: fbAccount }] = await Promise.all([
    admin.from("whatsapp_accounts").select("display_phone").eq("business_id", businessId).eq("is_active", true).maybeSingle(),
    admin.from("social_accounts").select("instagram_account_id").eq("business_id", businessId).eq("platform", "instagram").eq("is_active", true).maybeSingle(),
    admin.from("social_accounts").select("page_id").eq("business_id", businessId).eq("platform", "facebook").eq("is_active", true).maybeSingle(),
  ]);

  return (
    <div className="space-y-4 pb-10">
      <p className="text-sm text-slate-500">
        Conecta tus cuentas para que el bot responda automáticamente en los 3 canales.
      </p>

      {/* WhatsApp */}
      <PlatformCard
        color="emerald"
        icon={<WhatsAppIcon />}
        name="WhatsApp Business"
        connected={!!waAccount}
        detail={waAccount?.display_phone ? `+${waAccount.display_phone}` : undefined}
      >
        <ConnectWhatsAppButton businessId={businessId} />
      </PlatformCard>

      {/* Instagram */}
      <PlatformCard
        color="pink"
        icon={<InstagramIcon />}
        name="Instagram"
        connected={!!igAccount}
        detail={igAccount ? "Cuenta vinculada" : undefined}
      >
        <ConnectMetaPagesButton businessId={businessId} />
      </PlatformCard>

      {/* Facebook */}
      <PlatformCard
        color="blue"
        icon={<FacebookIcon />}
        name="Facebook (Messenger)"
        connected={!!fbAccount}
        detail={fbAccount ? "Página vinculada" : undefined}
      >
        <ConnectMetaPagesButton businessId={businessId} />
      </PlatformCard>

      <p className="text-xs text-slate-400 pt-2">
        Instagram y Facebook se conectan juntos con el mismo botón — usan el mismo inicio de sesión de Meta.
      </p>

      <div className="pt-2 border-t border-slate-200">
        <Link
          href="/mi-negocio/whatsapp/manual"
          className="inline-flex items-center gap-1.5 text-sm text-slate-400 hover:text-slate-700 transition"
        >
          <BookOpen className="w-4 h-4" />
          ¿Prefieres hacerlo manualmente? Ver guía paso a paso
        </Link>
      </div>
    </div>
  );
}

function PlatformCard({
  color,
  icon,
  name,
  connected,
  detail,
  children,
}: {
  color: "emerald" | "pink" | "blue";
  icon: React.ReactNode;
  name: string;
  connected: boolean;
  detail?: string;
  children: React.ReactNode;
}) {
  const colors = {
    emerald: { bg: "bg-emerald-50", border: "border-emerald-200", icon: "bg-emerald-100 text-emerald-700" },
    pink:    { bg: "bg-pink-50",    border: "border-pink-200",    icon: "bg-pink-100 text-pink-700" },
    blue:    { bg: "bg-blue-50",    border: "border-blue-200",    icon: "bg-blue-100 text-blue-700" },
  }[color];

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className={`${colors.bg} ${colors.border} border-b px-5 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors.icon}`}>
            {icon}
          </div>
          <div>
            <p className="font-semibold text-slate-800 text-sm">{name}</p>
            {detail && <p className="text-xs text-slate-500 mt-0.5">{detail}</p>}
          </div>
        </div>
        {connected ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-100 px-3 py-1 rounded-full">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Conectado
          </div>
        ) : (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            <Circle className="w-3.5 h-3.5" />
            No conectado
          </div>
        )}
      </div>

      {/* Action */}
      <div className="px-5 py-4">
        {connected ? (
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500">¿Quieres cambiar la cuenta conectada?</p>
            {children}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { CheckCircle2, Circle } from "lucide-react";
import ConnectMetaPagesButton from "@/components/meta/ConnectMetaPagesButton";

export default async function InstagramPage() {
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

  const { data: igAccount } = await admin
    .from("social_accounts")
    .select("instagram_account_id")
    .eq("business_id", businessId)
    .eq("platform", "instagram")
    .eq("is_active", true)
    .maybeSingle();

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Conectar Instagram</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Vincula tu cuenta profesional de Instagram para que el bot responda comentarios y mensajes directos.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className={`${igAccount ? "bg-pink-50 border-pink-200" : "bg-slate-50 border-slate-100"} border-b px-5 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${igAccount ? "bg-pink-100 text-pink-700" : "bg-slate-100 text-slate-500"}`}>
              <IGIcon />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Instagram</p>
              {igAccount && (
                <p className="text-xs text-slate-500 mt-0.5">Cuenta vinculada</p>
              )}
            </div>
          </div>
          {igAccount ? (
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

        <div className="px-5 py-4">
          {igAccount ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-slate-500">¿Quieres cambiar la cuenta conectada?</p>
              <ConnectMetaPagesButton businessId={businessId} platform="instagram" />
            </div>
          ) : (
            <ConnectMetaPagesButton businessId={businessId} platform="instagram" />
          )}
        </div>
      </div>

      <div className="bg-pink-50 border border-pink-100 rounded-2xl px-5 py-4 text-xs text-pink-700 space-y-1">
        <p className="font-semibold">¿Qué permisos se solicitan?</p>
        <ul className="list-disc list-inside space-y-0.5 text-pink-600">
          <li>Acceso básico a tu perfil de Instagram</li>
          <li>Responder mensajes directos</li>
          <li>Responder comentarios en tus publicaciones</li>
        </ul>
        <p className="text-pink-500 pt-1">
          Requiere una cuenta profesional (Creador o Empresa) vinculada a una página de Facebook.
        </p>
      </div>
    </div>
  );
}

function IGIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { CheckCircle2, Circle } from "lucide-react";
import ConnectMetaPagesButton from "@/components/meta/ConnectMetaPagesButton";

export default async function FacebookPage() {
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

  const { data: fbAccount } = await admin
    .from("social_accounts")
    .select("page_id")
    .eq("business_id", businessId)
    .eq("platform", "facebook")
    .eq("is_active", true)
    .maybeSingle();

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Conectar Facebook</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Vincula tu página de Facebook para que el bot responda mensajes de Messenger automáticamente.
        </p>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className={`${fbAccount ? "bg-blue-50 border-blue-200" : "bg-slate-50 border-slate-100"} border-b px-5 py-4 flex items-center justify-between`}>
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${fbAccount ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-500"}`}>
              <FBIcon />
            </div>
            <div>
              <p className="font-semibold text-slate-800 text-sm">Facebook (Messenger)</p>
              {fbAccount && (
                <p className="text-xs text-slate-500 mt-0.5">Página vinculada</p>
              )}
            </div>
          </div>
          {fbAccount ? (
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
          {fbAccount ? (
            <div className="flex items-center justify-between flex-wrap gap-3">
              <p className="text-xs text-slate-500">¿Quieres cambiar la página conectada?</p>
              <ConnectMetaPagesButton businessId={businessId} platform="facebook" />
            </div>
          ) : (
            <ConnectMetaPagesButton businessId={businessId} platform="facebook" />
          )}
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 text-xs text-blue-700 space-y-1">
        <p className="font-semibold">¿Qué permisos se solicitan?</p>
        <ul className="list-disc list-inside space-y-0.5 text-blue-600">
          <li>Ver tus páginas de Facebook</li>
          <li>Responder mensajes de Messenger</li>
          <li>Administrar metadatos de tus páginas</li>
          <li>Leer el engagement de tus páginas</li>
        </ul>
      </div>
    </div>
  );
}

function FBIcon() {
  return (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

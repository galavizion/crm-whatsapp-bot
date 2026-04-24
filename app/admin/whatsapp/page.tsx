import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { MessageCircle, Phone, CheckCircle, XCircle } from "lucide-react";
import ConnectWhatsAppButton from "@/components/meta/ConnectWhatsAppButton";

export default async function WhatsAppAdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: businessUser } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!businessUser?.business_id) redirect("/dashboard");
  if ((businessUser.role || "").toLowerCase() !== "admin") redirect("/dashboard");

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: waAccounts } = await admin
    .from("whatsapp_accounts")
    .select("*")
    .eq("business_id", businessUser.business_id)
    .order("is_active", { ascending: false });

  const { data: business } = await admin
    .from("businesses")
    .select("name")
    .eq("id", businessUser.business_id)
    .maybeSingle();

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-5">
        {/* Header */}
        <div className="bg-[linear-gradient(135deg,#25D366_0%,#128C7E_100%)] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/60">Admin</p>
              <h1 className="text-xl font-bold">Conectar WhatsApp Business</h1>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/75">
            Conecta el número de WhatsApp Business de <strong>{business?.name}</strong> con
            Prospekto para activar el bot de IA.
          </p>
        </div>

        {/* Números conectados */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
          <h2 className="font-semibold text-slate-800 flex items-center gap-2 mb-4">
            <Phone className="w-4 h-4 text-slate-400" />
            Números conectados
          </h2>

          {!waAccounts || waAccounts.length === 0 ? (
            <p className="text-sm text-slate-400">
              Aún no tienes ningún número de WhatsApp conectado.
            </p>
          ) : (
            <div className="space-y-2 mb-5">
              {waAccounts.map((wa: any) => (
                <div
                  key={wa.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-800">+{wa.display_phone}</p>
                    <p className="text-xs text-slate-400 mt-0.5">ID: {wa.phone_number_id}</p>
                  </div>
                  <span
                    className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      wa.is_active
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {wa.is_active ? (
                      <>
                        <CheckCircle className="w-3 h-3" /> Activo
                      </>
                    ) : (
                      <>
                        <XCircle className="w-3 h-3" /> Inactivo
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Botón de Embedded Signup */}
          <div className="border-t border-slate-100 pt-4">
            <p className="text-sm text-slate-600 mb-3">
              Usa el botón de abajo para conectar un nuevo número de WhatsApp Business. Se abrirá
              una ventana de Meta donde autorizarás el acceso.
            </p>
            <ConnectWhatsAppButton businessId={businessUser.business_id} />
          </div>
        </div>

        {/* Instrucciones */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <h3 className="font-semibold text-amber-800 text-sm mb-2">Requisitos previos</h3>
          <ul className="text-sm text-amber-700 space-y-1.5 list-disc pl-5">
            <li>
              Debes tener una cuenta de{" "}
              <strong>WhatsApp Business Platform</strong> activa en Meta Business Suite.
            </li>
            <li>
              El número que conectes debe ser un número oficial de WhatsApp Business (no personal).
            </li>
            <li>
              Si el número ya está en uso en otra app, deberás desconectarlo primero desde Meta.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

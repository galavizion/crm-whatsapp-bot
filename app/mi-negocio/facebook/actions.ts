"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const GRAPH = "https://graph.facebook.com/v23.0";

export async function resubscribeWebhook(): Promise<{ ok: boolean; message: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "No autorizado" };

  const { data: businessUser } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!businessUser?.business_id) return { ok: false, message: "Sin negocio" };

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: fbAccount } = await admin
    .from("social_accounts")
    .select("page_id, access_token")
    .eq("business_id", businessUser.business_id)
    .eq("platform", "facebook")
    .eq("is_active", true)
    .maybeSingle();

  if (!fbAccount?.page_id || !fbAccount?.access_token) {
    return { ok: false, message: "No hay página de Facebook conectada" };
  }

  const res = await fetch(
    `${GRAPH}/${fbAccount.page_id}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed&access_token=${fbAccount.access_token}`,
    { method: "POST" }
  );
  const data = await res.json();

  if (!res.ok || !data.success) {
    return { ok: false, message: `Error: ${JSON.stringify(data)}` };
  }

  return { ok: true, message: "Webhook re-suscrito correctamente" };
}

export async function disconnectFacebook() {
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

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  await admin
    .from("social_accounts")
    .delete()
    .eq("business_id", businessUser.business_id)
    .eq("platform", "facebook");

  redirect("/mi-negocio/facebook");
}

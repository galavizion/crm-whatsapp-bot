"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const GOD_EMAIL = "rene.galaviz@gmail.com";

async function verifyGod() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || user.email !== GOD_EMAIL) throw new Error("No autorizado");
  return user;
}

function adminClient() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function suspendBusiness(businessId: string, reason: string) {
  await verifyGod();
  const supabase = adminClient();
  const { error } = await supabase
    .from("businesses")
    .update({
      status: "suspended",
      suspended_reason: reason,
      suspended_at: new Date().toISOString(),
    })
    .eq("id", businessId);
  if (error) throw new Error(error.message);
  revalidatePath("/god/negocios");
}

export async function activateBusiness(businessId: string) {
  await verifyGod();
  const supabase = adminClient();
  const { error } = await supabase
    .from("businesses")
    .update({
      status: "active",
      suspended_reason: null,
      suspended_at: null,
    })
    .eq("id", businessId);
  if (error) throw new Error(error.message);
  revalidatePath("/god/negocios");
}

export async function deleteBusiness(businessId: string) {
  await verifyGod();
  const supabase = adminClient();

  // Eliminar en orden para respetar foreign keys
  await supabase.from("contactos").delete().eq("business_id", businessId);
  await supabase.from("mensajes_recibidos").delete().eq("business_id", businessId);
  await supabase.from("business_users").delete().eq("business_id", businessId);
  await supabase.from("whatsapp_accounts").delete().eq("business_id", businessId);
  const { error } = await supabase.from("businesses").delete().eq("id", businessId);
  if (error) throw new Error(error.message);

  revalidatePath("/god/negocios");
  redirect("/god/negocios");
}

export async function updateBusiness(businessId: string, formData: FormData) {
  await verifyGod();
  const supabase = adminClient();

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim().toLowerCase().replace(/\s+/g, "-");
  const phoneNumberId = String(formData.get("phone_number_id") || "").trim();
  const accessToken = String(formData.get("access_token") || "").trim();
  const displayPhone = String(formData.get("display_phone") || "").trim();

  await supabase.from("businesses").update({ name, slug }).eq("id", businessId);

  if (phoneNumberId) {
    const { data: existing } = await supabase
      .from("whatsapp_accounts")
      .select("id")
      .eq("business_id", businessId)
      .maybeSingle();

    if (existing) {
      await supabase
        .from("whatsapp_accounts")
        .update({ phone_number_id: phoneNumberId, access_token: accessToken || undefined, display_phone: displayPhone || undefined })
        .eq("business_id", businessId);
    } else if (accessToken) {
      await supabase.from("whatsapp_accounts").insert({
        business_id: businessId,
        phone_number_id: phoneNumberId,
        access_token: accessToken,
        display_phone: displayPhone,
        is_active: true,
      });
    }
  }

  revalidatePath("/god/negocios");
  redirect("/god/negocios");
}

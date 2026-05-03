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

  const igPageId = String(formData.get("ig_page_id") || "").trim();
  const igAccountId = String(formData.get("ig_account_id") || "").trim();
  const igPageName = String(formData.get("ig_page_name") || "").trim();
  const igAccessToken = String(formData.get("ig_access_token") || "").trim();

  const fbPageId = String(formData.get("fb_page_id") || "").trim();
  const fbPageName = String(formData.get("fb_page_name") || "").trim();
  const fbAccessToken = String(formData.get("fb_access_token") || "").trim();

  await supabase.from("businesses").update({ name, slug }).eq("id", businessId);

  // Upsert Instagram
  if (igPageId) {
    const { data: existing } = await supabase
      .from("social_accounts")
      .select("id, access_token")
      .eq("business_id", businessId)
      .eq("platform", "instagram")
      .maybeSingle();

    const data: Record<string, unknown> = {
      business_id: businessId,
      platform: "instagram",
      page_id: igPageId,
      instagram_account_id: igAccountId || null,
      page_name: igPageName || null,
      is_active: true,
    };
    if (igAccessToken) data.access_token = igAccessToken;
    else if (existing?.access_token) data.access_token = existing.access_token;

    if (existing) {
      await supabase.from("social_accounts").update(data).eq("id", existing.id);
    } else if (igAccessToken) {
      await supabase.from("social_accounts").insert(data);
    }
  }

  // Upsert Facebook
  if (fbPageId) {
    const { data: existing } = await supabase
      .from("social_accounts")
      .select("id, access_token")
      .eq("business_id", businessId)
      .eq("platform", "facebook")
      .maybeSingle();

    const data: Record<string, unknown> = {
      business_id: businessId,
      platform: "facebook",
      page_id: fbPageId,
      page_name: fbPageName || null,
      is_active: true,
    };
    if (fbAccessToken) data.access_token = fbAccessToken;
    else if (existing?.access_token) data.access_token = existing.access_token;

    if (existing) {
      await supabase.from("social_accounts").update(data).eq("id", existing.id);
    } else if (fbAccessToken) {
      await supabase.from("social_accounts").insert(data);
    }
  }

  if (phoneNumberId) {
    const { data: waRows } = await supabase
      .from("whatsapp_accounts")
      .select("id")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1);
    const existingWa = waRows?.[0] ?? null;

    if (existingWa) {
      const updateWaData: Record<string, unknown> = {
        phone_number_id: phoneNumberId,
        is_active: true,
      };
      if (accessToken) updateWaData.access_token = accessToken;
      if (displayPhone) updateWaData.display_phone = displayPhone;
      await supabase.from("whatsapp_accounts").update(updateWaData).eq("id", existingWa.id);
    } else {
      const insertWaData: Record<string, unknown> = {
        business_id: businessId,
        phone_number_id: phoneNumberId,
        is_active: true,
      };
      if (accessToken) insertWaData.access_token = accessToken;
      if (displayPhone) insertWaData.display_phone = displayPhone;
      await supabase.from("whatsapp_accounts").insert(insertWaData);
    }
  }

  revalidatePath("/god/negocios");
  redirect(`/god/negocios/${businessId}/editar?saved=true`);
}

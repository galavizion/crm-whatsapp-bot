"use server";

import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function admin() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function savePerfilAction(businessId: string, data: {
  whatsapp_category: string;
  whatsapp_description: string;
  whatsapp_email: string;
  whatsapp_website: string;
  whatsapp_address: string;
  whatsapp_hours: Record<string, { enabled: boolean; open: string; close: string }>;
  whatsapp_profile_photo?: string;
}) {
  const supabase = admin();
  const { error } = await supabase.from("businesses").update(data).eq("id", businessId);
  if (error) throw new Error(error.message);
  revalidatePath("/mi-negocio/perfil");
}

export async function updateWhatsAppProfileAction(businessId: string) {
  const supabaseAuth = await createClient();
  const { data: { user } } = await supabaseAuth.auth.getUser();
  if (user?.email !== "rene.galaviz@gmail.com") throw new Error("No autorizado");

  const supabase = admin();

  const { data: business } = await supabase
    .from("businesses")
    .select("whatsapp_category, whatsapp_description, whatsapp_email, whatsapp_website, whatsapp_address")
    .eq("id", businessId)
    .maybeSingle();

  const { data: wa } = await supabase
    .from("whatsapp_accounts")
    .select("phone_number_id, access_token")
    .eq("business_id", businessId)
    .maybeSingle();

  if (!wa?.phone_number_id || !wa?.access_token) throw new Error("No hay cuenta de WhatsApp configurada");
  if (!business) throw new Error("Negocio no encontrado");

  const body: Record<string, unknown> = {
    messaging_product: "whatsapp",
  };
  if (business.whatsapp_description) body.about = business.whatsapp_description.slice(0, 139);
  if (business.whatsapp_description) body.description = business.whatsapp_description.slice(0, 256);
  if (business.whatsapp_email) body.email = business.whatsapp_email;
  if (business.whatsapp_website) body.websites = [business.whatsapp_website];
  if (business.whatsapp_address) body.address = business.whatsapp_address;
  if (business.whatsapp_category) body.vertical = business.whatsapp_category;

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${wa.phone_number_id}/whatsapp_business_profile`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${wa.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err?.error?.message || "Error al actualizar en Meta");
  }
}

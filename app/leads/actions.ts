"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { isGodUser } from "@/lib/auth/god";

// Solo god: borra el lead y sus mensajes entrantes. Útil para limpiar pruebas.
export async function eliminarLead(leadId: string): Promise<{ ok: boolean }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isGodUser(user.email)) return { ok: false };

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: lead } = await admin
    .from("contactos")
    .select("id, whatsapp, business_id")
    .eq("id", leadId)
    .maybeSingle();
  if (!lead) return { ok: false };

  if (lead.whatsapp && lead.business_id) {
    const { error } = await admin
      .from("mensajes_recibidos")
      .delete()
      .eq("business_id", lead.business_id)
      .eq("whatsapp", lead.whatsapp);
    if (error) console.error("❌ eliminarLead mensajes:", error.message);
  }

  const { error } = await admin.from("contactos").delete().eq("id", leadId);
  if (error) {
    console.error("❌ eliminarLead:", error.message);
    return { ok: false };
  }

  revalidatePath("/leads", "layout");
  return { ok: true };
}

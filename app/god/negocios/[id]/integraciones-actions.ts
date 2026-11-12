"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { isGodUser } from "@/lib/auth/god";

async function contextoGod() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isGodUser(user.email)) return null;
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const DIAS_POR_PLAN = { demo: 7, semestral: 183 } as const;

// Activa o renueva la Lola del negocio. El plazo se cuenta desde hoy.
export async function activarLola(formData: FormData) {
  const admin = await contextoGod();
  if (!admin) return;

  const businessId = String(formData.get("businessId") || "");
  const plan = String(formData.get("plan") || "") as keyof typeof DIAS_POR_PLAN;
  if (!businessId || !(plan in DIAS_POR_PLAN)) return;

  const venceAt = new Date(Date.now() + DIAS_POR_PLAN[plan] * 86_400_000).toISOString();

  const { data: existente } = await admin
    .from("lola_dispositivos")
    .select("id")
    .eq("business_id", businessId)
    .order("id", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { error } = existente
    ? await admin
        .from("lola_dispositivos")
        .update({ plan, vence_at: venceAt, activo: true })
        .eq("id", existente.id)
    : await admin.from("lola_dispositivos").insert({
        business_id: businessId,
        token: randomBytes(32).toString("hex"),
        plan,
        vence_at: venceAt,
      });

  if (error) console.error("❌ activarLola:", error.message);
  revalidatePath(`/god/negocios/${businessId}`);
}

export async function desactivarLola(formData: FormData) {
  const admin = await contextoGod();
  if (!admin) return;

  const businessId = String(formData.get("businessId") || "");
  if (!businessId) return;

  const { error } = await admin
    .from("lola_dispositivos")
    .update({ activo: false })
    .eq("business_id", businessId);

  if (error) console.error("❌ desactivarLola:", error.message);
  revalidatePath(`/god/negocios/${businessId}`);
}

// Pausa o reanuda el webhook de WooCommerce del negocio (sin borrar credenciales).
export async function alternarWoo(formData: FormData) {
  const admin = await contextoGod();
  if (!admin) return;

  const businessId = String(formData.get("businessId") || "");
  const activo = formData.get("activo") === "true";
  if (!businessId) return;

  const { error } = await admin
    .from("woo_tiendas")
    .update({ activo: !activo })
    .eq("business_id", businessId);

  if (error) console.error("❌ alternarWoo:", error.message);
  revalidatePath(`/god/negocios/${businessId}`);
}

"use server";

import { randomBytes } from "crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

type Resultado = { ok: boolean; message: string };

// Solo el admin del negocio puede gestionar integraciones.
async function contextoAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: bu } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!bu?.business_id || (bu.role || "").toLowerCase() !== "admin") return null;

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  return { businessId: bu.business_id as string, admin };
}

export async function conectarWoo(): Promise<Resultado> {
  const ctx = await contextoAdmin();
  if (!ctx) return { ok: false, message: "Sin permiso" };

  const { data: existente } = await ctx.admin
    .from("woo_tiendas")
    .select("id")
    .eq("business_id", ctx.businessId)
    .limit(1)
    .maybeSingle();
  if (existente) return { ok: false, message: "Tu tienda ya está conectada" };

  const { error } = await ctx.admin.from("woo_tiendas").insert({
    business_id: ctx.businessId,
    woo_token: randomBytes(24).toString("hex"),
    woo_secret: randomBytes(32).toString("hex"),
  });
  if (error) {
    console.error("❌ conectarWoo:", error.message);
    return { ok: false, message: "No se pudo crear la conexión" };
  }

  revalidatePath("/mi-negocio/integraciones");
  return { ok: true, message: "Tienda conectada" };
}

export async function regenerarWoo(): Promise<Resultado> {
  const ctx = await contextoAdmin();
  if (!ctx) return { ok: false, message: "Sin permiso" };

  const { error } = await ctx.admin
    .from("woo_tiendas")
    .update({
      woo_token: randomBytes(24).toString("hex"),
      woo_secret: randomBytes(32).toString("hex"),
    })
    .eq("business_id", ctx.businessId);
  if (error) {
    console.error("❌ regenerarWoo:", error.message);
    return { ok: false, message: "No se pudieron regenerar las credenciales" };
  }

  revalidatePath("/mi-negocio/integraciones");
  return { ok: true, message: "Credenciales regeneradas. Actualiza tus webhooks en WooCommerce." };
}

export async function regenerarTokenLola(): Promise<Resultado> {
  const ctx = await contextoAdmin();
  if (!ctx) return { ok: false, message: "Sin permiso" };

  const { data, error } = await ctx.admin
    .from("lola_dispositivos")
    .update({ token: randomBytes(32).toString("hex") })
    .eq("business_id", ctx.businessId)
    .select("id");
  if (error || !data?.length) {
    if (error) console.error("❌ regenerarTokenLola:", error.message);
    return { ok: false, message: "No se pudo regenerar el token" };
  }

  revalidatePath("/mi-negocio/integraciones");
  return { ok: true, message: "Token regenerado. Actualízalo en tu Lola." };
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import Integraciones from "@/components/mi-negocio/Integraciones";

export const dynamic = "force-dynamic";

export default async function IntegracionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: bu } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!bu?.business_id) redirect("/dashboard");
  if ((bu.role || "").toLowerCase() !== "admin") redirect("/dashboard");

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: woo }, { data: lola }] = await Promise.all([
    admin
      .from("woo_tiendas")
      .select("woo_token, woo_secret, ultima_orden_at")
      .eq("business_id", bu.business_id)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
    admin
      .from("lola_dispositivos")
      .select("token, plan, vence_at, activo, ultimo_contacto")
      .eq("business_id", bu.business_id)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  return (
    <Integraciones
      woo={
        woo
          ? { token: woo.woo_token, secret: woo.woo_secret, ultimaOrdenAt: woo.ultima_orden_at }
          : null
      }
      lola={
        lola
          ? {
              token: lola.token,
              plan: lola.plan,
              venceAt: lola.vence_at,
              activo: lola.activo,
              ultimoContacto: lola.ultimo_contacto,
            }
          : null
      }
    />
  );
}

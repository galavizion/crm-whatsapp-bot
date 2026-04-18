import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import PerfilForm from "@/components/mi-negocio/PerfilForm";

const GOD_EMAIL = "rene.galaviz@gmail.com";

export default async function PerfilPage() {
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

  const { data: business } = await admin
    .from("businesses")
    .select("id, whatsapp_profile_photo, whatsapp_category, whatsapp_description, whatsapp_email, whatsapp_website, whatsapp_address, whatsapp_hours")
    .eq("id", businessUser.business_id)
    .maybeSingle();

  if (!business) redirect("/dashboard");

  return (
    <PerfilForm
      businessId={business.id}
      isGod={user.email === GOD_EMAIL}
      initial={{
        whatsapp_profile_photo: business.whatsapp_profile_photo ?? null,
        whatsapp_category: business.whatsapp_category ?? null,
        whatsapp_description: business.whatsapp_description ?? null,
        whatsapp_email: business.whatsapp_email ?? null,
        whatsapp_website: business.whatsapp_website ?? null,
        whatsapp_address: business.whatsapp_address ?? null,
        whatsapp_hours: business.whatsapp_hours ?? null,
      }}
    />
  );
}

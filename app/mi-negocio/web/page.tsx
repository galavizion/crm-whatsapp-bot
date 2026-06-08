import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import WidgetConfig from "@/components/mi-negocio/WidgetConfig";

export default async function WebWidgetPage() {
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

  return <WidgetConfig businessId={businessUser.business_id} />;
}

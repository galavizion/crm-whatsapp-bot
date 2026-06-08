import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import CuentaForm from "@/components/mi-negocio/CuentaForm";

export default async function CuentaPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <CuentaForm email={user.email ?? ""} />;
}

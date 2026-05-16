import TabsNav from "@/components/mi-negocio/TabsNav";
import { Building2 } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export default async function MiNegocioLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let businessName = "Mi Negocio";

  if (user) {
    const { data: bu } = await supabase
      .from("business_users")
      .select("business_id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (bu?.business_id) {
      const admin = createAdminClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data: biz } = await admin
        .from("businesses")
        .select("name")
        .eq("id", bu.business_id)
        .maybeSingle();
      if (biz?.name) businessName = biz.name;
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto p-4 md:p-6 space-y-5">

        {/* HEADER */}
        <div className="bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-widest text-white/70">Configuración</p>
              <h1 className="text-xl font-bold">{businessName}</h1>
            </div>
          </div>
        </div>

        {/* TABS */}
        <TabsNav />

        {/* CONTENIDO */}
        {children}

      </div>
    </div>
  );
}

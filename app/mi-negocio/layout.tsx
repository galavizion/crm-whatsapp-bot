import TabsNav from "@/components/mi-negocio/TabsNav";
import { Building2 } from "lucide-react";

export default function MiNegocioLayout({ children }: { children: React.ReactNode }) {
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
              <h1 className="text-xl font-bold">Mi Negocio</h1>
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

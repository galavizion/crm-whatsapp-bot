import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Plug } from "lucide-react";
import {
  activarLola,
  desactivarLola,
  alternarWoo,
} from "@/app/god/negocios/[id]/integraciones-actions";

function hace(iso: string | null): string {
  if (!iso) return "nunca";
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `hace ${s} s`;
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}

const btn =
  "px-3 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap";

export default async function IntegracionesGod({ businessId }: { businessId: string }) {
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const [{ data: woo }, { data: lola }] = await Promise.all([
    admin
      .from("woo_tiendas")
      .select("activo, ultima_orden_at")
      .eq("business_id", businessId)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
    admin
      .from("lola_dispositivos")
      .select("plan, vence_at, activo, ultimo_contacto")
      .eq("business_id", businessId)
      .order("id", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  const venceMs = lola ? new Date(lola.vence_at).getTime() - Date.now() : 0;
  const vigente = !!lola && lola.activo && venceMs > 0;
  const dias = Math.max(0, Math.ceil(venceMs / 86_400_000));

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-5">
      <h2 className="font-semibold text-slate-800 flex items-center gap-2">
        <Plug className="w-4 h-4 text-slate-400" />
        Integraciones
      </h2>

      {/* WooCommerce */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-2">
        <p className="text-sm font-medium text-slate-800">WooCommerce</p>
        {!woo ? (
          <p className="text-xs text-slate-500">
            El cliente aún no conecta su tienda (lo hace desde Mi Negocio → Integraciones).
          </p>
        ) : (
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <p className="text-xs text-slate-600">
              {woo.activo ? "Activa" : "Pausada"} · última orden: <strong>{hace(woo.ultima_orden_at)}</strong>
            </p>
            <form action={alternarWoo}>
              <input type="hidden" name="businessId" value={businessId} />
              <input type="hidden" name="activo" value={String(woo.activo)} />
              <button
                type="submit"
                className={`${btn} ${woo.activo ? "bg-rose-50 text-rose-600 hover:bg-rose-100" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"}`}
              >
                {woo.activo ? "Pausar" : "Reanudar"}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Lola */}
      <div className="rounded-xl bg-slate-50 border border-slate-100 p-3 space-y-3">
        <p className="text-sm font-medium text-slate-800">Lola</p>
        <p className="text-xs text-slate-600">
          {!lola ? (
            "Sin licencia."
          ) : (
            <>
              <span className={`inline-block w-2 h-2 rounded-full mr-1.5 ${vigente ? "bg-emerald-500" : "bg-red-500"}`} />
              Plan <strong>{lola.plan === "demo" ? "Demo" : "Semestral"}</strong> ·{" "}
              {vigente ? `vence en ${dias} días` : "vencida o inactiva"} · última consulta:{" "}
              <strong>{hace(lola.ultimo_contacto)}</strong>
            </>
          )}
        </p>
        <div className="flex gap-2 flex-wrap">
          <form action={activarLola}>
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="plan" value="demo" />
            <button type="submit" className={`${btn} bg-indigo-600 hover:bg-indigo-700 text-white`}>
              {lola ? "Renovar demo (7 días)" : "Activar demo (7 días)"}
            </button>
          </form>
          <form action={activarLola}>
            <input type="hidden" name="businessId" value={businessId} />
            <input type="hidden" name="plan" value="semestral" />
            <button type="submit" className={`${btn} bg-violet-600 hover:bg-violet-700 text-white`}>
              {lola ? "Renovar semestral (6 meses)" : "Activar semestral (6 meses)"}
            </button>
          </form>
          {lola?.activo && (
            <form action={desactivarLola}>
              <input type="hidden" name="businessId" value={businessId} />
              <button type="submit" className={`${btn} bg-rose-50 text-rose-600 hover:bg-rose-100`}>
                Desactivar
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

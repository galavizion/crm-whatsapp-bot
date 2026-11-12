import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { timingSafeEqual } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

function tokenValido(recibido: string, esperado: string): boolean {
  const a = Buffer.from(recibido);
  const b = Buffer.from(esperado);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Minutos sin pagar para considerar abandonado un checkout de WooCommerce.
const MINUTOS_ABANDONO = 30;

// Convierte checkouts pendientes viejos en eventos "carrito". Es idempotente:
// el evento lleva ref unica por orden, asi que repetirlo no duplica nada.
async function materializarCarritosAbandonados(businessId: string) {
  try {
    const limite = new Date(Date.now() - MINUTOS_ABANDONO * 60_000).toISOString();
    const { data: vencidos, error } = await supabase
      .from("woo_pendientes")
      .select("order_id, total")
      .eq("business_id", businessId)
      .lt("created_at", limite)
      .limit(50);
    if (error || !vencidos?.length) {
      if (error) console.error("❌ woo_pendientes select:", error.message);
      return;
    }

    const eventos = vencidos.map((p) => ({
      business_id: businessId,
      tipo: "carrito",
      titulo:
        typeof p.total === "number" && p.total > 0
          ? `Carrito abandonado de $${p.total.toFixed(2)}`
          : "Carrito abandonado",
      ref: `carrito:woo:${p.order_id}`,
    }));
    const { error: insError } = await supabase
      .from("lola_eventos")
      .upsert(eventos, { onConflict: "business_id,ref", ignoreDuplicates: true });
    if (insError) {
      console.error("❌ carritos abandonados insert:", insError.message);
      return; // no borrar pendientes si no se pudo registrar
    }

    await supabase
      .from("woo_pendientes")
      .delete()
      .eq("business_id", businessId)
      .in("order_id", vencidos.map((p) => p.order_id));
  } catch (e) {
    console.error("❌ materializarCarritosAbandonados:", e);
  }
}

// Por instancia: el calculo de carritos abandonados corre como maximo 1 vez por minuto por negocio.
const ULTIMO_CALCULO = new Map<string, number>();
const INTERVALO_CALCULO_MS = 60_000;
// Cada cuanto se actualiza ultimo_contacto (evita una escritura por consulta).
const INTERVALO_CONTACTO_MS = 60_000;

type Resolucion =
  | { ok: true; businessId: string }
  | { ok: false; status: number; error: string };

async function resolverToken(token: string): Promise<Resolucion> {
  // 1. Dispositivo registrado en lola_dispositivos (licencia por negocio).
  const { data: disp, error } = await supabase
    .from("lola_dispositivos")
    .select("id, business_id, activo, vence_at, ultimo_contacto")
    .eq("token", token)
    .maybeSingle();

  if (error) console.error("❌ lola_dispositivos:", error.message);

  if (disp) {
    if (!disp.activo || new Date(disp.vence_at).getTime() <= Date.now()) {
      return { ok: false, status: 403, error: "licencia vencida" };
    }
    const ultimo = disp.ultimo_contacto ? new Date(disp.ultimo_contacto).getTime() : 0;
    if (Date.now() - ultimo > INTERVALO_CONTACTO_MS) {
      const { error: updError } = await supabase
        .from("lola_dispositivos")
        .update({ ultimo_contacto: new Date().toISOString() })
        .eq("id", disp.id);
      if (updError) console.error("❌ ultimo_contacto:", updError.message);
    }
    return { ok: true, businessId: disp.business_id };
  }

  // 2. Compatibilidad: token global por variable de entorno.
  const esperado = process.env.LOLA_API_TOKEN || "";
  const businessIdEnv = process.env.LOLA_BUSINESS_ID || "";
  if (esperado && businessIdEnv && tokenValido(token, esperado)) {
    return { ok: true, businessId: businessIdEnv };
  }

  return { ok: false, status: 401, error: "no autorizado" };
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  const resolucion = await resolverToken(token);
  if (!resolucion.ok) {
    return NextResponse.json({ error: resolucion.error }, { status: resolucion.status });
  }
  const businessId = resolucion.businessId;

  const ahora = Date.now();
  if (ahora - (ULTIMO_CALCULO.get(businessId) ?? 0) > INTERVALO_CALCULO_MS) {
    ULTIMO_CALCULO.set(businessId, ahora);
    await materializarCarritosAbandonados(businessId);
  }

  const raw = new URL(req.url).searchParams.get("despues_de");
  const despuesDe = Number.parseInt(raw ?? "0", 10);
  const cursor = Number.isFinite(despuesDe) && despuesDe > 0 ? despuesDe : 0;

  const { data, error } = await supabase
    .from("lola_eventos")
    .select("id, tipo, titulo")
    .eq("business_id", businessId)
    .gt("id", cursor)
    .order("id", { ascending: true })
    .limit(10);

  if (error) {
    console.error("❌ lola/eventos:", error.message);
    return NextResponse.json({ error: "error interno" }, { status: 500 });
  }

  return NextResponse.json(
    { eventos: data ?? [] },
    { headers: { "Cache-Control": "no-store" } }
  );
}

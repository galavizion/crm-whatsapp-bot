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

export async function GET(req: NextRequest) {
  const esperado = process.env.LOLA_API_TOKEN || "";
  const businessId = process.env.LOLA_BUSINESS_ID || "";
  if (!esperado || !businessId) {
    return NextResponse.json({ error: "no configurado" }, { status: 503 });
  }

  const auth = req.headers.get("authorization") || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token || !tokenValido(token, esperado)) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  await materializarCarritosAbandonados(businessId);

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

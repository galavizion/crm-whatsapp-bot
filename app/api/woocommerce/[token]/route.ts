import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { createHmac, timingSafeEqual } from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
);

// Solo ordenes pagadas generan evento de venta.
const ESTADOS_PAGADOS = new Set(["processing", "completed"]);

function firmaValida(rawBody: string, secret: string, recibida: string): boolean {
  const esperada = createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(esperada);
  const b = Buffer.from(recibida);
  return a.length === b.length && timingSafeEqual(a, b);
}

function tituloVenta(total: unknown): string {
  const n = Number.parseFloat(String(total ?? ""));
  if (!Number.isFinite(n) || n <= 0) return "Venta nueva";
  return `Venta de $${n.toFixed(2)}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const rawBody = await req.text();

  // 1. Token de la URL -> tienda/negocio
  const { data: tienda, error: tiendaError } = await supabase
    .from("woo_tiendas")
    .select("business_id, woo_secret")
    .eq("woo_token", token)
    .maybeSingle();

  if (tiendaError) {
    console.error("❌ woo_tiendas:", tiendaError.message);
    return NextResponse.json({ error: "error interno" }, { status: 500 });
  }
  if (!tienda) {
    return NextResponse.json({ error: "no autorizado" }, { status: 401 });
  }

  // 2. Firma HMAC-SHA256 sobre el body crudo
  const firma = req.headers.get("x-wc-webhook-signature") || "";

  // Ping de verificacion de WooCommerce al guardar el webhook: body "webhook_id=N" y sin firma.
  // Solo se acepta con token valido y no ejecuta ninguna accion.
  if (!firma && /^webhook_id=\d+$/.test(rawBody.trim())) {
    return NextResponse.json({ ok: true, ping: true });
  }

  if (!firma || !firmaValida(rawBody, tienda.woo_secret, firma)) {
    return NextResponse.json({ error: "firma invalida" }, { status: 401 });
  }

  // 3. Solo ordenes. El "ping" inicial de WooCommerce (body form-encoded) se responde 200 sin hacer nada.
  const topic = req.headers.get("x-wc-webhook-topic") || "";
  if (topic !== "order.created" && topic !== "order.updated") {
    return NextResponse.json({ ok: true, ignorado: topic || "sin topic" });
  }

  let order: { id?: number | string; status?: string; total?: string | number };
  try {
    order = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ ok: true, ignorado: "body no json" });
  }

  if (!order?.id || !ESTADOS_PAGADOS.has(String(order.status))) {
    return NextResponse.json({ ok: true, ignorado: `status ${order?.status ?? "?"}` });
  }

  // 4. Evento de venta, deduplicado por orden (processing -> completed no repite).
  const { error } = await supabase.from("lola_eventos").upsert(
    {
      business_id: tienda.business_id,
      tipo: "venta",
      titulo: tituloVenta(order.total),
      ref: `woo:${order.id}`,
    },
    { onConflict: "business_id,ref", ignoreDuplicates: true }
  );

  if (error) {
    // 500 para que WooCommerce reintente.
    console.error("❌ lola_eventos (woo):", error.message);
    return NextResponse.json({ error: "error interno" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

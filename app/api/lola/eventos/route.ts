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

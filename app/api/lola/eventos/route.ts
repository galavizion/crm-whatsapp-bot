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

// ── Frecuencia de consulta segun horario laboral del negocio ─────────────────
// El servidor le dice a Lola cuanto esperar (siguiente_consulta_s); el firmware
// solo obedece. Dentro de horario: cada INTERVALO_ACTIVO_S. Fuera: cada hora,
// o hasta la apertura si esta es antes.
const TZ = "America/Mexico_City";
const INTERVALO_ACTIVO_S = 15;
const INTERVALO_RAPIDO_S = 2; // hay mas eventos pendientes que el limite por respuesta
const INTERVALO_FUERA_S = 3600;
const CACHE_HORARIO_MS = 5 * 60_000;

type DiaHorario = { enabled?: boolean; open?: string; close?: string };
type Horario = Record<string, DiaHorario>;

const DIAS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

// Si el negocio no configuro horario (o dejo todos los dias apagados): lunes a viernes 9 a 18.
const HORARIO_DEFECTO: Horario = Object.fromEntries(
  DIAS.map((d) => [d, { enabled: !["sunday", "saturday"].includes(d), open: "09:00", close: "18:00" }])
);

const CACHE_HORARIOS = new Map<string, { horario: Horario; hasta: number }>();

function aMinutos(hhmm: string | undefined, defecto: number): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm ?? "");
  return m ? Number(m[1]) * 60 + Number(m[2]) : defecto;
}

function ahoraEnZona(): { dia: number; segundosDelDia: number } {
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());
  const get = (t: string) => partes.find((p) => p.type === t)?.value ?? "0";
  return {
    dia: DIAS.indexOf(get("weekday").toLowerCase()),
    segundosDelDia: Number(get("hour")) * 3600 + Number(get("minute")) * 60 + Number(get("second")),
  };
}

async function horarioDelNegocio(businessId: string): Promise<Horario> {
  const cache = CACHE_HORARIOS.get(businessId);
  if (cache && cache.hasta > Date.now()) return cache.horario;

  const { data, error } = await supabase
    .from("businesses")
    .select("whatsapp_hours")
    .eq("id", businessId)
    .maybeSingle();
  if (error) console.error("❌ whatsapp_hours:", error.message);

  const guardado = (data?.whatsapp_hours ?? null) as Horario | null;
  const hayDiasActivos = !!guardado && Object.values(guardado).some((d) => d?.enabled);
  const horario = hayDiasActivos ? guardado! : HORARIO_DEFECTO;
  CACHE_HORARIOS.set(businessId, { horario, hasta: Date.now() + CACHE_HORARIO_MS });
  return horario;
}

function segundosParaSiguienteConsulta(horario: Horario): number {
  const { dia, segundosDelDia } = ahoraEnZona();
  if (dia < 0) return INTERVALO_ACTIVO_S;

  const hoy = horario[DIAS[dia]];
  if (hoy?.enabled) {
    const abre = aMinutos(hoy.open, 540) * 60;
    const cierra = aMinutos(hoy.close, 1080) * 60;
    if (segundosDelDia >= abre && segundosDelDia < cierra) return INTERVALO_ACTIVO_S;
  }

  // Fuera de horario: espera hasta la proxima apertura, con tope de INTERVALO_FUERA_S.
  let hastaApertura = Infinity;
  for (let offset = 0; offset <= 7; offset++) {
    const cfg = horario[DIAS[(dia + offset) % 7]];
    if (!cfg?.enabled) continue;
    const abre = aMinutos(cfg.open, 540) * 60;
    const falta = offset * 86_400 + abre - segundosDelDia;
    if (falta > 0) {
      hastaApertura = falta;
      break;
    }
  }
  return Math.max(INTERVALO_ACTIVO_S, Math.min(INTERVALO_FUERA_S, hastaApertura));
}

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

  const eventos = data ?? [];
  const siguiente =
    eventos.length >= 10
      ? INTERVALO_RAPIDO_S
      : segundosParaSiguienteConsulta(await horarioDelNegocio(businessId));

  return NextResponse.json(
    { eventos, siguiente_consulta_s: siguiente },
    { headers: { "Cache-Control": "no-store" } }
  );
}

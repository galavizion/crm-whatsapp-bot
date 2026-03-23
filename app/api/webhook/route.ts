import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateReply } from "@/lib/ai/reply";
import { getSystemPrompt } from "@/lib/ai/systemPrompt";
import { buildReplyPrompt } from "@/lib/ai/replyPrompt";
import { extractMemory } from "@/lib/ai/memory";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";

export const runtime = "nodejs";

const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || "";
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Error de verificación", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    console.log("🔥 WEBHOOK HIT");

    const body = await req.json();
    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) return new NextResponse("No message", { status: 200 });

    const phoneNumberId = String(value?.metadata?.phone_number_id || "").trim();
    const from = message.from;
    const messageId = message.id;
    const text = message.text?.body || "";

    console.log("📞 phoneNumberId:", phoneNumberId);
    console.log("💬 Mensaje recibido:", text);

    // 1. MAPEAR A NEGOCIO
    const { data: waAccount, error: waError } = await supabase
      .from("whatsapp_accounts")
      .select("business_id, access_token")
      .eq("phone_number_id", phoneNumberId)
      .maybeSingle();

    if (waError || !waAccount?.business_id) {
      console.error("❌ Número no vinculado:", waError);
      return new NextResponse("ok", { status: 200 });
    }

    const businessId = waAccount.business_id;
    const accessToken = waAccount.access_token || "";

    // 2. EVITAR DUPLICADOS
    const { error: insertError } = await supabase
      .from("mensajes_recibidos")
      .insert({ whatsapp: from, texto: text, tipo: "cliente", message_id: messageId, business_id: businessId });

    if (insertError) {
      console.log("⚠️ Mensaje duplicado:", messageId);
      return new NextResponse("ok", { status: 200 });
    }

    console.log("💾 Mensaje guardado");

    // 3. OBTENER NEGOCIO
    const { data: business } = await supabase
      .from("businesses")
      .select("name, slogan, descripcion, servicios, instrucciones_bot, tono_bot")
      .eq("id", businessId)
      .maybeSingle();

    // 4. BUSCAR O CREAR CONTACTO
    let { data: contacto } = await supabase
      .from("contactos")
      .select("*")
      .eq("business_id", businessId)
      .eq("whatsapp", from)
      .maybeSingle();

    if (!contacto) {
      // Round robin sellers
      const { data: sellers } = await supabase
        .from("business_users")
        .select("user_id")
        .eq("business_id", businessId)
        .eq("role", "seller");

      let assignedUserId: string | null = null;

      if (sellers && sellers.length > 0) {
        const counts = await Promise.all(
          sellers.map(async (seller) => {
            const { count } = await supabase
              .from("contactos")
              .select("id", { count: "exact", head: true })
              .eq("business_id", businessId)
              .eq("assigned_user_id", seller.user_id);
            return { user_id: seller.user_id, count: count ?? 0 };
          })
        );
        counts.sort((a, b) => a.count - b.count);
        assignedUserId = counts[0].user_id;
        console.log(`👥 Auto-asignado a seller con ${counts[0].count} leads`);
      }

      const { data: nuevo } = await supabase
        .from("contactos")
        .insert({ whatsapp: from, business_id: businessId, estado: "interesado", veces_contacto: 1, assigned_user_id: assignedUserId })
        .select()
        .maybeSingle();

      contacto = nuevo;
      console.log("👤 Contacto creado, asignado a:", assignedUserId ?? "sin asignar");
    } else {
      await supabase
        .from("contactos")
        .update({ veces_contacto: (contacto.veces_contacto || 0) + 1 })
        .eq("id", contacto.id);
    }

    // 5. OBTENER HISTORIAL RECIENTE (últimos 10 mensajes)
    const { data: historialData } = await supabase
      .from("mensajes_recibidos")
      .select("texto, tipo")
      .eq("whatsapp", from)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(10);

    // Invertir para orden cronológico y mapear a formato OpenAI
    const history = (historialData || [])
      .reverse()
      .slice(0, -1) // quitar el último que es el mensaje actual
      .map((m) => ({
        role: m.tipo === "bot" ? "assistant" as const : "user" as const,
        content: m.texto || "",
      }));

    console.log(`📜 Historial: ${history.length} mensajes anteriores`);

    // 6. GENERAR RESPUESTA IA
    const systemPrompt = getSystemPrompt({ business, contacto: contacto || {} });
    const userPrompt = buildReplyPrompt({ contacto: contacto || {}, incomingMessage: text });

    const respuesta = await generateReply({ systemPrompt, userPrompt, history });
    console.log("🤖 Respuesta IA:", respuesta);

    // 7. GUARDAR RESPUESTA
    await supabase.from("mensajes_recibidos").insert({
      whatsapp: from, texto: respuesta, tipo: "bot", business_id: businessId,
    });

    // 8. ACTUALIZAR MEMORIA
    if (contacto) {
      const memory = await extractMemory({
        business,
        contacto,
        incomingMessage: text,
        assistantReply: respuesta,
      });

      await supabase
        .from("contactos")
        .update({
          resumen: memory.resumen,
          ultimo_tema: memory.ultimo_tema,
          necesidad: memory.necesidad,
          estado: memory.estado,
          nombre: memory.nombre || contacto.nombre || null,
          sitio_web: memory.sitio_web || null,
          tipo_negocio: memory.tipo_negocio || null,
          presupuesto: memory.presupuesto || null,
          datos_extra: memory.datos_extra || null,
          ultima_respuesta: new Date().toISOString(),
        })
        .eq("id", contacto.id);

      console.log("🧠 Memoria actualizada:", memory.estado);
    }

    // 9. ENVIAR WHATSAPP
    const resultado = await sendWhatsAppText({ accessToken, phoneNumberId, to: from, body: respuesta });

    if (!resultado.ok) {
      console.error("❌ Error enviando WhatsApp:", resultado.error);
    } else {
      console.log("✅ Mensaje enviado");
    }

    return new NextResponse("ok", { status: 200 });
  } catch (error) {
    console.error("🔥 Webhook error:", error);
    return new NextResponse("error", { status: 500 });
  }
}
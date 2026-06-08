import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSystemPrompt } from "@/lib/ai/systemPrompt";
import { buildReplyPrompt } from "@/lib/ai/replyPrompt";
import { generateReply } from "@/lib/ai/reply";
import { extractMemory } from "@/lib/ai/memory";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: corsHeaders(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { business_id, session_id, message } = body as {
      business_id: string;
      session_id: string;
      message: string;
    };

    if (!business_id || !session_id || !message?.trim()) {
      return NextResponse.json(
        { error: "business_id, session_id y message son requeridos" },
        { status: 400, headers: corsHeaders() }
      );
    }

    const senderId = `web_${session_id}`;

    // 1. OBTENER NEGOCIO
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, name, slogan, descripcion, servicios, instrucciones_bot, tono_bot, status, catalogo")
      .eq("id", business_id)
      .maybeSingle();

    if (bizError || !business) {
      return NextResponse.json(
        { error: "Negocio no encontrado" },
        { status: 404, headers: corsHeaders() }
      );
    }

    if (business.status === "suspended" || business.status === "cancelled") {
      return NextResponse.json(
        { reply: "Este servicio no está disponible en este momento. Por favor intenta más tarde." },
        { status: 200, headers: corsHeaders() }
      );
    }

    // 2. GUARDAR MENSAJE DEL VISITANTE (message_id único para evitar duplicados)
    const messageId = `web_${session_id}_${Date.now()}`;
    const { error: insertError } = await supabase
      .from("mensajes_recibidos")
      .insert({
        whatsapp: senderId,
        texto: message.trim(),
        tipo: "cliente",
        message_id: messageId,
        business_id,
      });

    if (insertError) {
      console.error("Error guardando mensaje web:", insertError.message);
    }

    // 3. BUSCAR O CREAR CONTACTO
    let { data: contacto } = await supabase
      .from("contactos")
      .select("*")
      .eq("business_id", business_id)
      .eq("whatsapp", senderId)
      .maybeSingle();

    if (!contacto) {
      // Round robin sellers
      const { data: sellers } = await supabase
        .from("business_users")
        .select("user_id")
        .eq("business_id", business_id)
        .eq("role", "seller");

      let assignedUserId: string | null = null;

      if (sellers && sellers.length > 0) {
        const counts = await Promise.all(
          sellers.map(async (seller) => {
            const { count } = await supabase
              .from("contactos")
              .select("id", { count: "exact", head: true })
              .eq("business_id", business_id)
              .eq("assigned_user_id", seller.user_id);
            return { user_id: seller.user_id, count: count ?? 0 };
          })
        );
        counts.sort((a, b) => a.count - b.count);
        assignedUserId = counts[0].user_id;
      }

      const { data: nuevo } = await supabase
        .from("contactos")
        .insert({
          whatsapp: senderId,
          business_id,
          estado: "interesado",
          veces_contacto: 1,
          assigned_user_id: assignedUserId,
          canal: "web",
        })
        .select()
        .maybeSingle();

      contacto = nuevo;
    } else {
      await supabase
        .from("contactos")
        .update({ veces_contacto: (contacto.veces_contacto || 0) + 1 })
        .eq("id", contacto.id);
    }

    // 4. OBTENER HISTORIAL RECIENTE
    const { data: historialData } = await supabase
      .from("mensajes_recibidos")
      .select("texto, tipo")
      .eq("whatsapp", senderId)
      .eq("business_id", business_id)
      .order("created_at", { ascending: false })
      .limit(10);

    const history = (historialData || [])
      .reverse()
      .slice(0, -1)
      .map((m) => ({
        role: m.tipo === "bot" ? ("assistant" as const) : ("user" as const),
        content: m.texto || "",
      }));

    // 5. GENERAR RESPUESTA IA
    const systemPrompt = getSystemPrompt({
      business,
      contacto: contacto || {},
      mensajeUsuario: message.trim(),
      platform: "web",
    });
    const userPrompt = buildReplyPrompt({
      contacto: contacto || {},
      incomingMessage: message.trim(),
    });

    const respuesta = await generateReply({
      systemPrompt,
      userPrompt,
      history,
      maxTokens: 250,
    });

    // 6. GUARDAR RESPUESTA DEL BOT
    await supabase.from("mensajes_recibidos").insert({
      whatsapp: senderId,
      texto: respuesta,
      tipo: "bot",
      business_id,
    });

    // 7. EXTRAER MEMORIA EN BACKGROUND
    if (contacto) {
      extractMemory({
        business,
        contacto,
        incomingMessage: message.trim(),
        assistantReply: respuesta,
      })
        .then(async (memory) => {
          await supabase
            .from("contactos")
            .update({
              resumen: memory.resumen,
              ultimo_tema: memory.ultimo_tema,
              necesidad: memory.necesidad,
              estado: memory.estado,
              nombre: (memory.nombre && memory.nombre !== "Desconocido") ? memory.nombre : contacto!.nombre || null,
              sitio_web: memory.sitio_web || null,
              tipo_negocio: memory.tipo_negocio || null,
              presupuesto: memory.presupuesto || null,
              datos_extra: memory.datos_extra || null,
              ultima_respuesta: new Date().toISOString(),
            })
            .eq("id", contacto!.id);
        })
        .catch((err) => console.error("Error extrayendo memoria web:", err));
    }

    return NextResponse.json(
      { reply: respuesta },
      { status: 200, headers: corsHeaders() }
    );
  } catch (error) {
    console.error("Error en /api/chat/widget:", error);
    return NextResponse.json(
      { error: "Error interno" },
      { status: 500, headers: corsHeaders() }
    );
  }
}

function corsHeaders(): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };
}

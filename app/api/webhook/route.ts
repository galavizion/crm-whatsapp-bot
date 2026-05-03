import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateReply } from "@/lib/ai/reply";
import { getSystemPrompt } from "@/lib/ai/systemPrompt";
import { buildReplyPrompt } from "@/lib/ai/replyPrompt";
import { extractMemory } from "@/lib/ai/memory";
import { sendWhatsAppText } from "@/lib/ai/sendWhatsAppText";
import { sendInstagramMessage } from "@/lib/ai/sendInstagramMessage";
import { sendFacebookMessage } from "@/lib/ai/sendFacebookMessage";
import { generateCommentReply } from "@/lib/ai/commentReply";
import { sendInstagramCommentReply, sendInstagramPrivateReply } from "@/lib/ai/sendInstagramCommentReply";
// import { sendFacebookCommentReply } from "@/lib/ai/sendFacebookCommentReply"; // pendiente App Review

export const runtime = "nodejs";

const VALID_TOKENS = [
  process.env.PROSPEKTO_VERIFY_TOKEN || "",
  process.env.META_VERIFY_TOKEN || "",
].filter(Boolean);
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const mode = url.searchParams.get("hub.mode");
  const token = url.searchParams.get("hub.verify_token");
  const challenge = url.searchParams.get("hub.challenge");

  if (mode === "subscribe" && VALID_TOKENS.includes(token ?? "")) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse("Error de verificación", { status: 403 });
}

export async function POST(req: NextRequest) {
  try {
    console.log("🔥 WEBHOOK HIT");

    const body = await req.json();
    console.log("📨 RAW:", JSON.stringify(body));

    // Guard: ignorar eventos de plataformas no soportadas
    const supportedObjects = ["whatsapp_business_account", "instagram", "page"];
    if (body.object && !supportedObjects.includes(body.object)) {
      console.log(`⏭️ Evento ignorado — object: ${body.object}`);
      return new NextResponse("ok", { status: 200 });
    }

    // ── INSTAGRAM HANDLER (DMs + Comentarios) ────────────────────────────────
    if (body.object === "instagram") {
      const messaging = body.entry?.[0]?.messaging?.[0];
      const change = body.entry?.[0]?.changes?.[0];

      // ── Comentarios ──
      if (change?.field === "comments") {
        const commentId: string = change.value?.id || "";
        const commentText: string = change.value?.text || "";
        const igAccountId: string = body.entry?.[0]?.id || "";
        const commentAuthorId: string = change.value?.from?.id || "";
        const isTopLevelComment: boolean = !change.value?.parent_id;

        // Ignorar comentarios propios del bot (evita loop infinito)
        if (commentAuthorId === igAccountId) {
          console.log("⏭️ Comentario propio ignorado");
          return new NextResponse("ok", { status: 200 });
        }

        if (!commentText || !commentId) {
          return new NextResponse("ok", { status: 200 });
        }

        console.log(`💬 Instagram comentario | id: ${commentId} | texto: "${commentText}"`);

        const { data: igCommentAccount } = await supabase
          .from("social_accounts")
          .select("business_id, access_token")
          .eq("instagram_account_id", igAccountId)
          .eq("platform", "instagram")
          .eq("is_active", true)
          .maybeSingle();

        if (!igCommentAccount?.business_id) {
          return new NextResponse("ok", { status: 200 });
        }

        const { data: igCommentBusiness } = await supabase
          .from("businesses")
          .select("name, servicios, tono_bot, status, catalogo")
          .eq("id", igCommentAccount.business_id)
          .maybeSingle();

        if (igCommentBusiness?.status === "suspended" || igCommentBusiness?.status === "cancelled") {
          return new NextResponse("ok", { status: 200 });
        }

        const { public_reply, open_dm, dm_message } = await generateCommentReply({
          business: igCommentBusiness,
          commentText,
          platform: "instagram",
        });

        const pubResult = await sendInstagramCommentReply({
          accessToken: igCommentAccount.access_token,
          commentId,
          message: public_reply,
        });
        if (!pubResult.ok) {
          console.error("❌ Error respondiendo comentario Instagram:", JSON.stringify(pubResult.error));
        } else {
          console.log("✅ Respuesta pública al comentario enviada");
        }

        if (open_dm && dm_message && isTopLevelComment && commentAuthorId) {
          const dmResult = await sendInstagramMessage({
            accessToken: igCommentAccount.access_token,
            instagramAccountId: igAccountId,
            to: commentAuthorId,
            body: dm_message,
          });
          if (!dmResult.ok) {
            console.error("❌ Error enviando DM desde comentario Instagram:", JSON.stringify(dmResult.error));
          } else {
            console.log("✅ DM enviado al autor del comentario Instagram");
          }
        }

        return new NextResponse("ok", { status: 200 });
      }

      // ── DMs ──
      if (!messaging?.message || messaging.message.is_echo) {
        return new NextResponse("ok", { status: 200 });
      }

      const senderId = messaging.sender?.id;
      const recipientId = messaging.recipient?.id;
      const messageId = messaging.message?.mid;
      const text: string = messaging.message?.text || "";

      if (!text || !senderId) {
        console.log("⚠️ Instagram: mensaje sin texto o sender");
        return new NextResponse("ok", { status: 200 });
      }

      console.log(`📸 Instagram DM | de: ${senderId} | para: ${recipientId}`);

      const { data: saAccount } = await supabase
        .from("social_accounts")
        .select("business_id, access_token, instagram_account_id")
        .eq("instagram_account_id", recipientId)
        .eq("platform", "instagram")
        .eq("is_active", true)
        .maybeSingle();

      if (!saAccount?.business_id) {
        console.log("❌ Instagram account no vinculada a ningún negocio:", recipientId);
        return new NextResponse("ok", { status: 200 });
      }

      const businessId = saAccount.business_id;
      const accessToken = saAccount.access_token;

      const { error: igInsertError } = await supabase
        .from("mensajes_recibidos")
        .insert({ whatsapp: senderId, texto: text, tipo: "cliente", message_id: messageId, business_id: businessId });

      if (igInsertError) {
        console.log("⚠️ Instagram mensaje duplicado:", messageId);
        return new NextResponse("ok", { status: 200 });
      }

      const { data: business } = await supabase
        .from("businesses")
        .select("name, slogan, descripcion, servicios, instrucciones_bot, tono_bot, status")
        .eq("id", businessId)
        .maybeSingle();

      if (business?.status === "suspended" || business?.status === "cancelled") {
        return new NextResponse("ok", { status: 200 });
      }

      let { data: contacto } = await supabase
        .from("contactos")
        .select("*")
        .eq("business_id", businessId)
        .eq("whatsapp", senderId)
        .maybeSingle();

      if (!contacto) {
        const { data: nuevo } = await supabase
          .from("contactos")
          .insert({ whatsapp: senderId, business_id: businessId, estado: "interesado", veces_contacto: 1 })
          .select()
          .maybeSingle();
        contacto = nuevo;
      } else {
        await supabase
          .from("contactos")
          .update({ veces_contacto: (contacto.veces_contacto || 0) + 1 })
          .eq("id", contacto.id);
      }

      const { data: igHistorial } = await supabase
        .from("mensajes_recibidos")
        .select("texto, tipo")
        .eq("whatsapp", senderId)
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(10);

      const igHistory = (igHistorial || [])
        .reverse()
        .slice(0, -1)
        .map((m) => ({
          role: m.tipo === "bot" ? "assistant" as const : "user" as const,
          content: m.texto || "",
        }));

      const igSystemPrompt = getSystemPrompt({ business, contacto: contacto || {}, platform: "instagram" });
      const igUserPrompt = buildReplyPrompt({ contacto: contacto || {}, incomingMessage: text });
      const igRespuesta = await generateReply({ systemPrompt: igSystemPrompt, userPrompt: igUserPrompt, history: igHistory });

      await supabase.from("mensajes_recibidos").insert({
        whatsapp: senderId, texto: igRespuesta, tipo: "bot", business_id: businessId,
      });

      if (contacto) {
        const igMemory = await extractMemory({ business, contacto, incomingMessage: text, assistantReply: igRespuesta });
        await supabase
          .from("contactos")
          .update({
            resumen: igMemory.resumen,
            ultimo_tema: igMemory.ultimo_tema,
            necesidad: igMemory.necesidad,
            estado: igMemory.estado,
            nombre: igMemory.nombre || contacto.nombre || null,
            tipo_negocio: igMemory.tipo_negocio || null,
            presupuesto: igMemory.presupuesto || null,
            datos_extra: igMemory.datos_extra || null,
            ultima_respuesta: new Date().toISOString(),
          })
          .eq("id", contacto.id);
      }

      const igResult = await sendInstagramMessage({
        accessToken,
        instagramAccountId: saAccount.instagram_account_id,
        to: senderId,
        body: igRespuesta,
      });

      if (!igResult.ok) {
        console.error("❌ Error enviando Instagram DM:", JSON.stringify(igResult.error));
      } else {
        console.log("✅ Instagram DM enviado a", senderId);
      }

      return new NextResponse("ok", { status: 200 });
    }
    // ── FIN INSTAGRAM HANDLER ────────────────────────────────────────────────

    // ── FACEBOOK HANDLER (DMs + Comentarios) ─────────────────────────────────
    if (body.object === "page") {
      const messaging = body.entry?.[0]?.messaging?.[0];
      const change = body.entry?.[0]?.changes?.[0];

      // ── Comentarios ──
      if (change?.field === "feed" && change?.value?.item === "comment") {
        const verb: string = change.value?.verb || "";
        const commentId: string = change.value?.comment_id || "";
        const commentText: string = change.value?.message || "";
        const pageId: string = body.entry?.[0]?.id || "";
        const commentAuthorId: string = change.value?.from?.id || "";
        const postId: string = change.value?.post_id || "";
        // En Facebook, parent_id = post_id significa comentario raíz; si es diferente es una respuesta
        const isTopLevelComment: boolean = change.value?.parent_id === postId;

        // Solo procesar comentarios nuevos
        if (verb !== "add") {
          console.log(`⏭️ Evento feed ignorado — verb: ${verb}`);
          return new NextResponse("ok", { status: 200 });
        }

        // Ignorar comentarios propios de la página (evita loop infinito)
        if (commentAuthorId === pageId) {
          console.log("⏭️ Comentario propio de la página ignorado");
          return new NextResponse("ok", { status: 200 });
        }

        if (!commentText || !commentId) {
          return new NextResponse("ok", { status: 200 });
        }

        console.log(`💬 Facebook comentario | id: ${commentId} | texto: "${commentText}"`);

        const { data: fbCommentAccount } = await supabase
          .from("social_accounts")
          .select("business_id, access_token")
          .eq("page_id", pageId)
          .eq("platform", "facebook")
          .eq("is_active", true)
          .maybeSingle();

        if (!fbCommentAccount?.business_id) {
          return new NextResponse("ok", { status: 200 });
        }

        console.log("🔑 FB token en uso:", fbCommentAccount.access_token?.slice(0, 20) + "...");

        const { data: fbCommentBusiness } = await supabase
          .from("businesses")
          .select("name, servicios, tono_bot, status, catalogo")
          .eq("id", fbCommentAccount.business_id)
          .maybeSingle();

        if (fbCommentBusiness?.status === "suspended" || fbCommentBusiness?.status === "cancelled") {
          return new NextResponse("ok", { status: 200 });
        }

        const { public_reply, open_dm, dm_message } = await generateCommentReply({
          business: fbCommentBusiness,
          commentText,
          platform: "facebook",
        });

        // Requiere pages_manage_engagement Advanced Access (App Review pendiente)
        // const pubResult = await sendFacebookCommentReply({
        //   accessToken: fbCommentAccount.access_token,
        //   commentId: postId,
        //   message: public_reply,
        // });
        console.log("⏭️ Respuesta pública FB omitida — pendiente App Review");

        if (open_dm && dm_message && isTopLevelComment && commentAuthorId) {
          const dmResult = await sendFacebookMessage({
            accessToken: fbCommentAccount.access_token,
            pageId,
            to: commentAuthorId,
            body: dm_message,
          });
          if (!dmResult.ok) {
            console.error("❌ Error enviando DM Facebook desde comentario:", JSON.stringify(dmResult.error));
          } else {
            console.log("✅ DM Facebook enviado al autor del comentario");
          }
        }

        return new NextResponse("ok", { status: 200 });
      }

      // ── DMs ──
      if (!messaging?.message || messaging.message.is_echo) {
        return new NextResponse("ok", { status: 200 });
      }

      const senderId = messaging.sender?.id;
      const recipientId = messaging.recipient?.id;
      const messageId = messaging.message?.mid;
      const text: string = messaging.message?.text || "";

      if (!text || !senderId) {
        console.log("⚠️ Facebook: mensaje sin texto o sender");
        return new NextResponse("ok", { status: 200 });
      }

      console.log(`📘 Facebook DM | de: ${senderId} | para: ${recipientId}`);

      const { data: fbAccount } = await supabase
        .from("social_accounts")
        .select("business_id, access_token, page_id")
        .eq("page_id", recipientId)
        .eq("platform", "facebook")
        .eq("is_active", true)
        .maybeSingle();

      if (!fbAccount?.business_id) {
        console.log("❌ Facebook page no vinculada a ningún negocio:", recipientId);
        return new NextResponse("ok", { status: 200 });
      }

      const businessId = fbAccount.business_id;
      const accessToken = fbAccount.access_token;

      const { error: fbInsertError } = await supabase
        .from("mensajes_recibidos")
        .insert({ whatsapp: senderId, texto: text, tipo: "cliente", message_id: messageId, business_id: businessId });

      if (fbInsertError) {
        console.log("⚠️ Facebook mensaje duplicado:", messageId);
        return new NextResponse("ok", { status: 200 });
      }

      const { data: fbBusiness } = await supabase
        .from("businesses")
        .select("name, slogan, descripcion, servicios, instrucciones_bot, tono_bot, status")
        .eq("id", businessId)
        .maybeSingle();

      if (fbBusiness?.status === "suspended" || fbBusiness?.status === "cancelled") {
        return new NextResponse("ok", { status: 200 });
      }

      let { data: fbContacto } = await supabase
        .from("contactos")
        .select("*")
        .eq("business_id", businessId)
        .eq("whatsapp", senderId)
        .maybeSingle();

      if (!fbContacto) {
        const { data: nuevo } = await supabase
          .from("contactos")
          .insert({ whatsapp: senderId, business_id: businessId, estado: "interesado", veces_contacto: 1 })
          .select()
          .maybeSingle();
        fbContacto = nuevo;
      } else {
        await supabase
          .from("contactos")
          .update({ veces_contacto: (fbContacto.veces_contacto || 0) + 1 })
          .eq("id", fbContacto.id);
      }

      const { data: fbHistorial } = await supabase
        .from("mensajes_recibidos")
        .select("texto, tipo")
        .eq("whatsapp", senderId)
        .eq("business_id", businessId)
        .order("created_at", { ascending: false })
        .limit(10);

      const fbHistory = (fbHistorial || [])
        .reverse()
        .slice(0, -1)
        .map((m) => ({
          role: m.tipo === "bot" ? "assistant" as const : "user" as const,
          content: m.texto || "",
        }));

      const fbSystemPrompt = getSystemPrompt({ business: fbBusiness, contacto: fbContacto || {}, platform: "facebook" });
      const fbUserPrompt = buildReplyPrompt({ contacto: fbContacto || {}, incomingMessage: text });
      const fbRespuesta = await generateReply({ systemPrompt: fbSystemPrompt, userPrompt: fbUserPrompt, history: fbHistory });

      await supabase.from("mensajes_recibidos").insert({
        whatsapp: senderId, texto: fbRespuesta, tipo: "bot", business_id: businessId,
      });

      if (fbContacto) {
        const fbMemory = await extractMemory({ business: fbBusiness, contacto: fbContacto, incomingMessage: text, assistantReply: fbRespuesta });
        await supabase
          .from("contactos")
          .update({
            resumen: fbMemory.resumen,
            ultimo_tema: fbMemory.ultimo_tema,
            necesidad: fbMemory.necesidad,
            estado: fbMemory.estado,
            nombre: fbMemory.nombre || fbContacto.nombre || null,
            tipo_negocio: fbMemory.tipo_negocio || null,
            presupuesto: fbMemory.presupuesto || null,
            datos_extra: fbMemory.datos_extra || null,
            ultima_respuesta: new Date().toISOString(),
          })
          .eq("id", fbContacto.id);
      }

      const fbResult = await sendFacebookMessage({
        accessToken,
        pageId: fbAccount.page_id,
        to: senderId,
        body: fbRespuesta,
      });

      if (!fbResult.ok) {
        console.error("❌ Error enviando Facebook DM:", JSON.stringify(fbResult.error));
      } else {
        console.log("✅ Facebook DM enviado a", senderId);
      }

      return new NextResponse("ok", { status: 200 });
    }
    // ── FIN FACEBOOK HANDLER ─────────────────────────────────────────────────

    const entry = body.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const message = value?.messages?.[0];

    if (!message) {
      console.log("⚠️ Sin mensaje en el body. Tipo de evento:", value?.statuses ? "status_update" : "otro");
      return new NextResponse("No message", { status: 200 });
    }

    const phoneNumberId = String(value?.metadata?.phone_number_id || "").trim();
    const from = message.from;
    const messageId = message.id;
    const text = message.text?.body || "";
    const messageType = message.type || "unknown";

    const profileName = value?.contacts?.[0]?.profile?.name || null;

    console.log("📞 phoneNumberId recibido:", `"${phoneNumberId}"`);
    console.log("👤 Perfil:", profileName);
    console.log("💬 Tipo:", messageType, "| Texto:", text || "(vacío)");
    console.log("📱 De:", from);

    if (messageType !== "text") {
      console.log(`⚠️ Tipo de mensaje no soportado: ${messageType} — se ignora`);
      return new NextResponse("ok", { status: 200 });
    }

    // 1. MAPEAR A NEGOCIO
    const { data: waAccount, error: waError } = await supabase
      .from("whatsapp_accounts")
      .select("business_id, access_token, phone_number_id")
      .eq("phone_number_id", phoneNumberId)
      .maybeSingle();

    console.log("🔍 Búsqueda en whatsapp_accounts por phone_number_id:", phoneNumberId);
    console.log("🔍 Resultado:", waAccount ? `business_id=${waAccount.business_id}` : "NO ENCONTRADO", waError ? `| error: ${waError.message}` : "");

    if (waError || !waAccount?.business_id) {
      console.error("❌ Número no vinculado a ningún negocio. phone_number_id buscado:", phoneNumberId);
      return new NextResponse("ok", { status: 200 });
    }

    const businessId = waAccount.business_id;
    const accessToken = waAccount.access_token || "";
    console.log("✅ Negocio encontrado:", businessId);
    console.log("🔑 accessToken:", accessToken ? accessToken.slice(0, 10) + "..." : "⚠️ VACÍO — no podrá enviar mensajes");

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
      .select("name, slogan, descripcion, servicios, instrucciones_bot, tono_bot, status")
      .eq("id", businessId)
      .maybeSingle();

    // Verificar estado del negocio
    if (business?.status === "suspended") {
      console.log(`⚠️ Negocio suspendido: ${business.name}`);
      await sendWhatsAppText({
        accessToken,
        phoneNumberId,
        to: from,
        body: "⚠️ Este servicio está temporalmente suspendido.\n\nSi crees que esto es un error, contacta con nosotros.",
      });
      return new NextResponse("ok", { status: 200 });
    }

    if (business?.status === "cancelled") {
      console.log(`❌ Negocio cancelado: ${business.name}`);
      return new NextResponse("ok", { status: 200 });
    }

    // 4. BUSCAR O CREAR CONTACTO
    let { data: contacto } = await supabase
      .from("contactos")
      .select("*")
      .eq("business_id", businessId)
      .eq("whatsapp", from)
      .maybeSingle();

    let isNewContact = false;
    let sellerWhatsapp: string | null = null;

    if (!contacto) {
      isNewContact = true;

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

        const { data: sellerUser } = await supabase
          .from("business_users")
          .select("whatsapp")
          .eq("user_id", assignedUserId)
          .eq("business_id", businessId)
          .maybeSingle();
        sellerWhatsapp = sellerUser?.whatsapp || null;
      }

      const { data: nuevo } = await supabase
        .from("contactos")
        .insert({
          whatsapp: from,
          business_id: businessId,
          estado: "interesado",
          veces_contacto: 1,
          assigned_user_id: assignedUserId,
          nombre: profileName  // ✅ NUEVO: Guardar nombre del perfil
        })
        .select()
        .maybeSingle();

      contacto = nuevo;
      console.log("👤 Contacto creado:", profileName ?? "sin nombre", "| asignado a:", assignedUserId ?? "sin asignar");
    } else {
      // Actualizar nombre si viene del perfil y no lo tenemos
      const updateData: any = {
        veces_contacto: (contacto.veces_contacto || 0) + 1
      };

      if (profileName && (!contacto.nombre || contacto.nombre === 'Desconocido')) {
        updateData.nombre = profileName;
        console.log("📝 Actualizando nombre a:", profileName);
      }

      await supabase
        .from("contactos")
        .update(updateData)
        .eq("id", contacto.id);

      // Buscar WhatsApp del seller para notificación (contacto existente)
      if (contacto.assigned_user_id) {
        const { data: sellerUser } = await supabase
          .from("business_users")
          .select("whatsapp")
          .eq("user_id", contacto.assigned_user_id)
          .eq("business_id", businessId)
          .maybeSingle();
        sellerWhatsapp = sellerUser?.whatsapp || null;
      }
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
    let memory: Awaited<ReturnType<typeof extractMemory>> | null = null;

    if (contacto) {
      memory = await extractMemory({
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
          // ✅ MEJORADO: Priorizar nombre del perfil > nombre extraído por IA > nombre actual
          nombre: profileName || memory.nombre || contacto.nombre || null,
          sitio_web: memory.sitio_web || null,
          tipo_negocio: memory.tipo_negocio || null,
          presupuesto: memory.presupuesto || null,
          datos_extra: memory.datos_extra || null,
          ultima_respuesta: new Date().toISOString(),
        })
        .eq("id", contacto.id);

      console.log("🧠 Memoria actualizada:", memory.estado);
    }

    // 8.5. NOTIFICAR AL VENDEDOR cuando el bot califica el lead como "contactar"
    const estadoAnterior = contacto?.estado || "interesado";
    const estadoNuevo = memory?.estado;
    const transicionAContactar = estadoNuevo === "contactar" && estadoAnterior !== "contactar";

    if (transicionAContactar && sellerWhatsapp && contacto) {
      const nombre = profileName || memory?.nombre || contacto.nombre || "Sin nombre";
      const necesidad = memory?.necesidad || contacto.necesidad || "No especificada";
      const presupuesto = memory?.presupuesto || contacto.presupuesto || "No especificado";
      const cleanNumber = sellerWhatsapp.replace(/\D/g, "");

      const notifMsg =
        `📞 Lead listo para llamar\n\n` +
        `Nombre: ${nombre}\n` +
        `Necesidad: ${necesidad}\n` +
        `Presupuesto: ${presupuesto}\n\n` +
        `Ver lead → https://prospekto.mx/leads/${contacto.id}`;

      const notifResult = await sendWhatsAppText({
        accessToken,
        phoneNumberId,
        to: cleanNumber,
        body: notifMsg,
      });

      if (notifResult.ok) {
        console.log("🔔 Notificación 'contactar' enviada al vendedor:", cleanNumber);
      } else {
        console.warn("⚠️ No se pudo notificar al vendedor:", notifResult.error);
      }
    }

    // 9. ENVIAR WHATSAPP
    const resultado = await sendWhatsAppText({ accessToken, phoneNumberId, to: from, body: respuesta });

    if (!resultado.ok) {
      console.error("❌ Error enviando WhatsApp:", JSON.stringify(resultado.error));
      console.error("❌ Params usados — phoneNumberId:", phoneNumberId, "| to:", from, "| tokenInicio:", accessToken.slice(0, 10));
    } else {
      console.log("✅ Mensaje enviado a", from);
    }

    return new NextResponse("ok", { status: 200 });
  } catch (error) {
    console.error("🔥 Webhook error:", error);
    return new NextResponse("error", { status: 500 });
  }
}
import OpenAI from "openai";
import { buscarProductos } from "@/lib/ai/productos";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

type Business = {
  name?: string | null;
  servicios?: string | null;
  tono_bot?: string | null;
  catalogo?: Record<string, string | number | boolean | null>[] | null;
};

export async function generateCommentReply({
  business,
  commentText,
  platform,
}: {
  business?: Business | null;
  commentText: string;
  platform: "instagram" | "facebook";
}): Promise<{
  public_reply: string;
  open_dm: boolean;
  dm_message: string | null;
}> {
  const productosRelevantes = buscarProductos(business?.catalogo ?? null, commentText);
  const canalNombre = platform === "instagram" ? "Instagram" : "Facebook";

  const systemPrompt = `Eres el community manager de ${business?.name || "este negocio"} en ${canalNombre}.

Un usuario dejó un comentario público en una publicación. Decide cómo responder.

NEGOCIO:
${business?.servicios || "Sin descripción de servicios"}
${productosRelevantes}
TONO: ${business?.tono_bot || "profesional y amigable"}

REGLAS:
- Respuesta pública: máximo 2 líneas, natural, con emojis moderados
- Intención de compra o pregunta de precio/disponibilidad → open_dm: true
- Cumplido o comentario positivo genérico → open_dm: false, responde amablemente
- Grosero o irrespetuoso → open_dm: false, responde con calma y profesionalismo, sin enojo
- Si open_dm es true, dm_message es el primer mensaje que el bot enviará al usuario por privado
- Nunca inventes precios que no estén en la información del negocio

Responde SOLO con JSON válido:
{
  "public_reply": "texto de respuesta pública",
  "open_dm": true,
  "dm_message": "primer mensaje del DM, o null si open_dm es false"
}`;

  try {
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Comentario: "${commentText}"` },
      ],
      response_format: { type: "json_object" },
      max_tokens: 300,
      temperature: 0.7,
    });

    const parsed = JSON.parse(response.choices[0].message.content || "{}");
    return {
      public_reply: parsed.public_reply || "¡Gracias por tu comentario! 😊",
      open_dm: Boolean(parsed.open_dm),
      dm_message: parsed.dm_message || null,
    };
  } catch {
    return {
      public_reply: "¡Gracias por tu comentario! 😊",
      open_dm: false,
      dm_message: null,
    };
  }
}

import OpenAI from "openai";

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

type Business = {
  name?: string | null;
};

type Contacto = {
  resumen?: string | null;
  ultimo_tema?: string | null;
  necesidad?: string | null;
  estado?: string | null;
  nombre?: string | null;
  sitio_web?: string | null;
  tipo_negocio?: string | null;
  presupuesto?: string | null;
  datos_extra?: string | null;
};

export type MemoryExtraction = {
  resumen: string;
  ultimo_tema: string;
  necesidad: string;
  estado: "interesado" | "llamar" | "contactado" | "cliente" | "perdido";
  nombre: string;
  sitio_web: string;
  tipo_negocio: string;
  presupuesto: string;
  datos_extra: string;
};

export async function extractMemory({
  business,
  contacto,
  incomingMessage,
  assistantReply,
}: {
  business?: Business | null;
  contacto: Contacto;
  incomingMessage: string;
  assistantReply: string;
}): Promise<MemoryExtraction> {
  if (!OPENAI_API_KEY) {
    return fallback(contacto, incomingMessage);
  }

  const prompt = `
Analiza la conversación y extrae datos del cliente. Devuelve SOLO JSON válido, sin markdown.

Negocio: ${business?.name || "Negocio"}

Datos previos del cliente:
- Nombre: ${contacto.nombre || "Desconocido"}
- Sitio web: ${contacto.sitio_web || "No mencionado"}
- Tipo de negocio: ${contacto.tipo_negocio || "No mencionado"}
- Presupuesto: ${contacto.presupuesto || "No mencionado"}
- Resumen previo: ${contacto.resumen || "Sin historial"}
- Último tema: ${contacto.ultimo_tema || "Sin tema"}
- Necesidad: ${contacto.necesidad || "Sin necesidad"}
- Estado: ${contacto.estado || "interesado"}
- Datos extra: ${contacto.datos_extra || "Ninguno"}

Nuevo mensaje del cliente:
"${incomingMessage}"

Respuesta del bot:
"${assistantReply}"

Devuelve SOLO este JSON (actualiza los campos con nueva info, conserva lo que ya había):
{
  "resumen": "historial acumulable breve",
  "ultimo_tema": "tema corto del último mensaje",
  "necesidad": "qué quiere el cliente",
  "estado": "interesado",
  "nombre": "nombre si lo mencionó, sino conserva el anterior",
  "sitio_web": "URL si la mencionó, sino conserva la anterior",
  "tipo_negocio": "tipo de negocio si lo mencionó, sino conserva el anterior",
  "presupuesto": "presupuesto si lo mencionó, sino conserva el anterior",
  "datos_extra": "cualquier otro dato relevante acumulado"
}

Reglas:
- "estado" solo puede ser: interesado, llamar, contactado, cliente, perdido
- Conserva datos previos si no se mencionaron de nuevo
- "datos_extra" es acumulable, agrega info nueva sin borrar la anterior
- Si el cliente mencionó su sitio web, ponlo en "sitio_web"
- Si mencionó su nombre, ponlo en "nombre"
`;

  try {
    const completion = await openai.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.1,
      messages: [
        { role: "system", content: "Eres un extractor de datos. Devuelve solo JSON válido, sin markdown." },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content?.trim() || "{}";
    const parsed = safeJsonParse(raw);

    return {
      resumen: String(parsed?.resumen || contacto.resumen || incomingMessage),
      ultimo_tema: String(parsed?.ultimo_tema || incomingMessage.slice(0, 120)),
      necesidad: String(parsed?.necesidad || contacto.necesidad || ""),
      estado: normalizeEstado(parsed?.estado || contacto.estado || "interesado"),
      nombre: String(parsed?.nombre || contacto.nombre || ""),
      sitio_web: String(parsed?.sitio_web || contacto.sitio_web || ""),
      tipo_negocio: String(parsed?.tipo_negocio || contacto.tipo_negocio || ""),
      presupuesto: String(parsed?.presupuesto || contacto.presupuesto || ""),
      datos_extra: String(parsed?.datos_extra || contacto.datos_extra || ""),
    };
  } catch (error) {
    console.error("Error extrayendo memoria:", error);
    return fallback(contacto, incomingMessage);
  }
}

function fallback(contacto: Contacto, incomingMessage: string): MemoryExtraction {
  return {
    resumen: contacto.resumen || incomingMessage,
    ultimo_tema: incomingMessage.slice(0, 120),
    necesidad: contacto.necesidad || "",
    estado: normalizeEstado(contacto.estado || "interesado"),
    nombre: contacto.nombre || "",
    sitio_web: contacto.sitio_web || "",
    tipo_negocio: contacto.tipo_negocio || "",
    presupuesto: contacto.presupuesto || "",
    datos_extra: contacto.datos_extra || "",
  };
}

export function normalizeEstado(estado: string): "interesado" | "llamar" | "contactado" | "cliente" | "perdido" {
  const v = String(estado || "").toLowerCase().trim();
  if (v === "llamar") return "llamar";
  if (v === "contactado") return "contactado";
  if (v === "cliente") return "cliente";
  if (v === "perdido") return "perdido";
  return "interesado";
}

function safeJsonParse(input: string) {
  try {
    return JSON.parse(input);
  } catch {
    const cleaned = input.replace(/^```json/i, "").replace(/^```/i, "").replace(/```$/i, "").trim();
    try { return JSON.parse(cleaned); } catch { return {}; }
  }
}
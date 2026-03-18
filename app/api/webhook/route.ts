import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';

// 1. Configuración de clientes
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 2. Validación del Webhook (GET) - Para que Meta acepte tu URL
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode && token === process.env.VERIFY_TOKEN) {
    return new Response(challenge, { status: 200 });
  }
  return new Response('Error de validación', { status: 403 });
}

// 3. Lógica Principal (POST) - Aquí ocurre la magia del bot
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validar que sea un mensaje y no un cambio de estado [cite: 55, 56]
    const message = body.entry?.[0]?.changes?.[0]?.value?.messages?.[0];
    if (!message) return NextResponse.json({ status: 'ignored' });

    const phone = message.from; // Número del cliente
    const text = message.text?.body;
    const clientName = body.entry[0].changes[0].value.contacts?.[0]?.profile?.name || 'Cliente';

    // A. Buscar o crear cliente en Supabase [cite: 57, 62]
    let { data: contact } = await supabase
      .from('contactos')
      .select('*')
      .eq('whatsapp', phone)
      .single();

    if (!contact) {
      const { data: newContact } = await supabase
        .from('contactos')
        .insert([{ whatsapp: phone, nombre: clientName, veces_contacto: 1 }])
        .select()
        .single();
      contact = newContact;
    } else {
      await supabase
        .from('contactos')
        .update({ veces_contacto: (contact.veces_contacto || 1) + 1 })
        .eq('whatsapp', phone);
    }

    // B. Generar Respuesta con OpenAI usando memoria del Excel [cite: 64, 66]
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: `Eres un asistente de ventas profesional. 
          Contexto del cliente:
          - Resumen previo: ${contact?.resumen || 'Sin historial'}
          - Última necesidad: ${contact?.necesidad || 'Desconocida'}
          - Último tema: ${contact?.ultimo_tema || 'Ninguno'}` 
        },
        { role: "user", content: text }
      ],
    });

    const botResponse = completion.choices[0].message.content;

    // C. Actualizar Memoria Inteligente (Opcional: Segundo prompt para resumen) [cite: 69, 70]
    // Aquí podrías añadir otra llamada a OpenAI para actualizar los campos 'resumen' y 'estado'.

    await supabase
      .from('contactos')
      .update({
        ultimo_tema: text.substring(0, 100),
        // Aquí puedes actualizar 'resumen' y 'necesidad' con lógica de IA
      })
      .eq('whatsapp', phone);

    // D. Enviar respuesta a WhatsApp [cite: 74, 75]
    await fetch(`https://graph.facebook.com/v18.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: { body: botResponse },
      }),
    });

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
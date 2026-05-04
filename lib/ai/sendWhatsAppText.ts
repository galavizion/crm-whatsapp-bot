export async function sendWhatsAppTemplate({
  accessToken,
  phoneNumberId,
  to,
  templateName,
  languageCode = "es_MX",
  parameters,
}: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  templateName: string;
  languageCode?: string;
  parameters: string[];
}) {
  if (!accessToken || !phoneNumberId) {
    return { ok: false, error: "Falta accessToken o phoneNumberId" };
  }
  try {
    const res = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "template",
          template: {
            name: templateName,
            language: { code: languageCode },
            components: [{
              type: "body",
              parameters: parameters.map((value) => ({ type: "text", text: value })),
            }],
          },
        }),
      }
    );
    const data = await res.json();
    return res.ok ? { ok: true, data } : { ok: false, error: data };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function sendWhatsAppText({
  accessToken,
  phoneNumberId,
  to,
  body,
}: {
  accessToken: string;
  phoneNumberId: string;
  to: string;
  body: string;
}) {
  if (!accessToken || !phoneNumberId) {
    return { ok: false, error: "Falta accessToken o phoneNumberId" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v23.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          type: "text",
          text: {
            body,
          },
        }),
      }
    );

    const data = await res.json();

    if (!res.ok) {
      return { ok: false, error: data };
    }

    return { ok: true, data };
  } catch (error) {
    return { ok: false, error };
  }
}
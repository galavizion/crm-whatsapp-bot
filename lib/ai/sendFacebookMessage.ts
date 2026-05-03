export async function sendFacebookMessage({
  accessToken,
  pageId,
  to,
  body,
}: {
  accessToken: string;
  pageId: string;
  to: string;
  body: string;
}) {
  if (!accessToken || !pageId) {
    return { ok: false, error: "Falta accessToken o pageId" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v23.0/${pageId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipient: { id: to },
          message: { text: body },
          messaging_type: "RESPONSE",
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

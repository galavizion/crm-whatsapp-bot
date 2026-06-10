export async function sendInstagramMessage({
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
      `https://graph.facebook.com/v23.0/${pageId}/messages?access_token=${accessToken}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recipient: { id: to },
          message: { text: body },
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

export async function sendInstagramMessage({
  accessToken,
  instagramAccountId,
  to,
  body,
}: {
  accessToken: string;
  instagramAccountId: string;
  to: string;
  body: string;
}) {
  if (!accessToken || !instagramAccountId) {
    return { ok: false, error: "Falta accessToken o instagramAccountId" };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v23.0/${instagramAccountId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
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

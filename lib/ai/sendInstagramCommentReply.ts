export async function sendInstagramCommentReply({
  accessToken,
  commentId,
  message,
}: {
  accessToken: string;
  commentId: string;
  message: string;
}): Promise<{ ok: boolean; error?: unknown }> {
  try {
    const res = await fetch(
      `https://graph.instagram.com/v23.0/${commentId}/replies`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      }
    );
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data };
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

export async function sendInstagramPrivateReply({
  accessToken,
  commentId,
  message,
}: {
  accessToken: string;
  commentId: string;
  message: string;
}): Promise<{ ok: boolean; error?: unknown }> {
  try {
    const res = await fetch(
      `https://graph.instagram.com/v23.0/${commentId}/private_replies`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      }
    );
    const data = await res.json();
    if (!res.ok) return { ok: false, error: data };
    return { ok: true };
  } catch (error) {
    return { ok: false, error };
  }
}

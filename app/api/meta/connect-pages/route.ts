import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const APP_ID = process.env.PROSPEKTO_APP_ID!;
const APP_SECRET = process.env.PROSPEKTO_APP_SECRET!;
const GRAPH = "https://graph.facebook.com/v23.0";
const GOD_EMAIL = "rene.galaviz@gmail.com";

export async function POST(req: NextRequest) {
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { accessToken, businessId } = await req.json();
  if (!accessToken || !businessId) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const isGod = user.email === GOD_EMAIL;
  if (!isGod) {
    const { data: bu } = await admin
      .from("business_users")
      .select("role")
      .eq("user_id", user.id)
      .eq("business_id", businessId)
      .maybeSingle();
    if (!bu || !["admin", "seller"].includes(bu.role)) {
      return NextResponse.json({ error: "Sin permiso para este negocio" }, { status: 403 });
    }
  }

  try {
    // Intercambiar por token de larga duración
    const ltRes = await fetch(
      `${GRAPH}/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${APP_ID}` +
      `&client_secret=${APP_SECRET}` +
      `&fb_exchange_token=${encodeURIComponent(accessToken)}`
    );
    const ltData = await ltRes.json();
    const longToken: string = ltData.access_token || accessToken;

    // Obtener páginas de Facebook del usuario
    const pagesRes = await fetch(`${GRAPH}/me/accounts?access_token=${longToken}`);
    const pagesData = await pagesRes.json();
    const pages: any[] = pagesData.data || [];

    if (pages.length === 0) {
      return NextResponse.json(
        { error: "No se encontraron páginas de Facebook en esta cuenta. Asegúrate de ser administrador de al menos una página." },
        { status: 400 }
      );
    }

    let pagesConnected = 0;
    let instagramConnected = 0;

    for (const page of pages) {
      const pageToken: string = page.access_token;
      const pageId: string = page.id;

      // Guardar página de Facebook
      const { error: fbError } = await admin.from("social_accounts").upsert(
        {
          business_id: businessId,
          platform: "facebook",
          page_id: pageId,
          access_token: pageToken,
          is_active: true,
        },
        { onConflict: "business_id,platform" }
      );

      if (!fbError) pagesConnected++;

      // Suscribir la página al webhook para recibir mensajes y comentarios
      await fetch(
        `${GRAPH}/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed&access_token=${pageToken}`,
        { method: "POST" }
      );

      // Buscar cuenta de Instagram vinculada a esta página
      const igRes = await fetch(
        `${GRAPH}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
      );
      const igData = await igRes.json();
      const igAccountId: string | undefined = igData.instagram_business_account?.id;

      if (igAccountId) {
        const { error: igError } = await admin.from("social_accounts").upsert(
          {
            business_id: businessId,
            platform: "instagram",
            instagram_account_id: igAccountId,
            page_id: pageId,
            access_token: pageToken,
            is_active: true,
          },
          { onConflict: "business_id,platform" }
        );

        if (!igError) instagramConnected++;
      }
    }

    return NextResponse.json({ ok: true, pagesConnected, instagramConnected });
  } catch (err: any) {
    console.error("Connect pages error:", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}

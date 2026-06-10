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

  const { accessToken, businessId, selectedPageId, longLivedToken } = await req.json();
  if (!businessId) return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });

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
    // ── FASE 2: guardar página seleccionada ──────────────────────────────────
    if (selectedPageId && longLivedToken) {
      const pagesRes = await fetch(`${GRAPH}/me/accounts?access_token=${longLivedToken}`);
      const pagesData = await pagesRes.json();
      const pages: any[] = pagesData.data || [];

      const page = pages.find((p: any) => p.id === selectedPageId);
      if (!page) {
        return NextResponse.json({ error: "Página no encontrada en tu cuenta de Facebook." }, { status: 400 });
      }

      const pageToken: string = page.access_token;
      const pageId: string = page.id;

      const { error: fbError } = await admin.from("social_accounts").upsert(
        { business_id: businessId, platform: "facebook", page_id: pageId, page_name: page.name, access_token: pageToken, is_active: true },
        { onConflict: "business_id,platform" }
      );
      if (fbError) return NextResponse.json({ error: "Error al guardar en base de datos" }, { status: 500 });

      // Suscribir la página al webhook
      const subRes = await fetch(
        `${GRAPH}/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed&access_token=${pageToken}`,
        { method: "POST" }
      );
      const subData = await subRes.json();
      if (!subRes.ok || !subData.success) {
        console.error(`❌ Error suscribiendo webhook para página ${pageId}:`, JSON.stringify(subData));
      } else {
        console.log(`✅ Webhook suscrito para página ${pageId}`);
      }

      // Buscar cuenta de Instagram vinculada
      let instagramConnected = 0;
      const igRes = await fetch(`${GRAPH}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
      const igData = await igRes.json();
      const igAccountId: string | undefined = igData.instagram_business_account?.id;

      if (igAccountId) {
        const { error: igError } = await admin.from("social_accounts").upsert(
          { business_id: businessId, platform: "instagram", instagram_account_id: igAccountId, page_id: pageId, access_token: pageToken, is_active: true },
          { onConflict: "business_id,platform" }
        );
        if (!igError) instagramConnected++;
      }

      return NextResponse.json({ ok: true, pagesConnected: 1, instagramConnected });
    }

    // ── FASE 1: devolver lista de páginas disponibles ────────────────────────
    if (!accessToken) return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });

    const ltRes = await fetch(
      `${GRAPH}/oauth/access_token` +
      `?grant_type=fb_exchange_token` +
      `&client_id=${APP_ID}` +
      `&client_secret=${APP_SECRET}` +
      `&fb_exchange_token=${encodeURIComponent(accessToken)}`
    );
    const ltData = await ltRes.json();
    if (ltData.error) {
      console.error("❌ Token exchange error:", JSON.stringify(ltData.error));
      return NextResponse.json({ error: `Error al canjear token: ${ltData.error.message}` }, { status: 400 });
    }
    const longToken: string = ltData.access_token || accessToken;

    const pagesRes = await fetch(`${GRAPH}/me/accounts?fields=id,name,picture&access_token=${longToken}`);
    const pagesData = await pagesRes.json();
    if (pagesData.error) {
      console.error("❌ /me/accounts error:", JSON.stringify(pagesData.error));
      return NextResponse.json({ error: `Error al obtener páginas: ${pagesData.error.message}` }, { status: 400 });
    }
    const pages: any[] = pagesData.data || [];

    if (pages.length === 0) {
      console.error("❌ /me/accounts vacío. Raw:", JSON.stringify(pagesData));
      return NextResponse.json(
        { error: `No se encontraron páginas. Raw: ${JSON.stringify(pagesData)}` },
        { status: 400 }
      );
    }

    // Si solo hay una página, guardarla directamente
    if (pages.length === 1) {
      const page = pages[0];
      const pageToken: string = page.access_token;
      const pageId: string = page.id;

      await admin.from("social_accounts").upsert(
        { business_id: businessId, platform: "facebook", page_id: pageId, page_name: page.name, access_token: pageToken, is_active: true },
        { onConflict: "business_id,platform" }
      );

      await fetch(
        `${GRAPH}/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks,feed&access_token=${pageToken}`,
        { method: "POST" }
      );

      let instagramConnected = 0;
      const igRes = await fetch(`${GRAPH}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`);
      const igData = await igRes.json();
      const igAccountId: string | undefined = igData.instagram_business_account?.id;
      if (igAccountId) {
        await admin.from("social_accounts").upsert(
          { business_id: businessId, platform: "instagram", instagram_account_id: igAccountId, page_id: pageId, access_token: pageToken, is_active: true },
          { onConflict: "business_id,platform" }
        );
        instagramConnected++;
      }

      return NextResponse.json({ ok: true, pagesConnected: 1, instagramConnected });
    }

    // Múltiples páginas — devolver lista para que el usuario elija
    return NextResponse.json({
      selectPage: true,
      longLivedToken: longToken,
      pages: pages.map((p: any) => ({
        id: p.id,
        name: p.name,
        picture: p.picture?.data?.url || null,
      })),
    });
  } catch (err: any) {
    console.error("Connect pages error:", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}

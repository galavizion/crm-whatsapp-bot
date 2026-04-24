import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const APP_ID = process.env.PROSPEKTO_APP_ID!;
const APP_SECRET = process.env.PROSPEKTO_APP_SECRET!;
const GRAPH = "https://graph.facebook.com/v23.0";

export async function POST(req: NextRequest) {
  // Verificar sesión activa
  const supabaseUser = await createClient();
  const {
    data: { user },
  } = await supabaseUser.auth.getUser();
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const { code, businessId } = await req.json();
  if (!code || !businessId) {
    return NextResponse.json({ error: "Parámetros inválidos" }, { status: 400 });
  }

  // Verificar que el usuario pertenece al negocio (o es god)
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const isGod = user.email === "rene.galaviz@gmail.com";
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
    // 1. Intercambiar code por user access token
    const tokenRes = await fetch(
      `${GRAPH}/oauth/access_token` +
        `?client_id=${APP_ID}` +
        `&client_secret=${APP_SECRET}` +
        `&code=${encodeURIComponent(code)}`
    );
    const tokenData = await tokenRes.json();

    if (tokenData.error || !tokenData.access_token) {
      console.error("Token exchange error:", tokenData.error);
      return NextResponse.json(
        { error: tokenData.error?.message || "Error al obtener el token de Meta" },
        { status: 400 }
      );
    }

    const userAccessToken: string = tokenData.access_token;

    // 2. Obtener WABA IDs desde los granular scopes del token
    const debugRes = await fetch(
      `${GRAPH}/debug_token` +
        `?input_token=${userAccessToken}` +
        `&access_token=${APP_ID}|${APP_SECRET}`
    );
    const debugData = await debugRes.json();

    const wabaIds: string[] =
      debugData.data?.granular_scopes?.find(
        (s: any) => s.scope === "whatsapp_business_management"
      )?.target_ids ?? [];

    if (wabaIds.length === 0) {
      return NextResponse.json(
        { error: "No se encontró ninguna cuenta de WhatsApp Business autorizada en el token." },
        { status: 400 }
      );
    }

    const wabaId = wabaIds[0];

    // 3. Obtener números de teléfono del WABA
    const phonesRes = await fetch(
      `${GRAPH}/${wabaId}/phone_numbers` +
        `?fields=id,display_phone_number,verified_name,status` +
        `&access_token=${userAccessToken}`
    );
    const phonesData = await phonesRes.json();

    if (phonesData.error || !phonesData.data?.length) {
      console.error("Phone numbers error:", phonesData.error);
      return NextResponse.json(
        { error: "No se encontraron números de teléfono en el WABA autorizado." },
        { status: 400 }
      );
    }

    const phone = phonesData.data[0];
    const phoneNumberId: string = phone.id;
    // Guardar solo dígitos para consistencia con el formato existente
    const displayPhone: string = (phone.display_phone_number as string).replace(/\D/g, "");

    // 4. Guardar en Supabase (upsert por phone_number_id)
    const { error: dbError } = await admin.from("whatsapp_accounts").upsert(
      {
        business_id: businessId,
        phone_number_id: phoneNumberId,
        display_phone: displayPhone,
        access_token: userAccessToken,
        waba_id: wabaId,
        is_active: true,
      },
      { onConflict: "phone_number_id" }
    );

    if (dbError) {
      console.error("DB upsert error:", dbError);
      // Si falla por columna waba_id inexistente, reintentar sin ella
      if (dbError.message?.includes("waba_id")) {
        const { error: dbError2 } = await admin.from("whatsapp_accounts").upsert(
          {
            business_id: businessId,
            phone_number_id: phoneNumberId,
            display_phone: displayPhone,
            access_token: userAccessToken,
            is_active: true,
          },
          { onConflict: "phone_number_id" }
        );
        if (dbError2) {
          return NextResponse.json({ error: "Error al guardar en base de datos" }, { status: 500 });
        }
      } else {
        return NextResponse.json({ error: "Error al guardar en base de datos" }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, wabaId, phoneNumberId, displayPhone });
  } catch (err: any) {
    console.error("Embedded signup error:", err);
    return NextResponse.json({ error: err.message || "Error interno" }, { status: 500 });
  }
}

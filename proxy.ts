import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "./lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Obtener sesión actualizada
  const response = await updateSession(request);

  // Leer cookie de sesión para saber si hay usuario autenticado
  // Supabase SSR guarda el token en sb-*-auth-token
  const hasSession = request.cookies.getAll().some(
    (c) => c.name.includes("-auth-token") && c.value.length > 0
  );

  // ── Rutas protegidas ──────────────────────────────────────────────
  if (!hasSession && pathname.startsWith("/dashboard")) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ── Redirigir si ya está autenticado ─────────────────────────────
  if (hasSession && (pathname === "/login" || pathname === "/")) {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api/webhook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("No autorizado", { status: 401 });

  const { data: businessUser } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!businessUser?.business_id) return new NextResponse("Sin negocio", { status: 403 });

  const isAdmin = (businessUser.role || "").toLowerCase() === "admin";
  const url = new URL(req.url);
  const estadoFiltro = (url.searchParams.get("estado") || "").toLowerCase().trim();

  let query = supabase
    .from("contactos")
    .select("whatsapp, nombre, estado, necesidad, ultimo_tema, resumen, sitio_web, tipo_negocio, presupuesto, datos_extra, veces_contacto, ultima_respuesta, created_at, assigned_user_id")
    .eq("business_id", businessUser.business_id)
    .order("ultima_respuesta", { ascending: false });

  if (!isAdmin) query = query.eq("assigned_user_id", user.id);
  if (estadoFiltro) query = query.eq("estado", estadoFiltro);

  const { data: leads } = await query;

  if (!leads || leads.length === 0) {
    return new NextResponse("Sin leads para exportar", { status: 404 });
  }

  const { data: sellers } = await supabase
    .from("business_users")
    .select("user_id, email")
    .eq("business_id", businessUser.business_id);

  const sellerMap = Object.fromEntries((sellers || []).map(s => [s.user_id, s.email]));

  const headers = [
    "WhatsApp", "Nombre", "Estado", "Necesidad", "Último tema",
    "Tipo de negocio", "Sitio web", "Presupuesto", "Datos extra",
    "Resumen IA", "Veces contacto", "Asignado a", "Última actividad", "Creado",
  ];

  const rows = leads.map((l) => [
    l.whatsapp || "",
    l.nombre || "",
    l.estado || "",
    l.necesidad || "",
    l.ultimo_tema || "",
    l.tipo_negocio || "",
    l.sitio_web || "",
    l.presupuesto || "",
    l.datos_extra || "",
    l.resumen || "",
    l.veces_contacto || 0,
    sellerMap[l.assigned_user_id] || "Sin asignar",
    l.ultima_respuesta ? new Date(l.ultima_respuesta).toLocaleString("es-MX") : "",
    l.created_at ? new Date(l.created_at).toLocaleString("es-MX") : "",
  ]);

  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    .join("\n");

  const filename = `leads${estadoFiltro ? `-${estadoFiltro}` : ""}-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse("\uFEFF" + csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
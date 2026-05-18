import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { Users, Trash2, UserPlus, Phone } from "lucide-react";

const MAX_SELLERS = 5;

async function addSeller(formData: FormData) {
  "use server";
  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Verificar sesión con el cliente de usuario
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) redirect("/mi-negocio/equipo?error=no_session");

  // Usar admin client para evitar problemas de RLS
  const { data: bu } = await admin
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!bu?.business_id || bu.role !== "admin") redirect("/mi-negocio/equipo?error=sin_permiso");

  const businessId = bu.business_id;
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const password = String(formData.get("password") || "").trim();
  const whatsapp = String(formData.get("whatsapp") || "").trim() || null;

  if (!email || !password) redirect("/mi-negocio/equipo?error=campos_requeridos");
  if (password.length < 6) redirect("/mi-negocio/equipo?error=password_corta");

  // Verificar límite de 5 vendedores
  const { count } = await admin
    .from("business_users")
    .select("id", { count: "exact", head: true })
    .eq("business_id", businessId)
    .eq("role", "seller");

  if ((count ?? 0) >= MAX_SELLERS) redirect("/mi-negocio/equipo?error=limite_alcanzado");

  let userId: string | null = null;

  const { data: authUser, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (createError) {
    if (createError.message?.toLowerCase().includes("already")) {
      const { data: listData } = await admin.auth.admin.listUsers();
      const existing = listData?.users?.find((u) => u.email === email);
      if (existing) {
        userId = existing.id;
        await admin.auth.admin.updateUserById(userId, { password });
      } else {
        redirect("/mi-negocio/equipo?error=usuario_no_encontrado");
      }
    } else {
      const msg = encodeURIComponent(createError.message);
      redirect(`/mi-negocio/equipo?error=${msg}`);
    }
  } else {
    userId = authUser?.user?.id ?? null;
  }

  if (!userId) redirect("/mi-negocio/equipo?error=sin_user_id");

  const { data: existing } = await admin
    .from("business_users")
    .select("id")
    .eq("business_id", businessId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    await admin.from("business_users").insert({
      business_id: businessId,
      user_id: userId,
      role: "seller",
      email,
      whatsapp,
    });
  }

  redirect("/mi-negocio/equipo?ok=1");
}

async function removeSeller(formData: FormData) {
  "use server";
  const supabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const supabaseUser = await createClient();
  const { data: { user } } = await supabaseUser.auth.getUser();
  if (!user) return;

  const { data: bu } = await supabaseUser
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!bu?.business_id || bu.role !== "admin") return;

  const businessUserId = String(formData.get("businessUserId") || "");
  if (!businessUserId) return;

  await supabase
    .from("business_users")
    .delete()
    .eq("id", businessUserId)
    .eq("business_id", bu.business_id)
    .eq("role", "seller");

  revalidatePath("/mi-negocio/equipo");
}

export default async function EquipoPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; ok?: string }>;
}) {
  const { error, ok } = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: businessUser } = await supabase
    .from("business_users")
    .select("business_id, role")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!businessUser?.business_id) redirect("/dashboard");
  if ((businessUser.role || "").toLowerCase() !== "admin") redirect("/dashboard");

  const businessId = businessUser.business_id;

  const ERROR_MESSAGES: Record<string, string> = {
    no_session: "Tu sesión expiró. Vuelve a iniciar sesión.",
    sin_permiso: "No tienes permiso para agregar vendedores.",
    campos_requeridos: "El correo y la contraseña son obligatorios.",
    password_corta: "La contraseña debe tener al menos 6 caracteres.",
    limite_alcanzado: `Alcanzaste el límite de ${MAX_SELLERS} vendedores.`,
    usuario_no_encontrado: "No se pudo encontrar o crear el usuario.",
    sin_user_id: "Error interno al crear el usuario. Intenta de nuevo.",
  };
  const errorMsg = error ? (ERROR_MESSAGES[error] ?? decodeURIComponent(error)) : null;

  const admin = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: sellers } = await admin
    .from("business_users")
    .select("id, email, whatsapp, created_at")
    .eq("business_id", businessId)
    .eq("role", "seller")
    .order("created_at", { ascending: true });

  const sellerList = sellers || [];
  const canAddMore = sellerList.length < MAX_SELLERS;

  return (
    <div className="space-y-5 pb-10">

      {ok && (
        <div className="rounded-2xl bg-emerald-50 border border-emerald-200 px-5 py-3 text-sm font-medium text-emerald-700">
          ✓ Vendedor agregado correctamente. Ya puede iniciar sesión.
        </div>
      )}
      {errorMsg && (
        <div className="rounded-2xl bg-rose-50 border border-rose-200 px-5 py-3 text-sm font-medium text-rose-700">
          ⚠ {errorMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-800 text-sm">Vendedores</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {sellerList.length} de {MAX_SELLERS} vendedores agregados
          </p>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: MAX_SELLERS }).map((_, i) => (
            <div
              key={i}
              className={`w-2.5 h-2.5 rounded-full ${i < sellerList.length ? "bg-violet-500" : "bg-slate-200"}`}
            />
          ))}
        </div>
      </div>

      {/* Lista de vendedores */}
      {sellerList.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 p-8 text-center">
          <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-slate-500">Sin vendedores aún</p>
          <p className="text-xs text-slate-400 mt-1">Agrega hasta {MAX_SELLERS} vendedores para tu equipo</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sellerList.map((seller) => (
            <div
              key={seller.id}
              className="bg-white border border-slate-200 rounded-2xl px-5 py-4 flex items-center justify-between gap-4 shadow-sm"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center text-sm font-bold shrink-0">
                  {(seller.email || "?")[0].toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-800 truncate">{seller.email}</p>
                  {seller.whatsapp && (
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      {seller.whatsapp}
                    </p>
                  )}
                </div>
              </div>
              <form action={removeSeller}>
                <input type="hidden" name="businessUserId" value={seller.id} />
                <button
                  type="submit"
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  title="Eliminar vendedor"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}

      {/* Formulario agregar */}
      {canAddMore ? (
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
            <UserPlus className="w-4 h-4 text-violet-600" />
            <h3 className="text-sm font-semibold text-slate-800">Agregar vendedor</h3>
          </div>
          <form action={addSeller} className="px-5 py-4 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Correo electrónico <span className="text-rose-400">*</span>
              </label>
              <input
                name="email"
                type="email"
                required
                placeholder="vendedor@ejemplo.com"
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-slate-400 bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                Contraseña temporal <span className="text-rose-400">*</span>
              </label>
              <input
                name="password"
                type="text"
                required
                placeholder="Mínimo 6 caracteres"
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-slate-400 bg-white"
              />
              <p className="text-xs text-slate-400 mt-1">El vendedor puede cambiarla después desde su perfil.</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1.5">
                WhatsApp (opcional)
              </label>
              <input
                name="whatsapp"
                type="tel"
                placeholder="528181234567"
                className="w-full text-sm border border-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-violet-300 placeholder:text-slate-400 bg-white"
              />
              <p className="text-xs text-slate-400 mt-1">Para notificarle cuando le asignen un lead.</p>
            </div>
            <button
              type="submit"
              className="w-full py-2.5 bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] hover:opacity-90 text-white font-semibold text-sm rounded-xl transition shadow-sm"
            >
              Agregar vendedor
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 text-sm text-amber-700">
          Alcanzaste el límite de {MAX_SELLERS} vendedores. Elimina uno para poder agregar otro.
        </div>
      )}
    </div>
  );
}

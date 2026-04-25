import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  ExternalLink,
  Camera,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  Mail,
} from "lucide-react";

export default async function WhatsAppGuiaPage() {
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

  return (
    <div className="space-y-6 pb-10">

      {/* Intro */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-emerald-800 mb-1">
              Configuración manual de WhatsApp Business API
            </p>
            <p className="text-sm text-emerald-700">
              Sigue estos pasos para conectar tu número de WhatsApp Business con Prospekto.
              El proceso toma entre 20 y 40 minutos. Al terminar, envíanos los datos y
              nosotros activamos el bot por ti.
            </p>
          </div>
        </div>
      </div>

      {/* PASO 1 */}
      <Step numero={1} titulo="Crea tu cuenta de Meta Business Manager">
        <p className="text-sm text-slate-600 mb-4">
          Meta Business Manager es el panel donde administras tu empresa, apps y cuentas
          de WhatsApp. Si ya tienes uno, salta al siguiente paso.
        </p>
        <ol className="text-sm text-slate-700 space-y-2 mb-5 list-decimal pl-5">
          <li>
            Ve a{" "}
            <A href="https://business.facebook.com">business.facebook.com</A>
          </li>
          <li>Haz clic en <strong>Crear cuenta</strong></li>
          <li>Ingresa el nombre de tu empresa, tu nombre y correo</li>
          <li>Confirma tu correo cuando te llegue el mensaje de Meta</li>
        </ol>
        <Screenshot label="Pantalla de inicio de Meta Business Manager" />
      </Step>

      {/* PASO 2 */}
      <Step numero={2} titulo="Crea una App en Meta for Developers">
        <p className="text-sm text-slate-600 mb-4">
          Necesitas una "App" de Meta para poder usar la API de WhatsApp Business.
        </p>
        <ol className="text-sm text-slate-700 space-y-2 mb-5 list-decimal pl-5">
          <li>
            Ve a{" "}
            <A href="https://developers.facebook.com/apps">developers.facebook.com/apps</A>
          </li>
          <li>Haz clic en <strong>Crear app</strong></li>
          <li>
            Selecciona el tipo <strong>"Empresa"</strong> (Business)
          </li>
          <li>Escribe el nombre de tu app — puede ser el nombre de tu negocio</li>
          <li>
            En <em>Cuenta de Business Manager</em>, selecciona la cuenta que acabas de
            crear
          </li>
          <li>Haz clic en <strong>Crear app</strong></li>
        </ol>
        <Screenshot label="Formulario de creación de app en Meta for Developers" />
      </Step>

      {/* PASO 3 */}
      <Step numero={3} titulo="Agrega el producto WhatsApp a tu app">
        <p className="text-sm text-slate-600 mb-4">
          Dentro de tu app, necesitas habilitar el producto de WhatsApp Business Platform.
        </p>
        <ol className="text-sm text-slate-700 space-y-2 mb-5 list-decimal pl-5">
          <li>En el panel de tu app, busca la sección <strong>Agregar productos</strong></li>
          <li>Busca <strong>WhatsApp</strong> y haz clic en <strong>Configurar</strong></li>
          <li>
            Se creará automáticamente una Cuenta de WhatsApp Business (WABA) vinculada a
            tu Business Manager
          </li>
          <li>Acepta los términos de servicio de WhatsApp Business Platform</li>
        </ol>
        <Screenshot label="Panel de productos — seleccionar WhatsApp" />
        <Screenshot label="Términos de servicio de WhatsApp Business Platform" />
      </Step>

      {/* PASO 4 */}
      <Step numero={4} titulo="Agrega y verifica tu número de teléfono">
        <p className="text-sm text-slate-600 mb-4">
          El número que uses <strong>no puede estar activo en WhatsApp personal o
          WhatsApp Business app</strong> al mismo tiempo. Si lo está, primero elimínalo
          desde la app.
        </p>
        <ol className="text-sm text-slate-700 space-y-2 mb-5 list-decimal pl-5">
          <li>
            En el menú de tu app, ve a <strong>WhatsApp &rsaquo; Configuración</strong>
          </li>
          <li>Haz clic en <strong>Agregar número de teléfono</strong></li>
          <li>Escribe el nombre de perfil y categoría de tu negocio</li>
          <li>
            Ingresa tu número de teléfono (incluye código de país, ej:{" "}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">+52 818 123 4567</code>
            )
          </li>
          <li>
            Meta te enviará un código de verificación por SMS o llamada — ingrésalo para
            confirmar
          </li>
        </ol>
        <Nota>
          Si tu número ya está en WhatsApp Business app, debes ir a{" "}
          <strong>Configuración &rsaquo; Cuenta &rsaquo; Eliminar mi cuenta</strong>{" "}
          desde la app antes de continuar.
        </Nota>
        <Screenshot label="Formulario para agregar número de teléfono" />
        <Screenshot label="Pantalla de verificación con código SMS" />
      </Step>

      {/* PASO 5 */}
      <Step numero={5} titulo="Crea un Usuario del Sistema para el token permanente">
        <p className="text-sm text-slate-600 mb-4">
          El token temporal que te da Meta expira en 24 horas. Para el bot necesitamos un
          <strong> token permanente</strong>. Para eso se crea un "Usuario del Sistema".
        </p>
        <ol className="text-sm text-slate-700 space-y-2 mb-5 list-decimal pl-5">
          <li>
            Ve a{" "}
            <A href="https://business.facebook.com/settings/system-users">
              Meta Business Manager &rsaquo; Configuración &rsaquo; Usuarios del sistema
            </A>
          </li>
          <li>Haz clic en <strong>Agregar</strong></li>
          <li>
            Dale un nombre (ej: <em>Prospekto Bot</em>) y rol <strong>Administrador</strong>
          </li>
          <li>Haz clic en <strong>Crear usuario del sistema</strong></li>
          <li>
            Luego clic en <strong>Agregar activos</strong> &rarr; selecciona{" "}
            <strong>Apps</strong> &rarr; elige tu app &rarr; activa{" "}
            <strong>Control total</strong>
          </li>
          <li>
            También agrega la <strong>Cuenta de WhatsApp Business</strong> con{" "}
            <strong>Control total</strong>
          </li>
          <li>
            Haz clic en <strong>Generar token</strong>, selecciona tu app y activa los
            permisos:
            <ul className="list-disc pl-5 mt-1 space-y-1">
              <li>
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                  whatsapp_business_messaging
                </code>
              </li>
              <li>
                <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
                  whatsapp_business_management
                </code>
              </li>
            </ul>
          </li>
          <li>
            Copia el token generado — <strong>solo aparece una vez</strong>, guárdalo de
            inmediato
          </li>
        </ol>
        <Screenshot label="Panel de Usuarios del Sistema en Meta Business Manager" />
        <Screenshot label="Pantalla de Generar Token — permisos seleccionados" />
      </Step>

      {/* PASO 6 */}
      <Step numero={6} titulo="Obtén el Phone Number ID">
        <p className="text-sm text-slate-600 mb-4">
          El Phone Number ID identifica tu número dentro de la API. Lo encontrarás aquí:
        </p>
        <ol className="text-sm text-slate-700 space-y-2 mb-5 list-decimal pl-5">
          <li>
            En el panel de tu app ve a <strong>WhatsApp &rsaquo; Primeros pasos</strong>{" "}
            (o <em>Getting started</em>)
          </li>
          <li>
            Verás el campo <strong>Phone Number ID</strong> — es un número largo, ej:{" "}
            <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">
              101474725172793
            </code>
          </li>
          <li>Cópialo</li>
        </ol>
        <Screenshot label="Pantalla 'Primeros pasos' mostrando el Phone Number ID" />
      </Step>

      {/* PASO 7 */}
      <Step numero={7} titulo="Envíanos los datos para activar el bot" highlight>
        <p className="text-sm text-slate-600 mb-4">
          Con los datos de los pasos anteriores, escríbenos para que activemos el bot.
          Necesitamos exactamente esto:
        </p>
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 mb-5">
          <DatoItem label="Phone Number ID" ejemplo="101474725172793" />
          <DatoItem label="Access Token permanente" ejemplo="EAABsbCS..." />
          <DatoItem
            label="Número de teléfono"
            ejemplo="+52 818 123 4567"
          />
        </div>
        <a
          href="mailto:hola@prospekto.mx?subject=Activar%20bot%20WhatsApp&body=Hola%2C%20quiero%20activar%20el%20bot%20de%20WhatsApp.%0A%0APhone%20Number%20ID%3A%20%0AAccess%20Token%3A%20%0ANúmero%20de%20teléfono%3A%20"
          className="inline-flex items-center gap-2 px-5 py-3 bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition shadow-lg"
        >
          <Mail className="w-4 h-4" />
          Enviar datos por correo
        </a>
        <p className="text-xs text-slate-400 mt-3">
          También puedes enviarnos los datos por WhatsApp o por el medio que prefieras.
          Una vez que los recibamos, activamos el bot en menos de 24 horas.
        </p>
      </Step>

      {/* Resumen */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <h3 className="font-semibold text-slate-800 mb-3 text-sm">Resumen de pasos</h3>
        <div className="space-y-2">
          {[
            "Crear cuenta de Meta Business Manager",
            "Crear una App en Meta for Developers",
            "Agregar el producto WhatsApp a tu app",
            "Agregar y verificar tu número de teléfono",
            "Crear un Usuario del Sistema y generar token permanente",
            "Obtener el Phone Number ID",
            "Enviar los datos a Prospekto para activar el bot",
          ].map((texto, i) => (
            <div key={i} className="flex items-center gap-3 text-sm text-slate-700">
              <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center shrink-0">
                {i + 1}
              </span>
              {texto}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-componentes ─── */

function Step({
  numero,
  titulo,
  children,
  highlight,
}: {
  numero: number;
  titulo: string;
  children: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border shadow-sm p-5 space-y-0 ${
        highlight
          ? "bg-purple-50 border-purple-200"
          : "bg-white border-slate-200"
      }`}
    >
      <div className="flex items-center gap-3 mb-4">
        <span
          className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold shrink-0 ${
            highlight
              ? "bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] text-white"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {numero}
        </span>
        <h2 className={`font-semibold text-base ${highlight ? "text-purple-900" : "text-slate-800"}`}>
          {titulo}
        </h2>
      </div>
      {children}
    </div>
  );
}

function Screenshot({ label }: { label: string }) {
  return (
    <div className="mt-4 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 p-6 flex flex-col items-center justify-center gap-2 text-center">
      <Camera className="w-6 h-6 text-slate-300" />
      <p className="text-xs font-medium text-slate-400">{label}</p>
      <p className="text-[11px] text-slate-300">Captura de pantalla pendiente</p>
    </div>
  );
}

function Nota({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-4">
      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-700">{children}</p>
    </div>
  );
}

function A({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1 text-purple-600 hover:text-purple-800 font-medium underline underline-offset-2"
    >
      {children}
      <ExternalLink className="w-3 h-3" />
    </a>
  );
}

function DatoItem({ label, ejemplo }: { label: string; ejemplo: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">{label}</span>
      <code className="text-xs text-slate-500 bg-white border border-slate-200 px-2 py-1 rounded-lg">
        {ejemplo}
      </code>
    </div>
  );
}

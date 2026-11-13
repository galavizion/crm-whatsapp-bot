"use client";

import { useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Check, Copy, Eye, EyeOff, ShoppingCart, Radio, Store } from "lucide-react";
import { conectarWoo, regenerarWoo, regenerarTokenLola } from "@/app/mi-negocio/integraciones/actions";

const PUBLIC_URL = "https://www.prospekto.com.mx";

type Woo = { token: string; secret: string; ultimaOrdenAt: string | null } | null;
type Lola = {
  token: string;
  plan: string;
  venceAt: string;
  activo: boolean;
  ultimoContacto: string | null;
} | null;

function hace(iso: string | null): string {
  if (!iso) return "nunca";
  const s = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return `hace ${s} s`;
  if (s < 3600) return `hace ${Math.floor(s / 60)} min`;
  if (s < 86400) return `hace ${Math.floor(s / 3600)} h`;
  return `hace ${Math.floor(s / 86400)} d`;
}

function Campo({ label, value, secreto = false }: { label: string; value: string; secreto?: boolean }) {
  const [visible, setVisible] = useState(!secreto);
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(value);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sin permiso de portapapeles */
    }
  }

  return (
    <div className="space-y-1">
      <label className="text-xs font-medium text-slate-600">{label}</label>
      <div className="flex items-center gap-2">
        <input
          readOnly
          value={visible ? value : "•".repeat(24)}
          className="flex-1 min-w-0 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono bg-slate-50 text-slate-700"
        />
        {secreto && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
            aria-label={visible ? "Ocultar" : "Mostrar"}
          >
            {visible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
        <button
          type="button"
          onClick={copiar}
          className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
          aria-label="Copiar"
        >
          {copiado ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
}

function Tarjeta({
  icono,
  titulo,
  children,
}: {
  icono: React.ReactNode;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center gap-2">
        <span className="text-slate-500">{icono}</span>
        <span className="text-sm font-semibold text-slate-700">{titulo}</span>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

export default function Integraciones({ woo, lola }: { woo: Woo; lola: Lola }) {
  const [pendiente, startTransition] = useTransition();
  const [verQr, setVerQr] = useState(false);
  const [mensaje, setMensaje] = useState<{ ok: boolean; texto: string } | null>(null);

  function ejecutar(accion: () => Promise<{ ok: boolean; message: string }>, confirmar?: string) {
    if (confirmar && !window.confirm(confirmar)) return;
    startTransition(async () => {
      const r = await accion();
      setMensaje({ ok: r.ok, texto: r.message });
    });
  }

  const venceMs = lola ? new Date(lola.venceAt).getTime() - Date.now() : 0;
  const lolaVigente = !!lola && lola.activo && venceMs > 0;
  const diasRestantes = Math.max(0, Math.ceil(venceMs / 86_400_000));

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Integraciones</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Conecta tu tienda en línea y tu dispositivo Lola para recibir avisos de ventas, carritos y leads.
        </p>
      </div>

      {mensaje && (
        <div
          className={`text-xs rounded-xl px-4 py-2.5 border ${
            mensaje.ok
              ? "bg-emerald-50 border-emerald-200 text-emerald-700"
              : "bg-red-50 border-red-200 text-red-700"
          }`}
        >
          {mensaje.texto}
        </div>
      )}

      {/* WooCommerce */}
      <Tarjeta icono={<ShoppingCart className="w-4 h-4" />} titulo="WooCommerce">
        {!woo ? (
          <>
            <p className="text-xs text-slate-500">
              Conecta tu tienda WooCommerce para registrar ventas y detectar carritos abandonados.
            </p>
            <button
              type="button"
              disabled={pendiente}
              onClick={() => ejecutar(conectarWoo)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] disabled:opacity-50"
            >
              {pendiente ? "Conectando…" : "Conectar mi tienda"}
            </button>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-600">
              {woo.ultimaOrdenAt ? (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1.5" />
                  Última orden recibida: <strong>{hace(woo.ultimaOrdenAt)}</strong>
                </>
              ) : (
                <>
                  <span className="inline-block w-2 h-2 rounded-full bg-amber-400 mr-1.5" />
                  Aún no hemos recibido ninguna orden. Revisa que los webhooks estén creados.
                </>
              )}
            </p>

            <Campo label="URL de entrega" value={`${PUBLIC_URL}/api/woocommerce/${woo.token}`} />
            <Campo label="Secreto" value={woo.secret} secreto />

            <ol className="text-xs text-slate-600 list-decimal pl-5 space-y-1">
              <li>En WordPress ve a <strong>WooCommerce → Ajustes → Avanzado → Webhooks</strong>.</li>
              <li>Crea un webhook con tema <strong>Pedido creado</strong>, estado Activo, y pega la URL y el secreto.</li>
              <li>Crea otro igual con tema <strong>Pedido actualizado</strong> (avisa cuando un pedido pendiente se paga).</li>
            </ol>

            <button
              type="button"
              disabled={pendiente}
              onClick={() =>
                ejecutar(
                  regenerarWoo,
                  "Esto invalida la URL y el secreto actuales. Tendrás que actualizar tus webhooks en WooCommerce. ¿Continuar?"
                )
              }
              className="text-xs text-slate-500 underline hover:text-slate-800 disabled:opacity-50"
            >
              Regenerar credenciales
            </button>
          </>
        )}
      </Tarjeta>

      {/* Lola */}
      <Tarjeta icono={<Radio className="w-4 h-4" />} titulo="Lola">
        {!lola ? (
          <p className="text-xs text-slate-500">
            Lola no está activada en tu cuenta. Contáctanos para un demo gratuito o un plan semestral.
          </p>
        ) : (
          <>
            <p className="text-xs text-slate-600">
              <span
                className={`inline-block w-2 h-2 rounded-full mr-1.5 ${
                  lolaVigente ? "bg-emerald-500" : "bg-red-500"
                }`}
              />
              Plan <strong>{lola.plan === "demo" ? "Demo" : "Semestral"}</strong> ·{" "}
              {lolaVigente ? `vence en ${diasRestantes} días` : "vencido o inactivo"}
              <br />
              Última consulta de tu Lola: <strong>{hace(lola.ultimoContacto)}</strong>
            </p>
            <p className="text-xs text-slate-400">
              Lola consulta seguido en tu horario laboral y cada hora fuera de él. Puedes cambiar tu
              horario en Mi Negocio → Perfil.
            </p>
            <Campo label="Token de tu Lola" value={lola.token} secreto />
            <button
              type="button"
              onClick={() => setVerQr((v) => !v)}
              className="text-xs text-slate-500 underline hover:text-slate-800 mr-3"
            >
              {verQr ? "Ocultar QR" : "Mostrar QR del token"}
            </button>
            {verQr && (
              <div className="bg-white p-3 inline-block rounded border border-slate-200">
                <QRCodeSVG
                  value={`http://192.168.4.1/set?token=${encodeURIComponent(lola.token)}`}
                  size={200}
                  marginSize={2}
                />
                <p className="text-[11px] text-slate-400 mt-1 max-w-50">
                  Primero conecta tu celular al WiFi <strong>Lola-Setup</strong>, luego escanea este QR con la
                  cámara. El token se guarda solo en tu Lola. Si no abre, copia el token de arriba y pégalo en
                  el formulario.
                </p>
              </div>
            )}
            <br />
            <button
              type="button"
              disabled={pendiente}
              onClick={() =>
                ejecutar(
                  regenerarTokenLola,
                  "Tu Lola dejará de funcionar hasta que le configures el token nuevo. ¿Continuar?"
                )
              }
              className="text-xs text-slate-500 underline hover:text-slate-800 disabled:opacity-50"
            >
              Regenerar token
            </button>
          </>
        )}
      </Tarjeta>

      {/* Shopify */}
      <Tarjeta icono={<Store className="w-4 h-4" />} titulo="Shopify">
        <p className="text-xs text-slate-500">Próximamente.</p>
      </Tarjeta>
    </div>
  );
}

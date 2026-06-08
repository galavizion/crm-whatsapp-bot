"use client";

import { useState } from "react";
import { Check, Copy, Globe, Code2 } from "lucide-react";

const API_BASE =
  typeof window !== "undefined"
    ? window.location.origin
    : process.env.NEXT_PUBLIC_APP_URL || "https://app.prospekto.ai";

export default function WidgetConfig({ businessId }: { businessId: string }) {
  const [color, setColor] = useState("#6C47FF");
  const [botName, setBotName] = useState("Asistente");
  const [welcome, setWelcome] = useState("Hola 👋 ¿En qué te puedo ayudar?");
  const [copied, setCopied] = useState(false);

  const embedCode = `<script
  src="${API_BASE}/widget.js"
  data-business-id="${businessId}"
  data-color="${color}"
  data-name="${botName}"
  data-welcome="${welcome}"
  defer
></script>`;

  async function copyCode() {
    await navigator.clipboard.writeText(embedCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Widget para tu sitio web</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Agrega el chat de tu bot en cualquier sitio web con una sola línea de código.
        </p>
      </div>

      {/* Personalización */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Personalizar widget</span>
        </div>
        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Nombre del asistente</label>
              <input
                type="text"
                value={botName}
                onChange={(e) => setBotName(e.target.value)}
                maxLength={40}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Color principal</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-10 h-9 rounded-lg border border-slate-200 cursor-pointer p-0.5"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  maxLength={7}
                  className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-violet-400"
                />
              </div>
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Mensaje de bienvenida</label>
            <input
              type="text"
              value={welcome}
              onChange={(e) => setWelcome(e.target.value)}
              maxLength={120}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-violet-400"
            />
          </div>
        </div>
      </div>

      {/* Código de instalación */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-slate-500" />
            <span className="text-sm font-semibold text-slate-700">Código de instalación</span>
          </div>
          <button
            onClick={copyCode}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg bg-violet-50 text-violet-700 hover:bg-violet-100 transition-colors"
          >
            {copied ? (
              <><Check className="w-3.5 h-3.5" /> Copiado</>
            ) : (
              <><Copy className="w-3.5 h-3.5" /> Copiar</>
            )}
          </button>
        </div>
        <div className="px-5 py-4">
          <pre className="bg-slate-900 text-emerald-400 text-xs rounded-xl p-4 overflow-x-auto leading-relaxed whitespace-pre-wrap break-all">
            {embedCode}
          </pre>
        </div>
      </div>

      {/* Instrucciones */}
      <div className="bg-violet-50 border border-violet-100 rounded-2xl px-5 py-4 text-xs text-violet-700 space-y-1">
        <p className="font-semibold">¿Cómo instalar?</p>
        <ol className="list-decimal list-inside space-y-0.5 text-violet-600">
          <li>Copia el código de arriba</li>
          <li>Pégalo antes del cierre del tag <code className="font-mono bg-violet-100 px-1 rounded">&lt;/body&gt;</code> de tu sitio</li>
          <li>¡Listo! El chat aparecerá en la esquina inferior derecha</li>
        </ol>
        <p className="text-violet-500 pt-1">
          Compatible con cualquier sitio web, WordPress, Wix, Shopify, o HTML puro.
        </p>
      </div>

      {/* Vista previa del botón */}
      <div className="bg-white border border-slate-200 rounded-2xl px-5 py-4 space-y-3">
        <p className="text-xs font-semibold text-slate-600">Vista previa del botón</p>
        <div className="relative bg-slate-100 rounded-xl h-24 overflow-hidden">
          <div className="absolute bottom-3 right-3">
            <button
              style={{ background: color }}
              className="w-12 h-12 rounded-full text-white flex items-center justify-center shadow-lg"
            >
              <svg viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                <path d="M20 2H4a2 2 0 0 0-2 2v18l4-4h14a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2z" />
              </svg>
            </button>
          </div>
          <p className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-xs text-slate-400">
            Tu sitio web
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle, Loader2, CheckCircle, XCircle } from "lucide-react";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface Props {
  businessId: string;
}

export default function ConnectWhatsAppButton({ businessId }: Props) {
  const router = useRouter();
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const initFB = () => {
      window.FB.init({
        appId: process.env.NEXT_PUBLIC_META_APP_ID!,
        autoLogAppEvents: true,
        xfbml: true,
        version: "v23.0",
      });
      setSdkReady(true);
    };

    if (window.FB) {
      initFB();
      return;
    }

    window.fbAsyncInit = initFB;

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/es_LA/sdk.js";
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }
  }, []);

  const handleConnect = () => {
    if (!sdkReady || loading) return;
    setLoading(true);
    setStatus("idle");
    setMessage("");

    window.FB.login(
      async (response: any) => {
        if (!response.authResponse?.code) {
          setLoading(false);
          setStatus("error");
          setMessage("El usuario canceló o no autorizó el proceso.");
          return;
        }

        try {
          const res = await fetch("/api/meta/embedded-signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ code: response.authResponse.code, businessId }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Error al conectar WhatsApp");

          setStatus("success");
          setMessage(`¡Conectado! Número: +${data.displayPhone}`);
          router.refresh();
        } catch (err: any) {
          setStatus("error");
          setMessage(err.message || "Error inesperado");
        } finally {
          setLoading(false);
        }
      },
      {
        config_id: process.env.NEXT_PUBLIC_META_CONFIG_ID!,
        response_type: "code",
        override_default_response_type: true,
        extras: {
          setup: {},
          featureType: "",
          sessionInfoVersion: "3",
        },
      }
    );
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleConnect}
        disabled={!sdkReady || loading}
        className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#25D366] hover:bg-[#1ebe5d] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition shadow-sm"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <MessageCircle className="w-4 h-4" />
        )}
        {loading ? "Conectando..." : sdkReady ? "Conectar WhatsApp Business" : "Cargando SDK..."}
      </button>

      {status === "success" && (
        <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-2.5">
          <CheckCircle className="w-4 h-4 shrink-0" />
          {message}
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-4 py-2.5">
          <XCircle className="w-4 h-4 shrink-0" />
          {message}
        </div>
      )}
    </div>
  );
}

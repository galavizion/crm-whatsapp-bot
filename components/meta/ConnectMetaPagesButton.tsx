"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

declare global {
  interface Window {
    FB: any;
    fbAsyncInit: () => void;
  }
}

interface Props {
  businessId: string;
}

export default function ConnectMetaPagesButton({ businessId }: Props) {
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

    if (window.FB) { initFB(); return; }

    window.fbAsyncInit = initFB;

    if (!document.getElementById("facebook-jssdk")) {
      const script = document.createElement("script");
      script.id = "facebook-jssdk";
      script.src = "https://connect.facebook.net/en_US/sdk.js";
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
        if (!response.authResponse?.accessToken) {
          setLoading(false);
          setStatus("error");
          setMessage("El usuario canceló o no autorizó el proceso.");
          return;
        }

        try {
          const res = await fetch("/api/meta/connect-pages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              accessToken: response.authResponse.accessToken,
              businessId,
            }),
          });

          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Error al conectar");

          const parts: string[] = [];
          if (data.pagesConnected > 0) parts.push(`${data.pagesConnected} página(s) de Facebook`);
          if (data.instagramConnected > 0) parts.push(`${data.instagramConnected} cuenta(s) de Instagram`);

          setStatus("success");
          setMessage(parts.length > 0 ? `¡Conectado! ${parts.join(" y ")}` : "Conectado correctamente");
          router.refresh();
        } catch (err: any) {
          setStatus("error");
          setMessage(err.message || "Error inesperado");
        } finally {
          setLoading(false);
        }
      },
      {
        scope: "pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement,instagram_basic,instagram_manage_messages,instagram_manage_comments,public_profile",
      }
    );
  };

  return (
    <div className="space-y-3">
      <button
        onClick={handleConnect}
        disabled={!sdkReady || loading}
        className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#1877F2] hover:bg-[#166fe5] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition shadow-sm"
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )}
        {loading ? "Conectando..." : sdkReady ? "Conectar con Facebook / Instagram" : "Cargando..."}
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

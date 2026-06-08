"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { onFBReady, initFBSDK } from "@/lib/fbSdk";

const SCOPES = {
  facebook: "pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement,public_profile",
  instagram: "instagram_basic,instagram_manage_messages,instagram_manage_comments,public_profile",
  both: "pages_show_list,pages_messaging,pages_manage_metadata,pages_read_engagement,instagram_basic,instagram_manage_messages,instagram_manage_comments,public_profile",
};

interface Props {
  businessId: string;
  platform?: "facebook" | "instagram" | "both";
}

export default function ConnectMetaPagesButton({ businessId, platform = "both" }: Props) {
  const router = useRouter();
  const [sdkReady, setSdkReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    onFBReady(() => setSdkReady(true));
    initFBSDK();
  }, []);

  const handleFBResponse = async (response: any) => {
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
  };

  const handleConnect = () => {
    if (!sdkReady || loading) return;
    setLoading(true);
    setStatus("idle");
    setMessage("");

    // Diagnóstico: reportar estado exacto del SDK al momento del clic
    console.log("[FB] window.FB:", typeof window.FB, window.FB ? "exists" : "missing");
    console.log("[FB] window.__fbReady:", window.__fbReady);
    console.log("[FB] FB.init type:", window.FB ? typeof window.FB.init : "n/a");
    console.log("[FB] FB.login type:", window.FB ? typeof window.FB.login : "n/a");

    window.FB.login(
      (response: any) => { handleFBResponse(response); },
      { scope: SCOPES[platform] }
    );
  };

  const isFacebook = platform === "facebook";
  const isInstagram = platform === "instagram";

  const btnColor = isInstagram
    ? "bg-gradient-to-r from-purple-500 via-pink-500 to-orange-400 hover:opacity-90"
    : "bg-[#1877F2] hover:bg-[#166fe5]";

  const btnLabel = isInstagram
    ? "Conectar Instagram"
    : isFacebook
    ? "Conectar Facebook"
    : "Conectar con Facebook / Instagram";

  return (
    <div className="space-y-3">
      <button
        onClick={handleConnect}
        disabled={!sdkReady || loading}
        className={`inline-flex items-center gap-2.5 px-5 py-2.5 ${btnColor} disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-xl transition shadow-sm`}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : isInstagram ? (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
        )}
        {loading ? "Conectando..." : sdkReady ? btnLabel : "Cargando..."}
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

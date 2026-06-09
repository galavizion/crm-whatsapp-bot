"use client";

import { useState } from "react";
import { Loader2, LogOut } from "lucide-react";
import { disconnectFacebook } from "@/app/mi-negocio/facebook/actions";

export default function DisconnectFacebookButton() {
  const [loading, setLoading] = useState(false);

  const handleDisconnect = async () => {
    if (!confirm("¿Desconectar Facebook? Esto eliminará la vinculación de tu página.")) return;
    setLoading(true);

    // Revocar permisos y cerrar sesión en el SDK de Facebook (best effort)
    try {
      if (typeof window !== "undefined" && window.FB) {
        await new Promise<void>((resolve) => {
          window.FB.api("/me/permissions", "DELETE", () => resolve());
        });
        await new Promise<void>((resolve) => {
          window.FB.logout(() => resolve());
        });
      }
    } catch {
      // Si falla en FB, igual limpiamos Supabase
    }

    await disconnectFacebook();
  };

  return (
    <button
      onClick={handleDisconnect}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
      {loading ? "Desconectando..." : "Desconectar"}
    </button>
  );
}

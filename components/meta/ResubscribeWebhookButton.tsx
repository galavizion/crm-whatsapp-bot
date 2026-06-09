"use client";

import { useState } from "react";
import { Loader2, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { resubscribeWebhook } from "@/app/mi-negocio/facebook/actions";

export default function ResubscribeWebhookButton() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  const handle = async () => {
    setLoading(true);
    setResult(null);
    const res = await resubscribeWebhook();
    setResult(res);
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <button
        onClick={handle}
        disabled={loading}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-xl transition disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
        {loading ? "Reparando..." : "Reparar webhook"}
      </button>

      {result && (
        <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border ${result.ok ? "text-emerald-700 bg-emerald-50 border-emerald-200" : "text-rose-700 bg-rose-50 border-rose-200"}`}>
          {result.ok ? <CheckCircle className="w-3.5 h-3.5 shrink-0" /> : <XCircle className="w-3.5 h-3.5 shrink-0" />}
          {result.message}
        </div>
      )}
    </div>
  );
}

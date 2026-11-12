"use client";

import { useState, useTransition } from "react";
import { ShieldCheck, ShieldAlert, Loader2 } from "lucide-react";
import { checkTokenStatus } from "@/app/god/negocios/actions";

export default function CheckConnectionButton({
  table,
  id,
}: {
  table: "social_accounts" | "whatsapp_accounts";
  id: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);
  const [ok, setOk] = useState(true);

  const handleCheck = () => {
    startTransition(async () => {
      const res = await checkTokenStatus(table, id);
      if (!res.ok) {
        setOk(false);
        setResult(res.error);
        return;
      }
      if (!res.isValid) {
        setOk(false);
        setResult("Token inválido o revocado");
        return;
      }
      setOk(true);
      setResult(
        res.expiresAt
          ? `Válido, expira ${new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(res.expiresAt))}`
          : "Válido, no expira"
      );
    });
  };

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={handleCheck}
        disabled={isPending}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition disabled:opacity-50"
      >
        {isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
        Verificar conexión
      </button>
      {result && (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${ok ? "text-emerald-600" : "text-rose-600"}`}>
          {ok ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
          {result}
        </span>
      )}
    </div>
  );
}

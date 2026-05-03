"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const ESTADOS = [
  { key: "interesado", label: "Interesado", cls: "bg-blue-100 text-blue-800 border-blue-200" },
  { key: "contactar",  label: "Llamar",     cls: "bg-amber-100 text-amber-800 border-amber-200" },
  { key: "contactado", label: "Contactado", cls: "bg-violet-100 text-violet-800 border-violet-200" },
  { key: "cliente",    label: "Cliente",    cls: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { key: "perdido",    label: "Perdido",    cls: "bg-rose-100 text-rose-800 border-rose-200" },
];

function getConfig(key: string) {
  return ESTADOS.find((e) => e.key === key) ?? { key, label: key, cls: "bg-neutral-100 text-neutral-700 border-neutral-200" };
}

export default function StatusDropdown({ id, current }: { id: string; current: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selected, setSelected] = useState(current);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const config = getConfig(selected);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    const prev = selected;
    setSelected(next);
    setSaved("saving");

    startTransition(async () => {
      try {
        const res = await fetch("/api/leads/update-status", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, estado: next }),
        });
        const data = await res.json();
        if (!res.ok) {
          setSelected(prev);
          setSaved("error");
          alert(data.error || "No se pudo actualizar el estado");
          return;
        }
        setSaved("saved");
        router.refresh();
        setTimeout(() => setSaved("idle"), 1400);
      } catch {
        setSelected(prev);
        setSaved("error");
        alert("Error inesperado al actualizar estado");
      }
    });
  };

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <select
          value={selected}
          onChange={handleChange}
          disabled={isPending}
          className={`appearance-none cursor-pointer rounded-full border py-1 pl-3 pr-6 text-xs font-semibold transition focus:outline-none focus:ring-2 focus:ring-[#9c4f93] disabled:opacity-60 ${config.cls}`}
        >
          {ESTADOS.map((e) => (
            <option key={e.key} value={e.key}>{e.label}</option>
          ))}
        </select>
        <svg
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2"
          width="10" height="10" viewBox="0 0 10 10" fill="none"
        >
          <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <span className="text-xs font-semibold">
        {saved === "saving" && <span className="animate-pulse text-[#9c4f93]">Guardando…</span>}
        {saved === "saved" && <span className="text-green-600">Guardado</span>}
        {saved === "error" && <span className="text-red-500">Error</span>}
      </span>
    </div>
  );
}

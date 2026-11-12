"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { eliminarLead } from "@/app/leads/actions";

// Solo se renderiza para god (el padre decide); la acción lo vuelve a validar.
export default function DeleteLeadButton({ id, nombre }: { id: string; nombre: string | null }) {
  const router = useRouter();
  const [pendiente, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pendiente}
      title="Eliminar lead y sus mensajes"
      onClick={() => {
        if (!confirm(`¿Eliminar a ${nombre || "este lead"} y todos sus mensajes? No se puede deshacer.`)) return;
        startTransition(async () => {
          await eliminarLead(id);
          router.refresh();
        });
      }}
      className="inline-flex items-center rounded-md p-1.5 text-neutral-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  );
}

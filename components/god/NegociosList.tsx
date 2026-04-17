"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Building2, Phone, Users, Calendar, Edit, Pause, Play, Trash2 } from "lucide-react";
import { activateBusiness } from "@/app/god/negocios/actions";
import SuspendModal from "./SuspendModal";
import DeleteModal from "./DeleteModal";

type NegocioItem = {
  id: string;
  name: string | null;
  slug: string | null;
  status: string | null;
  suspended_reason: string | null;
  suspended_at: string | null;
  created_at: string | null;
  displayPhone: string | null;
  leads: number;
  users: number;
};

function StatusBadge({ status }: { status: string | null }) {
  if (status === "active" || !status)
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">● Activo</span>;
  if (status === "suspended")
    return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">⏸ Suspendido</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">✕ Cancelado</span>;
}

function formatDate(d: string | null) {
  if (!d) return "—";
  try { return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium" }).format(new Date(d)); }
  catch { return "—"; }
}

function ActivateButton({ businessId }: { businessId: string }) {
  const [isPending, startTransition] = useTransition();
  return (
    <button
      onClick={() => startTransition(() => activateBusiness(businessId))}
      disabled={isPending}
      className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-semibold rounded-xl border border-emerald-200 transition disabled:opacity-50"
    >
      <Play className="w-3.5 h-3.5" />
      {isPending ? "Activando..." : "Activar"}
    </button>
  );
}

export default function NegociosList({ negocios }: { negocios: NegocioItem[] }) {
  const [suspendTarget, setSuspendTarget] = useState<NegocioItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<NegocioItem | null>(null);

  if (negocios.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
        No hay negocios aún. Crea el primero.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {negocios.map((b) => (
          <div key={b.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <div className="flex items-start gap-4 flex-wrap">
              {/* Icono */}
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Building2 className="w-5 h-5 text-indigo-500" />
              </div>

              {/* Info principal */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h2 className="font-semibold text-slate-800">{b.name || "Sin nombre"}</h2>
                  <StatusBadge status={b.status} />
                </div>

                {b.status === "suspended" && b.suspended_reason && (
                  <p className="text-xs text-amber-600 mb-1.5">
                    Razón: {b.suspended_reason}
                    {b.suspended_at && ` · ${formatDate(b.suspended_at)}`}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-xs text-slate-500 mt-1.5">
                  {b.displayPhone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {b.displayPhone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" /> {b.leads} leads
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {formatDate(b.created_at)}
                  </span>
                </div>
              </div>

              {/* Botones */}
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/god/negocios/${b.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Gestionar
                </Link>

                <Link
                  href={`/god/negocios/${b.id}/editar`}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl border border-indigo-200 transition"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Editar
                </Link>

                {(b.status === "active" || !b.status) ? (
                  <button
                    onClick={() => setSuspendTarget(b)}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-semibold rounded-xl border border-amber-200 transition"
                  >
                    <Pause className="w-3.5 h-3.5" />
                    Suspender
                  </button>
                ) : (
                  <ActivateButton businessId={b.id} />
                )}

                <button
                  onClick={() => setDeleteTarget(b)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {suspendTarget && (
        <SuspendModal
          businessId={suspendTarget.id}
          businessName={suspendTarget.name || ""}
          onClose={() => setSuspendTarget(null)}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          businessId={deleteTarget.id}
          businessName={deleteTarget.name || ""}
          leadsCount={deleteTarget.leads}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </>
  );
}

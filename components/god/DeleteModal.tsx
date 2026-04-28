"use client";

import { useState, useTransition } from "react";
import { deleteBusiness } from "@/app/god/negocios/actions";
import { Trash2, X, AlertTriangle } from "lucide-react";

interface Props {
  businessId: string;
  businessName: string;
  leadsCount: number;
  onClose: () => void;
}

export default function DeleteModal({ businessId, businessName, leadsCount, onClose }: Props) {
  const [confirm, setConfirm] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (confirm !== "ELIMINAR") return;
    startTransition(async () => {
      await deleteBusiness(businessId);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-rose-500" />
            <h2 className="font-semibold text-slate-800">Eliminar negocio</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex gap-3 p-4 bg-rose-50 border border-rose-200 rounded-xl">
            <AlertTriangle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <p className="text-sm text-rose-700 font-medium">
              Esta acción es permanente e irreversible. No hay forma de recuperar los datos.
            </p>
          </div>

          <div>
            <p className="text-sm text-slate-700 mb-2">Se eliminará permanentemente:</p>
            <ul className="space-y-1.5">
              {[
                `El negocio "${businessName}" y su configuración`,
                `${leadsCount} leads y sus datos`,
                "Todo el historial de conversaciones",
                "La cuenta de WhatsApp vinculada",
                "Todos los usuarios del negocio",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">
              Escribe <strong>ELIMINAR</strong> para confirmar
            </label>
            <input
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="ELIMINAR"
              className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-rose-300 placeholder:text-slate-400"
            />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={confirm !== "ELIMINAR" || isPending}
            className="flex-1 py-2.5 bg-rose-500 hover:bg-rose-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-sm font-semibold transition"
          >
            {isPending ? "Eliminando..." : "Eliminar definitivamente"}
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useTransition } from "react";
import { suspendBusiness } from "@/app/god/negocios/actions";
import { AlertTriangle, X } from "lucide-react";

const REASONS = [
  "Non-payment",
  "Client request",
  "Terms violation",
  "Other",
];

interface Props {
  businessId: string;
  businessName: string;
  onClose: () => void;
}

export default function SuspendModal({ businessId, businessName, onClose }: Props) {
  const [selected, setSelected] = useState(REASONS[0]);
  const [custom, setCustom] = useState("");
  const [isPending, startTransition] = useTransition();

  const reason = selected === "Other" ? custom : selected;

  function handleSubmit() {
    if (!reason.trim()) return;
    startTransition(async () => {
      await suspendBusiness(businessId, reason);
      onClose();
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-slate-800">Suspend business</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-slate-100 transition text-slate-400">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <p className="text-sm text-slate-600">
            You are about to suspend <strong>{businessName}</strong>. The bot will stop responding and the user will be notified.
          </p>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Suspension reason</label>
            <div className="space-y-2">
              {REASONS.map((r) => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="reason"
                    value={r}
                    checked={selected === r}
                    onChange={() => setSelected(r)}
                    className="accent-amber-500"
                  />
                  <span className="text-sm text-slate-700">{r}</span>
                </label>
              ))}
            </div>
            {selected === "Other" && (
              <textarea
                value={custom}
                onChange={(e) => setCustom(e.target.value)}
                placeholder="Describe the reason..."
                rows={3}
                className="mt-3 w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-300 placeholder:text-slate-400"
              />
            )}
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="flex-1 py-2.5 border border-slate-200 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50 transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isPending || !reason.trim()}
            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
          >
            {isPending ? "Suspending..." : "Suspend"}
          </button>
        </div>
      </div>
    </div>
  );
}

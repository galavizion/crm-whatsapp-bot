"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { KeyRound, Mail, Eye, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

export default function CuentaForm({ email }: { email: string }) {
  const supabase = createClient();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password: newPassword });
    setLoading(false);

    if (err) {
      setError(err.message);
      return;
    }

    setSuccess(true);
    setNewPassword("");
    setConfirmPassword("");
  }

  return (
    <div className="space-y-4 pb-10">
      <div>
        <h2 className="text-sm font-semibold text-slate-800">Mi cuenta</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gestiona tu acceso y contraseña.
        </p>
      </div>

      {/* Email (solo lectura) */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center gap-2">
          <Mail className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Correo electrónico</span>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm text-slate-800 font-mono bg-slate-50 border border-slate-200 rounded-xl px-4 py-3">
            {email}
          </p>
          <p className="text-xs text-slate-400 mt-1.5">
            Para cambiar tu correo, contacta al administrador.
          </p>
        </div>
      </div>

      {/* Cambio de contraseña */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-5 py-3 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-slate-500" />
          <span className="text-sm font-semibold text-slate-700">Cambiar contraseña</span>
        </div>
        <form onSubmit={handleSubmit} className="px-5 py-4 space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Nueva contraseña</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
                minLength={6}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-medium text-slate-600">Confirmar contraseña</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repite la nueva contraseña"
                minLength={6}
                required
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm pr-10 focus:outline-none focus:ring-2 focus:ring-violet-400"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 text-sm text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 text-sm text-emerald-700">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              Contraseña actualizada correctamente.
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Guardando..." : "Actualizar contraseña"}
          </button>
        </form>
      </div>
    </div>
  );
}

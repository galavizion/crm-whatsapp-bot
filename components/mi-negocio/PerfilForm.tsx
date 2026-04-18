"use client";

import { useState, useRef, useTransition } from "react";
import { savePerfilAction, updateWhatsAppProfileAction } from "@/app/mi-negocio/perfil/actions";
import { CheckCircle2, AlertCircle, Upload, RefreshCw } from "lucide-react";
import Image from "next/image";

const DIAS = [
  { key: "monday", label: "Lunes" },
  { key: "tuesday", label: "Martes" },
  { key: "wednesday", label: "Miércoles" },
  { key: "thursday", label: "Jueves" },
  { key: "friday", label: "Viernes" },
  { key: "saturday", label: "Sábado" },
  { key: "sunday", label: "Domingo" },
];

const CATEGORIAS = [
  { value: "HEALTH", label: "Salud" },
  { value: "EDUCATION", label: "Educación" },
  { value: "AUTOMOTIVE", label: "Automotriz" },
  { value: "PROFESSIONAL_SERVICES", label: "Servicios Profesionales" },
  { value: "BEAUTY_SPA_SALON", label: "Belleza y Spa" },
  { value: "CLOTHING_APPAREL", label: "Ropa y Moda" },
  { value: "FOOD_GROCERY", label: "Alimentos" },
  { value: "RESTAURANT", label: "Restaurante" },
  { value: "HOTEL_LODGING", label: "Hospedaje" },
  { value: "FINANCE_BANKING", label: "Finanzas" },
  { value: "SHOPPING_RETAIL", label: "Comercio" },
  { value: "OTHER", label: "Otro" },
];

type DayHours = { enabled: boolean; open: string; close: string };
type Hours = Record<string, DayHours>;

type Props = {
  businessId: string;
  isGod: boolean;
  initial: {
    whatsapp_profile_photo: string | null;
    whatsapp_category: string | null;
    whatsapp_description: string | null;
    whatsapp_email: string | null;
    whatsapp_website: string | null;
    whatsapp_address: string | null;
    whatsapp_hours: Hours | null;
  };
};

function defaultHours(saved: Hours | null): Hours {
  const base: DayHours = { enabled: false, open: "09:00", close: "18:00" };
  return DIAS.reduce((acc, { key }) => ({
    ...acc,
    [key]: saved?.[key] ?? { ...base },
  }), {} as Hours);
}

type Toast = { type: "success" | "error"; msg: string } | null;

const inputClass = "w-full text-sm border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-purple-300 placeholder:text-slate-400 bg-white";

export default function PerfilForm({ businessId, isGod, initial }: Props) {
  const [photo, setPhoto] = useState<string | null>(initial.whatsapp_profile_photo || null);
  const [category, setCategory] = useState(initial.whatsapp_category || "OTHER");
  const [description, setDescription] = useState(initial.whatsapp_description || "");
  const [email, setEmail] = useState(initial.whatsapp_email || "");
  const [website, setWebsite] = useState(initial.whatsapp_website || "");
  const [address, setAddress] = useState(initial.whatsapp_address || "");
  const [hours, setHours] = useState<Hours>(() => defaultHours(initial.whatsapp_hours));
  const [toast, setToast] = useState<Toast>(null);
  const [isSaving, startSave] = useTransition();
  const [isUpdating, startUpdate] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);

  function showToast(type: "success" | "error", msg: string) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  }

  function handlePhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  function toggleDay(key: string) {
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], enabled: !prev[key].enabled } }));
  }

  function setDayTime(key: string, field: "open" | "close", value: string) {
    setHours((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  function handleSave() {
    startSave(async () => {
      try {
        await savePerfilAction(businessId, {
          whatsapp_category: category,
          whatsapp_description: description,
          whatsapp_email: email,
          whatsapp_website: website,
          whatsapp_address: address,
          whatsapp_hours: hours,
          ...(photo ? { whatsapp_profile_photo: photo } : {}),
        });
        showToast("success", "Datos guardados correctamente");
      } catch {
        showToast("error", "Error al guardar. Intenta de nuevo.");
      }
    });
  }

  function handleUpdateMeta() {
    startUpdate(async () => {
      try {
        showToast("success", "Actualizando perfil en WhatsApp...");
        await updateWhatsAppProfileAction(businessId);
        showToast("success", "Perfil actualizado exitosamente en WhatsApp");
      } catch (e: unknown) {
        showToast("error", e instanceof Error ? e.message : "Error al actualizar en Meta");
      }
    });
  }

  return (
    <div className="space-y-5">

      {/* TOAST */}
      {toast && (
        <div className={`flex items-center gap-3 px-5 py-4 rounded-2xl border shadow-sm ${
          toast.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-700"
            : "bg-rose-50 border-rose-200 text-rose-700"
        }`}>
          {toast.type === "success"
            ? <CheckCircle2 className="w-5 h-5 shrink-0" />
            : <AlertCircle className="w-5 h-5 shrink-0" />
          }
          <p className="text-sm font-medium">{toast.msg}</p>
        </div>
      )}

      {/* FOTO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Foto de perfil</h2>
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-2xl bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden flex-shrink-0">
            {photo
              ? <Image src={photo} alt="Foto" width={80} height={80} className="w-full h-full object-cover" />
              : <Upload className="w-6 h-6 text-slate-400" />
            }
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition"
            >
              <Upload className="w-4 h-4" />
              {photo ? "Cambiar foto" : "Subir foto"}
            </button>
            <p className="text-xs text-slate-400 mt-1.5">Recomendado: 640×640px · JPG o PNG</p>
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
          </div>
        </div>
      </div>

      {/* INFO BÁSICA */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Información básica</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Categoría</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputClass}>
            {CATEGORIAS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700">Descripción</label>
            <span className={`text-xs ${description.length > 240 ? "text-rose-500" : "text-slate-400"}`}>
              {description.length}/256
            </span>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 256))}
            rows={3}
            placeholder="Breve descripción de tu negocio que verán tus clientes en WhatsApp"
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* CONTACTO */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h2 className="font-semibold text-slate-800">Datos de contacto</h2>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="contacto@minegocio.com" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Sitio web</label>
          <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://minegocio.com" className={inputClass} />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Dirección</label>
          <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="Calle, Ciudad, Estado, CP" className={`${inputClass} resize-none`} />
        </div>
      </div>

      {/* HORARIOS */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h2 className="font-semibold text-slate-800 mb-4">Horarios de atención</h2>
        <div className="space-y-2">
          {DIAS.map(({ key, label }) => (
            <div key={key} className={`flex items-center gap-3 p-3 rounded-xl border transition ${hours[key].enabled ? "border-purple-200 bg-purple-50" : "border-slate-100 bg-slate-50"}`}>
              <input
                type="checkbox"
                checked={hours[key].enabled}
                onChange={() => toggleDay(key)}
                className="w-4 h-4 accent-purple-500 flex-shrink-0"
              />
              <span className={`text-sm font-medium w-24 flex-shrink-0 ${hours[key].enabled ? "text-slate-800" : "text-slate-400"}`}>
                {label}
              </span>
              {hours[key].enabled ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={hours[key].open}
                    onChange={(e) => setDayTime(key, "open", e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                  />
                  <span className="text-xs text-slate-400">a</span>
                  <input
                    type="time"
                    value={hours[key].close}
                    onChange={(e) => setDayTime(key, "close", e.target.value)}
                    className="text-sm border border-slate-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-purple-300 bg-white"
                  />
                </div>
              ) : (
                <span className="text-xs text-slate-400">Cerrado</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* BOTONES */}
      <div className="flex gap-3 pb-6">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="flex-1 py-3 bg-[linear-gradient(135deg,#8c7ac6_0%,#c84f92_100%)] hover:opacity-90 disabled:opacity-60 text-white font-semibold rounded-xl transition shadow-lg text-sm"
        >
          {isSaving ? "Guardando..." : "Guardar"}
        </button>

        {isGod && (
          <button
            type="button"
            onClick={handleUpdateMeta}
            disabled={isUpdating}
            className="flex-1 py-3 bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white font-semibold rounded-xl transition shadow-lg text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? "animate-spin" : ""}`} />
            {isUpdating ? "Actualizando..." : "Actualizar en WhatsApp"}
          </button>
        )}
      </div>
    </div>
  );
}

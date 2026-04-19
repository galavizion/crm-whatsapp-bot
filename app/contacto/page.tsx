"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const WA_NUMBER = "528112982131";
const WA_DEFAULT_TEXT = "quiero contratar el bot";

function WhatsAppFloat() {
  const href = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(WA_DEFAULT_TEXT)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactar por WhatsApp"
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 9999,
        width: 58,
        height: 58,
        borderRadius: "50%",
        background: "#25D366",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 20px rgba(37,211,102,0.45)",
        transition: "transform 0.2s, box-shadow 0.2s",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 6px 28px rgba(37,211,102,0.6)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.transform = "scale(1)";
        (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 20px rgba(37,211,102,0.45)";
      }}
    >
      <svg width="30" height="30" viewBox="0 0 24 24" fill="white">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    </a>
  );
}

export default function ContactoPage() {
  const [form, setForm] = useState({ nombre: "", whatsapp: "", negocio: "", mensaje: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const texto =
      `Hola, quiero contratar el bot de Prospekto.\n\n` +
      `Nombre: ${form.nombre}\n` +
      `WhatsApp: ${form.whatsapp}\n` +
      `Negocio: ${form.negocio}\n` +
      (form.mensaje ? `Mensaje: ${form.mensaje}` : "");
    window.open(`https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(texto)}`, "_blank");
  };

  return (
    <main className="min-h-screen font-sans" style={{ background: "linear-gradient(135deg, #ede9fe 0%, #d1fae5 55%, #fce7f3 100%)" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');
        * { box-sizing: border-box; }
        body { font-family: 'DM Sans', sans-serif; }
        .serif { font-family: 'Instrument Serif', serif; }
        .nav-glass {
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          background: rgba(255,255,255,0.75);
          border-bottom: 1px solid rgba(255,255,255,0.9);
          box-shadow: 0 1px 20px rgba(0,0,0,0.06);
        }
        .input-field {
          width: 100%;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 15px;
          font-family: 'DM Sans', sans-serif;
          background: rgba(255,255,255,0.85);
          color: #1a2035;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }
        .input-field:focus {
          border-color: #00a884;
          box-shadow: 0 0 0 3px rgba(0,168,132,0.12);
        }
        .input-field::placeholder { color: #9ca3af; }
      `}</style>

      {/* Nav */}
      <nav className="nav-glass sticky top-0 z-50 w-full">
        <div className="flex items-center justify-between px-6 mx-auto" style={{ maxWidth: 1100, height: 64 }}>
          <Link href="/" className="flex items-center gap-2" style={{ textDecoration: "none" }}>
            <Image src="/Prospekt-icono.png" alt="Prospekto" width={36} height={36} className="rounded-lg" />
            <span style={{ fontSize: 16, fontWeight: 700, color: "#1a2035" }}>PROSPEKTO</span>
          </Link>
          <Link href="/" style={{ fontSize: 14, color: "#6b7280", textDecoration: "none", fontWeight: 500 }}>
            ← Volver al inicio
          </Link>
        </div>
      </nav>

      {/* Content */}
      <div style={{ maxWidth: 600, margin: "0 auto", padding: "60px 24px 80px" }}>

        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            background: "rgba(0,168,132,0.1)", border: "1px solid rgba(0,168,132,0.25)",
            color: "#00875a", borderRadius: 99, padding: "6px 16px",
            fontSize: 13, fontWeight: 500, marginBottom: 20
          }}>
            <span style={{ width: 6, height: 6, background: "#00a884", borderRadius: "50%", display: "inline-block" }} />
            Hablemos
          </div>
          <h1 className="serif" style={{ fontSize: "clamp(32px, 6vw, 52px)", fontWeight: 400, color: "#1a2035", marginBottom: 12 }}>
            Activa tu bot de<br />
            <span style={{ color: "#00a884", fontStyle: "italic" }}>WhatsApp hoy</span>
          </h1>
          <p style={{ fontSize: 16, color: "#6b7280", lineHeight: 1.7 }}>
            Déjanos tus datos y te contactamos en menos de 24 horas para hacer el setup completo de tu negocio.
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: "rgba(255,255,255,0.75)",
          border: "1px solid rgba(255,255,255,0.9)",
          borderRadius: 24,
          padding: "40px 36px",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 40px rgba(100,80,180,0.1)",
        }}>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Nombre completo *
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="Ej: Carlos Martínez"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                WhatsApp / Teléfono *
              </label>
              <input
                className="input-field"
                type="tel"
                placeholder="Ej: 8112345678"
                value={form.whatsapp}
                onChange={e => setForm({ ...form, whatsapp: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                Nombre de tu negocio *
              </label>
              <input
                className="input-field"
                type="text"
                placeholder="Ej: Inmobiliaria Torres"
                value={form.negocio}
                onChange={e => setForm({ ...form, negocio: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                ¿En qué puedo ayudarte? (opcional)
              </label>
              <textarea
                className="input-field"
                rows={3}
                placeholder="Cuéntame sobre tu negocio o lo que necesitas..."
                value={form.mensaje}
                onChange={e => setForm({ ...form, mensaje: e.target.value })}
                style={{ resize: "none" }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "16px",
                background: "#25D366",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                fontFamily: "'DM Sans', sans-serif",
                boxShadow: "0 4px 20px rgba(37,211,102,0.35)",
                transition: "background 0.2s, transform 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "#1da851")}
              onMouseLeave={e => (e.currentTarget.style.background = "#25D366")}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Enviar por WhatsApp
            </button>

            <p style={{ textAlign: "center", fontSize: 12, color: "#9ca3af" }}>
              Al dar clic se abrirá WhatsApp con tu información lista para enviar.
            </p>
          </form>
        </div>

        {/* Beneficios rápidos */}
        <div style={{ marginTop: 40, display: "flex", flexDirection: "column", gap: 12 }}>
          {[
            "✅ Respondemos en menos de 24 horas",
            "✅ Setup completo incluido en el precio",
            "✅ Sin contrato — cancela cuando quieras",
          ].map(item => (
            <div key={item} style={{ fontSize: 14, color: "#374151", textAlign: "center" }}>{item}</div>
          ))}
        </div>
      </div>

      <WhatsAppFloat />
    </main>
  );
}

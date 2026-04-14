"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { useState } from "react";

export default function LandingPage() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <main className="min-h-screen bg-[#0A0F0A] text-white overflow-x-hidden font-sans">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #0A0F0A;
        }

        .serif { font-family: 'Instrument Serif', serif; }

        .grid-bg {
          background-image:
            linear-gradient(rgba(29,158,117,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(29,158,117,0.06) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
        }

        .nav-glass {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: rgba(10,15,10,0.85);
          border-bottom: 1px solid rgba(29,158,117,0.12);
        }

        .pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(29,158,117,0.12);
          border: 1px solid rgba(29,158,117,0.25);
          color: #5DCAA5;
          border-radius: 99px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
          letter-spacing: 0.01em;
        }

        .pill-dot {
          width: 6px; height: 6px;
          background: #1D9E75;
          border-radius: 50%;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.3); }
        }

        .btn-primary {
          background: #1D9E75;
          color: #fff;
          border: none;
          border-radius: 10px;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s, transform 0.15s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .btn-primary:hover { background: #0F6E56; transform: translateY(-1px); }

        .btn-secondary {
          background: transparent;
          color: #9FE1CB;
          border: 1px solid rgba(29,158,117,0.3);
          border-radius: 10px;
          padding: 14px 28px;
          font-size: 15px;
          font-weight: 400;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s;
          font-family: 'DM Sans', sans-serif;
          white-space: nowrap;
        }
        .btn-secondary:hover { background: rgba(29,158,117,0.08); border-color: rgba(29,158,117,0.5); }

        .btn-login {
          background: transparent;
          color: #9FE1CB;
          border: 1px solid rgba(29,158,117,0.3);
          border-radius: 8px;
          padding: 8px 20px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-login:hover { background: rgba(29,158,117,0.1); border-color: #1D9E75; color: #fff; }

        .feat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 16px;
          padding: 28px;
          transition: border-color 0.25s, background 0.25s;
        }
        .feat-card:hover {
          border-color: rgba(29,158,117,0.3);
          background: rgba(29,158,117,0.04);
        }

        .bubble-in {
          background: rgba(255,255,255,0.07);
          border-radius: 16px 16px 16px 4px;
          padding: 10px 14px;
          font-size: 13px;
          color: #d4d4d4;
          max-width: 240px;
          line-height: 1.5;
        }
        .bubble-out {
          background: #1D9E75;
          border-radius: 16px 16px 4px 16px;
          padding: 10px 14px;
          font-size: 13px;
          color: #fff;
          max-width: 260px;
          line-height: 1.5;
          align-self: flex-end;
        }
        .bubble-meta {
          font-size: 11px;
          color: #5F5E5A;
          margin-top: 3px;
        }

        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 24px;
          text-align: center;
        }

        .price-card {
          background: rgba(29,158,117,0.06);
          border: 1px solid rgba(29,158,117,0.2);
          border-radius: 20px;
          padding: 36px;
        }

        @media (max-width: 640px) {
          .price-card { padding: 28px 20px; }
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }

        .check { color: #1D9E75; font-weight: 500; margin-right: 8px; }

        .sec-label {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1D9E75;
        }

        /* Mobile menu */
        .mobile-menu {
          position: absolute;
          top: 64px;
          left: 0;
          right: 0;
          background: rgba(10,15,10,0.97);
          border-bottom: 1px solid rgba(29,158,117,0.15);
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .mobile-menu a {
          font-size: 16px;
          color: #888780;
          text-decoration: none;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
      `}</style>

      {/* ─── NAVBAR ─── */}
      <nav className="nav-glass sticky top-0 z-50 w-full" style={{ position: "relative" }}>
        <div className="flex items-center justify-between px-6 mx-auto" style={{ maxWidth: 1100, height: 64 }}>

          {/* Logo */}
          <div className="flex items-center gap-2">
            <Image src="/Prospekt-app.png" alt="Prospekto" width={32} height={32} className="rounded-lg" />
            <span style={{ fontSize: 17, fontWeight: 500, color: "#fff", letterSpacing: "-0.01em" }}>Prospekto</span>
          </div>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-7">
            <a href="#features" style={{ fontSize: 14, color: "#888780", textDecoration: "none", transition: "color 0.2s" }}
               onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
               onMouseLeave={e => (e.currentTarget.style.color = "#888780")}>
              Funciones
            </a>
            <a href="#pricing" style={{ fontSize: 14, color: "#888780", textDecoration: "none", transition: "color 0.2s" }}
               onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
               onMouseLeave={e => (e.currentTarget.style.color = "#888780")}>
              Precio
            </a>
            <button className="btn-login" onClick={() => router.push("/login")}>
              Acceder →
            </button>
          </div>

          {/* Mobile: solo botón acceder + hamburger */}
          <div className="flex sm:hidden items-center gap-3">
            <button className="btn-login" style={{ padding: "7px 14px", fontSize: 13 }} onClick={() => router.push("/login")}>
              Acceder
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              style={{ background: "transparent", border: "none", color: "#9FE1CB", cursor: "pointer", padding: 4 }}
              aria-label="Menú"
            >
              {mobileMenuOpen ? (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <div className="mobile-menu sm:hidden">
            <a href="#features" onClick={() => setMobileMenuOpen(false)}>Funciones</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)}>Precio</a>
          </div>
        )}
      </nav>

      {/* ─── HERO ─── */}
      <section className="grid-bg" style={{ position: "relative", padding: "72px 24px 96px", textAlign: "center", overflow: "hidden" }}>
        <div className="glow" style={{ width: 500, height: 500, background: "rgba(29,158,117,0.15)", top: -180, left: "50%", transform: "translateX(-50%)" }} />
        <div className="glow" style={{ width: 260, height: 260, background: "rgba(29,158,117,0.08)", bottom: -80, right: "5%" }} />

        <div style={{ maxWidth: 720, margin: "0 auto", position: "relative" }}>
          <div className="fade-up" style={{ marginBottom: 24 }}>
            <span className="pill">
              <span className="pill-dot" />
              CRM + Bot WhatsApp con IA para PyMEs
            </span>
          </div>

          <h1 className="serif fade-up delay-1" style={{ fontSize: "clamp(36px, 6vw, 68px)", fontWeight: 400, lineHeight: 1.1, marginBottom: 24, color: "#fff" }}>
            Tu próximo cliente ya<br />
            <span style={{ color: "#1D9E75", fontStyle: "italic" }}>te escribió</span> por WhatsApp.
          </h1>

          <p className="fade-up delay-2" style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#888780", lineHeight: 1.7, marginBottom: 40, maxWidth: 520, margin: "0 auto 40px" }}>
            Prospekto responde, clasifica y asigna cada lead automáticamente — mientras tú duermes, vendes o haces otra cosa.
          </p>

          <div className="fade-up delay-3 flex flex-wrap justify-center gap-3">
            <button className="btn-primary" onClick={() => router.push("/login")}>
              Activar mi bot gratis →
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}>
              Ver cómo funciona
            </button>
          </div>

          <p className="fade-up delay-4" style={{ marginTop: 20, fontSize: 13, color: "#5F5E5A" }}>
            Sin tarjeta de crédito · Desde $0.38 USD/mes · Setup en minutos
          </p>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section style={{ background: "rgba(29,158,117,0.05)", borderTop: "1px solid rgba(29,158,117,0.1)", borderBottom: "1px solid rgba(29,158,117,0.1)", padding: "36px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 16 }}>
          {[
            { val: "< 3 seg", label: "Tiempo de respuesta" },
            { val: "$0.38", label: "USD por mes" },
            { val: "24 / 7", label: "Sin días libres" },
            { val: "100%", label: "Leads capturados" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="serif" style={{ fontSize: "clamp(24px, 4vw, 32px)", color: "#1D9E75", marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: 13, color: "#888780" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DEMO CHAT ─── */}
      <section id="demo" style={{ padding: "80px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* Left — texto */}
          <div>
            <div className="sec-label" style={{ marginBottom: 16 }}>Así funciona</div>
            <h2 className="serif" style={{ fontSize: "clamp(26px, 4vw, 44px)", fontWeight: 400, lineHeight: 1.2, marginBottom: 20, color: "#fff" }}>
              De lead a oportunidad<br />
              <span style={{ fontStyle: "italic", color: "#5DCAA5" }}>en segundos</span>
            </h2>
            <p style={{ fontSize: 15, color: "#888780", lineHeight: 1.8, marginBottom: 32 }}>
              El cliente escribe a tu WhatsApp. La IA responde al instante, extrae nombre, necesidad y presupuesto, y asigna el lead al vendedor correcto — sin que toques nada.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {["Respuesta en menos de 3 segundos", "Extracción automática de datos con IA", "Asignación round-robin a tu equipo", "Dashboard en tiempo real"].map(f => (
                <div key={f} style={{ fontSize: 14, color: "#B4B2A9" }}>
                  <span className="check">✓</span>{f}
                </div>
              ))}
            </div>
          </div>

          {/* Right — chat mockup */}
          <div style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 20, overflow: "hidden" }}>
            <div style={{ background: "rgba(29,158,117,0.15)", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
              <Image src="/Prospekt-app.png" alt="Prospekto" width={36} height={36} className="rounded-full" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Mi Negocio</div>
                <div style={{ fontSize: 11, color: "#5DCAA5" }}>● en línea</div>
              </div>
            </div>
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14, minHeight: 300 }}>
              <div>
                <div className="bubble-in">Hola! quería info sobre sus servicios de diseño, ¿cuánto cobran?</div>
                <div className="bubble-meta" style={{ marginLeft: 4 }}>2:17 am</div>
              </div>
              <div style={{ alignSelf: "flex-end" }}>
                <div className="bubble-out">¡Hola! Soy el asistente de Mi Negocio 👋 ¿Me puedes contar un poco más sobre lo que necesitas? ¿Es para un logo, web o branding completo?</div>
                <div className="bubble-meta" style={{ textAlign: "right", marginRight: 4 }}>2:17 am · Bot ✓✓</div>
              </div>
              <div>
                <div className="bubble-in">Para una web completa, somos startup y tenemos como $30k de presupuesto</div>
                <div className="bubble-meta" style={{ marginLeft: 4 }}>2:18 am</div>
              </div>
              <div style={{ alignSelf: "flex-end" }}>
                <div className="bubble-out">Perfecto, con ese presupuesto podemos hacer algo increíble 🚀 ¿Cuándo tienes 20 minutos para una llamada?</div>
                <div className="bubble-meta" style={{ textAlign: "right", marginRight: 4 }}>2:18 am · Bot ✓✓</div>
              </div>
              <div style={{ background: "rgba(29,158,117,0.1)", border: "1px solid rgba(29,158,117,0.2)", borderRadius: 10, padding: "10px 14px", fontSize: 12, color: "#5DCAA5", lineHeight: 1.7 }}>
                <div style={{ fontWeight: 500, marginBottom: 4, color: "#9FE1CB" }}>🤖 Lead capturado automáticamente</div>
                <div>Necesidad: Web completa · Presupuesto: $30k · Estado: llamar</div>
                <div>Asignado a: Carlos V.</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ padding: "72px 24px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <div className="sec-label" style={{ marginBottom: 12 }}>Todo incluido</div>
            <h2 className="serif" style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 400, color: "#fff" }}>
              Un solo sistema, cero fricciones
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
            {[
              { icon: "💬", title: "Bot conversacional con IA", desc: "Responde en lenguaje natural con el tono de tu negocio. GPT-4o-mini integrado, sin configuración compleja." },
              { icon: "🎯", title: "Extracción automática de datos", desc: "Nombre, necesidad, presupuesto y estado — extraídos de la conversación sin que el lead llene un formulario." },
              { icon: "⚡", title: "Asignación round-robin", desc: "Cada lead se asigna al siguiente vendedor disponible. Justo, automático y sin conflictos internos." },
              { icon: "📊", title: "CRM visual en tiempo real", desc: "Pipeline, lista y detalle de cada lead. Filtros por estado, historial completo de conversación y exportación CSV." },
              { icon: "🔔", title: "Multi-negocio y multi-vendedor", desc: "Maneja 2+ cuentas de WhatsApp con equipos separados desde un solo dashboard." },
              { icon: "💰", title: "Costo ridículamente bajo", desc: "~$0.38 USD al mes con 1,000 conversaciones. Sin planes de $99/mes que nadie usa al 100%." },
            ].map((f) => (
              <div key={f.title} className="feat-card">
                <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                <div style={{ fontSize: 16, fontWeight: 500, color: "#fff", marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 14, color: "#888780", lineHeight: 1.7 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" style={{ padding: "80px 24px" }}>
        <div style={{ maxWidth: 520, margin: "0 auto", textAlign: "center" }}>
          <div className="sec-label" style={{ marginBottom: 16 }}>Precio</div>
          <h2 className="serif" style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 400, color: "#fff", marginBottom: 36 }}>
            Sin sorpresas en la factura
          </h2>
          <div className="price-card">
            <div style={{ fontSize: 13, color: "#5DCAA5", fontWeight: 500, marginBottom: 8 }}>Pago por uso real</div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, marginBottom: 6 }}>
              <span className="serif" style={{ fontSize: "clamp(40px, 10vw, 56px)", color: "#fff", fontWeight: 400 }}>$0.38</span>
              <span style={{ fontSize: 16, color: "#888780" }}>USD / mes</span>
            </div>
            <div style={{ fontSize: 13, color: "#5F5E5A", marginBottom: 28 }}>Con 1,000 conversaciones mensuales</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left", marginBottom: 28 }}>
              {[
                "Bot de WhatsApp con IA incluido",
                "CRM completo con pipeline visual",
                "Hasta 4 vendedores simultáneos",
                "2+ cuentas de WhatsApp",
                "Exportación CSV de leads",
                "Historial completo de conversaciones",
                "Dashboard en tiempo real",
              ].map(f => (
                <div key={f} style={{ fontSize: 14, color: "#B4B2A9" }}>
                  <span className="check">✓</span>{f}
                </div>
              ))}
            </div>

            <button className="btn-primary" style={{ width: "100%", fontSize: 16, padding: "16px" }} onClick={() => router.push("/login")}>
              Empezar ahora — es gratis →
            </button>
            <div style={{ marginTop: 14, fontSize: 12, color: "#5F5E5A" }}>
              Sin tarjeta de crédito para comenzar
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", textAlign: "center" }}>
        <div className="flex items-center justify-center gap-2 mb-3">
          <Image src="/Prospekt-app.png" alt="Prospekto" width={24} height={24} className="rounded-md" />
          <span style={{ fontSize: 15, fontWeight: 500, color: "#fff" }}>Prospekto</span>
        </div>
        <div style={{ fontSize: 13, color: "#5F5E5A" }}>
          CRM + Bot WhatsApp para PyMEs mexicanas · {new Date().getFullYear()}
        </div>
      </footer>
    </main>
  );
}

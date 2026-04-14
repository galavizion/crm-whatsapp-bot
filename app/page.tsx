"use client";

import { useRouter } from "next/navigation";

export default function LandingPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#0A0F0A] text-white overflow-x-hidden font-sans">
      {/* ─── Google Fonts ─── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=DM+Sans:wght@300;400;500&display=swap');

        * { box-sizing: border-box; }

        body {
          font-family: 'DM Sans', sans-serif;
          background: #0A0F0A;
        }

        .serif { font-family: 'Instrument Serif', serif; }

        /* Grid background */
        .grid-bg {
          background-image:
            linear-gradient(rgba(29,158,117,0.06) 1px, transparent 1px),
            linear-gradient(90deg, rgba(29,158,117,0.06) 1px, transparent 1px);
          background-size: 60px 60px;
        }

        /* Glow blob */
        .glow {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          pointer-events: none;
        }

        /* Nav glass */
        .nav-glass {
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          background: rgba(10,15,10,0.7);
          border-bottom: 1px solid rgba(29,158,117,0.12);
        }

        /* Pill badge */
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

        /* CTA primary */
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
        }
        .btn-primary:hover { background: #0F6E56; transform: translateY(-1px); }

        /* CTA secondary */
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
        }
        .btn-secondary:hover { background: rgba(29,158,117,0.08); border-color: rgba(29,158,117,0.5); }

        /* Login button */
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

        /* Feature card */
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

        /* Chat bubble */
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

        /* Stat */
        .stat-card {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 14px;
          padding: 24px;
          text-align: center;
        }

        /* Pricing card */
        .price-card {
          background: rgba(29,158,117,0.06);
          border: 1px solid rgba(29,158,117,0.2);
          border-radius: 20px;
          padding: 36px;
        }

        /* Fade-up animation */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .delay-1 { animation-delay: 0.1s; }
        .delay-2 { animation-delay: 0.2s; }
        .delay-3 { animation-delay: 0.3s; }
        .delay-4 { animation-delay: 0.4s; }

        /* Check icon */
        .check { color: #1D9E75; font-weight: 500; margin-right: 8px; }

        /* Section label */
        .sec-label {
          font-size: 12px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: #1D9E75;
        }
      `}</style>

      {/* ─── NAVBAR ─── */}
      <nav className="nav-glass sticky top-0 z-50 w-full">
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
          {/* Logo */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 32, height: 32, background: "#1D9E75", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 14L7 10M7 10L9 12L13 7M7 10V6M13 7V11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <span style={{ fontSize: 17, fontWeight: 500, color: "#fff", letterSpacing: "-0.01em" }}>Prospekto</span>
          </div>

          {/* Nav links — hidden on mobile for simplicity */}
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
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
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section className="grid-bg" style={{ position: "relative", padding: "100px 24px 120px", textAlign: "center", overflow: "hidden" }}>
        {/* Glow blobs */}
        <div className="glow" style={{ width: 600, height: 600, background: "rgba(29,158,117,0.15)", top: -200, left: "50%", transform: "translateX(-50%)" }} />
        <div className="glow" style={{ width: 300, height: 300, background: "rgba(29,158,117,0.08)", bottom: -100, right: "10%" }} />

        <div style={{ maxWidth: 760, margin: "0 auto", position: "relative" }}>
          <div className="fade-up" style={{ marginBottom: 24 }}>
            <span className="pill">
              <span className="pill-dot" />
              CRM + Bot WhatsApp con IA para PyMEs
            </span>
          </div>

          <h1 className="serif fade-up delay-1" style={{ fontSize: "clamp(42px, 6vw, 72px)", fontWeight: 400, lineHeight: 1.1, marginBottom: 24, color: "#fff" }}>
            Tu próximo cliente ya<br />
            <span style={{ color: "#1D9E75", fontStyle: "italic" }}>te escribió</span> por WhatsApp.
          </h1>

          <p className="fade-up delay-2" style={{ fontSize: 18, color: "#888780", lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" }}>
            Prospekto responde, clasifica y asigna cada lead automáticamente — mientras tú duermes, vendes o haces otra cosa.
          </p>

          <div className="fade-up delay-3" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-primary" onClick={() => router.push("/login")}>
              Activar mi bot gratis →
            </button>
            <button className="btn-secondary" onClick={() => document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" })}>
              Ver cómo funciona
            </button>
          </div>

          <p className="fade-up delay-4" style={{ marginTop: 20, fontSize: 13, color: "#5F5E5A" }}>
            Setup $1,000 MXN único · $699 MXN/mes · Sin contratos
          </p>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section style={{ background: "rgba(29,158,117,0.05)", borderTop: "1px solid rgba(29,158,117,0.1)", borderBottom: "1px solid rgba(29,158,117,0.1)", padding: "40px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 24 }}>
          {[
            { val: "< 3 seg", label: "Tiempo de respuesta" },
            { val: "$699", label: "MXN / mes" },
            { val: "24 / 7", label: "Sin días libres" },
            { val: "100%", label: "Leads capturados" },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="serif" style={{ fontSize: 32, color: "#1D9E75", marginBottom: 4 }}>{s.val}</div>
              <div style={{ fontSize: 13, color: "#888780" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── DEMO CHAT ─── */}
      <section id="demo" style={{ padding: "100px 24px", maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, alignItems: "center" }}>
          {/* Left — text */}
          <div>
            <div className="sec-label" style={{ marginBottom: 16 }}>Así funciona</div>
            <h2 className="serif" style={{ fontSize: "clamp(30px, 4vw, 46px)", fontWeight: 400, lineHeight: 1.2, marginBottom: 20, color: "#fff" }}>
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
            {/* Phone header */}
            <div style={{ background: "rgba(29,158,117,0.15)", padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#1D9E75", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 500 }}>M</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 500, color: "#fff" }}>Mi Negocio</div>
                <div style={{ fontSize: 11, color: "#5DCAA5" }}>● en línea</div>
              </div>
            </div>
            {/* Messages */}
            <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: 14, minHeight: 320 }}>
              <div>
                <div className="bubble-in">Hola! quería info sobre sus servicios de diseño, ¿cuánto cobran?</div>
                <div className="bubble-meta" style={{ marginLeft: 4 }}>2:17 am</div>
              </div>
              <div style={{ alignSelf: "flex-end" }}>
                <div className="bubble-out">¡Hola! Soy el asistente de Mi Negocio 👋 Con gusto te ayudo. ¿Me puedes contar un poco más sobre lo que necesitas? ¿Es para un logo, web o branding completo?</div>
                <div className="bubble-meta" style={{ textAlign: "right", marginRight: 4 }}>2:17 am · Bot ✓✓</div>
              </div>
              <div>
                <div className="bubble-in">Para una web completa, somos una startup y tenemos como $30k de presupuesto</div>
                <div className="bubble-meta" style={{ marginLeft: 4 }}>2:18 am</div>
              </div>
              <div style={{ alignSelf: "flex-end" }}>
                <div className="bubble-out">Perfecto, con ese presupuesto podemos hacer algo increíble 🚀 Déjame agendar una llamada con nuestro equipo para esta semana. ¿Cuándo tienes 20 minutos?</div>
                <div className="bubble-meta" style={{ textAlign: "right", marginRight: 4 }}>2:18 am · Bot ✓✓</div>
              </div>
              {/* Lead extracted badge */}
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
      <section id="features" style={{ padding: "80px 24px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <div className="sec-label" style={{ marginBottom: 12 }}>Todo incluido</div>
            <h2 className="serif" style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, color: "#fff" }}>
              Un solo sistema, cero fricciones
            </h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 20 }}>
            {[
              { icon: "💬", title: "Bot conversacional con IA", desc: "Responde en lenguaje natural con el tono de tu negocio. GPT-4o-mini integrado, sin configuración compleja." },
              { icon: "🎯", title: "Extracción automática de datos", desc: "Nombre, necesidad, presupuesto y estado — extraídos de la conversación sin que el lead llene un formulario." },
              { icon: "⚡", title: "Asignación round-robin", desc: "Cada lead se asigna al siguiente vendedor disponible. Justo, automático y sin conflictos internos." },
              { icon: "📊", title: "CRM visual en tiempo real", desc: "Pipeline, lista y detalle de cada lead. Filtros por estado, historial completo de conversación y exportación CSV." },
              { icon: "👥", title: "1 admin + hasta 5 vendedores", desc: "El admin ve todo el pipeline y gestiona el equipo. Cada vendedor recibe sus leads asignados automáticamente." },
              { icon: "💰", title: "Costo ridículamente bajo", desc: "Precio justo para PyMEs mexicanas. Sin costos ocultos, sin contratos anuales forzados." },
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
      <section id="pricing" style={{ padding: "100px 24px" }}>
        <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
          <div className="sec-label" style={{ marginBottom: 16 }}>Precio</div>
          <h2 className="serif" style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 400, color: "#fff", marginBottom: 40 }}>
            Sin sorpresas en la factura
          </h2>
          <div className="price-card">
            <div style={{ fontSize: 13, color: "#5DCAA5", fontWeight: 500, marginBottom: 8 }}>Pago por uso real</div>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "center", gap: 6, marginBottom: 6 }}>
              <span className="serif" style={{ fontSize: 56, color: "#fff", fontWeight: 400 }}>$699</span>
              <span style={{ fontSize: 16, color: "#888780" }}>MXN / mes</span>
            </div>
            <div style={{ fontSize: 13, color: "#5F5E5A", marginBottom: 32 }}>1 admin + hasta 5 vendedores</div>

            <div style={{ display: "flex", flexDirection: "column", gap: 12, textAlign: "left", marginBottom: 32 }}>
              {[
                "Bot de WhatsApp con IA incluido",
                "CRM completo con pipeline visual",
                "1 admin + hasta 5 vendedores",
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginBottom: 12 }}>
          <div style={{ width: 24, height: 24, background: "#1D9E75", borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="13" height="13" viewBox="0 0 18 18" fill="none">
              <path d="M3 14L7 10M7 10L9 12L13 7M7 10V6M13 7V11" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{ fontSize: 15, fontWeight: 500, color: "#fff" }}>Prospekto</span>
        </div>
        <div style={{ fontSize: 13, color: "#5F5E5A" }}>
          CRM + Bot WhatsApp para PyMEs mexicanas · {new Date().getFullYear()}
        </div>
      </footer>
    </main>
  );
}
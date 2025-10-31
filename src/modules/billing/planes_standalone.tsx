// src/modules/billing/planes_standalone.tsx
import React, { useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/landing.css";

const samplePlans = [
  {
    id: "basico",
    name: "Básico",
    price: 0,
    bullets: ["1 espacio de trabajo", "Hasta 3 usuarios", "Reportes mensuales"],
  },
  {
    id: "profesional",
    name: "Profesional",
    price: 50,
    bullets: ["Multi-tenant", "Analítica avanzada", "Soporte prioritario"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    price: "Contactar",
    bullets: ["SSO y SLA", "Onboarding dedicado", "Integraciones a medida"],
  },
];

const PlanesStandalone: React.FC = () => {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  return (
    <main>
      <header className="topbar">
        <div className="logo">Seguridad con tus finanzas</div>
        <div className="actions">
          <Link to="/" className="ui-btn ui-btn--ghost">Inicio</Link>
          <Link to="/registro" className="ui-btn ui-btn--ghost">Registrarse</Link>
          <Link to="/login" className="ui-btn">Iniciar sesión</Link>
        </div>
      </header>

      {/* Hero específico para planes */}
      <section className="landing-hero">
        <div style={{ maxWidth: 1120, margin: "0 auto", textAlign: "center" }}>
          <h1 className="ui-title">Elige el plan perfecto para tu empresa</h1>
          <p className="ui-subtitle">
            Selecciona la opción que mejor se adapte a las necesidades de tu negocio.
          </p>
        </div>
      </section>

      {/* Plans section centrada con animaciones */}
      <section className="plans-section" aria-labelledby="planes-title" style={{ margin: "40px auto", maxWidth: "1200px" }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <h2 id="planes-title" style={{ color: "#e6f7ff", textAlign: "center", marginBottom: "40px" }}>Planes y características</h2>
          <div className="plans-grid" role="list">
            {samplePlans.map((plan, i) => (
              <article
                key={plan.id}
                className={[
                  "plan-card",
                  plan.id === "profesional" ? "plan-card--highlight" : "",
                ].join(" ")}
                role="listitem"
                aria-expanded={openIdx === i}
              >
                <h3 className="plan-title">{plan.name}</h3>
                <div className="plan-price">{plan.price === 0 ? "Gratis · 14 días" : `$${plan.price}/mes`}</div>
                <ul className="plan-limits" aria-hidden={openIdx === i ? false : true}>
                  {plan.bullets.map((b) => <li key={b}>{b}</li>)}
                </ul>

                <div style={{ marginTop: 12 }}>
                  <button className="ui-btn" onClick={() => setOpenIdx(i === openIdx ? null : i)}>
                    {openIdx === i ? "Ocultar detalles" : "Ver detalles"}
                  </button>
                  <Link to={`/checkout?plan=${plan.id}`} className="ui-btn ui-btn--ghost" style={{ marginLeft: 8 }}>
                    Comprar ahora
                  </Link>
                </div>

                {openIdx === i && (
                  <div className="plan-details" role="region" aria-live="polite">
                    <h4 className="plan-details__title">¿Qué incluye?</h4>
                    <ul className="plan-details__list">
                      {plan.bullets.map((d) => <li key={d}>{d}</li>)}
                      <li>Integraciones con pasarelas de pago</li>
                      <li>Soporte por email</li>
                    </ul>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default PlanesStandalone;
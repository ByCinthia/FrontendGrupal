// src/modules/billing/planes_page.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { listPlans, startTrial, getPlanDetails } from "./service";
import type { Plan, PlanId } from "./types";
import "../../styles/dashboard.css";

const priceLabel = (p: number): string => (p === 0 ? "Gratis" : `$${p}/mes`);

const LimitsList: React.FC<{ plan: Plan }> = ({ plan }) => (
  <ul className="plan-limits">
    <li>Usuarios: {plan.limits.maxUsers}</li>
    <li>Solicitudes/mes: {plan.limits.maxRequests}</li>
    <li>Almacenamiento: {plan.limits.maxStorageGB} GB</li>
  </ul>
);

const PlanCard: React.FC<{
  plan: Plan;
  onStart: (id: PlanId) => void;
  onToggle: () => void;
  isOpen: boolean;
  idx: number;
}> = ({ plan, onStart, onToggle, isOpen, idx }) => {
  const navigate = useNavigate();
  const onBuy = (id: PlanId) => {
    if (id === "personalizado") {
      navigate("/registro-onpremise");
    } else {
      navigate(`/checkout-mock?plan=${id}`);
    }
  };

  // details es string[] — tipado explícito
  const details: string[] = getPlanDetails(plan.id);
  const detailsId = `plan-${plan.id}-${idx}-details`;
  const titleId = `plan-${plan.id}-${idx}-title`;

  return (
    <article
      className={[
        "card",
        "plan-card",
        plan.id === "profesional" ? "plan-card--highlight" : "",
        isOpen ? "is-open" : "",
      ].join(" ")}
      data-open={isOpen}
    >
      <h3 id={titleId} className="plan-title">{plan.name}</h3>
      <div className="plan-price">{priceLabel(plan.priceUsd)}</div>

      <LimitsList plan={plan} />

      <div className="plan-actions">
        <button className="ui-btn plan-cta" onClick={() => onStart(plan.id)}>
          Comenzar trial
        </button>

        {plan.priceUsd > 0 && (
          <button className="ui-btn ui-btn--ghost" onClick={() => onBuy(plan.id)}>
            Comprar ahora
          </button>
        )}

        <button
          className="link-button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={detailsId}
        >
          {isOpen ? "Ocultar detalles" : "Ver detalles"}
        </button>
      </div>

      {isOpen && (
        <div id={detailsId} className="plan-details" role="region" aria-labelledby={titleId}>
          <h4 className="plan-details__title">Detalles</h4>
          <ul className="plan-details__list">
            {details.map((d: string) => (
              <li key={d}>{d}</li>
            ))}
          </ul>
        </div>
      )}
    </article>
  );
};

const PlansPage: React.FC = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    void (async () => {
      const p = await listPlans();
      setPlans(p);
    })();
  }, []);

  const handleStart = async (id: PlanId) => {
    // actor="usuario" por defecto en este ejemplo
    const orgName = localStorage.getItem("org_name") ?? "Mi organización";
    await startTrial(id, orgName, "usuario");
    navigate("/mi-suscripcion");
  };

  return (
    <section className="page">
      <h1 className="ui-title">Planes</h1>
      <div className="plans-grid">
        {plans.map((plan, i) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            idx={i}
            isOpen={openIdx === i}
            onToggle={() => setOpenIdx((s) => (s === i ? null : i))}
            onStart={handleStart}
          />
        ))}
      </div>
    </section>
  );
};

export default PlansPage;

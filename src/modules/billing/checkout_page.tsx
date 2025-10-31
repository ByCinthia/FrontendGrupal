import React, { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { changePlan, activateSubscription } from "./service";
import type { PlanId } from "./types";
import "../../styles/dashboard.css";

function normalizePlanParam(p?: string): PlanId {
  const v = (p ?? "").toLowerCase();
  if (v === "pro" || v === "profesional") return "profesional";
  if (v === "basic" || v === "basico") return "basico";
  if (v === "enterprise") return "enterprise";
  return "profesional";
}

const CheckoutMockPage: React.FC = () => {
  const [qp] = useSearchParams();
  const navigate = useNavigate();
  const plan = normalizePlanParam(qp.get("plan") ?? undefined);

  const title = useMemo(
    () =>
      ({
        basico: "Básico",
        profesional: "Profesional",
        enterprise: "Enterprise",
      }[plan] ?? "Profesional"),
    [plan]
  );

  const onSuccess = async (): Promise<void> => {
    // “Compró” el plan -> lo fijamos y activamos la suscripción
    await changePlan(plan, "usuario");
    await activateSubscription("usuario");
    alert("✅ Pago simulado OK. Suscripción activa.");
    navigate("/mi-suscripcion");
  };

  const onCancel = (): void => {
    alert("Pago cancelado.");
    navigate("/planes");
  };

  return (
    <section className="page">
      <h1 className="ui-title">Checkout (simulado)</h1>
      <div className="card">
        <p>Plan seleccionado: <strong>{title}</strong></p>
        <p>Usa esto para demos y capturas.</p>
        <div style={{ display: "flex", gap: 12 }}>
          <button className="ui-btn" onClick={onSuccess}>Simular pago exitoso</button>
          <button className="ui-btn ui-btn--ghost" onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </section>
  );
};

export default CheckoutMockPage;

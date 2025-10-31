// src/modules/billing/plan_selection.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { listPlans,} from "./service";
import type { Plan } from "./types";
import "../../styles/auth.css";

interface PlanSelectionState {
  empresa_id?: number;
  selectedPlan?: string;
  user?: any;
}

const PlanSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as PlanSelectionState;
  
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<string>("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  // Verificar que tenemos los datos necesarios
  useEffect(() => {
    console.log("Estado recibido en plan_selection:", state);
    
    if (!state?.empresa_id) {
      console.warn("No hay empresa_id en el estado, redirigiendo a registro");
      navigate("/registro", { replace: true });
      return;
    }
    
    console.log("empresa_id encontrado:", state.empresa_id);
    
    if (state.selectedPlan) {
      setSelectedPlan(state.selectedPlan);
    }
  }, [state, navigate]);

  // Cargar planes
  useEffect(() => {
    const loadPlans = async () => {
      try {
        const plansList = await listPlans();
        setPlans(plansList);
        if (!selectedPlan && plansList.length > 0) {
          setSelectedPlan(plansList[0].id);
        }
      } catch (error) {
        console.error("Error cargando planes:", error);
        setMessage({ text: "Error cargando planes", type: "error" });
      }
    };
    loadPlans();
  }, [selectedPlan]);

  const handleSelectPlan = (planId: string) => {
    setSelectedPlan(planId);
  };

  const handleConfirmPlan = async () => {
    if (!selectedPlan || !state?.empresa_id) {
      setMessage({ text: "Seleccione un plan válido", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      // Mapear los planes correctamente según especificaciones del backend
      let planEnum = "";
      
      // Mapeo específico según los requerimientos
      if (selectedPlan === "basico") {
        planEnum = "BASICO";
      } else if (selectedPlan === "profesional") {
        planEnum = "PREMIUM"; // Especificado como PREMIUM en requerimientos
      } else if (selectedPlan === "personalizado") {
        planEnum = "PERSONALIZADO";
      } else {
        // Fallback - convertir a mayúsculas
        planEnum = selectedPlan.toUpperCase();
      }
      
      const fechaFin = new Date();
      
      if (selectedPlan === "basico") {
        // 30 días gratis para plan básico
        fechaFin.setDate(fechaFin.getDate() + 30);
      } else {
        // 1 año para otros planes
        fechaFin.setFullYear(fechaFin.getFullYear() + 1);
      }

      // Verificar que tenemos todos los datos necesarios
      if (!state.empresa_id || !planEnum) {
        setMessage({ text: "Faltan datos para crear la suscripción", type: "error" });
        return;
      }

      const suscripcionData = {
        empresa: Number(state.empresa_id), // Asegurar que sea número
        fecha_fin: fechaFin.toISOString(),
        enum_plan: planEnum,
        enum_estado: "ACTIVO"
      };

      console.log("=== DEBUG SUSCRIPCIÓN ===");
      console.log("Plan original seleccionado:", selectedPlan);
      console.log("Plan enum mapeado:", planEnum);
      console.log("Empresa ID:", state.empresa_id);
      console.log("Fecha fin:", fechaFin.toISOString());
      console.log("Datos completos a enviar:", suscripcionData);
      console.log("========================");

      // Llamar al servicio de suscripción
      const response = await createSubscription(suscripcionData);
      
      console.log("✅ Suscripción creada exitosamente:", response);
      
      setMessage({ text: "Plan seleccionado exitosamente. Redirigiendo al dashboard...", type: "success" });
      
      setTimeout(() => {
        navigate("/app", { replace: true });
      }, 1500);

    } catch (error) {
      console.error("Error al crear suscripción:", error);
      setMessage({ text: "Error al procesar la suscripción", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const getPlanDescription = (planId: string) => {
    switch (planId) {
      case "basico":
        return {
          title: "Plan Básico",
          subtitle: "Gratis por 30 días",
          features: [
            "Hasta 3 usuarios",
            "1000 transacciones/mes",
            "100GB almacenamiento",
            "Soporte por email",
          ]
        };
      case "profesional":
        return {
          title: "Plan Pro",
          subtitle: "$80/mes",
          features: [
            "Hasta 20 usuarios",
            "25,000 transacciones/mes",
            "300GB almacenamiento",
            "Soporte prioritario",
            "Reportes avanzados",
          ]
        };
      case "personalizado":
        return {
          title: "Plan Personalizado",
          subtitle: "$300/mes",
          features: [
            "Hasta 100 usuarios",
            "60,000 transacciones/mes",
            "1TB almacenamiento",
            "Soporte 24/7",
            "Integraciones personalizadas",
            "API dedicada",
          ]
        };
      default:
        return { title: "Plan", subtitle: "", features: [] };
    }
  };

  if (!state?.empresa_id) {
    return null; // Se redirigirá en el useEffect
  }

  return (
    <section className="auth-container">
      <div className="auth-box-modern" style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div className="auth-right" style={{ width: "100%" }}>
          <div className="auth-form-modern">
            <div style={{ textAlign: "center", marginBottom: "32px" }}>
              <h2>🎉 ¡Registro Exitoso!</h2>
              <p>Ahora selecciona el plan que mejor se adapte a tu empresa</p>
              {state.user && (
                <p style={{ color: "#6b7280", fontSize: "14px" }}>
                  Bienvenido, {state.user.nombre_completo || state.user.username}
                </p>
              )}
            </div>

            {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "32px" }}>
              {plans.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                const description = getPlanDescription(plan.id);
                const isBasic = plan.id === "basico";
                
                return (
                  <div
                    key={plan.id}
                    className={`plan-card ${isSelected ? "plan-card--selected" : ""}`}
                    onClick={() => handleSelectPlan(plan.id)}
                    style={{
                      border: isSelected ? "2px solid #3b82f6" : "1px solid #e2e8f0",
                      borderRadius: "12px",
                      padding: "24px",
                      cursor: "pointer",
                      backgroundColor: isSelected ? "#f8faff" : "#ffffff",
                      transition: "all 0.2s ease",
                      position: "relative",
                    }}
                  >
                    {isBasic && (
                      <div style={{
                        position: "absolute",
                        top: "-10px",
                        right: "16px",
                        backgroundColor: "#10b981",
                        color: "white",
                        padding: "4px 12px",
                        borderRadius: "16px",
                        fontSize: "12px",
                        fontWeight: "bold",
                      }}>
                        RECOMENDADO
                      </div>
                    )}
                    
                    <div style={{ textAlign: "center", marginBottom: "16px" }}>
                      <h3 style={{ margin: "0 0 8px", color: "#1f2937" }}>{description.title}</h3>
                      <div style={{ fontSize: "24px", fontWeight: "bold", color: isBasic ? "#10b981" : "#3b82f6" }}>
                        {description.subtitle}
                      </div>
                    </div>

                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {description.features.map((feature, index) => (
                        <li key={index} style={{ 
                          display: "flex", 
                          alignItems: "center", 
                          marginBottom: "8px",
                          fontSize: "14px",
                          color: "#6b7280"
                        }}>
                          <span style={{ color: "#10b981", marginRight: "8px" }}>✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>

                    {isSelected && (
                      <div style={{
                        marginTop: "16px",
                        textAlign: "center",
                        color: "#3b82f6",
                        fontWeight: "bold",
                        fontSize: "14px",
                      }}>
                        ✓ Seleccionado
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <button
                type="button"
                className="ui-btn ui-btn--ghost"
                onClick={() => navigate("/registro", { replace: true })}
              >
                Volver al registro
              </button>
              
              <button
                type="button"
                className="auth-button-modern"
                onClick={handleConfirmPlan}
                disabled={loading || !selectedPlan}
                style={{ minWidth: "160px" }}
              >
                {loading ? "Procesando..." : "Confirmar Plan"}
              </button>
            </div>

            {/* Botones de debug temporal */}
            <div style={{ marginTop: "20px", padding: "16px", backgroundColor: "#fef3c7", borderRadius: "8px" }}>
              <h4 style={{ margin: "0 0 12px", color: "#92400e" }}>🔧 Debug - Probar suscripciones</h4>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {["BASICO", "PREMIUM", "PERSONALIZADO"].map(plan => (
                  <button
                    key={plan}
                    onClick={async () => {
                      const testData = {
                        empresa: Number(state?.empresa_id || 1),
                        fecha_fin: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                        enum_plan: plan,
                        enum_estado: "ACTIVO"
                      };
                      console.log(`Probando suscripción con plan: ${plan}`, testData);
                      try {
                        const result = await createSubscription(testData);
                        console.log("✅ Éxito:", result);
                        alert(`✅ Suscripción creada con plan ${plan}`);
                      } catch (error: any) {
                        console.error("❌ Error:", error);
                        alert(`❌ Error con plan ${plan}: ${error.response?.data || error.message}`);
                      }
                    }}
                    style={{
                      padding: "6px 12px",
                      backgroundColor: "#3b82f6",
                      color: "white",
                      border: "none",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "12px"
                    }}
                  >
                    Test {plan}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "24px", fontSize: "14px", color: "#6b7280" }}>
              <p>
                Podrás cambiar tu plan en cualquier momento desde la configuración de tu cuenta.
              </p>
              <Link to="/planes" style={{ color: "#3b82f6" }}>
                Ver comparación detallada de planes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PlanSelectionPage;
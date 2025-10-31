import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/service";
import type { RegistrationForm, AdminUserData } from "./types";
import "../../styles/auth.css";
import "../../styles/landing.css";

import SubscriptionPanel from "../billing/subscriptionPanel";
import { listPlans } from "../billing/service";
import type { Plan, SuscripcionResponse } from "../billing/types";

/** Tipos locales */
type CreatedEmpresa = {
  empresa_id?: number;
  empresaInfo?: {
    razon_social: string;
    nombre_comercial: string;
  } | null;
  user?: AdminUserData | null;
};

type RegisterResponse = {
  success?: boolean;
  empresa_id?: number | string;
  message?: string;
  user?: AdminUserData | null;
};

function isRegisterResponse(obj: unknown): obj is RegisterResponse {
  if (!obj || typeof obj !== "object") return false;
  const o = obj as Record<string, unknown>;
  return (
    ("success" in o && typeof o.success === "boolean") ||
    "empresa_id" in o ||
    "message" in o
  );
}

const CompanyRegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { registerCompanyAndUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  const [form, setForm] = useState<RegistrationForm>({
    razon_social: "",
    email_contacto: "",
    nombre_comercial: "",
    imagen_url_empresa: "",
    username: "",
    password: "",
    confirm_password: "",
    first_name: "",
    last_name: "",
    email: "",
    imagen_url_perfil: "",
    selected_plan: "basico",
  });

  const [plans, setPlans] = useState<Plan[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(form.selected_plan || "basico");

  const [showSubscriptionModal, setShowSubscriptionModal] = useState(false);
  const [createdEmpresa, setCreatedEmpresa] = useState<CreatedEmpresa | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const list = await listPlans();
        if (mounted && Array.isArray(list)) {
          setPlans(list);
          if (!selectedPlanId && list.length > 0) setSelectedPlanId(list[0].id);
        }
      } catch (err) {
        console.warn("[landing] no se pudieron cargar planes:", err);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [selectedPlanId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    if (name === "email" && !form.username) {
      const usernameFromEmail = value.split("@")[0] || "";
      setForm(prev => ({ ...prev, username: usernameFromEmail }));
    }

    if (name === "nombre_comercial" && !form.razon_social) {
      setForm(prev => ({ ...prev, razon_social: value }));
    }

    if (name === "email" && !form.email_contacto) {
      setForm(prev => ({ ...prev, email_contacto: value }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: "imagen_url_empresa" | "imagen_url_perfil") => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = `https://ejemplo.com/uploads/${encodeURIComponent(file.name)}`;
      setForm(prev => ({ ...prev, [field]: fakeUrl }));
    }
  };

  const validateForm = (): string | null => {
    if (!form.nombre_comercial.trim()) return "El nombre comercial es requerido";
    if (!form.razon_social.trim()) return "La razón social es requerida";
    if (!form.email_contacto.trim()) return "El email de contacto es requerido";
    if (!form.first_name.trim()) return "El nombre del administrador es requerido";
    if (!form.last_name.trim()) return "El apellido del administrador es requerido";
    if (!form.email.trim()) return "El email del administrador es requerido";
    if (!form.username.trim()) return "El nombre de usuario es requerido";
    if (!form.password.trim()) return "La contraseña es requerida";
    if (form.password.length < 8) return "La contraseña debe tener al menos 8 caracteres";
    if (form.password !== form.confirm_password) return "Las contraseñas no coinciden";
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const validationError = validateForm();
      if (validationError) {
        setMessage({ text: validationError, type: "error" });
        setLoading(false);
        return;
      }

      const registrationData = {
        razon_social: form.razon_social,
        email_contacto: form.email_contacto,
        nombre_comercial: form.nombre_comercial,
        imagen_url_empresa: form.imagen_url_empresa || "",
        username: form.username,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        imagen_url_perfil: form.imagen_url_perfil || "",
        selected_plan: selectedPlanId || form.selected_plan,
      };

      const raw = await registerCompanyAndUser(registrationData);
      if (!isRegisterResponse(raw)) {
        setMessage({ text: "Respuesta inesperada del servidor.", type: "error" });
        setLoading(false);
        return;
      }

      const resp = raw as RegisterResponse;

      if (resp.success && resp.empresa_id !== undefined) {
        setCreatedEmpresa({
          empresa_id: Number(resp.empresa_id),
          empresaInfo: { razon_social: registrationData.razon_social, nombre_comercial: registrationData.nombre_comercial },
          user: resp.user ?? null,
        });
        setShowSubscriptionModal(true);
        setMessage({ text: "Empresa creada. Configure la suscripción en la ventana emergente.", type: "success" });
      } else {
        setMessage({ text: resp.message || "Error al registrar empresa", type: "error" });
      }
    } catch (error) {
      console.error("Error en registro:", error);
      setMessage({ text: "Error al registrar. Intente nuevamente.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionSuccess = (subscription: SuscripcionResponse) => {
    setShowSubscriptionModal(false);
    navigate("/planes-seleccion", {
      state: {
        empresa_id: createdEmpresa?.empresa_id,
        subscription,
        user: createdEmpresa?.user ?? undefined,
      },
      replace: true,
    });
  };

  return (
    <section className="auth-container" style={{ display: "flex", justifyContent: "center", padding: 24 }}>
      <div className="auth-box-modern" style={{ maxWidth: 1100, width: "100%", margin: "0 auto", display: "grid", gridTemplateColumns: "360px 1fr", gap: 24 }}>
        {/* Columna izquierda: planes */}
        <aside style={{ background: "var(--card-bg)", padding: 16, borderRadius: 8, border: "1px solid var(--border-color, #ddd)", height: "fit-content" }}>
          <h3 style={{ marginTop: 0 }}>Planes</h3>
          <div style={{ display: "grid", gap: 12 }}>
            {plans.length === 0 && <div style={{ color: "var(--muted, #999)" }}>Cargando planes...</div>}
            {plans.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedPlanId(p.id);
                  setForm(prev => ({ ...prev, selected_plan: p.id }));
                }}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: 12,
                  borderRadius: 8,
                  border: selectedPlanId === p.id ? "2px solid var(--accent, #3ab5ff)" : "1px solid var(--border-color, #ccc)",
                  background: selectedPlanId === p.id ? "rgba(58,181,255,0.04)" : "transparent",
                  cursor: "pointer",
                }}
              >
                <div>
                  <strong>{p.name}</strong>
                  <div style={{ fontSize: 12, color: "var(--muted, #999)" }}>{p.limits.maxUsers} usuarios · {p.limits.maxRequests} req/mes</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>${p.priceUsd}/mes</div>
                  <div style={{ fontSize: 12, color: "var(--muted, #999)" }}>USD</div>
                </div>
              </button>
            ))}
          </div>
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--muted, #999)" }}>
            Seleccione un plan. Tras registrar la empresa podrá confirmar la suscripción.
          </div>
        </aside>

        {/* Columna derecha: formulario */}
        <div className="auth-right" style={{ width: "100%" }}>
          <form className="auth-form-modern" onSubmit={handleSubmit} noValidate>
            <h2>Registro de Empresa</h2>
            <p>Complete los datos de su empresa y usuario administrador</p>

            {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

            <fieldset style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "6px", marginBottom: "16px" }}>
              <legend style={{ fontWeight: "bold", color: "#1f2937" }}>🏢 Datos de la Empresa</legend>
              
              <div className="input-group">
                <span className="input-icon">🏢</span>
                <input type="text" name="nombre_comercial" placeholder="Nombre comercial *" value={form.nombre_comercial} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <span className="input-icon">📄</span>
                <input type="text" name="razon_social" placeholder="Razón social *" value={form.razon_social} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <span className="input-icon">📧</span>
                <input type="email" name="email_contacto" placeholder="Email de contacto de la empresa *" value={form.email_contacto} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <span className="input-icon">🖼️</span>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "imagen_url_empresa")} style={{ display: "none" }} />
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>{form.imagen_url_empresa ? "Logo cargado ✓" : "Subir logo de la empresa"}</span>
                </label>
              </div>
            </fieldset>

            <fieldset style={{ border: "1px solid #e2e8f0", padding: "16px", borderRadius: "6px", marginBottom: "16px" }}>
              <legend style={{ fontWeight: "bold", color: "#1f2937" }}>👤 Usuario Administrador</legend>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <span className="input-icon">👤</span>
                  <input type="text" name="first_name" placeholder="Nombre *" value={form.first_name} onChange={handleChange} required />
                </div>

                <div className="input-group">
                  <span className="input-icon">👤</span>
                  <input type="text" name="last_name" placeholder="Apellido *" value={form.last_name} onChange={handleChange} required />
                </div>
              </div>

              <div className="input-group">
                <span className="input-icon">📧</span>
                <input type="email" name="email" placeholder="Email del administrador *" value={form.email} onChange={handleChange} required />
              </div>

              <div className="input-group">
                <span className="input-icon">🔑</span>
                <input type="text" name="username" placeholder="Nombre de usuario *" value={form.username} onChange={handleChange} required />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div className="input-group">
                  <span className="input-icon">🔒</span>
                  <input type="password" name="password" placeholder="Contraseña *" value={form.password} onChange={handleChange} required />
                </div>

                <div className="input-group">
                  <span className="input-icon">🔒</span>
                  <input type="password" name="confirm_password" placeholder="Confirmar contraseña *" value={form.confirm_password} onChange={handleChange} required />
                </div>
              </div>

              <div className="input-group">
                <span className="input-icon">🖼️</span>
                <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "imagen_url_perfil")} style={{ display: "none" }} />
                  <span style={{ color: "#6b7280", fontSize: "14px" }}>{form.imagen_url_perfil ? "Foto de perfil cargada ✓" : "Subir foto de perfil"}</span>
                </label>
              </div>
            </fieldset>

            <button type="submit" className="auth-button-modern" disabled={loading}>{loading ? "Registrando empresa..." : "Registrar Empresa"}</button>

            <div style={{ textAlign: "center", marginTop: "16px" }}>
              <span style={{ color: "#6b7280" }}>¿Ya tienes una cuenta? </span>
              <button type="button" className="link-button" onClick={() => navigate("/login")}>Iniciar sesión</button>
            </div>
          </form>
        </div>
      </div>

      {/* Modal: SubscriptionPanel para confirmar el plan y crear suscripción */}
      {showSubscriptionModal && createdEmpresa && (
        <SubscriptionPanel
          empresaId={createdEmpresa.empresa_id!}
          empresaInfo={createdEmpresa.empresaInfo!}
          selectedPlan={selectedPlanId}
          plans={plans}
          onSuccess={handleSubscriptionSuccess}
          onCancel={() => {
            setShowSubscriptionModal(false);
            navigate("/login");
          }}
          allowSkip={false}
        />
      )}
    </section>
  );
};

export default CompanyRegisterPage;
export { CompanyRegisterPage as CompanySignupPage };
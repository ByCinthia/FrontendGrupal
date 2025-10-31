import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/service";
import type { RegistrationForm, AdminUserData } from "./types";
import "../../styles/auth.css";
import "../../styles/landing.css";

import SubscriptionPanel from "../billing/subscriptionPanel";
import { listPlans } from "../billing/service";
import type { Plan, SuscripcionResponse } from "../billing/types";

/** Permitir que el host proporcione una función de subida opcional */
declare global {
  interface Window {
    uploadFile?: (file: File) => Promise<string>;
  }
}

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

/** Helper de subida: si existe window.uploadFile la usa; si no, simula una URL */
async function uploadImage(file: File): Promise<string> {
  if (typeof window.uploadFile === "function") {
    return await window.uploadFile(file);
  }
  // simulación simple (no bloqueante)
  return Promise.resolve(`https://cdn.example.com/uploads/${encodeURIComponent(file.name)}`);
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

  const [companyLogoFile, setCompanyLogoFile] = useState<File | null>(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState<string | null>(form.imagen_url_empresa || null);

  const [userAvatarFile, setUserAvatarFile] = useState<File | null>(null);
  const [userAvatarPreview, setUserAvatarPreview] = useState<string | null>(form.imagen_url_perfil || null);

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
  }, []); // cargar una sola vez

  // gestionar previews y archivos (empresa / usuario)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, target: "company" | "user") => {
    const file = e.target.files?.[0] ?? null;
    if (target === "company") {
      setCompanyLogoFile(file);
      if (file) {
        const url = URL.createObjectURL(file);
        setCompanyLogoPreview(url);
      } else {
        setCompanyLogoPreview(null);
      }
    } else {
      setUserAvatarFile(file);
      if (file) {
        const url = URL.createObjectURL(file);
        setUserAvatarPreview(url);
      } else {
        setUserAvatarPreview(null);
      }
    }
  };

  // liberar object URLs cuando cambian archivos / desmonta
  useEffect(() => {
    return () => {
      if (companyLogoPreview && companyLogoPreview.startsWith("blob:")) URL.revokeObjectURL(companyLogoPreview);
      if (userAvatarPreview && userAvatarPreview.startsWith("blob:")) URL.revokeObjectURL(userAvatarPreview);
    };
  }, [companyLogoPreview, userAvatarPreview]);

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

      // subir imágenes si hay archivos seleccionados
      let uploadedCompanyLogo = form.imagen_url_empresa || "";
      let uploadedUserAvatar = form.imagen_url_perfil || "";

      if (companyLogoFile) {
        try {
          uploadedCompanyLogo = await uploadImage(companyLogoFile);
        } catch (err) {
          console.warn("No se pudo subir logo de empresa:", err);
        }
      }

      if (userAvatarFile) {
        try {
          uploadedUserAvatar = await uploadImage(userAvatarFile);
        } catch (err) {
          console.warn("No se pudo subir avatar de usuario:", err);
        }
      }

      const registrationData = {
        razon_social: form.razon_social,
        email_contacto: form.email_contacto,
        nombre_comercial: form.nombre_comercial,
        imagen_url_empresa: uploadedCompanyLogo,
        username: form.username,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        imagen_url_perfil: uploadedUserAvatar,
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
    <section className="landing-hero">
      <div className="auth-box-modern" role="main">
        {/* Planes: usa estilos de landing.css (.plans-sidebar + .plan-sidebar-card) */}
        <aside className="plans-sidebar" aria-label="Seleccionar plan">
          <div className="plans-sidebar__header">
            <h3 className="plans-sidebar__title">Planes</h3>
            <p className="plans-sidebar__subtitle">Elige el plan que deseas iniciar para tu empresa.</p>
          </div>

          <div className="plans-sidebar__list" role="list">
            {plans.length === 0 && <div style={{ color: "var(--muted)" }}>Cargando planes…</div>}
            {plans.map(p => (
              <button
                key={p.id}
                type="button"
                role="listitem"
                aria-pressed={selectedPlanId === p.id}
                className={`plan-sidebar-card ${selectedPlanId === p.id ? "active" : ""} plan-sidebar-card--${p.id}`}
                onClick={() => {
                  setSelectedPlanId(p.id);
                  setForm(prev => ({ ...prev, selected_plan: p.id }));
                }}
              >
                <div className="plan-sidebar-card__header">
                  <div>
                    <span className="plan-sidebar-card__name">{p.name}</span>
                    <div className="plan-sidebar-card__price">${p.priceUsd}/mes</div>
                  </div>
                  <span className="plan-sidebar-card__badge">{p.limits.maxUsers} usuarios</span>
                </div>
                <ul className="plan-sidebar-card__features">
                  <li className="plan-sidebar-card__feature"><span className="plan-sidebar-card__feature-icon">•</span> {p.limits.maxRequests.toLocaleString()} req/mes</li>
                  {p.limits.maxStorageGB != null && <li className="plan-sidebar-card__feature"><span className="plan-sidebar-card__feature-icon">•</span> {p.limits.maxStorageGB} GB almacenamiento</li>}
                </ul>
              </button>
            ))}
          </div>

          <div className="plans-sidebar__footer" style={{ marginTop: 12 }}>
            <small className="muted">Tras crear la empresa podrás confirmar la suscripción.</small>
          </div>
        </aside>

        {/* Formulario: usa .auth-right */}
        <div className="auth-right" aria-label="Formulario de registro">
          <form onSubmit={handleSubmit} className="auth-form-modern" noValidate>
            <h2>Registro de Empresa</h2>
            <p style={{ color: "var(--muted)" }}>Complete los datos de su empresa y usuario administrador</p>

            {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

            <fieldset className="card" style={{ marginBottom: 16 }}>
              <legend>🏢 Datos de la Empresa</legend>

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
                <input type="email" name="email_contacto" placeholder="Email de contacto *" value={form.email_contacto} onChange={handleChange} required />
              </div>

              <div className="input-group" style={{ alignItems: "center", gap: 12 }}>
                <label className="ghost-btn" style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "company")} style={{ display: "none" }} />
                  <span>{companyLogoPreview ? "Cambiar logo" : "Subir logo de la empresa"}</span>
                </label>
                {companyLogoPreview && (
                  <img src={companyLogoPreview} alt="Logo empresa" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 8, border: "1px solid rgba(255,255,255,0.06)" }} />
                )}
              </div>
            </fieldset>

            <fieldset className="card" style={{ marginBottom: 16 }}>
              <legend>👤 Usuario Administrador</legend>

              <div className="register-grid">
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

              <div className="input-group" style={{ alignItems: "center", gap: 12 }}>
                <label className="ghost-btn" style={{ display: "inline-flex", gap: 8, alignItems: "center", cursor: "pointer" }}>
                  <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "user")} style={{ display: "none" }} />
                  <span>{userAvatarPreview ? "Cambiar foto" : "Subir foto de perfil"}</span>
                </label>
                {userAvatarPreview && (
                  <img src={userAvatarPreview} alt="Avatar usuario" style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 999, border: "1px solid rgba(255,255,255,0.06)" }} />
                )}
              </div>

              <div className="input-group">
                <span className="input-icon">🔑</span>
                <input type="text" name="username" placeholder="Nombre de usuario *" value={form.username} onChange={handleChange} required />
              </div>

              <div className="register-grid" style={{ marginTop: 8 }}>
                <div className="input-group">
                  <span className="input-icon">🔒</span>
                  <input type="password" name="password" placeholder="Contraseña *" value={form.password} onChange={handleChange} required />
                </div>

                <div className="input-group">
                  <span className="input-icon">🔒</span>
                  <input type="password" name="confirm_password" placeholder="Confirmar contraseña *" value={form.confirm_password} onChange={handleChange} required />
                </div>
              </div>
            </fieldset>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
              <button type="submit" className="ui-btn ui-btn--primary" disabled={loading}>
                {loading ? "Registrando empresa..." : "Registrar Empresa"}
              </button>
              <div style={{ textAlign: "right" }}>
                <small style={{ color: "var(--muted)" }}>¿Ya tienes una cuenta?</small>
                <div>
                  <button type="button" className="ui-btn ui-btn--ghost" onClick={() => navigate("/login")}>Iniciar sesión</button>
                </div>
              </div>
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
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/service";
import type { RegistrationForm, } from "./types";
import "../../styles/theme.css";
import "../../styles/landing.css";

// reemplazo: usar ConfirmationModal en lugar de SubscriptionPanel para confirmar + pago
import { ConfirmationModal } from "../billing/ConfirmationModal";
import { listPlans, createSuscripcion } from "../billing/service";
import type { Plan } from "../billing/types";

/** Permitir que el host proporcione una función de subida opcional */
declare global {
  interface Window {
    uploadFile?: (file: File) => Promise<string>;
  }
}

// Tipos para la respuesta esperada del backend
interface BackendEmpresa {
  id?: number | string;
  [k: string]: unknown;
}

interface BackendRegisterRaw {
  message?: string;
  empresa?: BackendEmpresa;
  data?: { empresa?: BackendEmpresa; [k: string]: unknown };
  empresa_id?: number | string;
  user?: unknown; // Cambiar de AdminUserData a unknown para evitar conflictos de tipos
  perfil_user?: unknown;
  token?: string;
  success?: boolean;
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

  // Modal de confirmación
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [preparedRegistrationData, setPreparedRegistrationData] = useState<Omit<RegistrationForm, "confirm_password"> | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const list = await listPlans();
        if (mounted && Array.isArray(list)) {
          setPlans(list);
          setSelectedPlanId(prev => prev || (list.length > 0 ? list[0].id : "basico"));
        }
      } catch (err) { console.warn(err); }
    }
    void load();
    return () => { mounted = false; };
  }, []);

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

  // FUNCIÓN 1: Solo validar y preparar datos para el modal (NO crear empresa)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage({ text: "", type: "" });

    // 1. Validar formulario
    const validationError = validateForm();
    if (validationError) {
      setMessage({ text: validationError, type: "error" });
      return;
    }

    setLoading(true);
    try {
      // 2. Subir imágenes (opcional, puede hacerse después)
      let uploadedCompanyLogo = form.imagen_url_empresa || "";
      let uploadedUserAvatar = form.imagen_url_perfil || "";

      if (companyLogoFile) {
        try {
          uploadedCompanyLogo = await uploadImage(companyLogoFile);
          console.log("[preparación] Logo empresa subido:", uploadedCompanyLogo);
        } catch (err) {
          console.warn("No se pudo subir logo de empresa:", err);
        }
      }

      if (userAvatarFile) {
        try {
          uploadedUserAvatar = await uploadImage(userAvatarFile);
          console.log("[preparación] Avatar usuario subido:", uploadedUserAvatar);
        } catch (err) {
          console.warn("No se pudo subir avatar de usuario:", err);
        }
      }

      // 3. Preparar datos para el modal (SIN crear empresa)
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

      console.log("[preparación] Datos preparados para confirmación:", registrationData);

      // 4. Mostrar modal de confirmación
      setPreparedRegistrationData(registrationData);
      setShowConfirmationModal(true);
      setMessage({ text: "Datos validados. Confirma en la siguiente ventana para crear la empresa.", type: "success" });
      
    } catch (err) {
      console.error("[preparación] Error:", err);
      setMessage({ text: "Error preparando los datos. Inténtalo de nuevo.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // FUNCIÓN 2: Crear empresa y suscripción SOLO al confirmar en el modal
  const handleConfirmRegistration = async (paymentData?: { cardNumber: string; expiryDate: string; cvv: string; cardName: string }) => {
    if (!preparedRegistrationData) {
      console.error("[confirmación] No hay datos preparados");
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      console.log("[confirmación] INICIANDO creación de empresa desde modal");
      
      // 1. Preparar payload para el backend
      const payload = {
        razon_social: String(preparedRegistrationData.razon_social || ""),
        email_contacto: String(preparedRegistrationData.email_contacto || ""),
        nombre_comercial: String(preparedRegistrationData.nombre_comercial || ""),
        imagen_url_empresa: String(preparedRegistrationData.imagen_url_empresa || ""),
        username: String(preparedRegistrationData.username || ""),
        password: String(preparedRegistrationData.password || ""),
        first_name: String(preparedRegistrationData.first_name || ""),
        last_name: String(preparedRegistrationData.last_name || ""),
        email: String(preparedRegistrationData.email || ""),
        imagen_url_perfil: String(preparedRegistrationData.imagen_url_perfil || ""),
      };

      // AÑADIR: Verificar que no hay campos vacíos problemáticos
      console.log("[confirmación] Tipos verificados:", Object.keys(payload).map(k => `${k}: ${typeof payload[k as keyof typeof payload]}`));
      console.log("[confirmación] Payload para crear empresa:", JSON.stringify(payload, null, 2));

      // 2. CREAR EMPRESA Y USUARIO (aquí sí se ejecuta el registro)
      const raw: BackendRegisterRaw = await registerCompanyAndUser(payload);
      console.log("[confirmación] Respuesta del backend:", raw);

      // Normalizar respuesta: backend devuelve { message, empresa: { id } , ... }
      if (!raw || typeof raw !== "object") {
        throw new Error("Respuesta inválida del servidor");
      }

      const empresaObj = raw.empresa ?? raw.data?.empresa ?? null;
      const empresaIdRaw = empresaObj?.id ?? raw.empresa_id ?? null;

      if (!empresaIdRaw) {
        // si backend devolvió sólo message/token, considerarlo éxito pero sin id -> error controlado
        throw new Error(raw.message || "No se recibió ID de empresa del servidor");
      }

      const empresaId = typeof empresaIdRaw === "string" ? parseInt(empresaIdRaw, 10) : Number(empresaIdRaw);
      if (isNaN(empresaId) || empresaId <= 0) {
        throw new Error(`empresa_id inválido recibido: ${empresaIdRaw}`);
      }

      console.log("[confirmación] ✅ Empresa creada exitosamente con ID:", empresaId);
      
      // Mostrar mensaje de éxito inmediatamente después de crear la empresa
      setMessage({ text: "¡Empresa registrada exitosamente! Configurando suscripción...", type: "success" });

      // 4. Procesar pago si es necesario
      if (paymentData) {
        console.log("[confirmación] Procesando pago:", paymentData);
        // TODO: Integrar con pasarela de pago real
      }

      // 5. Crear suscripción
      let sus = null;
      let suscripcionExitosa = false;
      try {
        console.log("[confirmación] Creando suscripción para plan:", selectedPlanId);
        
        const tipoPlan = selectedPlanId === "basico" ? "BASICO" : "PREMIUM";
        
        const fechaInicioDate = new Date();
        const fechaFinDate = new Date(fechaInicioDate);
        if (selectedPlanId === "basico") {
          fechaFinDate.setDate(fechaFinDate.getDate() + 30); // 30 días trial
        } else {
          fechaFinDate.setFullYear(fechaFinDate.getFullYear() + 1); // 1 año
        }

        const planObj = plans.find(p => p.id === selectedPlanId);
        const rawPrice = planObj?.priceUsd ?? 0;
        const monto = typeof rawPrice === 'string' ? parseFloat(rawPrice) : Number(rawPrice);

        const suscripcionPayload = {
          empresa: empresaId,
          tipo_plan: tipoPlan,
          fecha_inicio: fechaInicioDate.toISOString().split("T")[0],
          fecha_fin: fechaFinDate.toISOString().split("T")[0],
          monto: isNaN(monto) ? 0 : monto,
          estado: true,
          metodo_pago: paymentData ? "TARJETA" : "MANUAL",
        };

        console.log("[confirmación] Creando suscripción:", JSON.stringify(suscripcionPayload, null, 2));
        sus = await createSuscripcion(suscripcionPayload);
        console.log("[confirmación] ✅ Suscripción creada:", sus);
        suscripcionExitosa = true;

      } catch (subError) {
        console.error("[confirmación] Error creando suscripción:", subError);
        console.warn("[confirmación] Empresa creada pero suscripción falló. Continuando...");
        // No fallar todo por la suscripción - la empresa ya está creada
      }

      // 6. Éxito total
      setShowConfirmationModal(false);
      
      // Mensaje final según el resultado
      if (suscripcionExitosa) {
        setMessage({ text: "¡Empresa y suscripción registradas exitosamente!", type: "success" });
      } else {
        setMessage({ text: "¡Empresa registrada exitosamente! (Suscripción se configurará después)", type: "success" });
      }
      
      setTimeout(() => {
        navigate("/login", { 
          state: { 
            message: suscripcionExitosa 
              ? "Empresa y suscripción creadas exitosamente. Puede iniciar sesión." 
              : "Empresa creada exitosamente. Puede iniciar sesión.",
            empresa_id: empresaId 
          },
          replace: true 
        });
      }, 3000); // Más tiempo para leer el mensaje

    } catch (error: unknown) {
      console.error("[confirmación] Error:", error);
      
      // Manejo de errores de Axios mejorado
      interface AxiosError {
        response?: {
          data?: {
            errors?: Record<string, unknown>;
            message?: string;
            detail?: string;
            error?: string;
          };
          status?: number;
          statusText?: string;
        };
        message?: string;
      }
      
      const axiosError = error as AxiosError;
      const respData = axiosError?.response?.data;
      const status = axiosError?.response?.status;
      const statusText = axiosError?.response?.statusText;
      
      console.error("[confirmación] Detalles del error:", {
        status,
        statusText,
        data: respData,
        message: axiosError?.message
      });
      
      if (respData?.errors) {
        const errorParts: string[] = [];
        
        Object.entries(respData.errors).forEach(([field, msgs]) => {
          if (Array.isArray(msgs)) {
            errorParts.push(`${field}: ${msgs.join(", ")}`);
          }
        });
        
        setMessage({ text: errorParts.join(" | "), type: "error" });
        
        // Si hay error de username/email, cerrar modal para editar
        if (respData.errors.username || respData.errors.email) {
          if (respData.errors.username) {
            const suggestion = `${preparedRegistrationData.username}_${Math.floor(Math.random() * 9000 + 1000)}`;
            setForm(prev => ({ ...prev, username: suggestion }));
          }
          setShowConfirmationModal(false);
          setPreparedRegistrationData(null);
        }
        return;
      }
      
      // Manejo de errores 500 del servidor
      if (status === 500) {
        const serverError = respData?.error || respData?.message || "Error interno del servidor";
        setMessage({ 
          text: `Error del servidor (${status}): ${serverError}. Revisa los logs del backend.`, 
          type: "error" 
        });
        return;
      }
      
      // Otros errores HTTP
      if (status && status >= 400) {
        setMessage({ 
          text: `Error ${status}: ${statusText || "Error del servidor"}. ${respData?.message || ""}`, 
          type: "error" 
        });
        return;
      }
      
      const msg = respData?.message || respData?.detail || respData?.error || "Error del servidor";
      setMessage({ text: String(msg), type: "error" });
      
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="landing-hero">
      <div className="auth-box-modern" role="main">
        {/* Planes */}
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
            <small className="muted">Tras validar los datos podrás confirmar el registro.</small>
          </div>
        </aside>

        {/* Formulario */}
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
                {loading ? "Validando datos..." : "Validar y Continuar"}
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

      {/* Modal de confirmación - AQUÍ se crea la empresa */}
      {showConfirmationModal && preparedRegistrationData && (
        <ConfirmationModal
          companyData={{
            nombre: String(preparedRegistrationData.nombre_comercial ?? ""),
            email: String(preparedRegistrationData.email_contacto ?? ""),
            telefono: "",
            direccion: "",
            admin_nombre: String(preparedRegistrationData.first_name ?? ""),
            admin_email: String(preparedRegistrationData.email ?? ""),
          }}
          selectedPlan={plans.find(p => p.id === selectedPlanId)}
          isPaidPlan={selectedPlanId !== "basico"}
          onConfirm={(paymentData) => void handleConfirmRegistration(paymentData)}
          onCancel={() => setShowConfirmationModal(false)}
          loading={loading}
        />
      )}
    </section>
  );
};

export default CompanyRegisterPage;
export { CompanyRegisterPage as CompanySignupPage };

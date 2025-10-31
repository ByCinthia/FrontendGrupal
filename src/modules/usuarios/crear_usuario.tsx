// src/modules/usuarios/crear_usuario.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "./service";
import type { CreateUserPayload } from "./types";
import "../../styles/dashboard.css";

interface UserForm {
  // Campos exactos de auth_user (Django)
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  password?: string;
  is_staff: boolean;
  is_active: boolean;
  is_superuser: boolean;
  // date_joined y last_login se manejan automáticamente en Django
  
  // Campos adicionales (opcionales para perfil extendido)
  telefono?: string;
  cargo?: string;
  departamento?: string;
  fecha_ingreso?: string;
  user_permissions?: string[];
  avatar?: string;
}

const DEPARTAMENTOS = [
  "Comercial",
  "Finanzas", 
  "Recursos Humanos",
  "Tecnología",
  "Administración",
  "Operaciones"
];

const CARGOS = [
  "Gerente",
  "Supervisor", 
  "Analista",
  "Asistente",
  "Coordinador",
  "Especialista"
];

const CrearUsuarioPage: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  const [form, setForm] = useState<UserForm>({
    // Campos obligatorios Django auth_user
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "", // Opcional
    is_staff: false,
    is_active: true, // Por defecto activo
    is_superuser: false,
    
    // Campos adicionales opcionales
    telefono: "",
    cargo: "",
    departamento: "",
    fecha_ingreso: new Date().toISOString().split('T')[0],
    user_permissions: [],
    avatar: "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string>("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const finalValue = type === "checkbox" ? (e.target as HTMLInputElement).checked : value;
    
    setForm(prev => ({
      ...prev,
      [name]: finalValue
    }));

    // Auto-generar username desde email
    if (name === "email" && value.includes("@")) {
      const username = value.split("@")[0];
      setForm(prev => ({
        ...prev,
        username: prev.username || username
      }));
    }
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setAvatarPreview(result);
        setForm(prev => ({ ...prev, avatar: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        // Campos obligatorios de Django auth_user
        return !!(form.username && form.first_name && form.last_name && form.email);
      case 2:
        return true; // Campos adicionales son opcionales
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 2));
    } else {
      setMessage({ text: "Por favor complete todos los campos obligatorios", type: "error" });
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(1)) {
      setMessage({ text: "Por favor complete todos los campos obligatorios", type: "error" });
      return;
    }

    setLoading(true);

    try {
      // Preparar payload con estructura exacta de Django auth_user
      const userData: CreateUserPayload = {
        // Campos obligatorios auth_user
        username: form.username.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        is_staff: form.is_staff,
        is_active: form.is_active,
        is_superuser: form.is_superuser,
        password: form.password?.trim() || undefined, // Si está vacío, el backend genera una
        
        // Campos adicionales opcionales
        telefono: form.telefono?.trim(),
        cargo: form.cargo,
        departamento: form.departamento,
        fecha_ingreso: form.fecha_ingreso,
        user_permissions: form.user_permissions || [],
        avatar: form.avatar,
      };

      console.log("🚀 Creando usuario con datos:", userData);

      const newUser = await createUser(userData);
      
      console.log("✅ Usuario creado:", newUser);

      // Registrar en auditoría
      const logEntry = {
        id: Date.now().toString(),
        action: "user_created",
        user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
        timestamp: new Date().toISOString(),
        details: `Usuario creado: ${newUser.first_name} ${newUser.last_name} (${newUser.email})`
      };
      
      const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
      localStorage.setItem("audit_logs", JSON.stringify([logEntry, ...existingLogs]));

      setMessage({ 
        text: `Usuario "${newUser.first_name} ${newUser.last_name}" creado exitosamente${newUser.message ? ` (${newUser.message})` : ""}`, 
        type: "success" 
      });
      
      setTimeout(() => {
        navigate("/app/usuarios");
      }, 2500);

    } catch (error) {
      console.error("❌ Error creando usuario:", error);
      setMessage({ 
        text: "Error al crear el usuario. Revise los datos e intente nuevamente.", 
        type: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page">
      <div className="ui-page__header">
        <h1 className="ui-title">👤 Crear Nuevo Usuario</h1>
        <p className="ui-page__description">
          Complete la información del nuevo usuario 
        </p>
      </div>
      
      {/* Progress Steps */}
      <div style={{ 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        marginBottom: "32px",
        gap: "24px"
      }}>
        {[1, 2].map((step) => (
          <div key={step} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <div style={{
              width: "40px",
              height: "40px",
              borderRadius: "50%",
              backgroundColor: step <= currentStep ? "#3b82f6" : "#1e293b",
              color: step <= currentStep ? "white" : "#6b7280",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "16px",
              border: `1px solid ${step <= currentStep ? "#3b82f6" : "rgba(148,163,184,.16)"}`,
            }}>
              {step < currentStep ? "✓" : step}
            </div>
            <span style={{ 
              color: step <= currentStep ? "#3b82f6" : "#6b7280",
              fontWeight: step === currentStep ? "bold" : "normal"
            }}>
              {step === 1 && "Información Básica (auth_user)"}
              {step === 2 && "Información Adicional"}
            </span>
            {step < 2 && (
              <div style={{
                width: "60px",
                height: "2px",
                backgroundColor: step < currentStep ? "#3b82f6" : "rgba(148,163,184,.16)",
                marginLeft: "16px"
              }} />
            )}
          </div>
        ))}
      </div>

      {message.text && (
        <div className={`ui-alert ui-alert--${message.type === "success" ? "success" : "danger"}`} style={{ marginBottom: "24px" }}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="ui-form">
        <div className="card card--data" style={{ maxWidth: "800px", margin: "0 auto", padding: "24px" }}>
          
          {/* Paso 1: Campos de Django auth_user */}
          {currentStep === 1 && (
            <div className="ui-form__section">
              <h3 className="ui-form__section-title">
                🏗️ Campos  (Obligatorios)
              </h3>
              
              <div className="ui-alert ui-alert--info">
                📋 Estos campos corresponden exactamente a la tabla auth_user 
              </div>

              <div className="ui-form__row">
                <div className="ui-form__field">
                  <label className="ui-label">Username * (username)</label>
                  <input
                    className="ui-input"
                    type="text"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Ej: juan.perez"
                    required
                  />
                  <small className="ui-meta">Debe ser único en el sistema</small>
                </div>

                <div className="ui-form__field">
                  <label className="ui-label">Email * (email)</label>
                  <input
                    className="ui-input"
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="Ej: juan.perez@empresa.com"
                    required
                  />
                </div>
              </div>

              <div className="ui-form__row">
                <div className="ui-form__field">
                  <label className="ui-label">Nombre * (first_name)</label>
                  <input
                    className="ui-input"
                    type="text"
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Ej: Juan Carlos"
                    required
                  />
                </div>

                <div className="ui-form__field">
                  <label className="ui-label">Apellido * (last_name)</label>
                  <input
                    className="ui-input"
                    type="text"
                    name="last_name"
                    value={form.last_name}
                    onChange={handleChange}
                    placeholder="Ej: Pérez González"
                    required
                  />
                </div>
              </div>

              <div className="ui-form__row">
                <div className="ui-form__field">
                  <label className="ui-label">Contraseña (password)</label>
                  <input
                    className="ui-input"
                    type="password"
                    name="password"
                    value={form.password || ""}
                    onChange={handleChange}
                    placeholder="Dejar vacío para generar automáticamente"
                  />
                  <small className="ui-meta"> </small>
                </div>

                <div className="ui-form__field">
                  <label className="ui-label">Estado de la cuenta</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
                    <label className="ui-checkbox">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleChange}
                      />
                      <span className="ui-badge ui-badge--success">✅ Usuario activo (is_active)</span>
                    </label>

                    <label className="ui-checkbox">
                      <input
                        type="checkbox"
                        name="is_staff"
                        checked={form.is_staff}
                        onChange={handleChange}
                      />
                      <span className="ui-badge ui-badge--info">👤 Es staff - puede acceder al admin (is_staff)</span>
                    </label>

                    <label className="ui-checkbox">
                      <input
                        type="checkbox"
                        name="is_superuser"
                        checked={form.is_superuser}
                        onChange={handleChange}
                      />
                      <span className="ui-badge ui-badge--warning">👑 Es superusuario - todos los permisos (is_superuser)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="ui-alert ui-alert--warning">
                <h4 style={{ margin: "0 0 8px 0" }}>ℹ️ Información importante:</h4>
                <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "14px" }}>
                  <li><strong>date_joined:</strong> Se establece automáticamente al crear el usuario</li>
                  <li><strong>last_login:</strong> Se actualiza automáticamente en el primer login</li>
                  <li><strong>id:</strong> Se genera automáticamente (auto-increment)</li>
                </ul>
              </div>
            </div>
          )}

          {/* Paso 2: Campos adicionales */}
          {currentStep === 2 && (
            <div className="ui-form__section">
              <h3 className="ui-form__section-title">
                📝 Información Adicional (Opcional)
              </h3>
              
              <div className="ui-alert ui-alert--success">
                🔧 Estos campos pueden manejarse en un modelo extendido o perfil de usuario
              </div>

              {/* Avatar */}
              <div style={{ textAlign: "center", marginBottom: "24px" }}>
                <div style={{ 
                  width: "120px", 
                  height: "120px", 
                  borderRadius: "50%", 
                  margin: "0 auto 16px",
                  background: "#1e293b",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                  border: "3px solid rgba(148,163,184,.16)"
                }}>
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <span style={{ fontSize: "48px", color: "#6b7280" }}>👤</span>
                  )}
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  style={{ display: "none" }}
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload" className="ui-btn ui-btn--ghost">
                  📷 Seleccionar Foto
                </label>
              </div>

              <div className="ui-form__row">
                <div className="ui-form__field">
                  <label className="ui-label">Teléfono</label>
                  <input
                    className="ui-input"
                    type="tel"
                    name="telefono"
                    value={form.telefono || ""}
                    onChange={handleChange}
                    placeholder="Ej: +591 70123456"
                  />
                </div>

                <div className="ui-form__field">
                  <label className="ui-label">Fecha de Ingreso</label>
                  <input
                    className="ui-input"
                    type="date"
                    name="fecha_ingreso"
                    value={form.fecha_ingreso || ""}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="ui-form__row">
                <div className="ui-form__field">
                  <label className="ui-label">Cargo</label>
                  <select
                    className="ui-select"
                    name="cargo"
                    value={form.cargo || ""}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar cargo</option>
                    {CARGOS.map(cargo => (
                      <option key={cargo} value={cargo}>{cargo}</option>
                    ))}
                  </select>
                </div>

                <div className="ui-form__field">
                  <label className="ui-label">Departamento</label>
                  <select
                    className="ui-select"
                    name="departamento"
                    value={form.departamento || ""}
                    onChange={handleChange}
                  >
                    <option value="">Seleccionar departamento</option>
                    {DEPARTAMENTOS.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="ui-form__actions">
            {currentStep > 1 && (
              <button 
                type="button" 
                onClick={prevStep}
                className="ui-btn ui-btn--ghost"
              >
                ← Anterior
              </button>
            )}

            <button 
              type="button" 
              onClick={() => navigate("/app/usuarios")}
              className="ui-btn ui-btn--ghost"
            >
              Cancelar
            </button>
            
            {currentStep < 2 ? (
              <button 
                type="button" 
                onClick={nextStep}
                className="ui-btn ui-btn--primary"
                disabled={!validateStep(currentStep)}
              >
                Siguiente →
              </button>
            ) : (
              <button 
                type="submit" 
                className="ui-btn ui-btn--primary"
                disabled={loading}
              >
                {loading ? "⏳ Creando..." : "✅ Crear Usuario"}
              </button>
            )}
          </div>
        </div>
      </form>
    </section>
  );
};

export default CrearUsuarioPage;
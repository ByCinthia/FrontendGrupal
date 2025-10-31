// src/modules/usuarios/crear_usuario.tsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createUser } from "./service";
import type { CreateUserPayload } from "./types";
import { useAuth } from "../auth/service";
import { http } from "../../shared/api/client";
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
  // Campos adicionales
  telefono?: string;
  cargo?: string;
  departamento?: string;
  fecha_ingreso?: string;
  grupo_id?: number | string;
  permisos?: string[];
  avatar?: string;
}

interface Grupo {
  id: number;
  name: string;
  description?: string;
  empresa_id?: number;
}

interface Permiso {
  id: string;
  name: string;
  description: string;
  categoria: string;
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

// Permisos predefinidos por categoría
const PERMISOS_PREDEFINIDOS: Permiso[] = [
  // Usuarios
  { id: "user.read", name: "Ver usuarios", description: "Puede ver la lista de usuarios", categoria: "Usuarios" },
  { id: "user.create", name: "Crear usuarios", description: "Puede crear nuevos usuarios", categoria: "Usuarios" },
  { id: "user.edit", name: "Editar usuarios", description: "Puede modificar información de usuarios", categoria: "Usuarios" },
  { id: "user.delete", name: "Eliminar usuarios", description: "Puede eliminar usuarios", categoria: "Usuarios" },
  { id: "user.toggle", name: "Activar/Desactivar usuarios", description: "Puede cambiar el estado de usuarios", categoria: "Usuarios" },
  
  // Finanzas
  { id: "finance.read", name: "Ver finanzas", description: "Puede ver información financiera", categoria: "Finanzas" },
  { id: "finance.create", name: "Crear transacciones", description: "Puede crear nuevas transacciones", categoria: "Finanzas" },
  { id: "finance.edit", name: "Editar finanzas", description: "Puede modificar información financiera", categoria: "Finanzas" },
  { id: "finance.approve", name: "Aprobar transacciones", description: "Puede aprobar transacciones financieras", categoria: "Finanzas" },
  
  // Reportes
  { id: "reports.read", name: "Ver reportes", description: "Puede ver reportes del sistema", categoria: "Reportes" },
  { id: "reports.export", name: "Exportar reportes", description: "Puede exportar reportes", categoria: "Reportes" },
  { id: "reports.create", name: "Crear reportes", description: "Puede crear reportes personalizados", categoria: "Reportes" },
  
  // Configuración
  { id: "config.read", name: "Ver configuración", description: "Puede ver configuración del sistema", categoria: "Configuración" },
  { id: "config.edit", name: "Editar configuración", description: "Puede modificar configuración", categoria: "Configuración" },
  { id: "personalization.edit", name: "Personalizar sistema", description: "Puede cambiar temas, logos, etc.", categoria: "Configuración" },
];

const CrearUsuarioPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [grupos, setGrupos] = useState<Grupo[]>([]);
  const [loadingGrupos, setLoadingGrupos] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  const [form, setForm] = useState<UserForm>({
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    is_staff: false,
    is_active: true,
    telefono: "",
    cargo: "",
    departamento: "",
    fecha_ingreso: new Date().toISOString().split('T')[0],
    grupo_id: undefined, // <- cambiar de "" a undefined para evitar union string
    permisos: [],
    avatar: "",
  });

  const [avatarPreview, setAvatarPreview] = useState<string>("");

  // Verificar permisos al cargar
  useEffect(() => {
    const isAdmin = user?.roles?.includes("admin");
    const isSuperAdmin = user?.roles?.includes("superadmin");
    
    if (!isAdmin && !isSuperAdmin) {
      navigate("/app");
      return;
    }

    // Solo los administradores de empresa pueden crear usuarios (no superadmin en este módulo)
    if (!user?.empresa_id && !isSuperAdmin) {
      navigate("/app");
      return;
    }

    loadGrupos();
  }, [user, navigate]);

  const loadGrupos = async () => {
    setLoadingGrupos(true);
    try {
      // Cargar grupos de la empresa del usuario actual
      const response = await http.get<Grupo[]>("/api/User/group/", {
        params: { empresa_id: user?.empresa_id }
      });
      setGrupos(response.data || []);
    } catch (error) {
      console.warn("Error cargando grupos, usando localStorage:", error);
      
      // Fallback: cargar desde localStorage
      const stored = localStorage.getItem("mock.groups");
      const localGrupos: Grupo[] = stored ? JSON.parse(stored) : [];
      
      // Filtrar grupos por empresa si es necesario
      const gruposFiltrados = user?.empresa_id 
        ? localGrupos.filter(g => g.empresa_id === user.empresa_id || !g.empresa_id)
        : localGrupos;
      
      setGrupos(gruposFiltrados);
    } finally {
      setLoadingGrupos(false);
    }
  };

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

  const handlePermisoChange = (permisoId: string, checked: boolean) => {
    setForm(prev => ({
      ...prev,
      permisos: checked 
        ? [...(prev.permisos || []), permisoId]
        : (prev.permisos || []).filter(p => p !== permisoId)
    }));
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
        return !!(form.username && form.first_name && form.last_name && form.email);
      case 2:
        return true; // Campos adicionales son opcionales
      case 3:
        return true; // Permisos son opcionales
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 3));
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
      // normalizar grupo_id y empresa_id a number | undefined
      const grupoId: number | undefined =
        form.grupo_id === undefined || form.grupo_id === null || form.grupo_id === ""
          ? undefined
          : Number(form.grupo_id);

      const empresaId: number | undefined =
        user?.empresa_id === undefined || user?.empresa_id === null || user?.empresa_id === ""
          ? undefined
          : Number(user?.empresa_id);

      const userData: CreateUserPayload = {
        username: form.username.trim(),
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        is_staff: form.is_staff,
        is_active: form.is_active,
        is_superuser: false,
        password: form.password?.trim() || undefined,

        telefono: form.telefono?.trim(),
        cargo: form.cargo,
        departamento: form.departamento,
        fecha_ingreso: form.fecha_ingreso,
        user_permissions: form.permisos || [],
        avatar: form.avatar,

        grupo_id: grupoId,
        empresa_id: empresaId,
      };

      console.log("🚀 Creando usuario para empresa:", empresaId, userData);

      const newUser = await createUser(userData);
      
      console.log("✅ Usuario creado:", newUser);

      // Registrar en auditoría
      const logEntry = {
        id: Date.now().toString(),
        action: "user_created",
        user: user?.email || "administrador",
        timestamp: new Date().toISOString(),
        details: `Usuario creado: ${newUser.first_name} ${newUser.last_name} (${newUser.email}) para empresa ${user?.empresa_nombre || user?.empresa_id}`,
        empresa_id: user?.empresa_id
      };
      
      const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
      localStorage.setItem("audit_logs", JSON.stringify([logEntry, ...existingLogs]));

      setMessage({ 
        text: `Usuario "${newUser.first_name} ${newUser.last_name}" creado exitosamente para ${user?.empresa_nombre || 'su empresa'}`, 
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

  // Agrupar permisos por categoría
  const permisosPorCategoria = PERMISOS_PREDEFINIDOS.reduce((acc, permiso) => {
    if (!acc[permiso.categoria]) {
      acc[permiso.categoria] = [];
    }
    acc[permiso.categoria].push(permiso);
    return acc;
  }, {} as Record<string, Permiso[]>);

  return (
    <section className="page">
      <div className="ui-page__header">
        <h1 className="ui-title">👤 Crear Usuario - {user?.empresa_nombre}</h1>
        <p className="ui-page__description">
          Complete la información del nuevo usuario para su empresa
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
        {[1, 2, 3].map((step) => (
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
              {step === 1 && "Información Básica"}
              {step === 2 && "Información Adicional"}
              {step === 3 && "Roles y Permisos"}
            </span>
            {step < 3 && (
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
          
          {/* Paso 1: Información Básica */}
          {currentStep === 1 && (
            <div className="ui-form__section">
              <h3 className="ui-form__section-title">
                🏗️ Información Básica
              </h3>
              
              <div className="ui-alert ui-alert--info">
                📋 El usuario será creado para la empresa: <strong>{user?.empresa_nombre}</strong>
              </div>

              <div className="ui-form__row">
                <div className="ui-form__field">
                  <label className="ui-label">Username *</label>
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
                  <label className="ui-label">Email *</label>
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
                  <label className="ui-label">Nombre *</label>
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
                  <label className="ui-label">Apellido *</label>
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
                  <label className="ui-label">Contraseña</label>
                  <input
                    className="ui-input"
                    type="password"
                    name="password"
                    value={form.password || ""}
                    onChange={handleChange}
                    placeholder="Dejar vacío para generar automáticamente"
                  />
                  <small className="ui-meta">Se enviará por email al usuario</small>
                </div>

                <div className="ui-form__field">
                  <label className="ui-label">Estado</label>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", paddingTop: "8px" }}>
                    <label className="ui-checkbox">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={form.is_active}
                        onChange={handleChange}
                      />
                      <span className="ui-badge ui-badge--success">✅ Usuario activo</span>
                    </label>

                    <label className="ui-checkbox">
                      <input
                        type="checkbox"
                        name="is_staff"
                        checked={form.is_staff}
                        onChange={handleChange}
                      />
                      <span className="ui-badge ui-badge--info">👤 Puede acceder al panel de administración</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Paso 2: Información Adicional */}
          {currentStep === 2 && (
            <div className="ui-form__section">
              <h3 className="ui-form__section-title">
                📝 Información Adicional
              </h3>

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

          {/* Paso 3: Roles y Permisos */}
          {currentStep === 3 && (
            <div className="ui-form__section">
              <h3 className="ui-form__section-title">
                🔐 Roles y Permisos
              </h3>

              {/* Grupo/Rol */}
              <div className="ui-form__field" style={{ marginBottom: "24px" }}>
                <label className="ui-label">Grupo/Rol</label>
                <select
                  className="ui-select"
                  name="grupo_id"
                  value={form.grupo_id || ""}
                  onChange={handleChange}
                  disabled={loadingGrupos}
                >
                  <option value="">Sin grupo asignado</option>
                  {grupos.map(grupo => (
                    <option key={grupo.id} value={grupo.id}>
                      {grupo.name} {grupo.description && `- ${grupo.description}`}
                    </option>
                  ))}
                </select>
                {loadingGrupos && <small className="ui-meta">Cargando grupos...</small>}
                <div style={{ marginTop: "8px" }}>
                  <button 
                    type="button" 
                    className="ui-btn ui-btn--ghost"
                    onClick={() => navigate("/app/crear-grupo")}
                  >
                    ➕ Crear nuevo grupo
                  </button>
                </div>
              </div>

              {/* Permisos Individuales */}
              <div>
                <h4 style={{ marginBottom: "16px", color: "#e6eef8" }}>Permisos Específicos</h4>
                <div className="ui-alert ui-alert--info" style={{ marginBottom: "16px" }}>
                  💡 Seleccione los permisos específicos que tendrá este usuario. Los permisos del grupo se aplicarán automáticamente.
                </div>
                
                {Object.entries(permisosPorCategoria).map(([categoria, permisos]) => (
                  <div key={categoria} style={{ marginBottom: "24px" }}>
                    <h5 style={{ 
                      marginBottom: "12px", 
                      color: "#3b82f6",
                      fontSize: "14px",
                      fontWeight: "600",
                      borderBottom: "1px solid rgba(148,163,184,.16)",
                      paddingBottom: "4px"
                    }}>
                      {categoria}
                    </h5>
                    <div style={{ 
                      display: "grid", 
                      gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", 
                      gap: "8px" 
                    }}>
                      {permisos.map(permiso => (
                        <label key={permiso.id} className="ui-checkbox" style={{ 
                          padding: "8px", 
                          background: "rgba(255,255,255,0.02)",
                          borderRadius: "6px",
                          border: "1px solid rgba(148,163,184,.08)"
                        }}>
                          <input
                            type="checkbox"
                            checked={form.permisos?.includes(permiso.id) || false}
                            onChange={(e) => handlePermisoChange(permiso.id, e.target.checked)}
                          />
                          <div>
                            <span style={{ fontWeight: "500", color: "#e6eef8" }}>{permiso.name}</span>
                            <small style={{ display: "block", color: "#94a3b8", fontSize: "12px" }}>
                              {permiso.description}
                            </small>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
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
            
            {currentStep < 3 ? (
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
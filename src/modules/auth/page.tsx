// src/modules/auth/page.tsx
import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./service";
import "../../styles/login.css";

const AuthPage: React.FC = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const getRedirect = () => {
    const params = new URLSearchParams(location.search);
    return params.get("redirect") || "/app";
  };

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "" | "success" | "error" }>({ text: "", type: "" });
  const [remember, setRemember] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [loginData, setLoginData] = useState<{ email: string; password: string }>({
    email: "",
    password: ""
  });

  const normalizeEmail = (s: string) => s.trim().toLowerCase();

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target as HTMLInputElement & { name: "email" | "password" };
    setLoginData((s) => ({ ...s, [name]: value }));
  };

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: "", type: "" });
    
    try {
      const email = normalizeEmail(loginData.email);
      const password = loginData.password;
      
      if (!email) {
        setMessage({ text: "Por favor ingrese su email.", type: "error" });
        return;
      }
      
      if (!password) {
        setMessage({ text: "Por favor ingrese su contraseña.", type: "error" });
        return;
      }
      
      console.log("Intentando login con:", { email, password: "***" });
      
      const res = await login(email, password);
      
      console.log("Resultado del login:", res);
      
      setMessage({ text: res.message, type: res.success ? "success" : "error" });
      
      if (res.success) {
        console.log("Login exitoso, redirigiendo a:", getRedirect());
        setTimeout(() => {
          navigate(getRedirect(), { replace: true });
        }, 1000);
      }
    } catch (error) {
      console.error("Error en handleLogin:", error);
      setMessage({ text: "No se pudo iniciar sesión. Intente nuevamente.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  // Funciones para llenar credenciales demo
  const fillSuperAdminCredentials = () => {
    setLoginData({ email: "admin@plataforma.com", password: "superadmin123" });
  };

  const fillCompanyAdminCredentials = () => {
    setLoginData({ email: "vagner@gmail.com", password: "ssssssssssssss" });
  };

  const companyRegisterUrl = `/registro-empresa?from=auth&redirect=${encodeURIComponent(getRedirect())}`;

  // Usa una URL directa a una imagen. Reemplaza por la tuya si quieres.
  const illustrationUrl = "https://www.stelorder.com/wp-content/uploads/2024/04/gestion_empresarial_2.jpg";

  return (
    <div className="auth-container">
      <div className="auth-box-modern">
        <div className="auth-left">
          <div className="auth-image" style={{ backgroundImage: `url("${illustrationUrl}")` }} />
          <div className="overlay-content">
          
          </div>
        </div>

        <div className="auth-right">
          {/* Mostrar si ya está logueado */}
          {user && (
            <div style={{
              background: "#f0f9ff",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "16px",
              border: "1px solid #0ea5e9",
              textAlign: "center"
            }}>
              <p style={{ margin: "0 0 8px 0", color: "#0369a1", fontSize: "14px" }}>
                ✅ Ya estás logueado como: <strong>{user.nombre_completo || user.email}</strong>
              </p>
              {user.empresa_nombre && (
                <p style={{ margin: "0 0 8px 0", color: "#0369a1", fontSize: "12px" }}>
                  🏢 Empresa: {user.empresa_nombre}
                </p>
              )}
              <p style={{ margin: "0", color: "#0369a1", fontSize: "12px" }}>
                🔑 Rol: {user.roles?.includes("superadmin") ? "Super Administrador" : "Admin de Empresa"}
              </p>
            </div>
          )}

          <form className="auth-form-modern" onSubmit={handleLogin} noValidate>
            <h2>Iniciar Sesión</h2>
            <p>Ingrese sus credenciales para acceder al sistema</p>

            {/* Panel de credenciales demo mejorado */}
            <div style={{
              background: "#fffbeb",
              padding: "12px",
              borderRadius: "6px",
              marginBottom: "16px",
              border: "1px solid #f59e0b"
            }}>
              <p style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#92400e", fontWeight: "bold" }}>
                🔧 Credenciales de prueba:
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={fillSuperAdminCredentials}
                  style={{
                    padding: "4px 8px",
                    fontSize: "11px",
                    backgroundColor: "#dc2626",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  👑 Super Admin
                </button>
                <button
                  type="button"
                  onClick={fillCompanyAdminCredentials}
                  style={{
                    padding: "4px 8px",
                    fontSize: "11px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  🏢 Admin Empresa
                </button>
                <button
                  type="button"
                  onClick={() => setLoginData({ email: "", password: "" })}
                  style={{
                    padding: "4px 8px",
                    fontSize: "11px",
                    backgroundColor: "#6b7280",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer"
                  }}
                >
                  🧹 Limpiar
                </button>
              </div>
              <div style={{ fontSize: "11px", color: "#92400e", marginTop: "6px" }}>
                <div>👑 Super Admin: Ve todas las empresas | 🏢 Admin Empresa: Solo su empresa</div>
              </div>
            </div>

            {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

            <div className="input-group">
              <span className="input-icon">📧</span>
              <input
                type="email"
                name="email"
                placeholder="Correo electrónico"
                value={loginData.email}
                onChange={handleLoginChange}
                required
                autoComplete="email"
              />
            </div>

            <div className="input-group">
              <span
                className="input-icon"
                role="button"
                aria-label="mostrar/ocultar"
                onClick={() => setShowPassword(v => !v)}
              >
                {showPassword ? "🙈" : "🔒"}
              </span>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Contraseña"
                value={loginData.password}
                onChange={handleLoginChange}
                required
                autoComplete="current-password"
              />
            </div>

            <div className="auth-row">
              <label className="remember">
                <input type="checkbox" checked={remember} onChange={(e) => setRemember(e.target.checked)} />
                Recordarme en este dispositivo
              </label>
              <a className="forgot-password" href="/recuperar-contraseña">¿Olvidaste tu contraseña?</a>
            </div>

            <button type="submit" className="auth-button-modern" disabled={loading}>
              {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
            </button>

            <div
              aria-hidden
              style={{
                margin: "12px 0 10px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                color: "#94a3b8",
                fontSize: 12,
              }}
            >
              <span style={{ flex: 1, height: 1, background: "rgba(148,163,184,.25)" }} />
              <span>o</span>
              <span style={{ flex: 1, height: 1, background: "rgba(148,163,184,.25)" }} />
            </div>

            <button
              type="button"
              className="auth-button-modern"
              onClick={() => navigate(companyRegisterUrl)}
            >
              Crear nueva empresa
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;

// === Tipos del dominio (app) ===

// Credenciales
export type LoginInput = {
  email: string;
  password: string;
};

export type RegisterInput = {
  username: string;
  email: string;
  password: string;
  name: string;
  telefono_ref: string;
  email_empresarial: string;
  nombre_completo: string;
  direccion: string;
  telefono: string;
};

/** Roles globales (no requieren tenant) */
export type GlobalRole = "superadmin" | "platform_admin" | "admin" | "user";

/** Roles dentro de una empresa (tenant) */
export type TenantRole =
  | "administrador"
  | "gerente"
  | "vendedor"
  | "contador"
  | "almacenista";

/** Mapa: tenantId -> rol dentro de ese tenant */
export type OrgRolesMap = Record<string, TenantRole>;

/**
 * Usuario autenticado en la app.
 * IMPORTANTE: Diferenciamos entre superadmin y admin de empresa:
 * - superadmin: puede acceder a todas las empresas, no tiene empresa_id
 * - admin de empresa: solo accede a su empresa, tiene empresa_id obligatorio
 */
export type AuthUser = {
  id: number | string;
  username?: string;
  email?: string;
  nombre_completo?: string;

  // Roles y permisos
  roles?: (string | GlobalRole)[];
  org_roles?: OrgRolesMap;
  
  // Empresa asociada (null para superadmin, requerido para admin de empresa)
  empresa_id?: number | string | null;
  empresa_nombre?: string;
  
  // Tenant ID (compat)
  tenant_id?: string | number | null;
  permissions?: string[]; // p. ej. ["*"] para superadmin
};

export type AuthResponse = {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;

  // opcionales del backend
  permissions?: string[];
  empresa_id?: number | string | null;
  tenant_id?: string | number | null;
};

// === DTOs del backend ===

export type UserDTO = {
  id: number | string;
  username?: string;
  email?: string;
  nombre_completo?: string;

  // Meta de Django/backend
  is_superuser?: boolean;
  is_staff?: boolean;

  // Empresa asociada
  empresa_id?: number | string | null;
  empresa_nombre?: string;

  // Opcional si ya lo expones
  global_roles?: GlobalRole[];
  org_roles?: OrgRolesMap;
  tenant_id?: string | number | null;
};

export type LoginDTO = {
  message?: string;
  token: string;
  user: UserDTO;
  empresa_id?: number | string | null;
  permissions?: string[];
};

export type RegisterDTO = {
  message?: string;
  token: string;
  user: UserDTO;
};

export type ProfileDTO = {
  message?: string;
  user: UserDTO;
};

// === Tipo del contexto de Auth ===

export type AuthCtx = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResponse>;
  register: (payload: RegisterInput) => Promise<AuthResponse>;
  registerCompanyAndUser: (payload: {
    razon_social: string;
    email_contacto: string;
    nombre_comercial: string;
    imagen_url_empresa: string;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
    email: string;
    imagen_url_perfil: string;
  }) => Promise<AuthResponse & { empresa_id?: number }>;
  logout: () => Promise<void>;
  // Helper para verificar permisos
  isSuperAdmin: () => boolean;
  isCompanyAdmin: () => boolean;
  canAccessAllCompanies: () => boolean;
  getCompanyScope: () => number | string | null;
};


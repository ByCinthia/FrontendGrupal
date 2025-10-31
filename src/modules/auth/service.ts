// src/modules/auth/service.ts
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { http } from "../../shared/api/client";
import { isAxiosError } from "axios";

import type {
  AuthUser,
  AuthResponse,
  LoginInput,
  RegisterInput,
  UserDTO,
  RegisterDTO,
  ProfileDTO,
  AuthCtx,
  GlobalRole,
} from "./types";

/* ========= helpers ========= */

/** Deriva roles globales basado en permisos y empresa */
function deriveGlobalRoles(u: UserDTO): GlobalRole[] {
  const explicit = u.global_roles as GlobalRole[] | undefined;
  if (Array.isArray(explicit) && explicit.length) return explicit;
  
  // Si es superuser y NO tiene empresa, es superadmin global
  if (u.is_superuser && !u.empresa_id) return ["superadmin", "platform_admin"];
  
  // Si es staff (pero tiene empresa), es admin de esa empresa
  if (u.is_staff && u.empresa_id) return ["admin"];
  
  return ["user"];
}

/** Convierte un UserDTO del backend a AuthUser del dominio */
function mapUser(u: UserDTO): AuthUser {
  const roles = deriveGlobalRoles(u);
  
  return {
    id: u.id,
    username: u.username,
    email: u.email,
    nombre_completo: u.nombre_completo,
    roles,
    org_roles: u.org_roles || {},
    empresa_id: u.empresa_id,
    empresa_nombre: u.empresa_nombre,
    tenant_id: u.tenant_id ?? u.empresa_id, // compat
    permissions: roles.includes("superadmin") ? ["*"] : undefined,
  };
}

/** Guarda token, usuario y metadatos con empresa_id */
export async function persistSession(token: string, user: AuthUser): Promise<void> {
  try {
    console.log("💾 Guardando sesión:", { token: token.substring(0, 10) + "...", user: user.email });
    
    localStorage.setItem("auth.token", token);
    localStorage.setItem("auth.me", JSON.stringify(user));
    
    // Guardar empresa_id para filtros
    if (user.empresa_id) {
      localStorage.setItem("auth.empresa_id", String(user.empresa_id));
    } else {
      localStorage.removeItem("auth.empresa_id"); // superadmin no tiene empresa
    }
    
    // Guardar permisos
    if (user.permissions) {
      localStorage.setItem("auth.permissions", JSON.stringify(user.permissions));
    }
    
    // Compat
    if (user.tenant_id) {
      localStorage.setItem("auth.tenant_id", String(user.tenant_id));
    }
    
    // Objeto auth completo
    localStorage.setItem("auth", JSON.stringify({
      token,
      user,
      empresa_id: user.empresa_id,
      tenant_id: user.tenant_id
    }));
    
    console.log("✅ Sesión guardada exitosamente");
  } catch (error) {
    console.error("Error al persistir sesión:", error);
  }
}

/** Limpia sesión completamente */
function clearSession() {
  localStorage.removeItem("auth.token");
  localStorage.removeItem("auth.me");
  localStorage.removeItem("auth.permissions");
  localStorage.removeItem("auth.tenant_id");
  localStorage.removeItem("auth.empresa_id");
  localStorage.removeItem("auth");
}

/** Extrae mensaje de error de la respuesta */
function extractApiMessage(data: unknown): string | undefined {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const o = data as Record<string, unknown>;
    const candidates = [o.message, o.detail, o.error];
    const hit = candidates.find((v) => typeof v === "string" && (v as string).trim());
    return hit as string | undefined;
  }
  return undefined;
}

/** Mensaje de error amigable */
export function humanizeError(e: unknown, fallback = "Error desconocido"): string {
  if (isAxiosError(e)) {
    if (e.code === "ERR_NETWORK") return "No se pudo conectar con el servidor.";
    const msgFromPayload = extractApiMessage(e.response?.data);
    const base = (msgFromPayload ?? e.message ?? "").trim();
    return base || fallback;
  }
  if (e instanceof Error) {
    return (e.message ?? "").trim() || fallback;
  }
  return fallback;
}

// Helper para extraer response.data de errores
function extractAxiosResponseData(err: unknown): unknown | null {
  if (!err || typeof err !== "object") return null;
  const e = err as Record<string, unknown>;
  const response = e.response as Record<string, unknown> | undefined;
  if (!response) return null;
  return response.data ?? null;
}

/* ========= USUARIOS DEMO ========= */

// Superadmin (acceso global, sin empresa)
const SUPER_ADMIN_USER: AuthUser = {
  id: "superadmin_1",
  username: "superadmin",
  email: "admin@plataforma.com",
  nombre_completo: "Super Administrador",
  roles: ["superadmin", "platform_admin"],
  permissions: ["*"],
  empresa_id: null, // Sin empresa = acceso global
  empresa_nombre: undefined,
  tenant_id: null,
};

// Admin de empresa (acceso limitado a su empresa)
const COMPANY_ADMIN_USER: AuthUser = {
  id: "admin_empresa_1",
  username: "vagner",
  email: "vagner@gmail.com",
  nombre_completo: "Vagner Merlin",
  roles: ["admin"],
  empresa_id: 1,
  empresa_nombre: "Empresa Demo S.A.",
  tenant_id: "1",
};

const DEMO_CREDENTIALS = {
  superadmin: { email: "admin@plataforma.com", password: "superadmin123" },
  company_admin: { email: "vagner@gmail.com", password: "sssssssssssssssssssss" }
};

/* ========= API ========= */

export async function apiLogin(payload: LoginInput): Promise<AuthResponse> {
  try {
    console.log('[AUTH] 📤 Enviando login:', { email: payload.email, password: '***' });
    
    // Modo demo: verificar credenciales específicas
    if (payload.email === DEMO_CREDENTIALS.superadmin.email && payload.password === DEMO_CREDENTIALS.superadmin.password) {
      return {
        success: true,
        message: "Login exitoso como Superadmin (modo demo)",
        token: "demo-superadmin-token",
        user: SUPER_ADMIN_USER,
      };
    }
    
    if (payload.email === DEMO_CREDENTIALS.company_admin.email && payload.password === DEMO_CREDENTIALS.company_admin.password) {
      return {
        success: true,
        message: "Login exitoso como Admin de Empresa (modo demo)",
        token: "demo-company-admin-token",
        user: COMPANY_ADMIN_USER,
      };
    }

    // Endpoint real de login
    const { data } = await http.post("/api/auth/login/", payload, {
      headers: { Authorization: "" },
    });

    console.log('[AUTH] ✅ Respuesta del backend:', data);

    const token = typeof data?.token === "string" ? data.token : undefined;
    if (!token) {
      throw new Error("El servidor no devolvió un token válido");
    }

    // Construir UserDTO con datos de empresa
    const userDto: UserDTO = {
      id: data?.user?.id ?? data?.user_id ?? -1,
      username: data?.user?.username ?? data?.username,
      email: data?.user?.email ?? data?.email ?? payload.email,
      nombre_completo: data?.user?.nombre_completo ?? data?.nombre_completo,
      is_superuser: data?.user?.is_superuser ?? data?.is_superuser ?? false,
      is_staff: data?.user?.is_staff ?? data?.is_staff ?? false,
      empresa_id: data?.empresa_id ?? data?.user?.empresa_id,
      empresa_nombre: data?.empresa_nombre ?? data?.user?.empresa_nombre,
      tenant_id: data?.empresa_id ?? null,
      global_roles: data?.user?.global_roles as GlobalRole[] | undefined,
      org_roles: parseOrgRoles(data?.user?.org_roles ?? data?.org_roles),
    };

    const authUser = mapUser(userDto);

    // VALIDACIÓN: Verificar que el usuario pertenezca a una empresa (excepto superadmin)
    if (!authUser.roles?.includes("superadmin") && !authUser.empresa_id) {
      throw new Error("Este usuario no está asociado a ninguna empresa. Contacte al administrador.");
    }

    // Persistir sesión
    await persistSession(token, authUser);

    return {
      success: true,
      message: data?.message ?? "Login exitoso",
      token,
      user: authUser,
      empresa_id: authUser.empresa_id,
    };

  } catch (error) {
    console.error('[AUTH] ❌ Error en login:', error);
    
    const respData = extractAxiosResponseData(error);
    if (respData) {
      console.error("❌ Backend response:", respData);
      
      if (respData && typeof respData === "object") {
        const obj = respData as Record<string, unknown>;
        
        // Errores específicos de validación
        if (obj.email && Array.isArray(obj.email)) {
          throw new Error(`Error en email: ${obj.email[0]}`);
        }
        if (obj.password && Array.isArray(obj.password)) {
          throw new Error(`Error en password: ${obj.password[0]}`);
        }
        if (obj.detail) {
          throw new Error(String(obj.detail));
        }
        if (obj.message) {
          throw new Error(String(obj.message));
        }
        if (obj.error) {
          throw new Error(String(obj.error));
        }
      }
    }
    
    throw error;
  }
}

export async function apiRegister(payload: RegisterInput): Promise<AuthResponse> {
  const { data } = await http.post<RegisterDTO>("/api/register/", payload, {
    headers: { Authorization: "" },
  });
  return {
    success: true,
    message: data.message ?? "OK",
    token: data.token,
    user: mapUser(data.user),
  };
}

// Nueva función para registrar empresa y usuario
export async function apiRegisterCompanyAndUser(payload: {
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
}): Promise<AuthResponse & { empresa_id?: number }> {
  try {
    console.log("Enviando solicitud a /api/register/empresa-user/ con payload:", payload);
    
    const { data } = await http.post<{
      token: string;
      user: UserDTO;
      empresa_id: number;
      message?: string;
    }>("/api/register/empresa-user/", payload, {
      headers: { Authorization: "" },
    });
    
    console.log("Respuesta recibida del backend:", data);
    
    // Asegurar que el usuario registrado tenga empresa_id
    const userDto: UserDTO = {
      ...data.user,
      empresa_id: data.empresa_id,
      is_staff: true, // Asegura que es staff
      global_roles: ["admin"], // Usar global_roles en lugar de roles
      permissions: ["*"], // Da todos los permisos dentro de su empresa
    };
    
    const result = {
      success: true,
      message: data.message ?? "Registro exitoso",
      token: data.token,
      user: mapUser(userDto),
      empresa_id: data.empresa_id,
    };

    return result;
  } catch (error) {
    console.error("Error en apiRegisterCompanyAndUser:", error);
    throw error;
  }
}

export async function apiMe(): Promise<AuthResponse> {
  const token = localStorage.getItem("auth.token");
  
  // Modos demo
  if (token === "demo-superadmin-token") {
    return {
      success: true,
      message: "Profile OK (superadmin demo)",
      user: SUPER_ADMIN_USER,
      empresa_id: null,
    };
  }
  
  if (token === "demo-company-admin-token") {
    return {
      success: true,
      message: "Profile OK (company admin demo)",
      user: COMPANY_ADMIN_USER,
      empresa_id: COMPANY_ADMIN_USER.empresa_id,
    };
  }

  try {
    const { data } = await http.get<ProfileDTO>("/api/profile/");
    const authUser = mapUser(data.user);
    
    return {
      success: true,
      message: data.message ?? "OK",
      user: authUser,
      empresa_id: authUser.empresa_id,
    };
  } catch (error) {
    // Fallback para tokens demo
    if (token === "demo-superadmin-token") {
      return {
        success: true,
        message: "Profile OK (superadmin fallback)",
        user: SUPER_ADMIN_USER,
        empresa_id: null,
      };
    }
    if (token === "demo-company-admin-token") {
      return {
        success: true,
        message: "Profile OK (company admin fallback)",
        user: COMPANY_ADMIN_USER,
        empresa_id: COMPANY_ADMIN_USER.empresa_id,
      };
    }
    throw error;
  }
}

export async function apiLogout(): Promise<void> {
  try {
    const token = localStorage.getItem("auth.token");
    await http.post("/api/auth/logout/", { token }, { headers: { Authorization: "" } });
  } catch (err) {
    console.warn("Error en logout (backend):", err);
  } finally {
    clearSession();
  }
}

/* ========= Contexto con helpers de permisos ========= */
const Ctx = createContext<AuthCtx | undefined>(undefined);

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar: refrescar perfil si hay token
  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("auth.token");
        if (!token) return;
        const me = await apiMe();
        if (me.user) {
          setUser(me.user);
          await persistSession(token, me.user);
        }
      } catch {
        clearSession();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
      const res = await apiLogin({ email, password });
      if (res.success && res.token && res.user) {
        await persistSession(res.token, res.user);
        setUser(res.user);
      }
      return res;
    } catch (e) {
      const msg = humanizeError(e, "No se pudo iniciar sesión.");
      return { success: false, message: msg };
    }
  };

  const register = async (payload: RegisterInput): Promise<AuthResponse> => {
    try {
      const res = await apiRegister(payload);
      if (res.success && res.token && res.user) {
        await persistSession(res.token, res.user);
        setUser(res.user);
      }
      return res;
    } catch (e) {
      const msg = humanizeError(e, "No se pudo registrar.");
      return { success: false, message: msg };
    }
  };

  const registerCompanyAndUser = async (payload: {
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
  }): Promise<AuthResponse & { empresa_id?: number }> => {
    try {
      console.log("Llamando a apiRegisterCompanyAndUser con:", payload);
      const res = await apiRegisterCompanyAndUser(payload);
      console.log("Respuesta de apiRegisterCompanyAndUser:", res);
      if (res.success && res.token && res.user) {
        await persistSession(res.token, res.user);
        setUser(res.user);
      }
      return res;
    } catch (e) {
      console.error("Error en registerCompanyAndUser:", e);
      const msg = humanizeError(e, "No se pudo registrar la empresa.");
      return { success: false, message: msg };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      const token = localStorage.getItem("auth.token");
      console.log("🚪 Cerrando sesión con token:", token ? token.substring(0, 10) + "..." : "sin token");
      
      if (token) {
        console.log("Enviando logout con token al endpoint /api/auth/logout/");
        await apiLogout();
      }
      
      console.log("✅ Logout exitoso");
    } finally {
      setUser(null);
      if (typeof window !== "undefined") {
        window.location.replace("/");
      }
    }
  };

  // Helpers de permisos
  const isSuperAdmin = (): boolean => {
    return user?.roles?.includes("superadmin") ?? false;
  };

  const isCompanyAdmin = (): boolean => {
    return (user?.roles?.includes("admin") ?? false) && !!user?.empresa_id;
  };

  const canAccessAllCompanies = (): boolean => {
    return isSuperAdmin();
  };

  const getCompanyScope = (): number | string | null => {
    return isSuperAdmin() ? null : user?.empresa_id ?? null;
  };

  const hasCompanyAccess = (empresaId: number | string): boolean => {
    if (isSuperAdmin()) return true;
    return String(user?.empresa_id) === String(empresaId);
  };

  const switchCompany = async (empresaId: number | string): Promise<void> => {
    if (!isSuperAdmin()) {
      throw new Error("Solo el superadmin puede cambiar de empresa");
    }
    
    try {
      // Aquí podrías hacer una llamada al backend para cambiar contexto
      // await http.post("/api/switch-company/", { empresa_id: empresaId });
      
      // Por ahora, solo actualizar localStorage
      localStorage.setItem("auth.current_company_id", String(empresaId));
      
      // Recargar la página para aplicar cambios
      window.location.reload();
    } catch (error) {
      console.error("Error cambiando de empresa:", error);
      throw error;
    }
  };

  const value = useMemo<AuthCtx>(
    () => ({ 
      user, 
      loading, 
      login, 
      register, 
      registerCompanyAndUser, 
      logout,
      isSuperAdmin,
      isCompanyAdmin,
      canAccessAllCompanies,
      getCompanyScope,
      hasCompanyAccess,
      switchCompany: isSuperAdmin() ? switchCompany : undefined
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading]
  );

  return React.createElement(Ctx.Provider, { value }, children as React.ReactNode);
};

export const useAuth = (): AuthCtx => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
  return ctx;
};

// Normaliza org_roles del backend
function parseOrgRoles(raw: unknown): import("./types").OrgRolesMap | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const obj = raw as Record<string, unknown>;
  const out: import("./types").OrgRolesMap = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v !== "string") continue;
    const s = v.toLowerCase();
    if (s.includes("admin")) out[k] = "administrador";
    else if (s.includes("geren") || s.includes("manager")) out[k] = "gerente";
    else if (s.includes("cont")) out[k] = "contador";
    else if (s.includes("almac") || s.includes("store") || s.includes("stock")) out[k] = "almacenista";
    else out[k] = "vendedor";
  }
  return Object.keys(out).length ? out : undefined;
}

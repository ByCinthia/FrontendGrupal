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
  TenantRole,
  OrgRolesMap,
} from "./types";

/* ========= helpers ========= */

/** Deriva roles globales basado en permisos y empresa */
function deriveGlobalRoles(u: UserDTO): GlobalRole[] {
  const explicit = u.global_roles as GlobalRole[] | undefined;
  if (Array.isArray(explicit) && explicit.length) return explicit;
  
  console.log('🔍 [deriveGlobalRoles] Datos:', {
    is_superuser: u.is_superuser,
    is_staff: u.is_staff,
    empresa_id: u.empresa_id,
  });
  
  // Superuser SIN empresa => superadmin de plataforma (acceso global)
  if (u.is_superuser && !u.empresa_id) {
    console.log('✅ Rol: superadmin (acceso a todas las empresas)');
    return ["superadmin", "platform_admin"];
  }
  
  // Staff CON empresa => admin de esa empresa específica
  if (u.is_staff && u.empresa_id) {
    console.log('✅ Rol: admin (administrador de empresa)');
    return ["admin"];
  }
  
  // Usuario normal: tiene empresa pero NO es staff
  console.log('✅ Rol: user (usuario regular)');
  return ["user"];
}

/** Convierte un UserDTO del backend a AuthUser del dominio */
function mapUser(u: UserDTO): AuthUser {
  const roles = deriveGlobalRoles(u);
  
  // Permisos: superadmin => global "*", admin (empresa) => permisos limitados a la empresa
  const permissions = roles.includes("superadmin")
    ? ["*"]
    : roles.includes("admin")
    ? ["company:*"] // permiso especial para admins de empresa
    : undefined;
  
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
    permissions,
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

/** Parsea org_roles desde respuesta del backend */
function parseOrgRoles(raw: unknown): OrgRolesMap {
  if (!raw || typeof raw !== "object") return {};
  const parsed = raw as Record<string, unknown>;
  const result: OrgRolesMap = {};

  const allowed: TenantRole[] = [
    "administrador",
    "gerente",
    "vendedor",
    "contador",
    "almacenista",
  ];
  const allowedSet = new Set(allowed);

  for (const [key, val] of Object.entries(parsed)) {
    let candidate: string | undefined;
    if (typeof val === "string") candidate = val;
    else if (Array.isArray(val) && val.length > 0 && typeof val[0] === "string") candidate = val[0];

    if (candidate && allowedSet.has(candidate as TenantRole)) {
      result[key] = candidate as TenantRole;
    }
    // Si no es válido, omitimos la entrada (evita asignar valores no permitidos)
  }
  return result;
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
  const data = response?.data ?? null;
  return data;
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
    const { data } = await http.post<unknown>("/api/auth/login/", payload, {
      headers: { Authorization: "" },
    });

    console.log('[AUTH] ✅ Respuesta del backend:', data);
    
    // Normalizar respuesta sin usar `any` y parsear org_roles si existe
    const resp = (data && typeof data === "object") ? (data as Record<string, unknown>) : {};
    
    const rawUserObj =
      resp && "user" in resp && typeof resp.user === "object"
        ? (resp.user as Record<string, unknown>)
        : (resp as Record<string, unknown>);
    
    const getString = (o: Record<string, unknown>, k: string) =>
      typeof o[k] === "string" ? (o[k] as string) : undefined;
    const getNumber = (o: Record<string, unknown>, k: string) => {
      if (typeof o[k] === "number") return o[k] as number;
      if (typeof o[k] === "string" && o[k] !== "" && !Number.isNaN(Number(o[k]))) return Number(o[k]);
      return undefined;
    };
    const getBoolean = (o: Record<string, unknown>, k: string) =>
      typeof o[k] === "boolean" ? (o[k] as boolean) : undefined;
    const getUnknown = (o: Record<string, unknown>, k: string) => o[k];
    
    const userDto: UserDTO = {
      id: (getNumber(rawUserObj, "id") ?? getNumber(rawUserObj, "user_id") ?? getString(rawUserObj, "id") ?? getString(rawUserObj, "user_id")) as unknown as string | number,
      username: getString(rawUserObj, "username") ?? getString(rawUserObj, "email") ?? "",
      email: getString(rawUserObj, "email") ?? "",
      nombre_completo: getString(rawUserObj, "nombre_completo") ?? undefined,
      is_superuser: getBoolean(rawUserObj, "is_superuser") ?? false,
      is_staff: getBoolean(rawUserObj, "is_staff") ?? false,
      empresa_id: getNumber(rawUserObj, "empresa_id") ?? getString(rawUserObj, "empresa_id") ?? undefined,
      empresa_nombre: getString(rawUserObj, "empresa_nombre") ?? undefined,
      tenant_id: getNumber(rawUserObj, "tenant_id") ?? getString(rawUserObj, "tenant_id") ?? undefined,
      org_roles: parseOrgRoles(getUnknown(rawUserObj, "org_roles")),
      global_roles: undefined,
    };
    
    // Mapea a AuthUser usando mapUser (reutiliza lógica existente)
    const mappedUser = mapUser(userDto);
    
    // Si backend envía un role explícito en la raíz, respetarlo y añadir roles en el mapeo
    const explicitRole = getString(rawUserObj, "role") ?? getString(resp, "role");
    if (explicitRole === "superadmin" && !mappedUser.roles?.includes("superadmin")) {
      mappedUser.roles = [...(mappedUser.roles ?? []), "superadmin"];
    } else if (explicitRole === "company_admin" && !mappedUser.roles?.includes("admin")) {
      mappedUser.roles = [...(mappedUser.roles ?? []), "admin"];
    }
    
    // Persistir sesión si hay token
    const tokenVal = getString(resp, "token") ?? undefined;
    if (tokenVal) {
      await persistSession(tokenVal, mappedUser);
    }
    
    return {
      success: true,
      message: getString(resp, "message") ?? "OK",
      token: tokenVal,
      user: mappedUser,
    };
  } catch (error) {
    console.error("[AUTH] ❌ Error en login:", error);
    
    // Narrow error con isAxiosError (type guard)
    if (isAxiosError(error)) {
      const respData = extractAxiosResponseData(error);
      console.error("❌ Backend response RAW:", JSON.stringify(respData, null, 2));
    
      if (respData && typeof respData === "object") {
        const obj = respData as Record<string, unknown>;
    
        const isStringArray = (v: unknown): v is string[] =>
          Array.isArray(v) && v.every((x) => typeof x === "string");
    
        if (isStringArray(obj.email)) {
          throw new Error(`Error en email: ${obj.email[0]}`);
        }
        if (isStringArray(obj.password)) {
          throw new Error(`Error en password: ${obj.password[0]}`);
        }
        if (isStringArray(obj.non_field_errors)) {
          throw new Error(`Error: ${obj.non_field_errors[0]}`);
        }
        if (typeof obj.detail === "string") {
          throw new Error(obj.detail);
        }
        if (typeof obj.message === "string") {
          throw new Error(obj.message);
        }
        if (typeof obj.error === "string") {
          throw new Error(obj.error);
        }
      }
    
      // fallback a mensaje extraído o al message de axios
      const fallback = extractApiMessage(respData) ?? error.message ?? "Error en la petición";
      throw new Error(String(fallback));
    }
    
    // No es AxiosError: propagar o convertir a Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("Error desconocido");
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

// Tipo explícito para el payload de registro de empresa + usuario
type CompanyRegisterPayload = {
  razon_social: string;
  email_contacto: string;
  nombre_comercial?: string;
  imagen_url_empresa?: string;
  username?: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  imagen_url_perfil?: string;
};

// Nueva función para registrar empresa y usuario (sin `any`)
export async function apiRegisterCompanyAndUser(
  payload: CompanyRegisterPayload
): Promise<AuthResponse & { empresa_id?: number }> {
  console.log("[auth] calling apiRegisterCompanyAndUser", payload);
  const res = await http.post("/api/register/empresa-user/", payload);
  console.log("[auth] register response", res?.data);

  // Forzar flags en cliente si backend no los devuelve
  const userDto = {
    ...(res.data?.user || {}),
    is_staff: res.data?.user?.is_staff ?? true, // forzar true como fallback
    empresa_id: res.data?.empresa_id ?? res.data?.user?.empresa_id ?? undefined,
    empresa_nombre: res.data?.empresa_nombre ?? res.data?.user?.empresa_nombre ?? undefined,
  } as UserDTO;
  
  // Mapear a AuthUser y asegurar role 'admin' para este usuario
  const createdAuthUser = mapUser(userDto);
  if (!createdAuthUser.roles?.includes("admin")) {
    createdAuthUser.roles = [...(createdAuthUser.roles ?? []), "admin"];
  }
  // Dar permisos de admin de empresa (local) para que la UI los trate como administradores
  createdAuthUser.permissions = createdAuthUser.permissions ?? ["company:*"];

  // Persistir en mock.users para que la UI local lo muestre como admin
  try {
    const stored = JSON.parse(localStorage.getItem("mock.users") || "[]");
    const mock = {
      id: createdAuthUser.id ?? Date.now(),
      username: createdAuthUser.username,
      email: createdAuthUser.email,
      is_staff: true,
      is_active: true,
      empresa_id: createdAuthUser.empresa_id,
      user_permissions: createdAuthUser.permissions ?? [],
      date_joined: new Date().toISOString(),
    };
    localStorage.setItem("mock.users", JSON.stringify([mock, ...stored]));
    console.log("[auth] mock.users updated", mock);
  } catch (e) {
    console.warn("[auth] cannot persist mock user", e);
  }

  return { ...res.data, user: createdAuthUser, empresa_id: createdAuthUser.empresa_id };
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
        if (!token) {
          setLoading(false);
          return;
        }
        const me = await apiMe();
        if (me?.user) {
          setUser(me.user as AuthUser);
        } else {
          clearSession();
          setUser(null);
        }
      } catch (e) {
        console.warn("[auth] fallo al recuperar perfil:", e);
        clearSession();
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (payload: LoginInput) => {
    const res = await apiLogin(payload);
    if (res.token && res.user) {
      await persistSession(res.token, res.user);
      setUser(res.user);
    }
    return res;
  };

  const logout = async () => {
    try {
      await apiLogout();
    } catch (e) {
      console.warn("[auth] error en logout:", e);
    } finally {
      clearSession();
      setUser(null);
    }
  };

  const register = async (payload: RegisterInput) => {
    const res = await apiRegister(payload);
    if (res.token && res.user) {
      await persistSession(res.token, res.user);
      setUser(res.user);
    }
    return res;
  };

  const registerCompanyAndUser = async (payload: unknown) => {
    const res = await apiRegisterCompanyAndUser(payload as CompanyRegisterPayload);
    if (res.token && res.user) {
      await persistSession(res.token, res.user as AuthUser);
      setUser(res.user as AuthUser);
    }
    return res;
  };

  const ctxValue: AuthCtx = useMemo(
    () => ({
      user,
      loading,
      login: (email: string, password: string) => login({ email, password }),
      logout,
      register: (payload: RegisterInput) => register(payload),
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
      }) => registerCompanyAndUser(payload),
      isSuperAdmin: () => !!user?.roles?.includes("superadmin"),
      isCompanyAdmin: () => !!user?.roles?.includes("admin") && !!user?.empresa_id,
      canAccessAllCompanies: () => !!user?.roles?.includes("superadmin") || !!user?.permissions?.includes("*"),
      getCompanyScope: () => user?.empresa_id ?? null,
      hasCompanyAccess: (empresaId: number | string | null | undefined) => {
        if (!empresaId) return false;
        // Superadmin tiene acceso a todas
        if (user?.roles?.includes("superadmin")) return true;
        // Mismo empresa_id
        return String(user?.empresa_id) === String(empresaId);
      },
    }),
    [user, loading]
  );

  return React.createElement(Ctx.Provider, { value: ctxValue }, children);
};

export function useAuth(): AuthCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

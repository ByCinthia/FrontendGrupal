import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from "axios";
import { API_CONFIG, STORAGE_KEYS } from "./client";

/**
 * Tipos para requests/responses mock
 */
interface MockRequest {
  email?: string;
  username?: string;
  password?: string;
  admin_email?: string;
  admin_name?: string;
  company_name?: string;
  domain?: string;
  slug?: string;
  tenant_id?: string;
  [key: string]: unknown;
}

interface MockAuthPayload {
  token: string;
  user: {
    id: string;
    email?: string;
    username?: string;
    nombre_completo?: string;
    roles?: string[];
  };
}
// Utilidades
type TenantRole = "administrador" | "gerente" | "vendedor" | "contador" | "almacenista";
type MockUserRecord = {
  id: string;
  email?: string;
  username?: string;
  nombre_completo?: string;
  roles?: string[]; // globales
  org_roles?: Record<string, TenantRole>;
};
// almacén de usuarios mock (por tenant)
const USERS_KEY = "mock.users"; // [{ id, email, org_roles: { [tenantId]: role }, roles: [...] }]
function readUsers(): MockUserRecord[] {
  try { return JSON.parse(localStorage.getItem(USERS_KEY) || "[]"); } catch { return []; }
}
function writeUsers(list: MockUserRecord[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(list));
}

function isPlatformAdminFromStorage(): boolean {
  try {
    const raw = localStorage.getItem("auth") || localStorage.getItem("auth.me");
    const obj = raw ? JSON.parse(raw) : {};
    const roles = obj?.roles || [];
    const perms = JSON.parse(localStorage.getItem("auth.permissions") || "[]");
    return roles.includes("superadmin") || roles.includes("platform_admin") || (Array.isArray(perms) && perms.includes("*"));
  } catch { return false; }
}

function actingTenantId(): string | undefined {
  return localStorage.getItem("admin.scope.tenant_id") || localStorage.getItem("auth.tenant_id") || undefined;
}

/**
 * Simula un retraso para emular latencia de red
 */
const mockDelay = async (): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, API_CONFIG.MOCK_DELAY));
};

/**
 * Genera una respuesta mock con formato de Axios
 */
function mockResponse<T>(data: T, status = 200): AxiosResponse<T> {
  return {
    data,
    status,
    statusText: status === 200 ? "OK" : String(status),
    headers: {},
    config: {} as InternalAxiosRequestConfig,
  };
}

/**
 * Manejador de endpoints de autenticación
 */
const handleAuthEndpoints = async (
  url: string,
  method: string,
  data?: MockRequest
): Promise<AxiosResponse | null> => {
  // Login (POST /api/auth/login o /api/auth/token)
  if ((url.includes("/api/auth/login") || url.includes("/api/auth/token")) && method.toLowerCase() === "post") {
    await mockDelay();

    // Acepta password "password" o "123456" como credenciales válidas
    if (data?.password === "password" || data?.password === "123456") {
      const token = `mock_token_${Date.now()}`;

      // 🔑 Decide si es admin de plataforma o usuario normal
      // Reglas de ejemplo (ajusta a tu gusto):
      // - email que contenga "admin" => platform_admin
      // - email que contenga "root"  => superadmin + platform_admin + permiso "*"
      const emailOrUser = (data.email || data.username || "user@example.com").toString();
      const asRoot = /root/i.test(emailOrUser);
      const asPlatform = asRoot || /admin/i.test(emailOrUser);

      const roles = asRoot
        ? ["superadmin", "platform_admin"]
        : (asPlatform ? ["platform_admin"] : ["user"]);

      const user = {
        id: `user_${Date.now()}`,
        email: emailOrUser,
        username: emailOrUser.split("@")[0],
        nombre_completo: emailOrUser,
        roles,
        org_roles: {} as Record<string, TenantRole>, // se llenará al crear/seleccionar tenant
        tenant_id: null as string | null,
      };

      const authData: MockAuthPayload = { token, user };
      localStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(authData));
      localStorage.setItem("auth.me", JSON.stringify(user));
      if (asRoot) localStorage.setItem("auth.permissions", JSON.stringify(["*"])); // modo root

      return mockResponse({ token, user });
    }

    return mockResponse({ message: "Credenciales incorrectas" }, 401);
  }

  // Logout (POST /api/auth/logout)
  if (url.includes("/api/auth/logout") && method.toLowerCase() === "post") {
    await mockDelay();
    localStorage.removeItem(STORAGE_KEYS.AUTH);
    localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    localStorage.removeItem("auth.me");
    localStorage.removeItem("auth.permissions");
    localStorage.removeItem(STORAGE_KEYS.ADMIN_SCOPE_TENANT); // limpia scope admin
    sessionStorage.removeItem(STORAGE_KEYS.AUTH);
    sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
    return mockResponse({ success: true });
  }

  // Perfil de usuario (GET /api/auth/me o /api/profile)
  if ((url.includes("/api/auth/me") || url.includes("/api/profile")) && method.toLowerCase() === "get") {
    await mockDelay();
    try {
      const rawMe = localStorage.getItem("auth.me");
      if (rawMe) return mockResponse({ user: JSON.parse(rawMe) });
      const raw = localStorage.getItem(STORAGE_KEYS.AUTH) || "{}";
      const auth = (JSON.parse(raw) as Partial<MockAuthPayload>) || {};
      if (auth?.user) return mockResponse({ user: auth.user });
    } catch (err) {
      console.error("Error al leer perfil mock:", err);
    }
    return mockResponse({ message: "Usuario no autenticado" }, 401);
  }

  return null;
};


/**
 * Manejador de endpoints de tenant
 */
const handleTenantEndpoints = async (
  url: string,
  method: string,
  data?: MockRequest
): Promise<AxiosResponse | null> => {
  // Listar tenants (GET /api/tenants)
  if (url.includes("/api/tenants") && !url.includes("/register") && !url.includes("/select") && method.toLowerCase() === "get") {
    await mockDelay();
    try {
      const orgs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORGS) || "[]");
      return mockResponse(orgs);
    } catch (err) {
      console.error("Error al leer tenants mock:", err);
      return mockResponse([], 200);
    }
  }

  // Registrar tenant (POST /api/tenants/register)
  // Registrar tenant (POST /api/tenants/register)
if (url.includes("/api/tenants/register") && method.toLowerCase() === "post") {
  await mockDelay();
  const tenant = {
    id: `org_${Date.now()}`,
    name: (data?.company_name ?? "Nueva Empresa").toString(),
    domain: (data?.domain ?? "").toString().toLowerCase(),
    slug: (data?.slug ?? (data?.company_name ?? "empresa").toString().toLowerCase().replace(/[^a-z0-9]+/g, "-")),
    status: "trial",
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
  };

  try {
    const orgs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORGS) || "[]");
    orgs.push(tenant);
    localStorage.setItem(STORAGE_KEYS.ORGS, JSON.stringify(orgs));

    // lee usuario actual
    const rawMe = localStorage.getItem("auth.me") || "{}";
    const me = JSON.parse(rawMe || "{}") ;
    const isPlatformAdmin = Array.isArray(me?.roles) && (me.roles.includes("superadmin") || me.roles.includes("platform_admin"));

    // Actualiza auth.me:
    if (!isPlatformAdmin) {
      // usuario de empresa: setea tenant activo y rol "administrador" en ese tenant
      me.tenant_id = tenant.id;
      me.org_roles = { ...(me.org_roles || {}), [tenant.id]: "administrador" };
      localStorage.setItem("auth.me", JSON.stringify(me));
      localStorage.setItem(STORAGE_KEYS.TENANT, tenant.id);
    } else {
      // admin de plataforma: NO fuerces tenant (deja que seleccione scope manual)
      // si quieres auto-apuntar al recién creado, descomenta:
      // localStorage.setItem(STORAGE_KEYS.ADMIN_SCOPE_TENANT, tenant.id);
    }

    // Mantén estructura de "auth" con token + user
    const rawAuth = localStorage.getItem(STORAGE_KEYS.AUTH) || "{}";
    const authObj = JSON.parse(rawAuth || "{}");
    const userObj = authObj?.user || me || {};
    const newAuth = { ...authObj, user: { ...userObj, tenant_id: me?.tenant_id ?? null } };
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(newAuth));

    return mockResponse({
      success: true,
      message: "Empresa registrada exitosamente",
      tenant_id: tenant.id,
      token: authObj?.token || `mock_token_${Date.now()}`,
      user: newAuth.user,
    });
  } catch (err) {
    console.error("Error al registrar tenant mock:", err);
    return mockResponse({ success: false, message: "Error al procesar la solicitud" }, 500);
  }
}

// Seleccionar tenant (POST /api/tenants/select)
if (url.includes("/api/tenants/select") && method.toLowerCase() === "post") {
  await mockDelay();
  try {
    const tId = String(data?.tenant_id ?? "");
    const rawMe = localStorage.getItem("auth.me") || "{}";
    const me = JSON.parse(rawMe || "{}");

    // Si es admin de plataforma, guarda scope (no cambia tenant_id del usuario)
    const isPlatformAdmin = Array.isArray(me?.roles) && (me.roles.includes("superadmin") || me.roles.includes("platform_admin"));
    if (isPlatformAdmin) {
      if (tId) localStorage.setItem(STORAGE_KEYS.ADMIN_SCOPE_TENANT, tId);
    } else {
      // usuario normal: cambia su tenant activo
      me.tenant_id = tId || null;
      localStorage.setItem("auth.me", JSON.stringify(me));
      if (tId) localStorage.setItem(STORAGE_KEYS.TENANT, tId);
    }

    // conserva shape de "auth"
    const rawAuth = localStorage.getItem(STORAGE_KEYS.AUTH) || "{}";
    const authObj = JSON.parse(rawAuth || "{}");
    const newAuth = { ...authObj, user: { ...(authObj?.user || me || {}), tenant_id: me?.tenant_id ?? null } };
    localStorage.setItem(STORAGE_KEYS.AUTH, JSON.stringify(newAuth));

    return mockResponse({ success: true });
  } catch (err) {
    console.error("Error al seleccionar tenant mock:", err);
    return mockResponse({ success: false, message: "Error al seleccionar la organización" }, 400);
  }
}


  // Verificar slug (POST /api/tenants/check-slug)
  if (url.includes("/api/tenants/check-slug") && method.toLowerCase() === "post") {
    await mockDelay();
    try {
      const orgs = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORGS) || "[]") as Array<{ slug?: string }>;
      const slug = (data?.slug ?? "").toString().toLowerCase();
      const exists = orgs.some((org) => (org.slug ?? "").toLowerCase() === slug);
      return mockResponse({ available: !exists });
    } catch (err) {
      console.error("Error al verificar slug:", err);
      return mockResponse({ available: true });
    }
  }

  return null;
};

/**
 * Manejador de endpoints de suscripción
 */
const handleSubscriptionEndpoints = async (
  url: string,
  method: string
): Promise<AxiosResponse | null> => {
  // Obtener suscripción actual (GET /api/subscription)
  if (url.includes("/api/subscription") && method.toLowerCase() === "get") {
    await mockDelay();
    try {
      const sub = localStorage.getItem(STORAGE_KEYS.SUBSCRIPTION);
      if (sub) {
        return mockResponse(JSON.parse(sub));
      }

      const defaultSub = {
        plan: "Trial",
        status: "active",
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem(STORAGE_KEYS.SUBSCRIPTION, JSON.stringify(defaultSub));
      return mockResponse(defaultSub);
    } catch (err) {
      console.error("Error al leer suscripción mock:", err);
      return mockResponse({}, 500);
    }
  }

  return null;
};

/**
 * Configura los interceptores para modo mock
 */
export function setupMockInterceptors(http: AxiosInstance): void {
  console.log("[MOCK] Configurando interceptores mock");

  // Request logger (opcional)
  http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
    if (import.meta.env.DEV) {
      console.log(`[MOCK] ${String(config.method)?.toUpperCase()} ${config.url}`);
    }
    return config;
  });

  // Interceptar respuestas cuando no hay backend (error.response undefined)
  http.interceptors.response.use(
    (response) => response,
    async (error) => {
      // Si existe response (backend real devolvió error), lo devolvemos
      if (error.response) return Promise.reject(error);

      // Si no hay response, intentamos simularlo con los handlers
      const config: InternalAxiosRequestConfig | undefined = error.config;
      if (!config) return Promise.reject(error);

      const url = String(config.url ?? "");
      const method = String(config.method ?? "get").toLowerCase();
      let body: MockRequest | undefined;

      try {
        body = config.data ? JSON.parse(String(config.data)) : undefined;
      } catch {
        body = undefined;
      }

      // 1) Auth
      const authResp = await handleAuthEndpoints(url, method, body);
      if (authResp) return Promise.resolve(authResp);

      // 2) Tenant
      const tenantResp = await handleTenantEndpoints(url, method, body);
      if (tenantResp) return Promise.resolve(tenantResp);

      // 3) Subscription
      const subResp = await handleSubscriptionEndpoints(url, method);
      if (subResp) return Promise.resolve(subResp);

      // 4) Users  👈 añade esto
       const usersResp = await handleUserEndpoints(url, method, body);
       if (usersResp) return Promise.resolve(usersResp);

      console.warn(`[MOCK] Endpoint no implementado: ${method.toUpperCase()} ${url}`);
      return Promise.reject({
        response: {
          status: 501,
          data: { message: "Endpoint no implementado en modo mock" },
        },
      });
    }
  );
}


const handleUserEndpoints = async (
  url: string,
  method: string,
  data?: MockRequest
): Promise<AxiosResponse | null> => {
  const toLower = method.toLowerCase();

  // Helper: tenant “en efecto”
  const t = actingTenantId();

  // GET /api/users  (lista)
  if (url === "/api/users" && toLower === "get") {
    await mockDelay();
    const list = readUsers();

    if (isPlatformAdminFromStorage()) {
      // admin ve todos o, si hay scope, solo los del scope
      if (t) return mockResponse(list.filter(u => u.org_roles?.[t]));
      return mockResponse(list);
    }
    if (!t) return mockResponse({ message: "Falta tenant" }, 400);
    return mockResponse(list.filter(u => u.org_roles?.[t]));
  }

  // GET /api/users/:id
  if (/^\/api\/users\/[^/]+$/.test(url) && toLower === "get") {
    await mockDelay();
    const id = url.split("/")[3];
    const list = readUsers();
    const found = list.find(u => u.id === id);
    if (!found) return mockResponse({ message: "No encontrado" }, 404);
    return mockResponse(found);
  }

  // POST /api/users  (crear en tenant actual/scope)
  if (url === "/api/users" && toLower === "post") {
    await mockDelay();
    if (!t) return mockResponse({ message: "Falta tenant" }, 400);

    const list = readUsers();
    const id = `u_${Date.now()}`;
    const tenantRole = String(data?.tenant_role || "vendedor") as TenantRole;

    const newUser: MockUserRecord = {
      id,
      email: data?.email as string | undefined,
      username: (data?.email as string | undefined)?.split?.("@")?.[0],
      nombre_completo: (data?.nombre_completo as string) || (data?.email as string) || `Usuario ${id}`,
      roles: ["user"], // globales por defecto
      org_roles: { [t]: tenantRole },
    };
    list.push(newUser);
    writeUsers(list);
    return mockResponse(newUser, 201);
  }

  // PUT /api/users/:id  (actualizar datos básicos)
  if (/^\/api\/users\/[^/]+$/.test(url) && toLower === "put") {
    await mockDelay();
    const id = url.split("/")[3];
    const list = readUsers();
    const idx = list.findIndex(u => u.id === id);
    if (idx < 0) return mockResponse({ message: "No encontrado" }, 404);

    const current = list[idx];
    const updated: MockUserRecord = {
      ...current,
      email: (data?.email as string) ?? current.email,
      nombre_completo: (data?.nombre_completo as string) ?? current.nombre_completo,
      // no toques roles/globales aquí
    };
    list[idx] = updated;
    writeUsers(list);
    return mockResponse(updated);
  }

  // PUT /api/users/:id/role  (cambiar rol del usuario en el tenant actual/scope)
  if (/^\/api\/users\/[^/]+\/role$/.test(url) && toLower === "put") {
    await mockDelay();
    if (!t) return mockResponse({ message: "Falta tenant" }, 400);

    const id = url.split("/")[3];
    const role = String(data?.role || "vendedor") as TenantRole;
    const list = readUsers();
    const idx = list.findIndex(u => u.id === id);
    if (idx < 0) return mockResponse({ message: "No encontrado" }, 404);

    const user = list[idx];
    user.org_roles = { ...(user.org_roles || {}), [t]: role };
    list[idx] = user;
    writeUsers(list);
    return mockResponse(user);
  }

  // DELETE /api/users/:id
  if (/^\/api\/users\/[^/]+$/.test(url) && toLower === "delete") {
    await mockDelay();
    const id = url.split("/")[3];
    const list = readUsers();
    const next = list.filter(u => u.id !== id);
    writeUsers(next);
    return mockResponse({ success: true });
  }

  return null;
};

/**
 * Endpoints mock públicos
 */
export const MOCK_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    LOGOUT: "/api/auth/logout",
    ME: "/api/auth/me",
  },
  TENANT: {
    LIST: "/api/tenants",
    REGISTER: "/api/tenants/register",
    SELECT: "/api/tenants/select",
    CHECK_SLUG: "/api/tenants/check-slug",
  },
  SUBSCRIPTION: {
    GET: "/api/subscription",
    UPDATE: "/api/subscription",
  },
  USERS: {
    LIST: "/api/users",
    CREATE: "/api/users",
    GET: "/api/users/:id",
    UPDATE: "/api/users/:id",
    DELETE: "/api/users/:id",
  },
};
import axios, { AxiosError, AxiosHeaders } from "axios";
import type { InternalAxiosRequestConfig } from "axios";

/* ============================
   CONFIG desde variables .env
   ============================ */
export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000",
  mode: import.meta.env.VITE_API_MODE || "hybrid",
  timeout: 10000,
  authScheme: "Bearer",
  authRoute: "/login",
  MOCK_DELAY: 500,
} as const;

/** Determina si el modo actual es mock */
export function isMockMode(): boolean {
  return API_CONFIG.mode === "mock";
}

/** Determina si el modo actual es híbrido */
export function isHybridMode(): boolean {
  return API_CONFIG.mode === "hybrid";
}

/* =======================================
   Normalización segura de la baseURL
   ======================================= */


/* =======================
   Claves de almacenamiento
   ======================= */
export const STORAGE_KEYS = {
  AUTH: "auth",                    // Objeto de auth (compat)
  AUTH_ME: "auth.me",              // Usuario serializado (recomendado)
  AUTH_TOKEN: "auth.token",        // Token plano (compat)
  TENANT: "auth.tenant_id",        // Tenant ID (compat usuario normal)
  ADMIN_SCOPE_TENANT: "admin.scope.tenant_id", // Tenant apuntado por admin
  ORGS: "mock.organizations",
  SUBSCRIPTION: "cache.subscription",
} as const;

/* ===========================
   Flags / utilidades de auth
   =========================== */

/** Token desde localStorage o sessionStorage */
export const getAuthToken = (): string | undefined => {
  const token =
    localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ||
    sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
  if (token) return token;

  try {
    const rawAuth =
      localStorage.getItem(STORAGE_KEYS.AUTH) ||
      sessionStorage.getItem(STORAGE_KEYS.AUTH);
    if (rawAuth) {
      const auth = JSON.parse(rawAuth);
      return auth?.token;
    }
  } catch (error) {
    console.error("Error al leer token de auth:", error);
  }
  return undefined;
};

/** Tenant del usuario normal (compat) */
export const getTenantId = (): string | undefined => {
  const tenantId =
    localStorage.getItem(STORAGE_KEYS.TENANT) ||
    sessionStorage.getItem(STORAGE_KEYS.TENANT);
  if (tenantId) return tenantId;

  try {
    const rawAuth =
      localStorage.getItem(STORAGE_KEYS.AUTH) ||
      sessionStorage.getItem(STORAGE_KEYS.AUTH);
    if (rawAuth) {
      const auth = JSON.parse(rawAuth);
      return auth?.tenant_id;
    }
  } catch (error) {
    console.error("Error al leer tenant_id:", error);
  }
  return undefined;
};

/* ==================
   Cliente HTTP Axios
   ================== */

// NOTA: dejar baseURL vacío para usar proxy de Vite (usa rutas relativas "/api/...")
export const http = axios.create({
  baseURL: "", // <- ruta relativa: Vite proxy reenviará /api -> backend
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: false,
});

/* ==============================
   Interceptor de solicitud (req)
   ============================== */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const headers =
    config.headers instanceof AxiosHeaders
      ? config.headers
      : new AxiosHeaders(config.headers || {});

  // Endpoint público: fuerza Authorization: "" para no enviar token
  const isPublicEndpoint = headers.get("Authorization") === "";

  if (!isPublicEndpoint) {
    // 1) Authorization
    const token = getAuthToken();
    if (token) {
      headers.set("Authorization", `${API_CONFIG.authScheme} ${token}`);
    }

    // 2) X-Tenant-ID
    const skipTenant = headers.get("X-Tenant-ID") === "";
    if (!skipTenant) {
      const tenantId = getTenantId();
      if (tenantId) {
        headers.set("X-Tenant-ID", tenantId);
      }
    }
  }

  if (import.meta.env.DEV) {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.baseURL || ""}${config.url}`);
  }

  config.headers = headers;
  return config;
});

/* =============================
   Interceptor de respuesta (res)
   ============================= */
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      const currentPath = window.location.pathname;
      if (!currentPath.startsWith(API_CONFIG.authRoute)) {
        const redirect = encodeURIComponent(currentPath + window.location.search);
        window.location.href = `${API_CONFIG.authRoute}?redirect=${redirect}`;
      }
    }
    return Promise.reject(error);
  }
);

/* ====================================
   MOCK: activar interceptores si aplica
   ==================================== */
if (isMockMode()) {
  import("./mock").then(({ setupMockInterceptors }) => {
    setupMockInterceptors(http);
  });
}

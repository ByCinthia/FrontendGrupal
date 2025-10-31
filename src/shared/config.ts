// Configuración central de la aplicación

export const API_CONFIG = {
  // Base URL para llamadas API
  BASE_URL: import.meta.env.VITE_API_URL ?? "http://localhost:8000",
  // Modo de API: 'mock' o 'api'
  MODE: import.meta.env.VITE_API_MODE ?? "mock",
  // Esquema de autenticación
  AUTH_SCHEME: import.meta.env.VITE_AUTH_SCHEME ?? "Token",
  // Ruta de autenticación
  AUTH_ROUTE: import.meta.env.VITE_AUTH_ROUTE ?? "/auth",
  // Retraso simulado para mock (ms)
  MOCK_DELAY: Number(import.meta.env.VITE_MOCK_DELAY ?? 600),
} as const;

// Configuración de almacenamiento
export const STORAGE_KEYS = {
  AUTH: "auth",
  ORGS: "mock.organizations",
  SUBSCRIPTION: "cache.subscription",
} as const;

// Configuración de tenant
export const TENANT_CONFIG = {
  // Si se requiere tenant para páginas protegidas
  REQUIRED: import.meta.env.VITE_REQUIRE_TENANT === "true",
  // Endpoints
  ENDPOINTS: {
    REGISTER: "/api/tenants/register",
    LIST: "/api/tenants",
    SELECT: "/api/tenants/select",
    CHECK_SLUG: "/api/tenants/check-slug",
    CURRENT: "/api/tenants/current",
  },
} as const;

// Función para verificar si estamos en modo mock
export const isMockMode = (): boolean => API_CONFIG.MODE === "mock";
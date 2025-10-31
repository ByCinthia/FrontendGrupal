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
  
  // Helper para verificar permisos multiempresa
  isSuperAdmin: () => boolean;
  isCompanyAdmin: () => boolean;
  canAccessAllCompanies: () => boolean;
  getCompanyScope: () => number | string | null;
  hasCompanyAccess: (empresaId: number | string) => boolean;
  switchCompany?: (empresaId: number | string) => Promise<void>; // Para superadmin
};

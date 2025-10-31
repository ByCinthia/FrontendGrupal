// Tipos del dominio de Usuarios

export type UserDTO = {
  id: number | string;
  email: string;
  username?: string;
  nombre_completo?: string;
  name?: string;
  telefono?: string;
  direccion?: string;
  role?: string;
  is_active?: boolean;
  active?: boolean;
  estado?: "ACTIVO" | "INACTIVO";
  last_login?: string | null;
  created_at?: string | null;
};

// Tipo normalizado que usaremos en el UI
export interface User {
  id: string | number;
  nombre: string;
  apellido?: string;
  username?: string;
  email?: string;
  telefono?: string;
  role: "superadmin" | "administrador" | "gerente" | "contador" | "usuario";
  activo?: boolean;
  last_login?: string | null;
  group_id?: number; // ID del grupo asignado al usuario

  // Metadatos de auditoría (opcional)
  created_at?: string;
  updated_at?: string;
}

// Tipo exacto para la tabla Django auth_user (estructura backend)
export interface DjangoUserPayload {
  // No incluir id - se auto-genera
  username: string;
  first_name: string;
  last_name: string; 
  email: string;
  password?: string; // Opcional - el backend puede generar una por defecto
  is_staff: boolean;
  is_active: boolean;
  is_superuser?: boolean; // Opcional - por defecto false
  // last_login y date_joined se generan automáticamente en el backend
}

// Respuesta del backend al crear usuario (lo que devuelve Django)
export interface DjangoUserResponse {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  is_superuser: boolean;
  last_login: string | null;
  date_joined: string; // Fecha de creación automática
  message?: string;
}

// Tipo para crear usuarios (payload que se envía al backend)
export interface CreateUserPayload extends DjangoUserPayload {
  // Campos adicionales específicos de tu app (no van a auth_user)
  telefono?: string;
  cargo?: string;
  departamento?: string;
  fecha_ingreso?: string;
  user_permissions?: string[];
  avatar?: string;
}

// Respuesta extendida del backend
export interface CreateUserResponse extends DjangoUserResponse {
  // Campos adicionales que puede devolver tu backend
  telefono?: string;
  cargo?: string;
  departamento?: string;
  fecha_ingreso?: string;
  user_permissions?: string[];
  avatar?: string;
}

export type ListUsersParams = {
  search?: string;
  activo?: boolean | "all";
  page?: number;
  page_size?: number;
};

export type Page<T> = {
  results: T[];
  count: number;
  page: number;
  page_size: number;
};

// Nuevo: tipo genérico para respuestas de backend (DRF u otros)
export type BackendPage<T> = {
  results?: T[];
  data?: T[];
  count?: number;
  total?: number;
  page?: number;
  current_page?: number;
  page_size?: number;
  per_page?: number;
};

// Adaptador: del payload del backend a nuestro tipo de UI
const mapRole = (r?: string): User["role"] => {
  if (!r) return "usuario"; // valor por defecto
  const v = r.toLowerCase();
  if (v.includes("super")) return "superadmin";
  if (v.includes("admin")) return "administrador";
  if (v.includes("geren")) return "gerente";
  if (v.includes("cont")) return "contador";
  if (v.includes("user") || v.includes("usuario")) return "usuario";
  return "usuario"; // fallback por defecto
};

export const adaptUser = (d: UserDTO): User => ({
  // Asegurar que id sea compatible con string | number
  id: d.id,
  email: d.email,
  username: d.username,
  nombre:
    (d.nombre_completo && d.nombre_completo.trim()) ||
    (d.name && d.name.trim()) ||
    (d.username && d.username.trim()) ||
    (d.email?.includes("@") ? d.email.split("@")[0]! : "usuario"),
  telefono: d.telefono,
  // Asegurar que mapRole siempre devuelve un valor válido
  role: mapRole(d.role),
  activo: typeof d.is_active === "boolean"
    ? d.is_active
    : typeof d.active === "boolean"
    ? d.active
    : d.estado === "ACTIVO",
  last_login: d.last_login ?? null,
  created_at: d.created_at ?? undefined,
  updated_at: undefined,
});

export type UserHistoryEntry = {
  id: string;
  user_id: string | number;
  action: string;
  actor?: string;
  data?: Record<string, unknown>;
  created_at: string;
};

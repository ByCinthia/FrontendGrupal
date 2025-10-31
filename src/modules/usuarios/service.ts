// Servicio de API para Usuarios (DRF friendly)

import { http } from "../../shared/api/client";
import {
  type ListUsersParams,
  type Page,
  type User,
  type UserDTO,
  type BackendPage,
  type CreateUserPayload,
  type CreateUserResponse,
  type DjangoUserPayload,
} from "./types";

const normalizePage = <T,>(
  raw: BackendPage<T> | T[],
  page: number,
  page_size: number
): { items: T[]; count: number; page: number; page_size: number } => {
  if (Array.isArray(raw)) {
    return { items: raw, count: raw.length, page, page_size };
  }
  const items = raw.results ?? raw.data ?? [];
  const count = raw.count ?? raw.total ?? items.length;
  const pg = raw.page ?? raw.current_page ?? page;
  const ps = raw.page_size ?? raw.per_page ?? page_size;
  return { items, count, page: pg, page_size: ps };
};

// Función para crear usuario (adaptada a la estructura Django auth_user)
export async function createUser(userData: CreateUserPayload): Promise<CreateUserResponse> {
  // Tipado para errores tipo Axios sin usar `any`
  interface HttpError {
    response?: { status?: number; statusText?: string; data?: unknown };
    message?: string;
  }

  const djangoPayload: DjangoUserPayload = {
    username: userData.username,
    first_name: userData.first_name,
    last_name: userData.last_name,
    email: userData.email,
    is_staff: userData.is_staff,
    is_active: userData.is_active,
    is_superuser: userData.is_superuser || false,
    password: userData.password || undefined,
  };

  console.log("[users.service] Payload para crear usuario:", djangoPayload);

  // Intentar varios endpoints comunes (trailing slash / sin slash)
  const endpoints = ["/api/User/user/", "/api/User/user", "/api/users/", "/api/users"];

  for (const ep of endpoints) {
    try {
      console.log(`[users.service] Intentando POST ${ep}`);
      const response = await http.post<CreateUserResponse>(ep, djangoPayload);
      console.log("[users.service] Usuario creado en backend:", response.data);

      // Intentar actualizar perfil extendido si aplica (no fallar si no existe)
      if (userData.telefono || userData.cargo || userData.departamento || userData.avatar) {
        try {
          const additionalData = {
            telefono: userData.telefono,
            cargo: userData.cargo,
            departamento: userData.departamento,
            fecha_ingreso: userData.fecha_ingreso,
            avatar: userData.avatar,
            user_permissions: userData.user_permissions,
          };
          await http.patch(`/api/User/user/${response.data.id}/profile/`, additionalData);
          console.log("[users.service] Perfil extendido actualizado");
        } catch (profileError) {
          console.warn("[users.service] No se pudo actualizar perfil extendido:", profileError);
        }
      }

      return {
        ...response.data,
        telefono: userData.telefono,
        cargo: userData.cargo,
        departamento: userData.departamento,
        fecha_ingreso: userData.fecha_ingreso,
        user_permissions: userData.user_permissions,
        avatar: userData.avatar,
      };
    } catch (err: unknown) {
      const e = err as HttpError;
      console.warn(`[users.service] POST ${ep} falló:`, {
        status: e.response?.status,
        statusText: e.response?.statusText,
        data: e.response?.data,
        message: e.message,
      });
      // Si el backend devolvió 500 intentamos el siguiente endpoint
      // si es otro error (autenticación, 4xx) también probamos los otros endpoints
      // continuar al siguiente endpoint
    }
  }

  // Si todos los endpoints fallan, guardar localmente como fallback
  console.warn("[users.service] Todos los endpoints fallaron — guardando usuario localmente");

  const fallbackUser: CreateUserResponse = {
    id: Date.now(), // ID numérico temporal
    username: userData.username,
    first_name: userData.first_name,
    last_name: userData.last_name,
    email: userData.email,
    is_staff: userData.is_staff,
    is_active: userData.is_active,
    is_superuser: userData.is_superuser || false,
    last_login: null,
    date_joined: new Date().toISOString(),
    message: "Usuario creado localmente (backend no disponible)",
    telefono: userData.telefono,
    cargo: userData.cargo,
    departamento: userData.departamento,
    fecha_ingreso: userData.fecha_ingreso,
    user_permissions: userData.user_permissions,
    avatar: userData.avatar,
  };

  try {
    const existingUsers = JSON.parse(localStorage.getItem("mock.users") || "[]");
    existingUsers.push(fallbackUser);
    localStorage.setItem("mock.users", JSON.stringify(existingUsers));
    console.log("[users.service] Usuario guardado localmente:", fallbackUser);
  } catch (storageError) {
    console.error("[users.service] Error guardando en localStorage:", storageError);
  }

  return fallbackUser;
}

export async function listUsers(
  params: ListUsersParams = {}
): Promise<Page<User>> {
  const { search, activo = "all", page = 1, page_size = 10 } = params;

  try {
    console.log("[users.service] Cargando usuarios desde backend:", "/api/User/user");
    
    const query: Record<string, unknown> = { page, page_size };
    if (search && search.trim()) query.search = search.trim();
    if (activo !== "all") query.is_active = activo === true;

    // Usar el endpoint correcto del backend Django
    const res = await http.get<BackendPage<UserDTO> | UserDTO[]>("/api/User/user", {
      params: query,
    });

    console.log("[users.service] Usuarios cargados desde backend:", res.data);

    // Normalizar la respuesta
    const normalized = normalizePage<UserDTO>(res.data, page, page_size);

    // Adaptar los usuarios del backend al formato UI
    const adaptedUsers = normalized.items.map((user) => {
      // Adaptar estructura Django auth_user a nuestro tipo User
      const adapted: User = {
        id: user.id,
        nombre: user.username || `${user.nombre_completo || user.name || 'Usuario'}`,
        apellido: "", // Si tienes first_name + last_name separados
        username: user.username,
        email: user.email || "",
        telefono: user.telefono,
        role: mapDjangoRole(user), // Función para mapear roles
        activo: user.is_active ?? user.active ?? true,
        last_login: user.last_login ?? undefined,
        created_at: user.created_at ?? undefined, // <-- usar created_at del DTO y convertir null -> undefined
      };
      return adapted;
    });

    return {
      results: adaptedUsers,
      count: normalized.count,
      page: normalized.page,
      page_size: normalized.page_size,
    };

  } catch (error) {
    console.warn("[users.service] Error cargando desde backend, usando datos locales:", error);
    
    // Fallback: cargar desde localStorage
    try {
      const stored = localStorage.getItem("mock.users");
      const localUsers: CreateUserResponse[] = stored ? JSON.parse(stored) : [];
      
      console.log("[users.service] Usuarios cargados desde localStorage:", localUsers);

      // Filtrar usuarios locales
      let filteredUsers = localUsers;
      
      if (search && search.trim()) {
        const searchLower = search.toLowerCase();
        filteredUsers = localUsers.filter(user => 
          user.username.toLowerCase().includes(searchLower) ||
          user.first_name.toLowerCase().includes(searchLower) ||
          user.last_name.toLowerCase().includes(searchLower) ||
          user.email.toLowerCase().includes(searchLower)
        );
      }
      
      if (activo !== "all") {
        filteredUsers = filteredUsers.filter(user => user.is_active === activo);
      }

      // Paginación manual
      const startIndex = (page - 1) * page_size;
      const endIndex = startIndex + page_size;
      const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

      // Adaptar a formato UI
      const adaptedUsers: User[] = paginatedUsers.map(user => ({
        id: user.id,
        nombre: `${user.first_name} ${user.last_name}`.trim(),
        username: user.username,
        email: user.email,
        telefono: user.telefono,
        role: mapDjangoRoleFromLocal(user),
        activo: user.is_active,
        last_login: user.last_login || undefined, // ✅ Corregido: manejar null
        created_at: user.date_joined || undefined, // ✅ Corregido: manejar null
      }));

      return {
        results: adaptedUsers,
        count: filteredUsers.length,
        page,
        page_size,
      };

    } catch (storageError) {
      console.error("[users.service] Error cargando desde localStorage:", storageError);
      
      // Fallback final: lista vacía
      return {
        results: [],
        count: 0,
        page,
        page_size,
      };
    }
  }
}

// Función auxiliar para mapear roles desde el backend
function mapDjangoRole(user: UserDTO): User["role"] {
  // Si el usuario tiene campos de Django auth_user
  if ('is_superuser' in user && user.is_superuser) return "superadmin";
  if ('is_staff' in user && user.is_staff) return "administrador";
  
  // Si viene del campo role personalizado
  if (user.role) {
    const roleStr = user.role.toLowerCase();
    if (roleStr.includes("super")) return "superadmin";
    if (roleStr.includes("admin")) return "administrador";
    if (roleStr.includes("geren")) return "gerente";
    if (roleStr.includes("cont")) return "contador";
  }
  
  return "usuario"; // Default
}

// Función auxiliar para mapear roles desde localStorage
function mapDjangoRoleFromLocal(user: CreateUserResponse): User["role"] {
  if (user.is_superuser) return "superadmin";
  if (user.is_staff) return "administrador";
  
  // Si hay campo adicional de cargo
  if (user.cargo) {
    const cargoStr = user.cargo.toLowerCase();
    if (cargoStr.includes("gerente")) return "gerente";
    if (cargoStr.includes("contador")) return "contador";
  }
  
  return "usuario"; // Default
}

export async function setUserActive(
  id: number | string,
  active: boolean
): Promise<void> {
  try {
    console.log("[users.service] Actualizando estado usuario:", { id, active });
    
    // Intentar actualizar en el backend
    await http.patch(`/api/User/user/${id}/`, { is_active: active });
    
    console.log("[users.service] Estado actualizado en backend");
  } catch (error) {
    console.warn("[users.service] Error actualizando en backend, actualizando localmente:", error);
    
    // Fallback: actualizar en localStorage
    try {
      const stored = localStorage.getItem("mock.users");
      const users: CreateUserResponse[] = stored ? JSON.parse(stored) : [];
      
      const userIndex = users.findIndex(user => String(user.id) === String(id));
      if (userIndex !== -1) {
        users[userIndex].is_active = active;
        localStorage.setItem("mock.users", JSON.stringify(users));
        console.log("[users.service] Estado actualizado localmente");
      }
    } catch (storageError) {
      console.error("[users.service] Error actualizando en localStorage:", storageError);
      throw storageError;
    }
  }
}

export async function getUserHistory(userId: string | number): Promise<UserHistoryEntry[]> {
  try {
    // Intentar cargar desde API real
    const res = await http.get(`/api/User/user/${userId}/history/`);
    return res.data;
  } catch {
    // Fallback: mock desde localStorage
    try {
      const raw = localStorage.getItem(`mock.user.history.${userId}`);
      if (raw) return JSON.parse(raw) as UserHistoryEntry[];
    } catch {
      void 0;
    }

    // Mock básico
    const mock: UserHistoryEntry[] = [
      { 
        id: `${userId}-h1`, 
        user_id: userId, 
        action: "CREADO", 
        actor: "system", 
        data: {}, 
        created_at: new Date().toISOString() 
      },
      { 
        id: `${userId}-h2`, 
        user_id: userId, 
        action: "ESTADO_CAMBIADO", 
        actor: "admin@demo", 
        data: { active: true }, 
        created_at: new Date().toISOString() 
      }
    ];
    return mock;
  }
}

export async function updateUser(userId: string | number, payload: Partial<User>): Promise<User> {
  try {
    // Intentar actualizar en backend
    const djangoPayload = {
      username: payload.username,
      first_name: payload.nombre?.split(' ')[0],
      last_name: payload.nombre?.split(' ').slice(1).join(' '),
      email: payload.email,
      is_active: payload.activo,
    };

    const response = await http.patch(`/api/User/user/${userId}/`, djangoPayload);
    console.log("[users.service] Usuario actualizado en backend:", response.data);

    // Convertir respuesta del backend a nuestro formato
    const updatedUser: User = {
      id: response.data.id,
      nombre: `${response.data.first_name} ${response.data.last_name}`.trim(),
      username: response.data.username,
      email: response.data.email,
      telefono: payload.telefono || "",
      role: mapDjangoRoleFromLocal(response.data),
      activo: response.data.is_active,
      last_login: response.data.last_login || undefined, // ✅ Corregido: manejar null
      created_at: response.data.date_joined || undefined, // ✅ Corregido: manejar null
      updated_at: new Date().toISOString(),
    };

    return updatedUser;

  } catch (error) {
    console.warn("[users.service] Error actualizando en backend, usando localStorage:", error);
    
    // Fallback: actualizar en localStorage
    const raw = localStorage.getItem("mock.users");
    const users: CreateUserResponse[] = raw ? JSON.parse(raw) : [];
    const idx = users.findIndex(u => String(u.id) === String(userId));
    const now = new Date().toISOString();

    let resultUser: User;
    if (idx !== -1) {
      // Actualizar usuario existente
      const existing = users[idx];
      const updated = {
        ...existing,
        username: payload.username || existing.username,
        first_name: payload.nombre?.split(' ')[0] || existing.first_name,
        last_name: payload.nombre?.split(' ').slice(1).join(' ') || existing.last_name,
        email: payload.email || existing.email,
        is_active: payload.activo ?? existing.is_active,
      };
      users[idx] = updated;

      resultUser = {
        id: updated.id,
        nombre: `${updated.first_name} ${updated.last_name}`.trim(),
        username: updated.username,
        email: updated.email,
        telefono: payload.telefono || "",
        role: mapDjangoRoleFromLocal(updated),
        activo: updated.is_active,
        last_login: updated.last_login || undefined, // ✅ Corregido: manejar null
        created_at: updated.date_joined || undefined, // ✅ Corregido: manejar null
        updated_at: now,
      };
    } else {
      // Crear nuevo usuario (caso edge)
      resultUser = {
        id: String(userId),
        nombre: payload.nombre ?? "",
        username: payload.username,
        email: payload.email ?? "",
        telefono: payload.telefono ?? "",
        role: payload.role ?? "usuario",
        activo: payload.activo ?? true,
        created_at: now,
        updated_at: now,
      };
    }

    // Guardar en localStorage
    localStorage.setItem("mock.users", JSON.stringify(users));

    // Añadir entrada de historial
    try {
      const historyKey = `mock.user.history.${userId}`;
      const rawHist = localStorage.getItem(historyKey);
      const hist: UserHistoryEntry[] = rawHist ? JSON.parse(rawHist) : [];
      const actor = (() => {
        try { 
          return JSON.parse(localStorage.getItem("auth.me") || "{}").email ?? "system"; 
        } catch { 
          return "system"; 
        }
      })();
      const entry: UserHistoryEntry = {
        id: `${userId}-${Date.now()}`,
        user_id: String(userId),
        action: "UPDATED",
        actor,
        data: payload as Record<string, unknown>,
        created_at: now
      };
      hist.unshift(entry);
      localStorage.setItem(historyKey, JSON.stringify(hist));
    } catch {
      // no bloquear la actualización si falla historial
    }

    console.log("[users.service] updateUser saved locally", { userId, payload, saved: resultUser });
    return resultUser;
  }
}

export type UserHistoryEntry = {
   id: string;
   user_id: string | number;
   action: string;
   actor?: string;
   data?: Record<string, unknown>;
   created_at: string;
 };


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
  console.log("🚀 Creando usuario:", userData);
  
  try {
    // Preparar payload para el backend (sin 'grupo_id', usando 'groups' en su lugar)
    const finalPayload: Omit<CreateUserPayload, "grupo_id"> & { groups?: number[] } = {
      username: userData.username,
      first_name: userData.first_name,
      last_name: userData.last_name,
      email: userData.email,
      password: userData.password,
      is_staff: userData.is_staff,
      is_active: userData.is_active,
      is_superuser: userData.is_superuser,
      telefono: userData.telefono,
      cargo: userData.cargo,
      departamento: userData.departamento,
      fecha_ingreso: userData.fecha_ingreso,
      avatar: userData.avatar,
      user_permissions: userData.user_permissions || [],
      empresa_id: userData.empresa_id,
      groups: userData.grupo_id ? [Number(userData.grupo_id)] : undefined,
    };

    console.log("📤 Payload enviado:", finalPayload);

    const response = await http.post<CreateUserResponse>("/api/User/create/", finalPayload);
    
    if (response.data) {
      console.log("✅ Usuario creado exitosamente:", response.data);
      return response.data;
    }
    
    throw new Error("No se recibió respuesta del servidor");
    
  } catch (error: unknown) {
    console.error("❌ Error en createUser:", error);
    
    // Verificar si es error de red
    const isNetworkError = !error || 
      (typeof error === 'object' && 'code' in error && error.code === 'NETWORK_ERROR') ||
      (typeof error === 'object' && 'response' in error && !error.response);

    // Si el servidor no está disponible, simular creación
    if (isNetworkError) {
      console.log("📱 Modo offline: simulando creación de usuario");
      
      const mockUser: CreateUserResponse = {
        id: Date.now(),
        username: userData.username,
        first_name: userData.first_name,
        last_name: userData.last_name,
        email: userData.email,
        is_staff: userData.is_staff || false,
        is_active: userData.is_active !== false,
        is_superuser: userData.is_superuser || false,
        date_joined: new Date().toISOString(),
        telefono: userData.telefono,
        cargo: userData.cargo,
        departamento: userData.departamento,
        fecha_ingreso: userData.fecha_ingreso,
        avatar: userData.avatar,
        empresa_id: userData.empresa_id,
        grupo_id: userData.grupo_id ? Number(userData.grupo_id) : undefined,
        user_permissions: userData.user_permissions || [],
        groups: userData.grupo_id ? [Number(userData.grupo_id)] : [],
      };
      
      // Guardar en localStorage para persistencia local
      try {
        const existingUsers = JSON.parse(localStorage.getItem("mock.users") || "[]");
        const updatedUsers = [...existingUsers, mockUser];
        localStorage.setItem("mock.users", JSON.stringify(updatedUsers));
      } catch (storageError) {
        console.warn("Error guardando en localStorage:", storageError);
      }
      
      return mockUser;
    }
    
    // Relanzar error para manejo en el componente
    throw error;
  }
}

export async function listUsers(params: ListUsersParams = {}): Promise<Page<User>> {
  const { search, activo = "all", page = 1, page_size = 10 } = params;

  // Obtener empresa_id del usuario actual
  const currentUser = JSON.parse(localStorage.getItem("auth.me") || "{}");
  const isSuper = currentUser.roles?.includes("superadmin");
  const empresaId = currentUser.empresa_id;

  try {
    console.log("[users.service] Cargando usuarios desde backend");
    
    const query: Record<string, unknown> = { 
      page, 
      page_size,
      empresa_id: !isSuper ? empresaId : undefined // Solo filtrar por empresa si no es superadmin
    };
    
    if (search?.trim()) query.search = search.trim();
    if (activo !== "all") query.is_active = activo === true;

    const res = await http.get<BackendPage<UserDTO> | UserDTO[]>("/api/User/user", {
      params: query,
    });

    const normalized = normalizePage<UserDTO>(res.data, page, page_size);

    const adaptedUsers = normalized.items.map((user) => ({
      id: user.id,
      nombre: user.username || `${user.nombre_completo || user.name || 'Usuario'}`,
      apellido: "", 
      username: user.username,
      email: user.email || "",
      telefono: user.telefono,
      role: mapDjangoRole(user),
      activo: user.is_active ?? user.active ?? true,
      last_login: user.last_login ?? undefined,
      created_at: user.created_at ?? undefined,
      empresa_id: user.empresa_id // Añadir empresa_id al usuario
    }));

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
        last_login: user.last_login || undefined,
        created_at: user.date_joined || undefined,
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
      last_login: response.data.last_login || undefined,
      created_at: response.data.date_joined || undefined,
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
        last_login: updated.last_login || undefined,
        created_at: updated.date_joined || undefined,
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


import { http } from "../../shared/api/client";
import type {
  Cliente,
  CreateClienteInput,
  UpdateClienteInput,
  ListClientesParams,
  ClientesPage
} from "./types";

// Cambio temporal para probar - usa una URL que existe en tu backend
const BASE_URL = "/api/clientes"; // <- cambiar por la URL real de tu backend Django

// Si no tienes endpoint de clientes aún, puedes probar temporalmente con:
// const BASE_URL = "/api/test-endpoint"; // o cualquier endpoint que sepas que existe

/**
 * Listado de clientes con búsqueda y paginación
 */
export async function listClientes(params: ListClientesParams = {}): Promise<ClientesPage> {
  try {
    // TEMPORAL: mock hasta que el backend tenga /api/clientes
    if (import.meta.env.DEV) {
      console.log("Mock: listando clientes", params);
      await new Promise(resolve => setTimeout(resolve, 500));
      return {
        results: [
          { id: 1, nombre: "Juan", apellido: "Pérez", telefono: "+591 70123456", fecha_registro: "2024-01-15" },
          { id: 2, nombre: "María", apellido: "García", telefono: "+591 71234567", fecha_registro: "2024-01-16" }
        ],
        count: 2,
        page: 1,
        page_size: 10
      };
    }

    const { search, page = 1, page_size = 10 } = params;
    const query: Record<string, string | number> = { page, page_size };
    if (search && search.trim()) {
      query.search = search.trim();
    }

    const response = await http.get(BASE_URL, { params: query });
    const data = response.data;

    // Caso: backend devuelve un array simple
    if (Array.isArray(data)) {
      const results: Cliente[] = data;
      return {
        results,
        count: results.length,
        page,
        page_size
      };
    }

    // Caso: backend devuelve objeto con results y metadatos
    const results = data.results || data.data || [];
    const count = data.count || data.total || (Array.isArray(results) ? results.length : 0);

    return {
      results: Array.isArray(results) ? results : [],
      count,
      page,
      page_size
    };
  } catch (error) {
    console.error("Error fetching clientes:", error);
    throw new Error("No se pudieron cargar los clientes");
  }
}

/**
 * Obtener cliente por ID
 */
export async function getCliente(id: number): Promise<Cliente> {
  try {
    const response = await http.get<Cliente>(`${BASE_URL}/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching cliente:", error);
    throw new Error("No se pudo cargar el cliente");
  }
}

/**
 * Crear nuevo cliente
 */
export async function createCliente(data: CreateClienteInput): Promise<Cliente> {
  try {
    // TEMPORAL: mock hasta que el backend tenga /api/clientes
    if (import.meta.env.DEV) {
      console.log("Mock: creando cliente", data);
      await new Promise(resolve => setTimeout(resolve, 1000)); // simular delay
      return {
        id: Math.floor(Math.random() * 1000),
        ...data,
        fecha_registro: new Date().toISOString().split('T')[0]
      };
    }
    
    const response = await http.post<Cliente>(BASE_URL, data);
    return response.data;
  } catch (error) {
    console.error("Error creating cliente:", error);
    throw new Error("No se pudo crear el cliente");
  }
}

/**
 * Actualizar cliente existente
 */
export async function updateCliente(data: UpdateClienteInput): Promise<Cliente> {
  try {
    const { id, ...updateData } = data;
    const response = await http.put<Cliente>(`${BASE_URL}/${id}/`, updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating cliente:", error);
    throw new Error("No se pudo actualizar el cliente");
  }
}

/**
 * Eliminar cliente
 */
export async function deleteCliente(id: number): Promise<void> {
  try {
    await http.delete(`${BASE_URL}/${id}/`);
  } catch (error) {
    console.error("Error deleting cliente:", error);
    throw new Error("No se pudo eliminar el cliente");
  }
}

/**
 * Validaciones cliente-side
 */
export function validateCliente(data: CreateClienteInput): string[] {
  const errors: string[] = [];

  if (!data.nombre || !String(data.nombre).trim()) {
    errors.push("El nombre es obligatorio");
  }

  if (!data.apellido || !String(data.apellido).trim()) {
    errors.push("El apellido es obligatorio");
  }

  if (!data.telefono || !String(data.telefono).trim()) {
    errors.push("El teléfono es obligatorio");
  }

  // Validar formato de teléfono (básico)
  if (data.telefono && !/^\+?[\d\s()]{8,15}$/.test(data.telefono)) {
    errors.push("El formato del teléfono no es válido");
  }
  
  return errors;
}

/**
 * Formatear nombre completo
 */
export function formatNombreCompleto(cliente: Cliente): string {
  return `${cliente.nombre} ${cliente.apellido}`.trim();
}
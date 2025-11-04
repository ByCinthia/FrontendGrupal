import { http } from "../../../shared/api/client";
import type { 
  TipoCredito, 
  CreateTipoCreditoInput, 
  UpdateTipoCreditoInput, 
  ListTiposCreditoParams, 
  TiposCreditoPage 
} from "./types";

const BASE_URL = "/api/Creditos/creditos";

// Listado con paginación y filtros
export async function listTiposCredito(params: ListTiposCreditoParams = {}): Promise<TiposCreditoPage> {
  const { search, page = 1, page_size = 10 } = params;
  
  const query: Record<string, string | number> = { page, page_size };
  if (search && search.trim()) {
    query.search = search.trim();
  }

  try {
    const response = await http.get<{
      results?: TipoCredito[];
      data?: TipoCredito[];
      count?: number;
      total?: number;
      page?: number;
      page_size?: number;
    }>(BASE_URL, { params: query });

    // Normalizar respuesta del backend
    const data = response.data;
    const results = data.results || data.data || [];
    const count = data.count || data.total || results.length;

    return {
      results: Array.isArray(results) ? results : [],
      count,
      page,
      page_size
    };
  } catch (error) {
    console.error("Error fetching tipos credito:", error);
    throw new Error("No se pudieron cargar los tipos de crédito");
  }
}

// Obtener un tipo específico
export async function getTipoCredito(id: number): Promise<TipoCredito> {
  try {
    const response = await http.get<TipoCredito>(`${BASE_URL}/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching tipo credito:", error);
    throw new Error("No se pudo cargar el tipo de crédito");
  }
}

// Crear nuevo tipo
export async function createTipoCredito(data: CreateTipoCreditoInput): Promise<TipoCredito> {
  try {
    const response = await http.post<TipoCredito>(BASE_URL, data);
    return response.data;
  } catch (error) {
    console.error("Error creating tipo credito:", error);
    throw new Error("No se pudo crear el tipo de crédito");
  }
}

// Actualizar tipo existente
export async function updateTipoCredito(data: UpdateTipoCreditoInput): Promise<TipoCredito> {
  try {
    const { id, ...updateData } = data;
    const response = await http.put<TipoCredito>(`${BASE_URL}/${id}/`, updateData);
    return response.data;
  } catch (error) {
    console.error("Error updating tipo credito:", error);
    throw new Error("No se pudo actualizar el tipo de crédito");
  }
}

// Eliminar tipo
export async function deleteTipoCredito(id: number): Promise<void> {
  try {
    await http.delete(`${BASE_URL}/${id}/`);
  } catch (error) {
    console.error("Error deleting tipo credito:", error);
    throw new Error("No se pudo eliminar el tipo de crédito");
  }
}

// Validaciones cliente-side
export function validateTipoCredito(data: CreateTipoCreditoInput): string[] {
  const errors: string[] = [];

  if (!data.nombre.trim()) {
    errors.push("El nombre es obligatorio");
  }

  if (!data.descripcion.trim()) {
    errors.push("La descripción es obligatoria");
  }

  if (data.monto_minimo <= 0) {
    errors.push("El monto mínimo debe ser mayor a 0");
  }

  if (data.monto_maximo <= 0) {
    errors.push("El monto máximo debe ser mayor a 0");
  }

  if (data.monto_maximo <= data.monto_minimo) {
    errors.push("El monto máximo debe ser mayor al monto mínimo");
  }

  return errors;
}

// Formatear montos
export function formatMonto(amount: number): string {
  return new Intl.NumberFormat('es-BO', {
    style: 'currency',
    currency: 'BOB',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
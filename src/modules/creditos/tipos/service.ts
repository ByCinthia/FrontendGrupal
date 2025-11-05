import { http } from "../../../shared/api/client";
import type { 
  TipoCredito, 
  CreateTipoCreditoInput, 
  UpdateTipoCreditoInput, 
  ListTiposCreditoParams, 
  TiposCreditoPage 
} from "./types";

const BASE_URL = "/api/Creditos/tipo-creditos/"; // ✅ URL correcta con slash final y C mayúscula

// Eliminar también el código de prueba de múltiples URLs
export async function createTipoCredito(data: CreateTipoCreditoInput): Promise<TipoCredito> {
  try {
    const payload = {
      nombre: String(data.nombre).trim(),
      descripcion: String(data.descripcion).trim(),
      monto_minimo: Number(data.monto_minimo),
      monto_maximo: Number(data.monto_maximo)
    };
    
    console.log("📤 Enviando tipo credito:", {
      url: BASE_URL,
      payload
    });
    
    const response = await http.post<TipoCredito>(BASE_URL, payload);
    
    console.log("✅ Tipo crédito creado:", response.data);
    return response.data;
  } catch (error) {
    console.error("❌ Error creating tipo credito:", error);
    
    // Mostrar detalles del error para debug
    if (error.response) {
      console.error("Status:", error.response.status);
      console.error("Data:", error.response.data);
    }
    
    throw new Error("No se pudo crear el tipo de crédito");
  }
}

 /**
 * Referencias / ejemplos
 * HU10 tipos de creditos
 * Endpoint (HTTP CRUD): http://127.0.0.1:8000/api/Creditos/tipo-creditos
 *
 * Ejemplo POST payload:
 * {
 *   "nombre": "Crédito Personal",
 *   "descripcion": "Crédito para personas naturales con tasa preferencial",
 *   "monto_minimo": 1000.00,
 *   "monto_maximo": 50000.00
 * }
 *
 * Ejemplo GET response (array):
 * [
 *   {
 *     "id": 1,
 *     "nombre": "Crédito Personal",
 *     "descripcion": "Crédito para personas naturales con tasa preferencial",
 *     "monto_minimo": "1000.00",
 *     "monto_maximo": "50000.00"
 *   },
 *   {
 *     "id": 2,
 *     "nombre": "Crédito Empresarial",
 *     "descripcion": "Crédito para empresas y negocios",
 *     "monto_minimo": "5000.00",
 *     "monto_maximo": "100000.00"
 *   }
 * ]
 */

/* Listado con soporte a respuesta paginada o array simple */
export async function listTiposCredito(params: ListTiposCreditoParams = {}): Promise<TiposCreditoPage> {
  const { search, page = 1, page_size = 10 } = params;
  const query: Record<string, string | number> = { page, page_size };
  
  if (search && search.trim()) {
    query.search = search.trim();
  }

  try {
    console.log("📤 GET", BASE_URL, "params:", query);
    const response = await http.get(BASE_URL, { params: query });
    const data = response.data;
    
    console.log("✅ Response:", data);

    // Caso: backend devuelve un array simple
    if (Array.isArray(data)) {
      return {
        results: data,
        count: data.length,
        page,
        page_size
      };
    }

    // Caso: backend devuelve objeto con results/data y metadatos
    const results = data.results || data.data || [];
    const count = data.count || data.total || (Array.isArray(results) ? results.length : 0);

    return {
      results: Array.isArray(results) ? results : [],
      count,
      page,
      page_size
    };
  } catch (error) {
    console.error("❌ Error fetching tipos credito:", error);
    throw new Error("No se pudieron cargar los tipos de crédito");
  }
}

export async function getTipoCredito(id: number): Promise<TipoCredito> {
  try {
    const response = await http.get<TipoCredito>(`${BASE_URL}/${id}/`);
    return response.data;
  } catch (error) {
    console.error("Error fetching tipo credito:", error);
    throw new Error("No se pudo cargar el tipo de crédito");
  }
}

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

export async function deleteTipoCredito(id: number): Promise<void> {
  try {
    await http.delete(`${BASE_URL}/${id}/`);
  } catch (error) {
    console.error("Error deleting tipo credito:", error);
    throw new Error("No se pudo eliminar el tipo de crédito");
  }
}

/* Validaciones cliente-side */
export function validateTipoCredito(data: CreateTipoCreditoInput): string[] {
  const errors: string[] = [];

  if (!data.nombre || !String(data.nombre).trim()) {
    errors.push("El nombre es obligatorio");
  }

  if (!data.descripcion || !String(data.descripcion).trim()) {
    errors.push("La descripción es obligatoria");
  }

  if (typeof data.monto_minimo !== "number" || Number(data.monto_minimo) <= 0) {
    errors.push("El monto mínimo debe ser mayor a 0");
  }

  if (typeof data.monto_maximo !== "number" || Number(data.monto_maximo) <= 0) {
    errors.push("El monto máximo debe ser mayor a 0");
  }

  if (Number(data.monto_maximo) <= Number(data.monto_minimo)) {
    errors.push("El monto máximo debe ser mayor al monto mínimo");
  }

  return errors;
}

/* Formatear montos */
export function formatMonto(amount: number | string): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return String(amount);
  return new Intl.NumberFormat("es-BO", {
    style: "currency",
    currency: "BOB",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}
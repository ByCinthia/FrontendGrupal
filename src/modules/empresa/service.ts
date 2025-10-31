import { http } from "../../shared/api/client";
import type { Empresa, Suscripcion } from "./types";
import type { AxiosResponse } from "axios";

/**
 * Normaliza posibles formatos de respuesta de listados
 */
function extractListFromResponse(resData: unknown): Empresa[] {
  if (Array.isArray(resData)) return resData as Empresa[];
  if (!resData || typeof resData !== "object") return [];
  const obj = resData as Record<string, unknown>;
  if (Array.isArray(obj.results)) return obj.results as Empresa[];
  if (Array.isArray(obj.data)) return obj.data as Empresa[];
  if (Array.isArray(obj.empresas)) return obj.empresas as Empresa[];
  if (Array.isArray(obj.items)) return obj.items as Empresa[];
  return [];
}

export async function listEmpresas(): Promise<Empresa[]> {
  const res: AxiosResponse<unknown> = await http.get("/api/empresa/");
  return extractListFromResponse(res.data);
}

export async function getEmpresaById(id: number): Promise<Empresa | null> {
  try {
    const res: AxiosResponse<unknown> = await http.get(`/api/empresa/${id}/`);
    const data = res.data;
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if ("empresa" in obj && typeof obj.empresa === "object") return obj.empresa as Empresa;
      return data as Empresa;
    }
    return null;
  } catch (err) {
    console.error("[empresa] getEmpresaById error:", err);
    return null;
  }
}

/**
 * Intenta obtener la suscripción asociada a una empresa.
 * - Consulta /api/suscripcion/?empresa=<id> y devuelve la primera si hay varias.
 */
export async function getSuscripcionByEmpresa(empresaId: number): Promise<Suscripcion | null> {
  try {
    const res: AxiosResponse<unknown> = await http.get(`/api/suscripcion/?empresa=${empresaId}`);
    const data = res.data;
    // Si viene array directo
    if (Array.isArray(data) && data.length > 0) return data[0] as Suscripcion;
    // Si viene objeto con results/pagination
    if (data && typeof data === "object") {
      const obj = data as Record<string, unknown>;
      if (Array.isArray(obj.results) && obj.results.length > 0) return obj.results[0] as Suscripcion;
      // si viene como { data: [...] }
      if (Array.isArray(obj.data) && obj.data.length > 0) return obj.data[0] as Suscripcion;
      // si la API devuelve un objeto único de suscripción
      if ("id" in obj) return obj as unknown as Suscripcion;
    }
    return null;
  } catch (err) {
    console.error("[empresa] getSuscripcionByEmpresa error:", err);
    return null;
  }
}
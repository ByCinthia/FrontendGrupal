import { http } from "../../shared/api/client";
import type { Cliente } from "./types";

// Tipos para las posibles respuestas de la API
interface ApiResponseWithResults {
  results: Cliente[];
  count?: number;
  next?: string | null;
  previous?: string | null;
}

interface ApiResponseWithData {
  data: Cliente[];
  total?: number;
  page?: number;
}

type ApiResponse = Cliente[] | ApiResponseWithResults | ApiResponseWithData;

/**
 * Intenta cargar clientes desde dos rutas comunes del backend.
 * Ajusta las rutas si tu API es diferente.
 */
export async function listClients(): Promise<Cliente[]> {
  const candidates = [
    "/api/Clientes/cliente/", // posible ruta según app_Cliente
    "/api/clientes/",
    "/api/Clientes/", 
  ];

  for (const path of candidates) {
    try {
      const res = await http.get<ApiResponse>(path);
      
      // normalizar: algunos endpoints devuelven { results: [...] }
      if (Array.isArray(res.data)) {
        return res.data;
      }
      
      if (res.data && typeof res.data === 'object') {
        // Verificar si tiene propiedad results
        if ('results' in res.data && Array.isArray(res.data.results)) {
          return res.data.results;
        }
        
        // Verificar si tiene propiedad data
        if ('data' in res.data && Array.isArray(res.data.data)) {
          return res.data.data;
        }
      }
    } catch {
      // try next candidate
      continue;
    }
  }

  throw new Error("No se pudieron cargar los clientes desde el servidor");
}




/// te odio vagner
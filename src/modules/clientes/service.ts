import { http } from "../../shared/api/client";

export interface Cliente {
  id: number | string;
  nombre: string;
  apellido?: string;
  ci?: string;
  telefono?: string;
  email?: string;
  fecha_registro?: string;
}

export async function listClients(): Promise<Cliente[]> {
  const res = await http.get<Cliente[]>("/api/clients/");
  return res.data ?? [];
}

export async function getClient(id: string | number): Promise<Cliente> {
  const res = await http.get<Cliente>(`/api/clients/${id}/`);
  return res.data;
}

export async function createClient(payload: Partial<Cliente>): Promise<Cliente> {
  const res = await http.post<Cliente>("/api/clients/", payload);
  return res.data;
}
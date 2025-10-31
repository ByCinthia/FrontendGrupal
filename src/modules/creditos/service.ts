import { http } from "../../shared/api/client";
import {
  adaptCredit,
  type Credit,
  type CreditDTO,
  type ListCreditsParams,
  type Page,
  type Moneda,
} from "./types";
import type { Client, CreditType, ClientDocument } from "./types";

/** Formatos paginados comunes */
interface BackendPage<T> {
  results?: T[];
  data?: T[];
  count?: number;
  total?: number;
  page?: number;
  current_page?: number;
  page_size?: number;
  per_page?: number;
}

const normalizePage = <T,>(
  raw: BackendPage<T> | T[],
  page: number,
  page_size: number
): { items: T[]; count: number; page: number; page_size: number } => {
  if (Array.isArray(raw)) return { items: raw, count: raw.length, page, page_size };
  const items = (raw.results ?? raw.data ?? []) as T[];
  const count = (raw.count ?? raw.total ?? items.length) as number;
  const pg = (raw.page ?? raw.current_page ?? page) as number;
  const ps = (raw.page_size ?? raw.per_page ?? page_size) as number;
  return { items, count, page: pg, page_size: ps };
};




/** Listado principal */
export async function listCredits(params: ListCreditsParams = {}): Promise<Page<Credit>> {
  const { search, estado = "ALL", moneda = "ALL", desde, hasta, page = 1, page_size = 10 } = params;

  const query: Record<string, string | number> = { page, page_size };
  if (search && search.trim()) query.search = search.trim();
  if (estado !== "ALL") query.estado = estado;
  if (moneda !== "ALL") query.moneda = moneda;
  if (desde) query.desde = desde;
  if (hasta) query.hasta = hasta;

  const res = await http.get<BackendPage<CreditDTO> | CreditDTO[]>("/api/creditos/", { params: query });
  const normalized = normalizePage<CreditDTO>(res.data, page, page_size);

  return {
    results: normalized.items.map(adaptCredit),
    count: normalized.count,
    page: normalized.page,
    page_size: normalized.page_size,
  };
}

/** Alta (mínimo viable) */
export interface CreateCreditInput {
  cliente_id: number | string;
  producto: string;
  moneda: Moneda;
  monto: number;
  tasa_anual: number;
  plazo_meses: number;
  frecuencia: "MENSUAL" | "QUINCENAL" | "SEMANAL";
  sistema: "FRANCES" | "ALEMAN" | "AMERICANO";
}

export async function createCredit(payload: CreateCreditInput): Promise<Credit> {
  const res = await http.post<CreditDTO>("/api/creditos/", payload);
  return adaptCredit(res.data);
}

/** Acciones del workflow */
export type WorkflowAction = "evaluar" | "aprobar" | "rechazar" | "desembolsar";
export async function changeStatus(id: number | string, action: WorkflowAction): Promise<Credit> {
  const res = await http.post<CreditDTO>(`/api/creditos/${id}/${action}/`, {});
  return adaptCredit(res.data);
}

/** Programar, Desembolsar, Conciliar */
export interface ProgramarInput {
  cuenta_origen_id: number | string;
  fecha_programada: string; // ISO "YYYY-MM-DD" o "YYYY-MM-DDTHH:mm:ssZ"
}
export async function programarDesembolso(id: number | string, payload: ProgramarInput): Promise<Credit> {
  const res = await http.post<CreditDTO>(`/api/creditos/${id}/programar/`, payload);
  return adaptCredit(res.data);
}

export interface DesembolsarInput {
  referencia_bancaria?: string;
}
export async function desembolsar(id: number | string, payload: DesembolsarInput): Promise<Credit> {
  const res = await http.post<CreditDTO>(`/api/creditos/${id}/desembolsar/`, payload);
  return adaptCredit(res.data);
}

export interface ConciliarInput {
  referencia_bancaria: string;
  fecha_operacion: string; // ISO
}
export async function conciliarDesembolso(id: number | string, payload: ConciliarInput): Promise<Credit> {
  const res = await http.post<CreditDTO>(`/api/creditos/${id}/conciliar/`, payload);
  return adaptCredit(res.data);
}

/** (Opcional) Calendario de cuotas */
export interface Cuota {
  numero: number;
  fecha: string;
  capital: number;
  interes: number;
  cuota: number;
  saldo: number;
}
export async function getCuotas(id: number | string): Promise<Cuota[]> {
  const res = await http.get<Cuota[]>(`/api/creditos/${id}/cuotas/`);
  return res.data;
}

/* ---------- Clientes ---------- */
export async function listClients(): Promise<Client[]> {
  const res = await http.get<Client[]>("/api/clients/");
  return res.data ?? [];
}
export async function createClient(payload: Partial<Client>): Promise<Client> {
  const res = await http.post<Client>("/api/clients/", payload);
  return res.data;
}

/* ---------- Tipos de crédito (catalogo) ---------- */
export async function listCreditTypes(): Promise<CreditType[]> {
  const res = await http.get<CreditType[]>("/api/creditos/tipos/");
  return res.data ?? [];
}
export async function getCreditType(id: number | string): Promise<CreditType> {
  const res = await http.get<CreditType>(`/api/creditos/tipos/${id}/`);
  return res.data;
}

/* ---------- Documentos ---------- */
/** Sube un archivo mediante FormData y devuelve el documento creado */
export async function uploadDocument(creditoId: number | string, file: File, tipo?: string): Promise<ClientDocument> {
  const fd = new FormData();
  fd.append("file", file);
  if (tipo) fd.append("tipo", tipo);
  const res = await http.post<ClientDocument>(`/api/creditos/${creditoId}/documentos/`, fd, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data;
}

/* ---------- Workflow helpers (cliente-side validation) ---------- */
/**
 * Determina si una acción de workflow es válida desde un estado dado.
 * - acciones: "evaluar" | "aprobar" | "rechazar" | "desembolsar"
 */
export function canTransition(current: string, action: WorkflowAction): boolean {
  switch (action) {
    case "evaluar":
      return current === "SOLICITADO";
    case "aprobar":
    case "rechazar":
      return current === "EN_EVALUACION";
    case "desembolsar":
      return current === "APROBADO";
    default:
      return false;
  }
}

/* Actualiza estado con validación cliente-side antes de llamar al backend */
export async function changeStatusWithValidation(
  id: number | string,
  action: WorkflowAction,
  actor?: string
) {
  // obtener estado actual ligero (si el backend tiene endpoint, mejor usarlo)
  const res = await http.get<CreditDTO>(`/api/creditos/${id}/`);
  const current = res.data.estado as string;
  if (!canTransition(current, action)) {
    throw new Error(`Acción "${action}" no permitida desde el estado "${current}".`);
  }
  // delegado a backend (ruta existente changeStatus ya implementada)
  // incluir actor en el body para auditoría; esto también evita la advertencia de "actor" sin usar
  const updated = await http.post<CreditDTO>(`/api/creditos/${id}/${action}/`, { actor });
  return adaptCredit(updated.data);
}

/* ---------- Nota ----------
- Las reglas de permisos (quién puede ejecutar qué) deben aplicarse en el backend.
- En frontend emplea canTransition() y verifica los permisos del usuario (from auth context)
  para decidir si mostrar botones/acciones.
- Las nuevas funciones arriba (listClients, uploadDocument, listCreditTypes, changeStatusWithValidation)
  completan el flujo que describes: crear_solicitud -> evaluador -> aprobar -> desembolsar.
*/

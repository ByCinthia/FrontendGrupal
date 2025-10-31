// Tipos de planes y suscripción (sin any)

export type PlanId = "basico" | "profesional" | "personalizado";

export interface PlanLimits {
  maxUsers: number;
  maxRequests: number; // por mes
  maxStorageGB: number;
}

export interface Plan {
  id: PlanId;
  name: string;
  priceUsd: number;
  limits: PlanLimits;
}

/* Cambiado a type-only para evitar generar código en tiempo de ejecución */
export type SubscriptionState = "en_prueba" | "activo" | "cancelado";

/**
 * Subscription guarda referencia al tenant (tenantId) y al plan mediante planId
 * (coincide con tu modelo app_suscripciones).
 */
export interface Subscription {
  id: string;
  tenantId: string;         // corresponde a tenant (multi-tenant)
  planId: PlanId;
  state: SubscriptionState;
  trialEndsAt?: string | null;
  startedAt?: string | null;
  cancelledAt?: string | null;
  orgName?: string | null; // <-- añadido: nombre de la organización / tenant
}

/* Pagos (pago_suscripciones) */
export type PaymentMethod = "card" | "paypal" | "bank_transfer" | "manual";

export interface Payment {
  id: string;
  tenantId: string;
  amountCents: number;
  currency: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  method: "card" | "paypal" | "bank_transfer" | "manual";
  externalId?: string | null;
  createdAt: string;
}

/* Usage / límites consumidos por tenant (para mostrar progress) */
export interface Usage {
  tenantId: string;
  users: number;
  requests: number;
  storageGB: number;
  measuredAt: string;
}

/* Historial / events */
export interface HistoryEvent {
  id: string;
  tenantId: string;
  action: string;
  actor: string;
  at: string; // ISO
  meta?: Record<string, unknown>;
}

/* respuestas auxiliares */
export interface SubscriptionResponse {
  subscription?: Subscription;
  message?: string;
}

export interface PaymentsResponse {
  payments: Payment[];
  total?: number;
}

export interface HistoryPage {
  results: HistoryEvent[];
  total: number;
  page: number;
  pageSize: number;
}

export interface License {
  id: string;
  orgId: string;
  version: string;
  purchasedAt: string;
  expiresAt?: string;
  supportUntil?: string;
}

// Nuevos tipos para suscripción según tu modelo Django
export interface SuscripcionData {
  fecha_inicio: string;
  fecha_fin: string;
  activo: boolean;
  empresa: number;
  enum_plan: 'BASICO' | 'PREMIUM' | 'PROFESIONAL';
  enum_estado: 'ACTIVO' | 'SUSPENDIDO' | 'CANCELADO';
}

export type SuscripcionEstado = "ACTIVO" | "PENDIENTE" | "CANCELADO" | string;

export interface SuscripcionResponse {
  id: number | string;
  empresa: number | string;
  planId: string;
  estado: SuscripcionEstado;
  fecha_inicio?: string;
  fecha_fin?: string | null;
  [k: string]: unknown;
}

export interface CreateSuscripcionPayload {
  // El backend Django espera `empresa` (id), no `empresa_id`
  empresa: number;
  enum_plan: 'BASICO' | 'PREMIUM' | 'PROFESIONAL';
  enum_estado?: 'ACTIVO' | 'SUSPENDIDO' | 'CANCELADO';
  fecha_fin: string; // ISO string
}

// Mapeo de planes locales a enum del backend
export type PlanToEnumMap = {
  basico: 'BASICO';
  profesional: 'PROFESIONAL';
  personalizado: 'PREMIUM';
};
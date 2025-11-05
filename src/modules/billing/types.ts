// Tipos actualizados para el flujo completo

export type PlanId = "basico" | "profesional" | "personalizado";
export type PaymentMethod = "card" | "paypal" | "bank_transfer" | "manual";

/* Tipos básicos de Plan / Límites */
export interface PlanLimits {
  maxUsers: number;
  maxRequests: number;
  maxStorageGB: number;
  supportLevel?: "basic" | "priority" | "dedicated";
  customReports?: boolean;
  apiAccess?: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  description?: string;
  priceUsd: number;
  priceMonthly?: number;
  priceYearly?: number;
  isPopular?: boolean;
  limits: PlanLimits;
  features?: string[];
}

/* Suscripción / Uso / Historial / Pagos (simplificados según uso en frontend) */
export interface Subscription {
  id: string | number;
  empresaId?: number;
  planId: PlanId;
  state: "en_prueba" | "activo" | "cancelado";
  orgName?: string;
  trialEndsAt?: string | null;
  startedAt?: string;
  expiresAt?: string | null;
  cancelledAt?: string | null; // añadido porque service.ts lo usa
  tenantId?: string; // añadido para compatibilidad con uso local
}

export interface Usage {
  users: number;
  requests: number;
  storageGB: number;
  measuredAt?: string;
  tenantId?: string; // añadido
}

export interface HistoryEvent {
  id: string;
  action: string;
  at: string;
  actor?: string;
  meta?: Record<string, unknown>;
  tenantId?: string; // añadido
}

export interface HistoryPage {
  total: number;        // service.ts devuelve "total"
  page: number;
  pageSize: number;
  results: HistoryEvent[];
}

/* Pago / Registro / Respuestas del backend */
export interface Payment {
  id: string;
  createdAt: string;
  amountCents: number;
  currency: string;
  periodStart?: string | null;
  periodEnd?: string | null;
  method: string;
  externalId?: string | null;
  tenantId?: string; // añadido
}

/* payload para crear suscripción desde frontend - ACTUALIZADO según backend real */
export interface CreateSuscripcionPayload {
  empresa: number;           // ← debe ser number
  tipo_plan: string;
  fecha_inicio: string;
  fecha_fin: string;
  monto: number;            // ← debe ser number
  estado: boolean;
  metodo_pago?: string;
  transaction_id?: string;
}

export interface SuscripcionResponse {
  id: number;
  empresa: number;
  tipo_plan: string;
  fecha_inicio: string;
  fecha_fin: string;
  monto: string | number;
  estado: boolean;
  metodo_pago?: string;
  fecha_creacion?: string;
}

export interface SubscriptionResponse {
  subscription?: Subscription;
}

export interface PaymentsResponse {
  payments?: Payment[];
}

/* Registro empresa + usuario (frontend) */
export interface CompanyRegistrationData {
  razon_social: string;
  nombre_comercial: string;
  email_contacto: string;
  imagen_url_empresa?: string;

  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  imagen_url_perfil?: string;

  selected_plan: PlanId;
  billing_period: "monthly" | "yearly";
}

/* Datos de pago enviados al procesador (frontend) */
export interface PaymentData {
  method: PaymentMethod;
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardHolder?: string;
  paypalEmail?: string;
}

/* Export por defecto no necesario, se exportan tipos nombrados */
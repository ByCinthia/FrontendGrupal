// src/modules/billing/service.ts
import { nanoid } from "nanoid";
import { http, STORAGE_KEYS } from "../../shared/api/client";
import type { AxiosResponse } from "axios";

import type {
  Plan,
  PlanId,
  Subscription,
  Usage,
  HistoryEvent,
  HistoryPage,
  Payment,
  SubscriptionResponse,
  PaymentsResponse,
  SuscripcionResponse,
  CreateSuscripcionPayload,
  CompanyRegistrationData,
  PaymentData,
} from "./types";

/* catálogo inmutable de planes (mock/local) */
const PLANS: ReadonlyArray<Plan> = [
  { 
    id: "basico", 
    name: "Básico", 
    priceUsd: 0, 
    limits: { 
      maxUsers: 3, 
      maxRequests: 1000, 
      maxStorageGB: 100,
      supportLevel: "basic",
      customReports: false,
      apiAccess: false
    },
    features: [
      "Hasta 3 usuarios",
      "1,000 solicitudes/mes", 
      "100 GB almacenamiento",
      "Soporte básico por email"
    ]
  },
  { 
    id: "profesional", 
    name: "Pro", 
    priceUsd: 80, 
    limits: { 
      maxUsers: 20, 
      maxRequests: 25000, 
      maxStorageGB: 300,
      supportLevel: "priority",
      customReports: true,
      apiAccess: true
    },
    features: [
      "Hasta 20 usuarios",
      "25,000 solicitudes/mes",
      "300 GB almacenamiento", 
      "Soporte prioritario",
      "Reportes personalizados",
      "API de integración"
    ]
  },
  { 
    id: "personalizado", 
    name: "Personalizado", 
    priceUsd: 300, 
    limits: { 
      maxUsers: 100, 
      maxRequests: 60000, 
      maxStorageGB: 1000,
      supportLevel: "dedicated",
      customReports: true,
      apiAccess: true
    },
    features: [
      "Hasta 100 usuarios",
      "60,000 solicitudes/mes",
      "1TB almacenamiento",
      "Soporte dedicado 24/7",
      "Reportes ilimitados",
      "API completa",
      "Integraciones personalizadas"
    ]
  },
] as const;

export function listPlans(): Promise<Plan[]> {
  return Promise.resolve(PLANS.slice());
}

export function getPlanById(id: PlanId): Plan {
  const p = PLANS.find((x) => x.id === id);
  if (!p) throw new Error("Plan no encontrado");
  return p;
}

/* Storage keys locales */
const LS_SUB_KEY = "billing.subscription";
const LS_PAYMENTS_KEY = "billing.payments";
const LS_USAGE_KEY = "billing.usage";
const LS_HIST_KEY = "billing.history";

/* helpers localStorage */
const loadJSON = <T,>(key: string): T | null => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};
const saveJSON = (key: string, value: unknown): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

/* tenantHeaders: añade X-Tenant-ID solo si hay tenant (evita preflight si vacío) */
function tenantHeaders(tenantId?: string): Record<string, string> | undefined {
  const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? undefined;
  if (!id) return undefined;
  return { "X-Tenant-ID": id };
}

/* helper para añadir evento al historial local */
function pushLocalHistoryEvent(e: Omit<HistoryEvent, "id" | "at">) {
  const list = loadJSON<HistoryEvent[]>(LS_HIST_KEY) ?? [];
  const ev: HistoryEvent = { id: nanoid(), at: new Date().toISOString(), ...e };
  list.unshift(ev);
  saveJSON(LS_HIST_KEY, list);
}

// Extrae response.data de un error axios
function getAxiosResponseData(err: unknown): unknown | null {
  if (!err || typeof err !== "object") return null;
  const e = err as Record<string, unknown>;
  const response = e.response;
  if (!response || typeof response !== "object") return null;
  const r = response as Record<string, unknown>;
  return r.data ?? null;
}

// Mapear plan IDs locales a tipo_plan del backend (CORREGIDO)
export function mapPlanToEnum(planId: PlanId): string {
  const mapping: Record<PlanId, string> = {
    basico: "BASICO",
    profesional: "PREMIUM",      // según tu documentación
    personalizado: "PREMIUM",    // o crear "PERSONALIZADO" si existe
  };
  return mapping[planId];
}

// Calcular fecha de finalización (CORREGIDO - devolver fecha_inicio también)
export function calculateDates(duration: 'monthly' | 'yearly'): { fecha_inicio: string; fecha_fin: string } {
  const now = new Date();
  const fecha_inicio = now.toISOString().split('T')[0]; // formato YYYY-MM-DD
  
  if (duration === 'yearly') {
    now.setFullYear(now.getFullYear() + 1);
  } else {
    now.setMonth(now.getMonth() + 1);
  }
  
  const fecha_fin = now.toISOString().split('T')[0];
  return { fecha_inicio, fecha_fin };
}

/* =========================
   SUSCRIPCIÓN DJANGO BACKEND
========================= */

export async function createSuscripcion(payload: CreateSuscripcionPayload): Promise<SuscripcionResponse> {
  try {
    console.log('[billing] 📤 POST /api/suscripcion/ payload:', JSON.stringify(payload, null, 2));
    
    const res = await http.post<SuscripcionResponse>('/api/suscripcion/', payload);
    console.log('✅ Suscripción creada en backend:', res.data);

    pushLocalHistoryEvent({
      tenantId: String(payload.empresa),
      action: 'create_subscription',
      actor: 'system',
      meta: { planId: payload.tipo_plan }
    });

    return res.data;
  } catch (error) {
    console.error('❌ Error creando suscripción:', error);
    const respData = getAxiosResponseData(error);
    if (respData !== null) {
      console.error('❌ Backend response:', respData);
      if (respData && typeof respData === "object") {
        const obj = respData as Record<string, unknown>;
        if (obj.tipo_plan) {
          throw new Error(`Error en campo tipo_plan: ${JSON.stringify(obj.tipo_plan)}`);
        }
        if (obj.errors) {
          throw new Error(`Errores de validación: ${JSON.stringify(obj.errors)}`);
        }
      }
      const msg = typeof respData === "string" ? respData : JSON.stringify(respData);
      throw new Error(`Error del servidor: ${msg}`);
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

export async function getSuscripcionByEmpresa(empresaId: number): Promise<SuscripcionResponse | null> {
  try {
    const res = await http.get<SuscripcionResponse[]>(`/api/suscripcion/?empresa=${empresaId}`);
    const suscripcion = Array.isArray(res.data) ? res.data[0] : res.data;
    return suscripcion || null;
  } catch (error) {
    console.error('Error obteniendo suscripción:', error);
    return null;
  }
}

export async function listSuscripciones(): Promise<SuscripcionResponse[]> {
  try {
    const res = await http.get<SuscripcionResponse[]>('/api/suscripcion/');
    return Array.isArray(res.data) ? res.data : [];
  } catch (error) {
    console.error('Error listando suscripciones:', error);
    return [];
  }
}

export async function updateSuscripcion(
  id: number, 
  payload: Partial<CreateSuscripcionPayload>
): Promise<SuscripcionResponse> {
  try {
    const res = await http.put<SuscripcionResponse>(`/api/suscripcion/${id}/`, payload);
    
    pushLocalHistoryEvent({
      tenantId: String(res.data.empresa),
      action: 'update_subscription',
      actor: 'system',
      meta: { subscriptionId: id, changes: payload }
    });
    
    return res.data;
  } catch (error) {
    console.error('Error actualizando suscripción:', error);
    throw error;
  }
}

export async function cancelSuscripcion(id: number): Promise<SuscripcionResponse> {
  try {
    const res = await http.patch<SuscripcionResponse>(`/api/suscripcion/${id}/`, {
      enum_estado: 'CANCELADO',
      activo: false
    });
    
    pushLocalHistoryEvent({
      tenantId: String(res.data.empresa),
      action: 'cancel_subscription',
      actor: 'system',
      meta: { subscriptionId: id }
    });
    
    return res.data;
  } catch (error) {
    console.error('Error cancelando suscripción:', error);
    throw error;
  }
}

// Helper para crear suscripción con datos del plan seleccionado
export async function createSuscripcionFromPlan(
  empresaId: number,
  planId: PlanId,
  duration: 'monthly' | 'yearly' = 'monthly'
): Promise<SuscripcionResponse> {
  const plan = getPlanById(planId);
  if (!plan) throw new Error("Plan no encontrado");
  const { fecha_inicio, fecha_fin } = calculateDates(duration);
  const tipo_plan = mapPlanToEnum(planId);

  const monto = Number(plan.priceUsd); // <-- asegurar número

  const payload: CreateSuscripcionPayload = {
    empresa: empresaId,
    tipo_plan,
    fecha_inicio,
    fecha_fin,
    monto: isNaN(monto) ? 0 : monto, // proteger por si plan.priceUsd era undefined/string inválido
    estado: true,
    metodo_pago: "TARJETA"
  };

  return await createSuscripcion(payload);
}

export async function getSubscription(tenantId?: string): Promise<Subscription | null> {
  const headers = tenantHeaders(tenantId);
  try {
    const res: AxiosResponse<SubscriptionResponse> = await http.get("/api/subscription", { headers: headers ?? {} });
    return res.data?.subscription ?? null;
  } catch {
    const all = loadJSON<Subscription[]>(LS_SUB_KEY) ?? [];
    return all.find((s) => s.tenantId === (tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT))) ?? null;
  }
}

export async function listPayments(tenantId?: string): Promise<Payment[]> {
  const headers = tenantHeaders(tenantId);
  try {
    const res: AxiosResponse<PaymentsResponse> = await http.get("/api/subscription/payments", { headers: headers ?? {} });
    return Array.isArray(res.data?.payments) ? res.data.payments : [];
  } catch {
    const all = loadJSON<Payment[]>(LS_PAYMENTS_KEY) ?? [];
    const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? undefined;
    return id ? all.filter((p) => p.tenantId === id) : all;
  }
}

export async function createManualPayment(p: Omit<Payment, "id" | "createdAt"> & { tenantId?: string }): Promise<Payment> {
  const headers = tenantHeaders(p.tenantId);
  try {
    const res: AxiosResponse<{ payment: Payment }> = await http.post("/api/subscription/payments/create", p, { headers: headers ?? {} });
    if (res.data?.payment) return res.data.payment;
  } catch {
    // fallback local
  }
  const now = new Date().toISOString();
  const payment: Payment = {
    id: nanoid(),
    tenantId: p.tenantId ?? (localStorage.getItem(STORAGE_KEYS.TENANT) ?? "unknown"),
    amountCents: p.amountCents,
    currency: p.currency,
    periodStart: p.periodStart,
    periodEnd: p.periodEnd,
    method: p.method,
    externalId: p.externalId,
    createdAt: now,
  };
  const existing = loadJSON<Payment[]>(LS_PAYMENTS_KEY) ?? [];
  existing.push(payment);
  saveJSON(LS_PAYMENTS_KEY, existing);
  return payment;
}

export async function getUsage(tenantId?: string): Promise<Usage | null> {
  try {
    const headers = tenantHeaders(tenantId);
    const res: AxiosResponse<Usage> = await http.get("/api/subscription/usage", { headers: headers ?? {} });
    return res.data ?? null;
  } catch {
    const all = loadJSON<Usage[]>(LS_USAGE_KEY) ?? [];
    const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? undefined;
    if (!id) return null;
    return all.find((u) => u.tenantId === id) ?? {
      tenantId: id,
      users: 1,
      requests: 20,
      storageGB: 1,
      measuredAt: new Date().toISOString(),
    };
  }
}

async function saveLocalSubscription(s: Subscription): Promise<void> {
  const all = loadJSON<Subscription[]>(LS_SUB_KEY) ?? [];
  const idx = all.findIndex((x) => x.tenantId === s.tenantId);
  if (idx >= 0) all[idx] = s;
  else all.push(s);
  saveJSON(LS_SUB_KEY, all);
}

export async function activateSubscription(actor: string, tenantId?: string): Promise<Subscription | null> {
  const headers = tenantHeaders(tenantId);
  try {
    const res: AxiosResponse<SubscriptionResponse> = await http.post("/api/subscription/activate", { actor }, { headers: headers ?? {} });
    return res.data?.subscription ?? null;
  } catch {
    const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? "unknown";
    const current = (await getSubscription(id)) ?? {
      id: nanoid(),
      tenantId: id,
      planId: "basico" as PlanId,
      state: "en_prueba",
      trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      startedAt: new Date().toISOString(),
      orgName: localStorage.getItem(STORAGE_KEYS.TENANT) ?? id,
    };
    current.state = "activo";
    current.startedAt = new Date().toISOString();
    await saveLocalSubscription(current);

    pushLocalHistoryEvent({ tenantId: id, action: "activate_subscription", actor, meta: { planId: current.planId } });

    return current;
  }
}

export async function changePlan(newPlan: PlanId, actor: string, tenantId?: string): Promise<Subscription | null> {
  const headers = tenantHeaders(tenantId);
  try {
    const res: AxiosResponse<SubscriptionResponse> = await http.post("/api/subscription/change-plan", { newPlan, actor }, { headers: headers ?? {} });
    return res.data?.subscription ?? null;
  } catch {
    const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? "unknown";
    const sub = (await getSubscription(id)) ?? {
      id: nanoid(),
      tenantId: id,
      planId: newPlan,
      state: "activo",
      orgName: id,
      startedAt: new Date().toISOString(),
    };
    const old = sub.planId;
    sub.planId = newPlan;
    await saveLocalSubscription(sub);

    pushLocalHistoryEvent({ tenantId: id, action: "change_plan", actor, meta: { from: old, to: newPlan } });

    return sub;
  }
}

export async function cancelSubscription(actor: string, tenantId?: string): Promise<Subscription | null> {
  const headers = tenantHeaders(tenantId);
  try {
    const res: AxiosResponse<SubscriptionResponse> = await http.post("/api/subscription/cancel", { actor }, { headers: headers ?? {} });
    return res.data?.subscription ?? null;
  } catch {
    const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? "unknown";
    const sub = (await getSubscription(id));
    if (!sub) return null;
    sub.state = "cancelado";
    sub.cancelledAt = new Date().toISOString();
    await saveLocalSubscription(sub);

    pushLocalHistoryEvent({ tenantId: id, action: "cancel_subscription", actor, meta: { planId: sub.planId } });

    return sub;
  }
}

export async function getHistory(page = 1, pageSize = 20, tenantId?: string): Promise<HistoryPage> {
  try {
    const headers = tenantHeaders(tenantId);
    const res: AxiosResponse<HistoryPage> = await http.get("/api/subscription/history", { headers: headers ?? {}, params: { page, pageSize } });
    return res.data;
  } catch {
    const all = loadJSON<HistoryEvent[]>(LS_HIST_KEY) ?? [];
    const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? undefined;
    const filtered = id ? all.filter((h) => h.tenantId === id) : all;
    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const results = filtered.slice(start, start + pageSize);
    return { results, total, page, pageSize };
  }
}

export async function deleteHistoryEvent(id: string, actor: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 80));
  const all = loadJSON<HistoryEvent[]>(LS_HIST_KEY) ?? [];
  saveJSON(LS_HIST_KEY, all.filter((e) => e.id !== id));
  pushLocalHistoryEvent({ tenantId: localStorage.getItem(STORAGE_KEYS.TENANT) ?? "unknown", action: "delete_history_event", actor, meta: { deletedId: id } });
}

export async function clearHistory(actor: string): Promise<void> {
  await new Promise((r) => setTimeout(r, 80));
  saveJSON(LS_HIST_KEY, []);
  pushLocalHistoryEvent({ tenantId: localStorage.getItem(STORAGE_KEYS.TENANT) ?? "unknown", action: "clear_history", actor, meta: {} });
}

export function getPlanDetails(id: PlanId): string[] {
  const common = [
    "Workflow de gestión financiera",
    "Contabilidad básica y reportes",
    "Integraciones con pasarelas de pago",
  ];
  switch (id) {
    case "basico":
      return [...common, "1 espacio de trabajo", "Usuarios limitados", "Reportes mensuales"];
    case "profesional":
      return [...common, "Multi-tenant", "Reportes avanzados y exportes", "Soporte prioritario"];
    case "personalizado":
      return [...common, "Integraciones SSO", "SLA personalizado", "Onboarding dedicado"];
    default:
      return common;
  }
}

export async function startTrial(planId: PlanId, orgName: string, actor: string, tenantId?: string): Promise<Subscription> {
  const headers = tenantHeaders(tenantId);
  try {
    const res: AxiosResponse<SubscriptionResponse> = await http.post(
      "/api/subscription/start-trial",
      { planId, orgName, actor },
      { headers: headers ?? {} }
    );
    if (res.data?.subscription) {
      await saveLocalSubscription(res.data.subscription);
      pushLocalHistoryEvent({ tenantId: res.data.subscription.tenantId, action: "start_trial", actor, meta: { planId } });
      return res.data.subscription;
    }
  } catch {
    // fallback local
  }

  const id = tenantId ?? localStorage.getItem(STORAGE_KEYS.TENANT) ?? `org_local_${Date.now()}`;
  const sub: Subscription = {
    id: nanoid(),
    tenantId: id,
    planId,
    state: "en_prueba",
    orgName,
    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    startedAt: new Date().toISOString(),
  };
  await saveLocalSubscription(sub);
  pushLocalHistoryEvent({ tenantId: id, action: "start_trial", actor, meta: { planId } });
  return sub;
}

// Agregar si no existe
export async function createEmpresa(empresaData: {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  nit?: string;
}): Promise<{ id: number; nombre: string }> {
  try {
    console.log('[billing] 📤 POST /api/empresas/ payload:', JSON.stringify(empresaData, null, 2));
    const res = await http.post<{ id: number; nombre: string }>('/api/empresas/', empresaData);
    console.log('✅ Empresa creada:', res.data);

    // opcional: push local history si quieres seguimiento
    pushLocalHistoryEvent({
      tenantId: String(res.data.id),
      action: 'create_empresa',
      actor: 'system',
      meta: { nombre: res.data.nombre }
    });

    return res.data;
  } catch (error) {
    console.error('❌ Error creando empresa:', error);
    const respData = getAxiosResponseData(error);
    if (respData !== null) {
      console.error('❌ Backend response:', respData);
      const msg = typeof respData === "string" ? respData : JSON.stringify(respData);
      throw new Error(`Error del servidor: ${msg}`);
    }
    throw error instanceof Error ? error : new Error(String(error));
  }
}

// Registrar empresa completa con suscripción
export async function registerCompanyWithSubscription(
  companyData: CompanyRegistrationData
): Promise<{ empresa_id: number; user: unknown; subscription: SuscripcionResponse }> {
  
  // 1. Registrar empresa y usuario
  const registerResponse = await http.post("/api/register/empresa-user/", {
    razon_social: companyData.razon_social,
    nombre_comercial: companyData.nombre_comercial,
    email_contacto: companyData.email_contacto,
    imagen_url_empresa: companyData.imagen_url_empresa || "",
    username: companyData.username,
    password: companyData.password,
    first_name: companyData.first_name,
    last_name: companyData.last_name,
    email: companyData.email,
    imagen_url_perfil: companyData.imagen_url_perfil || ""
  });

  if (!registerResponse.data.empresa?.id) {
    throw new Error("No se recibió empresa_id del servidor");
  }

  const empresa_id = Number(registerResponse.data.empresa.id);
  const user = registerResponse.data.user;

  // 2. Crear suscripción usando el nuevo formato
  const subscriptionResponse = await createSuscripcionFromPlan(
    empresa_id,
    companyData.selected_plan,
    companyData.billing_period
  );

  return {
    empresa_id,
    user,
    subscription: subscriptionResponse
  };
}

// Procesar pago (integrar con Stripe, PayPal, etc.)
export async function processPayment(
  paymentData: PaymentData,
  amount: number,
  currency: string = "USD"
): Promise<{ success: boolean; transactionId?: string; error?: string }> {
  // Aquí integrarías con tu pasarela de pago
  console.log("Procesando pago:", { paymentData, amount, currency });
  
  // Simulación de pago exitoso
  return new Promise((resolve) => {
    setTimeout(() => {
      if (paymentData.method === "card" && paymentData.cardNumber?.startsWith("4")) {
        resolve({
          success: true,
          transactionId: `txn_${Date.now()}`
        });
      } else {
        resolve({
          success: false,
          error: "Tarjeta declinada o datos inválidos"
        });
      }
    }, 2000);
  });
}

// Calcular precio según periodo
export function calculatePrice(plan: Plan, period: "monthly" | "yearly"): number {
  if (period === "yearly" && plan.priceYearly) {
    return plan.priceYearly;
  }
  return plan.priceMonthly || plan.priceUsd;
}

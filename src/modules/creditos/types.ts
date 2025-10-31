// Tipos del dominio de Créditos — SIN any

export type CreditStatus =
  | "SOLICITADO"
  | "EN_EVALUACION"
  | "APROBADO"
  | "RECHAZADO"
  | "DESEMBOLSADO"
  | "EN_MORA"
  | "CANCELADO";

/* Permisos (según diagrama) */
export type Permission =
  | "crear_solicitud"
  | "evaluador_de_credito"
  | "aprobar_solicitud"
  | "desembolsar_credito"
  | "cajero";

/* Cliente (app_cliente) */
export interface Client {
  id: number | string;
  nombre: string;
  apellido?: string;
  documento?: string;
  email?: string | null;
  telefono?: string | null;
  fecha_registro?: string | null;
}

/* Tipo de crédito (app_tipo_de_credito) */
export interface CreditType {
  id: number | string;
  nombre: string;
  descripcion?: string | null;
  tasa_interes_anual: number;
  plazo_meses: number;
  monto_minimo?: number | null;
  requiere_garante?: boolean;
  esta_activo?: boolean;
}

/* Documento subido por cliente (app_documento_cliente) */
export interface ClientDocument {
  id: number | string;
  credito_id: number | string;
  tipo?: string | null;
  archivo_url: string;
  fecha_subida: string;
  uploaded_by?: string | null;
}

/** Payload que llega del backend */
export interface CreditDTO {
  id: number | string;
  codigo: string;
  cliente_id: number | string;
  cliente_nombre: string;
  producto?: string;
  moneda: Moneda;
  monto: number;
  tasa_anual: number;
  plazo_meses: number;
  frecuencia: Frecuencia;
  sistema: SistemaAmortizacion;
  estado: CreditStatus;
  fecha_solicitud?: string | null;
  fecha_aprobacion?: string | null;
  fecha_desembolso?: string | null;
  fecha_programada?: string | null;
  saldo_capital?: number | null;
  score?: number | null;
  analista?: string | null;
  cuenta_origen_id?: number | string | null;
  beneficiario_cuenta_id?: number | string | null;
  referencia_bancaria?: string | null;
  conciliado_at?: string | null;
}

/** Tipo normalizado para la UI */
export interface Credit {
  id: number | string;
  codigo: string;
  cliente: string;
  producto?: string;
  moneda: Moneda;
  monto: number;
  tasa_anual: number;
  plazo_meses: number;
  frecuencia: Frecuencia;
  sistema: SistemaAmortizacion;
  estado: CreditStatus;
  fecha_solicitud?: string | null;
  fecha_aprobacion?: string | null;
  fecha_desembolso?: string | null;
  fecha_programada?: string | null;
  saldo_capital: number;
  score?: number | null;
  analista?: string | null;
  cuenta_origen_id?: number | string | null;
  beneficiario_cuenta_id?: number | string | null;
  referencia_bancaria?: string | null;
  conciliado_at?: string | null;
}

export interface ListCreditsParams {
  search?: string;
  estado?: CreditStatus | "ALL";
  moneda?: Moneda | "ALL";
  desde?: string; // ISO date
  hasta?: string; // ISO date
  page?: number;
  page_size?: number;
}

export interface Page<T> {
  results: T[];
  count: number;
  page: number;
  page_size: number;
}

/** Adaptador UI */
export const adaptCredit = (d: CreditDTO): Credit => ({
  id: d.id,
  codigo: d.codigo,
  cliente: d.cliente_nombre,
  producto: d.producto,
  moneda: d.moneda,
  monto: d.monto,
  tasa_anual: d.tasa_anual,
  plazo_meses: d.plazo_meses,
  frecuencia: d.frecuencia,
  sistema: d.sistema,
  estado: d.estado,
  fecha_solicitud: d.fecha_solicitud ?? null,
  fecha_aprobacion: d.fecha_aprobacion ?? null,
  fecha_desembolso: d.fecha_desembolso ?? null,
  fecha_programada: d.fecha_programada ?? null,
  saldo_capital: typeof d.saldo_capital === "number" ? d.saldo_capital : d.monto,
  score: typeof d.score === "number" ? d.score : null,
  analista: d.analista ?? null,
  cuenta_origen_id: d.cuenta_origen_id ?? null,
  beneficiario_cuenta_id: d.beneficiario_cuenta_id ?? null,
  referencia_bancaria: d.referencia_bancaria ?? null,
  conciliado_at: d.conciliado_at ?? null,
});

/**
 * Moneda: códigos ISO o abreviaturas que uses en backend.
 * Ajusta los valores si tu backend usa otros códigos (p.ej. "PEN", "USD", "EUR", "CLP").
 */
export type Moneda = "USD" | "EUR" | "PEN" | "CLP" | "ARS";

/**
 * Frecuencia de pago usada en los créditos
 */
export type Frecuencia = "MENSUAL" | "QUINCENAL" | "SEMANAL";

/**
 * Sistema de amortización (según tu diagrama / backend)
 */
export type SistemaAmortizacion = "FRANCES" | "ALEMAN" | "AMERICANO";

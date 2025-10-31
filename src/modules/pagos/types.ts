export type ID = string | number;

export type PaymentStatus = 
  | "PENDIENTE"
  | "PROCESANDO" 
  | "COMPLETADO"
  | "FALLIDO"
  | "CANCELADO"
  | "REEMBOLSADO";

export type PaymentMethod = 
  | "TRANSFERENCIA"
  | "TARJETA_CREDITO"
  | "TARJETA_DEBITO"
  | "EFECTIVO"
  | "BILLETERA_DIGITAL"
  | "DESCUENTO_NOMINA";

export interface Payment {
  id: ID;
  credito_id: ID;
  numero_cuota: number;
  monto_programado: number;
  monto_pagado: number;
  fecha_vencimiento: string;
  fecha_pago?: string;
  estado: PaymentStatus;
  metodo_pago?: PaymentMethod;
  referencia_transaccion?: string;
  observaciones?: string;
  mora_dias?: number;
  interes_mora?: number;
  created_at: string;
  updated_at?: string;
}

// Información del crédito asociado al pago
export interface CreditInfo {
  id: ID;
  codigo: string;
  cliente_nombre: string;
  cliente_documento: string;
  producto: string;
  monto_original: number;
  moneda: string;
  tasa_anual: number;
  plazo_meses: number;
  estado: string;
  fecha_desembolso: string;
  saldo_pendiente: number;
  cuotas_pagadas: number;
  cuotas_totales: number;
  proxima_cuota?: Payment;
}

// Para mostrar pagos con información del crédito
export interface PaymentWithCredit extends Payment {
  credito: CreditInfo;
}

export interface ListPaymentsParams {
  page?: number;
  page_size?: number;
  search?: string; // buscar por cliente, código crédito, referencia
  estado?: PaymentStatus | "ALL";
  credito_id?: ID;
  metodo_pago?: PaymentMethod | "ALL";
  fecha_desde?: string;
  fecha_hasta?: string;
  solo_vencidos?: boolean;
  solo_en_mora?: boolean;
}

export interface Page<T> {
  results: T[];
  count: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface PaymentSummary {
  total_pendientes: number;
  total_completados: number;
  total_vencidos: number;
  total_en_mora: number;
  monto_pendiente: number;
  monto_cobrado_mes: number;
  creditos_activos: number;
}

export interface ProcessPaymentInput {
  pago_id: ID;
  monto_pagado: number;
  metodo_pago: PaymentMethod;
  referencia_transaccion?: string;
  observaciones?: string;
}
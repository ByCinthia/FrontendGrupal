// Tipos para el módulo de Tipos de Crédito

export interface TipoCredito {
  id: number;
  nombre: string;
  descripcion: string;
  monto_minimo: number;
  monto_maximo: number;
  created_at?: string;
  updated_at?: string;
}

export interface CreateTipoCreditoInput {
  nombre: string;
  descripcion: string;
  monto_minimo: number;
  monto_maximo: number;
}

export interface UpdateTipoCreditoInput extends Partial<CreateTipoCreditoInput> {
  id: number;
}

export interface ListTiposCreditoParams {
  search?: string;
  page?: number;
  page_size?: number;
}

export interface TiposCreditoPage {
  results: TipoCredito[];
  count: number;
  page: number;
  page_size: number;
}
// Tipos basados en el modelo Django Tipo_Credito
export type TipoCredito = {
  id: number;
  nombre: string;
  descripcion: string;
  monto_minimo: string | number; // Django DecimalField puede ser string o number
  monto_maximo: string | number;
  // Django añade automáticamente estos campos si están en el serializer
  created_at?: string;
  updated_at?: string;
};

export type CreateTipoCreditoInput = {
  nombre: string;
  descripcion: string;
  monto_minimo: number;
  monto_maximo: number;
};

export type UpdateTipoCreditoInput = CreateTipoCreditoInput & { id: number };

export type ListTiposCreditoParams = {
  search?: string;
  page?: number;
  page_size?: number;
};

export type TiposCreditoPage = {
  results: TipoCredito[];
  count: number;
  page: number;
  page_size: number;
};
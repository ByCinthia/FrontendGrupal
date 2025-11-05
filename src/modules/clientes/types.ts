// Tipos basados en los modelos Django
export type Trabajo = {
  id?: number;
  cargo: string;
  empresa: string;
  extracto_url: string;
  salario: number;
  ubicacion: string;
  descripcion: string;
};

export type Documentacion = {
  id?: number;
  ci: string;
  documento_url: string;
  fecha_registro?: string;
};

export type Garante = {
  id?: number;
  nombrecompleto: string;
  ci: string;
  telefono: string;
};

export type Domicilio = {
  id?: number;
  descripcion: string;
  croquis_url: string;
  es_propietario: boolean;
  numero_ref: string;
};

export type Cliente = {
  id?: number;
  nombre: string;
  apellido: string;
  telefono: string;
  fecha_registro?: string;
  // Relaciones (opcional según tu API)
  trabajo?: Trabajo;
  documentacion?: Documentacion[];
  garantes?: Garante[];
  domicilio?: Domicilio;
};

// Tipos para formularios y API
export type CreateClienteInput = {
  nombre: string;
  apellido: string;
  telefono: string;
  trabajo?: Omit<Trabajo, 'id'>;
  domicilio?: Omit<Domicilio, 'id'>;
  documentacion?: Omit<Documentacion, 'id' | 'fecha_registro'>[];
  garantes?: Omit<Garante, 'id'>[];
};

export type UpdateClienteInput = Partial<CreateClienteInput> & { id: number };

export type ListClientesParams = {
  search?: string;
  page?: number;
  page_size?: number;
};

export type ClientesPage = {
  results: Cliente[];
  count: number;
  page: number;
  page_size: number;
};
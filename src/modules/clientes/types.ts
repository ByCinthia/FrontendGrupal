export interface Cliente {
  id: number;
  nombre: string;
  apellido?: string;
  ci?: string;
  telefono?: string;
  fecha_registro?: string;
  // campos adicionales que tenga tu API
  [k: string]: unknown;
}
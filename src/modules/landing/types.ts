// Tipos para el registro de empresa
export interface RegistrationForm {
  // Campos que espera el backend
  razon_social: string;
  email_contacto: string;
  nombre_comercial: string;
  imagen_url_empresa?: string;
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  email: string;
  imagen_url_perfil?: string;
  
  // Campos auxiliares UI
  confirm_password: string;
  selected_plan: string;
}

// Tipos adicionales (para futura expansión)
export interface InstitutionData {
  razon_social: string;
  email_contacto: string;
  fecha_registro: string;
  nombre: string;
  logo_url?: string;
}

export interface DomainData {
  id_organization: string;
  subdomain: string;
  is_primary: boolean;
}

export interface AdminUserData {
  password: string;
  is_superuser: boolean;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  is_staff: boolean;
  is_active: boolean;
  date_joined: string;
}

// Asegurar que los enum coincidan con las choices del modelo Django
export type PlanEnum = 'BASICO' | 'PROFESIONAL' | 'PREMIUM';
export type EstadoEnum = 'ACTIVO' | 'PAUSADO' | 'CANCELADO';

export interface CreateSuscripcionPayload {
  empresa: number;
  enum_plan: PlanEnum;
  enum_estado?: EstadoEnum;
  fecha_fin?: string | null;
  activo?: boolean;
}
export interface ReportFilter {
  tipo_reporte: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  estado?: string;
  usuario?: string;
  cliente?: string;
  monto_min?: number;
  monto_max?: number;
  departamento?: string;
}

export interface ReportData {
  id: string;
  fecha: string; // ISO date yyyy-mm-dd
  tipo: string;
  cliente: string;
  monto: number;
  estado: string;
  usuario: string;
  observaciones?: string;
}

export interface AuditLogEntry {
  id: string;
  action: string;
  user: string;
  timestamp: string; // ISO
  details?: string;
}
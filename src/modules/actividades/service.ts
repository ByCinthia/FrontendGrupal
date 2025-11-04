export interface ActivityItem {
  id: string;
  user: string;         // nombre o username
  action: string;       // resumen de la acción
  timestamp: string;    // ISO
  details: string;      // descripción larga / JSON string
  type: "create" | "update" | "delete" | "view" | "export" | "login" | "logout" | string;
  target?: string;      // opcional: recurso afectado
}

export interface ActivitiesPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: ActivityItem[];
}

/**
 * fetchActivities - obtiene actividades (filtradas por empresa si se pasa companyId)
 * Usa el endpoint REST del backend (ajusta la ruta si tu API difiere).
 */
export async function fetchActivities(
  companyId?: number,
  page = 1,
  pageSize = 50
): Promise<ActivitiesPage> {
  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("page_size", String(pageSize));
  if (companyId !== undefined && companyId !== null) params.set("empresa", String(companyId));

  const url = `/api/admin-log/?${params.toString()}`; // ajusta si tu ruta es /api/admin-log/ o /api/User/admin-log/
  const res = await fetch(url, { credentials: "include" });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Error al obtener actividades (${res.status}) ${txt}`);
  }

  const json = (await res.json()) as ActivitiesPage;
  return json;
}
import type { AuthUser } from "../../modules/auth/types";

export type MenuItem = {
  path: string;
  label: string;
  icon?: string;
  exact?: boolean;
  roles?: string[];
};

export function getMenuForUser(user: AuthUser | null): MenuItem[] {
  const roles: string[] = Array.isArray(user?.roles) ? user.roles.map(String) : [];
  const hasRole = (r: string) => roles.includes(r);

  const common: MenuItem[] = [
    { path: "/app", label: "Dashboard", icon: "🏠", exact: true },
    { path: "/app/reportes", label: "Reportes", icon: "📈" },
    { path: "/app/creditos", label: "Créditos", icon: "💳" },
    { path: "/app/ingresos", label: "Ingresos", icon: "💹" },
    { path: "/app/pagos", label: "Pagos", icon: "💳" },
    { path: "/app/personalizacion", label: "Personalización", icon: "🎨" },
  ];

  const adminOnly: MenuItem[] = [
    { path: "/app/usuarios", label: "Usuarios", icon: "👥" },
    { path: "/app/actividades", label: "Actividades", icon: "📋" },
    { path: "/app/creditos/tipos", label: "Tipos de Crédito", icon: "💳" },
  ];

  const superAdminOnly: MenuItem[] = [
    { path: "/app/empresas", label: "Empresas", icon: "🏢" },
    { path: "/app/auditoria", label: "Auditoría", icon: "🔍" },
  ];

  let items = [...common];

  if (hasRole("admin") || hasRole("superadmin")) {
    items = [...items, ...adminOnly];
  }
  
  if (hasRole("superadmin")) {
    items = [...items, ...superAdminOnly];
  }

  return items;
}
import type { AuthUser } from "../../modules/auth/types";

export type MenuItem = {
  path: string;
  label: string;
  icon?: string;
  exact?: boolean;
  roles?: string[]; // opcional: roles permitidos
};

export function getMenuForUser(user: AuthUser | null): MenuItem[] {
  const roles: string[] = Array.isArray(user?.roles) ? user.roles.map(String) : [];
  const hasRole = (r: string) => roles.includes(r);

  const common: MenuItem[] = [
    { path: "/", label: "Dashboard", icon: "🏠", exact: true },
    { path: "/reportes", label: "Reportes", icon: "📈" },
    { path: "/ingresos", label: "Ingresos", icon: "💹" },
    { path: "/pagos", label: "Pagos", icon: "💳" },
    // Personalización disponible para todos los roles/menus
    { path: "/personalizacion", label: "Personalización", icon: "🎨" },
  ];

  const adminOnly: MenuItem[] = [
    { path: "/usuarios", label: "Usuarios", icon: "👥" },
  ];

  const superAdminOnly: MenuItem[] = [
    { path: "/empresas", label: "Empresas", icon: "🏢" },
  ];

  let items = [...common];

  if (hasRole("admin")) items = [...items, ...adminOnly];
  if (hasRole("superadmin")) items = [...items, ...adminOnly, ...superAdminOnly];

  return items;
}
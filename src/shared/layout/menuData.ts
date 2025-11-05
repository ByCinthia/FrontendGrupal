import type { AuthUser } from "../../modules/auth/types";

export type MenuItem = {
  path: string;
  label: string;
  icon?: string;
  exact?: boolean;
  roles?: string[];
  children?: MenuItem[];
};

export function getMenuForUser(user: AuthUser | null): MenuItem[] {
  const roles: string[] = Array.isArray(user?.roles) ? user.roles.map(String) : [];
  const hasRole = (r: string) => roles.includes(r);
  const isAdmin = hasRole("admin") || hasRole("superadmin");
  const isSuper = hasRole("superadmin");

  // Menú común para cualquier usuario autenticado dentro de una empresa
  const tenantMenu: MenuItem[] = [
    { path: "/app", label: "Dashboard", icon: "🏠", exact: true },
    { path: "/app/reportes", label: "Reportes", icon: "📈" },
    {
      path: "/app/creditos",
      label: "Créditos",
      icon: "💳",
      children: [
        { path: "/app/creditos", label: "Ver créditos", icon: "📋" },
        { path: "/app/creditos/crear", label: "Crear crédito", icon: "➕" },
        // NOTA: "Tipos de crédito" se añadirá solo para admins más abajo
      ],
    },
    {
      path: "/app/clientes",
      label: "Clientes",
      icon: "👥",
      children: [
        { path: "/app/clientes", label: "Historial", icon: "📋" },
        { path: "/app/clientes/crear", label: "Crear cliente", icon: "➕" },
      ],
    },
    { path: "/app/ingresos", label: "Ingresos", icon: "💹" },
    { path: "/app/pagos", label: "Pagos", icon: "💳" },
    { path: "/app/personalizacion", label: "Personalización", icon: "🎨" },
  ];

  // Opciones disponibles solo para administradores de la empresa / plataforma
  const adminMenu: MenuItem[] = [
    { path: "/app/usuarios", label: "Usuarios", icon: "👥" },
    { path: "/app/actividades", label: "Actividades", icon: "📋" }
  ];

  // Opciones solo para superadmins (control multi-empresa)
  const superAdminMenu: MenuItem[] = [
    { path: "/app/empresas", label: "Empresas", icon: "🏢" },
    { path: "/app/auditoria", label: "Auditoría", icon: "🔍" },
  ];

  // Si no hay usuario autenticado: menú público reducido (login/landing)
  if (!user) {
    return [
      { path: "/", label: "Inicio", icon: "🏠" },
      { path: "/login", label: "Ingresar", icon: "🔐" }
    ];
  }

  // Si es usuario de empresa (tenant)
  let menu = [...tenantMenu];

  // Añadir elemento "Tipos de crédito" dentro de Créditos SOLO para admins
  if (isAdmin) {
    const creditosIndex = menu.findIndex(i => i.path === "/app/creditos");
    if (creditosIndex >= 0) {
      menu[creditosIndex].children = menu[creditosIndex].children ?? [];
      menu[creditosIndex].children.push({ path: "/app/creditos/tipos", label: "Tipos de crédito", icon: "🧾" });
    }

    // Añadir menú admin general
    menu = [...menu, ...adminMenu];
  }

  // Añadir elementos de superadmin si aplica
  if (isSuper) {
    menu = [...menu, ...superAdminMenu];
  }

  return menu;
}
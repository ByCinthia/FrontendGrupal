export type MenuItem = {
  path: string;
  label: string;
  icon?: string;
  exact?: boolean;
  roles?: string[];
  permissions?: string[];
};

export type UserLike = {
  roles?: string[];
  empresa_id?: number | string | null;
  permissions?: string[];
};

// Menús por tipo
export const SUPER_ADMIN_MENU: MenuItem[] = [
  { path: "/", label: "Dashboard Global", icon: "🌐", exact: true },
  { path: "/empresas", label: "Todas las Empresas", icon: "🏢" },
  { path: "/empresas/crear", label: "Crear Empresa", icon: "➕" },
  { path: "/usuarios-globales", label: "Todos los Usuarios", icon: "👥" },
  { path: "/administradores", label: "Administradores", icon: "👑" },
  { path: "/reportes-globales", label: "Reportes Globales", icon: "📊" },
  { path: "/ingresos-plataforma", label: "Ingresos Plataforma", icon: "💰" },
  { path: "/metricas-uso", label: "Métricas de Uso", icon: "📈" },
  { path: "/auditoria-global", label: "Auditoría Global", icon: "🔍" },
  { path: "/logs-sistema", label: "Logs del Sistema", icon: "📋" },
  { path: "/configuracion-plataforma", label: "Config. Plataforma", icon: "⚙️" },
  { path: "/backup-global", label: "Backup Global", icon: "💾" },
  { path: "/planes-suscripcion", label: "Planes y Suscripciones", icon: "💳" },
];

export const COMPANY_ADMIN_MENU: MenuItem[] = [
  { path: "/", label: "Dashboard Empresa", icon: "🏠", exact: true },
  { path: "/mi-empresa", label: "Mi Empresa", icon: "🏢" },
  { path: "/configuracion-empresa", label: "Configuración", icon: "⚙️" },
  { path: "/usuarios", label: "Usuarios", icon: "👥" },
  { path: "/crear-usuario", label: "Crear Usuario", icon: "➕" },
  { path: "/grupos", label: "Grupos y Roles", icon: "👨‍👩‍👧‍👦" },
  { path: "/permisos", label: "Permisos", icon: "🔐" },
  { path: "/creditos", label: "Créditos", icon: "💰" },
  { path: "/pagos", label: "Pagos", icon: "💳" },
  { path: "/facturas", label: "Facturas", icon: "🧾" },
  { path: "/inventario", label: "Inventario", icon: "📦" },
  { path: "/reportes", label: "Reportes", icon: "📊" },
  { path: "/ingresos", label: "Dashboard Ingresos", icon: "📈" },
  { path: "/actividades", label: "Actividades", icon: "📋" },
  { path: "/auditoria", label: "Auditoría", icon: "🔍" },
  { path: "/personalizacion", label: "Personalización", icon: "🎨" },
  { path: "/backup", label: "Backup", icon: "💾" },
  { path: "/mi-suscripcion", label: "Mi Suscripción", icon: "💎" },
];

export const COMPANY_USER_MENU: MenuItem[] = [
  { path: "/", label: "Mi Dashboard", icon: "🏠", exact: true },
  { path: "/perfil", label: "Mi Perfil", icon: "👤" },
  { path: "/creditos", label: "Créditos", icon: "💰", permissions: ["view_credits"] },
  { path: "/pagos", label: "Pagos", icon: "💳", permissions: ["view_payments"] },
  { path: "/facturas", label: "Facturas", icon: "🧾", permissions: ["view_invoices"] },
  { path: "/inventario", label: "Inventario", icon: "📦", permissions: ["view_inventory"] },
  { path: "/mis-reportes", label: "Mis Reportes", icon: "📊", permissions: ["view_reports"] },
  { path: "/mis-actividades", label: "Mis Actividades", icon: "📋" },
];

export function getMenuForUser(user: UserLike | null): MenuItem[] {
  if (!user) return [];

  if (user.roles?.includes("superadmin")) return SUPER_ADMIN_MENU;
  if (user.roles?.includes("admin") && user.empresa_id) return COMPANY_ADMIN_MENU;
  if (user.empresa_id) {
    return COMPANY_USER_MENU.filter((item) => {
      if (!item.permissions || item.permissions.length === 0) return true;
      if (!user.permissions) return false;
      return item.permissions.some((p) => user.permissions!.includes(p) || user.permissions!.includes("*"));
    });
  }

  return [
    { path: "/", label: "Dashboard", icon: "🏠", exact: true },
    { path: "/perfil", label: "Mi Perfil", icon: "👤" },
  ];
}

// Compatibilidad
export const MENU = COMPANY_ADMIN_MENU;
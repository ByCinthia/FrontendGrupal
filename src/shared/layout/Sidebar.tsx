import React, { useCallback, useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useAuth } from "../../modules/auth/service";
import { getMenuForUser, type MenuItem } from "./menuData";
import "./sidebar.css";

export type SidebarProps = {
  brand?: string;
  collapseOnNavigate?: boolean;
};

const STORAGE_KEY = "ui.sidebar.collapsed";
const EXPANDED_MODULES_KEY = "ui.sidebar.expanded";

const Sidebar: React.FC<SidebarProps> = ({ brand = "Mi Empresa", collapseOnNavigate = false }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  // Estado para módulos expandidos
  const [expandedModules, setExpandedModules] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(EXPANDED_MODULES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(EXPANDED_MODULES_KEY, JSON.stringify(expandedModules));
    } catch {
      // ignore
    }
  }, [expandedModules]);

  // Auto-expandir módulo si estamos en una de sus rutas hijas
  useEffect(() => {
    const menuItems = getMenuForUser(user ?? null);
    menuItems.forEach(item => {
      if (item.children && item.children.some(child => location.pathname === child.path)) {
        if (!expandedModules.includes(item.path)) {
          setExpandedModules(prev => [...prev, item.path]);
        }
      }
    });
  }, [location.pathname, user]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  const toggleModule = useCallback((modulePath: string) => {
    setExpandedModules(prev => 
      prev.includes(modulePath) 
        ? prev.filter(p => p !== modulePath)
        : [...prev, modulePath]
    );
  }, []);

  const handleLogout = async () => {
    if (confirm("¿Estás seguro que quieres cerrar sesión?")) {
      await logout();
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    const to = item.path === "/" ? "/app" : item.path.startsWith("/app") ? item.path : `/app${item.path}`;
    const hasChildren = item.children && item.children.length > 0;
    const isExpanded = expandedModules.includes(item.path);
    const isActive = location.pathname === item.path || (hasChildren && item.children?.some(child => location.pathname === child.path));

    if (hasChildren) {
      return (
        <div key={item.path} className="module-group">
          <button
            className={`module-link module-link--expandable${isActive ? " module-link--active" : ""}`}
            onClick={() => toggleModule(item.path)}
            title={collapsed ? item.label : undefined}
          >
            <div className="module-icon">
              {item.icon ?? "•"}
            </div>
            {!collapsed && (
              <>
                <span className="module-label">{item.label}</span>
                <span className={`module-chevron ${isExpanded ? "module-chevron--expanded" : ""}`}>
                  
                </span>
              </>
            )}
          </button>

          {/* Submódulos - solo mostrar si está expandido y sidebar no está colapsado */}
          {isExpanded && !collapsed && (
            <div className="module-children">
              {item.children?.map(child => (
                <NavLink
                  key={child.path}
                  to={child.path}
                  className={({ isActive }) => `module-link module-link--child${isActive ? " module-link--active" : ""}`}
                  onClick={() => {
                    if (collapseOnNavigate) {
                      setCollapsed(true);
                    }
                  }}
                >
                  <div className="module-icon module-icon--child">
                    {child.icon ?? "•"}
                  </div>
                  <span className="module-label">{child.label}</span>
                </NavLink>
              ))}
            </div>
          )}
        </div>
      );
    }

    // Módulo sin hijos
    return (
      <NavLink
        key={item.path}
        to={to}
        end={item.exact}
        className={({ isActive }) => `module-link${isActive ? " module-link--active" : ""}`}
        title={collapsed ? item.label : undefined}
        onClick={() => {
          if (collapseOnNavigate) {
            setCollapsed(true);
          }
        }}
      >
        <div className="module-icon">
          {item.icon ?? "•"}
        </div>
        {!collapsed && (
          <span className="module-label">{item.label}</span>
        )}
      </NavLink>
    );
  };

  const avatarUrl =
    ((user as unknown) as Record<string, unknown>)["imagen_url_perfil"] ??
    ((user as unknown) as Record<string, unknown>)["imagen_url"] ??
    undefined;

  const menuItems = getMenuForUser(user ?? null);
  const userName = user?.nombre_completo ?? user?.username ?? "Usuario";
  const companyName = user?.empresa_nombre ?? brand;

  return (
    <>
      <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`} aria-hidden={collapsed}>
        {/* AVATAR CON LUZ VIBRANTE - PARTE SUPERIOR */}
        <div className="sidebar__profile">
          <div className="user-avatar-container">
            <div className="user-avatar-glow">
              {typeof avatarUrl === "string" && avatarUrl ? (
                <img src={avatarUrl as string} alt="Avatar" className="user-avatar" />
              ) : user?.email ? (
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=3b82f6&color=fff&size=96`}
                  alt="Avatar"
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar user-avatar--placeholder">👤</div>
              )}
            </div>

            {!collapsed && <div className="user-name">{userName}</div>}
            {!collapsed && companyName && <div className="brand-name" style={{ fontSize: 12, color: "var(--sidebar-text-muted)", marginTop: 4 }}>{companyName}</div>}
          </div>
        </div>

        {/* BOTÓN DE TOGGLE */}
        <div className="sidebar__toggle-container">
          <button
            type="button"
            className="sidebar__toggle"
            onClick={toggle}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="3" cy="10" r="2" fill="currentColor" />
                <circle cx="10" cy="10" r="2" fill="currentColor" />
                <circle cx="17" cy="10" r="2" fill="currentColor" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <rect x="2" y="4" width="16" height="2" rx="1" fill="currentColor" />
                <rect x="2" y="9" width="16" height="2" rx="1" fill="currentColor" />
                <rect x="2" y="14" width="16" height="2" rx="1" fill="currentColor" />
              </svg>
            )}
          </button>
        </div>

        {/* MÓDULOS DEL SISTEMA */}
        <nav className="sidebar__nav" aria-label="Navegación principal">
          {menuItems.map(renderMenuItem)}
        </nav>

        {/* LOGOUT EN LA PARTE INFERIOR */}
        <div className="sidebar__footer">
          <button onClick={handleLogout} className="logout-btn" title={collapsed ? "Cerrar Sesión" : undefined}>
            <span className="logout-icon">🚪</span>
            {!collapsed && <span>Salir</span>}
          </button>
        </div>
      </aside>

      {/* OVERLAY PARA MÓVIL */}
      {!collapsed && (
        <div
          className="sidebar-overlay"
          onClick={() => setCollapsed(true)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            zIndex: 999,
            display: window.innerWidth < 1024 ? "block" : "none"
          }}
        />
      )}
    </>
  );
};

export default Sidebar;


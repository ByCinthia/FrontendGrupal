import React, { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../modules/auth/service";
import { getMenuForUser } from "./menuData";
import "./sidebar.css";

export type SidebarProps = {
  brand?: string;
  collapseOnNavigate?: boolean;
};

const STORAGE_KEY = "ui.sidebar.collapsed";

const Sidebar: React.FC<SidebarProps> = ({ brand = "Mi Empresa", collapseOnNavigate = false }) => {
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, collapsed ? "1" : "0");
    } catch {
      // ignore
    }
  }, [collapsed]);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);

  const handleLogout = async () => {
    if (confirm("¿Estás seguro que quieres cerrar sesión?")) {
      await logout();
    }
  };

  const avatarUrl =
    ((user as unknown) as Record<string, unknown>)["imagen_url_perfil"] ??
    ((user as unknown) as Record<string, unknown>)["imagen_url"] ??
    undefined;

  const menuItems = getMenuForUser(user ?? null);
  const userName = user?.nombre_completo ?? user?.username ?? "Usuario";
  const companyName = user?.empresa_nombre ?? brand; // ← usar 'brand' como fallback

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

            {/* NOMBRE DEL USUARIO - Solo si no está colapsado */}
            {!collapsed && <div className="user-name">{userName}</div>}
            {/* mostrar brand/empresa debajo del nombre (fallback) */}
            {!collapsed && companyName && <div className="brand-name" style={{ fontSize: 12, color: "var(--sidebar-text-muted)", marginTop: 4 }}>{companyName}</div>}
          </div>
        </div>

        {/* BOTÓN DE TOGGLE - 3 líneas/puntos */}
        <div className="sidebar__toggle-container">
          <button
            type="button"
            className="sidebar__toggle"
            onClick={toggle}
            aria-label={collapsed ? "Expandir menú" : "Colapsar menú"}
          >
            {collapsed ? (
              // 3 puntos cuando está colapsado
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <circle cx="3" cy="10" r="2" fill="currentColor" />
                <circle cx="10" cy="10" r="2" fill="currentColor" />
                <circle cx="17" cy="10" r="2" fill="currentColor" />
              </svg>
            ) : (
              // 3 líneas cuando está expandido
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
          {menuItems.map((item) => {
            const to = item.path === "/" ? "/app" : item.path.startsWith("/app") ? item.path : `/app${item.path}`;
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
          })}
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

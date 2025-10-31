import React, { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../modules/auth/service";
import { getMenuForUser } from "./menuData";
import "./sidebar.css";

export type SidebarProps = {
  brand?: string;
  /** si quieres que el sidebar colapse automáticamente al navegar */
  collapseOnNavigate?: boolean;
};

const STORAGE_KEY = "ui.sidebar.collapsed";
const LOGO_STORAGE_KEY = "ui.company.logo";

const Sidebar: React.FC<SidebarProps> = ({ brand = "Mi Empresa", collapseOnNavigate = false }) => {
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch {
      return false;
    }
  });

  // companyLogo ahora se usa para mostrar el logo en el header del sidebar
  const [companyLogo] = useState<string>(() => {
    try {
      return localStorage.getItem(LOGO_STORAGE_KEY) || "";
    } catch {
      return "";
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "=") {
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || (active as HTMLElement).isContentEditable)) {
          return;
        }
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);

    const evHandler = () => toggle();
    window.addEventListener("app:toggle-sidebar", evHandler as EventListener);

    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("app:toggle-sidebar", evHandler as EventListener);
    };
  }, [toggle]);

  const getUserRole = () => {
    if (user?.roles?.includes("superadmin")) return "Super Admin";
    if (user?.roles?.includes("admin")) return "Administrador";
    return "Usuario";
  };

  const handleLogout = async () => {
    if (confirm("¿Estás seguro que quieres cerrar sesión?")) {
      await logout();
    }
  };

  // acceder de forma segura a propiedades que no están en AuthUser typings
  const avatarUrl =
    ((user as unknown) as Record<string, unknown>)["imagen_url_perfil"] ??
    ((user as unknown) as Record<string, unknown>)["imagen_url"] ??
    undefined;

  const menuItems = getMenuForUser(user ?? null);

  // Nombre de empresa: preferir valor de sesión, si no usar prop 'brand'
  const companyName = user?.empresa_nombre || brand;

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`} aria-hidden={collapsed}>
      {/* PERFIL en la parte superior - Solo avatar y rol */}
      <div className="sidebar__profile">
        <div className="user-profile">
          <div className="user-profile__avatar">
            {typeof avatarUrl === "string" && avatarUrl ? (
              <img src={avatarUrl as string} alt="Avatar" className="user-profile__image--large" />
            ) : user?.email ? (
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(user?.nombre_completo ?? user?.username ?? "Usuario")}&background=667eea&color=fff&size=96`}
                alt="Avatar"
                className="user-profile__image--large"
              />
            ) : (
              <div className="user-profile__placeholder--large">👤</div>
            )}
          </div>

          {!collapsed && (
            <div className="user-profile__info">
              <span className="user-profile__role">{getUserRole()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Header del Sidebar - muestra logo (si existe) y toggle */}
      <div className="sidebar__header">
        <div className="brand">
          {companyLogo ? (
            <img src={companyLogo} alt={`${companyName} logo`} className="brand__logo" />
          ) : (
            <div className="brand__logo brand__logo--placeholder">{companyName.charAt(0).toUpperCase()}</div>
          )}
          {!collapsed && (
            <div className="brand__info">
              <span className="brand__name">{companyName}</span>
              <span className="brand__subtitle">{user?.roles?.includes("superadmin") ? "Plataforma Global" : "Sistema"}</span>
            </div>
          )}
        </div>

        <button
          type="button"
          className="sidebar__toggle"
          onClick={toggle}
          aria-pressed={collapsed}
          title="Alternar menú (=)"
          aria-label={collapsed ? "Abrir menú" : "Cerrar menú"}
        >
          <svg width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect y="0" width="18" height="2" rx="1" fill="currentColor" />
            <rect y="6" width="18" height="2" rx="1" fill="currentColor" />
            <rect y="12" width="18" height="2" rx="1" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Navegación Principal - MENÚ DINÁMICO */}
      <nav className="nav" aria-label="Navegación principal">
        {menuItems.map((item) => {
          const to = item.path === "/" ? "/app" : item.path.startsWith("/app") ? item.path : `/app${item.path}`;
          return (
            <NavLink
              key={item.path}
              to={to}
              end={item.exact}
              className={({ isActive }) => `nav-link${isActive ? " nav-link--active" : ""}`}
              title={item.label}
              onClick={() => {
                if (collapseOnNavigate) setCollapsed(true);
              }}
            >
              <span className="nav-link__icon">{item.icon ?? "•"}</span>
              {!collapsed && <span className="nav-link__label">{item.label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="sidebar__footer">
        <button onClick={handleLogout} className="logout-btn" title="Cerrar Sesión">
          <span className="logout-btn__icon">🚪</span>
          {!collapsed && <span className="logout-btn__text">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

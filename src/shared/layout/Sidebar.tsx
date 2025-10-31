import React, { useCallback, useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../modules/auth/service";
import { getMenuForUser } from "./menuData";

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

  const toggle = useCallback(() => setCollapsed(c => !c), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // tecla '=' para alternar (sin importar si está con shift)
      if (e.key === "=") {
        // evitar cuando se está escribiendo en inputs/textareas
        const active = document.activeElement;
        if (active && (active.tagName === "INPUT" || active.tagName === "TEXTAREA" || (active as HTMLElement).isContentEditable)) {
          return;
        }
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handler);

    // escuchar evento global para que Topbar pueda alternar el sidebar
    const evHandler = () => toggle();
    window.addEventListener("app:toggle-sidebar", evHandler as EventListener);

    return () => {
      window.removeEventListener("keydown", handler);
      window.removeEventListener("app:toggle-sidebar", evHandler as EventListener);
    };
  }, [toggle]);

  // Obtener información del usuario
  const getUserDisplay = () => {
    if (user?.nombre_completo?.trim()) return user.nombre_completo;
    if (user?.username?.trim()) return user.username;
    if (user?.email?.includes("@")) return user.email.split("@")[0];
    return "Usuario";
  };

  const getUserRole = () => {
    if (user?.roles?.includes("superadmin")) return "Super Admin";
    if (user?.roles?.includes("admin")) return "Administrador";
    return "Usuario";
  };

  const getCompanyName = () => {
    return user?.empresa_nombre || brand;
  };

  const handleLogout = async () => {
    if (confirm("¿Estás seguro que quieres cerrar sesión?")) {
      await logout();
    }
  };

  // Obtener menú dinámico basado en el usuario
  const menuItems = getMenuForUser(user);

  return (
    <aside className={`sidebar ${collapsed ? "sidebar--collapsed" : ""}`} aria-hidden={collapsed}>
      {/* Header del Sidebar con info de la empresa */}
      <div className="sidebar__header">
        <div className="brand">
          {companyLogo ? (
            <img 
              src={companyLogo} 
              alt="Logo de la empresa" 
              className="brand__logo"
            />
          ) : (
            <div className="brand__logo brand__logo--placeholder">
              {getCompanyName().charAt(0).toUpperCase()}
            </div>
          )}
          {!collapsed && (
            <div className="brand__info">
              <span className="brand__name">{getCompanyName()}</span>
              <span className="brand__subtitle">
                {user?.roles?.includes("superadmin") ? "Plataforma Global" : "Sistema de Gestión"}
              </span>
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
            <rect y="0" width="18" height="2" rx="1" fill="currentColor"></rect>
            <rect y="6" width="18" height="2" rx="1" fill="currentColor"></rect>
            <rect y="12" width="18" height="2" rx="1" fill="currentColor"></rect>
          </svg>
        </button>
      </div>

      {/* Información del Usuario */}
      <div className="sidebar__user">
        <div className="user-profile">
          <div className="user-profile__avatar">
            {user?.email ? (
              <img 
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(getUserDisplay())}&background=667eea&color=fff&size=48`}
                alt={getUserDisplay()}
                className="user-profile__image"
              />
            ) : (
              <div className="user-profile__placeholder">
                👤
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="user-profile__info">
              <span className="user-profile__name">{getUserDisplay()}</span>
              <span className="user-profile__role">{getUserRole()}</span>
              {user?.email && (
                <span className="user-profile__email">{user.email}</span>
              )}
              {user?.empresa_nombre && !user?.roles?.includes("superadmin") && (
                <span className="user-profile__company">{user.empresa_nombre}</span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Navegación Principal - MENÚ DINÁMICO */}
      <nav className="nav" aria-label="Navegación principal">
        {menuItems.map((item) => {
          // Asegurar que las rutas del menú se resuelvan dentro de /app
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

      {/* Footer del Sidebar con botón de logout */}
      <div className="sidebar__footer">
        <button
          onClick={handleLogout}
          className="logout-btn"
          title="Cerrar Sesión"
        >
          <span className="logout-btn__icon">🚪</span>
          {!collapsed && <span className="logout-btn__text">Cerrar Sesión</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;

// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./modules/auth/service";
import DashboardLayout from "./modules/dashboard/dashboard";
import { RequireAuth } from "./shared/api/guards";

// Pages - Landing y Auth
import LandingPage from "./modules/landing/landing_page";
import AuthPage from "./modules/auth/page";
import CompanySignupPage from "./modules/landing/company_register";

// Pages - Dashboard Protected
import UsersPage from "./modules/usuarios/page";
import GestionUsuariosRoles from "./modules/usuarios/gestion_usuarios_roles"; // ← Solo esta
import CreditsPage from "./modules/creditos/page";
import PagosPage from "./modules/pagos/page";
import EmpresaPage from "./modules/empresa/page";
import ClientesPage from "./modules/clientes/page";
import HistorialClientesPage from "./modules/clientes/historial";
import CrearClientePage from "./modules/clientes/crear_cliente";

// Pages - Billing
import RegistroOnPremise from "./modules/billing/registro_onpremise";
import SubscriptionPage from "./modules/billing/suscripcion_page";

// Pages - Reports y Auditoria
import HistorialAuditoriaPage from "./modules/auditoria/historial";
import ReportesPage from "./modules/reportes/reportes";
import HistorialActividadesPage from "./modules/actividades";
import PersonalizacionPage from "./modules/personalizacion/personalizacion";
import BackupPage from "./modules/backup/backup";
import DashboardIngresos from "./modules/ingresos/dashboard";
import { Link } from "react-router-dom";
import "./styles/theme.css";
import "./shared/layout/topbar.css";
import TiposCreditoPage from "./modules/creditos/tipos/page";
import CrearCreditoPage from "./modules/creditos/crear_creditos";
import HistorialCreditosPage from "./modules/creditos/historial";

/* RequireRole: componente compacto para proteger rutas por rol */
type RequireRoleProps = {
  children: React.ReactElement;
  roles: string[];
  redirectTo?: string;
};

const RequireRole: React.FC<RequireRoleProps> = ({ children, roles, redirectTo = "/app" }) => {
  const { user } = useAuth();
  // no autenticado -> a login (el layout /app ya usa RequireAuth, pero añadimos chequeo seguro)
  if (!user) return <Navigate to="/login" replace />;
  const userRoles = Array.isArray(user.roles) ? user.roles.map(String) : [];
  const allowed = roles.some(r => userRoles.includes(r));
  return allowed ? children : <Navigate to={redirectTo} replace />;
};

// Componente de inicio mejorado
export function Inicio() {
  const { user } = useAuth();

  // obtener preview de personalización desde localStorage (solo usado en cards)
  const companyLogo = typeof window !== "undefined" ? localStorage.getItem("ui.company.logo") : null;
  const accent = typeof window !== "undefined" ? localStorage.getItem("ui.accent_color") || localStorage.getItem("ui.accent-primary") : null;
  const companyName = typeof window !== "undefined"
    ? (localStorage.getItem("ui.company.name") || localStorage.getItem("ui.companyName") || "")
    : "";

  return (
    <section className="page">
      {/* Enlaces rápidos */}
      <div>
        <h3 style={{ margin: "0 0 16px 0", color: "#a78bfa", fontSize: "18px", fontWeight: "600" }}>
          🚀 Accesos Rápidos
        </h3>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px" }}>
          {/* Dashboard */}
          <Link to="/app" style={{ textDecoration: "none" }}>
            <div className="quick-card">
              <h4>📊 Dashboard</h4>
              <p>Panel principal con métricas y estadísticas de tu empresa</p>
            </div>
          </Link>

          {/* Empresas - solo superadmin */}
          {user?.roles?.includes("superadmin") && (
            <Link to="/app/empresas" style={{ textDecoration: "none" }}>
              <div className="quick-card">
                <h4>🏢 Empresas</h4>
                <p>Gestión global de empresas registradas</p>
              </div>
            </Link>
          )}

          {/* Gestión de Usuarios y Roles - superadmin y admin */}
          {(user?.roles?.includes("superadmin") || user?.roles?.includes("admin")) && (
            <Link to="/app/gestion-usuarios" style={{ textDecoration: "none" }}>
              <div className="quick-card">
                <h4>👥 Gestión de Usuarios y Roles</h4>
                <p>Panel centralizado para usuarios, roles y permisos + Django Admin</p>
              </div>
            </Link>
          )}

          {/* Usuarios - superadmin y admin */}
          {(user?.roles?.includes("superadmin") || user?.roles?.includes("admin")) && (
            <Link to="/app/usuarios" style={{ textDecoration: "none" }}>
              <div className="quick-card">
                <h4>📋 Listar Usuarios</h4>
                <p>Ver y gestionar lista de usuarios del sistema</p>
              </div>
            </Link>
          )}

          {/* Personalización - ahora disponible para todos */}
          <Link to="/app/personalizacion" style={{ textDecoration: "none" }}>
            <div className="quick-card" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: companyLogo ? `url(${companyLogo}) center/cover` : (accent || "#7c3aed"),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "white",
                fontWeight: "700",
                fontSize: 18
              }}>
                {!companyLogo && companyName.charAt(0)}
              </div>
              <div>
                <h4 style={{ margin: 0 }}>🎨 Personalización</h4>
                <p style={{ margin: 0, color: "#a78bfa" }}>Ajusta temas, logo y apariencia</p>
              </div>
            </div>
          </Link>

          {/* Módulos comunes para todos */}
          <Link to="/app/reportes" style={{ textDecoration: "none" }}>
            <div className="quick-card">
              <h4>📈 Reportes</h4>
              <p>Análisis detallados y reportes personalizados</p>
            </div>
          </Link>

          <Link to="/app/ingresos" style={{ textDecoration: "none" }}>
            <div className="quick-card">
              <h4>💹 Ingresos</h4>
              <p>Dashboard financiero y control de ingresos</p>
            </div>
          </Link>

          <Link to="/app/pagos" style={{ textDecoration: "none" }}>
            <div className="quick-card">
              <h4>💳 Pagos</h4>
              <p>Gestión de pagos y transacciones</p>
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <AuthPage />,
  },
  {
    path: "/registro-onpremise",
    element: <RegistroOnPremise />,
  },
  {
    path: "/registro",
    element: <CompanySignupPage />,
  },
  {
    path: "/mi-suscripcion",
    element: <SubscriptionPage />,
  },
  {
    path: "/app",
    element: (
      <RequireAuth>
        <DashboardLayout />
      </RequireAuth>
    ),
    children: [
      { index: true, element: <Inicio /> },
      { path: "empresas", element: <EmpresaPage /> },
      { path: "usuarios", element: <UsersPage /> },
      { path: "clientes", element: <ClientesPage />, children: [
          { index: true, element: <HistorialClientesPage /> },
          { path: "crear", element: <CrearClientePage /> },
        ] },
      { path: "gestion-usuarios", element: <GestionUsuariosRoles /> }, // ← Solo esta ruta
      { path: "actividades", element: <HistorialActividadesPage /> },
      { path: "auditoria", element: <HistorialAuditoriaPage /> },
      { path: "reportes", element: <ReportesPage /> },
      { path: "personalizacion", element: <PersonalizacionPage /> },
      { path: "ingresos", element: <DashboardIngresos /> },
      { path: "backup", element: <BackupPage /> },
      {
        path: "creditos",
        element: <CreditsPage />,
        children: [
          { index: true, element: <HistorialCreditosPage /> },
          { path: "crear", element: <CrearCreditoPage /> },
          { path: "tipos", element: <RequireRole roles={["admin","superadmin"]}><TiposCreditoPage /></RequireRole> },
        ],
      },
      { path: "pagos", element: <PagosPage /> },
    ],
  },
  { path: "*", element: <Navigate to="/" replace /> },
]);

const container = document.getElementById("root")!;
const root = ReactDOM.createRoot(container);

root.render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);

// Evita raíces duplicadas en HMR
if (import.meta.hot) {
  import.meta.hot.dispose(() => root.unmount());
}

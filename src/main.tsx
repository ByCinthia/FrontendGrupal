// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";

import { AuthProvider, useAuth } from "./modules/auth/service";
import DashboardLayout from "./modules/dashboard/dashboard";
import { RequireAuth, PublicOnly } from "./shared/api/guards";

// Pages - Landing y Auth
import LandingPage from "./modules/landing/landing_page";
import AuthPage from "./modules/auth/page";
import CompanySignupPage from "./modules/landing/company_register";

// Pages - Dashboard Protected
import UsersPage from "./modules/usuarios/page";
import CrearUsuarioPage from "./modules/usuarios/crear_usuario";
import CrearGroup from "./modules/usuarios/crear_group";
import CreditsPage from "./modules/creditos/page";
import SolicitarCredito from "./modules/creditos/solicitar";
import PagosPage from "./modules/pagos/page";
import EmpresaPage from "./modules/empresa/page";

// Pages - Billing
import PlanSelectionPage from "./modules/billing/plan_selection";
import PlanesStandalone from "./modules/billing/planes_standalone";
import SubscriptionPage from "./modules/billing/suscripcion_page";
import CheckoutMockPage from "./modules/billing/checkout_page";
import RegistroOnPremise from "./modules/billing/registro_onpremise";

// Pages - Reports y Auditoria
import HistorialAuditoriaPage from "./modules/auditoria/historial";
import ReportesPage from "./modules/reportes/reportes";
import PersonalizacionPage from "./modules/personalizacion/personalizacion";
import BackupPage from "./modules/backup/backup";
import HistorialActividadesPage from "./modules/actividades/historial_simple";
import DashboardIngresos from "./modules/ingresos/dashboard";

// Página de configuración temporal
const ConfigurationPage: React.FC = () => (
  <section className="page">
    <div style={{ padding: "24px", textAlign: "center" }}>
      <h2>⚙️ Configuración</h2>
      <p style={{ color: "#6b7280" }}>
        Esta sección está en desarrollo. Próximamente podrás configurar:
      </p>
      <ul style={{ textAlign: "left", maxWidth: "400px", margin: "0 auto" }}>
        <li>Configuración de la empresa</li>
        <li>Preferencias del sistema</li>
        <li>Integración con APIs externas</li>
        <li>Configuración de notificaciones</li>
      </ul>
    </div>
  </section>
);

// Componente de inicio mejorado
export function Inicio() {
  const { user, loading, logout } = useAuth();
  
  if (loading) {
    return (
      <section className="page">
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          minHeight: "200px",
          fontSize: "16px",
          color: "#6b7280"
        }}>
          <span>🔄 Cargando tu sesión...</span>
        </div>
      </section>
    );
  }

  const handleLogout = async () => {
    if (confirm("¿Estás seguro que quieres cerrar sesión?")) {
      await logout();
    }
  };

  // Obtener información de la empresa
  const getCompanyInfo = () => {
    const defaultCompany = "Mi Empresa";
    
    if (user?.empresa_nombre) return user.empresa_nombre;
    
    // Intentar obtener de localStorage como fallback
    try {
      const authData = localStorage.getItem("auth.me") || localStorage.getItem("auth");
      if (authData) {
        const parsed = JSON.parse(authData);
        return parsed?.empresa_nombre || parsed?.user?.empresa_nombre || defaultCompany;
      }
    } catch {
      // Si hay error parseando, usar valor por defecto
    }
    
    return defaultCompany;
  };

  const getUserDisplay = () => {
    if (user?.nombre_completo?.trim()) return user.nombre_completo;
    if (user?.username?.trim()) return user.username;
    if (user?.email?.includes("@")) return user.email.split("@")[0];
    return "Usuario";
  };

  const getUserRole = () => {
    if (user?.roles?.includes("superadmin")) return "Super Administrador";
    if (user?.roles?.includes("admin")) return "Administrador";
    return "Usuario";
  };

  const companyName = getCompanyInfo();
  const userDisplay = getUserDisplay();
  const userRole = getUserRole();
  
  return (
    <section className="page">
      {/* Header principal */}
      <div style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        marginBottom: "24px",
        padding: "24px",
        backgroundColor: "#f8fafc",
        borderRadius: "12px",
        border: "1px solid #e2e8f0",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
      }}>
        <div>
          <h1 style={{ 
            margin: "0 0 4px 0", 
            color: "#1e40af",
            fontSize: "24px",
            fontWeight: "600"
          }}>
            🏢 {companyName}
          </h1>
          <h2 style={{ 
            margin: "0 0 8px 0",
            color: "#1f2937",
            fontSize: "20px",
            fontWeight: "500"
          }}>
            ¡Hola, {userDisplay}! 👋
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
              🎯 <strong>Rol:</strong> {userRole}
            </p>
            {user?.email && (
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
                📧 <strong>Email:</strong> {user.email}
              </p>
            )}
            {user?.empresa_id && (
              <p style={{ margin: 0, color: "#6b7280", fontSize: "14px" }}>
                🆔 <strong>ID Empresa:</strong> {user.empresa_id}
              </p>
            )}
          </div>
        </div>
        
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "12px 20px",
            backgroundColor: "#ef4444",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontSize: "14px",
            fontWeight: "500",
            transition: "all 0.2s"
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#dc2626";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#ef4444";
          }}
        >
          🚪 Cerrar Sesión
        </button>
      </div>
      
      {/* Información del sistema */}
      <div style={{
        padding: "20px",
        backgroundColor: "#f0f9ff",
        borderRadius: "12px",
        border: "1px solid #bfdbfe",
        marginBottom: "24px"
      }}>
        <h3 style={{ 
          margin: "0 0 16px 0", 
          color: "#1e40af",
          fontSize: "18px",
          fontWeight: "600"
        }}>
          🔧 Estado del Sistema
        </h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
          gap: "16px",
          fontSize: "14px"
        }}>
          <div style={{ color: "#1e40af" }}>
            <strong>Sesión:</strong> {localStorage.getItem("auth.token") ? "✅ Activa" : "❌ Inactiva"}
          </div>
          <div style={{ color: "#1e40af" }}>
            <strong>Usuario ID:</strong> {user?.id || "N/A"}
          </div>
          <div style={{ color: "#1e40af" }}>
            <strong>Permisos:</strong> {user?.permissions?.includes("*") ? "🔓 Completos" : "🔒 Limitados"}
          </div>
          <div style={{ color: "#1e40af" }}>
            <strong>Acceso:</strong> {user?.roles?.includes("superadmin") ? "🌐 Global" : "🏢 Empresa"}
          </div>
        </div>
      </div>
      
      {/* Enlaces rápidos mejorados */}
      <div>
        <h3 style={{ 
          margin: "0 0 16px 0",
          color: "#1f2937",
          fontSize: "18px",
          fontWeight: "600"
        }}>
          🚀 Accesos Rápidos
        </h3>
        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", 
          gap: "16px" 
        }}>
          <div style={{ 
            padding: "20px", 
            backgroundColor: "white", 
            borderRadius: "12px", 
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            transition: "all 0.2s",
            cursor: "pointer"
          }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#1e40af", fontSize: "16px" }}>
              📊 Dashboard
            </h4>
            <p style={{ margin: "0", fontSize: "14px", color: "#6b7280" }}>
              Panel principal con métricas y estadísticas de tu empresa
            </p>
          </div>
          
          <div style={{ 
            padding: "20px", 
            backgroundColor: "white", 
            borderRadius: "12px", 
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            transition: "all 0.2s",
            cursor: "pointer"
          }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#16a34a", fontSize: "16px" }}>
              👥 Usuarios
            </h4>
            <p style={{ margin: "0", fontSize: "14px", color: "#6b7280" }}>
              Gestión completa de usuarios y permisos del sistema
            </p>
          </div>
          
          <div style={{ 
            padding: "20px", 
            backgroundColor: "white", 
            borderRadius: "12px", 
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            transition: "all 0.2s",
            cursor: "pointer"
          }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#ea580c", fontSize: "16px" }}>
              💰 Facturación
            </h4>
            <p style={{ margin: "0", fontSize: "14px", color: "#6b7280" }}>
              Control de pagos, suscripciones y facturación
            </p>
          </div>
          
          <div style={{ 
            padding: "20px", 
            backgroundColor: "white", 
            borderRadius: "12px", 
            border: "1px solid #e2e8f0",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            transition: "all 0.2s",
            cursor: "pointer"
          }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#7c3aed", fontSize: "16px" }}>
              📈 Reportes
            </h4>
            <p style={{ margin: "0", fontSize: "14px", color: "#6b7280" }}>
              Análisis detallados y reportes personalizados
            </p>
          </div>
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
    path: "/registro-empresa",
    element: (
      <PublicOnly>
        <CompanySignupPage />
      </PublicOnly>
    ),
  },
  {
    path: "/planes",
    element: <PlanesStandalone />,
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
    path: "/planes-seleccion",
    element: <PlanSelectionPage />,
  },
  {
    path: "/checkout-mock",
    element: <CheckoutMockPage />,
  },
  {
    path: "/mi-suscripcion",
    element: (
      <RequireAuth>
        <SubscriptionPage />
      </RequireAuth>
    ),
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
      { path: "crear-usuario", element: <CrearUsuarioPage /> },
      { path: "crear-grupo", element: <CrearGroup /> },
      { path: "actividades", element: <HistorialActividadesPage /> },
      { path: "auditoria", element: <HistorialAuditoriaPage /> },
      { path: "reportes", element: <ReportesPage /> },
      { path: "personalizacion", element: <PersonalizacionPage /> },
      { path: "ingresos", element: <DashboardIngresos /> },
      { path: "backup", element: <BackupPage /> },
      {
        path: "creditos",
        element: <CreditsPage />,
        children: [{ path: "solicitar", element: <SolicitarCredito /> }],
      },
      { path: "pagos", element: <PagosPage /> },
      { path: "configuracion", element: <ConfigurationPage /> },
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

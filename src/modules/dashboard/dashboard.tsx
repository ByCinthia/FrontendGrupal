// modules/dashboard/dashboard.tsx
import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "../../shared/layout/Sidebar";
import SharedHeader from "../../shared/layout/SharedHeader";
import { useAuth } from "../auth/service";
import "../../styles/unified-app.css";

const DashboardLayout: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  const getUserDisplay = () => {
    if (user?.nombre_completo?.trim()) return user.nombre_completo;
    if (user?.username?.trim()) return user.username;
    if (user?.email && user.email.includes("@")) return user.email.split("@")[0];
    return "Usuario";
  };

  const userDisplay = getUserDisplay();

  return (
    <div className="app-shell">
      <Sidebar brand="WF Finanzas" />

      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* SharedHeader: empresa + avatar — se muestra en todas las vistas */}
        <SharedHeader />

        {/* Header específico del dashboard (index "/app") */}
        {location.pathname === "/app" && (
          <header className="dashboard__header dashboard__header--dark">
            <div className="dashboard__header-inner">
              <div className="dashboard__greeting">
                <h1 className="dashboard__title">¡Bienvenido, {userDisplay}!</h1>
                <p className="dashboard__subtitle">Aquí puedes gestionar usuarios, ver reportes y administrar créditos.</p>

                <ul className="dashboard__features" aria-label="Características principales">
                  <li>• Panel con métricas en tiempo real</li>
                  <li>• Gestión de usuarios y permisos</li>
                  <li>• Control y solicitud de créditos</li>
                  <li>• Reportes exportables</li>
                </ul>
              </div>

              <div className="dashboard__header-right-placeholder" aria-hidden />
            </div>
          </header>
        )}

        <main className="content" style={{ paddingTop: 0 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

// modules/dashboard/dashboard.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../shared/layout/Sidebar";
import Topbar from "../../shared/layout/Topbar";
import { useAuth } from "../auth/service";
import "../../styles/dashboard.css"; // usar estilos del dashboard (si prefieres landing.css, cámbialo aquí)

const DashboardLayout: React.FC = () => {
  const { user } = useAuth();

  const getCompanyName = () => {
    return user?.empresa_nombre || "WF Finanzas";
  };

  return (
    <div className="app-shell">
      <Sidebar brand="WF Finanzas" collapseOnNavigate={false} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Topbar />
        
        {/* Header con nombre de empresa */}
        <div style={{ 
          padding: "16px 24px", 
          borderBottom: "1px solid #e5e7eb",
          background: "linear-gradient(90deg, #f8fafc 0%, #f1f5f9 100%)"
        }}>
          <h1 style={{ 
            margin: 0, 
            fontSize: "24px", 
            fontWeight: "700", 
            color: "#1e293b",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            🏢 {getCompanyName()}
          </h1>
          <p style={{ 
            margin: "4px 0 0", 
            color: "#64748b", 
            fontSize: "14px" 
          }}>
            Panel de Control - {user?.roles?.includes("superadmin") ? "Vista Global" : "Vista Empresa"}
          </p>
        </div>

        <main className="content" style={{ padding: 16 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

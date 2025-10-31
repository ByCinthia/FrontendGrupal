// modules/dashboard/dashboard.tsx
import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../shared/layout/Sidebar";
import Topbar from "../../shared/layout/Topbar";
import "../../styles/dashboard.css"; // usar estilos del dashboard (si prefieres landing.css, cámbialo aquí)

const DashboardLayout: React.FC = () => {
  return (
    <div className="app-shell">
      <Sidebar brand="WF Finanzas" collapseOnNavigate={false} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <Topbar />
        <main className="content" style={{ padding: 16 }}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;

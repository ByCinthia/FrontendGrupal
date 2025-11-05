import React, { useState, useEffect } from "react";
import { useAuth } from "../auth/service";
import UsersPage from "../usuarios/page"; // ← USAR LA PÁGINA COMPLETA DE USUARIOS
import "../../styles/theme.css";

const DjangoAdminPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentView, setCurrentView] = useState<"dashboard" | "usuarios">("dashboard");

  // Verificar permisos
  const isAdmin = user?.roles?.includes("admin") || user?.roles?.includes("superadmin");

  useEffect(() => {
    if (!isAdmin) {
      setError("Solo los administradores pueden acceder a esta sección");
      setLoading(false);
      return;
    }

    // Verificar que el usuario esté autenticado en Django
    checkDjangoAuth();
  }, [isAdmin]);

  const checkDjangoAuth = async () => {
    try {
      // Llamar a tu endpoint /api/auth/me/ que devuelve el user (token-based)
      const res = await fetch("/api/auth/me/", {
        headers: { Authorization: `Token ${localStorage.getItem("auth.token") ?? ""}` },
      });
      if (res.ok) {
        // usuario autenticado por token
        setLoading(false);
        return;
      }
      setError("Necesita autenticarse en Django Admin");
    } catch {
      setError("No se puede conectar con Django Admin");
    } finally {
      setLoading(false);
    }
  };

  const openDjangoAdmin = (section: string = "") => {
    const url = `http://127.0.0.1:8000/admin/${section}`;
    window.open(url, 'django-admin', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  };

  const openDjangoLogin = () => {
    const loginUrl = "http://127.0.0.1:8000/admin/login/";
    window.open(loginUrl, 'django-login', 'width=600,height=500,scrollbars=yes,resizable=yes');
  };

  if (!isAdmin) {
    return (
      <section className="page">
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ color: "#dc2626", marginBottom: "8px" }}>Acceso Denegado</h2>
          <p style={{ color: "#6b7280" }}>
            Solo los administradores pueden acceder a la gestión de usuarios.
          </p>
        </div>
      </section>
    );
  }

  // Vista del módulo de usuarios completo
  if (currentView === "usuarios") {
    return (
      <div>
        <div style={{ marginBottom: "24px", padding: "0 24px" }}>
          <button 
            onClick={() => setCurrentView("dashboard")}
            className="ui-btn ui-btn--ghost"
          >
            ← Volver al Panel de Administración
          </button>
        </div>
        <UsersPage />
      </div>
    );
  }

  return (
    <section className="page">
      <div style={{ marginBottom: "32px" }}>
        <h1 className="ui-title">⚙️ Panel de Administración</h1>
        <p style={{ color: "#6b7280" }}>
          Gestión completa de usuarios, grupos y permisos del sistema
        </p>
      </div>

      {/* Pestañas de navegación */}
      <div className="ui-tabs" style={{ marginBottom: "24px" }}>
        <button 
          className={`ui-tab ${currentView === "dashboard" ? "ui-tab--active" : ""}`}
          onClick={() => setCurrentView("dashboard")}
        >
          🏠 Dashboard
        </button>
        <button 
       //   className={`ui-tab ${currentView === "usuarios" ? "ui-tab--active" : ""}`}
          onClick={() => setCurrentView("usuarios")}
        >
          👥 Gestión de Usuarios
        </button>
      </div>

      {/* Estado de carga */}
      {loading && (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p>Verificando conexión con Django Admin...</p>
        </div>
      )}

      {/* Error de conexión */}
      {error && (
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⚠️</div>
          <h3 style={{ color: "#dc2626", marginBottom: "16px" }}>{error}</h3>
          <p style={{ color: "#6b7280", marginBottom: "24px" }}>
            Para usar Django Admin, necesita estar autenticado
          </p>
          <button onClick={openDjangoLogin} className="ui-btn">
            🔑 Iniciar Sesión en Django
          </button>
          <button 
            onClick={() => window.location.reload()} 
            className="ui-btn ui-btn--ghost"
            style={{ marginLeft: "12px" }}
          >
            🔄 Reintentar
          </button>
        </div>
      )}

      {/* Panel principal */}
      {!loading && !error && currentView === "dashboard" && (
        <div>
          {/* Gestión de Usuarios */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <h3>👥 Gestión de Usuarios</h3>
            <p style={{ color: "#6b7280", marginBottom: "20px" }}>
              Herramientas completas para administrar usuarios del sistema
            </p>
            
            <div className="dashboard-grid">
              <div 
                className="quick-card" 
                onClick={() => setCurrentView("usuarios")}
                style={{ cursor: "pointer" }}
              >
                <h4>👥 Módulo de Usuarios</h4>
                <p>Gestión completa: crear, editar, ver historial y administrar usuarios</p>
                <div style={{ marginTop: "12px" }}>
                  <span className="ui-badge ui-badge--success">Completo</span>
                </div>
              </div>

              <div className="quick-card" onClick={() => openDjangoAdmin("auth/user/add/")}>
                <h4>🔧 Django Admin - Crear</h4>
                <p>Acceso directo al formulario de Django Admin</p>
                <div style={{ marginTop: "12px" }}>
                  <span className="ui-badge ui-badge--info">Django Admin</span>
                </div>
              </div>

              <div className="quick-card" onClick={() => openDjangoAdmin("auth/user/")}>
                <h4>📋 Django Admin - Lista</h4>
                <p>Ver y editar usuarios desde Django Admin</p>
                <div style={{ marginTop: "12px" }}>
                  <span className="ui-badge ui-badge--primary">Admin</span>
                </div>
              </div>

              <div className="quick-card" onClick={() => window.location.href = "/app/usuarios"}>
                <h4>👀 Vista Directa</h4>
                <p>Ir directamente al módulo de usuarios</p>
                <div style={{ marginTop: "12px" }}>
                  <span className="ui-badge ui-badge--warning">Directo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Gestión de Grupos y Permisos */}
          <div className="card" style={{ marginBottom: "24px" }}>
            <h3>🏷️ Grupos y Permisos</h3>
            <p style={{ color: "#6b7280", marginBottom: "20px" }}>
              Configuración avanzada de roles y permisos (solo Django Admin)
            </p>
            
            <div className="dashboard-grid">
              <div className="quick-card" onClick={() => openDjangoAdmin("auth/group/")}>
                <h4>🏷️ Gestión de Grupos</h4>
                <p>Crear y configurar grupos de usuarios</p>
                <div style={{ marginTop: "12px" }}>
                  <span className="ui-badge ui-badge--success">Roles</span>
                </div>
              </div>

              <div className="quick-card" onClick={() => openDjangoAdmin("auth/permission/")}>
                <h4>🔐 Permisos</h4>
                <p>Administrar permisos granulares</p>
                <div style={{ marginTop: "12px" }}>
                  <span className="ui-badge ui-badge--warning">Avanzado</span>
                </div>
              </div>

              <div className="quick-card" onClick={() => openDjangoAdmin("auth/group/add/")}>
                <h4>➕ Crear Grupo</h4>
                <p>Agregar nuevos grupos</p>
                <div style={{ marginTop: "12px" }}>
                  <span className="ui-badge ui-badge--info">Nuevo</span>
                </div>
              </div>

              <div className="quick-card" onClick={() => openDjangoAdmin()}>
                <h4>⚙️ Panel Completo</h4>
                <p>Acceso completo al Django Admin</p>
                <div style={{ marginTop: "12px" }}>
                  <span className="ui-badge ui-badge--primary">Full Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Información */}
          <div className="card">
            <h3>📊 Estado del Sistema</h3>
            <div style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
              <div style={{ padding: "12px", background: "#f0fdf4", borderRadius: "8px", border: "1px solid #bbf7d0" }}>
                <strong style={{ color: "#15803d" }}>✅ Módulo de Usuarios:</strong>
                <p style={{ margin: "4px 0 0 0", color: "#166534" }}>
                  Incluye crear usuario, editar, ver historial y todas las funcionalidades integradas
                </p>
              </div>

              <div style={{ padding: "12px", background: "#eff6ff", borderRadius: "8px", border: "1px solid #bfdbfe" }}>
                <strong style={{ color: "#1d4ed8" }}>🔧 Django Admin:</strong>
                <p style={{ margin: "4px 0 0 0", color: "#1e40af" }}>
                  Para gestión avanzada de grupos y permisos específicos
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default DjangoAdminPage;

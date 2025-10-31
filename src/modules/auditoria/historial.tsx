// src/modules/auditoria/historial.tsx
import React, { useState, useEffect } from "react";
import "../../styles/dashboard.css";

interface AuditLog {
  id: string;
  action: string;
  user: string;
  target?: string;
  timestamp: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
}

const ACTION_TYPES = {
  login: { label: "Inicio de sesión", icon: "🔑", color: "#10b981" },
  logout: { label: "Cierre de sesión", icon: "🚪", color: "#6b7280" },
  create_user: { label: "Usuario creado", icon: "👤", color: "#3b82f6" },
  edit_user: { label: "Usuario editado", icon: "✏️", color: "#f59e0b" },
  delete_user: { label: "Usuario eliminado", icon: "🗑️", color: "#ef4444" },
  create_credito: { label: "Crédito creado", icon: "💰", color: "#10b981" },
  approve_credito: { label: "Crédito aprobado", icon: "✅", color: "#10b981" },
  reject_credito: { label: "Crédito rechazado", icon: "❌", color: "#ef4444" },
  create_pago: { label: "Pago registrado", icon: "💳", color: "#8b5cf6" },
  export_report: { label: "Reporte exportado", icon: "📊", color: "#06b6d4" },
  backup_created: { label: "Backup creado", icon: "💾", color: "#059669" },
  data_restored: { label: "Datos restaurados", icon: "🔄", color: "#dc2626" },
  settings_changed: { label: "Configuración cambiada", icon: "⚙️", color: "#7c3aed" },
};

const HistorialPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filters, setFilters] = useState({
    user: "",
    action: "",
    dateFrom: "",
    dateTo: "",
    search: ""
  });

  useEffect(() => {
    loadAuditLogs();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [logs, filters]);

  const loadAuditLogs = () => {
    setLoading(true);
    
    // Cargar logs existentes del localStorage
    const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
    
    // Si no hay logs, crear algunos de ejemplo
    if (existingLogs.length === 0) {
      const sampleLogs: AuditLog[] = [
        {
          id: "1",
          action: "login",
          user: "vagner@gmail.com",
          timestamp: new Date().toISOString(),
          details: "Inicio de sesión exitoso",
          ip_address: "192.168.1.100"
        },
        {
          id: "2", 
          action: "create_user",
          user: "vagner@gmail.com",
          target: "nuevo.usuario@empresa.com",
          timestamp: new Date(Date.now() - 3600000).toISOString(),
          details: "Usuario creado: Juan Pérez (nuevo.usuario@empresa.com)"
        },
        {
          id: "3",
          action: "approve_credito", 
          user: "vagner@gmail.com",
          target: "Crédito #123",
          timestamp: new Date(Date.now() - 7200000).toISOString(),
          details: "Crédito aprobado por $50,000 para cliente María García"
        },
        {
          id: "4",
          action: "export_report",
          user: "vagner@gmail.com", 
          timestamp: new Date(Date.now() - 86400000).toISOString(),
          details: "Reporte de créditos exportado a Excel"
        },
        {
          id: "5",
          action: "backup_created",
          user: "vagner@gmail.com",
          timestamp: new Date(Date.now() - 172800000).toISOString(), 
          details: "Backup automático de datos creado"
        }
      ];
      
      localStorage.setItem("audit_logs", JSON.stringify(sampleLogs));
      setLogs(sampleLogs);
    } else {
      setLogs(existingLogs);
    }
    
    setLoading(false);
  };

  const applyFilters = () => {
    let filtered = [...logs];

    if (filters.user) {
      filtered = filtered.filter(log => 
        log.user.toLowerCase().includes(filters.user.toLowerCase())
      );
    }

    if (filters.action) {
      filtered = filtered.filter(log => log.action === filters.action);
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(log => 
        new Date(log.timestamp) <= new Date(filters.dateTo + "T23:59:59")
      );
    }

    if (filters.search) {
      filtered = filtered.filter(log =>
        log.details.toLowerCase().includes(filters.search.toLowerCase()) ||
        (log.target && log.target.toLowerCase().includes(filters.search.toLowerCase()))
      );
    }

    setFilteredLogs(filtered);
  };

  const handleFilterChange = (name: string, value: string) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      user: "",
      action: "",
      dateFrom: "",
      dateTo: "",
      search: ""
    });
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString("es-ES", {
      year: "numeric",
      month: "2-digit", 
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    });
  };

  const exportLogs = () => {
    const csvContent = [
      ["Fecha", "Usuario", "Acción", "Objetivo", "Detalles"].join(","),
      ...filteredLogs.map(log => [
        formatDateTime(log.timestamp),
        log.user,
        ACTION_TYPES[log.action as keyof typeof ACTION_TYPES]?.label || log.action,
        log.target || "",
        `"${log.details}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `historial_actividades_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Registrar la exportación
    const logEntry: AuditLog = {
      id: Date.now().toString(),
      action: "export_report",
      user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
      timestamp: new Date().toISOString(),
      details: `Historial de actividades exportado (${filteredLogs.length} registros)`
    };
    
    const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
    localStorage.setItem("audit_logs", JSON.stringify([logEntry, ...existingLogs]));
    setLogs([logEntry, ...logs]);
  };

  if (loading) {
    return (
      <section className="page">
        <h1 className="ui-title">Historial de Actividades</h1>
        <p>Cargando registros de auditoría...</p>
      </section>
    );
  }

  return (
    <section className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className="ui-title">Historial de Actividades</h1>
        <div style={{ display: "flex", gap: "12px" }}>
          <button onClick={exportLogs} className="ui-btn ui-btn--ghost">
            📊 Exportar CSV
          </button>
          <button onClick={loadAuditLogs} className="ui-btn ui-btn--ghost">
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <h3>🔍 Filtros de Búsqueda</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginTop: "16px" }}>
          <div>
            <label>Usuario</label>
            <input
              type="text"
              placeholder="Buscar por usuario..."
              value={filters.user}
              onChange={(e) => handleFilterChange("user", e.target.value)}
            />
          </div>
          
          <div>
            <label>Tipo de Acción</label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange("action", e.target.value)}
            >
              <option value="">Todas las acciones</option>
              {Object.entries(ACTION_TYPES).map(([key, action]) => (
                <option key={key} value={key}>
                  {action.icon} {action.label}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label>Fecha Desde</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
            />
          </div>
          
          <div>
            <label>Fecha Hasta</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange("dateTo", e.target.value)}
            />
          </div>
          
          <div>
            <label>Búsqueda Libre</label>
            <input
              type="text"
              placeholder="Buscar en detalles..."
              value={filters.search}
              onChange={(e) => handleFilterChange("search", e.target.value)}
            />
          </div>
          
          <div style={{ display: "flex", alignItems: "end" }}>
            <button onClick={clearFilters} className="ui-btn ui-btn--ghost">
              🗑️ Limpiar
            </button>
          </div>
        </div>
      </div>

      {/* Estadísticas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div className="stat-card">
          <div className="stat-number">{filteredLogs.length}</div>
          <div className="stat-label">Registros mostrados</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{logs.length}</div>
          <div className="stat-label">Total de registros</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{new Set(logs.map(l => l.user)).size}</div>
          <div className="stat-label">Usuarios únicos</div>
        </div>
      </div>

      {/* Lista de Logs */}
      <div className="card">
        <h3>📋 Registro de Actividades</h3>
        
        {filteredLogs.length === 0 ? (
          <p style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            No se encontraron registros con los filtros aplicados
          </p>
        ) : (
          <div className="audit-log-list">
            {filteredLogs.map((log) => {
              const actionInfo = ACTION_TYPES[log.action as keyof typeof ACTION_TYPES] || {
                label: log.action,
                icon: "📄",
                color: "#6b7280"
              };
              
              return (
                <div key={log.id} className="audit-log-item">
                  <div className="audit-log-icon" style={{ color: actionInfo.color }}>
                    {actionInfo.icon}
                  </div>
                  
                  <div className="audit-log-content">
                    <div className="audit-log-header">
                      <span className="audit-log-action" style={{ color: actionInfo.color }}>
                        {actionInfo.label}
                      </span>
                      <span className="audit-log-time">
                        {formatDateTime(log.timestamp)}
                      </span>
                    </div>
                    
                    <div className="audit-log-details">
                      <strong>Usuario:</strong> {log.user}
                      {log.target && (
                        <>
                          <span style={{ margin: "0 8px", color: "#d1d5db" }}>•</span>
                          <strong>Objetivo:</strong> {log.target}
                        </>
                      )}
                    </div>
                    
                    <div className="audit-log-description">
                      {log.details}
                    </div>
                    
                    {log.ip_address && (
                      <div className="audit-log-meta">
                        <span>IP: {log.ip_address}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default HistorialPage;
// src/modules/actividades/historial_simple.tsx
import React, { useState, useEffect } from "react";
import "../../styles/dashboard.css";

interface ActivityItem {
  id: string;
  user: string;
  action: string;
  timestamp: string;
  details: string;
  type: "create" | "update" | "delete" | "view" | "export";
}

const HistorialActividadesPage: React.FC = () => {
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  useEffect(() => {
    loadActivities();
  }, []);

  const loadActivities = () => {
    // Cargar desde localStorage o datos de ejemplo
    const existingLogs = localStorage.getItem("audit_logs");
    
    if (existingLogs) {
      try {
        const logs = JSON.parse(existingLogs);
        const formattedActivities = logs.map((log: any, index: number) => ({
          id: log.id || `activity_${index}`,
          user: log.user || "Usuario",
          action: log.action || "unknown_action",
          timestamp: log.timestamp || new Date().toISOString(),
          details: log.details || "Sin detalles",
          type: getActionType(log.action)
        }));
        setActivities(formattedActivities);
      } catch (error) {
        console.error("Error cargando actividades:", error);
        loadExampleData();
      }
    } else {
      loadExampleData();
    }
  };

  const loadExampleData = () => {
    const exampleActivities: ActivityItem[] = [
      {
        id: "1",
        user: "vagner@gmail.com",
        action: "login",
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        details: "Inicio de sesión exitoso",
        type: "view"
      },
      {
        id: "2", 
        user: "vagner@gmail.com",
        action: "user_created",
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        details: "Usuario creado: Juan Pérez (juan.perez@empresa.com)",
        type: "create"
      },
      {
        id: "3",
        user: "vagner@gmail.com", 
        action: "settings_changed",
        timestamp: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
        details: "Configuración de personalización actualizada",
        type: "update"
      },
      {
        id: "4",
        user: "vagner@gmail.com",
        action: "backup_created",
        timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
        details: "Backup manual creado: Backup Manual - 15/01/2025",
        type: "create"
      },
      {
        id: "5",
        user: "vagner@gmail.com",
        action: "report_exported", 
        timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
        details: "Reporte exportado: Actividades del Usuario",
        type: "export"
      }
    ];
    setActivities(exampleActivities);
  };

  const getActionType = (action: string): "create" | "update" | "delete" | "view" | "export" => {
    if (action.includes("create") || action.includes("created")) return "create";
    if (action.includes("update") || action.includes("changed") || action.includes("edit")) return "update";
    if (action.includes("delete") || action.includes("removed")) return "delete";
    if (action.includes("export")) return "export";
    return "view";
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "create": return "✅";
      case "update": return "✏️";
      case "delete": return "🗑️";
      case "export": return "📤";
      case "view": 
      default: return "👁️";
    }
  };

  const getActionColor = (type: string) => {
    switch (type) {
      case "create": return "#059669";
      case "update": return "#2563eb";
      case "delete": return "#dc2626";
      case "export": return "#7c3aed";
      case "view":
      default: return "#6b7280";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Hace un momento";
    if (diffMins < 60) return `Hace ${diffMins} minutos`;
    if (diffHours < 24) return `Hace ${diffHours} horas`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getActionDisplayName = (action: string) => {
    const actionMap: Record<string, string> = {
      "login": "Inicio de sesión",
      "logout": "Cierre de sesión",
      "user_created": "Usuario creado",
      "user_updated": "Usuario actualizado",
      "user_deleted": "Usuario eliminado",
      "settings_changed": "Configuración modificada",
      "backup_created": "Backup creado",
      "backup_deleted": "Backup eliminado",
      "system_restored": "Sistema restaurado",
      "report_exported": "Reporte exportado",
      "credit_created": "Crédito creado",
      "payment_registered": "Pago registrado"
    };
    
    return actionMap[action] || action.replace(/_/g, " ");
  };

  const filteredActivities = activities.filter(activity => {
    const matchesFilter = filter === "all" || activity.type === filter;
    const matchesSearch = activity.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         activity.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         getActionDisplayName(activity.action).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  return (
    <section className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className="ui-title">📋 Historial de Actividades</h1>
        <button 
          onClick={loadActivities}
          className="ui-btn ui-btn--ghost"
        >
          🔄 Actualizar
        </button>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: "24px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            <label style={{ fontWeight: "bold", color: "#374151" }}>Filtrar por:</label>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
            >
              <option value="all">Todas las actividades</option>
              <option value="create">✅ Creaciones</option>
              <option value="update">✏️ Modificaciones</option>
              <option value="delete">🗑️ Eliminaciones</option>
              <option value="export">📤 Exportaciones</option>
              <option value="view">👁️ Visualizaciones</option>
            </select>
          </div>
          
          <div style={{ display: "flex", gap: "8px", alignItems: "center", flex: 1, maxWidth: "300px" }}>
            <label style={{ fontWeight: "bold", color: "#374151" }}>Buscar:</label>
            <input
              type="text"
              placeholder="Usuario, acción o detalles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ 
                flex: 1,
                padding: "8px 12px", 
                borderRadius: "6px", 
                border: "1px solid #d1d5db" 
              }}
            />
          </div>
        </div>
      </div>

      {/* Lista de Actividades */}
      <div className="card">
        <h3 style={{ marginBottom: "20px" }}>
          Actividades Recientes ({filteredActivities.length})
        </h3>
        
        {filteredActivities.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📝</div>
            <p>No se encontraron actividades</p>
            <p style={{ fontSize: "14px" }}>
              {filter !== "all" || searchTerm ? "Prueba ajustando los filtros" : "Las actividades aparecerán aquí cuando los usuarios interactúen con el sistema"}
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {filteredActivities.map((activity, index) => (
              <div 
                key={activity.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  padding: "16px",
                  borderBottom: index < filteredActivities.length - 1 ? "1px solid #f3f4f6" : "none",
                  borderRadius: index === 0 ? "8px 8px 0 0" : index === filteredActivities.length - 1 ? "0 0 8px 8px" : "0"
                }}
              >
                <div style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  backgroundColor: getActionColor(activity.type),
                  color: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "16px",
                  marginRight: "16px",
                  flexShrink: 0
                }}>
                  {getActionIcon(activity.type)}
                </div>
                
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "4px" }}>
                    <h4 style={{ 
                      margin: 0, 
                      color: "#1f2937",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}>
                      {getActionDisplayName(activity.action)}
                    </h4>
                    <span style={{ 
                      fontSize: "12px", 
                      color: "#6b7280",
                      flexShrink: 0,
                      marginLeft: "12px"
                    }}>
                      {formatTimestamp(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p style={{ 
                    margin: "0 0 4px 0", 
                    color: "#4b5563",
                    fontSize: "13px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap"
                  }}>
                    {activity.details}
                  </p>
                  
                  <p style={{ 
                    margin: 0, 
                    color: "#9ca3af",
                    fontSize: "12px"
                  }}>
                    Por: <strong>{activity.user}</strong>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Estadísticas rápidas */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "16px", marginTop: "24px" }}>
        {["create", "update", "delete", "export", "view"].map(type => {
          const count = activities.filter(a => a.type === type).length;
          return (
            <div 
              key={type}
              className="card"
              style={{ 
                textAlign: "center", 
                padding: "16px",
                backgroundColor: count > 0 ? "#f8fafc" : "#ffffff"
              }}
            >
              <div style={{ fontSize: "24px", marginBottom: "8px" }}>
                {getActionIcon(type)}
              </div>
              <div style={{ fontSize: "20px", fontWeight: "bold", color: getActionColor(type) }}>
                {count}
              </div>
              <div style={{ fontSize: "12px", color: "#6b7280", textTransform: "capitalize" }}>
                {type === "create" && "Creaciones"}
                {type === "update" && "Modificaciones"}
                {type === "delete" && "Eliminaciones"}
                {type === "export" && "Exportaciones"}
                {type === "view" && "Visualizaciones"}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default HistorialActividadesPage;
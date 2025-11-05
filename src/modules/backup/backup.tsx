// src/modules/backup/backup.tsx
import React, { useState, useEffect } from "react";
import "../../styles/theme.css";

interface BackupItem {
  id: string;
  name: string;
  type: "manual" | "automatic";
  size: string;
  created_at: string;
  status: "completed" | "failed" | "in_progress";
  includes: string[];
}

interface BackupConfig {
  automatic_enabled: boolean;
  frequency: "daily" | "weekly" | "monthly";
  retention_days: number;
  backup_location: "local" | "cloud";
  include_files: boolean;
  include_database: boolean;
  include_configs: boolean;
  email_notifications: boolean;
}

const BackupPage: React.FC = () => {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [config, setConfig] = useState<BackupConfig>({
    automatic_enabled: false,
    frequency: "weekly",
    retention_days: 30,
    backup_location: "local",
    include_files: true,
    include_database: true,
    include_configs: true,
    email_notifications: true
  });

  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupItem | null>(null);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  // Cargar datos guardados
  useEffect(() => {
    loadBackupData();
  }, []);

  const loadBackupData = () => {
    try {
      const savedBackups = localStorage.getItem("backup_history");
      const savedConfig = localStorage.getItem("backup_config");
      
      if (savedBackups) {
        setBackups(JSON.parse(savedBackups));
      } else {
        // Datos de ejemplo
        const exampleBackups: BackupItem[] = [
          {
            id: "backup_001",
            name: "Backup Completo - Enero 2025",
            type: "manual",
            size: "125.4 MB",
            created_at: "2025-01-15T10:30:00Z",
            status: "completed",
            includes: ["Base de datos", "Archivos", "Configuraciones"]
          },
          {
            id: "backup_002",
            name: "Backup Automático",
            type: "automatic",
            size: "98.2 MB",
            created_at: "2025-01-10T02:00:00Z",
            status: "completed",
            includes: ["Base de datos", "Configuraciones"]
          },
          {
            id: "backup_003",
            name: "Backup Completo - Diciembre 2024",
            type: "manual",
            size: "156.8 MB",
            created_at: "2024-12-30T15:45:00Z",
            status: "completed",
            includes: ["Base de datos", "Archivos", "Configuraciones"]
          }
        ];
        setBackups(exampleBackups);
        localStorage.setItem("backup_history", JSON.stringify(exampleBackups));
      }

      if (savedConfig) {
        setConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error("Error cargando datos de backup:", error);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    
    try {
      // Simular creación de backup
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const newBackup: BackupItem = {
        id: `backup_${Date.now()}`,
        name: `Backup Manual - ${new Date().toLocaleDateString()}`,
        type: "manual",
        size: `${Math.floor(Math.random() * 100 + 50)}.${Math.floor(Math.random() * 9)} MB`,
        created_at: new Date().toISOString(),
        status: "completed",
        includes: [
          config.include_database ? "Base de datos" : "",
          config.include_files ? "Archivos" : "",
          config.include_configs ? "Configuraciones" : ""
        ].filter(Boolean)
      };

      const updatedBackups = [newBackup, ...backups];
      setBackups(updatedBackups);
      localStorage.setItem("backup_history", JSON.stringify(updatedBackups));

      // Registrar en auditoría
      const logEntry = {
        id: Date.now().toString(),
        action: "backup_created",
        user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
        timestamp: new Date().toISOString(),
        details: `Backup manual creado: ${newBackup.name}`
      };
      
      const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
      localStorage.setItem("audit_logs", JSON.stringify([logEntry, ...existingLogs]));

      setMessage({ text: "Backup creado exitosamente", type: "success" });
      
    } catch {
      setMessage({ text: "Error al crear el backup", type: "error" });
    } finally {
      setIsCreatingBackup(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const deleteBackup = (backupId: string) => {
    if (confirm("¿Está seguro de que desea eliminar este backup? Esta acción no se puede deshacer.")) {
      const updatedBackups = backups.filter(b => b.id !== backupId);
      setBackups(updatedBackups);
      localStorage.setItem("backup_history", JSON.stringify(updatedBackups));

      // Registrar en auditoría
      const logEntry = {
        id: Date.now().toString(),
        action: "backup_deleted",
        user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
        timestamp: new Date().toISOString(),
        details: `Backup eliminado: ${backupId}`
      };
      
      const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
      localStorage.setItem("audit_logs", JSON.stringify([logEntry, ...existingLogs]));

      setMessage({ text: "Backup eliminado", type: "success" });
      setTimeout(() => setMessage({ text: "", type: "" }), 2000);
    }
  };

  const startRestore = async () => {
    if (!selectedBackup) return;

    setRestoreProgress(0);
    
    try {
      // Simular proceso de restauración
      for (let i = 0; i <= 100; i += 10) {
        setRestoreProgress(i);
        await new Promise(resolve => setTimeout(resolve, 300));
      }

      // Registrar en auditoría
      const logEntry = {
        id: Date.now().toString(),
        action: "system_restored",
        user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
        timestamp: new Date().toISOString(),
        details: `Sistema restaurado desde: ${selectedBackup.name}`
      };
      
      const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
      localStorage.setItem("audit_logs", JSON.stringify([logEntry, ...existingLogs]));

      setMessage({ text: "Sistema restaurado exitosamente", type: "success" });
      setShowRestoreModal(false);
      setSelectedBackup(null);
      setRestoreProgress(0);
      
    } catch  {
      setMessage({ text: "Error durante la restauración", type: "error" });
    }
  };

  const downloadBackup = (backup: BackupItem) => {
    // Simular descarga
    const element = document.createElement("a");
    const file = new Blob([JSON.stringify(backup, null, 2)], { type: "application/json" });
    element.href = URL.createObjectURL(file);
    element.download = `${backup.name.replace(/\s+/g, "_")}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    setMessage({ text: "Descarga iniciada", type: "success" });
    setTimeout(() => setMessage({ text: "", type: "" }), 2000);
  };

  const saveConfig = () => {
    localStorage.setItem("backup_config", JSON.stringify(config));
    
    // Registrar en auditoría
    const logEntry = {
      id: Date.now().toString(),
      action: "backup_config_updated",
      user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
      timestamp: new Date().toISOString(),
      details: "Configuración de backup actualizada"
    };
    
    const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
    localStorage.setItem("audit_logs", JSON.stringify([logEntry, ...existingLogs]));

    setMessage({ text: "Configuración guardada", type: "success" });
    setTimeout(() => setMessage({ text: "", type: "" }), 2000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed": return "✅";
      case "failed": return "❌";
      case "in_progress": return "⏳";
      default: return "❓";
    }
  };

  return (
    <section className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1 className="ui-title">💾 Backup y Restauración</h1>
        <button 
          onClick={createBackup} 
          className="ui-btn"
          disabled={isCreatingBackup}
        >
          {isCreatingBackup ? "⏳ Creando..." : "🆕 Crear Backup"}
        </button>
      </div>

      {message.text && <div className={`message ${message.type}`}>{message.text}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        
        {/* Lista de Backups */}
        <div className="card">
          <h3>📋 Historial de Backups</h3>
          
          {backups.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>💾</div>
              <p>No hay backups disponibles</p>
              <p>Crea tu primer backup haciendo clic en "Crear Backup"</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {backups.map((backup) => (
                <div 
                  key={backup.id}
                  style={{
                    padding: "16px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                    backgroundColor: "#f9fafb"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "8px" }}>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "8px" }}>
                        {getStatusIcon(backup.status)}
                        {backup.name}
                        <span style={{ 
                          fontSize: "12px", 
                          padding: "2px 8px", 
                          borderRadius: "12px",
                          backgroundColor: backup.type === "manual" ? "#dbeafe" : "#d1fae5",
                          color: backup.type === "manual" ? "#1e40af" : "#059669"
                        }}>
                          {backup.type === "manual" ? "Manual" : "Automático"}
                        </span>
                      </h4>
                      <p style={{ margin: "0", fontSize: "14px", color: "#6b7280" }}>
                        Creado: {formatDate(backup.created_at)} • Tamaño: {backup.size}
                      </p>
                      <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9ca3af" }}>
                        Incluye: {backup.includes.join(", ")}
                      </p>
                    </div>
                    
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button 
                        onClick={() => downloadBackup(backup)}
                        className="ui-btn ui-btn--ghost ui-btn--sm"
                        title="Descargar"
                      >
                        📥
                      </button>
                      <button 
                        onClick={() => {
                          setSelectedBackup(backup);
                          setShowRestoreModal(true);
                        }}
                        className="ui-btn ui-btn--ghost ui-btn--sm"
                        title="Restaurar"
                      >
                        🔄
                      </button>
                      <button 
                        onClick={() => deleteBackup(backup.id)}
                        className="ui-btn ui-btn--ghost ui-btn--sm"
                        title="Eliminar"
                        style={{ color: "#ef4444" }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Configuración */}
        <div className="card">
          <h3>⚙️ Configuración</h3>
          
          <div className="form-group">
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={config.automatic_enabled}
                onChange={(e) => setConfig(prev => ({ ...prev, automatic_enabled: e.target.checked }))}
              />
              <span>Habilitar backups automáticos</span>
            </label>
          </div>

          {config.automatic_enabled && (
            <div className="form-group">
              <label>Frecuencia</label>
              <select
                value={config.frequency}
                onChange={(e) => setConfig(prev => ({ ...prev, frequency: e.target.value as "daily" | "weekly" | "monthly" }))}
              >
                <option value="daily">Diario</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensual</option>
              </select>
            </div>
          )}

          <div className="form-group">
            <label>Retención (días)</label>
            <input
              type="number"
              min="7"
              max="365"
              value={config.retention_days}
              onChange={(e) => setConfig(prev => ({ ...prev, retention_days: parseInt(e.target.value) }))}
            />
          </div>

          <div className="form-group">
            <label>Ubicación del backup</label>
            <select
              value={config.backup_location}
              onChange={(e) => setConfig(prev => ({ ...prev, backup_location: e.target.value as "local" | "cloud" }))}
            >
              <option value="local">Local</option>
              <option value="cloud">Nube</option>
            </select>
          </div>

          <div className="form-group">
            <h4>¿Qué incluir en el backup?</h4>
            
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={config.include_database}
                onChange={(e) => setConfig(prev => ({ ...prev, include_database: e.target.checked }))}
              />
              <span>Base de datos</span>
            </label>
            
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={config.include_files}
                onChange={(e) => setConfig(prev => ({ ...prev, include_files: e.target.checked }))}
              />
              <span>Archivos subidos</span>
            </label>
            
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={config.include_configs}
                onChange={(e) => setConfig(prev => ({ ...prev, include_configs: e.target.checked }))}
              />
              <span>Configuraciones</span>
            </label>
          </div>

          <div className="form-group">
            <label className="checkbox-group">
              <input
                type="checkbox"
                checked={config.email_notifications}
                onChange={(e) => setConfig(prev => ({ ...prev, email_notifications: e.target.checked }))}
              />
              <span>Notificaciones por email</span>
            </label>
          </div>

          <button onClick={saveConfig} className="ui-btn" style={{ width: "100%" }}>
            💾 Guardar Configuración
          </button>
        </div>
      </div>

      {/* Modal de Restauración */}
      {showRestoreModal && selectedBackup && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "12px",
            maxWidth: "500px",
            width: "90%",
            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)"
          }}>
            <h3>🔄 Restaurar Sistema</h3>
            
            <div style={{ marginBottom: "20px" }}>
              <p><strong>Backup seleccionado:</strong> {selectedBackup.name}</p>
              <p><strong>Fecha:</strong> {formatDate(selectedBackup.created_at)}</p>
              <p><strong>Incluye:</strong> {selectedBackup.includes.join(", ")}</p>
            </div>

            {restoreProgress > 0 && restoreProgress < 100 && (
              <div style={{ marginBottom: "20px" }}>
                <p>Restaurando sistema... {restoreProgress}%</p>
                <div style={{
                  width: "100%",
                  height: "8px",
                  backgroundColor: "#e5e7eb",
                  borderRadius: "4px",
                  overflow: "hidden"
                }}>
                  <div style={{
                    width: `${restoreProgress}%`,
                    height: "100%",
                    backgroundColor: "#3b82f6",
                    transition: "width 0.3s ease"
                  }} />
                </div>
              </div>
            )}

            <div style={{
              padding: "16px",
              backgroundColor: "#fef3c7",
              border: "1px solid #f59e0b",
              borderRadius: "8px",
              marginBottom: "20px"
            }}>
              <p style={{ margin: 0, fontSize: "14px" }}>
                ⚠️ <strong>Advertencia:</strong> Esta acción restaurará el sistema al estado del backup seleccionado. 
                Todos los datos actuales que no estén en el backup se perderán.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button 
                onClick={() => {
                  setShowRestoreModal(false);
                  setSelectedBackup(null);
                  setRestoreProgress(0);
                }}
                className="ui-btn ui-btn--ghost"
                disabled={restoreProgress > 0 && restoreProgress < 100}
              >
                Cancelar
              </button>
              <button 
                onClick={startRestore}
                className="ui-btn"
                disabled={restoreProgress > 0 && restoreProgress < 100}
                style={{ backgroundColor: "#ef4444", borderColor: "#ef4444" }}
              >
                {restoreProgress > 0 && restoreProgress < 100 ? "Restaurando..." : "Confirmar Restauración"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default BackupPage;

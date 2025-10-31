// src/modules/usuarios/crear_usuario.tsxm "react";
import React, { useEffect, useState } from "react";
import { http } from "../../shared/api/client";
import "../../styles/dashboard.css";

type Group = { id: number; name: string };

interface ApiError {
  response?: {
    status?: number;
    statusText?: string;
    data?: {
      error?: string;
      message?: string;
    };
  };
  message?: string;
}

const CrearGroup: React.FC = () => {
  const [groupName, setGroupName] = useState("");
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [useLocalStorage, setUseLocalStorage] = useState(false);

  useEffect(() => {
    void loadGroups();
  }, []);

  const loadGroups = async () => {
    setLoadingList(true);
    try {
      console.log("🔍 Cargando grupos desde:", "/api/User/group/");
      const res = await http.get<Group[]>("/api/User/group/");
      console.log("✅ Grupos cargados:", res.data);
      setGroups(res.data ?? []);
      setUseLocalStorage(false);
    } catch (error) {
      const err = error as ApiError;
      console.error("❌ Error cargando grupos:", err);
      
      // Fallback: cargar desde localStorage
      try {
        const stored = localStorage.getItem("mock.groups");
        const localGroups: Group[] = stored ? JSON.parse(stored) : [];
        setGroups(localGroups);
        setUseLocalStorage(true);
        setMessage({ 
          type: "error", 
          text: `Error del servidor (${err?.response?.status || 'desconocido'}). Usando datos locales.` 
        });
      } catch {
        setGroups([]);
        setUseLocalStorage(true);
      }
    } finally {
      setLoadingList(false);
    }
  };

  const saveToLocalStorage = (updatedGroups: Group[]) => {
    try {
      localStorage.setItem("mock.groups", JSON.stringify(updatedGroups));
    } catch (error) {
      console.error("Error guardando grupos en localStorage:", error);
    }
  };

  const getNextId = (): number => {
    if (groups.length === 0) return 1;
    return Math.max(...groups.map(g => g.id)) + 1;
  };

  const validate = () => {
    const name = groupName.trim();
    if (!name) {
      setMessage({ type: "error", text: "El nombre del grupo es obligatorio." });
      return false;
    }
    if (groups.some(g => g.name.toLowerCase() === name.toLowerCase())) {
      setMessage({ type: "error", text: "Ya existe un grupo con ese nombre." });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (!validate()) return;

    const payload = { name: groupName.trim() };
    setLoading(true);

    try {
      console.log("🚀 Creando grupo:", payload);
      console.log("🔗 URL completa:", window.location.origin + "/api/User/group/");
      
      const res = await http.post<Group>("/api/User/group/", payload);
      console.log("✅ Grupo creado:", res.data);
      
      const created: Group = res.data;
      setGroups(prev => [...prev, created]);
      setMessage({ type: "ok", text: `Grupo "${created.name}" creado con ID ${created.id}.` });
      setGroupName("");
      setUseLocalStorage(false);
    } catch (error) {
      const err = error as ApiError;
      console.error("❌ Error creando grupo:", err);
      console.error("📋 Detalles completos:", {
        status: err?.response?.status,
        statusText: err?.response?.statusText,
        data: err?.response?.data,
        message: err?.message,
        payload: payload,
        url: "/api/User/group"
      });
      
      // Mostrar error más específico
      let errorMessage = "Error desconocido";
      if (err?.response?.status === 500) {
        errorMessage = "Error interno del servidor. Verifica que el backend esté ejecutándose en localhost:8000";
      } else if (err?.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.status) {
        errorMessage = `Error ${err.response.status}: ${err.response.statusText}`;
      }
      
      setMessage({ 
        type: "error", 
        text: `Error del servidor: ${errorMessage}` 
      });
      
      // Fallback: guardar localmente
      const localGroup = { id: getNextId(), name: payload.name };
      const newGroups = [...groups, localGroup];
      setGroups(newGroups);
      saveToLocalStorage(newGroups);
      setUseLocalStorage(true);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`¿Eliminar grupo "${name}"?`)) return;
    
    try {
      if (!useLocalStorage) {
        console.log("🗑️ Eliminando grupo:", id);
        await http.delete(`/api/User/group/${id}`);
        console.log("✅ Grupo eliminado del servidor");
      }
      
      const updatedGroups = groups.filter(g => g.id !== id);
      setGroups(updatedGroups);
      
      if (useLocalStorage) {
        saveToLocalStorage(updatedGroups);
      }
      
      setMessage({ 
        type: "ok", 
        text: `Grupo "${name}" eliminado${useLocalStorage ? ' localmente' : ''}.` 
      });
    } catch (error) {
      const err = error as ApiError;
      console.error("❌ Error eliminando grupo:", err);
      
      // Fallback: eliminar solo localmente
      const updatedGroups = groups.filter(g => g.id !== id);
      setGroups(updatedGroups);
      saveToLocalStorage(updatedGroups);
      setMessage({ 
        type: "ok", 
        text: `Grupo "${name}" eliminado localmente (error en backend).` 
      });
      setUseLocalStorage(true);
    }
  };

  // Función para probar diferentes endpoints
  const testBackend = async () => {
    const endpoints = [
      "http://localhost:8000/api/User/group",
      "/api/User/group", 
      "/api/groups/",
      "http://localhost:8000/api/groups/"
    ];
    
    for (const endpoint of endpoints) {
      try {
        console.log(`🔍 Probando: ${endpoint}`);
        const res = await http.get(endpoint);
        console.log(`✅ ${endpoint} funciona:`, res.data);
        setMessage({ type: "ok", text: `Endpoint funcional: ${endpoint}` });
        return;
      } catch (error) {
        const err = error as ApiError;
        console.log(`❌ ${endpoint} falló:`, err?.response?.status);
      }
    }
    setMessage({ type: "error", text: "Ningún endpoint funciona. ¿Está el backend ejecutándose?" });
  };

  return (
    <section className="page">
      <h1 className="ui-title">Crear Grupo</h1>
      <p className="ui-page__description">Crea y gestiona grupos de usuarios.</p>

      {/* Panel de depuración mejorado */}
      <div className="card" style={{ marginBottom: 16, padding: 12, backgroundColor: "#f3f4f6", border: "1px solid #d1d5db" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span>🔧 Depuración:</span>
          <button className="ui-btn ui-btn--ghost" onClick={testBackend}>
            Probar Endpoints
          </button>
          <button className="ui-btn ui-btn--ghost" onClick={() => console.log("Grupos actuales:", groups)}>
            Ver Grupos
          </button>
        </div>
        <div style={{ fontSize: "12px", color: "#6b7280" }}>
          <div>Estado: {useLocalStorage ? "Local" : "Servidor"} | Grupos: {groups.length}</div>
          <div>Frontend: {window.location.origin}</div>
          <div>Backend esperado: http://localhost:8000</div>
        </div>
      </div>

      {useLocalStorage && (
        <div className="card" style={{ marginBottom: 16, padding: 12, backgroundColor: "#fef3c7", border: "1px solid #f59e0b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span>⚠️ Trabajando sin conexión al servidor.</span>
          </div>
        </div>
      )}

      <div className="card" style={{ maxWidth: 680, margin: "16px 0", padding: 16 }}>
        <form onSubmit={handleSubmit} className="form-vertical">
          <div className="form-field">
            <label className="field-label">Nombre del grupo</label>
            <input
              className="ui-input"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Ej: Administradores, Asesores, Vendedores"
              required
            />
          </div>

          <div className="form-actions">
            <button className="ui-btn ui-btn--primary" type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear Grupo"}
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              onClick={() => { setGroupName(""); setMessage(null); }}
            >
              Limpiar
            </button>
          </div>

          {message && (
            <div className={`form-message ${message.type === "ok" ? "ok" : "error"}`}>
              {message.text}
            </div>
          )}
        </form>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <h3 style={{ marginTop: 0 }}>
          Grupos existentes {useLocalStorage && <span style={{ fontSize: "12px", color: "#6b7280" }}>(local)</span>}
        </h3>

        {loadingList ? (
          <div className="ui-cell--center">Cargando grupos...</div>
        ) : groups.length === 0 ? (
          <div className="ui-cell--muted">No hay grupos creados.</div>
        ) : (
          <div className="groups-list">
            {groups.map(g => (
              <div key={g.id} className="group-item">
                <div className="group-info">
                  <div className="group-id">ID: {g.id}</div>
                  <div className="group-name">{g.name}</div>
                </div>
                <div>
                  <button 
                    className="ui-btn ui-btn--ghost" 
                    onClick={() => navigator.clipboard?.writeText(String(g.id))}
                    title="Copiar ID al portapapeles"
                  >
                    Copiar ID
                  </button>
                  <button 
                    className="ui-btn ui-btn--danger-ghost" 
                    onClick={() => handleDelete(g.id, g.name)} 
                    style={{ marginLeft: 8 }}
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{ marginTop: 12 }}>
          <button className="ui-btn ui-btn--ghost" onClick={loadGroups} disabled={loadingList}>
            {loadingList ? "Actualizando..." : "Actualizar lista"}
          </button>
        </div>
      </div>
    </section>
  );
};

export default CrearGroup;
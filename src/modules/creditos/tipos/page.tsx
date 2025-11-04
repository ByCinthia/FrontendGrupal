import React, { useState, useEffect } from "react";
import { 
  listTiposCredito, 
  createTipoCredito, 
  updateTipoCredito, 
  deleteTipoCredito,
  validateTipoCredito,
  formatMonto 
} from "./service";
import type { 
  TipoCredito, 
  CreateTipoCreditoInput, 
  UpdateTipoCreditoInput,
  ListTiposCreditoParams 
} from "./types";
import { useAuth } from "../../auth/service";
import "../../../styles/unified-app.css";

const TiposCreditoPage: React.FC = () => {
  const { user } = useAuth();
  const [tipos, setTipos] = useState<TipoCredito[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Paginación y filtros
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Modal de crear/editar
  const [showModal, setShowModal] = useState(false);
  const [editingTipo, setEditingTipo] = useState<TipoCredito | null>(null);
  const [modalData, setModalData] = useState<CreateTipoCreditoInput>({
    nombre: "",
    descripcion: "",
    monto_minimo: 1000,
    monto_maximo: 50000
  });

  // Verificar permisos (solo admins pueden gestionar tipos)
  const isAdmin = user?.roles?.includes("admin") || user?.roles?.includes("superadmin");

  useEffect(() => {
    loadTipos();
  }, [search, page]);

  const loadTipos = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params: ListTiposCreditoParams = {
        search: search.trim() || undefined,
        page,
        page_size: pageSize
      };
      
      const response = await listTiposCredito(params);
      setTipos(response.results);
      setTotalCount(response.count);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset a primera página
  };

  const openCreateModal = () => {
    setEditingTipo(null);
    setModalData({
      nombre: "",
      descripcion: "",
      monto_minimo: 1000,
      monto_maximo: 50000
    });
    setShowModal(true);
  };

  const openEditModal = (tipo: TipoCredito) => {
    setEditingTipo(tipo);
    setModalData({
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      monto_minimo: tipo.monto_minimo,
      monto_maximo: tipo.monto_maximo
    });
    setShowModal(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validar datos
    const errors = validateTipoCredito(modalData);
    if (errors.length > 0) {
      setError(errors.join(", "));
      return;
    }

    setLoading(true);
    try {
      if (editingTipo) {
        // Actualizar
        const updateData: UpdateTipoCreditoInput = {
          id: editingTipo.id,
          ...modalData
        };
        await updateTipoCredito(updateData);
        setSuccess("Tipo de crédito actualizado exitosamente");
      } else {
        // Crear
        await createTipoCredito(modalData);
        setSuccess("Tipo de crédito creado exitosamente");
      }
      
      setShowModal(false);
      await loadTipos();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, nombre: string) => {
    if (!window.confirm(`¿Está seguro de eliminar el tipo "${nombre}"?`)) {
      return;
    }

    setLoading(true);
    try {
      await deleteTipoCredito(id);
      setSuccess("Tipo de crédito eliminado exitosamente");
      await loadTipos();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  if (!isAdmin) {
    return (
      <section className="page">
        <div className="card" style={{ textAlign: "center", padding: "40px" }}>
          <div style={{ fontSize: "64px", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ color: "#dc2626", marginBottom: "8px" }}>Acceso Denegado</h2>
          <p style={{ color: "#6b7280" }}>
            Solo los administradores pueden gestionar tipos de crédito.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <div>
          <h1 className="ui-title">💳 Tipos de Crédito</h1>
          <p style={{ color: "#6b7280", margin: "4px 0 0 0" }}>
            Gestión de productos crediticios disponibles
          </p>
        </div>
        <button onClick={openCreateModal} className="ui-btn">
          ➕ Nuevo Tipo
        </button>
      </div>

      {/* Mensajes */}
      {error && (
        <div style={{ 
          backgroundColor: "#fef2f2", 
          border: "1px solid #fecaca", 
          color: "#dc2626", 
          padding: "12px", 
          borderRadius: "8px", 
          marginBottom: "16px" 
        }}>
          {error}
        </div>
      )}

      {success && (
        <div style={{ 
          backgroundColor: "#f0fdf4", 
          border: "1px solid #bbf7d0", 
          color: "#16a34a", 
          padding: "12px", 
          borderRadius: "8px", 
          marginBottom: "16px" 
        }}>
          {success}
        </div>
      )}

      {/* Filtros */}
      <div className="card" style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              style={{ 
                width: "100%", 
                padding: "8px 12px", 
                border: "1px solid #d1d5db", 
                borderRadius: "6px" 
              }}
            />
          </div>
          <div style={{ color: "#6b7280", fontSize: "14px" }}>
            {totalCount} tipos encontrados
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="card">
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div>⏳ Cargando tipos de crédito...</div>
          </div>
        ) : tipos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>📋</div>
            <div>No hay tipos de crédito disponibles</div>
            <div>Cree uno nuevo para comenzar</div>
          </div>
        ) : (
          <div>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Descripción</th>
                    <th>Monto Mínimo</th>
                    <th>Monto Máximo</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tipos.map((tipo) => (
                    <tr key={tipo.id}>
                      <td style={{ fontWeight: "600" }}>{tipo.nombre}</td>
                      <td>{tipo.descripcion}</td>
                      <td>{formatMonto(tipo.monto_minimo)}</td>
                      <td>{formatMonto(tipo.monto_maximo)}</td>
                      <td>
                        <div style={{ display: "flex", gap: "8px" }}>
                          <button
                            onClick={() => openEditModal(tipo)}
                            className="ui-btn ui-btn--ghost"
                            style={{ fontSize: "12px", padding: "4px 8px" }}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDelete(tipo.id, tipo.nombre)}
                            className="ui-btn ui-btn--ghost"
                            style={{ 
                              fontSize: "12px", 
                              padding: "4px 8px",
                              color: "#dc2626",
                              borderColor: "#dc2626"
                            }}
                          >
                            🗑️ Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
              <div style={{ 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center", 
                gap: "16px", 
                marginTop: "20px", 
                padding: "16px" 
              }}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  className="ui-btn ui-btn--ghost"
                >
                  ← Anterior
                </button>
                <span style={{ color: "#6b7280" }}>
                  Página {page} de {totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page >= totalPages}
                  className="ui-btn ui-btn--ghost"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal Crear/Editar */}
      {showModal && (
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
            borderRadius: "8px",
            padding: "24px",
            width: "90%",
            maxWidth: "500px",
            maxHeight: "90vh",
            overflow: "auto"
          }}>
            <h3 style={{ margin: "0 0 20px 0", color: "#1f2937" }}>
              {editingTipo ? "Editar Tipo de Crédito" : "Nuevo Tipo de Crédito"}
            </h3>

            <form onSubmit={handleModalSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "4px", 
                  fontWeight: "500", 
                  color: "#374151" 
                }}>
                  Nombre *
                </label>
                <input
                  type="text"
                  value={modalData.nombre}
                  onChange={(e) => setModalData(prev => ({ ...prev, nombre: e.target.value }))}
                  placeholder="Ej: Crédito Personal"
                  required
                  style={{ 
                    width: "100%", 
                    padding: "8px 12px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "6px" 
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ 
                  display: "block", 
                  marginBottom: "4px", 
                  fontWeight: "500", 
                  color: "#374151" 
                }}>
                  Descripción *
                </label>
                <textarea
                  value={modalData.descripcion}
                  onChange={(e) => setModalData(prev => ({ ...prev, descripcion: e.target.value }))}
                  placeholder="Describe las características de este tipo de crédito..."
                  required
                  rows={3}
                  style={{ 
                    width: "100%", 
                    padding: "8px 12px", 
                    border: "1px solid #d1d5db", 
                    borderRadius: "6px",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "4px", 
                    fontWeight: "500", 
                    color: "#374151" 
                  }}>
                    Monto Mínimo (BOB) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={modalData.monto_minimo}
                    onChange={(e) => setModalData(prev => ({ ...prev, monto_minimo: Number(e.target.value) }))}
                    required
                    style={{ 
                      width: "100%", 
                      padding: "8px 12px", 
                      border: "1px solid #d1d5db", 
                      borderRadius: "6px" 
                    }}
                  />
                </div>

                <div>
                  <label style={{ 
                    display: "block", 
                    marginBottom: "4px", 
                    fontWeight: "500", 
                    color: "#374151" 
                  }}>
                    Monto Máximo (BOB) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={modalData.monto_maximo}
                    onChange={(e) => setModalData(prev => ({ ...prev, monto_maximo: Number(e.target.value) }))}
                    required
                    style={{ 
                      width: "100%", 
                      padding: "8px 12px", 
                      border: "1px solid #d1d5db", 
                      borderRadius: "6px" 
                    }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="ui-btn ui-btn--ghost"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="ui-btn"
                >
                  {loading ? "Guardando..." : editingTipo ? "Actualizar" : "Crear"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};

export default TiposCreditoPage;
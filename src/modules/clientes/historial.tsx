import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listClientes, formatNombreCompleto } from "./service";
import type { Cliente } from "./types";
import "../../styles/theme.css";

const HistorialClientesPage: React.FC = () => {
  const [rows, setRows] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      setError("");
      try {
        const response = await listClientes({ page: 1, page_size: 50 });
        setRows(response.results);
      } catch (err) {
        console.error("Error cargando clientes:", err);
        setError("Error al cargar la lista de clientes");
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter(c =>
      `${c.nombre} ${c.apellido} ${c.telefono}`.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <section className="ui-page">
      <div className="ui-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              placeholder="Buscar por nombre, apellido o teléfono…"
              className="ui-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ minWidth: 280 }}
            />
          </div>

          <div>
            <Link to="/app/clientes/crear" className="ui-btn ui-btn--primary">
              ➕ Crear cliente
            </Link>
          </div>
        </div>

        {error && (
          <div className="ui-alert ui-alert--error" style={{ marginBottom: 12 }}>
            {error}
          </div>
        )}

        <div className="ui-card ui-card--table">
          <div className="ui-table__wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Teléfono</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {loading && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 24 }}>
                      Cargando clientes...
                    </td>
                  </tr>
                )}
                
                {!loading && filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ textAlign: "center", padding: 24 }}>
                      {error ? "Error al cargar datos" : "No se encontraron clientes"}
                    </td>
                  </tr>
                )}
                
                {!loading && filtered.map(cliente => (
                  <tr key={String(cliente.id)}>
                    <td>
                      <div>
                        <strong>{formatNombreCompleto(cliente)}</strong>
                      </div>
                    </td>
                    <td>{cliente.telefono}</td>
                    <td>
                      {cliente.fecha_registro 
                        ? new Date(cliente.fecha_registro).toLocaleDateString()
                        : "—"
                      }
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                        <Link 
                          className="ui-btn ui-btn--ghost ui-btn--sm" 
                          to={`/app/clientes/${cliente.id}`}
                        >
                          Ver
                        </Link>
                        <Link 
                          className="ui-btn ui-btn--ghost ui-btn--sm" 
                          to={`/app/clientes/${cliente.id}/editar`}
                        >
                          Editar
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estadísticas rápidas */}
        {!loading && (
          <div style={{ marginTop: 16, padding: 12, background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
            <small style={{ color: "var(--text-muted)" }}>
              Mostrando {filtered.length} de {rows.length} clientes
            </small>
          </div>
        )}
      </div>
    </section>
  );
};

export default HistorialClientesPage;
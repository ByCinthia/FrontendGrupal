import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "../../styles/theme.css";

/* Tipo local mínimo para clientes (ajusta/importa desde types.ts si lo tienes) */
type Client = {
  id: string | number;
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
};

const HistorialClientesPage: React.FC = () => {
  const [rows, setRows] = useState<Client[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [query, setQuery] = useState<string>("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        // TODO: reemplazar por llamada real al servicio: await listClients(...)
        // Por ahora placeholder vacío
        setRows([]);
      } catch (err) {
        console.error("Error cargando clientes:", err);
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
      `${c.nombre ?? ""} ${c.apellido ?? ""} ${c.email ?? ""}`.toLowerCase().includes(q)
    );
  }, [rows, query]);

  return (
    <section className="ui-page">
      <div className="ui-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              placeholder="Buscar por nombre o email…"
              className="ui-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ minWidth: 260 }}
            />
          </div>

          <div>
            <Link to="/app/clientes/crear" className="ui-btn ui-btn--primary">➕ Crear cliente</Link>
          </div>
        </div>

        <div className="ui-card ui-card--table">
          <div className="ui-table__wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Email</th>
                  <th>Teléfono</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={4}>Cargando…</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={4}>Sin resultados</td></tr>}
                {!loading && filtered.map(c => (
                  <tr key={String(c.id)}>
                    <td>{`${c.nombre ?? ""} ${c.apellido ?? ""}`.trim() || "—"}</td>
                    <td>{c.email ?? "—"}</td>
                    <td>{c.telefono ?? "—"}</td>
                    <td style={{ textAlign: "right" }}>
                      <Link className="ui-btn ui-btn--ghost" to={`/app/clientes/${c.id}`}>Ver</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HistorialClientesPage;
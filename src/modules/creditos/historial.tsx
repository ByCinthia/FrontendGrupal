import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { listCredits } from "./service";
import type { Credit } from "./types";
import "../../styles/theme.css";

/**
 * Ver créditos (historial)
 * - búsqueda por código/cliente
 * - filtro por estado
 * - muestra resumen de pagos / indicador de vencimiento
 */
const HistorialCreditosPage: React.FC = () => {
  const [rows, setRows] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [estadoFilter, setEstadoFilter] = useState<string>("");

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const r = await listCredits({ page: 1, page_size: 200 });
        setRows(r.results ?? []);
      } catch (err) {
        console.error("Error cargando créditos:", err);
        setRows([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const estados = useMemo(() => {
    const s = new Set<string>();
    rows.forEach(r => { if (r?.estado) s.add(r.estado); });
    return Array.from(s).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter(r => {
      if (estadoFilter && (r).estado !== estadoFilter) return false;
      if (!q) return true;
      const cliente = String(r.cliente ?? "").toLowerCase();
      const codigo = String(r.codigo ?? "").toLowerCase();
      return cliente.includes(q) || codigo.includes(q);
    });
  }, [rows, query, estadoFilter]);

  const now = Date.now();

  // Tipo local extendido para evitar 'any' y permitir campos opcionales del payload
  type CreditExt = Credit & {
    pagos?: unknown[];
    pagos_summary?: string;
    vencimiento?: string;
    fecha_programada?: string;
    monto?: number;
    moneda?: string;
    codigo?: string;
    cliente?: string;
    estado?: string;
    fecha_solicitud?: string;
    id?: string | number;
  };

  return (
    <section className="ui-page">
      <div className="ui-card">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 12 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              placeholder="Buscar por código o cliente…"
              className="ui-input"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ minWidth: 260 }}
            />
            <select className="ui-select" value={estadoFilter} onChange={e => setEstadoFilter(e.target.value)}>
              <option value="">Todos los estados</option>
              {estados.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <Link to="/app/creditos/crear" className="ui-btn ui-btn--primary">➕ Crear crédito</Link>
          </div>
        </div>

        <div className="ui-card ui-card--table">
          <div className="ui-table__wrap">
            <table className="ui-table">
              <thead>
                <tr>
                  <th>Estado</th>
                  <th>Código</th>
                  <th>Cliente</th>
                  <th style={{ textAlign: "right" }}>Monto</th>
                  <th>Vencimiento</th>
                  <th>Pagos / Atrasos</th>
                </tr>
              </thead>
              <tbody>
                {loading && <tr><td colSpan={6}>Cargando…</td></tr>}
                {!loading && filtered.length === 0 && <tr><td colSpan={6}>Sin resultados</td></tr>}
                {!loading && filtered.map((cRaw) => {
                  const c = cRaw as CreditExt;

                  // Resumen de pagos seguro
                  const pagosCount = Array.isArray(c.pagos) ? c.pagos.length : undefined;
                  const pagosSummary = c.pagos_summary ?? (pagosCount !== undefined ? `${pagosCount} pagos` : "—");

                  // Determinar si vencido (campo vencimiento / fecha_programada)
                  const vencimientoStr = c.vencimiento ?? c.fecha_programada ?? null;
                  const vencido = vencimientoStr ? (new Date(vencimientoStr).getTime() < now) : false;

                  return (
                    <tr key={String(c.id ?? c.codigo ?? Math.random())}>
                      <td>
                        <span className={`ui-status ui-status--${getStatusVariant(c.estado ?? "")}`}>
                          {c.estado ?? "—"}
                        </span>
                        {vencido && <span style={{ marginLeft: 8, color: "var(--danger)" }}>Vencido</span>}
                      </td>

                      <td>
                        {c.id ? <Link to={`/app/creditos/${c.id}`}>{c.codigo ?? String(c.id)}</Link> : (c.codigo ?? "—")}
                      </td>

                      <td>{c.cliente ?? "—"}</td>

                      <td style={{ textAlign: "right" }}>
                        {formatMoney(c.monto, c.moneda)}
                      </td>

                      <td>{vencimientoStr ? new Date(vencimientoStr).toLocaleDateString() : "—"}</td>

                      <td>{pagosSummary}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HistorialCreditosPage;

/* Helpers */
function getStatusVariant(estado: string) {
  switch (estado) {
    case "APROBADO":
    case "DESEMBOLSADO":
      return "active";
    case "RECHAZADO":
    case "CANCELADO":
      return "inactive";
    case "SOLICITADO":
    case "EN_EVALUACION":
      return "pending";
    default:
      return "inactive";
  }
}

function formatMoney(value: number | undefined, moneda?: string) {
  if (value == null) return "—";
  try {
    return new Intl.NumberFormat(undefined, { style: "currency", currency: (moneda ?? "USD") }).format(value);
  } catch {
    return `${value} ${moneda ?? ""}`;
  }
}

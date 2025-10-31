import React, { useEffect, useMemo, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";
import { listCredits, changeStatus } from "./service";
import type { Credit, CreditStatus, ListCreditsParams, Moneda } from "./types";
import "../../styles/dashboard.css";

const ESTADOS: (CreditStatus | "ALL")[] = [
  "ALL","SOLICITADO","EN_EVALUACION","APROBADO","RECHAZADO","DESEMBOLSADO","EN_MORA","CANCELADO"
];

const fmtMoney = (n: number, m: Moneda): string =>
  new Intl.NumberFormat(undefined, { style: "currency", currency: m, maximumFractionDigits: 2 }).format(n);

/* ---------- UI atoms ---------- */
const StatusBadge: React.FC<{ s: CreditStatus }> = ({ s }) => {
  const cls =
    s === "APROBADO" || s === "DESEMBOLSADO" ? "ui-status ui-status--active" :
    s === "RECHAZADO" || s === "EN_MORA" ? "ui-status ui-status--inactive" :
    "ui-status";
  const label: Record<CreditStatus, string> = {
    SOLICITADO:"Solicitado", EN_EVALUACION:"En evaluación", APROBADO:"Aprobado",
    RECHAZADO:"Rechazado", DESEMBOLSADO:"Desembolsado", EN_MORA:"En mora", CANCELADO:"Cancelado",
  };
  return (<span className={cls}><span className="ui-status__dot"/>{label[s]}</span>);
};

const TabNavigation: React.FC = () => {
  const location = useLocation();
  const isGestion = location.pathname === "/app/creditos";
  const isSolicitar = location.pathname === "/app/creditos/solicitar";

  return (
    <nav className="ui-tabs">
      <Link 
        to="/app/creditos" 
        className={`ui-tab ${isGestion ? "ui-tab--active" : ""}`}
      >
        Gestión de créditos
      </Link>
      <Link 
        to="/app/creditos/solicitar" 
        className={`ui-tab ${isSolicitar ? "ui-tab--active" : ""}`}
      >
        Solicitar crédito
      </Link>
    </nav>
  );
};

const Toolbar: React.FC<{
  filters: Pick<ListCreditsParams, "search" | "estado">;
  onChange: (p: Partial<ListCreditsParams>) => void;
  total: number;
}> = ({ filters, onChange, total }) => (
  <div className="ui-toolbar">
    <div className="ui-toolbar__left">
      <input
        className="ui-input"
        placeholder="Buscar por cliente o código…"
        value={filters.search ?? ""}
        onChange={(e) => onChange({ search: e.target.value, page: 1 })}
      />
      <select
        className="ui-select"
        value={filters.estado ?? "ALL"}
        onChange={(e) => onChange({ estado: e.target.value as ListCreditsParams["estado"], page: 1 })}
      >
        {ESTADOS.map((x) => <option key={x} value={x}>{x === "ALL" ? "Todos" : x.replace("_"," ")}</option>)}
      </select>
    </div>
    <div className="ui-toolbar__right">
      <span className="ui-count">{total} créditos</span>
    </div>
  </div>
);

const TableHead: React.FC = () => (
  <thead>
    <tr>
      <th>Estado</th>
      <th>Código</th>
      <th>Cliente</th>
      <th>Monto</th>
      <th>Tasa</th>
      <th>Plazo</th>
      <th className="ui-td--actions">Acciones</th>
    </tr>
  </thead>
);

const Row: React.FC<{
  c: Credit;
  busyId: Credit["id"] | null;
  onEvaluar: (id: Credit["id"]) => void;
  onAprobar: (id: Credit["id"]) => void;
  onRechazar: (id: Credit["id"]) => void;
}> = ({ c, busyId, onEvaluar, onAprobar, onRechazar }) => {
  const isBusy = busyId === c.id;
  const buttons: React.ReactNode[] = [];
  if (c.estado === "SOLICITADO") {
    buttons.push(<button key="evaluar" className="ui-btn ui-btn--ghost" disabled={isBusy} onClick={() => onEvaluar(c.id)}>Evaluar</button>);
  }
  if (c.estado === "EN_EVALUACION") {
    buttons.push(<button key="aprobar" className="ui-btn ui-btn--ghost" disabled={isBusy} onClick={() => onAprobar(c.id)}>Aprobar</button>);
    buttons.push(<button key="rechazar" className="ui-btn ui-btn--ghost" disabled={isBusy} onClick={() => onRechazar(c.id)}>Rechazar</button>);
  }
  return (
    <tr>
      <td><StatusBadge s={c.estado} /></td>
      <td>{c.codigo}</td>
      <td>{c.cliente}</td>
      <td>{fmtMoney(c.monto, c.moneda)} <small>({c.moneda})</small></td>
      <td>{c.tasa_anual}%</td>
      <td>{c.plazo_meses} m</td>
      <td className="ui-td--actions">{buttons.length ? buttons : <span className="ui-cell--muted">—</span>}</td>
    </tr>
  );
};

const Pager: React.FC<{ page: number; pageSize: number; count: number; onPage: (p: number) => void; }> =
({ page, pageSize, count, onPage }) => {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  return (
    <div className="ui-pager">
      <button className="ui-btn" disabled={page <= 1} onClick={() => onPage(page - 1)}>Anterior</button>
      <span className="ui-pager__info">Página {page} / {totalPages}</span>
      <button className="ui-btn" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Siguiente</button>
    </div>
  );
};

/* ---------- Gestión Component (tabla de créditos) ---------- */
const GestionCreditos: React.FC = () => {
  const [rows, setRows] = useState<Credit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [estado, setEstado] = useState<ListCreditsParams["estado"]>("ALL");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [count, setCount] = useState<number>(0);
  const [busyId, setBusyId] = useState<Credit["id"] | null>(null);

  const filters = useMemo(() => ({ search, estado, page, page_size: pageSize }), [search, estado, page, pageSize]);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true); setError(null);
        const res = await listCredits(filters);
        setRows(res.results); setCount(res.count);
      } catch {
        setError("No se pudieron cargar los créditos.");
      } finally {
        setLoading(false);
      }
    })();
  }, [filters]);

  const doChange = async (id: Credit["id"], action: "evaluar"|"aprobar"|"rechazar"): Promise<void> => {
    setBusyId(id);
    try {
      setRows(prev => prev.map(c => c.id === id ? {
        ...c,
        estado: action === "evaluar" ? "EN_EVALUACION" : action === "aprobar" ? "APROBADO" : "RECHAZADO"
      } : c));
      const updated = await changeStatus(id, action);
      setRows(prev => prev.map(c => c.id === id ? updated : c));
    } catch {
      alert("No se pudo aplicar la acción.");
      const res = await listCredits(filters);
      setRows(res.results); setCount(res.count);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <Toolbar
        filters={{ search, estado }}
        onChange={(p) => {
          if (typeof p.search === "string") setSearch(p.search);
          if (p.estado !== undefined) setEstado(p.estado);
          if (typeof p.page === "number") setPage(p.page);
        }}
        total={count}
      />

      <div className="ui-card ui-card--table">
        <div className="ui-table__wrap">
          <table className="ui-table">
            <TableHead />
            <tbody>
              {loading && <tr><td colSpan={7} className="ui-cell--center">Cargando…</td></tr>}
              {!loading && error && <tr><td colSpan={7} className="ui-cell--error">{error}</td></tr>}
              {!loading && !error && rows.length === 0 && <tr><td colSpan={7} className="ui-cell--muted">Sin resultados.</td></tr>}
              {!loading && !error && rows.map((c) => (
                <Row
                  key={String(c.id)}
                  c={c}
                  busyId={busyId}
                  onEvaluar={(id) => void doChange(id, "evaluar")}
                  onAprobar={(id) => void doChange(id, "aprobar")}
                  onRechazar={(id) => void doChange(id, "rechazar")}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="ui-card__footer">
          <Pager page={page} pageSize={pageSize} count={count} onPage={setPage} />
        </div>
      </div>
    </>
  );
};

/* ---------- Main Page ---------- */
const CreditsPage: React.FC = () => {
  const location = useLocation();
  const showGestion = location.pathname === "/app/creditos";

  return (
    <section className="ui-page">
      <h1 className="ui-page__title">Créditos</h1>
      
      <TabNavigation />
      
      <div className="ui-tab-content">
        {showGestion ? <GestionCreditos /> : <Outlet />}
      </div>
    </section>
  );
};

export default CreditsPage;

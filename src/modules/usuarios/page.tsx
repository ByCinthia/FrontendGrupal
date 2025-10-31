import React, { useCallback, useEffect, useMemo, useState } from "react";
import { listUsers, setUserActive } from "./service";
import type { User } from "./types";
import "../../styles/dashboard.css";

import UserEditModal from "./components/UserEditModal";
import UserHistory from "./components/UserHistory";

/* Helpers y componentes (StatusBadge, Toolbar, TableHead, Row, Pager) */
/* ===== Helpers de fecha coherente ===== */
const TZ = "America/La_Paz" as const;
// Bolivia es UTC-4 todo el año (sin DST)
const TZ_OFFSET_MIN = 240; // minutos que hay que SUMAR para ir de local->UTC

type Parts = { y: number; m: number; d: number; h: number; mi: number; s: number };

const splitYMDHMS = (s: string): Parts | null => {
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/);
  if (!m) return null;
  return { y: +m[1], m: +m[2], d: +m[3], h: +(m[4] ?? "0"), mi: +(m[5] ?? "0"), s: +(m[6] ?? "0") };
};

// Interpreta strings SIN zona como hora de America/La_Paz
const parseBackendDate = (s: string): Date => {
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(s)) return new Date(s);
  const p = splitYMDHMS(s);
  if (!p) return new Date(s);
  const utcMs = Date.UTC(p.y, p.m - 1, p.d, p.h, p.mi, p.s) + TZ_OFFSET_MIN * 60 * 1000;
  return new Date(utcMs);
};

const fmtRelative = (d: Date): string => {
  const rtf = new Intl.RelativeTimeFormat("es", { numeric: "auto" });
  const diff = d.getTime() - Date.now();
  const abs = Math.abs(diff);
  const m = 60_000, h = 60 * m, dMs = 24 * h;
  if (abs < m) return rtf.format(Math.round(diff / 1000), "second");
  if (abs < h) return rtf.format(Math.round(diff / m), "minute");
  if (abs < dMs) return rtf.format(Math.round(diff / h), "hour");
  return rtf.format(Math.round(diff / dMs), "day");
};

const formatLastAccess = (s?: string | null): string => {
  if (!s) return "Nunca";
  const d = parseBackendDate(s);
  if (Number.isNaN(d.getTime())) return "Fecha inválida";
  const dateStr = new Intl.DateTimeFormat("es-BO", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: TZ,
  }).format(d);
  return `${dateStr} · ${fmtRelative(d)}`;
};

/* ===== Permisos/Contexto (simple) ===== */
const getPerms = (): Set<string> => {
  try {
    const raw = localStorage.getItem("auth.permissions");
    if (raw) return new Set<string>(JSON.parse(raw));
    return new Set<string>(["user.read", "user.toggle"]);
  } catch {
    return new Set<string>(["user.read", "user.toggle"]);
  }
};
const getCurrentUserId = (): string | number | null => {
  try {
    const raw = localStorage.getItem("auth.me");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.id ?? null;
  } catch {
    return null;
  }
};
const getTenantId = (): string | null => {
  try {
    return localStorage.getItem("auth.tenant_id");
  } catch {
    return null;
  }
};
const getCurrentUserRole = (): User["role"] | undefined => {
  try {
    const raw = localStorage.getItem("auth.me");
    if (!raw) return undefined;
    return (JSON.parse(raw) as { role?: string }).role as User["role"] | undefined;
  } catch {
    return undefined;
  }
};

/* ===== UI ===== */
const StatusBadge: React.FC<{ active: boolean }> = ({ active }) => (
  <span className={`ui-badge ${active ? "ui-badge--success" : "ui-badge--danger"}`}>
    <span className="ui-badge__dot" />
    {active ? "Activo" : "Inactivo"}
  </span>
);

const Toolbar: React.FC<{
  search: string;
  onSearch: (v: string) => void;
  activo: boolean | "all";
  onActivo: (v: boolean | "all") => void;
  total: number;
}> = ({ search, onSearch, activo, onActivo, total }) => (
  <div className="ui-toolbar">
    <div className="ui-toolbar__left">
      <input
        placeholder="Buscar por nombre, usuario o email…"
        value={search}
        onChange={(e) => onSearch(e.target.value)}
        className="ui-input"
        aria-label="Buscar usuarios"
      />
      <select
        value={activo === "all" ? "all" : activo ? "true" : "false"}
        onChange={(e) => onActivo(e.target.value === "all" ? "all" : e.target.value === "true")}
        className="ui-select"
        aria-label="Filtrar por estado"
      >
        <option value="all">Todos</option>
        <option value="true">Activos</option>
        <option value="false">Inactivos</option>
      </select>
    </div>
    <div className="ui-toolbar__right">
      <span className="ui-meta">{total} usuarios</span>
    </div>
  </div>
);

const TableHead: React.FC = () => (
  <thead>
    <tr>
      <th>Estado</th>
      <th>Nombre</th>
      <th>Usuario</th>
      <th>Email</th>
      <th>Rol</th>
      <th>Teléfono</th>
      <th>Último acceso</th>
      <th className="ui-td--actions">Acciones</th>
    </tr>
  </thead>
);

const Row: React.FC<{
  u: User;
  onToggle: (id: User["id"], next: boolean, reason?: string) => void;
  busyId?: User["id"] | null;
  canToggle: (u: User) => boolean;
  isSelf: (u: User) => boolean;
  onEdit?: (u: User) => void;
  onHistory?: (id: User["id"]) => void;
}> = ({ u, onToggle, busyId, canToggle, isSelf, onEdit, onHistory }) => {
  const isBusy = busyId === u.id;
  const allowed = canToggle(u);
  const self = isSelf(u);
  const activeNow = !!u.activo;
  const title = !allowed
    ? u.role === "superadmin"
      ? "No permitido: superadmin"
      : self
      ? "No puedes desactivarte a ti mismo"
      : "Sin permisos"
    : activeNow
    ? "Desactivar"
    : "Activar";

  return (
    <tr>
      <td><StatusBadge active={activeNow} /></td>
      <td>{u.nombre}</td>
      <td>{u.username ?? "—"}</td>
      <td>{u.email}</td>
      <td>{u.role ?? "—"}</td>
      <td>{u.telefono ?? "—"}</td>
      <td>{formatLastAccess(u.last_login)}</td>
      <td className="ui-td--actions">
        <button
          className="ui-btn ui-btn--ghost"
          disabled={isBusy || !allowed}
          onClick={() => {
            if (!allowed) return;
            let reason: string | undefined;
            if (activeNow) {
              reason = window.prompt("Motivo de desactivación (opcional):") ?? undefined;
            }
            onToggle(u.id, !activeNow, reason);
          }}
          title={title}
          aria-disabled={isBusy || !allowed}
        >
          {isBusy ? "…" : activeNow ? "Desactivar" : "Activar"}
        </button>

        <button className="ui-btn ui-btn--ghost" style={{ marginLeft: 8 }} onClick={() => onEdit?.(u)}>
          Editar
        </button>
        <button className="ui-btn ui-btn--ghost" style={{ marginLeft: 8 }} onClick={() => onHistory?.(u.id)}>
          Historial
        </button>
      </td>
    </tr>
  );
};

const Pager: React.FC<{
  page: number;
  pageSize: number;
  count: number;
  onPage: (p: number) => void;
}> = ({ page, pageSize, count, onPage }) => {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  return (
    <div className="ui-pager" role="navigation" aria-label="Paginación">
      <button disabled={page <= 1} onClick={() => onPage(page - 1)} className="ui-btn">Anterior</button>
      <span className="ui-pager__info">Página {page} / {totalPages}</span>
      <button disabled={page >= totalPages} onClick={() => onPage(page + 1)} className="ui-btn">Siguiente</button>
    </div>
  );
};

const UsersPage: React.FC = () => {
  const [rows, setRows] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState<string>("");
  const [activo, setActivo] = useState<boolean | "all">("all");
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(10);
  const [count, setCount] = useState<number>(0);
  const [busyId, setBusyId] = useState<User["id"] | null>(null);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [historyUserId, setHistoryUserId] = useState<string | number | null>(null);

  const perms = useMemo(() => getPerms(), []);
  const meId = useMemo(() => getCurrentUserId(), []);
  const tenantId = useMemo(() => getTenantId(), []);
  const myRole = useMemo(() => getCurrentUserRole(), []);

  const filters = useMemo(
    () => ({ search, activo, page, page_size: pageSize, tenant_id: tenantId ?? undefined }),
    [search, activo, page, pageSize, tenantId]
  );

  const canToggle = useCallback(
    (u: User) => {
      // necesita permiso general
      if (!perms.has("user.toggle")) return false;
      // no puedes desactivar a ti mismo
      if (String(u.id) === String(meId ?? "")) return false;
      // si soy superadmin puedo tocar a cualquiera; en caso contrario no puedo tocar superadmins
      if (myRole === "superadmin") return true;
      return u.role !== "superadmin";
    },
    [perms, meId, myRole]
  );

  const isSelf = useCallback((u: User) => String(u.id) === String(meId ?? ""), [meId]);

  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      const res = await listUsers(filters);
      setRows(res.results);
      setCount(res.count);
    } catch {
      setError("No se pudieron cargar los usuarios.");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  const handleToggle = async (id: User["id"], next: boolean, _reason?: string) => {
    void _reason;
    const target = rows.find((r) => r.id === id);
    if (!target) return;
    if (!canToggle(target)) return;

    setBusyId(id);
    setRows((prev) => prev.map((u) => (u.id === id ? { ...u, activo: next } : u)));

    try {
      await setUserActive(id, next);
    } catch {
      setRows((prev) => prev.map((u) => (u.id === id ? { ...u, activo: !next } : u)));
      alert("No se pudo actualizar el estado del usuario.");
    } finally {
      setBusyId(null);
    }
  };

  const handleUserSaved = useCallback(async () => {
    await fetchData();
    setEditingUser(null);
  }, [fetchData]);

  return (
    <section className="page">
      <h1 className="ui-title">Gestión de usuarios</h1>

      {/* Toolbar + Table */}
      <Toolbar
        search={search}
        onSearch={(v) => { setPage(1); setSearch(v); }}
        activo={activo}
        onActivo={(v) => { setPage(1); setActivo(v); }}
        total={count}
      />

      <div className="card card--data">
        <div className="ui-table-wrap">
          <table className="ui-table" aria-busy={loading}>
            <TableHead />
            <tbody>
              {loading && (
                <tr><td colSpan={8} className="ui-cell--center">Cargando…</td></tr>
              )}
              {!loading && error && (
                <tr><td colSpan={8} className="ui-cell--error">{error}</td></tr>
              )}
              {!loading && !error && rows.length === 0 && (
                <tr><td colSpan={8} className="ui-cell--muted">No hay usuarios para mostrar.</td></tr>
              )}
              {!loading && !error && rows.map((u) => (
                <Row
                  key={String(u.id)}
                  u={u}
                  onToggle={handleToggle}
                  busyId={busyId}
                  canToggle={canToggle}
                  isSelf={isSelf}
                  onEdit={(user) => setEditingUser(user)}
                  onHistory={(id) => setHistoryUserId(id)}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="ui-card-footer">
          <Pager page={page} pageSize={pageSize} count={count} onPage={setPage} />
        </div>
      </div>

      <UserEditModal user={editingUser} onClose={() => setEditingUser(null)} onSaved={handleUserSaved} />
      {historyUserId && <UserHistory userId={historyUserId} onClose={() => setHistoryUserId(null)} />}
    </section>
  );
};

export default UsersPage;
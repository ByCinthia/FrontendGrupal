import React, { useEffect, useState } from "react";
import { RequireAuth } from "../../shared/api/guards";
import { useAuth } from "../auth/service";
import { fetchActivities } from "./service";
import type { ActivityItem, ActivitiesPage } from "./service";

const HistorialActividadesPage: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [data, setData] = useState<ActivitiesPage | null>(null);

  // type-guard para detectar si el objeto user tiene is_staff sin romper AuthUser
  const hasIsStaff = (u: unknown): u is { is_staff?: boolean } =>
    typeof u === "object" && u !== null && "is_staff" in (u as object);

  const isAdmin =
    user?.roles?.includes("admin") ||
    user?.roles?.includes("superadmin") ||
    (hasIsStaff(user) && Boolean(user.is_staff));

  useEffect(() => {
    if (!isAdmin) {
      setLoading(false);
      return;
    }

    let mounted = true;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        // Normalizar empresa_id a number | undefined
        const rawEmpresa = (user as unknown as { empresa_id?: string | number | null })?.empresa_id;
        const companyId =
          rawEmpresa === null || rawEmpresa === undefined
            ? undefined
            : typeof rawEmpresa === "number"
            ? rawEmpresa
            : Number(rawEmpresa) || undefined;

        const res = await fetchActivities(companyId, page, 50);
        if (!mounted) return;
        setData(res);
      } catch (err: unknown) {
        setError((err as Error)?.message || "Error al cargar actividades");
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [page, user, isAdmin]);

  if (!isAdmin) {
    return (
      <RequireAuth redirectTo="/login">
        <div className="ui-card--table card" style={{ padding: 20 }}>
          <h3 className="ui-title">No autorizado</h3>
          <p className="ui-page__description">Solo administradores y superadmins pueden ver el historial de actividades.</p>
        </div>
      </RequireAuth>
    );
  }

  return (
    <RequireAuth>
      <div className="ui-page__header">
        <h2 className="ui-title">Historial de Actividades</h2>
        <p className="ui-page__description">Acciones realizadas por usuarios dentro de la empresa.</p>
      </div>

      <div className="card card--data ui-table__wrap">
        {loading && <div className="ui-cell--muted ui-cell--center">Cargando actividades...</div>}
        {error && <div className="ui-cell--error ui-cell--center">{error}</div>}

        {!loading && !error && (
          <>
            <table className="ui-table" aria-label="Historial de actividades">
              <thead>
                <tr>
                  <th>Fecha / Hora</th>
                  <th>Usuario</th>
                  <th>Tipo</th>
                  <th>Acción</th>
                  <th>Detalles</th>
                </tr>
              </thead>
              <tbody>
                {data?.results?.length ? (
                  data.results.map((it: ActivityItem) => (
                    <tr key={it.id}>
                      <td>{new Date(it.timestamp).toLocaleString()}</td>
                      <td>{it.user}</td>
                      <td>{it.type}</td>
                      <td>{it.action}</td>
                      <td style={{ maxWidth: 420, whiteSpace: "normal" }}>{it.details}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="ui-cell--muted" colSpan={5}>No hay actividades registradas</td>
                  </tr>
                )}
              </tbody>
            </table>

            <div className="ui-card-footer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="ui-meta">Total: {data?.count ?? 0}</div>
              <div>
                <button className="ui-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Anterior</button>
                <span style={{ margin: "0 8px" }}>{page}</span>
                <button className="ui-btn" onClick={() => setPage((p) => p + 1)} disabled={!data?.next}>Siguiente</button>
              </div>
            </div>
          </>
        )}
      </div>
    </RequireAuth>
  );
};

export default HistorialActividadesPage;

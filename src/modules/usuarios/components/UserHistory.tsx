import { useEffect, useState } from "react";
import type { ReactElement } from "react";
import type { UserHistoryEntry } from "../service";
import { getUserHistory } from "../service";

type Props = {
  userId: string | number;
  onClose: () => void;
};

export default function UserHistory({ userId, onClose }: Props): ReactElement | null {
  const [history, setHistory] = useState<UserHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const h = await getUserHistory(userId);
        if (mounted) setHistory(h);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [userId]);

  return (
    <div className="ui-modal" role="dialog" aria-modal="true">
      <div className="ui-modal__content">
        <header className="ui-modal__header">
          <h3>Historial de usuario</h3>
          <button className="ui-btn ui-btn--ghost" onClick={onClose}>×</button>
        </header>
        <div className="ui-modal__body">
          {loading ? <div>Cargando historial…</div> : (
            <ul style={{ listStyle: "none", padding: 0 }}>
              {history.map(h => (
                <li key={h.id} style={{ padding: 8, borderBottom: "1px dashed rgba(148,163,184,.08)" }}>
                  <div style={{ fontWeight: 700 }}>{h.action}</div>
                  <div style={{ color: "#94a3b8", fontSize: 13 }}>{new Date(h.created_at).toLocaleString()}</div>
                  {h.actor && <div style={{ marginTop: 6, fontSize: 13 }}>Por: {h.actor}</div>}
                  {h.data && <pre style={{ marginTop: 8, background: "#071122", padding: 8, borderRadius: 6 }}>{JSON.stringify(h.data, null, 2)}</pre>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
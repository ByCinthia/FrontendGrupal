import React, { useEffect, useState } from "react";
import "../../styles/theme.css";

// Tipos mínimos
type CreditStatus = "SOLICITADO" | "EN_EVALUACION" | "APROBADO" | "RECHAZADO" | "DESEMBOLSADO" | "EN_MORA" | "CANCELADO";
interface Credit {
  id: number;
  codigo: string;
  cliente: string;
  monto: number;
  moneda: string;
  tasa_anual: number;
  plazo_meses: number;
  estado: CreditStatus;
}

// Mock list (reemplazar por service.real)
async function listCreditsMock(): Promise<Credit[]> {
  return [
    { id: 1, codigo: "CR-1001", cliente: "Juan Pérez", monto: 5000, moneda: "BOB", tasa_anual: 12, plazo_meses: 12, estado: "SOLICITADO" },
    { id: 2, codigo: "CR-1002", cliente: "María Gómez", monto: 12000, moneda: "USD", tasa_anual: 10, plazo_meses: 24, estado: "APROBADO" },
  ];
}

const HistorialCreditosPage: React.FC = () => {
  const [rows, setRows] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      try {
        const r = await listCreditsMock();
        setRows(r);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <section className="ui-page">
      <header className="ui-page__header">
        <h1 className="ui-title">Historial de créditos</h1>
        <p className="ui-page__description">Listado y control de solicitudes.</p>
      </header>

      <div className="ui-card ui-card--table">
        <div className="ui-table__wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Código</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Tasa</th>
                <th>Plazo</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="ui-cell--center">Cargando…</td></tr>}
              {!loading && rows.length === 0 && <tr><td colSpan={6} className="ui-cell--muted">Sin resultados</td></tr>}
              {!loading && rows.map((c) => (
                <tr key={c.id}>
                  <td>{c.estado}</td>
                  <td>{c.codigo}</td>
                  <td>{c.cliente}</td>
                  <td>{c.monto} {c.moneda}</td>
                  <td>{c.tasa_anual}%</td>
                  <td>{c.plazo_meses} m</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default HistorialCreditosPage;

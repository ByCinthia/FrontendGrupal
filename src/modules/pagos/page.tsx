import React, { useEffect, useState, useMemo, useCallback } from "react";
import { 
  listPayments, 
  getPaymentSummary, 
  processPayment, 
  getActiveCredits 
 } from "./service";
import type { 
  PaymentWithCredit, 
  PaymentSummary, 
  ListPaymentsParams, 
  PaymentStatus,
  PaymentMethod,
  CreditInfo,
  ProcessPaymentInput
} from "./types";
import "../../styles/dashboard.css";

const ESTADOS: (PaymentStatus | "ALL")[] = [
  "ALL", "PENDIENTE", "PROCESANDO", "COMPLETADO", "FALLIDO", "CANCELADO"
];

const METODOS_PAGO: (PaymentMethod | "ALL")[] = [
  "ALL", "TRANSFERENCIA", "TARJETA_CREDITO", "TARJETA_DEBITO", "EFECTIVO", "BILLETERA_DIGITAL"
];

const fmtMoney = (amount: number, currency = "USD"): string =>
  new Intl.NumberFormat("es-PE", { 
    style: "currency", 
    currency, 
    minimumFractionDigits: 2 
  }).format(amount);

const fmtDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short", 
    day: "numeric"
  });

/* ---------- Componentes UI ---------- */
const StatusBadge: React.FC<{ status: PaymentStatus }> = ({ status }) => {
  const getStatusClass = (s: PaymentStatus): string => {
    switch (s) {
      case "COMPLETADO": return "ui-status ui-status--active";
      case "PENDIENTE": return "ui-status"; 
      case "PROCESANDO": return "ui-status ui-status--warning";
      case "FALLIDO": 
      case "CANCELADO": return "ui-status ui-status--inactive";
      default: return "ui-status";
    }
  };

  const getStatusLabel = (s: PaymentStatus): string => {
    const labels: Record<PaymentStatus, string> = {
      PENDIENTE: "Pendiente",
      PROCESANDO: "Procesando",
      COMPLETADO: "Completado", 
      FALLIDO: "Fallido",
      CANCELADO: "Cancelado",
      REEMBOLSADO: "Reembolsado"
    };
    return labels[s];
  };

  return (
    <span className={getStatusClass(status)}>
      <span className="ui-status__dot" />
      {getStatusLabel(status)}
    </span>
  );
};

const SummaryCards: React.FC<{ summary: PaymentSummary }> = ({ summary }) => (
  <div className="summary-grid">
    <div className="summary-card">
      <div className="summary-card__value">{summary.total_pendientes}</div>
      <div className="summary-card__label">Pagos pendientes</div>
    </div>
    <div className="summary-card">
      <div className="summary-card__value">{summary.total_vencidos}</div>
      <div className="summary-card__label">Pagos vencidos</div>
    </div>
    <div className="summary-card">
      <div className="summary-card__value">{summary.total_en_mora}</div>
      <div className="summary-card__label">En mora</div>
    </div>
    <div className="summary-card">
      <div className="summary-card__value">{fmtMoney(summary.monto_pendiente)}</div>
      <div className="summary-card__label">Monto pendiente</div>
    </div>
    <div className="summary-card">
      <div className="summary-card__value">{fmtMoney(summary.monto_cobrado_mes)}</div>
      <div className="summary-card__label">Cobrado este mes</div>
    </div>
    <div className="summary-card">
      <div className="summary-card__value">{summary.creditos_activos}</div>
      <div className="summary-card__label">Créditos activos</div>
    </div>
  </div>
);

const Toolbar: React.FC<{
  filters: ListPaymentsParams;
  onChange: (filters: Partial<ListPaymentsParams>) => void;
  activeCredits: CreditInfo[];
}> = ({ filters, onChange, activeCredits }) => (
  <div className="ui-toolbar">
    <div className="ui-toolbar__left">
      <input
        className="ui-input"
        placeholder="Buscar por cliente, código o referencia..."
        value={filters.search ?? ""}
        onChange={(e) => onChange({ search: e.target.value, page: 1 })}
      />
      
      <select
        className="ui-select"
        value={filters.estado ?? "ALL"}
        onChange={(e) => onChange({ estado: e.target.value as PaymentStatus | "ALL", page: 1 })}
      >
        {ESTADOS.map(estado => (
          <option key={estado} value={estado}>
            {estado === "ALL" ? "Todos los estados" : estado.replace("_", " ")}
          </option>
        ))}
      </select>

      <select
        className="ui-select"
        value={filters.credito_id ?? "ALL"}
        onChange={(e) => onChange({ credito_id: e.target.value === "ALL" ? undefined : e.target.value, page: 1 })}
      >
        <option value="ALL">Todos los créditos</option>
        {activeCredits.map(credito => (
          <option key={credito.id} value={credito.id}>
            {credito.codigo} - {credito.cliente_nombre}
          </option>
        ))}
      </select>

      <select
        className="ui-select"
        value={filters.metodo_pago ?? "ALL"}
        onChange={(e) => onChange({ metodo_pago: e.target.value as PaymentMethod | "ALL", page: 1 })}
      >
        {METODOS_PAGO.map(metodo => (
          <option key={metodo} value={metodo}>
            {metodo === "ALL" ? "Todos los métodos" : metodo.replace("_", " ")}
          </option>
        ))}
      </select>
    </div>

    <div className="ui-toolbar__right">
      <label className="ui-checkbox">
        <input
          type="checkbox"
          checked={filters.solo_vencidos ?? false}
          onChange={(e) => onChange({ solo_vencidos: e.target.checked, page: 1 })}
        />
        Solo vencidos
      </label>
      
      <label className="ui-checkbox">
        <input
          type="checkbox"
          checked={filters.solo_en_mora ?? false}
          onChange={(e) => onChange({ solo_en_mora: e.target.checked, page: 1 })}
        />
        Solo en mora
      </label>
    </div>
  </div>
);

const PaymentModal: React.FC<{
  payment: PaymentWithCredit | null;
  onClose: () => void;
  onProcess: (input: ProcessPaymentInput) => Promise<void>;
}> = ({ payment, onClose, onProcess }) => {
  const [form, setForm] = useState({
    monto_pagado: payment?.monto_programado ?? 0,
    metodo_pago: "TRANSFERENCIA" as PaymentMethod,
    referencia_transaccion: "",
    observaciones: ""
  });
  const [loading, setLoading] = useState(false);

  if (!payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await onProcess({
        pago_id: payment.id,
        ...form
      });
      onClose();
    } catch  {
      alert("Error al procesar el pago");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ui-modal">
      <div className="ui-modal__content">
        <header className="ui-modal__header">
          <h3>Procesar pago</h3>
          <button className="ui-btn ui-btn--ghost" onClick={onClose}>×</button>
        </header>

        <div className="ui-modal__body">
          <div className="payment-info">
            <p><strong>Cliente:</strong> {payment.credito.cliente_nombre}</p>
            <p><strong>Crédito:</strong> {payment.credito.codigo}</p>
            <p><strong>Cuota:</strong> {payment.numero_cuota} de {payment.credito.cuotas_totales}</p>
            <p><strong>Monto programado:</strong> {fmtMoney(payment.monto_programado, payment.credito.moneda)}</p>
            <p><strong>Vencimiento:</strong> {fmtDate(payment.fecha_vencimiento)}</p>
          </div>

          <form onSubmit={handleSubmit} className="ui-form">
            <div className="ui-form__field">
              <label className="ui-label">Monto pagado</label>
              <input
                className="ui-input"
                type="number"
                step="0.01"
                min="0"
                value={form.monto_pagado}
                onChange={(e) => setForm(prev => ({ ...prev, monto_pagado: Number(e.target.value) }))}
                required
              />
            </div>

            <div className="ui-form__field">
              <label className="ui-label">Método de pago</label>
              <select
                className="ui-select"
                value={form.metodo_pago}
                onChange={(e) => setForm(prev => ({ ...prev, metodo_pago: e.target.value as PaymentMethod }))}
                required
              >
                {METODOS_PAGO.filter(m => m !== "ALL").map(metodo => (
                  <option key={metodo} value={metodo}>
                    {metodo.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>

            <div className="ui-form__field">
              <label className="ui-label">Referencia de transacción</label>
              <input
                className="ui-input"
                value={form.referencia_transaccion}
                onChange={(e) => setForm(prev => ({ ...prev, referencia_transaccion: e.target.value }))}
                placeholder="Número de referencia o voucher"
              />
            </div>

            <div className="ui-form__field">
              <label className="ui-label">Observaciones</label>
              <textarea
                className="ui-textarea"
                value={form.observaciones}
                onChange={(e) => setForm(prev => ({ ...prev, observaciones: e.target.value }))}
                placeholder="Comentarios adicionales..."
                rows={3}
              />
            </div>

            <div className="ui-form__actions">
              <button type="submit" className="ui-btn ui-btn--primary" disabled={loading}>
                {loading ? "Procesando..." : "Procesar pago"}
              </button>
              <button type="button" className="ui-btn ui-btn--ghost" onClick={onClose}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const PaymentRow: React.FC<{
  payment: PaymentWithCredit;
  onProcessPayment: (payment: PaymentWithCredit) => void;
}> = ({ payment, onProcessPayment }) => {
  const isVencido = payment.estado === "PENDIENTE" && new Date(payment.fecha_vencimiento) < new Date();
  const enMora = (payment.mora_dias ?? 0) > 0;

  return (
    <tr className={enMora ? "row-warning" : isVencido ? "row-danger" : ""}>
      <td><StatusBadge status={payment.estado} /></td>
      <td>
        <div className="credit-info">
          <strong>{payment.credito.codigo}</strong>
          <small>{payment.credito.cliente_nombre}</small>
        </div>
      </td>
      <td>{payment.numero_cuota} / {payment.credito.cuotas_totales}</td>
      <td>{fmtMoney(payment.monto_programado, payment.credito.moneda)}</td>
      <td>{fmtDate(payment.fecha_vencimiento)}</td>
      <td>
        {payment.fecha_pago ? fmtDate(payment.fecha_pago) : "—"}
      </td>
      <td>{payment.metodo_pago?.replace("_", " ") ?? "—"}</td>
      <td>
        {enMora && (
          <span className="mora-badge">
            {payment.mora_dias} días de mora
          </span>
        )}
      </td>
      <td className="ui-td--actions">
        {payment.estado === "PENDIENTE" && (
          <button
            className="ui-btn ui-btn--ghost"
            onClick={() => onProcessPayment(payment)}
          >
            Procesar
          </button>
        )}
      </td>
    </tr>
  );
};

const Pager: React.FC<{
  page: number;
  pageSize: number;
  count: number;
  onPage: (page: number) => void;
}> = ({ page, pageSize, count, onPage }) => {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  
  return (
    <div className="ui-pager">
      <button 
        className="ui-btn" 
        disabled={page <= 1} 
        onClick={() => onPage(page - 1)}
      >
        Anterior
      </button>
      <span className="ui-pager__info">
        Página {page} de {totalPages} ({count} registros)
      </span>
      <button 
        className="ui-btn" 
        disabled={page >= totalPages} 
        onClick={() => onPage(page + 1)}
      >
        Siguiente
      </button>
    </div>
  );
};

/* ---------- Componente Principal ---------- */
const PagosPage: React.FC = () => {
  const [payments, setPayments] = useState<PaymentWithCredit[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [activeCredits, setActiveCredits] = useState<CreditInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [search, setSearch] = useState("");
  const [estado, setEstado] = useState<PaymentStatus | "ALL">("ALL");
  const [creditoId, setCreditoId] = useState<string | undefined>();
  const [metodoPago, setMetodoPago] = useState<PaymentMethod | "ALL">("ALL");
  const [soloVencidos, setSoloVencidos] = useState(false);
  const [soloEnMora, setSoloEnMora] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [count, setCount] = useState(0);

  // Modal
  const [selectedPayment, setSelectedPayment] = useState<PaymentWithCredit | null>(null);

  const filters = useMemo(() => ({
    search,
    estado: estado === "ALL" ? undefined : estado,
    credito_id: creditoId,
    metodo_pago: metodoPago === "ALL" ? undefined : metodoPago,
    solo_vencidos: soloVencidos,
    solo_en_mora: soloEnMora,
    page,
    page_size: pageSize
  }), [search, estado, creditoId, metodoPago, soloVencidos, soloEnMora, page, pageSize]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await listPayments(filters);
      setPayments(result.results);
      setCount(result.count);
    } catch {
      setError("Error al cargar los pagos");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    loadSummaryAndCredits();
  }, []);

  const loadSummaryAndCredits = async () => {
    try {
      const [summaryData, creditsData] = await Promise.all([
        getPaymentSummary(),
        getActiveCredits()
      ]);
      setSummary(summaryData);
      setActiveCredits(creditsData);
    } catch {
      // Error no crítico
    }
  };

  const handleFilterChange = (newFilters: Partial<ListPaymentsParams>) => {
    if (newFilters.search !== undefined) setSearch(newFilters.search);
    if (newFilters.estado !== undefined) setEstado(newFilters.estado || "ALL");
    if (newFilters.credito_id !== undefined) setCreditoId(String(newFilters.credito_id));
    if (newFilters.metodo_pago !== undefined) setMetodoPago(newFilters.metodo_pago || "ALL");
    if (newFilters.solo_vencidos !== undefined) setSoloVencidos(newFilters.solo_vencidos);
    if (newFilters.solo_en_mora !== undefined) setSoloEnMora(newFilters.solo_en_mora);
    if (newFilters.page !== undefined) setPage(newFilters.page);
  };

  const handleProcessPayment = async (input: ProcessPaymentInput) => {
    await processPayment(input);
    await loadData();
    await loadSummaryAndCredits();
  };

  return (
    <section className="ui-page">
      <header className="ui-page__header">
        <h1 className="ui-page__title">Gestión de Pagos</h1>
        <p className="ui-page__description">
          Administre los pagos de cuotas de todos los créditos activos
        </p>
      </header>

      {summary && <SummaryCards summary={summary} />}

      <Toolbar 
        filters={filters}
        onChange={handleFilterChange}
        activeCredits={activeCredits}
      />

      {error && (
        <div className="ui-alert ui-alert--danger">
          {error}
        </div>
      )}

      <div className="ui-card ui-card--table">
        <div className="ui-table__wrap">
          <table className="ui-table">
            <thead>
              <tr>
                <th>Estado</th>
                <th>Crédito / Cliente</th>
                <th>Cuota</th>
                <th>Monto</th>
                <th>Vencimiento</th>
                <th>Fecha pago</th>
                <th>Método</th>
                <th>Mora</th>
                <th className="ui-td--actions">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={9} className="ui-cell--center">
                    Cargando pagos...
                  </td>
                </tr>
              )}
              
              {!loading && !error && payments.length === 0 && (
                <tr>
                  <td colSpan={9} className="ui-cell--muted">
                    No se encontraron pagos con los filtros aplicados.
                  </td>
                </tr>
              )}

              {!loading && !error && payments.map(payment => (
                <PaymentRow
                  key={payment.id}
                  payment={payment}
                  onProcessPayment={setSelectedPayment}
                />
              ))}
            </tbody>
          </table>
        </div>

        <div className="ui-card__footer">
          <Pager 
            page={page}
            pageSize={pageSize}
            count={count}
            onPage={setPage}
          />
        </div>
      </div>

      <PaymentModal
        payment={selectedPayment}
        onClose={() => setSelectedPayment(null)}
        onProcess={handleProcessPayment}
      />
    </section>
  );
};

export default PagosPage;
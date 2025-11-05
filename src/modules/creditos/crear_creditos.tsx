import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/theme.css";
import type { Cliente } from "../clientes/types";

// Tipos mínimos locales
type Moneda = "USD" | "EUR" | "PEN" | "CLP" | "ARS" | "BOB";
interface CreateCreditInput {
  cliente_id: string;
  producto: string;
  moneda: Moneda;
  monto: number;
  tasa_anual: number;
  plazo_meses: number;
  frecuencia: string;
  sistema: string;
}

// Mock/Placeholder para listado de clientes (reemplazar por service real)
async function listClientsMock(): Promise<Cliente[]> {
  return [
    { id: 1, nombre: "Juan", apellido: "Pérez" },
    { id: 2, nombre: "María", apellido: "Gómez" },
  ];
}

// Placeholder createCredit (reemplazar por llamada real)
async function createCreditMock(payload: CreateCreditInput) {
  await new Promise((r) => setTimeout(r, 800));
  return { id: Math.floor(Math.random() * 10000), ...payload };
}

const MONEDAS: Moneda[] = ["USD", "EUR", "PEN", "CLP", "ARS", "BOB"];

const CrearCreditoPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<CreateCreditInput>({
    cliente_id: "",
    producto: "",
    moneda: MONEDAS[0],
    monto: 1000,
    tasa_anual: 12,
    plazo_meses: 12,
    frecuencia: "MENSUAL",
    sistema: "FRANCES",
  });

  useEffect(() => {
    void (async () => {
      setLoadingClientes(true);
      try {
        const c = await listClientsMock();
        setClientes(c);
        if (c.length > 0) setForm((p) => ({ ...p, cliente_id: String(c[0].id) }));
      } catch {
        setError("No se pudieron cargar clientes");
      } finally {
        setLoadingClientes(false);
      }
    })();
  }, []);

  // Tipado estricto: clave y valor coherente con CreateCreditInput
  const handleChange = <K extends keyof CreateCreditInput>(k: K, v: CreateCreditInput[K]) => {
    setForm((p) => ({ ...p, [k]: v } as CreateCreditInput));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.cliente_id || !form.producto || form.monto <= 0) {
      setError("Complete los campos obligatorios");
      return;
    }
    setLoading(true);
    try {
      const created = await createCreditMock(form);
      setSuccess(`Crédito creado (ID: ${created.id})`);
      setTimeout(() => navigate("/app/creditos/historial"), 1200);
    } catch {
      setError("Error creando crédito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ui-page">
      <header className="ui-page__header">
        <h1 className="ui-title">Nueva solicitud de crédito</h1>
        <p className="ui-page__description">Complete los datos para solicitar el crédito.</p>
      </header>

      {error && <div className="ui-alert ui-alert--danger">{error}</div>}
      {success && <div className="ui-alert ui-alert--success">{success}</div>}

      <div className="ui-card">
        <form className="ui-form" onSubmit={onSubmit}>
          <div className="ui-form__section">
            <label className="ui-label">Cliente</label>
            <select
              className="ui-select"
              value={form.cliente_id}
              onChange={(e) => handleChange("cliente_id", e.target.value)}
              disabled={loadingClientes}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nombre}{c.apellido ? ` ${c.apellido}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="ui-form__section">
            <label className="ui-label">Producto *</label>
            <input
              className="ui-input"
              value={form.producto}
              onChange={(e) => handleChange("producto", e.target.value)}
              required
            />
          </div>

          <div className="ui-form__row">
            <div className="ui-form__field">
              <label className="ui-label">Moneda</label>
              <select
                className="ui-select"
                value={form.moneda}
                onChange={(e) => handleChange("moneda", e.target.value as Moneda)}
              >
                {MONEDAS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="ui-form__field">
              <label className="ui-label">Monto</label>
              <input
                className="ui-input"
                type="number"
                value={form.monto}
                onChange={(e) => handleChange("monto", Number(e.target.value))}
              />
            </div>
          </div>

          <div className="ui-form__actions">
            <button className="ui-btn ui-btn--primary" type="submit" disabled={loading}>
              {loading ? "Creando..." : "Crear solicitud"}
            </button>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => navigate("/app/creditos")}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CrearCreditoPage;

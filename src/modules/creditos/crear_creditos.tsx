import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/theme.css";
// Usar las funciones del propio servicio de creditos (listClients está en creditos/service)
import { listClients, listCreditTypes, createCredit, type CreateCreditInput } from "./service";
// Importar tipos del módulo de creditos (evita any)
import type { Client, CreditType, Moneda } from "./types";

const CrearCreditoPage: React.FC = () => {
  const navigate = useNavigate();
  const [clientes, setClientes] = useState<Client[]>([]);
  const [tipos, setTipos] = useState<CreditType[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMeta, setLoadingMeta] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [form, setForm] = useState<CreateCreditInput>({
    cliente_id: "",
    producto: "",
    moneda: "BOB",
    monto: 1000,
    tasa_anual: 12,
    plazo_meses: 12,
    frecuencia: "MENSUAL",
    sistema: "FRANCES"
  });

  useEffect(() => {
    void (async () => {
      try {
        setLoadingMeta(true);
        // listClients y listCreditTypes devuelven Client[] y CreditType[] respectivamente
        const [c, tt] = await Promise.all([listClients(), listCreditTypes()]);
        setClientes(c);
        setTipos(tt);
        if (c.length > 0) setForm(prev => ({ ...prev, cliente_id: String(c[0].id) }));
      } catch {
        setError("No se pudieron cargar datos previos");
      } finally {
        setLoadingMeta(false);
      }
    })();
  }, []);

  const handleChange = <K extends keyof CreateCreditInput>(k: K, v: CreateCreditInput[K]) => {
    setForm(p => ({ ...p, [k]: v } as CreateCreditInput));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); setSuccess(null);
    if (!form.cliente_id || !form.producto || form.monto <= 0) { setError("Complete los campos obligatorios"); return; }
    setLoading(true);
    try {
      await createCredit(form);
      setSuccess("Crédito creado");
      setTimeout(() => navigate("/app/creditos"), 900);
    } catch {
      setError("Error creando crédito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ui-page">
      <div className="ui-card">
        <h2 className="ui-card__title">Crear crédito</h2>
        {error && <div className="ui-alert ui-alert--error">{error}</div>}
        {success && <div className="ui-alert ui-alert--success">{success}</div>}
        <form className="ui-form" onSubmit={onSubmit}>
          <div className="ui-form__group">
            <label className="ui-label">Cliente</label>
            <select className="ui-select" value={String(form.cliente_id)} onChange={e => handleChange("cliente_id", e.target.value)}>
              <option value="">Seleccionar cliente…</option>
              {clientes.map(c => <option key={String(c.id)} value={String(c.id)}>{c.nombre} {c.apellido ?? ""}</option>)}
            </select>
          </div>

          <div className="ui-form__group">
            <label className="ui-label">Tipo de crédito</label>
            <select className="ui-select" onChange={e => handleChange("producto", e.target.value)} value={form.producto}>
              <option value="">Seleccionar tipo…</option>
              {tipos.map(t => <option key={String(t.id)} value={String(t.nombre)}>{t.nombre}</option>)}
            </select>
          </div>

          {/* Campos básicos */}
          <div className="ui-form__row">
            <div className="ui-form__field">
              <label className="ui-label">Moneda</label>
              <select className="ui-select" value={form.moneda} onChange={e => handleChange("moneda", e.target.value as Moneda)}>
                <option>BOB</option><option>USD</option><option>EUR</option>
              </select>
            </div>

            <div className="ui-form__field">
              <label className="ui-label">Monto</label>
              <input className="ui-input" type="number" value={form.monto} onChange={e => handleChange("monto", Number(e.target.value))} />
            </div>

            <div className="ui-form__field">
              <label className="ui-label">Plazo (meses)</label>
              <input className="ui-input" type="number" value={form.plazo_meses} onChange={e => handleChange("plazo_meses", Number(e.target.value))} />
            </div>
          </div>

          <div className="ui-form__actions">
            <button className="ui-btn ui-btn--primary" type="submit" disabled={loading || loadingMeta}>{loading ? "Creando..." : "Crear crédito"}</button>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => navigate("/app/creditos")}>Cancelar</button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CrearCreditoPage;

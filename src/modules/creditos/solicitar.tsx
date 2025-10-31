import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCredit, listClients, listCreditTypes } from "./service";
import type { CreateCreditInput } from "./service"; // importar desde service.ts
import type { Client, CreditType, Moneda, Frecuencia, SistemaAmortizacion } from "./types";
import "../../styles/dashboard.css";

const MONEDAS: Moneda[] = ["USD", "EUR", "PEN", "CLP", "ARS"];
const FRECUENCIAS: Frecuencia[] = ["MENSUAL", "QUINCENAL", "SEMANAL"];
const SISTEMAS: SistemaAmortizacion[] = ["FRANCES", "ALEMAN", "AMERICANO"];

export default function SolicitarCredito(): React.JSX.Element {
  const navigate = useNavigate();
  
  const [clientes, setClientes] = useState<Client[]>([]);
  const [tipos, setTipos] = useState<CreditType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estado del formulario
  const [form, setForm] = useState<CreateCreditInput>({
    cliente_id: "",
    producto: "",
    moneda: "USD",
    monto: 10000,
    tasa_anual: 12,
    plazo_meses: 12,
    frecuencia: "MENSUAL",
    sistema: "FRANCES"
  });

  // Nuevo cliente (si no existe)
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre: "",
    apellido: "",
    documento: "",
    email: "",
    telefono: ""
  });
  const [mostrarFormCliente, setMostrarFormCliente] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [clientesData, tiposData] = await Promise.all([
          listClients(),
          listCreditTypes()
        ]);
        setClientes(clientesData);
        setTipos(tiposData);
        
        // Auto-seleccionar primer tipo si existe
        if (tiposData.length > 0) {
          const primerTipo = tiposData[0];
          setForm((prev: CreateCreditInput) => ({
            ...prev,
            producto: primerTipo.nombre,
            tasa_anual: primerTipo.tasa_interes_anual,
            plazo_meses: primerTipo.plazo_meses
          }));
        }
      } catch {
        setError("Error al cargar datos iniciales");
      }
    })();
  }, []);

  const handleFormChange = (field: keyof CreateCreditInput, value: string | number) => {
    setForm((prev: CreateCreditInput) => ({ ...prev, [field]: value }));
  };

  const handleTipoChange = (tipoId: string) => {
    const tipo = tipos.find(t => t.id.toString() === tipoId);
    if (tipo) {
      setForm((prev: CreateCreditInput) => ({
        ...prev,
        producto: tipo.nombre,
        tasa_anual: tipo.tasa_interes_anual,
        plazo_meses: tipo.plazo_meses
      }));
    }
  };

  const crearNuevoCliente = async () => {
    if (!nuevoCliente.nombre.trim() || !nuevoCliente.documento.trim()) {
      setError("Nombre y documento son obligatorios");
      return;
    }

    try {
      const { createClient } = await import("./service");
      const clienteCreado = await createClient({
        nombre: nuevoCliente.nombre,
        apellido: nuevoCliente.apellido,
        documento: nuevoCliente.documento,
        email: nuevoCliente.email || null,
        telefono: nuevoCliente.telefono || null
      });
      
      setClientes((prev: Client[]) => [...prev, clienteCreado]);
      setForm((prev: CreateCreditInput) => ({ ...prev, cliente_id: clienteCreado.id }));
      setMostrarFormCliente(false);
      setNuevoCliente({ nombre: "", apellido: "", documento: "", email: "", telefono: "" });
      setSuccess("Cliente creado exitosamente");
    } catch {
      setError("Error al crear cliente");
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!form.cliente_id || !form.producto || form.monto <= 0) {
      setError("Complete todos los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      const credito = await createCredit(form);
      setSuccess(`Solicitud de crédito creada exitosamente. Código: ${credito.codigo}`);
      setTimeout(() => navigate("/app/creditos"), 2000);
    } catch {
      setError("Error al crear la solicitud de crédito");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ui-page">
      <header className="ui-page__header">
        <h1 className="ui-title">Nueva solicitud de crédito</h1>
        <p className="ui-page__description">
          Complete el formulario para crear una nueva solicitud que iniciará en estado "SOLICITADO"
        </p>
      </header>

      {error && (
        <div className="ui-alert ui-alert--danger" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {success && (
        <div className="ui-alert ui-alert--success" style={{ marginBottom: 16 }}>
          {success}
        </div>
      )}

      <div className="ui-card">
        <form onSubmit={onSubmit} className="ui-form">
          {/* Sección Cliente */}
          <div className="ui-form__section">
            <h3 className="ui-form__section-title">Cliente</h3>
            
            <div className="ui-form__row">
              <div className="ui-form__field">
                <label className="ui-label">Cliente existente</label>
                <select 
                  className="ui-select"
                  value={form.cliente_id}
                  onChange={(e) => handleFormChange("cliente_id", e.target.value)}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.apellido} - {cliente.documento}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="ui-form__field">
                <button 
                  type="button" 
                  className="ui-btn ui-btn--ghost"
                  onClick={() => setMostrarFormCliente(!mostrarFormCliente)}
                >
                  {mostrarFormCliente ? "Cancelar" : "Nuevo cliente"}
                </button>
              </div>
            </div>

            {mostrarFormCliente && (
              <div className="ui-form__subsection">
                <div className="ui-form__row">
                  <div className="ui-form__field">
                    <label className="ui-label">Nombre *</label>
                    <input 
                      className="ui-input"
                      value={nuevoCliente.nombre}
                      onChange={(e) => setNuevoCliente(prev => ({ ...prev, nombre: e.target.value }))}
                      placeholder="Nombre del cliente"
                    />
                  </div>
                  
                  <div className="ui-form__field">
                    <label className="ui-label">Apellido</label>
                    <input 
                      className="ui-input"
                      value={nuevoCliente.apellido}
                      onChange={(e) => setNuevoCliente(prev => ({ ...prev, apellido: e.target.value }))}
                      placeholder="Apellido del cliente"
                    />
                  </div>
                </div>

                <div className="ui-form__row">
                  <div className="ui-form__field">
                    <label className="ui-label">Documento *</label>
                    <input 
                      className="ui-input"
                      value={nuevoCliente.documento}
                      onChange={(e) => setNuevoCliente(prev => ({ ...prev, documento: e.target.value }))}
                      placeholder="DNI, RUC, etc."
                    />
                  </div>
                  
                  <div className="ui-form__field">
                    <label className="ui-label">Email</label>
                    <input 
                      className="ui-input"
                      type="email"
                      value={nuevoCliente.email}
                      onChange={(e) => setNuevoCliente(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="email@ejemplo.com"
                    />
                  </div>
                  
                  <div className="ui-form__field">
                    <label className="ui-label">Teléfono</label>
                    <input 
                      className="ui-input"
                      value={nuevoCliente.telefono}
                      onChange={(e) => setNuevoCliente(prev => ({ ...prev, telefono: e.target.value }))}
                      placeholder="+51 999 999 999"
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  className="ui-btn ui-btn--primary"
                  onClick={crearNuevoCliente}
                >
                  Crear cliente
                </button>
              </div>
            )}
          </div>

          {/* Sección Producto */}
          <div className="ui-form__section">
            <h3 className="ui-form__section-title">Producto crediticio</h3>
            
            <div className="ui-form__row">
              <div className="ui-form__field">
                <label className="ui-label">Tipo de crédito</label>
                <select 
                  className="ui-select"
                  onChange={(e) => handleTipoChange(e.target.value)}
                >
                  <option value="">Seleccionar tipo...</option>
                  {tipos.map(tipo => (
                    <option key={tipo.id} value={tipo.id}>
                      {tipo.nombre} - {tipo.tasa_interes_anual}% ({tipo.plazo_meses} meses)
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="ui-form__field">
                <label className="ui-label">Producto</label>
                <input 
                  className="ui-input"
                  value={form.producto}
                  onChange={(e) => handleFormChange("producto", e.target.value)}
                  placeholder="Nombre del producto"
                />
              </div>
            </div>
          </div>

          {/* Sección Condiciones */}
          <div className="ui-form__section">
            <h3 className="ui-form__section-title">Condiciones del crédito</h3>
            
            <div className="ui-form__row">
              <div className="ui-form__field">
                <label className="ui-label">Moneda</label>
                <select 
                  className="ui-select"
                  value={form.moneda}
                  onChange={(e) => handleFormChange("moneda", e.target.value)}
                >
                  {MONEDAS.map(moneda => (
                    <option key={moneda} value={moneda}>{moneda}</option>
                  ))}
                </select>
              </div>
              
              <div className="ui-form__field">
                <label className="ui-label">Monto solicitado</label>
                <input 
                  className="ui-input"
                  type="number"
                  min="1"
                  step="0.01"
                  value={form.monto}
                  onChange={(e) => handleFormChange("monto", Number(e.target.value))}
                />
              </div>
              
              <div className="ui-form__field">
                <label className="ui-label">Tasa anual (%)</label>
                <input 
                  className="ui-input"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.tasa_anual}
                  onChange={(e) => handleFormChange("tasa_anual", Number(e.target.value))}
                />
              </div>
            </div>

            <div className="ui-form__row">
              <div className="ui-form__field">
                <label className="ui-label">Plazo (meses)</label>
                <input 
                  className="ui-input"
                  type="number"
                  min="1"
                  value={form.plazo_meses}
                  onChange={(e) => handleFormChange("plazo_meses", Number(e.target.value))}
                />
              </div>
              
              <div className="ui-form__field">
                <label className="ui-label">Frecuencia de pago</label>
                <select 
                  className="ui-select"
                  value={form.frecuencia}
                  onChange={(e) => handleFormChange("frecuencia", e.target.value)}
                >
                  {FRECUENCIAS.map(freq => (
                    <option key={freq} value={freq}>{freq}</option>
                  ))}
                </select>
              </div>
              
              <div className="ui-form__field">
                <label className="ui-label">Sistema de amortización</label>
                <select 
                  className="ui-select"
                  value={form.sistema}
                  onChange={(e) => handleFormChange("sistema", e.target.value)}
                >
                  {SISTEMAS.map(sistema => (
                    <option key={sistema} value={sistema}>{sistema}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="ui-form__actions">
            <button 
              type="submit" 
              className="ui-btn ui-btn--primary"
              disabled={loading}
            >
              {loading ? "Creando solicitud..." : "Crear solicitud"}
            </button>
            
            <button 
              type="button" 
              className="ui-btn ui-btn--ghost"
              onClick={() => navigate("/app/creditos")}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
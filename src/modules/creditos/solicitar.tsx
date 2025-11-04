import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCredit } from "./service";
import type { CreateCreditInput } from "./service";
import type { Moneda } from "./types";
import { listClients } from "./clients/service";
import type { Cliente } from "./clients/types";
import "../../styles/dashboard.css";

const MONEDAS: Moneda[] = ["USD", "EUR", "PEN", "CLP", "ARS", "BOB"];
const FRECUENCIAS = ["MENSUAL", "QUINCENAL", "SEMANAL"];
const SISTEMAS = ["FRANCES", "ALEMAN", "AMERICANO"];

// Clientes (para seleccionar al solicitar)
const SolicitarCreditoForm: React.FC = () => {
  const navigate = useNavigate();
  
  // Estados para clientes
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loadingClientes, setLoadingClientes] = useState(true);
  const [clientesError, setClientesError] = useState<string | null>(null);

  // Estados del formulario principal
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Estado del formulario
  const [form, setForm] = useState<CreateCreditInput>({
    cliente_id: "",
    producto: "",
    moneda: "BOB",
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
      setLoadingClientes(true);
      setClientesError(null);
      
      try {
        const list = await listClients();
        setClientes(list);
        
        // Auto-seleccionar el primer cliente si existe
        if (list.length > 0) {
          setForm(prev => ({ ...prev, cliente_id: String(list[0].id) }));
        }
      } catch (err) {
        setClientesError((err as Error).message);
      } finally {
        setLoadingClientes(false);
      }
    })();
  }, []);

  const handleFormChange = (field: keyof CreateCreditInput, value: string | number) => {
    setForm((prev: CreateCreditInput) => ({ ...prev, [field]: value }));
  };

  const crearNuevoCliente = async () => {
    if (!nuevoCliente.nombre.trim() || !nuevoCliente.documento.trim()) {
      setError("Nombre y documento son obligatorios");
      return;
    }

    setLoading(true);
    try {
      // Simulación de crear cliente (ajustar según tu API)
      const clienteCreado: Cliente = {
        id: Date.now(), // ID temporal
        nombre: nuevoCliente.nombre,
        apellido: nuevoCliente.apellido,
        ci: nuevoCliente.documento,
        telefono: nuevoCliente.telefono,
        fecha_registro: new Date().toISOString()
      };
      
      setClientes((prev: Cliente[]) => [...prev, clienteCreado]);
      setForm((prev: CreateCreditInput) => ({ ...prev, cliente_id: String(clienteCreado.id) }));
      setMostrarFormCliente(false);
      setNuevoCliente({ nombre: "", apellido: "", documento: "", email: "", telefono: "" });
      setSuccess("Cliente creado exitosamente");
    } catch {
      setError("Error al crear cliente");
    } finally {
      setLoading(false);
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
      setSuccess(`Solicitud de crédito creada exitosamente. ID: ${credito.id || 'N/A'}`);
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
        <div className="ui-alert ui-alert--danger" style={{ marginBottom: "16px" }}>
          {error}
        </div>
      )}

      {success && (
        <div className="ui-alert ui-alert--success" style={{ marginBottom: "16px" }}>
          {success}
        </div>
      )}

      {/* Mostrar estado de carga de clientes */}
      {loadingClientes && (
        <div className="ui-alert ui-alert--info" style={{ marginBottom: "16px" }}>
          Cargando clientes...
        </div>
      )}

      {clientesError && (
        <div className="ui-alert ui-alert--warning" style={{ marginBottom: "16px" }}>
          Error al cargar clientes: {clientesError}
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
                  disabled={loadingClientes}
                >
                  <option value="">Seleccionar cliente...</option>
                  {clientes.map(cliente => (
                    <option key={cliente.id} value={cliente.id}>
                      {cliente.nombre} {cliente.apellido ? ` ${cliente.apellido}` : ""} - {cliente.ci || 'Sin CI'}
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
                      placeholder="CI, RUC, etc."
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
                      placeholder="+591 999 999 999"
                    />
                  </div>
                </div>

                <button 
                  type="button" 
                  className="ui-btn ui-btn--primary"
                  onClick={crearNuevoCliente}
                  disabled={loading}
                >
                  {loading ? "Creando..." : "Crear cliente"}
                </button>
              </div>
            )}
          </div>

          {/* Sección Producto */}
          <div className="ui-form__section">
            <h3 className="ui-form__section-title">Producto crediticio</h3>
            
            <div className="ui-form__row">
              <div className="ui-form__field">
                <label className="ui-label">Producto *</label>
                <input 
                  className="ui-input"
                  value={form.producto}
                  onChange={(e) => handleFormChange("producto", e.target.value)}
                  placeholder="Nombre del producto (ej: Crédito Personal)"
                  required
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

          {/* Simulación de cuota */}
          {form.monto > 0 && form.plazo_meses > 0 && form.tasa_anual > 0 && (
            <div className="ui-form__section">
              <h3 className="ui-form__section-title">Simulación</h3>
              <div style={{ 
                padding: "16px", 
                backgroundColor: "#f8fafc", 
                borderRadius: "8px",
                border: "1px solid #e2e8f0"
              }}>
                <div className="ui-form__row">
                  <div className="ui-form__field">
                    <strong>Cuota estimada:</strong><br />
                    <span style={{ color: "#3ab5ff", fontSize: "18px" }}>
                      {form.moneda} {(form.monto * (form.tasa_anual / 100 / 12) * Math.pow(1 + (form.tasa_anual / 100 / 12), form.plazo_meses) / (Math.pow(1 + (form.tasa_anual / 100 / 12), form.plazo_meses) - 1)).toFixed(2)}
                    </span>
                  </div>
                  <div className="ui-form__field">
                    <strong>Total a pagar:</strong><br />
                    <span style={{ color: "#374151", fontSize: "18px" }}>
                      {form.moneda} {(form.monto * (1 + (form.tasa_anual / 100 * form.plazo_meses / 12))).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Botones de acción */}
          <div className="ui-form__actions">
            <button 
              type="submit" 
              className="ui-btn ui-btn--primary"
              disabled={loading || !form.cliente_id || !form.producto}
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
};

export default SolicitarCreditoForm;
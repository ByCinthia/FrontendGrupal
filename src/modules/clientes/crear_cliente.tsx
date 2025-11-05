import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createCliente, validateCliente } from "./service";
import type { CreateClienteInput } from "./types";
import "../../styles/theme.css";

const CrearClientePage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<CreateClienteInput>({
    nombre: "",
    apellido: "",
    telefono: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [successMessage, setSuccessMessage] = useState("");

  const handleChange = (field: keyof CreateClienteInput, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Limpiar errores al empezar a escribir
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors([]);
    setSuccessMessage("");

    try {
      // Validaciones cliente-side
      const validationErrors = validateCliente(form);
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        setLoading(false);
        return;
      }

      // Llamar al servicio
      const nuevoCliente = await createCliente(form);
      console.log("Cliente creado:", nuevoCliente);
      
      setSuccessMessage("Cliente creado exitosamente");
      
      // Redirigir después de 1.5 segundos
      setTimeout(() => {
        navigate("/app/clientes");
      }, 1500);
      
    } catch (err) {
      console.error("Error creando cliente:", err);
      setErrors(["Error al crear el cliente. Intente nuevamente."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ui-page">
      <div className="ui-card">
        <div style={{ marginBottom: 24 }}>
          <h2 className="ui-card__title">Crear nuevo cliente</h2>
          <p className="ui-card__description">
            Complete la información básica del cliente
          </p>
        </div>

        {/* Mensajes de error */}
        {errors.length > 0 && (
          <div className="ui-alert ui-alert--error" style={{ marginBottom: 16 }}>
            <ul style={{ margin: 0, paddingLeft: 16 }}>
              {errors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Mensaje de éxito */}
        {successMessage && (
          <div className="ui-alert ui-alert--success" style={{ marginBottom: 16 }}>
            {successMessage}
          </div>
        )}

        <form className="ui-form" onSubmit={onSubmit}>
          <div className="ui-form__row">
            <div className="ui-form__group">
              <label className="ui-label" htmlFor="nombre">
                Nombre <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                id="nombre"
                className="ui-input"
                type="text"
                value={form.nombre}
                onChange={e => handleChange("nombre", e.target.value)}
                placeholder="Ingrese el nombre"
                required
              />
            </div>

            <div className="ui-form__group">
              <label className="ui-label" htmlFor="apellido">
                Apellido <span style={{ color: "var(--danger)" }}>*</span>
              </label>
              <input
                id="apellido"
                className="ui-input"
                type="text"
                value={form.apellido}
                onChange={e => handleChange("apellido", e.target.value)}
                placeholder="Ingrese el apellido"
                required
              />
            </div>
          </div>

          <div className="ui-form__group">
            <label className="ui-label" htmlFor="telefono">
              Teléfono <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <input
              id="telefono"
              className="ui-input"
              type="tel"
              value={form.telefono}
              onChange={e => handleChange("telefono", e.target.value)}
              placeholder="Ej: +591 70123456"
              required
            />
          </div>

          <div className="ui-form__actions" style={{ marginTop: 24 }}>
            <button 
              className="ui-btn ui-btn--primary" 
              type="submit" 
              disabled={loading}
            >
              {loading ? "Creando..." : "Crear Cliente"}
            </button>
            <button 
              type="button" 
              className="ui-btn ui-btn--ghost" 
              onClick={() => navigate("/app/clientes")}
              disabled={loading}
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CrearClientePage;
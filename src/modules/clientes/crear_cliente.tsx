import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/theme.css";

/* Tipo local mínimo */
type ClientInput = {
  nombre: string;
  apellido?: string;
  email: string;
  telefono?: string;
};

const CrearClientePage: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<ClientInput>({ nombre: "", apellido: "", email: "", telefono: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (k: keyof ClientInput, v: string) => setForm(p => ({ ...p, [k]: v }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // TODO: reemplazar por createClient service
      console.log("Crear cliente:", form);
      // simulación: volver al listado
      navigate("/app/clientes");
    } catch (err) {
      console.error("Error creando cliente:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="ui-page">
      <div className="ui-card">
        <h2 className="ui-card__title">Crear cliente</h2>

        <form className="ui-form" onSubmit={onSubmit}>
          <div className="ui-form__group">
            <label className="ui-label">Nombre</label>
            <input className="ui-input" value={form.nombre} onChange={e => handleChange("nombre", e.target.value)} />
          </div>

          <div className="ui-form__group">
            <label className="ui-label">Apellido</label>
            <input className="ui-input" value={form.apellido} onChange={e => handleChange("apellido", e.target.value)} />
          </div>

          <div className="ui-form__group">
            <label className="ui-label">Email</label>
            <input className="ui-input" value={form.email} onChange={e => handleChange("email", e.target.value)} />
          </div>

          <div className="ui-form__group">
            <label className="ui-label">Teléfono</label>
            <input className="ui-input" value={form.telefono} onChange={e => handleChange("telefono", e.target.value)} />
          </div>

          <div className="ui-form__actions" style={{ marginTop: 12 }}>
            <button className="ui-btn ui-btn--primary" type="submit" disabled={loading}>{loading ? "Creando..." : "Crear"}</button>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={() => navigate("/app/clientes")}>Cancelar</button>
          </div>
        </form>
      </div>
    </section>
  );
};

export default CrearClientePage;
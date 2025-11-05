import React from "react";
import { Outlet } from "react-router-dom";
import "../../styles/theme.css";

/**
 * Página principal del módulo Créditos.
 * Simple contenedor de rutas hijas:
 *  - /app/creditos        -> historial (Ver créditos)
 *  - /app/creditos/crear  -> crear crédito
 *  - /app/creditos/tipos  -> tipos de crédito
 */
const CreditsPage: React.FC = () => {
  return (
    // añadir clase de módulo para control de estilos (evita glow/blanco)
    <section className="ui-page module-page module-creditos">
      <header className="ui-page__header">
        <h1 className="ui-page__title">Créditos</h1>
        <p className="ui-page__description">Solicitudes y seguimiento de créditos</p>
      </header>

      <div className="ui-tab-content">
        <Outlet />
      </div>
    </section>
  );
};

export default CreditsPage;
import React from "react";
import { Outlet } from "react-router-dom";
import "../../styles/theme.css";

/**
 * Módulo Clientes - contenedor de rutas hijas:
 *  - /app/clientes       -> historial (ver clientes)
 *  - /app/clientes/crear -> crear cliente
 */
const ClientesPage: React.FC = () => {
  return (
    <section className="ui-page module-page module-clientes">
      <header className="ui-page__header">
        <h1 className="ui-page__title">Clientes</h1>
        <p className="ui-page__description">Listado y creación de clientes</p>
      </header>

      <div className="ui-tab-content">
        <Outlet />
      </div>
    </section>
  );
};

export default ClientesPage;
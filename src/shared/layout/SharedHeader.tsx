import React from "react";
import { useAuth } from "../../modules/auth/service";
import "../../styles/unified-app.css";

const getInitials = (name?: string | null) => {
  if (!name) return "";
  return name
    .split(" ")
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
};

const SharedHeader: React.FC = () => {
  const { user } = useAuth();
  const companyName = user?.empresa_nombre ?? (typeof window !== "undefined" ? localStorage.getItem("ui.company.name") : null) ?? "Mi Empresa";
  const companyLogo = user?.imagen_url_empresa ?? (typeof window !== "undefined" ? localStorage.getItem("ui.company.logo") : null);

  return (
    <header className="shared-header" role="banner" aria-label="Cabecera de la aplicación">
      <div className="shared-header__inner">
        <div className="shared-header__left">
          <div className="company-name" title={companyName}>
            {companyName}
          </div>
        </div>

        <div className="shared-header__right" aria-hidden>
          {companyLogo ? (
            <img src={companyLogo} alt={companyName} className="company-avatar" />
          ) : (
            <div className="company-avatar company-avatar--placeholder">
              <span className="company-initials">{getInitials(companyName)}</span>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default SharedHeader;
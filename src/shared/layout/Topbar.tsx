import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/service";
import "./topbar.css";

type StoredUser = {
  nombre_completo?: string;
  email?: string;
  username?: string;
  imagen_url_empresa?: string;
};

const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth.me") || localStorage.getItem("auth");
      const storedLogo = localStorage.getItem("ui.company.logo");
      if (raw) {
        const parsed = JSON.parse(raw);
        const u = parsed?.user ? parsed.user : parsed;
        setUser(u ?? null);
        // Priorizar logo guardado en localStorage, si no intentar leer de la sesión
        setCompanyLogo(storedLogo || (u?.imagen_url_empresa ?? null));
      } else {
        setUser(null);
        setCompanyLogo(storedLogo ?? null);
      }
    } catch {
      setUser(null);
      setCompanyLogo(localStorage.getItem("ui.company.logo") ?? null);
    }
  }, []);

  const { logout } = useAuth();
  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      await logout();
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("logout error:", e);
    } finally {
      setLoading(false);
      navigate("/");
    }
  }, [logout, navigate]);

  const displayName = user?.nombre_completo ?? user?.username ?? user?.email ?? "Invitado";

  return (
    <header className="topbar">
      <div className="topbar-left" />

      <div className="topbar-right">
        <div className="topbar-user">
          <div className="topbar-user__text">
            <span className="topbar-name">{displayName}</span>
            <span className="topbar-email">{user?.email ?? ""}</span>
          </div>
        </div>

        {companyLogo ? (
          <img src={companyLogo} alt="Logo empresa" className="topbar-company-logo" />
        ) : (
          <div className="topbar-company-placeholder" aria-hidden>
            {/* opcional: letras iniciales o icono */}
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
              <rect width="24" height="24" rx="6" fill="#0f172a" />
              <path d="M6 12h12" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
        )}

        <button
          className="ui-btn ui-btn--ghost topbar-logout"
          onClick={handleLogout}
          disabled={loading}
          title="Cerrar sesión"
          aria-busy={loading}
        >
          {loading ? "Cerrando..." : "Cerrar sesión"}
        </button>
      </div>
    </header>
  );
};

export default Topbar;
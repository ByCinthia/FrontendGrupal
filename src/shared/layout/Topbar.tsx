import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../modules/auth/service";

type StoredUser = {
  nombre_completo?: string;
  email?: string;
  username?: string;
};

const Topbar: React.FC = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<StoredUser | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("auth.me") || localStorage.getItem("auth");
      if (raw) {
        const parsed = JSON.parse(raw);
        const u = parsed?.user ? parsed.user : parsed;
        setUser(u ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    }
  }, []);

  const { logout } = useAuth();
  const handleLogout = useCallback(async () => {
    setLoading(true);
    try {
      await logout(); // usa el contexto para asegurarse de limpiar estado y localStorage
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn("logout error:", e);
    } finally {
      setLoading(false);
      navigate("/"); // redirigir al landing/login
    }
  }, [logout, navigate]);

  const displayName = user?.nombre_completo ?? user?.username ?? user?.email ?? "Invitado";

  return (
    <header className="topbar">
      {/* IZQUIERDA: espacio/brand (vacío para empujar contenido a la derecha) */}
      <div className="topbar-left" />

      {/* DERECHA: usuario + email y botón de logout juntos en el extremo derecho */}
      <div className="topbar-right">
        <div className="topbar-user">
          <span className="topbar-name">{displayName}</span>
          <span className="topbar-email">{user?.email ?? ""}</span>
        </div>

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
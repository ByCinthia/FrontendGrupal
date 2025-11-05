import React, { useState, useEffect } from 'react';
import { useAuth } from '../../modules/auth/service';
import { useLocation } from 'react-router-dom';
import './topbar.css';

interface TopbarProps {
  pageTitle?: string;
  showSearch?: boolean;
  showNotifications?: boolean;
}

// Tipos extendidos para evitar usar 'any'
interface ExtendedUser {
  id?: number;
  username?: string;
  roles?: string[];
  permissions?: string[];
  first_name?: string;
  last_name?: string;
  imagen_url_perfil?: string;
  empresa?: {
    razon_social?: string;
    imagen_url_empresa?: string;
  };
}

export const Topbar: React.FC<TopbarProps> = ({ 
  pageTitle, 
  showSearch = false, 
  showNotifications = true 
}) => {
  const { user } = useAuth();
  const location = useLocation();
  
  // Estados para datos de empresa
  const [companyData, setCompanyData] = useState({
    name: '',
    logo: '',
    subtitle: 'Dashboard'
  });

  useEffect(() => {
    // Cargar datos de empresa desde localStorage o user
    const extendedUser = user as ExtendedUser;
    const companyName = localStorage.getItem("ui.company.name") || 
                       localStorage.getItem("ui.companyName") || 
                       extendedUser?.empresa?.razon_social || 
                       "Mi Empresa";
    
    const companyLogo = localStorage.getItem("ui.company.logo") || 
                       extendedUser?.empresa?.imagen_url_empresa || 
                       "";
    
    setCompanyData({
      name: companyName,
      logo: companyLogo,
      subtitle: getSubtitleFromPath(location.pathname)
    });
  }, [user, location.pathname]);

  const getSubtitleFromPath = (pathname: string): string => {
    const pathMap: Record<string, string> = {
      '/app': 'Panel Principal',
      '/app/usuarios': 'Gestión de Usuarios',
      '/app/empresas': 'Gestión de Empresas',
      '/app/reportes': 'Análisis y Reportes',
      '/app/pagos': 'Gestión de Pagos',
      '/app/creditos': 'Gestión de Créditos',
      '/app/ingresos': 'Dashboard Financiero',
      '/app/personalizacion': 'Personalización',
      '/app/auditoria': 'Auditoría del Sistema',
      '/app/actividades': 'Historial de Actividades',
      '/app/backup': 'Respaldo de Datos'
    };
    
    return pathMap[pathname] || 'Sistema de Gestión';
  };

  const getCurrentPageTitle = (): string => {
    if (pageTitle) return pageTitle;
    
    const pathTitles: Record<string, string> = {
      '/app': 'Dashboard',
      '/app/usuarios': 'Usuarios',
      '/app/empresas': 'Empresas',
      '/app/reportes': 'Reportes',
      '/app/pagos': 'Pagos',
      '/app/creditos': 'Créditos',
      '/app/ingresos': 'Ingresos',
      '/app/personalizacion': 'Personalización',
      '/app/auditoria': 'Auditoría',
      '/app/actividades': 'Actividades',
      '/app/backup': 'Backup'
    };
    
    return pathTitles[location.pathname] || 'Panel';
  };

  return (
    <header className="topbar">
      {/* Logo y nombre de empresa */}
      <div className="topbar__company">
        <div className="topbar__logo topbar__interactive">
          {companyData.logo ? (
            <img src={companyData.logo} alt={companyData.name} />
          ) : (
            companyData.name.charAt(0)
          )}
        </div>
        <div className="topbar__company-info">
          <h1 className="topbar__company-name">{companyData.name}</h1>
          <p className="topbar__company-subtitle">{companyData.subtitle}</p>
        </div>
      </div>

      {/* Centro - Título de página o search */}
      <div className="topbar__center">
        {showSearch ? (
          <div className="topbar__search">
            <span className="topbar__search-icon">🔍</span>
            <input 
              type="text" 
              placeholder="Buscar usuarios, reportes..." 
            />
          </div>
        ) : (
          <h2 className="topbar__page-title">{getCurrentPageTitle()}</h2>
        )}
      </div>

      {/* Acciones del lado derecho */}
      <div className="topbar__actions">
        {/* Status del sistema */}
        <div className="topbar__status">
          <span className="topbar__status-dot"></span>
          Online
        </div>

        {/* Notificaciones */}
        {showNotifications && (
          <button className="topbar__notification topbar__interactive">
            🔔
            <span className="topbar__notification-badge"></span>
          </button>
        )}

        {/* Usuario removido completamente */}
      </div>

      {/* Efecto de brillo sutil */}
      <div className="topbar__glow"></div>
    </header>
  );
};

export default Topbar;
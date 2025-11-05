import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/service';
import "../../styles/usuarios.css";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: string;
  path?: string;
  externalUrl?: string;
  bgColor: string;
  type: 'internal' | 'external' | 'django-admin';
}

interface UserStats {
  totalUsers: number;
  activeUsers: number;
  totalGroups: number;
  adminUsers: number;
}

export default function GestionUsuariosRoles() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<UserStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalGroups: 0,
    adminUsers: 0
  });

  // Verificar permisos
  useEffect(() => {
    const isAdmin = user?.roles?.includes("admin");
    const isSuperAdmin = user?.roles?.includes("superadmin");
    
    if (!isAdmin && !isSuperAdmin) {
      navigate("/app");
      return;
    }
    
    // Simular carga de estadísticas
    setTimeout(() => {
      setStats({
        totalUsers: 24,
        activeUsers: 21,
        totalGroups: 5,
        adminUsers: 3
      });
      setLoading(false);
    }, 1000);
  }, [user, navigate]);

  const quickActions: QuickAction[] = [
    {
      id: 'create-user',
      title: 'Crear Usuario',
      description: 'Crear nuevo usuario con roles y permisos personalizados',
      icon: '👤',
      path: '/app/crear-usuario',
      bgColor: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      type: 'internal'
    },
    {
      id: 'create-group',
      title: 'Crear Grupo/Rol',
      description: 'Crear nuevos grupos de usuarios con permisos específicos',
      icon: '👥',
      path: '/app/crear-grupo',
      bgColor: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      type: 'internal'
    },
    {
      id: 'django-users',
      title: 'Django Admin - Usuarios',
      description: 'Panel nativo de Django para gestión avanzada de usuarios',
      icon: '🔧',
      externalUrl: 'http://127.0.0.1:8000/admin/auth/user/',
      bgColor: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      type: 'django-admin'
    },
    {
      id: 'django-groups',
      title: 'Django Admin - Grupos',
      description: 'Panel nativo de Django para gestión avanzada de grupos',
      icon: '⚙️',
      externalUrl: 'http://127.0.0.1:8000/admin/auth/group/',
      bgColor: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      type: 'django-admin'
    },
    {
      id: 'django-permissions',
      title: 'Django Admin - Permisos',
      description: 'Panel nativo de Django para gestión de permisos del sistema',
      icon: '🔐',
      externalUrl: 'http://127.0.0.1:8000/admin/auth/permission/',
      bgColor: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      type: 'django-admin'
    },
    {
      id: 'user-list',
      title: 'Listar Usuarios',
      description: 'Ver y gestionar todos los usuarios del sistema',
      icon: '📋',
      path: '/app/usuarios',
      bgColor: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      type: 'internal'
    }
  ];

  const handleActionClick = (action: QuickAction) => {
    if (action.type === 'django-admin' && action.externalUrl) {
      // Abrir en nueva pestaña
      window.open(action.externalUrl, '_blank', 'noopener,noreferrer');
    }
    // Para internal, el Link se encarga de la navegación
  };

  if (loading) {
    return (
      <div className="page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando gestión de usuarios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="gestion-usuarios-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-header__content">
          <h1 className="page-title">
            <span className="page-icon">👥</span>
            Gestión de Usuarios y Roles
          </h1>
          <p className="page-subtitle">
            Panel centralizado para administrar usuarios, grupos, roles y permisos del sistema
          </p>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="stats-grid">
        <div className="stat-card stat-card--primary">
          <div className="stat-icon">👥</div>
          <div className="stat-content">
            <span className="stat-number">{stats.totalUsers}</span>
            <span className="stat-label">Total Usuarios</span>
          </div>
        </div>
        
        <div className="stat-card stat-card--success">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <span className="stat-number">{stats.activeUsers}</span>
            <span className="stat-label">Usuarios Activos</span>
          </div>
        </div>
        
        <div className="stat-card stat-card--info">
          <div className="stat-icon">🏷️</div>
          <div className="stat-content">
            <span className="stat-number">{stats.totalGroups}</span>
            <span className="stat-label">Grupos/Roles</span>
          </div>
        </div>
        
        <div className="stat-card stat-card--warning">
          <div className="stat-icon">🔑</div>
          <div className="stat-content">
            <span className="stat-number">{stats.adminUsers}</span>
            <span className="stat-label">Administradores</span>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="quick-actions-section">
        <div className="section-header">
          <h2 className="section-title">🚀 Acciones Rápidas</h2>
          <p className="section-subtitle">
            Herramientas para gestionar usuarios, roles y permisos
          </p>
        </div>

        <div className="quick-actions-grid">
          {quickActions.map((action) => (
            <div key={action.id} className="quick-action-card">
              {action.type === 'internal' && action.path ? (
                <Link to={action.path} className="quick-action-link">
                  <div 
                    className="quick-action-content"
                    style={{ background: action.bgColor }}
                  >
                    <div className="quick-action-icon">{action.icon}</div>
                    <div className="quick-action-text">
                      <h3 className="quick-action-title">{action.title}</h3>
                      <p className="quick-action-description">{action.description}</p>
                    </div>
                    <div className="quick-action-arrow">→</div>
                  </div>
                </Link>
              ) : (
                <button 
                  className="quick-action-link quick-action-external"
                  onClick={() => handleActionClick(action)}
                >
                  <div 
                    className="quick-action-content"
                    style={{ background: action.bgColor }}
                  >
                    <div className="quick-action-icon">{action.icon}</div>
                    <div className="quick-action-text">
                      <h3 className="quick-action-title">{action.title}</h3>
                      <p className="quick-action-description">{action.description}</p>
                    </div>
                    <div className="quick-action-arrow">↗</div>
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Información de Django Admin */}
      <div className="django-admin-info">
        <div className="django-admin-card">
          <div className="django-admin-header">
            <h3>🔧 Panel Nativo de Django</h3>
            <span className="django-admin-badge">Avanzado</span>
          </div>
          <div className="django-admin-content">
            <p>
              El panel de administración nativo de Django ofrece herramientas avanzadas para:
            </p>
            <ul className="django-admin-features">
              <li>✅ Gestión masiva de usuarios</li>
              <li>✅ Configuración avanzada de permisos</li>
              <li>✅ Historial de cambios detallado</li>
              <li>✅ Filtros y búsquedas complejas</li>
              <li>✅ Importación/exportación de datos</li>
            </ul>
            <div className="django-admin-actions">
              <button 
                className="btn btn--primary"
                onClick={() => window.open('http://127.0.0.1:8000/admin/', '_blank')}
              >
                🌐 Abrir Django Admin Principal
              </button>
              <button 
                className="btn btn--outline"
                onClick={() => window.open('http://127.0.0.1:8000/admin/auth/', '_blank')}
              >
                👥 Ir a Autenticación
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
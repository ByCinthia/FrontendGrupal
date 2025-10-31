// src/modules/personalizacion/personalizacion.tsx
import React, { useState, useEffect, useCallback } from "react";
import { http } from "../../shared/api/client";
import { useAuth } from "../auth/service";
import "../../styles/dashboard.css";
import "../../styles/config.css"; // ← Importar las nuevas clases CSS

interface PersonalizationSettings {
  id?: number | string;
  company_id?: number | string | null; // <-- allow null to match API fallback

  // Apariencia
  theme: "light" | "dark" | "color";
  enun_tema: "claro" | "oscuro" | "color";
  theme_type: "standard" | "ketra" | "corporate" | "modern";
  accent_color: string;
  font_size: "small" | "medium" | "large" | "xlarge";
  sidebar_position: "left" | "right";
  
  // Idioma y región
  language: string;
  timezone: string;
  date_format: string;
  currency: string;
  
  // Funcionalidades
  notifications_enabled: boolean;
  email_notifications: boolean;
  dashboard_widgets: string[];
  quick_actions: string[];
  
  // Empresa
  company_logo: string;
  company_name: string;
}

const AVAILABLE_COLORS = [
  { name: "Azul", value: "#3b82f6", scheme: "blue" },
  { name: "Verde", value: "#10b981", scheme: "green" },
  { name: "Naranja", value: "#f59e0b", scheme: "orange" },
  { name: "Rojo", value: "#ef4444", scheme: "red" },
  { name: "Morado", value: "#8b5cf6", scheme: "purple" },
  { name: "Cian", value: "#06b6d4", scheme: "cyan" },
  { name: "Rosa", value: "#ec4899", scheme: "pink" },
  { name: "Gris", value: "#6b7280", scheme: "gray" },
  { name: "Índigo", value: "#6366f1", scheme: "indigo" },
  { name: "Verde Lima", value: "#84cc16", scheme: "lime" },
  { name: "Amarillo", value: "#eab308", scheme: "yellow" },
  { name: "Teal", value: "#14b8a6", scheme: "teal" },
];

const THEME_TYPES = [
  { value: "standard", name: "Estándar", description: "Diseño limpio y profesional", icon: "📐" },
  { value: "ketra", name: "Ketra", description: "Diseño curvo y suave", icon: "🌊" },
  { value: "corporate", name: "Corporativo", description: "Diseño serio y angular", icon: "🏢" },
  { value: "modern", name: "Moderno", description: "Diseño futurista", icon: "🚀" },
];

const LANGUAGES = [
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
];

const TIMEZONES = [
  { value: "America/La_Paz", label: "La Paz (UTC-4)" },
  { value: "America/Santiago", label: "Santiago (UTC-3)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (UTC-3)" },
  { value: "America/Sao_Paulo", label: "São Paulo (UTC-3)" },
  { value: "UTC", label: "UTC (UTC+0)" },
];

const PersonalizacionPage: React.FC = () => {
  const { user, getCompanyScope } = useAuth();
  const companyId = getCompanyScope();

  const [settings, setSettings] = useState<PersonalizationSettings>({
    theme: "dark",
    enun_tema: "oscuro",
    theme_type: "standard",
    accent_color: "#3b82f6",
    font_size: "medium",
    sidebar_position: "left",
    language: "es",
    timezone: "America/La_Paz",
    date_format: "DD/MM/YYYY",
    currency: "BOB",
    notifications_enabled: true,
    email_notifications: true,
    dashboard_widgets: ["stats", "recent_activities", "pending_approvals"],
    quick_actions: ["new_credit", "new_payment", "search_client"],
    company_logo: "",
    company_name: user?.empresa_nombre || "Mi Empresa"
  });

  const [logoPreview, setLogoPreview] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" | "" }>({
    text: "",
    type: "",
  });

  // Función para aplicar tema usando las clases CSS
  const applyTheme = useCallback((newSettings: PersonalizationSettings) => {
    const root = document.documentElement;
    const body = document.body;
    
    console.log("🎨 Aplicando tema:", newSettings);
    
    // Agregar clase de transición suave
    body.classList.add('theme-transition');
    
    // Limpiar clases previas de tema
    const classesToRemove = Array.from(root.classList).filter(cls => 
      cls.startsWith('theme-') || 
      cls.startsWith('color-scheme-') || 
      cls.startsWith('font-size-') || 
      cls.startsWith('sidebar-')
    );
    root.classList.remove(...classesToRemove);
    
    // Aplicar atributo de tema principal
    root.setAttribute('data-theme', newSettings.theme);
    
    // Mapear enun_tema a theme si es diferente
    let effectiveTheme = newSettings.theme;
    if (newSettings.enun_tema === "claro") effectiveTheme = "light";
    if (newSettings.enun_tema === "oscuro") effectiveTheme = "dark";
    if (newSettings.enun_tema === "color") effectiveTheme = "color";
    
    // Aplicar clases CSS
    root.classList.add(`theme-${effectiveTheme}`);
    root.classList.add(`theme-type-${newSettings.theme_type}`);
    root.classList.add(`font-size-${newSettings.font_size}`);
    root.classList.add(`sidebar-${newSettings.sidebar_position}`);
    
    // Aplicar esquema de color
    const colorScheme = AVAILABLE_COLORS.find(c => c.value === newSettings.accent_color)?.scheme || 'blue';
    root.classList.add(`color-scheme-${colorScheme}`);
    
    // Aplicar variables CSS personalizadas
    root.style.setProperty('--accent-primary', newSettings.accent_color);
    root.style.setProperty('--company-logo-url', newSettings.company_logo ? `url(${newSettings.company_logo})` : 'none');
    
    // Calcular color secundario (más oscuro)
    const rgb = hexToRgb(newSettings.accent_color);
    if (rgb) {
      const darkerRgb = {
        r: Math.max(0, rgb.r - 30),
        g: Math.max(0, rgb.g - 30),
        b: Math.max(0, rgb.b - 30)
      };
      const darkerHex = rgbToHex(darkerRgb.r, darkerRgb.g, darkerRgb.b);
      root.style.setProperty('--accent-secondary', darkerHex);
      root.style.setProperty('--accent-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
      root.style.setProperty('--accent-secondary-rgb', `${darkerRgb.r}, ${darkerRgb.g}, ${darkerRgb.b}`);
    }
    
    // Guardar en localStorage para persistencia
    const storageData = {
      theme: effectiveTheme,
      theme_type: newSettings.theme_type,
      accent_color: newSettings.accent_color,
      font_size: newSettings.font_size,
      sidebar_position: newSettings.sidebar_position,
      company_logo: newSettings.company_logo,
      company_name: newSettings.company_name,
    };
    
    // Guardar individualmente para compatibilidad
    Object.entries(storageData).forEach(([key, value]) => {
      localStorage.setItem(`ui.${key}`, String(value));
    });
    
    // Guardar configuración completa por empresa
    const storageKey = companyId ? `personalization_settings_${companyId}` : 'personalization_settings_global';
    localStorage.setItem(storageKey, JSON.stringify(newSettings));
    
    // Disparar evento personalizado
    window.dispatchEvent(new CustomEvent('personalization-updated', { 
      detail: newSettings 
    }));
    
    // Remover clase de transición después de la animación
    setTimeout(() => {
      body.classList.remove('theme-transition');
    }, 300);
    
    console.log("✅ Tema aplicado correctamente");
  }, [companyId]);

  // Cargar configuración al montar
  useEffect(() => {
    const loadSettings = async () => {
      console.log("📂 Cargando configuración para empresa:", companyId);
      
      if (!companyId && !user?.roles?.includes("superadmin")) {
        console.log("⚠️ Sin empresa ID y sin permisos de superadmin");
        applyTheme(settings);
        return;
      }
      
      try {
        // Intentar cargar desde API
        const response = await http.get(`/api/configuracion/?company_id=${companyId || ''}`);
        const apiSettings = Array.isArray(response.data) ? response.data[0] : response.data;
        
        if (apiSettings) {
          console.log("✅ Configuración cargada desde API:", apiSettings);
          const newSettings = { ...settings, ...apiSettings, company_id: companyId };
          setSettings(newSettings);
          setLogoPreview(apiSettings.company_logo || "");
          applyTheme(newSettings);
          return;
        }
      } catch (error) {
        console.warn("⚠️ Error cargando desde API, usando localStorage:", error);
      }
      
      // Fallback a localStorage
      try {
        const storageKey = companyId ? `personalization_settings_${companyId}` : 'personalization_settings_global';
        const saved = localStorage.getItem(storageKey);
        
        if (saved) {
          const parsed = JSON.parse(saved);
          console.log("✅ Configuración cargada desde localStorage:", parsed);
          const newSettings = { ...settings, ...parsed, company_id: companyId };
          setSettings(newSettings);
          setLogoPreview(parsed.company_logo || "");
          applyTheme(newSettings);
        } else {
          console.log("📋 Usando configuración por defecto");
          applyTheme(settings);
        }
      } catch (error) {
        console.error("❌ Error cargando configuración:", error);
        applyTheme(settings);
      }
    };

    loadSettings();
  }, [companyId, user, applyTheme, settings]);

  const handleSettingChange = <K extends keyof PersonalizationSettings>(
    key: K, 
    value: PersonalizationSettings[K]
  ) => {
    console.log(`🔧 Cambiando ${key}:`, value);
    const newSettings = { ...settings, [key]: value };
    
    // Sincronizar theme y enun_tema
    if (key === "enun_tema") {
      if (value === "claro") newSettings.theme = "light";
      if (value === "oscuro") newSettings.theme = "dark";
      if (value === "color") newSettings.theme = "color";
    }
    if (key === "theme") {
      if (value === "light") newSettings.enun_tema = "claro";
      if (value === "dark") newSettings.enun_tema = "oscuro";
      if (value === "color") newSettings.enun_tema = "color";
    }
    
    setSettings(newSettings);
    applyTheme(newSettings);
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        setMessage({ text: "El archivo es muy grande. Máximo 2MB.", type: "error" });
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setLogoPreview(result);
        handleSettingChange("company_logo", result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveSettings = async () => {
    setIsSaving(true);
    
    try {
      const payload = {
        ...settings,
        company_id: companyId,
      };

      let response;
      if (settings.id) {
        response = await http.put(`/api/configuracion/${settings.id}/`, payload);
      } else {
        response = await http.post(`/api/configuracion/`, payload);
      }

      const saved = response.data;
      const newSettings = { ...settings, ...saved, id: saved.id };
      setSettings(newSettings);

      // Guardar también en localStorage
      const storageKey = companyId ? `personalization_settings_${companyId}` : 'personalization_settings_global';
      localStorage.setItem(storageKey, JSON.stringify(newSettings));

      setMessage({ text: "✅ Configuración guardada exitosamente", type: "success" });
      
      // Efecto visual de éxito
      document.body.classList.add('config-success');
      setTimeout(() => document.body.classList.remove('config-success'), 500);

    } catch (error) {
      console.error("Error guardando configuración:", error);
      
      // Fallback a localStorage
      try {
        const storageKey = companyId ? `personalization_settings_${companyId}` : 'personalization_settings_global';
        const fallbackSettings = { ...settings, id: settings.id || Date.now(), company_id: companyId };
        localStorage.setItem(storageKey, JSON.stringify(fallbackSettings));
        setSettings(fallbackSettings);
        setMessage({ text: "⚠️ Configuración guardada localmente (sin conexión)", type: "success" });
      } catch {
        setMessage({ text: "❌ Error guardando la configuración", type: "error" });
      }
    } finally {
      setIsSaving(false);
      setTimeout(() => setMessage({ text: "", type: "" }), 3000);
    }
  };

  const resetSettings = () => {
    if (confirm("¿Está seguro de que desea restablecer toda la configuración?")) {
      const defaultSettings: PersonalizationSettings = {
        theme: "dark",
        enun_tema: "oscuro",
        theme_type: "standard",
        accent_color: "#3b82f6",
        font_size: "medium",
        sidebar_position: "left",
        language: "es",
        timezone: "America/La_Paz",
        date_format: "DD/MM/YYYY",
        currency: "BOB",
        notifications_enabled: true,
        email_notifications: true,
        dashboard_widgets: ["stats", "recent_activities", "pending_approvals"],
        quick_actions: ["new_credit", "new_payment", "search_client"],
        company_logo: "",
        company_name: user?.empresa_nombre || "Mi Empresa"
      };
      
      setSettings(defaultSettings);
      setLogoPreview("");
      applyTheme(defaultSettings);
      
      // Limpiar localStorage
      const storageKey = companyId ? `personalization_settings_${companyId}` : 'personalization_settings_global';
      localStorage.removeItem(storageKey);
      
      setMessage({ text: "🔄 Configuración restablecida", type: "success" });
    }
  };

  return (
    <div className="personalization-page">
      <section className="page">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h1 className="ui-title">🎨 Personalización</h1>
            <p className="ui-page__description">
              {user?.roles?.includes("superadmin") 
                ? "Configurar la apariencia global del sistema"
                : `Personalizar la experiencia de ${user?.empresa_nombre || 'tu empresa'}`
              }
            </p>
          </div>
          <div className="config-actions">
            <button 
              onClick={resetSettings} 
              className="ui-btn ui-btn--ghost"
              disabled={isSaving}
            >
              🔄 Restablecer
            </button>
            <button 
              onClick={saveSettings} 
              className={`ui-btn ui-btn--primary ${isSaving ? 'config-saving' : ''}`}
              disabled={isSaving}
            >
              {isSaving ? "💾 Guardando..." : "💾 Guardar Cambios"}
            </button>
          </div>
        </div>

        {message.text && (
          <div className={`ui-alert ui-alert--${message.type === 'error' ? 'danger' : 'success'}`} style={{ marginBottom: "24px" }}>
            {message.text}
          </div>
        )}

        <div className="config-grid">
          
          {/* Tema Principal */}
          <div className="config-section">
            <h3 className="config-section__title">🌙 Tema Principal</h3>
            <div className="config-options">
              {[  
                { value: "claro", label: "☀️ Claro", desc: "Tema luminoso para trabajar de día" },
                { value: "oscuro", label: "🌙 Oscuro", desc: "Tema suave para trabajar de noche" },
                { value: "color", label: "🌈 Modo Color", desc: "Tema vibrante con gradientes" }
              ].map((theme) => (  // ← Cambiar } por ]
                <div 
                  key={theme.value}
                  className={`config-option ${settings.enun_tema === theme.value ? 'config-option--active' : ''}`}
                  onClick={() => handleSettingChange("enun_tema", theme.value as PersonalizationSettings["enun_tema"])}
                >
                  <input
                    type="radio"
                    name="enun_tema"
                    value={theme.value}
                    checked={settings.enun_tema === theme.value}
                    onChange={() => {}}
                  />
                  <div>
                    <div className="config-option__label">{theme.label}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {theme.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tipo de Tema */}
          <div className="config-section">
            <h3 className="config-section__title">🎭 Tipo de Diseño</h3>
            <div className="config-options">
              {THEME_TYPES.map((type) => (
                <div 
                  key={type.value}
                  className={`config-option ${settings.theme_type === type.value ? 'config-option--active' : ''}`}
                  onClick={() => handleSettingChange("theme_type", type.value as PersonalizationSettings["theme_type"])}
                >
                  <input
                    type="radio"
                    name="theme_type"
                    value={type.value}
                    checked={settings.theme_type === type.value}
                    onChange={() => {}}
                  />
                  <div>
                    <div className="config-option__label">{type.icon} {type.name}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {type.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Colores */}
          <div className="config-section">
            <h3 className="config-section__title">🎨 Color de Acento</h3>
            <div className="config-colors">
              {AVAILABLE_COLORS.map((color) => (
                <div
                  key={color.value}
                  className={`config-color ${settings.accent_color === color.value ? 'config-color--active' : ''}`}
                  style={{ backgroundColor: color.value }}
                  onClick={() => handleSettingChange("accent_color", color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {/* Tipografía */}
          <div className="config-section">
            <h3 className="config-section__title">📝 Tipografía</h3>
            <div className="config-options">
              {[  // ← Cambiar {{ por [
                { value: "small", label: "Pequeño (14px)", desc: "Más contenido en pantalla" },
                { value: "medium", label: "Mediano (16px)", desc: "Tamaño estándar recomendado" },
                { value: "large", label: "Grande (18px)", desc: "Fácil lectura" },
                { value: "xlarge", label: "Extra Grande (20px)", desc: "Máxima legibilidad" },
              ].map((size) => (  // ← Cambiar } por ]
                <div 
                  key={size.value}
                  className={`config-option ${settings.font_size === size.value ? 'config-option--active' : ''}`}
                  onClick={() => handleSettingChange("font_size", size.value as PersonalizationSettings["font_size"])}
                >
                  <input
                    type="radio"
                    name="font_size"
                    value={size.value}
                    checked={settings.font_size === size.value}
                    onChange={() => {}}
                  />
                  <div>
                    <div className="config-option__label">{size.label}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      {size.desc}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Layout */}
          <div className="config-section">
            <h3 className="config-section__title">📐 Layout</h3>
            <div className="config-options">
              <div 
                className={`config-option ${settings.sidebar_position === 'left' ? 'config-option--active' : ''}`}
                onClick={() => handleSettingChange("sidebar_position", "left")}
              >
                <input
                  type="radio"
                  name="sidebar_position"
                  value="left"
                  checked={settings.sidebar_position === "left"}
                  onChange={() => {}}
                />
                <div>
                  <div className="config-option__label">🔲 Sidebar Izquierda</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Navegación al lado izquierdo
                  </div>
                </div>
              </div>
              <div 
                className={`config-option ${settings.sidebar_position === 'right' ? 'config-option--active' : ''}`}
                onClick={() => handleSettingChange("sidebar_position", "right")}
              >
                <input
                  type="radio"
                  name="sidebar_position"
                  value="right"
                  checked={settings.sidebar_position === "right"}
                  onChange={() => {}}
                />
                <div>
                  <div className="config-option__label">🔳 Sidebar Derecha</div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                    Navegación al lado derecho
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Logo de Empresa */}
          <div className="config-section">
            <h3 className="config-section__title">🏢 Logo de la Empresa</h3>
            <div className="config-logo-upload">
              <div className="config-logo-preview">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" />
                ) : (
                  <div className="config-logo-placeholder">🏢</div>
                )}
              </div>
              <div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  style={{ display: "none" }}
                  id="logo-upload"
                />
                <label htmlFor="logo-upload" className="ui-btn ui-btn--ghost">
                  📁 Seleccionar Logo
                </label>
                {logoPreview && (
                  <button 
                    onClick={() => {
                      setLogoPreview("");
                      handleSettingChange("company_logo", "");
                    }}
                    className="ui-btn ui-btn--ghost"
                    style={{ marginTop: "8px", display: "block" }}
                  >
                    🗑️ Quitar Logo
                  </button>
                )}
                <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "8px" }}>
                  Formatos: JPG, PNG, SVG. Máximo 2MB.
                </div>
              </div>
            </div>
          </div>

          {/* Empresa */}
          <div className="config-section">
            <h3 className="config-section__title">🏢 Información de la Empresa</h3>
            <div className="form-group">
              <label>Nombre de la Empresa</label>
              <input
                type="text"
                value={settings.company_name}
                onChange={(e) => handleSettingChange("company_name", e.target.value)}
                placeholder="Mi Empresa"
                className="ui-input"
              />
            </div>
          </div>

          {/* Idioma y Región */}
          <div className="config-section">
            <h3 className="config-section__title">🌍 Idioma y Región</h3>
            
            <div className="form-group">
              <label>Idioma</label>
              <select
                value={settings.language}
                onChange={(e) => handleSettingChange("language", e.target.value)}
                className="ui-select"
              >
                {LANGUAGES.map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Zona Horaria</label>
              <select
                value={settings.timezone}
                onChange={(e) => handleSettingChange("timezone", e.target.value)}
                className="ui-select"
              >
                {TIMEZONES.map(tz => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Formato de Fecha</label>
              <select
                value={settings.date_format}
                onChange={(e) => handleSettingChange("date_format", e.target.value)}
                className="ui-select"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>

            <div className="form-group">
              <label>Moneda</label>
              <select
                value={settings.currency}
                onChange={(e) => handleSettingChange("currency", e.target.value)}
                className="ui-select"
              >
                <option value="BOB">💰 BOB - Boliviano</option>
                <option value="USD">💵 USD - Dólar</option>
                <option value="EUR">💶 EUR - Euro</option>
                <option value="BRL">💴 BRL - Real</option>
                <option value="ARS">💷 ARS - Peso Argentino</option>
                <option value="CLP">💸 CLP - Peso Chileno</option>
              </select>
            </div>
          </div>

          {/* Notificaciones */}
          <div className="config-section">
            <h3 className="config-section__title">🔔 Notificaciones</h3>
            <div className="config-options">
              <div className="config-toggle">
                <input
                  type="checkbox"
                  id="notifications"
                  checked={settings.notifications_enabled}
                  onChange={(e) => handleSettingChange("notifications_enabled", e.target.checked)}
                />
                <div className="config-toggle__slider"></div>
                <label htmlFor="notifications" className="config-toggle__label">
                  Notificaciones del navegador
                </label>
              </div>
              
              <div className="config-toggle">
                <input
                  type="checkbox"
                  id="email-notifications"
                  checked={settings.email_notifications}
                  onChange={(e) => handleSettingChange("email_notifications", e.target.checked)}
                />
                <div className="config-toggle__slider"></div>
                <label htmlFor="email-notifications" className="config-toggle__label">
                  Notificaciones por email
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Vista Previa */}
        <div className="config-preview">
          <h3 className="config-preview__title">👁️ Vista Previa</h3>
          <div className="config-preview__content">
            <div className="config-preview__demo-card">
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                {logoPreview ? (
                  <img 
                    src={logoPreview} 
                    alt="Logo" 
                    style={{ 
                      width: "32px", 
                      height: "32px", 
                      borderRadius: "var(--ui-border-radius)" 
                    }} 
                  />
                ) : (
                  <div style={{ 
                    width: "32px", 
                    height: "32px", 
                    backgroundColor: "var(--accent-primary)", 
                    borderRadius: "var(--ui-border-radius)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontWeight: "bold",
                    fontSize: "14px"
                  }}>
                    {settings.company_name.charAt(0).toUpperCase()}
                  </div>
                )}
                <span style={{ 
                  fontSize: "var(--base-font-size)", 
                  color: "var(--text-primary)",
                  fontWeight: "var(--font-weight-medium)"
                }}>
                  {settings.company_name}
                </span>
              </div>
              
              <button className="config-preview__demo-button">
                Botón de Ejemplo
              </button>
              
              <div style={{ 
                marginTop: "12px", 
                padding: "8px", 
                backgroundColor: "var(--bg-secondary)",
                borderRadius: "var(--ui-border-radius)",
                fontSize: "0.9rem",
                color: "var(--text-secondary)"
              }}>
                <div>Tema: <strong>{settings.enun_tema}</strong></div>
                <div>Tipo: <strong>{settings.theme_type}</strong></div>
                <div>Fuente: <strong>{settings.font_size}</strong></div>
                <div>Color: <strong>{AVAILABLE_COLORS.find(c => c.value === settings.accent_color)?.name}</strong></div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

// Funciones auxiliares para conversión de colores
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r: number, g: number, b: number): string {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

export default PersonalizacionPage;
// src/modules/reportes/reportes.tsx
import React, { useState } from "react";
import "../../styles/dashboard.css";

interface ReportFilter {
  tipo_reporte: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado?: string;
  usuario?: string;
  cliente?: string;
  monto_min?: number;
  monto_max?: number;
  departamento?: string;
}

interface ReportData {
  id: string;
  fecha: string;
  tipo: string;
  cliente: string;
  monto: number;
  estado: string;
  usuario: string;
  observaciones?: string;
}

const ReportesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"filtros" | "resultados" | "ia">("filtros");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [listeningToVoice, setListeningToVoice] = useState(false);
  
  const [filters, setFilters] = useState<ReportFilter>({
    tipo_reporte: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: "",
    usuario: "",
    cliente: "",
    monto_min: undefined,
    monto_max: undefined,
    departamento: ""
  });

  const [iaPrompt, setIaPrompt] = useState("");

  // Datos de ejemplo para los reportes
  const sampleData: ReportData[] = [
    {
      id: "C001",
      fecha: "2025-10-15",
      tipo: "Crédito Personal",
      cliente: "Juan Pérez López",
      monto: 25000,
      estado: "Aprobado",
      usuario: "vagner@gmail.com",
      observaciones: "Cliente con buen historial crediticio"
    },
    {
      id: "C002", 
      fecha: "2025-10-14",
      tipo: "Crédito Empresarial",
      cliente: "María García SRL",
      monto: 150000,
      estado: "En revisión",
      usuario: "analista@empresa.com",
      observaciones: "Requiere garantías adicionales"
    },
    {
      id: "C003",
      fecha: "2025-10-13", 
      tipo: "Crédito Vehicular",
      cliente: "Carlos Mendoza",
      monto: 80000,
      estado: "Aprobado",
      usuario: "vagner@gmail.com",
      observaciones: "Vehículo nuevo 2025"
    },
    {
      id: "P001",
      fecha: "2025-10-12",
      tipo: "Pago de Cuota",
      cliente: "Ana Rodríguez",
      monto: 2500,
      estado: "Pagado",
      usuario: "cajero@empresa.com",
      observaciones: "Pago puntual"
    },
    {
      id: "P002",
      fecha: "2025-10-11",
      tipo: "Pago Anticipado", 
      cliente: "Roberto Silva",
      monto: 15000,
      estado: "Procesado",
      usuario: "cajero@empresa.com",
      observaciones: "Liquidación anticipada"
    }
  ];

  const handleFilterChange = (name: string, value: any) => {
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const generateReport = async () => {
    setLoading(true);
    setActiveTab("resultados");
    
    try {
      // Simular llamada a API con delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Filtrar datos según los criterios
      let filtered = [...sampleData];
      
      if (filters.fecha_inicio) {
        filtered = filtered.filter(item => item.fecha >= filters.fecha_inicio);
      }
      
      if (filters.fecha_fin) {
        filtered = filtered.filter(item => item.fecha <= filters.fecha_fin);
      }
      
      if (filters.estado) {
        filtered = filtered.filter(item => item.estado.toLowerCase().includes(filters.estado!.toLowerCase()));
      }
      
      if (filters.cliente) {
        filtered = filtered.filter(item => item.cliente.toLowerCase().includes(filters.cliente!.toLowerCase()));
      }
      
      if (filters.monto_min) {
        filtered = filtered.filter(item => item.monto >= filters.monto_min!);
      }
      
      if (filters.monto_max) {
        filtered = filtered.filter(item => item.monto <= filters.monto_max!);
      }
      
      setReportData(filtered);
      
      // Registrar en auditoría
      const logEntry = {
        id: Date.now().toString(),
        action: "export_report",
        user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
        timestamp: new Date().toISOString(),
        details: `Reporte generado: ${filters.tipo_reporte || "General"} (${filtered.length} registros)`
      };
      
      const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
      localStorage.setItem("audit_logs", JSON.stringify([logEntry, ...existingLogs]));
      
    } catch (error) {
      console.error("Error generando reporte:", error);
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    // Simular exportación a PDF
    const reportContent = `
REPORTE DE ${filters.tipo_reporte?.toUpperCase() || "ACTIVIDADES"}
Fecha de generación: ${new Date().toLocaleString("es-ES")}
Período: ${filters.fecha_inicio || "N/A"} - ${filters.fecha_fin || "N/A"}
Total de registros: ${reportData.length}

${reportData.map(item => 
  `${item.id} | ${item.fecha} | ${item.cliente} | $${item.monto.toLocaleString()} | ${item.estado}`
).join('\n')}
    `;
    
    console.log("Exportando a PDF:", reportContent);
    alert("PDF generado exitosamente (simulación)");
    
    // Registrar exportación
    const logEntry = {
      id: Date.now().toString(),
      action: "export_report",
      user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
      timestamp: new Date().toISOString(),
      details: `Reporte exportado a PDF: ${reportData.length} registros`
    };
    
    const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
    localStorage.setItem("audit_logs", JSON.stringify([logEntry, ...existingLogs]));
  };

  const exportToExcel = () => {
    // Simular exportación a Excel
    const csvContent = [
      ["ID", "Fecha", "Tipo", "Cliente", "Monto", "Estado", "Usuario", "Observaciones"].join(","),
      ...reportData.map(item => [
        item.id,
        item.fecha,
        item.tipo,
        `"${item.cliente}"`,
        item.monto,
        item.estado,
        item.usuario,
        `"${item.observaciones || ""}"`
      ].join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Registrar exportación
    const logEntry = {
      id: Date.now().toString(),
      action: "export_report",
      user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
      timestamp: new Date().toISOString(),
      details: `Reporte exportado a Excel: ${reportData.length} registros`
    };
    
    const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
    localStorage.setItem("audit_logs", JSON.stringify([logEntry, ...existingLogs]));
  };

  const sendByEmail = () => {
    const email = prompt("Ingrese el email de destino:");
    if (email) {
      console.log(`Enviando reporte por email a: ${email}`);
      alert(`Reporte enviado exitosamente a ${email} (simulación)`);
      
      // Registrar envío
      const logEntry = {
        id: Date.now().toString(),
        action: "export_report",
        user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
        timestamp: new Date().toISOString(),
        details: `Reporte enviado por email a: ${email}`
      };
      
      const existingLogs = JSON.parse(localStorage.getItem("audit_logs") || "[]");
      localStorage.setItem("audit_logs", JSON.stringify([logEntry, ...existingLogs]));
    }
  };

  const handleVoiceCommand = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Su navegador no soporta reconocimiento de voz");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.lang = 'es-ES';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setListeningToVoice(true);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIaPrompt(transcript);
      processVoiceCommand(transcript);
    };

    recognition.onerror = () => {
      setListeningToVoice(false);
      alert("Error en el reconocimiento de voz");
    };

    recognition.onend = () => {
      setListeningToVoice(false);
    };

    recognition.start();
  };

  const processVoiceCommand = (command: string) => {
    // Simular procesamiento de IA
    const lowerCommand = command.toLowerCase();
    
    if (lowerCommand.includes("créditos aprobados")) {
      setFilters(prev => ({ ...prev, tipo_reporte: "creditos", estado: "aprobado" }));
    } else if (lowerCommand.includes("pagos del mes")) {
      const thisMonth = new Date().toISOString().slice(0, 7);
      setFilters(prev => ({ 
        ...prev, 
        tipo_reporte: "pagos",
        fecha_inicio: `${thisMonth}-01`,
        fecha_fin: `${thisMonth}-31`
      }));
    } else if (lowerCommand.includes("todos los créditos")) {
      setFilters(prev => ({ ...prev, tipo_reporte: "creditos" }));
    }
    
    setTimeout(() => {
      generateReport();
    }, 1000);
  };

  const processIAPrompt = () => {
    if (!iaPrompt.trim()) return;
    
    processVoiceCommand(iaPrompt);
    setActiveTab("resultados");
  };

  return (
    <section className="page">
      <h1 className="ui-title">📊 Reportes Avanzados</h1>
      
      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab ${activeTab === "filtros" ? "active" : ""}`}
          onClick={() => setActiveTab("filtros")}
        >
          🔍 Filtros
        </button>
        <button 
          className={`tab ${activeTab === "resultados" ? "active" : ""}`}
          onClick={() => setActiveTab("resultados")}
        >
          📋 Resultados
        </button>
        <button 
          className={`tab ${activeTab === "ia" ? "active" : ""}`}
          onClick={() => setActiveTab("ia")}
        >
          🤖 IA Asistente
        </button>
      </div>

      {/* Panel de Filtros */}
      {activeTab === "filtros" && (
        <div className="card">
          <h3>🔍 Configurar Filtros del Reporte</h3>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "16px", marginTop: "20px" }}>
            <div>
              <label>Tipo de Reporte *</label>
              <select
                value={filters.tipo_reporte}
                onChange={(e) => handleFilterChange("tipo_reporte", e.target.value)}
              >
                <option value="">Seleccionar tipo</option>
                <option value="creditos">📋 Reporte de Créditos</option>
                <option value="pagos">💳 Reporte de Pagos</option>
                <option value="usuarios">👥 Reporte de Usuarios</option>
                <option value="financiero">💰 Reporte Financiero</option>
                <option value="auditoria">🔍 Reporte de Auditoría</option>
              </select>
            </div>

            <div>
              <label>Fecha Inicio</label>
              <input
                type="date"
                value={filters.fecha_inicio}
                onChange={(e) => handleFilterChange("fecha_inicio", e.target.value)}
              />
            </div>

            <div>
              <label>Fecha Fin</label>
              <input
                type="date"
                value={filters.fecha_fin}
                onChange={(e) => handleFilterChange("fecha_fin", e.target.value)}
              />
            </div>

            <div>
              <label>Estado</label>
              <select
                value={filters.estado}
                onChange={(e) => handleFilterChange("estado", e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="aprobado">Aprobado</option>
                <option value="rechazado">Rechazado</option>
                <option value="en revision">En Revisión</option>
                <option value="pagado">Pagado</option>
                <option value="pendiente">Pendiente</option>
                <option value="vencido">Vencido</option>
              </select>
            </div>

            <div>
              <label>Cliente</label>
              <input
                type="text"
                placeholder="Nombre del cliente..."
                value={filters.cliente}
                onChange={(e) => handleFilterChange("cliente", e.target.value)}
              />
            </div>

            <div>
              <label>Usuario</label>
              <input
                type="text"
                placeholder="Email del usuario..."
                value={filters.usuario}
                onChange={(e) => handleFilterChange("usuario", e.target.value)}
              />
            </div>

            <div>
              <label>Monto Mínimo</label>
              <input
                type="number"
                placeholder="0"
                value={filters.monto_min || ""}
                onChange={(e) => handleFilterChange("monto_min", Number(e.target.value) || undefined)}
              />
            </div>

            <div>
              <label>Monto Máximo</label>
              <input
                type="number"
                placeholder="Sin límite"
                value={filters.monto_max || ""}
                onChange={(e) => handleFilterChange("monto_max", Number(e.target.value) || undefined)}
              />
            </div>
          </div>

          <div style={{ marginTop: "24px", textAlign: "center" }}>
            <button 
              onClick={generateReport} 
              className="ui-btn"
              disabled={loading || !filters.tipo_reporte}
            >
              {loading ? "⏳ Generando..." : "📊 Generar Reporte"}
            </button>
          </div>
        </div>
      )}

      {/* Panel de Resultados */}
      {activeTab === "resultados" && (
        <div>
          {reportData.length > 0 && (
            <div style={{ marginBottom: "20px", display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button onClick={exportToPDF} className="ui-btn ui-btn--ghost">
                📄 Exportar PDF
              </button>
              <button onClick={exportToExcel} className="ui-btn ui-btn--ghost">
                📗 Exportar Excel
              </button>
              <button onClick={sendByEmail} className="ui-btn ui-btn--ghost">
                📧 Enviar por Email
              </button>
            </div>
          )}

          <div className="card">
            <h3>📋 Resultados del Reporte</h3>
            
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}>
                <div>⏳ Generando reporte...</div>
              </div>
            ) : reportData.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px", color: "#6b7280" }}>
                <div>📊</div>
                <div>No hay datos para mostrar</div>
                <div>Configure los filtros y genere un reporte</div>
              </div>
            ) : (
              <div>
                <div style={{ marginBottom: "16px", color: "#6b7280" }}>
                  Mostrando {reportData.length} registros
                </div>
                
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Fecha</th>
                        <th>Tipo</th>
                        <th>Cliente</th>
                        <th>Monto</th>
                        <th>Estado</th>
                        <th>Usuario</th>
                        <th>Observaciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.map((item) => (
                        <tr key={item.id}>
                          <td>{item.id}</td>
                          <td>{new Date(item.fecha).toLocaleDateString("es-ES")}</td>
                          <td>{item.tipo}</td>
                          <td>{item.cliente}</td>
                          <td>${item.monto.toLocaleString()}</td>
                          <td>
                            <span className={`status status--${item.estado.toLowerCase().replace(" ", "-")}`}>
                              {item.estado}
                            </span>
                          </td>
                          <td>{item.usuario}</td>
                          <td>{item.observaciones}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Panel de IA */}
      {activeTab === "ia" && (
        <div className="card">
          <h3>🤖 Asistente IA para Reportes</h3>
          <p style={{ color: "#6b7280", marginBottom: "20px" }}>
            Describe el reporte que necesitas en lenguaje natural o usa el reconocimiento de voz
          </p>
          
          <div style={{ marginBottom: "20px" }}>
            <label>Descripción del Reporte</label>
            <textarea
              value={iaPrompt}
              onChange={(e) => setIaPrompt(e.target.value)}
              placeholder="Ejemplo: 'Muéstrame todos los créditos aprobados el mes pasado para clientes de La Paz'"
              rows={3}
              style={{ width: "100%", marginBottom: "12px" }}
            />
            
            <div style={{ display: "flex", gap: "12px" }}>
              <button 
                onClick={processIAPrompt} 
                className="ui-btn"
                disabled={!iaPrompt.trim()}
              >
                🤖 Procesar con IA
              </button>
              
              <button 
                onClick={handleVoiceCommand} 
                className={`ui-btn ui-btn--ghost ${listeningToVoice ? "listening" : ""}`}
                disabled={listeningToVoice}
              >
                {listeningToVoice ? "🎤 Escuchando..." : "🎤 Usar Voz"}
              </button>
            </div>
          </div>
          
          {/* Ejemplos de comandos */}
          <div style={{ background: "#f9fafb", padding: "16px", borderRadius: "8px" }}>
            <h4>💡 Ejemplos de comandos:</h4>
            <ul style={{ margin: "8px 0", paddingLeft: "20px" }}>
              <li>"Muéstrame todos los créditos aprobados este mes"</li>
              <li>"Reporte de pagos vencidos en los últimos 30 días"</li>
              <li>"Créditos por encima de 50,000 bolivianos"</li>
              <li>"Actividad de usuarios en la última semana"</li>
              <li>"Pagos procesados por el usuario María García"</li>
            </ul>
          </div>
        </div>
      )}
    </section>
  );
};

export default ReportesPage;
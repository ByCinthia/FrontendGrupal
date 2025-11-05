// src/modules/reportes/reportes.tsx
import React, { useState } from "react";
import "../../styles/theme.css";

import type { ReportFilter, ReportData } from "./types";
import { generateReport as apiGenerateReport, exportToCSVBlob, startVoiceRecognition,
   //fetchAuditLogs,
    saveAudit } from "./service";

const ReportesPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"filtros" | "resultados" | "ia">("filtros");
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [listeningToVoice, setListeningToVoice] = useState(false);

  const [filters, setFilters] = useState<ReportFilter>({
    tipo_reporte: "",
    fecha_inicio: "",
    fecha_fin: "",
    estado: undefined,
    usuario: undefined,
    cliente: undefined,
    monto_min: undefined,
    monto_max: undefined,
    departamento: undefined
  });

  const [iaPrompt, setIaPrompt] = useState("");

  const handleFilterChange = (name: keyof ReportFilter, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [name]: value } as ReportFilter));
  };

  const generateReport = async () => {
    setLoading(true);
    setActiveTab("resultados");
    try {
      const rows = await apiGenerateReport(filters);
      setReportData(rows);
      // (Opcional) saveAudit ya es llamado dentro del service.generateReport, pero dejamos redundancia mínima si se requiere:
      // saveAudit({ action: "generate_report", user: ..., details: `Filtro: ${JSON.stringify(filters)} - resultados: ${rows.length}` });
    } catch (err) {
      console.error("Error generando reporte:", err);
      // mostrar feedback al usuario si se desea (toast, mensaje, etc.)
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = () => {
    // Mantengo simulación de PDF local; si se requiere usar servicio backend, reemplazar aquí.
    const reportContent = `
REPORTE DE ${filters.tipo_reporte?.toUpperCase() || "ACTIVIDADES"}
Fecha de generación: ${new Date().toLocaleString("es-ES")}
Período: ${filters.fecha_inicio || "N/A"} - ${filters.fecha_fin || "N/A"}
Total de registros: ${reportData.length}

${reportData.map(item =>
  `${item.id} | ${item.fecha} | ${item.cliente} | $${item.monto.toLocaleString()} | ${item.estado}`
).join("\n")}
    `;
    console.log("Exportando a PDF (simulado):", reportContent);
    alert("PDF generado exitosamente (simulación)");

    saveAudit({
      action: "export_report_pdf",
      user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
      details: `Reporte exportado a PDF: ${reportData.length} registros`
    });
  };

  const exportToExcel = () => {
    const blob = exportToCSVBlob(reportData);
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `reporte_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    saveAudit({
      action: "export_report_csv",
      user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
      details: `Reporte exportado a CSV: ${reportData.length} registros`
    });
  };

  const sendByEmail = () => {
    const email = prompt("Ingrese el email de destino:");
    if (!email) return;
    // Simulación de envío
    alert(`Reporte enviado exitosamente a ${email} (simulación)`);

    saveAudit({
      action: "send_report_email",
      user: JSON.parse(localStorage.getItem("auth.me") || "{}").email || "usuario",
      details: `Reporte enviado por email a: ${email}`
    });
  };

  const handleVoiceCommand = async () => {
    setListeningToVoice(true);
    try {
      const transcript = await startVoiceRecognition(12000);
      setIaPrompt(transcript);
      processVoiceCommand(transcript);
    } catch (err) {
      console.error("Reconocimiento de voz falló:", err);
      alert((err as Error)?.message ?? "Error con reconocimiento de voz");
    } finally {
      setListeningToVoice(false);
    }
  };

  const processVoiceCommand = (command: string) => {
    const lowerCommand = command.toLowerCase();

    if (lowerCommand.includes("créditos aprobados") || lowerCommand.includes("creditos aprobados")) {
      handleFilterChange("tipo_reporte", "creditos");
      handleFilterChange("estado", "aprobado");
    } else if (lowerCommand.includes("pagos del mes") || lowerCommand.includes("pagos este mes")) {
      const now = new Date();
      const thisMonth = now.toISOString().slice(0, 7);
      handleFilterChange("tipo_reporte", "pagos");
      handleFilterChange("fecha_inicio", `${thisMonth}-01`);
      handleFilterChange("fecha_fin", `${thisMonth}-31`);
    } else if (lowerCommand.includes("todos los créditos") || lowerCommand.includes("todos los creditos")) {
      handleFilterChange("tipo_reporte", "creditos");
    }

    // Ejecutar reporte automático tras procesar comando
    setTimeout(() => generateReport(), 800);
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
                value={filters.fecha_inicio || ""}
                onChange={(e) => handleFilterChange("fecha_inicio", e.target.value)}
              />
            </div>

            <div>
              <label>Fecha Fin</label>
              <input
                type="date"
                value={filters.fecha_fin || ""}
                onChange={(e) => handleFilterChange("fecha_fin", e.target.value)}
              />
            </div>

            <div>
              <label>Estado</label>
              <select
                value={filters.estado || ""}
                onChange={(e) => handleFilterChange("estado", e.target.value || undefined)}
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
                value={filters.cliente || ""}
                onChange={(e) => handleFilterChange("cliente", e.target.value || undefined)}
              />
            </div>

            <div>
              <label>Usuario</label>
              <input
                type="text"
                placeholder="Email del usuario..."
                value={filters.usuario || ""}
                onChange={(e) => handleFilterChange("usuario", e.target.value || undefined)}
              />
            </div>

            <div>
              <label>Monto Mínimo</label>
              <input
                type="number"
                placeholder="0"
                value={filters.monto_min ?? ""}
                onChange={(e) => handleFilterChange("monto_min", e.target.value ? Number(e.target.value) : undefined)}
              />
            </div>

            <div>
              <label>Monto Máximo</label>
              <input
                type="number"
                placeholder="Sin límite"
                value={filters.monto_max ?? ""}
                onChange={(e) => handleFilterChange("monto_max", e.target.value ? Number(e.target.value) : undefined)}
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

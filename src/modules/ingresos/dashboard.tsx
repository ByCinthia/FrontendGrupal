// src/modules/ingresos/dashboard.tsx
import React, { useState, useEffect } from "react";
import "../../styles/dashboard.css";

interface IngresoData {
  fecha: string;
  monto: number;
  fuente: string;
  tipo: "credito" | "pago" | "interes" | "mora" | "otros";
  cliente?: string;
  estado: "confirmado" | "pendiente" | "cancelado";
}

interface MetricaIngreso {
  titulo: string;
  valor: number;
  variacion: number;
  icon: string;
  color: string;
}

const DashboardIngresos: React.FC = () => {
  const [periodo, setPeriodo] = useState<"dia" | "semana" | "mes" | "ano">("mes");
  const [ingresos, setIngresos] = useState<IngresoData[]>([]);
  const [metricas, setMetricas] = useState<MetricaIngreso[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    cargarDatos();
  }, [periodo]);

  const cargarDatos = async () => {
    setLoading(true);
    
    // Simular carga de datos
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Datos de ejemplo para el dashboard
    const ingresosEjemplo: IngresoData[] = [
      {
        fecha: "2025-01-15",
        monto: 25000,
        fuente: "Pago de Crédito - Cliente ABC",
        tipo: "pago",
        cliente: "ABC Empresa",
        estado: "confirmado"
      },
      {
        fecha: "2025-01-15",
        monto: 1500,
        fuente: "Intereses Crédito Personal",
        tipo: "interes",
        cliente: "Juan Pérez",
        estado: "confirmado"
      },
      {
        fecha: "2025-01-14",
        monto: 45000,
        fuente: "Nuevo Crédito Empresarial",
        tipo: "credito",
        cliente: "XYZ Corporation",
        estado: "confirmado"
      },
      {
        fecha: "2025-01-14",
        monto: 800,
        fuente: "Mora por pago tardío",
        tipo: "mora",
        cliente: "María González",
        estado: "confirmado"
      },
      {
        fecha: "2025-01-13",
        monto: 32000,
        fuente: "Pago Crédito Vehicular",
        tipo: "pago",
        cliente: "Roberto Silva",
        estado: "confirmado"
      },
      {
        fecha: "2025-01-13",
        monto: 5000,
        fuente: "Comisión por gestión",
        tipo: "otros",
        estado: "pendiente"
      },
      {
        fecha: "2025-01-12",
        monto: 18000,
        fuente: "Pago Crédito Hipotecario",
        tipo: "pago",
        cliente: "Ana Torres",
        estado: "confirmado"
      }
    ];

    setIngresos(ingresosEjemplo);
    calcularMetricas(ingresosEjemplo);
    setLoading(false);
  };

  const calcularMetricas = (data: IngresoData[]) => {
    const confirmados = data.filter(i => i.estado === "confirmado");
    const totalIngresos = confirmados.reduce((sum, i) => sum + i.monto, 0);
    const totalPagos = confirmados.filter(i => i.tipo === "pago").reduce((sum, i) => sum + i.monto, 0);
    const totalIntereses = confirmados.filter(i => i.tipo === "interes" || i.tipo === "mora").reduce((sum, i) => sum + i.monto, 0);
    const totalCreditos = confirmados.filter(i => i.tipo === "credito").reduce((sum, i) => sum + i.monto, 0);

    const nuevasMetricas: MetricaIngreso[] = [
      {
        titulo: "Ingresos Totales",
        valor: totalIngresos,
        variacion: 12.5,
        icon: "💰",
        color: "#059669"
      },
      {
        titulo: "Pagos Recibidos",
        valor: totalPagos,
        variacion: 8.3,
        icon: "💳",
        color: "#3b82f6"
      },
      {
        titulo: "Intereses y Moras",
        valor: totalIntereses,
        variacion: 15.7,
        icon: "📈",
        color: "#8b5cf6"
      },
      {
        titulo: "Nuevos Créditos",
        valor: totalCreditos,
        variacion: -5.2,
        icon: "🏦",
        color: "#f59e0b"
      }
    ];

    setMetricas(nuevasMetricas);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-BO", {
      style: "currency",
      currency: "BOB",
      minimumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "credito": return "#f59e0b";
      case "pago": return "#3b82f6";
      case "interes": return "#8b5cf6";
      case "mora": return "#ef4444";
      case "otros": return "#6b7280";
      default: return "#6b7280";
    }
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "credito": return "🏦";
      case "pago": return "💳";
      case "interes": return "📈";
      case "mora": return "⚠️";
      case "otros": return "💼";
      default: return "💰";
    }
  };

  const getTipoNombre = (tipo: string) => {
    switch (tipo) {
      case "credito": return "Crédito";
      case "pago": return "Pago";
      case "interes": return "Interés";
      case "mora": return "Mora";
      case "otros": return "Otros";
      default: return "Desconocido";
    }
  };

  const getPeriodoTexto = (periodo: string) => {
    switch (periodo) {
      case "dia": return "Hoy";
      case "semana": return "Esta Semana";
      case "mes": return "Este Mes";
      case "ano": return "Este Año";
      default: return "Periodo";
    }
  };

  // Generar datos para el gráfico simple
  const generarDatosGrafico = () => {
    const ultimosDias = [];
    for (let i = 6; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      
      const ingresosDelDia = ingresos
        .filter(ing => ing.fecha === fechaStr && ing.estado === "confirmado")
        .reduce((sum, ing) => sum + ing.monto, 0);
      
      ultimosDias.push({
        fecha: fecha.toLocaleDateString("es-ES", { weekday: "short", day: "numeric" }),
        monto: ingresosDelDia || Math.random() * 30000 + 10000 // datos aleatorios si no hay reales
      });
    }
    return ultimosDias;
  };

  if (loading) {
    return (
      <section className="page">
        <div style={{ textAlign: "center", padding: "60px" }}>
          <div style={{ fontSize: "48px", marginBottom: "16px" }}>⏳</div>
          <p>Cargando dashboard de ingresos...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px" }}>
        <div>
          <h1 className="ui-title">💹 Dashboard de Ingresos</h1>
          <p style={{ color: "#6b7280", margin: 0 }}>
            Monitoreo financiero en tiempo real - {getPeriodoTexto(periodo)}
          </p>
        </div>
        
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <select 
            value={periodo} 
            onChange={(e) => setPeriodo(e.target.value as any)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #d1d5db" }}
          >
            <option value="dia">Hoy</option>
            <option value="semana">Esta Semana</option>
            <option value="mes">Este Mes</option>
            <option value="ano">Este Año</option>
          </select>
          
          <button 
            onClick={cargarDatos}
            className="ui-btn ui-btn--ghost"
          >
            🔄 Actualizar
          </button>
        </div>
      </div>

      {/* Métricas Principales */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px", marginBottom: "32px" }}>
        {metricas.map((metrica, index) => (
          <div 
            key={index}
            className="card"
            style={{ 
              padding: "24px",
              background: `linear-gradient(135deg, ${metrica.color}15 0%, ${metrica.color}05 100%)`,
              border: `1px solid ${metrica.color}20`
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "14px" }}>
                  {metrica.titulo}
                </h3>
                <div style={{ fontSize: "28px", fontWeight: "bold", color: metrica.color }}>
                  {formatCurrency(metrica.valor)}
                </div>
              </div>
              <div style={{ fontSize: "32px" }}>
                {metrica.icon}
              </div>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ 
                color: metrica.variacion >= 0 ? "#059669" : "#ef4444",
                fontSize: "14px",
                fontWeight: "bold"
              }}>
                {metrica.variacion >= 0 ? "↗️" : "↘️"} {Math.abs(metrica.variacion)}%
              </span>
              <span style={{ fontSize: "12px", color: "#6b7280" }}>
                vs {periodo === "mes" ? "mes anterior" : "periodo anterior"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "24px" }}>
        
        {/* Gráfico de Ingresos */}
        <div className="card">
          <h3 style={{ marginBottom: "24px" }}>📊 Tendencia de Ingresos (Últimos 7 días)</h3>
          
          <div style={{ position: "relative", height: "300px", padding: "20px" }}>
            {/* Gráfico simple con CSS */}
            <div style={{ 
              display: "flex", 
              alignItems: "end", 
              justifyContent: "space-between", 
              height: "100%",
              borderBottom: "2px solid #e5e7eb",
              borderLeft: "2px solid #e5e7eb",
              paddingLeft: "20px",
              paddingBottom: "20px"
            }}>
              {generarDatosGrafico().map((dia, index) => {
                const maxMonto = Math.max(...generarDatosGrafico().map(d => d.monto));
                const altura = (dia.monto / maxMonto) * 100;
                
                return (
                  <div 
                    key={index}
                    style={{ 
                      display: "flex", 
                      flexDirection: "column", 
                      alignItems: "center",
                      height: "100%",
                      justifyContent: "end"
                    }}
                  >
                    <div style={{ 
                      fontSize: "12px", 
                      color: "#374151", 
                      marginBottom: "8px",
                      fontWeight: "bold"
                    }}>
                      {formatCurrency(dia.monto)}
                    </div>
                    <div style={{
                      width: "40px",
                      height: `${altura}%`,
                      backgroundColor: "#3b82f6",
                      borderRadius: "4px 4px 0 0",
                      minHeight: "20px",
                      marginBottom: "8px"
                    }} />
                    <div style={{ 
                      fontSize: "12px", 
                      color: "#6b7280",
                      textAlign: "center",
                      minWidth: "50px"
                    }}>
                      {dia.fecha}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Resumen por Tipo */}
        <div className="card">
          <h3 style={{ marginBottom: "20px" }}>🎯 Ingresos por Tipo</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {["pago", "credito", "interes", "mora", "otros"].map(tipo => {
              const montoPorTipo = ingresos
                .filter(i => i.tipo === tipo && i.estado === "confirmado")
                .reduce((sum, i) => sum + i.monto, 0);
              
              const totalGeneral = ingresos
                .filter(i => i.estado === "confirmado")
                .reduce((sum, i) => sum + i.monto, 0);
              
              const porcentaje = totalGeneral > 0 ? (montoPorTipo / totalGeneral) * 100 : 0;
              
              return (
                <div key={tipo} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <div style={{ fontSize: "20px" }}>
                    {getTipoIcon(tipo)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "14px", fontWeight: "500" }}>
                        {getTipoNombre(tipo)}
                      </span>
                      <span style={{ fontSize: "12px", color: "#6b7280" }}>
                        {porcentaje.toFixed(1)}%
                      </span>
                    </div>
                    <div style={{
                      width: "100%",
                      height: "6px",
                      backgroundColor: "#f3f4f6",
                      borderRadius: "3px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        width: `${porcentaje}%`,
                        height: "100%",
                        backgroundColor: getTipoColor(tipo),
                        borderRadius: "3px"
                      }} />
                    </div>
                    <div style={{ fontSize: "12px", color: "#374151", marginTop: "4px" }}>
                      {formatCurrency(montoPorTipo)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Últimas Transacciones */}
      <div className="card" style={{ marginTop: "24px" }}>
        <h3 style={{ marginBottom: "20px" }}>📋 Últimas Transacciones</h3>
        
        <div style={{ overflow: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #f3f4f6" }}>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "#6b7280", fontSize: "12px" }}>FECHA</th>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "#6b7280", fontSize: "12px" }}>TIPO</th>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "#6b7280", fontSize: "12px" }}>FUENTE</th>
                <th style={{ textAlign: "left", padding: "12px 8px", color: "#6b7280", fontSize: "12px" }}>CLIENTE</th>
                <th style={{ textAlign: "right", padding: "12px 8px", color: "#6b7280", fontSize: "12px" }}>MONTO</th>
                <th style={{ textAlign: "center", padding: "12px 8px", color: "#6b7280", fontSize: "12px" }}>ESTADO</th>
              </tr>
            </thead>
            <tbody>
              {ingresos.slice(0, 10).map((ingreso, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #f9fafb" }}>
                  <td style={{ padding: "12px 8px", fontSize: "14px" }}>
                    {formatDate(ingreso.fecha)}
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "16px" }}>{getTipoIcon(ingreso.tipo)}</span>
                      <span style={{ fontSize: "14px", color: getTipoColor(ingreso.tipo) }}>
                        {getTipoNombre(ingreso.tipo)}
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: "14px", maxWidth: "200px" }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {ingreso.fuente}
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: "14px" }}>
                    {ingreso.cliente || "-"}
                  </td>
                  <td style={{ padding: "12px 8px", fontSize: "14px", fontWeight: "bold", textAlign: "right" }}>
                    {formatCurrency(ingreso.monto)}
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "center" }}>
                    <span style={{
                      padding: "4px 8px",
                      borderRadius: "12px",
                      fontSize: "12px",
                      fontWeight: "bold",
                      backgroundColor: ingreso.estado === "confirmado" ? "#d1fae5" : 
                                     ingreso.estado === "pendiente" ? "#fef3c7" : "#fee2e2",
                      color: ingreso.estado === "confirmado" ? "#059669" : 
                             ingreso.estado === "pendiente" ? "#d97706" : "#dc2626"
                    }}>
                      {ingreso.estado === "confirmado" ? "✅ Confirmado" :
                       ingreso.estado === "pendiente" ? "⏳ Pendiente" : "❌ Cancelado"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default DashboardIngresos;
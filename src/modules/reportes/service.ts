import type { ReportFilter, ReportData, AuditLogEntry } from "./types";

/** Datos de ejemplo (se puede reemplazar por llamada real a API) */
const SAMPLE_DATA: ReportData[] = [
  { id: "C001", fecha: "2025-10-15", tipo: "Crédito Personal", cliente: "Juan Pérez López", monto: 25000, estado: "Aprobado", usuario: "vagner@gmail.com", observaciones: "Cliente con buen historial crediticio" },
  { id: "C002", fecha: "2025-10-14", tipo: "Crédito Empresarial", cliente: "María García SRL", monto: 150000, estado: "En revisión", usuario: "analista@empresa.com", observaciones: "Requiere garantías adicionales" },
  { id: "C003", fecha: "2025-10-13", tipo: "Crédito Vehicular", cliente: "Carlos Mendoza", monto: 80000, estado: "Aprobado", usuario: "vagner@gmail.com", observaciones: "Vehículo nuevo 2025" },
  { id: "P001", fecha: "2025-10-12", tipo: "Pago de Cuota", cliente: "Ana Rodríguez", monto: 2500, estado: "Pagado", usuario: "cajero@empresa.com", observaciones: "Pago puntual" },
  { id: "P002", fecha: "2025-10-11", tipo: "Pago Anticipado", cliente: "Roberto Silva", monto: 15000, estado: "Procesado", usuario: "cajero@empresa.com", observaciones: "Liquidación anticipada" }
];

/** Simula llamada a API y aplica filtros básicos */
export async function generateReport(filters: ReportFilter): Promise<ReportData[]> {
  await new Promise((r) => setTimeout(r, 600)); // delay simulado
  let result = [...SAMPLE_DATA];

  if (filters.fecha_inicio) {
    result = result.filter((r) => r.fecha >= filters.fecha_inicio!);
  }
  if (filters.fecha_fin) {
    result = result.filter((r) => r.fecha <= filters.fecha_fin!);
  }
  if (filters.estado) {
    const s = filters.estado.toLowerCase();
    result = result.filter((r) => r.estado.toLowerCase().includes(s));
  }
  if (filters.cliente) {
    const s = filters.cliente.toLowerCase();
    result = result.filter((r) => r.cliente.toLowerCase().includes(s));
  }
  if (filters.monto_min !== undefined) {
    result = result.filter((r) => r.monto >= filters.monto_min!);
  }
  if (filters.monto_max !== undefined) {
    result = result.filter((r) => r.monto <= filters.monto_max!);
  }
  // filtrado por tipo_reporte si aplica (muy básico)
  if (filters.tipo_reporte) {
    const t = filters.tipo_reporte.toLowerCase();
    result = result.filter((r) => r.tipo.toLowerCase().includes(t) || t === "pagos" && r.id.startsWith("P"));
  }

  // registro en auditoría local (opcional)
  saveAudit({
    action: "generate_report",
    user: (JSON.parse(localStorage.getItem("auth.me") || "{}").email as string) || "usuario",
    details: `Filtro: ${JSON.stringify(filters)} - resultados: ${result.length}`
  });

  return result;
}

/** Genera Blob CSV para descarga */
export function exportToCSVBlob(rows: ReportData[]): Blob {
  const header = ["ID", "Fecha", "Tipo", "Cliente", "Monto", "Estado", "Usuario", "Observaciones"];
  const csv = [
    header.join(","),
    ...rows.map(r =>
      [
        r.id,
        r.fecha,
        r.tipo,
        `"${r.cliente.replace(/"/g, '""')}"`,
        r.monto.toString(),
        r.estado,
        r.usuario,
        `"${(r.observaciones || "").replace(/"/g, '""')}"`
      ].join(",")
    )
  ].join("\n");
  return new Blob([csv], { type: "text/csv;charset=utf-8;" });
}

/** Guarda entrada de auditoría en localStorage (id y timestamp añadidos automáticamente) */
export function saveAudit(entry: Omit<Partial<AuditLogEntry>, "id" | "timestamp"> & { action: string; user: string; details?: string }): AuditLogEntry {
  const full: AuditLogEntry = {
    id: Date.now().toString(),
    action: entry.action,
    user: entry.user,
    timestamp: new Date().toISOString(),
    details: entry.details
  };
  const existing = fetchAuditLogs();
  localStorage.setItem("audit_logs", JSON.stringify([full, ...existing]));
  return full;
}

/** Recupera logs de auditoría desde localStorage */
export function fetchAuditLogs(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem("audit_logs");
    if (!raw) return [];
    const parsed = JSON.parse(raw) as AuditLogEntry[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/* Tipos mínimos locales para evitar `any` y referencias a globals */
type SpeechRecognitionEventLike = {
  results?: Array<Array<{ transcript?: string }>>;
};

interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onstart?: () => void;
  onresult?: (ev: SpeechRecognitionEventLike) => void;
  onerror?: (err: unknown) => void;
  onend?: () => void;
  start: () => void;
  stop?: () => void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

/**
 * startVoiceRecognition - encapsula reconocimiento de voz en una Promise<string>
 * Devuelve la transcripción o rechaza con Error si no es soportado o hubo fallo.
 */
export function startVoiceRecognition(timeoutMs = 12000): Promise<string> {
  return new Promise((resolve, reject) => {
    // feature-detect sin depender de tipos globales en componentes
    const win = window as unknown as Record<string, unknown>;
    const Ctor = (win.SpeechRecognition ?? win.webkitSpeechRecognition) as unknown;

    if (!Ctor) {
      reject(new Error("Reconocimiento de voz no soportado en este navegador"));
      return;
    }

    // construimos instancia con typing local mínimo
    const SpeechCtor = Ctor as unknown as SpeechRecognitionConstructor;
    let recognition: SpeechRecognitionLike;
    try {
      recognition = new SpeechCtor();
    } catch (e) {
      console.debug("startVoiceRecognition - init error:", e);
      reject(new Error("No se pudo iniciar el reconocimiento de voz"));
      return;
    }

    let resolved = false;
    const timer = setTimeout(() => {
      if (resolved) return;
      resolved = true;
      try {
        recognition.stop?.();
      } catch (e) {
        // evitar bloque vacío; registrar mínimamente
        void e;
      }
      reject(new Error("Tiempo de espera agotado para reconocimiento de voz"));
    }, timeoutMs);

    recognition.lang = "es-ES";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => { /* opcional: UI */ };

    recognition.onresult = (ev: SpeechRecognitionEventLike) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      const transcript = ev?.results?.[0]?.[0]?.transcript ?? "";
      try {
        recognition.stop?.();
      } catch (e) {
        void e;
      }
      // guardar en auditoría
      try {
        saveAudit({
          action: "voice_command",
          user: (JSON.parse(localStorage.getItem("auth.me") || "{}").email as string) || "usuario",
          details: transcript
        });
      } catch (e) {
        // no fatal, registrar mínimamente
        console.debug("startVoiceRecognition - audit save error:", e);
      }
      resolve(transcript);
    };

    recognition.onerror = (err: unknown) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try {
        recognition.stop?.();
      } catch (e) {
        void e;
      }
      console.debug("startVoiceRecognition - recognition error:", err);
      reject(new Error("Error durante reconocimiento de voz"));
    };

    recognition.onend = () => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      resolve(""); // terminó sin resultados
    };

    try {
      recognition.start();
    } catch (e) {
      clearTimeout(timer);
      console.debug("startVoiceRecognition - start() threw:", e);
      reject(new Error("No se pudo iniciar reconocimiento de voz"));
    }
  });
}
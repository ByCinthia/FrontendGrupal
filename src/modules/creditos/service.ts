import { http } from "../../shared/api/client";
import { listClientes } from "../clientes/service";
import { listTiposCredito } from "./tipos/service";
import type { CreateCreditInput, Client, CreditType } from "./types";

const BASE_URL = "/api/creditos"; // Ajustar según tu backend

// Conectar con el service de clientes real
export async function listClients(): Promise<Client[]> {
  try {
    const response = await listClientes(); // Usar el service existente de clientes
    // Mapear los datos al formato que espera el formulario de créditos
    return response.results.map(cliente => ({
      id: cliente.id!,
      nombre: cliente.nombre,
      apellido: cliente.apellido || "",
      telefono: cliente.telefono
    }));
  } catch (error) {
    console.error("Error loading clients:", error);
    
    // Fallback con datos mock si el backend no está disponible
    if (import.meta.env.DEV) {
      console.log("🔧 Using mock clients data");
      return [
        { id: 1, nombre: "Juan", apellido: "Pérez", telefono: "+591 70123456" },
        { id: 2, nombre: "María", apellido: "García", telefono: "+591 71234567" },
        { id: 3, nombre: "Carlos", apellido: "López", telefono: "+591 72345678" },
        { id: 4, nombre: "Ana", apellido: "Martínez", telefono: "+591 73456789" }
      ];
    }
    
    throw error;
  }
}

// Conectar con el service de tipos de crédito real
export async function listCreditTypes(): Promise<CreditType[]> {
  try {
    const response = await listTiposCredito(); // Usar el service existente de tipos
    // Mapear los datos al formato que espera el formulario de créditos
    return response.results.map(tipo => ({
      id: tipo.id!,
      nombre: tipo.nombre,
      descripcion: tipo.descripcion,
      monto_minimo: tipo.monto_minimo,
      monto_maximo: tipo.monto_maximo
    }));
  } catch (error) {
    console.error("Error loading credit types:", error);
    
    // Fallback con datos mock si el backend no está disponible
    if (import.meta.env.DEV) {
      console.log("🔧 Using mock credit types data");
      return [
        { 
          id: 1, 
          nombre: "Préstamo Personal", 
          descripcion: "Para gastos personales", 
          monto_minimo: 1000, 
          monto_maximo: 50000 
        },
        { 
          id: 2, 
          nombre: "Crédito Vehicular", 
          descripcion: "Para compra de vehículos", 
          monto_minimo: 10000, 
          monto_maximo: 200000 
        },
        { 
          id: 3, 
          nombre: "Crédito Hipotecario", 
          descripcion: "Para compra de vivienda", 
          monto_minimo: 50000, 
          monto_maximo: 500000 
        }
      ];
    }
    
    throw error;
  }
}

export async function createCredit(data: CreateCreditInput) {
  try {
    console.log("📤 Creating credit:", data);
    
    // Mock temporal hasta que el backend esté listo
    if (import.meta.env.DEV) {
      console.log("🔧 Mock: creating credit", data);
      await new Promise(resolve => setTimeout(resolve, 1000));
      return {
        id: Math.floor(Math.random() * 1000),
        ...data,
        fecha_creacion: new Date().toISOString().split('T')[0],
        estado: "PENDIENTE"
      };
    }
    
    const response = await http.post(BASE_URL, data);
    return response.data;
  } catch (error) {
    console.error("Error creating credit:", error);
    throw new Error("No se pudo crear el crédito");
  }
}

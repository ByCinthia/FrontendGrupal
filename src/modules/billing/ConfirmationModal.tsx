import React, { useState } from "react";
import type { Plan } from "./types";
import "../../styles/landing.css";

interface CompanyData {
  nombre: string;
  email: string;
  telefono: string;
  direccion: string;
  nit?: string;
  admin_nombre: string;
  admin_email: string;
}

interface PaymentData {
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardName: string;
}

interface Props {
  companyData: CompanyData;
  selectedPlan?: Plan;
  isPaidPlan: boolean;
  onConfirm: (paymentData?: PaymentData) => void;
  onCancel: () => void;
  loading: boolean;
}

export const ConfirmationModal: React.FC<Props> = ({
  companyData,
  selectedPlan,
  isPaidPlan,
  onConfirm,
  onCancel,
  loading,
}) => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentData, setPaymentData] = useState<PaymentData>({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    cardName: "",
  });

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPaymentData(prev => ({ ...prev, [name]: value }));
  };

  const handleConfirm = () => {
    if (isPaidPlan && !showPayment) {
      setShowPayment(true);
      return;
    }

    if (isPaidPlan) {
      if (!paymentData.cardNumber || !paymentData.expiryDate || !paymentData.cvv) {
        alert("Completa los datos de la tarjeta para continuar.");
        return;
      }
      onConfirm(paymentData);
      return;
    }

    onConfirm();
  };

  const planTitle = selectedPlan?.name ?? "Plan seleccionado";
  const planPrice = selectedPlan?.priceUsd === 0 ? "Gratis 30 días" : `$${selectedPlan?.priceUsd}/mes`;

  return (
    <div className="confirmation-modal-overlay" role="dialog" aria-modal="true">
      <div className="confirmation-modal-card">
        <h3 className="confirmation-modal-title">
          {showPayment ? "Información de Pago" : "Confirmar Registro"}
        </h3>

        <div className="confirmation-modal-grid">
          {/* Columna izquierda: Plan */}
          <aside className="confirmation-modal-plan" aria-label="Plan seleccionado">
            <div className="plan-header">
              <h4 className="plan-title">{planTitle}</h4>
              <div className="plan-price">{planPrice}</div>
            </div>

            <ul className="plan-features-list">
              {selectedPlan?.limits?.maxUsers !== undefined && (
                <li>✓ Hasta {selectedPlan.limits.maxUsers} usuarios</li>
              )}
              {selectedPlan?.limits?.maxRequests !== undefined && (
                <li>✓ {selectedPlan.limits.maxRequests.toLocaleString()} transacciones/mes</li>
              )}
              {selectedPlan?.limits?.maxStorageGB !== undefined && (
                <li>✓ {selectedPlan.limits.maxStorageGB} GB almacenamiento</li>
              )}
              <li>✓ Soporte {selectedPlan?.limits?.supportLevel === "basic" ? "básico" : selectedPlan?.limits?.supportLevel === "priority" ? "prioritario" : "dedicado"}</li>
              {selectedPlan?.features?.map((feature, idx) => (
                <li key={idx}>✓ {feature}</li>
              ))}
            </ul>

            <div className="plan-summary">
              <strong>Descripción:</strong> {selectedPlan?.description || `Plan ${selectedPlan?.name} - Ideal para tu empresa`}
            </div>
          </aside>

          {/* Columna derecha: Datos empresa / Pago */}
          <section className="confirmation-modal-company" aria-label="Datos de registro">
            <div className="company-section">
              <h4 className="company-title">Datos de la empresa</h4>
              <div className="company-details">
                <p><strong>Nombre:</strong> {companyData.nombre}</p>
                <p><strong>Email:</strong> {companyData.email}</p>
                <p><strong>Teléfono:</strong> {companyData.telefono || "—"}</p>
                <p><strong>Dirección:</strong> {companyData.direccion || "—"}</p>
                <p><strong>Administrador:</strong> {companyData.admin_nombre} — {companyData.admin_email}</p>
              </div>
            </div>

            {showPayment ? (
              <div className="payment-form">
                <h4 className="payment-title">Datos de Pago</h4>

                <div className="form-field">
                  <label className="form-label">Número de tarjeta</label>
                  <input
                    type="text"
                    name="cardNumber"
                    value={paymentData.cardNumber}
                    onChange={handlePaymentChange}
                    placeholder="1234 5678 9012 3456"
                    className="form-input"
                    maxLength={19}
                    aria-label="Número de tarjeta"
                  />
                </div>

                <div className="form-row">
                  <div className="form-col">
                    <label className="form-label">Fecha (MM/AA)</label>
                    <input
                      type="text"
                      name="expiryDate"
                      value={paymentData.expiryDate}
                      onChange={handlePaymentChange}
                      placeholder="MM/AA"
                      className="form-input"
                      maxLength={5}
                      aria-label="Fecha de vencimiento"
                    />
                  </div>
                  <div className="form-col-small">
                    <label className="form-label">CVV</label>
                    <input
                      type="text"
                      name="cvv"
                      value={paymentData.cvv}
                      onChange={handlePaymentChange}
                      placeholder="123"
                      className="form-input"
                      maxLength={4}
                      aria-label="CVV"
                    />
                  </div>
                </div>

                <div className="form-field">
                  <label className="form-label">Nombre en la tarjeta</label>
                  <input
                    type="text"
                    name="cardName"
                    value={paymentData.cardName}
                    onChange={handlePaymentChange}
                    placeholder="Nombre del titular"
                    className="form-input"
                    aria-label="Nombre en la tarjeta"
                  />
                </div>

                <div className="payment-note">
                  No se almacena la tarjeta en este cliente — usa tokenización en producción.
                </div>
              </div>
            ) : (
              isPaidPlan && (
                <div className="payment-warning">
                  Este plan requiere pago. Al continuar, se te pedirá la información de la tarjeta.
                </div>
              )
            )}
          </section>
        </div>

        <div className="confirmation-modal-actions">
          <button
            type="button"
            className="ui-btn ui-btn--ghost"
            onClick={showPayment ? () => setShowPayment(false) : onCancel}
            disabled={loading}
          >
            {showPayment ? "Volver" : "Cancelar"}
          </button>

          <button
            type="button"
            className="ui-btn ui-btn--primary"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? "Procesando..." : showPayment ? "Pagar y Registrar" : isPaidPlan ? "Continuar al Pago" : "Registrar Empresa"}
          </button>
        </div>
      </div>
    </div>
  );
};
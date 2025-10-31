import React, { useEffect, useState } from 'react';
import { createSuscripcionFromPlan, listPlans, mapPlanToEnum } from './service';
import type { Plan, SuscripcionResponse, PlanId } from './types';

interface SubscriptionPanelProps {
  empresaId: number;
  empresaInfo: {
    razon_social: string;
    nombre_comercial: string;
  };
  // el selectedPlan inicial (id local: "basico" | "profesional" | "personalizado")
  selectedPlan: string;
  plans: Plan[];
  onSuccess: (subscription: SuscripcionResponse) => void;
  onCancel?: () => void;
  // Si allowSkip es false, el usuario no podrá "configurar después" y
  // deberá crear una suscripción antes de continuar.
  allowSkip?: boolean;
}

const SubscriptionPanel: React.FC<SubscriptionPanelProps> = ({
  empresaId,
  empresaInfo,
  selectedPlan,
  plans,
  onSuccess,
  onCancel,
  allowSkip = true
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [subscriptionDuration, setSubscriptionDuration] = useState<'monthly' | 'yearly'>('monthly');

  // lista local de planes (usa prop si viene, sino consulta al backend)
  const [availablePlans, setAvailablePlans] = useState<Plan[]>(plans || []);
  // plan seleccionado por el usuario (id local)
  const [selectedPlanId, setSelectedPlanId] = useState<string>(selectedPlan || (plans[0]?.id ?? ''));

  useEffect(() => {
    // si el componente recibió planes por props actualiza el estado
    if (plans && plans.length > 0) {
      setAvailablePlans(plans);
      if (!selectedPlanId) {
        setSelectedPlanId(plans[0].id);
      }
      return;
    }

    // si no recibió planes, pedirlos al backend
    let mounted = true;
    async function load() {
      try {
        const list = await listPlans();
        if (mounted) {
          setAvailablePlans(list);
          if (!selectedPlanId && list.length > 0) setSelectedPlanId(list[0].id);
        }
      } catch (err) {
        console.warn("[billing] no se pudieron cargar planes:", err);
      }
    }
    void load();
    return () => { mounted = false; };
  }, [plans, selectedPlanId]);

  // recalcular currentPlan a partir de availablePlans y selectedPlanId
  const chosenPlan = availablePlans.find(p => p.id === selectedPlanId) ?? availablePlans[0] ?? null;
  if (!chosenPlan) {
    // no hay planes disponibles
    return (
      <div className="subscription-panel-overlay" style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}>
        <div style={{ background: 'var(--card-bg)', padding: '24px', borderRadius: '8px' }}>
          <p>Error: No hay planes disponibles</p>
          <button onClick={onCancel}>Cerrar</button>
        </div>
      </div>
    );
  }

  const handleCreateSubscription = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('📤 Plan seleccionado en UI:', selectedPlanId);
      console.log('📤 Mapeo a enum:', mapPlanToEnum(selectedPlanId as PlanId));
      
      const planIdToUse = selectedPlanId as PlanId;
      const subscription = await createSuscripcionFromPlan(
        empresaId,
        planIdToUse,
        subscriptionDuration
      );
      
      console.log('✅ Suscripción creada:', subscription);
      onSuccess(subscription);
      
    } catch (err) {
      console.error('Error creando suscripción:', err);
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(`Error al crear la suscripción: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // usar chosenPlan (garantizado no-null por el guard anterior)
  const monthlyPrice = chosenPlan.priceUsd;
  const yearlyPrice = Math.round(monthlyPrice * 12 * 0.8); // 20% descuento anual

  return (
    <div className="subscription-panel-overlay" style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div className="subscription-panel" style={{
        background: 'var(--card-bg, #1a1a1a)',
        borderRadius: '12px',
        padding: '32px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto',
        border: '1px solid var(--border-color, #333)',
        color: 'var(--text-color, #fff)'
      }}>
        <header style={{ marginBottom: '24px', textAlign: 'center' }}>
          <h2 style={{ color: 'var(--accent, #3ab5ff)', marginBottom: '8px' }}>
            🎉 ¡Empresa registrada exitosamente!
          </h2>
          <p style={{ color: 'var(--muted, #999)', margin: 0 }}>
            Configure su suscripción para <strong>{empresaInfo.nombre_comercial}</strong>
          </p>
        </header>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '20px',
            color: '#ef4444'
          }}>
            {error}
          </div>
        )}

        {/* Lista de planes disponibles */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12, marginBottom: 20 }}>
          {availablePlans.map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => setSelectedPlanId(p.id)}
              style={{
                textAlign: 'left',
                padding: 12,
                borderRadius: 8,
                border: selectedPlanId === p.id ? '2px solid var(--accent, #3ab5ff)' : '1px solid var(--border-color, #333)',
                background: selectedPlanId === p.id ? 'rgba(58,181,255,0.04)' : 'transparent',
                color: 'var(--text-color, #fff)',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <strong style={{ display: 'block', fontSize: 16 }}>{p.name}</strong>
                <small style={{ color: 'var(--muted, #999)' }}>{`${p.limits.maxUsers} usuarios · ${p.limits.maxRequests} req/mes`}</small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 700 }}>${p.priceUsd}/mes</div>
                <div style={{ fontSize: 12, color: 'var(--muted, #999)' }}>USD</div>
              </div>
            </button>
          ))}
        </div>

        <div className="selected-plan-summary" style={{
          background: 'rgba(58, 181, 255, 0.05)',
          border: '1px solid var(--accent, #3ab5ff)',
          borderRadius: '8px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h3 style={{ color: 'var(--accent, #3ab5ff)', marginBottom: '12px' }}>Plan Seleccionado</h3>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong style={{ fontSize: '18px', color: '#e6f7ff' }}>{chosenPlan.name}</strong>
              <ul style={{ margin: '8px 0 0 0', padding: '0 0 0 20px', color: 'var(--muted, #999)' }}>
                <li>Hasta {chosenPlan.limits.maxUsers} usuarios</li>
                <li>{chosenPlan.limits.maxRequests.toLocaleString()} solicitudes/mes</li>
                <li>{chosenPlan.limits.maxStorageGB} GB almacenamiento</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="subscription-duration" style={{ marginBottom: '24px' }}>
          <h4 style={{ marginBottom: '12px', color: '#e6f7ff' }}>Duración de la suscripción</h4>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setSubscriptionDuration('monthly')}
              style={{
                flex: 1,
                padding: '12px',
                border: subscriptionDuration === 'monthly' ? '2px solid var(--accent, #3ab5ff)' : '1px solid var(--border-color, #333)',
                borderRadius: '6px',
                background: subscriptionDuration === 'monthly' ? 'rgba(58, 181, 255, 0.1)' : 'transparent',
                color: subscriptionDuration === 'monthly' ? 'var(--accent, #3ab5ff)' : '#e6f7ff',
                cursor: 'pointer'
              }}
            >
              <div><strong>Mensual</strong></div>
              <div>${monthlyPrice}/mes</div>
            </button>
            <button
              type="button"
              onClick={() => setSubscriptionDuration('yearly')}
              style={{
                flex: 1,
                padding: '12px',
                border: subscriptionDuration === 'yearly' ? '2px solid var(--accent, #3ab5ff)' : '1px solid var(--border-color, #333)',
                borderRadius: '6px',
                background: subscriptionDuration === 'yearly' ? 'rgba(58, 181, 255, 0.1)' : 'transparent',
                color: subscriptionDuration === 'yearly' ? 'var(--accent, #3ab5ff)' : '#e6f7ff',
                cursor: 'pointer'
              }}
            >
              <div><strong>Anual</strong> <span style={{ fontSize: '12px' }}>(20% desc.)</span></div>
              <div>${yearlyPrice}/año</div>
            </button>
          </div>
        </div>

        <div className="subscription-details" style={{
          background: 'rgba(255, 255, 255, 0.02)',
          padding: '16px',
          borderRadius: '6px',
          marginBottom: '24px'
        }}>
          <h4 style={{ marginBottom: '12px', color: '#e6f7ff' }}>Detalles de la suscripción</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '14px' }}>
            <div>
              <strong>Empresa:</strong><br />
              <span style={{ color: 'var(--muted, #999)' }}>{empresaInfo.razon_social}</span>
            </div>
            <div>
              <strong>Plan:</strong><br />
              <span style={{ color: 'var(--muted, #999)' }}>{mapPlanToEnum(selectedPlanId as PlanId)}</span>
            </div>
            <div>
              <strong>Fecha inicio:</strong><br />
              <span style={{ color: 'var(--muted, #999)' }}>{new Date().toLocaleDateString()}</span>
            </div>
            <div>
              <strong>Precio:</strong><br />
              <span style={{ color: 'var(--muted, #999)' }}>
                ${subscriptionDuration === 'monthly' ? monthlyPrice + '/mes' : yearlyPrice + '/año'}
              </span>
            </div>
          </div>
        </div>

        <div className="panel-actions" style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          {allowSkip && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: '12px 24px',
                border: '1px solid var(--border-color, #333)',
                borderRadius: '6px',
                background: 'transparent',
                color: 'var(--muted, #999)',
                cursor: 'pointer'
              }}
            >
              Configurar después
            </button>
          )}
          <button
            type="button"
            onClick={handleCreateSubscription}
            disabled={loading}
            style={{
              padding: '12px 24px',
              border: 'none',
              borderRadius: '6px',
              background: 'var(--accent, #3ab5ff)',
              color: '#041426',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1
            }}
          >
            {loading ? 'Creando suscripción...' : 'Crear suscripción'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionPanel;
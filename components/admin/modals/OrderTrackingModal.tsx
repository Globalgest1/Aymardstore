'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';

interface OrderTrackingModalProps {
  order: any | null;
  onClose: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  order,
  onClose,
  showToast,
}) => {
  const store = useAppStore();

  const [trackingStep, setTrackingStep] = useState<number>(() => {
    if (!order) return 2;
    return order.trackingStep || (order.status === 'DELIVERED' ? 4 : order.status === 'SHIPPED' ? 3 : 2);
  });
  const [trackingLocation, setTrackingLocation] = useState<string>(() => {
    if (!order) return '';
    return order.currentLocation || (order.status === 'DELIVERED' ? 'Remis au client' : order.status === 'SHIPPED' ? "En cours d'acheminement" : 'Entrepôt Cotonou (Haie Vive)');
  });
  const [trackingStatusText, setTrackingStatusText] = useState<string>(() => {
    if (!order) return '';
    return order.trackingStatusText || (order.status === 'DELIVERED' ? 'Colis réceptionné avec succès' : order.status === 'SHIPPED' ? 'Colis pris en charge par le coursier' : 'Colis en cours de préparation');
  });
  const [carrierName, setCarrierName] = useState<string>(() => {
    if (!order) return '';
    return order.carrierName || 'Coursier Express Aymard Store';
  });
  const [carrierPhone, setCarrierPhone] = useState<string>(() => {
    if (!order) return '';
    return order.carrierPhone || '+229 01 97 36 29 06';
  });
  const [trackingNumber, setTrackingNumber] = useState<string>(() => {
    if (!order) return '';
    return order.trackingNumber || `BJ-EXP-${order.orderNumber ? order.orderNumber.replace(/[^0-9]/g, '') : Math.floor(100000 + Math.random() * 900000)}`;
  });
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>(() => {
    if (!order) return '';
    return order.estimatedDeliveryDate || "Livraison aujourd'hui ou sous 24h chrono";
  });
  const [newCheckpointLocation, setNewCheckpointLocation] = useState<string>('');
  const [newCheckpointTitle, setNewCheckpointTitle] = useState<string>('');

  if (!order) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.70)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '680px',
          maxHeight: '90vh',
          backgroundColor: 'var(--adm-card-bg)',
          borderRadius: '24px',
          border: '1.5px solid var(--adm-card-border)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '24px 28px',
          borderBottom: '1px solid var(--adm-card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(2, 132, 199, 0.04)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'rgba(2, 132, 199, 0.12)',
              border: '1px solid rgba(2, 132, 199, 0.3)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px'
            }}>
              🛰️
            </div>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)' }}>
                Supervision &amp; Géolocalisation du Colis
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '2px 0 0 0' }}>
                Commande <strong style={{ color: '#0284c7' }}>{order.orderNumber}</strong> · Destinataire : <strong>{order.shippingAddress?.fullName}</strong> ({order.shippingAddress?.city || 'Bénin'})
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-outline"
            style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ✕
          </button>
        </div>

        {/* Modal Body (Scrollable) */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* 1. Step Pipeline Selector */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--adm-text-m)', display: 'block', marginBottom: '10px' }}>
              1. Étape de Livraison Actuelle (Visible en temps réel chez le client)
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
              {[
                { step: 1, label: 'Confirmée', icon: '📝' },
                { step: 2, label: 'Préparation', icon: '📦' },
                { step: 3, label: 'En Transit', icon: '🚚' },
                { step: 4, label: 'Livrée', icon: '🎉' },
              ].map(s => (
                <button
                  key={s.step}
                  type="button"
                  onClick={() => setTrackingStep(s.step)}
                  style={{
                    padding: '12px 8px',
                    borderRadius: '14px',
                    border: trackingStep === s.step ? '2px solid #0284c7' : '1px solid var(--adm-card-border)',
                    background: trackingStep === s.step ? 'rgba(2, 132, 199, 0.12)' : 'var(--adm-card-bg)',
                    color: trackingStep === s.step ? '#0284c7' : 'var(--adm-text-h)',
                    fontWeight: 800,
                    fontSize: '12px',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px'
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{s.icon}</span>
                  <span>{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 2. Position & Description */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', display: 'block', marginBottom: '6px' }}>
                📍 Localisation actuelle du livreur
              </label>
              <input
                type="text"
                className="admin-input"
                value={trackingLocation}
                onChange={(e) => setTrackingLocation(e.target.value)}
                placeholder="ex: En approche Cotonou Haie Vive"
                style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', display: 'block', marginBottom: '6px' }}>
                💬 Message de statut client
              </label>
              <input
                type="text"
                className="admin-input"
                value={trackingStatusText}
                onChange={(e) => setTrackingStatusText(e.target.value)}
                placeholder="ex: Le coursier est en route vers votre adresse"
                style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          {/* 3. Coursier Details */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', display: 'block', marginBottom: '6px' }}>
                👤 Nom du Coursier / Transporteur
              </label>
              <input
                type="text"
                className="admin-input"
                value={carrierName}
                onChange={(e) => setCarrierName(e.target.value)}
                placeholder="ex: Coursier Express Aymard Store"
                style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', display: 'block', marginBottom: '6px' }}>
                📞 Téléphone Direct du Coursier
              </label>
              <input
                type="text"
                className="admin-input"
                value={carrierPhone}
                onChange={(e) => setCarrierPhone(e.target.value)}
                placeholder="ex: +229 01 97 36 29 06"
                style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          {/* 4. Tracking Number & Estimate */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', display: 'block', marginBottom: '6px' }}>
                🏷️ Numéro de Suivi / Bordereau
              </label>
              <input
                type="text"
                className="admin-input"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="ex: BJ-EXP-829103"
                style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', display: 'block', marginBottom: '6px' }}>
                ⏱️ Estimation Date / Heure Livraison
              </label>
              <input
                type="text"
                className="admin-input"
                value={estimatedDeliveryDate}
                onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                placeholder="ex: Aujourd'hui avant 18h00"
                style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px' }}
              />
            </div>
          </div>

          {/* 5. Add Custom Checkpoint Event */}
          <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid var(--adm-card-border)' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', display: 'block', marginBottom: '10px' }}>
              ➕ Ajouter un point de passage / jalon horodaté à l&apos;historique
            </span>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
              <input
                type="text"
                className="admin-input"
                value={newCheckpointTitle}
                onChange={(e) => setNewCheckpointTitle(e.target.value)}
                placeholder="Événement (ex: Passage carrefour Akpakpa)"
                style={{ borderRadius: '10px', padding: '8px 12px', fontSize: '12px' }}
              />
              <input
                type="text"
                className="admin-input"
                value={newCheckpointLocation}
                onChange={(e) => setNewCheckpointLocation(e.target.value)}
                placeholder="Lieu (ex: Cotonou)"
                style={{ borderRadius: '10px', padding: '8px 12px', fontSize: '12px' }}
              />
              <button
                type="button"
                onClick={() => {
                  if (!newCheckpointTitle.trim()) return;
                  const nowStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                  store.addTrackingCheckpoint(order.id, {
                    title: newCheckpointTitle.trim(),
                    location: newCheckpointLocation.trim() || trackingLocation || 'En transit',
                    timestamp: nowStr,
                    description: 'Point de contrôle validé par le centre logistique Aymard Store.',
                    status: 'COMPLETED'
                  });
                  setNewCheckpointTitle('');
                  setNewCheckpointLocation('');
                  showToast("Jalon horodaté ajouté à l'historique !");
                }}
                className="admin-btn admin-btn-primary admin-btn-sm"
                style={{ borderRadius: '10px', padding: '8px 14px', whiteSpace: 'nowrap', fontWeight: 700 }}
              >
                + Ajouter
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid var(--adm-card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0,0,0,0.02)'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-outline"
            style={{ borderRadius: '12px', padding: '10px 20px', fontWeight: 700 }}
          >
            Annuler
          </button>

          <button
            type="button"
            onClick={() => {
              const newStatus: 'PENDING' | 'SHIPPED' | 'DELIVERED' = trackingStep === 4 ? 'DELIVERED' : trackingStep >= 3 ? 'SHIPPED' : 'PENDING';
              store.updateOrderTracking(order.id, {
                trackingStep,
                currentLocation: trackingLocation,
                trackingStatusText,
                carrierName,
                carrierPhone,
                trackingNumber,
                estimatedDeliveryDate,
                status: newStatus
              });
              store.updateOrderStatus(order.id, newStatus);
              onClose();
              showToast(`🚀 Suivi en direct synchronisé avec succès pour la commande ${order.orderNumber} !`);
            }}
            className="admin-btn admin-btn-primary"
            style={{
              borderRadius: '12px',
              padding: '10px 24px',
              fontWeight: 800,
              background: '#0284c7',
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
            }}
          >
            💾 Enregistrer &amp; Afficher chez le Client
          </button>
        </div>

      </div>
    </div>
  );
};

'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';

interface AbandonedTabProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const AbandonedTab: React.FC<AbandonedTabProps> = ({ showToast }) => {
  const { 
    abandonedCheckouts, 
    exchangeRate, 
    addAbandonedCheckout, 
    clearRecoveredCheckouts, 
    updateAbandonedCheckout, 
    deleteAbandonedCheckout 
  } = useAppStore();

  const [abandonedStatusFilter, setAbandonedStatusFilter] = useState<'ALL' | 'PAYMENT_FAILED' | 'ABANDONED' | 'RECOVERED'>('ALL');
  const [abandonedSearch, setAbandonedSearch] = useState('');

  const list = abandonedCheckouts || [];
  const totalAbandoned = list.length;
  const failedPayments = list.filter(a => a.status === 'PAYMENT_FAILED').length;
  const recovered = list.filter(a => a.status === 'RECOVERED').length;
  const potentialRevenueEur = list
    .filter(a => a.status !== 'RECOVERED')
    .reduce((sum, a) => sum + (a.currency === 'EUR' ? a.totalAmount : a.totalAmount / (exchangeRate || 655.957)), 0);
  const potentialRevenueFcfa = Math.round(potentialRevenueEur * (exchangeRate || 655.957));
  const recoveryRate = totalAbandoned > 0 ? Math.round((recovered / totalAbandoned) * 100) : 0;

  const filteredList = list.filter(item => {
    const matchStatus = abandonedStatusFilter === 'ALL' || item.status === abandonedStatusFilter;
    const q = abandonedSearch.toLowerCase().trim();
    const matchSearch = !q ||
      item.customerName.toLowerCase().includes(q) ||
      item.customerPhone.toLowerCase().includes(q) ||
      (item.customerEmail && item.customerEmail.toLowerCase().includes(q)) ||
      (item.city && item.city.toLowerCase().includes(q)) ||
      item.product.name.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: '1200px' }}>
      {/* Header */}
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#ef4444' }}>
              COMMERCE &amp; CONVERSION
            </span>
            <h1 style={{ fontSize: '30px', fontWeight: 900, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              🛒 Relance des Abandons &amp; Paniers Perdus
            </h1>
            <p style={{ fontSize: '13.5px', color: 'var(--adm-text-m)', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
              Retrouvez les coordonnées (WhatsApp, Téléphone, Email) des clients ayant abandonné le guichet de paiement ou dont la transaction a échoué. Relancez-les en 1-clic pour convertir vos ventes.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => {
                addAbandonedCheckout({
                  customerName: 'Akim Dossou',
                  customerPhone: '+22997123456',
                  customerEmail: 'akim.dossou@gmail.com',
                  city: 'Cotonou',
                  country: 'Bénin',
                  product: {
                    id: 'prod-test',
                    name: 'Nike Dunk Low Retro Panda',
                    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&q=80',
                    size: '42',
                    price: 65000,
                    currency: 'FCFA',
                    quantity: 1,
                  },
                  totalAmount: 65000,
                  currency: 'FCFA',
                  status: 'PAYMENT_FAILED',
                  step: 'PAYMENT_FAILED',
                  failureReason: 'Paiement interrompu au guichet Mobile Money',
                });
                showToast('Panier abandonné de test créé ! Vous pouvez tester la relance WhatsApp.', 'success');
              }}
              className="admin-btn admin-btn-outline"
              style={{ borderRadius: '20px', padding: '10px 18px', fontSize: '12px', fontWeight: 700 }}
            >
              🧪 Créer un panier test
            </button>
            {recovered > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Voulez-vous archiver et nettoyer les abandons déjà récupérés ?')) {
                    clearRecoveredCheckouts();
                    showToast('Abandons récupérés archivés avec succès.');
                  }
                }}
                className="admin-btn admin-btn-outline"
                style={{ borderRadius: '20px', padding: '10px 18px', fontSize: '12px', fontWeight: 700 }}
              >
                🧹 Nettoyer les récupérés
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="admin-card" style={{ padding: '20px 24px', borderRadius: '20px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)', display: 'block', marginBottom: '4px' }}>
            Total Abandons Détectés
          </span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)' }}>
            {totalAbandoned}
          </div>
          <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, marginTop: '4px', display: 'block' }}>
            dont {failedPayments} échecs de paiement
          </span>
        </div>

        <div className="admin-card" style={{ padding: '20px 24px', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.04)' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', display: 'block', marginBottom: '4px' }}>
            CA Potentiel Récupérable
          </span>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#d97706', fontFamily: 'var(--font-plus-jakarta)' }}>
            {potentialRevenueFcfa.toLocaleString('fr-FR')} FCFA
          </div>
          <span style={{ fontSize: '12px', color: 'var(--adm-text-m)', fontWeight: 600, marginTop: '2px', display: 'block' }}>
            soit {potentialRevenueEur.toFixed(2)} €
          </span>
        </div>

        <div className="admin-card" style={{ padding: '20px 24px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.04)' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', display: 'block', marginBottom: '4px' }}>
            Ventes Récupérées
          </span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', fontFamily: 'var(--font-plus-jakarta)' }}>
            {recovered}
          </div>
          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginTop: '4px', display: 'block' }}>
            Taux de succès : {recoveryRate}%
          </span>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `Tous (${list.length})` },
            { id: 'PAYMENT_FAILED', label: `🔴 Paiement Échoué (${failedPayments})` },
            { id: 'ABANDONED', label: `🟡 Guichet Fermé (${list.filter(a => a.status === 'ABANDONED').length})` },
            { id: 'RECOVERED', label: `🟢 Vente Conclue (${recovered})` },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setAbandonedStatusFilter(f.id as any)}
              style={{
                padding: '8px 16px',
                borderRadius: '20px',
                border: abandonedStatusFilter === f.id ? '1.5px solid #0284c7' : '1px solid var(--adm-card-border)',
                background: abandonedStatusFilter === f.id ? '#0284c7' : 'var(--adm-card-bg)',
                color: abandonedStatusFilter === f.id ? '#ffffff' : 'var(--adm-text-h)',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '280px' }}>
          <input
            type="text"
            placeholder="Rechercher par nom, tél, sneaker..."
            value={abandonedSearch}
            onChange={e => setAbandonedSearch(e.target.value)}
            className="admin-input"
            style={{ width: '100%', borderRadius: '20px', padding: '8px 14px 8px 34px', fontSize: '12.5px' }}
          />
          <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--adm-text-m)' }}>
            🔍
          </span>
        </div>
      </div>

      {/* Abandoned List Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '20px', border: '1px solid var(--adm-card-border)' }}>
        {filteredList.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-m)' }}>
            <span style={{ fontSize: '42px', display: 'block', marginBottom: '10px' }}>🎉</span>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '0 0 4px 0' }}>
              Aucun abandon en attente de relance
            </h4>
            <p style={{ fontSize: '13px', margin: '0 0 16px 0' }}>
              Tous vos prospects ont finalisé leurs achats ou ont déjà été relancés avec succès.
            </p>
            <button
              type="button"
              onClick={() => {
                addAbandonedCheckout({
                  customerName: 'Akim Dossou',
                  customerPhone: '+22997123456',
                  customerEmail: 'akim.dossou@gmail.com',
                  city: 'Cotonou',
                  country: 'Bénin',
                  product: {
                    id: 'prod-test',
                    name: 'Nike Dunk Low Retro Panda',
                    image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=200&q=80',
                    size: '42',
                    price: 65000,
                    currency: 'FCFA',
                    quantity: 1,
                  },
                  totalAmount: 65000,
                  currency: 'FCFA',
                  status: 'PAYMENT_FAILED',
                  step: 'PAYMENT_FAILED',
                  failureReason: 'Paiement interrompu au guichet Mobile Money',
                });
                showToast('Panier abandonné de test créé ! Regardez le tableau ci-dessous.', 'success');
              }}
              className="admin-btn admin-btn-outline"
              style={{ borderRadius: '20px', padding: '10px 20px', fontSize: '13px', fontWeight: 800, color: '#0284c7', borderColor: '#0284c7' }}
            >
              🧪 Créer un panier test pour voir le bouton WhatsApp
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--adm-table-stripe)', borderBottom: '1px solid var(--adm-card-border)', textAlign: 'left' }}>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Date &amp; Heure</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Client &amp; Contact</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Sneaker / Modèle</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Montant</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Statut / Motif</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800, textAlign: 'right' }}>Relance 1-Clic WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.map(item => {
                  const prod = item.product;
                  const cleanPhone = (item.customerPhone || '').replace(/[^0-9]/g, '');
                  const customerFirstName = item.customerName.split(' ')[0] || 'Cher Client';
                  const productName = prod?.name || 'votre sneaker';
                  const sizeInfo = prod?.size ? ` (Taille ${prod.size})` : '';

                  const waMsg = `Bonjour ${customerFirstName} ! C'est l'équipe Aymard Store. 👟\n\nNous avons remarqué que vous n'avez pas pu finaliser votre commande pour la paire ${productName}${sizeInfo}.\n\nAvez-vous rencontré une difficulté lors du paiement Mobile Money / Carte ? Nous sommes à votre entière disposition pour vous assister ou vous réserver votre pointure dès maintenant !`;

                  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;

                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                      {/* Date */}
                      <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--adm-text-m)', whiteSpace: 'nowrap' }}>
                        <div>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : 'Récemment'}</div>
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', opacity: 0.8 }}>
                          {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </td>

                      {/* Customer Info */}
                      <td style={{ padding: '14px 18px' }}>
                        <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)', display: 'block' }}>
                          {item.customerName}
                        </strong>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '12px' }}>
                          <span style={{ color: '#16a34a', fontWeight: 700 }}>💬 {item.customerPhone}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', display: 'block' }}>
                          📍 {item.city || 'Cotonou'} {item.country ? `(${item.country})` : ''}
                        </span>
                      </td>

                      {/* Product */}
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {prod?.image ? (
                            <img
                              src={prod.image}
                              alt={prod.name}
                              style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain', background: '#f8fafc' }}
                            />
                          ) : (
                            <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(2,132,199,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              👟
                            </div>
                          )}
                          <div>
                            <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block' }}>
                              {prod?.name}
                            </strong>
                            <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                              Pointure : <strong>{prod?.size || 'Standard'}</strong> • Qté : {prod?.quantity || 1}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Amount */}
                      <td style={{ padding: '14px 18px' }}>
                        <strong style={{ fontSize: '14px', fontWeight: 800, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)', display: 'block' }}>
                          {item.currency === 'FCFA' ? `${item.totalAmount.toLocaleString('fr-FR')} FCFA` : `${item.totalAmount.toFixed(2)} €`}
                        </strong>
                        {item.discountCode && (
                          <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: '6px', display: 'inline-block', marginTop: '2px' }}>
                            🏷️ {item.discountCode}
                          </span>
                        )}
                      </td>

                      {/* Status & Reason */}
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 10px',
                          borderRadius: '12px',
                          display: 'inline-block',
                          background: item.status === 'RECOVERED' ? 'rgba(16,185,129,0.12)' : item.status === 'PAYMENT_FAILED' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                          color: item.status === 'RECOVERED' ? '#10b981' : item.status === 'PAYMENT_FAILED' ? '#ef4444' : '#d97706'
                        }}>
                          {item.status === 'RECOVERED' ? '✓ Vente Conclue' : item.status === 'PAYMENT_FAILED' ? '🔴 Paiement Échoué' : '🟡 Abandon Formulaire'}
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', display: 'block', marginTop: '3px' }}>
                          {item.failureReason || 'Guichet fermé avant confirmation'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                          {cleanPhone && (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={() => {
                                updateAbandonedCheckout(item.id, { 
                                  recoveryAttempts: (item.recoveryAttempts || 0) + 1, 
                                  lastContactedAt: new Date().toISOString() 
                                });
                              }}
                              style={{
                                background: '#25d366',
                                color: '#ffffff',
                                padding: '7px 14px',
                                borderRadius: '12px',
                                fontSize: '12px',
                                fontWeight: 800,
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                              }}
                              title="Ouvrir WhatsApp avec message personnalisé"
                            >
                              <span>💬</span>
                              <span>Relancer ({item.recoveryAttempts || 0})</span>
                            </a>
                          )}

                          {item.status !== 'RECOVERED' && (
                            <button
                              type="button"
                              onClick={() => {
                                updateAbandonedCheckout(item.id, { status: 'RECOVERED' });
                                showToast(`🎉 Abandon marqué comme récupéré pour ${item.customerName} !`);
                              }}
                              className="admin-btn admin-btn-outline admin-btn-sm"
                              style={{ borderRadius: '10px', fontSize: '11px', fontWeight: 700, color: '#10b981', borderColor: 'rgba(16,185,129,0.4)' }}
                              title="Marquer comme vente conclue"
                            >
                              ✓ Conclu
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Supprimer l'enregistrement d'abandon de ${item.customerName} ?`)) {
                                deleteAbandonedCheckout(item.id);
                                showToast('Abandon supprimé');
                              }
                            }}
                            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', fontSize: '13px' }}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

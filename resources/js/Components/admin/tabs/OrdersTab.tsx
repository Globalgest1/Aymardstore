'use client';

import React, { useState } from 'react';
import { useAppStore, Order, formatPrice, convertPrice } from '@/lib/store';
import { Badge, EmptyState } from '../ui';

interface OrdersTabProps {
  openTrackingManager: (order: Order) => void;
  showToast: (msg: string) => void;
}

export const OrdersTab: React.FC<OrdersTabProps> = ({ openTrackingManager, showToast }) => {
  const { orders, currency, updateOrderStatus, updateOrderTracking } = useAppStore();
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING' | 'SHIPPED' | 'DELIVERED'>('ALL');
  const [orderPage, setOrderPage] = useState(1);

  const filteredOrders = orders.filter(o => orderFilter === 'ALL' || o.status === orderFilter);
  const totalAmount = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Card */}
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0ea5e9' }}>
              COMMERCE & LIVRAISON
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Commandes clients
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
              Suivez en temps réel le traitement des commandes, leur paiement et leur expédition.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, background: 'rgba(14,165,233,0.12)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.3)', padding: '8px 20px', borderRadius: '30px' }}>
              Volume : {totalAmount.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
          {(['ALL', 'PENDING', 'SHIPPED', 'DELIVERED'] as const).map(f => (
            <button 
              key={f} 
              className={`admin-btn ${orderFilter === f ? 'admin-btn-primary' : 'admin-btn-outline'}`} 
              onClick={() => { setOrderFilter(f); setOrderPage(1); }}
              style={{ borderRadius: '30px', padding: '8px 20px', fontSize: '13px', fontWeight: 700 }}
            >
              {f === 'ALL' ? `Toutes (${orders.length})` : 
               f === 'PENDING' ? `⏳ En attente (${orders.filter(o => o.status === 'PENDING').length})` : 
               f === 'SHIPPED' ? `📦 Expédiées (${orders.filter(o => o.status === 'SHIPPED').length})` : 
               `✅ Livrées (${orders.filter(o => o.status === 'DELIVERED').length})`}
            </button>
          ))}
        </div>
      </div>

      {/* Table Container Card */}
      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>N° Commande</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Client & Ville</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Date</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Total</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Localisation & Statut Colis</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Supervision / Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.slice((orderPage - 1) * 15, orderPage * 15).map(o => (
                <tr key={o.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <td style={{ padding: '16px', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-plus-jakarta)' }}>
                    <div>{o.orderNumber}</div>
                    {o.trackingNumber && (
                      <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', fontWeight: 600, marginTop: '2px' }}>
                        Suivi : {o.trackingNumber}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--adm-text-h)' }}>{o.shippingAddress?.fullName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                      📍 {o.shippingAddress?.city || 'Cotonou'} ({o.shippingAddress?.country || 'Bénin'})
                    </div>
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{o.date}</td>
                  <td style={{ padding: '16px', fontWeight: 800, fontSize: '14px', color: 'var(--adm-text-h)' }}>
                    {formatPrice(convertPrice(o.total, currency), currency)}
                  </td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                      <Badge status={o.status} />
                      <span style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: o.status === 'DELIVERED' ? 'rgba(34,197,94,0.12)' : 'rgba(14,165,233,0.12)',
                        color: o.status === 'DELIVERED' ? '#15803d' : '#0369a1',
                        padding: '3px 9px',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        maxWidth: '220px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}>
                        <span>📍</span>
                        <span>{o.currentLocation || (o.status === 'DELIVERED' ? 'Remis au client' : o.status === 'SHIPPED' ? 'En cours d\'acheminement' : 'Entrepôt Cotonou (Haie Vive)')}</span>
                      </span>
                    </div>
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => openTrackingManager(o)}
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        style={{
                          borderRadius: '10px',
                          padding: '6px 12px',
                          fontSize: '12px',
                          fontWeight: 700,
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          background: '#0284c7',
                          color: '#ffffff',
                          boxShadow: '0 2px 8px rgba(2,132,199,0.3)'
                        }}
                        title="Gérer la localisation et l'étape de livraison affichée au client"
                      >
                        <span>🛰️</span>
                        <span>Suivi Direct</span>
                      </button>

                      <select 
                        className="admin-select" 
                        style={{ width: 120, padding: '6px 8px', borderRadius: '10px', fontSize: '11.5px' }} 
                        value={o.status} 
                        onChange={e => { 
                          const newStat = e.target.value as 'PENDING' | 'SHIPPED' | 'DELIVERED';
                          updateOrderStatus(o.id, newStat);
                          updateOrderTracking(o.id, {
                            trackingStep: newStat === 'DELIVERED' ? 4 : newStat === 'SHIPPED' ? 3 : 2,
                            status: newStat
                          });
                          showToast('Statut de commande & suivi actualisés'); 
                        }}
                      >
                        <option value="PENDING">En attente</option>
                        <option value="SHIPPED">Expédiée</option>
                        <option value="DELIVERED">Livrée</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && <EmptyState icon="🛒" text="Aucune commande enregistrée" />}
        </div>

        {/* Orders pagination controls */}
        {filteredOrders.length > 15 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--adm-card-border)', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
              Commandes {(orderPage - 1) * 15 + 1} à {Math.min(orderPage * 15, filteredOrders.length)} sur {filteredOrders.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button 
                onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                disabled={orderPage === 1}
                className="admin-btn admin-btn-outline admin-btn-sm"
                style={{ borderRadius: 8, opacity: orderPage === 1 ? 0.4 : 1 }}
              >
                ◀ Précédent
              </button>
              <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-h)', background: 'rgba(56,189,248,0.1)', borderRadius: 8 }}>
                {orderPage} / {Math.ceil(filteredOrders.length / 15)}
              </span>
              <button 
                onClick={() => setOrderPage(p => Math.min(Math.ceil(filteredOrders.length / 15), p + 1))}
                disabled={orderPage >= Math.ceil(filteredOrders.length / 15)}
                className="admin-btn admin-btn-outline admin-btn-sm"
                style={{ borderRadius: 8, opacity: orderPage >= Math.ceil(filteredOrders.length / 15) ? 0.4 : 1 }}
              >
                Suivant ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

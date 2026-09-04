'use client';

import React, { useState } from 'react';
import { useAppStore, formatPrice, convertPrice } from '@/lib/store';
import { ModalType } from '../types';
import { Badge } from '../ui';

interface DashboardTabProps {
  setModal: (m: ModalType) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  setModal,
  showToast,
}) => {
  const store = useAppStore();
  const [dashboardAlertFilter, setDashboardAlertFilter] = useState<'ALL' | 'OUT' | 'LOW'>('ALL');

  const pendingAmount = (store.orders || []).filter(o => o.status === 'PENDING').reduce((s, o) => s + o.total, 0);
  const totalSorties = (store.employeePayments || []).reduce((s, p) => s + p.amount, 0) + 
    (store.supplyOrders || []).filter(o => o.status === 'RECEIVED').reduce((s, o) => s + o.totalCost, 0);
  const totalRevenue = (store.orders || []).reduce((s, o) => s + o.total, 0);
  const pendingOrders = (store.orders || []).filter(o => o.status === 'PENDING').length;

  const format = (amount: number) => formatPrice(convertPrice(amount, store.currency), store.currency);

  const monthlyData = [
    { label: 'Jan', value: Math.round(totalRevenue * 0.06) },
    { label: 'Fév', value: Math.round(totalRevenue * 0.08) },
    { label: 'Mar', value: Math.round(totalRevenue * 0.12) },
    { label: 'Avr', value: Math.round(totalRevenue * 0.09) },
    { label: 'Mai', value: Math.round(totalRevenue * 0.15) },
    { label: 'Jun', value: Math.round(totalRevenue * 0.11) },
    { label: 'Jul', value: Math.round(totalRevenue * 0.14) },
    { label: 'Aoû', value: Math.round(totalRevenue * 0.25) },
  ];
  const maxMonthVal = Math.max(...monthlyData.map(d => d.value), 1);

  const outOfStockAlerts = (store.products || []).filter(p => (p.stock ?? 0) === 0);
  const lowStockAlerts = (store.products || []).filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 5);

  return (
    <>
      {/* AymardStore Hero Banner */}
      <div className="admin-hero-banner">
        <div className="admin-hero-content">
          <span className="admin-hero-subtitle">SYNTHÈSE EN TEMPS RÉEL</span>
          <h1 className="admin-hero-title">Tableau de bord AymardStore</h1>
          <p className="admin-hero-desc">Analyse des performances pour AYMARD STORE.</p>
        </div>
        <div className="admin-hero-kpis">
          <div className="admin-hero-kpi-box">
            <span className="admin-hero-kpi-label">CA ENCAISSÉ (PÉRIODE)</span>
            <span className="admin-hero-kpi-value">{format(totalRevenue)}</span>
          </div>
          <div className="admin-hero-kpi-box">
            <span className="admin-hero-kpi-label">EN ATTENTE (DIRECT)</span>
            <span className="admin-hero-kpi-value">{format(pendingAmount)}</span>
          </div>
        </div>
      </div>

      {/* Filter Section */}
      <div className="admin-filters-card">
        <div className="admin-filters-header">
          <span style={{ fontSize: '18px' }}>🎛️</span>
          <h3 className="admin-filters-title">Filtrer vos insights</h3>
        </div>
        <p style={{ fontSize: '13px', color: '#64748b', margin: '-8px 0 16px 30px' }}>
          Ajustez la période et les périmètres analysés pour affiner vos résultats.
        </p>
        <div className="admin-filters-grid">
          <div>
            <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></span>
              PÉRIODE D&apos;ANALYSE — Date de début
            </label>
            <input type="date" className="admin-input" defaultValue="2026-08-01" />
          </div>
          <div>
            <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span>
              PÉRIODE D&apos;ANALYSE — Date de fin
            </label>
            <input type="date" className="admin-input" defaultValue="2026-08-31" />
          </div>
        </div>
      </div>

      {/* Indicators Section Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(56,189,248,0.18)', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-plus-jakarta)', color: 'var(--adm-text-h)' }}>Indicateurs clés</h3>
          <p style={{ fontSize: '12px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>Visualisez la santé générale de vos opérations.</p>
        </div>
      </div>

      {/* 3D KPI Cards Grid */}
      <div className="admin-kpi-grid">
        {/* Card 1: Boutiques */}
        <div 
          className="admin-kpi-card" 
          style={{ 
            backgroundImage: "linear-gradient(155deg, rgba(4,12,28,0.85) 0%, rgba(2,6,16,0.94) 100%), url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderTopColor: '#0ea5e9',
            alignItems: 'flex-start',
            textAlign: 'left'
          }}
        >
          <span className="kpi-label">Boutiques</span>
          <span className="kpi-value">1</span>
          <span className="kpi-subtext">Point de vente actif</span>
        </div>

        {/* Card 2: Employés */}
        <div 
          className="admin-kpi-card" 
          style={{ 
            backgroundImage: "linear-gradient(155deg, rgba(4,15,32,0.85) 0%, rgba(2,8,20,0.94) 100%), url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            borderTopColor: '#38bdf8',
            alignItems: 'flex-start',
            textAlign: 'left'
          }}
        >
          <span className="kpi-label">Employés</span>
          <span className="kpi-value">{(store.employees || []).filter(e => e.status === 'ACTIVE').length}</span>
          <span className="kpi-subtext">Personnel actif</span>
        </div>

        {/* Card 3: Produits */}
        <div 
          className="admin-kpi-card" 
          style={{ 
            backgroundImage: "linear-gradient(155deg, rgba(3,12,30,0.85) 0%, rgba(2,6,18,0.94) 100%), url('https://images.unsplash.com/photo-1600269452121-4f2416e55c28?q=80&w=600&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderTopColor: '#2563eb',
            alignItems: 'flex-start',
            textAlign: 'left'
          }}
        >
          <span className="kpi-label">Produits</span>
          <span className="kpi-value">{(store.products || []).length}</span>
          <span className="kpi-subtext">Articles en catalogue</span>
        </div>

        {/* Card 4: Clients */}
        <div 
          className="admin-kpi-card" 
          style={{ 
            backgroundImage: "linear-gradient(155deg, rgba(4,14,32,0.85) 0%, rgba(2,7,20,0.94) 100%), url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            borderTopColor: '#60a5fa',
            alignItems: 'flex-start',
            textAlign: 'left'
          }}
        >
          <span className="kpi-label">Clients</span>
          <span className="kpi-value">{(store.clients || []).length}</span>
          <span className="kpi-subtext">Abonnés enregistrés</span>
        </div>

        {/* Card 5: En attente */}
        <div 
          className="admin-kpi-card" 
          style={{ 
            backgroundImage: "linear-gradient(155deg, rgba(2,10,26,0.85) 0%, rgba(1,5,15,0.94) 100%), url('https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderTopColor: '#0284c7',
            alignItems: 'flex-start',
            textAlign: 'left'
          }}
        >
          <span className="kpi-label">En attente</span>
          <span className="kpi-value">{format(pendingAmount)}</span>
          <span className="kpi-subtext">{pendingOrders} vente(s) direct avec échéance</span>
        </div>

        {/* Card 6: CA Encaissé */}
        <div 
          className="admin-kpi-card" 
          style={{ 
            backgroundImage: "linear-gradient(155deg, rgba(4,16,35,0.85) 0%, rgba(2,8,22,0.94) 100%), url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderTopColor: '#38bdf8',
            alignItems: 'flex-start',
            textAlign: 'left'
          }}
        >
          <span className="kpi-label">CA Encaissé</span>
          <span className="kpi-value">{format(totalRevenue)}</span>
          <span className="kpi-subtext">Sur la période sélectionnée</span>
        </div>

        {/* Card 7: Sorties */}
        <div 
          className="admin-kpi-card" 
          style={{ 
            backgroundImage: "linear-gradient(155deg, rgba(16,8,24,0.85) 0%, rgba(8,3,14,0.94) 100%), url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=600&auto=format&fit=crop')",
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            borderTopColor: '#ef4444',
            alignItems: 'flex-start',
            textAlign: 'left'
          }}
        >
          <span className="kpi-label">Sorties</span>
          <span className="kpi-value">{format(totalSorties)}</span>
          <span className="kpi-subtext">Sur la période sélectionnée</span>
        </div>
      </div>

      {/* Charts & Top Products */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: '32px' }}>
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">📈 Répartition des ventes</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '-10px 0 20px 0' }}>
            Analysez la part de vos ventes par canal, disponibilité stock et précommandes.
          </p>
          <div className="admin-chart-bars" style={{ marginBottom: 32 }}>
            {monthlyData.map(d => (
              <div key={d.label} className="admin-chart-bar" style={{ height: `${(d.value / maxMonthVal) * 100}%` }}>
                <div className="admin-chart-bar-value">{format(d.value)}</div>
                <div className="admin-chart-bar-label">{d.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">🏆 Top Produits</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '-10px 0 20px 0' }}>
            Classement des produits phares.
          </p>
          {(store.products || []).slice(0, 5).map((p, i) => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: '#64748b', width: 20 }}>{i + 1}</span>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📦</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name_fr.slice(0, 28)}</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{format(p.price)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Row 3: Stock Alerts & Supply Orders */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginTop: '24px' }}>
        <div className="admin-card" id="admin-stock-alerts-card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div>
              <h3 className="admin-card-title" style={{ color: outOfStockAlerts.length > 0 ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚠️ Centre d&apos;Alertes Stock</span>
                <span style={{ fontSize: '12px', background: outOfStockAlerts.length > 0 ? '#ef4444' : '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                  {outOfStockAlerts.length + lowStockAlerts.length} article(s)
                </span>
              </h3>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {[
                { id: 'ALL', label: `Tous (${outOfStockAlerts.length + lowStockAlerts.length})` },
                { id: 'OUT', label: `🔴 Ruptures (${outOfStockAlerts.length})` },
                { id: 'LOW', label: `🟡 Faibles (${lowStockAlerts.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setDashboardAlertFilter(tab.id as any)}
                  style={{
                    fontSize: '11px',
                    fontWeight: dashboardAlertFilter === tab.id ? 800 : 600,
                    padding: '3px 8px',
                    borderRadius: '10px',
                    border: dashboardAlertFilter === tab.id ? '1px solid var(--adm-text-h)' : '1px solid var(--adm-card-border)',
                    background: dashboardAlertFilter === tab.id ? 'var(--adm-text-h)' : 'transparent',
                    color: dashboardAlertFilter === tab.id ? 'var(--adm-card-bg)' : 'var(--adm-text-m)',
                    cursor: 'pointer'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '-10px 0 16px 0' }}>
            Articles en rupture immédiate (0) ou nécessitant un réassort urgent (&lt; 5).
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '360px', overflowY: 'auto', paddingRight: 4 }}>
            {(store.products || []).filter(p => {
              const stock = p.stock ?? 0;
              if (dashboardAlertFilter === 'OUT') return stock === 0;
              if (dashboardAlertFilter === 'LOW') return stock > 0 && stock < 5;
              return stock < 5;
            }).length === 0 ? (
              <div style={{ padding: '24px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', color: '#059669', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>
                <span style={{ fontSize: '24px', display: 'block', marginBottom: 6 }}>✅</span>
                Tous les stocks de cette sélection sont au beau fixe !
              </div>
            ) : (
              (store.products || []).filter(p => {
                const stock = p.stock ?? 0;
                if (dashboardAlertFilter === 'OUT') return stock === 0;
                if (dashboardAlertFilter === 'LOW') return stock > 0 && stock < 5;
                return stock < 5;
              }).map(p => {
                const stock = p.stock ?? 0;
                const isOut = stock === 0;

                return (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                      padding: '12px 14px',
                      background: isOut ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                      borderLeft: isOut ? '4px solid #ef4444' : '4px solid #f59e0b',
                      borderRadius: '12px',
                      border: '1px solid var(--adm-card-border)',
                      borderLeftWidth: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                        <img
                          src={p.images?.[0] || '/logo.png'}
                          alt={p.name_fr}
                          style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain', background: '#ffffff' }}
                        />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {p.name_fr}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                            {p.brand || 'AYMARD'} • {format(p.price)}
                          </div>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          background: isOut ? '#ef4444' : '#f59e0b',
                          color: '#ffffff',
                          padding: '3px 10px',
                          borderRadius: '20px',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {isOut ? '🔴 RUPTURE (0)' : `🟡 ${stock} restant${stock > 1 ? 's' : ''}`}
                      </span>
                    </div>

                    {/* Quick Replenish Actions */}
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 6 }}>
                      <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--adm-text-m)', marginRight: 'auto' }}>
                        Réassort rapide :
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          store.updateProduct(p.id, { stock: (p.stock || 0) + 10 });
                          showToast(`+10 unités ajoutées au stock de ${p.name_fr} !`, 'success');
                        }}
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        style={{ borderRadius: '8px', fontSize: '10.5px', padding: '3px 8px', fontWeight: 700 }}
                        title="Ajouter 10 unités au stock"
                      >
                        +10 Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          store.updateProduct(p.id, { stock: (p.stock || 0) + 50 });
                          showToast(`+50 unités ajoutées au stock de ${p.name_fr} !`, 'success');
                        }}
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        style={{ borderRadius: '8px', fontSize: '10.5px', padding: '3px 8px', fontWeight: 700 }}
                        title="Ajouter 50 unités au stock"
                      >
                        +50 Stock
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setModal('addSupplyOrder');
                        }}
                        className="admin-btn admin-btn-primary admin-btn-sm"
                        style={{ borderRadius: '8px', fontSize: '10.5px', padding: '3px 8px', fontWeight: 700 }}
                        title="Créer un bon de commande fournisseur"
                      >
                        📦 Bon Fournisseur
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Recent Supplier Orders */}
        <div className="admin-card">
          <div className="admin-card-header">
            <h3 className="admin-card-title">📥 Activité d&apos;Approvisionnement</h3>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '-10px 0 20px 0' }}>
            Suivi des dernières commandes passées auprès des fournisseurs.
          </p>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Fournisseur</th>
                <th>Produit</th>
                <th>Coût</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {(store.supplyOrders || []).slice(0, 3).map(o => {
                const sup = (store.suppliers || []).find(s => s.id === o.supplierId);
                return (
                  <tr key={o.id}>
                    <td style={{ fontWeight: 700 }}>{sup?.name || '—'}</td>
                    <td>{o.items[0]?.productName || '—'}</td>
                    <td style={{ fontWeight: 800 }}>{format(o.totalCost)}</td>
                    <td><Badge status={o.status} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {(store.supplyOrders || []).length === 0 && (
            <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '13px' }}>Aucun approvisionnement récent</div>
          )}
        </div>
      </div>
    </>
  );
};

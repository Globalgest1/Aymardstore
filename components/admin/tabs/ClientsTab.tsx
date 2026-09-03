'use client';

import React from 'react';
import { useAppStore, Client, formatPrice, convertPrice, calculatePointsEarned, generateReferralCode } from '@/lib/store';
import { ModalType } from '../types';
import { EmptyState } from '../ui';

interface ClientsTabProps {
  onOpenModal: (type: ModalType) => void;
  setAuditClient: (client: Client | null) => void;
  setGrantBonusPointsClient: (client: Client | null) => void;
  setBonusPointsInput: (pts: number) => void;
  setBonusPointsReason: (reason: string) => void;
  showToast: (msg: string) => void;
}

export const ClientsTab: React.FC<ClientsTabProps> = ({
  onOpenModal,
  setAuditClient,
  setGrantBonusPointsClient,
  setBonusPointsInput,
  setBonusPointsReason,
  showToast,
}) => {
  const { clients, currency, toggleClientVip, deleteClient } = useAppStore();

  const vipCount = clients.filter(c => c.totalOrders >= 100 || c.isVipOverride).length;
  const totalGrantedPerks = clients.reduce((acc, c) => acc + (c.customPerks?.length || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header Card */}
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#f59e0b' }}>
              GESTION CLIENTÈLE &amp; CLUB VIP
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Base Clients, Statut VIP &amp; Privilèges
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
              Règle officielle : le statut VIP se débloque automatiquement dès <strong>100 commandes passées</strong>. Vous pouvez également surclasser un client manuellement ou lui attribuer des cadeaux &amp; points fidélité personnalisés.
            </p>
          </div>
          <button 
            className="admin-btn admin-btn-primary" 
            onClick={() => onOpenModal('addClient')} 
            style={{ borderRadius: '30px', padding: '12px 24px', fontSize: '14px', fontWeight: 700 }}
          >
            + Ajouter un Client
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="admin-card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--adm-text-m)' }}>Clients Enregistrés</span>
          <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--adm-text-h)', marginTop: 4 }}>{clients.length}</div>
        </div>
        <div className="admin-card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#f59e0b' }}>Membres VIP (100+ cmd ou surclassés)</span>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#f59e0b', marginTop: 4 }}>{vipCount}</div>
        </div>
        <div className="admin-card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#10b981' }}>Cadeaux &amp; Privilèges Distribués</span>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981', marginTop: 4 }}>{totalGrantedPerks} accordés</div>
        </div>
        <div className="admin-card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#0284c7' }}>Palier VIP Automatique</span>
          <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', marginTop: 8 }}>100 Commandes</div>
        </div>
      </div>

      {/* Client Management Table */}
      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Client</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Statut VIP</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Score &amp; Points (1€/1000F = 1PT)</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Parrainage &amp; Filleuls</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Total Dépensé</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Audit &amp; Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(c => {
                const isAutoVip = c.totalOrders >= 100;
                const isVip = isAutoVip || Boolean(c.isVipOverride);
                const refCode = c.referralCode || generateReferralCode(c.email, c.name);
                const referralsCount = (clients || []).filter(x => x.referredBy === refCode).length;
                const orderPts = calculatePointsEarned(c.totalSpent, currency);
                const totalPtsEarned = orderPts + (c.bonusPoints || 0) + (c.referralPointsEarned || 0);
                const availablePts = Math.max(0, totalPtsEarned - (c.spentLoyaltyPoints || 0));

                return (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ 
                          width: 38, 
                          height: 38, 
                          borderRadius: '50%', 
                          background: isVip ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #0284c7, #0369a1)', 
                          color: '#fff', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          fontWeight: 800, 
                          fontSize: '13px', 
                          boxShadow: isVip ? '0 0 10px rgba(245,158,11,0.4)' : undefined 
                        }}>
                          {isVip ? '★' : c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ fontWeight: 800, color: 'var(--adm-text-h)' }}>{c.name}</div>
                          <div style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>{c.email} {c.phone ? `· ${c.phone}` : ''}</div>
                        </div>
                      </div>
                    </td>

                    {/* VIP Status */}
                    <td style={{ padding: '16px' }}>
                      {isAutoVip ? (
                        <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(245,158,11,0.15)', color: '#d97706', border: '1px solid #f59e0b', padding: '4px 10px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          ★ VIP (100+ Commandes)
                        </span>
                      ) : c.isVipOverride ? (
                        <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid #8b5cf6', padding: '4px 10px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          👑 VIP Surclassé
                        </span>
                      ) : (
                        <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--adm-card-border)', color: 'var(--adm-text-m)', padding: '4px 10px', borderRadius: '12px' }}>
                          Standard ({c.totalOrders}/100)
                        </span>
                      )}
                    </td>

                    {/* Score & Points */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                          💎 {availablePts} <span style={{ fontSize: 11, color: 'var(--adm-text-m)' }}>Pts actifs</span>
                        </span>
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                          Total acquis: {totalPtsEarned} Pts · {orderPts} (achats) + {c.bonusPoints || 0} (bonus)
                        </span>
                      </div>
                    </td>

                    {/* Parrainage & Filleuls */}
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', fontFamily: 'monospace' }}>
                          {refCode}
                        </span>
                        <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                          👥 {referralsCount} filleul(s) {c.referredBy ? `· Parrainé: ${c.referredBy}` : ''}
                        </span>
                      </div>
                    </td>

                    {/* Total Spent */}
                    <td style={{ padding: '16px', fontWeight: 800, color: '#10b981' }}>
                      {formatPrice(convertPrice(c.totalSpent, currency), currency)}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {/* Audit Button */}
                        <button
                          className="admin-btn admin-btn-sm"
                          onClick={() => setAuditClient(c)}
                          style={{
                            borderRadius: '8px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: 'rgba(2,132,199,0.12)',
                            color: '#0284c7',
                            border: '1px solid rgba(2,132,199,0.3)'
                          }}
                          title="Consulter le journal d'audit complet expliquant le score de ce client"
                        >
                          📜 Audit Points
                        </button>

                        {/* Toggle VIP */}
                        <button
                          className="admin-btn admin-btn-sm"
                          onClick={() => {
                            toggleClientVip(c.id);
                            showToast(c.isVipOverride ? `Statut VIP surclassé retiré pour ${c.name}` : `👑 ${c.name} surclassé en Membre VIP avec succès !`);
                          }}
                          style={{
                            borderRadius: '8px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: c.isVipOverride ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.15)',
                            color: c.isVipOverride ? '#ef4444' : '#d97706',
                            border: c.isVipOverride ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.4)'
                          }}
                          title="Surclasser ou rétrograder le statut VIP de ce client"
                        >
                          {c.isVipOverride ? '👑 Rétrograder' : '👑 VIP'}
                        </button>

                        {/* Grant Bonus Points */}
                        <button
                          className="admin-btn admin-btn-sm"
                          onClick={() => {
                            setGrantBonusPointsClient(c);
                            setBonusPointsInput(100);
                            setBonusPointsReason('');
                          }}
                          style={{
                            borderRadius: '8px',
                            padding: '5px 10px',
                            fontSize: '11px',
                            fontWeight: 800,
                            background: 'rgba(16,185,129,0.12)',
                            color: '#10b981',
                            border: '1px solid rgba(16,185,129,0.3)'
                          }}
                          title="Créditer des points fidélité bonus"
                        >
                          ★ +Pts
                        </button>

                        {/* Delete Client */}
                        <button 
                          className="admin-btn admin-btn-danger admin-btn-sm" 
                          onClick={() => { deleteClient(c.id); showToast('Client supprimé'); }}
                          style={{ borderRadius: '8px', padding: '5px 8px' }}
                          title="Supprimer ce client"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {clients.length === 0 && <EmptyState icon="👥" text="Aucun client enregistré" />}
        </div>
      </div>
    </div>
  );
};

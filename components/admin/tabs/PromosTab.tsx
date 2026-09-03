'use client';

import React from 'react';
import { useAppStore, formatPrice, convertPrice } from '@/lib/store';
import { ModalType } from '../types';

interface PromosTabProps {
  onOpenModal: (type: ModalType) => void;
  showToast: (msg: string) => void;
}

export const PromosTab: React.FC<PromosTabProps> = ({ onOpenModal, showToast }) => {
  const { promoCodes, removePromoCode, currency } = useAppStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#f59e0b' }}>
              MARKETING & OFFRES
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Codes Promo & Notifications
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
              Enregistrez vos réductions, attribuez des codes ciblés à vos clients et envoyez des notifications instantanées.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button 
              className="admin-btn admin-btn-outline" 
              onClick={() => onOpenModal('addBroadcastNotif')} 
              style={{ borderRadius: '30px', padding: '12px 20px', fontSize: '13px', fontWeight: 700 }}
            >
              📢 Diffuser une Notification
            </button>
            <button 
              className="admin-btn admin-btn-primary" 
              onClick={() => onOpenModal('addPromo')} 
              style={{ borderRadius: '30px', padding: '12px 24px', fontSize: '14px', fontWeight: 700 }}
            >
              + Nouveau Code Promo
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {promoCodes.map(p => {
          const isGlobal = !p.target || p.target === 'ALL';
          return (
            <div key={p.code} className="admin-card" style={{ padding: 24, borderRadius: 20, border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-plus-jakarta)', letterSpacing: 1, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 12px', borderRadius: '10px' }}>
                  {p.code}
                </span>
                <button 
                  className="admin-btn admin-btn-danger admin-btn-sm" 
                  onClick={() => { removePromoCode(p.code); showToast('Code supprimé'); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)', marginTop: 8 }}>
                {p.type === 'percent' ? `-${p.value}%` : `-${formatPrice(convertPrice(p.value, currency), currency)}`}
              </div>
              <div style={{ fontSize: 12, color: 'var(--adm-text-m)', fontWeight: 600, marginTop: 4 }}>
                {p.description || (p.type === 'percent' ? 'Remise en pourcentage sur le panier' : 'Réduction forfaitaire immédiate')}
              </div>

              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--adm-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: isGlobal ? 'rgba(16, 185, 129, 0.12)' : 'rgba(2, 132, 199, 0.12)',
                  color: isGlobal ? '#10b981' : '#0284c7'
                }}>
                  {isGlobal ? '🌐 Offre Publique (Tous)' : `👤 Exclusif (${p.targetClientName || p.target})`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

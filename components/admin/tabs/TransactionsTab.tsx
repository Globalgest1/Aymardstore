'use client';

import React from 'react';
import { useAppStore, formatPrice, convertPrice } from '@/lib/store';
import { EmptyState } from '../ui';

export const TransactionsTab: React.FC = () => {
  const { orders, currency } = useAppStore();

  const allTx = orders.map(o => ({
    id: o.id,
    date: o.date,
    label: `Commande ${o.orderNumber}`,
    amount: o.total,
    type: 'income' as const
  }));
  
  const totalIncome = allTx.reduce((s, t) => s + (t.amount || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#10b981' }}>
              COMPTABILITÉ & PAIEMENTS
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Journal des Transactions
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
              Historique comptable en temps réel des encaissements et règlements de la boutique.
            </p>
          </div>
          <span style={{ fontSize: '16px', fontWeight: 800, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '10px 24px', borderRadius: '30px' }}>
            Total : {formatPrice(convertPrice(totalIncome, currency), currency)}
          </span>
        </div>
      </div>

      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Date</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Description</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Montant</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Statut</th>
              </tr>
            </thead>
            <tbody>
              {allTx.map(t => (
                <tr key={t.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{t.date}</td>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--adm-text-h)' }}>{t.label}</td>
                  <td style={{ padding: '16px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-plus-jakarta)' }}>
                    +{formatPrice(convertPrice(t.amount, currency), currency)}
                  </td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <span className="admin-badge active">Encaissement validé</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allTx.length === 0 && <EmptyState icon="💰" text="Aucune transaction enregistrée" />}
        </div>
      </div>
    </div>
  );
};

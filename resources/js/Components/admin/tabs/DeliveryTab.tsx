'use client';

import React from 'react';
import { useAppStore, formatPrice, convertPrice } from '@/lib/store';
import { ModalType } from '../types';
import { ConfirmDialogOptions } from '../AdminConfirmDialog';

interface DeliveryTabProps {
  onOpenModal: (type: ModalType) => void;
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
  showToast: (msg: string) => void;
}

export const DeliveryTab: React.FC<DeliveryTabProps> = ({ onOpenModal, showConfirmDialog, showToast }) => {
  const { deliveryZones, deleteDeliveryZone, currency } = useAppStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#06b6d4' }}>
              LOGISTIQUE & EXPÉDITION
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Zones & Tarifs de Livraison
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
              Définissez les frais de transport et les délais de livraison par région, ville ou pays.
            </p>
          </div>
          <button 
            className="admin-btn admin-btn-primary" 
            onClick={() => onOpenModal('addDeliveryZone')} 
            style={{ borderRadius: '30px', padding: '12px 24px', fontSize: '14px', fontWeight: 700 }}
          >
            + Ajouter une Zone
          </button>
        </div>
      </div>

      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Lieu / Zone géographique</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Frais de livraison</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Délai estimé</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {deliveryZones.map(z => (
                <tr key={z.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--adm-text-h)' }}>{z.name}</td>
                  <td style={{ padding: '16px', fontWeight: 800, color: '#06b6d4' }}>
                    {formatPrice(convertPrice(z.fee, currency), currency)}
                  </td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{z.estimatedDays}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button 
                      className="admin-btn admin-btn-danger admin-btn-sm" 
                      onClick={() => {
                        showConfirmDialog({
                          isOpen: true,
                          title: 'Supprimer la zone',
                          message: `Voulez-vous vraiment supprimer la zone de livraison "${z.name}" ?`,
                          icon: '🚚',
                          type: 'danger',
                          confirmLabel: 'Supprimer',
                          cancelLabel: 'Annuler',
                          onConfirm: () => {
                            deleteDeliveryZone(z.id);
                            showToast('Zone supprimée');
                          }
                        });
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

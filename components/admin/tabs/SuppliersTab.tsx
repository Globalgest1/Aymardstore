'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { ModalType } from '../types';
import { ConfirmDialogOptions } from '../AdminConfirmDialog';
import { EmptyState } from '../ui';

interface SuppliersTabProps {
  onOpenModal: (type: ModalType) => void;
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
  showToast: (msg: string) => void;
}

export const SuppliersTab: React.FC<SuppliersTabProps> = ({ onOpenModal, showConfirmDialog, showToast }) => {
  const { suppliers, deleteSupplier } = useAppStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#8b5cf6' }}>
              CHAÎNE D&apos;APPROVISIONNEMENT
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Fournisseurs & Réassorts
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
              Gérez le répertoire de vos partenaires et vos commandes de réapprovisionnement.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              className="admin-btn admin-btn-outline" 
              onClick={() => onOpenModal('addSupplyOrder')} 
              style={{ borderRadius: '30px', padding: '12px 20px', fontSize: '13px', fontWeight: 700 }}
            >
              📥 Nouvel appro.
            </button>
            <button 
              className="admin-btn admin-btn-primary" 
              onClick={() => onOpenModal('addSupplier')} 
              style={{ borderRadius: '30px', padding: '12px 20px', fontSize: '13px', fontWeight: 700 }}
            >
              + Nouveau Fournisseur
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 16, fontFamily: 'var(--font-plus-jakarta)' }}>
          Liste des Fournisseurs ({suppliers.length})
        </h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Nom</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Entreprise</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Email</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Téléphone</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--adm-text-h)' }}>{s.name}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{s.company}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{s.email}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{s.phone || '—'}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button 
                      className="admin-btn admin-btn-danger admin-btn-sm" 
                      onClick={() => {
                        showConfirmDialog({
                          isOpen: true,
                          title: 'Supprimer le fournisseur',
                          message: `Voulez-vous vraiment supprimer le fournisseur "${s.name}" ?`,
                          icon: '🏭',
                          type: 'danger',
                          confirmLabel: 'Supprimer',
                          cancelLabel: 'Annuler',
                          onConfirm: () => {
                            deleteSupplier(s.id);
                            showToast('Fournisseur supprimé');
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
          {suppliers.length === 0 && <EmptyState icon="🏭" text="Aucun fournisseur répertorié" />}
        </div>
      </div>
    </div>
  );
};

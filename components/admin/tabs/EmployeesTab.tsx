'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { ModalType } from '../types';
import { ConfirmDialogOptions } from '../AdminConfirmDialog';
import { Badge } from '../ui';

interface EmployeesTabProps {
  onOpenModal: (type: ModalType) => void;
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
  showToast: (msg: string) => void;
}

export const EmployeesTab: React.FC<EmployeesTabProps> = ({ onOpenModal, showConfirmDialog, showToast }) => {
  const { employees, employeePayments, toggleEmployeeStatus, deleteEmployee } = useAppStore();

  const totalSalaries = employees
    .filter(e => e.status === 'ACTIVE')
    .reduce((s, e) => s + (e.salary || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#ec4899' }}>
              RESSOURCES HUMAINES
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Gestion des Employés
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
              Suivi des membres de l&apos;équipe, rôles, statuts et traitement de la paie.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button 
              className="admin-btn admin-btn-outline" 
              onClick={() => onOpenModal('payEmployee')} 
              style={{ borderRadius: '30px', padding: '12px 20px', fontSize: '13px', fontWeight: 700 }}
            >
              💳 Traiter la Paie
            </button>
            <button 
              className="admin-btn admin-btn-primary" 
              onClick={() => onOpenModal('addEmployee')} 
              style={{ borderRadius: '30px', padding: '12px 20px', fontSize: '13px', fontWeight: 700 }}
            >
              + Nouvel Employé
            </button>
          </div>
        </div>
      </div>

      {/* HR KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
        <div className="admin-card" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Effectif total</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', marginTop: 4 }}>{employees.length}</div>
        </div>
        <div className="admin-card" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Actifs</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', marginTop: 4 }}>{employees.filter(e => e.status === 'ACTIVE').length}</div>
        </div>
        <div className="admin-card" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Masse salariale / mois</span>
          <div style={{ fontSize: '24px', fontWeight: 900, color: '#0284c7', marginTop: 4 }}>{(totalSalaries * 650).toLocaleString('fr-FR')} FCFA</div>
        </div>
      </div>

      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Employé</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Poste / Rôle</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Email</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Salaire Mensuel</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Statut</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(e => (
                <tr key={e.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--adm-text-h)' }}>{e.name}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: '#0284c7', fontWeight: 600 }}>{e.role}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{e.email}</td>
                  <td style={{ padding: '16px', fontWeight: 800, color: 'var(--adm-text-h)' }}>{(e.salary * 650).toLocaleString('fr-FR')} FCFA</td>
                  <td style={{ padding: '16px' }}><Badge status={e.status} /></td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                      <button 
                        className="admin-btn admin-btn-outline admin-btn-sm" 
                        onClick={() => { toggleEmployeeStatus(e.id); showToast('Statut mis à jour'); }}
                      >
                        {e.status === 'ACTIVE' ? '⏸️' : '▶️'}
                      </button>
                      <button 
                        className="admin-btn admin-btn-danger admin-btn-sm" 
                        onClick={() => {
                          showConfirmDialog({
                            isOpen: true,
                            title: "Supprimer l'employé",
                            message: `Voulez-vous vraiment retirer "${e.name}" des effectifs ?`,
                            icon: '👤',
                            type: 'danger',
                            confirmLabel: 'Supprimer',
                            cancelLabel: 'Annuler',
                            onConfirm: () => {
                              deleteEmployee(e.id);
                              showToast('Employé supprimé');
                            }
                          });
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {employeePayments.length > 0 && (
        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 16 }}>💳 Historique de paiements</h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Date</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Employé</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Période</th>
                  <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Montant</th>
                  <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', color: 'var(--adm-text-m)' }}>Méthode</th>
                </tr>
              </thead>
              <tbody>
                {employeePayments.map(p => {
                  const emp = employees.find(e => e.id === p.employeeId);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                      <td style={{ padding: '14px 16px', fontSize: '13px' }}>{p.date}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 700 }}>{emp?.name || '—'}</td>
                      <td style={{ padding: '14px 16px', fontSize: '13px' }}>{p.period}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#10b981' }}>{(p.amount * 650).toLocaleString('fr-FR')} FCFA</td>
                      <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px' }}>
                        {p.method === 'TRANSFER' ? '🏦 Virement' : p.method === 'CASH' ? '💵 Espèces' : '📱 Mobile'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

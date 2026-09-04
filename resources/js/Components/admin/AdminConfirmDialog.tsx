'use client';

import React from 'react';

export interface ConfirmDialogOptions {
  isOpen: boolean;
  title: string;
  message: string;
  icon?: string;
  type?: 'danger' | 'warning' | 'info';
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
}

interface AdminConfirmDialogProps {
  dialog: ConfirmDialogOptions | null;
  onClose: () => void;
}

export const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({ dialog, onClose }) => {
  if (!dialog || !dialog.isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
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
          maxWidth: '460px',
          backgroundColor: 'var(--adm-card-bg)',
          borderRadius: '24px',
          border: dialog.type === 'danger' ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1.5px solid var(--adm-card-border)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          animation: 'modalZoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Dialog Header */}
        <div style={{
          padding: '28px 28px 16px 28px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '16px'
        }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: dialog.type === 'danger' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
            border: dialog.type === 'danger' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            flexShrink: 0
          }}>
            {dialog.icon || (dialog.type === 'danger' ? '🗑️' : '⚠️')}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 800,
              color: 'var(--adm-text-h)',
              margin: '0 0 6px 0',
              fontFamily: 'var(--font-plus-jakarta)'
            }}>
              {dialog.title}
            </h3>
            <p style={{
              fontSize: '13.5px',
              color: 'var(--adm-text-m)',
              margin: 0,
              lineHeight: '1.55',
              whiteSpace: 'pre-line'
            }}>
              {dialog.message}
            </p>
          </div>
        </div>

        {/* Dialog Footer Actions */}
        <div style={{
          padding: '16px 28px 24px 28px',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px',
          borderTop: '1px solid var(--adm-card-border)',
          background: 'rgba(0, 0, 0, 0.02)'
        }}>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-outline"
            style={{
              borderRadius: '14px',
              padding: '10px 20px',
              fontWeight: 700,
              fontSize: '13px'
            }}
          >
            {dialog.cancelLabel || 'Annuler'}
          </button>
          <button
            type="button"
            onClick={() => {
              const action = dialog.onConfirm;
              onClose();
              action();
            }}
            className={`admin-btn ${dialog.type === 'danger' ? 'admin-btn-danger' : 'admin-btn-primary'}`}
            style={{
              borderRadius: '14px',
              padding: '10px 22px',
              fontWeight: 800,
              fontSize: '13px',
              boxShadow: dialog.type === 'danger' ? '0 4px 14px rgba(239, 68, 68, 0.3)' : undefined
            }}
          >
            {dialog.confirmLabel || 'Confirmer'}
          </button>
        </div>
      </div>
    </div>
  );
};

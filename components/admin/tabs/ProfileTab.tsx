'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';

interface ProfileTabProps {
  showToast: (msg: string) => void;
  onLogout: () => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({ showToast, onLogout }) => {
  const { user } = useAppStore();

  return (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, fontFamily: 'var(--font-plus-jakarta)' }}>
        Mon Profil
      </h2>
      <div className="admin-card" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-plus-jakarta)' }}>
            {user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-plus-jakarta)' }}>{user?.name}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{user?.email}</div>
            <span className="admin-badge active" style={{ marginTop: 4 }}>Administrateur</span>
          </div>
        </div>
        <div className="admin-form-grid">
          <div>
            <label className="admin-label">Nom</label>
            <input className="admin-input" defaultValue={user?.name} />
          </div>
          <div>
            <label className="admin-label">Email</label>
            <input className="admin-input" defaultValue={user?.email} type="email" />
          </div>
        </div>
        <div style={{ marginTop: 20 }}>
          <button className="admin-btn admin-btn-primary" onClick={() => showToast('Profil mis à jour !')}>
            Sauvegarder
          </button>
          <button className="admin-btn admin-btn-danger" style={{ marginLeft: 12 }} onClick={onLogout}>
            Déconnexion
          </button>
        </div>
      </div>
    </>
  );
};

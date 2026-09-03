'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { Tab, NAV_ITEMS, getTabIcon } from './types';

interface AdminHeaderProps {
  tab: Tab;
  setTab: (tab: Tab) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean | ((prev: boolean) => boolean)) => void;
  adminDarkMode: boolean;
  toggleAdminTheme: () => void;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  tab,
  setTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  adminDarkMode,
  toggleAdminTheme,
}) => {
  const store = useAppStore();

  const activeItem = NAV_ITEMS.find(n => n.id === tab);

  return (
    <div className="admin-topbar">
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="admin-mobile-toggle-btn"
          title="Ouvrir le menu"
        >
          ☰
        </button>
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)', display: 'flex', alignItems: 'center', gap: 8 }}>
          {tab !== 'dashboard' ? (
            <>
              <button
                type="button"
                onClick={() => setTab('dashboard')}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: 'var(--adm-text-m)',
                  fontWeight: 600,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4
                }}
                title="Retourner au Tableau de bord"
              >
                <span>Tableau de bord</span>
              </button>
              <span style={{ color: 'var(--adm-text-m)', opacity: 0.4 }}>/</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--adm-text-h)', fontWeight: 800 }}>
                {getTabIcon(tab)} {activeItem?.label || 'Tableau de bord'}
              </span>
            </>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {getTabIcon(tab)} {activeItem?.label || 'Tableau de bord'}
            </span>
          )}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Theme Switcher Button */}
        <button 
          onClick={toggleAdminTheme}
          title={adminDarkMode ? "Passer en Mode Clair" : "Passer en Mode Sombre"}
          style={{
            background: 'rgba(56, 189, 248, 0.10)',
            cursor: 'pointer',
            fontSize: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: '1px solid var(--adm-card-border)',
            color: 'var(--adm-text-h)',
            transition: 'all 0.2s'
          }}
        >
          <span>{adminDarkMode ? '☀️' : '🌙'}</span>
        </button>

        <span style={{ fontSize: 12, color: 'var(--adm-text-m)', fontWeight: 500 }}>
          {new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </span>
        
        <div style={{ 
          width: 36, 
          height: 36, 
          borderRadius: '50%', 
          background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', 
          color: '#ffffff', 
          border: '1px solid rgba(56, 189, 248, 0.3)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          fontSize: 13, 
          fontWeight: 800, 
          fontFamily: 'var(--font-plus-jakarta)', 
          boxShadow: '0 0 12px rgba(14,165,233,0.3)' 
        }}>
          {store.user?.name?.charAt(0).toUpperCase() || 'A'}
        </div>
      </div>
    </div>
  );
};

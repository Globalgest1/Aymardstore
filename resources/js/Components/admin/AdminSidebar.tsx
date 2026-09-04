'use client';

import React from 'react';
import Link from '@/lib/compat-link';
import { Tab, NAV_ITEMS, getTabIcon } from './types';
import { useAppStore } from '@/lib/store';

interface AdminSidebarProps {
  tab: Tab;
  setTab: (tab: Tab) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  getNavItemBadge?: (tab: Tab) => { count: string | number; color: string; pulse?: boolean } | null;
  onLogout?: () => void;
  onAnalyticsBadgeClick?: () => void;
}

export const AdminSidebar: React.FC<AdminSidebarProps> = ({
  tab,
  setTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  getNavItemBadge,
  onLogout,
  onAnalyticsBadgeClick,
}) => {
  const store = useAppStore();

  const resolveBadge = (itemTab: Tab) => {
    if (getNavItemBadge) return getNavItemBadge(itemTab);
    if (itemTab === 'orders') {
      const pending = (store.orders || []).filter(o => o.status === 'PENDING').length;
      return pending > 0 ? { count: pending, color: '#f59e0b', pulse: true } : null;
    }
    if (itemTab === 'reviews') {
      const pending = (store.reviews || []).filter(r => r.status === 'PENDING').length;
      return pending > 0 ? { count: pending, color: '#ef4444' } : null;
    }
    if (itemTab === 'abandonedCheckouts') {
      const count = (store.abandonedCheckouts || []).filter(a => a.status === 'PENDING').length;
      return count > 0 ? { count: count, color: '#f59e0b' } : null;
    }
    return null;
  };

  const handleLogout = onLogout || (async () => {
    try {
      await fetch('/api/auth/admin-logout', { method: 'POST' });
    } catch {}
    store.logout();
    window.location.href = '/auth/login';
  });
  return (
    <>
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-logo">
          {sidebarCollapsed ? (
            <Link 
              href="/" 
              title="Retourner à la boutique (Accueil)" 
              style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-plus-jakarta)', letterSpacing: -0.5, color: '#3b82f6' }}>
                AS
              </span>
            </Link>
          ) : (
            <Link 
              href="/" 
              title="Retourner à la boutique (Accueil)" 
              style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-plus-jakarta)', letterSpacing: -0.5 }}>
                AYMARD<span style={{ opacity: 0.5 }}>STORE</span>
              </span>
            </Link>
          )}
        </div>

        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="admin-sidebar-toggle-inline"
          title={sidebarCollapsed ? "Agrandir le menu" : "Réduire le menu"}
        >
          {sidebarCollapsed ? '⟩' : '⟨'}
        </button>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map(item => {
            const navBadge = resolveBadge(item.id);
            return (
              <React.Fragment key={item.id}>
                {item.section && <div className="admin-sidebar-section-label">{item.section}</div>}
                <button
                  className={`admin-sidebar-nav-btn ${tab === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setTab(item.id);
                    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                      setSidebarCollapsed(true);
                    }
                  }}
                  title={sidebarCollapsed ? `${item.label} ${navBadge ? `(${navBadge.count} alertes)` : ''}` : undefined}
                  style={{ position: 'relative' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: sidebarCollapsed ? '100%' : 'auto', flexShrink: 0 }}>
                    {getTabIcon(item.id)}
                    {sidebarCollapsed && navBadge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -3,
                          right: -3,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: navBadge.color,
                          boxShadow: `0 0 6px ${navBadge.color}`
                        }}
                      />
                    )}
                  </span>
                  {!sidebarCollapsed && (
                    <>
                      <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                      {navBadge && (
                        <span
                          onClick={(e) => {
                            if (item.id === 'analytics' && onAnalyticsBadgeClick) {
                              e.stopPropagation();
                              onAnalyticsBadgeClick();
                            }
                          }}
                          style={{
                            background: navBadge.color,
                            color: '#ffffff',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: `0 2px 6px ${navBadge.color}40`,
                            animation: navBadge.pulse ? 'livePulseDot 2s infinite' : 'none',
                            cursor: item.id === 'analytics' ? 'pointer' : 'default'
                          }}
                          title={item.id === 'analytics' ? 'Cliquer pour voir la carte et les localisations' : undefined}
                        >
                          {navBadge.count}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
        <div style={{ padding: sidebarCollapsed ? '16px 0' : '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <button 
            onClick={handleLogout} 
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-outfit)' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay when sidebar is open on mobile */}
      {!sidebarCollapsed && (
        <div 
          className="admin-mobile-overlay" 
          onClick={() => setSidebarCollapsed(true)} 
        />
      )}
    </>
  );
};

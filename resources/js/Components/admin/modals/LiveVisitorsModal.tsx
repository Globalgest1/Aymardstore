'use client';

import React from 'react';

interface LiveVisitorsModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: any;
  refreshLiveVisitors: () => void;
  showToast: (msg: string) => void;
}

export const LiveVisitorsModal: React.FC<LiveVisitorsModalProps> = ({
  isOpen,
  onClose,
  report,
  refreshLiveVisitors,
  showToast,
}) => {
  if (!isOpen || !report) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999998,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        animation: 'fadeIn 0.2s ease-out'
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '92vh',
          backgroundColor: 'var(--adm-card-bg)',
          borderRadius: '26px',
          border: '1.5px solid var(--adm-card-border)',
          boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.15)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div style={{
          padding: '22px 28px',
          borderBottom: '1px solid var(--adm-card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(2, 132, 199, 0.04) 100%)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '14px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)'
            }}>
              🟢
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)' }}>
                  Visiteurs en Direct &amp; Localisations Géographiques
                </h3>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: '12px',
                  background: '#10b981',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff', animation: 'livePulseDot 1.5s infinite' }} />
                  En direct
                </span>
              </div>
              <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '2px 0 0 0' }}>
                Surveillance en temps réel des visiteurs connectés sur votre boutique Aymard Store.
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={() => {
                refreshLiveVisitors();
                showToast('Données géographiques et sessions actualisées !');
              }}
              className="admin-btn admin-btn-outline admin-btn-sm"
              style={{ borderRadius: '20px', padding: '8px 14px', fontSize: '12px', fontWeight: 700 }}
              title="Actualiser les visiteurs"
            >
              <span>🔄 Actualiser</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="admin-btn admin-btn-outline"
              style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Fermer la fenêtre"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Body Scrollable */}
        <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
          
          {/* Top 4 Real-time KPI Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
            
            {/* Card 1 */}
            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              borderRadius: '18px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#059669' }}>
                VISITEURS ACTIFS EN LIGNE
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)' }}>
                  {report.totalCount}
                </span>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 12px #10b981', animation: 'livePulseDot 1.5s infinite' }} />
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                Activité détectée (dernières 3 min)
              </span>
            </div>

            {/* Card 2 */}
            <div style={{
              background: 'var(--adm-card-bg)',
              border: '1px solid var(--adm-card-border)',
              borderRadius: '18px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0284c7' }}>
                PAYS CONNECTÉS
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)' }}>
                  {(report.byCountry || []).length}
                </span>
                <span style={{ fontSize: '18px' }}>
                  {(report.byCountry || []).slice(0, 3).map((c: any) => c.flag).join(' ')}
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                {(report.byCountry || []).map((c: any) => c.country).join(', ')}
              </span>
            </div>

            {/* Card 3 */}
            <div style={{
              background: 'var(--adm-card-bg)',
              border: '1px solid var(--adm-card-border)',
              borderRadius: '18px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#8b5cf6' }}>
                APPAREIL PRINCIPAL
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)' }}>
                  {report.byDevice?.[0]?.device || 'Mobile 📱'}
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                {report.byDevice?.[0]?.percentage || 100}% du trafic en direct
              </span>
            </div>

            {/* Card 4 */}
            <div style={{
              background: 'var(--adm-card-bg)',
              border: '1px solid var(--adm-card-border)',
              borderRadius: '18px',
              padding: '16px 20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#f59e0b' }}>
                PAGE LA PLUS CONSULTÉE
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--adm-text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={report.byPage?.[0]?.path || '/'}>
                  {report.byPage?.[0]?.path === '/' ? 'Accueil' : report.byPage?.[0]?.path || '/'}
                </span>
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                {report.byPage?.[0]?.count || 1} visiteur{report.byPage?.[0]?.count > 1 ? 's' : ''} sur cette page
              </span>
            </div>

          </div>

          {/* Section 1: Répartition Géographique */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🗺️</span>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                  Répartition Géographique &amp; Villes Détectées
                </h4>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                Basé sur la géolocalisation IP &amp; Fuseaux Horaires
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {(report.byCountry || []).map((c: any, idx: number) => (
                <div
                  key={c.country}
                  style={{
                    padding: '16px 20px',
                    borderRadius: '18px',
                    background: idx === 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                    border: idx === 0 ? '1.5px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--adm-card-border)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px' }}>{c.flag}</span>
                      <div>
                        <strong style={{ fontSize: '14px', color: 'var(--adm-text-h)', display: 'block' }}>
                          {c.country}
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                          {c.cities?.length > 0 ? `📍 ${c.cities.join(', ')}` : 'Région détectée'}
                        </span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '18px', fontWeight: 900, color: '#10b981', display: 'block' }}>
                        {c.count}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                        {c.percentage}%
                      </span>
                    </div>
                  </div>

                  <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                    <div
                      style={{
                        width: `${c.percentage}%`,
                        height: '100%',
                        background: idx === 0 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                        borderRadius: '10px',
                        transition: 'width 0.4s ease'
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2: Active Visitors Session Feed */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>⚡</span>
                <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                  Sessions Actives en Direct ({(report.visitors || []).length})
                </h4>
              </div>
              <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                Mis à jour automatiquement
              </span>
            </div>

            <div style={{
              borderRadius: '18px',
              border: '1px solid var(--adm-card-border)',
              overflow: 'hidden',
              background: 'var(--adm-card-bg)'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.2fr 1.5fr 1.5fr 1.2fr 1fr',
                padding: '12px 18px',
                background: 'rgba(0, 0, 0, 0.03)',
                borderBottom: '1px solid var(--adm-card-border)',
                fontSize: '11px',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.6px',
                color: 'var(--adm-text-m)'
              }}>
                <span>Session</span>
                <span>Localisation</span>
                <span>Page &amp; Action</span>
                <span>Appareil</span>
                <span style={{ textAlign: 'right' }}>Statut</span>
              </div>

              <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                {(report.visitors || []).map((v: any, i: number) => {
                  const elapsedSec = Math.max(1, Math.floor((Date.now() - v.lastSeen) / 1000));
                  return (
                    <div
                      key={v.sessionId + '_' + i}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1.2fr 1.5fr 1.5fr 1.2fr 1fr',
                        padding: '12px 18px',
                        borderBottom: i < (report.visitors || []).length - 1 ? '1px solid var(--adm-card-border)' : 'none',
                        alignItems: 'center',
                        fontSize: '12.5px',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--adm-text-h)', fontSize: '11.5px' }}>
                          #{v.sessionId.slice(-6)}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '18px' }}>{v.flag}</span>
                        <div>
                          <strong style={{ display: 'block', fontSize: '12px', color: 'var(--adm-text-h)' }}>
                            {v.country}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                            {v.city}
                          </span>
                        </div>
                      </div>

                      <div>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#0284c7',
                          background: 'rgba(2, 132, 199, 0.08)',
                          padding: '2px 8px',
                          borderRadius: '8px',
                          display: 'inline-block',
                          maxWidth: '160px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap'
                        }}>
                          {v.currentPath}
                        </span>
                        <span style={{ display: 'block', fontSize: '11px', color: 'var(--adm-text-m)', marginTop: '2px' }}>
                          {v.lastAction}
                        </span>
                      </div>

                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--adm-text-h)', display: 'block' }}>
                          {v.device}
                        </span>
                        <span style={{ fontSize: '10.5px', color: 'var(--adm-text-m)' }}>
                          {v.browser}
                        </span>
                      </div>

                      <div style={{ textAlign: 'right' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          color: '#059669',
                          background: 'rgba(16, 185, 129, 0.1)',
                          padding: '3px 8px',
                          borderRadius: '12px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          {elapsedSec < 30 ? '🟢 En direct' : `Il y a ${elapsedSec}s`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div style={{
          padding: '16px 28px',
          borderTop: '1px solid var(--adm-card-border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: 'rgba(0, 0, 0, 0.02)'
        }}>
          <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
            🟢 Système de tracking en direct Aymard Store · Précision temps réel
          </span>
          <button
            type="button"
            onClick={onClose}
            className="admin-btn admin-btn-primary"
            style={{ borderRadius: '20px', padding: '10px 24px', fontSize: '13px', fontWeight: 800 }}
          >
            Fermer la fenêtre
          </button>
        </div>
      </div>
    </div>
  );
};

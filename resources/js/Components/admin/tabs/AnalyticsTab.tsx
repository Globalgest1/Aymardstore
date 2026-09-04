'use client';

import React from 'react';

interface AnalyticsTabProps {
  analyticsStartDate: string;
  setAnalyticsStartDate: (d: string) => void;
  analyticsEndDate: string;
  setAnalyticsEndDate: (d: string) => void;
  analyticsGroup: string;
  setAnalyticsGroup: (g: string) => void;
  analyticsBoutique: string;
  setAnalyticsBoutique: (b: string) => void;
  analyticsEventFilter: string;
  setAnalyticsEventFilter: (e: string) => void;
  setAnalyticsRefreshKey: React.Dispatch<React.SetStateAction<number>>;
  analyticsData: any;
  refreshLiveVisitors: () => void;
  setShowLiveVisitorsModal: (s: boolean) => void;
  showToast: (msg: string) => void;
}

export const AnalyticsTab: React.FC<AnalyticsTabProps> = ({
  analyticsStartDate,
  setAnalyticsStartDate,
  analyticsEndDate,
  setAnalyticsEndDate,
  analyticsGroup,
  setAnalyticsGroup,
  analyticsBoutique,
  setAnalyticsBoutique,
  analyticsEventFilter,
  setAnalyticsEventFilter,
  setAnalyticsRefreshKey,
  analyticsData,
  refreshLiveVisitors,
  setShowLiveVisitorsModal,
  showToast,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%', maxWidth: '1160px' }}>
      
      {/* Top Header Live Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#7c3aed' }}>
            ANALYTIQUES &amp; TRAFIC
          </span>
          <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--adm-text-h)', margin: '2px 0 0 0', fontFamily: 'var(--font-plus-jakarta)' }}>
            Activité &amp; Conversion en Temps Réel
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            refreshLiveVisitors();
            setShowLiveVisitorsModal(true);
          }}
          title="Consulter les visiteurs en direct et leurs localisations géographiques"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '12px',
            background: 'var(--adm-card-bg)',
            border: '1px solid var(--adm-card-border)',
            padding: '10px 18px',
            borderRadius: '16px',
            cursor: 'pointer',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
          }}
        >
          {/* Pulsing Live Radar Indicator */}
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '12px', height: '12px' }}>
            <span style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              background: '#10b981',
              opacity: 0.75,
              animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
            }} />
            <span style={{
              position: 'relative',
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#10b981'
            }} />
          </div>

          {/* Label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)' }}>
              {analyticsData.liveVisitors} Visiteur{analyticsData.liveVisitors > 1 ? 's' : ''} en direct
            </span>
            <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--adm-text-m)' }}>
              • En ligne
            </span>
          </div>

          {/* Clean Map Icon */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '26px',
            height: '26px',
            borderRadius: '8px',
            background: 'rgba(16, 185, 129, 0.1)',
            color: '#059669',
            marginLeft: '2px'
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
              <line x1="8" y1="2" x2="8" y2="18"/>
              <line x1="16" y1="6" x2="16" y2="22"/>
            </svg>
          </div>
        </button>
      </div>

      {/* 1. Purple Gradient Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 45%, #9333ea 100%)',
        borderRadius: '26px',
        padding: '32px 36px',
        color: '#ffffff',
        boxShadow: '0 20px 50px rgba(124, 58, 237, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', right: '-80px', top: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(255,255,255,0.22)', padding: '3px 10px', borderRadius: '12px' }}>
                DATA PIXEL
              </span>
              <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '12px' }}>
                Boutique
              </span>
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.6px', fontFamily: 'var(--font-plus-jakarta)' }}>
              Suivi d&apos;activité en temps réel
            </h1>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', margin: 0, maxWidth: '620px', lineHeight: '1.4' }}>
              Données brutes collectées par le pixel interne GlobalGest. Taux de conversion et visiteurs uniques.
            </p>
          </div>

          {/* DU / AU date picker */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, opacity: 0.85, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DU</label>
              <input
                type="date"
                value={analyticsStartDate}
                onChange={(e) => setAnalyticsStartDate(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.22)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, opacity: 0.85, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AU</label>
              <input
                type="date"
                value={analyticsEndDate}
                onChange={(e) => setAnalyticsEndDate(e.target.value)}
                style={{
                  background: 'rgba(255,255,255,0.22)',
                  border: '1px solid rgba(255,255,255,0.35)',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  color: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 700,
                  outline: 'none'
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => {
                setAnalyticsRefreshKey(k => k + 1);
                showToast('Données GlobalGest actualisées !');
              }}
              style={{
                background: '#ffffff',
                color: '#6d28d9',
                border: 'none',
                borderRadius: '14px',
                padding: '11px 20px',
                fontWeight: 900,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
                transition: 'transform 0.15s ease'
              }}
            >
              <span>🔄</span>
              <span>Actualiser</span>
            </button>
          </div>
        </div>

        {/* Enhanced Filters Toolbar */}
        <div style={{
          background: 'rgba(15, 10, 30, 0.45)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.16)',
          borderRadius: '20px',
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '16px',
          flexWrap: 'wrap',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', flex: 1 }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: 'rgba(255, 255, 255, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              padding: '6px 12px',
              borderRadius: '12px',
              fontSize: '11px',
              fontWeight: 900,
              letterSpacing: '0.8px',
              textTransform: 'uppercase',
              color: '#ffffff'
            }}>
              <span>⚡</span>
              <span>FILTRES</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '170px', flex: '1 1 180px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Groupe :
              </span>
              <select
                value={analyticsGroup}
                onChange={(e) => setAnalyticsGroup(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <option value="all" style={{ color: '#09090b', background: '#ffffff' }}>Tous les groupes</option>
                <option value="Boutique Principale" style={{ color: '#09090b', background: '#ffffff' }}>Boutique Principale</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '170px', flex: '1 1 180px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Boutique :
              </span>
              <select
                value={analyticsBoutique}
                onChange={(e) => setAnalyticsBoutique(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <option value="all" style={{ color: '#09090b', background: '#ffffff' }}>Toutes les boutiques</option>
                <option value="Aymard Store" style={{ color: '#09090b', background: '#ffffff' }}>Aymard Store</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '190px', flex: '1 1 200px' }}>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Événement :
              </span>
              <select
                value={analyticsEventFilter}
                onChange={(e) => setAnalyticsEventFilter(e.target.value)}
                style={{
                  flex: 1,
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.22)',
                  borderRadius: '12px',
                  padding: '8px 14px',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  outline: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <option value="all" style={{ color: '#09090b', background: '#ffffff' }}>Tous les événements</option>
                <option value="page_view" style={{ color: '#09090b', background: '#ffffff' }}>PageView</option>
                <option value="view_item" style={{ color: '#09090b', background: '#ffffff' }}>Vue Produit</option>
                <option value="add_to_cart" style={{ color: '#09090b', background: '#ffffff' }}>Ajout Panier</option>
                <option value="initiate_checkout" style={{ color: '#09090b', background: '#ffffff' }}>Début Paiement</option>
                <option value="purchase" style={{ color: '#09090b', background: '#ffffff' }}>Achat</option>
                <option value="payment_completed" style={{ color: '#09090b', background: '#ffffff' }}>Payé</option>
                <option value="delivery" style={{ color: '#09090b', background: '#ffffff' }}>Livré</option>
              </select>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setAnalyticsRefreshKey(k => k + 1);
              showToast('Filtres appliqués avec succès !');
            }}
            style={{
              background: '#ffffff',
              color: '#6d28d9',
              border: 'none',
              borderRadius: '14px',
              padding: '9px 24px',
              fontWeight: 900,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
              flexShrink: 0
            }}
          >
            <span>✨</span>
            <span>Appliquer</span>
          </button>
        </div>
      </div>

      {/* 2. 4 Summary Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
        {/* Card 1 */}
        <div className="admin-card" style={{
          padding: '24px',
          borderRadius: '24px',
          background: 'var(--adm-card-bg)',
          border: '1px solid var(--adm-card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
              VISITEURS UNIQUES
            </span>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--adm-text-h)', lineHeight: 1, marginBottom: '6px', fontFamily: 'var(--font-plus-jakarta)' }}>
              {analyticsData.uniqueVisitorsCount}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
              Sur la période
            </span>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            👥
          </div>
        </div>

        {/* Card 2 */}
        <div className="admin-card" style={{
          padding: '24px',
          borderRadius: '24px',
          background: 'var(--adm-card-bg)',
          border: '1px solid var(--adm-card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
              TOTAL ÉVÉNEMENTS
            </span>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--adm-text-h)', lineHeight: 1, marginBottom: '6px', fontFamily: 'var(--font-plus-jakarta)' }}>
              {analyticsData.totalEventsCount}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
              Actions trackées
            </span>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#fae8ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            👁️
          </div>
        </div>

        {/* Card 3 */}
        <div className="admin-card" style={{
          padding: '24px',
          borderRadius: '24px',
          background: 'var(--adm-card-bg)',
          border: '1px solid var(--adm-card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
              TAUX DE CONVERSION
            </span>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--adm-text-h)', lineHeight: 1, marginBottom: '6px', fontFamily: 'var(--font-plus-jakarta)' }}>
              {analyticsData.conversionRate}%
            </div>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
              Visiteurs → Acheteurs
            </span>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            📈
          </div>
        </div>

        {/* Card 4 */}
        <div className="admin-card" style={{
          padding: '24px',
          borderRadius: '24px',
          background: 'var(--adm-card-bg)',
          border: '1px solid var(--adm-card-border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
              ACHETEURS
            </span>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--adm-text-h)', lineHeight: 1, marginBottom: '6px', fontFamily: 'var(--font-plus-jakarta)' }}>
              {analyticsData.buyersCount}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
              Achats finalisés
            </span>
          </div>
          <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            🛒
          </div>
        </div>
      </div>

      {/* 3. Conversion Funnel */}
      <div className="admin-card" style={{
        padding: '30px 34px',
        borderRadius: '26px',
        background: 'var(--adm-card-bg)',
        border: '1px solid var(--adm-card-border)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🏆</span>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)' }}>
                Entonnoir de Conversion
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
              Parcours des visiteurs uniques vers l&apos;achat
            </p>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a', fontFamily: 'var(--font-plus-jakarta)' }}>
              {analyticsData.conversionRate}%
            </div>
            <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)', fontWeight: 700 }}>
              Taux global
            </span>
          </div>
        </div>

        {/* Funnel Steps */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '36px' }}>
          {analyticsData.funnel.map((step: any) => (
            <div
              key={step.key}
              style={{
                display: 'grid',
                gridTemplateColumns: '220px 1fr',
                alignItems: 'center',
                gap: '20px'
              }}
            >
              <div style={{ textAlign: 'right' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                    {step.label}
                  </span>
                  <span title={step.tooltip} style={{ fontSize: '12px', color: 'var(--adm-text-m)', cursor: 'help' }}>ℹ️</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: '2px' }}>
                  {step.pctOfPrevious}% du précédent
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '280px' }}>
                <div style={{
                  width: '100%',
                  height: '42px',
                  borderRadius: '12px',
                  background: step.color,
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '15px',
                  boxShadow: `0 4px 14px ${step.color}40`,
                  letterSpacing: '0.5px'
                }}>
                  {step.count}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Taux de conversion par étape */}
        <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '24px' }}>
          <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
            Taux de conversion par étape
          </h4>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
            {[
              { label: 'Vue Produit', rate: analyticsData.stepRates.viewProduct },
              { label: 'Ajout Panier', rate: analyticsData.stepRates.addToCart },
              { label: 'Début Paiement', rate: analyticsData.stepRates.checkout },
              { label: 'Achat', rate: analyticsData.stepRates.purchase },
              { label: 'Payé', rate: analyticsData.stepRates.paid },
              { label: 'Livré', rate: analyticsData.stepRates.delivered },
            ].map((st, i) => (
              <div
                key={i}
                style={{
                  background: 'var(--adm-card-border)',
                  borderRadius: '14px',
                  padding: '12px 14px',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--adm-text-m)', display: 'block', marginBottom: '4px' }}>
                  {st.label}
                </span>
                <strong style={{ fontSize: '16px', fontWeight: 900, color: st.rate > 0 ? '#16a34a' : '#ef4444' }}>
                  {st.rate}%
                </strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 4. Timeline & Top Events */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Box 1 */}
        <div className="admin-card" style={{
          padding: '26px',
          borderRadius: '24px',
          background: 'var(--adm-card-bg)',
          border: '1px solid var(--adm-card-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <span style={{ fontSize: '18px' }}>📊</span>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
              Évolution du volume d&apos;événements
            </h3>
          </div>

          {analyticsData.timeline.length === 0 ? (
            <div style={{
              minHeight: '180px',
              border: '1.5px dashed var(--adm-card-border)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--adm-text-m)',
              padding: '24px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '28px', marginBottom: '8px' }}>📈</span>
              <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)' }}>Aucun événement sur cette période</strong>
              <span style={{ fontSize: '12px', marginTop: '4px' }}>Les visites et actions en direct s&apos;afficheront ici automatiquement.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {analyticsData.timeline.map((item: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', width: '75px', fontWeight: 700 }}>
                    {item.date}
                  </span>
                  <div style={{ flex: 1, height: '18px', background: 'var(--adm-card-border)', borderRadius: '8px', overflow: 'hidden' }}>
                    <div style={{
                      width: `${Math.min(100, Math.max(8, item.count * 15))}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                      borderRadius: '8px'
                    }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', width: '35px', textAlign: 'right' }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Box 2 */}
        <div className="admin-card" style={{
          padding: '26px',
          borderRadius: '24px',
          background: 'var(--adm-card-bg)',
          border: '1px solid var(--adm-card-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
            <span style={{ fontSize: '18px' }}>📑</span>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
              Top Événements
            </h3>
          </div>

          {analyticsData.topEvents.length === 0 ? (
            <div style={{
              minHeight: '180px',
              border: '1.5px dashed var(--adm-card-border)',
              borderRadius: '16px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--adm-text-m)',
              padding: '24px',
              textAlign: 'center'
            }}>
              <span style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</span>
              <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)' }}>Aucune action collectée</strong>
              <span style={{ fontSize: '12px', marginTop: '4px' }}>Dès qu&apos;un visiteur consulte un produit ou valide un panier, il apparaîtra ici.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {analyticsData.topEvents.map((ev: any, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--adm-card-border)', borderRadius: '12px' }}>
                  <div>
                    <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block' }}>
                      {ev.label}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                      Type : {ev.type}
                    </span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <strong style={{ fontSize: '13px', color: '#7c3aed', display: 'block' }}>
                      {ev.count} fois
                    </strong>
                    <span style={{ fontSize: '10.5px', color: 'var(--adm-text-m)' }}>
                      {ev.percentage}% du total
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

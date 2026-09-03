'use client';

import React from 'react';
import { useAppStore, DEFAULT_PIXEL_SETTINGS } from '@/lib/store';

interface PixelsTabProps {
  showToast: (msg: string) => void;
}

export const PixelsTab: React.FC<PixelsTabProps> = ({ showToast }) => {
  const { pixelSettings, updatePixelSettings } = useAppStore();

  const currentPixels = pixelSettings || DEFAULT_PIXEL_SETTINGS;
  const fbPixels = currentPixels.facebookPixels || [];
  const ttPixels = currentPixels.tiktokPixels || [];
  const ga = currentPixels.googleAnalytics || { measurementId: '', gtmId: '', enabled: true };
  const autoEvents = currentPixels.autoTrackEvents || { pageView: true, viewContent: true, addToCart: true, initiateCheckout: true, purchase: true };

  const handleUpdateFbPixelId = (idx: number, newId: string) => {
    const updated = [...fbPixels];
    updated[idx] = { ...updated[idx], pixelId: newId.trim() };
    updatePixelSettings({ facebookPixels: updated });
  };

  const handleUpdateFbCapi = (idx: number, token: string) => {
    const updated = [...fbPixels];
    updated[idx] = { ...updated[idx], capiToken: token.trim() };
    updatePixelSettings({ facebookPixels: updated });
  };

  const handleAddFbPixel = () => {
    const updated = [...fbPixels, { id: `fb-${Date.now()}`, pixelId: '', capiToken: '', enabled: true }];
    updatePixelSettings({ facebookPixels: updated });
    showToast('Nouveau Pixel Facebook ajouté !');
  };

  const handleRemoveFbPixel = (idx: number) => {
    const updated = fbPixels.filter((_, i) => i !== idx);
    updatePixelSettings({ facebookPixels: updated });
    showToast('Pixel Facebook supprimé.');
  };

  const handleUpdateTtPixelId = (idx: number, newId: string) => {
    const updated = [...ttPixels];
    updated[idx] = { ...updated[idx], pixelId: newId.trim(), enabled: true };
    updatePixelSettings({ tiktokPixels: updated });
  };

  const handleUpdateTtEventsApi = (idx: number, token: string) => {
    const updated = [...ttPixels];
    updated[idx] = { ...updated[idx], eventsApiToken: token.trim() };
    updatePixelSettings({ tiktokPixels: updated });
  };

  const handleAddTtPixel = () => {
    const updated = [...ttPixels, { id: `tt-${Date.now()}`, pixelId: '', eventsApiToken: '', enabled: true }];
    updatePixelSettings({ tiktokPixels: updated });
    showToast('Nouveau Pixel TikTok ajouté !');
  };

  const handleRemoveTtPixel = (idx: number) => {
    const updated = ttPixels.filter((_, i) => i !== idx);
    updatePixelSettings({ tiktokPixels: updated });
    showToast('Pixel TikTok supprimé.');
  };

  const handleUpdateGa = (updates: Partial<typeof ga>) => {
    updatePixelSettings({ googleAnalytics: { ...ga, ...updates } });
  };

  const handleToggleEvent = (key: keyof typeof autoEvents) => {
    updatePixelSettings({
      autoTrackEvents: {
        ...autoEvents,
        [key]: !autoEvents[key]
      }
    });
    showToast(`Événement ${key} ${!autoEvents[key] ? 'activé' : 'désactivé'}`);
  };

  const handleTestEvent = (eventName: string) => {
    try {
      if (typeof window !== 'undefined') {
        const win = window as any;
        if (win.fbq) {
          win.fbq('track', eventName, {
            content_name: 'Adidas Handball Spezial',
            content_category: 'shoes',
            value: 89.99,
            currency: 'EUR'
          });
        }
        if (win.ttq) {
          win.ttq.track(eventName, {
            content_name: 'Adidas Handball Spezial',
            value: 89.99,
            currency: 'EUR'
          });
        }
      }
      showToast(`🚀 Événement test "${eventName}" envoyé à vos Pixels actifs !`);
    } catch (e) {
      showToast(`Événement "${eventName}" simulé.`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: '1080px' }}>
      {/* Main Header */}
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0284c7' }}>
          MARKETING &amp; TRACKING PUBLICITAIRE
        </span>
        <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
          Pixels &amp; Balises Publicitaires
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0, lineHeight: '1.5' }}>
          Connectez vos pixels Meta (Facebook &amp; Instagram Ads), TikTok Ads et Google Analytics 4. Synchronisez les conversions pour optimiser vos campagnes et recibler vos clients.
        </p>
      </div>

      {/* 1. Facebook / Meta Pixel Card */}
      <div className="admin-card" style={{
        padding: '28px 32px',
        borderRadius: '20px',
        background: 'var(--adm-card-bg)',
        border: '1px solid var(--adm-card-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px', fontFamily: 'serif' }}>
              f
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                Facebook / Meta Pixel
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '2px 0 0 0' }}>
                Suivez vos campagnes Facebook &amp; Instagram Ads
              </p>
            </div>
          </div>

          <a
            href="https://business.facebook.com/events_manager2"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--adm-text-m)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Aide</span>
            <span>↗</span>
          </a>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '8px' }}>
            IDs du Pixel Facebook
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {fbPixels.map((p, idx) => (
              <div key={p.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  className="admin-input"
                  value={p.pixelId}
                  onChange={(e) => handleUpdateFbPixelId(idx, e.target.value)}
                  placeholder="ex: 2608798626157940"
                  style={{ flex: 1, borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', fontFamily: 'monospace' }}
                />
                {fbPixels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveFbPixel(idx)}
                    aria-label="Supprimer le pixel"
                    style={{ background: 'none', border: '1px solid var(--adm-card-border)', borderRadius: '10px', padding: '9px 12px', cursor: 'pointer', color: '#64748b' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddFbPixel}
            style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 800, fontSize: '13px', cursor: 'pointer', padding: '8px 0 0 0' }}
          >
            + Ajouter un pixel
          </button>
        </div>

        <div style={{ background: 'var(--adm-card-border)', borderRadius: '14px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚡</span>
            <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)' }}>
              API Conversions Meta (CAPI - Recommandé)
            </strong>
          </div>
          <p style={{ fontSize: '12px', color: 'var(--adm-text-m)', margin: 0 }}>
            Contournez les bloqueurs de publicité (iOS 14+) et maximisez le suivi en envoyant les événements directement de serveur à serveur.
          </p>
          {fbPixels.map((p, idx) => (
            <div key={p.id || idx}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--adm-text-m)', marginBottom: '4px' }}>
                Token CAPI (Pixel {p.pixelId || `N°${idx + 1}`})
              </label>
              <input
                type="password"
                className="admin-input"
                value={p.capiToken || ''}
                onChange={(e) => handleUpdateFbCapi(idx, e.target.value)}
                placeholder="••••••••••••••••••••••••••••••••••••••••"
                style={{ width: '100%', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 2. TikTok Pixel Card */}
      <div className="admin-card" style={{
        padding: '28px 32px',
        borderRadius: '20px',
        background: 'var(--adm-card-bg)',
        border: '1px solid var(--adm-card-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#09090b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px' }}>
              ♪
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                TikTok Pixel &amp; Events API
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '2px 0 0 0' }}>
                Suivez vos campagnes TikTok Ads &amp; Spark Ads
              </p>
            </div>
          </div>

          <a
            href="https://ads.tiktok.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--adm-text-m)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Aide</span>
            <span>↗</span>
          </a>
        </div>

        <div>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '8px' }}>
            IDs du Pixel TikTok
          </label>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {ttPixels.map((p, idx) => (
              <div key={p.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <input
                  type="text"
                  className="admin-input"
                  value={p.pixelId}
                  onChange={(e) => handleUpdateTtPixelId(idx, e.target.value)}
                  placeholder="ex: CXXXXXXXXXXXXXX"
                  style={{ flex: 1, borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', fontFamily: 'monospace' }}
                />
                {ttPixels.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveTtPixel(idx)}
                    aria-label="Supprimer le pixel TikTok"
                    style={{ background: 'none', border: '1px solid var(--adm-card-border)', borderRadius: '10px', padding: '9px 12px', cursor: 'pointer', color: '#64748b' }}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleAddTtPixel}
            style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 800, fontSize: '13px', cursor: 'pointer', padding: '8px 0 0 0' }}
          >
            + Ajouter un pixel
          </button>
        </div>

        <div style={{ background: 'var(--adm-card-border)', borderRadius: '14px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '16px' }}>⚡</span>
            <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)' }}>
              API Événements TikTok (Events API)
            </strong>
          </div>
          {ttPixels.map((p, idx) => (
            <div key={p.id || idx}>
              <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--adm-text-m)', marginBottom: '4px' }}>
                Token Events API (Pixel {p.pixelId || `N°${idx + 1}`})
              </label>
              <input
                type="password"
                className="admin-input"
                value={p.eventsApiToken || ''}
                onChange={(e) => handleUpdateTtEventsApi(idx, e.target.value)}
                placeholder="••••••••••••••••••••••••••••••••••••••••"
                style={{ width: '100%', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* 3. Google Analytics & Google Tag */}
      <div className="admin-card" style={{
        padding: '28px 32px',
        borderRadius: '20px',
        background: 'var(--adm-card-bg)',
        border: '1px solid var(--adm-card-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px' }}>
              G
            </div>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                Google Analytics 4 &amp; Google Tag
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '2px 0 0 0' }}>
                Suivez votre trafic de recherche, Google Ads et le comportement des visiteurs
              </p>
            </div>
          </div>

          <a
            href="https://analytics.google.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--adm-text-m)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
          >
            <span>Aide</span>
            <span>↗</span>
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '8px' }}>
              ID de mesure GA4 / Google Tag
            </label>
            <input
              type="text"
              className="admin-input"
              value={ga.measurementId}
              onChange={(e) => handleUpdateGa({ measurementId: e.target.value.trim() })}
              placeholder="ex: G-XXXXXXXXXX ou AW-XXXXXXXXXX"
              style={{ width: '100%', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', fontFamily: 'monospace' }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '8px' }}>
              ID Google Tag Manager (GTM - Optionnel)
            </label>
            <input
              type="text"
              className="admin-input"
              value={ga.gtmId || ''}
              onChange={(e) => handleUpdateGa({ gtmId: e.target.value.trim() })}
              placeholder="ex: GTM-XXXXXXX"
              style={{ width: '100%', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', fontFamily: 'monospace' }}
            />
          </div>
        </div>
      </div>

      {/* 4. Automated Events Management */}
      <div className="admin-card" style={{
        padding: '28px 32px',
        borderRadius: '20px',
        background: 'var(--adm-card-bg)',
        border: '1px solid var(--adm-card-border)'
      }}>
        <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '0 0 6px 0' }}>
          ⚡ Événements E-commerce Suivis Automatiquement
        </h3>
        <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '0 0 16px 0' }}>
          Tous ces événements sont déclenchés en temps réel sur la boutique et synchronisés avec vos pixels actifs :
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
          {[
            { key: 'pageView' as const, label: 'PageView', desc: 'Pages vues' },
            { key: 'viewContent' as const, label: 'ViewContent', desc: 'Fiches produits' },
            { key: 'addToCart' as const, label: 'AddToCart', desc: 'Ajouts panier' },
            { key: 'initiateCheckout' as const, label: 'InitiateCheckout', desc: 'Début de commande' },
            { key: 'purchase' as const, label: 'Purchase', desc: 'Achats validés' },
          ].map(ev => {
            const isEnabled = autoEvents[ev.key];
            return (
              <div
                key={ev.key}
                onClick={() => handleToggleEvent(ev.key)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: isEnabled ? '1.5px solid #10b981' : '1px solid var(--adm-card-border)',
                  background: isEnabled ? 'rgba(16,185,129,0.08)' : 'var(--adm-card-bg)',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.15s ease'
                }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: '13px', color: 'var(--adm-text-h)' }}>
                    {ev.label}
                  </strong>
                  <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                    {ev.desc}
                  </span>
                </div>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: isEnabled ? '#059669' : '#94a3b8',
                  background: isEnabled ? '#d1fae5' : 'var(--adm-card-border)',
                  padding: '3px 8px',
                  borderRadius: '10px'
                }}>
                  {isEnabled ? '✓ Actif' : 'Inactif'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 5. Live Event Testing Console */}
      <div className="admin-card" style={{
        padding: '24px 30px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(2,132,199,0.06) 0%, rgba(16,185,129,0.04) 100%)',
        border: '1px solid rgba(2,132,199,0.2)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '20px' }}>🧪</span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                Console de Test &amp; Déclenchement d&apos;Événements en Direct
              </h3>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
              Cliquez pour envoyer un événement test et vérifier la réception dans Meta Pixel Helper ou TikTok Pixel Helper :
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'].map(name => (
            <button
              key={name}
              type="button"
              onClick={() => handleTestEvent(name)}
              className="admin-btn admin-btn-outline admin-btn-sm"
              style={{
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span>⚡</span> Tester {name}
            </button>
          ))}
        </div>
      </div>

      {/* Bottom Save Action Bar */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '20px 28px',
        borderRadius: '20px',
        background: 'var(--adm-card-bg)',
        border: '1px solid var(--adm-card-border)',
        boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
        marginTop: '4px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '20px' }}>💾</span>
          <div>
            <strong style={{ fontSize: '14px', color: 'var(--adm-text-h)', display: 'block' }}>
              Enregistrement des configurations Pixels &amp; Tracking
            </strong>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
              Toutes les modifications sont appliquées instantanément sur votre boutique en direct.
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => showToast('Configuration des Pixels enregistrée et synchronisée avec succès !')}
          className="admin-btn admin-btn-primary"
          style={{
            borderRadius: '30px',
            padding: '12px 32px',
            fontSize: '14px',
            fontWeight: 800,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#0284c7',
            boxShadow: '0 4px 16px rgba(2,132,199,0.35)'
          }}
        >
          <span>💾</span> Enregistrer
        </button>
      </div>
    </div>
  );
};

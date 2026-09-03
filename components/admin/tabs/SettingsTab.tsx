'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';

interface SettingsTabProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ showToast }) => {
  const { 
    exchangeRate, 
    updateExchangeRate, 
    freeShippingThreshold, 
    updateFreeShippingThreshold, 
    announcements, 
    updateAnnouncements, 
    merchantSettings, 
    updateMerchantSettings, 
    monerooSettings, 
    updateMonerooSettings, 
    clearAccountingData, 
    clearAllMockData 
  } = useAppStore();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#a855f7' }}>
            CONFIGURATION SYSTÈME
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
            Paramètres de la Boutique
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
            Ajustez les devises, les frais de port offerts et les bannières d&apos;information.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 16 }}>💱 Taux de change</h3>
          <label className="admin-label">1 EUR = ? FCFA</label>
          <input 
            type="number" 
            className="admin-input" 
            value={exchangeRate} 
            onChange={e => updateExchangeRate(parseFloat(e.target.value) || 655.957)} 
            step="0.001" 
            style={{ borderRadius: 10, padding: '10px 14px' }} 
          />
        </div>
        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 16 }}>🚚 Livraison gratuite</h3>
          <label className="admin-label">Seuil en EUR</label>
          <input 
            type="number" 
            className="admin-input" 
            value={freeShippingThreshold} 
            onChange={e => updateFreeShippingThreshold(parseFloat(e.target.value) || 0)} 
            style={{ borderRadius: 10, padding: '10px 14px' }} 
          />
        </div>
      </div>

      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 16 }}>📢 Bannières d&apos;Annonce (TopBar)</h3>
        {announcements.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
            <input 
              className="admin-input" 
              value={a} 
              onChange={e => {
                const newAnn = [...announcements];
                newAnn[i] = e.target.value;
                updateAnnouncements(newAnn);
              }} 
              style={{ borderRadius: 10 }} 
            />
            <button 
              className="admin-btn admin-btn-danger admin-btn-sm" 
              onClick={() => {
                updateAnnouncements(announcements.filter((_, idx) => idx !== i));
                showToast('Annonce supprimée');
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        ))}
        <button 
          className="admin-btn admin-btn-outline admin-btn-sm" 
          onClick={() => updateAnnouncements([...announcements, 'Nouvelle annonce...'])} 
          style={{ borderRadius: 10, marginTop: 8 }}
        >
          + Ajouter une annonce
        </button>
      </div>

      {/* 🔔 Merchant Alert Channels (Email, WhatsApp & Telegram Bot Config) */}
      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid rgba(2, 132, 199, 0.25)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>📱</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                Alertes Marchand Instantanées (Email, WhatsApp & Telegram Bot)
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
              Recevez une alerte directe sur votre téléphone ou email lors de chaque commande ou paiement validé.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch('/api/notify-merchant', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'TEST_ALERT',
                    merchantSettings: merchantSettings,
                    testMessage: '🚀 Test réussi ! Vos notifications Marchand Aymard Store sont prêtes et configurées.'
                  })
                });
                const data = await res.json();
                if (data.success) {
                  showToast(data.message || 'Notification de test envoyée avec succès !');
                } else {
                  showToast('Erreur lors du test : ' + (data.error || 'Vérifiez la configuration'), 'error');
                }
              } catch (e: any) {
                showToast('Erreur d\'envoi de la notification de test', 'error');
              }
            }}
            className="admin-btn admin-btn-primary"
            style={{ borderRadius: '30px', padding: '10px 22px', fontSize: '12.5px', fontWeight: 800 }}
          >
            🚀 Tester l&apos;Alerte Instantanée
          </button>
        </div>

        <div className="admin-form-grid">
          {/* Email Settings */}
          <div style={{ gridColumn: '1 / -1', background: 'rgba(2, 132, 199, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(2, 132, 199, 0.15)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '14px', color: 'var(--adm-text-h)', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={merchantSettings.emailAlertsEnabled}
                onChange={e => updateMerchantSettings({ emailAlertsEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#0284c7' }}
              />
              <span>📧 Alertes par Email Gmail / Administrateur</span>
            </label>
            <div className="admin-form-grid">
              <div>
                <label className="admin-label">Adresse Email Administrateur (Gmail)</label>
                <input
                  type="email"
                  className="admin-input"
                  value={merchantSettings.adminEmail}
                  onChange={e => updateMerchantSettings({ adminEmail: e.target.value })}
                  placeholder="votre.email@gmail.com"
                  style={{ borderRadius: '10px' }}
                />
              </div>
              <div>
                <label className="admin-label">Clé API Resend / Email (Optionnel - Pour envoi direct sur Gmail)</label>
                <input
                  type="text"
                  className="admin-input"
                  value={merchantSettings.resendApiKey || ''}
                  onChange={e => updateMerchantSettings({ resendApiKey: e.target.value })}
                  placeholder="ex: re_123456789..."
                  style={{ borderRadius: '10px' }}
                />
              </div>
            </div>
          </div>

          {/* Telegram Settings */}
          <div style={{ gridColumn: '1 / -1', background: 'rgba(56, 189, 248, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '14px', color: 'var(--adm-text-h)', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={merchantSettings.telegramEnabled}
                onChange={e => updateMerchantSettings({ telegramEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#38bdf8' }}
              />
              <span>✈️ Alertes Telegram Bot (Message Instantané)</span>
            </label>
            <div className="admin-form-grid" style={{ marginTop: '10px' }}>
              <div>
                <label className="admin-label">Token Telegram Bot API</label>
                <input
                  type="text"
                  className="admin-input"
                  value={merchantSettings.telegramBotToken}
                  onChange={e => updateMerchantSettings({ telegramBotToken: e.target.value })}
                  placeholder="ex: 7829103948:AAH1b9cK_..."
                  style={{ borderRadius: '10px' }}
                />
              </div>
              <div>
                <label className="admin-label">Chat ID Administrateur / Groupe Telegram</label>
                <input
                  type="text"
                  className="admin-input"
                  value={merchantSettings.telegramChatId}
                  onChange={e => updateMerchantSettings({ telegramChatId: e.target.value })}
                  placeholder="ex: -100293847592 ou 12948573"
                  style={{ borderRadius: '10px' }}
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Settings */}
          <div style={{ gridColumn: '1 / -1', background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '14px', color: 'var(--adm-text-h)', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={merchantSettings.whatsappEnabled}
                onChange={e => updateMerchantSettings({ whatsappEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
              />
              <span>💬 Alertes WhatsApp Business (Gateway / Webhook)</span>
            </label>
            <div className="admin-form-grid" style={{ marginTop: '10px' }}>
              <div>
                <label className="admin-label">Numéro WhatsApp Administrateur</label>
                <input
                  type="text"
                  className="admin-input"
                  value={merchantSettings.whatsappPhoneNumber}
                  onChange={e => updateMerchantSettings({ whatsappPhoneNumber: e.target.value })}
                  placeholder="ex: +229 90 12 34 56"
                  style={{ borderRadius: '10px' }}
                />
              </div>
              <div>
                <label className="admin-label">URL Webhook API WhatsApp Gateway</label>
                <input
                  type="url"
                  className="admin-input"
                  value={merchantSettings.whatsappWebhookUrl}
                  onChange={e => updateMerchantSettings({ whatsappWebhookUrl: e.target.value })}
                  placeholder="https://api.whatsapp-alert.com/v1/send"
                  style={{ borderRadius: '10px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 💳 Passerelle de Paiement Direct LeekPay */}
      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1.5px solid rgba(16, 185, 129, 0.35)', boxShadow: '0 8px 24px rgba(16, 185, 129, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>💳</span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                  Passerelle de Paiement LeekPay (Mobile Money &amp; Cartes Bancaires)
                </h3>
                <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
                  Couverture : Bénin 🇧🇯 (MTN MoMo, Moov Money, Celtiis Cash) + International 🌍 (Cartes Visa/Mastercard 3D Secure)
                </span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '6px 0 0 0', maxWidth: '680px' }}>
              Configurez vos clés API LeekPay pour encaisser directement les règlements.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: monerooSettings?.enabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)', padding: '8px 16px', borderRadius: '20px', border: monerooSettings?.enabled ? '1px solid #10b981' : '1px solid var(--adm-card-border)' }}>
              <input
                type="checkbox"
                checked={monerooSettings?.enabled ?? true}
                onChange={e => updateMonerooSettings({ enabled: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
              />
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: monerooSettings?.enabled ? '#10b981' : 'var(--adm-text-m)' }}>
                {monerooSettings?.enabled ? '🟢 Paiements LeekPay Actifs' : '⚪ Désactivé (Mode Vitrine)'}
              </span>
            </label>
          </div>
        </div>

        <div className="admin-form-grid">
          {/* Environment Mode Switch */}
          <div style={{ gridColumn: '1 / -1', background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)', display: 'block' }}>
                Mode de Fonctionnement de la Passerelle
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                En mode Sandbox (Test), utilisez des numéros et cartes de test. En mode Live (Production), les paiements réels sont encaissés sur votre compte LeekPay.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  updateMonerooSettings({ environment: 'sandbox' });
                  showToast('Mode LeekPay basculé sur Sandbox (Test).');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: monerooSettings?.environment === 'sandbox' ? '1.5px solid #f59e0b' : '1px solid var(--adm-card-border)',
                  background: monerooSettings?.environment === 'sandbox' ? '#f59e0b' : 'var(--adm-card-bg)',
                  color: monerooSettings?.environment === 'sandbox' ? '#ffffff' : 'var(--adm-text-h)',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                🧪 Mode Test (Sandbox)
              </button>

              <button
                type="button"
                onClick={() => {
                  updateMonerooSettings({ environment: 'live' });
                  showToast('Mode LeekPay basculé sur Live (Production).');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: monerooSettings?.environment === 'live' ? '1.5px solid #10b981' : '1px solid var(--adm-card-border)',
                  background: monerooSettings?.environment === 'live' ? '#10b981' : 'var(--adm-card-bg)',
                  color: monerooSettings?.environment === 'live' ? '#ffffff' : 'var(--adm-text-h)',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                🚀 Mode Réel (Production)
              </button>
            </div>
          </div>

          <div>
            <label className="admin-label">Clé Publique LeekPay (Public Key - Requise)</label>
            <input
              type="text"
              className="admin-input"
              value={monerooSettings?.publicKey || ''}
              onChange={e => updateMonerooSettings({ publicKey: e.target.value.trim() })}
              placeholder={monerooSettings?.environment === 'live' ? 'pk_live_...' : 'pk_test_...'}
              style={{ borderRadius: '10px', fontFamily: 'monospace' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: '4px', display: 'block' }}>
              Trouvable dans votre compte LeekPay (Dashboard &gt; Paramètres API &gt; Clé Publique)
            </span>
          </div>

          <div>
            <label className="admin-label">Clé Secrète LeekPay (Secret Key - Requise pour Webhooks)</label>
            <input
              type="password"
              className="admin-input"
              value={monerooSettings?.secretKey || ''}
              onChange={e => updateMonerooSettings({ secretKey: e.target.value.trim() })}
              placeholder={monerooSettings?.environment === 'live' ? 'sk_live_...' : 'sk_test_...'}
              style={{ borderRadius: '10px', fontFamily: 'monospace' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: '4px', display: 'block' }}>
              Trouvable dans votre compte LeekPay (Dashboard &gt; Paramètres API &gt; Clé Secrète)
            </span>
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
            🔒 Webhook URL : <code>https://aymard-store.com/api/webhook/leekpay</code>
          </span>
          <button
            type="button"
            onClick={() => showToast('Configuration LeekPay enregistrée avec succès !')}
            className="admin-btn admin-btn-primary"
            style={{ borderRadius: '20px', padding: '8px 20px', fontSize: '12px', fontWeight: 800, background: '#10b981', borderColor: '#10b981' }}
          >
            💾 Enregistrer la configuration LeekPay
          </button>
        </div>
      </div>

      {/* System Reset & Data Cleanup Card */}
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid rgba(239,68,68,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
          <span style={{ fontSize: '22px' }}>🧹</span>
          <div>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
              Remise à Zéro des Données &amp; Comptabilité
            </h3>
            <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '2px 0 0 0' }}>
              Effacez les données fictives et réinitialisez l&apos;ensemble des compteurs opérationnels à 0 (vos produits et leurs prix restent 100% préservés).
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '16px' }}>
          <button
            type="button"
            onClick={() => {
              if (confirm('Êtes-vous sûr de vouloir remettre à 0 la comptabilité (toutes les écritures de dépenses) ?')) {
                clearAccountingData();
                showToast('Comptabilité réinitialisée à 0 € / 0 FCFA.');
              }
            }}
            className="admin-btn admin-btn-outline"
            style={{ borderRadius: '24px', padding: '10px 20px', fontSize: '12.5px', fontWeight: 700, color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)' }}
          >
            <span>📊</span> Remettre la Compta à 0
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Êtes-vous sûr de vouloir réinitialiser TOUTES les données fictives (Commandes, Compta, Clients, Fournisseurs, Employés, Support) à 0 ? Vos articles et prix ne seront PAS touchés.')) {
                clearAllMockData();
                showToast('Toutes les données fictives ont été remises à 0 avec succès.');
              }
            }}
            className="admin-btn admin-btn-outline"
            style={{ borderRadius: '24px', padding: '10px 20px', fontSize: '12.5px', fontWeight: 700, color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}
          >
            <span>🗑️</span> Remise à 0 Globale (Compta, Commandes, Clients)
          </button>
        </div>
      </div>
    </div>
  );
};

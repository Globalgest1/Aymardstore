'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ConfirmDialogOptions } from '../AdminConfirmDialog';

interface MarketingTabProps {
  showToast: (msg: string) => void;
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
}

export const MarketingTab: React.FC<MarketingTabProps> = ({
  showToast,
  showConfirmDialog,
}) => {
  const { 
    marketingSubscribers, 
    broadcastLogs, 
    products, 
    merchantSettings, 
    recordBroadcast, 
    toggleSubscriberStatus, 
    deleteSubscriber 
  } = useAppStore();

  const subscribers = marketingSubscribers || [];
  const logs = broadcastLogs || [];
  const prods = products || [];

  const [selectedBroadcastProductId, setSelectedBroadcastProductId] = useState<string>(prods[0]?.id || '');
  const [broadcastMessageText, setBroadcastMessageText] = useState<string>('');
  const [broadcastChannelWhatsapp, setBroadcastChannelWhatsapp] = useState<boolean>(true);
  const [broadcastChannelEmail, setBroadcastChannelEmail] = useState<boolean>(true);
  const [previewChannelTab, setPreviewChannelTab] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [subscriberChannelFilter, setSubscriberChannelFilter] = useState<'ALL' | 'WHATSAPP' | 'EMAIL'>('ALL');
  const [subscriberSearch, setSubscriberSearch] = useState<string>('');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);

  const activeSubscribers = subscribers.filter(s => s.active);
  const whatsappSubscribers = activeSubscribers.filter(s => s.phone && s.channels.includes('WHATSAPP'));
  const emailSubscribers = activeSubscribers.filter(s => s.email && s.channels.includes('EMAIL'));

  const selectedProduct = prods.find(p => p.id === selectedBroadcastProductId) || prods[0];

  const filteredSubscribers = subscribers.filter(s => {
    const matchFilter = subscriberChannelFilter === 'ALL' || s.channels.includes(subscriberChannelFilter);
    const query = subscriberSearch.trim().toLowerCase();
    const matchQuery = !query || 
      (s.name && s.name.toLowerCase().includes(query)) ||
      (s.email && s.email.toLowerCase().includes(query)) ||
      (s.phone && s.phone.includes(query)) ||
      (s.preferredCategory && s.preferredCategory.toLowerCase().includes(query));
    return matchFilter && matchQuery;
  });

  const formattedPriceFcfa = selectedProduct ? `${Math.round(selectedProduct.price * 655.957).toLocaleString('fr-FR')} FCFA` : '0 FCFA';
  const formattedPriceEur = selectedProduct ? `${selectedProduct.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '0 €';
  const productUrl = typeof window !== 'undefined' ? `${window.location.origin}/products/${selectedProduct?.slug || selectedProduct?.id}` : `http://192.168.1.140:3000/products/${selectedProduct?.slug || selectedProduct?.id}`;

  const defaultBroadcastText = selectedProduct ? 
`🔥 *NOUVEAU DROP CHEZ AYMARD STORE !*

👟 *${selectedProduct.name_fr}*
💰 Prix : *${formattedPriceFcfa}* (${formattedPriceEur})
📦 Stock disponible : *${selectedProduct.stock || 1} exemplaire(s)*

👉 *Découvrez et commandez dès maintenant :*
${productUrl}

_Garantie 100% Neuf & Authentique · Expédition Suivie · Service Client WhatsApp 7j/7_` : '';

  const activeMessage = broadcastMessageText.trim() || defaultBroadcastText;

  const handleSendEmailBroadcast = async () => {
    if (!selectedProduct) {
      showToast('⚠️ Veuillez sélectionner un produit à diffuser.');
      return;
    }
    if (emailSubscribers.length === 0) {
      showToast('⚠️ Aucun abonné Email actif trouvé.');
      return;
    }

    setIsBroadcasting(true);
    try {
      const res = await fetch('/api/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product: selectedProduct,
          subscribers: emailSubscribers,
          channels: ['EMAIL'],
          customMessage: broadcastMessageText || selectedProduct.description_fr,
          merchantSettings: merchantSettings
        })
      });
      const data = await res.json();
      if (data.success) {
        recordBroadcast({
          productId: selectedProduct.id,
          productName: selectedProduct.name_fr,
          productImage: selectedProduct.images?.[0] || '',
          productPrice: selectedProduct.price,
          currency: 'EUR',
          channels: ['EMAIL'],
          recipientsCount: data.emailsSent || emailSubscribers.length,
          messageText: activeMessage,
          targetCountEmail: data.emailsSent || emailSubscribers.length
        });
        showToast(`📧 Campagne Email envoyée avec succès à ${data.emailsSent || emailSubscribers.length} abonnés !`);
      } else {
        showToast(`⚠️ Erreur : ${data.error || 'Impossible d\'envoyer la campagne.'}`);
      }
    } catch (err: any) {
      showToast(`⚠️ Erreur de diffusion : ${err.message}`);
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleOpenWhatsappBroadcast = () => {
    if (!selectedProduct) {
      showToast('⚠️ Veuillez sélectionner un produit à diffuser.');
      return;
    }
    const encodedMsg = encodeURIComponent(activeMessage);
    window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, '_blank');
    
    recordBroadcast({
      productId: selectedProduct.id,
      productName: selectedProduct.name_fr,
      productImage: selectedProduct.images?.[0] || '',
      productPrice: selectedProduct.price,
      currency: 'EUR',
      channels: ['WHATSAPP'],
      recipientsCount: whatsappSubscribers.length,
      messageText: activeMessage,
      targetCountWhatsapp: whatsappSubscribers.length
    });
    showToast('💬 Diffusion WhatsApp 1-Clic ouverte !');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>🚀</span>
            <span>Marketing &amp; Alertes Drops Nouveautés (WhatsApp &amp; Email)</span>
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
            Diffusez instantanément vos nouveaux arrivages exclusifs auprès de vos acheteurs et abonnés ayant donné leur consentement (Opt-In).
          </p>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Total Abonnés Opt-In</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', marginTop: '4px' }}>{subscribers.length}</div>
          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>{activeSubscribers.length} abonnés actifs</span>
        </div>

        <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Abonnés WhatsApp 💬</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#25d366', marginTop: '4px' }}>{whatsappSubscribers.length}</div>
          <span style={{ fontSize: '11px', color: '#25d366', fontWeight: 700 }}>Consentement alertes mobiles</span>
        </div>

        <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Abonnés Email 📧</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>{emailSubscribers.length}</div>
          <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>Newsletters &amp; Drops HTML</span>
        </div>

        <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Campagnes Diffusées</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>{logs.length}</div>
          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Historique des drops alertés</span>
        </div>
      </div>

      {/* Studio de Diffusion */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
        {/* Left Box: Broadcast Config */}
        <div className="admin-card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ borderBottom: '1px solid var(--adm-card-border)', paddingBottom: '14px' }}>
            <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📣</span> Configurer l&apos;Alerte Nouveau Produit
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
              Sélectionnez le produit à mettre en avant et personnalisez votre annonce.
            </span>
          </div>

          <div>
            <label className="admin-label" style={{ marginBottom: '6px' }}>1. Choisir le Produit à Diffuser *</label>
            <select
              className="admin-input"
              value={selectedBroadcastProductId || selectedProduct?.id || ''}
              onChange={(e) => {
                setSelectedBroadcastProductId(e.target.value);
                setBroadcastMessageText('');
              }}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '13px' }}
            >
              {prods.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name_fr} — {p.price}€ / {Math.round(p.price * 655.957).toLocaleString('fr-FR')} FCFA (Stock: {p.stock})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="admin-label" style={{ marginBottom: '6px' }}>2. Texte de l&apos;Annonce (Optionnel)</label>
            <textarea
              className="admin-input"
              rows={4}
              placeholder="Laissez vide pour utiliser le format standardisé avec emojis, prix et lien..."
              value={broadcastMessageText}
              onChange={(e) => setBroadcastMessageText(e.target.value)}
              style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '12.5px', resize: 'vertical' }}
            />
          </div>

          <div style={{ background: 'var(--adm-table-stripe)', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--adm-card-border)' }}>
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', display: 'block', marginBottom: '8px' }}>
              3. Canaux de Diffusion Prévus :
            </span>
            <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--adm-text-h)', fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={broadcastChannelWhatsapp}
                  onChange={(e) => setBroadcastChannelWhatsapp(e.target.checked)}
                  style={{ accentColor: '#25d366', width: '16px', height: '16px' }}
                />
                <span>💬 WhatsApp ({whatsappSubscribers.length} abonnés)</span>
              </label>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--adm-text-h)', fontWeight: 700 }}>
                <input
                  type="checkbox"
                  checked={broadcastChannelEmail}
                  onChange={(e) => setBroadcastChannelEmail(e.target.checked)}
                  style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
                />
                <span>📧 Email ({emailSubscribers.length} abonnés)</span>
              </label>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {broadcastChannelWhatsapp && (
                <button
                  type="button"
                  onClick={handleOpenWhatsappBroadcast}
                  className="admin-btn"
                  style={{
                    flex: '1 1 180px',
                    background: '#25d366',
                    color: '#ffffff',
                    borderRadius: '14px',
                    padding: '12px 18px',
                    fontWeight: 800,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
                  }}
                >
                  <span>💬</span>
                  <span>Diffuser sur WhatsApp (1-Clic)</span>
                </button>
              )}

              {broadcastChannelEmail && (
                <button
                  type="button"
                  onClick={handleSendEmailBroadcast}
                  disabled={isBroadcasting}
                  className="admin-btn admin-btn-primary"
                  style={{
                    flex: '1 1 180px',
                    borderRadius: '14px',
                    padding: '12px 18px',
                    fontWeight: 800,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px'
                  }}
                >
                  <span>📧</span>
                  <span>{isBroadcasting ? 'Envoi en cours...' : 'Envoyer par Email (HTML)'}</span>
                </button>
              )}
            </div>

            {broadcastChannelWhatsapp && whatsappSubscribers.length > 0 && (
              <div style={{ marginTop: '8px', borderTop: '1px dashed var(--adm-card-border)', paddingTop: '10px' }}>
                <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                  ⚡ Envoi direct individuel 1-clic aux abonnés WhatsApp :
                </span>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '110px', overflowY: 'auto' }}>
                  {whatsappSubscribers.map(sub => {
                    const cleanPhone = (sub.phone || '').replace(/[^0-9]/g, '');
                    const directUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(activeMessage)}`;
                    return (
                      <a
                        key={sub.id}
                        href={directUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: 'rgba(37, 211, 102, 0.12)',
                          color: '#16a34a',
                          border: '1px solid rgba(37, 211, 102, 0.3)',
                          padding: '4px 10px',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 800,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title={`Envoyer directement à ${sub.name} (${sub.phone})`}
                      >
                        <span>💬</span>
                        <span>{sub.name || sub.phone}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Box: Live Previews */}
        <div className="admin-card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--adm-card-border)', paddingBottom: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
              📱 Aperçu en direct du message
            </span>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setPreviewChannelTab('WHATSAPP')}
                style={{
                  background: previewChannelTab === 'WHATSAPP' ? '#25d366' : 'var(--adm-table-stripe)',
                  color: previewChannelTab === 'WHATSAPP' ? '#ffffff' : 'var(--adm-text-m)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                WhatsApp
              </button>
              <button
                type="button"
                onClick={() => setPreviewChannelTab('EMAIL')}
                style={{
                  background: previewChannelTab === 'EMAIL' ? '#38bdf8' : 'var(--adm-table-stripe)',
                  color: previewChannelTab === 'EMAIL' ? '#09090b' : 'var(--adm-text-m)',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '4px 10px',
                  fontSize: '11px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Email HTML
              </button>
            </div>
          </div>

          {previewChannelTab === 'WHATSAPP' ? (
            <div style={{ background: '#0b141a', borderRadius: '18px', padding: '18px', color: '#e9edef', fontFamily: 'system-ui, -apple-system, sans-serif', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#25d366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900 }}>A</div>
                <div>
                  <strong style={{ fontSize: '12px', color: '#fff', display: 'block' }}>Aymard Store (Officiel)</strong>
                  <span style={{ fontSize: '9.5px', color: '#8696a0' }}>Compte Professionnel Vérifié ✓</span>
                </div>
              </div>

              <div style={{ background: '#005c4b', borderRadius: '14px 14px 2px 14px', padding: '12px 14px', maxWidth: '340px', marginLeft: 'auto', color: '#e9edef', fontSize: '12.5px', lineHeight: 1.45, boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                {selectedProduct?.images?.[0] && (
                  <img src={selectedProduct.images[0]} alt="Product" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px' }} />
                )}
                <div style={{ whiteSpace: 'pre-line' }}>
                  {activeMessage}
                </div>
                <div style={{ textAlign: 'right', fontSize: '9.5px', color: 'rgba(255,255,255,0.6)', marginTop: '6px' }}>
                  12:00 ✓✓
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '18px', padding: '20px', color: '#ffffff', textAlign: 'center' }}>
              <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '4px' }}>AYMARD<span style={{ color: '#38bdf8' }}>STORE</span></div>
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '9.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                🔥 NOUVEL ARRIVAGE EXCLUSIF
              </span>

              {selectedProduct?.images?.[0] && (
                <img src={selectedProduct.images[0]} alt="Product" style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '12px', margin: '14px 0 10px 0' }} />
              )}

              <h4 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 6px 0', color: '#ffffff' }}>
                {selectedProduct?.name_fr}
              </h4>
              <div style={{ fontSize: '16px', fontWeight: 900, color: '#facc15', marginBottom: '10px' }}>
                {formattedPriceFcfa} · {formattedPriceEur}
              </div>
              <p style={{ fontSize: '11.5px', color: '#a1a1aa', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                {broadcastMessageText || selectedProduct?.description_fr || 'Découvrez cette nouvelle pièce exclusive disponible dès maintenant.'}
              </p>
              <div style={{ display: 'inline-block', background: '#ffffff', color: '#09090b', padding: '8px 20px', borderRadius: '20px', fontWeight: 900, fontSize: '11.5px' }}>
                DÉCOUVRIR LE PRODUIT ➔
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table of Opt-in Subscribers */}
      <div className="admin-card" style={{ padding: '24px', borderRadius: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
          <div>
            <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>👥</span> Base des Abonnés Consentants ({filteredSubscribers.length})
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
              Clients ayant opté pour la réception des alertes nouveautés via le site, le panier ou leur compte.
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[
                { id: 'ALL', label: `Tous (${subscribers.length})` },
                { id: 'WHATSAPP', label: `WhatsApp (${whatsappSubscribers.length})` },
                { id: 'EMAIL', label: `Email (${emailSubscribers.length})` },
              ].map(f => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSubscriberChannelFilter(f.id as any)}
                  className={`admin-btn ${subscriberChannelFilter === f.id ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                  style={{ borderRadius: '14px', padding: '6px 12px', fontSize: '11.5px', fontWeight: 700 }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <input
              type="text"
              className="admin-input"
              placeholder="Rechercher nom, email, tél..."
              value={subscriberSearch}
              onChange={(e) => setSubscriberSearch(e.target.value)}
              style={{ width: '200px', padding: '6px 12px', borderRadius: '14px', fontSize: '12px' }}
            />
          </div>
        </div>

        {filteredSubscribers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--adm-text-m)' }}>
            <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>📭</span>
            <p style={{ margin: 0, fontSize: '13px' }}>Aucun abonné correspondant aux critères.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: 'var(--adm-table-stripe)', borderBottom: '1px solid var(--adm-card-border)', textAlign: 'left' }}>
                  <th style={{ padding: '12px 16px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Abonné</th>
                  <th style={{ padding: '12px 16px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Canaux Autorisés</th>
                  <th style={{ padding: '12px 16px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Source Opt-In</th>
                  <th style={{ padding: '12px 16px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Date Inscription</th>
                  <th style={{ padding: '12px 16px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Statut</th>
                  <th style={{ padding: '12px 16px', color: 'var(--adm-text-m)', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredSubscribers.map(sub => (
                  <tr key={sub.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                    <td style={{ padding: '14px 16px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block' }}>{sub.name || 'Client Aymard Store'}</strong>
                      <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', display: 'block' }}>{sub.email || '—'}</span>
                      {sub.phone && (
                        <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>{sub.phone}</span>
                      )}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {sub.channels.includes('WHATSAPP') && (
                          <span style={{ background: 'rgba(37, 211, 102, 0.15)', color: '#16a34a', fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                            💬 WhatsApp
                          </span>
                        )}
                        {sub.channels.includes('EMAIL') && (
                          <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#0284c7', fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                            📧 Email
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ fontSize: '11px', background: 'var(--adm-table-stripe)', padding: '3px 8px', borderRadius: '8px', fontWeight: 700 }}>
                        {sub.source === 'CHECKOUT' ? '🛒 Commande' : sub.source === 'ACCOUNT' ? '👤 Espace Compte' : '🌐 Bas de page (Footer)'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', color: 'var(--adm-text-m)' }}>
                      {sub.subscribedAt}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '3px 8px',
                        borderRadius: '10px',
                        background: sub.active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: sub.active ? '#10b981' : '#ef4444'
                      }}>
                        {sub.active ? '✓ Actif' : '✕ Inactif'}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => store.toggleSubscriberStatus(sub.id)}
                          className="admin-btn admin-btn-sm admin-btn-outline"
                          style={{ borderRadius: '10px', padding: '4px 10px', fontSize: '11px' }}
                          title={sub.active ? 'Désactiver' : 'Activer'}
                        >
                          {sub.active ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            showConfirmDialog({
                              title: 'Supprimer cet abonné ?',
                              message: `Supprimer définitivement ${sub.name || sub.email || sub.phone} de la liste des alertes ?`,
                              onConfirm: () => {
                                deleteSubscriber(sub.id);
                                showToast('Abonné supprimé.');
                              },
                              type: 'danger',
                              confirmLabel: 'Supprimer',
                              icon: '🗑️'
                            });
                          }}
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          style={{ borderRadius: '10px', padding: '4px 10px', fontSize: '11px' }}
                          title="Supprimer"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section: Historique des Diffusions Récentes */}
      <div className="admin-card" style={{ padding: '24px', borderRadius: '20px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--adm-text-h)', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>📜</span> Historique des Alertes Nouveautés Diffusées ({logs.length})
        </h3>
        {logs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--adm-text-m)', fontSize: '13px' }}>
            Aucune campagne de diffusion enregistrée pour le moment. Vos futurs lancements de drops apparaîtront ici.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
              <thead>
                <tr style={{ background: 'var(--adm-table-stripe)', borderBottom: '1px solid var(--adm-card-border)', textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Date &amp; Heure</th>
                  <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Produit</th>
                  <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Canaux</th>
                  <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Destinataires</th>
                  <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                    <td style={{ padding: '12px 14px', color: 'var(--adm-text-m)' }}>{log.sentAt}</td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {log.productImage && (
                          <img src={log.productImage} alt={log.productName} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                        )}
                        <strong style={{ color: 'var(--adm-text-h)' }}>{log.productName}</strong>
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {log.channels.map(c => (
                          <span key={c} style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', background: c === 'WHATSAPP' ? 'rgba(37, 211, 102, 0.15)' : 'rgba(56, 189, 248, 0.15)', color: c === 'WHATSAPP' ? '#16a34a' : '#0284c7' }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                      {log.recipientsCount} abonnés
                    </td>
                    <td style={{ padding: '12px 14px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '8px' }}>
                        ✓ Diffusé
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

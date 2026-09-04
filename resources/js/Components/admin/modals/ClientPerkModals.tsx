'use client';

import React, { useState } from 'react';
import { useAppStore, Client, formatPrice, convertPrice, calculatePointsEarned, generateReferralCode } from '@/lib/store';

interface ClientPerkModalsProps {
  grantPerkClient: Client | null;
  setGrantPerkClient: (c: Client | null) => void;
  grantBonusPointsClient: Client | null;
  setGrantBonusPointsClient: (c: Client | null) => void;
  auditClient: Client | null;
  setAuditClient: (c: Client | null) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const ClientPerkModals: React.FC<ClientPerkModalsProps> = ({
  grantPerkClient,
  setGrantPerkClient,
  grantBonusPointsClient,
  setGrantBonusPointsClient,
  auditClient,
  setAuditClient,
  showToast,
}) => {
  const store = useAppStore();

  // Perk state
  const [customPerkTitle, setCustomPerkTitle] = useState<string>('Paire de Chaussettes Aymard Offerte');
  const [customPerkDesc, setCustomPerkDesc] = useState<string>('À réclamer lors de votre prochaine livraison ou en boutique.');
  const [customPerkIcon, setCustomPerkIcon] = useState<string>('🎁');

  // Bonus points state
  const [bonusPointsInput, setBonusPointsInput] = useState<number>(100);
  const [bonusPointsReason, setBonusPointsReason] = useState<string>('');

  return (
    <>
      {/* 1. ACCORDER UN PRIVILÈGE OU CADEAU VIP */}
      {grantPerkClient && (
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
            backgroundColor: 'rgba(0, 0, 0, 0.70)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setGrantPerkClient(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'var(--adm-card-bg)',
              borderRadius: '24px',
              border: '1px solid var(--adm-card-border)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalZoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '20px 26px',
              borderBottom: '1px solid var(--adm-card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #09090b, #18181b)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>🎁</span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#ffffff' }}>
                    Accorder un Cadeau ou Privilège
                  </h3>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0 0' }}>
                    Destinataire : <strong style={{ color: '#38bdf8' }}>{grantPerkClient.name}</strong> ({grantPerkClient.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGrantPerkClient(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '75vh', overflowY: 'auto' }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--adm-text-m)', marginBottom: 8 }}>
                  Modèles de privilèges rapides (1 Clic)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { icon: '🎁', title: 'Paire de Chaussettes Aymard Offerte', desc: 'À réclamer lors de votre prochaine livraison ou en boutique.' },
                    { icon: '🚚', title: 'Livraison Express Prioritaire Gratuite', desc: 'Vos commandes sont expédiées en priorité absolue sans frais.' },
                    { icon: '🔥', title: 'Accès Privé Drop Sneakers Rares', desc: 'Accès exclusif aux sorties limitées 24h avant le public.' },
                    { icon: '💳', title: "Bon d'Achat Cadeau 10 000 FCFA", desc: "Valable sur l'ensemble du catalogue sans minimum d'achat." },
                    { icon: '💳', title: "Bon d'Achat Cadeau 25 000 FCFA", desc: 'Offre spéciale VIP déductible immédiatement.' },
                    { icon: '💎', title: 'Pack Goodies VIP + Carte Black Edition', desc: 'Remis en main propre avec votre prochaine acquisition.' }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomPerkTitle(p.title);
                        setCustomPerkDesc(p.desc);
                        setCustomPerkIcon(p.icon);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: customPerkTitle === p.title ? '1.5px solid #8b5cf6' : '1px solid var(--adm-card-border)',
                        background: customPerkTitle === p.title ? 'rgba(139,92,246,0.12)' : 'var(--adm-card-bg)',
                        color: customPerkTitle === p.title ? '#8b5cf6' : 'var(--adm-text-h)',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {p.icon} {p.title}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 6 }}>
                  Intitulé du Privilège / Cadeau
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={customPerkTitle}
                  onChange={(e) => setCustomPerkTitle(e.target.value)}
                  placeholder="ex: Paire de Chaussettes Aymard Offerte"
                  style={{ width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 6 }}>
                  Détails &amp; Conditions d&apos;utilisation
                </label>
                <textarea
                  className="admin-input"
                  value={customPerkDesc}
                  onChange={(e) => setCustomPerkDesc(e.target.value)}
                  rows={3}
                  placeholder="ex: Présentez ce bon lors de votre prochaine livraison pour recevoir votre cadeau."
                  style={{ width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 13, resize: 'vertical' }}
                />
              </div>
            </div>

            <div style={{ padding: '16px 26px', borderTop: '1px solid var(--adm-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setGrantPerkClient(null)}
                className="admin-btn admin-btn-outline"
                style={{ borderRadius: 10, padding: '10px 18px', fontWeight: 700 }}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!customPerkTitle.trim()) return;
                  store.grantClientPerk(grantPerkClient.id, {
                    title: customPerkTitle.trim(),
                    description: customPerkDesc.trim(),
                    icon: customPerkIcon
                  });
                  setGrantPerkClient(null);
                  showToast(`🎁 Privilège "${customPerkTitle}" accordé à ${grantPerkClient.name} !`);
                }}
                className="admin-btn admin-btn-primary"
                style={{ borderRadius: 10, padding: '10px 22px', fontWeight: 800, background: '#8b5cf6' }}
              >
                ✓ Accorder &amp; Notifier le Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. CRÉDITER DES POINTS FIDÉLITÉ VIP */}
      {grantBonusPointsClient && (
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
            backgroundColor: 'rgba(0, 0, 0, 0.70)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setGrantBonusPointsClient(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: 'var(--adm-card-bg)',
              borderRadius: '24px',
              border: '1px solid var(--adm-card-border)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalZoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '20px 26px',
              borderBottom: '1px solid var(--adm-card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #09090b, #18181b)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>★</span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#facc15' }}>
                    Créditer des Points Fidélité VIP
                  </h3>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0 0' }}>
                    Client : <strong style={{ color: '#ffffff' }}>{grantBonusPointsClient.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGrantBonusPointsClient(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--adm-text-m)', marginBottom: 8 }}>
                  Montants Rapides
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[50, 100, 200, 500, 1000].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setBonusPointsInput(pts)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: bonusPointsInput === pts ? '1.5px solid #facc15' : '1px solid var(--adm-card-border)',
                        background: bonusPointsInput === pts ? 'rgba(250,204,21,0.15)' : 'var(--adm-card-bg)',
                        color: bonusPointsInput === pts ? '#d97706' : 'var(--adm-text-h)',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      +{pts} Pts
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 6 }}>
                  Nombre de Points à Créditer
                </label>
                <input
                  type="number"
                  min={1}
                  className="admin-input"
                  value={bonusPointsInput}
                  onChange={(e) => setBonusPointsInput(parseInt(e.target.value, 10) || 0)}
                  style={{ width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 6 }}>
                  Motif / Message adressé au client
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={bonusPointsReason}
                  onChange={(e) => setBonusPointsReason(e.target.value)}
                  placeholder="ex: Récompense fidélité spéciale, Anniversaire, Geste commercial..."
                  style={{ width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}
                />
              </div>
            </div>

            <div style={{ padding: '16px 26px', borderTop: '1px solid var(--adm-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setGrantBonusPointsClient(null)}
                className="admin-btn admin-btn-outline"
                style={{ borderRadius: 10, padding: '10px 18px', fontWeight: 700 }}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  if (bonusPointsInput <= 0) return;
                  store.grantClientBonusPoints(grantBonusPointsClient.id, bonusPointsInput, bonusPointsReason);
                  setGrantBonusPointsClient(null);
                  showToast(`★ +${bonusPointsInput} points crédités à ${grantBonusPointsClient.name} !`);
                }}
                className="admin-btn admin-btn-primary"
                style={{ borderRadius: 10, padding: '10px 22px', fontWeight: 800, background: '#f59e0b' }}
              >
                ✓ Créditer les Points
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. AUDIT DÉTAILLÉ DES POINTS & PARRAINAGE CLIENT */}
      {auditClient && (() => {
        const clientEmail = (auditClient.email || '').toLowerCase();
        const clientRefCode = auditClient.referralCode || generateReferralCode(auditClient.email, auditClient.name);
        const clientTxList = (store.pointTransactions || []).filter(tx => tx.userEmail.toLowerCase() === clientEmail);
        const orderPts = calculatePointsEarned(auditClient.totalSpent, store.currency);
        const totalPtsEarned = orderPts + (auditClient.bonusPoints || 0) + (auditClient.referralPointsEarned || 0);
        const spentPts = auditClient.spentLoyaltyPoints || 0;
        const activePoints = Math.max(0, totalPtsEarned - spentPts);
        const clientReferrals = (store.clients || []).filter(c => c.referredBy === clientRefCode);

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
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={() => setAuditClient(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '850px',
                maxHeight: '90vh',
                backgroundColor: 'var(--adm-card-bg)',
                borderRadius: '24px',
                border: '1.5px solid var(--adm-card-border)',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animation: 'modalZoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{
                padding: '22px 28px',
                borderBottom: '1px solid var(--adm-card-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #09090b, #1e1e24)',
                color: '#ffffff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    💎
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: '#facc15' }}>
                        Audit des Points &amp; Score Fidélité
                      </h3>
                      <span style={{ fontSize: 10, fontWeight: 900, background: '#10b981', color: '#ffffff', padding: '2px 8px', borderRadius: 8 }}>
                        1€/1000F = 1PT
                      </span>
                    </div>
                    <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '3px 0 0 0' }}>
                      Client : <strong style={{ color: '#ffffff' }}>{auditClient.name}</strong> ({auditClient.email})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAuditClient(null)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontWeight: 800 }}
                >
                  ✕
                </button>
              </div>

              <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                  <div style={{ background: 'var(--adm-card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--adm-card-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--adm-text-m)', fontWeight: 800, textTransform: 'uppercase' }}>Points Disponibles</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', marginTop: 4 }}>{activePoints} Pts</div>
                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>Actuellement utilisables</span>
                  </div>

                  <div style={{ background: 'var(--adm-card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--adm-card-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--adm-text-m)', fontWeight: 800, textTransform: 'uppercase' }}>Total Acquis à Vie</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--adm-text-h)', marginTop: 4 }}>{totalPtsEarned} Pts</div>
                    <span style={{ fontSize: 11, color: 'var(--adm-text-m)' }}>Achats + Bonus + Parrainage</span>
                  </div>

                  <div style={{ background: 'var(--adm-card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--adm-card-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--adm-text-m)', fontWeight: 800, textTransform: 'uppercase' }}>Code d&apos;Affiliation</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0284c7', marginTop: 4, fontFamily: 'monospace' }}>{clientRefCode}</div>
                    <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 700 }}>👥 {clientReferrals.length} filleul(s) enregistrés</span>
                  </div>
                </div>

                <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '16px', padding: '14px 18px', fontSize: '12.5px', color: 'var(--adm-text-h)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <strong>🔗 Lien d&apos;affiliation :</strong> <code style={{ color: '#0284c7', background: 'rgba(2,132,199,0.12)', padding: '2px 6px', borderRadius: 6 }}>https://aymardstore.com/?ref={clientRefCode}</code>
                  </div>
                  <div>
                    <strong>Parrain :</strong> {auditClient.referredBy ? <span style={{ color: '#10b981', fontWeight: 800 }}>{auditClient.referredBy}</span> : <span style={{ color: 'var(--adm-text-m)' }}>Aucun (Direct)</span>}
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--adm-text-h)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📜 Justification Détaillée des Points
                    </h4>
                    <span style={{ fontSize: 11, color: 'var(--adm-text-m)' }}>
                      Règle : 1€ = 1 PT · 1 000 FCFA = 1 PT
                    </span>
                  </div>

                  <div style={{ border: '1px solid var(--adm-card-border)', borderRadius: '16px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'var(--adm-table-stripe)', borderBottom: '1px solid var(--adm-card-border)', textAlign: 'left' }}>
                          <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Date</th>
                          <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Origine / Type</th>
                          <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Détails / Justificatif</th>
                          <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800, textAlign: 'right' }}>Impact Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {clientTxList.length > 0 ? (
                          clientTxList.map(tx => (
                            <tr key={tx.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                              <td style={{ padding: '12px 14px', color: 'var(--adm-text-m)', whiteSpace: 'nowrap' }}>{tx.date}</td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  background: tx.type === 'REFERRAL_PURCHASE' ? 'rgba(16,185,129,0.15)' : tx.type === 'REFERRAL_SIGNUP' ? 'rgba(59,130,246,0.15)' : tx.type === 'CONVERSION_PROMO' ? 'rgba(239,68,68,0.15)' : tx.type === 'ADMIN_GRANT' ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.15)',
                                  color: tx.type === 'REFERRAL_PURCHASE' ? '#10b981' : tx.type === 'REFERRAL_SIGNUP' ? '#3b82f6' : tx.type === 'CONVERSION_PROMO' ? '#ef4444' : tx.type === 'ADMIN_GRANT' ? '#8b5cf6' : '#d97706'
                                }}>
                                  {tx.type === 'REFERRAL_PURCHASE' ? 'COMMISSION FILLEUL 10%' : tx.type === 'REFERRAL_SIGNUP' ? 'INSCRIPTION FILLEUL' : tx.type === 'CONVERSION_PROMO' ? "COUPON D'ACHAT" : tx.type === 'ADMIN_GRANT' ? 'ATTRIBUTION ADMIN' : 'ACHAT PERSONNEL'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--adm-text-h)', fontWeight: 600 }}>{tx.description}</td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: tx.amount > 0 ? '#10b981' : '#ef4444' }}>
                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Pts
                              </td>
                            </tr>
                          ))
                        ) : (
                          <>
                            <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                              <td style={{ padding: '12px 14px', color: 'var(--adm-text-m)' }}>{auditClient.registeredDate || 'Initial'}</td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#d97706' }}>
                                  ACHATS CUMULÉS
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--adm-text-h)', fontWeight: 600 }}>
                                {auditClient.totalOrders} commande(s) validée(s) pour un montant total de {formatPrice(convertPrice(auditClient.totalSpent, store.currency), store.currency)}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>
                                +{orderPts} Pts
                              </td>
                            </tr>
                            {auditClient.bonusPoints ? (
                              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                                <td style={{ padding: '12px 14px', color: 'var(--adm-text-m)' }}>Historique</td>
                                <td style={{ padding: '12px 14px' }}>
                                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
                                    BONUS ADMIN VIP
                                  </span>
                                </td>
                                <td style={{ padding: '12px 14px', color: 'var(--adm-text-h)', fontWeight: 600 }}>
                                  Attribution de points bonus VIP accordés par la direction
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>
                                  +{auditClient.bonusPoints} Pts
                                </td>
                              </tr>
                            ) : null}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              <div style={{ padding: '16px 28px', borderTop: '1px solid var(--adm-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setAuditClient(null)}
                  className="admin-btn admin-btn-outline"
                  style={{ borderRadius: 10, padding: '10px 18px', fontWeight: 700 }}
                >
                  Fermer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetClient = auditClient;
                    setAuditClient(null);
                    setGrantBonusPointsClient(targetClient);
                    setBonusPointsInput(100);
                    setBonusPointsReason('');
                  }}
                  className="admin-btn admin-btn-primary"
                  style={{ borderRadius: 10, padding: '10px 20px', fontWeight: 800, background: '#10b981' }}
                >
                  ★ Créditer des Points à ce Client
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
};

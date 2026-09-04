'use client';

import React, { useState, useRef } from 'react';
import { useAppStore, SupportConversationStatus } from '@/lib/store';
import { ConfirmDialogOptions } from '../AdminConfirmDialog';

interface SupportChatTabProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
}

export const SupportChatTab: React.FC<SupportChatTabProps> = ({
  showToast,
  showConfirmDialog,
}) => {
  const { 
    supportConversations, 
    markConversationAsRead, 
    updateSupportConversationStatus, 
    closeSupportConversation, 
    deleteSupportConversation, 
    adminReplySupportMessage 
  } = useAppStore();

  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [supportFilterStatus, setSupportFilterStatus] = useState<string>('ALL');
  const [supportSearch, setSupportSearch] = useState('');
  const [adminChatInput, setAdminChatInput] = useState('');
  const [adminSelectedImage, setAdminSelectedImage] = useState<string | null>(null);
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  const convs = supportConversations || [];
  const liveRequestsCount = convs.filter(c => c.status === 'PENDING_AGENT').length;
  const inProgressCount = convs.filter(c => c.status === 'IN_PROGRESS').length;
  const satisfiedCount = convs.filter(c => c.status === 'SATISFIED').length;
  const closedCount = convs.filter(c => c.status === 'CLOSED').length;
  const botCount = convs.filter(c => c.status === 'BOT').length;

  const getStatusBadge = (status: SupportConversationStatus | string) => {
    switch (status) {
      case 'PENDING_AGENT':
        return {
          label: '🔴 En attente Conseiller',
          shortLabel: '🔴 En attente',
          bg: 'rgba(239, 68, 68, 0.15)',
          color: '#dc2626',
          border: '1px solid rgba(239, 68, 68, 0.4)'
        };
      case 'IN_PROGRESS':
        return {
          label: '🟡 En cours',
          shortLabel: '🟡 En cours',
          bg: 'rgba(245, 158, 11, 0.15)',
          color: '#d97706',
          border: '1px solid rgba(245, 158, 11, 0.4)'
        };
      case 'SATISFIED':
        return {
          label: '🟢 Satisfait / Résolu',
          shortLabel: '🟢 Satisfait',
          bg: 'rgba(16, 185, 129, 0.15)',
          color: '#059669',
          border: '1px solid rgba(16, 185, 129, 0.4)'
        };
      case 'CLOSED':
        return {
          label: '⚪ Clôturé',
          shortLabel: '⚪ Clôturé',
          bg: 'rgba(100, 116, 139, 0.15)',
          color: '#64748b',
          border: '1px solid rgba(100, 116, 139, 0.4)'
        };
      case 'BOT':
      default:
        return {
          label: '🤖 Concierge Bot',
          shortLabel: '🤖 Bot',
          bg: 'rgba(168, 85, 247, 0.15)',
          color: '#7e22ce',
          border: '1px solid rgba(168, 85, 247, 0.4)'
        };
    }
  };

  const filteredConvs = convs.filter(c => {
    if (supportFilterStatus !== 'ALL') {
      if (c.status !== supportFilterStatus) return false;
    }
    if (supportSearch.trim()) {
      const q = supportSearch.toLowerCase().trim();
      const matchName = c.customerName?.toLowerCase().includes(q);
      const matchTopic = c.topic?.toLowerCase().includes(q);
      const matchEmail = c.customerEmail?.toLowerCase().includes(q);
      const matchMsg = c.messages.some(m => m.text?.toLowerCase().includes(q));
      if (!matchName && !matchTopic && !matchEmail && !matchMsg) return false;
    }
    return true;
  });

  const activeConv = convs.find(c => c.id === selectedConvId) || filteredConvs[0] || convs[0];

  const handleAdminImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Veuillez choisir une image valide (JPG, PNG, etc.)', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      setAdminSelectedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendAdminReply = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!adminChatInput.trim() && !adminSelectedImage) || !activeConv) return;
    adminReplySupportMessage(activeConv.id, adminChatInput.trim() || (adminSelectedImage ? 'Photo envoyée par Aymard Store' : ''), adminSelectedImage || undefined);
    setAdminChatInput('');
    setAdminSelectedImage(null);
    showToast('Réponse envoyée au client en direct !');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#10b981' }}>
              CENTRE DE CONCIERGERIE &amp; MESSAGERIE EN DIRECT
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Live Chat Support &amp; Clients
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
              Gérez chaque discussion client de manière distincte avec son motif, date/heure et badge de statut (En attente, En cours, Satisfait, Clôturé).
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            {liveRequestsCount > 0 && (
              <span style={{ background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 800, padding: '8px 18px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}>
                <span>🚨</span> {liveRequestsCount} demande(s) d&apos;agent en direct !
              </span>
            )}
            <button
              onClick={() => {
                const msg = encodeURIComponent("Bonjour, je vous contacte depuis le service client Aymard Store.");
                window.open(`https://wa.me/2290197362906?text=${msg}`, '_blank');
              }}
              className="admin-btn"
              style={{
                background: '#25D366',
                color: '#fff',
                borderRadius: '30px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <span>📲 WhatsApp Web</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2-Column Chat Studio */}
      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, minHeight: '640px' }}>
        {/* Left Column: Filter Tabs, Search & Conversations List */}
        <div className="admin-card" style={{ padding: '20px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Search Input */}
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="Rechercher par client, motif, message..."
              value={supportSearch}
              onChange={(e) => setSupportSearch(e.target.value)}
              className="admin-input"
              style={{ width: '100%', borderRadius: '14px', padding: '10px 14px 10px 36px', fontSize: '13px' }}
            />
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-text-m)' }}>🔍</span>
          </div>

          {/* Status Filter Chips */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `Toutes (${convs.length})` },
              { id: 'PENDING_AGENT', label: `🔴 En attente (${liveRequestsCount})` },
              { id: 'IN_PROGRESS', label: `🟡 En cours (${inProgressCount})` },
              { id: 'SATISFIED', label: `🟢 Satisfait (${satisfiedCount})` },
              { id: 'CLOSED', label: `⚪ Clôturées (${closedCount})` },
              { id: 'BOT', label: `🤖 Bot (${botCount})` }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setSupportFilterStatus(tab.id)}
                style={{
                  fontSize: '11px',
                  fontWeight: supportFilterStatus === tab.id ? 800 : 600,
                  padding: '4px 10px',
                  borderRadius: '12px',
                  border: supportFilterStatus === tab.id ? '1.5px solid var(--adm-text-h)' : '1px solid var(--adm-card-border)',
                  background: supportFilterStatus === tab.id ? 'var(--adm-text-h)' : 'var(--adm-card-bg)',
                  color: supportFilterStatus === tab.id ? 'var(--adm-card-bg)' : 'var(--adm-text-m)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Conversations List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, maxHeight: '520px', paddingRight: 4 }}>
            {filteredConvs.map(c => {
              const isSelected = activeConv?.id === c.id;
              const lastMsg = c.messages[c.messages.length - 1];
              const badge = getStatusBadge(c.status);

              return (
                <div
                  key={c.id}
                  onClick={() => {
                    setSelectedConvId(c.id);
                    markConversationAsRead(c.id);
                  }}
                  style={{
                    padding: '14px 16px',
                    borderRadius: '16px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--adm-card-border)',
                    border: isSelected ? '2px solid #0284c7' : '1px solid transparent',
                    transition: 'all 0.15s ease',
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--adm-text-h)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span>👤 {c.customerName || 'Visiteur'}</span>
                        {c.unreadByAdmin && (
                          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444', flexShrink: 0 }} />
                        )}
                      </div>
                      <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0284c7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                        🏷️ {c.topic || 'Demande client'}
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: '10.5px', color: 'var(--adm-text-m)', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span>📅 {c.createdAt || 'Aujourd\'hui'}</span>
                    <span>•</span>
                    <span>⏱️ {c.lastUpdated}</span>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--adm-text-m)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4' }}>
                    {lastMsg?.text || (lastMsg?.image ? '📷 Photo partagée' : 'Nouvelle discussion')}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                    <span style={{
                      fontSize: '10.5px',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontWeight: 800,
                      background: badge.bg,
                      color: badge.color,
                      border: badge.border,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 4
                    }}>
                      {badge.shortLabel}
                    </span>

                    <span style={{ fontSize: '10px', color: 'var(--adm-text-m)' }}>
                      {c.messages.length} msg{c.messages.length > 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })}

            {filteredConvs.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--adm-text-m)', fontSize: '13px' }}>
                <span style={{ fontSize: '32px' }}>💬</span>
                <div style={{ marginTop: 8, fontWeight: 700, color: 'var(--adm-text-h)' }}>Aucune discussion en cours</div>
                <div style={{ fontSize: '11.5px', marginTop: 4, lineHeight: '1.4', color: 'var(--adm-text-m)' }}>
                  Les discussions engagées par les visiteurs et clients apparaîtront ici automatiquement en temps réel.
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Chat Window, Status Selector & Response Form */}
        <div className="admin-card" style={{ padding: '0', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {activeConv ? (
            <>
              {/* Active Chat Header */}
              <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--adm-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--adm-text-h)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span>👤 {activeConv.customerName}</span>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', marginTop: 2 }}>
                    🏷️ Motif : {activeConv.topic || 'Demande client'}
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: 3 }}>
                    📅 Ouvert le : <strong>{activeConv.createdAt || 'Aujourd\'hui'}</strong> • Dernier échange : <strong>{activeConv.lastUpdated}</strong>
                    {activeConv.customerEmail && ` • Email : ${activeConv.customerEmail}`}
                    {activeConv.customerPhone && ` • Tél : ${activeConv.customerPhone}`}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Statut :</span>
                    <select
                      value={activeConv.status}
                      onChange={(e) => {
                        const newStatus = e.target.value as SupportConversationStatus;
                        updateSupportConversationStatus(activeConv.id, newStatus);
                        showToast(`Statut mis à jour : ${newStatus}`);
                      }}
                      style={{
                        fontSize: '11.5px',
                        fontWeight: 800,
                        padding: '6px 12px',
                        borderRadius: '14px',
                        border: getStatusBadge(activeConv.status).border,
                        background: getStatusBadge(activeConv.status).bg,
                        color: getStatusBadge(activeConv.status).color,
                        cursor: 'pointer',
                        outline: 'none'
                      }}
                    >
                      <option value="PENDING_AGENT">🔴 En attente Conseiller</option>
                      <option value="IN_PROGRESS">🟡 En cours de traitement</option>
                      <option value="SATISFIED">🟢 Satisfait / Résolu</option>
                      <option value="BOT">🤖 Concierge Bot</option>
                      <option value="CLOSED">⚪ Clôturé / Archivé</option>
                    </select>
                  </div>

                  {activeConv.status !== 'SATISFIED' && (
                    <button
                      onClick={() => {
                        updateSupportConversationStatus(activeConv.id, 'SATISFIED');
                        showToast('Discussion marquée comme Satisfaite / Résolue 🟢');
                      }}
                      className="admin-btn admin-btn-sm"
                      style={{ background: 'rgba(16,185,129,0.15)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', fontWeight: 700 }}
                    >
                      ✓ Satisfait
                    </button>
                  )}

                  {activeConv.status !== 'CLOSED' && (
                    <button
                      onClick={() => {
                        closeSupportConversation(activeConv.id, 'CLOSED');
                        showToast('Discussion clôturée et archivée ⚪');
                      }}
                      className="admin-btn admin-btn-outline admin-btn-sm"
                      style={{ borderRadius: '12px' }}
                    >
                      🔒 Clôturer
                    </button>
                  )}

                  <button
                    onClick={() => {
                      showConfirmDialog({
                        title: 'Supprimer la discussion',
                        message: `Êtes-vous sûr de vouloir supprimer définitivement la discussion de "${activeConv.customerName}" ?\nCette action est irréversible.`,
                        icon: '🗑️',
                        type: 'danger',
                        confirmLabel: 'Supprimer définitivement',
                        cancelLabel: 'Annuler',
                        onConfirm: () => {
                          deleteSupportConversation(activeConv.id);
                          showToast('Discussion supprimée avec succès', 'success');
                        }
                      });
                    }}
                    className="admin-btn admin-btn-outline admin-btn-sm"
                    style={{ borderRadius: '12px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                    title="Supprimer la discussion"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              {/* Message Stream */}
              <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '380px', background: 'rgba(0,0,0,0.01)' }}>
                {activeConv.messages.map(m => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: m.sender === 'agent' ? 'flex-end' : 'flex-start',
                      maxWidth: '80%',
                      alignSelf: m.sender === 'agent' ? 'flex-end' : 'flex-start'
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, color: m.sender === 'agent' ? '#0284c7' : 'var(--adm-text-m)', marginBottom: 4 }}>
                      {m.sender === 'agent' ? '👔 Vous (Aymard Store)' : m.sender === 'bot' ? '🤖 Concierge Bot' : `👤 ${activeConv.customerName}`}
                    </span>

                    <div
                      style={{
                        background: m.sender === 'agent' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : m.sender === 'user' ? 'var(--adm-card-border)' : '#f1f5f9',
                        color: m.sender === 'agent' ? '#ffffff' : '#0f172a',
                        padding: '12px 16px',
                        borderRadius: '16px',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-line',
                        boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                      }}
                    >
                      {m.image && (
                        <div style={{ marginBottom: m.text ? '8px' : '0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                          <img 
                            src={m.image} 
                            alt="Photo" 
                            style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block', cursor: 'pointer', borderRadius: '10px' }}
                            onClick={() => window.open(m.image, '_blank')}
                            title="Cliquer pour agrandir"
                          />
                        </div>
                      )}

                      {m.text && <div>{m.text}</div>}
                    </div>

                    <span style={{ fontSize: '10px', color: 'var(--adm-text-m)', marginTop: 3 }}>
                      {m.time}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick Reply Preset Buttons */}
              <div style={{ padding: '8px 20px', background: 'rgba(0,0,0,0.02)', borderTop: '1px solid var(--adm-card-border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--adm-text-m)', alignSelf: 'center' }}>Réponses types :</span>
                {[
                  "Bonjour ! Je suis le responsable Aymard Store. Comment puis-je vous aider ?",
                  "Votre commande est bien enregistrée et part en expédition prioritaire aujourd'hui.",
                  "Nous vous offrons un code de réduction VIP de -15% : HYPE20.",
                  "Pour cette paire, nous vous conseillons de choisir votre taille habituelle."
                ].map((phrase, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAdminChatInput(phrase)}
                    style={{
                      fontSize: '11px',
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: '1px solid var(--adm-card-border)',
                      background: 'var(--adm-card-bg)',
                      color: 'var(--adm-text-h)',
                      cursor: 'pointer'
                    }}
                  >
                    {phrase.slice(0, 35)}...
                  </button>
                ))}
              </div>

              {/* Selected Image Preview Bar */}
              {adminSelectedImage && (
                <div style={{ padding: '8px 20px', background: 'rgba(0,0,0,0.03)', borderTop: '1px solid var(--adm-card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={adminSelectedImage} alt="Aperçu" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--adm-card-border)' }} />
                    <span style={{ fontSize: '12px', color: 'var(--adm-text-h)', fontWeight: 600 }}>Image prête à être envoyée au client</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAdminSelectedImage(null)}
                    style={{ background: 'rgba(239,68,68,0.12)', border: 'none', color: '#ef4444', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Retirer la photo"
                  >
                    ✕
                  </button>
                </div>
              )}

              {/* Admin Reply Input Box */}
              <form
                onSubmit={handleSendAdminReply}
                style={{
                  padding: '16px 20px',
                  borderTop: '1px solid var(--adm-card-border)',
                  display: 'flex',
                  gap: 10,
                  alignItems: 'center',
                  background: 'var(--adm-card-bg)'
                }}
              >
                <input
                  type="file"
                  ref={adminFileInputRef}
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleAdminImageSelect}
                />

                <button
                  type="button"
                  onClick={() => adminFileInputRef.current?.click()}
                  aria-label="Joindre une image"
                  title="Envoyer une photo au client"
                  className="admin-btn admin-btn-outline"
                  style={{
                    borderRadius: '12px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: adminSelectedImage ? 'rgba(56,189,248,0.15)' : undefined,
                    borderColor: adminSelectedImage ? '#0284c7' : undefined
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </button>

                <input
                  type="text"
                  placeholder="Écrivez votre réponse en direct au client..."
                  value={adminChatInput}
                  onChange={e => setAdminChatInput(e.target.value)}
                  className="admin-input"
                  style={{ flex: 1, borderRadius: '20px', padding: '12px 18px' }}
                />
                <button
                  type="submit"
                  disabled={!adminChatInput.trim() && !adminSelectedImage}
                  className="admin-btn admin-btn-primary"
                  style={{ borderRadius: '20px', padding: '12px 24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                >
                  <span>Envoyer</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                </button>
              </form>
            </>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--adm-text-m)', padding: '60px 24px', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: 16 }}>
                💬
              </div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>Centre de Messagerie &amp; Live Chat</h3>
              <p style={{ marginTop: 8, fontSize: '13px', maxWidth: '420px', lineHeight: '1.5', color: 'var(--adm-text-m)' }}>
                {convs.length > 0
                  ? "Sélectionnez une discussion dans la colonne de gauche pour consulter l'échange et répondre au client en direct."
                  : "Aucune discussion active pour le moment. Dès qu'un client engagera une conversation ou demandera un conseiller sur la boutique, ses messages s'afficheront ici en direct."
                }
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

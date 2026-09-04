'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ConfirmDialogOptions } from '../AdminConfirmDialog';

interface ReviewsTabProps {
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
  showToast: (msg: string) => void;
}

export const ReviewsTab: React.FC<ReviewsTabProps> = ({ showConfirmDialog, showToast }) => {
  const { reviews, updateProductReview, deleteProductReview } = useAppStore();
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [reviewSearch, setReviewSearch] = useState('');

  const allReviews = reviews || [];
  const filteredReviews = allReviews.filter(r => {
    const matchFilter = reviewFilter === 'ALL' || r.status === reviewFilter;
    const matchQuery = !reviewSearch.trim() || 
      r.productName?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.customerName?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.customerEmail?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.comment?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.title?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
      r.orderNumber?.toLowerCase().includes(reviewSearch.toLowerCase());
    return matchFilter && matchQuery;
  });

  const avgScore = allReviews.length > 0 
    ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
    : '5.0';
  const approvedCount = allReviews.filter(r => r.status === 'APPROVED').length;
  const pendingCount = allReviews.filter(r => r.status === 'PENDING').length;
  const rejectedCount = allReviews.filter(r => r.status === 'REJECTED').length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)' }}>
            ⭐ Modération &amp; Gestion des Avis Clients
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
            Consultez, validez ou modérez les retours d&apos;expérience déposés par les acheteurs vérifiés.
          </p>
        </div>
      </div>

      {/* 4 Metrics KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Total Avis Déposés</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', marginTop: '4px' }}>{allReviews.length}</div>
          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>100% Achats Vérifiés</span>
        </div>

        <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Note Moyenne Globale</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#f59e0b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span>{avgScore}</span>
            <span style={{ fontSize: '20px' }}>★</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Sur l&apos;ensemble du catalogue</span>
        </div>

        <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Avis Publiés (En Ligne)</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>{approvedCount}</div>
          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>Visibles sur le site</span>
        </div>

        <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>En attente / Rejetés</span>
          <div style={{ fontSize: '28px', fontWeight: 900, color: rejectedCount > 0 ? '#ef4444' : 'var(--adm-text-h)', marginTop: '4px' }}>
            {pendingCount} / {rejectedCount}
          </div>
          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Modération en cours</span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-card" style={{ padding: '16px 20px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `Tous (${allReviews.length})` },
            { id: 'APPROVED', label: `Publiés (${approvedCount})` },
            { id: 'PENDING', label: `En attente (${pendingCount})` },
            { id: 'REJECTED', label: `Rejetés (${rejectedCount})` },
          ].map(f => (
            <button
              key={f.id}
              type="button"
              onClick={() => setReviewFilter(f.id as any)}
              className={`admin-btn ${reviewFilter === f.id ? 'admin-btn-primary' : 'admin-btn-outline'}`}
              style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 700 }}
            >
              {f.label}
            </button>
          ))}
        </div>

        <div style={{ minWidth: '260px' }}>
          <input
            type="text"
            className="admin-input"
            placeholder="Rechercher par produit, client, mot-clé..."
            value={reviewSearch}
            onChange={(e) => setReviewSearch(e.target.value)}
            style={{ width: '100%', borderRadius: '20px', padding: '8px 16px', fontSize: '12.5px' }}
          />
        </div>
      </div>

      {/* Reviews List Table */}
      <div className="admin-card" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden' }}>
        {filteredReviews.length === 0 ? (
          <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--adm-text-m)' }}>
            <span style={{ fontSize: '42px', display: 'block', marginBottom: '12px' }}>⭐</span>
            <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '0 0 6px 0' }}>
              Aucun avis client trouvé
            </h3>
            <p style={{ fontSize: '13px', margin: 0 }}>
              Les avis déposés par vos clients apparaîtront ici automatiquement.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--adm-table-stripe)', borderBottom: '1px solid var(--adm-card-border)', textAlign: 'left' }}>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Produit</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Client &amp; Commande</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Note &amp; Titre</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Commentaire &amp; Photo</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Statut</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReviews.map((rev) => (
                  <tr key={rev.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                    {/* Product */}
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {rev.productImage && (
                          <img 
                            src={rev.productImage} 
                            alt={rev.productName || ''} 
                            style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }} 
                          />
                        )}
                        <div>
                          <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block' }}>
                            {rev.productName || 'Produit'}
                          </strong>
                          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                            ID: {rev.productId}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Customer */}
                    <td style={{ padding: '16px 18px' }}>
                      <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block' }}>
                        {rev.customerName || 'Client'}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', display: 'block' }}>
                        {rev.customerEmail}
                      </span>
                      {rev.orderNumber && (
                        <span style={{ fontSize: '10.5px', color: '#0284c7', fontWeight: 700, fontFamily: 'monospace' }}>
                          Cmd #{rev.orderNumber}
                        </span>
                      )}
                    </td>

                    {/* Rating & Title */}
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{ color: '#f59e0b', fontSize: '14px', letterSpacing: '2px', fontWeight: 900 }}>
                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                      </div>
                      <strong style={{ fontSize: '12.5px', color: 'var(--adm-text-h)', display: 'block', marginTop: '4px' }}>
                        {rev.title}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                        {rev.date}
                      </span>
                    </td>

                    {/* Comment & Photo */}
                    <td style={{ padding: '16px 18px', maxWidth: '320px' }}>
                      <p style={{ fontSize: '12.5px', color: 'var(--adm-text-h)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                        {rev.comment}
                      </p>
                      {rev.photo && (
                        <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--adm-card-border)' }}>
                          <img src={rev.photo} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                      <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', display: 'inline-block', marginTop: '4px' }}>
                        👍 {rev.likesCount || 0} votes utiles
                      </span>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px 18px' }}>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: '12px',
                        background: rev.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.12)' : rev.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                        color: rev.status === 'APPROVED' ? '#10b981' : rev.status === 'REJECTED' ? '#ef4444' : '#d97706'
                      }}>
                        {rev.status === 'APPROVED' ? '✓ Approuvé' : rev.status === 'REJECTED' ? '✕ Rejeté' : '⏳ En attente'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                        {rev.status !== 'APPROVED' && (
                          <button
                            type="button"
                            onClick={() => {
                              updateProductReview(rev.id, { status: 'APPROVED' });
                              showToast(`✓ Avis de ${rev.customerName} approuvé et mis en ligne !`);
                            }}
                            className="admin-btn admin-btn-sm"
                            style={{ background: '#10b981', color: '#fff', borderRadius: '10px', padding: '6px 10px', fontSize: '11px', fontWeight: 700 }}
                            title="Approuver l'avis"
                          >
                            ✓ Approuver
                          </button>
                        )}
                        {rev.status !== 'REJECTED' && (
                          <button
                            type="button"
                            onClick={() => {
                              updateProductReview(rev.id, { status: 'REJECTED' });
                              showToast(`⚠️ Avis de ${rev.customerName} masqué du site.`);
                            }}
                            className="admin-btn admin-btn-sm"
                            style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '6px 10px', fontSize: '11px', fontWeight: 700 }}
                            title="Rejeter l'avis"
                          >
                            ✕ Masquer
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            showConfirmDialog({
                              isOpen: true,
                              title: 'Supprimer cet avis client ?',
                              message: `Êtes-vous sûr de vouloir supprimer définitivement l'avis de ${rev.customerName} sur le produit ${rev.productName} ?`,
                              onConfirm: () => {
                                deleteProductReview(rev.id);
                                showToast('Avis supprimé définitivement.');
                              },
                              type: 'danger',
                              confirmLabel: 'Supprimer',
                              icon: '🗑️'
                            });
                          }}
                          className="admin-btn admin-btn-sm admin-btn-danger"
                          style={{ borderRadius: '10px', padding: '6px 10px', fontSize: '11px' }}
                          title="Supprimer définitivement"
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
    </div>
  );
};

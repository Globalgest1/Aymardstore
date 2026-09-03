'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ModalType } from '../types';
import { ConfirmDialogOptions } from '../AdminConfirmDialog';
import { EmptyState } from '../ui';

interface CategoriesTabProps {
  onOpenModal: (type: ModalType) => void;
  setSelectedParentCatForSub: (id: string) => void;
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
  showToast: (msg: string) => void;
}

export const CategoriesTab: React.FC<CategoriesTabProps> = ({
  onOpenModal,
  setSelectedParentCatForSub,
  showConfirmDialog,
  showToast,
}) => {
  const { dynamicCategories, products, orders, exchangeRate, deleteDynamicCategory, deleteSubCategory, addSubCategory } = useAppStore();
  const [categorySearch, setCategorySearch] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  const allCategories = dynamicCategories;
  const totalProductsCount = products.length;

  const filteredCats = allCategories.filter(c => {
    if (!categorySearch.trim()) return true;
    const q = categorySearch.toLowerCase().trim();
    const matchCat = c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
    const matchSub = (c.subCategories || []).some(s => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q));
    return matchCat || matchSub;
  });

  const toggleExpand = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getCategoryRevenue = (catSlug: string) => {
    const categoryTotal = (orders || []).reduce((sum, order) => {
      const orderCatItems = (order.items || []).filter(item => item.product?.category === catSlug);
      return sum + orderCatItems.reduce((s, i) => s + ((i.product?.price || 0) * (i.quantity || 1)), 0);
    }, 0);
    const catFcfa = Math.round(categoryTotal * (exchangeRate || 655.957));
    return catFcfa > 0 ? `${catFcfa.toLocaleString('fr-FR')} FCFA` : '0 FCFA';
  };

  const genId = () => 'sub_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Top Header Card */}
      <div 
        className="admin-card" 
        style={{ 
          padding: '28px 36px', 
          borderRadius: '24px', 
          background: 'var(--adm-card-bg)', 
          border: '1px solid var(--adm-card-border)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6366f1' }}>
              ORGANISATION DES ARTICLES
            </span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Catégories
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0, maxWidth: '680px' }}>
              Structurez votre offre en regroupant les articles par univers pour faciliter la recherche et l&apos;analyse.
            </p>
          </div>

          <button 
            className="admin-btn admin-btn-primary" 
            onClick={() => onOpenModal('addCategory')}
            style={{
              borderRadius: '30px',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
              boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 8
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            Nouvelle catégorie
          </button>
        </div>

        {/* Badges bar */}
        <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 16px', borderRadius: '30px', fontSize: '12px', fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 6 }}>
            <span>🏪</span> BOUTIQUE ACTIVE : AYMARD STORE
          </div>
          <div style={{ background: 'var(--adm-card-border)', padding: '6px 16px', borderRadius: '30px', fontSize: '12px', fontWeight: 600, color: 'var(--adm-text-h)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            {allCategories.length} catégories
          </div>
          <div style={{ background: 'var(--adm-card-border)', padding: '6px 16px', borderRadius: '30px', fontSize: '12px', fontWeight: 600, color: 'var(--adm-text-h)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            {totalProductsCount} articles
          </div>
        </div>
      </div>

      {/* Main Table Container Card */}
      <div 
        className="admin-card" 
        style={{ 
          padding: '28px', 
          borderRadius: '24px', 
          background: 'var(--adm-card-bg)', 
          border: '1px solid var(--adm-card-border)',
          boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
        }}
      >
        {/* Card Header Row */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)' }}>
            Liste des catégories d&apos;articles
          </h2>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button 
              className="admin-btn admin-btn-outline" 
              onClick={() => onOpenModal('addCategory')}
              style={{ borderRadius: '12px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              Nouvelle catégorie <span style={{ fontSize: '16px', fontWeight: 700 }}>+</span>
            </button>
            <button 
              className="admin-btn admin-btn-outline" 
              onClick={() => showToast('Importation de catégories prête !')}
              style={{ borderRadius: '12px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Import
            </button>
            <button 
              className="admin-btn admin-btn-outline" 
              onClick={() => showToast('Exportation des catégories terminée !')}
              style={{ borderRadius: '12px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              Exporter
            </button>
          </div>
        </div>

        {/* Search Row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 24 }}>
          <div style={{ width: '280px', position: 'relative' }}>
            <input 
              className="admin-input" 
              placeholder="Rechercher..." 
              value={categorySearch}
              onChange={e => setCategorySearch(e.target.value)}
              style={{ borderRadius: '10px', padding: '8px 14px', fontSize: '13px' }}
            />
          </div>
          {categorySearch && (
            <button 
              onClick={() => setCategorySearch('')}
              style={{ 
                background: '#ef4444', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '10px', 
                padding: '8px 18px', 
                fontSize: '13px', 
                fontWeight: 700, 
                cursor: 'pointer',
                transition: 'background 0.2s ease'
              }}
            >
              Effacer
            </button>
          )}
        </div>

        {/* Categories Table */}
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ width: '60px', padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>#</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Nom</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Nombre d&apos;articles</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Chiffre d&apos;affaires</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCats.map((cat, idx) => {
                const catProducts = products.filter(p => p.category === cat.slug);
                const subs = cat.subCategories || [];
                const isExpanded = expandedCategories[cat.id] === true;

                return (
                  <React.Fragment key={cat.id}>
                    <tr 
                      style={{ 
                        borderBottom: '1px solid var(--adm-card-border)',
                        transition: 'background 0.15s ease'
                      }}
                    >
                      <td style={{ padding: '16px', fontSize: '13px', fontWeight: 600, color: 'var(--adm-text-m)' }}>
                        {idx + 1}
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          {cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('/')) ? (
                            <img src={cat.icon} alt={cat.name} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                              {cat.name.slice(0, 2).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                              {cat.name}
                            </div>
                            {subs.length > 0 && (
                              <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                                {subs.length} sous-catégorie{subs.length > 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                            {catProducts.length}
                          </span>
                          <span 
                            title={`${catProducts.length} articles répertoriés dans cette catégorie`} 
                            style={{ 
                              color: '#0284c7', 
                              background: 'rgba(2,132,199,0.12)', 
                              width: '18px', 
                              height: '18px', 
                              borderRadius: '50%', 
                              display: 'inline-flex', 
                              alignItems: 'center', 
                              justifyContent: 'center', 
                              fontSize: '11px', 
                              fontWeight: 800,
                              fontStyle: 'italic',
                              cursor: 'pointer' 
                            }}
                          >
                            i
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                        {getCategoryRevenue(cat.slug)}
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button 
                            onClick={() => toggleExpand(cat.id)}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: '#0284c7', 
                              cursor: 'pointer', 
                              padding: '6px',
                              borderRadius: '8px',
                              fontSize: '18px',
                              fontWeight: 700,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Voir / Gérer les sous-catégories"
                          >
                            +
                          </button>

                          <button 
                            onClick={() => { setSelectedParentCatForSub(cat.id); onOpenModal('addSubCategory'); }}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: '#0284c7', 
                              cursor: 'pointer', 
                              padding: '6px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Ajouter une sous-catégorie"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>

                          <button 
                            onClick={() => {
                              showConfirmDialog({
                                isOpen: true,
                                title: 'Supprimer la catégorie',
                                message: `Voulez-vous vraiment supprimer la catégorie "${cat.name}" ?\nTous les produits associés perdront cette affectation.`,
                                icon: '🗑️',
                                type: 'danger',
                                confirmLabel: 'Supprimer',
                                cancelLabel: 'Annuler',
                                onConfirm: () => {
                                  deleteDynamicCategory(cat.id);
                                  showToast(`Catégorie "${cat.name}" supprimée`);
                                }
                              });
                            }}
                            style={{ 
                              background: 'none', 
                              border: 'none', 
                              color: '#ef4444', 
                              cursor: 'pointer', 
                              padding: '6px',
                              borderRadius: '8px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                            title="Supprimer la catégorie"
                          >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>

                    {/* Sub-rows for Subcategories when expanded */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={5} style={{ padding: '16px 24px', background: 'rgba(2, 132, 199, 0.03)', borderBottom: '1px solid var(--adm-card-border)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>🌿</span> Sous-catégories de {cat.name} ({subs.length}) :
                            </div>

                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                              {subs.length === 0 ? (
                                <span style={{ fontSize: '12px', color: 'var(--adm-text-m)', fontStyle: 'italic' }}>
                                  Aucune sous-catégorie créée. Utilisez le champ ci-dessous pour en ajouter une.
                                </span>
                              ) : (
                                subs.map(sub => (
                                  <div 
                                    key={sub.id}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: 8,
                                      background: 'var(--adm-card-bg)',
                                      border: '1px solid var(--adm-card-border)',
                                      borderRadius: '10px',
                                      padding: '6px 12px',
                                      fontSize: '12px',
                                      fontWeight: 600,
                                      color: 'var(--adm-text-h)'
                                    }}
                                  >
                                    <span>{sub.name}</span>
                                    <button 
                                      onClick={() => {
                                        showConfirmDialog({
                                          isOpen: true,
                                          title: 'Supprimer la sous-catégorie',
                                          message: `Voulez-vous vraiment supprimer la sous-catégorie "${sub.name}" ?`,
                                          icon: '🗑️',
                                          type: 'danger',
                                          confirmLabel: 'Supprimer',
                                          cancelLabel: 'Annuler',
                                          onConfirm: () => {
                                            deleteSubCategory(cat.id, sub.id);
                                            showToast(`Sous-catégorie "${sub.name}" supprimée`);
                                          }
                                        });
                                      }}
                                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, marginLeft: 4, fontSize: '12px', fontWeight: 700 }}
                                      title="Supprimer"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ))
                              )}
                            </div>

                            {/* Add Subcategory Inline */}
                            <form 
                              onSubmit={(e) => {
                                e.preventDefault();
                                const input = e.currentTarget.elements.namedItem('inlineSub') as HTMLInputElement;
                                if (!input.value.trim()) return;
                                addSubCategory(cat.id, {
                                  id: genId(),
                                  name: input.value.trim(),
                                  slug: input.value.trim().toLowerCase().replace(/\s+/g, '-'),
                                  productCount: 0
                                });
                                showToast(`Sous-catégorie "${input.value.trim()}" ajoutée !`);
                                input.value = '';
                              }}
                              style={{ display: 'flex', gap: 8, maxWidth: '360px', marginTop: 4 }}
                            >
                              <input 
                                name="inlineSub"
                                className="admin-input"
                                placeholder="+ Nouvelle sous-catégorie..."
                                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                              />
                              <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm" style={{ padding: '6px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                Ajouter
                              </button>
                            </form>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>

          {filteredCats.length === 0 && (
            <EmptyState icon="📂" text="Aucune catégorie ne correspond à votre recherche" />
          )}
        </div>
      </div>
    </div>
  );
};

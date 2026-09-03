'use client';

import React, { useState } from 'react';
import { useAppStore, Product } from '@/lib/store';
import { ModalType, cleanExistingSizes, getCategoryLabel } from '../types';
import { EmptyState } from '../ui';
import { ConfirmDialogOptions } from '../AdminConfirmDialog';

interface ProductsTabProps {
  openBatchModal: () => void;
  openAddProductModal: () => void;
  setEditingProduct: (p: Product | null) => void;
  setSelectedSizes: (sizes: string[]) => void;
  setSelectedColors: (colors: string[]) => void;
  setModal: (m: ModalType) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
}

export const ProductsTab: React.FC<ProductsTabProps> = ({
  openBatchModal,
  openAddProductModal,
  setEditingProduct,
  setSelectedSizes,
  setSelectedColors,
  setModal,
  showToast,
  showConfirmDialog,
}) => {
  const store = useAppStore();
  const products = store.products || [];
  const dynamicCategories = store.dynamicCategories || [];

  const [search, setSearch] = useState('');
  const [productPage, setProductPage] = useState(1);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showGoogleSheetsSync, setShowGoogleSheetsSync] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState(store.googleSheetConfig?.sheetUrl || '');
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);

  const filteredProducts = products.filter(p => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return (
      p.name_fr?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.description_fr?.toLowerCase().includes(q)
    );
  });

  const handleDownloadCsvSample = () => {
    const csvLines = [
      "Nom,Prix,Categorie,ImageURL,Stock,Description",
      "Maillot France Retro,89.99,clothing,/france_jersey_hero.jpg,45,Maillot officiel d'exception",
      "Sneakers Air Pro,149.99,shoes,https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop,30,Sneakers édition limitée",
      "Sac Cabas Luxe,199.00,bags,https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop,15,Sac cabas d'exception en cuir"
    ];
    const csvContent = csvLines.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_produits_aymard_store.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Modèle CSV téléchargé avec succès !');
  };

  const handleClearCsvProducts = () => {
    const deletedCount = store.clearCSVProducts();
    if (deletedCount > 0) {
      showToast(`${deletedCount} produits importés par CSV ont été supprimés avec succès !`);
    } else {
      showToast('Aucun produit importé par CSV à supprimer.');
    }
  };

  const handleFileUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        const count = store.importProductsCSV(text);
        if (count > 0) {
          showToast(`Succès ! ${count} produit(s) importé(s) via CSV.`, 'success');
          setShowCsvImport(false);
        } else {
          showToast("Format CSV non valide ou fichier vide.", 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleSyncGoogleSheet = async () => {
    if (!sheetUrlInput.trim()) {
      showToast("Veuillez saisir l'URL CSV publiée de votre Google Sheet.", 'error');
      return;
    }
    setIsSyncingSheet(true);
    try {
      let url = sheetUrlInput.trim();
      if (url.includes('docs.google.com/spreadsheets') && !url.includes('output=csv') && !url.includes('/export?format=csv')) {
        if (url.includes('/edit')) {
          url = url.replace(/\/edit.*$/, '/export?format=csv');
        } else {
          url = url + '/export?format=csv';
        }
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Impossible de charger la feuille Google Sheets');
      const csvText = await res.text();
      const count = store.importProductsCSV(csvText);
      if (count > 0) {
        store.updateGoogleSheetConfig({ sheetUrl: sheetUrlInput, lastSynced: new Date().toLocaleTimeString('fr-FR'), status: 'CONNECTED' });
        showToast(`Google Sheets synchronisé ! ${count} produits ajoutés.`, 'success');
      } else {
        showToast("Format Google Sheet non reconnu ou vide.", 'error');
      }
    } catch (e: any) {
      showToast("Erreur de connexion Google Sheets: " + (e.message || 'Format invalide'), 'error');
    } finally {
      setIsSyncingSheet(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Card */}
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0284c7' }}>GESTION DU CATALOGUE</span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Produits ({products.length})
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
              Gérez votre inventaire, importez des articles via CSV ou synchronisez directement votre Google Sheet.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              className="admin-btn"
              onClick={openBatchModal}
              style={{
                borderRadius: '12px',
                padding: '10px 18px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
                color: '#ffffff',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(14, 165, 233, 0.35)',
                cursor: 'pointer'
              }}
            >
              <span>⚡</span>
              <span>Import Multi-Produits IA</span>
            </button>
            <button
              className="admin-btn"
              onClick={openAddProductModal}
              style={{
                borderRadius: '12px',
                padding: '10px 18px',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#ffffff',
                border: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(139, 92, 246, 0.35)',
                cursor: 'pointer'
              }}
            >
              <span>✨</span>
              <span>Ajouter par Photo IA</span>
            </button>
            <button className="admin-btn admin-btn-primary" onClick={openAddProductModal} style={{ borderRadius: '12px', padding: '10px 20px', fontWeight: 700 }}>
              + Nouveau produit
            </button>
            <button className="admin-btn admin-btn-outline" onClick={() => setShowCsvImport(!showCsvImport)} style={{ borderRadius: '12px', padding: '10px 18px', fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Import CSV
            </button>
            <button className="admin-btn admin-btn-outline" onClick={() => setShowGoogleSheetsSync(!showGoogleSheetsSync)} style={{ borderRadius: '12px', padding: '10px 18px', fontWeight: 600, color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Google Sheets
            </button>
          </div>
        </div>
      </div>

      {/* CSV Import Drawer */}
      {showCsvImport && (
        <div className="admin-card" style={{ padding: '24px', borderRadius: '20px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>Importer un fichier CSV</h3>
              <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
                Sélectionnez votre fichier .csv ou téléchargez notre modèle type pour structurer vos articles (Nom, Prix, Catégorie, ImageURL, Stock, Description).
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="admin-btn admin-btn-danger admin-btn-sm" onClick={handleClearCsvProducts} style={{ borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                Purger les produits importés par CSV
              </button>
              <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={handleDownloadCsvSample} style={{ borderRadius: 8 }}>
                Télécharger Modèle CSV exemple
              </button>
            </div>
          </div>

          <div style={{ border: '2px dashed var(--adm-card-border)', borderRadius: '16px', padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" style={{ marginBottom: 12 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--adm-text-h)', margin: '0 0 6px 0' }}>Choisissez un fichier .csv sur votre ordinateur</h4>
            <p style={{ fontSize: '12px', color: 'var(--adm-text-m)', marginBottom: 16 }}>Les produits importés s&apos;ajouteront automatiquement sur la page d&apos;accueil de la boutique.</p>
            <label className="admin-btn admin-btn-primary" style={{ cursor: 'pointer', borderRadius: '30px', padding: '10px 24px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Parcourir mon fichier .csv
              <input type="file" accept=".csv" onChange={handleFileUploadCSV} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}

      {/* Google Sheets Sync Drawer */}
      {showGoogleSheetsSync && (
        <div className="admin-card" style={{ padding: '24px', borderRadius: '20px', background: 'var(--adm-card-bg)', border: '1px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>Synchronisation Google Sheets en direct</h3>
              <p style={{ fontSize: '12px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
                Collez l&apos;URL publiée de votre Google Sheet (Fichier &gt; Partager &gt; Publier sur le web &gt; Format CSV).
              </p>
            </div>
            {store.googleSheetConfig?.status === 'CONNECTED' && (
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 12px', borderRadius: 20 }}>
                Connecté (Dernière synchro: {store.googleSheetConfig.lastSynced})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="admin-input"
              value={sheetUrlInput}
              onChange={e => setSheetUrlInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
              style={{ flex: 1, borderRadius: 10 }}
            />
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleSyncGoogleSheet}
              disabled={isSyncingSheet}
              style={{ borderRadius: 10, background: '#10b981', fontWeight: 700, padding: '0 24px' }}
            >
              {isSyncingSheet ? 'Synchronisation...' : 'Synchroniser Google Sheets'}
            </button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="admin-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <input 
            className="admin-input" 
            placeholder="Rechercher un produit..." 
            value={search} 
            onChange={e => { setSearch(e.target.value); setProductPage(1); }} 
            style={{ width: 280, borderRadius: 10 }} 
          />
          <span style={{ fontSize: '13px', color: 'var(--adm-text-m)' }}>
            Affichage de {filteredProducts.length} articles • Page {productPage} sur {Math.ceil(filteredProducts.length / 15) || 1}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Produit</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Prix</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Stock</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Catégorie</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', color: 'var(--adm-text-m)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.slice((productPage - 1) * 15, productPage * 15).map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={p.images[0]} alt={p.name_fr} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} loading="lazy" />
                      <span>{p.name_fr.slice(0, 35)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                        🇧🇯 {p.locationPrices?.benin ? `${p.locationPrices.benin.toLocaleString('fr-FR')} FCFA` : `${Math.round(p.price * 655.957).toLocaleString('fr-FR')} FCFA`}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', display: 'flex', gap: '8px' }}>
                        <span>🇫🇷 {p.locationPrices?.france ? `${p.locationPrices.france} €` : `${p.price} €`}</span>
                        <span>•</span>
                        <span>🇧🇪 {p.locationPrices?.belgique ? `${p.locationPrices.belgique} €` : `${p.price} €`}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: p.stock < 5 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{p.stock} en stock</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#0284c7', fontWeight: 600 }}>
                    {getCategoryLabel(p.category, dynamicCategories)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button 
                        className="admin-btn admin-btn-outline admin-btn-sm" 
                        onClick={() => {
                          setEditingProduct(p);
                          setSelectedSizes(cleanExistingSizes(p.sizes));
                          setSelectedColors(p.colors || []);
                          setModal('editProduct');
                        }}
                        title="Modifier les détails de l'article"
                        style={{ borderRadius: 8, padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button 
                        className="admin-btn admin-btn-danger admin-btn-sm" 
                        onClick={() => {
                          showConfirmDialog({
                            title: 'Supprimer le produit',
                            message: `Voulez-vous vraiment supprimer "${p.name_fr}" du catalogue ?\nCette action est irréversible.`,
                            icon: '🗑️',
                            type: 'danger',
                            confirmLabel: 'Supprimer',
                            cancelLabel: 'Annuler',
                            onConfirm: () => {
                              store.deleteProduct(p.id);
                              showToast('Produit supprimé avec succès');
                            }
                          });
                        }} 
                        style={{ borderRadius: 8, padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Supprimer l'article"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && <EmptyState icon="📦" text="Aucun produit trouvé" />}
        </div>

        {/* Pagination controls */}
        {filteredProducts.length > 15 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--adm-card-border)', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
              Lignes {(productPage - 1) * 15 + 1} à {Math.min(productPage * 15, filteredProducts.length)} sur {filteredProducts.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button 
                onClick={() => setProductPage(p => Math.max(1, p - 1))}
                disabled={productPage === 1}
                className="admin-btn admin-btn-outline admin-btn-sm"
                style={{ borderRadius: 8, opacity: productPage === 1 ? 0.4 : 1 }}
              >
                ◀ Précédent
              </button>
              <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-h)', background: 'rgba(56,189,248,0.1)', borderRadius: 8 }}>
                {productPage} / {Math.ceil(filteredProducts.length / 15)}
              </span>
              <button 
                onClick={() => setProductPage(p => Math.min(Math.ceil(filteredProducts.length / 15), p + 1))}
                disabled={productPage >= Math.ceil(filteredProducts.length / 15)}
                className="admin-btn admin-btn-outline admin-btn-sm"
                style={{ borderRadius: 8, opacity: productPage >= Math.ceil(filteredProducts.length / 15) ? 0.4 : 1 }}
              >
                Suivant ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

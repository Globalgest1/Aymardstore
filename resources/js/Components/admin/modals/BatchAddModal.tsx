'use client';

import React, { useState } from 'react';
import { useAppStore, Product } from '@/lib/store';

interface BatchAddModalProps {
  close: () => void;
  switchToSingle: () => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
}

export const BatchAddModal: React.FC<BatchAddModalProps> = ({
  close,
  switchToSingle,
  showToast,
}) => {
  const store = useAppStore();
  const [batchPhotos, setBatchPhotos] = useState<string[]>([]);
  const [batchProducts, setBatchProducts] = useState<{
    id: string;
    image: string;
    name: string;
    name_en?: string;
    name_es?: string;
    brand: string;
    category: string;
    price: number;
    comparePrice?: number;
    locationPrice_benin?: number;
    locationComparePrice_benin?: number;
    locationPrice_france?: number;
    locationComparePrice_france?: number;
    locationPrice_belgique?: number;
    locationComparePrice_belgique?: number;
    description: string;
    description_en?: string;
    description_es?: string;
    colors?: string[];
    sizes?: string[];
    badge?: string;
    stock?: number;
    status: 'pending' | 'scanning' | 'done' | 'error';
    error?: string;
  }[]>([]);
  const [isBatchScanning, setIsBatchScanning] = useState<boolean>(false);
  const [batchProgress, setBatchProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });
  const [batchViewMode, setBatchViewMode] = useState<'cards' | 'table'>('cards');

  const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleBatchPhotoFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    const readers = fileArray.map(f => new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = (ev) => resolve(ev.target?.result as string);
      reader.readAsDataURL(f);
    }));
    Promise.all(readers).then(results => {
      const valid = results.filter(Boolean);
      setBatchPhotos(prev => [...prev, ...valid]);
      showToast(`📸 ${valid.length} photo(s) chargée(s) pour l'import groupé !`, 'info');
    });
    e.target.value = '';
  };

  const handleStartBatchScan = async () => {
    if (batchPhotos.length === 0) {
      showToast('Veuillez sélectionner au moins une photo', 'warning');
      return;
    }

    setIsBatchScanning(true);
    const initialList: typeof batchProducts = batchPhotos.map((img, idx) => ({
      id: genId(),
      image: img,
      name: `Article #${idx + 1}`,
      brand: 'Aymard Store',
      category: 'shoes',
      price: 99,
      comparePrice: 120,
      locationPrice_benin: 65000,
      locationComparePrice_benin: 80000,
      description: '',
      badge: 'NEW',
      status: 'pending',
    }));
    setBatchProducts(initialList);
    setBatchProgress({ current: 0, total: batchPhotos.length });

    const currentList = [...initialList];

    for (let i = 0; i < batchPhotos.length; i++) {
      setBatchProgress({ current: i + 1, total: batchPhotos.length });
      currentList[i].status = 'scanning';
      setBatchProducts([...currentList]);

      try {
        const res = await fetch('/api/admin/generate-product', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: batchPhotos[i] }),
        });
        const json = await res.json();
        if (!res.ok || !json.success) {
          throw new Error(json.error || 'Erreur scan');
        }
        const data = json.data;
        currentList[i] = {
          ...currentList[i],
          name: data.name || currentList[i].name,
          name_en: data.name_en || currentList[i].name,
          name_es: data.name_es || currentList[i].name,
          brand: data.brand || currentList[i].brand,
          category: data.category || currentList[i].category,
          price: data.pricing?.price || 99,
          comparePrice: data.pricing?.comparePrice || undefined,
          locationPrice_benin: data.pricing?.beninPrice || 65000,
          locationComparePrice_benin: data.pricing?.beninComparePrice || undefined,
          locationPrice_france: data.pricing?.francePrice || undefined,
          locationComparePrice_france: data.pricing?.franceComparePrice || undefined,
          locationPrice_belgique: data.pricing?.belgiquePrice || undefined,
          locationComparePrice_belgique: data.pricing?.belgiqueComparePrice || undefined,
          description: data.description || '',
          description_en: data.description_en || '',
          description_es: data.description_es || '',
          colors: data.colors || ['Noir', 'Blanc'],
          sizes: data.suggestedSizes || (data.category === 'shoes' ? ['39', '40', '41', '42', '43', '44'] : ['S', 'M', 'L', 'XL']),
          badge: data.badge || 'NEW',
          stock: 50,
          status: 'done',
        };
      } catch (err: any) {
        console.error(`Erreur scan produit #${i + 1}:`, err);
        currentList[i].status = 'error';
        currentList[i].error = err.message || 'Échec analyse';
      }
      setBatchProducts([...currentList]);
    }

    setIsBatchScanning(false);
    showToast('✨ Analyse groupée terminée ! Vérifiez les fiches et validez l\'import.', 'success');
  };

  const handleImportAllBatch = () => {
    const readyItems = batchProducts.filter(item => item.status === 'done');
    if (readyItems.length === 0) {
      showToast('Aucun produit prêt à être importé.', 'warning');
      return;
    }

    const newProducts: Product[] = readyItems.map(item => {
      const locPrices: Record<string, number> = {};
      const locCompPrices: Record<string, number> = {};

      if (item.locationPrice_benin && item.locationPrice_benin > 0) locPrices.benin = item.locationPrice_benin;
      if (item.locationPrice_france && item.locationPrice_france > 0) locPrices.france = item.locationPrice_france;
      if (item.locationPrice_belgique && item.locationPrice_belgique > 0) locPrices.belgique = item.locationPrice_belgique;

      if (item.locationComparePrice_benin && item.locationComparePrice_benin > 0) locCompPrices.benin = item.locationComparePrice_benin;
      if (item.locationComparePrice_france && item.locationComparePrice_france > 0) locCompPrices.france = item.locationComparePrice_france;
      if (item.locationComparePrice_belgique && item.locationComparePrice_belgique > 0) locCompPrices.belgique = item.locationComparePrice_belgique;

      return {
        id: item.id || genId(),
        name_fr: item.name,
        name_en: item.name_en || item.name,
        name_es: item.name_es || item.name,
        slug: item.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || `prod-${Date.now()}`,
        brand: item.brand,
        price: item.price,
        comparePrice: item.comparePrice,
        category: item.category,
        images: [item.image],
        description_fr: item.description || `Superbe ${item.name} de la marque ${item.brand}.`,
        description_en: item.description_en || '',
        description_es: item.description_es || '',
        rating: 5,
        reviewCount: 0,
        isNew: true,
        isFeatured: false,
        badge: item.badge || 'NEW',
        stock: item.stock || 50,
        sizes: item.sizes,
        colors: item.colors,
        locationPrices: Object.keys(locPrices).length > 0 ? locPrices : undefined,
        locationComparePrices: Object.keys(locCompPrices).length > 0 ? locCompPrices : undefined,
      };
    });

    store.addProducts(newProducts);
    showToast(`🎉 ${newProducts.length} produits importés avec succès dans votre catalogue !`, 'success');
    close();
  };

  return (
    <div>
      {/* SÉLECTEUR DE MODE D'AJOUT */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', background: 'var(--adm-card-border)', padding: '4px', borderRadius: '14px' }}>
        <button
          type="button"
          onClick={switchToSingle}
          style={{
            flex: 1,
            padding: '9px 14px',
            borderRadius: '10px',
            border: 'none',
            background: 'transparent',
            color: 'var(--adm-text-m)',
            fontWeight: 700,
            fontSize: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>📦</span>
          <span>Produit Unique (Multi-photos)</span>
        </button>
        <button
          type="button"
          style={{
            flex: 1,
            padding: '9px 14px',
            borderRadius: '10px',
            border: 'none',
            background: 'var(--adm-card-bg)',
            color: 'var(--adm-text-h)',
            fontWeight: 800,
            fontSize: '12px',
            boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px'
          }}
        >
          <span>⚡</span>
          <span>Multi-Produits en Masse (Plusieurs articles)</span>
        </button>
      </div>

      {/* Entête d'explication */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.09) 0%, rgba(168, 85, 247, 0.09) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        borderRadius: '16px',
        padding: '16px 20px',
        marginBottom: '20px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
              ⚡ Importez plusieurs articles à partir de vos photos
            </div>
            <div style={{ fontSize: '12px', color: 'var(--adm-text-m)', marginTop: 2 }}>
              Chargez vos photos (1 photo par article), l&apos;IA détecte les marques, modèles, catégories et propose automatiquement les prix (€ et FCFA Bénin).
            </div>
          </div>

          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--adm-card-bg)',
              border: '1px dashed #8b5cf6',
              borderRadius: '12px',
              padding: '10px 18px',
              fontSize: '13px',
              fontWeight: 800,
              color: '#8b5cf6',
              cursor: isBatchScanning ? 'not-allowed' : 'pointer',
              opacity: isBatchScanning ? 0.5 : 1
            }}
          >
            <span>📷</span>
            <span>{batchPhotos.length > 0 ? "+ Ajouter d'autres photos" : 'Choisir les photos (Multi-sélection)'}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              disabled={isBatchScanning}
              onChange={handleBatchPhotoFiles}
            />
          </label>
        </div>
      </div>

      {/* État 1 : Photos chargées mais pas encore scannées */}
      {batchPhotos.length > 0 && batchProducts.length === 0 && (
        <div style={{ marginBottom: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
              📸 {batchPhotos.length} photo(s) prête(s) pour l&apos;analyse
            </div>
            <button
              type="button"
              onClick={() => setBatchPhotos([])}
              style={{ fontSize: '11px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 700 }}
            >
              Effacer tout
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px', maxHeight: '200px', overflowY: 'auto', padding: '10px', background: 'var(--adm-card-border)', borderRadius: '12px' }}>
            {batchPhotos.map((img, i) => (
              <div key={i} style={{ position: 'relative', aspectRatio: '1', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--adm-card-border)' }}>
                <img src={img} alt={`Photo ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                <button
                  type="button"
                  onClick={() => setBatchPhotos(batchPhotos.filter((_, idx) => idx !== i))}
                  style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'center' }}>
            <button
              type="button"
              onClick={handleStartBatchScan}
              style={{
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '14px',
                padding: '12px 28px',
                fontSize: '14px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '10px',
                boxShadow: '0 4px 16px rgba(139, 92, 246, 0.4)'
              }}
            >
              <span>✨</span>
              <span>Lancer l&apos;analyse IA des {batchPhotos.length} articles</span>
            </button>
          </div>
        </div>
      )}

      {/* État 2 : Progression du scan */}
      {isBatchScanning && (
        <div style={{ padding: '20px', background: 'var(--adm-card-border)', borderRadius: '16px', marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #8b5cf6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <span>Analyse IA en cours : {batchProgress.current} / {batchProgress.total} article(s)...</span>
          </div>
          <div style={{ width: '100%', height: '8px', background: 'var(--adm-card-bg)', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--adm-card-border)' }}>
            <div
              style={{
                width: `${batchProgress.total > 0 ? (batchProgress.current / batchProgress.total) * 100 : 0}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                transition: 'width 0.3s ease'
              }}
            />
          </div>
        </div>
      )}

      {/* État 3 : Produits scannés avec fiches complètes */}
      {batchProducts.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                📋 Fiches Produits Générées par l&apos;IA ({batchProducts.filter(p => p.status === 'done').length} prête{batchProducts.filter(p => p.status === 'done').length > 1 ? 's' : ''} sur {batchProducts.length})
              </div>
              <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: 2 }}>
                Chaque article dispose de sa description complète, tous ses tarifs (Euros &amp; FCFA), tailles et couleurs détectées.
              </div>
            </div>

            {/* Switch vue fiches / tableau */}
            <div style={{ display: 'inline-flex', background: 'var(--adm-card-border)', padding: '3px', borderRadius: '10px' }}>
              <button
                type="button"
                onClick={() => setBatchViewMode('cards')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: batchViewMode === 'cards' ? 'var(--adm-card-bg)' : 'transparent',
                  color: batchViewMode === 'cards' ? 'var(--adm-text-h)' : 'var(--adm-text-m)',
                  fontWeight: 800,
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                🎴 Vue Fiches Complètes
              </button>
              <button
                type="button"
                onClick={() => setBatchViewMode('table')}
                style={{
                  padding: '5px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  background: batchViewMode === 'table' ? 'var(--adm-card-bg)' : 'transparent',
                  color: batchViewMode === 'table' ? 'var(--adm-text-h)' : 'var(--adm-text-m)',
                  fontWeight: 800,
                  fontSize: '11px',
                  cursor: 'pointer'
                }}
              >
                📊 Vue Tableau
              </button>
            </div>
          </div>

          {/* VUE 1 : FICHES COMPLÈTES */}
          {batchViewMode === 'cards' && (
            <div style={{ maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
              {batchProducts.map((item, idx) => (
                <div
                  key={item.id}
                  style={{
                    background: 'var(--adm-card-bg)',
                    border: item.status === 'error' ? '1px solid #ef4444' : '1px solid var(--adm-card-border)',
                    borderRadius: '16px',
                    padding: '18px',
                    marginBottom: '16px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    opacity: item.status === 'scanning' ? 0.75 : 1
                  }}
                >
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'flex-start', flexWrap: 'wrap', marginBottom: '14px' }}>
                    <div style={{ position: 'relative', width: '90px', height: '90px', borderRadius: '12px', overflow: 'hidden', border: '2px solid #8b5cf6', flexShrink: 0 }}>
                      <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setBatchProducts(batchProducts.filter((_, i) => i !== idx))}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 20, height: 20, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Supprimer cet article"
                      >
                        ×
                      </button>
                    </div>

                    <div style={{ flex: 1, minWidth: '240px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, background: '#8b5cf6', color: '#fff', padding: '3px 8px', borderRadius: '8px' }}>
                          #{idx + 1}
                        </span>
                        <input
                          className="admin-input"
                          value={item.name}
                          placeholder="Nom commercial du produit"
                          disabled={item.status === 'scanning'}
                          onChange={e => {
                            const copy = [...batchProducts];
                            copy[idx].name = e.target.value;
                            setBatchProducts(copy);
                          }}
                          style={{ fontWeight: 800, fontSize: '13px', padding: '6px 10px', borderRadius: '8px', flex: 1 }}
                        />
                        {item.status === 'done' && (
                          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 800, whiteSpace: 'nowrap' }}>
                            ✓ Prêt
                          </span>
                        )}
                        {item.status === 'scanning' && (
                          <span style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 700, whiteSpace: 'nowrap' }}>
                            ⚡ Analyse...
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--adm-text-m)', fontWeight: 700 }}>Marque</label>
                          <input
                            className="admin-input"
                            value={item.brand}
                            disabled={item.status === 'scanning'}
                            onChange={e => {
                              const copy = [...batchProducts];
                              copy[idx].brand = e.target.value;
                              setBatchProducts(copy);
                            }}
                            style={{ fontSize: '11px', padding: '6px 8px', borderRadius: '8px' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--adm-text-m)', fontWeight: 700 }}>Rayon (Catégorie)</label>
                          <select
                            className="admin-select"
                            value={item.category}
                            disabled={item.status === 'scanning'}
                            onChange={e => {
                              const copy = [...batchProducts];
                              copy[idx].category = e.target.value;
                              setBatchProducts(copy);
                            }}
                            style={{ fontSize: '11px', padding: '6px 8px', borderRadius: '8px' }}
                          >
                            <option value="shoes">👟 Chaussures</option>
                            <option value="clothing">👕 Vêtements</option>
                            <option value="bags">👜 Sacs</option>
                            <option value="watches">⌚ Montres</option>
                            <option value="jewelry">💍 Bijoux</option>
                            <option value="accessories">🕶️ Accessoires</option>
                            <option value="hats">🧢 Chapeaux</option>
                            <option value="socks">🧦 Chaussettes</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--adm-text-m)', fontWeight: 700 }}>Badge Marketing</label>
                          <select
                            className="admin-select"
                            value={item.badge || 'NEW'}
                            disabled={item.status === 'scanning'}
                            onChange={e => {
                              const copy = [...batchProducts];
                              copy[idx].badge = e.target.value;
                              setBatchProducts(copy);
                            }}
                            style={{ fontSize: '11px', padding: '6px 8px', borderRadius: '8px' }}
                          >
                            <option value="NEW">✨ NOUVEAUTÉ</option>
                            <option value="HOT">🔥 TENDANCE</option>
                            <option value="LIMITED">⚡ ÉDITION LIMITÉE</option>
                            <option value="PROMO">🏷️ PROMOTION</option>
                            <option value="PREMIUM">👑 EXCLUSIF / LUXE</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '10px', color: 'var(--adm-text-m)', fontWeight: 700 }}>Stock initial</label>
                          <input
                            type="number"
                            className="admin-input"
                            value={item.stock ?? 50}
                            disabled={item.status === 'scanning'}
                            onChange={e => {
                              const copy = [...batchProducts];
                              copy[idx].stock = parseInt(e.target.value) || 0;
                              setBatchProducts(copy);
                            }}
                            style={{ fontSize: '11px', padding: '6px 8px', borderRadius: '8px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* GRILLE DES TARIFS */}
                  <div style={{ background: 'var(--adm-card-border)', padding: '12px', borderRadius: '12px', marginBottom: '12px' }}>
                    <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span>🌍 Tarifs suggérés par l&apos;IA (prix de vente &amp; prix barrés)</span>
                      <span style={{ fontSize: '10px', color: '#8b5cf6', fontWeight: 700 }}>✨ Modifiables à volonté</span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px' }}>
                      <div style={{ background: 'var(--adm-card-bg)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--adm-card-border)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7', marginBottom: '4px' }}>🇪🇺 Base (€)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.01"
                            className="admin-input"
                            placeholder="Prix €"
                            disabled={item.status === 'scanning'}
                            value={item.price || ''}
                            onChange={e => {
                              const copy = [...batchProducts];
                              copy[idx].price = parseFloat(e.target.value) || 0;
                              setBatchProducts(copy);
                            }}
                            style={{ fontSize: '11px', padding: '4px 6px' }}
                          />
                          <input
                            type="number"
                            step="0.01"
                            className="admin-input"
                            placeholder="Barré €"
                            disabled={item.status === 'scanning'}
                            value={item.comparePrice || ''}
                            onChange={e => {
                              const copy = [...batchProducts];
                              copy[idx].comparePrice = parseFloat(e.target.value) || undefined;
                              setBatchProducts(copy);
                            }}
                            style={{ fontSize: '10px', padding: '4px 6px' }}
                          />
                        </div>
                      </div>

                      <div style={{ background: 'var(--adm-card-bg)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--adm-card-border)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7', marginBottom: '4px' }}>🇧🇯 Bénin (FCFA)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            type="number"
                            step="500"
                            className="admin-input"
                            placeholder="Prix FCFA"
                            disabled={item.status === 'scanning'}
                            value={item.locationPrice_benin || ''}
                            onChange={e => {
                              const copy = [...batchProducts];
                              copy[idx].locationPrice_benin = parseFloat(e.target.value) || 0;
                              setBatchProducts(copy);
                            }}
                            style={{ fontSize: '11px', padding: '4px 6px' }}
                          />
                          <input
                            type="number"
                            step="500"
                            className="admin-input"
                            placeholder="Barré FCFA"
                            disabled={item.status === 'scanning'}
                            value={item.locationComparePrice_benin || ''}
                            onChange={e => {
                              const copy = [...batchProducts];
                              copy[idx].locationComparePrice_benin = parseFloat(e.target.value) || undefined;
                              setBatchProducts(copy);
                            }}
                            style={{ fontSize: '10px', padding: '4px 6px' }}
                          />
                        </div>
                      </div>

                      <div style={{ background: 'var(--adm-card-bg)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--adm-card-border)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7', marginBottom: '4px' }}>🇫🇷 France (€)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.01"
                            className="admin-input"
                            placeholder="Prix France €"
                            disabled={item.status === 'scanning'}
                            value={item.locationPrice_france || ''}
                            onChange={e => {
                              const copy = [...batchProducts];
                              copy[idx].locationPrice_france = parseFloat(e.target.value) || undefined;
                              setBatchProducts(copy);
                            }}
                            style={{ fontSize: '11px', padding: '4px 6px' }}
                          />
                          <input
                            type="number"
                            step="0.01"
                            className="admin-input"
                            placeholder="Barré France €"
                            disabled={item.status === 'scanning'}
                            value={item.locationComparePrice_france || ''}
                            onChange={e => {
                              const copy = [...batchProducts];
                              copy[idx].locationComparePrice_france = parseFloat(e.target.value) || undefined;
                              setBatchProducts(copy);
                            }}
                            style={{ fontSize: '10px', padding: '4px 6px' }}
                          />
                        </div>
                      </div>

                      <div style={{ background: 'var(--adm-card-bg)', padding: '8px 10px', borderRadius: '10px', border: '1px solid var(--adm-card-border)' }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: '#0284c7', marginBottom: '4px' }}>🇧🇪 Belgique (€)</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.01"
                            className="admin-input"
                            placeholder="Prix Belgique €"
                            disabled={item.status === 'scanning'}
                            value={item.locationPrice_belgique || ''}
                            onChange={e => {
                              const copy = [...batchProducts];
                              copy[idx].locationPrice_belgique = parseFloat(e.target.value) || undefined;
                              setBatchProducts(copy);
                            }}
                            style={{ fontSize: '11px', padding: '4px 6px' }}
                          />
                          <input
                            type="number"
                            step="0.01"
                            className="admin-input"
                            placeholder="Barré Belgique €"
                            disabled={item.status === 'scanning'}
                            value={item.locationComparePrice_belgique || ''}
                            onChange={e => {
                              const copy = [...batchProducts];
                              copy[idx].locationComparePrice_belgique = parseFloat(e.target.value) || undefined;
                              setBatchProducts(copy);
                            }}
                            style={{ fontSize: '10px', padding: '4px 6px' }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* VARIANTES */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', marginBottom: '12px' }}>
                    <div style={{ background: 'var(--adm-card-border)', padding: '10px 12px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                        📏 Variantes &amp; Tailles ({item.sizes?.length || 0})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {item.sizes && item.sizes.length > 0 ? (
                          item.sizes.map((s, sIdx) => (
                            <span key={sIdx} style={{ fontSize: '10px', fontWeight: 800, background: 'var(--adm-card-bg)', border: '1px solid #8b5cf6', color: '#8b5cf6', padding: '3px 8px', borderRadius: '6px' }}>
                              {s}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Taille unique</span>
                        )}
                      </div>
                    </div>

                    <div style={{ background: 'var(--adm-card-border)', padding: '10px 12px', borderRadius: '12px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                        🎨 Nuancier &amp; Couleurs ({item.colors?.length || 0})
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {item.colors && item.colors.length > 0 ? (
                          item.colors.map((c, cIdx) => (
                            <span key={cIdx} style={{ fontSize: '10px', fontWeight: 700, background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)', padding: '3px 8px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1' }} />
                              {c}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Standard</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* DESCRIPTION */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                      <label style={{ fontSize: '11px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                        Description du produit
                      </label>
                      <span style={{ fontSize: '10px', color: '#8b5cf6', fontWeight: 700 }}>
                        ✨ Rédigée par l&apos;IA (modifiable)
                      </span>
                    </div>
                    <textarea
                      className="admin-textarea"
                      rows={3}
                      value={item.description}
                      disabled={item.status === 'scanning'}
                      placeholder="Description générée par l'IA..."
                      onChange={e => {
                        const copy = [...batchProducts];
                        copy[idx].description = e.target.value;
                        setBatchProducts(copy);
                      }}
                      style={{ fontSize: '11px', lineHeight: '1.4' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* VUE 2 : TABLEAU */}
          {batchViewMode === 'table' && (
            <div style={{ overflowX: 'auto', maxHeight: '420px', overflowY: 'auto', border: '1px solid var(--adm-card-border)', borderRadius: '14px', background: 'var(--adm-card-bg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ background: 'var(--adm-card-border)', borderBottom: '1px solid var(--adm-card-border)', position: 'sticky', top: 0, zIndex: 2 }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: 'var(--adm-text-m)', width: '60px' }}>Photo</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: 'var(--adm-text-m)', minWidth: '180px' }}>Nom du produit</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: 'var(--adm-text-m)', width: '110px' }}>Marque</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: 'var(--adm-text-m)', width: '130px' }}>Catégorie</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: 'var(--adm-text-m)', width: '100px' }}>Prix (€)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 800, color: 'var(--adm-text-m)', width: '130px' }}>Bénin (FCFA)</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: 'var(--adm-text-m)', width: '60px' }}>État</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 800, color: 'var(--adm-text-m)', width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {batchProducts.map((item, idx) => (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--adm-card-border)', opacity: item.status === 'scanning' ? 0.7 : 1 }}>
                      <td style={{ padding: '8px 12px' }}>
                        <div style={{ width: '46px', height: '46px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--adm-card-border)' }}>
                          <img src={item.image} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          className="admin-input"
                          value={item.name}
                          disabled={item.status === 'scanning'}
                          onChange={e => {
                            const updated = [...batchProducts];
                            updated[idx].name = e.target.value;
                            setBatchProducts(updated);
                          }}
                          style={{ fontSize: '12px', padding: '6px 10px', borderRadius: '8px' }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          className="admin-input"
                          value={item.brand}
                          disabled={item.status === 'scanning'}
                          onChange={e => {
                            const updated = [...batchProducts];
                            updated[idx].brand = e.target.value;
                            setBatchProducts(updated);
                          }}
                          style={{ fontSize: '12px', padding: '6px 8px', borderRadius: '8px' }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <select
                          className="admin-select"
                          value={item.category}
                          disabled={item.status === 'scanning'}
                          onChange={e => {
                            const updated = [...batchProducts];
                            updated[idx].category = e.target.value;
                            setBatchProducts(updated);
                          }}
                          style={{ fontSize: '11px', padding: '6px 8px', borderRadius: '8px' }}
                        >
                          <option value="shoes">👟 Chaussures</option>
                          <option value="clothing">👕 Vêtements</option>
                          <option value="bags">👜 Sacs</option>
                          <option value="watches">⌚ Montres</option>
                          <option value="jewelry">💍 Bijoux</option>
                          <option value="accessories">🕶️ Accessoires</option>
                          <option value="hats">🧢 Chapeaux</option>
                        </select>
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          step="0.01"
                          className="admin-input"
                          value={item.price || ''}
                          disabled={item.status === 'scanning'}
                          onChange={e => {
                            const updated = [...batchProducts];
                            updated[idx].price = parseFloat(e.target.value) || 0;
                            setBatchProducts(updated);
                          }}
                          style={{ fontSize: '12px', padding: '6px 8px', borderRadius: '8px' }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px' }}>
                        <input
                          type="number"
                          step="500"
                          className="admin-input"
                          value={item.locationPrice_benin || ''}
                          disabled={item.status === 'scanning'}
                          onChange={e => {
                            const updated = [...batchProducts];
                            updated[idx].locationPrice_benin = parseFloat(e.target.value) || 0;
                            setBatchProducts(updated);
                          }}
                          style={{ fontSize: '12px', padding: '6px 8px', borderRadius: '8px' }}
                        />
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        {item.status === 'pending' && <span style={{ color: 'var(--adm-text-m)', fontSize: '11px' }}>⏳ Attente</span>}
                        {item.status === 'scanning' && <span style={{ color: '#8b5cf6', fontSize: '11px', fontWeight: 700 }}>⚡ Scan...</span>}
                        {item.status === 'done' && <span style={{ color: '#10b981', fontSize: '11px', fontWeight: 800 }}>✓ Prêt</span>}
                        {item.status === 'error' && <span style={{ color: '#ef4444', fontSize: '11px' }} title={item.error}>❌ Erreur</span>}
                      </td>
                      <td style={{ padding: '8px 12px', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => setBatchProducts(batchProducts.filter((_, i) => i !== idx))}
                          style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontSize: '14px' }}
                          title="Retirer ce produit du lot"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Actions */}
          <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={close}
              style={{ borderRadius: '12px', padding: '10px 20px' }}
            >
              Annuler
            </button>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="admin-btn admin-btn-outline"
                onClick={handleStartBatchScan}
                disabled={isBatchScanning}
                style={{ borderRadius: '12px', padding: '10px 18px', fontSize: '12px', fontWeight: 700 }}
              >
                🔄 Re-scanner tout
              </button>

              <button
                type="button"
                onClick={handleImportAllBatch}
                disabled={isBatchScanning || batchProducts.filter(p => p.status === 'done').length === 0}
                style={{
                  background: batchProducts.filter(p => p.status === 'done').length === 0 ? 'var(--adm-card-border)' : '#10b981',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '10px 24px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: isBatchScanning || batchProducts.filter(p => p.status === 'done').length === 0 ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: batchProducts.filter(p => p.status === 'done').length > 0 ? '0 4px 14px rgba(16, 185, 129, 0.35)' : 'none'
                }}
              >
                <span>🚀</span>
                <span>Importer les {batchProducts.filter(p => p.status === 'done').length} produits dans la boutique</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {batchPhotos.length === 0 && batchProducts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '40px 20px', background: 'var(--adm-card-border)', borderRadius: '16px' }}>
          <div style={{ fontSize: '36px', marginBottom: '10px' }}>📸</div>
          <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '4px' }}>
            Aucune photo sélectionnée
          </div>
          <div style={{ fontSize: '12px', color: 'var(--adm-text-m)', marginBottom: '16px' }}>
            Sélectionnez jusqu&apos;à 20 photos en une seule fois pour lancer l&apos;ajout groupé.
          </div>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#fff',
              borderRadius: '12px',
              padding: '10px 22px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            <span>📁</span>
            <span>Sélectionner plusieurs photos</span>
            <input
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleBatchPhotoFiles}
            />
          </label>
        </div>
      )}
    </div>
  );
};

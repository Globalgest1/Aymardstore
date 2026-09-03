'use client';

import React, { useState } from 'react';
import { useAppStore, Product } from '@/lib/store';
import { 
  Tab, 
  PRESET_COLORS, 
  SHOE_SIZES, 
  CLOTHING_SIZES, 
  VOLUME_SIZES, 
  UNIQUE_SIZES 
} from '../types';
import { ConfirmDialogOptions } from '../AdminConfirmDialog';

interface ProductFormModalProps {
  isEdit: boolean;
  editingProduct?: Product | null;
  close: () => void;
  switchToBatch?: () => void;
  selectedSizes: string[];
  setSelectedSizes: React.Dispatch<React.SetStateAction<string[]>>;
  selectedColors: string[];
  setSelectedColors: React.Dispatch<React.SetStateAction<string[]>>;
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
  setSelectedBroadcastProductId?: (id: string) => void;
  setTab?: (tab: Tab) => void;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isEdit,
  editingProduct,
  close,
  switchToBatch,
  selectedSizes,
  setSelectedSizes,
  selectedColors,
  setSelectedColors,
  showToast,
  showConfirmDialog,
  setSelectedBroadcastProductId,
  setTab,
}) => {
  const store = useAppStore();

  // Controlled form states for Add Product
  const [prodFormImages, setProdFormImages] = useState<string[]>([]);
  const [isAiScanning, setIsAiScanning] = useState<boolean>(false);
  const [aiScanNotes, setAiScanNotes] = useState<string>('');
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string>('');

  const [prodFormName, setProdFormName] = useState<string>('');
  const [prodFormNameEn, setProdFormNameEn] = useState<string>('');
  const [prodFormNameEs, setProdFormNameEs] = useState<string>('');
  const [prodFormBrand, setProdFormBrand] = useState<string>('');
  const [prodFormCategory, setProdFormCategory] = useState<string>('shoes');
  const [prodFormDescription, setProdFormDescription] = useState<string>('');
  const [prodFormDescEn, setProdFormDescEn] = useState<string>('');
  const [prodFormDescEs, setProdFormDescEs] = useState<string>('');
  const [prodFormBadge, setProdFormBadge] = useState<string>('NEW');

  const [prodFormPrice, setProdFormPrice] = useState<string>('');
  const [prodFormComparePrice, setProdFormComparePrice] = useState<string>('');
  const [prodFormBeninPrice, setProdFormBeninPrice] = useState<string>('');
  const [prodFormBeninComparePrice, setProdFormBeninComparePrice] = useState<string>('');
  const [prodFormFrancePrice, setProdFormFrancePrice] = useState<string>('');
  const [prodFormFranceComparePrice, setProdFormFranceComparePrice] = useState<string>('');
  const [prodFormBelgiquePrice, setProdFormBelgiquePrice] = useState<string>('');
  const [prodFormBelgiqueComparePrice, setProdFormBelgiqueComparePrice] = useState<string>('');
  const [urlImageInput, setUrlImageInput] = useState<string>('');
  const [customColorInput, setCustomColorInput] = useState<string>('');

  const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const handleMultiImageFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      setProdFormImages(prev => [...prev, ...valid]);
      showToast(`📸 ${valid.length} photo(s) ajoutée(s) !`, 'success');
    });
    e.target.value = '';
  };

  const handleScanProductWithAi = async () => {
    if (prodFormImages.length === 0) {
      showToast('Veuillez importer au moins une photo du produit', 'warning');
      return;
    }
    setIsAiScanning(true);
    setAiSuccessMessage('');
    try {
      const res = await fetch('/api/admin/generate-product', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          images: prodFormImages,
          additionalNotes: aiScanNotes,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erreur lors de l\'analyse IA');
      }

      const data = json.data;
      if (data.name) setProdFormName(data.name);
      if (data.name_en) setProdFormNameEn(data.name_en);
      if (data.name_es) setProdFormNameEs(data.name_es);
      if (data.brand) setProdFormBrand(data.brand);
      if (data.category) setProdFormCategory(data.category);
      if (data.description) setProdFormDescription(data.description);
      if (data.description_en) setProdFormDescEn(data.description_en);
      if (data.description_es) setProdFormDescEs(data.description_es);
      if (data.badge) setProdFormBadge(data.badge);

      if (data.pricing) {
        if (data.pricing.price) setProdFormPrice(String(data.pricing.price));
        if (data.pricing.comparePrice) setProdFormComparePrice(String(data.pricing.comparePrice));
        if (data.pricing.beninPrice) setProdFormBeninPrice(String(data.pricing.beninPrice));
        if (data.pricing.beninComparePrice) setProdFormBeninComparePrice(String(data.pricing.beninComparePrice));
        if (data.pricing.francePrice) setProdFormFrancePrice(String(data.pricing.francePrice));
        if (data.pricing.franceComparePrice) setProdFormFranceComparePrice(String(data.pricing.franceComparePrice));
        if (data.pricing.belgiquePrice) setProdFormBelgiquePrice(String(data.pricing.belgiquePrice));
        if (data.pricing.belgiqueComparePrice) setProdFormBelgiqueComparePrice(String(data.pricing.belgiqueComparePrice));
      }

      if (data.colors && Array.isArray(data.colors) && data.colors.length > 0) {
        setSelectedColors(data.colors);
      }
      if (data.suggestedSizes && Array.isArray(data.suggestedSizes) && data.suggestedSizes.length > 0) {
        setSelectedSizes(data.suggestedSizes);
      }

      setAiSuccessMessage(`✨ Analyse réussie sur ${prodFormImages.length} photo(s) ! Fiche produit & prix suggérés complétés.`);
      showToast('✨ Fiche & prix suggérés générés par l’IA !', 'success');
    } catch (err: any) {
      console.error('Erreur scan IA:', err);
      showToast(err.message || 'Échec de l\'analyse IA', 'error');
    } finally {
      setIsAiScanning(false);
    }
  };

  const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const nameVal = (fd.get('name') as string) || prodFormName;
    const brandVal = (fd.get('brand') as string) || prodFormBrand || 'Aymard Store';
    const categoryVal = (fd.get('category') as string) || prodFormCategory || 'shoes';
    const descVal = (fd.get('description') as string) || prodFormDescription || '';

    const sortedSizes = [...selectedSizes].sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    const locPrices: Record<string, number> = {};
    const locCompPrices: Record<string, number> = {};

    const priceVal = parseFloat(fd.get('price') as string) || parseFloat(prodFormPrice) || 0;
    const comparePriceVal = parseFloat(fd.get('originalPrice') as string) || parseFloat(prodFormComparePrice) || undefined;

    const beninP = parseFloat(fd.get('locationPrice_benin') as string) || parseFloat(prodFormBeninPrice) || 0;
    if (beninP > 0) locPrices.benin = beninP;
    const beninC = parseFloat(fd.get('locationComparePrice_benin') as string) || parseFloat(prodFormBeninComparePrice) || 0;
    if (beninC > 0) locCompPrices.benin = beninC;

    const franceP = parseFloat(fd.get('locationPrice_france') as string) || parseFloat(prodFormFrancePrice) || 0;
    if (franceP > 0) locPrices.france = franceP;
    const franceC = parseFloat(fd.get('locationComparePrice_france') as string) || parseFloat(prodFormFranceComparePrice) || 0;
    if (franceC > 0) locCompPrices.france = franceC;

    const belgiqueP = parseFloat(fd.get('locationPrice_belgique') as string) || parseFloat(prodFormBelgiquePrice) || 0;
    if (belgiqueP > 0) locPrices.belgique = belgiqueP;
    const belgiqueC = parseFloat(fd.get('locationComparePrice_belgique') as string) || parseFloat(prodFormBelgiqueComparePrice) || 0;
    if (belgiqueC > 0) locCompPrices.belgique = belgiqueC;

    const finalImages = prodFormImages.length > 0 ? prodFormImages : [fd.get('image') as string || '/images/placeholder.jpg'];

    const p: Product = {
      id: genId(), 
      name_fr: nameVal, 
      name_en: prodFormNameEn || nameVal, 
      name_es: prodFormNameEs || nameVal,
      slug: nameVal.toLowerCase().replace(/\s+/g, '-'),
      brand: brandVal,
      price: priceVal, 
      comparePrice: comparePriceVal,
      category: categoryVal, 
      images: finalImages,
      description_fr: descVal, 
      description_en: prodFormDescEn || '', 
      description_es: prodFormDescEs || '',
      rating: 5, 
      reviewCount: 0,
      isNew: true, 
      isFeatured: false, 
      badge: prodFormBadge || 'NEW', 
      stock: parseInt(fd.get('stock') as string) || 50,
      sizes: sortedSizes.length > 0 ? sortedSizes : undefined,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      locationPrices: Object.keys(locPrices).length > 0 ? locPrices : undefined,
      locationComparePrices: Object.keys(locCompPrices).length > 0 ? locCompPrices : undefined,
    };
    store.addProduct(p);
    showToast('Produit ajouté avec ses prix localisés par pays !');
    close();

    const activeSubCount = (store.marketingSubscribers || []).filter(s => s.active).length;
    if (activeSubCount > 0 && showConfirmDialog && setSelectedBroadcastProductId && setTab) {
      showConfirmDialog({
        title: '🔥 Diffuser ce nouveau produit ?',
        message: `Voulez-vous avertir immédiatement vos ${activeSubCount} abonnés par WhatsApp & Email du drop de "${p.name_fr}" ?`,
        icon: '📣',
        type: 'info',
        confirmLabel: 'Oui, ouvrir Marketing Studio',
        cancelLabel: 'Plus tard',
        onConfirm: () => {
          setSelectedBroadcastProductId(p.id);
          setTab('marketing');
        }
      });
    }
  };

  const handleEditProduct = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProduct) return;
    const fd = new FormData(e.currentTarget);
    const nameVal = fd.get('name') as string;
    const sortedSizes = [...selectedSizes].sort((a, b) => {
      const numA = parseInt(a);
      const numB = parseInt(b);
      if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
      return a.localeCompare(b);
    });

    const locPrices: Record<string, number> = {};
    const locCompPrices: Record<string, number> = {};

    const beninP = parseFloat(fd.get('locationPrice_benin') as string);
    if (!isNaN(beninP) && beninP > 0) locPrices.benin = beninP;
    const beninC = parseFloat(fd.get('locationComparePrice_benin') as string);
    if (!isNaN(beninC) && beninC > 0) locCompPrices.benin = beninC;

    const franceP = parseFloat(fd.get('locationPrice_france') as string);
    if (!isNaN(franceP) && franceP > 0) locPrices.france = franceP;
    const franceC = parseFloat(fd.get('locationComparePrice_france') as string);
    if (!isNaN(franceC) && franceC > 0) locCompPrices.france = franceC;

    const belgiqueP = parseFloat(fd.get('locationPrice_belgique') as string);
    if (!isNaN(belgiqueP) && belgiqueP > 0) locPrices.belgique = belgiqueP;
    const belgiqueC = parseFloat(fd.get('locationComparePrice_belgique') as string);
    if (!isNaN(belgiqueC) && belgiqueC > 0) locCompPrices.belgique = belgiqueC;

    store.updateProduct(editingProduct.id, {
      name_fr: nameVal,
      name_en: nameVal,
      name_es: nameVal,
      brand: fd.get('brand') as string,
      price: parseFloat(fd.get('price') as string),
      comparePrice: parseFloat(fd.get('originalPrice') as string) || undefined,
      category: fd.get('category') as string,
      stock: parseInt(fd.get('stock') as string) || 0,
      images: [fd.get('image') as string || editingProduct.images[0]],
      description_fr: fd.get('description') as string || '',
      sizes: sortedSizes.length > 0 ? sortedSizes : undefined,
      colors: selectedColors.length > 0 ? selectedColors : undefined,
      locationPrices: Object.keys(locPrices).length > 0 ? locPrices : undefined,
      locationComparePrices: Object.keys(locCompPrices).length > 0 ? locCompPrices : undefined,
    });
    showToast('Produit et tarifs par pays mis à jour avec succès !');
    close();
  };

  if (isEdit && editingProduct) {
    return (
      <form onSubmit={handleEditProduct}>
        <div className="admin-form-grid">
          <div><label className="admin-label">Nom du produit</label><input name="name" className="admin-input" defaultValue={editingProduct.name_fr} required /></div>
          <div><label className="admin-label">Marque</label><input name="brand" className="admin-input" defaultValue={editingProduct.brand || 'Aymard Store'} required /></div>
          <div><label className="admin-label">Prix de référence base (€)</label><input name="price" type="number" step="0.01" className="admin-input" defaultValue={editingProduct.price} required /></div>
          <div><label className="admin-label">Prix barré / Comparatif (€)</label><input name="originalPrice" type="number" step="0.01" className="admin-input" defaultValue={editingProduct.comparePrice || ''} /></div>
          
          {/* TARIFS SPÉCIFIQUES PAR PAYS */}
          <div style={{ gridColumn: '1 / -1', background: 'var(--adm-card-border)', padding: '16px', borderRadius: '16px', border: '1px solid var(--adm-card-border)' }}>
            <div style={{ marginBottom: '12px' }}>
              <label className="admin-label" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                🌍 Tarifs Personnalisés par Pays (Bénin, France, Belgique)
              </label>
              <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: 2 }}>
                Fixez les montants exacts pour chaque pays, ou laissez vide pour une conversion automatique.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div style={{ background: 'var(--adm-card-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--adm-card-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🇧🇯</span> <span>Bénin (FCFA)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input name="locationPrice_benin" type="number" step="1" className="admin-input" placeholder="Prix Bénin FCFA (ex: 65000)" defaultValue={editingProduct?.locationPrices?.benin || ''} style={{ fontSize: '12px', padding: '8px 10px' }} />
                  <input name="locationComparePrice_benin" type="number" step="1" className="admin-input" placeholder="Prix barré FCFA (ex: 85000)" defaultValue={editingProduct?.locationComparePrices?.benin || ''} style={{ fontSize: '11px', padding: '6px 10px' }} />
                </div>
              </div>

              <div style={{ background: 'var(--adm-card-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--adm-card-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🇫🇷</span> <span>France (€)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input name="locationPrice_france" type="number" step="0.01" className="admin-input" placeholder="Prix France € (ex: 120)" defaultValue={editingProduct?.locationPrices?.france || ''} style={{ fontSize: '12px', padding: '8px 10px' }} />
                  <input name="locationComparePrice_france" type="number" step="0.01" className="admin-input" placeholder="Prix barré € (ex: 140)" defaultValue={editingProduct?.locationComparePrices?.france || ''} style={{ fontSize: '11px', padding: '6px 10px' }} />
                </div>
              </div>

              <div style={{ background: 'var(--adm-card-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--adm-card-border)' }}>
                <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🇧🇪</span> <span>Belgique (€)</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <input name="locationPrice_belgique" type="number" step="0.01" className="admin-input" placeholder="Prix Belgique € (ex: 125)" defaultValue={editingProduct?.locationPrices?.belgique || ''} style={{ fontSize: '12px', padding: '8px 10px' }} />
                  <input name="locationComparePrice_belgique" type="number" step="0.01" className="admin-input" placeholder="Prix barré € (ex: 145)" defaultValue={editingProduct?.locationComparePrices?.belgique || ''} style={{ fontSize: '11px', padding: '6px 10px' }} />
                </div>
              </div>
            </div>
          </div>

          <div>
            <label className="admin-label">Catégorie (Rayon)</label>
            <select name="category" className="admin-select" defaultValue={editingProduct.category} required>
              <option value="shoes">👟 Chaussures &amp; Sneakers</option>
              <option value="clothing">👕 Vêtements &amp; Prêt-à-porter</option>
              <option value="bags">👜 Sacs &amp; Maroquinerie</option>
              <option value="jewelry">💍 Bijoux &amp; Joaillerie</option>
              <option value="watches">⌚ Montres &amp; Horlogerie</option>
              <option value="accessories">🕶️ Accessoires de Mode</option>
              <option value="hats">🧢 Chapeaux &amp; Casquettes</option>
              <option value="socks">🧦 Chaussettes</option>
              <option value="necklaces">📿 Colliers &amp; Pendentifs</option>
              {store.dynamicCategories.filter(c => !['shoes','clothing','bags','jewelry','watches','accessories','hats','socks','necklaces'].includes(c.slug)).map(c => (
                <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>
          <div><label className="admin-label">Stock disponible</label><input name="stock" type="number" className="admin-input" defaultValue={editingProduct.stock} /></div>
          
          {/* VARIANTES */}
          <div style={{ gridColumn: '1 / -1', background: 'var(--adm-card-border)', padding: '18px', borderRadius: '18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <label className="admin-label" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                  📏 Variantes &amp; Formats ({selectedSizes.length} sélectionnée{selectedSizes.length > 1 ? 's' : ''})
                </label>
                <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: 2 }}>
                  Tailles vêtements, pointures chaussures, volumes cosmétiques/parfums, montres...
                </div>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSelectedSizes([])}
                  style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                >
                  ❌ Effacer tout
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#8b5cf6', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>👕</span> <span>VÊTEMENTS :</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {CLOTHING_SIZES.map(cs => {
                    const isChecked = selectedSizes.includes(cs);
                    return (
                      <button
                        key={cs}
                        type="button"
                        onClick={() => setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== cs) : [...selectedSizes, cs])}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '10px',
                          border: isChecked ? '2px solid #8b5cf6' : '1px solid var(--adm-card-border)',
                          background: isChecked ? '#8b5cf6' : 'var(--adm-card-bg)',
                          color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: isChecked ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none'
                        }}
                      >
                        {isChecked ? `✓ ${cs}` : cs}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>👟</span> <span>CHAUSSURES &amp; SNEAKERS :</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {SHOE_SIZES.map(ss => {
                    const isChecked = selectedSizes.includes(ss);
                    return (
                      <button
                        key={ss}
                        type="button"
                        onClick={() => setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== ss) : [...selectedSizes, ss])}
                        style={{
                          padding: '6px 10px',
                          borderRadius: '10px',
                          border: isChecked ? '2px solid #0284c7' : '1px solid var(--adm-card-border)',
                          background: isChecked ? '#0284c7' : 'var(--adm-card-bg)',
                          color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          boxShadow: isChecked ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none'
                        }}
                      >
                        {isChecked ? `✓ ${ss}` : ss}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🧴</span> <span>VOLUMES ml / Litres :</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {VOLUME_SIZES.map(vs => {
                    const isChecked = selectedSizes.includes(vs);
                    return (
                      <button
                        key={vs}
                        type="button"
                        onClick={() => setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== vs) : [...selectedSizes, vs])}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '10px',
                          border: isChecked ? '2px solid #10b981' : '1px solid var(--adm-card-border)',
                          background: isChecked ? '#10b981' : 'var(--adm-card-bg)',
                          color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {isChecked ? `✓ ${vs}` : vs}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '10px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>🎒</span> <span>TAILLE UNIQUE / STANDARD :</span>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {UNIQUE_SIZES.map(us => {
                    const isChecked = selectedSizes.includes(us);
                    return (
                      <button
                        key={us}
                        type="button"
                        onClick={() => setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== us) : [...selectedSizes, us])}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '10px',
                          border: isChecked ? '2px solid #64748b' : '1px solid var(--adm-card-border)',
                          background: isChecked ? '#64748b' : 'var(--adm-card-bg)',
                          color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        {isChecked ? `✓ ${us}` : us}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* COULEURS */}
          <div style={{ gridColumn: '1 / -1', background: 'var(--adm-card-border)', padding: '16px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
              <div>
                <label className="admin-label" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                  🎨 Couleurs Disponibles ({selectedColors.length} sélectionnée{selectedColors.length > 1 ? 's' : ''})
                </label>
              </div>
              <button
                type="button"
                onClick={() => setSelectedColors([])}
                style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
              >
                ❌ Effacer
              </button>
            </div>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
              {PRESET_COLORS.map(col => {
                const isChecked = selectedColors.includes(col.name);
                return (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => {
                      if (isChecked) {
                        setSelectedColors(selectedColors.filter(c => c !== col.name));
                      } else {
                        setSelectedColors([...selectedColors, col.name]);
                      }
                    }}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '20px',
                      border: isChecked ? '2px solid #0284c7' : '1px solid var(--adm-card-border)',
                      background: isChecked ? 'rgba(2, 132, 199, 0.12)' : 'var(--adm-card-bg)',
                      color: 'var(--adm-text-h)',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: col.hex, border: `1px solid ${col.border}` }} />
                    <span>{col.name}</span>
                    {isChecked && <span style={{ color: '#0284c7' }}>✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <label className="admin-label">URL de l&apos;Image principale</label>
            <input name="image" className="admin-input" defaultValue={editingProduct.images[0]} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label className="admin-label">Description du produit</label>
            <textarea name="description" className="admin-textarea" defaultValue={editingProduct.description_fr} />
          </div>
        </div>
        <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
          <button type="submit" className="admin-btn admin-btn-primary">Enregistrer les modifications</button>
        </div>
      </form>
    );
  }

  // ADD PRODUCT FORM
  return (
    <form onSubmit={handleAddProduct}>
      {/* SÉLECTEUR DE MODE D'AJOUT */}
      {switchToBatch && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', background: 'var(--adm-card-border)', padding: '4px', borderRadius: '14px' }}>
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
            <span>📦</span>
            <span>Produit Unique (Multi-photos)</span>
          </button>
          <button
            type="button"
            onClick={switchToBatch}
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
            <span>⚡</span>
            <span>Multi-Produits en Masse (Plusieurs articles)</span>
          </button>
        </div>
      )}

      {/* ASSISTANT SCAN IA PAR PHOTOS */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.09) 0%, rgba(168, 85, 247, 0.09) 100%)',
        border: '1px solid rgba(139, 92, 246, 0.35)',
        borderRadius: '18px',
        padding: '18px',
        marginBottom: '22px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>✨</span>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                Remplissage Magique &amp; Suggestion de Prix par IA
              </div>
              <div style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                Sélectionnez des photos : l&apos;IA détecte le produit, rédige la description et estime les prix de vente !
              </div>
            </div>
          </div>
          {prodFormImages.length > 0 && (
            <button
              type="button"
              onClick={() => {
                setProdFormImages([]);
                setAiSuccessMessage('');
              }}
              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '10px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
            >
              Effacer les photos ({prodFormImages.length})
            </button>
          )}
        </div>

        {/* GALERIE DES PHOTOS DU PRODUIT */}
        {prodFormImages.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '10px', marginBottom: '14px' }}>
            {prodFormImages.map((imgUrl, idx) => (
              <div
                key={idx}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: idx === 0 ? '2px solid #8b5cf6' : '1px solid var(--adm-card-border)',
                  background: 'var(--adm-card-bg)',
                  boxShadow: idx === 0 ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none'
                }}
              >
                <img src={imgUrl} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                
                {idx === 0 ? (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'linear-gradient(transparent, rgba(139, 92, 246, 0.95))', color: '#fff', fontSize: '9px', fontWeight: 800, textAlign: 'center', padding: '4px 2px 2px' }}>
                    ⭐ Couverture
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const copy = [...prodFormImages];
                      const [moved] = copy.splice(idx, 1);
                      copy.unshift(moved);
                      setProdFormImages(copy);
                    }}
                    title="Définir comme photo principale"
                    style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '9px', padding: '2px 4px', cursor: 'pointer' }}
                  >
                    ⭐
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setProdFormImages(prodFormImages.filter((_, i) => i !== idx))}
                  style={{ position: 'absolute', top: 3, right: 3, background: 'rgba(0,0,0,0.75)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Supprimer cette photo"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: 'var(--adm-card-bg)',
              border: '1px dashed #8b5cf6',
              borderRadius: '12px',
              padding: '10px 16px',
              fontSize: '12px',
              fontWeight: 700,
              color: '#8b5cf6',
              cursor: 'pointer'
            }}
          >
            <span>📷</span>
            <span>{prodFormImages.length > 0 ? '+ Ajouter d&apos;autres photos' : 'Sélectionner des photos (Multi-sélection)'}</span>
            <input
              type="file"
              multiple
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleMultiImageFiles}
            />
          </label>

          <button
            type="button"
            disabled={prodFormImages.length === 0 || isAiScanning}
            onClick={handleScanProductWithAi}
            style={{
              background: prodFormImages.length === 0 ? 'var(--adm-card-border)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '12px',
              fontWeight: 800,
              cursor: prodFormImages.length === 0 || isAiScanning ? 'not-allowed' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              opacity: prodFormImages.length === 0 || isAiScanning ? 0.6 : 1,
              boxShadow: prodFormImages.length > 0 && !isAiScanning ? '0 4px 14px rgba(139, 92, 246, 0.4)' : 'none'
            }}
          >
            {isAiScanning ? (
              <>
                <span style={{ display: 'inline-block', width: 14, height: 14, border: '2px solid #fff', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                <span>Analyse de {prodFormImages.length} photo(s)...</span>
              </>
            ) : (
              <>
                <span>✨</span>
                <span>Analyser &amp; Suggérer les prix {prodFormImages.length > 0 ? `(${prodFormImages.length} photos)` : ''}</span>
              </>
            )}
          </button>
        </div>

        {aiSuccessMessage && (
          <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', fontSize: '12px', fontWeight: 700, color: '#10b981', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>✅</span> <span>{aiSuccessMessage}</span>
          </div>
        )}
      </div>

      <div className="admin-form-grid">
        <div><label className="admin-label">Nom du produit (FR)</label><input name="name" className="admin-input" required placeholder="ex: Nike Dunk Low Retro" value={prodFormName} onChange={e => setProdFormName(e.target.value)} /></div>
        <div><label className="admin-label">Marque</label><input name="brand" className="admin-input" required placeholder="ex: Nike, Adidas, Jacquemus" value={prodFormBrand} onChange={e => setProdFormBrand(e.target.value)} /></div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="admin-label">Prix de référence base (€)</label>
            {prodFormPrice && <span style={{ fontSize: '10px', color: '#8b5cf6', fontWeight: 800 }}>✨ Suggéré</span>}
          </div>
          <input name="price" type="number" step="0.01" className="admin-input" required placeholder="129.90" value={prodFormPrice} onChange={e => setProdFormPrice(e.target.value)} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="admin-label">Prix barré / Comparatif (€)</label>
            {prodFormComparePrice && <span style={{ fontSize: '10px', color: '#8b5cf6', fontWeight: 800 }}>✨ Suggéré</span>}
          </div>
          <input name="originalPrice" type="number" step="0.01" className="admin-input" placeholder="159.00" value={prodFormComparePrice} onChange={e => setProdFormComparePrice(e.target.value)} />
        </div>
        
        {/* TARIFS SPÉCIFIQUES PAR PAYS */}
        <div style={{ gridColumn: '1 / -1', background: 'var(--adm-card-border)', padding: '16px', borderRadius: '16px', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ marginBottom: '12px' }}>
            <label className="admin-label" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
              🌍 Tarifs Personnalisés par Pays (Bénin, France, Belgique)
            </label>
            <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: 2 }}>
              Fixez les montants exacts pour chaque pays, ou laissez vide pour une conversion automatique.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {/* Bénin */}
            <div style={{ background: 'var(--adm-card-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--adm-card-border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🇧🇯</span> <span>Bénin (FCFA)</span>
                </div>
                {prodFormBeninPrice && <span style={{ fontSize: '10px', color: '#8b5cf6' }}>✨ Suggéré</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input name="locationPrice_benin" type="number" step="1" className="admin-input" placeholder="Prix Bénin FCFA (ex: 65000)" value={prodFormBeninPrice} onChange={e => setProdFormBeninPrice(e.target.value)} style={{ fontSize: '12px', padding: '8px 10px' }} />
                <input name="locationComparePrice_benin" type="number" step="1" className="admin-input" placeholder="Prix barré FCFA (ex: 85000)" value={prodFormBeninComparePrice} onChange={e => setProdFormBeninComparePrice(e.target.value)} style={{ fontSize: '11px', padding: '6px 10px' }} />
              </div>
            </div>

            {/* France */}
            <div style={{ background: 'var(--adm-card-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--adm-card-border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🇫🇷</span> <span>France (€)</span>
                </div>
                {prodFormFrancePrice && <span style={{ fontSize: '10px', color: '#8b5cf6' }}>✨ Suggéré</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input name="locationPrice_france" type="number" step="0.01" className="admin-input" placeholder="Prix France € (ex: 120)" value={prodFormFrancePrice} onChange={e => setProdFormFrancePrice(e.target.value)} style={{ fontSize: '12px', padding: '8px 10px' }} />
                <input name="locationComparePrice_france" type="number" step="0.01" className="admin-input" placeholder="Prix barré € (ex: 140)" value={prodFormFranceComparePrice} onChange={e => setProdFormFranceComparePrice(e.target.value)} style={{ fontSize: '11px', padding: '6px 10px' }} />
              </div>
            </div>

            {/* Belgique */}
            <div style={{ background: 'var(--adm-card-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--adm-card-border)' }}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🇧🇪</span> <span>Belgique (€)</span>
                </div>
                {prodFormBelgiquePrice && <span style={{ fontSize: '10px', color: '#8b5cf6' }}>✨ Suggéré</span>}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <input name="locationPrice_belgique" type="number" step="0.01" className="admin-input" placeholder="Prix Belgique € (ex: 125)" value={prodFormBelgiquePrice} onChange={e => setProdFormBelgiquePrice(e.target.value)} style={{ fontSize: '12px', padding: '8px 10px' }} />
                <input name="locationComparePrice_belgique" type="number" step="0.01" className="admin-input" placeholder="Prix barré € (ex: 145)" value={prodFormBelgiqueComparePrice} onChange={e => setProdFormBelgiqueComparePrice(e.target.value)} style={{ fontSize: '11px', padding: '6px 10px' }} />
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="admin-label">Catégorie (Rayon)</label>
          <select
            name="category"
            className="admin-select"
            required
            value={prodFormCategory}
            onChange={e => setProdFormCategory(e.target.value)}
          >
            <option value="shoes">👟 Chaussures &amp; Sneakers</option>
            <option value="clothing">👕 Vêtements &amp; Prêt-à-porter</option>
            <option value="bags">👜 Sacs &amp; Maroquinerie</option>
            <option value="jewelry">💍 Bijoux &amp; Joaillerie</option>
            <option value="watches">⌚ Montres &amp; Horlogerie</option>
            <option value="accessories">🕶️ Accessoires de Mode</option>
            <option value="hats">🧢 Chapeaux &amp; Casquettes</option>
            <option value="socks">🧦 Chaussettes</option>
            <option value="necklaces">📿 Colliers &amp; Pendentifs</option>
            {store.dynamicCategories.filter(c => !['shoes','clothing','bags','jewelry','watches','accessories','hats','socks','necklaces'].includes(c.slug)).map(c => (
              <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>
            ))}
          </select>
        </div>
        <div><label className="admin-label">Stock disponible</label><input name="stock" type="number" className="admin-input" defaultValue="50" /></div>
        
        {/* VARIANTES */}
        <div style={{ gridColumn: '1 / -1', background: 'var(--adm-card-border)', padding: '18px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <label className="admin-label" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                📏 Variantes &amp; Formats ({selectedSizes.length} sélectionnée{selectedSizes.length > 1 ? 's' : ''})
              </label>
              <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: 2 }}>
                Tailles vêtements, pointures chaussures, volumes cosmétiques/parfums, montres...
              </div>
            </div>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedSizes([])}
                style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
              >
                ❌ Effacer tout
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#8b5cf6', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>👕</span> <span>VÊTEMENTS :</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {CLOTHING_SIZES.map(cs => {
                  const isChecked = selectedSizes.includes(cs);
                  return (
                    <button
                      key={cs}
                      type="button"
                      onClick={() => setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== cs) : [...selectedSizes, cs])}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        border: isChecked ? '2px solid #8b5cf6' : '1px solid var(--adm-card-border)',
                        background: isChecked ? '#8b5cf6' : 'var(--adm-card-bg)',
                        color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: isChecked ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none'
                      }}
                    >
                      {isChecked ? `✓ ${cs}` : cs}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>👟</span> <span>CHAUSSURES &amp; SNEAKERS :</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {SHOE_SIZES.map(ss => {
                  const isChecked = selectedSizes.includes(ss);
                  return (
                    <button
                      key={ss}
                      type="button"
                      onClick={() => setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== ss) : [...selectedSizes, ss])}
                      style={{
                        padding: '6px 10px',
                        borderRadius: '10px',
                        border: isChecked ? '2px solid #0284c7' : '1px solid var(--adm-card-border)',
                        background: isChecked ? '#0284c7' : 'var(--adm-card-bg)',
                        color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer',
                        boxShadow: isChecked ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none'
                      }}
                    >
                      {isChecked ? `✓ ${ss}` : ss}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🧴</span> <span>VOLUMES ml / Litres :</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {VOLUME_SIZES.map(vs => {
                  const isChecked = selectedSizes.includes(vs);
                  return (
                    <button
                      key={vs}
                      type="button"
                      onClick={() => setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== vs) : [...selectedSizes, vs])}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: isChecked ? '2px solid #10b981' : '1px solid var(--adm-card-border)',
                        background: isChecked ? '#10b981' : 'var(--adm-card-bg)',
                        color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {isChecked ? `✓ ${vs}` : vs}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span>🎒</span> <span>TAILLE UNIQUE / STANDARD :</span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {UNIQUE_SIZES.map(us => {
                  const isChecked = selectedSizes.includes(us);
                  return (
                    <button
                      key={us}
                      type="button"
                      onClick={() => setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== us) : [...selectedSizes, us])}
                      style={{
                        padding: '6px 14px',
                        borderRadius: '10px',
                        border: isChecked ? '2px solid #64748b' : '1px solid var(--adm-card-border)',
                        background: isChecked ? '#64748b' : 'var(--adm-card-bg)',
                        color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      {isChecked ? `✓ ${us}` : us}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* COULEURS */}
        <div style={{ gridColumn: '1 / -1', background: 'var(--adm-card-border)', padding: '16px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <label className="admin-label" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                🎨 Couleurs Disponibles ({selectedColors.length} sélectionnée{selectedColors.length > 1 ? 's' : ''})
              </label>
            </div>
            <button
              type="button"
              onClick={() => setSelectedColors([])}
              style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
            >
              ❌ Effacer
            </button>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
            {PRESET_COLORS.map(col => {
              const isChecked = selectedColors.includes(col.name);
              return (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => {
                    if (isChecked) {
                      setSelectedColors(selectedColors.filter(c => c !== col.name));
                    } else {
                      setSelectedColors([...selectedColors, col.name]);
                    }
                  }}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '20px',
                    border: isChecked ? '2px solid #0284c7' : '1px solid var(--adm-card-border)',
                    background: isChecked ? 'rgba(2, 132, 199, 0.12)' : 'var(--adm-card-bg)',
                    color: 'var(--adm-text-h)',
                    fontSize: '12px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: col.hex, border: `1px solid ${col.border}` }} />
                  <span>{col.name}</span>
                  {isChecked && <span style={{ color: '#0284c7' }}>✓</span>}
                </button>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder="Ajouter une autre couleur (ex: Kaki, Doré, Velvet...)"
              value={customColorInput}
              onChange={e => setCustomColorInput(e.target.value)}
              className="admin-input"
              style={{ flex: 1, borderRadius: '12px', padding: '8px 14px', fontSize: '12px' }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (customColorInput.trim() && !selectedColors.includes(customColorInput.trim())) {
                    setSelectedColors([...selectedColors, customColorInput.trim()]);
                    setCustomColorInput('');
                  }
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (customColorInput.trim() && !selectedColors.includes(customColorInput.trim())) {
                  setSelectedColors([...selectedColors, customColorInput.trim()]);
                  setCustomColorInput('');
                }
              }}
              className="admin-btn admin-btn-outline"
              style={{ borderRadius: '12px', padding: '8px 16px', fontSize: '12px', fontWeight: 700 }}
            >
              + Ajouter
            </button>
          </div>
        </div>

        {/* BADGE MARKETING */}
        <div>
          <label className="admin-label">Badge Marketing</label>
          <select name="badge" className="admin-select" value={prodFormBadge} onChange={e => setProdFormBadge(e.target.value)}>
            <option value="NEW">✨ NOUVEAUTÉ (NEW)</option>
            <option value="HOT">🔥 TENDANCE (HOT)</option>
            <option value="LIMITED">⚡ ÉDITION LIMITÉE</option>
            <option value="PROMO">🏷️ PROMOTION</option>
            <option value="PREMIUM">👑 EXCLUSIF / LUXE</option>
          </select>
        </div>

        {/* GALERIE MULTI-PHOTOS DU PRODUIT */}
        <div style={{ gridColumn: '1 / -1', background: 'var(--adm-card-border)', padding: '16px', borderRadius: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
            <div>
              <label className="admin-label" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                📸 Galerie Photos du Produit ({prodFormImages.length} photo{prodFormImages.length > 1 ? 's' : ''})
              </label>
            </div>
            {prodFormImages.length > 0 && (
              <button
                type="button"
                onClick={() => setProdFormImages([])}
                style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '10px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
              >
                ❌ Tout effacer
              </button>
            )}
          </div>

          {prodFormImages.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(75px, 1fr))', gap: '10px', marginBottom: '12px' }}>
              {prodFormImages.map((imgUrl, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    aspectRatio: '1',
                    borderRadius: '10px',
                    overflow: 'hidden',
                    border: idx === 0 ? '2px solid #8b5cf6' : '1px solid var(--adm-card-border)',
                    background: 'var(--adm-card-bg)'
                  }}
                >
                  <img src={imgUrl} alt={`Photo ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  {idx === 0 ? (
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(139, 92, 246, 0.95)', color: '#fff', fontSize: '8px', fontWeight: 800, textAlign: 'center', padding: '2px' }}>
                      ⭐ Principale
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        const copy = [...prodFormImages];
                        const [moved] = copy.splice(idx, 1);
                        copy.unshift(moved);
                        setProdFormImages(copy);
                      }}
                      title="Définir comme photo principale"
                      style={{ position: 'absolute', bottom: 2, left: 2, background: 'rgba(0,0,0,0.65)', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '9px', padding: '2px 4px', cursor: 'pointer' }}
                    >
                      ⭐
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setProdFormImages(prodFormImages.filter((_, i) => i !== idx))}
                    style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Supprimer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <input
              className="admin-input"
              placeholder="Ajouter une image par URL (https://...)"
              value={urlImageInput}
              onChange={e => setUrlImageInput(e.target.value)}
              style={{ flex: 1, minWidth: '200px' }}
            />
            <button
              type="button"
              onClick={() => {
                if (urlImageInput.trim()) {
                  setProdFormImages(prev => [...prev, urlImageInput.trim()]);
                  setUrlImageInput('');
                }
              }}
              className="admin-btn admin-btn-outline"
              style={{ borderRadius: '12px', padding: '8px 14px', fontSize: '12px', fontWeight: 700 }}
            >
              + URL
            </button>
            <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: '12px', padding: '8px 14px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
              📁 Importer photos
              <input
                type="file"
                multiple
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleMultiImageFiles}
              />
            </label>
          </div>
        </div>

        <div style={{ gridColumn: '1 / -1' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
            <label className="admin-label" style={{ margin: 0 }}>Description du produit</label>
            {prodFormDescription && (
              <span style={{ fontSize: '11px', color: '#8b5cf6', fontWeight: 700 }}>
                ✨ Rédigée par l&apos;IA (modifiable)
              </span>
            )}
          </div>
          <textarea
            name="description"
            className="admin-textarea"
            rows={4}
            placeholder="Description détaillée du produit..."
            value={prodFormDescription}
            onChange={e => setProdFormDescription(e.target.value)}
          />
        </div>
      </div>
      <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
        <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
        <button type="submit" className="admin-btn admin-btn-primary">Ajouter le produit</button>
      </div>
    </form>
  );
};

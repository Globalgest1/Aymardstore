'use client';

import React, { useState } from 'react';
import { useAppStore } from '@/lib/store';
import { ConfirmDialogOptions } from '../AdminConfirmDialog';

interface HomeCmsTabProps {
  showToast: (msg: string) => void;
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
}

export const HomeCmsTab: React.FC<HomeCmsTabProps> = ({
  showToast,
  showConfirmDialog,
}) => {
  const store = useAppStore();
  const [cmsSubTab, setCmsSubTab] = useState<'hero' | 'categories' | 'lookbook' | 'faq' | 'community'>('hero');

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, onImageReady: (dataUrl: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onImageReady(result);
        showToast('Image chargée avec succès !');
      }
    };
    reader.readAsDataURL(file);
  };

  const media = store.homepageMedia || {
    categoryTiles: [],
    lookbook: {
      tag: 'ÉDITORIAL SAISON 2026',
      title: "L'Élégance Streetwear dans sa Plus Pure Expression",
      description: "Des sneakers iconiques aux hoodies de créateurs, chaque pièce est sélectionnée pour son authenticité, ses matières d'exception et sa rareté sur le marché international.",
      image1: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop',
      image2: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop',
      buttonText1: 'Découvrir le Lookbook',
      buttonLink1: '/products?filter=new',
      buttonText2: 'Collection Vêtements',
      buttonLink2: '/products?category=clothing',
    },
    faqEditorial: {
      main: {
        title: "Pourquoi les éditions limitées de sneakers fascinent-elles les passionnés ?",
        image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=900&auto=format&fit=crop',
        link: '/products?category=shoes'
      },
      item1: {
        title: "Entretenir ses sneakers de collection : les bons gestes à adopter",
        image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=500&auto=format&fit=crop',
        link: '/products?category=shoes'
      },
      item2: {
        title: "Aymard Store est-il un site fiable & 100% authentique ?",
        image: '/logo.png',
        link: '/faq/fiabilite'
      },
      item3: {
        title: "Pourquoi les pièces exclusives sont-elles si convoitées ?",
        image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=500&auto=format&fit=crop',
        link: '/products'
      }
    },
    communityPhotos: []
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Card */}
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#a855f7' }}>GESTIONNAIRE VISUEL &amp; CONTENU</span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Personnalisation de l&apos;Accueil
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0, maxWidth: '750px' }}>
              Modifiez facilement toutes les images, bannières, titres et photos de votre page d&apos;accueil. Téléchargez directement vos photos ou collez une URL.
            </p>
          </div>
          
          {cmsSubTab === 'hero' && (
            <button
              className="admin-btn admin-btn-primary"
              onClick={() => {
                const newId = Date.now();
                store.addHeroSlide({
                  id: newId,
                  image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop',
                  leftText: 'NOUVELLE COLLECTION',
                  promoTitle: 'OFFRE LIMITÉE -20%',
                  promoSubtitle: 'SÉLECTION EXCLUSIVE',
                  accentColor: '#38bdf8',
                  link: '/products'
                });
                showToast('Nouveau slide héro ajouté !');
              }}
              style={{ borderRadius: '30px', padding: '12px 24px', fontWeight: 700 }}
            >
              + Ajouter une Bannière Héro
            </button>
          )}
        </div>

        {/* Sub-tabs Navigation */}
        <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', borderTop: '1px solid var(--adm-card-border)', paddingTop: 18 }}>
          {[
            { id: 'hero', label: '🎪 Carrousel & Bannières Héro', count: store.heroSlides.length },
            { id: 'categories', label: '🛍️ Cartes Univers / Collections', count: (media.categoryTiles || []).length },
            { id: 'lookbook', label: '✨ Bannière Lookbook' },
            { id: 'faq', label: '📖 FAQ & Stories Éditoriales' },
            { id: 'community', label: '📸 Galerie Instagram #AymardClub', count: (media.communityPhotos || []).length },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setCmsSubTab(tab.id as any)}
              style={{
                padding: '10px 18px',
                borderRadius: '20px',
                border: 'none',
                background: cmsSubTab === tab.id ? '#09090b' : 'rgba(0,0,0,0.05)',
                color: cmsSubTab === tab.id ? '#ffffff' : 'var(--adm-text-h)',
                fontWeight: 800,
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.2s ease'
              }}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span style={{ background: cmsSubTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', padding: '2px 7px', borderRadius: '10px', fontSize: '11px' }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* SUBTAB 1: CARROUSEL HÉRO */}
      {cmsSubTab === 'hero' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
          {store.heroSlides.map((slide, index) => (
            <div key={slide.id} className="admin-card" style={{ padding: '24px', borderRadius: '20px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--adm-card-border)', paddingBottom: 12 }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                  SLIDE HÉRO #{index + 1}
                </span>
                <button
                  className="admin-btn admin-btn-danger admin-btn-sm"
                  onClick={() => {
                    store.deleteHeroSlide(slide.id);
                    showToast('Slide supprimé');
                  }}
                  style={{ borderRadius: 8 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>

              <div style={{ width: '100%', height: '160px', borderRadius: '12px', overflow: 'hidden', marginBottom: 16, position: 'relative', background: '#000' }}>
                <img src={slide.image} alt={slide.leftText} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }} />
                <div style={{ position: 'absolute', inset: 0, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#fff' }}>
                  <span style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', textShadow: `0 0 10px ${slide.accentColor}` }}>{slide.leftText}</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: slide.accentColor }}>{slide.promoTitle}</span>
                </div>
              </div>

              <div className="admin-form-grid" style={{ gap: 12 }}>
                <div>
                  <label className="admin-label">Grand Titre (ex: LAST SUMMER)</label>
                  <input
                    className="admin-input"
                    value={slide.leftText}
                    onChange={e => store.updateHeroSlide(slide.id, { leftText: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <label className="admin-label">Titre Promo (ex: JUSQU&apos;À -60%)</label>
                  <input
                    className="admin-input"
                    value={slide.promoTitle}
                    onChange={e => store.updateHeroSlide(slide.id, { promoTitle: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <label className="admin-label">Sous-titre (ex: + LIVRAISON OFFERTE)</label>
                  <input
                    className="admin-input"
                    value={slide.promoSubtitle}
                    onChange={e => store.updateHeroSlide(slide.id, { promoSubtitle: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <label className="admin-label">Couleur d&apos;accentuation (HEX)</label>
                  <input
                    type="color"
                    className="admin-input"
                    value={slide.accentColor}
                    onChange={e => store.updateHeroSlide(slide.id, { accentColor: e.target.value })}
                    style={{ borderRadius: 8, height: 40, padding: 4 }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Image de Fond du Slide</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="admin-input"
                      placeholder="https://..."
                      value={slide.image}
                      onChange={e => store.updateHeroSlide(slide.id, { image: e.target.value })}
                      style={{ borderRadius: 8, flex: 1 }}
                    />
                    <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '8px 14px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                      📁 Importer
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageFileUpload(e, (dataUrl) => store.updateHeroSlide(slide.id, { image: dataUrl }))}
                      />
                    </label>
                  </div>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Lien du bouton Découvrir</label>
                  <input
                    className="admin-input"
                    value={slide.link}
                    onChange={e => store.updateHeroSlide(slide.id, { link: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 2: CARTES UNIVERS & CATÉGORIES */}
      {cmsSubTab === 'categories' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
          {(media.categoryTiles || []).map((tile) => (
            <div key={tile.id} className="admin-card" style={{ padding: '24px', borderRadius: '20px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid var(--adm-card-border)', paddingBottom: 10 }}>
                <strong style={{ fontSize: '14px', color: 'var(--adm-text-h)' }}>{tile.title}</strong>
                <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', padding: '2px 8px', borderRadius: '6px' }}>{tile.tag}</span>
              </div>

              <div style={{ width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: 16, position: 'relative' }}>
                <img src={tile.image} alt={tile.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div>
                  <label className="admin-label">Titre de la Carte Univers</label>
                  <input
                    className="admin-input"
                    value={tile.title}
                    onChange={e => store.updateCategoryTile(tile.id, { title: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <label className="admin-label">Sous-titre / Description Courte</label>
                  <input
                    className="admin-input"
                    value={tile.subtitle}
                    onChange={e => store.updateCategoryTile(tile.id, { subtitle: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="admin-label">Badge Tag (ex: TENDANCE)</label>
                    <input
                      className="admin-input"
                      value={tile.tag}
                      onChange={e => store.updateCategoryTile(tile.id, { tag: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Lien de Destination</label>
                    <input
                      className="admin-input"
                      value={tile.link}
                      onChange={e => store.updateCategoryTile(tile.id, { link: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
                <div>
                  <label className="admin-label">Image de la Catégorie</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="admin-input"
                      placeholder="https://..."
                      value={tile.image}
                      onChange={e => store.updateCategoryTile(tile.id, { image: e.target.value })}
                      style={{ borderRadius: 8, flex: 1 }}
                    />
                    <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '8px 14px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                      📁 Importer
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageFileUpload(e, (dataUrl) => store.updateCategoryTile(tile.id, { image: dataUrl }))}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SUBTAB 3: BANNIÈRE LOOKBOOK */}
      {cmsSubTab === 'lookbook' && (
        <div className="admin-card" style={{ padding: '32px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '0 0 8px 0' }}>
            Bannière Éditoriale Lookbook (Style Haute Couture)
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '0 0 24px 0' }}>
            Cette section magazine met en avant votre vision de marque avec deux photos en superposition et deux boutons d&apos;action.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label className="admin-label">Surtitre / Tag (ex: ÉDITORIAL SAISON 2026)</label>
                <input
                  className="admin-input"
                  value={media.lookbook?.tag || ''}
                  onChange={e => store.updateLookbook({ tag: e.target.value })}
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div>
                <label className="admin-label">Grand Titre Éditorial</label>
                <input
                  className="admin-input"
                  value={media.lookbook?.title || ''}
                  onChange={e => store.updateLookbook({ title: e.target.value })}
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div>
                <label className="admin-label">Texte de Présentation</label>
                <textarea
                  className="admin-input"
                  rows={3}
                  value={media.lookbook?.description || ''}
                  onChange={e => store.updateLookbook({ description: e.target.value })}
                  style={{ borderRadius: 8 }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="admin-label">Bouton 1 : Texte</label>
                  <input
                    className="admin-input"
                    value={media.lookbook?.buttonText1 || ''}
                    onChange={e => store.updateLookbook({ buttonText1: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <label className="admin-label">Bouton 1 : Lien</label>
                  <input
                    className="admin-input"
                    value={media.lookbook?.buttonLink1 || ''}
                    onChange={e => store.updateLookbook({ buttonLink1: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label className="admin-label">Bouton 2 : Texte</label>
                  <input
                    className="admin-input"
                    value={media.lookbook?.buttonText2 || ''}
                    onChange={e => store.updateLookbook({ buttonText2: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <label className="admin-label">Bouton 2 : Lien</label>
                  <input
                    className="admin-input"
                    value={media.lookbook?.buttonLink2 || ''}
                    onChange={e => store.updateLookbook({ buttonLink2: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ border: '1px solid var(--adm-card-border)', borderRadius: 16, padding: 16 }}>
                <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block', marginBottom: 10 }}>Photo Éditoriale 1 (Principale)</strong>
                <div style={{ height: 120, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                  <img src={media.lookbook?.image1} alt="Lookbook 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="admin-input"
                    value={media.lookbook?.image1 || ''}
                    onChange={e => store.updateLookbook({ image1: e.target.value })}
                    style={{ borderRadius: 8, flex: 1 }}
                  />
                  <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '8px 14px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    📁 Importer
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageFileUpload(e, (dataUrl) => store.updateLookbook({ image1: dataUrl }))}
                    />
                  </label>
                </div>
              </div>

              <div style={{ border: '1px solid var(--adm-card-border)', borderRadius: 16, padding: 16 }}>
                <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block', marginBottom: 10 }}>Photo Éditoriale 2 (Secondaire / Superposée)</strong>
                <div style={{ height: 120, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                  <img src={media.lookbook?.image2} alt="Lookbook 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="admin-input"
                    value={media.lookbook?.image2 || ''}
                    onChange={e => store.updateLookbook({ image2: e.target.value })}
                    style={{ borderRadius: 8, flex: 1 }}
                  />
                  <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '8px 14px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                    📁 Importer
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={(e) => handleImageFileUpload(e, (dataUrl) => store.updateLookbook({ image2: dataUrl }))}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB 4: FAQ & STORIES ÉDITORIALES */}
      {cmsSubTab === 'faq' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="admin-card" style={{ padding: '24px', borderRadius: '20px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '0 0 16px 0' }}>
              Grande Histoire Principale (Carte Gauche)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
              <div style={{ height: 160, borderRadius: 12, overflow: 'hidden' }}>
                <img src={media.faqEditorial?.main?.image} alt="FAQ Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label className="admin-label">Titre de la Question / Article</label>
                  <input
                    className="admin-input"
                    value={media.faqEditorial?.main?.title || ''}
                    onChange={e => store.updateFaqEditorial({ main: { ...(media.faqEditorial?.main || { image: '', link: '' }), title: e.target.value } })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <label className="admin-label">Lien de Destination</label>
                  <input
                    className="admin-input"
                    value={media.faqEditorial?.main?.link || ''}
                    onChange={e => store.updateFaqEditorial({ main: { ...(media.faqEditorial?.main || { image: '', title: '' }), link: e.target.value } })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <label className="admin-label">Image Principale</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="admin-input"
                      value={media.faqEditorial?.main?.image || ''}
                      onChange={e => store.updateFaqEditorial({ main: { ...(media.faqEditorial?.main || { title: '', link: '' }), image: e.target.value } })}
                      style={{ borderRadius: 8, flex: 1 }}
                    />
                    <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '8px 14px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                      📁 Importer
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageFileUpload(e, (dataUrl) => store.updateFaqEditorial({ main: { ...(media.faqEditorial?.main || { title: '', link: '' }), image: dataUrl } }))}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
            {[
              { key: 'item1', label: 'Article 1 (Entretien des Pièces)', data: media.faqEditorial?.item1 },
              { key: 'item2', label: 'Article 2 (Fiabilité & Authenticité)', data: media.faqEditorial?.item2 },
              { key: 'item3', label: 'Article 3 (Tendances & Drops)', data: media.faqEditorial?.item3 },
            ].map(item => (
              <div key={item.key} className="admin-card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
                <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block', marginBottom: 12 }}>{item.label}</strong>
                <div style={{ height: 100, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                  <img src={item.data?.image} alt={item.data?.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div>
                    <label className="admin-label">Titre</label>
                    <input
                      className="admin-input"
                      value={item.data?.title || ''}
                      onChange={e => store.updateFaqEditorial({ [item.key]: { ...(item.data || { image: '', link: '' }), title: e.target.value } })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Image</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        className="admin-input"
                        value={item.data?.image || ''}
                        onChange={e => store.updateFaqEditorial({ [item.key]: { ...(item.data || { title: '', link: '' }), image: e.target.value } })}
                        style={{ borderRadius: 8, flex: 1 }}
                      />
                      <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '6px 10px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>
                        📁
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleImageFileUpload(e, (dataUrl) => store.updateFaqEditorial({ [item.key]: { ...(item.data || { title: '', link: '' }), image: dataUrl } }))}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUBTAB 5: GALERIE INSTAGRAM #AYMARDCLUB */}
      {cmsSubTab === 'community' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: 'var(--adm-card-bg)', padding: '20px 24px', borderRadius: '18px', border: '1px solid var(--adm-card-border)' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📸</span> Galerie Clientèle Instagram #AymardClub ({(media.communityPhotos || []).length} photos)
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
                Modération &amp; mise en avant des looks de vos clients taguant <strong>@aymar_store3</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const newId = `comm_${Date.now()}`;
                store.addCommunityPhoto({
                  id: newId,
                  image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
                  user: '@nouveau_client',
                  tag: 'Look #AymardClub'
                });
                showToast('✓ Nouvelle photo ajoutée à la galerie !');
              }}
              className="admin-btn admin-btn-primary"
              style={{ borderRadius: '12px', padding: '10px 20px', fontWeight: 800, fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
            >
              <span>+</span> Ajouter une photo client
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
            {(media.communityPhotos || []).map((photo, i) => (
              <div key={photo.id} className="admin-card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)' }}>Photo #{i + 1}</strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 800 }}>{photo.user}</span>
                    <button
                      type="button"
                      onClick={() => {
                        showConfirmDialog({
                          title: 'Supprimer cette photo ?',
                          message: `Voulez-vous retirer la publication de ${photo.user} de la galerie de la page d'accueil ?`,
                          onConfirm: () => {
                            store.deleteCommunityPhoto(photo.id);
                            showToast('Photo retirée de la boutique.');
                          },
                          type: 'danger',
                          confirmLabel: 'Retirer',
                          icon: '🗑️'
                        });
                      }}
                      style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '6px', padding: '4px 6px', fontSize: '11px' }}
                      title="Supprimer la photo"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                <div style={{ height: 200, borderRadius: 14, overflow: 'relative', border: '1px solid var(--adm-card-border)', background: '#f1f5f9' }}>
                  <img src={photo.image} alt={photo.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label className="admin-label">Pseudo Instagram (ex: @alex_kicks)</label>
                    <input
                      className="admin-input"
                      value={photo.user}
                      onChange={e => store.updateCommunityPhoto(photo.id, { user: e.target.value })}
                      style={{ borderRadius: 8, fontSize: '12.5px' }}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Modèle / Look porté (ex: Jordan 4 Retro White)</label>
                    <input
                      className="admin-input"
                      value={photo.tag}
                      onChange={e => store.updateCommunityPhoto(photo.id, { tag: e.target.value })}
                      style={{ borderRadius: 8, fontSize: '12.5px' }}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Source de l&apos;image</label>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        className="admin-input"
                        value={photo.image}
                        onChange={e => store.updateCommunityPhoto(photo.id, { image: e.target.value })}
                        style={{ borderRadius: 8, flex: 1, fontSize: '12px' }}
                        placeholder="https://..."
                      />
                      <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '6px 12px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                        📁 Importer
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleImageFileUpload(e, (dataUrl) => {
                            store.updateCommunityPhoto(photo.id, { image: dataUrl });
                            showToast('✓ Image importée avec succès !');
                          })}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

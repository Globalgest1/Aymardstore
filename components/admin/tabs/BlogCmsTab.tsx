'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAppStore, BlogPost } from '@/lib/store';
import { ConfirmDialogOptions } from '../AdminConfirmDialog';

interface BlogCmsTabProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  showConfirmDialog: (options: ConfirmDialogOptions) => void;
}

export const BlogCmsTab: React.FC<BlogCmsTabProps> = ({
  showToast,
  showConfirmDialog,
}) => {
  const { 
    blogPosts, 
    products, 
    user, 
    addBlogPost, 
    updateBlogPost, 
    deleteBlogPost, 
    togglePublishBlogPost 
  } = useAppStore();

  const posts = blogPosts || [];
  const prods = products || [];

  const [blogFilterCategory, setBlogFilterCategory] = useState<string>('ALL');
  const [blogSearch, setBlogSearch] = useState<string>('');

  // Modal State
  const [isBlogModalOpen, setIsBlogModalOpen] = useState(false);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [blogTitle, setBlogTitle] = useState('');
  const [blogSlug, setBlogSlug] = useState('');
  const [blogExcerpt, setBlogExcerpt] = useState('');
  const [blogContent, setBlogContent] = useState('');
  const [blogCoverImage, setBlogCoverImage] = useState('');
  const [blogCategory, setBlogCategory] = useState<'Lookbooks & Style' | 'Sneakers Culture' | 'Guides & Conseils' | 'Actualités & Drops'>('Lookbooks & Style');
  const [blogAuthorName, setBlogAuthorName] = useState('');
  const [blogAuthorRole, setBlogAuthorRole] = useState('');
  const [blogAuthorAvatar, setBlogAuthorAvatar] = useState('');
  const [blogReadTime, setBlogReadTime] = useState('4 min');
  const [blogTagsInput, setBlogTagsInput] = useState('');
  const [blogLinkedProductIds, setBlogLinkedProductIds] = useState<string[]>([]);
  const [blogIsFeatured, setBlogIsFeatured] = useState(false);
  const [blogPublished, setBlogPublished] = useState(true);
  const [blogProductPickerQuery, setBlogProductPickerQuery] = useState('');
  const [blogPreviewMode, setBlogPreviewMode] = useState(false);

  const totalViews = posts.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
  const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
  const publishedCount = posts.filter(p => p.published !== false).length;

  const filteredPosts = posts.filter(post => {
    const matchCat = blogFilterCategory === 'ALL' || post.category === blogFilterCategory;
    const q = blogSearch.trim().toLowerCase();
    const matchSearch = !q || 
      post.title.toLowerCase().includes(q) ||
      post.excerpt.toLowerCase().includes(q) ||
      post.author.name.toLowerCase().includes(q) ||
      post.tags.some(t => t.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  const productsForPicker = prods.filter(p => {
    if (!blogProductPickerQuery.trim()) return true;
    const q = blogProductPickerQuery.toLowerCase();
    return p.name_fr.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
  });

  const openBlogModal = (post?: BlogPost) => {
    if (post) {
      setEditingBlogPost(post);
      setBlogTitle(post.title);
      setBlogSlug(post.slug);
      setBlogExcerpt(post.excerpt);
      setBlogContent(post.content);
      setBlogCoverImage(post.coverImage);
      setBlogCategory(post.category);
      setBlogAuthorName(post.author.name);
      setBlogAuthorRole(post.author.role);
      setBlogAuthorAvatar(post.author.avatar || '');
      setBlogReadTime(post.readTime);
      setBlogTagsInput(post.tags.join(', '));
      setBlogLinkedProductIds(post.linkedProductIds || []);
      setBlogIsFeatured(!!post.isFeatured);
      setBlogPublished(post.published !== false);
    } else {
      setEditingBlogPost(null);
      setBlogTitle('');
      setBlogSlug('');
      setBlogExcerpt('');
      setBlogContent(`## L'Essentiel sur ce Modèle\n\nDécrivez ici l'histoire, la conception ou l'attrait de cette pièce...\n\n---\n\n### 1. Pourquoi cette silhouette fait l'unanimité\n\nQualité des matériaux, amorti et allure...\n\n> « Le détail qui fait toute la différence dans votre garde-robe. »\n\n### 2. Conseils de Style & Associations\n\nComment accorder cette paire avec vos tenues au quotidien...`);
      setBlogCoverImage('https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1200&auto=format&fit=crop');
      setBlogCategory('Lookbooks & Style');
      setBlogAuthorName(user?.name || 'Aymard J.');
      setBlogAuthorRole('Curateur Mode & Sneakers');
      setBlogAuthorAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop');
      setBlogReadTime('4 min');
      setBlogTagsInput('Sneakers, Mode, Hype');
      setBlogLinkedProductIds(prods[0]?.id ? [prods[0].id] : []);
      setBlogIsFeatured(false);
      setBlogPublished(true);
    }
    setBlogProductPickerQuery('');
    setBlogPreviewMode(false);
    setIsBlogModalOpen(true);
  };

  const handleSaveBlogPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim()) {
      showToast('Veuillez indiquer un titre pour l\'article.', 'warning');
      return;
    }

    const finalSlug = (blogSlug.trim() || blogTitle)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const tagsArray = blogTagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const postData = {
      title: blogTitle.trim(),
      slug: finalSlug,
      excerpt: blogExcerpt.trim() || 'Découvrez notre nouvel article éditorial.',
      content: blogContent.trim(),
      coverImage: blogCoverImage.trim() || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1200&auto=format&fit=crop',
      category: blogCategory,
      author: {
        name: blogAuthorName.trim() || 'Aymard Store',
        role: blogAuthorRole.trim() || 'Équipe Éditoriale',
        avatar: blogAuthorAvatar.trim() || undefined
      },
      publishedAt: editingBlogPost?.publishedAt || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      readTime: blogReadTime.trim() || '3 min',
      tags: tagsArray.length > 0 ? tagsArray : ['Sneakers', 'Streetwear'],
      linkedProductIds: blogLinkedProductIds,
      isFeatured: blogIsFeatured,
      published: blogPublished
    };

    if (editingBlogPost) {
      updateBlogPost(editingBlogPost.id, postData);
      showToast(`📝 Article "${blogTitle}" mis à jour avec succès !`);
    } else {
      addBlogPost(postData);
      showToast(`🎉 Nouvel article "${blogTitle}" créé et rattaché aux produits !`);
    }

    setIsBlogModalOpen(false);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Header Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
            <span>📰</span> CMS JOURNAL &amp; ARTICLES
          </div>
          <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0 }}>
            Gestion du Blog &amp; Publications Produits
          </h2>
          <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
            Rédigez vos articles, lookbooks et guides d&apos;entretien, et rattachez-les à vos paires pour booster les ventes.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <Link
            href="/blog"
            target="_blank"
            className="admin-btn admin-btn-outline"
            style={{ borderRadius: '12px', padding: '10px 18px', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <span>👁️</span> Voir le Blog en Direct
          </Link>

          <button
            onClick={() => openBlogModal()}
            className="admin-btn admin-btn-primary"
            style={{
              borderRadius: '12px',
              padding: '10px 20px',
              fontSize: '13px',
              fontWeight: 800,
              background: '#0284c7',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
            }}
          >
            <span>✍️</span> + Rédiger un nouvel article
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Total Articles</span>
            <span style={{ fontSize: '20px' }}>📚</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', marginTop: '8px' }}>
            {posts.length}
          </div>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
            {publishedCount} en ligne
          </span>
        </div>

        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Lectures / Vues</span>
            <span style={{ fontSize: '20px' }}>👀</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#38bdf8', marginTop: '8px' }}>
            {totalViews.toLocaleString('fr-FR')}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
            Vues cumulées sur le Journal
          </span>
        </div>

        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Mentions J&apos;aime</span>
            <span style={{ fontSize: '20px' }}>❤️</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#ef4444', marginTop: '8px' }}>
            {totalLikes}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
            Engagements lecteurs
          </span>
        </div>

        <div className="admin-card" style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Rattachement Produits</span>
            <span style={{ fontSize: '20px' }}>🛒</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#facc15', marginTop: '8px' }}>
            {posts.filter(p => p.linkedProductIds && p.linkedProductIds.length > 0).length} / {posts.length}
          </div>
          <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
            Articles avec liens d&apos;achat
          </span>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="admin-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: '1 1 300px' }}>
          {['ALL', 'Lookbooks & Style', 'Sneakers Culture', 'Guides & Conseils', 'Actualités & Drops'].map(cat => (
            <button
              key={cat}
              type="button"
              onClick={() => setBlogFilterCategory(cat)}
              style={{
                padding: '7px 14px',
                borderRadius: '16px',
                border: blogFilterCategory === cat ? '1px solid #38bdf8' : '1px solid var(--adm-card-border)',
                background: blogFilterCategory === cat ? 'rgba(56, 189, 248, 0.15)' : 'var(--adm-card-bg)',
                color: blogFilterCategory === cat ? '#38bdf8' : 'var(--adm-text-m)',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {cat === 'ALL' ? 'Toutes les catégories' : cat}
            </button>
          ))}
        </div>

        <div style={{ position: 'relative', width: '260px' }}>
          <input
            type="text"
            placeholder="Rechercher un article..."
            value={blogSearch}
            onChange={e => setBlogSearch(e.target.value)}
            className="admin-input"
            style={{ width: '100%', borderRadius: '20px', padding: '8px 14px 8px 32px', fontSize: '12.5px' }}
          />
          <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--adm-text-m)' }}>
            🔍
          </span>
        </div>
      </div>

      {/* Articles Table */}
      <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
        {filteredPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-m)' }}>
            <span style={{ fontSize: '44px', display: 'block', marginBottom: '12px' }}>✍️</span>
            <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '0 0 6px 0' }}>Aucun article trouvé</h4>
            <p style={{ fontSize: '13px', margin: '0 0 16px 0' }}>Commencez par rédiger un premier article pour enrichir votre boutique.</p>
            <button
              onClick={() => openBlogModal()}
              className="admin-btn admin-btn-primary admin-btn-sm"
              style={{ borderRadius: '20px', padding: '8px 18px', fontWeight: 800 }}
            >
              + Rédiger mon premier article
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ background: 'var(--adm-table-stripe)', borderBottom: '1px solid var(--adm-card-border)', textAlign: 'left' }}>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Article</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Catégorie &amp; Auteur</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Produits Rattachés 🔗</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Vues &amp; Likes</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Statut</th>
                  <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredPosts.map(post => {
                  const linkedProds = prods.filter(p => (post.linkedProductIds || []).includes(p.id));
                  return (
                    <tr key={post.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <img 
                            src={post.coverImage} 
                            alt={post.title} 
                            style={{ width: '56px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                          />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                              {post.isFeatured && (
                                <span style={{ fontSize: '9px', fontWeight: 900, background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '6px' }}>
                                  À LA UNE
                                </span>
                              )}
                              <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)', display: 'block' }}>
                                {post.title}
                              </strong>
                            </div>
                            <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                              Slug : /{post.slug} • ⏱️ {post.readTime}
                            </span>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: '8px', display: 'inline-block', marginBottom: '4px' }}>
                          {post.category}
                        </span>
                        <div style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                          Par <strong>{post.author.name}</strong> • {post.publishedAt}
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        {linkedProds.length === 0 ? (
                          <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)', fontStyle: 'italic' }}>
                            Aucun produit rattaché
                          </span>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {linkedProds.map(lp => (
                              <div key={lp.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--adm-text-h)' }}>
                                <span style={{ color: '#10b981' }}>✓</span>
                                {lp.images?.[0] && (
                                  <img src={lp.images[0]} alt={lp.name_fr} style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }} />
                                )}
                                <span>{lp.name_fr}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontSize: '12.5px', color: 'var(--adm-text-h)', fontWeight: 700 }}>
                          👀 {post.viewsCount || 0} vues
                        </div>
                        <div style={{ fontSize: '11.5px', color: '#ef4444' }}>
                          ❤️ {post.likesCount || 0} likes
                        </div>
                      </td>

                      <td style={{ padding: '14px 18px' }}>
                        <button
                          type="button"
                          onClick={() => togglePublishBlogPost(post.id)}
                          style={{
                            border: 'none',
                            background: post.published !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(113, 113, 122, 0.15)',
                            color: post.published !== false ? '#10b981' : '#71717a',
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '4px 10px',
                            borderRadius: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          {post.published !== false ? '🟢 Publié' : '⚪ Brouillon'}
                        </button>
                      </td>

                      <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <Link
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11px', textDecoration: 'none' }}
                            title="Voir la publication en ligne"
                          >
                            👁️
                          </Link>

                          <button
                            type="button"
                            onClick={() => openBlogModal(post)}
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11px' }}
                            title="Modifier l'article"
                          >
                            ✏️
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              showConfirmDialog({
                                title: 'Supprimer cet article ?',
                                message: `Êtes-vous sûr de vouloir supprimer définitivement l'article "${post.title}" ?`,
                                type: 'danger',
                                confirmLabel: 'Supprimer',
                                onConfirm: () => {
                                  deleteBlogPost(post.id);
                                  showToast('Article supprimé du blog !');
                                }
                              });
                            }}
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11px' }}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Full Blog Post Editor with Visual Product Multi-Linker */}
      {isBlogModalOpen && (
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
            padding: '16px',
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(8px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setIsBlogModalOpen(false)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '920px',
              maxHeight: '92vh',
              backgroundColor: 'var(--adm-card-bg)',
              borderRadius: '24px',
              border: '1.5px solid var(--adm-card-border)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalZoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '20px 28px',
              borderBottom: '1px solid var(--adm-card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #09090b, #18181b)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#38bdf8' }}>
                  ✍️
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                    {editingBlogPost ? 'Modifier la publication' : 'Rédiger un nouvel article de blog'}
                  </h3>
                  <span style={{ fontSize: '11.5px', color: '#a1a1aa' }}>
                    Journal Aymard Store · Rattachement de produits en 1-clic
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsBlogModalOpen(false)}
                style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveBlogPost} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                      Titre de l&apos;article *
                    </label>
                    <input
                      type="text"
                      required
                      value={blogTitle}
                      onChange={e => {
                        setBlogTitle(e.target.value);
                        if (!editingBlogPost) {
                          setBlogSlug(e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                        }
                      }}
                      placeholder="ex: Guide Style 2026 : Comment porter la Jordan 4 Retro..."
                      className="admin-input"
                      style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '13.5px', fontWeight: 700 }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                      Catégorie Éditioriale *
                    </label>
                    <select
                      value={blogCategory}
                      onChange={e => setBlogCategory(e.target.value as any)}
                      className="admin-input"
                      style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 700 }}
                    >
                      <option value="Lookbooks & Style">Lookbooks &amp; Style</option>
                      <option value="Sneakers Culture">Sneakers Culture</option>
                      <option value="Guides & Conseils">Guides &amp; Conseils</option>
                      <option value="Actualités & Drops">Actualités &amp; Drops</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                      URL Slug (/blog/...)
                    </label>
                    <input
                      type="text"
                      value={blogSlug}
                      onChange={e => setBlogSlug(e.target.value)}
                      placeholder="guide-style-jordan-4-retro"
                      className="admin-input"
                      style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px', fontFamily: 'monospace' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                      Image de Couverture (URL)
                    </label>
                    <input
                      type="url"
                      value={blogCoverImage}
                      onChange={e => setBlogCoverImage(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="admin-input"
                      style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                    Extrait / Résumé d&apos;accroche (affiché sur les cartes &amp; pour le SEO)
                  </label>
                  <textarea
                    rows={2}
                    value={blogExcerpt}
                    onChange={e => setBlogExcerpt(e.target.value)}
                    placeholder="Court résumé percutant pour donner envie aux clients de lire..."
                    className="admin-input"
                    style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', lineHeight: 1.45 }}
                  />
                </div>

                {/* VISUAL PRODUCT MULTI-LINKER */}
                <div style={{
                  background: 'rgba(56, 189, 248, 0.05)',
                  border: '1.5px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: '16px',
                  padding: '16px 20px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span>🔗</span> Rattacher des Produits du Catalogue à cet Article ({blogLinkedProductIds.length} sélectionné{blogLinkedProductIds.length > 1 ? 's' : ''})
                      </strong>
                      <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                        Ces produits apparaîtront dans l&apos;encart d&apos;achat direct de l&apos;article.
                      </span>
                    </div>

                    <input
                      type="text"
                      placeholder="Filtrer les produits (Nike, Asics...)"
                      value={blogProductPickerQuery}
                      onChange={e => setBlogProductPickerQuery(e.target.value)}
                      className="admin-input"
                      style={{ width: '220px', borderRadius: '14px', padding: '6px 12px', fontSize: '11.5px' }}
                    />
                  </div>

                  {blogLinkedProductIds.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {blogLinkedProductIds.map(pid => {
                        const prod = prods.find(p => p.id === pid);
                        if (!prod) return null;
                        return (
                          <span 
                            key={pid}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              background: '#0284c7',
                              color: '#ffffff',
                              padding: '4px 10px',
                              borderRadius: '20px',
                              fontSize: '11.5px',
                              fontWeight: 800
                            }}
                          >
                            {prod.images?.[0] && (
                              <img src={prod.images[0]} alt={prod.name_fr} style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
                            )}
                            <span>{prod.name_fr}</span>
                            <button
                              type="button"
                              onClick={() => setBlogLinkedProductIds(prev => prev.filter(id => id !== pid))}
                              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '0 2px', fontSize: '12px', fontWeight: 900 }}
                            >
                              ✕
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}

                  <div style={{
                    maxHeight: '160px',
                    overflowY: 'auto',
                    border: '1px solid var(--adm-card-border)',
                    borderRadius: '12px',
                    background: 'var(--adm-card-bg)',
                    padding: '8px'
                  }}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                      {productsForPicker.slice(0, 18).map(prod => {
                        const isLinked = blogLinkedProductIds.includes(prod.id);
                        return (
                          <button
                            key={prod.id}
                            type="button"
                            onClick={() => {
                              if (isLinked) {
                                setBlogLinkedProductIds(prev => prev.filter(id => id !== prod.id));
                              } else {
                                setBlogLinkedProductIds(prev => [...prev, prod.id]);
                              }
                            }}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '6px 10px',
                              borderRadius: '10px',
                              border: isLinked ? '1.5px solid #0284c7' : '1px solid var(--adm-card-border)',
                              background: isLinked ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                              color: 'var(--adm-text-h)',
                              textAlign: 'left',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            <span style={{ fontSize: '13px' }}>{isLinked ? '☑️' : '⬜'}</span>
                            {prod.images?.[0] && (
                              <img src={prod.images[0]} alt={prod.name_fr} style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
                            )}
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <span style={{ fontSize: '11.5px', fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {prod.name_fr}
                              </span>
                              <span style={{ fontSize: '10.5px', color: '#facc15', fontWeight: 800 }}>
                                {prod.price}€ / {Math.round(prod.price * 655.957).toLocaleString('fr-FR')} F
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                      Nom de l&apos;Auteur
                    </label>
                    <input
                      type="text"
                      value={blogAuthorName}
                      onChange={e => setBlogAuthorName(e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                      Rôle / Titre Auteur
                    </label>
                    <input
                      type="text"
                      value={blogAuthorRole}
                      onChange={e => setBlogAuthorRole(e.target.value)}
                      className="admin-input"
                      style={{ width: '100%', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                      Temps de Lecture
                    </label>
                    <input
                      type="text"
                      value={blogReadTime}
                      onChange={e => setBlogReadTime(e.target.value)}
                      placeholder="ex: 4 min"
                      className="admin-input"
                      style={{ width: '100%', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                      Tags (séparés par virgule)
                    </label>
                    <input
                      type="text"
                      value={blogTagsInput}
                      onChange={e => setBlogTagsInput(e.target.value)}
                      placeholder="Jordan, Lookbook, Cuir"
                      className="admin-input"
                      style={{ width: '100%', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px' }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                      Contenu de l&apos;article (Markdown supporté) *
                    </label>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setBlogPreviewMode(false)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: !blogPreviewMode ? '1px solid #38bdf8' : '1px solid var(--adm-card-border)',
                          background: !blogPreviewMode ? 'rgba(56,189,248,0.15)' : 'transparent',
                          color: !blogPreviewMode ? '#38bdf8' : 'var(--adm-text-m)',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Édition Markdown
                      </button>
                      <button
                        type="button"
                        onClick={() => setBlogPreviewMode(true)}
                        style={{
                          padding: '4px 10px',
                          borderRadius: '8px',
                          border: blogPreviewMode ? '1px solid #38bdf8' : '1px solid var(--adm-card-border)',
                          background: blogPreviewMode ? 'rgba(56,189,248,0.15)' : 'transparent',
                          color: blogPreviewMode ? '#38bdf8' : 'var(--adm-text-m)',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        Aperçu en Direct
                      </button>
                    </div>
                  </div>

                  {!blogPreviewMode ? (
                    <textarea
                      rows={10}
                      required
                      value={blogContent}
                      onChange={e => setBlogContent(e.target.value)}
                      placeholder="Rédigez votre article en Markdown..."
                      className="admin-input"
                      style={{ width: '100%', borderRadius: '12px', padding: '12px 14px', fontSize: '13px', lineHeight: 1.6, fontFamily: 'monospace' }}
                    />
                  ) : (
                    <div style={{
                      padding: '16px 20px',
                      borderRadius: '12px',
                      border: '1px solid var(--adm-card-border)',
                      background: 'rgba(0,0,0,0.2)',
                      maxHeight: '260px',
                      overflowY: 'auto',
                      fontSize: '13.5px',
                      lineHeight: 1.65,
                      color: 'var(--adm-text-h)'
                    }}>
                      <div style={{ whiteSpace: 'pre-line' }}>
                        {blogContent || 'Aucun contenu rédigé pour le moment.'}
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '8px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                    <input
                      type="checkbox"
                      checked={blogIsFeatured}
                      onChange={e => setBlogIsFeatured(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
                    />
                    <span>⭐ Mettre en avant à la une (Hero Banner)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                    <input
                      type="checkbox"
                      checked={blogPublished}
                      onChange={e => setBlogPublished(e.target.checked)}
                      style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                    />
                    <span>🟢 Publier immédiatement (Visible sur /blog)</span>
                  </label>
                </div>

              </div>

              <div style={{
                padding: '16px 28px',
                borderTop: '1px solid var(--adm-card-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0,0,0,0.02)'
              }}>
                <button
                  type="button"
                  onClick={() => setIsBlogModalOpen(false)}
                  className="admin-btn admin-btn-outline"
                  style={{ borderRadius: '12px', padding: '10px 20px', fontWeight: 700 }}
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  style={{
                    borderRadius: '12px',
                    padding: '10px 26px',
                    fontWeight: 800,
                    background: '#0284c7',
                    color: '#ffffff',
                    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                  }}
                >
                  {editingBlogPost ? '💾 Mettre à jour la publication' : '🎉 Publier l\'article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

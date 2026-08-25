'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore, getProductPrice } from '@/lib/store';
import { useThemeMode } from '@/lib/useThemeMode';
import { Product } from '@/lib/products-data';

export default function BlogPostDetailPage() {
  const isDarkMode = useThemeMode();
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { blogPosts, products, detectedLocationId, addToCart, likeBlogPost, incrementBlogViews, setQuickBuyProduct } = useAppStore();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const post = useMemo(() => {
    return (blogPosts || []).find(p => p.slug === slug || p.id === slug);
  }, [blogPosts, slug]);

  // Increment view count on mount
  useEffect(() => {
    if (post?.id) {
      incrementBlogViews(post.id);
    }
  }, [post?.id, incrementBlogViews]);

  // Find all attached products
  const linkedProducts = useMemo(() => {
    if (!post?.linkedProductIds || post.linkedProductIds.length === 0) return [];
    return products.filter(p => post.linkedProductIds.includes(p.id));
  }, [post?.linkedProductIds, products]);

  // Related posts (same category or others)
  const relatedPosts = useMemo(() => {
    if (!post) return [];
    return (blogPosts || [])
      .filter(p => p.id !== post.id && p.published !== false)
      .slice(0, 3);
  }, [blogPosts, post]);

  if (!post) {
    return (
      <div style={{ minHeight: '80vh', background: isDarkMode ? '#09090b' : '#f8fafc', color: isDarkMode ? '#ffffff' : '#09090b', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', textAlign: 'center' }}>
        <span style={{ fontSize: '56px', marginBottom: '16px' }}>📰</span>
        <h1 style={{ fontSize: '24px', fontWeight: 900, marginBottom: '8px' }}>Article introuvable</h1>
        <p style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: '14px', marginBottom: '24px' }}>Cet article n&apos;existe pas ou a été déplacé.</p>
        <Link href="/blog" style={{ background: isDarkMode ? '#ffffff' : '#09090b', color: isDarkMode ? '#09090b' : '#ffffff', padding: '12px 28px', borderRadius: '30px', fontWeight: 800, textDecoration: 'none', fontSize: '13px' }}>
          Retour au Journal Aymard Store
        </Link>
      </div>
    );
  }

  const articleUrl = typeof window !== 'undefined' ? window.location.href : `https://aymardstore.com/blog/${post.slug}`;
  const whatsappShareText = encodeURIComponent(`🔥 Découvre cet article sur le Journal Aymard Store : "${post.title}" 👉 ${articleUrl}`);

  const handleShareWhatsApp = () => {
    window.open(`https://api.whatsapp.com/send?text=${whatsappShareText}`, '_blank');
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(articleUrl);
      showToast('📋 Lien de l\'article copié dans le presse-papier !');
    }
  };

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    showToast(`🛍️ ${product.name_fr} ajouté à votre panier !`);
  };

  // Render markdown-like content cleanly
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, index) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('## ')) {
        return (
          <h2 key={index} style={{
            fontSize: 'clamp(20px, 3.5vw, 24px)',
            fontWeight: 900,
            color: isDarkMode ? '#ffffff' : '#09090b',
            marginTop: '36px',
            marginBottom: '14px',
            lineHeight: 1.3
          }}>
            {trimmed.replace('## ', '')}
          </h2>
        );
      }

      if (trimmed.startsWith('### ')) {
        return (
          <h3 key={index} style={{
            fontSize: 'clamp(17px, 3vw, 19px)',
            fontWeight: 800,
            color: isDarkMode ? '#38bdf8' : '#0284c7',
            marginTop: '28px',
            marginBottom: '12px',
            lineHeight: 1.3
          }}>
            {trimmed.replace('### ', '')}
          </h3>
        );
      }

      if (trimmed.startsWith('> ')) {
        return (
          <blockquote key={index} style={{
            margin: '24px 0',
            padding: '16px 20px',
            background: isDarkMode ? 'rgba(56, 189, 248, 0.05)' : '#f0f9ff',
            borderLeft: `4px solid ${isDarkMode ? '#38bdf8' : '#0284c7'}`,
            borderRadius: '0 16px 16px 0',
            color: isDarkMode ? '#e2e8f0' : '#1e293b',
            fontStyle: 'italic',
            fontSize: '14.5px',
            lineHeight: 1.6
          }}>
            {trimmed.replace('> ', '').replace(/^«|»$/g, '')}
          </blockquote>
        );
      }

      if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
        return (
          <li key={index} style={{
            color: isDarkMode ? '#d4d4d8' : '#334155',
            fontSize: '15px',
            lineHeight: 1.7,
            marginLeft: '20px',
            marginBottom: '8px'
          }}>
            {trimmed.replace(/^[*|-]\s+/, '')}
          </li>
        );
      }

      if (trimmed.startsWith('1. ') || trimmed.startsWith('2. ') || trimmed.startsWith('3. ') || trimmed.startsWith('4. ') || trimmed.startsWith('5. ')) {
        return (
          <div key={index} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            color: isDarkMode ? '#d4d4d8' : '#334155',
            fontSize: '15px',
            lineHeight: 1.7,
            marginBottom: '10px'
          }}>
            <span style={{ background: isDarkMode ? '#27272a' : '#e2e8f0', color: isDarkMode ? '#facc15' : '#854d0e', fontSize: '11px', fontWeight: 900, width: '22px', height: '22px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
              {trimmed.slice(0, 1)}
            </span>
            <span>{trimmed.slice(3)}</span>
          </div>
        );
      }

      if (trimmed === '---') {
        return (
          <hr key={index} style={{ border: 'none', borderTop: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`, margin: '32px 0' }} />
        );
      }

      if (!trimmed) {
        return <div key={index} style={{ height: '12px' }} />;
      }

      return (
        <p key={index} style={{
          color: isDarkMode ? '#d4d4d8' : '#334155',
          fontSize: '15.5px',
          lineHeight: 1.75,
          marginBottom: '14px'
        }}>
          {trimmed}
        </p>
      );
    });
  };

  return (
    <div style={{ minHeight: '100vh', background: isDarkMode ? '#09090b' : '#f8fafc', color: isDarkMode ? '#f4f4f5' : '#0f172a', paddingBottom: '90px', transition: 'background-color 0.2s ease, color 0.2s ease' }}>

      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: isDarkMode ? '#09090b' : '#ffffff',
          border: `1px solid ${isDarkMode ? '#38bdf8' : '#0284c7'}`,
          color: isDarkMode ? '#ffffff' : '#09090b',
          padding: '12px 20px',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          fontSize: '13px',
          fontWeight: 800,
          zIndex: 99999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          {toastMessage}
        </div>
      )}

      {/* 1. Breadcrumb */}
      <nav style={{ maxWidth: '840px', margin: '0 auto', padding: '24px 16px 12px 16px', fontSize: '12px', color: isDarkMode ? '#71717a' : '#64748b' }}>
        <Link href="/" style={{ color: isDarkMode ? '#a1a1aa' : '#475569', textDecoration: 'none' }}>Accueil</Link>
        <span style={{ margin: '0 8px' }}>/</span>
        <Link href="/blog" style={{ color: isDarkMode ? '#a1a1aa' : '#475569', textDecoration: 'none' }}>Le Journal</Link>
        <span style={{ margin: '0 8px' }}>/</span>
        <span style={{ color: isDarkMode ? '#38bdf8' : '#0284c7', fontWeight: 700 }}>{post.category}</span>
      </nav>

      {/* 2. Article Header */}
      <header style={{ maxWidth: '840px', margin: '0 auto', padding: '12px 16px 24px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <span style={{
            background: isDarkMode ? 'rgba(56, 189, 248, 0.12)' : 'rgba(2, 132, 199, 0.08)',
            color: isDarkMode ? '#38bdf8' : '#0284c7',
            fontSize: '11px',
            fontWeight: 900,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            padding: '4px 12px',
            borderRadius: '16px',
            border: `1px solid ${isDarkMode ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.25)'}`
          }}>
            {post.category}
          </span>
          <span style={{ color: isDarkMode ? '#71717a' : '#64748b', fontSize: '12px' }}>⏱️ {post.readTime}</span>
          <span style={{ color: isDarkMode ? '#71717a' : '#64748b', fontSize: '12px' }}>• {post.publishedAt}</span>
        </div>

        <h1 style={{
          fontSize: 'clamp(24px, 5vw, 38px)',
          fontWeight: 900,
          letterSpacing: '-0.5px',
          color: isDarkMode ? '#ffffff' : '#09090b',
          lineHeight: 1.2,
          margin: '0 0 16px 0'
        }}>
          {post.title}
        </h1>

        <p style={{
          fontSize: 'clamp(14px, 2.5vw, 16.5px)',
          color: isDarkMode ? '#a1a1aa' : '#64748b',
          lineHeight: 1.6,
          margin: '0 0 24px 0'
        }}>
          {post.excerpt}
        </p>

        {/* Author Bio Bar & Share Buttons */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
          borderBottom: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
          padding: '14px 0',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {post.author.avatar && (
              <img 
                src={post.author.avatar} 
                alt={post.author.name} 
                style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }}
              />
            )}
            <div>
              <strong style={{ fontSize: '13px', color: isDarkMode ? '#ffffff' : '#09090b', display: 'block' }}>{post.author.name}</strong>
              <span style={{ fontSize: '11px', color: isDarkMode ? '#71717a' : '#64748b' }}>{post.author.role}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* WhatsApp Share Button */}
            <button
              onClick={handleShareWhatsApp}
              style={{
                background: '#25d366',
                color: '#ffffff',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(37, 211, 102, 0.3)'
              }}
            >
              <span>💬</span>
              <span>Partager sur WhatsApp</span>
            </button>

            {/* Copy link */}
            <button
              onClick={handleCopyLink}
              style={{
                background: isDarkMode ? '#18181b' : '#ffffff',
                color: isDarkMode ? '#d4d4d8' : '#334155',
                border: `1px solid ${isDarkMode ? '#27272a' : '#cbd5e1'}`,
                padding: '8px 12px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                boxShadow: isDarkMode ? 'none' : '0 1px 4px rgba(0,0,0,0.05)'
              }}
              title="Copier le lien de l'article"
            >
              🔗
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Cover Image */}
      <div style={{ maxWidth: '960px', margin: '0 auto 36px auto', padding: '0 16px' }}>
        <div style={{ borderRadius: '24px', overflow: 'hidden', maxHeight: '520px', boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.5)' : '0 10px 30px rgba(0,0,0,0.08)' }}>
          <img 
            src={post.coverImage} 
            alt={post.title} 
            style={{ width: '100%', height: '100%', maxHeight: '520px', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* 4. Article Body + Attached Product Widget */}
      <main style={{ maxWidth: '840px', margin: '0 auto', padding: '0 16px' }}>

        {/* 4.1 Shop The Look: Attached Product Interactive Card (Mobile & Desktop) */}
        {linkedProducts.length > 0 && (
          <div style={{
            background: isDarkMode ? 'linear-gradient(135deg, #18181b 0%, #121215 100%)' : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: `1.5px solid ${isDarkMode ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.25)'}`,
            borderRadius: '20px',
            padding: '18px 20px',
            marginBottom: '32px',
            boxShadow: isDarkMode ? '0 10px 25px rgba(0,0,0,0.3)' : '0 6px 20px rgba(0,0,0,0.05)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <span style={{ fontSize: '11px', fontWeight: 900, color: isDarkMode ? '#38bdf8' : '#0284c7', letterSpacing: '1px', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🛒</span> SHOP THE ARTICLE / PAIRES ASSOCIÉES
              </span>
              <span style={{ fontSize: '10.5px', color: '#10b981', fontWeight: 800, background: 'rgba(16,185,129,0.12)', padding: '2px 8px', borderRadius: '10px' }}>
                ✓ 100% Authentique &amp; En Stock
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {linkedProducts.map(prod => {
                const priceInfo = getProductPrice(prod, detectedLocationId);
                return (
                  <div 
                    key={prod.id} 
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '14px',
                      background: isDarkMode ? '#09090b' : '#ffffff',
                      border: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
                      borderRadius: '16px',
                      padding: '12px 14px',
                      flexWrap: 'wrap'
                    }}
                  >
                    {prod.images?.[0] && (
                      <Link href={`/products/${prod.slug || prod.id}`}>
                        <img 
                          src={prod.images[0]} 
                          alt={prod.name_fr} 
                          style={{ width: '60px', height: '60px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                        />
                      </Link>
                    )}

                    <div style={{ flex: '1 1 180px', minWidth: 0 }}>
                      <Link href={`/products/${prod.slug || prod.id}`} style={{ textDecoration: 'none' }}>
                        <strong style={{ fontSize: '13.5px', color: isDarkMode ? '#ffffff' : '#09090b', display: 'block', lineHeight: 1.3, marginBottom: '4px' }}>
                          {prod.name_fr}
                        </strong>
                      </Link>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 900, color: isDarkMode ? '#facc15' : '#ca8a04' }}>
                          {priceInfo.formattedPrice}
                        </span>
                        <span style={{ fontSize: '11px', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
                          (Stock : {prod.stock} restant)
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setQuickBuyProduct({ product: prod })}
                        style={{
                          background: isDarkMode ? '#ffffff' : '#09090b',
                          color: isDarkMode ? '#09090b' : '#ffffff',
                          border: 'none',
                          padding: '9px 18px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 900,
                          letterSpacing: '0.4px',
                          textTransform: 'uppercase',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: isDarkMode ? '0 4px 12px rgba(255, 255, 255, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.2)'
                        }}
                      >
                        <span>Commander</span>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                      </button>

                      <button
                        onClick={() => handleAddToCart(prod)}
                        style={{
                          background: isDarkMode ? '#ffffff' : '#09090b',
                          color: isDarkMode ? '#09090b' : '#ffffff',
                          border: 'none',
                          padding: '8px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 900,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span>+</span>
                        <span>Panier</span>
                      </button>

                      <Link
                        href={`/products/${prod.slug || prod.id}`}
                        style={{
                          background: isDarkMode ? '#27272a' : '#f1f5f9',
                          color: isDarkMode ? '#ffffff' : '#09090b',
                          border: `1px solid ${isDarkMode ? '#3f3f46' : '#cbd5e1'}`,
                          padding: '8px 14px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 700,
                          textDecoration: 'none'
                        }}
                      >
                        Fiche ➔
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 4.2 Formatted Reading Content */}
        <div style={{ fontSize: '15.5px', color: isDarkMode ? '#d4d4d8' : '#334155', lineHeight: 1.75 }}>
          {renderFormattedContent(post.content)}
        </div>

        {/* 4.3 Like & Engagement Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
          borderBottom: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
          padding: '16px 0',
          margin: '40px 0',
          flexWrap: 'wrap',
          gap: '12px'
        }}>
          <button
            onClick={() => {
              likeBlogPost(post.id);
              showToast('❤️ Merci pour votre mention j\'aime !');
            }}
            style={{
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              padding: '8px 18px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <span>❤️</span>
            <span>J&apos;aime ({post.likesCount || 0})</span>
          </button>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {post.tags.map(t => (
              <span key={t} style={{ background: isDarkMode ? '#18181b' : '#f1f5f9', color: isDarkMode ? '#a1a1aa' : '#475569', fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '12px', border: isDarkMode ? 'none' : '1px solid #e2e8f0' }}>
                #{t}
              </span>
            ))}
          </div>
        </div>

        {/* 4.4 Related Articles Section */}
        {relatedPosts.length > 0 && (
          <div style={{ marginTop: '50px' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>📚</span> À lire ensuite dans le Journal
            </h3>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '16px'
            }}>
              {relatedPosts.map(rel => (
                <Link
                  key={rel.id}
                  href={`/blog/${rel.slug}`}
                  style={{
                    background: isDarkMode ? '#121215' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isDarkMode ? 'none' : '0 4px 14px rgba(0,0,0,0.04)'
                  }}
                >
                  <img src={rel.coverImage} alt={rel.title} style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
                  <div style={{ padding: '14px' }}>
                    <span style={{ fontSize: '10px', color: isDarkMode ? '#38bdf8' : '#0284c7', fontWeight: 800, textTransform: 'uppercase' }}>
                      {rel.category}
                    </span>
                    <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: '6px 0', lineHeight: 1.35 }}>
                      {rel.title}
                    </h4>
                    <span style={{ fontSize: '11px', color: isDarkMode ? '#71717a' : '#94a3b8' }}>⏱️ {rel.readTime}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

      </main>

    </div>
  );
}

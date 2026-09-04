import React, { useState, useMemo, useEffect } from 'react';
import Link from '@/lib/compat-link';
import Image from '@/lib/compat-image';
import { useAppStore, getProductPrice } from '@/lib/store';
import { useThemeMode } from '@/lib/useThemeMode';
import AppLayout from '@/Layouts/AppLayout';

const CATEGORIES = [
  'Tous',
  'Lookbooks & Style',
  'Sneakers Culture',
  'Guides & Conseils',
  'Actualités & Drops',
] as const;

export default function BlogIndexPage(props: { initialPosts?: any[] }) {
  const isDarkMode = useThemeMode();
  const { blogPosts, products, detectedLocationId } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (props.initialPosts && props.initialPosts.length > 0) {
      useAppStore.setState({ blogPosts: props.initialPosts });
    }
  }, [props.initialPosts]);

  const publishedPosts = useMemo(() => {
    return (blogPosts || []).filter(p => p.published !== false);
  }, [blogPosts]);

  const filteredPosts = useMemo(() => {
    return publishedPosts.filter(post => {
      const matchCat = selectedCategory === 'Tous' || post.category === selectedCategory;
      const q = searchQuery.trim().toLowerCase();
      const matchSearch = !q || 
        post.title.toLowerCase().includes(q) || 
        post.excerpt.toLowerCase().includes(q) ||
        post.tags.some(t => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });
  }, [publishedPosts, selectedCategory, searchQuery]);

  const featuredPost = useMemo(() => {
    return publishedPosts.find(p => p.isFeatured) || publishedPosts[0];
  }, [publishedPosts]);

  const regularPosts = useMemo(() => {
    if (selectedCategory !== 'Tous' || searchQuery) {
      return filteredPosts;
    }
    return filteredPosts.filter(p => p.id !== featuredPost?.id);
  }, [filteredPosts, featuredPost, selectedCategory, searchQuery]);

  return (
    <AppLayout>
      <div style={{ minHeight: '100vh', background: isDarkMode ? '#09090b' : '#f8fafc', color: isDarkMode ? '#f4f4f5' : '#0f172a', paddingBottom: '80px', transition: 'background-color 0.2s ease, color 0.2s ease' }}>
      
      {/* 1. Header Editorial Banner */}
      <section style={{
        background: isDarkMode ? 'linear-gradient(180deg, #121215 0%, #09090b 100%)' : 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
        borderBottom: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
        padding: '50px 16px 36px 16px',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '840px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: isDarkMode ? 'rgba(56, 189, 248, 0.1)' : 'rgba(2, 132, 199, 0.08)',
            border: `1px solid ${isDarkMode ? 'rgba(56, 189, 248, 0.3)' : 'rgba(2, 132, 199, 0.25)'}`,
            color: isDarkMode ? '#38bdf8' : '#0284c7',
            fontSize: '11px',
            fontWeight: 900,
            letterSpacing: '1.5px',
            textTransform: 'uppercase',
            padding: '6px 14px',
            borderRadius: '20px',
            marginBottom: '16px'
          }}>
            <span>📰</span> LE JOURNAL AYMARD STORE
          </div>

          <h1 style={{
            fontSize: 'clamp(28px, 5vw, 44px)',
            fontWeight: 900,
            letterSpacing: '-1px',
            color: isDarkMode ? '#ffffff' : '#09090b',
            margin: '0 0 14px 0',
            lineHeight: 1.15
          }}>
            Culture Sneakers, Lookbooks &amp; Guides Exclusifs
          </h1>

          <p style={{
            fontSize: 'clamp(14px, 2.5vw, 16px)',
            color: isDarkMode ? '#a1a1aa' : '#64748b',
            margin: '0 auto 28px auto',
            maxWidth: '620px',
            lineHeight: 1.6
          }}>
            Explorez nos analyses tendances, histoires de silhouettes légendaires et conseils pointures rattachés directement à nos collections disponibles.
          </p>

          {/* Search bar */}
          <div style={{
            maxWidth: '460px',
            margin: '0 auto',
            position: 'relative'
          }}>
            <input
              type="text"
              placeholder="Rechercher un article, modèle (Jordan, Asics...), guide..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: isDarkMode ? '#18181b' : '#ffffff',
                border: `1px solid ${isDarkMode ? '#3f3f46' : '#cbd5e1'}`,
                borderRadius: '30px',
                padding: '12px 20px 12px 42px',
                fontSize: '13.5px',
                color: isDarkMode ? '#ffffff' : '#09090b',
                outline: 'none',
                boxSizing: 'border-box',
                boxShadow: isDarkMode ? 'none' : '0 2px 10px rgba(0,0,0,0.04)'
              }}
            />
            <span style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', fontSize: '15px', color: isDarkMode ? '#71717a' : '#94a3b8' }}>
              🔍
            </span>
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: isDarkMode ? '#a1a1aa' : '#64748b', cursor: 'pointer', fontSize: '14px' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 2. Category Filters (Touch Swipeable on Mobile) */}
      <section style={{
        maxWidth: '1240px',
        margin: '0 auto',
        padding: '20px 16px',
      }}>
        <div style={{
          display: 'flex',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '8px',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          WebkitOverflowScrolling: 'touch'
        }}>
          {CATEGORIES.map(cat => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  flexShrink: 0,
                  background: isSelected ? (isDarkMode ? '#ffffff' : '#09090b') : (isDarkMode ? '#18181b' : '#ffffff'),
                  color: isSelected ? (isDarkMode ? '#09090b' : '#ffffff') : (isDarkMode ? '#d4d4d8' : '#475569'),
                  border: isSelected ? (isDarkMode ? '1px solid #ffffff' : '1px solid #09090b') : `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
                  padding: '9px 18px',
                  borderRadius: '24px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isSelected ? (isDarkMode ? '0 4px 14px rgba(255,255,255,0.15)' : '0 4px 14px rgba(0,0,0,0.15)') : 'none'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Main Content Container */}
      <main style={{ maxWidth: '1240px', margin: '0 auto', padding: '0 16px' }}>

        {/* 3.1 Featured Hero Post (Shown when no active search/category filter) */}
        {featuredPost && selectedCategory === 'Tous' && !searchQuery && (
          <div style={{ marginBottom: '40px' }}>
            <div style={{
              background: isDarkMode ? '#121215' : '#ffffff',
              border: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
              borderRadius: '24px',
              overflow: 'hidden',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
              gap: '0',
              boxShadow: isDarkMode ? '0 20px 40px rgba(0,0,0,0.4)' : '0 10px 30px rgba(0,0,0,0.06)',
              transition: 'transform 0.2s ease'
            }}>
              {/* Featured Image */}
              <Link href={`/blog/${featuredPost.slug}`} style={{ position: 'relative', minHeight: '300px', display: 'block', overflow: 'hidden' }}>
                <img 
                  src={featuredPost.coverImage} 
                  alt={featuredPost.title} 
                  style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                />
                <div style={{
                  position: 'absolute',
                  top: '16px',
                  left: '16px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '10px',
                  fontWeight: 900,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  boxShadow: '0 2px 10px rgba(239, 68, 68, 0.4)'
                }}>
                  ⭐ À LA UNE
                </div>
              </Link>

              {/* Featured Details */}
              <div style={{ padding: 'clamp(24px, 4vw, 40px)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                  <span style={{ color: isDarkMode ? '#38bdf8' : '#0284c7', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {featuredPost.category}
                  </span>
                  <span style={{ color: isDarkMode ? '#52525b' : '#cbd5e1', fontSize: '12px' }}>•</span>
                  <span style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: '12px', fontWeight: 600 }}>
                    ⏱️ {featuredPost.readTime}
                  </span>
                  <span style={{ color: isDarkMode ? '#52525b' : '#cbd5e1', fontSize: '12px' }}>•</span>
                  <span style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', fontSize: '12px' }}>
                    {featuredPost.publishedAt}
                  </span>
                </div>

                <Link href={`/blog/${featuredPost.slug}`} style={{ textDecoration: 'none' }}>
                  <h2 style={{
                    fontSize: 'clamp(20px, 3.5vw, 28px)',
                    fontWeight: 900,
                    color: isDarkMode ? '#ffffff' : '#09090b',
                    lineHeight: 1.25,
                    margin: '0 0 14px 0'
                  }}>
                    {featuredPost.title}
                  </h2>
                </Link>

                <p style={{
                  fontSize: '13.5px',
                  color: isDarkMode ? '#a1a1aa' : '#64748b',
                  lineHeight: 1.6,
                  margin: '0 0 20px 0'
                }}>
                  {featuredPost.excerpt}
                </p>

                {/* Linked Product Preview Badge (If available) */}
                {featuredPost.linkedProductIds && featuredPost.linkedProductIds.length > 0 && (() => {
                  const firstLinkedProd = products.find(p => p.id === featuredPost.linkedProductIds[0]);
                  if (!firstLinkedProd) return null;
                  const priceInfo = getProductPrice(firstLinkedProd, detectedLocationId);
                  return (
                    <div style={{
                      background: isDarkMode ? 'rgba(255,255,255,0.04)' : '#f8fafc',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0'}`,
                      borderRadius: '16px',
                      padding: '10px 14px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      marginBottom: '20px'
                    }}>
                      {firstLinkedProd.images?.[0] && (
                        <img 
                          src={firstLinkedProd.images[0]} 
                          alt={firstLinkedProd.name_fr} 
                          style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                        />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '10px', color: isDarkMode ? '#38bdf8' : '#0284c7', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>
                          Paire rattachée à l&apos;article
                        </span>
                        <strong style={{ fontSize: '12.5px', color: isDarkMode ? '#ffffff' : '#09090b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                          {firstLinkedProd.name_fr}
                        </strong>
                      </div>
                      <span style={{ fontSize: '12.5px', fontWeight: 900, color: isDarkMode ? '#facc15' : '#ca8a04', flexShrink: 0 }}>
                        {priceInfo.formattedPrice}
                      </span>
                    </div>
                  );
                })()}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {featuredPost.author.avatar && (
                      <img 
                        src={featuredPost.author.avatar} 
                        alt={featuredPost.author.name} 
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    )}
                    <span style={{ fontSize: '12px', fontWeight: 700, color: isDarkMode ? '#d4d4d8' : '#334155' }}>
                      {featuredPost.author.name}
                    </span>
                  </div>

                  <Link 
                    href={`/blog/${featuredPost.slug}`}
                    style={{
                      background: isDarkMode ? '#ffffff' : '#09090b',
                      color: isDarkMode ? '#09090b' : '#ffffff',
                      fontSize: '12px',
                      fontWeight: 800,
                      padding: '8px 18px',
                      borderRadius: '20px',
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '6px',
                      boxShadow: isDarkMode ? 'none' : '0 2px 8px rgba(0,0,0,0.15)'
                    }}
                  >
                    Lire l&apos;article ➔
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3.2 Articles Grid (1 col mobile, 2 col tablet, 3 col desktop) */}
        {regularPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 20px', color: isDarkMode ? '#71717a' : '#94a3b8' }}>
            <span style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>📖</span>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 6px 0' }}>Aucun article trouvé</h3>
            <p style={{ fontSize: '13px', margin: 0 }}>Essayez de modifier vos filtres ou vos termes de recherche.</p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '24px'
          }}>
            {regularPosts.map(post => {
              // Find first linked product if any
              const linkedProd = post.linkedProductIds && post.linkedProductIds.length > 0 
                ? products.find(p => p.id === post.linkedProductIds[0]) 
                : null;
              const priceInfo = linkedProd ? getProductPrice(linkedProd, detectedLocationId) : null;

              return (
                <article
                  key={post.id}
                  style={{
                    background: isDarkMode ? '#121215' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
                    borderRadius: '20px',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: isDarkMode ? '0 8px 24px rgba(0,0,0,0.25)' : '0 4px 20px rgba(0,0,0,0.04)',
                    transition: 'transform 0.2s ease, border-color 0.2s ease'
                  }}
                >
                  {/* Card Cover Image */}
                  <Link href={`/blog/${post.slug}`} style={{ position: 'relative', height: '200px', display: 'block', overflow: 'hidden' }}>
                    <img 
                      src={post.coverImage} 
                      alt={post.title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.3s ease' }}
                    />
                    <div style={{
                      position: 'absolute',
                      bottom: '10px',
                      left: '10px',
                      background: isDarkMode ? 'rgba(9, 9, 11, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                      backdropFilter: 'blur(4px)',
                      color: isDarkMode ? '#ffffff' : '#09090b',
                      fontSize: '10.5px',
                      fontWeight: 800,
                      padding: '4px 10px',
                      borderRadius: '12px',
                      border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)'}`
                    }}>
                      ⏱️ {post.readTime}
                    </div>
                  </Link>

                  {/* Card Body */}
                  <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: isDarkMode ? '#38bdf8' : '#0284c7', textTransform: 'uppercase' }}>
                        {post.category}
                      </span>
                      <span style={{ fontSize: '11px', color: isDarkMode ? '#71717a' : '#94a3b8' }}>
                        {post.publishedAt}
                      </span>
                    </div>

                    <Link href={`/blog/${post.slug}`} style={{ textDecoration: 'none', color: isDarkMode ? '#ffffff' : '#09090b' }}>
                      <h3 style={{
                        fontSize: '16.5px',
                        fontWeight: 900,
                        lineHeight: 1.35,
                        margin: '0 0 10px 0',
                        color: isDarkMode ? '#ffffff' : '#09090b'
                      }}>
                        {post.title}
                      </h3>
                    </Link>

                    <p style={{
                      fontSize: '12.5px',
                      color: isDarkMode ? '#a1a1aa' : '#64748b',
                      lineHeight: 1.5,
                      margin: '0 0 16px 0',
                      flex: 1
                    }}>
                      {post.excerpt}
                    </p>

                    {/* Attached Product Mini-Card Badge (Shop The Look Preview) */}
                    {linkedProd && priceInfo && (
                      <Link 
                        href={`/products/${linkedProd.slug || linkedProd.id}`}
                        style={{
                          background: isDarkMode ? 'rgba(255,255,255,0.03)' : '#f8fafc',
                          border: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
                          borderRadius: '14px',
                          padding: '8px 10px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          textDecoration: 'none',
                          marginBottom: '16px'
                        }}
                      >
                        {linkedProd.images?.[0] && (
                          <img 
                            src={linkedProd.images[0]} 
                            alt={linkedProd.name_fr} 
                            style={{ width: '36px', height: '36px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                          />
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <span style={{ fontSize: '9.5px', color: '#10b981', fontWeight: 800, textTransform: 'uppercase', display: 'block' }}>
                            🛒 Paire liée à l&apos;article
                          </span>
                          <span style={{ fontSize: '11.5px', fontWeight: 700, color: isDarkMode ? '#ffffff' : '#09090b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                            {linkedProd.name_fr}
                          </span>
                        </div>
                        <span style={{ fontSize: '11.5px', fontWeight: 900, color: isDarkMode ? '#facc15' : '#ca8a04', flexShrink: 0 }}>
                          {priceInfo.formattedPrice}
                        </span>
                      </Link>
                    )}

                    {/* Footer Author & Read Link */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      borderTop: `1px solid ${isDarkMode ? '#27272a' : '#f1f5f9'}`,
                      paddingTop: '12px',
                      marginTop: 'auto'
                    }}>
                      <span style={{ fontSize: '11.5px', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
                        Par {post.author.name}
                      </span>
                      <Link 
                        href={`/blog/${post.slug}`}
                        style={{
                          fontSize: '12px',
                          fontWeight: 800,
                          color: isDarkMode ? '#ffffff' : '#09090b',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        Lire ➔
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

      </main>

      </div>
    </AppLayout>
  );
}

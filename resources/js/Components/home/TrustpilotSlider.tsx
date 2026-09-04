'use client';

import React, { useRef, useEffect } from 'react';
import { useAppStore } from '@/lib/store';

export default function TrustpilotSlider() {
  const { reviews: storeReviews } = useAppStore();
  const approvedReviews = (storeReviews || []).filter(r => r.status === 'APPROVED');
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isDown = useRef(false);
  const startX = useRef(0);
  const scrollLeftState = useRef(0);

  // Auto-scroll loop when section is visible and has reviews
  useEffect(() => {
    if (typeof window === 'undefined' || approvedReviews.length === 0) return;

    const container = scrollContainerRef.current;
    if (!container) return;

    let isVisible = false;
    let timer: NodeJS.Timeout | null = null;
    let direction = 1;
    const intervalTime = 4000;

    const autoScroll = () => {
      if (isDown.current || !isVisible) return;

      const maxScrollLeft = container.scrollWidth - container.clientWidth;
      if (maxScrollLeft <= 0) return;

      let newScroll = container.scrollLeft + 300 * direction;

      if (newScroll >= maxScrollLeft) {
        newScroll = maxScrollLeft;
        direction = -1;
      } else if (newScroll <= 0) {
        newScroll = 0;
        direction = 1;
      }

      container.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    };

    const startAutoplay = () => {
      stopAutoplay();
      timer = setTimeout(() => {
        autoScroll();
        timer = setInterval(autoScroll, intervalTime);
      }, 1500);
    };

    const stopAutoplay = () => {
      if (timer) {
        clearTimeout(timer);
        clearInterval(timer as any);
        timer = null;
      }
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          isVisible = entry.isIntersecting;
          if (isVisible) {
            startAutoplay();
          } else {
            stopAutoplay();
          }
        });
      },
      { threshold: 0.35 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      stopAutoplay();
    };
  }, [approvedReviews.length]);

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: -280, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: 280, behavior: 'smooth' });
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    isDown.current = true;
    scrollContainerRef.current.classList.add('grabbing');
    startX.current = e.pageX - scrollContainerRef.current.offsetLeft;
    scrollLeftState.current = scrollContainerRef.current.scrollLeft;
  };

  const handleMouseLeave = () => {
    isDown.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.classList.remove('grabbing');
    }
  };

  const handleMouseUp = () => {
    isDown.current = false;
    if (scrollContainerRef.current) {
      scrollContainerRef.current.classList.remove('grabbing');
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown.current || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX.current) * 1.5;
    scrollContainerRef.current.scrollLeft = scrollLeftState.current - walk;
  };

  // If no reviews exist yet, show authentic VIP Customer Reassurance Banner
  if (approvedReviews.length === 0) {
    return (
      <section style={{ padding: '48px 0', background: '#09090b', color: '#ffffff', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="container" style={{ textAlign: 'center' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, letterSpacing: '2px', color: '#0284c7', textTransform: 'uppercase' }}>
            ENGAGEMENT QUALITÉ &amp; SERVICE
          </span>
          <h2 style={{ fontSize: '24px', fontWeight: 900, margin: '6px 0 10px 0', letterSpacing: '-0.4px' }}>
            L&apos;Excellence Aymard Store à Chaque Commande
          </h2>
          <p style={{ fontSize: '13.5px', color: 'rgba(255,255,255,0.65)', maxWidth: '620px', margin: '0 auto 28px auto', lineHeight: 1.6 }}>
            Chaque pièce est rigoureusement examinée avant expédition. Vous recevez un suivi en temps réel sur WhatsApp dès le départ de votre colis.
          </p>

          <div style={{
            maxWidth: '1020px',
            margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '18px',
            padding: '4px 8px',
            boxShadow: '0 12px 30px rgba(0,0,0,0.25)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '0'
          }}>
            {/* 1. Sceau d'Authenticité & Certification */}
            <div style={{
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="34" height="34" viewBox="0 0 64 64" fill="none">
                  <defs>
                    <linearGradient id="goldSeal" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#FDE047" />
                      <stop offset="50%" stopColor="#CA8A04" />
                      <stop offset="100%" stopColor="#A16207" />
                    </linearGradient>
                    <linearGradient id="goldInner" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#27272A" />
                      <stop offset="100%" stopColor="#09090B" />
                    </linearGradient>
                    <filter id="goldGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#EAB308" floodOpacity="0.4"/>
                    </filter>
                  </defs>
                  {/* Rubans de certification */}
                  <path d="M22 42L16 56L32 50L48 56L42 42" fill="url(#goldSeal)" opacity="0.9" />
                  {/* Sceau doré */}
                  <circle cx="32" cy="28" r="22" fill="url(#goldSeal)" filter="url(#goldGlow)" />
                  <circle cx="32" cy="28" r="18" fill="url(#goldInner)" stroke="#FDE047" strokeWidth="1.5" />
                  {/* Coche de certification officielle */}
                  <path d="M23 28L29 34L41 20" stroke="#FDE047" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="32" cy="14.5" r="1.5" fill="#FDE047" />
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: '12.5px', color: '#ffffff', fontWeight: 800, display: 'block', letterSpacing: '-0.2px' }}>
                  100% Neuf &amp; Authentique
                </strong>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px', display: 'block', lineHeight: '1.3' }}>
                  Boîte d&apos;origine &amp; accessoires inclus.
                </span>
              </div>
            </div>

            {/* 2. Camion / Véhicule de Livraison Express */}
            <div style={{
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="36" height="36" viewBox="0 0 64 64" fill="none">
                  <defs>
                    <linearGradient id="truckBody" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#38BDF8" />
                      <stop offset="100%" stopColor="#0284C7" />
                    </linearGradient>
                    <linearGradient id="truckCab" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#0EA5E9" />
                      <stop offset="100%" stopColor="#0369A1" />
                    </linearGradient>
                    <linearGradient id="wheelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#64748B" />
                      <stop offset="100%" stopColor="#0F172A" />
                    </linearGradient>
                    <filter id="truckGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#38BDF8" floodOpacity="0.4"/>
                    </filter>
                  </defs>
                  {/* Trais de vitesse livraison */}
                  <path d="M4 22H11M2 28H9M5 34H13" stroke="#38BDF8" strokeWidth="2.5" strokeLinecap="round" opacity="0.65"/>
                  {/* Caisse de transport sécurisée */}
                  <rect x="14" y="16" width="28" height="26" rx="4" fill="url(#truckBody)" filter="url(#truckGlow)"/>
                  <path d="M23 16V42M32 16V42" stroke="rgba(255,255,255,0.25)" strokeWidth="1.2" strokeDasharray="3 3"/>
                  {/* Éclair Express */}
                  <path d="M28 21L23 30H29L26 38L34 28H28L31 21H28Z" fill="#FEF08A"/>
                  {/* Cabine conducteur */}
                  <path d="M42 24H51L58 32V42H42V24Z" fill="url(#truckCab)"/>
                  {/* Pare-brise */}
                  <path d="M44 26H49.5L54 32H44V26Z" fill="#BAE6FD" opacity="0.9"/>
                  {/* Phare avant */}
                  <rect x="56.5" y="35" width="2.5" height="4" rx="1.2" fill="#FEF08A"/>
                  {/* Roues */}
                  <circle cx="24" cy="44" r="6" fill="url(#wheelGrad)"/>
                  <circle cx="24" cy="44" r="2.5" fill="#E2E8F0"/>
                  <circle cx="48" cy="44" r="6" fill="url(#wheelGrad)"/>
                  <circle cx="48" cy="44" r="2.5" fill="#E2E8F0"/>
                  {/* Ombre au sol */}
                  <ellipse cx="36" cy="52" rx="24" ry="2.5" fill="rgba(0,0,0,0.3)"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: '12.5px', color: '#ffffff', fontWeight: 800, display: 'block', letterSpacing: '-0.2px' }}>
                  Expédition Express 24/48h
                </strong>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px', display: 'block', lineHeight: '1.3' }}>
                  Livraison sécurisée avec coursier ou transporteur.
                </span>
              </div>
            </div>

            {/* 3. Support Client WhatsApp Dédié */}
            <div style={{
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              textAlign: 'left'
            }}>
              <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="34" height="34" viewBox="0 0 64 64" fill="none">
                  <defs>
                    <linearGradient id="supportGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                    <linearGradient id="badgeDark" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#27272A" />
                      <stop offset="100%" stopColor="#09090B" />
                    </linearGradient>
                    <filter id="supportGlow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#10B981" floodOpacity="0.4"/>
                    </filter>
                  </defs>
                  {/* Cadre de conciergerie */}
                  <circle cx="32" cy="32" r="23" fill="url(#badgeDark)" stroke="#10B981" strokeWidth="1.5" filter="url(#supportGlow)"/>
                  {/* Casque audio de conseiller client */}
                  <path d="M20 32C20 25.37 25.37 20 32 20C38.63 20 44 25.37 44 32V36C44 38.2 42.2 40 40 40H38V30H42" stroke="url(#supportGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Coussinets */}
                  <rect x="18" y="28" width="5" height="10" rx="2.5" fill="#34D399"/>
                  <rect x="41" y="28" width="5" height="10" rx="2.5" fill="#34D399"/>
                  {/* Micro conseiller */}
                  <path d="M22 36C22 41 26 44 32 44H34" stroke="url(#supportGrad)" strokeWidth="2.5" strokeLinecap="round"/>
                  <circle cx="35" cy="44" r="2.5" fill="#FEF08A"/>
                  {/* Pastille en direct vert vif */}
                  <circle cx="47" cy="19" r="4.5" fill="#10B981" stroke="#09090B" strokeWidth="2"/>
                </svg>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ fontSize: '12.5px', color: '#ffffff', fontWeight: 800, display: 'block', letterSpacing: '-0.2px' }}>
                  Suivi Client Personnalisé
                </strong>
                <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', marginTop: '2px', display: 'block', lineHeight: '1.3' }}>
                  Assistance dédiée sur WhatsApp 7j/7.
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Calculate real average
  const avgRating = (approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length).toFixed(1);

  return (
    <section className="trustpilot-section" style={{ padding: '60px 0', background: '#ffffff', borderTop: '1px solid #f0f0f0' }}>
      <div className="container">
        
        <div className="slider-wrapper" style={{ position: 'relative' }}>
          <button className="slider-arrow arrow-left" onClick={scrollLeft} aria-label="Scroll left" style={{ top: '50%', transform: 'translateY(-50%)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          
          <div 
            className="slider-container" 
            ref={scrollContainerRef}
            onMouseDown={handleMouseDown}
            onMouseLeave={handleMouseLeave}
            onMouseUp={handleMouseUp}
            onMouseMove={handleMouseMove}
            style={{ 
              display: 'flex', 
              gap: '20px', 
              overflowX: 'auto', 
              scrollBehavior: 'smooth',
              padding: '20px 0',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none'
            }}
          >
            {approvedReviews.map((review) => (
              <div 
                key={review.id} 
                className="review-card"
                style={{
                  minWidth: '280px',
                  width: '280px',
                  background: '#f8f9fa',
                  padding: '24px',
                  borderRadius: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[...Array(review.rating)].map((_, i) => (
                    <span 
                      key={i} 
                      style={{ 
                        color: '#f59e0b', 
                        fontSize: '14px',
                        fontWeight: 'bold'
                      }}
                    >
                      ★
                    </span>
                  ))}
                  <span style={{ fontSize: '11px', color: '#10b981', marginLeft: '6px', fontWeight: 700 }}>
                    ✔ Achat vérifié
                  </span>
                </div>
                
                <h4 style={{ fontSize: '14.5px', fontWeight: 800, color: '#09090b', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {review.title}
                </h4>
                <p style={{ fontSize: '12.5px', lineHeight: '1.6', color: '#475569', height: '60px', overflow: 'hidden', margin: 0 }}>
                  {review.comment}
                </p>
                <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '4px' }}>
                  <span style={{ fontWeight: 700, color: '#09090b' }}>{review.customerName}</span>, {review.date}
                </div>
              </div>
            ))}
          </div>
          
          <button className="slider-arrow arrow-right" onClick={scrollRight} aria-label="Scroll right" style={{ top: '50%', transform: 'translateY(-50%)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>

        {/* Real Summary Footer */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '28px', gap: '6px' }}>
          <p style={{ fontSize: '13.5px', color: '#09090b', margin: 0, fontWeight: 600, textAlign: 'center' }}>
            Note moyenne de <strong style={{ fontWeight: 900 }}>{avgRating} / 5</strong> basée sur <strong style={{ fontWeight: 900 }}>{approvedReviews.length} avis clients réels</strong>.
          </p>
        </div>

      </div>
    </section>
  );
}

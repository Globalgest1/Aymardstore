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

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', maxWidth: '980px', margin: '0 auto' }}>
            <div style={{ padding: '18px 20px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>🛡️</div>
              <strong style={{ fontSize: '13.5px', color: '#ffffff', display: 'block' }}>100% Neuf &amp; Authentique</strong>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px', display: 'block' }}>Boîte d&apos;origine &amp; accessoires inclus.</span>
            </div>

            <div style={{ padding: '18px 20px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>⚡</div>
              <strong style={{ fontSize: '13.5px', color: '#ffffff', display: 'block' }}>Expédition Express 24/48h</strong>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px', display: 'block' }}>Livraison sécurisée avec coursier ou transporteur.</span>
            </div>

            <div style={{ padding: '18px 20px', borderRadius: '16px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', textAlign: 'left' }}>
              <div style={{ fontSize: '20px', marginBottom: '8px' }}>💬</div>
              <strong style={{ fontSize: '13.5px', color: '#ffffff', display: 'block' }}>Suivi Client Personnalisé</strong>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', marginTop: '4px', display: 'block' }}>Assistance dédiée sur WhatsApp 7j/7.</span>
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

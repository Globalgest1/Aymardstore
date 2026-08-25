'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore } from '@/lib/store';

const initialHeroSlides = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1600&auto=format&fit=crop',
    leftText: 'HEADWEAR & CASQUETTES',
    promoTitle: "AYMARD STORE",
    promoSubtitle: 'FITTED, SNAPBACK & ÉDITIONS LIMITÉES',
    accentColor: '#f59e0b',
    link: '/products?category=hats'
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1600&auto=format&fit=crop',
    leftText: 'SNEAKERS CULTURE',
    promoTitle: 'SÉLECTION PREMIUM',
    promoSubtitle: '100% NEUF & AUTHENTIQUE',
    accentColor: '#0284c7',
    link: '/products?category=shoes'
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=1600&auto=format&fit=crop',
    leftText: 'HORLOGERIE D\'EXCEPTION',
    promoTitle: 'MONTRES & CHRONOS',
    promoSubtitle: 'ÉLÉGANCE & PRÉCISION',
    accentColor: '#10b981',
    link: '/products?category=watches'
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop',
    leftText: 'BOUTIQUE OFFICIELLE',
    promoTitle: 'EXPÉDIÉ EN 24/48H',
    promoSubtitle: 'COMMANDEZ DIRECTEMENT SUR WHATSAPP',
    accentColor: '#38bdf8',
    link: '/products'
  }
];

export default function HeroCarousel() {
  const store = useAppStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const rawSlides = (mounted && store.heroSlides && store.heroSlides.length > 0) ? store.heroSlides : initialHeroSlides;

  // Guarantee full fallbacks for text, colors, images and titles across ALL slides
  const slides = rawSlides.map((s, idx) => {
    const fallback = initialHeroSlides[idx] || initialHeroSlides[0];
    return {
      ...fallback,
      ...s,
      image: s.image || fallback.image,
      leftText: s.leftText || fallback.leftText,
      promoTitle: s.promoTitle || fallback.promoTitle,
      promoSubtitle: s.promoSubtitle || fallback.promoSubtitle,
      accentColor: s.accentColor || fallback.accentColor,
      link: s.link || fallback.link
    };
  });

  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [slides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  return (
    <section className="streetwear-hero" style={{ background: 'none', position: 'relative' }}>
      {slides.map((slide, index) => {
        const isActive = index === currentSlide;
        return (
          <div 
            key={slide.id}
            className={`hero-slide ${isActive ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Image 
              src={slide.image} 
              alt={typeof slide.leftText === 'string' ? slide.leftText : 'Hero slide'} 
              fill 
              priority={index === 0}
              sizes="100vw"
              style={{ objectFit: 'cover' }}
            />
            <div className="streetwear-hero-overlay" />
            <div className="streetwear-hero-container" style={{ zIndex: 3 }}>
              
              {/* Left Side text */}
              <h1 className="hero-left-text" style={{ 
                color: '#ffffff',
                textShadow: `0 0 20px ${slide.accentColor}66`
              }}>
                {typeof slide.leftText === 'string'
                  ? slide.leftText.split(/[\n\s]+/).map((word, idx, arr) => (
                      <React.Fragment key={idx}>
                        {word}
                        {idx < arr.length - 1 && <br />}
                      </React.Fragment>
                    ))
                  : slide.leftText}
              </h1>

              {/* Right Side promo */}
              <div className="hero-right-text">
                <div className="hero-promo-title" style={{ 
                  color: slide.accentColor,
                  textShadow: `0 0 30px ${slide.accentColor}80`
                }}>
                  {typeof slide.promoTitle === 'string'
                    ? slide.promoTitle.split(/[\n\s]+/).map((word, idx, arr) => (
                        <React.Fragment key={idx}>
                          {word.includes('-') || word.includes('%') ? <span style={{ color: '#ffffff' }}>{word}</span> : word}
                          {idx < arr.length - 1 && <br />}
                        </React.Fragment>
                      ))
                    : slide.promoTitle}
                </div>
                <div className="hero-promo-subtitle" style={{ color: slide.accentColor, fontWeight: 800 }}>
                  {slide.promoSubtitle}
                </div>
              </div>

              {/* Bottom Center Button */}
              <Link href={slide?.link || '/products'} className="hero-discover-btn">
                Découvrir
              </Link>

              {/* Bottom Left Logo Badge */}
              <div style={{ position: 'absolute', bottom: '24px', left: '24px', width: '28px', height: '28px', borderRadius: '50%', background: '#000000', border: '1px solid rgba(255,255,255,0.2)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 800, zIndex: 10 }}>
                N&apos;
              </div>
            </div>
          </div>
        );
      })}

      {/* Manual Arrows */}
      <button className="hero-arrow arrow-left" onClick={prevSlide} aria-label="Slide précédent" style={{ left: '24px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
      </button>
      <button className="hero-arrow arrow-right" onClick={nextSlide} aria-label="Slide suivant" style={{ right: '24px' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
      </button>

      {/* Dots navigation */}
      <div 
        className="hero-dots"
        style={{
          position: 'absolute',
          bottom: '24px',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          gap: '8px',
          zIndex: 10
        }}
      >
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: index === currentSlide ? '#ffffff' : 'rgba(255, 255, 255, 0.4)',
              border: 'none',
              cursor: 'pointer',
              transition: 'background 0.3s ease'
            }}
          />
        ))}
      </div>
    </section>
  );
}

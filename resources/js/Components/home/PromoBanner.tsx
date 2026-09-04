'use client';

import React, { useState, useEffect } from 'react';
import Link from '@/lib/compat-link';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

export default function PromoBanner() {
  const { language } = useAppStore();
  const { t } = useTranslation(language);

  // Set initial countdown to 24 hours in seconds (86400 seconds)
  const [timeLeft, setTimeLeft] = useState(86400);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => (prev > 0 ? prev - 1 : 86400));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return {
      hours: h.toString().padStart(2, '0'),
      minutes: m.toString().padStart(2, '0'),
      seconds: s.toString().padStart(2, '0')
    };
  };

  const time = formatTime(timeLeft);

  return (
    <section className="promo-banner">
      <div className="container promo-banner-container">
        <div className="promo-banner-content">
          <h2 className="promo-banner-title">Offres Flash de la Semaine</h2>
          <p className="promo-banner-subtitle">Jusqu'à -50% sur une sélection exclusive de bijoux & accessoires</p>
          
          <div className="countdown-container">
            <div className="countdown-box">
              <span className="countdown-num">{time.hours}</span>
              <span className="countdown-label">{language === 'en' ? 'Hrs' : language === 'es' ? 'Hrs' : 'Heures'}</span>
            </div>
            <div className="countdown-box">
              <span className="countdown-num">{time.minutes}</span>
              <span className="countdown-label">Min</span>
            </div>
            <div className="countdown-box">
              <span className="countdown-num">{time.seconds}</span>
              <span className="countdown-label">Sec</span>
            </div>
          </div>
        </div>

        <div>
          <Link href="/products?filter=deals" className="btn btn-accent btn-lg" style={{ display: 'inline-flex', padding: '16px 36px', fontSize: '16px', fontWeight: 700 }}>
            {t('common.viewAll')} →
          </Link>
        </div>
      </div>
    </section>
  );
}

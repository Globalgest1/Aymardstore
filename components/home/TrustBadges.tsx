'use client';

import React from 'react';
import { useAppStore } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

export default function TrustBadges() {
  const { language } = useAppStore();
  const { t } = useTranslation(language);

  const badges = [
    { icon: '🔒', titleKey: 'home.trustSecure', descKey: 'home.trustSecure' },
    { icon: '🚚', titleKey: 'home.trustDelivery', descKey: 'home.trustDelivery' },
    { icon: '⚠️', titleKey: 'home.trustReturn', descKey: 'home.trustReturn' },
    { icon: '⭐', titleKey: 'home.trustGuarantee', descKey: 'home.trustGuarantee' },
  ];

  const getDesc = (key: string) => {
    if (key === 'home.trustSecure') return language === 'fr' ? 'Transactions 100% sécurisées' : language === 'es' ? 'Transacciones 100% seguras' : '100% secure transactions';
    if (key === 'home.trustDelivery') return language === 'fr' ? 'Expédition sous 24-48h' : language === 'es' ? 'Envío en 24-48h' : 'Shipping within 24-48h';
    if (key === 'home.trustReturn') return language === 'fr' ? 'Retours non acceptés (bien choisir pointure)' : language === 'es' ? 'Sin devoluciones (elegir bien talla)' : 'No returns (choose size carefully)';
    return language === 'fr' ? 'Service client 7j/7' : language === 'es' ? 'Soporte al cliente 24/7' : 'Customer support 24/7';
  };

  return (
    <section className="section" style={{ backgroundColor: 'var(--color-white)' }}>
      <div className="container">
        <div className="trust-grid">
          {badges.map((b, i) => (
            <div key={i} className="trust-badge">
              <span className="trust-icon">{b.icon}</span>
              <h3 className="trust-title">{t(b.titleKey)}</h3>
              <p className="trust-desc">{getDesc(b.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

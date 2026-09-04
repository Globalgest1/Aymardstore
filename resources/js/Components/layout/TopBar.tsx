'use client';

import React, { useEffect } from 'react';
import { usePathname } from '@/lib/compat-navigation';
import { useAppStore, convertPrice, formatPrice, getActiveLocation, formatAmount } from '@/lib/store';

export default function TopBar() {
  const pathname = usePathname();
  const { announcements, freeShippingThreshold, currency, detectedLocationId, trackReferralClick } = useAppStore();
  
  // Capture incoming referral link parameters (?ref=... or ?r=...)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const refParam = urlParams.get('ref') || urlParams.get('r');
      if (refParam) {
        const cleanRef = refParam.trim().toUpperCase();
        localStorage.setItem('aymard_referrer_code', cleanRef);
        trackReferralClick(cleanRef);
      }
    }
  }, [pathname, trackReferralClick]);

  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  const activeLoc = getActiveLocation(detectedLocationId);

  // Format the threshold value in real-time according to detected location
  const convertedThreshold = activeLoc.currency === 'FCFA' 
    ? Math.round(freeShippingThreshold * (activeLoc.exchangeRate || 655.957))
    : freeShippingThreshold;
  const thresholdText = formatAmount(convertedThreshold, activeLoc);

  const parsedAnnouncements = announcements.map(rawText => {
    let text = rawText;
    if (text.includes('14 jours') || text.includes("changer d'avis") || text.includes('Retours offerts')) {
      text = "⚠️ RETOURS NON ACCEPTÉS : Merci de bien vérifier votre pointure et votre article avant validation";
    }
    return text.replace('{threshold}', thresholdText).replace('{currency}', '');
  });

  // Ensure the no-return notice is always prominently included in the scrolling marquee
  const hasNoReturnNotice = parsedAnnouncements.some(t => t.includes('RETOURS NON ACCEPTÉS') || t.includes('Retours non acceptés'));
  const finalAnnouncements = hasNoReturnNotice 
    ? parsedAnnouncements 
    : [...parsedAnnouncements, "⚠️ RETOURS NON ACCEPTÉS : Merci de bien vérifier votre pointure et votre article avant validation"];

  // Repeat items to fill space and guarantee seamless loop
  const items = [...finalAnnouncements, ...finalAnnouncements, ...finalAnnouncements, ...finalAnnouncements];

  return (
    <div className="top-bar">
      <div className="top-bar-marquee">
        <div className="top-bar-marquee-content">
          {items.map((text, i) => (
            <div key={i} className="top-bar-marquee-item">
              <span style={{ color: text.includes('RETOURS NON ACCEPTÉS') ? '#fef08a' : undefined, fontWeight: text.includes('RETOURS NON ACCEPTÉS') ? 800 : undefined }}>
                {text}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

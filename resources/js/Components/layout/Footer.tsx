'use client';

import React, { useState } from 'react';
import Link from '@/lib/compat-link';
import { usePathname } from '@/lib/compat-navigation';
import { useAppStore } from '@/lib/store';

export default function Footer() {
  const pathname = usePathname();
  const store = useAppStore();
  const brandSettings = store.brandSettings;
  const [email, setEmail] = useState('');
  const [whatsappPhone, setWhatsappPhone] = useState('');
  const [wantWhatsapp, setWantWhatsapp] = useState(true);
  const [wantEmail, setWantEmail] = useState(true);
  const [subFeedback, setSubFeedback] = useState<string | null>(null);

  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  const isAccountPage = Boolean(pathname && pathname.startsWith('/account'));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const channels: ('EMAIL' | 'WHATSAPP')[] = [];
    if (wantWhatsapp && whatsappPhone.trim()) channels.push('WHATSAPP');
    if (wantEmail && email.trim()) channels.push('EMAIL');

    if (channels.length === 0) {
      if (email.trim()) channels.push('EMAIL');
      else if (whatsappPhone.trim()) channels.push('WHATSAPP');
      else {
        setSubFeedback('Veuillez renseigner un email ou un numéro WhatsApp valide.');
        setTimeout(() => setSubFeedback(null), 4000);
        return;
      }
    }

    const res = store.subscribeToMarketing({
      email: email.trim() || undefined,
      phone: whatsappPhone.trim() || undefined,
      channels,
      source: 'FOOTER'
    });

    setSubFeedback(res.message || '✓ Inscription confirmée ! Bienvenue au Club VIP Aymard Store.');
    setEmail('');
    setWhatsappPhone('');
    setTimeout(() => setSubFeedback(null), 5000);
  };

  const paymentMethods = [
    { label: 'MTN MoMo', bg: '#FFCC00', text: '#000' },
    { label: 'Moov Money', bg: '#005DAA', text: '#fff' },
    { label: 'Celtiis Cash', bg: '#008751', text: '#fff' },
    { label: 'Orange Money', bg: '#FF7900', text: '#fff' },
    { label: 'Wave', bg: '#1DC4FA', text: '#000' },
    { label: 'VISA', bg: '#1A1F71', text: '#fff' },
    { label: 'Mastercard', bg: '#EB001B', text: '#fff' },
    { label: 'LeekPay', bg: '#10B981', text: '#fff' },
  ];

  return (
    <footer style={{ backgroundColor: '#09090b', color: '#ffffff', borderTop: '1px solid rgba(255, 255, 255, 0.08)', position: 'relative', width: '100%', maxWidth: '100%', overflow: 'hidden', boxSizing: 'border-box' }}>
      
      {!isAccountPage && (
        <div style={{ padding: '48px 0 36px 0', width: '100%', boxSizing: 'border-box' }}>
          <div className="container" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 20px', boxSizing: 'border-box' }}>
            
            {/* Main Footer Layout */}
            <div className="footer-main-grid">
              
              {/* Brand & Social Column */}
              <div className="footer-brand-col">
                <Link href="/" style={{ textDecoration: 'none', color: '#ffffff', display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                  {brandSettings?.logoUrl ? (
                    <img 
                      src={brandSettings.logoUrl} 
                      alt={brandSettings?.storeName || 'AYMARD STORE'} 
                      style={{ height: '30px', width: 'auto', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} 
                    />
                  ) : null}
                  <span style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '2px' }}>{brandSettings?.storeName || 'AYMARD'}</span>
                  <span style={{ fontSize: '22px', fontWeight: 900, color: '#38bdf8', letterSpacing: '2px' }}>{brandSettings?.storeSubtitle || 'STORE'}</span>
                </Link>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, marginBottom: '18px', maxWidth: '360px' }}>
                  {brandSettings?.tagline || "Destination mode de référence. Sélection exclusive de sneakers authentifiées, streetwear de créateurs & pièces d'exception."}
                </p>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <a 
                    href="https://www.instagram.com/aymar_store3" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label="Instagram @aymar_store3" 
                    style={{ 
                      height: '34px', 
                      padding: '0 14px', 
                      borderRadius: '20px', 
                      background: 'rgba(255,255,255,0.08)', 
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#ffffff', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      textDecoration: 'none', 
                      fontSize: '12px', 
                      fontWeight: 700 
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                    <span>@aymar_store3</span>
                  </a>
                  <a 
                    href="https://wa.me/2290197362906" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label="WhatsApp Aymard Store" 
                    style={{ 
                      height: '34px', 
                      padding: '0 14px', 
                      borderRadius: '20px', 
                      background: 'rgba(37, 211, 102, 0.12)', 
                      border: '1px solid rgba(37, 211, 102, 0.3)',
                      color: '#25d366', 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '8px', 
                      textDecoration: 'none', 
                      fontSize: '12px', 
                      fontWeight: 700 
                    }}
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.63a11.94 11.94 0 0 0 5.84 1.51h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.22-3.48-8.49zm-8.46 18.49h-.01a9.9 9.9 0 0 1-5.05-1.39l-.36-.21-3.75.98 1-3.65-.23-.38a9.92 9.92 0 0 1-1.52-5.25c0-5.48 4.46-9.94 9.95-9.94 2.65 0 5.15 1.03 7.03 2.91a9.88 9.88 0 0 1 2.91 7.03c0 5.49-4.47 9.94-9.98 9.94z"/>
                    </svg>
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>

              {/* Navigation Links Grid (2 columns on mobile) */}
              <div className="footer-links-grid">
                {/* Column: Collections */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#ffffff', marginBottom: '14px' }}>
                    Rayons
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    <li><Link href="/products?category=shoes" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>Sneakers & Kicks</Link></li>
                    <li><Link href="/products?category=clothing" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>Streetwear</Link></li>
                    <li><Link href="/products?category=bags" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>Sacs de Luxe</Link></li>
                    <li><Link href="/products?category=jewelry" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>Montres & Bijoux</Link></li>
                    <li><Link href="/products?filter=new" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>Nouveaux Drops</Link></li>
                    <li><Link href="/blog" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>Le Journal (Blog)</Link></li>
                  </ul>
                </div>

                {/* Column: Service & Contact */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#ffffff', marginBottom: '14px' }}>
                    Espace Client
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    <li><Link href="/account" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>Mon Compte VIP</Link></li>
                    <li><Link href="/account?tab=orders" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>Mes Commandes</Link></li>
                    <li><Link href="/cart" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>Mon Panier</Link></li>
                    <li><a href="mailto:judesinaberogui@gmail.com" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>Contact Email</a></li>
                  </ul>
                </div>

                {/* Column: Cadre Légal & Conformité Bénin */}
                <div>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#ffffff', marginBottom: '14px' }}>
                    Cadre Légal (Bénin)
                  </h4>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '9px' }}>
                    <li><Link href="/legal/privacy" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>Données &amp; APDP</Link></li>
                    <li><Link href="/legal/employment" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>Emploi &amp; Éthique RSE</Link></li>
                    <li><Link href="/legal/terms" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>Conditions Générales (CGV)</Link></li>
                    <li><Link href="/legal/mentions" style={{ color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontSize: '13px' }}>Mentions Légales &amp; OAPI</Link></li>
                  </ul>
                </div>
              </div>

              {/* Newsletter & Drops VIP Club Column */}
              <div className="footer-newsletter-col">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" style={{ color: '#38bdf8', flexShrink: 0 }}>
                    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                  </svg>
                  <h4 style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.2px', color: '#ffffff', margin: 0 }}>
                    Alertes Drops &amp; Nouveautés
                  </h4>
                </div>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', lineHeight: 1.45, marginBottom: '12px' }}>
                  Soyez le 1er averti par <strong>WhatsApp</strong> et/ou <strong>Email</strong> à chaque nouvel arrivage exclusif.
                </p>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxWidth: '100%', boxSizing: 'border-box' }}>
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <input 
                      type="email" 
                      placeholder="Votre email" 
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      style={{
                        flex: '1 1 140px',
                        minWidth: 0,
                        padding: '9px 12px',
                        borderRadius: '14px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        background: 'rgba(255,255,255,0.06)',
                        color: '#ffffff',
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                    <input 
                      type="tel" 
                      placeholder="WhatsApp (ex: +229 97...)" 
                      value={whatsappPhone}
                      onChange={e => setWhatsappPhone(e.target.value)}
                      style={{
                        flex: '1 1 140px',
                        minWidth: 0,
                        padding: '9px 12px',
                        borderRadius: '14px',
                        border: '1px solid rgba(37, 211, 102, 0.4)',
                        background: 'rgba(37, 211, 102, 0.06)',
                        color: '#ffffff',
                        fontSize: '12px',
                        outline: 'none',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.65)' }}>
                    <div style={{ display: 'flex', gap: '14px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                        <input 
                          type="checkbox" 
                          checked={wantWhatsapp} 
                          onChange={e => setWantWhatsapp(e.target.checked)} 
                          style={{ accentColor: '#25d366', cursor: 'pointer' }}
                        />
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: wantWhatsapp ? '#25d366' : 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M20.52 3.48A11.93 11.93 0 0 0 12.06 0C5.46 0 .09 5.37.09 11.97c0 2.11.55 4.16 1.6 5.97L0 24l6.22-1.63a11.94 11.94 0 0 0 5.84 1.51h.01c6.6 0 11.97-5.37 11.97-11.97 0-3.2-1.25-6.22-3.48-8.49zm-8.46 18.49h-.01a9.9 9.9 0 0 1-5.05-1.39l-.36-.21-3.75.98 1-3.65-.23-.38a9.92 9.92 0 0 1-1.52-5.25c0-5.48 4.46-9.94 9.95-9.94 2.65 0 5.15 1.03 7.03 2.91a9.88 9.88 0 0 1 2.91 7.03c0 5.49-4.47 9.94-9.98 9.94z"/>
                          </svg>
                          WhatsApp
                        </span>
                      </label>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', userSelect: 'none' }}>
                        <input 
                          type="checkbox" 
                          checked={wantEmail} 
                          onChange={e => setWantEmail(e.target.checked)} 
                          style={{ accentColor: '#38bdf8', cursor: 'pointer' }}
                        />
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: wantEmail ? '#38bdf8' : 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                            <polyline points="22,6 12,13 2,6"/>
                          </svg>
                          Email
                        </span>
                      </label>
                    </div>

                    <button 
                      type="submit"
                      style={{
                        padding: '8px 16px',
                        borderRadius: '14px',
                        border: 'none',
                        background: '#ffffff',
                        color: '#09090b',
                        fontWeight: 800,
                        fontSize: '12px',
                        cursor: 'pointer',
                        flexShrink: 0
                      }}
                    >
                      M&apos;alerter
                    </button>
                  </div>
                </form>

                {subFeedback && (
                  <div style={{ marginTop: '10px', fontSize: '11.5px', color: '#10b981', fontWeight: 700, lineHeight: 1.4 }}>
                    {subFeedback}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Bottom Legal & Payment Badges */}
      <div style={{ borderTop: isAccountPage ? 'none' : '1px solid rgba(255, 255, 255, 0.08)', padding: '20px 0', background: '#09090b', width: '100%', boxSizing: 'border-box' }}>
        <div className="container" style={{ width: '100%', maxWidth: '1440px', margin: '0 auto', padding: '0 20px', boxSizing: 'border-box' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span>© {new Date().getFullYear()} {brandSettings?.storeName || 'AYMARD'} {brandSettings?.storeSubtitle || 'STORE'}. Tous droits réservés.</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', color: '#34d399', fontSize: '10.5px', fontWeight: 700 }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', display: 'inline-block' }}></span> République du Bénin • APDP &amp; Code du Travail
                </span>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap', fontSize: '11px', color: 'rgba(255,255,255,0.5)' }}>
                <Link href="/legal/privacy" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Confidentialité APDP</Link>
                <span>•</span>
                <Link href="/legal/employment" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Politique d&apos;Emploi &amp; RSE</Link>
                <span>•</span>
                <Link href="/legal/terms" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Conditions Générales (CGV)</Link>
                <span>•</span>
                <Link href="/legal/mentions" style={{ color: 'rgba(255,255,255,0.65)', textDecoration: 'none' }}>Mentions Légales &amp; OAPI</Link>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
              {paymentMethods.map((pm, i) => (
                <span 
                  key={i}
                  style={{
                    padding: '3px 8px',
                    borderRadius: '5px',
                    background: pm.bg,
                    color: pm.text,
                    fontSize: '9.5px',
                    fontWeight: 800,
                    letterSpacing: '0.3px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                  }}
                >
                  {pm.label}
                </span>
              ))}
            </div>

          </div>
        </div>
      </div>

    </footer>
  );
}


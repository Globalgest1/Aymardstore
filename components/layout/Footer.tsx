'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/lib/store';

export default function Footer() {
  const pathname = usePathname();
  const store = useAppStore();
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
        setSubFeedback('⚠️ Veuillez renseigner un email ou un numéro WhatsApp.');
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
                <Link href="/" style={{ textDecoration: 'none', color: '#ffffff', display: 'inline-block', marginBottom: '12px' }}>
                  <span style={{ fontSize: '22px', fontWeight: 900, letterSpacing: '2px' }}>AYMARD</span>
                  <span style={{ fontSize: '22px', fontWeight: 900, color: '#38bdf8', letterSpacing: '2px' }}>STORE</span>
                </Link>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.65)', lineHeight: 1.55, marginBottom: '18px', maxWidth: '360px' }}>
                  Destination mode de référence. Sélection exclusive de sneakers authentifiées, streetwear de créateurs & pièces d&apos;exception.
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
                    <span>💬 WhatsApp</span>
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
                    <li><Link href="/blog" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '13px', fontWeight: 700 }}>📰 Le Journal (Blog)</Link></li>
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
                    <li><a href="mailto:judesinaberogui@gmail.com" style={{ color: '#38bdf8', textDecoration: 'none', fontSize: '12px', fontWeight: 600 }}>✉ Contact Email</a></li>
                  </ul>
                </div>
              </div>

              {/* Newsletter & Drops VIP Club Column */}
              <div className="footer-newsletter-col">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '16px' }}>⚡</span>
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
                    <div style={{ display: 'flex', gap: '12px' }}>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={wantWhatsapp} 
                          onChange={e => setWantWhatsapp(e.target.checked)} 
                          style={{ accentColor: '#25d366' }}
                        />
                        <span>💬 WhatsApp</span>
                      </label>
                      <label style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}>
                        <input 
                          type="checkbox" 
                          checked={wantEmail} 
                          onChange={e => setWantEmail(e.target.checked)} 
                          style={{ accentColor: '#38bdf8' }}
                        />
                        <span>📧 Email</span>
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
            
            <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
              © {new Date().getFullYear()} AYMARD STORE. Tous droits réservés.
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


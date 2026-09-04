import React from 'react';
import Link from '@/lib/compat-link';
import { usePathname } from '@/lib/compat-navigation';
import { useThemeMode } from '@/lib/useThemeMode';
import AppLayout from '@/Layouts/AppLayout';

interface LegalLayoutProps {
  title: string;
  subtitle: string;
  badge: string;
  updatedAt: string;
  children: React.ReactNode;
}

const LEGAL_TABS = [
  {
    href: '/legal/privacy',
    label: 'Données Personnelles & APDP',
    shortLabel: 'Confidentialité',
    icon: '🛡️',
  },
  {
    href: '/legal/employment',
    label: 'Emploi, Recrutement & RSE',
    shortLabel: 'Emploi & Éthique',
    icon: '⚖️',
  },
  {
    href: '/legal/terms',
    label: 'Conditions Générales (CGV/CGU)',
    shortLabel: 'CGV / Vente',
    icon: '📜',
  },
  {
    href: '/legal/mentions',
    label: 'Mentions Légales & OAPI',
    shortLabel: 'Mentions Légales',
    icon: '🏛️',
  },
];

export default function LegalLayout({
  title,
  subtitle,
  badge,
  updatedAt,
  children,
}: LegalLayoutProps) {
  const isDarkMode = useThemeMode();
  const pathname = usePathname() || '';

  return (
    <AppLayout>
      <div
        style={{
          minHeight: '100vh',
          backgroundColor: isDarkMode ? '#09090b' : '#f8fafc',
          color: isDarkMode ? '#f4f4f5' : '#0f172a',
          transition: 'background-color 0.2s ease, color 0.2s ease',
          paddingBottom: '80px',
        }}
      >
        {/* 1. Header Banner */}
        <section
          style={{
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
            background: isDarkMode
              ? 'linear-gradient(180deg, #121215 0%, #09090b 100%)'
              : 'linear-gradient(180deg, #ffffff 0%, #f1f5f9 100%)',
            padding: '48px 20px 36px 20px',
          }}
        >
          <div style={{ maxWidth: '1080px', margin: '0 auto' }}>
            {/* Breadcrumb */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontSize: '12px',
                color: isDarkMode ? '#a1a1aa' : '#64748b',
                marginBottom: '16px',
                flexWrap: 'wrap',
              }}
            >
              <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
                Accueil
              </Link>
              <span>/</span>
              <span>Cadre Juridique Bénin</span>
              <span>/</span>
              <span style={{ color: isDarkMode ? '#38bdf8' : '#0284c7', fontWeight: 600 }}>
                {title}
              </span>
            </div>

            {/* Badge & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <span
                style={{
                  display: 'inline-block',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px',
                  background: isDarkMode ? 'rgba(56,189,248,0.12)' : 'rgba(2,132,199,0.1)',
                  color: isDarkMode ? '#38bdf8' : '#0284c7',
                  border: `1px solid ${isDarkMode ? 'rgba(56,189,248,0.25)' : 'rgba(2,132,199,0.2)'}`,
                }}
              >
                {badge}
              </span>
              <span style={{ fontSize: '12px', color: isDarkMode ? '#71717a' : '#94a3b8' }}>
                Dernière révision : {updatedAt}
              </span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(26px, 4vw, 36px)',
                fontWeight: 900,
                letterSpacing: '-0.5px',
                margin: '0 0 12px 0',
                color: isDarkMode ? '#ffffff' : '#0f172a',
                lineHeight: 1.2,
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: '14.5px',
                lineHeight: 1.6,
                color: isDarkMode ? '#a1a1aa' : '#475569',
                margin: '0 0 28px 0',
                maxWidth: '780px',
              }}
            >
              {subtitle}
            </p>

            {/* Jurisdictional Assurance Pill */}
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 16px',
                borderRadius: '12px',
                background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)',
                border: `1px solid ${isDarkMode ? 'rgba(16,185,129,0.25)' : 'rgba(16,185,129,0.2)'}`,
                color: isDarkMode ? '#34d399' : '#059669',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <span>🇧🇯</span>
              <span>Conforme aux Lois de la République du Bénin &amp; aux Actes Uniformes de l&apos;OHADA</span>
            </div>
          </div>
        </section>

        {/* 2. Navigation Tabs */}
        <section
          style={{
            position: 'sticky',
            top: 'var(--header-total-height, 64px)',
            zIndex: 30,
            background: isDarkMode ? 'rgba(9,9,11,0.92)' : 'rgba(255,255,255,0.92)',
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
            padding: '10px 20px',
          }}
        >
          <div
            style={{
              maxWidth: '1080px',
              margin: '0 auto',
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              paddingBottom: '2px',
            }}
          >
            {LEGAL_TABS.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '24px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    background: isActive
                      ? isDarkMode
                        ? '#ffffff'
                        : '#0f172a'
                      : isDarkMode
                      ? 'rgba(255,255,255,0.06)'
                      : '#f1f5f9',
                    color: isActive
                      ? isDarkMode
                        ? '#09090b'
                        : '#ffffff'
                      : isDarkMode
                      ? '#d4d4d8'
                      : '#475569',
                    border: `1px solid ${
                      isActive
                        ? isDarkMode
                          ? '#ffffff'
                          : '#0f172a'
                        : isDarkMode
                        ? 'rgba(255,255,255,0.1)'
                        : '#e2e8f0'
                    }`,
                  }}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </Link>
              );
            })}
          </div>
        </section>

        {/* 3. Main Document Body */}
        <main style={{ maxWidth: '1080px', margin: '0 auto', padding: '36px 20px 0 20px' }}>
          <div
            style={{
              background: isDarkMode ? '#121215' : '#ffffff',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              borderRadius: '24px',
              padding: 'clamp(24px, 4vw, 44px)',
              boxShadow: isDarkMode
                ? '0 20px 40px rgba(0,0,0,0.4)'
                : '0 10px 30px rgba(15,23,42,0.04)',
            }}
          >
            {children}
          </div>

          {/* Concierge Legal Support Contact */}
          <div
            style={{
              marginTop: '28px',
              padding: '24px',
              borderRadius: '20px',
              background: isDarkMode ? '#18181b' : '#f8fafc',
              border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '16px',
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', marginBottom: '4px' }}>
                Besoin d&apos;un éclaircissement juridique ou d&apos;exercer vos droits ?
              </div>
              <div style={{ fontSize: '12.5px', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
                Notre service conformité &amp; conciergerie est à votre écoute à Cotonou du lundi au samedi.
              </div>
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <a
                href="https://wa.me/2290197362906"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '16px',
                  background: 'rgba(37,211,102,0.15)',
                  border: '1px solid rgba(37,211,102,0.3)',
                  color: '#25d366',
                  textDecoration: 'none',
                  fontSize: '12.5px',
                  fontWeight: 700,
                }}
              >
                <span>💬 Conciergerie WhatsApp</span>
              </a>
              <a
                href="mailto:judesinaberogui@gmail.com"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '9px 18px',
                  borderRadius: '16px',
                  background: isDarkMode ? '#ffffff' : '#0f172a',
                  color: isDarkMode ? '#09090b' : '#ffffff',
                  textDecoration: 'none',
                  fontSize: '12.5px',
                  fontWeight: 700,
                }}
              >
                <span>✉ Contact Direction</span>
              </a>
            </div>
          </div>
        </main>
      </div>
    </AppLayout>
  );
}

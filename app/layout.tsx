import type { Metadata } from 'next';
import { Plus_Jakarta_Sans, Outfit } from 'next/font/google';
import './globals.css';
import TopBar from '@/components/layout/TopBar';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import ProductsSync from '@/components/common/ProductsSync';
import GeoDetector from '@/components/common/GeoDetector';
import SupportChat from '@/components/support/SupportChat';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-plus-jakarta',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  variable: '--font-outfit',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#09090b',
};

export const metadata: Metadata = {
  title: 'Aymard Store | Mode, Accessoires & Plus',
  description: 'Aymard Store - Votre boutique en ligne pour la mode, les chaussures, sacs, bijoux, montres et accessoires. Livraison rapide partout dans le monde.',
  keywords: ['mode', 'chaussures', 'vêtements', 'bijoux', 'montres', 'sacs', 'accessoires', 'boutique en ligne'],
  openGraph: {
    title: 'Aymard Store | Mode, Accessoires & Plus',
    description: 'Votre boutique en ligne pour la mode et les accessoires.',
    url: 'https://aymard-store.com',
    siteName: 'Aymard Store',
    locale: 'fr_FR',
    type: 'website',
  },
};

import { Suspense } from 'react';
import PixelProvider from '@/components/analytics/PixelProvider';

import Script from 'next/script';
import QuickBuyModal from '@/components/checkout/QuickBuyModal';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" className={`${plusJakartaSans.variable} ${outfit.variable}`}>
      <head>
        <Script src="https://leekpay.fr/js/leekpay.js" strategy="lazyOnload" />
      </head>
      <body>
        <a href="#main-content" className="skip-to-content">Aller au contenu principal</a>
        <ProductsSync />
        <GeoDetector />
        <Suspense fallback={null}>
          <PixelProvider />
        </Suspense>
        <TopBar />
        <Header />
        <main id="main-content">{children}</main>
        <Footer />
        <SupportChat />
        <QuickBuyModal />
      </body>
    </html>
  );
}

import React, { Suspense } from 'react';
import TopBar from '@/Components/layout/TopBar';
import Header from '@/Components/layout/Header';
import Footer from '@/Components/layout/Footer';
import ProductsSync from '@/Components/common/ProductsSync';
import GeoDetector from '@/Components/common/GeoDetector';
import SupportChat from '@/Components/support/SupportChat';
import PixelProvider from '@/Components/analytics/PixelProvider';
import QuickBuyModal from '@/Components/checkout/QuickBuyModal';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col font-sans">
      <a href="#main-content" className="skip-to-content">
        Aller au contenu principal
      </a>
      <ProductsSync />
      <GeoDetector />
      <Suspense fallback={null}>
        <PixelProvider />
      </Suspense>
      <TopBar />
      <Header />
      <main id="main-content" className="flex-grow">
        {children}
      </main>
      <Footer />
      <SupportChat />
      <QuickBuyModal />
    </div>
  );
}

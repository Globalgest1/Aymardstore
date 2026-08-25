'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useAppStore, getActiveLocation } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';

// Mega Menu Data for all categories
const megaMenuData = {
  nike: {
    title: 'NIKE',
    links: [
      { label: 'Dunk Low', href: '/products?search=dunk+low' },
      { label: 'Nike SB', href: '/products?search=nike+sb' },
      { label: 'Nike Mind 001', href: '/products?search=mind' },
      { label: 'Nike x Travis Scott', href: '/products?search=travis' },
      { label: 'Nike x Sacai', href: '/products?search=sacai' },
      { label: 'Dunk High', href: '/products?search=dunk+high' },
      { label: 'Air Max Plus TN', href: '/products?search=tn' },
      { label: 'Air Force 1', href: '/products?search=air+force+1' },
      { label: 'Air Max 1', href: '/products?search=air+max+1' },
      { label: 'Voir Tout', href: '/products?category=shoes', isBold: true },
    ]
  },
  adidas: {
    title: 'ADIDAS',
    links: [
      { label: 'Adidas Campus 00S', href: '/products?search=campus' },
      { label: 'Adidas Samba', href: '/products?search=samba' },
      { label: 'Adidas Gazelle', href: '/products?search=gazelle' },
      { label: 'Adidas Spezial', href: '/products?search=spezial' },
      { label: 'Voir Tout', href: '/products?category=shoes', isBold: true },
    ]
  },
  ugg: {
    title: 'UGG',
    links: [
      { label: 'UGG Tazz', href: '/products?search=tazz' },
      { label: 'UGG Tasman', href: '/products?search=tasman' },
      { label: 'UGG Lowmel', href: '/products?search=lowmel' },
      { label: 'UGG Ultra Mini', href: '/products?search=ultra+mini' },
      { label: 'Voir Tout', href: '/products?category=shoes', isBold: true },
    ]
  },
  asics: {
    title: 'ASICS',
    links: [
      { label: 'Asics Gel-NYC', href: '/products?search=gel-nyc' },
      { label: 'Asics Gel-Kayano', href: '/products?search=gel-kayano' },
      { label: 'Asics Gel-1130', href: '/products?search=gel-1130' },
      { label: 'Voir Tout', href: '/products?category=shoes', isBold: true },
    ]
  },
  newBalance: {
    title: 'NEW BALANCE',
    links: [
      { label: 'New Balance 2002R', href: '/products?search=2002r' },
      { label: 'New Balance 9060', href: '/products?search=9060' },
      { label: 'New Balance 1906R', href: '/products?search=1906r' },
      { label: 'New Balance 550', href: '/products?search=550' },
      { label: 'Voir Tout', href: '/products?category=shoes', isBold: true },
    ]
  },
  jordan: {
    title: 'JORDAN',
    links: [
      { label: 'Jordan 1 Low', href: '/products?search=jordan+1+low' },
      { label: 'Jordan 1 Mid', href: '/products?search=jordan+1+mid' },
      { label: 'Jordan 1 High', href: '/products?search=jordan+1+high' },
      { label: 'Jordan 3', href: '/products?search=jordan+3' },
      { label: 'Jordan 4', href: '/products?search=jordan+4' },
      { label: 'Jordan 5', href: '/products?search=jordan+5' },
      { label: 'Jordan 6', href: '/products?search=jordan+6' },
      { label: 'Jordan 11', href: '/products?search=jordan+11' },
      { label: 'Jordan 14', href: '/products?search=jordan+14' },
      { label: 'Voir Tout', href: '/products?category=shoes', isBold: true },
    ]
  },
  yeezy: {
    title: 'YEEZY',
    links: [
      { label: 'Yeezy 350', href: '/products?search=yeezy+350' },
      { label: 'Yeezy 500', href: '/products?search=yeezy+500' },
      { label: 'Yeezy 700', href: '/products?search=yeezy+700' },
      { label: 'Yeezy Slide', href: '/products?search=yeezy+slide' },
      { label: 'Yeezy Foam', href: '/products?search=yeezy+foam' },
      { label: 'Voir Tout', href: '/products?category=shoes', isBold: true },
    ]
  }
};

const clothingMegaMenuData = {
  hauts: {
    title: 'HAUTS & HOODIES',
    links: [
      { label: 'T-shirts & Polos', href: '/products?search=t-shirt' },
      { label: 'Hoodies & Sweats', href: '/products?search=hoodie' },
      { label: 'Vestes & Blousons', href: '/products?search=blouson' },
      { label: 'Pulls Premium', href: '/products?search=pull' },
      { label: 'Voir Tout', href: '/products?category=clothing', isBold: true }
    ]
  },
  bas: {
    title: 'BAS & SHORTS',
    links: [
      { label: 'Pantalons Chinos', href: '/products?search=chino' },
      { label: 'Jeans Denim', href: '/products?search=jean' },
      { label: 'Cargos Streetwear', href: '/products?search=cargo' },
      { label: 'Shorts & Joggings', href: '/products?category=clothing' },
      { label: 'Voir Tout', href: '/products?category=clothing', isBold: true }
    ]
  },
  marques: {
    title: 'MARQUES SELECTS',
    links: [
      { label: 'Jacquemus', href: '/products?search=jacquemus' },
      { label: 'Corteiz Drop', href: '/products?search=corteiz' },
      { label: 'Supreme NY', href: '/products?search=supreme' },
      { label: 'Stussy California', href: '/products?search=stussy' },
      { label: 'Voir Tout', href: '/products?category=clothing', isBold: true }
    ]
  },
  categories: {
    title: 'CATEGORIES',
    links: [
      { label: 'Nouveaux Drops', href: '/products?filter=new' },
      { label: 'Robes d\'Été', href: '/products?search=robe' },
      { label: 'Maillots de Foot', href: '/products?search=jersey' },
      { label: 'Offres & Promos', href: '/products?filter=deals', isBold: true }
    ]
  }
};

const jerseyMegaMenuData = {
  nations: {
    title: 'NATIONS SÉLECTION',
    links: [
      { label: 'France (Jacquemus)', href: '/products?search=france' },
      { label: 'Brésil Rétro', href: '/products?search=bresil' },
      { label: 'Argentine', href: '/products?search=argentine' },
      { label: 'Italie Squadra', href: '/products?search=italie' },
      { label: 'Voir Tout', href: '/products?search=jersey', isBold: true }
    ]
  },
  clubs: {
    title: 'CLUBS EXCLUSIFS',
    links: [
      { label: 'PSG (Jordan)', href: '/products?search=psg' },
      { label: 'Real Madrid', href: '/products?search=madrid' },
      { label: 'FC Barcelone', href: '/products?search=barcelone' },
      { label: 'Manchester United', href: '/products?search=manchester' },
      { label: 'Voir Tout', href: '/products?search=jersey', isBold: true }
    ]
  },
  editions: {
    title: 'EDITIONS RÉTRO & COLLABS',
    links: [
      { label: 'Maillots Vintage 90s', href: '/products?search=vintage' },
      { label: 'Coupe du Monde Vintage', href: '/products?search=world+cup' },
      { label: 'Editions Limitées Drops', href: '/products?search=collab' },
      { label: 'Voir Tout', href: '/search=jersey', isBold: true }
    ]
  }
};

const jewelryMegaMenuData = {
  bagues: {
    title: 'BAGUES',
    links: [
      { label: 'Bagues en Or 18k', href: '/products?search=bague-or' },
      { label: 'Bagues en Argent 925', href: '/products?search=bague' },
      { label: 'Chevalières Homme', href: '/products?search=chevaliere' },
      { label: 'Voir Tout', href: '/products?category=jewelry', isBold: true }
    ]
  },
  colliers: {
    title: 'COLLIERS & CHAÎNES',
    links: [
      { label: 'Colliers Perles Blanches', href: '/products?search=perles' },
      { label: 'Pendentifs Cœur', href: '/products?search=pendentif' },
      { label: 'Chaînes en Argent', href: '/products?search=chaine' },
      { label: 'Voir Tout', href: '/products?category=jewelry', isBold: true }
    ]
  },
  accessoires: {
    title: 'ACCESSOIRES PRECIEUX',
    links: [
      { label: 'Bracelets Argent', href: '/products?search=bracelet' },
      { label: 'Boucles d\'Oreilles Perles', href: '/products?search=boucles' },
      { label: 'Montres Classiques', href: '/products?category=watches' },
      { label: 'Voir Tout', href: '/products?category=jewelry', isBold: true }
    ]
  }
};

const bagsMegaMenuData = {
  modeles: {
    title: 'MODÈLES PHARES',
    links: [
      { label: 'Sacs à Main en Cuir', href: '/products?search=main' },
      { label: 'Sacs à Dos Urbains', href: '/products?search=dos' },
      { label: 'Pochettes de Soirée', href: '/products?search=pochette' },
      { label: 'Sacs Cabas Toile', href: '/products?search=cabas' },
      { label: 'Voir Tout', href: '/products?category=bags', isBold: true }
    ]
  },
  tendances: {
    title: 'TENDANCES',
    links: [
      { label: 'Sacs de Voyage / Weekend', href: '/products?search=voyage' },
      { label: 'Sacs Ordinateur / Pro', href: '/products?search=dos' },
      { label: 'Sacs Bananes Hype', href: '/products?search=banane' },
      { label: 'Voir Tout', href: '/products?category=bags', isBold: true }
    ]
  }
};

const nouveautesMegaMenuData = {
  drops: {
    title: 'DERNIERS DROPS HYPE',
    links: [
      { label: 'Travis Scott Pink Drop', href: '/products/air-jordan-1-low-travis-scott-shy-pink' },
      { label: 'Mihara Yasuhiro OG Canvas', href: '/products/maison-mihara-og-sole-canvas-low-black' },
      { label: 'Travis Scott Sail Edition', href: '/products/air-jordan-1-low-travis-scott-tropical-pink' },
      { label: 'Voir Tout le Drop', href: '/products?filter=new', isBold: true }
    ]
  },
  rayons: {
    title: 'NOUVEAUTÉS PAR RAYON',
    links: [
      { label: 'Nouveautés Sneakers 👟', href: '/products?category=shoes&filter=new' },
      { label: 'Nouveautés Vêtements 👕', href: '/products?category=clothing&filter=new' },
      { label: 'Nouveautés Sacs & Bijoux 👜', href: '/products?category=jewelry&filter=new' },
      { label: 'Voir Tout', href: '/products?filter=new', isBold: true }
    ]
  }
};

const megaMenuFeatured: Record<string, { image: string; tag: string; title: string; subtitle: string; href: string }> = {
  SNEAKERS: {
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=600&auto=format&fit=crop',
    tag: 'EXCLUSIVITÉ',
    title: 'Drop Travis Scott & Mihara',
    subtitle: 'Éditions limitées et authentifiées',
    href: '/products?category=shoes'
  },
  VÊTEMENTS: {
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
    tag: 'TENDANCE',
    title: 'Streetwear & Prêt-à-porter',
    subtitle: 'Hoodies, vestes et cargos exclusifs',
    href: '/products?category=clothing'
  },
  MAILLOTS: {
    image: '/france_jersey_hero.jpg',
    tag: 'COLLECTION',
    title: 'Maillots Rétro & Foot',
    subtitle: 'France Jacquemus, Brésil & Clubs',
    href: '/products?search=jersey'
  },
  BIJOUX: {
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=600&auto=format&fit=crop',
    tag: 'JOAILLERIE',
    title: 'Or 18k & Argent Massif',
    subtitle: 'Bagues, colliers et pendentifs',
    href: '/products?category=jewelry'
  },
  SACS: {
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop',
    tag: 'MAROQUINERIE',
    title: 'Sacs en Cuir & Cabas',
    subtitle: 'Finitions luxueuses et élégance',
    href: '/products?category=bags'
  },
  NOUVEAUTÉS: {
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600&auto=format&fit=crop',
    tag: 'NOUVEAU DROP',
    title: 'Arrivages de la Semaine',
    subtitle: 'Expédition express 48H',
    href: '/products?filter=new'
  }
};

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [menuTimeout, setMenuTimeout] = useState<NodeJS.Timeout | null>(null);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  // Sync dark mode preference with localStorage and system
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setDarkMode(true);
    }
  };

  // Page Transition Splash Screen states for ultra-fluid state-machine
  const [mounted, setMounted] = useState(false);
  const [splashVisible, setSplashVisible] = useState(false);
  const [splashActive, setSplashActive] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { language, cart, user, setLanguage, currency, setCurrency, detectedLocationId, notifications, markNotificationAsRead, markAllNotificationsAsRead } = useAppStore();
  const [notifDrawerOpen, setNotifDrawerOpen] = useState(false);
  const { t } = useTranslation(language);
  const activeLoc = getActiveLocation(detectedLocationId);

  const cartCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const userNotifications = (notifications || []).filter(
    n => n.targetEmail === 'ALL' || (user?.email && n.targetEmail === user.email)
  );
  const unreadNotifsCount = userNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Prevent background scrolling when mobile menu drawer OR splash screen is active
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (mobileMenuOpen || splashVisible) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileMenuOpen, splashVisible]);

  // First-time Entrance pre-loader logic (session storage ensures it runs only on first tab visit)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSeen = sessionStorage.getItem('hasSeenAymardPreloader');
      if (!hasSeen) {
        setSplashVisible(true);
        setTimeout(() => {
          setSplashActive(true);
        }, 50);
        
        setTimeout(() => {
          setSplashActive(false);
          setTimeout(() => {
            setSplashVisible(false);
            sessionStorage.setItem('hasSeenAymardPreloader', 'true');
          }, 600);
        }, 2200); // Give enough duration for first-time premium reveal
      }
    }
  }, []);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (menuTimeout) clearTimeout(menuTimeout);
    };
  }, [menuTimeout]);

  // Intercept account navigation with cinematic fade transition
  const handleAccountNavigation = (destination: string) => {
    if (typeof window !== 'undefined' && window.location.pathname === destination) {
      setMobileMenuOpen(false);
      return;
    }
    
    setMobileMenuOpen(false);
    
    // Step 1: Render wrapper in DOM
    setSplashVisible(true);
    
    // Step 2: Trigger CSS transition (fade-in & blur)
    setTimeout(() => {
      setSplashActive(true);
    }, 40);
    
    // Step 3: Redirect to destination after cinematic logo reveal finishes
    setTimeout(() => {
      router.push(destination);
      
      // Step 4: Start smooth fade-out and unmount
      setTimeout(() => {
        setSplashActive(false);
        setTimeout(() => {
          setSplashVisible(false);
        }, 600); // Matches globals.css opacity fade duration (600ms)
      }, 350);
    }, 2000);
  };

  // Debounced Hover Handlers
  const handleMouseEnterLink = (menuLabel: string) => {
    if (menuTimeout) {
      clearTimeout(menuTimeout);
      setMenuTimeout(null);
    }
    setActiveMenu(menuLabel);
  };

  const handleMouseLeaveLink = () => {
    const timeout = setTimeout(() => {
      setActiveMenu(null);
    }, 250);
    setMenuTimeout(timeout);
  };

  const handleMouseEnterMenu = () => {
    if (menuTimeout) {
      clearTimeout(menuTimeout);
      setMenuTimeout(null);
    }
  };

  const handleMouseLeaveMenu = () => {
    const timeout = setTimeout(() => {
      setActiveMenu(null);
    }, 250);
    setMenuTimeout(timeout);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    setMobileMenuOpen(false);
    setMobileSearchOpen(false);
  };

  const navLinks = [
    { label: 'SNEAKERS', href: '/products?category=shoes' },
    { label: 'VÊTEMENTS', href: '/products?category=clothing' },
    { label: 'MAILLOTS', href: '/products?search=jersey' },
    { label: 'BIJOUX', href: '/products?category=jewelry' },
    { label: 'SACS', href: '/products?category=bags' },
    { label: 'NOUVEAUTÉS', href: '/products?filter=new' },
    { label: 'LE JOURNAL', href: '/blog' },
  ];

  const getMegaMenuData = (menuLabel: string) => {
    switch (menuLabel) {
      case 'SNEAKERS':
        return megaMenuData;
      case 'VÊTEMENTS':
        return clothingMegaMenuData;
      case 'MAILLOTS':
        return jerseyMegaMenuData;
      case 'BIJOUX':
        return jewelryMegaMenuData;
      case 'SACS':
        return bagsMegaMenuData;
      case 'NOUVEAUTÉS':
        return nouveautesMegaMenuData;
      default:
        return null;
    }
  };

  if (pathname && pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        
        {/* Row 1: Logo, Search, Actions */}
        <div className="container flex-between" style={{ position: 'relative', height: '64px' }}>
          
          {/* Hamburger Menu Toggle */}
          <button 
            type="button"
            className="mobile-nav-toggle"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setMobileMenuOpen(true);
            }}
            aria-label="Ouvrir le menu"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffffff', padding: '8px', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
          </button>

          <Link href="/" className="header-logo" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', height: '100%', overflow: 'visible' }}>
            <img 
              src="/logo.png" 
              alt="Aymard Logo" 
              className="header-logo-img"
              style={{ filter: 'brightness(0) invert(1)', objectFit: 'contain', display: 'block' }} 
            />
          </Link>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearch} className="header-search">
            <input 
              type="text" 
              className="header-search-input" 
              placeholder={t('common.search')} 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
            <button type="submit" className="header-search-btn" aria-label="Rechercher">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>
          </form>

          {/* Actions Menu */}
          <div className="header-actions" style={{display:'flex',alignItems:'center',gap:'20px',zIndex:10}}>

            {/* Mobile Search Trigger */}
            <button 
              className="mobile-search-toggle"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Rechercher"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-white)', padding: '4px' }}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>

            {/* Account Icon (Triggers 3D Splash Redirect) */}
            <button 
              onClick={() => {
                const destination = user ? (user.role === 'ADMIN' ? '/admin' : '/account') : '/auth/login';
                handleAccountNavigation(destination);
              }}
              className="header-action-btn header-action-account" 
              aria-label="Compte" 
              style={{background:'none',border:'none',color:'#ffffff',cursor:'pointer',display:'flex',alignItems:'center',padding:0}}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>

            {/* Favorites Icon */}
            <Link 
              href="/account/favorites" 
              className="header-action-btn header-action-favorites" 
              aria-label="Favoris" 
              style={{color:'#ffffff',textDecoration:'none',display:'flex',alignItems:'center'}}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
            </Link>

            {/* Cart Icon */}
            <Link 
              href="/cart" 
              className="header-action-btn" 
              aria-label="Panier" 
              style={{color:'#ffffff',textDecoration:'none',position:'relative',display:'flex',alignItems:'center'}}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
            </Link>


          </div>

          {/* Mobile Search Overlay */}
          {mobileSearchOpen && (
            <div className="mobile-search-overlay-bar" style={{ background: '#1c1c1c', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <form onSubmit={handleSearch} style={{ display: 'flex', width: '100%', alignItems: 'center' }}>
                <input 
                  type="text" 
                  placeholder={t('common.search')} 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  style={{ flex: 1, border: 'none', fontSize: '16px', outline: 'none', padding: '8px 0', background: 'transparent', color: '#ffffff' }}
                />
                <button type="submit" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', color: '#ffffff' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
                <button 
                  type="button" 
                  onClick={() => setMobileSearchOpen(false)} 
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '8px', fontSize: '18px', marginLeft: '8px', color: '#ffffff' }}
                >
                  ✕
                </button>
              </form>
            </div>
          )}

        </div>

        {/* Row 2: Navigation Links */}
        <nav className="header-nav" style={{ position: 'relative' }}>
          <div className="container" style={{ display: 'flex', justifyContent: 'center' }}>
            <ul className="header-nav-list" style={{display:'flex',gap:'32px',listStyle:'none',justifyContent:'center',padding:'0',margin:'0'}}>
              {navLinks.map((link) => (
                <li 
                  key={link.label}
                  onMouseEnter={() => handleMouseEnterLink(link.label)}
                  onMouseLeave={handleMouseLeaveLink}
                >
                  <Link href={link.href} className="header-nav-link">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Mega Menu Grid */}
        {activeMenu && getMegaMenuData(activeMenu) && (
          <div 
            className="sneakers-mega-menu"
            onMouseEnter={handleMouseEnterMenu}
            onMouseLeave={handleMouseLeaveMenu}
          >
            <div className="mega-menu-grid" style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '32px', alignItems: 'start' }}>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(Object.keys(getMegaMenuData(activeMenu) || {}).length, 6)}, 1fr)`, gap: '24px' }}>
                {Object.values(getMegaMenuData(activeMenu) || {}).map((col: any) => (
                  <div key={col.title} className="mega-menu-col">
                    <span className="mega-menu-col-title">{col.title}</span>
                    <ul className="mega-menu-links-list">
                      {col.links.map((subLink: any) => (
                        <li key={subLink.label} className={`mega-menu-link-item ${subLink.isBold ? 'bold-link' : ''}`}>
                          <Link href={subLink.href} onClick={() => setActiveMenu(null)}>
                            {subLink.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Featured Promo Card with High-Res Image */}
              {activeMenu && megaMenuFeatured[activeMenu] && (
                <div style={{
                  width: '240px',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  background: '#18181b',
                  border: '1px solid rgba(255,255,255,0.1)',
                  boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <div style={{ height: '140px', position: 'relative', overflow: 'hidden' }}>
                    <img 
                      src={megaMenuFeatured[activeMenu].image} 
                      alt={megaMenuFeatured[activeMenu].title} 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                    <span style={{
                      position: 'absolute',
                      top: '10px',
                      left: '10px',
                      background: '#09090b',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      padding: '3px 8px',
                      borderRadius: '8px',
                      letterSpacing: '0.6px'
                    }}>
                      {megaMenuFeatured[activeMenu].tag}
                    </span>
                  </div>
                  <div style={{ padding: '14px', textAlign: 'left' }}>
                    <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#ffffff', margin: '0 0 4px 0' }}>
                      {megaMenuFeatured[activeMenu].title}
                    </h4>
                    <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)', margin: '0 0 10px 0', lineHeight: 1.4 }}>
                      {megaMenuFeatured[activeMenu].subtitle}
                    </p>
                    <Link 
                      href={megaMenuFeatured[activeMenu].href} 
                      onClick={() => setActiveMenu(null)}
                      style={{
                        display: 'inline-block',
                        fontSize: '11px',
                        fontWeight: 800,
                        color: '#38bdf8',
                        textDecoration: 'none',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}
                    >
                      Découvrir ➔
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

      </header>

      {/* Mobile Drawer Overlay & Sidebar Mounted Directly to Body */}
      {mounted && createPortal(
        <>
          <div 
            className={`mobile-menu-overlay ${mobileMenuOpen ? 'open' : ''}`}
            onClick={() => setMobileMenuOpen(false)}
          />

          <div className={`mobile-menu-drawer ${mobileMenuOpen ? 'open' : ''}`}>
            {/* Drawer Header */}
            <div className="mobile-menu-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <img 
                  src="/logo.png" 
                  alt="Aymard Logo" 
                  style={{ height: '48px', width: 'auto', objectFit: 'contain' }}
                  className="dark:invert"
                />
              </div>

              {/* Action Buttons: Sun/Theme Toggle + Close Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={toggleDarkMode}
                  aria-label="Changer de thème"
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: darkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {darkMode ? '🌙' : '☀️'}
                </button>

                <button 
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Fermer le menu"
                  style={{ 
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    background: darkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                    border: 'none', 
                    cursor: 'pointer', 
                    fontSize: '16px', 
                    color: darkMode ? '#ffffff' : '#09090b', 
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Quick In-Drawer Search Bar */}
            <div style={{ padding: '12px 20px 8px 20px' }}>
              <form 
                onSubmit={(e) => {
                  handleSearch(e);
                  setMobileMenuOpen(false);
                }} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: darkMode ? 'rgba(255,255,255,0.06)' : '#f8fafc',
                  border: darkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid #e2e8f0',
                  borderRadius: '24px',
                  padding: '8px 14px',
                  gap: '8px'
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={darkMode ? '#94a3b8' : '#64748b'} strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input 
                  type="text" 
                  placeholder="Rechercher sneakers, marques..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    outline: 'none',
                    fontSize: '13px',
                    color: darkMode ? '#ffffff' : '#09090b',
                    width: '100%',
                    fontWeight: 600
                  }}
                />
              </form>
            </div>

            {/* Navigation Links Scroll Container */}
            <div className="mobile-menu-links-container" style={{ flex: 1, overflowY: 'auto', padding: '8px 20px' }}>
              
              {/* Category: SNEAKERS */}
              <div className="mobile-menu-item-group">
                <button 
                  className="mobile-menu-accordion-trigger"
                  onClick={() => setExpandedItem(expandedItem === 'SNEAKERS' ? null : 'SNEAKERS')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>👟</span>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>Sneakers & Kicks</span>
                  </span>
                  <span style={{ fontSize: '18px', color: '#94a3b8' }}>{expandedItem === 'SNEAKERS' ? '−' : '+'}</span>
                </button>
                {expandedItem === 'SNEAKERS' && (
                  <div className="mobile-menu-accordion-content">
                    <Link href="/products?category=shoes" onClick={() => setMobileMenuOpen(false)}>Tous les sneakers (Voir tout)</Link>
                    <Link href="/products?search=nike" onClick={() => setMobileMenuOpen(false)}>Nike & Jordan</Link>
                    <Link href="/products?search=adidas" onClick={() => setMobileMenuOpen(false)}>Adidas Originals & Samba</Link>
                    <Link href="/products?search=campus" onClick={() => setMobileMenuOpen(false)}>Adidas Campus 00s</Link>
                    <Link href="/products?search=new+balance" onClick={() => setMobileMenuOpen(false)}>New Balance</Link>
                  </div>
                )}
              </div>

              {/* Category: VÊTEMENTS */}
              <div className="mobile-menu-item-group">
                <button 
                  className="mobile-menu-accordion-trigger"
                  onClick={() => setExpandedItem(expandedItem === 'VÊTEMENTS' ? null : 'VÊTEMENTS')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>👕</span>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>Prêt-à-Porter</span>
                  </span>
                  <span style={{ fontSize: '18px', color: '#94a3b8' }}>{expandedItem === 'VÊTEMENTS' ? '−' : '+'}</span>
                </button>
                {expandedItem === 'VÊTEMENTS' && (
                  <div className="mobile-menu-accordion-content">
                    <Link href="/products?category=clothing" onClick={() => setMobileMenuOpen(false)}>Tous les vêtements</Link>
                    <Link href="/products?search=t-shirt" onClick={() => setMobileMenuOpen(false)}>T-shirts & Polos</Link>
                    <Link href="/products?search=hoodie" onClick={() => setMobileMenuOpen(false)}>Hoodies & Sweats Hype</Link>
                    <Link href="/products?search=veste" onClick={() => setMobileMenuOpen(false)}>Vestes & Cargos Streetwear</Link>
                  </div>
                )}
              </div>

              {/* Category: MAILLOTS */}
              <div className="mobile-menu-item-group">
                <button 
                  className="mobile-menu-accordion-trigger"
                  onClick={() => setExpandedItem(expandedItem === 'MAILLOTS' ? null : 'MAILLOTS')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>⚽</span>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>Maillots & Clubs</span>
                  </span>
                  <span style={{ fontSize: '18px', color: '#94a3b8' }}>{expandedItem === 'MAILLOTS' ? '−' : '+'}</span>
                </button>
                {expandedItem === 'MAILLOTS' && (
                  <div className="mobile-menu-accordion-content">
                    <Link href="/products?search=jersey" onClick={() => setMobileMenuOpen(false)}>Tous les maillots officiels</Link>
                    <Link href="/products?search=france" onClick={() => setMobileMenuOpen(false)}>Équipe de France</Link>
                    <Link href="/products?search=bresil" onClick={() => setMobileMenuOpen(false)}>Brésil Rétro & Vintage</Link>
                    <Link href="/products?search=psg" onClick={() => setMobileMenuOpen(false)}>Clubs Exclusifs</Link>
                  </div>
                )}
              </div>

              {/* Category: BIJOUX */}
              <div className="mobile-menu-item-group">
                <button 
                  className="mobile-menu-accordion-trigger"
                  onClick={() => setExpandedItem(expandedItem === 'BIJOUX' ? null : 'BIJOUX')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>💎</span>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>Bijoux & Joaillerie</span>
                  </span>
                  <span style={{ fontSize: '18px', color: '#94a3b8' }}>{expandedItem === 'BIJOUX' ? '−' : '+'}</span>
                </button>
                {expandedItem === 'BIJOUX' && (
                  <div className="mobile-menu-accordion-content">
                    <Link href="/products?category=jewelry" onClick={() => setMobileMenuOpen(false)}>Tous les bijoux précieux</Link>
                    <Link href="/products?search=bague" onClick={() => setMobileMenuOpen(false)}>Bagues & Chevalières</Link>
                    <Link href="/products?search=bracelet" onClick={() => setMobileMenuOpen(false)}>Bracelets Argent 925</Link>
                    <Link href="/products?search=collier" onClick={() => setMobileMenuOpen(false)}>Colliers & Chaînes</Link>
                  </div>
                )}
              </div>

              {/* Category: SACS */}
              <div className="mobile-menu-item-group">
                <button 
                  className="mobile-menu-accordion-trigger"
                  onClick={() => setExpandedItem(expandedItem === 'SACS' ? null : 'SACS')}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>👜</span>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>Maroquinerie & Sacs</span>
                  </span>
                  <span style={{ fontSize: '18px', color: '#94a3b8' }}>{expandedItem === 'SACS' ? '−' : '+'}</span>
                </button>
                {expandedItem === 'SACS' && (
                  <div className="mobile-menu-accordion-content">
                    <Link href="/products?category=bags" onClick={() => setMobileMenuOpen(false)}>Tous les sacs de luxe</Link>
                    <Link href="/products?search=main" onClick={() => setMobileMenuOpen(false)}>Sacs à main en cuir</Link>
                    <Link href="/products?search=dos" onClick={() => setMobileMenuOpen(false)}>Sacs à dos urbains</Link>
                  </div>
                )}
              </div>

              {/* NOUVEAUTÉS */}
              <div className="mobile-menu-item-group">
                <Link href="/products?filter=new" className="mobile-menu-accordion-trigger" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setMobileMenuOpen(false)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>🔥</span>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>Nouveautés Drops</span>
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 800, background: '#09090b', color: '#ffffff', padding: '2px 8px', borderRadius: '10px' }}>
                    NEW
                  </span>
                </Link>
              </div>

              {/* LE JOURNAL / BLOG */}
              <div className="mobile-menu-item-group">
                <Link href="/blog" className="mobile-menu-accordion-trigger" style={{ textDecoration: 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }} onClick={() => setMobileMenuOpen(false)}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '16px' }}>📰</span>
                    <span style={{ fontWeight: 800, fontSize: '14px' }}>Le Journal (Blog)</span>
                  </span>
                  <span style={{ fontSize: '10px', fontWeight: 800, background: '#38bdf8', color: '#09090b', padding: '2px 8px', borderRadius: '10px' }}>
                    BLOG
                  </span>
                </Link>
              </div>

            </div>

            {/* Mobile Menu Footer Bar */}
            <div className="mobile-menu-footer" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'center' }}>
              <button 
                onClick={() => {
                  setMobileMenuOpen(false);
                  const destination = user ? (user.role === 'ADMIN' ? '/admin' : '/account') : '/auth/login';
                  handleAccountNavigation(destination);
                }} 
                className="mobile-menu-footer-link"
                style={{
                  width: '100%',
                  background: darkMode ? '#ffffff' : '#09090b',
                  color: darkMode ? '#09090b' : '#ffffff',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                }}
              >
                <span>{user ? 'Mon Compte Client' : 'Se Connecter'}</span>
              </button>
            </div>
          </div>
        </>,
        document.body
      )}

      {/* 3D Connecting Splash Screen Overlay Mounted Directly to Body */}
      {mounted && splashVisible && createPortal(
        <div 
          id="aymard-auth-splash-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100dvh',
            minHeight: '100vh',
            background: splashActive ? 'rgba(9, 9, 11, 0.98)' : 'rgba(9, 9, 11, 0)',
            backdropFilter: splashActive ? 'blur(25px)' : 'blur(0px)',
            WebkitBackdropFilter: splashActive ? 'blur(25px)' : 'blur(0px)',
            zIndex: 2147483647,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            opacity: splashActive ? 1 : 0,
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
            pointerEvents: 'all'
          }}
        >
          {/* Pulsing Light Aura in background */}
          <div style={{
            position: 'absolute',
            width: '500px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 70%)',
            filter: 'blur(50px)',
            borderRadius: '50%',
            pointerEvents: 'none',
            transform: splashActive ? 'scale(1.2)' : 'scale(0.8)',
            transition: 'transform 2s cubic-bezier(0.16, 1, 0.3, 1)',
            zIndex: 0
          }} />

          {/* 3D Cinematic Logo Reveal */}
          <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '0 20px' }}>
            <img 
              src="/logo.png" 
              alt="Aymard Store" 
              style={{
                width: '290px',
                maxWidth: '80vw',
                height: 'auto',
                objectFit: 'contain',
                filter: 'brightness(0) invert(1)',
                animation: splashActive ? 'logo3DReveal 1.6s cubic-bezier(0.16, 1, 0.3, 1) forwards' : 'none'
              }}
            />

            {/* Premium Golden Sweep light effect covering logo */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(120deg, transparent 30%, rgba(255, 255, 255, 0.4) 40%, rgba(255, 255, 255, 0.4) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              backgroundPosition: '150% 0',
              mixBlendMode: 'overlay',
              pointerEvents: 'none',
              animation: splashActive ? 'shineSweep 1.8s ease-in-out infinite' : 'none'
            }} />

            {/* Glowing Scan Bar under logo */}
            <div style={{
              width: '200px',
              height: '2px',
              background: 'rgba(255, 255, 255, 0.1)',
              marginTop: '32px',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '2px',
              boxShadow: '0 0 10px rgba(255, 255, 255, 0.15)'
            }}>
              <div style={{
                position: 'absolute',
                height: '100%',
                width: '90px',
                background: 'linear-gradient(90deg, transparent, #ffffff, transparent)',
                animation: 'splashBarScan 1.3s infinite ease-in-out'
              }} />
            </div>
          </div>

          {/* "Propulsé par GlobalGest" at the bottom */}
          <div style={{
            position: 'absolute',
            bottom: 'max(40px, env(safe-area-inset-bottom, 40px))',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '6px',
            zIndex: 10,
            transform: splashActive ? 'translateY(0)' : 'translateY(20px)',
            opacity: splashActive ? 0.95 : 0,
            transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '4px',
              color: 'rgba(255, 255, 255, 0.45)',
              fontFamily: 'var(--font-outfit), sans-serif',
              margin: 0
            }}>
              Propulsé par
            </span>
            <span style={{
              fontSize: '15px',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '3px',
              color: '#ffffff',
              fontFamily: 'var(--font-space-grotesk), sans-serif',
              margin: 0,
              background: 'linear-gradient(90deg, #ffffff, #d1d5db)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 4px 12px rgba(255,255,255,0.05)'
            }}>
              GlobalGest
            </span>
          </div>

        </div>,
        document.body
      )}
    </>
  );
}

import React from 'react';

// ============ CONSTANTS & HELPERS ============
export const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];
export const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
export const VOLUME_SIZES = ['30 ml', '50 ml', '75 ml', '100 ml', '150 ml', '200 ml', '500 ml', '1 L'];
export const UNIQUE_SIZES = ['Taille Unique', 'Format Standard'];

export const PRESET_COLORS = [
  { name: 'Noir', hex: '#09090b', border: '#27272a' },
  { name: 'Blanc', hex: '#ffffff', border: '#cbd5e1' },
  { name: 'Gris', hex: '#64748b', border: '#64748b' },
  { name: 'Bleu', hex: '#2563eb', border: '#2563eb' },
  { name: 'Marine', hex: '#1e3a8a', border: '#1e3a8a' },
  { name: 'Rouge', hex: '#dc2626', border: '#dc2626' },
  { name: 'Vert', hex: '#16a34a', border: '#16a34a' },
  { name: 'Beige', hex: '#d4b996', border: '#d4b996' },
  { name: 'Marron', hex: '#78350f', border: '#78350f' },
  { name: 'Or', hex: '#eab308', border: '#eab308' },
  { name: 'Argent', hex: '#94a3b8', border: '#94a3b8' },
  { name: 'Rose', hex: '#ec4899', border: '#ec4899' },
  { name: 'Violet', hex: '#9333ea', border: '#9333ea' },
  { name: 'Orange', hex: '#ea580c', border: '#ea580c' },
];

export const cleanExistingSizes = (sizes?: string[]): string[] => {
  if (!sizes || !Array.isArray(sizes)) return [];
  const result: string[] = [];
  sizes.forEach(s => {
    if (typeof s === 'string') {
      const trimmed = s.trim();
      if (trimmed && !result.includes(trimmed)) {
        result.push(trimmed);
      }
    }
  });
  return result;
};

// ============ TYPES ============
export type Tab = 
  | 'dashboard' 
  | 'products' 
  | 'categories' 
  | 'homeCms' 
  | 'orders' 
  | 'abandonedCheckouts' 
  | 'reviews' 
  | 'marketing' 
  | 'blog' 
  | 'clients' 
  | 'supportChat' 
  | 'transactions' 
  | 'accounting' 
  | 'promos' 
  | 'delivery' 
  | 'locations' 
  | 'suppliers' 
  | 'employees' 
  | 'analytics' 
  | 'pixels' 
  | 'settings' 
  | 'profile';

export type ModalType = 
  | 'addProduct' 
  | 'batchAddProducts' 
  | 'editProduct' 
  | 'addCategory' 
  | 'addSubCategory' 
  | 'addClient' 
  | 'addSupplier' 
  | 'addSupplyOrder' 
  | 'addEmployee' 
  | 'payEmployee' 
  | 'addDeliveryZone' 
  | 'addPromo' 
  | 'addBroadcastNotif' 
  | 'addExpense' 
  | 'editExpense' 
  | null;

export const getTabIcon = (id: Tab): React.ReactNode => {
  switch (id) {
    case 'dashboard':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>;
    case 'products':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>;
    case 'categories':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
    case 'homeCms':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>;
    case 'orders':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>;
    case 'abandonedCheckouts':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/><line x1="12" y1="9" x2="16" y2="13"/><line x1="16" y1="9" x2="12" y2="13"/></svg>;
    case 'reviews':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
    case 'marketing':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>;
    case 'blog':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>;
    case 'clients':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
    case 'supportChat':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
    case 'transactions':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>;
    case 'accounting':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><rect x="2" y="2" width="20" height="20" rx="2"/></svg>;
    case 'promos':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5"/></svg>;
    case 'delivery':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>;
    case 'locations':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
    case 'suppliers':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/></svg>;
    case 'employees':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>;
    case 'analytics':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
    case 'pixels':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>;
    case 'settings':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>;
    case 'profile':
      return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
  }
};

export const NAV_ITEMS: { id: Tab; label: string; section?: string }[] = [
  { id: 'dashboard', label: 'Tableau de bord', section: 'GÉNÉRAL' },
  { id: 'products', label: 'Produits' },
  { id: 'categories', label: 'Catégories' },
  { id: 'homeCms', label: 'Visuels & Accueil' },
  { id: 'orders', label: 'Commandes', section: 'COMMERCE & FINANCE' },
  { id: 'abandonedCheckouts', label: 'Relance Abandons (Paniers Perdus)' },
  { id: 'reviews', label: 'Avis Clients' },
  { id: 'accounting', label: 'Comptabilité & Profits' },
  { id: 'transactions', label: 'Transactions' },
  { id: 'locations', label: 'Pays & Devises' },
  { id: 'supportChat', label: 'Live Chat Support' },
  { id: 'clients', label: 'Clients' },
  { id: 'promos', label: 'Promotions' },
  { id: 'delivery', label: 'Livraison', section: 'OPÉRATIONS' },
  { id: 'suppliers', label: 'Fournisseurs' },
  { id: 'employees', label: 'Employés' },
  { id: 'marketing', label: 'Marketing & Drops (WhatsApp/Email)', section: 'MARKETING & ANALYTIQUES' },
  { id: 'blog', label: 'Blog & Publications (CMS)' },
  { id: 'analytics', label: 'Analytiques en Direct' },
  { id: 'pixels', label: 'Pixels Publicitaires (Ads)' },
  { id: 'settings', label: 'Paramètres & LeekPay', section: 'SYSTÈME' },
  { id: 'profile', label: 'Mon profil' },
];

export const getCategoryLabel = (categorySlug?: string, dynamicCategories?: any[]): string => {
  if (!categorySlug) return 'Non catégorisé';
  const map: Record<string, string> = {
    shoes: 'Chaussures / Sneakers',
    clothing: 'Vêtements & Streetwear',
    bags: 'Sacs & Maroquinerie',
    jewelry: 'Bijoux & Joaillerie',
    watches: 'Montres de Luxe',
    accessories: 'Accessoires',
  };
  const key = categorySlug.toLowerCase().trim();
  if (dynamicCategories) {
    const dyn = dynamicCategories.find(
      c => c.slug?.toLowerCase() === key || c.id?.toLowerCase() === key || c.name?.toLowerCase() === key
    );
    if (dyn) return dyn.name;
  }
  return map[key] || (categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1));
};

'use client';

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore, Client, Supplier, SupplyOrder, Employee, EmployeePayment, DeliveryZone, DynamicCategory, SubCategory, PromoCode, formatPrice, convertPrice, Expense, ExpenseCategory, SupportConversation, SupportConversationStatus, DEFAULT_PIXEL_SETTINGS, PointTransaction, calculatePointsEarned, generateReferralCode, BlogPost } from '@/lib/store';
import { Product } from '@/lib/products-data';
import { computeAnalyticsData, getLiveVisitorsCount, pingVisitorHeartbeat, trackInternalEvent, getLiveVisitorsDetails, simulateAddLiveVisitor, clearSimulatedLiveVisitors, LiveVisitorsReport } from '@/lib/internal-tracker';

// ============ CONSTANTS & HELPERS ============
const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'];
const VOLUME_SIZES = ['30 ml', '50 ml', '75 ml', '100 ml', '150 ml', '200 ml', '500 ml', '1 L'];
const UNIQUE_SIZES = ['Taille Unique', 'Format Standard'];
const PRESET_COLORS = [
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

const cleanExistingSizes = (sizes?: string[]): string[] => {
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
type Tab = 'dashboard' | 'products' | 'categories' | 'homeCms' | 'orders' | 'abandonedCheckouts' | 'reviews' | 'marketing' | 'blog' | 'clients' | 'supportChat' | 'transactions' | 'accounting' | 'promos' | 'delivery' | 'locations' | 'suppliers' | 'employees' | 'analytics' | 'pixels' | 'settings' | 'profile';
type ModalType = 'addProduct' | 'editProduct' | 'addCategory' | 'addSubCategory' | 'addClient' | 'addSupplier' | 'addSupplyOrder' | 'addEmployee' | 'payEmployee' | 'addDeliveryZone' | 'addPromo' | 'addBroadcastNotif' | 'addExpense' | 'editExpense' | null;

const getTabIcon = (id: Tab) => {
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

const NAV_ITEMS: { id: Tab; label: string; section?: string }[] = [
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
  { id: 'settings', label: 'Paramètres & FedaPay', section: 'SYSTÈME' },
  { id: 'profile', label: 'Mon profil' },
];

// ============ TOAST HOOK ============
function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'warning' | 'info' } | null>(null);
  const show = useCallback((msg: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);
  return { toast, show };
}

// ============ MAIN COMPONENT ============
export default function AdminDashboard() {
  const router = useRouter();
  const store = useAppStore();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [modal, setModal] = useState<ModalType>(null);
  const [search, setSearch] = useState('');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [orderFilter, setOrderFilter] = useState<'ALL' | 'PENDING' | 'SHIPPED' | 'DELIVERED'>('ALL');
  const [productPage, setProductPage] = useState(1);
  const [orderPage, setOrderPage] = useState(1);
  const [reviewFilter, setReviewFilter] = useState<'ALL' | 'APPROVED' | 'PENDING' | 'REJECTED'>('ALL');
  const [reviewSearch, setReviewSearch] = useState('');
  
  // Marketing & Drops Broadcast State
  const [selectedBroadcastProductId, setSelectedBroadcastProductId] = useState<string>('');
  const [broadcastMessageText, setBroadcastMessageText] = useState<string>('');
  const [broadcastChannelWhatsapp, setBroadcastChannelWhatsapp] = useState<boolean>(true);
  const [broadcastChannelEmail, setBroadcastChannelEmail] = useState<boolean>(true);
  const [subscriberSearch, setSubscriberSearch] = useState<string>('');
  const [subscriberChannelFilter, setSubscriberChannelFilter] = useState<'ALL' | 'WHATSAPP' | 'EMAIL'>('ALL');
  const [isBroadcasting, setIsBroadcasting] = useState<boolean>(false);
  const [previewChannelTab, setPreviewChannelTab] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP');
  const [newProductBroadcastPrompt, setNewProductBroadcastPrompt] = useState<Product | null>(null);

  const { toast, show: showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [adminDarkMode, setAdminDarkMode] = useState(false);
  const [auditClient, setAuditClient] = useState<Client | null>(null);
  
  // Custom Confirmation Modal Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    icon?: string;
    type?: 'danger' | 'warning' | 'info';
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  const showConfirmDialog = (opts: {
    title: string;
    message: string;
    icon?: string;
    type?: 'danger' | 'warning' | 'info';
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm: () => void;
  }) => {
    setConfirmDialog({
      isOpen: true,
      title: opts.title,
      message: opts.message,
      icon: opts.icon || '⚠️',
      type: opts.type || 'danger',
      confirmLabel: opts.confirmLabel || 'Confirmer',
      cancelLabel: opts.cancelLabel || 'Annuler',
      onConfirm: opts.onConfirm
    });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog(null);
  };

  const [dashboardAlertFilter, setDashboardAlertFilter] = useState<'ALL' | 'OUT' | 'LOW'>('ALL');
  const [cmsSubTab, setCmsSubTab] = useState<'hero' | 'categories' | 'lookbook' | 'faq' | 'community'>('hero');

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>, onImageReady: (dataUrl: string) => void) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        onImageReady(result);
        showToast('Image chargée avec succès !');
      }
    };
    reader.readAsDataURL(file);
  };

  // Helper function to translate category slugs to clean French
  const getCategoryLabel = (categorySlug?: string): string => {
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
    const dyn = store.dynamicCategories?.find(
      c => c.slug?.toLowerCase() === key || c.id?.toLowerCase() === key || c.name?.toLowerCase() === key
    );
    if (dyn) return dyn.name;
    return map[key] || (categorySlug.charAt(0).toUpperCase() + categorySlug.slice(1));
  };

  // Accounting State
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [accountingPeriod, setAccountingPeriod] = useState<'all' | 'today' | '7days' | 'month' | 'quarter' | 'year'>('all');
  const [expenseCategoryFilter, setExpenseCategoryFilter] = useState<string>('ALL');
  const [expenseSearch, setExpenseSearch] = useState<string>('');

  // Product Edit State (Sizes & Colors)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [customColorInput, setCustomColorInput] = useState('');
  
  // Live Chat Support State
  const [selectedConvId, setSelectedConvId] = useState<string>('');
  const [adminChatInput, setAdminChatInput] = useState<string>('');
  const [adminSelectedImage, setAdminSelectedImage] = useState<string | null>(null);
  const [supportFilterStatus, setSupportFilterStatus] = useState<string>('ALL');
  const [supportSearch, setSupportSearch] = useState<string>('');
  const adminFileInputRef = useRef<HTMLInputElement>(null);

  // Blog CMS Studio State
  const [isBlogModalOpen, setIsBlogModalOpen] = useState<boolean>(false);
  const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
  const [blogTitle, setBlogTitle] = useState<string>('');
  const [blogSlug, setBlogSlug] = useState<string>('');
  const [blogExcerpt, setBlogExcerpt] = useState<string>('');
  const [blogContent, setBlogContent] = useState<string>('');
  const [blogCoverImage, setBlogCoverImage] = useState<string>('');
  const [blogCategory, setBlogCategory] = useState<'Sneakers Culture' | 'Guides & Conseils' | 'Lookbooks & Style' | 'Actualités & Drops'>('Lookbooks & Style');
  const [blogAuthorName, setBlogAuthorName] = useState<string>('Équipe Éditoriale Aymard');
  const [blogAuthorRole, setBlogAuthorRole] = useState<string>('Curateur Streetwear & Mode');
  const [blogAuthorAvatar, setBlogAuthorAvatar] = useState<string>('https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop');
  const [blogReadTime, setBlogReadTime] = useState<string>('4 min');
  const [blogTagsInput, setBlogTagsInput] = useState<string>('Sneakers, Mode, Tendance');
  const [blogLinkedProductIds, setBlogLinkedProductIds] = useState<string[]>([]);
  const [blogIsFeatured, setBlogIsFeatured] = useState<boolean>(false);
  const [blogPublished, setBlogPublished] = useState<boolean>(true);
  const [blogSearch, setBlogSearch] = useState<string>('');
  const [blogFilterCategory, setBlogFilterCategory] = useState<string>('ALL');
  const [blogProductPickerQuery, setBlogProductPickerQuery] = useState<string>('');
  const [blogPreviewMode, setBlogPreviewMode] = useState<boolean>(false);

  // Abandoned Checkouts Recovery State
  const [abandonedSearch, setAbandonedSearch] = useState<string>('');
  const [abandonedStatusFilter, setAbandonedStatusFilter] = useState<'ALL' | 'ABANDONED' | 'PAYMENT_FAILED' | 'RECOVERED'>('ALL');

  const [selectedParentCatForSub, setSelectedParentCatForSub] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [categorySearch, setCategorySearch] = useState('');

  // Location Tab States
  const [locationSearch, setLocationSearch] = useState('');
  const [locationPage, setLocationPage] = useState(1);
  const [tempRates, setTempRates] = useState<Record<string, number>>({});
  const [tempPrices, setTempPrices] = useState<Record<string, { benin?: number; france?: number; belgique?: number }>>({});

  // Promo & Notification Target State
  const [promoTargetType, setPromoTargetType] = useState<string>('ALL');
  const [broadcastTargetType, setBroadcastTargetType] = useState<string>('ALL');

  // Real-Time Package Tracking Control State
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);
  const [trackingStep, setTrackingStep] = useState<number>(2);
  const [trackingLocation, setTrackingLocation] = useState<string>('');
  const [trackingStatusText, setTrackingStatusText] = useState<string>('');
  const [carrierName, setCarrierName] = useState<string>('');
  const [carrierPhone, setCarrierPhone] = useState<string>('');
  const [trackingNumber, setTrackingNumber] = useState<string>('');
  const [estimatedDeliveryDate, setEstimatedDeliveryDate] = useState<string>('');
  const [newCheckpointLocation, setNewCheckpointLocation] = useState<string>('');
  const [newCheckpointTitle, setNewCheckpointTitle] = useState<string>('');
  const [newCheckpointDesc, setNewCheckpointDesc] = useState<string>('');

  const openTrackingManager = (order: any) => {
    setTrackingOrder(order);
    setTrackingStep(order.trackingStep || (order.status === 'DELIVERED' ? 4 : order.status === 'SHIPPED' ? 3 : 2));
    setTrackingLocation(order.currentLocation || (order.status === 'DELIVERED' ? 'Remis au client' : order.status === 'SHIPPED' ? 'En cours d\'acheminement' : 'Entrepôt Cotonou (Haie Vive)'));
    setTrackingStatusText(order.trackingStatusText || (order.status === 'DELIVERED' ? 'Colis réceptionné avec succès' : order.status === 'SHIPPED' ? 'Colis pris en charge par le coursier' : 'Colis en cours de préparation'));
    setCarrierName(order.carrierName || 'Coursier Express Aymard Store');
    setCarrierPhone(order.carrierPhone || '+229 01 97 36 29 06');
    setTrackingNumber(order.trackingNumber || `BJ-EXP-${order.orderNumber ? order.orderNumber.replace(/[^0-9]/g, '') : Math.floor(100000 + Math.random() * 900000)}`);
    setEstimatedDeliveryDate(order.estimatedDeliveryDate || 'Livraison aujourd\'hui ou sous 24h chrono');
    setNewCheckpointLocation('');
    setNewCheckpointTitle('');
    setNewCheckpointDesc('');
  };

  // Client VIP & Perks Management State
  const [grantPerkClient, setGrantPerkClient] = useState<Client | null>(null);
  const [grantBonusPointsClient, setGrantBonusPointsClient] = useState<Client | null>(null);
  const [bonusPointsInput, setBonusPointsInput] = useState<number>(100);
  const [bonusPointsReason, setBonusPointsReason] = useState<string>('');
  const [customPerkTitle, setCustomPerkTitle] = useState<string>('Paire de Chaussettes Aymard Offerte');
  const [customPerkDesc, setCustomPerkDesc] = useState<string>('À réclamer lors de votre prochaine livraison ou en boutique.');
  const [customPerkIcon, setCustomPerkIcon] = useState<string>('🎁');

  // Analytics Studio State
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d' | 'year' | 'all'>('30d');
  const [analyticsMetric, setAnalyticsMetric] = useState<'revenue' | 'orders' | 'aov'>('revenue');
  const [analyticsCurrency, setAnalyticsCurrency] = useState<'FCFA' | 'EUR'>('FCFA');
  const [analyticsActiveBar, setAnalyticsActiveBar] = useState<number | null>(null);

  // Data Pixel GlobalGest Live Tracker State
  const [analyticsStartDate, setAnalyticsStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [analyticsEndDate, setAnalyticsEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [analyticsGroup, setAnalyticsGroup] = useState<string>('all');
  const [analyticsBoutique, setAnalyticsBoutique] = useState<string>('all');
  const [analyticsEventFilter, setAnalyticsEventFilter] = useState<string>('all');
  const [analyticsRefreshKey, setAnalyticsRefreshKey] = useState<number>(0);

  // Real-time Analytics Compute from Internal Tracker & Store Orders
  const analyticsData = useMemo(() => {
    return computeAnalyticsData({
      startDate: analyticsStartDate,
      endDate: analyticsEndDate,
      group: analyticsGroup,
      boutique: analyticsBoutique,
      eventType: analyticsEventFilter
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analyticsStartDate, analyticsEndDate, analyticsGroup, analyticsBoutique, analyticsEventFilter, analyticsRefreshKey, store.orders]);

  // Real-time Live Visitors Modal & Geo Report State
  const [showLiveVisitorsModal, setShowLiveVisitorsModal] = useState<boolean>(false);
  const [liveVisitorsReport, setLiveVisitorsReport] = useState<LiveVisitorsReport>(() => getLiveVisitorsDetails());

  const refreshLiveVisitors = useCallback(() => {
    setLiveVisitorsReport(getLiveVisitorsDetails());
    setAnalyticsRefreshKey(k => k + 1);
  }, []);

  // Periodic heartbeat / live report poll every 6 seconds when modal is open or when on analytics/dashboard tab
  useEffect(() => {
    const timer = setInterval(() => {
      if (showLiveVisitorsModal || tab === 'analytics' || tab === 'dashboard') {
        setLiveVisitorsReport(getLiveVisitorsDetails());
      }
    }, 6000);
    return () => clearInterval(timer);
  }, [showLiveVisitorsModal, tab]);

  // Aggregated list of all clients (CRM + Orders + Users)
  const allKnownClients: { email: string; name: string }[] = useMemo(() => {
    const clientMap = new Map<string, string>();
    (store.clients || []).forEach((c: Client) => {
      if (c.email) clientMap.set(c.email.toLowerCase().trim(), c.name || c.email);
    });
    (store.orders || []).forEach((o: any) => {
      if (o.customerEmail) {
        const email = o.customerEmail.toLowerCase().trim();
        if (!clientMap.has(email)) {
          clientMap.set(email, o.shippingAddress?.fullName || 'Client Commande');
        }
      }
    });
    if (store.user?.email) {
      const email = store.user.email.toLowerCase().trim();
      if (!clientMap.has(email)) {
        clientMap.set(email, store.user.name || 'Compte Boutique');
      }
    }
    return Array.from(clientMap.entries()).map(([email, name]) => ({ email, name }));
  }, [store.clients, store.orders, store.user]);

  // CSV & Google Sheets Import State
  const [csvInput, setCsvInput] = useState('');
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showGoogleSheetsSync, setShowGoogleSheetsSync] = useState(false);
  const [sheetUrlInput, setSheetUrlInput] = useState(store.googleSheetConfig.sheetUrl || '');
  const [isSyncingSheet, setIsSyncingSheet] = useState(false);

  const handleCsvImportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvInput.trim()) return;
    const count = store.importProductsCSV(csvInput);
    if (count > 0) {
      showToast(`${count} produits importés avec succès !`);
      setCsvInput('');
      setShowCsvImport(false);
    } else {
      showToast("Erreur d'analyse CSV. Vérifiez le format.", 'error');
    }
  };

  const handleFileUploadCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      if (text) {
        setCsvInput(text);
        const count = store.importProductsCSV(text);
        if (count > 0) {
          showToast(`${count} produits importés depuis le fichier ${file.name} !`);
          setShowCsvImport(false);
        } else {
          showToast("Format CSV non valide ou fichier vide.", 'error');
        }
      }
    };
    reader.readAsText(file);
  };

  const handleDownloadCsvSample = () => {
    const csvLines = [
      "Nom,Prix,Categorie,ImageURL,Stock,Description",
      "Maillot France Retro,89.99,clothing,/france_jersey_hero.jpg,45,Maillot officiel d'exception",
      "Sneakers Air Pro,149.99,shoes,https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop,30,Sneakers édition limitée",
      "Sac Cabas Luxe,199.00,bags,https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=600&auto=format&fit=crop,15,Sac cabas d'exception en cuir"
    ];
    const csvContent = csvLines.join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'modele_produits_aymard_store.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('Modèle CSV téléchargé avec succès !');
  };

  const handleClearCsvProducts = () => {
    const deletedCount = store.clearCSVProducts();
    if (deletedCount > 0) {
      showToast(`${deletedCount} produits importés par CSV ont été supprimés avec succès !`);
    } else {
      showToast('Aucun produit importé par CSV à supprimer.');
    }
  };

  const handleSyncGoogleSheet = async () => {
    if (!sheetUrlInput.trim()) {
      showToast("Veuillez saisir l'URL CSV publiée de votre Google Sheet.", 'error');
      return;
    }
    setIsSyncingSheet(true);
    try {
      let url = sheetUrlInput.trim();
      if (url.includes('docs.google.com/spreadsheets') && !url.includes('output=csv') && !url.includes('/export?format=csv')) {
        if (url.includes('/edit')) {
          url = url.replace(/\/edit.*$/, '/export?format=csv');
        } else {
          url = url + '/export?format=csv';
        }
      }
      const res = await fetch(url);
      if (!res.ok) throw new Error('Impossible de charger la feuille Google Sheets');
      const csvText = await res.text();
      const count = store.importProductsCSV(csvText);
      if (count > 0) {
        store.updateGoogleSheetConfig({ sheetUrl: sheetUrlInput, lastSynced: new Date().toLocaleTimeString('fr-FR'), status: 'CONNECTED' });
        showToast(`Google Sheets synchronisé ! ${count} produits ajoutés.`, 'success');
      } else {
        showToast("Format Google Sheet non reconnu ou vide.", 'error');
      }
    } catch (e: any) {
      showToast("Erreur de connexion Google Sheets: " + (e.message || 'Format invalide'), 'error');
    } finally {
      setIsSyncingSheet(false);
    }
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const saved = localStorage.getItem('admin-theme');
    setAdminDarkMode(saved !== 'light'); // dark by default
  }, []);

  const toggleAdminTheme = () => {
    const newDarkState = !adminDarkMode;
    setAdminDarkMode(newDarkState);
    localStorage.setItem('admin-theme', newDarkState ? 'dark' : 'light');
  };

  useEffect(() => { 
    setMounted(true); 
    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
      setSidebarCollapsed(true);
    }
  }, []);

  // Auth guard
  useEffect(() => {
    if (mounted && (!store.user || store.user.role !== 'ADMIN')) {
      router.push('/auth/login');
    }
  }, [store.user, mounted, router]);


  // Aggregated Real-Time System Alerts
  const liveChatAlerts = (store.supportConversations || [])
    .filter(c => c.status === 'PENDING_AGENT')
    .map(c => ({
      id: `chat-${c.id}`,
      type: 'SUPPORT' as const,
      urgent: true,
      icon: '🚨',
      title: `Demande Conseiller : ${c.customerName || 'Visiteur'}`,
      desc: c.topic || 'Client demandant une assistance personnalisée',
      time: c.lastUpdated || c.createdAt || 'En attente',
      targetTab: 'supportChat' as Tab,
      targetId: c.id,
      actionLabel: 'Répondre en direct'
    }));

  const outOfStockAlerts = (store.products || [])
    .filter(p => (p.stock ?? 0) === 0)
    .map(p => ({
      id: `stock-out-${p.id}`,
      type: 'STOCK_OUT' as const,
      urgent: true,
      icon: '🔴',
      title: `Rupture totale : ${p.name_fr}`,
      desc: `Cet article est épuisé (0 stock). Les clients ne peuvent plus le commander.`,
      time: 'Immédiat',
      targetTab: 'products' as Tab,
      targetId: p.id,
      productObj: p,
      actionLabel: 'Réapprovisionner'
    }));

  const lowStockAlerts = (store.products || [])
    .filter(p => (p.stock ?? 0) > 0 && (p.stock ?? 0) < 5)
    .map(p => ({
      id: `stock-low-${p.id}`,
      type: 'STOCK_LOW' as const,
      urgent: false,
      icon: '⚠️',
      title: `Stock critique (${p.stock} restant${p.stock > 1 ? 's' : ''}) : ${p.name_fr}`,
      desc: `Risque de rupture imminente sur cet article populaire.`,
      time: 'À surveiller',
      targetTab: 'products' as Tab,
      targetId: p.id,
      productObj: p,
      actionLabel: '+10 Stock rapide'
    }));

  const pendingOrderAlerts = (store.orders || [])
    .filter(o => o.status === 'PENDING')
    .map(o => ({
      id: `order-${o.id}`,
      type: 'ORDER' as const,
      urgent: false,
      icon: '📦',
      title: `Nouvelle commande #${o.orderNumber || o.id.slice(-6).toUpperCase()}`,
      desc: `${o.shippingAddress?.fullName || o.customerEmail || 'Client'} • Montant : ${formatPrice(o.total, store.currency)}`,
      time: o.date || 'En attente',
      targetTab: 'orders' as Tab,
      targetId: o.id,
      actionLabel: 'Voir la commande'
    }));

  const pendingExpenseAlerts = (store.expenses || [])
    .filter(e => e.status === 'PENDING')
    .map(e => ({
      id: `exp-${e.id}`,
      type: 'EXPENSE' as const,
      urgent: false,
      icon: '💸',
      title: `Dépense à régler : ${e.title}`,
      desc: `${formatPrice(e.amount, store.currency)} (${e.category}) • Échéance : ${e.date}`,
      time: e.date,
      targetTab: 'accounting' as Tab,
      targetId: e.id,
      actionLabel: 'Régler la dépense'
    }));

  const allSystemAlerts = [
    ...liveChatAlerts,
    ...outOfStockAlerts,
    ...lowStockAlerts,
    ...pendingOrderAlerts,
    ...pendingExpenseAlerts
  ];

  const urgentAlertsCount = allSystemAlerts.filter(a => a.urgent).length;

  // Sidebar badge helper
  const getNavItemBadge = (itemId: Tab) => {
    if (itemId === 'supportChat') {
      const count = liveChatAlerts.length;
      return count > 0 ? { count, color: '#ef4444', pulse: true } : null;
    }
    if (itemId === 'products') {
      const count = outOfStockAlerts.length + lowStockAlerts.length;
      return count > 0 ? { count, color: outOfStockAlerts.length > 0 ? '#ef4444' : '#f59e0b', pulse: outOfStockAlerts.length > 0 } : null;
    }
    if (itemId === 'orders') {
      const count = pendingOrderAlerts.length;
      return count > 0 ? { count, color: '#0284c7', pulse: false } : null;
    }
    if (itemId === 'accounting') {
      const count = pendingExpenseAlerts.length;
      return count > 0 ? { count, color: '#d97706', pulse: false } : null;
    }
    if (itemId === 'analytics') {
      const live = analyticsData.liveVisitors;
      return live > 0 ? { count: `${live} live`, color: '#10b981', pulse: true } : null;
    }
    return null;
  };

  if (!mounted || !store.user || store.user.role !== 'ADMIN') {
    return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#0a0a0a', color: '#fff', fontFamily: 'var(--font-plus-jakarta)' }}>
      <span style={{ fontSize: 18, fontWeight: 700 }}>Chargement...</span>
    </div>;
  }

  // ======= HELPER FUNCTIONS =======
  const genId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const totalRevenue = store.orders.reduce((s, o) => s + o.total, 0);
  const pendingOrders = store.orders.filter(o => o.status === 'PENDING').length;
  const lowStockProducts = store.products.filter(p => (p.stock ?? 99) < 5).length;
  const monthlyData = [
    { label: 'Jan', value: Math.round(totalRevenue * 0.06) },
    { label: 'Fév', value: Math.round(totalRevenue * 0.08) },
    { label: 'Mar', value: Math.round(totalRevenue * 0.12) },
    { label: 'Avr', value: Math.round(totalRevenue * 0.09) },
    { label: 'Mai', value: Math.round(totalRevenue * 0.15) },
    { label: 'Jun', value: Math.round(totalRevenue * 0.11) },
    { label: 'Jul', value: Math.round(totalRevenue * 0.14) },
    { label: 'Aoû', value: Math.round(totalRevenue * 0.25) },
  ];
  const maxMonthVal = Math.max(...monthlyData.map(d => d.value), 1);

  const filteredOrders = store.orders.filter(o => orderFilter === 'ALL' || o.status === orderFilter);
  const filteredProducts = store.products.filter(p => p.name_fr.toLowerCase().includes(search.toLowerCase()));

  // ======= RENDER HELPERS =======
  const Badge = ({ status }: { status: string }) => {
    const cls = status === 'PENDING' ? 'pending' : status === 'SHIPPED' ? 'shipped' : status === 'DELIVERED' ? 'delivered' : status === 'RECEIVED' ? 'received' : status === 'CANCELLED' ? 'cancelled' : status === 'ACTIVE' ? 'active' : 'inactive';
    const labels: Record<string, string> = { PENDING: '⏳ En attente', SHIPPED: '📦 Expédiée', DELIVERED: '✅ Livrée', RECEIVED: '✅ Reçu', CANCELLED: '❌ Annulé', ACTIVE: '🟢 Actif', INACTIVE: '⚪ Inactif' };
    return <span className={`admin-badge ${cls}`}>{labels[status] || status}</span>;
  };

  const EmptyState = ({ icon, text }: { icon: string; text: string }) => (
    <div className="admin-empty-state"><div className="admin-empty-state-icon">{icon}</div><div className="admin-empty-state-text">{text}</div></div>
  );

  // ======= MODAL FORMS =======
  const renderModal = () => {
    if (!modal) return null;

    const close = () => setModal(null);

    const handleAddProduct = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const nameVal = fd.get('name') as string;
      const sortedSizes = [...selectedSizes].sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });

      const locPrices: Record<string, number> = {};
      const locCompPrices: Record<string, number> = {};

      const beninP = parseFloat(fd.get('locationPrice_benin') as string);
      if (!isNaN(beninP) && beninP > 0) locPrices.benin = beninP;
      const beninC = parseFloat(fd.get('locationComparePrice_benin') as string);
      if (!isNaN(beninC) && beninC > 0) locCompPrices.benin = beninC;

      const franceP = parseFloat(fd.get('locationPrice_france') as string);
      if (!isNaN(franceP) && franceP > 0) locPrices.france = franceP;
      const franceC = parseFloat(fd.get('locationComparePrice_france') as string);
      if (!isNaN(franceC) && franceC > 0) locCompPrices.france = franceC;

      const belgiqueP = parseFloat(fd.get('locationPrice_belgique') as string);
      if (!isNaN(belgiqueP) && belgiqueP > 0) locPrices.belgique = belgiqueP;
      const belgiqueC = parseFloat(fd.get('locationComparePrice_belgique') as string);
      if (!isNaN(belgiqueC) && belgiqueC > 0) locCompPrices.belgique = belgiqueC;

      const p: Product = {
        id: genId(), 
        name_fr: nameVal, 
        name_en: nameVal, 
        name_es: nameVal,
        slug: nameVal.toLowerCase().replace(/\s+/g, '-'),
        brand: fd.get('brand') as string,
        price: parseFloat(fd.get('price') as string), 
        comparePrice: parseFloat(fd.get('originalPrice') as string) || undefined,
        category: fd.get('category') as string, 
        images: [fd.get('image') as string || '/images/placeholder.jpg'],
        description_fr: fd.get('description') as string || '', 
        description_en: '', 
        description_es: '',
        rating: 5, 
        reviewCount: 0,
        isNew: true, 
        isFeatured: false, 
        badge: 'NEW', 
        stock: parseInt(fd.get('stock') as string) || 50,
        sizes: sortedSizes.length > 0 ? sortedSizes : undefined,
        colors: selectedColors.length > 0 ? selectedColors : undefined,
        locationPrices: Object.keys(locPrices).length > 0 ? locPrices : undefined,
        locationComparePrices: Object.keys(locCompPrices).length > 0 ? locCompPrices : undefined,
      };
      store.addProduct(p);
      showToast('Produit ajouté avec ses prix localisés par pays !');
      close();

      const activeSubCount = (store.marketingSubscribers || []).filter(s => s.active).length;
      if (activeSubCount > 0) {
        showConfirmDialog({
          title: '🔥 Diffuser ce nouveau produit ?',
          message: `Voulez-vous avertir immédiatement vos ${activeSubCount} abonnés par WhatsApp & Email du drop de "${p.name_fr}" ?`,
          icon: '📣',
          type: 'info',
          confirmLabel: 'Oui, ouvrir Marketing Studio',
          cancelLabel: 'Plus tard',
          onConfirm: () => {
            setSelectedBroadcastProductId(p.id);
            setTab('marketing');
          }
        });
      }
    };

    const handleEditProduct = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingProduct) return;
      const fd = new FormData(e.currentTarget);
      const nameVal = fd.get('name') as string;
      const sortedSizes = [...selectedSizes].sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        if (!isNaN(numA) && !isNaN(numB)) return numA - numB;
        return a.localeCompare(b);
      });

      const locPrices: Record<string, number> = {};
      const locCompPrices: Record<string, number> = {};

      const beninP = parseFloat(fd.get('locationPrice_benin') as string);
      if (!isNaN(beninP) && beninP > 0) locPrices.benin = beninP;
      const beninC = parseFloat(fd.get('locationComparePrice_benin') as string);
      if (!isNaN(beninC) && beninC > 0) locCompPrices.benin = beninC;

      const franceP = parseFloat(fd.get('locationPrice_france') as string);
      if (!isNaN(franceP) && franceP > 0) locPrices.france = franceP;
      const franceC = parseFloat(fd.get('locationComparePrice_france') as string);
      if (!isNaN(franceC) && franceC > 0) locCompPrices.france = franceC;

      const belgiqueP = parseFloat(fd.get('locationPrice_belgique') as string);
      if (!isNaN(belgiqueP) && belgiqueP > 0) locPrices.belgique = belgiqueP;
      const belgiqueC = parseFloat(fd.get('locationComparePrice_belgique') as string);
      if (!isNaN(belgiqueC) && belgiqueC > 0) locCompPrices.belgique = belgiqueC;

      store.updateProduct(editingProduct.id, {
        name_fr: nameVal,
        name_en: nameVal,
        name_es: nameVal,
        brand: fd.get('brand') as string,
        price: parseFloat(fd.get('price') as string),
        comparePrice: parseFloat(fd.get('originalPrice') as string) || undefined,
        category: fd.get('category') as string,
        stock: parseInt(fd.get('stock') as string) || 0,
        images: [fd.get('image') as string || editingProduct.images[0]],
        description_fr: fd.get('description') as string || '',
        sizes: sortedSizes.length > 0 ? sortedSizes : undefined,
        colors: selectedColors.length > 0 ? selectedColors : undefined,
        locationPrices: Object.keys(locPrices).length > 0 ? locPrices : undefined,
        locationComparePrices: Object.keys(locCompPrices).length > 0 ? locCompPrices : undefined,
      });
      showToast('Produit et tarifs par pays mis à jour avec succès !');
      close();
    };

    const handleAddCategory = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const name = fd.get('name') as string;
      const cat: DynamicCategory = { 
        id: genId(), 
        name: name, 
        slug: (fd.get('slug') as string) || name.toLowerCase().replace(/\s+/g, '-'), 
        icon: (fd.get('icon') as string) || '📁',
        description: (fd.get('description') as string) || '',
        image: (fd.get('image') as string) || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop',
        subCategories: []
      };
      store.addDynamicCategory(cat);
      showToast('Catégorie principale créée !');
      close();
    };

    const handleAddSubCategory = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const parentId = (fd.get('parentId') as string) || selectedParentCatForSub;
      const name = fd.get('name') as string;
      if (!parentId || !name) return;

      const sub: SubCategory = {
        id: genId(),
        name: name,
        slug: (fd.get('slug') as string) || name.toLowerCase().replace(/\s+/g, '-'),
        productCount: 0
      };
      store.addSubCategory(parentId, sub);
      showToast(`Sous-catégorie "${name}" ajoutée !`);
      close();
    };

    const handleAddClient = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const c: Client = { id: genId(), name: fd.get('name') as string, email: fd.get('email') as string, phone: fd.get('phone') as string, totalOrders: 0, totalSpent: 0, registeredDate: new Date().toISOString().split('T')[0] };
      store.addClient(c);
      showToast('Client ajouté !');
      close();
    };

    const handleAddSupplier = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const s: Supplier = { id: genId(), name: fd.get('name') as string, email: fd.get('email') as string, phone: fd.get('phone') as string, company: fd.get('company') as string, address: fd.get('address') as string };
      store.addSupplier(s);
      showToast('Fournisseur ajouté !');
      close();
    };

    const handleAddSupplyOrder = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const so: SupplyOrder = { id: genId(), supplierId: fd.get('supplierId') as string, date: new Date().toISOString().split('T')[0], items: [{ productName: fd.get('productName') as string, quantity: parseInt(fd.get('quantity') as string), unitCost: parseFloat(fd.get('unitCost') as string) }], totalCost: parseInt(fd.get('quantity') as string) * parseFloat(fd.get('unitCost') as string), status: 'PENDING' };
      store.addSupplyOrder(so);
      showToast('Approvisionnement créé !');
      close();
    };

    const handleAddEmployee = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const emp: Employee = { id: genId(), name: fd.get('name') as string, email: fd.get('email') as string, phone: fd.get('phone') as string, role: fd.get('role') as string, salary: parseFloat(fd.get('salary') as string), startDate: new Date().toISOString().split('T')[0], status: 'ACTIVE' };
      store.addEmployee(emp);
      showToast('Employé ajouté !');
      close();
    };

    const handlePayEmployee = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const p: EmployeePayment = { id: genId(), employeeId: fd.get('employeeId') as string, amount: parseFloat(fd.get('amount') as string), date: new Date().toISOString().split('T')[0], period: fd.get('period') as string, method: fd.get('method') as 'CASH' | 'TRANSFER' | 'MOBILE' };
      store.addEmployeePayment(p);
      showToast('Paiement enregistré !');
      close();
    };

    const handleAddZone = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const z: DeliveryZone = { id: genId(), name: fd.get('name') as string, fee: parseFloat(fd.get('fee') as string), estimatedDays: fd.get('days') as string };
      store.addDeliveryZone(z);
      showToast('Zone ajoutée !');
      close();
    };

    const handleAddPromo = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const targetSelection = (fd.get('targetClient') as string) || 'ALL';
      const customEmail = (fd.get('customEmail') as string || '').trim().toLowerCase();
      const finalTarget = targetSelection === 'CUSTOM' ? (customEmail || 'ALL') : targetSelection;
      const description = fd.get('description') as string;
      const notifyClients = fd.get('notifyClients') === 'on';
      const customMessage = fd.get('customMessage') as string;

      let targetClientName = undefined;
      if (finalTarget !== 'ALL') {
        const foundClient = allKnownClients.find(c => c.email.toLowerCase() === finalTarget.toLowerCase());
        targetClientName = foundClient ? foundClient.name : finalTarget;
      }

      const p: PromoCode = {
        code: (fd.get('code') as string).toUpperCase().trim(),
        type: fd.get('type') as 'percent' | 'fixed',
        value: parseFloat(fd.get('value') as string),
        target: finalTarget,
        targetClientName: targetClientName,
        description: description
      };

      store.addPromoCode(p, notifyClients, customMessage);
      showToast('Code promo ' + p.code + ' enregistré pour ' + (finalTarget === 'ALL' ? 'tous les clients' : targetClientName) + ' !');
      close();
    };

    const handleSendBroadcastNotif = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const targetSelection = (fd.get('targetClient') as string) || 'ALL';
      const customEmail = (fd.get('customEmail') as string || '').trim().toLowerCase();
      const finalTarget = targetSelection === 'CUSTOM' ? (customEmail || 'ALL') : targetSelection;
      const title = fd.get('title') as string;
      const message = fd.get('message') as string;
      const promoCode = fd.get('promoCode') as string;

      let targetName = 'Tous les clients';
      if (finalTarget !== 'ALL') {
        const foundClient = allKnownClients.find(c => c.email.toLowerCase() === finalTarget.toLowerCase());
        targetName = foundClient ? foundClient.name : finalTarget;
      }

      store.addNotification({
        targetEmail: finalTarget,
        targetName: targetName,
        title: title || '📢 Offre Spéciale Aymard Store',
        message: message,
        type: 'PROMO',
        promoCode: promoCode ? promoCode.toUpperCase().trim() : undefined
      });

      showToast(`Notification diffusée à ${targetName} !`);
      close();
    };

    const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const fd = new FormData(e.currentTarget);
      const title = (fd.get('title') as string) || 'Dépense opérationnelle';
      const category = (fd.get('category') as ExpenseCategory) || 'OTHER';
      const rawAmount = parseFloat(fd.get('amount') as string) || 0;
      const currency = (fd.get('currency') as 'EUR' | 'FCFA') || 'EUR';
      const date = (fd.get('date') as string) || new Date().toISOString().split('T')[0];
      const paymentMethod = (fd.get('paymentMethod') as any) || 'TRANSFER';
      const status = (fd.get('status') as any) || 'PAID';
      const receiptNumber = (fd.get('receiptNumber') as string) || '';
      const notes = (fd.get('notes') as string) || '';

      const amountEur = currency === 'FCFA' ? Math.round((rawAmount / (store.exchangeRate || 655.957)) * 100) / 100 : rawAmount;
      const amountFcfa = currency === 'FCFA' ? rawAmount : Math.round(rawAmount * (store.exchangeRate || 655.957));

      const newExpense: Expense = {
        id: `exp-${Date.now()}`,
        title,
        category,
        amount: amountEur,
        amountFcfa,
        currency,
        date,
        paymentMethod,
        status,
        receiptNumber,
        notes
      };

      store.addExpense(newExpense);
      showToast(`Dépense "${title}" enregistrée en comptabilité !`);
      close();
    };

    const handleEditExpense = (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      if (!editingExpense) return;
      const fd = new FormData(e.currentTarget);
      const title = (fd.get('title') as string) || editingExpense.title;
      const category = (fd.get('category') as ExpenseCategory) || editingExpense.category;
      const rawAmount = parseFloat(fd.get('amount') as string) || editingExpense.amount;
      const currency = (fd.get('currency') as 'EUR' | 'FCFA') || editingExpense.currency;
      const date = (fd.get('date') as string) || editingExpense.date;
      const paymentMethod = (fd.get('paymentMethod') as any) || editingExpense.paymentMethod;
      const status = (fd.get('status') as any) || editingExpense.status;
      const receiptNumber = (fd.get('receiptNumber') as string) || '';
      const notes = (fd.get('notes') as string) || '';

      const amountEur = currency === 'FCFA' ? Math.round((rawAmount / (store.exchangeRate || 655.957)) * 100) / 100 : rawAmount;
      const amountFcfa = currency === 'FCFA' ? rawAmount : Math.round(rawAmount * (store.exchangeRate || 655.957));

      store.updateExpense(editingExpense.id, {
        title,
        category,
        amount: amountEur,
        amountFcfa,
        currency,
        date,
        paymentMethod,
        status,
        receiptNumber,
        notes
      });

      showToast(`Dépense "${title}" mise à jour !`);
      setEditingExpense(null);
      close();
    };

    const titles: Record<string, string> = {
      addProduct: '📦 Ajouter un nouveau produit', 
      editProduct: '✏️ Modifier le produit, pointures & couleurs',
      addCategory: '🏷️ Nouvelle catégorie principale', 
      addSubCategory: '🌿 Nouvelle sous-catégorie', 
      addClient: '👥 Nouveau client',
      addSupplier: '🏭 Nouveau fournisseur', 
      addSupplyOrder: '📥 Nouvel approvisionnement', 
      addEmployee: '👔 Nouvel employé',
      payEmployee: '💳 Payer un employé', 
      addDeliveryZone: '🚚 Nouvelle zone', 
      addPromo: '🎟️ Nouveau code promo',
      addExpense: '💰 Enregistrer une nouvelle dépense / charge',
      editExpense: '✏️ Modifier la dépense',
    };

    return (
      <div className="admin-modal-overlay" onClick={close} role="presentation">
        <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="admin-modal-title" style={{ maxWidth: '640px', maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
          <div className="admin-modal-title" id="admin-modal-title">{titles[modal]}</div>

          {modal === 'addProduct' && (
            <form onSubmit={handleAddProduct}>
              <div className="admin-form-grid">
                <div><label className="admin-label">Nom du produit</label><input name="name" className="admin-input" required placeholder="ex: Nike Dunk Low Retro" /></div>
                <div><label className="admin-label">Marque</label><input name="brand" className="admin-input" required placeholder="ex: Nike, Adidas, Jacquemus" /></div>
                <div><label className="admin-label">Prix de référence base (€)</label><input name="price" type="number" step="0.01" className="admin-input" required placeholder="129.90" /></div>
                <div><label className="admin-label">Prix barré / Comparatif (€)</label><input name="originalPrice" type="number" step="0.01" className="admin-input" placeholder="159.00 (facultatif)" /></div>
                
                {/* TARIFS SPÉCIFIQUES PAR PAYS */}
                <div style={{ gridColumn: '1 / -1', background: 'var(--adm-card-border)', padding: '16px', borderRadius: '16px', border: '1px solid var(--adm-card-border)' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label className="admin-label" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                      🌍 Tarifs Personnalisés par Pays (Bénin, France, Belgique)
                    </label>
                    <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: 2 }}>
                      Fixez les montants exacts pour chaque pays, ou laissez vide pour une conversion automatique.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    {/* Bénin */}
                    <div style={{ background: 'var(--adm-card-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--adm-card-border)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🇧🇯</span> <span>Bénin (FCFA)</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input name="locationPrice_benin" type="number" step="1" className="admin-input" placeholder="Prix Bénin FCFA (ex: 65000)" style={{ fontSize: '12px', padding: '8px 10px' }} />
                        <input name="locationComparePrice_benin" type="number" step="1" className="admin-input" placeholder="Prix barré FCFA (ex: 85000)" style={{ fontSize: '11px', padding: '6px 10px' }} />
                      </div>
                    </div>

                    {/* France */}
                    <div style={{ background: 'var(--adm-card-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--adm-card-border)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🇫🇷</span> <span>France (€)</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input name="locationPrice_france" type="number" step="0.01" className="admin-input" placeholder="Prix France € (ex: 120)" style={{ fontSize: '12px', padding: '8px 10px' }} />
                        <input name="locationComparePrice_france" type="number" step="0.01" className="admin-input" placeholder="Prix barré € (ex: 140)" style={{ fontSize: '11px', padding: '6px 10px' }} />
                      </div>
                    </div>

                    {/* Belgique */}
                    <div style={{ background: 'var(--adm-card-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--adm-card-border)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🇧🇪</span> <span>Belgique (€)</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input name="locationPrice_belgique" type="number" step="0.01" className="admin-input" placeholder="Prix Belgique € (ex: 125)" style={{ fontSize: '12px', padding: '8px 10px' }} />
                        <input name="locationComparePrice_belgique" type="number" step="0.01" className="admin-input" placeholder="Prix barré € (ex: 145)" style={{ fontSize: '11px', padding: '6px 10px' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="admin-label">Catégorie (Rayon)</label>
                  <select name="category" className="admin-select" required>
                    <option value="shoes">👟 Chaussures & Sneakers</option>
                    <option value="clothing">👕 Vêtements & Prêt-à-porter</option>
                    <option value="bags">👜 Sacs & Maroquinerie</option>
                    <option value="jewelry">💍 Bijoux & Joaillerie</option>
                    <option value="watches">⌚ Montres & Horlogerie</option>
                    <option value="accessories">🕶️ Accessoires de Mode</option>
                    <option value="hats">🧢 Chapeaux & Casquettes</option>
                    <option value="socks">🧦 Chaussettes</option>
                    <option value="necklaces">📿 Colliers & Pendentifs</option>
                    {store.dynamicCategories.filter(c => !['shoes','clothing','bags','jewelry','watches','accessories','hats','socks','necklaces'].includes(c.slug)).map(c => (
                      <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div><label className="admin-label">Stock disponible</label><input name="stock" type="number" className="admin-input" defaultValue="50" /></div>
                
                {/* SÉLECTEUR MULTI-VARIANTES (Vêtements, Chaussures, Volumes, Montres, Taille unique) */}
                <div style={{ gridColumn: '1 / -1', background: 'var(--adm-card-border)', padding: '18px', borderRadius: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <label className="admin-label" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                        📏 Variantes & Formats ({selectedSizes.length} sélectionnée{selectedSizes.length > 1 ? 's' : ''})
                      </label>
                      <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: 2 }}>
                        Tailles vêtements, pointures chaussures, volumes cosmétiques/parfums, montres...
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedSizes([])}
                        style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ❌ Effacer tout
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Vêtements */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#8b5cf6', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>👕</span> <span>VÊTEMENTS (Pulls, Sweats, T-shirts, Hoodies, Pantalons, Shorts) :</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {CLOTHING_SIZES.map(cs => {
                          const isChecked = selectedSizes.includes(cs);
                          return (
                            <button
                              key={cs}
                              type="button"
                              onClick={() => {
                                setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== cs) : [...selectedSizes, cs]);
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '10px',
                                border: isChecked ? '2px solid #8b5cf6' : '1px solid var(--adm-card-border)',
                                background: isChecked ? '#8b5cf6' : 'var(--adm-card-bg)',
                                color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: isChecked ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none'
                              }}
                            >
                              {isChecked ? `✓ ${cs}` : cs}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setSelectedSizes(CLOTHING_SIZES)}
                          style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '10px', border: '1px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', cursor: 'pointer', fontWeight: 700 }}
                        >
                          + Tous les Vêtements
                        </button>
                      </div>
                    </div>

                    {/* Chaussures */}
                    <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>👟</span> <span>CHAUSSURES & SNEAKERS (Pointures EU) :</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {SHOE_SIZES.map(ss => {
                          const isChecked = selectedSizes.includes(ss);
                          return (
                            <button
                              key={ss}
                              type="button"
                              onClick={() => {
                                setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== ss) : [...selectedSizes, ss]);
                              }}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '10px',
                                border: isChecked ? '2px solid #0284c7' : '1px solid var(--adm-card-border)',
                                background: isChecked ? '#0284c7' : 'var(--adm-card-bg)',
                                color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: isChecked ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none'
                              }}
                            >
                              {isChecked ? `✓ ${ss}` : ss}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setSelectedSizes(['39 EU', '40 EU', '41 EU', '42 EU', '43 EU', '44 EU', '45 EU'])}
                          style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '10px', border: '1px solid #0284c7', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', cursor: 'pointer', fontWeight: 700 }}
                        >
                          + Standards (39-45)
                        </button>
                      </div>
                    </div>

                    {/* Volumes Parfums & Cosmétiques */}
                    <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>🧴</span> <span>PARFUMS, FLACONS & BEAUTÉ (Volumes ml / Litres) :</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {VOLUME_SIZES.map(vs => {
                          const isChecked = selectedSizes.includes(vs);
                          return (
                            <button
                              key={vs}
                              type="button"
                              onClick={() => {
                                setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== vs) : [...selectedSizes, vs]);
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '10px',
                                border: isChecked ? '2px solid #10b981' : '1px solid var(--adm-card-border)',
                                background: isChecked ? '#10b981' : 'var(--adm-card-bg)',
                                color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: isChecked ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
                              }}
                            >
                              {isChecked ? `✓ ${vs}` : vs}
                            </button>
                          );
                        })}
                      </div>
                    </div>


                    {/* Taille Unique */}
                    <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>🎒</span> <span>SACS, CASQUETTES & FORMATS STANDARDS :</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {UNIQUE_SIZES.map(us => {
                          const isChecked = selectedSizes.includes(us);
                          return (
                            <button
                              key={us}
                              type="button"
                              onClick={() => {
                                setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== us) : [...selectedSizes, us]);
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '10px',
                                border: isChecked ? '2px solid #64748b' : '1px solid var(--adm-card-border)',
                                background: isChecked ? '#64748b' : 'var(--adm-card-bg)',
                                color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              {isChecked ? `✓ ${us}` : us}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SÉLECTEUR DE COULEURS ÉLÉGANT */}
                <div style={{ gridColumn: '1 / -1', background: 'var(--adm-card-border)', padding: '16px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <label className="admin-label" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                        🎨 Couleurs Disponibles ({selectedColors.length} sélectionnée{selectedColors.length > 1 ? 's' : ''})
                      </label>
                      <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: 2 }}>
                        Cochez les teintes disponibles
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedColors([])}
                      style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                    >
                      ❌ Effacer
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {PRESET_COLORS.map(col => {
                      const isChecked = selectedColors.includes(col.name);
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedColors(selectedColors.filter(c => c !== col.name));
                            } else {
                              setSelectedColors([...selectedColors, col.name]);
                            }
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '20px',
                            border: isChecked ? '2px solid #0284c7' : '1px solid var(--adm-card-border)',
                            background: isChecked ? 'rgba(2, 132, 199, 0.12)' : 'var(--adm-card-bg)',
                            color: 'var(--adm-text-h)',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: isChecked ? '0 2px 8px rgba(2, 132, 199, 0.2)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: col.hex, border: `1px solid ${col.border}` }} />
                          <span>{col.name}</span>
                          {isChecked && <span style={{ color: '#0284c7' }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Ajout couleur personnalisée */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Ajouter une autre couleur (ex: Coral Velvet, Kaki, Doré...)"
                      value={customColorInput}
                      onChange={e => setCustomColorInput(e.target.value)}
                      className="admin-input"
                      style={{ flex: 1, borderRadius: '12px', padding: '8px 14px', fontSize: '12px' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customColorInput.trim() && !selectedColors.includes(customColorInput.trim())) {
                            setSelectedColors([...selectedColors, customColorInput.trim()]);
                            setCustomColorInput('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customColorInput.trim() && !selectedColors.includes(customColorInput.trim())) {
                          setSelectedColors([...selectedColors, customColorInput.trim()]);
                          setCustomColorInput('');
                        }
                      }}
                      className="admin-btn admin-btn-outline"
                      style={{ borderRadius: '12px', padding: '8px 16px', fontSize: '12px', fontWeight: 700 }}
                    >
                      + Ajouter
                    </button>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}><label className="admin-label">URL de l&apos;Image</label><input name="image" className="admin-input" placeholder="https://cdn.shopify.com/... ou /france_jersey_hero.jpg" /></div>
                <div style={{ gridColumn: '1 / -1' }}><label className="admin-label">Description du produit</label><textarea name="description" className="admin-textarea" placeholder="Description détaillée du produit..." /></div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
                <button type="submit" className="admin-btn admin-btn-primary">Ajouter le produit</button>
              </div>
            </form>
          )}

          {/* EDIT PRODUCT MODAL */}
          {modal === 'editProduct' && editingProduct && (
            <form onSubmit={handleEditProduct}>
              <div className="admin-form-grid">
                <div><label className="admin-label">Nom du produit</label><input name="name" className="admin-input" defaultValue={editingProduct.name_fr} required /></div>
                <div><label className="admin-label">Marque</label><input name="brand" className="admin-input" defaultValue={editingProduct.brand || 'Aymard Store'} required /></div>
                <div><label className="admin-label">Prix de référence base (€)</label><input name="price" type="number" step="0.01" className="admin-input" defaultValue={editingProduct.price} required /></div>
                <div><label className="admin-label">Prix barré / Comparatif (€)</label><input name="originalPrice" type="number" step="0.01" className="admin-input" defaultValue={editingProduct.comparePrice || ''} /></div>
                
                {/* TARIFS SPÉCIFIQUES PAR PAYS */}
                <div style={{ gridColumn: '1 / -1', background: 'var(--adm-card-border)', padding: '16px', borderRadius: '16px', border: '1px solid var(--adm-card-border)' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <label className="admin-label" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                      🌍 Tarifs Personnalisés par Pays (Bénin, France, Belgique)
                    </label>
                    <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: 2 }}>
                      Fixez les montants exacts pour chaque pays, ou laissez vide pour une conversion automatique.
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    {/* Bénin */}
                    <div style={{ background: 'var(--adm-card-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--adm-card-border)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🇧🇯</span> <span>Bénin (FCFA)</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input name="locationPrice_benin" type="number" step="1" className="admin-input" placeholder="Prix Bénin FCFA (ex: 65000)" defaultValue={editingProduct?.locationPrices?.benin || ''} style={{ fontSize: '12px', padding: '8px 10px' }} />
                        <input name="locationComparePrice_benin" type="number" step="1" className="admin-input" placeholder="Prix barré FCFA (ex: 85000)" defaultValue={editingProduct?.locationComparePrices?.benin || ''} style={{ fontSize: '11px', padding: '6px 10px' }} />
                      </div>
                    </div>

                    {/* France */}
                    <div style={{ background: 'var(--adm-card-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--adm-card-border)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🇫🇷</span> <span>France (€)</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input name="locationPrice_france" type="number" step="0.01" className="admin-input" placeholder="Prix France € (ex: 120)" defaultValue={editingProduct?.locationPrices?.france || ''} style={{ fontSize: '12px', padding: '8px 10px' }} />
                        <input name="locationComparePrice_france" type="number" step="0.01" className="admin-input" placeholder="Prix barré € (ex: 140)" defaultValue={editingProduct?.locationComparePrices?.france || ''} style={{ fontSize: '11px', padding: '6px 10px' }} />
                      </div>
                    </div>

                    {/* Belgique */}
                    <div style={{ background: 'var(--adm-card-bg)', padding: '12px', borderRadius: '12px', border: '1px solid var(--adm-card-border)' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>🇧🇪</span> <span>Belgique (€)</span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input name="locationPrice_belgique" type="number" step="0.01" className="admin-input" placeholder="Prix Belgique € (ex: 125)" defaultValue={editingProduct?.locationPrices?.belgique || ''} style={{ fontSize: '12px', padding: '8px 10px' }} />
                        <input name="locationComparePrice_belgique" type="number" step="0.01" className="admin-input" placeholder="Prix barré € (ex: 145)" defaultValue={editingProduct?.locationComparePrices?.belgique || ''} style={{ fontSize: '11px', padding: '6px 10px' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="admin-label">Catégorie (Rayon)</label>
                  <select name="category" className="admin-select" defaultValue={editingProduct.category} required>
                    <option value="shoes">👟 Chaussures & Sneakers</option>
                    <option value="clothing">👕 Vêtements & Prêt-à-porter</option>
                    <option value="bags">👜 Sacs & Maroquinerie</option>
                    <option value="jewelry">💍 Bijoux & Joaillerie</option>
                    <option value="watches">⌚ Montres & Horlogerie</option>
                    <option value="accessories">🕶️ Accessoires de Mode</option>
                    <option value="hats">🧢 Chapeaux & Casquettes</option>
                    <option value="socks">🧦 Chaussettes</option>
                    <option value="necklaces">📿 Colliers & Pendentifs</option>
                    {store.dynamicCategories.filter(c => !['shoes','clothing','bags','jewelry','watches','accessories','hats','socks','necklaces'].includes(c.slug)).map(c => (
                      <option key={c.id} value={c.slug}>{c.icon} {c.name}</option>
                    ))}
                  </select>
                </div>
                <div><label className="admin-label">Stock disponible</label><input name="stock" type="number" className="admin-input" defaultValue={editingProduct.stock} /></div>
                
                {/* SÉLECTEUR MULTI-VARIANTES (Vêtements, Chaussures, Volumes, Montres, Taille unique) */}
                <div style={{ gridColumn: '1 / -1', background: 'var(--adm-card-border)', padding: '18px', borderRadius: '18px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <label className="admin-label" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                        📏 Variantes & Formats ({selectedSizes.length} sélectionnée{selectedSizes.length > 1 ? 's' : ''})
                      </label>
                      <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: 2 }}>
                        Tailles vêtements, pointures chaussures, volumes cosmétiques/parfums, montres...
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedSizes([])}
                        style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                      >
                        ❌ Effacer tout
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Vêtements */}
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#8b5cf6', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>👕</span> <span>VÊTEMENTS (Pulls, Sweats, T-shirts, Hoodies, Pantalons, Shorts) :</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {CLOTHING_SIZES.map(cs => {
                          const isChecked = selectedSizes.includes(cs);
                          return (
                            <button
                              key={cs}
                              type="button"
                              onClick={() => {
                                setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== cs) : [...selectedSizes, cs]);
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '10px',
                                border: isChecked ? '2px solid #8b5cf6' : '1px solid var(--adm-card-border)',
                                background: isChecked ? '#8b5cf6' : 'var(--adm-card-bg)',
                                color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: isChecked ? '0 2px 8px rgba(139, 92, 246, 0.3)' : 'none'
                              }}
                            >
                              {isChecked ? `✓ ${cs}` : cs}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setSelectedSizes(CLOTHING_SIZES)}
                          style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '10px', border: '1px solid #8b5cf6', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', cursor: 'pointer', fontWeight: 700 }}
                        >
                          + Tous les Vêtements
                        </button>
                      </div>
                    </div>

                    {/* Chaussures */}
                    <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>👟</span> <span>CHAUSSURES & SNEAKERS (Pointures EU) :</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {SHOE_SIZES.map(ss => {
                          const isChecked = selectedSizes.includes(ss);
                          return (
                            <button
                              key={ss}
                              type="button"
                              onClick={() => {
                                setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== ss) : [...selectedSizes, ss]);
                              }}
                              style={{
                                padding: '6px 10px',
                                borderRadius: '10px',
                                border: isChecked ? '2px solid #0284c7' : '1px solid var(--adm-card-border)',
                                background: isChecked ? '#0284c7' : 'var(--adm-card-bg)',
                                color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: isChecked ? '0 2px 8px rgba(2, 132, 199, 0.3)' : 'none'
                              }}
                            >
                              {isChecked ? `✓ ${ss}` : ss}
                            </button>
                          );
                        })}
                        <button
                          type="button"
                          onClick={() => setSelectedSizes(['39 EU', '40 EU', '41 EU', '42 EU', '43 EU', '44 EU', '45 EU'])}
                          style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '10px', border: '1px solid #0284c7', background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', cursor: 'pointer', fontWeight: 700 }}
                        >
                          + Standards (39-45)
                        </button>
                      </div>
                    </div>

                    {/* Volumes Parfums & Cosmétiques */}
                    <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>🧴</span> <span>PARFUMS, FLACONS & BEAUTÉ (Volumes ml / Litres) :</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {VOLUME_SIZES.map(vs => {
                          const isChecked = selectedSizes.includes(vs);
                          return (
                            <button
                              key={vs}
                              type="button"
                              onClick={() => {
                                setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== vs) : [...selectedSizes, vs]);
                              }}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '10px',
                                border: isChecked ? '2px solid #10b981' : '1px solid var(--adm-card-border)',
                                background: isChecked ? '#10b981' : 'var(--adm-card-bg)',
                                color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer',
                                boxShadow: isChecked ? '0 2px 8px rgba(16, 185, 129, 0.3)' : 'none'
                              }}
                            >
                              {isChecked ? `✓ ${vs}` : vs}
                            </button>
                          );
                        })}
                      </div>
                    </div>


                    {/* Taille Unique */}
                    <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '10px' }}>
                      <div style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span>🎒</span> <span>SACS, CASQUETTES & FORMATS STANDARDS :</span>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        {UNIQUE_SIZES.map(us => {
                          const isChecked = selectedSizes.includes(us);
                          return (
                            <button
                              key={us}
                              type="button"
                              onClick={() => {
                                setSelectedSizes(isChecked ? selectedSizes.filter(s => s !== us) : [...selectedSizes, us]);
                              }}
                              style={{
                                padding: '6px 14px',
                                borderRadius: '10px',
                                border: isChecked ? '2px solid #64748b' : '1px solid var(--adm-card-border)',
                                background: isChecked ? '#64748b' : 'var(--adm-card-bg)',
                                color: isChecked ? '#ffffff' : 'var(--adm-text-h)',
                                fontSize: '12px',
                                fontWeight: 800,
                                cursor: 'pointer'
                              }}
                            >
                              {isChecked ? `✓ ${us}` : us}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* SÉLECTEUR DE COULEURS ÉLÉGANT */}
                <div style={{ gridColumn: '1 / -1', background: 'var(--adm-card-border)', padding: '16px', borderRadius: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <label className="admin-label" style={{ margin: 0, fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                        🎨 Couleurs Disponibles ({selectedColors.length} sélectionnée{selectedColors.length > 1 ? 's' : ''})
                      </label>
                      <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: 2 }}>
                        Cochez les teintes disponibles
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedColors([])}
                      style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', color: '#ef4444', cursor: 'pointer', fontWeight: 700 }}
                    >
                      ❌ Effacer
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {PRESET_COLORS.map(col => {
                      const isChecked = selectedColors.includes(col.name);
                      return (
                        <button
                          key={col.name}
                          type="button"
                          onClick={() => {
                            if (isChecked) {
                              setSelectedColors(selectedColors.filter(c => c !== col.name));
                            } else {
                              setSelectedColors([...selectedColors, col.name]);
                            }
                          }}
                          style={{
                            padding: '8px 14px',
                            borderRadius: '20px',
                            border: isChecked ? '2px solid #0284c7' : '1px solid var(--adm-card-border)',
                            background: isChecked ? 'rgba(2, 132, 199, 0.12)' : 'var(--adm-card-bg)',
                            color: 'var(--adm-text-h)',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: isChecked ? '0 2px 8px rgba(2, 132, 199, 0.2)' : 'none',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: col.hex, border: `1px solid ${col.border}` }} />
                          <span>{col.name}</span>
                          {isChecked && <span style={{ color: '#0284c7' }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>

                  {/* Ajout couleur personnalisée */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                      type="text"
                      placeholder="Ajouter une autre couleur (ex: Coral Velvet, Kaki, Doré...)"
                      value={customColorInput}
                      onChange={e => setCustomColorInput(e.target.value)}
                      className="admin-input"
                      style={{ flex: 1, borderRadius: '12px', padding: '8px 14px', fontSize: '12px' }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (customColorInput.trim() && !selectedColors.includes(customColorInput.trim())) {
                            setSelectedColors([...selectedColors, customColorInput.trim()]);
                            setCustomColorInput('');
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (customColorInput.trim() && !selectedColors.includes(customColorInput.trim())) {
                          setSelectedColors([...selectedColors, customColorInput.trim()]);
                          setCustomColorInput('');
                        }
                      }}
                      className="admin-btn admin-btn-outline"
                      style={{ borderRadius: '12px', padding: '8px 16px', fontSize: '12px', fontWeight: 700 }}
                    >
                      + Ajouter
                    </button>
                  </div>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">URL de l&apos;Image principale</label>
                  <input name="image" className="admin-input" defaultValue={editingProduct.images[0]} />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Description du produit</label>
                  <textarea name="description" className="admin-textarea" defaultValue={editingProduct.description_fr} />
                </div>
              </div>
              <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
                <button type="submit" className="admin-btn admin-btn-primary">Enregistrer les modifications</button>
              </div>
            </form>
          )}

          {modal === 'addCategory' && (
            <form onSubmit={handleAddCategory}><div className="admin-form-grid">
              <div><label className="admin-label">Nom du Rayon</label><input name="name" className="admin-input" required placeholder="ex: Sneakerhead" /></div>
              <div><label className="admin-label">Slug URL</label><input name="slug" className="admin-input" placeholder="ex: sneakerhead" /></div>
              <div><label className="admin-label">Icône (emoji)</label><input name="icon" className="admin-input" placeholder="👟" defaultValue="📁" /></div>
              <div><label className="admin-label">URL Image de fond</label><input name="image" className="admin-input" placeholder="https://images.unsplash.com/..." /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="admin-label">Description</label><textarea name="description" className="admin-textarea" placeholder="Description pour le catalogue..." /></div>
            </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
              <button type="submit" className="admin-btn admin-btn-primary">Créer le Rayon</button>
            </div></form>
          )}

          {modal === 'addSubCategory' && (
            <form onSubmit={handleAddSubCategory}><div className="admin-form-grid">
              <div style={{ gridColumn: '1 / -1' }}><label className="admin-label">Catégorie Parent (Rayon)</label>
                <select name="parentId" className="admin-select" defaultValue={selectedParentCatForSub || ''} required>
                  <option value="">Sélectionner le rayon principal...</option>
                  {store.dynamicCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.icon} {c.name} (/{c.slug})</option>
                  ))}
                </select>
              </div>
              <div><label className="admin-label">Nom de la Sous-Catégorie</label><input name="name" className="admin-input" required placeholder="ex: Sneakers Hype" /></div>
              <div><label className="admin-label">Slug URL</label><input name="slug" className="admin-input" placeholder="ex: sneakers-hype" /></div>
            </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
              <button type="submit" className="admin-btn admin-btn-primary">Créer la Sous-Catégorie</button>
            </div></form>
          )}

          {modal === 'addClient' && (
            <form onSubmit={handleAddClient}><div className="admin-form-grid">
              <div><label className="admin-label">Nom complet</label><input name="name" className="admin-input" required /></div>
              <div><label className="admin-label">Email</label><input name="email" type="email" className="admin-input" required /></div>
              <div><label className="admin-label">Téléphone</label><input name="phone" className="admin-input" /></div>
            </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
              <button type="submit" className="admin-btn admin-btn-primary">Ajouter</button>
            </div></form>
          )}

          {modal === 'addSupplier' && (
            <form onSubmit={handleAddSupplier}><div className="admin-form-grid">
              <div><label className="admin-label">Nom</label><input name="name" className="admin-input" required /></div>
              <div><label className="admin-label">Entreprise</label><input name="company" className="admin-input" required /></div>
              <div><label className="admin-label">Email</label><input name="email" type="email" className="admin-input" required /></div>
              <div><label className="admin-label">Téléphone</label><input name="phone" className="admin-input" /></div>
              <div style={{ gridColumn: '1 / -1' }}><label className="admin-label">Adresse</label><input name="address" className="admin-input" /></div>
            </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
              <button type="submit" className="admin-btn admin-btn-primary">Ajouter</button>
            </div></form>
          )}

          {modal === 'addSupplyOrder' && (
            <form onSubmit={handleAddSupplyOrder}><div className="admin-form-grid">
              <div style={{ gridColumn: '1 / -1' }}><label className="admin-label">Fournisseur</label>
                <select name="supplierId" className="admin-select" required>
                  <option value="">Sélectionner...</option>
                  {store.suppliers.map(s => <option key={s.id} value={s.id}>{s.name} ({s.company})</option>)}
                </select></div>
              <div><label className="admin-label">Produit</label><input name="productName" className="admin-input" required /></div>
              <div><label className="admin-label">Quantité</label><input name="quantity" type="number" className="admin-input" required /></div>
              <div><label className="admin-label">Coût unitaire (€)</label><input name="unitCost" type="number" step="0.01" className="admin-input" required /></div>
            </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
              <button type="submit" className="admin-btn admin-btn-primary">Créer</button>
            </div></form>
          )}

          {modal === 'addEmployee' && (
            <form onSubmit={handleAddEmployee}><div className="admin-form-grid">
              <div><label className="admin-label">Nom complet</label><input name="name" className="admin-input" required /></div>
              <div><label className="admin-label">Email</label><input name="email" type="email" className="admin-input" required /></div>
              <div><label className="admin-label">Téléphone</label><input name="phone" className="admin-input" /></div>
              <div><label className="admin-label">Poste / Rôle</label><input name="role" className="admin-input" required placeholder="ex: Vendeur" /></div>
              <div><label className="admin-label">Salaire mensuel (€)</label><input name="salary" type="number" step="0.01" className="admin-input" required /></div>
            </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
              <button type="submit" className="admin-btn admin-btn-primary">Ajouter</button>
            </div></form>
          )}

          {modal === 'payEmployee' && (
            <form onSubmit={handlePayEmployee}><div className="admin-form-grid">
              <div style={{ gridColumn: '1 / -1' }}><label className="admin-label">Employé</label>
                <select name="employeeId" className="admin-select" required>
                  <option value="">Sélectionner...</option>
                  {store.employees.filter(e => e.status === 'ACTIVE').map(e => <option key={e.id} value={e.id}>{e.name} — {e.role}</option>)}
                </select></div>
              <div><label className="admin-label">Montant (€)</label><input name="amount" type="number" step="0.01" className="admin-input" required /></div>
              <div><label className="admin-label">Période</label><input name="period" className="admin-input" required placeholder="ex: Août 2026" /></div>
              <div><label className="admin-label">Méthode</label>
                <select name="method" className="admin-select"><option value="TRANSFER">Virement</option><option value="CASH">Espèces</option><option value="MOBILE">Mobile Money</option></select></div>
            </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
              <button type="submit" className="admin-btn admin-btn-primary">Payer</button>
            </div></form>
          )}

          {modal === 'addDeliveryZone' && (
            <form onSubmit={handleAddZone}><div className="admin-form-grid">
              <div><label className="admin-label">Nom de la zone</label><input name="name" className="admin-input" required /></div>
              <div><label className="admin-label">Frais (€)</label><input name="fee" type="number" step="0.01" className="admin-input" required /></div>
              <div><label className="admin-label">Délai estimé</label><input name="days" className="admin-input" required placeholder="ex: 2-4 jours" /></div>
            </div><div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
              <button type="submit" className="admin-btn admin-btn-primary">Ajouter</button>
            </div></form>
          )}

          {modal === 'addPromo' && (
            <form onSubmit={handleAddPromo}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--adm-text-h)' }}>
                Nouveau Code Promo & Attribution Client
              </h3>
              <div className="admin-form-grid">
                <div>
                  <label className="admin-label">Code Promo (Majuscules)</label>
                  <input name="code" className="admin-input" required placeholder="ex: AYMARDVIP20" style={{ textTransform: 'uppercase' }} />
                </div>
                <div>
                  <label className="admin-label">Type de Réduction</label>
                  <select name="type" className="admin-select">
                    <option value="percent">Pourcentage (-%)</option>
                    <option value="fixed">Montant Fixe (-€ / -FCFA)</option>
                  </select>
                </div>
                <div>
                  <label className="admin-label">Valeur de la Réduction</label>
                  <input name="value" type="number" step="0.01" className="admin-input" required placeholder="ex: 15 (pour -15%)" />
                </div>
                <div>
                  <label className="admin-label">Destinataire / Attribution</label>
                  <select 
                    name="targetClient" 
                    className="admin-select"
                    value={promoTargetType}
                    onChange={(e) => setPromoTargetType(e.target.value)}
                  >
                    <option value="ALL">🌐 Tous les clients (Offre Publique)</option>
                    <option value="CUSTOM">✍️ Saisir une adresse email client personnalisée...</option>
                    {allKnownClients.map(c => (
                      <option key={c.email} value={c.email}>👤 Client : {c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>

                {promoTargetType === 'CUSTOM' && (
                  <div style={{ gridColumn: '1 / -1', background: 'rgba(2, 132, 199, 0.05)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                    <label className="admin-label">Adresse Email du Client Cible</label>
                    <input 
                      name="customEmail" 
                      type="email" 
                      className="admin-input" 
                      required 
                      placeholder="ex: client.vip@gmail.com" 
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: 'var(--adm-text-sub)', fontSize: '11px' }}>
                      Ce code promo sera strictement réservé au compte connecté avec cet email.
                    </small>
                  </div>
                )}

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Description / Condition de l'Offre</label>
                  <input name="description" className="admin-input" placeholder="ex: Remise VIP exclusive réservée aux membres privilégiés" />
                </div>

                <div style={{ gridColumn: '1 / -1', background: 'rgba(56, 189, 248, 0.08)', padding: '16px', borderRadius: '14px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '13px', color: 'var(--adm-text-h)' }}>
                    <input type="checkbox" name="notifyClients" defaultChecked style={{ width: '18px', height: '18px', accentColor: '#0284c7' }} />
                    <span>🔔 Envoyer une notification instantanée au client</span>
                  </label>
                  <div style={{ marginTop: '10px' }}>
                    <label className="admin-label">Message de la notification</label>
                    <textarea
                      name="customMessage"
                      className="admin-textarea"
                      rows={2}
                      placeholder="ex: Vous avez reçu un privilège exclusif de -15% sur votre commande !"
                    />
                  </div>
                </div>
              </div>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
                <button type="submit" className="admin-btn admin-btn-primary">Enregistrer & Attribuer</button>
              </div>
            </form>
          )}

          {modal === 'addBroadcastNotif' && (
            <form onSubmit={handleSendBroadcastNotif}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 16px 0', color: 'var(--adm-text-h)' }}>
                📢 Diffuser une Notification Instantanée
              </h3>
              <div className="admin-form-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Destinataire de l'Alerte</label>
                  <select 
                    name="targetClient" 
                    className="admin-select"
                    value={broadcastTargetType}
                    onChange={(e) => setBroadcastTargetType(e.target.value)}
                  >
                    <option value="ALL">🌐 Tous les clients de la boutique</option>
                    <option value="CUSTOM">✍️ Saisir une adresse email client spécifique...</option>
                    {allKnownClients.map(c => (
                      <option key={c.email} value={c.email}>👤 Client spécifique : {c.name} ({c.email})</option>
                    ))}
                  </select>
                </div>

                {broadcastTargetType === 'CUSTOM' && (
                  <div style={{ gridColumn: '1 / -1', background: 'rgba(2, 132, 199, 0.05)', padding: '14px', borderRadius: '12px', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
                    <label className="admin-label">Adresse Email du Client Cible</label>
                    <input 
                      name="customEmail" 
                      type="email" 
                      className="admin-input" 
                      required 
                      placeholder="ex: client.vip@gmail.com" 
                    />
                    <small style={{ display: 'block', marginTop: '4px', color: 'var(--adm-text-sub)', fontSize: '11px' }}>
                      Seul l&apos;utilisateur connecté avec cette adresse recevra la notification.
                    </small>
                  </div>
                )}

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Titre de la Notification</label>
                  <input name="title" className="admin-input" required placeholder="ex: 🎁 Offre Spéciale du Week-end !" defaultValue="🎁 Vente Privée VIP Aymard Store" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Message de l'Alerte</label>
                  <textarea
                    name="message"
                    className="admin-textarea"
                    rows={3}
                    required
                    placeholder="Ecrivez votre message ici..."
                    defaultValue="Profitez de réductions exclusives sur toute la nouvelle collection d'Aymard Store !"
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Rattacher un Code Promo (Optionnel)</label>
                  <select name="promoCode" className="admin-select">
                    <option value="">-- Aucun code rattaché --</option>
                    {store.promoCodes.map(p => (
                      <option key={p.code} value={p.code}>{p.code} ({p.type === 'percent' ? `-${p.value}%` : `-${p.value}€`})</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
                <button type="submit" className="admin-btn admin-btn-primary">Envoyer la Notification</button>
              </div>
            </form>
          )}

          {modal === 'addExpense' && (
            <form onSubmit={handleAddExpense}>
              <div className="admin-form-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Libellé / Objet de la dépense</label>
                  <input name="title" className="admin-input" required placeholder="ex: Achat Stock Sneakers Nike, Pub Meta Ads..." />
                </div>

                <div>
                  <label className="admin-label">Poste de Dépense (Catégorie)</label>
                  <select name="category" className="admin-select" required>
                    <option value="STOCK">📦 Achats Stocks & Marchandises</option>
                    <option value="LOGISTICS">🚚 Logistique, Fret & Douanes</option>
                    <option value="MARKETING">📢 Marketing, Pubs & Influenceurs</option>
                    <option value="SALARIES">💼 Salaires & Commissions Livreur</option>
                    <option value="RENT">🏢 Loyer, Bureaux & Charges Fixes</option>
                    <option value="SOFTWARE">🛠️ Outils, Abonnements & Cloud</option>
                    <option value="FEES">💳 Frais bancaires & Passerelles</option>
                    <option value="OTHER">🏷️ Divers & Imprévus</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Devise de saisie</label>
                  <select name="currency" className="admin-select" defaultValue={store.currency}>
                    <option value="EUR">€ Euro (EUR)</option>
                    <option value="FCFA">FCFA (Franc CFA)</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Montant</label>
                  <input name="amount" type="number" step="0.01" className="admin-input" required placeholder="ex: 150.00 ou 100000" />
                </div>

                <div>
                  <label className="admin-label">Date du règlement</label>
                  <input name="date" type="date" className="admin-input" defaultValue={new Date().toISOString().split('T')[0]} required />
                </div>

                <div>
                  <label className="admin-label">Mode de règlement</label>
                  <select name="paymentMethod" className="admin-select">
                    <option value="TRANSFER">Virement Bancaire</option>
                    <option value="CARD">Carte Bancaire (CB / Visa / Mastercard)</option>
                    <option value="MOBILE_MONEY">Mobile Money (MTN / Moov / Wave)</option>
                    <option value="CASH">Espèces / Caisse</option>
                    <option value="PAYPAL">PayPal / Autre</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Statut</label>
                  <select name="status" className="admin-select">
                    <option value="PAID">✅ Payé / Décaissé</option>
                    <option value="PENDING">⏳ En attente de règlement</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">N° de Facture / Réf Justificatif (Optionnel)</label>
                  <input name="receiptNumber" className="admin-input" placeholder="ex: FAC-2026-092, DHL-BJ-883..." />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Notes & Détails complémentaires</label>
                  <textarea name="notes" className="admin-input" rows={2} placeholder="Précisions sur la dépense, fournisseur, conditions..." style={{ resize: 'vertical' }} />
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn-outline" onClick={close}>Annuler</button>
                <button type="submit" className="admin-btn admin-btn-primary">Enregistrer la dépense</button>
              </div>
            </form>
          )}

          {modal === 'editExpense' && editingExpense && (
            <form onSubmit={handleEditExpense}>
              <div className="admin-form-grid">
                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Libellé / Objet de la dépense</label>
                  <input name="title" className="admin-input" defaultValue={editingExpense.title} required />
                </div>

                <div>
                  <label className="admin-label">Poste de Dépense</label>
                  <select name="category" className="admin-select" defaultValue={editingExpense.category} required>
                    <option value="STOCK">📦 Achats Stocks & Marchandises</option>
                    <option value="LOGISTICS">🚚 Logistique, Fret & Douanes</option>
                    <option value="MARKETING">📢 Marketing, Pubs & Influenceurs</option>
                    <option value="SALARIES">💼 Salaires & Commissions Livreur</option>
                    <option value="RENT">🏢 Loyer, Bureaux & Charges Fixes</option>
                    <option value="SOFTWARE">🛠️ Outils, Abonnements & Cloud</option>
                    <option value="FEES">💳 Frais bancaires & Passerelles</option>
                    <option value="OTHER">🏷️ Divers & Imprévus</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Devise de saisie</label>
                  <select name="currency" className="admin-select" defaultValue={editingExpense.currency || 'EUR'}>
                    <option value="EUR">€ Euro (EUR)</option>
                    <option value="FCFA">FCFA (Franc CFA)</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Montant</label>
                  <input
                    name="amount"
                    type="number"
                    step="0.01"
                    className="admin-input"
                    defaultValue={editingExpense.currency === 'FCFA' && editingExpense.amountFcfa ? editingExpense.amountFcfa : editingExpense.amount}
                    required
                  />
                </div>

                <div>
                  <label className="admin-label">Date</label>
                  <input name="date" type="date" className="admin-input" defaultValue={editingExpense.date} required />
                </div>

                <div>
                  <label className="admin-label">Mode de règlement</label>
                  <select name="paymentMethod" className="admin-select" defaultValue={editingExpense.paymentMethod}>
                    <option value="TRANSFER">Virement Bancaire</option>
                    <option value="CARD">Carte Bancaire (CB / Visa / Mastercard)</option>
                    <option value="MOBILE_MONEY">Mobile Money (MTN / Moov / Wave)</option>
                    <option value="CASH">Espèces / Caisse</option>
                    <option value="PAYPAL">PayPal / Autre</option>
                  </select>
                </div>

                <div>
                  <label className="admin-label">Statut</label>
                  <select name="status" className="admin-select" defaultValue={editingExpense.status}>
                    <option value="PAID">✅ Payé / Décaissé</option>
                    <option value="PENDING">⏳ En attente de règlement</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">N° de Facture / Réf Justificatif</label>
                  <input name="receiptNumber" className="admin-input" defaultValue={editingExpense.receiptNumber || ''} />
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label className="admin-label">Notes</label>
                  <textarea name="notes" className="admin-input" rows={2} defaultValue={editingExpense.notes || ''} style={{ resize: 'vertical' }} />
                </div>
              </div>

              <div style={{ marginTop: 24, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
                <button type="button" className="admin-btn admin-btn-outline" onClick={() => { setEditingExpense(null); close(); }}>Annuler</button>
                <button type="submit" className="admin-btn admin-btn-primary">Mettre à jour</button>
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  // ======= TAB CONTENT RENDERS =======

  const renderDashboard = () => {
    const pendingAmount = store.orders.filter(o => o.status === 'PENDING').reduce((s, o) => s + o.total, 0);
    const totalSorties = store.employeePayments.reduce((s, p) => s + p.amount, 0) + store.supplyOrders.filter(o => o.status === 'RECEIVED').reduce((s, o) => s + o.totalCost, 0);
    const format = (amount: number) => formatPrice(convertPrice(amount, store.currency), store.currency);

    return (
      <>
        {/* AymardStore Hero Banner */}
        <div className="admin-hero-banner">
          <div className="admin-hero-content">
            <span className="admin-hero-subtitle">SYNTHÈSE EN TEMPS RÉEL</span>
            <h1 className="admin-hero-title">Tableau de bord AymardStore</h1>
            <p className="admin-hero-desc">Analyse des performances pour AYMARD STORE.</p>
          </div>
          <div className="admin-hero-kpis">
            <div className="admin-hero-kpi-box">
              <span className="admin-hero-kpi-label">CA ENCAISSÉ (PÉRIODE)</span>
              <span className="admin-hero-kpi-value">{format(totalRevenue)}</span>
            </div>
            <div className="admin-hero-kpi-box">
              <span className="admin-hero-kpi-label">EN ATTENTE (DIRECT)</span>
              <span className="admin-hero-kpi-value">{format(pendingAmount)}</span>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="admin-filters-card">
          <div className="admin-filters-header">
            <span style={{ fontSize: '18px' }}>🎛️</span>
            <h3 className="admin-filters-title">Filtrer vos insights</h3>
          </div>
          <p style={{ fontSize: '13px', color: '#64748b', margin: '-8px 0 16px 30px' }}>
            Ajustez la période et les périmètres analysés pour affiner vos résultats.
          </p>
          <div className="admin-filters-grid">
            <div>
              <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#94a3b8' }}></span>
                PÉRIODE D'ANALYSE — Date de début
              </label>
              <input type="date" className="admin-input" defaultValue="2026-08-01" />
            </div>
            <div>
              <label className="admin-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }}></span>
                PÉRIODE D'ANALYSE — Date de fin
              </label>
              <input type="date" className="admin-input" defaultValue="2026-08-31" />
            </div>
          </div>
        </div>

        {/* Indicators Section Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(56,189,248,0.18)', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, fontFamily: 'var(--font-plus-jakarta)', color: 'var(--adm-text-h)' }}>Indicateurs clés</h3>
            <p style={{ fontSize: '12px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>Visualisez la santé générale de vos opérations.</p>
          </div>
        </div>

        {/* 3D KPI Cards Grid (Midnight Blue SaaS style) */}
        <div className="admin-kpi-grid">
          {/* Card 1: Boutiques — Electric Blue Flagship Store */}
          <div 
            className="admin-kpi-card" 
            style={{ 
              backgroundImage: "linear-gradient(155deg, rgba(4,12,28,0.85) 0%, rgba(2,6,16,0.94) 100%), url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=600&auto=format&fit=crop')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderTopColor: '#0ea5e9',
              alignItems: 'flex-start',
              textAlign: 'left'
            }}
          >
            <span className="kpi-label">Boutiques</span>
            <span className="kpi-value">1</span>
            <span className="kpi-subtext">Point de vente actif</span>
          </div>

          {/* Card 2: Employés — Deep Cyan Tech Team */}
          <div 
            className="admin-kpi-card" 
            style={{ 
              backgroundImage: "linear-gradient(155deg, rgba(4,15,32,0.85) 0%, rgba(2,8,20,0.94) 100%), url('https://images.unsplash.com/photo-1522071820081-009f0129c71c?q=80&w=600&auto=format&fit=crop')",
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              borderTopColor: '#38bdf8',
              alignItems: 'flex-start',
              textAlign: 'left'
            }}
          >
            <span className="kpi-label">Employés</span>
            <span className="kpi-value">{store.employees.filter(e => e.status === 'ACTIVE').length}</span>
            <span className="kpi-subtext">Personnel actif</span>
          </div>

          {/* Card 3: Produits — Cobalt Blue Luxury Sneaker */}
          <div 
            className="admin-kpi-card" 
            style={{ 
              backgroundImage: "linear-gradient(155deg, rgba(3,12,30,0.85) 0%, rgba(2,6,18,0.94) 100%), url('https://images.unsplash.com/photo-1600269452121-4f2416e55c28?q=80&w=600&auto=format&fit=crop')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderTopColor: '#2563eb',
              alignItems: 'flex-start',
              textAlign: 'left'
            }}
          >
            <span className="kpi-label">Produits</span>
            <span className="kpi-value">{store.products.length}</span>
            <span className="kpi-subtext">Articles en catalogue</span>
          </div>

          {/* Card 4: Clients — Ice Blue Premium Customer */}
          <div 
            className="admin-kpi-card" 
            style={{ 
              backgroundImage: "linear-gradient(155deg, rgba(4,14,32,0.85) 0%, rgba(2,7,20,0.94) 100%), url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=600&auto=format&fit=crop')",
              backgroundSize: 'cover',
              backgroundPosition: 'center top',
              borderTopColor: '#60a5fa',
              alignItems: 'flex-start',
              textAlign: 'left'
            }}
          >
            <span className="kpi-label">Clients</span>
            <span className="kpi-value">{store.clients.length}</span>
            <span className="kpi-subtext">Abonnés enregistrés</span>
          </div>

          {/* Card 5: En attente — Deep Sapphire Watch */}
          <div 
            className="admin-kpi-card" 
            style={{ 
              backgroundImage: "linear-gradient(155deg, rgba(2,10,26,0.85) 0%, rgba(1,5,15,0.94) 100%), url('https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderTopColor: '#0284c7',
              alignItems: 'flex-start',
              textAlign: 'left'
            }}
          >
            <span className="kpi-label">En attente</span>
            <span className="kpi-value">{format(pendingAmount)}</span>
            <span className="kpi-subtext">{pendingOrders} vente(s) direct avec échéance</span>
          </div>

          {/* Card 6: CA Encaissé — Electric Neon Tech Revenue */}
          <div 
            className="admin-kpi-card" 
            style={{ 
              backgroundImage: "linear-gradient(155deg, rgba(4,16,35,0.85) 0%, rgba(2,8,22,0.94) 100%), url('https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=600&auto=format&fit=crop')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderTopColor: '#38bdf8',
              alignItems: 'flex-start',
              textAlign: 'left'
            }}
          >
            <span className="kpi-label">CA Encaissé</span>
            <span className="kpi-value">{format(totalRevenue)}</span>
            <span className="kpi-subtext">Sur la période sélectionnée</span>
          </div>

          {/* Card 7: Sorties — Dark Indigo Red Outflow */}
          <div 
            className="admin-kpi-card" 
            style={{ 
              backgroundImage: "linear-gradient(155deg, rgba(16,8,24,0.85) 0%, rgba(8,3,14,0.94) 100%), url('https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=600&auto=format&fit=crop')",
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderTopColor: '#ef4444',
              alignItems: 'flex-start',
              textAlign: 'left'
            }}
          >
            <span className="kpi-label">Sorties</span>
            <span className="kpi-value">{format(totalSorties)}</span>
            <span className="kpi-subtext">Sur la période sélectionnée</span>
          </div>
        </div>

        {/* Charts & Top Products */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, marginTop: '32px' }}>
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">📈 Répartition des ventes</h3>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '-10px 0 20px 0' }}>
              Analysez la part de vos ventes par canal, disponibilité stock et précommandes.
            </p>
            <div className="admin-chart-bars" style={{ marginBottom: 32 }}>
              {monthlyData.map(d => (
                <div key={d.label} className="admin-chart-bar" style={{ height: `${(d.value / maxMonthVal) * 100}%` }}>
                  <div className="admin-chart-bar-value">{format(d.value)}</div>
                  <div className="admin-chart-bar-label">{d.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">🏆 Top Produits</h3>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '-10px 0 20px 0' }}>
              Classement des produits phares.
            </p>
            {store.products.slice(0, 5).map((p, i) => (
              <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: '#64748b', width: 20 }}>{i + 1}</span>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📦</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700 }}>{p.name_fr.slice(0, 28)}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{format(p.price)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Row 3: Enhanced Operational Stock Alerts & Recent Supplier Orders */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 24, marginTop: '24px' }}>
          {/* Low Stock & Out of Stock Alerts Center */}
          <div className="admin-card" id="admin-stock-alerts-card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="admin-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
              <div>
                <h3 className="admin-card-title" style={{ color: outOfStockAlerts.length > 0 ? '#ef4444' : '#f59e0b', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>⚠️ Centre d&apos;Alertes Stock</span>
                  <span style={{ fontSize: '12px', background: outOfStockAlerts.length > 0 ? '#ef4444' : '#f59e0b', color: '#fff', padding: '2px 8px', borderRadius: '12px', fontWeight: 800 }}>
                    {outOfStockAlerts.length + lowStockAlerts.length} article(s)
                  </span>
                </h3>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  { id: 'ALL', label: `Tous (${outOfStockAlerts.length + lowStockAlerts.length})` },
                  { id: 'OUT', label: `🔴 Ruptures (${outOfStockAlerts.length})` },
                  { id: 'LOW', label: `🟡 Faibles (${lowStockAlerts.length})` }
                ].map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setDashboardAlertFilter(tab.id as any)}
                    style={{
                      fontSize: '11px',
                      fontWeight: dashboardAlertFilter === tab.id ? 800 : 600,
                      padding: '3px 8px',
                      borderRadius: '10px',
                      border: dashboardAlertFilter === tab.id ? '1px solid var(--adm-text-h)' : '1px solid var(--adm-card-border)',
                      background: dashboardAlertFilter === tab.id ? 'var(--adm-text-h)' : 'transparent',
                      color: dashboardAlertFilter === tab.id ? 'var(--adm-card-bg)' : 'var(--adm-text-m)',
                      cursor: 'pointer'
                    }}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '-10px 0 16px 0' }}>
              Articles en rupture immédiate (0) ou nécessitant un réassort urgent (&lt; 5).
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '360px', overflowY: 'auto', paddingRight: 4 }}>
              {store.products.filter(p => {
                const stock = p.stock ?? 0;
                if (dashboardAlertFilter === 'OUT') return stock === 0;
                if (dashboardAlertFilter === 'LOW') return stock > 0 && stock < 5;
                return stock < 5;
              }).length === 0 ? (
                <div style={{ padding: '24px 16px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', color: '#059669', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>
                  <span style={{ fontSize: '24px', display: 'block', marginBottom: 6 }}>✅</span>
                  Tous les stocks de cette sélection sont au beau fixe !
                </div>
              ) : (
                store.products.filter(p => {
                  const stock = p.stock ?? 0;
                  if (dashboardAlertFilter === 'OUT') return stock === 0;
                  if (dashboardAlertFilter === 'LOW') return stock > 0 && stock < 5;
                  return stock < 5;
                }).map(p => {
                  const stock = p.stock ?? 0;
                  const isOut = stock === 0;

                  return (
                    <div
                      key={p.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                        padding: '12px 14px',
                        background: isOut ? 'rgba(239, 68, 68, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                        borderLeft: isOut ? '4px solid #ef4444' : '4px solid #f59e0b',
                        borderRadius: '12px',
                        border: '1px solid var(--adm-card-border)',
                        borderLeftWidth: '4px'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                          <img
                            src={p.images[0]}
                            alt={p.name_fr}
                            style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'contain', background: '#ffffff' }}
                          />
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {p.name_fr}
                            </div>
                            <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                              {p.brand || 'AYMARD'} • {format(p.price)}
                            </div>
                          </div>
                        </div>

                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            background: isOut ? '#ef4444' : '#f59e0b',
                            color: '#ffffff',
                            padding: '3px 10px',
                            borderRadius: '20px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {isOut ? '🔴 RUPTURE (0)' : `🟡 ${stock} restant${stock > 1 ? 's' : ''}`}
                        </span>
                      </div>

                      {/* Quick Replenish Actions */}
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 6 }}>
                        <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--adm-text-m)', marginRight: 'auto' }}>
                          Réassort rapide :
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            store.updateProduct(p.id, { stock: (p.stock || 0) + 10 });
                            showToast(`+10 unités ajoutées au stock de ${p.name_fr} !`, 'success');
                          }}
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          style={{ borderRadius: '8px', fontSize: '10.5px', padding: '3px 8px', fontWeight: 700 }}
                          title="Ajouter 10 unités au stock"
                        >
                          +10 Stock
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            store.updateProduct(p.id, { stock: (p.stock || 0) + 50 });
                            showToast(`+50 unités ajoutées au stock de ${p.name_fr} !`, 'success');
                          }}
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          style={{ borderRadius: '8px', fontSize: '10.5px', padding: '3px 8px', fontWeight: 700 }}
                          title="Ajouter 50 unités au stock"
                        >
                          +50 Stock
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setModal('addSupplyOrder');
                          }}
                          className="admin-btn admin-btn-primary admin-btn-sm"
                          style={{ borderRadius: '8px', fontSize: '10.5px', padding: '3px 8px', fontWeight: 700 }}
                          title="Créer un bon de commande fournisseur"
                        >
                          📦 Bon Fournisseur
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Recent Supplier Orders / Payout Activity */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="admin-card-title">📥 Activité d&apos;Approvisionnement</h3>
            </div>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '-10px 0 20px 0' }}>
              Suivi des dernières commandes passées auprès des fournisseurs.
            </p>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Fournisseur</th>
                  <th>Produit</th>
                  <th>Coût</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {store.supplyOrders.slice(0, 3).map(o => {
                  const sup = store.suppliers.find(s => s.id === o.supplierId);
                  return (
                    <tr key={o.id}>
                      <td style={{ fontWeight: 700 }}>{sup?.name || '—'}</td>
                      <td>{o.items[0]?.productName || '—'}</td>
                      <td style={{ fontWeight: 800 }}>{format(o.totalCost)}</td>
                      <td><Badge status={o.status} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {store.supplyOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: '16px', color: '#94a3b8', fontSize: '13px' }}>Aucun approvisionnement récent</div>
            )}
          </div>
        </div>
      </>
    );
  };

  const renderProducts = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header Card */}
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0284c7' }}>GESTION DU CATALOGUE</span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Produits ({store.products.length})
            </h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
              Gérez votre inventaire, importez des articles via CSV ou synchronisez directement votre Google Sheet.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button className="admin-btn admin-btn-primary" onClick={() => {
              setSelectedSizes(['39', '40', '41', '42', '43', '44']);
              setSelectedColors(['Noir', 'Blanc']);
              setModal('addProduct');
            }} style={{ borderRadius: '12px', padding: '10px 20px', fontWeight: 700 }}>
              + Nouveau produit
            </button>
            <button className="admin-btn admin-btn-outline" onClick={() => setShowCsvImport(!showCsvImport)} style={{ borderRadius: '12px', padding: '10px 18px', fontWeight: 600 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Import CSV
            </button>
            <button className="admin-btn admin-btn-outline" onClick={() => setShowGoogleSheetsSync(!showGoogleSheetsSync)} style={{ borderRadius: '12px', padding: '10px 18px', fontWeight: 600, color: '#10b981', borderColor: 'rgba(16,185,129,0.3)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
              Google Sheets
            </button>
          </div>
        </div>
      </div>

      {/* CSV Import Drawer */}
      {showCsvImport && (
        <div className="admin-card" style={{ padding: '24px', borderRadius: '20px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>Importer un fichier CSV</h3>
              <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
                Sélectionnez votre fichier .csv ou téléchargez notre modèle type pour structurer vos articles (Nom, Prix, Catégorie, ImageURL, Stock, Description).
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="button" className="admin-btn admin-btn-danger admin-btn-sm" onClick={handleClearCsvProducts} style={{ borderRadius: 8, background: 'rgba(239,68,68,0.12)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
                Purger les produits importés par CSV
              </button>
              <button type="button" className="admin-btn admin-btn-outline admin-btn-sm" onClick={handleDownloadCsvSample} style={{ borderRadius: 8 }}>
                Télécharger Modèle CSV exemple
              </button>
            </div>
          </div>

          <div style={{ border: '2px dashed var(--adm-card-border)', borderRadius: '16px', padding: '32px', textAlign: 'center', background: 'rgba(255,255,255,0.02)' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2" style={{ marginBottom: 12 }}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            <h4 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--adm-text-h)', margin: '0 0 6px 0' }}>Choisissez un fichier .csv sur votre ordinateur</h4>
            <p style={{ fontSize: '12px', color: 'var(--adm-text-m)', marginBottom: 16 }}>Les produits importés s&apos;ajouteront automatiquement sur la page d&apos;accueil de la boutique.</p>
            <label className="admin-btn admin-btn-primary" style={{ cursor: 'pointer', borderRadius: '30px', padding: '10px 24px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              Parcourir mon fichier .csv
              <input type="file" accept=".csv" onChange={handleFileUploadCSV} style={{ display: 'none' }} />
            </label>
          </div>
        </div>
      )}

      {/* Google Sheets Sync Drawer */}
      {showGoogleSheetsSync && (
        <div className="admin-card" style={{ padding: '24px', borderRadius: '20px', background: 'var(--adm-card-bg)', border: '1px solid #10b981' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>Synchronisation Google Sheets en direct</h3>
              <p style={{ fontSize: '12px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
                Collez l&apos;URL publiée de votre Google Sheet (Fichier &gt; Partager &gt; Publier sur le web &gt; Format CSV).
              </p>
            </div>
            {store.googleSheetConfig.status === 'CONNECTED' && (
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 12px', borderRadius: 20 }}>
                Connecté (Dernière synchro: {store.googleSheetConfig.lastSynced})
              </span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <input
              className="admin-input"
              value={sheetUrlInput}
              onChange={e => setSheetUrlInput(e.target.value)}
              placeholder="https://docs.google.com/spreadsheets/d/.../pub?output=csv"
              style={{ flex: 1, borderRadius: 10 }}
            />
            <button
              className="admin-btn admin-btn-primary"
              onClick={handleSyncGoogleSheet}
              disabled={isSyncingSheet}
              style={{ borderRadius: 10, background: '#10b981', fontWeight: 700, padding: '0 24px' }}
            >
              {isSyncingSheet ? 'Synchronisation...' : 'Synchroniser Google Sheets'}
            </button>
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="admin-card" style={{ padding: '24px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
          <input 
            className="admin-input" 
            placeholder="Rechercher un produit..." 
            value={search} 
            onChange={e => { setSearch(e.target.value); setProductPage(1); }} 
            style={{ width: 280, borderRadius: 10 }} 
          />
          <span style={{ fontSize: '13px', color: 'var(--adm-text-m)' }}>
            Affichage de {filteredProducts.length} articles • Page {productPage} sur {Math.ceil(filteredProducts.length / 15) || 1}
          </span>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Produit</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Prix</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Stock</th>
                <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Catégorie</th>
                <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', color: 'var(--adm-text-m)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.slice((productPage - 1) * 15, productPage * 15).map(p => (
                <tr key={p.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={p.images[0]} alt={p.name_fr} style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }} loading="lazy" />
                      <span>{p.name_fr.slice(0, 35)}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                        🇧🇯 {p.locationPrices?.benin ? `${p.locationPrices.benin.toLocaleString('fr-FR')} FCFA` : `${Math.round(p.price * 655.957).toLocaleString('fr-FR')} FCFA`}
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', display: 'flex', gap: '8px' }}>
                        <span>🇫🇷 {p.locationPrices?.france ? `${p.locationPrices.france} €` : `${p.price} €`}</span>
                        <span>•</span>
                        <span>🇧🇪 {p.locationPrices?.belgique ? `${p.locationPrices.belgique} €` : `${p.price} €`}</span>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span style={{ color: p.stock < 5 ? '#ef4444' : '#10b981', fontWeight: 700 }}>{p.stock} en stock</span>
                  </td>
                  <td style={{ padding: '14px 16px', fontSize: '13px', color: '#0284c7', fontWeight: 600 }}>
                    {getCategoryLabel(p.category)}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button 
                        className="admin-btn admin-btn-outline admin-btn-sm" 
                        onClick={() => {
                          setEditingProduct(p);
                          setSelectedSizes(cleanExistingSizes(p.sizes));
                          setSelectedColors(p.colors || []);
                          setModal('editProduct');
                        }}
                        title="Modifier les détails de l'article"
                        style={{ borderRadius: 8, padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button 
                        className="admin-btn admin-btn-danger admin-btn-sm" 
                        onClick={() => {
                          showConfirmDialog({
                            title: 'Supprimer le produit',
                            message: `Voulez-vous vraiment supprimer "${p.name_fr}" du catalogue ?\nCette action est irréversible.`,
                            icon: '🗑️',
                            type: 'danger',
                            confirmLabel: 'Supprimer',
                            cancelLabel: 'Annuler',
                            onConfirm: () => {
                              store.deleteProduct(p.id);
                              showToast('Produit supprimé avec succès');
                            }
                          });
                        }} 
                        style={{ borderRadius: 8, padding: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        title="Supprimer l'article"
                      >
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredProducts.length === 0 && <EmptyState icon="📦" text="Aucun produit trouvé" />}
        </div>

        {/* Pagination controls */}
        {filteredProducts.length > 15 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--adm-card-border)', flexWrap: 'wrap', gap: 12 }}>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
              Lignes {(productPage - 1) * 15 + 1} à {Math.min(productPage * 15, filteredProducts.length)} sur {filteredProducts.length}
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button 
                onClick={() => setProductPage(p => Math.max(1, p - 1))}
                disabled={productPage === 1}
                className="admin-btn admin-btn-outline admin-btn-sm"
                style={{ borderRadius: 8, opacity: productPage === 1 ? 0.4 : 1 }}
              >
                ◀ Précédent
              </button>
              <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-h)', background: 'rgba(56,189,248,0.1)', borderRadius: 8 }}>
                {productPage} / {Math.ceil(filteredProducts.length / 15)}
              </span>
              <button 
                onClick={() => setProductPage(p => Math.min(Math.ceil(filteredProducts.length / 15), p + 1))}
                disabled={productPage >= Math.ceil(filteredProducts.length / 15)}
                className="admin-btn admin-btn-outline admin-btn-sm"
                style={{ borderRadius: 8, opacity: productPage >= Math.ceil(filteredProducts.length / 15) ? 0.4 : 1 }}
              >
                Suivant ▶
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  const renderHomeCms = () => {
    const media = store.homepageMedia || {
      categoryTiles: [],
      lookbook: {
        tag: 'ÉDITORIAL SAISON 2026',
        title: "L'Élégance Streetwear dans sa Plus Pure Expression",
        description: "Des sneakers iconiques aux hoodies de créateurs, chaque pièce est sélectionnée pour son authenticité, ses matières d'exception et sa rareté sur le marché international.",
        image1: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop',
        image2: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop',
        buttonText1: 'Découvrir le Lookbook',
        buttonLink1: '/products?filter=new',
        buttonText2: 'Collection Vêtements',
        buttonLink2: '/products?category=clothing',
      },
      faqEditorial: {
        main: {
          title: "Pourquoi les éditions limitées de sneakers fascinent-elles les passionnés ?",
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=900&auto=format&fit=crop',
          link: '/products?category=shoes'
        },
        item1: {
          title: "Entretenir ses sneakers de collection : les bons gestes à adopter",
          image: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=500&auto=format&fit=crop',
          link: '/products?category=shoes'
        },
        item2: {
          title: "Aymard Store est-il un site fiable & 100% authentique ?",
          image: '/logo.png',
          link: '/faq/fiabilite'
        },
        item3: {
          title: "Pourquoi les pièces exclusives sont-elles si convoitées ?",
          image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=500&auto=format&fit=crop',
          link: '/products'
        }
      },
      communityPhotos: []
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header Card */}
        <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#a855f7' }}>GESTIONNAIRE VISUEL & CONTENU</span>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
                Personnalisation de l&apos;Accueil
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0, maxWidth: '750px' }}>
                Modifiez facilement toutes les images, bannières, titres et photos de votre page d&apos;accueil. Téléchargez directement vos photos ou collez une URL.
              </p>
            </div>
            
            {cmsSubTab === 'hero' && (
              <button
                className="admin-btn admin-btn-primary"
                onClick={() => {
                  const newId = Date.now();
                  store.addHeroSlide({
                    id: newId,
                    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop',
                    leftText: 'NOUVELLE COLLECTION',
                    promoTitle: 'OFFRE LIMITÉE -20%',
                    promoSubtitle: 'SÉLECTION EXCLUSIVE',
                    accentColor: '#38bdf8',
                    link: '/products'
                  });
                  showToast('Nouveau slide héro ajouté !');
                }}
                style={{ borderRadius: '30px', padding: '12px 24px', fontWeight: 700 }}
              >
                + Ajouter une Bannière Héro
              </button>
            )}
          </div>

          {/* Sub-tabs Navigation */}
          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap', borderTop: '1px solid var(--adm-card-border)', paddingTop: 18 }}>
            {[
              { id: 'hero', label: '🎪 Carrousel & Bannières Héro', count: store.heroSlides.length },
              { id: 'categories', label: '🛍️ Cartes Univers / Collections', count: (media.categoryTiles || []).length },
              { id: 'lookbook', label: '✨ Bannière Lookbook' },
              { id: 'faq', label: '📖 FAQ & Stories Éditoriales' },
              { id: 'community', label: '📸 Galerie Instagram #AymardClub', count: (media.communityPhotos || []).length },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setCmsSubTab(tab.id as any)}
                style={{
                  padding: '10px 18px',
                  borderRadius: '20px',
                  border: 'none',
                  background: cmsSubTab === tab.id ? '#09090b' : 'rgba(0,0,0,0.05)',
                  color: cmsSubTab === tab.id ? '#ffffff' : 'var(--adm-text-h)',
                  fontWeight: 800,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  transition: 'all 0.2s ease'
                }}
              >
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span style={{ background: cmsSubTab === tab.id ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)', padding: '2px 7px', borderRadius: '10px', fontSize: '11px' }}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ==================================================================== */}
        {/* SUBTAB 1: CARROUSEL HÉRO */}
        {/* ==================================================================== */}
        {cmsSubTab === 'hero' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 24 }}>
            {store.heroSlides.map((slide, index) => (
              <div key={slide.id} className="admin-card" style={{ padding: '24px', borderRadius: '20px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottom: '1px solid var(--adm-card-border)', paddingBottom: 12 }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                    SLIDE HÉRO #{index + 1}
                  </span>
                  <button
                    className="admin-btn admin-btn-danger admin-btn-sm"
                    onClick={() => {
                      store.deleteHeroSlide(slide.id);
                      showToast('Slide supprimé');
                    }}
                    style={{ borderRadius: 8 }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>

                <div style={{ width: '100%', height: '160px', borderRadius: '12px', overflow: 'hidden', marginBottom: 16, position: 'relative', background: '#000' }}>
                  <img src={slide.image} alt={slide.leftText} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.75 }} />
                  <div style={{ position: 'absolute', inset: 0, padding: 16, display: 'flex', flexDirection: 'column', justifyContent: 'center', color: '#fff' }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, textTransform: 'uppercase', textShadow: `0 0 10px ${slide.accentColor}` }}>{slide.leftText}</span>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: slide.accentColor }}>{slide.promoTitle}</span>
                  </div>
                </div>

                <div className="admin-form-grid" style={{ gap: 12 }}>
                  <div>
                    <label className="admin-label">Grand Titre (ex: LAST SUMMER)</label>
                    <input
                      className="admin-input"
                      value={slide.leftText}
                      onChange={e => store.updateHeroSlide(slide.id, { leftText: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Titre Promo (ex: JUSQU&apos;À -60%)</label>
                    <input
                      className="admin-input"
                      value={slide.promoTitle}
                      onChange={e => store.updateHeroSlide(slide.id, { promoTitle: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Sous-titre (ex: + LIVRAISON OFFERTE)</label>
                    <input
                      className="admin-input"
                      value={slide.promoSubtitle}
                      onChange={e => store.updateHeroSlide(slide.id, { promoSubtitle: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Couleur d&apos;accentuation (HEX)</label>
                    <input
                      type="color"
                      className="admin-input"
                      value={slide.accentColor}
                      onChange={e => store.updateHeroSlide(slide.id, { accentColor: e.target.value })}
                      style={{ borderRadius: 8, height: 40, padding: 4 }}
                    />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="admin-label">Image de Fond du Slide</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="admin-input"
                        placeholder="https://..."
                        value={slide.image}
                        onChange={e => store.updateHeroSlide(slide.id, { image: e.target.value })}
                        style={{ borderRadius: 8, flex: 1 }}
                      />
                      <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '8px 14px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        📁 Importer
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleImageFileUpload(e, (dataUrl) => store.updateHeroSlide(slide.id, { image: dataUrl }))}
                        />
                      </label>
                    </div>
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label className="admin-label">Lien du bouton Découvrir</label>
                    <input
                      className="admin-input"
                      value={slide.link}
                      onChange={e => store.updateHeroSlide(slide.id, { link: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================================================================== */}
        {/* SUBTAB 2: CARTES UNIVERS & CATÉGORIES */}
        {/* ==================================================================== */}
        {cmsSubTab === 'categories' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 24 }}>
            {(media.categoryTiles || []).map((tile) => (
              <div key={tile.id} className="admin-card" style={{ padding: '24px', borderRadius: '20px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottom: '1px solid var(--adm-card-border)', paddingBottom: 10 }}>
                  <strong style={{ fontSize: '14px', color: 'var(--adm-text-h)' }}>{tile.title}</strong>
                  <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', padding: '2px 8px', borderRadius: '6px' }}>{tile.tag}</span>
                </div>

                <div style={{ width: '100%', height: '140px', borderRadius: '12px', overflow: 'hidden', marginBottom: 16, position: 'relative' }}>
                  <img src={tile.image} alt={tile.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div>
                    <label className="admin-label">Titre de la Carte Univers</label>
                    <input
                      className="admin-input"
                      value={tile.title}
                      onChange={e => store.updateCategoryTile(tile.id, { title: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Sous-titre / Description Courte</label>
                    <input
                      className="admin-input"
                      value={tile.subtitle}
                      onChange={e => store.updateCategoryTile(tile.id, { subtitle: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <div>
                      <label className="admin-label">Badge Tag (ex: TENDANCE)</label>
                      <input
                        className="admin-input"
                        value={tile.tag}
                        onChange={e => store.updateCategoryTile(tile.id, { tag: e.target.value })}
                        style={{ borderRadius: 8 }}
                      />
                    </div>
                    <div>
                      <label className="admin-label">Lien de Destination</label>
                      <input
                        className="admin-input"
                        value={tile.link}
                        onChange={e => store.updateCategoryTile(tile.id, { link: e.target.value })}
                        style={{ borderRadius: 8 }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="admin-label">Image de la Catégorie</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="admin-input"
                        placeholder="https://..."
                        value={tile.image}
                        onChange={e => store.updateCategoryTile(tile.id, { image: e.target.value })}
                        style={{ borderRadius: 8, flex: 1 }}
                      />
                      <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '8px 14px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        📁 Importer
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleImageFileUpload(e, (dataUrl) => store.updateCategoryTile(tile.id, { image: dataUrl }))}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================================================================== */}
        {/* SUBTAB 3: BANNIÈRE LOOKBOOK */}
        {/* ==================================================================== */}
        {cmsSubTab === 'lookbook' && (
          <div className="admin-card" style={{ padding: '32px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '0 0 8px 0' }}>
              Bannière Éditoriale Lookbook (Style Haute Couture)
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '0 0 24px 0' }}>
              Cette section magazine met en avant votre vision de marque avec deux photos en superposition et deux boutons d&apos;action.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
              {/* Left Form */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label className="admin-label">Surtitre / Tag (ex: ÉDITORIAL SAISON 2026)</label>
                  <input
                    className="admin-input"
                    value={media.lookbook?.tag || ''}
                    onChange={e => store.updateLookbook({ tag: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <label className="admin-label">Grand Titre Éditorial</label>
                  <input
                    className="admin-input"
                    value={media.lookbook?.title || ''}
                    onChange={e => store.updateLookbook({ title: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div>
                  <label className="admin-label">Texte de Présentation</label>
                  <textarea
                    className="admin-input"
                    rows={3}
                    value={media.lookbook?.description || ''}
                    onChange={e => store.updateLookbook({ description: e.target.value })}
                    style={{ borderRadius: 8 }}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="admin-label">Bouton 1 : Texte</label>
                    <input
                      className="admin-input"
                      value={media.lookbook?.buttonText1 || ''}
                      onChange={e => store.updateLookbook({ buttonText1: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Bouton 1 : Lien</label>
                    <input
                      className="admin-input"
                      value={media.lookbook?.buttonLink1 || ''}
                      onChange={e => store.updateLookbook({ buttonLink1: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label className="admin-label">Bouton 2 : Texte</label>
                    <input
                      className="admin-input"
                      value={media.lookbook?.buttonText2 || ''}
                      onChange={e => store.updateLookbook({ buttonText2: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Bouton 2 : Lien</label>
                    <input
                      className="admin-input"
                      value={media.lookbook?.buttonLink2 || ''}
                      onChange={e => store.updateLookbook({ buttonLink2: e.target.value })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                </div>
              </div>

              {/* Right Images */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {/* Photo 1 */}
                <div style={{ border: '1px solid var(--adm-card-border)', borderRadius: 16, padding: 16 }}>
                  <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block', marginBottom: 10 }}>Photo Éditoriale 1 (Principale)</strong>
                  <div style={{ height: 120, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                    <img src={media.lookbook?.image1} alt="Lookbook 1" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="admin-input"
                      value={media.lookbook?.image1 || ''}
                      onChange={e => store.updateLookbook({ image1: e.target.value })}
                      style={{ borderRadius: 8, flex: 1 }}
                    />
                    <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '8px 14px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                      📁 Importer
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageFileUpload(e, (dataUrl) => store.updateLookbook({ image1: dataUrl }))}
                      />
                    </label>
                  </div>
                </div>

                {/* Photo 2 */}
                <div style={{ border: '1px solid var(--adm-card-border)', borderRadius: 16, padding: 16 }}>
                  <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block', marginBottom: 10 }}>Photo Éditoriale 2 (Secondaire / Superposée)</strong>
                  <div style={{ height: 120, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                    <img src={media.lookbook?.image2} alt="Lookbook 2" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="admin-input"
                      value={media.lookbook?.image2 || ''}
                      onChange={e => store.updateLookbook({ image2: e.target.value })}
                      style={{ borderRadius: 8, flex: 1 }}
                    />
                    <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '8px 14px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                      📁 Importer
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={(e) => handleImageFileUpload(e, (dataUrl) => store.updateLookbook({ image2: dataUrl }))}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SUBTAB 4: FAQ & STORIES ÉDITORIALES */}
        {/* ==================================================================== */}
        {cmsSubTab === 'faq' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="admin-card" style={{ padding: '24px', borderRadius: '20px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '0 0 16px 0' }}>
                Grande Histoire Principale (Carte Gauche)
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
                <div style={{ height: 160, borderRadius: 12, overflow: 'hidden' }}>
                  <img src={media.faqEditorial?.main?.image} alt="FAQ Main" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <label className="admin-label">Titre de la Question / Article</label>
                    <input
                      className="admin-input"
                      value={media.faqEditorial?.main?.title || ''}
                      onChange={e => store.updateFaqEditorial({ main: { ...(media.faqEditorial?.main || { image: '', link: '' }), title: e.target.value } })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Lien de Destination</label>
                    <input
                      className="admin-input"
                      value={media.faqEditorial?.main?.link || ''}
                      onChange={e => store.updateFaqEditorial({ main: { ...(media.faqEditorial?.main || { image: '', title: '' }), link: e.target.value } })}
                      style={{ borderRadius: 8 }}
                    />
                  </div>
                  <div>
                    <label className="admin-label">Image Principale</label>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <input
                        className="admin-input"
                        value={media.faqEditorial?.main?.image || ''}
                        onChange={e => store.updateFaqEditorial({ main: { ...(media.faqEditorial?.main || { title: '', link: '' }), image: e.target.value } })}
                        style={{ borderRadius: 8, flex: 1 }}
                      />
                      <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '8px 14px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                        📁 Importer
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: 'none' }}
                          onChange={(e) => handleImageFileUpload(e, (dataUrl) => store.updateFaqEditorial({ main: { ...(media.faqEditorial?.main || { title: '', link: '' }), image: dataUrl } }))}
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>
              {[
                { key: 'item1', label: 'Article 1 (Entretien des Pièces)', data: media.faqEditorial?.item1 },
                { key: 'item2', label: 'Article 2 (Fiabilité & Authenticité)', data: media.faqEditorial?.item2 },
                { key: 'item3', label: 'Article 3 (Tendances & Drops)', data: media.faqEditorial?.item3 },
              ].map(item => (
                <div key={item.key} className="admin-card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
                  <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block', marginBottom: 12 }}>{item.label}</strong>
                  <div style={{ height: 100, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                    <img src={item.data?.image} alt={item.data?.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div>
                      <label className="admin-label">Titre</label>
                      <input
                        className="admin-input"
                        value={item.data?.title || ''}
                        onChange={e => store.updateFaqEditorial({ [item.key]: { ...(item.data || { image: '', link: '' }), title: e.target.value } })}
                        style={{ borderRadius: 8 }}
                      />
                    </div>
                    <div>
                      <label className="admin-label">Image</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          className="admin-input"
                          value={item.data?.image || ''}
                          onChange={e => store.updateFaqEditorial({ [item.key]: { ...(item.data || { title: '', link: '' }), image: e.target.value } })}
                          style={{ borderRadius: 8, flex: 1 }}
                        />
                        <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '6px 10px', fontSize: '11px', fontWeight: 700, display: 'inline-flex', alignItems: 'center' }}>
                          📁
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleImageFileUpload(e, (dataUrl) => store.updateFaqEditorial({ [item.key]: { ...(item.data || { title: '', link: '' }), image: dataUrl } }))}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================== */}
        {/* SUBTAB 5: GALERIE INSTAGRAM #AYMARDCLUB */}
        {/* ==================================================================== */}
        {cmsSubTab === 'community' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Header info & Add Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, background: 'var(--adm-card-bg)', padding: '20px 24px', borderRadius: '18px', border: '1px solid var(--adm-card-border)' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>📸</span> Galerie Clientèle Instagram #AymardClub ({(media.communityPhotos || []).length} photos)
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
                  Modération &amp; mise en avant des looks de vos clients taguant <strong>@aymar_store3</strong>.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const newId = `comm_${Date.now()}`;
                  store.addCommunityPhoto({
                    id: newId,
                    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=600&auto=format&fit=crop',
                    user: '@nouveau_client',
                    tag: 'Look #AymardClub'
                  });
                  showToast('✓ Nouvelle photo ajoutée à la galerie !');
                }}
                className="admin-btn admin-btn-primary"
                style={{ borderRadius: '12px', padding: '10px 20px', fontWeight: 800, fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
              >
                <span>+</span> Ajouter une photo client
              </button>
            </div>

            {/* Grid of Community Photos */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              {(media.communityPhotos || []).map((photo, i) => (
                <div key={photo.id} className="admin-card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)' }}>Photo #{i + 1}</strong>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 800 }}>{photo.user}</span>
                      <button
                        type="button"
                        onClick={() => {
                          showConfirmDialog({
                            title: 'Supprimer cette photo ?',
                            message: `Voulez-vous retirer la publication de ${photo.user} de la galerie de la page d'accueil ?`,
                            onConfirm: () => {
                              store.deleteCommunityPhoto(photo.id);
                              showToast('Photo retirée de la boutique.');
                            },
                            type: 'danger',
                            confirmLabel: 'Retirer',
                            icon: '🗑️'
                          });
                        }}
                        style={{ background: 'rgba(239,68,68,0.1)', border: 'none', color: '#ef4444', cursor: 'pointer', borderRadius: '6px', padding: '4px 6px', fontSize: '11px' }}
                        title="Supprimer la photo"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <div style={{ height: 200, borderRadius: 14, overflow: 'hidden', position: 'relative', border: '1px solid var(--adm-card-border)', background: '#f1f5f9' }}>
                    <img src={photo.image} alt={photo.user} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    <div>
                      <label className="admin-label">Pseudo Instagram (ex: @alex_kicks)</label>
                      <input
                        className="admin-input"
                        value={photo.user}
                        onChange={e => store.updateCommunityPhoto(photo.id, { user: e.target.value })}
                        style={{ borderRadius: 8, fontSize: '12.5px' }}
                      />
                    </div>
                    <div>
                      <label className="admin-label">Modèle / Look porté (ex: Jordan 4 Retro White)</label>
                      <input
                        className="admin-input"
                        value={photo.tag}
                        onChange={e => store.updateCommunityPhoto(photo.id, { tag: e.target.value })}
                        style={{ borderRadius: 8, fontSize: '12.5px' }}
                      />
                    </div>
                    <div>
                      <label className="admin-label">Source de l&apos;image</label>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <input
                          className="admin-input"
                          value={photo.image}
                          onChange={e => store.updateCommunityPhoto(photo.id, { image: e.target.value })}
                          style={{ borderRadius: 8, flex: 1, fontSize: '12px' }}
                          placeholder="https://..."
                        />
                        <label className="admin-btn admin-btn-outline" style={{ cursor: 'pointer', borderRadius: 8, padding: '6px 12px', fontSize: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                          📁 Importer
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={(e) => handleImageFileUpload(e, (dataUrl) => {
                              store.updateCommunityPhoto(photo.id, { image: dataUrl });
                              showToast('✓ Image importée avec succès !');
                            })}
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCategories = () => {
    const allCategories = store.dynamicCategories;
    const totalSubCount = allCategories.reduce((sum, c) => sum + (c.subCategories?.length || 0), 0);
    const totalProductsCount = store.products.length;

    const filteredCats = allCategories.filter(c => {
      if (!categorySearch.trim()) return true;
      const q = categorySearch.toLowerCase().trim();
      const matchCat = c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q);
      const matchSub = (c.subCategories || []).some(s => s.name.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q));
      return matchCat || matchSub;
    });

    const toggleExpand = (id: string) => {
      setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getCategoryRevenue = (catSlug: string) => {
      const categoryTotal = (store.orders || []).reduce((sum, order) => {
        const orderCatItems = (order.items || []).filter(item => item.product?.category === catSlug);
        return sum + orderCatItems.reduce((s, i) => s + ((i.product?.price || 0) * (i.quantity || 1)), 0);
      }, 0);
      const catFcfa = Math.round(categoryTotal * (store.exchangeRate || 655.957));
      return catFcfa > 0 ? `${catFcfa.toLocaleString('fr-FR')} FCFA` : '0 FCFA';
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Top Header Card (Reference Image 1:1) */}
        <div 
          className="admin-card" 
          style={{ 
            padding: '28px 36px', 
            borderRadius: '24px', 
            background: 'var(--adm-card-bg)', 
            border: '1px solid var(--adm-card-border)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#6366f1' }}>
                ORGANISATION DES ARTICLES
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
                Catégories
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0, maxWidth: '680px' }}>
                Structurez votre offre en regroupant les articles par univers pour faciliter la recherche et l'analyse.
              </p>
            </div>

            <button 
              className="admin-btn admin-btn-primary" 
              onClick={() => setModal('addCategory')}
              style={{
                borderRadius: '30px',
                padding: '12px 24px',
                fontSize: '14px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)',
                boxShadow: '0 4px 16px rgba(2, 132, 199, 0.35)',
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
              Nouvelle catégorie
            </button>
          </div>

          {/* Badges bar */}
          <div style={{ display: 'flex', gap: 12, marginTop: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ background: 'rgba(99, 102, 241, 0.12)', border: '1px solid rgba(99, 102, 241, 0.3)', padding: '6px 16px', borderRadius: '30px', fontSize: '12px', fontWeight: 700, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>🏪</span> BOUTIQUE ACTIVE : AYMARD STORE
            </div>
            <div style={{ background: 'var(--adm-card-border)', padding: '6px 16px', borderRadius: '30px', fontSize: '12px', fontWeight: 600, color: 'var(--adm-text-h)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              {allCategories.length} catégories
            </div>
            <div style={{ background: 'var(--adm-card-border)', padding: '6px 16px', borderRadius: '30px', fontSize: '12px', fontWeight: 600, color: 'var(--adm-text-h)', display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
              {totalProductsCount} articles
            </div>
          </div>
        </div>

        {/* Main Table Container Card */}
        <div 
          className="admin-card" 
          style={{ 
            padding: '28px', 
            borderRadius: '24px', 
            background: 'var(--adm-card-bg)', 
            border: '1px solid var(--adm-card-border)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)'
          }}
        >
          {/* Card Header Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 24 }}>
            <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)' }}>
              Liste des catégories d'articles
            </h2>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <button 
                className="admin-btn admin-btn-outline" 
                onClick={() => setModal('addCategory')}
                style={{ borderRadius: '12px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                Nouvelle catégorie <span style={{ fontSize: '16px', fontWeight: 700 }}>+</span>
              </button>
              <button 
                className="admin-btn admin-btn-outline" 
                onClick={() => showToast('Importation de catégories prête !')}
                style={{ borderRadius: '12px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Import
              </button>
              <button 
                className="admin-btn admin-btn-outline" 
                onClick={() => showToast('Exportation des catégories terminée !')}
                style={{ borderRadius: '12px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
                Exporter
              </button>
            </div>
          </div>

          {/* Search Row */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginBottom: 24 }}>
            <div style={{ width: '280px', position: 'relative' }}>
              <input 
                className="admin-input" 
                placeholder="Rechercher..." 
                value={categorySearch}
                onChange={e => setCategorySearch(e.target.value)}
                style={{ borderRadius: '10px', padding: '8px 14px', fontSize: '13px' }}
              />
            </div>
            {categorySearch && (
              <button 
                onClick={() => setCategorySearch('')}
                style={{ 
                  background: '#ef4444', 
                  color: '#ffffff', 
                  border: 'none', 
                  borderRadius: '10px', 
                  padding: '8px 18px', 
                  fontSize: '13px', 
                  fontWeight: 700, 
                  cursor: 'pointer',
                  transition: 'background 0.2s ease'
                }}
              >
                Effacer
              </button>
            )}
          </div>

          {/* Categories Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <th style={{ width: '60px', padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>#</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Nom</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Nombre d'articles</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Chiffre d'affaires</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCats.map((cat, idx) => {
                  const catProducts = store.products.filter(p => p.category === cat.slug);
                  const subs = cat.subCategories || [];
                  const isExpanded = expandedCategories[cat.id] === true;

                  return (
                    <React.Fragment key={cat.id}>
                      <tr 
                        style={{ 
                          borderBottom: '1px solid var(--adm-card-border)',
                          transition: 'background 0.15s ease'
                        }}
                      >
                        <td style={{ padding: '16px', fontSize: '13px', fontWeight: 600, color: 'var(--adm-text-m)' }}>
                          {idx + 1}
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            {cat.icon && (cat.icon.startsWith('http') || cat.icon.startsWith('/')) ? (
                              <img src={cat.icon} alt={cat.name} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(2, 132, 199, 0.1)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '14px' }}>
                                {cat.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                                {cat.name}
                              </div>
                              {subs.length > 0 && (
                                <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                                  {subs.length} sous-catégorie{subs.length > 1 ? 's' : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                              {catProducts.length}
                            </span>
                            <span 
                              title={`${catProducts.length} articles répertoriés dans cette catégorie`} 
                              style={{ 
                                color: '#0284c7', 
                                background: 'rgba(2,132,199,0.12)', 
                                width: '18px', 
                                height: '18px', 
                                borderRadius: '50%', 
                                display: 'inline-flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: '11px', 
                                fontWeight: 800,
                                fontStyle: 'italic',
                                cursor: 'pointer' 
                              }}
                            >
                              i
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                          {getCategoryRevenue(cat.slug)}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
                            {/* Expand Subcategories / Add subcategory button */}
                            <button 
                              onClick={() => toggleExpand(cat.id)}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#0284c7', 
                                cursor: 'pointer', 
                                padding: '6px',
                                borderRadius: '8px',
                                fontSize: '18px',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Voir / Gérer les sous-catégories"
                            >
                              +
                            </button>

                            {/* Edit button */}
                            <button 
                              onClick={() => { setSelectedParentCatForSub(cat.id); setModal('addSubCategory'); }}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#0284c7', 
                                cursor: 'pointer', 
                                padding: '6px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Ajouter une sous-catégorie"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>

                            {/* Delete button */}
                            <button 
                              onClick={() => {
                                showConfirmDialog({
                                  title: 'Supprimer la catégorie',
                                  message: `Voulez-vous vraiment supprimer la catégorie "${cat.name}" ?\nTous les produits associés perdront cette affectation.`,
                                  icon: '🗑️',
                                  type: 'danger',
                                  confirmLabel: 'Supprimer',
                                  cancelLabel: 'Annuler',
                                  onConfirm: () => {
                                    store.deleteDynamicCategory(cat.id);
                                    showToast(`Catégorie "${cat.name}" supprimée`);
                                  }
                                });
                              }}
                              style={{ 
                                background: 'none', 
                                border: 'none', 
                                color: '#ef4444', 
                                cursor: 'pointer', 
                                padding: '6px',
                                borderRadius: '8px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              title="Supprimer la catégorie"
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Sub-rows for Subcategories when expanded */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={5} style={{ padding: '16px 24px', background: 'rgba(2, 132, 199, 0.03)', borderBottom: '1px solid var(--adm-card-border)' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                              <div style={{ fontSize: '12px', fontWeight: 700, color: '#0284c7', display: 'flex', alignItems: 'center', gap: 6 }}>
                                <span>🌿</span> Sous-catégories de {cat.name} ({subs.length}) :
                              </div>

                              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                {subs.length === 0 ? (
                                  <span style={{ fontSize: '12px', color: 'var(--adm-text-m)', fontStyle: 'italic' }}>Aucune sous-catégorie créée. Utilisez le champ ci-dessous pour en ajouter une.</span>
                                ) : (
                                  subs.map(sub => (
                                    <div 
                                      key={sub.id}
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        background: 'var(--adm-card-bg)',
                                        border: '1px solid var(--adm-card-border)',
                                        borderRadius: '10px',
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        fontWeight: 600,
                                        color: 'var(--adm-text-h)'
                                      }}
                                    >
                                      <span>{sub.name}</span>
                                      <button 
                                        onClick={() => {
                                          showConfirmDialog({
                                            title: 'Supprimer la sous-catégorie',
                                            message: `Voulez-vous vraiment supprimer la sous-catégorie "${sub.name}" ?`,
                                            icon: '🗑️',
                                            type: 'danger',
                                            confirmLabel: 'Supprimer',
                                            cancelLabel: 'Annuler',
                                            onConfirm: () => {
                                              store.deleteSubCategory(cat.id, sub.id);
                                              showToast(`Sous-catégorie "${sub.name}" supprimée`);
                                            }
                                          });
                                        }}
                                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, marginLeft: 4, fontSize: '12px', fontWeight: 700 }}
                                        title="Supprimer"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ))
                                )}
                              </div>

                              {/* Add Subcategory Inline */}
                              <form 
                                onSubmit={(e) => {
                                  e.preventDefault();
                                  const input = e.currentTarget.elements.namedItem('inlineSub') as HTMLInputElement;
                                  if (!input.value.trim()) return;
                                  store.addSubCategory(cat.id, {
                                    id: genId(),
                                    name: input.value.trim(),
                                    slug: input.value.trim().toLowerCase().replace(/\s+/g, '-'),
                                    productCount: 0
                                  });
                                  showToast(`Sous-catégorie "${input.value.trim()}" ajoutée !`);
                                  input.value = '';
                                }}
                                style={{ display: 'flex', gap: 8, maxWidth: '360px', marginTop: 4 }}
                              >
                                <input 
                                  name="inlineSub"
                                  className="admin-input"
                                  placeholder="+ Nouvelle sous-catégorie..."
                                  style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px' }}
                                />
                                <button type="submit" className="admin-btn admin-btn-primary admin-btn-sm" style={{ padding: '6px 14px', fontSize: '12px', whiteSpace: 'nowrap' }}>
                                  Ajouter
                                </button>
                              </form>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>

            {filteredCats.length === 0 && (
              <EmptyState icon="📂" text="Aucune catégorie ne correspond à votre recherche" />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderOrders = () => {
    const totalAmount = filteredOrders.reduce((sum, o) => sum + o.total, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header Card */}
        <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0ea5e9' }}>
                COMMERCE & LIVRAISON
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
                Commandes clients
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
                Suivez en temps réel le traitement des commandes, leur paiement et leur expédition.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, background: 'rgba(14,165,233,0.12)', color: '#0284c7', border: '1px solid rgba(14,165,233,0.3)', padding: '8px 20px', borderRadius: '30px' }}>
                Volume : {totalAmount.toLocaleString('fr-FR')} FCFA
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}>
            {(['ALL', 'PENDING', 'SHIPPED', 'DELIVERED'] as const).map(f => (
              <button 
                key={f} 
                className={`admin-btn ${orderFilter === f ? 'admin-btn-primary' : 'admin-btn-outline'}`} 
                onClick={() => setOrderFilter(f)}
                style={{ borderRadius: '30px', padding: '8px 20px', fontSize: '13px', fontWeight: 700 }}
              >
                {f === 'ALL' ? `Toutes (${store.orders.length})` : f === 'PENDING' ? `⏳ En attente (${store.orders.filter(o => o.status === 'PENDING').length})` : f === 'SHIPPED' ? `📦 Expédiées (${store.orders.filter(o => o.status === 'SHIPPED').length})` : `✅ Livrées (${store.orders.filter(o => o.status === 'DELIVERED').length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Table Container Card */}
        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>N° Commande</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Client & Ville</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Date</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Total</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Localisation & Statut Colis</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Supervision / Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice((orderPage - 1) * 15, orderPage * 15).map(o => (
                  <tr key={o.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                    <td style={{ padding: '16px', fontWeight: 800, color: '#0284c7', fontFamily: 'var(--font-plus-jakarta)' }}>
                      <div>{o.orderNumber}</div>
                      {o.trackingNumber && (
                        <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', fontWeight: 600, marginTop: '2px' }}>
                          Suivi : {o.trackingNumber}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ fontWeight: 700, color: 'var(--adm-text-h)' }}>{o.shippingAddress.fullName}</div>
                      <div style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                        📍 {o.shippingAddress.city || 'Cotonou'} ({o.shippingAddress.country || 'Bénin'})
                      </div>
                    </td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{o.date}</td>
                    <td style={{ padding: '16px', fontWeight: 800, fontSize: '14px', color: 'var(--adm-text-h)' }}>{formatPrice(convertPrice(o.total, store.currency), store.currency)}</td>
                    <td style={{ padding: '16px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                        <Badge status={o.status} />
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          background: o.status === 'DELIVERED' ? 'rgba(34,197,94,0.12)' : 'rgba(14,165,233,0.12)',
                          color: o.status === 'DELIVERED' ? '#15803d' : '#0369a1',
                          padding: '3px 9px',
                          borderRadius: '8px',
                          fontSize: '11.5px',
                          fontWeight: 700,
                          maxWidth: '220px',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}>
                          <span>📍</span>
                          <span>{o.currentLocation || (o.status === 'DELIVERED' ? 'Remis au client' : o.status === 'SHIPPED' ? 'En cours d\'acheminement' : 'Entrepôt Cotonou (Haie Vive)')}</span>
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        <button
                          type="button"
                          onClick={() => openTrackingManager(o)}
                          className="admin-btn admin-btn-primary admin-btn-sm"
                          style={{
                            borderRadius: '10px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: '#0284c7',
                            color: '#ffffff',
                            boxShadow: '0 2px 8px rgba(2,132,199,0.3)'
                          }}
                          title="Gérer la localisation et l'étape de livraison affichée au client"
                        >
                          <span>🛰️</span>
                          <span>Suivi Direct</span>
                        </button>

                        <select 
                          className="admin-select" 
                          style={{ width: 120, padding: '6px 8px', borderRadius: '10px', fontSize: '11.5px' }} 
                          value={o.status} 
                          onChange={e => { 
                            const newStat = e.target.value as 'PENDING' | 'SHIPPED' | 'DELIVERED';
                            store.updateOrderStatus(o.id, newStat);
                            store.updateOrderTracking(o.id, {
                              trackingStep: newStat === 'DELIVERED' ? 4 : newStat === 'SHIPPED' ? 3 : 2,
                              status: newStat
                            });
                            showToast('Statut de commande & suivi actualisés'); 
                          }}
                        >
                          <option value="PENDING">En attente</option>
                          <option value="SHIPPED">Expédiée</option>
                          <option value="DELIVERED">Livrée</option>
                        </select>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredOrders.length === 0 && <EmptyState icon="🛒" text="Aucune commande enregistrée" />}
          </div>

          {/* Orders pagination controls */}
          {filteredOrders.length > 15 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--adm-card-border)', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                Commandes {(orderPage - 1) * 15 + 1} à {Math.min(orderPage * 15, filteredOrders.length)} sur {filteredOrders.length}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  onClick={() => setOrderPage(p => Math.max(1, p - 1))}
                  disabled={orderPage === 1}
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  style={{ borderRadius: 8, opacity: orderPage === 1 ? 0.4 : 1 }}
                >
                  ◀ Précédent
                </button>
                <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-h)', background: 'rgba(56,189,248,0.1)', borderRadius: 8 }}>
                  {orderPage} / {Math.ceil(filteredOrders.length / 15)}
                </span>
                <button 
                  onClick={() => setOrderPage(p => Math.min(Math.ceil(filteredOrders.length / 15), p + 1))}
                  disabled={orderPage >= Math.ceil(filteredOrders.length / 15)}
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  style={{ borderRadius: 8, opacity: orderPage >= Math.ceil(filteredOrders.length / 15) ? 0.4 : 1 }}
                >
                  Suivant ▶
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderClients = () => {
    const vipCount = store.clients.filter(c => c.totalOrders >= 100 || c.isVipOverride).length;
    const totalGrantedPerks = store.clients.reduce((acc, c) => acc + (c.customPerks?.length || 0), 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        
        {/* Top Header Card */}
        <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#f59e0b' }}>GESTION CLIENTÈLE &amp; CLUB VIP</span>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>Base Clients, Statut VIP &amp; Privilèges</h1>
              <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
                Règle officielle : le statut VIP se débloque automatiquement dès <strong>100 commandes passées</strong>. Vous pouvez également surclasser un client manuellement ou lui attribuer des cadeaux &amp; points fidélité personnalisés.
              </p>
            </div>
            <button className="admin-btn admin-btn-primary" onClick={() => setModal('addClient')} style={{ borderRadius: '30px', padding: '12px 24px', fontSize: '14px', fontWeight: 700 }}>
              + Ajouter un Client
            </button>
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="admin-card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: 'var(--adm-text-m)' }}>Clients Enregistrés</span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: 'var(--adm-text-h)', marginTop: 4 }}>{store.clients.length}</div>
          </div>
          <div className="admin-card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#f59e0b' }}>Membres VIP (100+ cmd ou surclassés)</span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#f59e0b', marginTop: 4 }}>{vipCount}</div>
          </div>
          <div className="admin-card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#10b981' }}>Cadeaux &amp; Privilèges Distribués</span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#10b981', marginTop: 4 }}>{totalGrantedPerks} accordés</div>
          </div>
          <div className="admin-card" style={{ padding: '20px', borderRadius: '18px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: '#0284c7' }}>Palier VIP Automatique</span>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', marginTop: 8 }}>100 Commandes</div>
          </div>
        </div>

        {/* Client Management Table */}
        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Client</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Statut VIP</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Score &amp; Points (1€/1000F = 1PT)</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Parrainage &amp; Filleuls</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Total Dépensé</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Audit &amp; Actions</th>
                </tr>
              </thead>
              <tbody>
                {store.clients.map(c => {
                  const isAutoVip = c.totalOrders >= 100;
                  const isVip = isAutoVip || Boolean(c.isVipOverride);
                  const progressPct = Math.min(100, Math.round((c.totalOrders / 100) * 100));
                  const refCode = c.referralCode || generateReferralCode(c.email, c.name);
                  const referralsCount = (store.clients || []).filter(x => x.referredBy === refCode).length;
                  const orderPts = calculatePointsEarned(c.totalSpent, store.currency);
                  const totalPtsEarned = orderPts + (c.bonusPoints || 0) + (c.referralPointsEarned || 0);
                  const availablePts = Math.max(0, totalPtsEarned - (c.spentLoyaltyPoints || 0));

                  return (
                    <tr key={c.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 38, height: 38, borderRadius: '50%', background: isVip ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'linear-gradient(135deg, #0284c7, #0369a1)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '13px', boxShadow: isVip ? '0 0 10px rgba(245,158,11,0.4)' : undefined }}>
                            {isVip ? '★' : c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: 'var(--adm-text-h)' }}>{c.name}</div>
                            <div style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>{c.email} {c.phone ? `· ${c.phone}` : ''}</div>
                          </div>
                        </div>
                      </td>

                      {/* VIP Status */}
                      <td style={{ padding: '16px' }}>
                        {isAutoVip ? (
                          <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(245,158,11,0.15)', color: '#d97706', border: '1px solid #f59e0b', padding: '4px 10px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            ★ VIP (100+ Commandes)
                          </span>
                        ) : c.isVipOverride ? (
                          <span style={{ fontSize: '11px', fontWeight: 900, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6', border: '1px solid #8b5cf6', padding: '4px 10px', borderRadius: '12px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            👑 VIP Surclassé
                          </span>
                        ) : (
                          <span style={{ fontSize: '11px', fontWeight: 700, background: 'var(--adm-card-border)', color: 'var(--adm-text-m)', padding: '4px 10px', borderRadius: '12px' }}>
                            Standard ({c.totalOrders}/100)
                          </span>
                        )}
                      </td>

                      {/* Score & Points with breakdown */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: '14px', fontWeight: 900, color: '#f59e0b', display: 'flex', alignItems: 'center', gap: 4 }}>
                            💎 {availablePts} <span style={{ fontSize: 11, color: 'var(--adm-text-m)' }}>Pts actifs</span>
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                            Total acquis: {totalPtsEarned} Pts · {orderPts} (achats) + {c.bonusPoints || 0} (bonus)
                          </span>
                        </div>
                      </td>

                      {/* Parrainage & Filleuls */}
                      <td style={{ padding: '16px' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', fontFamily: 'monospace' }}>
                            {refCode}
                          </span>
                          <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
                            👥 {referralsCount} filleul(s) {c.referredBy ? `· Parrainé: ${c.referredBy}` : ''}
                          </span>
                        </div>
                      </td>

                      {/* Total Spent */}
                      <td style={{ padding: '16px', fontWeight: 800, color: '#10b981' }}>
                        {formatPrice(convertPrice(c.totalSpent, store.currency), store.currency)}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          
                          {/* Audit Button */}
                          <button
                            className="admin-btn admin-btn-sm"
                            onClick={() => setAuditClient(c)}
                            style={{
                              borderRadius: '8px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 800,
                              background: 'rgba(2,132,199,0.12)',
                              color: '#0284c7',
                              border: '1px solid rgba(2,132,199,0.3)'
                            }}
                            title="Consulter le journal d'audit complet expliquant le score de ce client"
                          >
                            📜 Audit Points
                          </button>

                          {/* Toggle VIP */}
                          <button
                            className="admin-btn admin-btn-sm"
                            onClick={() => {
                              store.toggleClientVip(c.id);
                              showToast(c.isVipOverride ? `Statut VIP surclassé retiré pour ${c.name}` : `👑 ${c.name} surclassé en Membre VIP avec succès !`);
                            }}
                            style={{
                              borderRadius: '8px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 800,
                              background: c.isVipOverride ? 'rgba(239,68,68,0.1)' : 'rgba(245,158,11,0.15)',
                              color: c.isVipOverride ? '#ef4444' : '#d97706',
                              border: c.isVipOverride ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(245,158,11,0.4)'
                            }}
                            title="Surclasser ou rétrograder le statut VIP de ce client"
                          >
                            {c.isVipOverride ? '👑 Rétrograder' : '👑 VIP'}
                          </button>

                          {/* Grant Bonus Points */}
                          <button
                            className="admin-btn admin-btn-sm"
                            onClick={() => {
                              setGrantBonusPointsClient(c);
                              setBonusPointsInput(100);
                              setBonusPointsReason('');
                            }}
                            style={{
                              borderRadius: '8px',
                              padding: '5px 10px',
                              fontSize: '11px',
                              fontWeight: 800,
                              background: 'rgba(16,185,129,0.12)',
                              color: '#10b981',
                              border: '1px solid rgba(16,185,129,0.3)'
                            }}
                            title="Créditer des points fidélité bonus"
                          >
                            ★ +Pts
                          </button>

                          {/* Delete Client */}
                          <button 
                            className="admin-btn admin-btn-danger admin-btn-sm" 
                            onClick={() => { store.deleteClient(c.id); showToast('Client supprimé'); }}
                            style={{ borderRadius: '8px', padding: '5px 8px' }}
                            title="Supprimer ce client"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {store.clients.length === 0 && <EmptyState icon="👥" text="Aucun client enregistré" />}
          </div>
        </div>
      </div>
    );
  };

  const renderTransactions = () => {
    const allTx = store.orders.map(o => ({ id: o.id, date: o.date, label: `Commande ${o.orderNumber}`, amount: o.total, type: 'income' as const }));
    const totalIncome = allTx.reduce((s, t) => s + t.amount, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#10b981' }}>COMPTABILITÉ & PAIEMENTS</span>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>Journal des Transactions</h1>
              <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>Historique comptable en temps réel des encaissements et règlements de la boutique.</p>
            </div>
            <span style={{ fontSize: '16px', fontWeight: 800, background: 'rgba(16,185,129,0.12)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)', padding: '10px 24px', borderRadius: '30px' }}>
              Total : {formatPrice(convertPrice(totalIncome, store.currency), store.currency)}
            </span>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Date</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Description</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Montant</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {allTx.map(t => (
                  <tr key={t.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{t.date}</td>
                    <td style={{ padding: '16px', fontWeight: 700, color: 'var(--adm-text-h)' }}>{t.label}</td>
                    <td style={{ padding: '16px', fontWeight: 800, color: '#10b981', fontFamily: 'var(--font-plus-jakarta)' }}>+{formatPrice(convertPrice(t.amount, store.currency), store.currency)}</td>
                    <td style={{ padding: '16px', textAlign: 'right' }}><span className="admin-badge active">Encaissement validé</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {allTx.length === 0 && <EmptyState icon="💰" text="Aucune transaction enregistrée" />}
          </div>
        </div>
      </div>
    );
  };

  const renderAbandonedCheckouts = () => {
    const list = store.abandonedCheckouts || [];
    const totalAbandoned = list.length;
    const failedPayments = list.filter(a => a.status === 'PAYMENT_FAILED').length;
    const recovered = list.filter(a => a.status === 'RECOVERED').length;
    const potentialRevenueEur = list
      .filter(a => a.status !== 'RECOVERED')
      .reduce((sum, a) => sum + (a.currency === 'EUR' ? a.totalAmount : a.totalAmount / (store.exchangeRate || 655.957)), 0);
    const potentialRevenueFcfa = Math.round(potentialRevenueEur * (store.exchangeRate || 655.957));
    const recoveryRate = totalAbandoned > 0 ? Math.round((recovered / totalAbandoned) * 100) : 0;

    const filteredList = list.filter(item => {
      const matchStatus = abandonedStatusFilter === 'ALL' || item.status === abandonedStatusFilter;
      const q = abandonedSearch.toLowerCase().trim();
      const matchSearch = !q ||
        item.customerName.toLowerCase().includes(q) ||
        item.customerPhone.toLowerCase().includes(q) ||
        (item.customerEmail && item.customerEmail.toLowerCase().includes(q)) ||
        (item.city && item.city.toLowerCase().includes(q)) ||
        item.product.name.toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: '1200px' }}>
        {/* Header */}
        <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(245, 158, 11, 0.05) 100%)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#ef4444' }}>
                COMMERCE &amp; CONVERSION
              </span>
              <h1 style={{ fontSize: '30px', fontWeight: 900, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
                🛒 Relance des Abandons &amp; Paniers Perdus
              </h1>
              <p style={{ fontSize: '13.5px', color: 'var(--adm-text-m)', margin: 0, maxWidth: '650px', lineHeight: 1.5 }}>
                Retrouvez les coordonnées (WhatsApp, Téléphone, Email) des clients ayant abandonné le guichet de paiement ou dont la transaction a échoué. Relancez-les en 1-clic pour convertir vos ventes.
              </p>
            </div>
            {recovered > 0 && (
              <button
                type="button"
                onClick={() => {
                  if (confirm('Voulez-vous archiver et nettoyer les abandons déjà récupérés ?')) {
                    store.clearRecoveredCheckouts();
                    showToast('Abandons récupérés archivés avec succès.');
                  }
                }}
                className="admin-btn admin-btn-outline"
                style={{ borderRadius: '20px', padding: '10px 18px', fontSize: '12px', fontWeight: 700 }}
              >
                🧹 Nettoyer les récupérés
              </button>
            )}
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="admin-card" style={{ padding: '20px 24px', borderRadius: '20px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)', display: 'block', marginBottom: '4px' }}>
              Total Abandons Détectés
            </span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)' }}>
              {totalAbandoned}
            </div>
            <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 700, marginTop: '4px', display: 'block' }}>
              dont {failedPayments} échecs de paiement
            </span>
          </div>

          <div className="admin-card" style={{ padding: '20px 24px', borderRadius: '20px', border: '1px solid rgba(245, 158, 11, 0.3)', background: 'rgba(245, 158, 11, 0.04)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#d97706', display: 'block', marginBottom: '4px' }}>
              CA Potentiel Récupérable
            </span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#d97706', fontFamily: 'var(--font-plus-jakarta)' }}>
              {potentialRevenueFcfa.toLocaleString('fr-FR')} FCFA
            </div>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)', fontWeight: 600, marginTop: '2px', display: 'block' }}>
              soit {potentialRevenueEur.toFixed(2)} €
            </span>
          </div>

          <div className="admin-card" style={{ padding: '20px 24px', borderRadius: '20px', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.04)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: '#059669', display: 'block', marginBottom: '4px' }}>
              Ventes Récupérées
            </span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', fontFamily: 'var(--font-plus-jakarta)' }}>
              {recovered}
            </div>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700, marginTop: '4px', display: 'block' }}>
              Taux de succès : {recoveryRate}%
            </span>
          </div>
        </div>

        {/* Filters & Search Toolbar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `Tous (${list.length})` },
              { id: 'PAYMENT_FAILED', label: `🔴 Paiement Échoué (${failedPayments})` },
              { id: 'ABANDONED', label: `🟡 Guichet Fermé (${list.filter(a => a.status === 'ABANDONED').length})` },
              { id: 'RECOVERED', label: `🟢 Vente Conclue (${recovered})` },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setAbandonedStatusFilter(f.id as any)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '20px',
                  border: abandonedStatusFilter === f.id ? '1.5px solid #0284c7' : '1px solid var(--adm-card-border)',
                  background: abandonedStatusFilter === f.id ? '#0284c7' : 'var(--adm-card-bg)',
                  color: abandonedStatusFilter === f.id ? '#ffffff' : 'var(--adm-text-h)',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '280px' }}>
            <input
              type="text"
              placeholder="Rechercher par nom, tél, sneaker..."
              value={abandonedSearch}
              onChange={e => setAbandonedSearch(e.target.value)}
              className="admin-input"
              style={{ width: '100%', borderRadius: '20px', padding: '8px 14px 8px 34px', fontSize: '12.5px' }}
            />
            <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--adm-text-m)' }}>
              🔍
            </span>
          </div>
        </div>

        {/* Abandoned List Table */}
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden', borderRadius: '20px', border: '1px solid var(--adm-card-border)' }}>
          {filteredList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-m)' }}>
              <span style={{ fontSize: '42px', display: 'block', marginBottom: '10px' }}>🎉</span>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '0 0 4px 0' }}>
                Aucun abandon en attente de relance
              </h4>
              <p style={{ fontSize: '13px', margin: 0 }}>
                Tous vos prospects ont finalisé leurs achats ou ont déjà été relancés avec succès.
              </p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--adm-table-stripe)', borderBottom: '1px solid var(--adm-card-border)', textAlign: 'left' }}>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Date &amp; Heure</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Client &amp; Contact</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Sneaker / Modèle</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Montant</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Statut / Motif</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800, textAlign: 'right' }}>Relance 1-Clic WhatsApp</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map(item => {
                    const prod = item.product;
                    const cleanPhone = (item.customerPhone || '').replace(/[^0-9]/g, '');
                    const customerFirstName = item.customerName.split(' ')[0] || 'Cher Client';
                    const productName = prod?.name || 'votre sneaker';
                    const sizeInfo = prod?.size ? ` (Taille ${prod.size})` : '';

                    const waMsg = `Bonjour ${customerFirstName} ! C'est l'équipe Aymard Store. 👟\n\nNous avons remarqué que vous n'avez pas pu finaliser votre commande pour la paire ${productName}${sizeInfo}.\n\nAvez-vous rencontré une difficulté lors du paiement Mobile Money / Carte ? Nous sommes à votre entière disposition pour vous assister ou vous réserver votre pointure dès maintenant !`;

                    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(waMsg)}`;

                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                        {/* Date */}
                        <td style={{ padding: '14px 18px', fontSize: '12px', color: 'var(--adm-text-m)', whiteSpace: 'nowrap' }}>
                          <div>{item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : 'Récemment'}</div>
                          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', opacity: 0.8 }}>
                            {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                          </span>
                        </td>

                        {/* Customer Info */}
                        <td style={{ padding: '14px 18px' }}>
                          <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)', display: 'block' }}>
                            {item.customerName}
                          </strong>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px', fontSize: '12px' }}>
                            <span style={{ color: '#16a34a', fontWeight: 700 }}>💬 {item.customerPhone}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', display: 'block' }}>
                            📍 {item.city || 'Cotonou'} {item.country ? `(${item.country})` : ''}
                          </span>
                        </td>

                        {/* Product */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {prod?.image ? (
                              <img
                                src={prod.image}
                                alt={prod.name}
                                style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'contain', background: '#f8fafc' }}
                              />
                            ) : (
                              <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(2,132,199,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                👟
                              </div>
                            )}
                            <div>
                              <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block' }}>
                                {prod?.name}
                              </strong>
                              <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                                Pointure : <strong>{prod?.size || 'Standard'}</strong> • Qté : {prod?.quantity || 1}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Amount */}
                        <td style={{ padding: '14px 18px' }}>
                          <strong style={{ fontSize: '14px', fontWeight: 800, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)', display: 'block' }}>
                            {item.currency === 'FCFA' ? `${item.totalAmount.toLocaleString('fr-FR')} FCFA` : `${item.totalAmount.toFixed(2)} €`}
                          </strong>
                          {item.discountCode && (
                            <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '1px 6px', borderRadius: '6px', display: 'inline-block', marginTop: '2px' }}>
                              🏷️ {item.discountCode}
                            </span>
                          )}
                        </td>

                        {/* Status & Reason */}
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            padding: '3px 10px',
                            borderRadius: '12px',
                            display: 'inline-block',
                            background: item.status === 'RECOVERED' ? 'rgba(16,185,129,0.12)' : item.status === 'PAYMENT_FAILED' ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.12)',
                            color: item.status === 'RECOVERED' ? '#10b981' : item.status === 'PAYMENT_FAILED' ? '#ef4444' : '#d97706'
                          }}>
                            {item.status === 'RECOVERED' ? '✓ Vente Conclue' : item.status === 'PAYMENT_FAILED' ? '🔴 Paiement Échoué' : '🟡 Abandon Formulaire'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', display: 'block', marginTop: '3px' }}>
                            {item.failureReason || 'Guichet fermé avant confirmation'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                            {cleanPhone && (
                              <a
                                href={waUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => {
                                  store.updateAbandonedCheckout(item.id, { recoveryAttempts: (item.recoveryAttempts || 0) + 1, lastContactedAt: new Date().toISOString() });
                                }}
                                style={{
                                  background: '#25d366',
                                  color: '#ffffff',
                                  padding: '7px 14px',
                                  borderRadius: '12px',
                                  fontSize: '12px',
                                  fontWeight: 800,
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                                }}
                                title="Ouvrir WhatsApp avec message personnalisé"
                              >
                                <span>💬</span>
                                <span>Relancer ({item.recoveryAttempts || 0})</span>
                              </a>
                            )}

                            {item.status !== 'RECOVERED' && (
                              <button
                                type="button"
                                onClick={() => {
                                  store.updateAbandonedCheckout(item.id, { status: 'RECOVERED' });
                                  showToast(`🎉 Abandon marqué comme récupéré pour ${item.customerName} !`);
                                }}
                                className="admin-btn admin-btn-outline admin-btn-sm"
                                style={{ borderRadius: '10px', fontSize: '11px', fontWeight: 700, color: '#10b981', borderColor: 'rgba(16,185,129,0.4)' }}
                                title="Marquer comme vente conclue"
                              >
                                ✓ Conclu
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`Supprimer l'enregistrement d'abandon de ${item.customerName} ?`)) {
                                  store.deleteAbandonedCheckout(item.id);
                                  showToast('Abandon supprimé');
                                }
                              }}
                              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', fontSize: '13px' }}
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAccounting = () => {
    const rawExpenses = store.expenses || [];
    const rawOrders = store.orders || [];

    const now = new Date();
    const isWithinPeriod = (dateStr?: string) => {
      if (accountingPeriod === 'all') return true;
      if (!dateStr) return true;
      let d: Date;
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          d = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10));
        } else {
          d = new Date(dateStr);
        }
      } else {
        d = new Date(dateStr);
      }
      if (isNaN(d.getTime())) return true;
      if (accountingPeriod === 'today') {
        return d.toDateString() === now.toDateString();
      }
      if (accountingPeriod === '7days') {
        const diff = (now.getTime() - d.getTime()) / (1000 * 3600 * 24);
        return diff >= 0 && diff <= 7;
      }
      if (accountingPeriod === 'month') {
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }
      if (accountingPeriod === 'quarter') {
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const itemQuarter = Math.floor(d.getMonth() / 3);
        return currentQuarter === itemQuarter && d.getFullYear() === now.getFullYear();
      }
      if (accountingPeriod === 'year') {
        return d.getFullYear() === now.getFullYear();
      }
      return true;
    };

    const filteredOrders = rawOrders.filter(o => isWithinPeriod(o.date));
    
    const totalTurnoverEur = filteredOrders.reduce((sum, o) => {
      const orderTotal = typeof o.total === 'number' ? o.total : 0;
      if (o.currency === 'FCFA' || orderTotal > 5000) {
        return sum + (orderTotal / (store.exchangeRate || 655.957));
      }
      return sum + orderTotal;
    }, 0);

    const totalTurnoverFcfa = Math.round(totalTurnoverEur * (store.exchangeRate || 655.957));

    const periodExpenses = rawExpenses.filter(e => isWithinPeriod(e.date));
    const filteredExpenses = periodExpenses.filter(e => {
      const matchCat = expenseCategoryFilter === 'ALL' || e.category === expenseCategoryFilter;
      const q = expenseSearch.toLowerCase().trim();
      const matchQuery = !q || e.title.toLowerCase().includes(q) || (e.notes && e.notes.toLowerCase().includes(q)) || (e.receiptNumber && e.receiptNumber.toLowerCase().includes(q));
      return matchCat && matchQuery;
    });

    const totalExpensesEur = periodExpenses.reduce((sum, e) => {
      const rawAmt = typeof e.amount === 'number' ? e.amount : 0;
      if (e.currency === 'FCFA' || (e.amountFcfa && !e.amount)) {
        return sum + ((e.amountFcfa || rawAmt) / (store.exchangeRate || 655.957));
      }
      return sum + rawAmt;
    }, 0);
    const totalExpensesFcfa = Math.round(totalExpensesEur * (store.exchangeRate || 655.957));

    const netProfitEur = totalTurnoverEur - totalExpensesEur;
    const netProfitFcfa = totalTurnoverFcfa - totalExpensesFcfa;
    const marginPercent = totalTurnoverEur > 0 ? Math.round((netProfitEur / totalTurnoverEur) * 100) : 0;
    const isProfitable = netProfitEur >= 0;

    const categoryBreakdown: { key: ExpenseCategory; label: string; icon: string; color: string; totalEur: number; count: number }[] = [
      { key: 'STOCK', label: 'Achats Stocks & Marchandises', icon: '📦', color: '#0284c7', totalEur: 0, count: 0 },
      { key: 'LOGISTICS', label: 'Logistique, Fret & Douanes', icon: '🚚', color: '#10b981', totalEur: 0, count: 0 },
      { key: 'MARKETING', label: 'Marketing, Pubs & Influenceurs', icon: '📢', color: '#f59e0b', totalEur: 0, count: 0 },
      { key: 'SALARIES', label: 'Salaires & Commissions Livreur', icon: '💼', color: '#8b5cf6', totalEur: 0, count: 0 },
      { key: 'RENT', label: 'Loyer, Bureaux & Charges Fixes', icon: '🏢', color: '#ec4899', totalEur: 0, count: 0 },
      { key: 'SOFTWARE', label: 'Outils, Hébergement & Cloud', icon: '🛠️', color: '#06b6d4', totalEur: 0, count: 0 },
      { key: 'FEES', label: 'Frais bancaires & Passerelles', icon: '💳', color: '#f97316', totalEur: 0, count: 0 },
      { key: 'OTHER', label: 'Divers & Imprévus', icon: '🏷️', color: '#64748b', totalEur: 0, count: 0 },
    ];

    periodExpenses.forEach(e => {
      const cat = categoryBreakdown.find(c => c.key === e.category);
      if (cat) {
        cat.totalEur += (e.amount || 0);
        cat.count += 1;
      }
    });

    const categoryLabels: Record<ExpenseCategory, { label: string; icon: string; bg: string; color: string }> = {
      STOCK: { label: 'Achats Stocks', icon: '📦', bg: 'rgba(2,132,199,0.12)', color: '#0284c7' },
      LOGISTICS: { label: 'Logistique & Fret', icon: '🚚', bg: 'rgba(16,185,129,0.12)', color: '#10b981' },
      MARKETING: { label: 'Marketing & Pubs', icon: '📢', bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
      SALARIES: { label: 'Salaires & Commissions', icon: '💼', bg: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
      RENT: { label: 'Loyer & Charges Fixes', icon: '🏢', bg: 'rgba(236,72,153,0.12)', color: '#ec4899' },
      SOFTWARE: { label: 'Logiciels & Cloud', icon: '🛠️', bg: 'rgba(6,182,212,0.12)', color: '#06b6d4' },
      FEES: { label: 'Frais & Passerelles', icon: '💳', bg: 'rgba(249,115,22,0.12)', color: '#f97316' },
      OTHER: { label: 'Divers & Imprévus', icon: '🏷️', bg: 'rgba(100,116,139,0.12)', color: '#64748b' }
    };

    const handleExportCSV = () => {
      const headers = ['Date', 'Reference', 'Libelle', 'Categorie', 'Mode_Paiement', 'Statut', 'Montant_EUR', 'Montant_FCFA', 'Notes'];
      const rows = filteredExpenses.map(e => [
        e.date,
        e.receiptNumber || `EXP-${e.id.slice(-4)}`,
        `"${e.title.replace(/"/g, '""')}"`,
        e.category,
        e.paymentMethod,
        e.status,
        e.amount,
        e.amountFcfa || Math.round(e.amount * (store.exchangeRate || 655.957)),
        `"${(e.notes || '').replace(/"/g, '""')}"`
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `grand-livre-comptable-aymard-store-${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Export du Grand Livre comptable téléchargé !');
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
        {/* Quick Navigation / Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button 
            type="button"
            onClick={() => setTab('dashboard')} 
            className="admin-btn admin-btn-outline admin-btn-sm" 
            style={{ 
              borderRadius: '20px', 
              padding: '7px 16px', 
              fontSize: '12.5px', 
              fontWeight: 700, 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 6,
              background: 'var(--adm-card-bg)',
              border: '1px solid var(--adm-card-border)',
              cursor: 'pointer'
            }}
          >
            <span>←</span> Retour au Tableau de bord
          </button>
        </div>

        {/* Top Header Card */}
        <div 
          className="admin-card" 
          style={{ 
            padding: '24px 28px', 
            borderRadius: '20px', 
            background: 'var(--adm-card-bg)', 
            border: '1px solid var(--adm-card-border)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'hidden'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div style={{ minWidth: 0, flex: '1 1 300px' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginBottom: 6 }}>
                <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#10b981' }}>
                  GESTION FINANCIÈRE & RENTABILITÉ
                </span>
                <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '12px', background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
                  Exercice 2026
                </span>
              </div>
              <h1 style={{ fontSize: '28px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
                Comptabilité & Bilan Financier
              </h1>
              <p style={{ fontSize: '13.5px', color: 'var(--adm-text-m)', margin: 0, maxWidth: '720px' }}>
                Suivez en temps réel votre chiffre d&apos;affaires, enregistrez vos dépenses (achats stocks, logistique, pubs, salaires) et pilotez votre bénéfice net.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <button 
                className="admin-btn admin-btn-primary" 
                onClick={() => {
                  setEditingExpense(null);
                  setModal('addExpense');
                }}
                style={{
                  borderRadius: '30px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  boxShadow: '0 4px 16px rgba(16, 185, 129, 0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  whiteSpace: 'nowrap',
                  flexShrink: 0
                }}
              >
                <span style={{ fontSize: '16px', fontWeight: 800 }}>+</span>
                Nouvelle dépense / charge
              </button>

              <button 
                className="admin-btn admin-btn-outline" 
                onClick={handleExportCSV}
                style={{ borderRadius: '30px', padding: '10px 18px', fontSize: '12.5px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', flexShrink: 0 }}
                title="Exporter le journal comptable au format CSV"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Exporter (CSV)
              </button>

              <button 
                className="admin-btn admin-btn-outline" 
                onClick={() => {
                  if (confirm('Voulez-vous vraiment remettre à 0 toutes les écritures comptables et dépenses ?')) {
                    store.clearAccountingData();
                    showToast('Comptabilité réinitialisée à 0 € / 0 FCFA.');
                  }
                }}
                style={{ borderRadius: '30px', padding: '10px 18px', fontSize: '12.5px', fontWeight: 600, color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
                title="Remettre toutes les dépenses à zéro"
              >
                <span>🗑️</span>
                Remettre compta à 0
              </button>
            </div>
          </div>

          {/* Time Filter Pills */}
          <div style={{ display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--adm-card-border)', paddingTop: 16 }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)', marginRight: 4 }}>
              Période comptable :
            </span>
            {[
              { id: 'all', label: 'Tout l\'historique' },
              { id: 'today', label: 'Aujourd\'hui' },
              { id: '7days', label: '7 derniers jours' },
              { id: 'month', label: 'Ce mois-ci (Août 2026)' },
              { id: 'quarter', label: 'Ce trimestre (T3)' },
              { id: 'year', label: 'Cette année (2026)' }
            ].map(p => (
              <button
                key={p.id}
                onClick={() => setAccountingPeriod(p.id as any)}
                style={{
                  padding: '5px 12px',
                  borderRadius: '20px',
                  border: accountingPeriod === p.id ? '1px solid #10b981' : '1px solid var(--adm-card-border)',
                  background: accountingPeriod === p.id ? 'rgba(16,185,129,0.15)' : 'var(--adm-card-bg)',
                  color: accountingPeriod === p.id ? '#10b981' : 'var(--adm-text-m)',
                  fontSize: '11.5px',
                  fontWeight: accountingPeriod === p.id ? 800 : 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* 4 KPI Summary Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))', gap: 16, width: '100%', boxSizing: 'border-box' }}>
          
          {/* Card 1: Chiffre d'Affaires Brut */}
          <div 
            className="admin-card" 
            style={{ 
              padding: '20px', 
              borderRadius: '18px', 
              background: 'var(--adm-card-bg)', 
              border: '1px solid var(--adm-card-border)',
              position: 'relative',
              overflow: 'hidden',
              minWidth: 0,
              boxSizing: 'border-box',
              margin: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--adm-text-m)' }}>
                Chiffre d&apos;Affaires (Revenus)
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(56,189,248,0.15)', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                💰
              </div>
            </div>
            <div style={{ fontSize: 'clamp(18px, 1.8vw, 24px)', fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)', wordBreak: 'break-word', lineHeight: 1.2 }}>
              {totalTurnoverFcfa.toLocaleString('fr-FR')} FCFA
            </div>
            <div style={{ fontSize: '12px', color: 'var(--adm-text-m)', marginTop: 4 }}>
              soit <strong style={{ color: 'var(--adm-text-h)' }}>{totalTurnoverEur.toLocaleString('fr-FR')} €</strong> ({filteredOrders.length} commande{filteredOrders.length > 1 ? 's' : ''})
            </div>
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: '10px', background: 'rgba(16,185,129,0.12)', color: '#10b981', fontSize: '10.5px', fontWeight: 700 }}>
              <span>↗</span> Encaissements réels
            </div>
          </div>

          {/* Card 2: Total Dépenses & Charges */}
          <div 
            className="admin-card" 
            style={{ 
              padding: '20px', 
              borderRadius: '18px', 
              background: 'var(--adm-card-bg)', 
              border: '1px solid var(--adm-card-border)',
              position: 'relative',
              overflow: 'hidden',
              minWidth: 0,
              boxSizing: 'border-box',
              margin: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--adm-text-m)' }}>
                Total Dépenses & Charges
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(239,68,68,0.15)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                📉
              </div>
            </div>
            <div style={{ fontSize: 'clamp(18px, 1.8vw, 24px)', fontWeight: 900, color: '#ef4444', fontFamily: 'var(--font-plus-jakarta)', wordBreak: 'break-word', lineHeight: 1.2 }}>
              -{totalExpensesFcfa.toLocaleString('fr-FR')} FCFA
            </div>
            <div style={{ fontSize: '12px', color: 'var(--adm-text-m)', marginTop: 4 }}>
              soit <strong style={{ color: '#ef4444' }}>-{totalExpensesEur.toLocaleString('fr-FR')} €</strong> ({periodExpenses.length} décaissement{periodExpenses.length > 1 ? 's' : ''})
            </div>
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: '10px', background: 'rgba(239,68,68,0.12)', color: '#ef4444', fontSize: '10.5px', fontWeight: 700 }}>
              <span>↘</span> Achats, Pubs & Salaires
            </div>
          </div>

          {/* Card 3: Bénéfice Net Réalisé */}
          <div 
            className="admin-card" 
            style={{ 
              padding: '20px', 
              borderRadius: '18px', 
              background: isProfitable ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)', 
              border: isProfitable ? '1.5px solid rgba(16,185,129,0.4)' : '1.5px solid rgba(239,68,68,0.4)',
              position: 'relative',
              overflow: 'hidden',
              minWidth: 0,
              boxSizing: 'border-box',
              margin: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: isProfitable ? '#10b981' : '#ef4444' }}>
                Bénéfice Net (Profit Réel)
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: isProfitable ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)', color: isProfitable ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                💎
              </div>
            </div>
            <div style={{ fontSize: 'clamp(18px, 1.8vw, 24px)', fontWeight: 900, color: isProfitable ? '#10b981' : '#ef4444', fontFamily: 'var(--font-plus-jakarta)', wordBreak: 'break-word', lineHeight: 1.2 }}>
              {isProfitable ? '+' : ''}{netProfitFcfa.toLocaleString('fr-FR')} FCFA
            </div>
            <div style={{ fontSize: '12px', color: 'var(--adm-text-m)', marginTop: 4 }}>
              soit <strong style={{ color: isProfitable ? '#10b981' : '#ef4444' }}>{isProfitable ? '+' : ''}{netProfitEur.toLocaleString('fr-FR')} €</strong> net
            </div>
            <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: '10px', background: isProfitable ? 'rgba(16,185,129,0.18)' : 'rgba(239,68,68,0.18)', color: isProfitable ? '#059669' : '#dc2626', fontSize: '10.5px', fontWeight: 800 }}>
              {isProfitable ? '✓ BÉNÉFICIAIRE' : '⚠️ DÉFICIT TEMPORAIRE'}
            </div>
          </div>

          {/* Card 4: Taux de Marge Commerciale */}
          <div 
            className="admin-card" 
            style={{ 
              padding: '20px', 
              borderRadius: '18px', 
              background: 'var(--adm-card-bg)', 
              border: '1px solid var(--adm-card-border)',
              position: 'relative',
              overflow: 'hidden',
              minWidth: 0,
              boxSizing: 'border-box',
              margin: 0
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--adm-text-m)' }}>
                Taux de Marge Nette
              </span>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(234,179,8,0.15)', color: '#ca8a04', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>
                📊
              </div>
            </div>
            <div style={{ fontSize: 'clamp(18px, 1.8vw, 24px)', fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)', wordBreak: 'break-word', lineHeight: 1.2 }}>
              {marginPercent}%
            </div>
            <div style={{ fontSize: '13px', color: 'var(--adm-text-m)', marginTop: 4 }}>
              sur chaque euro / FCFA vendu
            </div>
            <div style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: '12px', background: 'rgba(234,179,8,0.12)', color: '#ca8a04', fontSize: '11px', fontWeight: 700 }}>
              Ratio : Bénéfice Net / Ventes Brutes
            </div>
          </div>

        </div>

        {/* 2-Column Analytical Cards: Breakdown & P&L */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>
          
          {/* Column 1: Répartition des Dépenses par Catégorie */}
          <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🎯</span> Répartition des Charges & Dépenses
              </h3>
              <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>
                {totalExpensesFcfa.toLocaleString('fr-FR')} FCFA total
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {categoryBreakdown.map(cat => {
                const pct = totalExpensesEur > 0 ? Math.round((cat.totalEur / totalExpensesEur) * 100) : 0;
                const catFcfa = Math.round(cat.totalEur * (store.exchangeRate || 655.957));
                return (
                  <div key={cat.key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, color: 'var(--adm-text-h)' }}>
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                        {cat.count > 0 && (
                          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', fontWeight: 600 }}>({cat.count})</span>
                        )}
                      </div>
                      <div style={{ fontWeight: 800, color: 'var(--adm-text-h)' }}>
                        {catFcfa.toLocaleString('fr-FR')} FCFA <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', fontWeight: 600 }}>({pct}%)</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    <div style={{ width: '100%', height: '8px', borderRadius: '10px', background: 'var(--adm-card-border)', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${pct}%`, 
                          height: '100%', 
                          borderRadius: '10px', 
                          background: cat.color,
                          transition: 'width 0.4s ease'
                        }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Column 2: Compte de Résultat Simplifié (P&L) */}
          <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>📋</span> Compte de Résultat Simplifié (P&L)
              </h3>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '4px 10px', borderRadius: 20 }}>
                Synthese Directe
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Ligne 1: Chiffre d'affaires */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(56,189,248,0.08)' }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '13px', color: 'var(--adm-text-h)' }}>Produits d&apos;Exploitation (Ventes)</div>
                  <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Commandes clients & encaissements réels</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#0284c7' }}>
                  +{totalTurnoverFcfa.toLocaleString('fr-FR')} FCFA
                </div>
              </div>

              {/* Ligne 2: Coût des marchandises vendues (Stocks) */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--adm-text-h)' }}>- Achats de Marchandises & Stocks (COGS)</div>
                  <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Fournisseurs, paires de sneakers & emballages</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                  -{Math.round((categoryBreakdown.find(c => c.key === 'STOCK')?.totalEur || 0) * (store.exchangeRate || 655.957)).toLocaleString('fr-FR')} FCFA
                </div>
              </div>

              {/* Ligne 3: Charges opérationnelles externes */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--adm-text-h)' }}>- Charges Opérationnelles (Fret, Pubs, Outils)</div>
                  <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>DHL, Meta Ads, TikTok, abonnements cloud</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                  -{Math.round(((categoryBreakdown.find(c => c.key === 'LOGISTICS')?.totalEur || 0) + (categoryBreakdown.find(c => c.key === 'MARKETING')?.totalEur || 0) + (categoryBreakdown.find(c => c.key === 'SOFTWARE')?.totalEur || 0) + (categoryBreakdown.find(c => c.key === 'FEES')?.totalEur || 0) + (categoryBreakdown.find(c => c.key === 'OTHER')?.totalEur || 0)) * (store.exchangeRate || 655.957)).toLocaleString('fr-FR')} FCFA
                </div>
              </div>

              {/* Ligne 4: Rémunérations et salaires */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderRadius: '12px', background: 'rgba(239,68,68,0.06)' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--adm-text-h)' }}>- Charges de Personnel & Livraisons</div>
                  <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Équipe boutique & coursiers express</div>
                </div>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                  -{Math.round((categoryBreakdown.find(c => c.key === 'SALARIES')?.totalEur || 0) * (store.exchangeRate || 655.957)).toLocaleString('fr-FR')} FCFA
                </div>
              </div>

              {/* Ligne 5: Résultat net */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderRadius: '14px', background: isProfitable ? 'linear-gradient(135deg, rgba(16,185,129,0.15) 0%, rgba(5,150,105,0.2) 100%)' : 'rgba(239,68,68,0.12)', border: isProfitable ? '1.5px solid #10b981' : '1.5px solid #ef4444', marginTop: 6 }}>
                <div>
                  <div style={{ fontWeight: 900, fontSize: '14px', color: 'var(--adm-text-h)' }}>= RÉSULTAT NET COMPTABLE</div>
                  <div style={{ fontSize: '11px', color: isProfitable ? '#059669' : '#dc2626', fontWeight: 700 }}>
                    {isProfitable ? 'Bénéfice Réel Encaissé' : 'Déficit Net'} • Marge {marginPercent}%
                  </div>
                </div>
                <div style={{ fontSize: '18px', fontWeight: 900, color: isProfitable ? '#10b981' : '#ef4444', fontFamily: 'var(--font-plus-jakarta)' }}>
                  {isProfitable ? '+' : ''}{netProfitFcfa.toLocaleString('fr-FR')} FCFA
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Grand Livre & Journal des Dépenses (Table Card) */}
        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          {/* Table Header & Actions */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)' }}>
                Journal des Dépenses & Grand Livre ({filteredExpenses.length} écritures)
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
                Enregistrez chaque paiement de facture, achat de stock ou dépense opérationnelle.
              </p>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <input 
                className="admin-input" 
                placeholder="🔍 Rechercher une dépense, n° reçu..." 
                value={expenseSearch}
                onChange={e => setExpenseSearch(e.target.value)}
                style={{ width: 260, borderRadius: 12, padding: '8px 14px', fontSize: '13px' }}
              />

              <button 
                className="admin-btn admin-btn-primary" 
                onClick={() => {
                  setEditingExpense(null);
                  setModal('addExpense');
                }}
                style={{ borderRadius: 12, padding: '8px 18px', fontSize: '13px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <span>+</span> Nouvelle Dépense
              </button>
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 12, marginBottom: 16 }}>
            <button
              onClick={() => setExpenseCategoryFilter('ALL')}
              style={{
                padding: '6px 14px',
                borderRadius: '20px',
                border: expenseCategoryFilter === 'ALL' ? '1px solid #10b981' : '1px solid var(--adm-card-border)',
                background: expenseCategoryFilter === 'ALL' ? 'rgba(16,185,129,0.15)' : 'var(--adm-card-bg)',
                color: expenseCategoryFilter === 'ALL' ? '#10b981' : 'var(--adm-text-m)',
                fontSize: '12px',
                fontWeight: expenseCategoryFilter === 'ALL' ? 800 : 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              Toutes les charges ({periodExpenses.length})
            </button>

            {Object.keys(categoryLabels).map(catKey => {
              const catInfo = categoryLabels[catKey as ExpenseCategory];
              const count = periodExpenses.filter(e => e.category === catKey).length;
              return (
                <button
                  key={catKey}
                  onClick={() => setExpenseCategoryFilter(catKey)}
                  style={{
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: expenseCategoryFilter === catKey ? `1px solid ${catInfo.color}` : '1px solid var(--adm-card-border)',
                    background: expenseCategoryFilter === catKey ? catInfo.bg : 'var(--adm-card-bg)',
                    color: expenseCategoryFilter === catKey ? catInfo.color : 'var(--adm-text-m)',
                    fontSize: '12px',
                    fontWeight: expenseCategoryFilter === catKey ? 800 : 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6
                  }}
                >
                  <span>{catInfo.icon}</span>
                  <span>{catInfo.label}</span>
                  {count > 0 && <span style={{ opacity: 0.8 }}>({count})</span>}
                </button>
              );
            })}
          </div>

          {/* Expenses Table */}
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Date</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Réf / Reçu</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Libellé de la Dépense</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Poste / Catégorie</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Règlement</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Statut</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Montant</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredExpenses.map(exp => {
                  const catInfo = categoryLabels[exp.category] || categoryLabels.OTHER;
                  const expFcfa = exp.amountFcfa || Math.round(exp.amount * (store.exchangeRate || 655.957));
                  return (
                    <tr key={exp.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                      <td style={{ padding: '14px 16px', fontSize: '12.5px', color: 'var(--adm-text-m)', whiteSpace: 'nowrap' }}>
                        {exp.date}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-h)', whiteSpace: 'nowrap' }}>
                        <span style={{ background: 'var(--adm-card-border)', padding: '3px 8px', borderRadius: '6px' }}>
                          {exp.receiptNumber || `EXP-${exp.id.slice(-4).toUpperCase()}`}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                        <div>{exp.title}</div>
                        {exp.notes && (
                          <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', fontWeight: 500, marginTop: 2 }}>{exp.notes}</div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: 5, 
                            padding: '4px 10px', 
                            borderRadius: '12px', 
                            fontSize: '11.5px', 
                            fontWeight: 700, 
                            background: catInfo.bg, 
                            color: catInfo.color 
                          }}
                        >
                          <span>{catInfo.icon}</span>
                          <span>{catInfo.label}</span>
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--adm-text-m)' }}>
                        {exp.paymentMethod === 'TRANSFER' ? '🏦 Virement' : exp.paymentMethod === 'CARD' ? '💳 Carte' : exp.paymentMethod === 'MOBILE_MONEY' ? '📱 Mobile Money' : exp.paymentMethod === 'CASH' ? '💵 Espèces' : '🅿️ PayPal'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span 
                          style={{ 
                            display: 'inline-block',
                            padding: '3px 10px', 
                            borderRadius: '12px', 
                            fontSize: '11px', 
                            fontWeight: 800,
                            background: exp.status === 'PAID' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                            color: exp.status === 'PAID' ? '#10b981' : '#f59e0b'
                          }}
                        >
                          {exp.status === 'PAID' ? '✓ Payé' : '⏳ En attente'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ fontSize: '13.5px', fontWeight: 900, color: '#ef4444', fontFamily: 'var(--font-plus-jakarta)' }}>
                          -{expFcfa.toLocaleString('fr-FR')} FCFA
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                          -{exp.amount.toFixed(2)} €
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', alignItems: 'center' }}>
                          <button
                            onClick={() => {
                              setEditingExpense(exp);
                              setModal('editExpense');
                            }}
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            style={{ borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Modifier la dépense"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                          <button
                            onClick={() => {
                              showConfirmDialog({
                                title: 'Supprimer la dépense',
                                message: `Voulez-vous vraiment supprimer l'écriture de dépense "${exp.title}" ?`,
                                icon: '💸',
                                type: 'danger',
                                confirmLabel: 'Supprimer',
                                cancelLabel: 'Annuler',
                                onConfirm: () => {
                                  store.deleteExpense(exp.id);
                                  showToast(`Dépense "${exp.title}" supprimée.`);
                                }
                              });
                            }}
                            className="admin-btn admin-btn-danger admin-btn-sm"
                            style={{ borderRadius: 8, padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Supprimer la dépense"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              {filteredExpenses.length > 0 && (
                <tfoot>
                  <tr style={{ borderTop: '2px solid var(--adm-card-border)', background: 'rgba(0,0,0,0.02)' }}>
                    <td colSpan={6} style={{ padding: '14px 16px', fontWeight: 800, fontSize: '13px', color: 'var(--adm-text-h)' }}>
                      TOTAL DES CHARGES AFFICHÉES ({filteredExpenses.length} écritures) :
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'right', fontWeight: 900, fontSize: '15px', color: '#ef4444', fontFamily: 'var(--font-plus-jakarta)' }}>
                      -{filteredExpenses.reduce((sum, e) => sum + (e.amountFcfa || Math.round(e.amount * (store.exchangeRate || 655.957))), 0).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
            {filteredExpenses.length === 0 && (
              <EmptyState icon="💸" text="Aucune dépense ne correspond aux filtres sélectionnés" />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderPromos = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#f59e0b' }}>MARKETING & OFFRES</span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>Codes Promo & Notifications</h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>Enregistrez vos réductions, attribuez des codes ciblés à vos clients et envoyez des notifications instantanées.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button className="admin-btn admin-btn-outline" onClick={() => setModal('addBroadcastNotif')} style={{ borderRadius: '30px', padding: '12px 20px', fontSize: '13px', fontWeight: 700 }}>
              📢 Diffuser une Notification
            </button>
            <button className="admin-btn admin-btn-primary" onClick={() => setModal('addPromo')} style={{ borderRadius: '30px', padding: '12px 24px', fontSize: '14px', fontWeight: 700 }}>
              + Nouveau Code Promo
            </button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 20 }}>
        {store.promoCodes.map(p => {
          const isGlobal = !p.target || p.target === 'ALL';
          return (
            <div key={p.code} className="admin-card" style={{ padding: 24, borderRadius: 20, border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-plus-jakarta)', letterSpacing: 1, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '4px 12px', borderRadius: '10px' }}>{p.code}</span>
                <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => { store.removePromoCode(p.code); showToast('Code supprimé'); }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)', marginTop: 8 }}>
                {p.type === 'percent' ? `-${p.value}%` : `-${formatPrice(convertPrice(p.value, store.currency), store.currency)}`}
              </div>
              <div style={{ fontSize: 12, color: 'var(--adm-text-m)', fontWeight: 600, marginTop: 4 }}>
                {p.description || (p.type === 'percent' ? 'Remise en pourcentage sur le panier' : 'Réduction forfaitaire immédiate')}
              </div>

              <div style={{ marginTop: 16, paddingTop: 12, borderTop: '1px solid var(--adm-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  padding: '3px 10px',
                  borderRadius: '12px',
                  background: isGlobal ? 'rgba(16, 185, 129, 0.12)' : 'rgba(2, 132, 199, 0.12)',
                  color: isGlobal ? '#10b981' : '#0284c7'
                }}>
                  {isGlobal ? '🌐 Offre Publique (Tous)' : `👤 Exclusif (${p.targetClientName || p.target})`}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderDelivery = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#06b6d4' }}>LOGISTIQUE & EXPÉDITION</span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>Zones & Tarifs de Livraison</h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>Définissez les frais de transport et les délais de livraison par région, ville ou pays.</p>
          </div>
          <button className="admin-btn admin-btn-primary" onClick={() => setModal('addDeliveryZone')} style={{ borderRadius: '30px', padding: '12px 24px', fontSize: '14px', fontWeight: 700 }}>
            + Ajouter une Zone
          </button>
        </div>
      </div>

      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Lieu / Zone géographique</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Frais de livraison</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Délai estimé</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {store.deliveryZones.map(z => (
                <tr key={z.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--adm-text-h)' }}>{z.name}</td>
                  <td style={{ padding: '16px', fontWeight: 800, color: '#06b6d4' }}>{formatPrice(convertPrice(z.fee, store.currency), store.currency)}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{z.estimatedDays}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button 
                      className="admin-btn admin-btn-danger admin-btn-sm" 
                      onClick={() => {
                        showConfirmDialog({
                          title: 'Supprimer la zone',
                          message: `Voulez-vous vraiment supprimer la zone de livraison "${z.name}" ?`,
                          icon: '🚚',
                          type: 'danger',
                          confirmLabel: 'Supprimer',
                          cancelLabel: 'Annuler',
                          onConfirm: () => {
                            store.deleteDeliveryZone(z.id);
                            showToast('Zone supprimée');
                          }
                        });
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSuppliers = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#8b5cf6' }}>CHAÎNE D&apos;APPROVISIONNEMENT</span>
            <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>Fournisseurs & Réassorts</h1>
            <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>Gérez le répertoire de vos partenaires et vos commandes de réapprovisionnement.</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="admin-btn admin-btn-outline" onClick={() => setModal('addSupplyOrder')} style={{ borderRadius: '30px', padding: '12px 20px', fontSize: '13px', fontWeight: 700 }}>
              📥 Nouvel appro.
            </button>
            <button className="admin-btn admin-btn-primary" onClick={() => setModal('addSupplier')} style={{ borderRadius: '30px', padding: '12px 20px', fontSize: '13px', fontWeight: 700 }}>
              + Nouveau Fournisseur
            </button>
          </div>
        </div>
      </div>

      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 16, fontFamily: 'var(--font-plus-jakarta)' }}>Liste des Fournisseurs ({store.suppliers.length})</h3>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Nom</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Entreprise</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Email</th>
                <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Téléphone</th>
                <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {store.suppliers.map(s => (
                <tr key={s.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <td style={{ padding: '16px', fontWeight: 700, color: 'var(--adm-text-h)' }}>{s.name}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{s.company}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{s.email}</td>
                  <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{s.phone || '—'}</td>
                  <td style={{ padding: '16px', textAlign: 'right' }}>
                    <button 
                      className="admin-btn admin-btn-danger admin-btn-sm" 
                      onClick={() => {
                        showConfirmDialog({
                          title: 'Supprimer le fournisseur',
                          message: `Voulez-vous vraiment supprimer le fournisseur "${s.name}" ?`,
                          icon: '🏭',
                          type: 'danger',
                          confirmLabel: 'Supprimer',
                          cancelLabel: 'Annuler',
                          onConfirm: () => {
                            store.deleteSupplier(s.id);
                            showToast('Fournisseur supprimé');
                          }
                        });
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {store.suppliers.length === 0 && <EmptyState icon="🏭" text="Aucun fournisseur répertorié" />}
        </div>
      </div>
    </div>
  );

  const renderEmployees = () => {
    const totalSalaries = store.employees.filter(e => e.status === 'ACTIVE').reduce((s, e) => s + e.salary, 0);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#ec4899' }}>RESSOURCES HUMAINES</span>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>Gestion des Employés</h1>
              <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>Suivi des membres de l&apos;équipe, rôles, statuts et traitement de la paie.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button className="admin-btn admin-btn-outline" onClick={() => setModal('payEmployee')} style={{ borderRadius: '30px', padding: '12px 20px', fontSize: '13px', fontWeight: 700 }}>
                💳 Traiter la Paie
              </button>
              <button className="admin-btn admin-btn-primary" onClick={() => setModal('addEmployee')} style={{ borderRadius: '30px', padding: '12px 20px', fontSize: '13px', fontWeight: 700 }}>
                + Nouvel Employé
              </button>
            </div>
          </div>
        </div>

        {/* HR KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          <div className="admin-card" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Effectif total</span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', marginTop: 4 }}>{store.employees.length}</div>
          </div>
          <div className="admin-card" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Actifs</span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', marginTop: 4 }}>{store.employees.filter(e => e.status === 'ACTIVE').length}</div>
          </div>
          <div className="admin-card" style={{ padding: '20px', borderRadius: '20px', border: '1px solid var(--adm-card-border)', background: 'var(--adm-card-bg)' }}>
            <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Masse salariale / mois</span>
            <div style={{ fontSize: '24px', fontWeight: 900, color: '#0284c7', marginTop: 4 }}>{(totalSalaries * 650).toLocaleString('fr-FR')} FCFA</div>
          </div>
        </div>

        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Employé</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Poste / Rôle</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Email</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Salaire Mensuel</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Statut</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {store.employees.map(e => (
                  <tr key={e.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                    <td style={{ padding: '16px', fontWeight: 700, color: 'var(--adm-text-h)' }}>{e.name}</td>
                    <td style={{ padding: '16px', fontSize: '13px', color: '#0284c7', fontWeight: 600 }}>{e.role}</td>
                    <td style={{ padding: '16px', fontSize: '13px', color: 'var(--adm-text-m)' }}>{e.email}</td>
                    <td style={{ padding: '16px', fontWeight: 800, color: 'var(--adm-text-h)' }}>{(e.salary * 650).toLocaleString('fr-FR')} FCFA</td>
                    <td style={{ padding: '16px' }}><Badge status={e.status} /></td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => { store.toggleEmployeeStatus(e.id); showToast('Statut mis à jour'); }}>
                          {e.status === 'ACTIVE' ? '⏸️' : '▶️'}
                        </button>
                        <button 
                          className="admin-btn admin-btn-danger admin-btn-sm" 
                          onClick={() => {
                            showConfirmDialog({
                              title: "Supprimer l'employé",
                              message: `Voulez-vous vraiment retirer "${e.name}" des effectifs ?`,
                              icon: '👤',
                              type: 'danger',
                              confirmLabel: 'Supprimer',
                              cancelLabel: 'Annuler',
                              onConfirm: () => {
                                store.deleteEmployee(e.id);
                                showToast('Employé supprimé');
                              }
                            });
                          }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {store.employeePayments.length > 0 && (
          <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 16 }}>💳 Historique de paiements</h3>
            <div style={{ overflowX: 'auto' }}>
              <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Date</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Employé</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Période</th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', color: 'var(--adm-text-m)' }}>Montant</th>
                    <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', color: 'var(--adm-text-m)' }}>Méthode</th>
                  </tr>
                </thead>
                <tbody>
                  {store.employeePayments.map(p => {
                    const emp = store.employees.find(e => e.id === p.employeeId);
                    return (
                      <tr key={p.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                        <td style={{ padding: '14px 16px', fontSize: '13px' }}>{p.date}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 700 }}>{emp?.name || '—'}</td>
                        <td style={{ padding: '14px 16px', fontSize: '13px' }}>{p.period}</td>
                        <td style={{ padding: '14px 16px', fontWeight: 800, color: '#10b981' }}>{(p.amount * 650).toLocaleString('fr-FR')} FCFA</td>
                        <td style={{ padding: '14px 16px', textAlign: 'right', fontSize: '13px' }}>{p.method === 'TRANSFER' ? '🏦 Virement' : p.method === 'CASH' ? '💵 Espèces' : '📱 Mobile'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderSupportChat = () => {
    const convs = store.supportConversations || [];
    const liveRequestsCount = convs.filter(c => c.status === 'PENDING_AGENT').length;
    const inProgressCount = convs.filter(c => c.status === 'IN_PROGRESS').length;
    const satisfiedCount = convs.filter(c => c.status === 'SATISFIED').length;
    const closedCount = convs.filter(c => c.status === 'CLOSED').length;
    const botCount = convs.filter(c => c.status === 'BOT').length;

    const getStatusBadge = (status: SupportConversationStatus | string) => {
      switch (status) {
        case 'PENDING_AGENT':
          return {
            label: '🔴 En attente Conseiller',
            shortLabel: '🔴 En attente',
            bg: 'rgba(239, 68, 68, 0.15)',
            color: '#dc2626',
            border: '1px solid rgba(239, 68, 68, 0.4)'
          };
        case 'IN_PROGRESS':
          return {
            label: '🟡 En cours',
            shortLabel: '🟡 En cours',
            bg: 'rgba(245, 158, 11, 0.15)',
            color: '#d97706',
            border: '1px solid rgba(245, 158, 11, 0.4)'
          };
        case 'SATISFIED':
          return {
            label: '🟢 Satisfait / Résolu',
            shortLabel: '🟢 Satisfait',
            bg: 'rgba(16, 185, 129, 0.15)',
            color: '#059669',
            border: '1px solid rgba(16, 185, 129, 0.4)'
          };
        case 'CLOSED':
          return {
            label: '⚪ Clôturé',
            shortLabel: '⚪ Clôturé',
            bg: 'rgba(100, 116, 139, 0.15)',
            color: '#64748b',
            border: '1px solid rgba(100, 116, 139, 0.4)'
          };
        case 'BOT':
        default:
          return {
            label: '🤖 Concierge Bot',
            shortLabel: '🤖 Bot',
            bg: 'rgba(168, 85, 247, 0.15)',
            color: '#7e22ce',
            border: '1px solid rgba(168, 85, 247, 0.4)'
          };
      }
    };

    const filteredConvs = convs.filter(c => {
      if (supportFilterStatus !== 'ALL') {
        if (c.status !== supportFilterStatus) return false;
      }
      if (supportSearch.trim()) {
        const q = supportSearch.toLowerCase().trim();
        const matchName = c.customerName?.toLowerCase().includes(q);
        const matchTopic = c.topic?.toLowerCase().includes(q);
        const matchEmail = c.customerEmail?.toLowerCase().includes(q);
        const matchMsg = c.messages.some(m => m.text?.toLowerCase().includes(q));
        if (!matchName && !matchTopic && !matchEmail && !matchMsg) return false;
      }
      return true;
    });

    const activeConv = convs.find(c => c.id === selectedConvId) || filteredConvs[0] || convs[0];

    const handleAdminImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (!file.type.startsWith('image/')) {
        showToast('Veuillez choisir une image valide (JPG, PNG, etc.)', 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setAdminSelectedImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      e.target.value = '';
    };

    const handleSendAdminReply = (e: React.FormEvent) => {
      e.preventDefault();
      if ((!adminChatInput.trim() && !adminSelectedImage) || !activeConv) return;
      store.adminReplySupportMessage(activeConv.id, adminChatInput.trim() || (adminSelectedImage ? 'Photo envoyée par Aymard Store' : ''), adminSelectedImage || undefined);
      setAdminChatInput('');
      setAdminSelectedImage(null);
      showToast('Réponse envoyée au client en direct !');
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header */}
        <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#10b981' }}>
                CENTRE DE CONCIERGERIE & MESSAGERIE EN DIRECT
              </span>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
                Live Chat Support & Clients
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
                Gérez chaque discussion client de manière distincte avec son motif, date/heure et badge de statut (En attente, En cours, Satisfait, Clôturé).
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              {liveRequestsCount > 0 && (
                <span style={{ background: '#ef4444', color: '#fff', fontSize: '13px', fontWeight: 800, padding: '8px 18px', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 4px 14px rgba(239,68,68,0.35)' }}>
                  <span style={{ animation: 'livePulseDot 1.5s infinite' }}>🚨</span> {liveRequestsCount} demande(s) d&apos;agent en direct !
                </span>
              )}
              <button
                onClick={() => {
                  const msg = encodeURIComponent("Bonjour, je vous contacte depuis le service client Aymard Store.");
                  window.open(`https://wa.me/2290197362906?text=${msg}`, '_blank');
                }}
                className="admin-btn"
                style={{
                  background: '#25D366',
                  color: '#fff',
                  borderRadius: '30px',
                  padding: '10px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}
              >
                <span>📲 WhatsApp Web</span>
              </button>
            </div>
          </div>
        </div>

        {/* 2-Column Chat Studio */}
        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 24, minHeight: '640px' }}>
          {/* Left Column: Filter Tabs, Search & Conversations List */}
          <div className="admin-card" style={{ padding: '20px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Search Input */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Rechercher par client, motif, message..."
                value={supportSearch}
                onChange={(e) => setSupportSearch(e.target.value)}
                className="admin-input"
                style={{ width: '100%', borderRadius: '14px', padding: '10px 14px 10px 36px', fontSize: '13px' }}
              />
              <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--adm-text-m)' }}>🔍</span>
            </div>

            {/* Status Filter Chips */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { id: 'ALL', label: `Toutes (${convs.length})` },
                { id: 'PENDING_AGENT', label: `🔴 En attente (${liveRequestsCount})` },
                { id: 'IN_PROGRESS', label: `🟡 En cours (${inProgressCount})` },
                { id: 'SATISFIED', label: `🟢 Satisfait (${satisfiedCount})` },
                { id: 'CLOSED', label: `⚪ Clôturées (${closedCount})` },
                { id: 'BOT', label: `🤖 Bot (${botCount})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSupportFilterStatus(tab.id)}
                  style={{
                    fontSize: '11px',
                    fontWeight: supportFilterStatus === tab.id ? 800 : 600,
                    padding: '4px 10px',
                    borderRadius: '12px',
                    border: supportFilterStatus === tab.id ? '1.5px solid var(--adm-text-h)' : '1px solid var(--adm-card-border)',
                    background: supportFilterStatus === tab.id ? 'var(--adm-text-h)' : 'var(--adm-card-bg)',
                    color: supportFilterStatus === tab.id ? 'var(--adm-card-bg)' : 'var(--adm-text-m)',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Conversations List */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, maxHeight: '520px', paddingRight: 4 }}>
              {filteredConvs.map(c => {
                const isSelected = activeConv?.id === c.id;
                const lastMsg = c.messages[c.messages.length - 1];
                const badge = getStatusBadge(c.status);

                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedConvId(c.id);
                      store.markConversationAsRead(c.id);
                    }}
                    style={{
                      padding: '14px 16px',
                      borderRadius: '16px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(56, 189, 248, 0.12)' : 'var(--adm-card-border)',
                      border: isSelected ? '2px solid #0284c7' : '1px solid transparent',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 6
                    }}
                  >
                    {/* Header: Customer Name & Motif */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--adm-text-h)', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span>👤 {c.customerName || 'Visiteur'}</span>
                          {c.unreadByAdmin && (
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', boxShadow: '0 0 6px #ef4444', flexShrink: 0 }} />
                          )}
                        </div>
                        <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0284c7', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>
                          🏷️ {c.topic || 'Demande client'}
                        </div>
                      </div>
                    </div>

                    {/* Date & Time line */}
                    <div style={{ fontSize: '10.5px', color: 'var(--adm-text-m)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span>📅 {c.createdAt || 'Aujourd\'hui'}</span>
                      <span>•</span>
                      <span>⏱️ {c.lastUpdated}</span>
                    </div>

                    {/* Last message preview */}
                    <div style={{ fontSize: '12px', color: 'var(--adm-text-m)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: '1.4' }}>
                      {lastMsg?.text || (lastMsg?.image ? '📷 Photo partagée' : 'Nouvelle discussion')}
                    </div>

                    {/* Status Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                      <span style={{
                        fontSize: '10.5px',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        fontWeight: 800,
                        background: badge.bg,
                        color: badge.color,
                        border: badge.border,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}>
                        {badge.shortLabel}
                      </span>

                      <span style={{ fontSize: '10px', color: 'var(--adm-text-m)' }}>
                        {c.messages.length} msg{c.messages.length > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                );
              })}

              {filteredConvs.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: 'var(--adm-text-m)', fontSize: '13px' }}>
                  <span style={{ fontSize: '32px' }}>💬</span>
                  <div style={{ marginTop: 8, fontWeight: 700, color: 'var(--adm-text-h)' }}>Aucune discussion en cours</div>
                  <div style={{ fontSize: '11.5px', marginTop: 4, lineHeight: '1.4', color: 'var(--adm-text-m)' }}>
                    Les discussions engagées par les visiteurs et clients apparaîtront ici automatiquement en temps réel.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Chat Window, Status Selector & Response Form */}
          <div className="admin-card" style={{ padding: '0', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {activeConv ? (
              <>
                {/* Active Chat Header */}
                <div style={{ padding: '18px 24px', borderBottom: '1px solid var(--adm-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.02)', flexWrap: 'wrap', gap: 14 }}>
                  <div>
                    <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--adm-text-h)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>👤 {activeConv.customerName}</span>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#0284c7', marginTop: 2 }}>
                      🏷️ Motif : {activeConv.topic || 'Demande client'}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: 3 }}>
                      📅 Ouvert le : <strong>{activeConv.createdAt || 'Aujourd\'hui'}</strong> • Dernier échange : <strong>{activeConv.lastUpdated}</strong>
                      {activeConv.customerEmail && ` • Email : ${activeConv.customerEmail}`}
                      {activeConv.customerPhone && ` • Tél : ${activeConv.customerPhone}`}
                    </div>
                  </div>

                  {/* Status Dropdown & Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    {/* Interactive Status Selector */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Statut :</span>
                      <select
                        value={activeConv.status}
                        onChange={(e) => {
                          const newStatus = e.target.value as SupportConversationStatus;
                          store.updateSupportConversationStatus(activeConv.id, newStatus);
                          showToast(`Statut mis à jour : ${newStatus}`);
                        }}
                        style={{
                          fontSize: '11.5px',
                          fontWeight: 800,
                          padding: '6px 12px',
                          borderRadius: '14px',
                          border: getStatusBadge(activeConv.status).border,
                          background: getStatusBadge(activeConv.status).bg,
                          color: getStatusBadge(activeConv.status).color,
                          cursor: 'pointer',
                          outline: 'none'
                        }}
                      >
                        <option value="PENDING_AGENT">🔴 En attente Conseiller</option>
                        <option value="IN_PROGRESS">🟡 En cours de traitement</option>
                        <option value="SATISFIED">🟢 Satisfait / Résolu</option>
                        <option value="BOT">🤖 Concierge Bot</option>
                        <option value="CLOSED">⚪ Clôturé / Archivé</option>
                      </select>
                    </div>

                    {/* Quick Button: Satisfied */}
                    {activeConv.status !== 'SATISFIED' && (
                      <button
                        onClick={() => {
                          store.updateSupportConversationStatus(activeConv.id, 'SATISFIED');
                          showToast('Discussion marquée comme Satisfaite / Résolue 🟢');
                        }}
                        className="admin-btn admin-btn-sm"
                        style={{ background: 'rgba(16,185,129,0.15)', color: '#059669', border: '1px solid rgba(16,185,129,0.3)', borderRadius: '12px', fontWeight: 700 }}
                      >
                        ✓ Satisfait
                      </button>
                    )}

                    {/* Quick Button: Close */}
                    {activeConv.status !== 'CLOSED' && (
                      <button
                        onClick={() => {
                          store.closeSupportConversation(activeConv.id, 'CLOSED');
                          showToast('Discussion clôturée et archivée ⚪');
                        }}
                        className="admin-btn admin-btn-outline admin-btn-sm"
                        style={{ borderRadius: '12px' }}
                      >
                        🔒 Clôturer
                      </button>
                    )}

                    {/* Delete conversation */}
                    <button
                      onClick={() => {
                        showConfirmDialog({
                          title: 'Supprimer la discussion',
                          message: `Êtes-vous sûr de vouloir supprimer définitivement la discussion de "${activeConv.customerName}" ?\nCette action est irréversible.`,
                          icon: '🗑️',
                          type: 'danger',
                          confirmLabel: 'Supprimer définitivement',
                          cancelLabel: 'Annuler',
                          onConfirm: () => {
                            store.deleteSupportConversation(activeConv.id);
                            showToast('Discussion supprimée avec succès', 'success');
                          }
                        });
                      }}
                      className="admin-btn admin-btn-outline admin-btn-sm"
                      style={{ borderRadius: '12px', color: '#ef4444', borderColor: 'rgba(239,68,68,0.3)' }}
                      title="Supprimer la discussion"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* Message Stream */}
                <div style={{ flex: 1, padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '380px', background: 'rgba(0,0,0,0.01)' }}>
                  {activeConv.messages.map(m => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: m.sender === 'agent' ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        alignSelf: m.sender === 'agent' ? 'flex-end' : 'flex-start'
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 700, color: m.sender === 'agent' ? '#0284c7' : 'var(--adm-text-m)', marginBottom: 4 }}>
                        {m.sender === 'agent' ? '👔 Vous (Aymard Store)' : m.sender === 'bot' ? '🤖 Concierge Bot' : `👤 ${activeConv.customerName}`}
                      </span>

                      <div
                        style={{
                          background: m.sender === 'agent' ? 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)' : m.sender === 'user' ? 'var(--adm-card-border)' : '#f1f5f9',
                          color: m.sender === 'agent' ? '#ffffff' : '#0f172a',
                          padding: '12px 16px',
                          borderRadius: '16px',
                          fontSize: '13px',
                          lineHeight: '1.5',
                          whiteSpace: 'pre-line',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.04)'
                        }}
                      >
                        {/* Image inside bubble */}
                        {m.image && (
                          <div style={{ marginBottom: m.text ? '8px' : '0', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                            <img 
                              src={m.image} 
                              alt="Photo" 
                              style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', display: 'block', cursor: 'pointer', borderRadius: '10px' }}
                              onClick={() => window.open(m.image, '_blank')}
                              title="Cliquer pour agrandir"
                            />
                          </div>
                        )}

                        {m.text && <div>{m.text}</div>}
                      </div>

                      <span style={{ fontSize: '10px', color: 'var(--adm-text-m)', marginTop: 3 }}>
                        {m.time}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Quick Reply Preset Buttons */}
                <div style={{ padding: '8px 20px', background: 'rgba(0,0,0,0.02)', borderTop: '1px solid var(--adm-card-border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--adm-text-m)', alignSelf: 'center' }}>Réponses types :</span>
                  {[
                    "Bonjour ! Je suis le responsable Aymard Store. Comment puis-je vous aider ?",
                    "Votre commande est bien enregistrée et part en expédition prioritaire aujourd'hui.",
                    "Nous vous offrons un code de réduction VIP de -15% : HYPE20.",
                    "Pour cette paire, nous vous conseillons de choisir votre taille habituelle."
                  ].map((phrase, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAdminChatInput(phrase)}
                      style={{
                        fontSize: '11px',
                        padding: '4px 10px',
                        borderRadius: '12px',
                        border: '1px solid var(--adm-card-border)',
                        background: 'var(--adm-card-bg)',
                        color: 'var(--adm-text-h)',
                        cursor: 'pointer'
                      }}
                    >
                      {phrase.slice(0, 35)}...
                    </button>
                  ))}
                </div>

                {/* Selected Image Preview Bar for Admin */}
                {adminSelectedImage && (
                  <div style={{ padding: '8px 20px', background: 'rgba(0,0,0,0.03)', borderTop: '1px solid var(--adm-card-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={adminSelectedImage} alt="Aperçu" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid var(--adm-card-border)' }} />
                      <span style={{ fontSize: '12px', color: 'var(--adm-text-h)', fontWeight: 600 }}>Image prête à être envoyée au client</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAdminSelectedImage(null)}
                      style={{ background: 'rgba(239,68,68,0.12)', border: 'none', color: '#ef4444', width: '24px', height: '24px', borderRadius: '50%', cursor: 'pointer', fontSize: '12px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      title="Retirer la photo"
                    >
                      ✕
                    </button>
                  </div>
                )}

                {/* Admin Reply Input Box */}
                <form
                  onSubmit={handleSendAdminReply}
                  style={{
                    padding: '16px 20px',
                    borderTop: '1px solid var(--adm-card-border)',
                    display: 'flex',
                    gap: 10,
                    alignItems: 'center',
                    background: 'var(--adm-card-bg)'
                  }}
                >
                  <input
                    type="file"
                    ref={adminFileInputRef}
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleAdminImageSelect}
                  />

                  <button
                    type="button"
                    onClick={() => adminFileInputRef.current?.click()}
                    aria-label="Joindre une image"
                    title="Envoyer une photo au client"
                    className="admin-btn admin-btn-outline"
                    style={{
                      borderRadius: '12px',
                      padding: '10px 12px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: adminSelectedImage ? 'rgba(56,189,248,0.15)' : undefined,
                      borderColor: adminSelectedImage ? '#0284c7' : undefined
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                      <circle cx="8.5" cy="8.5" r="1.5"/>
                      <polyline points="21 15 16 10 5 21"/>
                    </svg>
                  </button>

                  <input
                    type="text"
                    placeholder="Écrivez votre réponse en direct au client..."
                    value={adminChatInput}
                    onChange={e => setAdminChatInput(e.target.value)}
                    className="admin-input"
                    style={{ flex: 1, borderRadius: '20px', padding: '12px 18px' }}
                  />
                  <button
                    type="submit"
                    disabled={!adminChatInput.trim() && !adminSelectedImage}
                    className="admin-btn admin-btn-primary"
                    style={{ borderRadius: '20px', padding: '12px 24px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span>Envoyer</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                  </button>
                </form>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, color: 'var(--adm-text-m)', padding: '60px 24px', textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(56,189,248,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', marginBottom: 16 }}>
                  💬
                </div>
                <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>Centre de Messagerie &amp; Live Chat</h3>
                <p style={{ marginTop: 8, fontSize: '13px', maxWidth: '420px', lineHeight: '1.5', color: 'var(--adm-text-m)' }}>
                  {convs.length > 0
                    ? "Sélectionnez une discussion dans la colonne de gauche pour consulter l'échange et répondre au client en direct."
                    : "Aucune discussion active pour le moment. Dès qu'un client engagera une conversation ou demandera un conseiller sur la boutique, ses messages s'afficheront ici en direct."
                  }
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ==========================================
  // 📊 TAB 15: ANALYTIQUES & DATA PIXEL GLOBALGEST
  // ==========================================
  const renderAnalytics = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 28, width: '100%', maxWidth: '1160px' }}>
        
        {/* Top Header Live Status */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#7c3aed' }}>
              ANALYTIQUES &amp; TRAFIC
            </span>
            <h2 style={{ fontSize: '22px', fontWeight: 900, color: 'var(--adm-text-h)', margin: '2px 0 0 0', fontFamily: 'var(--font-plus-jakarta)' }}>
              Activité &amp; Conversion en Temps Réel
            </h2>
          </div>

          <button
            type="button"
            onClick={() => {
              refreshLiveVisitors();
              setShowLiveVisitorsModal(true);
            }}
            title="Consulter les visiteurs en direct et leurs localisations géographiques"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '12px',
              background: 'var(--adm-card-bg)',
              border: '1px solid var(--adm-card-border)',
              padding: '10px 18px',
              borderRadius: '16px',
              cursor: 'pointer',
              transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.12)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--adm-card-border)';
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 16px rgba(0, 0, 0, 0.04)';
            }}
          >
            {/* Pulsing Live Radar Indicator */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '12px', height: '12px' }}>
              <span style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                borderRadius: '50%',
                background: '#10b981',
                opacity: 0.75,
                animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
              }} />
              <span style={{
                position: 'relative',
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: '#10b981'
              }} />
            </div>

            {/* Label */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)' }}>
                {analyticsData.liveVisitors} Visiteur{analyticsData.liveVisitors > 1 ? 's' : ''} en direct
              </span>
              <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--adm-text-m)' }}>
                • En ligne
              </span>
            </div>

            {/* Clean Map Icon / Action Hint */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '26px',
              height: '26px',
              borderRadius: '8px',
              background: 'rgba(16, 185, 129, 0.1)',
              color: '#059669',
              marginLeft: '2px'
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
                <line x1="8" y1="2" x2="8" y2="18"/>
                <line x1="16" y1="6" x2="16" y2="22"/>
              </svg>
            </div>
          </button>
        </div>

        {/* 1. Purple Gradient Banner */}
        <div style={{
          background: 'linear-gradient(135deg, #5b21b6 0%, #7c3aed 45%, #9333ea 100%)',
          borderRadius: '26px',
          padding: '32px 36px',
          color: '#ffffff',
          boxShadow: '0 20px 50px rgba(124, 58, 237, 0.25)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Background glow circle */}
          <div style={{ position: 'absolute', right: '-80px', top: '-80px', width: '280px', height: '280px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.15) 0%, rgba(255,255,255,0) 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '24px', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', background: 'rgba(255,255,255,0.22)', padding: '3px 10px', borderRadius: '12px' }}>
                  DATA PIXEL
                </span>
                <span style={{ fontSize: '11px', fontWeight: 800, background: 'rgba(255,255,255,0.15)', padding: '3px 10px', borderRadius: '12px' }}>
                  Boutique
                </span>
              </div>
              <h1 style={{ fontSize: '32px', fontWeight: 900, margin: '0 0 6px 0', letterSpacing: '-0.6px', fontFamily: 'var(--font-plus-jakarta)' }}>
                Suivi d&apos;activité en temps réel
              </h1>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.88)', margin: 0, maxWidth: '620px', lineHeight: '1.4' }}>
                Données brutes collectées par le pixel interne GlobalGest. Taux de conversion et visiteurs uniques.
              </p>
            </div>

            {/* DU / AU date picker */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '12px', flexWrap: 'wrap' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, opacity: 0.85, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>DU</label>
                <input
                  type="date"
                  value={analyticsStartDate}
                  onChange={(e) => setAnalyticsStartDate(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.22)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 900, opacity: 0.85, marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>AU</label>
                <input
                  type="date"
                  value={analyticsEndDate}
                  onChange={(e) => setAnalyticsEndDate(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.22)',
                    border: '1px solid rgba(255,255,255,0.35)',
                    borderRadius: '14px',
                    padding: '10px 14px',
                    color: '#ffffff',
                    fontSize: '13px',
                    fontWeight: 700,
                    outline: 'none'
                  }}
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setAnalyticsRefreshKey(k => k + 1);
                  showToast('Données GlobalGest actualisées !');
                }}
                style={{
                  background: '#ffffff',
                  color: '#6d28d9',
                  border: 'none',
                  borderRadius: '14px',
                  padding: '11px 20px',
                  fontWeight: 900,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 6px 18px rgba(0,0,0,0.15)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <span>🔄</span>
                <span>Actualiser</span>
              </button>
            </div>
          </div>

          {/* Enhanced Professional Filters Toolbar (Image 2 Redesign) */}
          <div style={{
            background: 'rgba(15, 10, 30, 0.45)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.16)',
            borderRadius: '20px',
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            flexWrap: 'wrap',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap', flex: 1 }}>
              {/* Badge Label */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(255, 255, 255, 0.15)',
                border: '1px solid rgba(255, 255, 255, 0.25)',
                padding: '6px 12px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 900,
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
                color: '#ffffff'
              }}>
                <span>⚡</span>
                <span>FILTRES</span>
              </div>

              {/* Group Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '170px', flex: '1 1 180px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Groupe :
                </span>
                <select
                  value={analyticsGroup}
                  onChange={(e) => setAnalyticsGroup(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.22)',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <option value="all" style={{ color: '#09090b', background: '#ffffff' }}>Tous les groupes</option>
                  <option value="Boutique Principale" style={{ color: '#09090b', background: '#ffffff' }}>Boutique Principale</option>
                </select>
              </div>

              {/* Boutique Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '170px', flex: '1 1 180px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Boutique :
                </span>
                <select
                  value={analyticsBoutique}
                  onChange={(e) => setAnalyticsBoutique(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.22)',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <option value="all" style={{ color: '#09090b', background: '#ffffff' }}>Toutes les boutiques</option>
                  <option value="Aymard Store" style={{ color: '#09090b', background: '#ffffff' }}>Aymard Store</option>
                </select>
              </div>

              {/* Event Filter */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '190px', flex: '1 1 200px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: 'rgba(255, 255, 255, 0.75)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Événement :
                </span>
                <select
                  value={analyticsEventFilter}
                  onChange={(e) => setAnalyticsEventFilter(e.target.value)}
                  style={{
                    flex: 1,
                    background: 'rgba(255, 255, 255, 0.12)',
                    border: '1px solid rgba(255, 255, 255, 0.22)',
                    borderRadius: '12px',
                    padding: '8px 14px',
                    color: '#ffffff',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    outline: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <option value="all" style={{ color: '#09090b', background: '#ffffff' }}>Tous les événements</option>
                  <option value="page_view" style={{ color: '#09090b', background: '#ffffff' }}>PageView</option>
                  <option value="view_item" style={{ color: '#09090b', background: '#ffffff' }}>Vue Produit</option>
                  <option value="add_to_cart" style={{ color: '#09090b', background: '#ffffff' }}>Ajout Panier</option>
                  <option value="initiate_checkout" style={{ color: '#09090b', background: '#ffffff' }}>Début Paiement</option>
                  <option value="purchase" style={{ color: '#09090b', background: '#ffffff' }}>Achat</option>
                  <option value="payment_completed" style={{ color: '#09090b', background: '#ffffff' }}>Payé</option>
                  <option value="delivery" style={{ color: '#09090b', background: '#ffffff' }}>Livré</option>
                </select>
              </div>
            </div>

            {/* Apply Button */}
            <button
              type="button"
              onClick={() => {
                setAnalyticsRefreshKey(k => k + 1);
                showToast('Filtres appliqués avec succès !');
              }}
              style={{
                background: '#ffffff',
                color: '#6d28d9',
                border: 'none',
                borderRadius: '14px',
                padding: '9px 24px',
                fontWeight: 900,
                fontSize: '13px',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.2s ease',
                flexShrink: 0
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.3)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(0, 0, 0, 0.2)';
              }}
            >
              <span>✨</span>
              <span>Appliquer</span>
            </button>
          </div>
        </div>

        {/* 2. 4 Summary Metric Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
          
          {/* Card 1: VISITEURS UNIQUES */}
          <div className="admin-card" style={{
            padding: '24px',
            borderRadius: '24px',
            background: 'var(--adm-card-bg)',
            border: '1px solid var(--adm-card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
                VISITEURS UNIQUES
              </span>
              <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--adm-text-h)', lineHeight: 1, marginBottom: '6px', fontFamily: 'var(--font-plus-jakarta)' }}>
                {analyticsData.uniqueVisitorsCount}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                Sur la période
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#ede9fe', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              👥
            </div>
          </div>

          {/* Card 2: TOTAL ÉVÉNEMENTS */}
          <div className="admin-card" style={{
            padding: '24px',
            borderRadius: '24px',
            background: 'var(--adm-card-bg)',
            border: '1px solid var(--adm-card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
                TOTAL ÉVÉNEMENTS
              </span>
              <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--adm-text-h)', lineHeight: 1, marginBottom: '6px', fontFamily: 'var(--font-plus-jakarta)' }}>
                {analyticsData.totalEventsCount}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                Actions trackées
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#fae8ff', color: '#a855f7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              👁️
            </div>
          </div>

          {/* Card 3: TAUX DE CONVERSION */}
          <div className="admin-card" style={{
            padding: '24px',
            borderRadius: '24px',
            background: 'var(--adm-card-bg)',
            border: '1px solid var(--adm-card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
                TAUX DE CONVERSION
              </span>
              <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--adm-text-h)', lineHeight: 1, marginBottom: '6px', fontFamily: 'var(--font-plus-jakarta)' }}>
                {analyticsData.conversionRate}%
              </div>
              <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                Visiteurs → Acheteurs
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#dcfce7', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              📈
            </div>
          </div>

          {/* Card 4: ACHETEURS */}
          <div className="admin-card" style={{
            padding: '24px',
            borderRadius: '24px',
            background: 'var(--adm-card-bg)',
            border: '1px solid var(--adm-card-border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase', letterSpacing: '0.8px', display: 'block', marginBottom: '8px' }}>
                ACHETEURS
              </span>
              <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--adm-text-h)', lineHeight: 1, marginBottom: '6px', fontFamily: 'var(--font-plus-jakarta)' }}>
                {analyticsData.buyersCount}
              </div>
              <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                Achats finalisés
              </span>
            </div>
            <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
              🛒
            </div>
          </div>

        </div>

        {/* 3. Conversion Funnel (Entonnoir de Conversion) */}
        <div className="admin-card" style={{
          padding: '30px 34px',
          borderRadius: '26px',
          background: 'var(--adm-card-bg)',
          border: '1px solid var(--adm-card-border)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🏆</span>
                <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)' }}>
                  Entonnoir de Conversion
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
                Parcours des visiteurs uniques vers l&apos;achat
              </p>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#16a34a', fontFamily: 'var(--font-plus-jakarta)' }}>
                {analyticsData.conversionRate}%
              </div>
              <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)', fontWeight: 700 }}>
                Taux global
              </span>
            </div>
          </div>

          {/* Funnel Steps with Pill Badges */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', marginBottom: '36px' }}>
            {analyticsData.funnel.map((step) => (
              <div
                key={step.key}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '220px 1fr',
                  alignItems: 'center',
                  gap: '20px'
                }}
              >
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                      {step.label}
                    </span>
                    <span title={step.tooltip} style={{ fontSize: '12px', color: 'var(--adm-text-m)', cursor: 'help' }}>ℹ️</span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: '2px' }}>
                    {step.pctOfPrevious}% du précédent
                  </div>
                </div>

                {/* Step Bar / Pill */}
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', maxWidth: '280px' }}>
                  <div style={{
                    width: '100%',
                    height: '42px',
                    borderRadius: '12px',
                    background: step.color,
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 900,
                    fontSize: '15px',
                    boxShadow: `0 4px 14px ${step.color}40`,
                    letterSpacing: '0.5px'
                  }}>
                    {step.count}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Taux de conversion par étape Breakdown */}
          <div style={{ borderTop: '1px solid var(--adm-card-border)', paddingTop: '24px' }}>
            <h4 style={{ fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)', textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: '16px' }}>
              Taux de conversion par étape
            </h4>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Vue Produit', rate: analyticsData.stepRates.viewProduct },
                { label: 'Ajout Panier', rate: analyticsData.stepRates.addToCart },
                { label: 'Début Paiement', rate: analyticsData.stepRates.checkout },
                { label: 'Achat', rate: analyticsData.stepRates.purchase },
                { label: 'Payé', rate: analyticsData.stepRates.paid },
                { label: 'Livré', rate: analyticsData.stepRates.delivered },
              ].map((st, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--adm-card-border)',
                    borderRadius: '14px',
                    padding: '12px 14px',
                    textAlign: 'center'
                  }}
                >
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--adm-text-m)', display: 'block', marginBottom: '4px' }}>
                    {st.label}
                  </span>
                  <strong style={{ fontSize: '16px', fontWeight: 900, color: st.rate > 0 ? '#16a34a' : '#ef4444' }}>
                    {st.rate}%
                  </strong>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 4. Two Bottom Visualizations: Évolution du Volume + Top Événements */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
          
          {/* Box 1: Évolution du volume d'événements */}
          <div className="admin-card" style={{
            padding: '26px',
            borderRadius: '24px',
            background: 'var(--adm-card-bg)',
            border: '1px solid var(--adm-card-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <span style={{ fontSize: '18px' }}>📊</span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                Évolution du volume d&apos;événements
              </h3>
            </div>

            {analyticsData.timeline.length === 0 ? (
              <div style={{
                minHeight: '180px',
                border: '1.5px dashed var(--adm-card-border)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--adm-text-m)',
                padding: '24px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '28px', marginBottom: '8px' }}>📈</span>
                <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)' }}>Aucun événement sur cette période</strong>
                <span style={{ fontSize: '12px', marginTop: '4px' }}>Les visites et actions en direct s&apos;afficheront ici automatiquement.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analyticsData.timeline.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', width: '75px', fontWeight: 700 }}>
                      {item.date}
                    </span>
                    <div style={{ flex: 1, height: '18px', background: 'var(--adm-card-border)', borderRadius: '8px', overflow: 'hidden' }}>
                      <div style={{
                        width: `${Math.min(100, Math.max(8, item.count * 15))}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #6366f1, #a855f7)',
                        borderRadius: '8px'
                      }} />
                    </div>
                    <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', width: '35px', textAlign: 'right' }}>
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Box 2: Top Événements */}
          <div className="admin-card" style={{
            padding: '26px',
            borderRadius: '24px',
            background: 'var(--adm-card-bg)',
            border: '1px solid var(--adm-card-border)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
              <span style={{ fontSize: '18px' }}>📑</span>
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                Top Événements
              </h3>
            </div>

            {analyticsData.topEvents.length === 0 ? (
              <div style={{
                minHeight: '180px',
                border: '1.5px dashed var(--adm-card-border)',
                borderRadius: '16px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--adm-text-m)',
                padding: '24px',
                textAlign: 'center'
              }}>
                <span style={{ fontSize: '28px', marginBottom: '8px' }}>⚡</span>
                <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)' }}>Aucune action collectée</strong>
                <span style={{ fontSize: '12px', marginTop: '4px' }}>Dès qu&apos;un visiteur consulte un produit ou valide un panier, il apparaîtra ici.</span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {analyticsData.topEvents.map((ev, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--adm-card-border)', borderRadius: '12px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block' }}>
                        {ev.label}
                      </strong>
                      <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                        Type : {ev.type}
                      </span>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <strong style={{ fontSize: '13px', color: '#7c3aed', display: 'block' }}>
                        {ev.count} fois
                      </strong>
                      <span style={{ fontSize: '10.5px', color: 'var(--adm-text-m)' }}>
                        {ev.percentage}% du total
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>
    );
  };

  // ==========================================
  // 🎯 TAB 16: PIXELS PUBLICITAIRES (META, TIKTOK, GOOGLE ADS)
  // ==========================================
  const renderPixels = () => {
    const currentPixels = store.pixelSettings || DEFAULT_PIXEL_SETTINGS;
    const fbPixels = currentPixels.facebookPixels || [];
    const ttPixels = currentPixels.tiktokPixels || [];
    const ga = currentPixels.googleAnalytics || { measurementId: '', gtmId: '', enabled: true };
    const autoEvents = currentPixels.autoTrackEvents || { pageView: true, viewContent: true, addToCart: true, initiateCheckout: true, purchase: true };

    const handleUpdateFbPixelId = (idx: number, newId: string) => {
      const updated = [...fbPixels];
      updated[idx] = { ...updated[idx], pixelId: newId.trim() };
      store.updatePixelSettings({ facebookPixels: updated });
    };

    const handleUpdateFbCapi = (idx: number, token: string) => {
      const updated = [...fbPixels];
      updated[idx] = { ...updated[idx], capiToken: token.trim() };
      store.updatePixelSettings({ facebookPixels: updated });
    };

    const handleAddFbPixel = () => {
      const updated = [...fbPixels, { id: `fb-${Date.now()}`, pixelId: '', capiToken: '', enabled: true }];
      store.updatePixelSettings({ facebookPixels: updated });
      showToast('Nouveau Pixel Facebook ajouté !');
    };

    const handleRemoveFbPixel = (idx: number) => {
      const updated = fbPixels.filter((_, i) => i !== idx);
      store.updatePixelSettings({ facebookPixels: updated });
      showToast('Pixel Facebook supprimé.');
    };

    const handleUpdateTtPixelId = (idx: number, newId: string) => {
      const updated = [...ttPixels];
      updated[idx] = { ...updated[idx], pixelId: newId.trim(), enabled: true };
      store.updatePixelSettings({ tiktokPixels: updated });
    };

    const handleUpdateTtEventsApi = (idx: number, token: string) => {
      const updated = [...ttPixels];
      updated[idx] = { ...updated[idx], eventsApiToken: token.trim() };
      store.updatePixelSettings({ tiktokPixels: updated });
    };

    const handleAddTtPixel = () => {
      const updated = [...ttPixels, { id: `tt-${Date.now()}`, pixelId: '', eventsApiToken: '', enabled: true }];
      store.updatePixelSettings({ tiktokPixels: updated });
      showToast('Nouveau Pixel TikTok ajouté !');
    };

    const handleRemoveTtPixel = (idx: number) => {
      const updated = ttPixels.filter((_, i) => i !== idx);
      store.updatePixelSettings({ tiktokPixels: updated });
      showToast('Pixel TikTok supprimé.');
    };

    const handleUpdateGa = (updates: Partial<typeof ga>) => {
      store.updatePixelSettings({ googleAnalytics: { ...ga, ...updates } });
    };

    const handleToggleEvent = (key: keyof typeof autoEvents) => {
      store.updatePixelSettings({
        autoTrackEvents: {
          ...autoEvents,
          [key]: !autoEvents[key]
        }
      });
      showToast(`Événement ${key} ${!autoEvents[key] ? 'activé' : 'désactivé'}`);
    };

    const handleTestEvent = (eventName: string) => {
      try {
        if (typeof window !== 'undefined') {
          if (window.fbq) {
            window.fbq('track', eventName, {
              content_name: 'Adidas Handball Spezial',
              content_category: 'shoes',
              value: 89.99,
              currency: 'EUR'
            });
          }
          if (window.ttq) {
            window.ttq.track(eventName, {
              content_name: 'Adidas Handball Spezial',
              value: 89.99,
              currency: 'EUR'
            });
          }
        }
        showToast(`🚀 Événement test "${eventName}" envoyé à vos Pixels actifs !`);
      } catch (e) {
        showToast(`Événement "${eventName}" simulé.`);
      }
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, width: '100%', maxWidth: '1080px' }}>
        {/* Main Header */}
        <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0284c7' }}>
            MARKETING &amp; TRACKING PUBLICITAIRE
          </span>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
            Pixels &amp; Balises Publicitaires
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0, lineHeight: '1.5' }}>
            Connectez vos pixels Meta (Facebook &amp; Instagram Ads), TikTok Ads et Google Analytics 4. Synchronisez les conversions pour optimiser vos campagnes et recibler vos clients.
          </p>
        </div>

        {/* 1. Facebook / Meta Pixel Card */}
        <div className="admin-card" style={{
          padding: '28px 32px',
          borderRadius: '20px',
          background: 'var(--adm-card-bg)',
          border: '1px solid var(--adm-card-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#e0f2fe', color: '#0284c7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px', fontFamily: 'serif' }}>
                f
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                  Facebook / Meta Pixel
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '2px 0 0 0' }}>
                  Suivez vos campagnes Facebook &amp; Instagram Ads
                </p>
              </div>
            </div>

            <a
              href="https://business.facebook.com/events_manager2"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--adm-text-m)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Aide</span>
              <span>↗</span>
            </a>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '8px' }}>
              IDs du Pixel Facebook
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {fbPixels.map((p, idx) => (
                <div key={p.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="text"
                    className="admin-input"
                    value={p.pixelId}
                    onChange={(e) => handleUpdateFbPixelId(idx, e.target.value)}
                    placeholder="ex: 2608798626157940"
                    style={{ flex: 1, borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', fontFamily: 'monospace' }}
                  />
                  {fbPixels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveFbPixel(idx)}
                      aria-label="Supprimer le pixel"
                      style={{ background: 'none', border: '1px solid var(--adm-card-border)', borderRadius: '10px', padding: '9px 12px', cursor: 'pointer', color: '#64748b' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddFbPixel}
              style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 800, fontSize: '13px', cursor: 'pointer', padding: '8px 0 0 0' }}
            >
              + Ajouter un pixel
            </button>
          </div>

          <div style={{ background: 'var(--adm-card-border)', borderRadius: '14px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)' }}>
                API Conversions Meta (CAPI - Recommandé)
              </strong>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--adm-text-m)', margin: 0 }}>
              Contournez les bloqueurs de publicité (iOS 14+) et maximisez le suivi en envoyant les événements directement de serveur à serveur.
            </p>
            {fbPixels.map((p, idx) => (
              <div key={p.id || idx}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--adm-text-m)', marginBottom: '4px' }}>
                  Token CAPI (Pixel {p.pixelId || `N°${idx + 1}`})
                </label>
                <input
                  type="password"
                  className="admin-input"
                  value={p.capiToken || ''}
                  onChange={(e) => handleUpdateFbCapi(idx, e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••••••••••"
                  style={{ width: '100%', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 2. TikTok Pixel Card */}
        <div className="admin-card" style={{
          padding: '28px 32px',
          borderRadius: '20px',
          background: 'var(--adm-card-bg)',
          border: '1px solid var(--adm-card-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#09090b', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '16px' }}>
                ♪
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                  TikTok Pixel &amp; Events API
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '2px 0 0 0' }}>
                  Suivez vos campagnes TikTok Ads &amp; Spark Ads
                </p>
              </div>
            </div>

            <a
              href="https://ads.tiktok.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--adm-text-m)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Aide</span>
              <span>↗</span>
            </a>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '8px' }}>
              IDs du Pixel TikTok
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {ttPixels.map((p, idx) => (
                <div key={p.id || idx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="text"
                    className="admin-input"
                    value={p.pixelId}
                    onChange={(e) => handleUpdateTtPixelId(idx, e.target.value)}
                    placeholder="ex: CXXXXXXXXXXXXXX"
                    style={{ flex: 1, borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', fontFamily: 'monospace' }}
                  />
                  {ttPixels.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveTtPixel(idx)}
                      aria-label="Supprimer le pixel TikTok"
                      style={{ background: 'none', border: '1px solid var(--adm-card-border)', borderRadius: '10px', padding: '9px 12px', cursor: 'pointer', color: '#64748b' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddTtPixel}
              style={{ background: 'none', border: 'none', color: '#059669', fontWeight: 800, fontSize: '13px', cursor: 'pointer', padding: '8px 0 0 0' }}
            >
              + Ajouter un pixel
            </button>
          </div>

          <div style={{ background: 'var(--adm-card-border)', borderRadius: '14px', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px' }}>⚡</span>
              <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)' }}>
                API Événements TikTok (Events API)
              </strong>
            </div>
            {ttPixels.map((p, idx) => (
              <div key={p.id || idx}>
                <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 700, color: 'var(--adm-text-m)', marginBottom: '4px' }}>
                  Token Events API (Pixel {p.pixelId || `N°${idx + 1}`})
                </label>
                <input
                  type="password"
                  className="admin-input"
                  value={p.eventsApiToken || ''}
                  onChange={(e) => handleUpdateTtEventsApi(idx, e.target.value)}
                  placeholder="••••••••••••••••••••••••••••••••••••••••"
                  style={{ width: '100%', borderRadius: '10px', padding: '10px 14px', fontSize: '13px' }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* 3. Google Analytics & Google Tag */}
        <div className="admin-card" style={{
          padding: '28px 32px',
          borderRadius: '20px',
          background: 'var(--adm-card-bg)',
          border: '1px solid var(--adm-card-border)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#fef3c7', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '18px' }}>
                G
              </div>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                  Google Analytics 4 &amp; Google Tag
                </h3>
                <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '2px 0 0 0' }}>
                  Suivez votre trafic de recherche, Google Ads et le comportement des visiteurs
                </p>
              </div>
            </div>

            <a
              href="https://analytics.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--adm-text-m)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <span>Aide</span>
              <span>↗</span>
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '8px' }}>
                ID de mesure GA4 / Google Tag
              </label>
              <input
                type="text"
                className="admin-input"
                value={ga.measurementId}
                onChange={(e) => handleUpdateGa({ measurementId: e.target.value.trim() })}
                placeholder="ex: G-XXXXXXXXXX ou AW-XXXXXXXXXX"
                style={{ width: '100%', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', fontFamily: 'monospace' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '8px' }}>
                ID Google Tag Manager (GTM - Optionnel)
              </label>
              <input
                type="text"
                className="admin-input"
                value={ga.gtmId || ''}
                onChange={(e) => handleUpdateGa({ gtmId: e.target.value.trim() })}
                placeholder="ex: GTM-XXXXXXX"
                style={{ width: '100%', borderRadius: '10px', padding: '10px 14px', fontSize: '13.5px', fontFamily: 'monospace' }}
              />
            </div>
          </div>
        </div>

        {/* 4. Automated Events Management */}
        <div className="admin-card" style={{
          padding: '28px 32px',
          borderRadius: '20px',
          background: 'var(--adm-card-bg)',
          border: '1px solid var(--adm-card-border)'
        }}>
          <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '0 0 6px 0' }}>
            ⚡ Événements E-commerce Suivis Automatiquement
          </h3>
          <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '0 0 16px 0' }}>
            Tous ces événements sont déclenchés en temps réel sur la boutique et synchronisés avec vos pixels actifs :
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
            {[
              { key: 'pageView' as const, label: 'PageView', desc: 'Pages vues' },
              { key: 'viewContent' as const, label: 'ViewContent', desc: 'Fiches produits' },
              { key: 'addToCart' as const, label: 'AddToCart', desc: 'Ajouts panier' },
              { key: 'initiateCheckout' as const, label: 'InitiateCheckout', desc: 'Début de commande' },
              { key: 'purchase' as const, label: 'Purchase', desc: 'Achats validés' },
            ].map(ev => {
              const isEnabled = autoEvents[ev.key];
              return (
                <div
                  key={ev.key}
                  onClick={() => handleToggleEvent(ev.key)}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '14px',
                    border: isEnabled ? '1.5px solid #10b981' : '1px solid var(--adm-card-border)',
                    background: isEnabled ? 'rgba(16,185,129,0.08)' : 'var(--adm-card-bg)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div>
                    <strong style={{ display: 'block', fontSize: '13px', color: 'var(--adm-text-h)' }}>
                      {ev.label}
                    </strong>
                    <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                      {ev.desc}
                    </span>
                  </div>
                  <span style={{
                    fontSize: '11px',
                    fontWeight: 800,
                    color: isEnabled ? '#059669' : '#94a3b8',
                    background: isEnabled ? '#d1fae5' : 'var(--adm-card-border)',
                    padding: '3px 8px',
                    borderRadius: '10px'
                  }}>
                    {isEnabled ? '✓ Actif' : 'Inactif'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 5. Live Event Testing Console */}
        <div className="admin-card" style={{
          padding: '24px 30px',
          borderRadius: '20px',
          background: 'linear-gradient(135deg, rgba(2,132,199,0.06) 0%, rgba(16,185,129,0.04) 100%)',
          border: '1px solid rgba(2,132,199,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '14px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🧪</span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                  Console de Test &amp; Déclenchement d&apos;Événements en Direct
                </h3>
              </div>
              <p style={{ fontSize: '12px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
                Cliquez pour envoyer un événement test et vérifier la réception dans Meta Pixel Helper ou TikTok Pixel Helper :
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'].map(name => (
              <button
                key={name}
                type="button"
                onClick={() => handleTestEvent(name)}
                className="admin-btn admin-btn-outline admin-btn-sm"
                style={{
                  borderRadius: '12px',
                  padding: '8px 14px',
                  fontSize: '12px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>⚡</span> Tester {name}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Save Action Bar */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 28px',
          borderRadius: '20px',
          background: 'var(--adm-card-bg)',
          border: '1px solid var(--adm-card-border)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
          marginTop: '4px',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '20px' }}>💾</span>
            <div>
              <strong style={{ fontSize: '14px', color: 'var(--adm-text-h)', display: 'block' }}>
                Enregistrement des configurations Pixels &amp; Tracking
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                Toutes les modifications sont appliquées instantanément sur votre boutique en direct.
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => showToast('Configuration des Pixels enregistrée et synchronisée avec succès !')}
            className="admin-btn admin-btn-primary"
            style={{
              borderRadius: '30px',
              padding: '12px 32px',
              fontSize: '14px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              background: '#0284c7',
              boxShadow: '0 4px 16px rgba(2,132,199,0.35)'
            }}
          >
            <span>💾</span> Enregistrer
          </button>
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <div>
          <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#a855f7' }}>CONFIGURATION SYSTÈME</span>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>Paramètres de la Boutique</h1>
          <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>Ajustez les devises, les frais de port offerts et les bannières d&apos;information.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 16 }}>💱 Taux de change</h3>
          <label className="admin-label">1 EUR = ? FCFA</label>
          <input type="number" className="admin-input" value={store.exchangeRate} onChange={e => store.updateExchangeRate(parseFloat(e.target.value) || 655.957)} step="0.001" style={{ borderRadius: 10, padding: '10px 14px' }} />
        </div>
        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 16 }}>🚚 Livraison gratuite</h3>
          <label className="admin-label">Seuil en EUR</label>
          <input type="number" className="admin-input" value={store.freeShippingThreshold} onChange={e => store.updateFreeShippingThreshold(parseFloat(e.target.value) || 0)} style={{ borderRadius: 10, padding: '10px 14px' }} />
        </div>
      </div>

      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 16 }}>📢 Bannières d&apos;Annonce (TopBar)</h3>
        {store.announcements.map((a, i) => (
          <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
            <input className="admin-input" value={a} onChange={e => {
              const newAnn = [...store.announcements];
              newAnn[i] = e.target.value;
              store.updateAnnouncements(newAnn);
            }} style={{ borderRadius: 10 }} />
            <button className="admin-btn admin-btn-danger admin-btn-sm" onClick={() => {
              store.updateAnnouncements(store.announcements.filter((_, idx) => idx !== i));
              showToast('Annonce supprimée');
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        ))}
        <button className="admin-btn admin-btn-outline admin-btn-sm" onClick={() => store.updateAnnouncements([...store.announcements, 'Nouvelle annonce...'])} style={{ borderRadius: 10, marginTop: 8 }}>
          + Ajouter une annonce
        </button>
      </div>

      {/* 🔔 Merchant Alert Channels (Email, WhatsApp & Telegram Bot Config) */}
      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid rgba(2, 132, 199, 0.25)', boxShadow: '0 8px 24px rgba(0,0,0,0.04)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '22px' }}>📱</span>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                Alertes Marchand Instantanées (Email, WhatsApp & Telegram Bot)
              </h3>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
              Recevez une alerte directe sur votre téléphone ou email lors de chaque commande ou paiement validé.
            </p>
          </div>

          <button
            type="button"
            onClick={async () => {
              try {
                const res = await fetch('/api/notify-merchant', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    type: 'TEST_ALERT',
                    merchantSettings: store.merchantSettings,
                    testMessage: '🚀 Test réussi ! Vos notifications Marchand Aymard Store sont prêtes et configurées.'
                  })
                });
                const data = await res.json();
                if (data.success) {
                  showToast(data.message || 'Notification de test envoyée avec succès !');
                } else {
                  showToast('Erreur lors du test : ' + (data.error || 'Vérifiez la configuration'), 'error');
                }
              } catch (e: any) {
                showToast('Erreur d\'envoi de la notification de test', 'error');
              }
            }}
            className="admin-btn admin-btn-primary"
            style={{ borderRadius: '30px', padding: '10px 22px', fontSize: '12.5px', fontWeight: 800 }}
          >
            🚀 Tester l&apos;Alerte Instantanée
          </button>
        </div>

        <div className="admin-form-grid">
          {/* Email Settings */}
          <div style={{ gridColumn: '1 / -1', background: 'rgba(2, 132, 199, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(2, 132, 199, 0.15)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '14px', color: 'var(--adm-text-h)', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={store.merchantSettings.emailAlertsEnabled}
                onChange={e => store.updateMerchantSettings({ emailAlertsEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#0284c7' }}
              />
              <span>📧 Alertes par Email Gmail / Administrateur</span>
            </label>
            <div className="admin-form-grid">
              <div>
                <label className="admin-label">Adresse Email Administrateur (Gmail)</label>
                <input
                  type="email"
                  className="admin-input"
                  value={store.merchantSettings.adminEmail}
                  onChange={e => store.updateMerchantSettings({ adminEmail: e.target.value })}
                  placeholder="votre.email@gmail.com"
                  style={{ borderRadius: '10px' }}
                />
              </div>
              <div>
                <label className="admin-label">Clé API Resend / Email (Optionnel - Pour envoi direct sur Gmail)</label>
                <input
                  type="text"
                  className="admin-input"
                  value={store.merchantSettings.resendApiKey || ''}
                  onChange={e => store.updateMerchantSettings({ resendApiKey: e.target.value })}
                  placeholder="ex: re_123456789..."
                  style={{ borderRadius: '10px' }}
                />
              </div>
            </div>
          </div>

          {/* Telegram Settings */}
          <div style={{ gridColumn: '1 / -1', background: 'rgba(56, 189, 248, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(56, 189, 248, 0.15)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '14px', color: 'var(--adm-text-h)', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={store.merchantSettings.telegramEnabled}
                onChange={e => store.updateMerchantSettings({ telegramEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#38bdf8' }}
              />
              <span>✈️ Alertes Telegram Bot (Message Instantané)</span>
            </label>
            <div className="admin-form-grid" style={{ marginTop: '10px' }}>
              <div>
                <label className="admin-label">Token Telegram Bot API</label>
                <input
                  type="text"
                  className="admin-input"
                  value={store.merchantSettings.telegramBotToken}
                  onChange={e => store.updateMerchantSettings({ telegramBotToken: e.target.value })}
                  placeholder="ex: 7829103948:AAH1b9cK_..."
                  style={{ borderRadius: '10px' }}
                />
              </div>
              <div>
                <label className="admin-label">Chat ID Administrateur / Groupe Telegram</label>
                <input
                  type="text"
                  className="admin-input"
                  value={store.merchantSettings.telegramChatId}
                  onChange={e => store.updateMerchantSettings({ telegramChatId: e.target.value })}
                  placeholder="ex: -100293847592 ou 12948573"
                  style={{ borderRadius: '10px' }}
                />
              </div>
            </div>
          </div>

          {/* WhatsApp Settings */}
          <div style={{ gridColumn: '1 / -1', background: 'rgba(16, 185, 129, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(16, 185, 129, 0.15)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontWeight: 800, fontSize: '14px', color: 'var(--adm-text-h)', marginBottom: '10px' }}>
              <input
                type="checkbox"
                checked={store.merchantSettings.whatsappEnabled}
                onChange={e => store.updateMerchantSettings({ whatsappEnabled: e.target.checked })}
                style={{ width: '18px', height: '18px', accentColor: '#10b981' }}
              />
              <span>💬 Alertes WhatsApp Business (Gateway / Webhook)</span>
            </label>
            <div className="admin-form-grid" style={{ marginTop: '10px' }}>
              <div>
                <label className="admin-label">Numéro WhatsApp Administrateur</label>
                <input
                  type="text"
                  className="admin-input"
                  value={store.merchantSettings.whatsappPhoneNumber}
                  onChange={e => store.updateMerchantSettings({ whatsappPhoneNumber: e.target.value })}
                  placeholder="ex: +229 90 12 34 56"
                  style={{ borderRadius: '10px' }}
                />
              </div>
              <div>
                <label className="admin-label">URL Webhook API WhatsApp Gateway</label>
                <input
                  type="url"
                  className="admin-input"
                  value={store.merchantSettings.whatsappWebhookUrl}
                  onChange={e => store.updateMerchantSettings({ whatsappWebhookUrl: e.target.value })}
                  placeholder="https://api.whatsapp-alert.com/v1/send"
                  style={{ borderRadius: '10px' }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 💳 Passerelle de Paiement Direct Moneroo (Bénin MoMo & Cartes France / Belgique) */}
      <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1.5px solid rgba(2, 132, 199, 0.35)', boxShadow: '0 8px 24px rgba(2, 132, 199, 0.06)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '24px' }}>💳</span>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                  Passerelle de Paiement Moneroo (Mobile Money &amp; Cartes Bancaires)
                </h3>
                <span style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700 }}>
                  Couverture : Bénin 🇧🇯 (MTN MoMo, Moov Money, Celtiis Cash) + France 🇫🇷 &amp; Belgique 🇧🇪 (Cartes Visa/Mastercard 3D Secure)
                </span>
              </div>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '6px 0 0 0', maxWidth: '680px' }}>
              Configurez vos clés API Moneroo (<code>moneroo.io</code>) pour encaisser directement les règlements. Les commandes ne sont validées et notifiées que si l&apos;opérateur confirme le succès réel du paiement.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: store.monerooSettings?.enabled ? 'rgba(16, 185, 129, 0.12)' : 'rgba(100, 116, 139, 0.12)', padding: '8px 16px', borderRadius: '20px', border: store.monerooSettings?.enabled ? '1px solid #10b981' : '1px solid var(--adm-card-border)' }}>
              <input
                type="checkbox"
                checked={store.monerooSettings?.enabled ?? true}
                onChange={e => store.updateMonerooSettings({ enabled: e.target.checked })}
                style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
              />
              <span style={{ fontSize: '12.5px', fontWeight: 800, color: store.monerooSettings?.enabled ? '#10b981' : 'var(--adm-text-m)' }}>
                {store.monerooSettings?.enabled ? '🟢 Paiements Moneroo Actifs' : '⚪ Désactivé (Mode Vitrine)'}
              </span>
            </label>
          </div>
        </div>

        <div className="admin-form-grid">
          {/* Environment Mode Switch */}
          <div style={{ gridColumn: '1 / -1', background: 'rgba(2, 132, 199, 0.05)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(2, 132, 199, 0.15)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)', display: 'block' }}>
                Mode de Fonctionnement de la Passerelle
              </strong>
              <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                En mode Sandbox (Test), utilisez des numéros et cartes de test sans débit réel. En mode Live (Production), les paiements réels sont encaissés sur votre compte Moneroo.
              </span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                onClick={() => {
                  store.updateMonerooSettings({ environment: 'sandbox' });
                  showToast('Mode Moneroo basculé sur Sandbox (Test).');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: store.monerooSettings?.environment === 'sandbox' ? '1.5px solid #f59e0b' : '1px solid var(--adm-card-border)',
                  background: store.monerooSettings?.environment === 'sandbox' ? '#f59e0b' : 'var(--adm-card-bg)',
                  color: store.monerooSettings?.environment === 'sandbox' ? '#ffffff' : 'var(--adm-text-h)',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                🧪 Mode Test (Sandbox)
              </button>

              <button
                type="button"
                onClick={() => {
                  store.updateMonerooSettings({ environment: 'live' });
                  showToast('Mode Moneroo basculé sur Live (Production).');
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  border: store.monerooSettings?.environment === 'live' ? '1.5px solid #10b981' : '1px solid var(--adm-card-border)',
                  background: store.monerooSettings?.environment === 'live' ? '#10b981' : 'var(--adm-card-bg)',
                  color: store.monerooSettings?.environment === 'live' ? '#ffffff' : 'var(--adm-text-h)',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                🚀 Mode Réel (Production)
              </button>
            </div>
          </div>

          <div>
            <label className="admin-label">Clé Secrète Moneroo (Secret Key - Requise)</label>
            <input
              type="password"
              className="admin-input"
              value={store.monerooSettings?.secretKey || ''}
              onChange={e => store.updateMonerooSettings({ secretKey: e.target.value.trim() })}
              placeholder={store.monerooSettings?.environment === 'live' ? 'sk_live_...' : 'sk_sandbox_...'}
              style={{ borderRadius: '10px', fontFamily: 'monospace' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: '4px', display: 'block' }}>
              Trouvable dans votre compte Moneroo (Dashboard &gt; Développeurs &gt; Clés API)
            </span>
          </div>

          <div>
            <label className="admin-label">Clé Publique / App ID Moneroo (Optionnel)</label>
            <input
              type="text"
              className="admin-input"
              value={store.monerooSettings?.publicKey || ''}
              onChange={e => store.updateMonerooSettings({ publicKey: e.target.value.trim() })}
              placeholder="pk_live_... ou pk_sandbox_..."
              style={{ borderRadius: '10px', fontFamily: 'monospace' }}
            />
            <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', marginTop: '4px', display: 'block' }}>
              Identifiant public de votre application Moneroo
            </span>
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
            🔒 Webhook URL : <code>https://aymard-store.com/api/payments/webhook</code>
          </span>
          <button
            type="button"
            onClick={() => showToast('Configuration Moneroo enregistrée avec succès !')}
            className="admin-btn admin-btn-primary"
            style={{ borderRadius: '20px', padding: '8px 20px', fontSize: '12px', fontWeight: 800 }}
          >
            💾 Enregistrer la configuration Moneroo
          </button>
        </div>
      </div>

      {/* System Reset & Data Cleanup Card */}
      <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid rgba(239,68,68,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
            <span style={{ fontSize: '22px' }}>🧹</span>
            <div>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                Remise à Zéro des Données &amp; Comptabilité
              </h3>
              <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '2px 0 0 0' }}>
                Effacez les données fictives et réinitialisez l&apos;ensemble des compteurs opérationnels à 0 (vos produits et leurs prix restent 100% préservés).
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', marginTop: '16px' }}>
            <button
              type="button"
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir remettre à 0 la comptabilité (toutes les écritures de dépenses) ?')) {
                  store.clearAccountingData();
                  showToast('Comptabilité réinitialisée à 0 € / 0 FCFA.');
                }
              }}
              className="admin-btn admin-btn-outline"
              style={{ borderRadius: '24px', padding: '10px 20px', fontSize: '12.5px', fontWeight: 700, color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)' }}
            >
              <span>📊</span> Remettre la Compta à 0
            </button>

            <button
              type="button"
              onClick={() => {
                if (confirm('Êtes-vous sûr de vouloir réinitialiser TOUTES les données fictives (Commandes, Compta, Clients, Fournisseurs, Employés, Support) à 0 ? Vos articles et prix ne seront PAS touchés.')) {
                  store.clearAllMockData();
                  showToast('Toutes les données fictives ont été remises à 0 avec succès.');
                }
              }}
              className="admin-btn admin-btn-outline"
              style={{ borderRadius: '24px', padding: '10px 20px', fontSize: '12.5px', fontWeight: 700, color: '#ef4444', borderColor: 'rgba(239,68,68,0.4)' }}
            >
              <span>🗑️</span> Remise à 0 Globale (Compta, Commandes, Clients)
            </button>
          </div>
        </div>
      </div>
  );

  const renderLocations = () => {
    const filteredLocationProducts = store.products.filter(p => 
      p.name_fr.toLowerCase().includes(locationSearch.toLowerCase()) || 
      (p.brand || '').toLowerCase().includes(locationSearch.toLowerCase())
    );
    const totalLocationPages = Math.ceil(filteredLocationProducts.length / 15) || 1;
    const paginatedLocationProducts = filteredLocationProducts.slice((locationPage - 1) * 15, locationPage * 15);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Header Card */}
        <div className="admin-card" style={{ padding: '28px 36px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1.5px', color: '#0284c7' }}>GÉOLOCALISATION & DEVISES</span>
              <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '4px 0 8px 0', fontFamily: 'var(--font-plus-jakarta)' }}>
                Gestion des Prix par Pays & Devises
              </h1>
              <p style={{ fontSize: '14px', color: 'var(--adm-text-m)', margin: 0 }}>
                Détection automatique du lieu de connexion des visiteurs (IP & fuseau horaire) : <strong>Bénin 🇧🇯 (Afrique - FCFA)</strong>, <strong>France 🇫🇷 (Europe - €)</strong> et <strong>Belgique 🇧🇪 (Europe - €)</strong>.
              </p>
            </div>
            <Link 
              href="/products" 
              target="_blank" 
              className="admin-btn admin-btn-primary" 
              style={{ borderRadius: '30px', padding: '12px 24px', fontSize: '13px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span>👀 Voir la boutique en direct</span>
            </Link>
          </div>
        </div>

        {/* Live Client Geolocation Simulator */}
        <div className="admin-card" style={{ padding: '24px 30px', borderRadius: '20px', background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)', border: '1px solid rgba(2, 132, 199, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '20px' }}>🧪</span>
                <h3 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                  Simulateur de Connexion Client (Test en direct)
                </h3>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
                Cliquez sur un pays pour tester les prix, devises et règles de livraison comme si vous étiez connecté depuis ce lieu :
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {store.locations.map(loc => {
                const isSelected = store.detectedLocationId === loc.id;
                return (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() => {
                      store.setDetectedLocation(loc.id);
                      showToast(`Simulation activée : Vue client ${loc.name} (${loc.currency})`);
                    }}
                    style={{
                      padding: '12px 20px',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid #0284c7' : '1px solid var(--adm-card-border)',
                      background: isSelected ? '#0284c7' : 'var(--adm-card-bg)',
                      color: isSelected ? '#ffffff' : 'var(--adm-text-h)',
                      fontWeight: 800,
                      fontSize: '13px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      boxShadow: isSelected ? '0 4px 14px rgba(2, 132, 199, 0.35)' : 'none',
                      transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <span style={{ fontSize: '18px' }}>{loc.flag}</span>
                    <span>{loc.name}</span>
                    <span style={{ fontSize: '11px', opacity: isSelected ? 0.9 : 0.6 }}>({loc.currency})</span>
                    {isSelected && <span style={{ fontWeight: 900 }}>✓ Actif</span>}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Location & Rates Configuration Table */}
        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 16 }}>
            ⚙️ Pays Pris en Charge & Taux de Conversion
          </h3>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Pays / Territoire</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Code</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Devise</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Taux de change (pour 1 €)</th>
                  <th style={{ padding: '14px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Statut</th>
                  <th style={{ padding: '14px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {store.locations.map(loc => {
                  const currentRateVal = tempRates[loc.id] !== undefined ? tempRates[loc.id] : loc.exchangeRate;

                  return (
                    <tr key={loc.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                      <td style={{ padding: '16px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontSize: '22px' }}>{loc.flag}</span>
                          <div>
                            <div>{loc.name}</div>
                            <div style={{ fontSize: '11px', color: 'var(--adm-text-m)', fontWeight: 500 }}>
                              {loc.id === 'benin' ? 'Afrique de l\'Ouest' : 'Union Européenne'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', fontWeight: 700, color: 'var(--adm-text-m)' }}>
                        <span style={{ background: 'var(--adm-card-border)', padding: '3px 8px', borderRadius: '6px' }}>{loc.countryCode}</span>
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', fontWeight: 800, color: '#0284c7' }}>
                        {loc.currency} ({loc.currencySymbol})
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input
                            type="number"
                            step={loc.currency === 'FCFA' ? '0.001' : '0.01'}
                            value={currentRateVal}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              setTempRates(prev => ({ ...prev, [loc.id]: isNaN(val) ? 0 : val }));
                            }}
                            className="admin-input"
                            style={{ width: '130px', padding: '6px 10px', fontSize: '12px', borderRadius: '8px' }}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              if (currentRateVal > 0) {
                                store.updateLocation(loc.id, { exchangeRate: currentRateVal });
                                showToast(`Taux de change mis à jour pour ${loc.name} (${currentRateVal} ${loc.currency})`);
                              }
                            }}
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            style={{ borderRadius: '8px', fontSize: '11px', fontWeight: 700, padding: '6px 10px' }}
                          >
                            💾 Enregistrer
                          </button>
                        </div>
                      </td>
                      <td style={{ padding: '16px' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '20px',
                          fontSize: '11px',
                          fontWeight: 800,
                          background: loc.active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                          color: loc.active ? '#10b981' : '#ef4444'
                        }}>
                          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor' }} />
                          {loc.active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td style={{ padding: '16px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            store.updateLocation(loc.id, { active: !loc.active });
                            showToast(`Statut de ${loc.name} mis à jour (${loc.active ? 'Désactivé' : 'Activé'})`);
                          }}
                          className="admin-btn admin-btn-outline admin-btn-sm"
                          style={{ borderRadius: '8px', fontSize: '11px', fontWeight: 700 }}
                        >
                          {loc.active ? 'Désactiver' : 'Activer'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Matrix of Catalog Products per Country with Search & Pagination */}
        <div className="admin-card" style={{ padding: '28px', borderRadius: '24px', background: 'var(--adm-card-bg)', border: '1px solid var(--adm-card-border)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                📊 Tarifs Produits par Pays ({filteredLocationProducts.length} articles)
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
                Modifiez directement les prix pour chaque pays ou ouvrez l&apos;éditeur complet.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                placeholder="🔍 Rechercher un produit..."
                value={locationSearch}
                onChange={e => {
                  setLocationSearch(e.target.value);
                  setLocationPage(1);
                }}
                className="admin-input"
                style={{ width: '220px', borderRadius: '12px', padding: '8px 14px', fontSize: '12px' }}
              />
              <button 
                type="button"
                className="admin-btn admin-btn-primary admin-btn-sm" 
                onClick={() => {
                  setEditingProduct(null);
                  setSelectedSizes(['39', '40', '41', '42', '43', '44']);
                  setSelectedColors(['Noir', 'Blanc']);
                  setModal('addProduct');
                }} 
                style={{ borderRadius: '20px', padding: '8px 18px', fontSize: '12px', fontWeight: 700 }}
              >
                + Nouveau Produit
              </button>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Produit</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Base (€)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>🇧🇯 Bénin (FCFA)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>🇫🇷 France (€)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'left', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>🇧🇪 Belgique (€)</th>
                  <th style={{ padding: '12px 14px', textAlign: 'right', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-m)' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLocationProducts.map(p => {
                  const pPrices = tempPrices[p.id] || {};
                  const beninVal = pPrices.benin !== undefined ? pPrices.benin : (p.locationPrices?.benin || Math.round(p.price * 655.957));
                  const franceVal = pPrices.france !== undefined ? pPrices.france : (p.locationPrices?.france || p.price);
                  const belgiqueVal = pPrices.belgique !== undefined ? pPrices.belgique : (p.locationPrices?.belgique || p.price);

                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                      <td style={{ padding: '14px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={p.images[0]} alt={p.name_fr} style={{ width: '38px', height: '38px', borderRadius: '8px', objectFit: 'contain', background: '#f8fafc' }} />
                          <div>
                            <div style={{ fontSize: '13px' }}>{p.name_fr.slice(0, 32)}</div>
                            <div style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>{p.brand || 'AYMARD'} • {getCategoryLabel(p.category)}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '14px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                        {p.price.toFixed(2)} €
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="100"
                            value={beninVal}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              setTempPrices(prev => ({
                                ...prev,
                                [p.id]: { ...(prev[p.id] || {}), benin: isNaN(val) ? 0 : val }
                              }));
                            }}
                            className="admin-input"
                            style={{ width: '100px', padding: '5px 8px', fontSize: '12px', borderRadius: '6px' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>FCFA</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={franceVal}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              setTempPrices(prev => ({
                                ...prev,
                                [p.id]: { ...(prev[p.id] || {}), france: isNaN(val) ? 0 : val }
                              }));
                            }}
                            className="admin-input"
                            style={{ width: '85px', padding: '5px 8px', fontSize: '12px', borderRadius: '6px' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>€</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <input
                            type="number"
                            step="0.01"
                            value={belgiqueVal}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              setTempPrices(prev => ({
                                ...prev,
                                [p.id]: { ...(prev[p.id] || {}), belgique: isNaN(val) ? 0 : val }
                              }));
                            }}
                            className="admin-input"
                            style={{ width: '85px', padding: '5px 8px', fontSize: '12px', borderRadius: '6px' }}
                          />
                          <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>€</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            onClick={() => {
                              const currentBenin = pPrices.benin !== undefined ? pPrices.benin : beninVal;
                              const currentFrance = pPrices.france !== undefined ? pPrices.france : franceVal;
                              const currentBelgique = pPrices.belgique !== undefined ? pPrices.belgique : belgiqueVal;

                              store.updateLocationPrice(p.id, 'benin', currentBenin);
                              store.updateLocationPrice(p.id, 'france', currentFrance);
                              store.updateLocationPrice(p.id, 'belgique', currentBelgique);

                              showToast(`Prix enregistrés pour ${p.name_fr.slice(0, 20)} !`);
                            }}
                            className="admin-btn admin-btn-primary admin-btn-sm"
                            style={{ borderRadius: '8px', fontSize: '11px', fontWeight: 700, padding: '5px 10px' }}
                            title="Sauvegarder les prix saisis"
                          >
                            💾 Sauvegarder
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p);
                              setSelectedSizes(cleanExistingSizes(p.sizes));
                              setSelectedColors(p.colors || []);
                              setModal('editProduct');
                            }}
                            className="admin-btn admin-btn-outline admin-btn-sm"
                            style={{ borderRadius: '8px', padding: '6px 8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Modifier tous les détails"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredLocationProducts.length === 0 && <EmptyState icon="🌍" text="Aucun produit trouvé pour cette recherche" />}
          </div>

          {/* Pagination Controls */}
          {filteredLocationProducts.length > 15 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--adm-card-border)', flexWrap: 'wrap', gap: 12 }}>
              <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                Articles {(locationPage - 1) * 15 + 1} à {Math.min(locationPage * 15, filteredLocationProducts.length)} sur {filteredLocationProducts.length}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button 
                  type="button"
                  onClick={() => setLocationPage(p => Math.max(1, p - 1))}
                  disabled={locationPage === 1}
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  style={{ borderRadius: 8, opacity: locationPage === 1 ? 0.4 : 1 }}
                >
                  ◀ Précédent
                </button>
                <span style={{ padding: '6px 12px', fontSize: '12px', fontWeight: 700, color: 'var(--adm-text-h)', background: 'rgba(56,189,248,0.1)', borderRadius: 8 }}>
                  {locationPage} / {totalLocationPages}
                </span>
                <button 
                  type="button"
                  onClick={() => setLocationPage(p => Math.min(totalLocationPages, p + 1))}
                  disabled={locationPage >= totalLocationPages}
                  className="admin-btn admin-btn-outline admin-btn-sm"
                  style={{ borderRadius: 8, opacity: locationPage >= totalLocationPages ? 0.4 : 1 }}
                >
                  Suivant ▶
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReviews = () => {
    const allReviews = store.reviews || [];
    const filteredReviews = allReviews.filter(r => {
      const matchFilter = reviewFilter === 'ALL' || r.status === reviewFilter;
      const matchQuery = !reviewSearch.trim() || 
        r.productName?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.customerName?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.customerEmail?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.comment?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.title?.toLowerCase().includes(reviewSearch.toLowerCase()) ||
        r.orderNumber?.toLowerCase().includes(reviewSearch.toLowerCase());
      return matchFilter && matchQuery;
    });

    const avgScore = allReviews.length > 0 
      ? (allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length).toFixed(1)
      : '5.0';
    const approvedCount = allReviews.filter(r => r.status === 'APPROVED').length;
    const pendingCount = allReviews.filter(r => r.status === 'PENDING').length;
    const rejectedCount = allReviews.filter(r => r.status === 'REJECTED').length;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)' }}>
              ⭐ Modération &amp; Gestion des Avis Clients
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
              Consultez, validez ou modérez les retours d&apos;expérience déposés par les acheteurs vérifiés.
            </p>
          </div>
        </div>

        {/* 4 Metrics KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Total Avis Déposés</span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', marginTop: '4px' }}>{allReviews.length}</div>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>100% Achats Vérifiés</span>
          </div>

          <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Note Moyenne Globale</span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#f59e0b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{avgScore}</span>
              <span style={{ fontSize: '20px' }}>★</span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Sur l&apos;ensemble du catalogue</span>
          </div>

          <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Avis Publiés (En Ligne)</span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#10b981', marginTop: '4px' }}>{approvedCount}</div>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>Visibles sur le site</span>
          </div>

          <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>En attente / Rejetés</span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: rejectedCount > 0 ? '#ef4444' : 'var(--adm-text-h)', marginTop: '4px' }}>
              {pendingCount} / {rejectedCount}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Modération en cours</span>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="admin-card" style={{ padding: '16px 20px', borderRadius: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { id: 'ALL', label: `Tous (${allReviews.length})` },
              { id: 'APPROVED', label: `Publiés (${approvedCount})` },
              { id: 'PENDING', label: `En attente (${pendingCount})` },
              { id: 'REJECTED', label: `Rejetés (${rejectedCount})` },
            ].map(f => (
              <button
                key={f.id}
                type="button"
                onClick={() => setReviewFilter(f.id as any)}
                className={`admin-btn ${reviewFilter === f.id ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                style={{ borderRadius: '20px', padding: '6px 14px', fontSize: '12px', fontWeight: 700 }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ minWidth: '260px' }}>
            <input
              type="text"
              className="admin-input"
              placeholder="Rechercher par produit, client, mot-clé..."
              value={reviewSearch}
              onChange={(e) => setReviewSearch(e.target.value)}
              style={{ width: '100%', borderRadius: '20px', padding: '8px 16px', fontSize: '12.5px' }}
            />
          </div>
        </div>

        {/* Reviews List Table */}
        <div className="admin-card" style={{ padding: '0', borderRadius: '20px', overflow: 'hidden' }}>
          {filteredReviews.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center', color: 'var(--adm-text-m)' }}>
              <span style={{ fontSize: '42px', display: 'block', marginBottom: '12px' }}>⭐</span>
              <h3 style={{ fontSize: '17px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '0 0 6px 0' }}>Aucun avis client trouvé</h3>
              <p style={{ fontSize: '13px', margin: 0 }}>Les avis déposés par vos clients apparaîtront ici automatiquement.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--adm-table-stripe)', borderBottom: '1px solid var(--adm-card-border)', textAlign: 'left' }}>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Produit</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Client &amp; Commande</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Note &amp; Titre</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Commentaire &amp; Photo</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Statut</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredReviews.map((rev) => (
                    <tr key={rev.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                      {/* Product */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {rev.productImage && (
                            <img src={rev.productImage} alt={rev.productName || ''} style={{ width: '44px', height: '44px', borderRadius: '10px', objectFit: 'cover' }} />
                          )}
                          <div>
                            <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block' }}>
                              {rev.productName || 'Produit'}
                            </strong>
                            <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                              ID: {rev.productId}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Customer */}
                      <td style={{ padding: '16px 18px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block' }}>
                          {rev.customerName || 'Client'}
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', display: 'block' }}>
                          {rev.customerEmail}
                        </span>
                        {rev.orderNumber && (
                          <span style={{ fontSize: '10.5px', color: '#0284c7', fontWeight: 700, fontFamily: 'monospace' }}>
                            Cmd #{rev.orderNumber}
                          </span>
                        )}
                      </td>

                      {/* Rating & Title */}
                      <td style={{ padding: '16px 18px' }}>
                        <div style={{ color: '#f59e0b', fontSize: '14px', letterSpacing: '2px', fontWeight: 900 }}>
                          {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                        </div>
                        <strong style={{ fontSize: '12.5px', color: 'var(--adm-text-h)', display: 'block', marginTop: '4px' }}>
                          {rev.title}
                        </strong>
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                          {rev.date}
                        </span>
                      </td>

                      {/* Comment & Photo */}
                      <td style={{ padding: '16px 18px', maxWidth: '320px' }}>
                        <p style={{ fontSize: '12.5px', color: 'var(--adm-text-h)', margin: '0 0 6px 0', lineHeight: 1.4 }}>
                          {rev.comment}
                        </p>
                        {rev.photo && (
                          <div style={{ width: '60px', height: '60px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--adm-card-border)' }}>
                            <img src={rev.photo} alt="Photo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        )}
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', display: 'inline-block', marginTop: '4px' }}>
                          👍 {rev.likesCount || 0} votes utiles
                        </span>
                      </td>

                      {/* Status */}
                      <td style={{ padding: '16px 18px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '4px 10px',
                          borderRadius: '12px',
                          background: rev.status === 'APPROVED' ? 'rgba(16, 185, 129, 0.12)' : rev.status === 'REJECTED' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                          color: rev.status === 'APPROVED' ? '#10b981' : rev.status === 'REJECTED' ? '#ef4444' : '#d97706'
                        }}>
                          {rev.status === 'APPROVED' ? '✓ Approuvé' : rev.status === 'REJECTED' ? '✕ Rejeté' : '⏳ En attente'}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '16px 18px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', flexWrap: 'wrap' }}>
                          {rev.status !== 'APPROVED' && (
                            <button
                              type="button"
                              onClick={() => {
                                store.updateProductReview(rev.id, { status: 'APPROVED' });
                                showToast(`✓ Avis de ${rev.customerName} approuvé et mis en ligne !`);
                              }}
                              className="admin-btn admin-btn-sm"
                              style={{ background: '#10b981', color: '#fff', borderRadius: '10px', padding: '6px 10px', fontSize: '11px', fontWeight: 700 }}
                              title="Approuver l'avis"
                            >
                              ✓ Approuver
                            </button>
                          )}
                          {rev.status !== 'REJECTED' && (
                            <button
                              type="button"
                              onClick={() => {
                                store.updateProductReview(rev.id, { status: 'REJECTED' });
                                showToast(`⚠️ Avis de ${rev.customerName} masqué du site.`);
                              }}
                              className="admin-btn admin-btn-sm"
                              style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '10px', padding: '6px 10px', fontSize: '11px', fontWeight: 700 }}
                              title="Rejeter l'avis"
                            >
                              ✕ Masquer
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              showConfirmDialog({
                                title: 'Supprimer cet avis client ?',
                                message: `Êtes-vous sûr de vouloir supprimer définitivement l'avis de ${rev.customerName} sur le produit ${rev.productName} ?`,
                                onConfirm: () => {
                                  store.deleteProductReview(rev.id);
                                  showToast('Avis supprimé définitivement.');
                                },
                                type: 'danger',
                                confirmLabel: 'Supprimer',
                                icon: '🗑️'
                              });
                            }}
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            style={{ borderRadius: '10px', padding: '6px 10px', fontSize: '11px' }}
                            title="Supprimer définitivement"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMarketing = () => {
    const subscribers = store.marketingSubscribers || [];
    const broadcastLogs = store.broadcastLogs || [];
    const products = store.products || [];

    const activeSubscribers = subscribers.filter(s => s.active);
    const whatsappSubscribers = activeSubscribers.filter(s => s.phone && s.channels.includes('WHATSAPP'));
    const emailSubscribers = activeSubscribers.filter(s => s.email && s.channels.includes('EMAIL'));

    const selectedProduct = products.find(p => p.id === selectedBroadcastProductId) || products[0];

    const filteredSubscribers = subscribers.filter(s => {
      const matchFilter = subscriberChannelFilter === 'ALL' || s.channels.includes(subscriberChannelFilter);
      const query = subscriberSearch.trim().toLowerCase();
      const matchQuery = !query || 
        (s.name && s.name.toLowerCase().includes(query)) ||
        (s.email && s.email.toLowerCase().includes(query)) ||
        (s.phone && s.phone.includes(query)) ||
        (s.preferredCategory && s.preferredCategory.toLowerCase().includes(query));
      return matchFilter && matchQuery;
    });

    const formattedPriceFcfa = selectedProduct ? `${Math.round(selectedProduct.price * 655.957).toLocaleString('fr-FR')} FCFA` : '0 FCFA';
    const formattedPriceEur = selectedProduct ? `${selectedProduct.price.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : '0 €';
    const productUrl = typeof window !== 'undefined' ? `${window.location.origin}/products/${selectedProduct?.slug || selectedProduct?.id}` : `http://192.168.1.140:3000/products/${selectedProduct?.slug || selectedProduct?.id}`;

    const defaultBroadcastText = selectedProduct ? 
`🔥 *NOUVEAU DROP CHEZ AYMARD STORE !*

👟 *${selectedProduct.name_fr}*
💰 Prix : *${formattedPriceFcfa}* (${formattedPriceEur})
📦 Stock disponible : *${selectedProduct.stock || 1} exemplaire(s)*

👉 *Découvrez et commandez dès maintenant :*
${productUrl}

_Garantie 100% Neuf & Authentique · Expédition Suivie · Service Client WhatsApp 7j/7_` : '';

    const activeMessage = broadcastMessageText.trim() || defaultBroadcastText;

    const handleSendEmailBroadcast = async () => {
      if (!selectedProduct) {
        showToast('⚠️ Veuillez sélectionner un produit à diffuser.');
        return;
      }
      if (emailSubscribers.length === 0) {
        showToast('⚠️ Aucun abonné Email actif trouvé.');
        return;
      }

      setIsBroadcasting(true);
      try {
        const res = await fetch('/api/broadcast', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            product: selectedProduct,
            subscribers: emailSubscribers,
            channels: ['EMAIL'],
            customMessage: broadcastMessageText || selectedProduct.description_fr,
            merchantSettings: store.merchantSettings
          })
        });
        const data = await res.json();
        if (data.success) {
          store.recordBroadcast({
            productId: selectedProduct.id,
            productName: selectedProduct.name_fr,
            productImage: selectedProduct.images?.[0] || '',
            productPrice: selectedProduct.price,
            currency: 'EUR',
            channels: ['EMAIL'],
            recipientsCount: data.emailsSent || emailSubscribers.length,
            messageText: activeMessage,
            targetCountEmail: data.emailsSent || emailSubscribers.length
          });
          showToast(`📧 Campagne Email envoyée avec succès à ${data.emailsSent || emailSubscribers.length} abonnés !`);
        } else {
          showToast(`⚠️ Erreur : ${data.error || 'Impossible d\'envoyer la campagne.'}`);
        }
      } catch (err: any) {
        showToast(`⚠️ Erreur de diffusion : ${err.message}`);
      } finally {
        setIsBroadcasting(false);
      }
    };

    const handleOpenWhatsappBroadcast = () => {
      if (!selectedProduct) {
        showToast('⚠️ Veuillez sélectionner un produit à diffuser.');
        return;
      }
      const encodedMsg = encodeURIComponent(activeMessage);
      window.open(`https://api.whatsapp.com/send?text=${encodedMsg}`, '_blank');
      
      store.recordBroadcast({
        productId: selectedProduct.id,
        productName: selectedProduct.name_fr,
        productImage: selectedProduct.images?.[0] || '',
        productPrice: selectedProduct.price,
        currency: 'EUR',
        channels: ['WHATSAPP'],
        recipientsCount: whatsappSubscribers.length,
        messageText: activeMessage,
        targetCountWhatsapp: whatsappSubscribers.length
      });
      showToast('💬 Diffusion WhatsApp 1-Clic ouverte !');
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span>🚀</span>
              <span>Marketing &amp; Alertes Drops Nouveautés (WhatsApp &amp; Email)</span>
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
              Diffusez instantanément vos nouveaux arrivages exclusifs auprès de vos acheteurs et abonnés ayant donné leur consentement (Opt-In).
            </p>
          </div>
        </div>

        {/* 4 Stats Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
          <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Total Abonnés Opt-In</span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', marginTop: '4px' }}>{subscribers.length}</div>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>{activeSubscribers.length} abonnés actifs</span>
          </div>

          <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Abonnés WhatsApp 💬</span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#25d366', marginTop: '4px' }}>{whatsappSubscribers.length}</div>
            <span style={{ fontSize: '11px', color: '#25d366', fontWeight: 700 }}>Consentement alertes mobiles</span>
          </div>

          <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Abonnés Email 📧</span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#38bdf8', marginTop: '4px' }}>{emailSubscribers.length}</div>
            <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 700 }}>Newsletters &amp; Drops HTML</span>
          </div>

          <div className="admin-card" style={{ padding: '20px', borderRadius: '18px' }}>
            <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Campagnes Diffusées</span>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#f59e0b', marginTop: '4px' }}>{broadcastLogs.length}</div>
            <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>Historique des drops alertés</span>
          </div>
        </div>

        {/* Studio de Diffusion (New Arrival Broadcast Studio) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>
          
          {/* Left Box: Broadcast Config */}
          <div className="admin-card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ borderBottom: '1px solid var(--adm-card-border)', paddingBottom: '14px' }}>
              <h3 style={{ fontSize: '17px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📣</span> Configurer l&apos;Alerte Nouveau Produit
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                Sélectionnez le produit à mettre en avant et personnalisez votre annonce.
              </span>
            </div>

            {/* Product Selector */}
            <div>
              <label className="admin-label" style={{ marginBottom: '6px' }}>1. Choisir le Produit à Diffuser *</label>
              <select
                className="admin-input"
                value={selectedBroadcastProductId || selectedProduct?.id || ''}
                onChange={(e) => {
                  setSelectedBroadcastProductId(e.target.value);
                  setBroadcastMessageText('');
                }}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '13px' }}
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.name_fr} — {p.price}€ / {Math.round(p.price * 655.957).toLocaleString('fr-FR')} FCFA (Stock: {p.stock})
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Message Announcement */}
            <div>
              <label className="admin-label" style={{ marginBottom: '6px' }}>2. Texte de l&apos;Annonce (Optionnel)</label>
              <textarea
                className="admin-input"
                rows={4}
                placeholder="Laissez vide pour utiliser le format standardisé avec emojis, prix et lien..."
                value={broadcastMessageText}
                onChange={(e) => setBroadcastMessageText(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', fontSize: '12.5px', resize: 'vertical' }}
              />
            </div>

            {/* Channels Checkboxes */}
            <div style={{ background: 'var(--adm-table-stripe)', padding: '14px 18px', borderRadius: '14px', border: '1px solid var(--adm-card-border)' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', display: 'block', marginBottom: '8px' }}>
                3. Canaux de Diffusion Prévus :
              </span>
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--adm-text-h)', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={broadcastChannelWhatsapp}
                    onChange={(e) => setBroadcastChannelWhatsapp(e.target.checked)}
                    style={{ accentColor: '#25d366', width: '16px', height: '16px' }}
                  />
                  <span>💬 WhatsApp ({whatsappSubscribers.length} abonnés)</span>
                </label>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', color: 'var(--adm-text-h)', fontWeight: 700 }}>
                  <input
                    type="checkbox"
                    checked={broadcastChannelEmail}
                    onChange={(e) => setBroadcastChannelEmail(e.target.checked)}
                    style={{ accentColor: '#38bdf8', width: '16px', height: '16px' }}
                  />
                  <span>📧 Email ({emailSubscribers.length} abonnés)</span>
                </label>
              </div>
            </div>

            {/* Launch Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                {broadcastChannelWhatsapp && (
                  <button
                    type="button"
                    onClick={handleOpenWhatsappBroadcast}
                    className="admin-btn"
                    style={{
                      flex: '1 1 180px',
                      background: '#25d366',
                      color: '#ffffff',
                      borderRadius: '14px',
                      padding: '12px 18px',
                      fontWeight: 800,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px',
                      boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
                    }}
                  >
                    <span>💬</span>
                    <span>Diffuser sur WhatsApp (1-Clic)</span>
                  </button>
                )}

                {broadcastChannelEmail && (
                  <button
                    type="button"
                    onClick={handleSendEmailBroadcast}
                    disabled={isBroadcasting}
                    className="admin-btn admin-btn-primary"
                    style={{
                      flex: '1 1 180px',
                      borderRadius: '14px',
                      padding: '12px 18px',
                      fontWeight: 800,
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>📧</span>
                    <span>{isBroadcasting ? 'Envoi en cours...' : 'Envoyer par Email (HTML)'}</span>
                  </button>
                )}
              </div>

              {/* Fast 1-Click WhatsApp Direct Links Pill Bar */}
              {broadcastChannelWhatsapp && whatsappSubscribers.length > 0 && (
                <div style={{ marginTop: '8px', borderTop: '1px dashed var(--adm-card-border)', paddingTop: '10px' }}>
                  <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', fontWeight: 700, display: 'block', marginBottom: '6px' }}>
                    ⚡ Envoi direct individuel 1-clic aux abonnés WhatsApp :
                  </span>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '110px', overflowY: 'auto' }}>
                    {whatsappSubscribers.map(sub => {
                      const cleanPhone = (sub.phone || '').replace(/[^0-9]/g, '');
                      const directUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(activeMessage)}`;
                      return (
                        <a
                          key={sub.id}
                          href={directUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            background: 'rgba(37, 211, 102, 0.12)',
                            color: '#16a34a',
                            border: '1px solid rgba(37, 211, 102, 0.3)',
                            padding: '4px 10px',
                            borderRadius: '12px',
                            fontSize: '11px',
                            fontWeight: 800,
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title={`Envoyer directement à ${sub.name} (${sub.phone})`}
                        >
                          <span>💬</span>
                          <span>{sub.name || sub.phone}</span>
                        </a>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Box: Live Previews */}
          <div className="admin-card" style={{ padding: '24px', borderRadius: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--adm-card-border)', paddingBottom: '12px' }}>
              <span style={{ fontSize: '14px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                📱 Aperçu en direct du message
              </span>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setPreviewChannelTab('WHATSAPP')}
                  style={{
                    background: previewChannelTab === 'WHATSAPP' ? '#25d366' : 'var(--adm-table-stripe)',
                    color: previewChannelTab === 'WHATSAPP' ? '#ffffff' : 'var(--adm-text-m)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  WhatsApp
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewChannelTab('EMAIL')}
                  style={{
                    background: previewChannelTab === 'EMAIL' ? '#38bdf8' : 'var(--adm-table-stripe)',
                    color: previewChannelTab === 'EMAIL' ? '#09090b' : 'var(--adm-text-m)',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '4px 10px',
                    fontSize: '11px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Email HTML
                </button>
              </div>
            </div>

            {/* Preview Body */}
            {previewChannelTab === 'WHATSAPP' ? (
              <div style={{ background: '#0b141a', borderRadius: '18px', padding: '18px', color: '#e9edef', fontFamily: 'system-ui, -apple-system, sans-serif', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '8px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#25d366', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 900 }}>A</div>
                  <div>
                    <strong style={{ fontSize: '12px', color: '#fff', display: 'block' }}>Aymard Store (Officiel)</strong>
                    <span style={{ fontSize: '9.5px', color: '#8696a0' }}>Compte Professionnel Vérifié ✓</span>
                  </div>
                </div>

                {/* WhatsApp Chat Bubble */}
                <div style={{ background: '#005c4b', borderRadius: '14px 14px 2px 14px', padding: '12px 14px', maxWidth: '340px', marginLeft: 'auto', color: '#e9edef', fontSize: '12.5px', lineHeight: 1.45, boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>
                  {selectedProduct?.images?.[0] && (
                    <img src={selectedProduct.images[0]} alt="Product" style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '10px', marginBottom: '10px' }} />
                  )}
                  <div style={{ whiteSpace: 'pre-line' }}>
                    {activeMessage}
                  </div>
                  <div style={{ textAlign: 'right', fontSize: '9.5px', color: 'rgba(255,255,255,0.6)', marginTop: '6px' }}>
                    12:00 ✓✓
                  </div>
                </div>
              </div>
            ) : (
              /* Email Luxury Card Preview */
              <div style={{ background: '#121215', border: '1px solid #27272a', borderRadius: '18px', padding: '20px', color: '#ffffff', textAlign: 'center' }}>
                <div style={{ fontSize: '16px', fontWeight: 900, letterSpacing: '1.5px', marginBottom: '4px' }}>AYMARD<span style={{ color: '#38bdf8' }}>STORE</span></div>
                <span style={{ background: '#ef4444', color: '#fff', fontSize: '9.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '12px', textTransform: 'uppercase' }}>
                  🔥 NOUVEL ARRIVAGE EXCLUSIF
                </span>

                {selectedProduct?.images?.[0] && (
                  <img src={selectedProduct.images[0]} alt="Product" style={{ width: '100%', maxHeight: '140px', objectFit: 'cover', borderRadius: '12px', margin: '14px 0 10px 0' }} />
                )}

                <h4 style={{ fontSize: '15px', fontWeight: 900, margin: '0 0 6px 0', color: '#ffffff' }}>
                  {selectedProduct?.name_fr}
                </h4>
                <div style={{ fontSize: '16px', fontWeight: 900, color: '#facc15', marginBottom: '10px' }}>
                  {formattedPriceFcfa} · {formattedPriceEur}
                </div>
                <p style={{ fontSize: '11.5px', color: '#a1a1aa', margin: '0 0 14px 0', lineHeight: 1.4 }}>
                  {broadcastMessageText || selectedProduct?.description_fr || 'Découvrez cette nouvelle pièce exclusive disponible dès maintenant.'}
                </p>
                <div style={{ display: 'inline-block', background: '#ffffff', color: '#09090b', padding: '8px 20px', borderRadius: '20px', fontWeight: 900, fontSize: '11.5px' }}>
                  DÉCOUVRIR LE PRODUIT ➔
                </div>
              </div>
            )}
          </div>

        </div>

        {/* Table of Opt-in Subscribers */}
        <div className="admin-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px', marginBottom: '18px' }}>
            <div>
              <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>👥</span> Base des Abonnés Consentants ({filteredSubscribers.length})
              </h3>
              <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                Clients ayant opté pour la réception des alertes nouveautés via le site, le panier ou leur compte.
              </span>
            </div>

            {/* Filter Buttons & Search */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { id: 'ALL', label: `Tous (${subscribers.length})` },
                  { id: 'WHATSAPP', label: `WhatsApp (${whatsappSubscribers.length})` },
                  { id: 'EMAIL', label: `Email (${emailSubscribers.length})` },
                ].map(f => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setSubscriberChannelFilter(f.id as any)}
                    className={`admin-btn ${subscriberChannelFilter === f.id ? 'admin-btn-primary' : 'admin-btn-outline'}`}
                    style={{ borderRadius: '14px', padding: '6px 12px', fontSize: '11.5px', fontWeight: 700 }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <input
                type="text"
                className="admin-input"
                placeholder="Rechercher nom, email, tél..."
                value={subscriberSearch}
                onChange={(e) => setSubscriberSearch(e.target.value)}
                style={{ width: '200px', padding: '6px 12px', borderRadius: '14px', fontSize: '12px' }}
              />
            </div>
          </div>

          {filteredSubscribers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--adm-text-m)' }}>
              <span style={{ fontSize: '36px', display: 'block', marginBottom: '8px' }}>📭</span>
              <p style={{ margin: 0, fontSize: '13px' }}>Aucun abonné correspondant aux critères.</p>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--adm-table-stripe)', borderBottom: '1px solid var(--adm-card-border)', textAlign: 'left' }}>
                    <th style={{ padding: '12px 16px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Abonné</th>
                    <th style={{ padding: '12px 16px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Canaux Autorisés</th>
                    <th style={{ padding: '12px 16px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Source Opt-In</th>
                    <th style={{ padding: '12px 16px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Date Inscription</th>
                    <th style={{ padding: '12px 16px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Statut</th>
                    <th style={{ padding: '12px 16px', color: 'var(--adm-text-m)', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSubscribers.map(sub => (
                    <tr key={sub.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                      <td style={{ padding: '14px 16px' }}>
                        <strong style={{ fontSize: '13px', color: 'var(--adm-text-h)', display: 'block' }}>{sub.name || 'Client Aymard Store'}</strong>
                        <span style={{ fontSize: '11px', color: 'var(--adm-text-m)', display: 'block' }}>{sub.email || '—'}</span>
                        {sub.phone && (
                          <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>{sub.phone}</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {sub.channels.includes('WHATSAPP') && (
                            <span style={{ background: 'rgba(37, 211, 102, 0.15)', color: '#16a34a', fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                              💬 WhatsApp
                            </span>
                          )}
                          {sub.channels.includes('EMAIL') && (
                            <span style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#0284c7', fontSize: '10.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '10px' }}>
                              📧 Email
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ fontSize: '11px', background: 'var(--adm-table-stripe)', padding: '3px 8px', borderRadius: '8px', fontWeight: 700 }}>
                          {sub.source === 'CHECKOUT' ? '🛒 Commande' : sub.source === 'ACCOUNT' ? '👤 Espace Compte' : '🌐 Bas de page (Footer)'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: 'var(--adm-text-m)' }}>
                        {sub.subscribedAt}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 800,
                          padding: '3px 8px',
                          borderRadius: '10px',
                          background: sub.active ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: sub.active ? '#10b981' : '#ef4444'
                        }}>
                          {sub.active ? '✓ Actif' : '✕ Inactif'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => store.toggleSubscriberStatus(sub.id)}
                            className="admin-btn admin-btn-sm admin-btn-outline"
                            style={{ borderRadius: '10px', padding: '4px 10px', fontSize: '11px' }}
                            title={sub.active ? 'Désactiver' : 'Activer'}
                          >
                            {sub.active ? 'Désactiver' : 'Activer'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              showConfirmDialog({
                                title: 'Supprimer cet abonné ?',
                                message: `Supprimer définitivement ${sub.name || sub.email || sub.phone} de la liste des alertes ?`,
                                onConfirm: () => {
                                  store.deleteSubscriber(sub.id);
                                  showToast('Abonné supprimé.');
                                },
                                type: 'danger',
                                confirmLabel: 'Supprimer',
                                icon: '🗑️'
                              });
                            }}
                            className="admin-btn admin-btn-sm admin-btn-danger"
                            style={{ borderRadius: '10px', padding: '4px 10px', fontSize: '11px' }}
                            title="Supprimer"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section: Historique des Diffusions Récentes */}
        <div className="admin-card" style={{ padding: '24px', borderRadius: '20px' }}>
          <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--adm-text-h)', margin: '0 0 14px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📜</span> Historique des Alertes Nouveautés Diffusées ({broadcastLogs.length})
          </h3>
          {broadcastLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--adm-text-m)', fontSize: '13px' }}>
              Aucune campagne de diffusion enregistrée pour le moment. Vos futurs lancements de drops apparaîtront ici.
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: 'var(--adm-table-stripe)', borderBottom: '1px solid var(--adm-card-border)', textAlign: 'left' }}>
                    <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Date &amp; Heure</th>
                    <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Produit</th>
                    <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Canaux</th>
                    <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Destinataires</th>
                    <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcastLogs.map(log => (
                    <tr key={log.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                      <td style={{ padding: '12px 14px', color: 'var(--adm-text-m)' }}>{log.sentAt}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          {log.productImage && (
                            <img src={log.productImage} alt={log.productName} style={{ width: '36px', height: '36px', borderRadius: '8px', objectFit: 'cover' }} />
                          )}
                          <strong style={{ color: 'var(--adm-text-h)' }}>{log.productName}</strong>
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: '4px' }}>
                          {log.channels.map(c => (
                            <span key={c} style={{ fontSize: '10.5px', fontWeight: 800, padding: '2px 6px', borderRadius: '6px', background: c === 'WHATSAPP' ? 'rgba(37, 211, 102, 0.15)' : 'rgba(56, 189, 248, 0.15)', color: c === 'WHATSAPP' ? '#16a34a' : '#0284c7' }}>
                              {c}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                        {log.recipientsCount} abonnés
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#10b981', background: 'rgba(16, 185, 129, 0.12)', padding: '2px 8px', borderRadius: '8px' }}>
                          ✓ Diffusé
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  };

  const openBlogModal = (post?: BlogPost) => {
    if (post) {
      setEditingBlogPost(post);
      setBlogTitle(post.title);
      setBlogSlug(post.slug);
      setBlogExcerpt(post.excerpt);
      setBlogContent(post.content);
      setBlogCoverImage(post.coverImage);
      setBlogCategory(post.category);
      setBlogAuthorName(post.author.name);
      setBlogAuthorRole(post.author.role);
      setBlogAuthorAvatar(post.author.avatar || '');
      setBlogReadTime(post.readTime);
      setBlogTagsInput(post.tags.join(', '));
      setBlogLinkedProductIds(post.linkedProductIds || []);
      setBlogIsFeatured(!!post.isFeatured);
      setBlogPublished(post.published !== false);
    } else {
      setEditingBlogPost(null);
      setBlogTitle('');
      setBlogSlug('');
      setBlogExcerpt('');
      setBlogContent(`## L'Essentiel sur ce Modèle\n\nDécrivez ici l'histoire, la conception ou l'attrait de cette pièce...\n\n---\n\n### 1. Pourquoi cette silhouette fait l'unanimité\n\nQualité des matériaux, amorti et allure...\n\n> « Le détail qui fait toute la différence dans votre garde-robe. »\n\n### 2. Conseils de Style & Associations\n\nComment accorder cette paire avec vos tenues au quotidien...`);
      setBlogCoverImage('https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1200&auto=format&fit=crop');
      setBlogCategory('Lookbooks & Style');
      setBlogAuthorName(store.user?.name || 'Aymard J.');
      setBlogAuthorRole('Curateur Mode & Sneakers');
      setBlogAuthorAvatar('https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop');
      setBlogReadTime('4 min');
      setBlogTagsInput('Sneakers, Mode, Hype');
      setBlogLinkedProductIds(store.products?.[0]?.id ? [store.products[0].id] : []);
      setBlogIsFeatured(false);
      setBlogPublished(true);
    }
    setBlogProductPickerQuery('');
    setBlogPreviewMode(false);
    setIsBlogModalOpen(true);
  };

  const handleSaveBlogPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!blogTitle.trim()) {
      showToast('Veuillez indiquer un titre pour l\'article.', 'warning');
      return;
    }

    const finalSlug = (blogSlug.trim() || blogTitle)
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const tagsArray = blogTagsInput
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const postData = {
      title: blogTitle.trim(),
      slug: finalSlug,
      excerpt: blogExcerpt.trim() || 'Découvrez notre nouvel article éditorial.',
      content: blogContent.trim(),
      coverImage: blogCoverImage.trim() || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1200&auto=format&fit=crop',
      category: blogCategory,
      author: {
        name: blogAuthorName.trim() || 'Aymard Store',
        role: blogAuthorRole.trim() || 'Équipe Éditoriale',
        avatar: blogAuthorAvatar.trim() || undefined
      },
      publishedAt: editingBlogPost?.publishedAt || new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }),
      readTime: blogReadTime.trim() || '3 min',
      tags: tagsArray.length > 0 ? tagsArray : ['Sneakers', 'Streetwear'],
      linkedProductIds: blogLinkedProductIds,
      isFeatured: blogIsFeatured,
      published: blogPublished
    };

    if (editingBlogPost) {
      store.updateBlogPost(editingBlogPost.id, postData);
      showToast(`📝 Article "${blogTitle}" mis à jour avec succès !`);
    } else {
      store.addBlogPost(postData);
      showToast(`🎉 Nouvel article "${blogTitle}" créé et rattaché aux produits !`);
    }

    setIsBlogModalOpen(false);
  };

  const renderBlogCMS = () => {
    const posts = store.blogPosts || [];
    const totalViews = posts.reduce((sum, p) => sum + (p.viewsCount || 0), 0);
    const totalLikes = posts.reduce((sum, p) => sum + (p.likesCount || 0), 0);
    const publishedCount = posts.filter(p => p.published !== false).length;

    const filteredPosts = posts.filter(post => {
      const matchCat = blogFilterCategory === 'ALL' || post.category === blogFilterCategory;
      const q = blogSearch.trim().toLowerCase();
      const matchSearch = !q || 
        post.title.toLowerCase().includes(q) ||
        post.excerpt.toLowerCase().includes(q) ||
        post.author.name.toLowerCase().includes(q) ||
        post.tags.some(t => t.toLowerCase().includes(q));
      return matchCat && matchSearch;
    });

    const productsForPicker = (store.products || []).filter(p => {
      if (!blogProductPickerQuery.trim()) return true;
      const q = blogProductPickerQuery.toLowerCase();
      return p.name_fr.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
    });

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
        
        {/* Header Section */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(56, 189, 248, 0.12)', color: '#38bdf8', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>
              <span>📰</span> CMS JOURNAL &amp; ARTICLES
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0 }}>
              Gestion du Blog &amp; Publications Produits
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--adm-text-m)', margin: '4px 0 0 0' }}>
              Rédigez vos articles, lookbooks et guides d&apos;entretien, et rattachez-les à vos paires pour booster les ventes.
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <Link
              href="/blog"
              target="_blank"
              className="admin-btn admin-btn-outline"
              style={{ borderRadius: '12px', padding: '10px 18px', fontSize: '12.5px', fontWeight: 700, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span>👁️</span> Voir le Blog en Direct
            </Link>

            <button
              onClick={() => openBlogModal()}
              className="admin-btn admin-btn-primary"
              style={{
                borderRadius: '12px',
                padding: '10px 20px',
                fontSize: '13px',
                fontWeight: 800,
                background: '#0284c7',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
              }}
            >
              <span>✍️</span> + Rédiger un nouvel article
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '16px'
        }}>
          <div className="admin-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Total Articles</span>
              <span style={{ fontSize: '20px' }}>📚</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', marginTop: '8px' }}>
              {posts.length}
            </div>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
              {publishedCount} en ligne
            </span>
          </div>

          <div className="admin-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Lectures / Vues</span>
              <span style={{ fontSize: '20px' }}>👀</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#38bdf8', marginTop: '8px' }}>
              {totalViews.toLocaleString('fr-FR')}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
              Vues cumulées sur le Journal
            </span>
          </div>

          <div className="admin-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Mentions J&apos;aime</span>
              <span style={{ fontSize: '20px' }}>❤️</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#ef4444', marginTop: '8px' }}>
              {totalLikes}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
              Engagements lecteurs
            </span>
          </div>

          <div className="admin-card" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '11.5px', fontWeight: 800, color: 'var(--adm-text-m)', textTransform: 'uppercase' }}>Rattachement Produits</span>
              <span style={{ fontSize: '20px' }}>🛒</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: 900, color: '#facc15', marginTop: '8px' }}>
              {posts.filter(p => p.linkedProductIds && p.linkedProductIds.length > 0).length} / {posts.length}
            </div>
            <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
              Articles avec liens d&apos;achat
            </span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="admin-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', flex: '1 1 300px' }}>
            {['ALL', 'Lookbooks & Style', 'Sneakers Culture', 'Guides & Conseils', 'Actualités & Drops'].map(cat => (
              <button
                key={cat}
                type="button"
                onClick={() => setBlogFilterCategory(cat)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '16px',
                  border: blogFilterCategory === cat ? '1px solid #38bdf8' : '1px solid var(--adm-card-border)',
                  background: blogFilterCategory === cat ? 'rgba(56, 189, 248, 0.15)' : 'var(--adm-card-bg)',
                  color: blogFilterCategory === cat ? '#38bdf8' : 'var(--adm-text-m)',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {cat === 'ALL' ? 'Toutes les catégories' : cat}
              </button>
            ))}
          </div>

          <div style={{ position: 'relative', width: '260px' }}>
            <input
              type="text"
              placeholder="Rechercher un article..."
              value={blogSearch}
              onChange={e => setBlogSearch(e.target.value)}
              className="admin-input"
              style={{ width: '100%', borderRadius: '20px', padding: '8px 14px 8px 32px', fontSize: '12.5px' }}
            />
            <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '13px', color: 'var(--adm-text-m)' }}>
              🔍
            </span>
          </div>
        </div>

        {/* Articles Table */}
        <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
          {filteredPosts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--adm-text-m)' }}>
              <span style={{ fontSize: '44px', display: 'block', marginBottom: '12px' }}>✍️</span>
              <h4 style={{ fontSize: '16px', fontWeight: 800, color: 'var(--adm-text-h)', margin: '0 0 6px 0' }}>Aucun article trouvé</h4>
              <p style={{ fontSize: '13px', margin: '0 0 16px 0' }}>Commencez par rédiger un premier article pour enrichir votre boutique.</p>
              <button
                onClick={() => openBlogModal()}
                className="admin-btn admin-btn-primary admin-btn-sm"
                style={{ borderRadius: '20px', padding: '8px 18px', fontWeight: 800 }}
              >
                + Rédiger mon premier article
              </button>
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--adm-table-stripe)', borderBottom: '1px solid var(--adm-card-border)', textAlign: 'left' }}>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Article</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Catégorie &amp; Auteur</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Produits Rattachés 🔗</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Vues &amp; Likes</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Statut</th>
                    <th style={{ padding: '14px 18px', color: 'var(--adm-text-m)', fontWeight: 800, textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPosts.map(post => {
                    const linkedProds = (store.products || []).filter(p => (post.linkedProductIds || []).includes(p.id));
                    return (
                      <tr key={post.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                        {/* Cover + Title */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                            <img 
                              src={post.coverImage} 
                              alt={post.title} 
                              style={{ width: '56px', height: '40px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }}
                            />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                                {post.isFeatured && (
                                  <span style={{ fontSize: '9px', fontWeight: 900, background: '#ef4444', color: '#fff', padding: '1px 6px', borderRadius: '6px' }}>
                                    À LA UNE
                                  </span>
                                )}
                                <strong style={{ fontSize: '13.5px', color: 'var(--adm-text-h)', display: 'block' }}>
                                  {post.title}
                                </strong>
                              </div>
                              <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                                Slug : /{post.slug} • ⏱️ {post.readTime}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Category & Author */}
                        <td style={{ padding: '14px 18px' }}>
                          <span style={{ fontSize: '11px', fontWeight: 800, color: '#38bdf8', background: 'rgba(56, 189, 248, 0.12)', padding: '2px 8px', borderRadius: '8px', display: 'inline-block', marginBottom: '4px' }}>
                            {post.category}
                          </span>
                          <div style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                            Par <strong>{post.author.name}</strong> • {post.publishedAt}
                          </div>
                        </td>

                        {/* Linked Products */}
                        <td style={{ padding: '14px 18px' }}>
                          {linkedProds.length === 0 ? (
                            <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)', fontStyle: 'italic' }}>
                              Aucun produit rattaché
                            </span>
                          ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              {linkedProds.map(lp => (
                                <div key={lp.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: 'var(--adm-text-h)' }}>
                                  <span style={{ color: '#10b981' }}>✓</span>
                                  {lp.images?.[0] && (
                                    <img src={lp.images[0]} alt={lp.name_fr} style={{ width: '18px', height: '18px', borderRadius: '4px', objectFit: 'cover' }} />
                                  )}
                                  <span>{lp.name_fr}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>

                        {/* Stats */}
                        <td style={{ padding: '14px 18px' }}>
                          <div style={{ fontSize: '12.5px', color: 'var(--adm-text-h)', fontWeight: 700 }}>
                            👀 {post.viewsCount || 0} vues
                          </div>
                          <div style={{ fontSize: '11.5px', color: '#ef4444' }}>
                            ❤️ {post.likesCount || 0} likes
                          </div>
                        </td>

                        {/* Status Toggle */}
                        <td style={{ padding: '14px 18px' }}>
                          <button
                            type="button"
                            onClick={() => store.togglePublishBlogPost(post.id)}
                            style={{
                              border: 'none',
                              background: post.published !== false ? 'rgba(16, 185, 129, 0.15)' : 'rgba(113, 113, 122, 0.15)',
                              color: post.published !== false ? '#10b981' : '#71717a',
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '4px 10px',
                              borderRadius: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            {post.published !== false ? '🟢 Publié' : '⚪ Brouillon'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td style={{ padding: '14px 18px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <Link
                              href={`/blog/${post.slug}`}
                              target="_blank"
                              className="admin-btn admin-btn-outline admin-btn-sm"
                              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11px', textDecoration: 'none' }}
                              title="Voir la publication en ligne"
                            >
                              👁️
                            </Link>

                            <button
                              type="button"
                              onClick={() => openBlogModal(post)}
                              className="admin-btn admin-btn-outline admin-btn-sm"
                              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11px' }}
                              title="Modifier l'article"
                            >
                              ✏️
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                showConfirmDialog({
                                  title: 'Supprimer cet article ?',
                                  message: `Êtes-vous sûr de vouloir supprimer définitivement l'article "${post.title}" ?`,
                                  type: 'danger',
                                  confirmLabel: 'Supprimer',
                                  onConfirm: () => {
                                    store.deleteBlogPost(post.id);
                                    showToast('Article supprimé du blog !');
                                  }
                                });
                              }}
                              className="admin-btn admin-btn-danger admin-btn-sm"
                              style={{ padding: '6px 10px', borderRadius: '8px', fontSize: '11px' }}
                              title="Supprimer"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Full Blog Post Editor with Visual Product Multi-Linker */}
        {isBlogModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              backdropFilter: 'blur(8px)',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={() => setIsBlogModalOpen(false)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '920px',
                maxHeight: '92vh',
                backgroundColor: 'var(--adm-card-bg)',
                borderRadius: '24px',
                border: '1.5px solid var(--adm-card-border)',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animation: 'modalZoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '20px 28px',
                borderBottom: '1px solid var(--adm-card-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #09090b, #18181b)',
                color: '#ffffff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#38bdf8' }}>
                    ✍️
                  </div>
                  <div>
                    <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                      {editingBlogPost ? 'Modifier la publication' : 'Rédiger un nouvel article de blog'}
                    </h3>
                    <span style={{ fontSize: '11.5px', color: '#a1a1aa' }}>
                      Journal Aymard Store · Rattachement de produits en 1-clic
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsBlogModalOpen(false)}
                  style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', fontWeight: 800 }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body / Form */}
              <form onSubmit={handleSaveBlogPost} style={{ display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
                <div style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                  {/* Title & Category */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                        Titre de l&apos;article *
                      </label>
                      <input
                        type="text"
                        required
                        value={blogTitle}
                        onChange={e => {
                          setBlogTitle(e.target.value);
                          if (!editingBlogPost) {
                            setBlogSlug(e.target.value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
                          }
                        }}
                        placeholder="ex: Guide Style 2026 : Comment porter la Jordan 4 Retro..."
                        className="admin-input"
                        style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '13.5px', fontWeight: 700 }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                        Catégorie Éditioriale *
                      </label>
                      <select
                        value={blogCategory}
                        onChange={e => setBlogCategory(e.target.value as any)}
                        className="admin-input"
                        style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', fontWeight: 700 }}
                      >
                        <option value="Lookbooks & Style">Lookbooks &amp; Style</option>
                        <option value="Sneakers Culture">Sneakers Culture</option>
                        <option value="Guides & Conseils">Guides &amp; Conseils</option>
                        <option value="Actualités & Drops">Actualités &amp; Drops</option>
                      </select>
                    </div>
                  </div>

                  {/* Slug & Cover Image URL */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                        URL Slug (/blog/...)
                      </label>
                      <input
                        type="text"
                        value={blogSlug}
                        onChange={e => setBlogSlug(e.target.value)}
                        placeholder="guide-style-jordan-4-retro"
                        className="admin-input"
                        style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px', fontFamily: 'monospace' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                        Image de Couverture (URL)
                      </label>
                      <input
                        type="url"
                        value={blogCoverImage}
                        onChange={e => setBlogCoverImage(e.target.value)}
                        placeholder="https://images.unsplash.com/..."
                        className="admin-input"
                        style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px' }}
                      />
                    </div>
                  </div>

                  {/* Excerpt */}
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                      Extrait / Résumé d&apos;accroche (affiché sur les cartes &amp; pour le SEO)
                    </label>
                    <textarea
                      rows={2}
                      value={blogExcerpt}
                      onChange={e => setBlogExcerpt(e.target.value)}
                      placeholder="Court résumé percutant pour donner envie aux clients de lire..."
                      className="admin-input"
                      style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', lineHeight: 1.45 }}
                    />
                  </div>

                  {/* ========================================================= */}
                  {/* 🔗 VISUAL PRODUCT MULTI-LINKER SECTION */}
                  {/* ========================================================= */}
                  <div style={{
                    background: 'rgba(56, 189, 248, 0.05)',
                    border: '1.5px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: '16px',
                    padding: '16px 20px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
                      <div>
                        <strong style={{ fontSize: '13px', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                          <span>🔗</span> Rattacher des Produits du Catalogue à cet Article ({blogLinkedProductIds.length} sélectionné{blogLinkedProductIds.length > 1 ? 's' : ''})
                        </strong>
                        <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                          Ces produits apparaîtront dans l&apos;encart d&apos;achat direct de l&apos;article et afficheront le badge du Journal sur leur fiche produit.
                        </span>
                      </div>

                      <input
                        type="text"
                        placeholder="Filtrer les produits (Nike, Asics...)"
                        value={blogProductPickerQuery}
                        onChange={e => setBlogProductPickerQuery(e.target.value)}
                        className="admin-input"
                        style={{ width: '220px', borderRadius: '14px', padding: '6px 12px', fontSize: '11.5px' }}
                      />
                    </div>

                    {/* Selected Products Badges */}
                    {blogLinkedProductIds.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                        {blogLinkedProductIds.map(pid => {
                          const prod = (store.products || []).find(p => p.id === pid);
                          if (!prod) return null;
                          return (
                            <span 
                              key={pid}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: '#0284c7',
                                color: '#ffffff',
                                padding: '4px 10px',
                                borderRadius: '20px',
                                fontSize: '11.5px',
                                fontWeight: 800
                              }}
                            >
                              {prod.images?.[0] && (
                                <img src={prod.images[0]} alt={prod.name_fr} style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
                              )}
                              <span>{prod.name_fr}</span>
                              <button
                                type="button"
                                onClick={() => setBlogLinkedProductIds(prev => prev.filter(id => id !== pid))}
                                style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '0 2px', fontSize: '12px', fontWeight: 900 }}
                              >
                                ✕
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* Scrollable Catalog Picker List */}
                    <div style={{
                      maxHeight: '160px',
                      overflowY: 'auto',
                      border: '1px solid var(--adm-card-border)',
                      borderRadius: '12px',
                      background: 'var(--adm-card-bg)',
                      padding: '8px'
                    }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px' }}>
                        {productsForPicker.slice(0, 18).map(prod => {
                          const isLinked = blogLinkedProductIds.includes(prod.id);
                          return (
                            <button
                              key={prod.id}
                              type="button"
                              onClick={() => {
                                if (isLinked) {
                                  setBlogLinkedProductIds(prev => prev.filter(id => id !== prod.id));
                                } else {
                                  setBlogLinkedProductIds(prev => [...prev, prod.id]);
                                }
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 10px',
                                borderRadius: '10px',
                                border: isLinked ? '1.5px solid #0284c7' : '1px solid var(--adm-card-border)',
                                background: isLinked ? 'rgba(2, 132, 199, 0.12)' : 'transparent',
                                color: 'var(--adm-text-h)',
                                textAlign: 'left',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease'
                              }}
                            >
                              <span style={{ fontSize: '13px' }}>{isLinked ? '☑️' : '⬜'}</span>
                              {prod.images?.[0] && (
                                <img src={prod.images[0]} alt={prod.name_fr} style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
                              )}
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <span style={{ fontSize: '11.5px', fontWeight: 700, display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {prod.name_fr}
                                </span>
                                <span style={{ fontSize: '10.5px', color: '#facc15', fontWeight: 800 }}>
                                  {prod.price}€ / {Math.round(prod.price * 655.957).toLocaleString('fr-FR')} F
                                </span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Author, ReadTime & Tags */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                        Nom de l&apos;Auteur
                      </label>
                      <input
                        type="text"
                        value={blogAuthorName}
                        onChange={e => setBlogAuthorName(e.target.value)}
                        className="admin-input"
                        style={{ width: '100%', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                        Rôle / Titre Auteur
                      </label>
                      <input
                        type="text"
                        value={blogAuthorRole}
                        onChange={e => setBlogAuthorRole(e.target.value)}
                        className="admin-input"
                        style={{ width: '100%', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                        Temps de Lecture
                      </label>
                      <input
                        type="text"
                        value={blogReadTime}
                        onChange={e => setBlogReadTime(e.target.value)}
                        placeholder="ex: 4 min"
                        className="admin-input"
                        style={{ width: '100%', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px' }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: '6px' }}>
                        Tags (séparés par virgule)
                      </label>
                      <input
                        type="text"
                        value={blogTagsInput}
                        onChange={e => setBlogTagsInput(e.target.value)}
                        placeholder="Jordan, Lookbook, Cuir"
                        className="admin-input"
                        style={{ width: '100%', borderRadius: '10px', padding: '8px 12px', fontSize: '12.5px' }}
                      />
                    </div>
                  </div>

                  {/* Content Area with Markdown / Preview Toggle */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)' }}>
                        Contenu de l&apos;article (Markdown supporté : ## Titres, * Listes, &gt; Citations, --- Séparateurs) *
                      </label>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          onClick={() => setBlogPreviewMode(false)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            border: !blogPreviewMode ? '1px solid #38bdf8' : '1px solid var(--adm-card-border)',
                            background: !blogPreviewMode ? 'rgba(56,189,248,0.15)' : 'transparent',
                            color: !blogPreviewMode ? '#38bdf8' : 'var(--adm-text-m)',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Édition Markdown
                        </button>
                        <button
                          type="button"
                          onClick={() => setBlogPreviewMode(true)}
                          style={{
                            padding: '4px 10px',
                            borderRadius: '8px',
                            border: blogPreviewMode ? '1px solid #38bdf8' : '1px solid var(--adm-card-border)',
                            background: blogPreviewMode ? 'rgba(56,189,248,0.15)' : 'transparent',
                            color: blogPreviewMode ? '#38bdf8' : 'var(--adm-text-m)',
                            fontSize: '11px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Aperçu en Direct
                        </button>
                      </div>
                    </div>

                    {!blogPreviewMode ? (
                      <textarea
                        rows={10}
                        required
                        value={blogContent}
                        onChange={e => setBlogContent(e.target.value)}
                        placeholder="Rédigez votre article en Markdown..."
                        className="admin-input"
                        style={{ width: '100%', borderRadius: '12px', padding: '12px 14px', fontSize: '13px', lineHeight: 1.6, fontFamily: 'monospace' }}
                      />
                    ) : (
                      <div style={{
                        padding: '16px 20px',
                        borderRadius: '12px',
                        border: '1px solid var(--adm-card-border)',
                        background: 'rgba(0,0,0,0.2)',
                        maxHeight: '260px',
                        overflowY: 'auto',
                        fontSize: '13.5px',
                        lineHeight: 1.65,
                        color: 'var(--adm-text-h)'
                      }}>
                        <div style={{ whiteSpace: 'pre-line' }}>
                          {blogContent || 'Aucun contenu rédigé pour le moment.'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Toggles */}
                  <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', paddingTop: '8px' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                      <input
                        type="checkbox"
                        checked={blogIsFeatured}
                        onChange={e => setBlogIsFeatured(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#ef4444' }}
                      />
                      <span>⭐ Mettre en avant à la une (Hero Banner)</span>
                    </label>

                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 700, color: 'var(--adm-text-h)' }}>
                      <input
                        type="checkbox"
                        checked={blogPublished}
                        onChange={e => setBlogPublished(e.target.checked)}
                        style={{ width: '16px', height: '16px', accentColor: '#10b981' }}
                      />
                      <span>🟢 Publier immédiatement (Visible sur /blog)</span>
                    </label>
                  </div>

                </div>

                {/* Modal Footer */}
                <div style={{
                  padding: '16px 28px',
                  borderTop: '1px solid var(--adm-card-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  background: 'rgba(0,0,0,0.02)'
                }}>
                  <button
                    type="button"
                    onClick={() => setIsBlogModalOpen(false)}
                    className="admin-btn admin-btn-outline"
                    style={{ borderRadius: '12px', padding: '10px 20px', fontWeight: 700 }}
                  >
                    Annuler
                  </button>

                  <button
                    type="submit"
                    className="admin-btn admin-btn-primary"
                    style={{
                      borderRadius: '12px',
                      padding: '10px 26px',
                      fontWeight: 800,
                      background: '#0284c7',
                      color: '#ffffff',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                    }}
                  >
                    {editingBlogPost ? '💾 Mettre à jour la publication' : '🎉 Publier l\'article'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    );
  };

  const renderProfile = () => (
    <>
      <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 24, fontFamily: 'var(--font-plus-jakarta)' }}>Mon Profil</h2>
      <div className="admin-card" style={{ maxWidth: 500 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#000', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, fontFamily: 'var(--font-plus-jakarta)' }}>
            {store.user?.name?.charAt(0).toUpperCase() || 'A'}
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-plus-jakarta)' }}>{store.user?.name}</div>
            <div style={{ fontSize: 13, color: '#64748b' }}>{store.user?.email}</div>
            <span className="admin-badge active" style={{ marginTop: 4 }}>Administrateur</span>
          </div>
        </div>
        <div className="admin-form-grid">
          <div><label className="admin-label">Nom</label><input className="admin-input" defaultValue={store.user?.name} /></div>
          <div><label className="admin-label">Email</label><input className="admin-input" defaultValue={store.user?.email} type="email" /></div>
        </div>
        <div style={{ marginTop: 20 }}>
          <button className="admin-btn admin-btn-primary" onClick={() => showToast('Profil mis à jour !')}>Sauvegarder</button>
          <button className="admin-btn admin-btn-danger" style={{ marginLeft: 12 }} onClick={() => { store.logout(); router.push('/'); }}>Déconnexion</button>
        </div>
      </div>
    </>
  );

  // ======= TAB ROUTER =======
  const tabContent: Record<Tab, () => React.ReactNode> = {
    dashboard: renderDashboard, products: renderProducts, categories: renderCategories, homeCms: renderHomeCms,
    orders: renderOrders, abandonedCheckouts: renderAbandonedCheckouts, reviews: renderReviews, marketing: renderMarketing, blog: renderBlogCMS, supportChat: renderSupportChat, clients: renderClients, transactions: renderTransactions,
    accounting: renderAccounting,
    promos: renderPromos, delivery: renderDelivery, locations: renderLocations, suppliers: renderSuppliers,
    employees: renderEmployees, analytics: renderAnalytics, pixels: renderPixels, settings: renderSettings, profile: renderProfile,
  };

  // ======= MAIN RENDER =======
  return (
    <div className="admin-dashboard-container" data-theme={adminDarkMode ? 'dark' : 'light'}>
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="admin-sidebar-logo">
          {sidebarCollapsed ? (
            <Link href="/" title="Retourner à la boutique (Accueil)" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-plus-jakarta)', letterSpacing: -0.5, color: '#3b82f6' }}>
                AS
              </span>
            </Link>
          ) : (
            <Link href="/" title="Retourner à la boutique (Accueil)" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ fontSize: 20, fontWeight: 900, fontFamily: 'var(--font-plus-jakarta)', letterSpacing: -0.5 }}>
                AYMARD<span style={{ opacity: 0.5 }}>STORE</span>
              </span>
            </Link>
          )}
        </div>

        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="admin-sidebar-toggle-inline"
          title={sidebarCollapsed ? "Agrandir le menu" : "Réduire le menu"}
        >
          {sidebarCollapsed ? '⟩' : '⟨'}
        </button>

        <nav className="admin-sidebar-nav">
          {NAV_ITEMS.map(item => {
            const navBadge = getNavItemBadge(item.id);
            return (
              <React.Fragment key={item.id}>
                {item.section && <div className="admin-sidebar-section-label">{item.section}</div>}
                <button
                  className={`admin-sidebar-nav-btn ${tab === item.id ? 'active' : ''}`}
                  onClick={() => {
                    setTab(item.id);
                    if (typeof window !== 'undefined' && window.innerWidth <= 768) {
                      setSidebarCollapsed(true);
                    }
                  }}
                  title={sidebarCollapsed ? `${item.label} ${navBadge ? `(${navBadge.count} alertes)` : ''}` : undefined}
                  style={{ position: 'relative' }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', width: sidebarCollapsed ? '100%' : 'auto', flexShrink: 0 }}>
                    {getTabIcon(item.id)}
                    {sidebarCollapsed && navBadge && (
                      <span
                        style={{
                          position: 'absolute',
                          top: -3,
                          right: -3,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: navBadge.color,
                          boxShadow: `0 0 6px ${navBadge.color}`
                        }}
                      />
                    )}
                  </span>
                  {!sidebarCollapsed && (
                    <>
                      <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
                      {navBadge && (
                        <span
                          onClick={(e) => {
                            if (item.id === 'analytics') {
                              e.stopPropagation();
                              setTab('analytics');
                              refreshLiveVisitors();
                              setShowLiveVisitorsModal(true);
                            }
                          }}
                          style={{
                            background: navBadge.color,
                            color: '#ffffff',
                            fontSize: '10.5px',
                            fontWeight: 800,
                            padding: '2px 8px',
                            borderRadius: '12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            boxShadow: `0 2px 6px ${navBadge.color}40`,
                            animation: navBadge.pulse ? 'livePulseDot 2s infinite' : 'none',
                            cursor: item.id === 'analytics' ? 'pointer' : 'default'
                          }}
                          title={item.id === 'analytics' ? 'Cliquer pour voir la carte et les localisations' : undefined}
                        >
                          {navBadge.count}
                        </span>
                      )}
                    </>
                  )}
                </button>
              </React.Fragment>
            );
          })}
        </nav>
        <div style={{ padding: sidebarCollapsed ? '16px 0' : '16px 20px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: sidebarCollapsed ? 'center' : 'flex-start' }}>
          <button onClick={() => { store.logout(); router.push('/'); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, fontFamily: 'var(--font-outfit)' }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Overlay when sidebar is open on mobile */}
      {!sidebarCollapsed && (
        <div 
          className="admin-mobile-overlay" 
          onClick={() => setSidebarCollapsed(true)} 
        />
      )}

      {/* Main Wrapper */}
      <div className="admin-main-wrapper">
        {/* Top Bar */}
        <div className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <button 
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="admin-mobile-toggle-btn"
              title="Ouvrir le menu"
            >
              ☰
            </button>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)', display: 'flex', alignItems: 'center', gap: 8 }}>
              {tab !== 'dashboard' ? (
                <>
                  <button
                    type="button"
                    onClick={() => setTab('dashboard')}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: 0,
                      cursor: 'pointer',
                      color: 'var(--adm-text-m)',
                      fontWeight: 600,
                      fontSize: 13,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4
                    }}
                    title="Retourner au Tableau de bord"
                  >
                    <span>Tableau de bord</span>
                  </button>
                  <span style={{ color: 'var(--adm-text-m)', opacity: 0.4 }}>/</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--adm-text-h)', fontWeight: 800 }}>
                    {getTabIcon(tab)} {NAV_ITEMS.find(n => n.id === tab)?.label || 'Tableau de bord'}
                  </span>
                </>
              ) : (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {getTabIcon(tab)} {NAV_ITEMS.find(n => n.id === tab)?.label || 'Tableau de bord'}
                </span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Theme Switcher Button (Icon Only) */}
            <button 
              onClick={toggleAdminTheme}
              title={adminDarkMode ? "Passer en Mode Clair" : "Passer en Mode Sombre"}
              style={{
                background: 'rgba(56, 189, 248, 0.10)',
                cursor: 'pointer',
                fontSize: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: '1px solid var(--adm-card-border)',
                color: 'var(--adm-text-h)',
                transition: 'all 0.2s'
              }}
            >
              <span>{adminDarkMode ? '☀️' : '🌙'}</span>
            </button>

            <span style={{ fontSize: 12, color: 'var(--adm-text-m)', fontWeight: 500 }}>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #0ea5e9, #2563eb)', color: '#ffffff', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, fontFamily: 'var(--font-plus-jakarta)', boxShadow: '0 0 12px rgba(14,165,233,0.3)' }}>
              {store.user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
          </div>
        </div>

        {/* Content */}
        <main className="admin-main">
          {typeof tabContent[tab] === 'function' ? tabContent[tab]() : renderDashboard()}
        </main>
      </div>

      {/* Modal */}
      {renderModal()}

      {/* Luxury Custom Confirmation & Alert Dialog Modal */}
      {confirmDialog && confirmDialog.isOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeConfirmDialog();
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '460px',
              backgroundColor: 'var(--adm-card-bg)',
              borderRadius: '24px',
              border: confirmDialog.type === 'danger' ? '1.5px solid rgba(239, 68, 68, 0.4)' : '1.5px solid var(--adm-card-border)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5), 0 0 30px rgba(0, 0, 0, 0.2)',
              overflow: 'hidden',
              animation: 'modalZoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Dialog Header */}
            <div style={{
              padding: '28px 28px 16px 28px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '16px'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '16px',
                background: confirmDialog.type === 'danger' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(245, 158, 11, 0.12)',
                border: confirmDialog.type === 'danger' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(245, 158, 11, 0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '26px',
                flexShrink: 0
              }}>
                {confirmDialog.icon || (confirmDialog.type === 'danger' ? '🗑️' : '⚠️')}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: 800,
                  color: 'var(--adm-text-h)',
                  margin: '0 0 6px 0',
                  fontFamily: 'var(--font-plus-jakarta)'
                }}>
                  {confirmDialog.title}
                </h3>
                <p style={{
                  fontSize: '13.5px',
                  color: 'var(--adm-text-m)',
                  margin: 0,
                  lineHeight: '1.55',
                  whiteSpace: 'pre-line'
                }}>
                  {confirmDialog.message}
                </p>
              </div>
            </div>

            {/* Dialog Footer Actions */}
            <div style={{
              padding: '16px 28px 24px 28px',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              borderTop: '1px solid var(--adm-card-border)',
              background: 'rgba(0, 0, 0, 0.02)'
            }}>
              <button
                type="button"
                onClick={closeConfirmDialog}
                className="admin-btn admin-btn-outline"
                style={{
                  borderRadius: '14px',
                  padding: '10px 20px',
                  fontWeight: 700,
                  fontSize: '13px'
                }}
              >
                {confirmDialog.cancelLabel || 'Annuler'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const action = confirmDialog.onConfirm;
                  closeConfirmDialog();
                  action();
                }}
                className={`admin-btn ${confirmDialog.type === 'danger' ? 'admin-btn-danger' : 'admin-btn-primary'}`}
                style={{
                  borderRadius: '14px',
                  padding: '10px 22px',
                  fontWeight: 800,
                  fontSize: '13px',
                  boxShadow: confirmDialog.type === 'danger' ? '0 4px 14px rgba(239, 68, 68, 0.3)' : undefined
                }}
              >
                {confirmDialog.confirmLabel || 'Confirmer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Real-Time Package Tracking & Dispatch Supervision Hub Modal */}
      {trackingOrder && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999998,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.70)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setTrackingOrder(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              backgroundColor: 'var(--adm-card-bg)',
              borderRadius: '24px',
              border: '1.5px solid var(--adm-card-border)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '24px 28px',
              borderBottom: '1px solid var(--adm-card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(2, 132, 199, 0.04)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{
                  width: '46px',
                  height: '46px',
                  borderRadius: '14px',
                  background: 'rgba(2, 132, 199, 0.12)',
                  border: '1px solid rgba(2, 132, 199, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>
                  🛰️
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)' }}>
                    Supervision & Géolocalisation du Colis
                  </h3>
                  <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '2px 0 0 0' }}>
                    Commande <strong style={{ color: '#0284c7' }}>{trackingOrder.orderNumber}</strong> · Destinataire : <strong>{trackingOrder.shippingAddress?.fullName}</strong> ({trackingOrder.shippingAddress?.city || 'Bénin'})
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="admin-btn admin-btn-outline"
                style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* 1. Step Pipeline Selector */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--adm-text-m)', display: 'block', marginBottom: '10px' }}>
                  1. Étape de Livraison Actuelle (Visible en temps réel chez le client)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '8px' }}>
                  {[
                    { step: 1, label: '1. Validée', icon: '📝', desc: 'Reçue' },
                    { step: 2, label: '2. Préparation', icon: '📦', desc: 'Entrepôt' },
                    { step: 3, label: '3. En Route', icon: '🛵', desc: 'Coursier / Transit' },
                    { step: 4, label: '4. Livrée', icon: '✅', desc: 'Remis au client' }
                  ].map((s) => {
                    const isSelected = trackingStep === s.step;
                    return (
                      <button
                        key={s.step}
                        type="button"
                        onClick={() => {
                          setTrackingStep(s.step);
                          if (s.step === 1) {
                            setTrackingStatusText('Commande confirmée & enregistrée');
                            setTrackingLocation('Entrepôt Central Aymard Store');
                          } else if (s.step === 2) {
                            setTrackingStatusText('Colis en cours de préparation et contrôle qualité');
                            setTrackingLocation('Entrepôt Cotonou (Haie Vive)');
                          } else if (s.step === 3) {
                            setTrackingStatusText('Colis pris en charge par le coursier express');
                            setTrackingLocation(`En route vers ${trackingOrder.shippingAddress?.city || 'l\'adresse de livraison'}`);
                          } else if (s.step === 4) {
                            setTrackingStatusText('Colis livré avec succès en main propre');
                            setTrackingLocation(`Remis à l'adresse (${trackingOrder.shippingAddress?.city || 'Client'})`);
                          }
                        }}
                        style={{
                          padding: '12px 10px',
                          borderRadius: '14px',
                          border: isSelected ? '2px solid #0284c7' : '1px solid var(--adm-card-border)',
                          background: isSelected ? 'rgba(2, 132, 199, 0.12)' : 'var(--adm-card-bg)',
                          color: isSelected ? '#0284c7' : 'var(--adm-text-h)',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.2s',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <span style={{ fontSize: '18px' }}>{s.icon}</span>
                        <strong style={{ fontSize: '12px' }}>{s.label}</strong>
                        <span style={{ fontSize: '10.5px', opacity: 0.7 }}>{s.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* 2. Current Live Location */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--adm-text-m)', display: 'block', marginBottom: '8px' }}>
                  2. Localisation Actuelle du Colis (Où se trouve le colis en ce moment ?)
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={trackingLocation}
                  onChange={(e) => setTrackingLocation(e.target.value)}
                  placeholder="ex: Entrepôt Cotonou (Haie Vive), En cours de livraison moto..."
                  style={{ width: '100%', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', fontWeight: 600 }}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {[
                    '📍 Entrepôt Cotonou (Haie Vive)',
                    '🛵 En cours de livraison coursier moto (Cotonou)',
                    '🚚 En route vers Abomey-Calavi / Godomey',
                    '📦 En transit gare routière / Parakou',
                    '📍 Hub Paris 8e / Roissy CDG',
                    '✅ Remis en main propre'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTrackingLocation(preset)}
                      style={{
                        background: 'rgba(0,0,0,0.04)',
                        border: '1px solid var(--adm-card-border)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: 'var(--adm-text-m)',
                        fontWeight: 600
                      }}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* 3. Live Customer Status Text */}
              <div>
                <label style={{ fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--adm-text-m)', display: 'block', marginBottom: '8px' }}>
                  3. Message / Statut en Direct (Affiché en haut du suivi client)
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={trackingStatusText}
                  onChange={(e) => setTrackingStatusText(e.target.value)}
                  placeholder="ex: Le coursier est en route vers votre adresse de livraison..."
                  style={{ width: '100%', borderRadius: '12px', padding: '12px 16px', fontSize: '13px', fontWeight: 600 }}
                />
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                  {[
                    '📦 Colis vérifié et scellé en entrepôt',
                    '🛵 Coursier en route vers votre domicile',
                    '🚚 Chauffeur en transit vers votre ville',
                    '✨ Colis réceptionné avec succès'
                  ].map((txt, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setTrackingStatusText(txt)}
                      style={{
                        background: 'rgba(0,0,0,0.04)',
                        border: '1px solid var(--adm-card-border)',
                        padding: '4px 10px',
                        borderRadius: '20px',
                        fontSize: '11px',
                        cursor: 'pointer',
                        color: 'var(--adm-text-m)',
                        fontWeight: 600
                      }}
                    >
                      {txt}
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Courier & Tracking Details */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-m)', display: 'block', marginBottom: '6px' }}>
                    Nom du Coursier / Transporteur
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={carrierName}
                    onChange={(e) => setCarrierName(e.target.value)}
                    placeholder="ex: Rodrigue (Coursier Aymard Store)"
                    style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-m)', display: 'block', marginBottom: '6px' }}>
                    Téléphone / WhatsApp Coursier
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={carrierPhone}
                    onChange={(e) => setCarrierPhone(e.target.value)}
                    placeholder="ex: +229 01 97 36 29 06"
                    style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-m)', display: 'block', marginBottom: '6px' }}>
                    Numéro de Suivi Colis
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="ex: BJ-EXP-88942"
                    style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-m)', display: 'block', marginBottom: '6px' }}>
                    Estimation Date / Heure Livraison
                  </label>
                  <input
                    type="text"
                    className="admin-input"
                    value={estimatedDeliveryDate}
                    onChange={(e) => setEstimatedDeliveryDate(e.target.value)}
                    placeholder="ex: Aujourd'hui avant 18h00"
                    style={{ width: '100%', borderRadius: '12px', padding: '10px 14px', fontSize: '12.5px' }}
                  />
                </div>
              </div>

              {/* 5. Add Custom Checkpoint Event */}
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid var(--adm-card-border)' }}>
                <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--adm-text-h)', display: 'block', marginBottom: '10px' }}>
                  ➕ Ajouter un point de passage / jalon horodaté à l&apos;historique
                </span>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="admin-input"
                    value={newCheckpointTitle}
                    onChange={(e) => setNewCheckpointTitle(e.target.value)}
                    placeholder="Événement (ex: Passage carrefour Akpakpa)"
                    style={{ borderRadius: '10px', padding: '8px 12px', fontSize: '12px' }}
                  />
                  <input
                    type="text"
                    className="admin-input"
                    value={newCheckpointLocation}
                    onChange={(e) => setNewCheckpointLocation(e.target.value)}
                    placeholder="Lieu (ex: Cotonou)"
                    style={{ borderRadius: '10px', padding: '8px 12px', fontSize: '12px' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newCheckpointTitle.trim()) return;
                      const nowStr = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
                      store.addTrackingCheckpoint(trackingOrder.id, {
                        title: newCheckpointTitle.trim(),
                        location: newCheckpointLocation.trim() || trackingLocation || 'En transit',
                        timestamp: nowStr,
                        description: 'Point de contrôle validé par le centre logistique Aymard Store.',
                        status: 'COMPLETED'
                      });
                      setNewCheckpointTitle('');
                      setNewCheckpointLocation('');
                      showToast('Jalon horodaté ajouté à l\'historique !');
                    }}
                    className="admin-btn admin-btn-primary admin-btn-sm"
                    style={{ borderRadius: '10px', padding: '8px 14px', whiteSpace: 'nowrap', fontWeight: 700 }}
                  >
                    + Ajouter
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 28px',
              borderTop: '1px solid var(--adm-card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'rgba(0,0,0,0.02)'
            }}>
              <button
                type="button"
                onClick={() => setTrackingOrder(null)}
                className="admin-btn admin-btn-outline"
                style={{ borderRadius: '12px', padding: '10px 20px', fontWeight: 700 }}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  const newStatus: 'PENDING' | 'SHIPPED' | 'DELIVERED' = trackingStep === 4 ? 'DELIVERED' : trackingStep >= 3 ? 'SHIPPED' : 'PENDING';
                  store.updateOrderTracking(trackingOrder.id, {
                    trackingStep,
                    currentLocation: trackingLocation,
                    trackingStatusText,
                    carrierName,
                    carrierPhone,
                    trackingNumber,
                    estimatedDeliveryDate,
                    status: newStatus
                  });
                  store.updateOrderStatus(trackingOrder.id, newStatus);
                  setTrackingOrder(null);
                  showToast(`🚀 Suivi en direct synchronisé avec succès pour la commande ${trackingOrder.orderNumber} !`);
                }}
                className="admin-btn admin-btn-primary"
                style={{
                  borderRadius: '12px',
                  padding: '10px 24px',
                  fontWeight: 800,
                  background: '#0284c7',
                  color: '#ffffff',
                  boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)'
                }}
              >
                💾 Enregistrer & Afficher chez le Client
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ACCORDER UN PRIVILÈGE OU CADEAU VIP */}
      {/* ========================================================================= */}
      {grantPerkClient && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.70)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setGrantPerkClient(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              backgroundColor: 'var(--adm-card-bg)',
              borderRadius: '24px',
              border: '1px solid var(--adm-card-border)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalZoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '20px 26px',
              borderBottom: '1px solid var(--adm-card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #09090b, #18181b)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>🎁</span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#ffffff' }}>
                    Accorder un Cadeau ou Privilège
                  </h3>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0 0' }}>
                    Destinataire : <strong style={{ color: '#38bdf8' }}>{grantPerkClient.name}</strong> ({grantPerkClient.email})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGrantPerkClient(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '75vh', overflowY: 'auto' }}>
              
              {/* Presets in 1 click */}
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--adm-text-m)', marginBottom: 8 }}>
                  Modèles de privilèges rapides (1 Clic)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {[
                    { icon: '🎁', title: 'Paire de Chaussettes Aymard Offerte', desc: 'À réclamer lors de votre prochaine livraison ou en boutique.' },
                    { icon: '🚚', title: 'Livraison Express Prioritaire Gratuite', desc: 'Vos commandes sont expédiées en priorité absolue sans frais.' },
                    { icon: '🔥', title: 'Accès Privé Drop Sneakers Rares', desc: 'Accès exclusif aux sorties limitées 24h avant le public.' },
                    { icon: '💳', title: 'Bon d\'Achat Cadeau 10 000 FCFA', desc: 'Valable sur l\'ensemble du catalogue sans minimum d\'achat.' },
                    { icon: '💳', title: 'Bon d\'Achat Cadeau 25 000 FCFA', desc: 'Offre spéciale VIP déductible immédiatement.' },
                    { icon: '💎', title: 'Pack Goodies VIP + Carte Black Edition', desc: 'Remis en main propre avec votre prochaine acquisition.' }
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setCustomPerkTitle(p.title);
                        setCustomPerkDesc(p.desc);
                        setCustomPerkIcon(p.icon);
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '10px',
                        border: customPerkTitle === p.title ? '1.5px solid #8b5cf6' : '1px solid var(--adm-card-border)',
                        background: customPerkTitle === p.title ? 'rgba(139,92,246,0.12)' : 'var(--adm-card-bg)',
                        color: customPerkTitle === p.title ? '#8b5cf6' : 'var(--adm-text-h)',
                        fontSize: 11.5,
                        fontWeight: 700,
                        cursor: 'pointer'
                      }}
                    >
                      {p.icon} {p.title}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 6 }}>
                  Intitulé du Privilège / Cadeau
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={customPerkTitle}
                  onChange={(e) => setCustomPerkTitle(e.target.value)}
                  placeholder="ex: Paire de Chaussettes Aymard Offerte"
                  style={{ width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 6 }}>
                  Détails &amp; Conditions d&apos;utilisation
                </label>
                <textarea
                  className="admin-input"
                  value={customPerkDesc}
                  onChange={(e) => setCustomPerkDesc(e.target.value)}
                  rows={3}
                  placeholder="ex: Présentez ce bon lors de votre prochaine livraison pour recevoir votre cadeau."
                  style={{ width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 13, resize: 'vertical' }}
                />
              </div>

            </div>

            <div style={{ padding: '16px 26px', borderTop: '1px solid var(--adm-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setGrantPerkClient(null)}
                className="admin-btn admin-btn-outline"
                style={{ borderRadius: 10, padding: '10px 18px', fontWeight: 700 }}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!customPerkTitle.trim()) return;
                  store.grantClientPerk(grantPerkClient.id, {
                    title: customPerkTitle.trim(),
                    description: customPerkDesc.trim(),
                    icon: customPerkIcon
                  });
                  setGrantPerkClient(null);
                  showToast(`🎁 Privilège "${customPerkTitle}" accordé à ${grantPerkClient.name} !`);
                }}
                className="admin-btn admin-btn-primary"
                style={{ borderRadius: 10, padding: '10px 22px', fontWeight: 800, background: '#8b5cf6' }}
              >
                ✓ Accorder &amp; Notifier le Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: CRÉDITER DES POINTS FIDÉLITÉ VIP */}
      {/* ========================================================================= */}
      {grantBonusPointsClient && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(0, 0, 0, 0.70)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setGrantBonusPointsClient(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '500px',
              backgroundColor: 'var(--adm-card-bg)',
              borderRadius: '24px',
              border: '1px solid var(--adm-card-border)',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalZoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{
              padding: '20px 26px',
              borderBottom: '1px solid var(--adm-card-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #09090b, #18181b)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 22 }}>★</span>
                <div>
                  <h3 style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#facc15' }}>
                    Créditer des Points Fidélité VIP
                  </h3>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0 0' }}>
                    Client : <strong style={{ color: '#ffffff' }}>{grantBonusPointsClient.name}</strong>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setGrantBonusPointsClient(null)}
                style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', fontWeight: 800 }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '22px 26px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              
              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', color: 'var(--adm-text-m)', marginBottom: 8 }}>
                  Montants Rapides
                </label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[50, 100, 200, 500, 1000].map((pts) => (
                    <button
                      key={pts}
                      type="button"
                      onClick={() => setBonusPointsInput(pts)}
                      style={{
                        padding: '8px 14px',
                        borderRadius: '10px',
                        border: bonusPointsInput === pts ? '1.5px solid #facc15' : '1px solid var(--adm-card-border)',
                        background: bonusPointsInput === pts ? 'rgba(250,204,21,0.15)' : 'var(--adm-card-bg)',
                        color: bonusPointsInput === pts ? '#d97706' : 'var(--adm-text-h)',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      +{pts} Pts
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 6 }}>
                  Nombre de Points à Créditer
                </label>
                <input
                  type="number"
                  min={1}
                  className="admin-input"
                  value={bonusPointsInput}
                  onChange={(e) => setBonusPointsInput(parseInt(e.target.value, 10) || 0)}
                  style={{ width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 14, fontWeight: 800 }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 800, color: 'var(--adm-text-h)', marginBottom: 6 }}>
                  Motif / Message adressé au client
                </label>
                <input
                  type="text"
                  className="admin-input"
                  value={bonusPointsReason}
                  onChange={(e) => setBonusPointsReason(e.target.value)}
                  placeholder="ex: Récompense fidélité spéciale, Anniversaire, Geste commercial..."
                  style={{ width: '100%', borderRadius: 10, padding: '10px 14px', fontSize: 13 }}
                />
              </div>

            </div>

            <div style={{ padding: '16px 26px', borderTop: '1px solid var(--adm-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setGrantBonusPointsClient(null)}
                className="admin-btn admin-btn-outline"
                style={{ borderRadius: 10, padding: '10px 18px', fontWeight: 700 }}
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={() => {
                  if (bonusPointsInput <= 0) return;
                  store.grantClientBonusPoints(grantBonusPointsClient.id, bonusPointsInput, bonusPointsReason);
                  setGrantBonusPointsClient(null);
                  showToast(`★ +${bonusPointsInput} points crédités à ${grantBonusPointsClient.name} !`);
                }}
                className="admin-btn admin-btn-primary"
                style={{ borderRadius: 10, padding: '10px 22px', fontWeight: 800, background: '#f59e0b' }}
              >
                ✓ Créditer les Points
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 💎 MODAL: AUDIT DÉTAILLÉ DES POINTS & PARRAINAGE CLIENT */}
      {/* ========================================================================= */}
      {auditClient && (() => {
        const clientEmail = (auditClient.email || '').toLowerCase();
        const clientRefCode = auditClient.referralCode || generateReferralCode(auditClient.email, auditClient.name);
        const clientTxList = (store.pointTransactions || []).filter(tx => tx.userEmail.toLowerCase() === clientEmail);
        const orderPts = calculatePointsEarned(auditClient.totalSpent, store.currency);
        const totalPtsEarned = orderPts + (auditClient.bonusPoints || 0) + (auditClient.referralPointsEarned || 0);
        const spentPts = auditClient.spentLoyaltyPoints || 0;
        const activePoints = Math.max(0, totalPtsEarned - spentPts);
        const clientReferrals = (store.clients || []).filter(c => c.referredBy === clientRefCode);

        return (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.8)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={() => setAuditClient(null)}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '850px',
                maxHeight: '90vh',
                backgroundColor: 'var(--adm-card-bg)',
                borderRadius: '24px',
                border: '1.5px solid var(--adm-card-border)',
                boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animation: 'modalZoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '22px 28px',
                borderBottom: '1px solid var(--adm-card-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, #09090b, #1e1e24)',
                color: '#ffffff'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #f59e0b, #d97706)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                    💎
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ fontSize: 18, fontWeight: 900, margin: 0, color: '#facc15' }}>
                        Audit des Points &amp; Score Fidélité
                      </h3>
                      <span style={{ fontSize: 10, fontWeight: 900, background: '#10b981', color: '#ffffff', padding: '2px 8px', borderRadius: 8 }}>
                        1€/1000F = 1PT
                      </span>
                    </div>
                    <p style={{ fontSize: 12.5, color: '#94a3b8', margin: '3px 0 0 0' }}>
                      Client : <strong style={{ color: '#ffffff' }}>{auditClient.name}</strong> ({auditClient.email})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setAuditClient(null)}
                  style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 34, height: 34, cursor: 'pointer', fontWeight: 800 }}
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
                
                {/* 3 Metric Cards for this client */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
                  <div style={{ background: 'var(--adm-card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--adm-card-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--adm-text-m)', fontWeight: 800, textTransform: 'uppercase' }}>Points Disponibles</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: '#f59e0b', marginTop: 4 }}>{activePoints} Pts</div>
                    <span style={{ fontSize: 11, color: '#10b981', fontWeight: 700 }}>Actuellement utilisables</span>
                  </div>

                  <div style={{ background: 'var(--adm-card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--adm-card-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--adm-text-m)', fontWeight: 800, textTransform: 'uppercase' }}>Total Acquis à Vie</div>
                    <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--adm-text-h)', marginTop: 4 }}>{totalPtsEarned} Pts</div>
                    <span style={{ fontSize: 11, color: 'var(--adm-text-m)' }}>Achats + Bonus + Parrainage</span>
                  </div>

                  <div style={{ background: 'var(--adm-card-bg)', padding: '16px', borderRadius: '16px', border: '1px solid var(--adm-card-border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--adm-text-m)', fontWeight: 800, textTransform: 'uppercase' }}>Code d&apos;Affiliation</div>
                    <div style={{ fontSize: 18, fontWeight: 900, color: '#0284c7', marginTop: 4, fontFamily: 'monospace' }}>{clientRefCode}</div>
                    <span style={{ fontSize: 11, color: '#0284c7', fontWeight: 700 }}>👥 {clientReferrals.length} filleul(s) enregistrés</span>
                  </div>
                </div>

                {/* Parrainage details banner */}
                <div style={{ background: 'rgba(2, 132, 199, 0.08)', border: '1px solid rgba(2, 132, 199, 0.25)', borderRadius: '16px', padding: '14px 18px', fontSize: '12.5px', color: 'var(--adm-text-h)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div>
                    <strong>🔗 Lien d&apos;affiliation :</strong> <code style={{ color: '#0284c7', background: 'rgba(2,132,199,0.12)', padding: '2px 6px', borderRadius: 6 }}>https://aymardstore.com/?ref={clientRefCode}</code>
                  </div>
                  <div>
                    <strong>Parrain :</strong> {auditClient.referredBy ? <span style={{ color: '#10b981', fontWeight: 800 }}>{auditClient.referredBy}</span> : <span style={{ color: 'var(--adm-text-m)' }}>Aucun (Direct)</span>}
                  </div>
                </div>

                {/* Ledger Table */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                    <h4 style={{ fontSize: 14, fontWeight: 800, color: 'var(--adm-text-h)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      📜 Justification Détaillée des Points
                    </h4>
                    <span style={{ fontSize: 11, color: 'var(--adm-text-m)' }}>
                      Règle : 1€ = 1 PT · 1 000 FCFA = 1 PT
                    </span>
                  </div>

                  <div style={{ border: '1px solid var(--adm-card-border)', borderRadius: '16px', overflow: 'hidden' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                      <thead>
                        <tr style={{ background: 'var(--adm-table-stripe)', borderBottom: '1px solid var(--adm-card-border)', textAlign: 'left' }}>
                          <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Date</th>
                          <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Origine / Type</th>
                          <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800 }}>Détails / Justificatif</th>
                          <th style={{ padding: '10px 14px', color: 'var(--adm-text-m)', fontWeight: 800, textAlign: 'right' }}>Impact Points</th>
                        </tr>
                      </thead>
                      <tbody>
                        {/* If specific transactions exist in store */}
                        {clientTxList.length > 0 ? (
                          clientTxList.map(tx => (
                            <tr key={tx.id} style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                              <td style={{ padding: '12px 14px', color: 'var(--adm-text-m)', whiteSpace: 'nowrap' }}>{tx.date}</td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{
                                  fontSize: 10,
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: 6,
                                  background: tx.type === 'REFERRAL_PURCHASE' ? 'rgba(16,185,129,0.15)' : tx.type === 'REFERRAL_SIGNUP' ? 'rgba(59,130,246,0.15)' : tx.type === 'CONVERSION_PROMO' ? 'rgba(239,68,68,0.15)' : tx.type === 'ADMIN_GRANT' ? 'rgba(139,92,246,0.15)' : 'rgba(245,158,11,0.15)',
                                  color: tx.type === 'REFERRAL_PURCHASE' ? '#10b981' : tx.type === 'REFERRAL_SIGNUP' ? '#3b82f6' : tx.type === 'CONVERSION_PROMO' ? '#ef4444' : tx.type === 'ADMIN_GRANT' ? '#8b5cf6' : '#d97706'
                                }}>
                                  {tx.type === 'REFERRAL_PURCHASE' ? 'COMMISSION FILLEUL 10%' : tx.type === 'REFERRAL_SIGNUP' ? 'INSCRIPTION FILLEUL' : tx.type === 'CONVERSION_PROMO' ? 'COUPON D\'ACHAT' : tx.type === 'ADMIN_GRANT' ? 'ATTRIBUTION ADMIN' : 'ACHAT PERSONNEL'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--adm-text-h)', fontWeight: 600 }}>{tx.description}</td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: tx.amount > 0 ? '#10b981' : '#ef4444' }}>
                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Pts
                              </td>
                            </tr>
                          ))
                        ) : (
                          <>
                            <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                              <td style={{ padding: '12px 14px', color: 'var(--adm-text-m)' }}>{auditClient.registeredDate || 'Initial'}</td>
                              <td style={{ padding: '12px 14px' }}>
                                <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(245,158,11,0.15)', color: '#d97706' }}>
                                  ACHATS CUMULÉS
                                </span>
                              </td>
                              <td style={{ padding: '12px 14px', color: 'var(--adm-text-h)', fontWeight: 600 }}>
                                {auditClient.totalOrders} commande(s) validée(s) pour un montant total de {formatPrice(convertPrice(auditClient.totalSpent, store.currency), store.currency)}
                              </td>
                              <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>
                                +{orderPts} Pts
                              </td>
                            </tr>
                            {auditClient.bonusPoints ? (
                              <tr style={{ borderBottom: '1px solid var(--adm-card-border)' }}>
                                <td style={{ padding: '12px 14px', color: 'var(--adm-text-m)' }}>Historique</td>
                                <td style={{ padding: '12px 14px' }}>
                                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.15)', color: '#8b5cf6' }}>
                                    BONUS ADMIN VIP
                                  </span>
                                </td>
                                <td style={{ padding: '12px 14px', color: 'var(--adm-text-h)', fontWeight: 600 }}>
                                  Attribution de points bonus VIP accordés par la direction
                                </td>
                                <td style={{ padding: '12px 14px', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>
                                  +{auditClient.bonusPoints} Pts
                                </td>
                              </tr>
                            ) : null}
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{ padding: '16px 28px', borderTop: '1px solid var(--adm-card-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  onClick={() => setAuditClient(null)}
                  className="admin-btn admin-btn-outline"
                  style={{ borderRadius: 10, padding: '10px 18px', fontWeight: 700 }}
                >
                  Fermer
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const targetClient = auditClient;
                    setAuditClient(null);
                    setGrantBonusPointsClient(targetClient);
                    setBonusPointsInput(100);
                    setBonusPointsReason('');
                  }}
                  className="admin-btn admin-btn-primary"
                  style={{ borderRadius: 10, padding: '10px 20px', fontWeight: 800, background: '#10b981' }}
                >
                  ★ Créditer des Points à ce Client
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ========================================================================= */}
      {/* 🟢 MODAL: VISITEURS EN DIRECT & GÉOLOCALISATION */}
      {/* ========================================================================= */}
      {showLiveVisitorsModal && (() => {
        const report = liveVisitorsReport || getLiveVisitorsDetails();
        return (
          <div
            role="dialog"
            aria-modal="true"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 999998,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '20px',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              animation: 'fadeIn 0.2s ease-out'
            }}
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowLiveVisitorsModal(false);
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: '920px',
                maxHeight: '92vh',
                backgroundColor: 'var(--adm-card-bg)',
                borderRadius: '26px',
                border: '1.5px solid var(--adm-card-border)',
                boxShadow: '0 25px 70px -15px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.15)',
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{
                padding: '22px 28px',
                borderBottom: '1px solid var(--adm-card-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08) 0%, rgba(2, 132, 199, 0.04) 100%)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    boxShadow: '0 0 16px rgba(16, 185, 129, 0.25)'
                  }}>
                    🟢
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '18px', fontWeight: 900, color: 'var(--adm-text-h)', margin: 0, fontFamily: 'var(--font-plus-jakarta)' }}>
                        Visiteurs en Direct &amp; Localisations Géographiques
                      </h3>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        padding: '2px 8px',
                        borderRadius: '12px',
                        background: '#10b981',
                        color: '#ffffff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.35)'
                      }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ffffff', animation: 'livePulseDot 1.5s infinite' }} />
                        En direct
                      </span>
                    </div>
                    <p style={{ fontSize: '12.5px', color: 'var(--adm-text-m)', margin: '2px 0 0 0' }}>
                      Surveillance en temps réel des visiteurs connectés sur votre boutique Aymard Store.
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => {
                      refreshLiveVisitors();
                      showToast('Données géographiques et sessions actualisées !');
                    }}
                    className="admin-btn admin-btn-outline admin-btn-sm"
                    style={{ borderRadius: '20px', padding: '8px 14px', fontSize: '12px', fontWeight: 700 }}
                    title="Actualiser les visiteurs"
                  >
                    <span>🔄 Actualiser</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowLiveVisitorsModal(false)}
                    className="admin-btn admin-btn-outline"
                    style={{ borderRadius: '50%', width: '36px', height: '36px', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    title="Fermer la fenêtre"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Body Scrollable */}
              <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '22px' }}>
                
                {/* Top 4 Real-time KPI Cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '12px' }}>
                  
                  {/* Card 1: Total Live */}
                  <div style={{
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: '18px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#059669' }}>
                      VISITEURS ACTIFS EN LIGNE
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)' }}>
                        {report.totalCount}
                      </span>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 12px #10b981', animation: 'livePulseDot 1.5s infinite' }} />
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                      Activité détectée (dernières 3 min)
                    </span>
                  </div>

                  {/* Card 2: Countries */}
                  <div style={{
                    background: 'var(--adm-card-bg)',
                    border: '1px solid var(--adm-card-border)',
                    borderRadius: '18px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#0284c7' }}>
                      PAYS CONNECTÉS
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '28px', fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)' }}>
                        {report.byCountry.length}
                      </span>
                      <span style={{ fontSize: '18px' }}>
                        {report.byCountry.slice(0, 3).map(c => c.flag).join(' ')}
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                      {report.byCountry.map(c => c.country).join(', ')}
                    </span>
                  </div>

                  {/* Card 3: Top Device */}
                  <div style={{
                    background: 'var(--adm-card-bg)',
                    border: '1px solid var(--adm-card-border)',
                    borderRadius: '18px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#8b5cf6' }}>
                      APPAREIL PRINCIPAL
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '22px', fontWeight: 900, color: 'var(--adm-text-h)', fontFamily: 'var(--font-plus-jakarta)' }}>
                        {report.byDevice[0]?.device || 'Mobile 📱'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                      {report.byDevice[0]?.percentage || 100}% du trafic en direct
                    </span>
                  </div>

                  {/* Card 4: Top Active Page */}
                  <div style={{
                    background: 'var(--adm-card-bg)',
                    border: '1px solid var(--adm-card-border)',
                    borderRadius: '18px',
                    padding: '16px 20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#f59e0b' }}>
                      PAGE LA PLUS CONSULTÉE
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--adm-text-h)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={report.byPage[0]?.path || '/'}>
                        {report.byPage[0]?.path === '/' ? 'Accueil' : report.byPage[0]?.path || '/'}
                      </span>
                    </div>
                    <span style={{ fontSize: '11.5px', color: 'var(--adm-text-m)' }}>
                      {report.byPage[0]?.count || 1} visiteur{report.byPage[0]?.count > 1 ? 's' : ''} sur cette page
                    </span>
                  </div>

                </div>

                {/* Section 1: Répartition Géographique (Cartes par Pays) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>🗺️</span>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                        Répartition Géographique &amp; Villes Détectées
                      </h4>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                      Basé sur la géolocalisation IP &amp; Fuseaux Horaires
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
                    {report.byCountry.map((c, idx) => (
                      <div
                        key={c.country}
                        style={{
                          padding: '16px 20px',
                          borderRadius: '18px',
                          background: idx === 0 ? 'rgba(16, 185, 129, 0.05)' : 'rgba(0, 0, 0, 0.02)',
                          border: idx === 0 ? '1.5px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--adm-card-border)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '10px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ fontSize: '28px' }}>{c.flag}</span>
                            <div>
                              <strong style={{ fontSize: '14px', color: 'var(--adm-text-h)', display: 'block' }}>
                                {c.country}
                              </strong>
                              <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                                {c.cities.length > 0 ? `📍 ${c.cities.join(', ')}` : 'Région détectée'}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <strong style={{ fontSize: '18px', fontWeight: 900, color: '#10b981', display: 'block' }}>
                              {c.count}
                            </strong>
                            <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                              {c.percentage}%
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '6px', background: 'rgba(0,0,0,0.08)', borderRadius: '10px', overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${c.percentage}%`,
                              height: '100%',
                              background: idx === 0 ? 'linear-gradient(90deg, #10b981, #059669)' : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                              borderRadius: '10px',
                              transition: 'width 0.4s ease'
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Active Visitors Session Feed */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '18px' }}>⚡</span>
                      <h4 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--adm-text-h)', margin: 0 }}>
                        Sessions Actives en Direct ({report.visitors.length})
                      </h4>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                      Mis à jour automatiquement
                    </span>
                  </div>

                  <div style={{
                    borderRadius: '18px',
                    border: '1px solid var(--adm-card-border)',
                    overflow: 'hidden',
                    background: 'var(--adm-card-bg)'
                  }}>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1.2fr 1.5fr 1.5fr 1.2fr 1fr',
                      padding: '12px 18px',
                      background: 'rgba(0, 0, 0, 0.03)',
                      borderBottom: '1px solid var(--adm-card-border)',
                      fontSize: '11px',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.6px',
                      color: 'var(--adm-text-m)'
                    }}>
                      <span>Session</span>
                      <span>Localisation</span>
                      <span>Page &amp; Action</span>
                      <span>Appareil</span>
                      <span style={{ textAlign: 'right' }}>Statut</span>
                    </div>

                    <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
                      {report.visitors.map((v, i) => {
                        const elapsedSec = Math.max(1, Math.floor((Date.now() - v.lastSeen) / 1000));
                        return (
                          <div
                            key={v.sessionId + '_' + i}
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1.2fr 1.5fr 1.5fr 1.2fr 1fr',
                              padding: '12px 18px',
                              borderBottom: i < report.visitors.length - 1 ? '1px solid var(--adm-card-border)' : 'none',
                              alignItems: 'center',
                              fontSize: '12.5px',
                              transition: 'background 0.15s ease'
                            }}
                          >
                            {/* Session */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', display: 'inline-block', boxShadow: '0 0 8px #10b981' }} />
                              <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--adm-text-h)', fontSize: '11.5px' }}>
                                #{v.sessionId.slice(-6)}
                              </span>
                            </div>

                            {/* Location */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <span style={{ fontSize: '18px' }}>{v.flag}</span>
                              <div>
                                <strong style={{ display: 'block', fontSize: '12px', color: 'var(--adm-text-h)' }}>
                                  {v.country}
                                </strong>
                                <span style={{ fontSize: '11px', color: 'var(--adm-text-m)' }}>
                                  {v.city}
                                </span>
                              </div>
                            </div>

                            {/* Page & Action */}
                            <div>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                color: '#0284c7',
                                background: 'rgba(2, 132, 199, 0.08)',
                                padding: '2px 8px',
                                borderRadius: '8px',
                                display: 'inline-block',
                                maxWidth: '160px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap'
                              }}>
                                {v.currentPath}
                              </span>
                              <span style={{ display: 'block', fontSize: '11px', color: 'var(--adm-text-m)', marginTop: '2px' }}>
                                {v.lastAction}
                              </span>
                            </div>

                            {/* Device */}
                            <div>
                              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--adm-text-h)', display: 'block' }}>
                                {v.device}
                              </span>
                              <span style={{ fontSize: '10.5px', color: 'var(--adm-text-m)' }}>
                                {v.browser}
                              </span>
                            </div>

                            {/* Status */}
                            <div style={{ textAlign: 'right' }}>
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 800,
                                color: '#059669',
                                background: 'rgba(16, 185, 129, 0.1)',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                {elapsedSec < 30 ? '🟢 En direct' : `Il y a ${elapsedSec}s`}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

              </div>

              {/* Modal Footer */}
              <div style={{
                padding: '16px 28px',
                borderTop: '1px solid var(--adm-card-border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: 'rgba(0, 0, 0, 0.02)'
              }}>
                <span style={{ fontSize: '12px', color: 'var(--adm-text-m)' }}>
                  🟢 Système de tracking en direct Aymard Store · Précision temps réel
                </span>
                <button
                  type="button"
                  onClick={() => setShowLiveVisitorsModal(false)}
                  className="admin-btn admin-btn-primary"
                  style={{ borderRadius: '20px', padding: '10px 24px', fontSize: '13px', fontWeight: 800 }}
                >
                  Fermer la fenêtre
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Enhanced Toast Notification */}
      {toast && (
        <div 
          className={`admin-toast ${toast.type}`}
          style={{
            position: 'fixed',
            bottom: '28px',
            right: '28px',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '14px 22px',
            borderRadius: '18px',
            background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.95)' : toast.type === 'warning' ? 'rgba(245, 158, 11, 0.95)' : toast.type === 'info' ? 'rgba(2, 132, 199, 0.95)' : 'rgba(16, 185, 129, 0.95)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '13.5px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
            backdropFilter: 'blur(10px)',
            animation: 'chatTeaserSlideIn 0.25s ease forwards'
          }}
        >
          <span style={{ fontSize: '18px' }}>
            {toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : toast.type === 'warning' ? '⚠️' : 'ℹ️'}
          </span>
          <span>{toast.msg}</span>
        </div>
      )}
    </div>
  );
}


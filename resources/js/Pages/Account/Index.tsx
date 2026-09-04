'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useRouter, useSearchParams } from '@/lib/compat-navigation';
import { useAppStore, convertPrice, formatPrice, Address, Order, filterCities, calculatePointsEarned, generateReferralCode, PointTransaction, ProductReview } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import Link from '@/lib/compat-link';
import AppLayout from '@/Layouts/AppLayout';

// Official Aymard Store Contacts
const OFFICIAL_EMAIL = 'judesinaberogui@gmail.com';
const OFFICIAL_WHATSAPP_NUMBER = '+229 01 97 36 29 06';

function CustomerAccountPortal() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') || 'orders';

  const { 
    language, 
    currency, 
    user, 
    orders, 
    favorites, 
    products, 
    cart, 
    addToCart, 
    updateCartQuantity, 
    removeFromCart, 
    logout, 
    updateUserProfile, 
    addSavedAddress, 
    deleteSavedAddress, 
    promoCodes,
    addPromoCode,
    spentLoyaltyPoints,
    setSpentLoyaltyPoints,
    pointTransactions,
    addPointTransaction,
    convertPointsToCoupon,
    clients,
    grantClientBonusPoints,
    notifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    reviews,
    addProductReview,
    updateProductReview,
    deleteProductReview,
    subscribeToMarketing,
    unsubscribeMarketing,
    marketingSubscribers,
    _hasHydrated
  } = useAppStore();
  
  const { t } = useTranslation(language);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Instant session restoration from localStorage if state was delayed
    if (typeof window !== 'undefined' && !user) {
      try {
        const raw = localStorage.getItem('aymard_user_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.email) {
            useAppStore.setState({ user: parsed });
          }
        }
      } catch {}
    }
  }, [user]);

  // Redirect to login only after store hydration is confirmed and user is truly absent
  useEffect(() => {
    if (!mounted) return;
    
    // Check localStorage before taking any action
    let hasLocalSession = false;
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('aymard_user_session');
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed && parsed.email) hasLocalSession = true;
        }
      } catch {}
    }

    if (_hasHydrated && !user && !hasLocalSession) {
      router.push('/auth/login?redirect=/account');
    }
  }, [_hasHydrated, user, mounted, router]);

  // Real Authenticated User Profile
  const activeUser = useMemo(() => {
    return user || {
      name: '',
      email: '',
      role: 'CUSTOMER' as const,
      phone: '',
      savedAddresses: [],
      bonusPoints: 0,
      spentLoyaltyPoints: spentLoyaltyPoints || 0,
    };
  }, [user, spentLoyaltyPoints]);

  // User Notifications strictly filtered by user email
  const userNotifications = useMemo(() => {
    if (!user?.email) return [];
    return (notifications || []).filter(n => 
      !n.targetEmail || 
      n.targetEmail === 'all' || 
      n.targetEmail.toLowerCase() === user.email.toLowerCase()
    );
  }, [notifications, user?.email]);

  const unreadNotifsCount = useMemo(() => {
    return userNotifications.filter(n => !n.read).length;
  }, [userNotifications]);

  // Reviews by current user
  const userReviews = useMemo(() => {
    if (!user || !user.email) return [];
    return (reviews || []).filter(r => r.customerEmail && r.customerEmail.toLowerCase() === user.email.toLowerCase());
  }, [reviews, user]);

  // Tab State: 'orders' | 'cart' | 'wishlist' | 'addresses' | 'coupons' | 'affiliation' | 'notifications' | 'reviews' | 'profile'
  const [activeTab, setActiveTab] = useState<'orders' | 'cart' | 'wishlist' | 'addresses' | 'coupons' | 'affiliation' | 'notifications' | 'reviews' | 'profile'>(
    (initialTab as any) === 'affiliation' || (initialTab as any) === 'parrainage' ? 'affiliation' : (initialTab as any) === 'notifications' ? 'notifications' : (initialTab as any) === 'reviews' || (initialTab as any) === 'avis' ? 'reviews' : (initialTab as any) === 'lounge' || (initialTab as any) === 'overview' ? 'orders' : (initialTab as any) || 'orders'
  );

  // Toast Notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Review Modal State
  const [reviewModalItem, setReviewModalItem] = useState<{
    product: any;
    order: Order;
    existingReview?: ProductReview;
  } | null>(null);
  const [reviewRating, setReviewRating] = useState<number>(5);
  const [reviewHoverRating, setReviewHoverRating] = useState<number>(0);
  const [reviewTitle, setReviewTitle] = useState<string>('');
  const [reviewComment, setReviewComment] = useState<string>('');
  const [reviewPhoto, setReviewPhoto] = useState<string>('');

  const openReviewModal = (product: any, order: Order, existingReview?: ProductReview) => {
    setReviewModalItem({ product, order, existingReview });
    if (existingReview) {
      setReviewRating(existingReview.rating);
      setReviewTitle(existingReview.title);
      setReviewComment(existingReview.comment);
      setReviewPhoto(existingReview.photo || '');
    } else {
      setReviewRating(5);
      setReviewTitle('');
      setReviewComment('');
      setReviewPhoto('');
    }
  };

  const closeReviewModal = () => {
    setReviewModalItem(null);
  };

  const handleReviewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setReviewPhoto(result);
        showToast('Photo attachée avec succès !');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewModalItem || !user) return;
    if (!reviewComment.trim()) {
      showToast('⚠️ Veuillez rédiger un bref commentaire pour partager votre expérience.');
      return;
    }

    const isEdit = Boolean(reviewModalItem.existingReview);
    if (isEdit && reviewModalItem.existingReview) {
      updateProductReview(reviewModalItem.existingReview.id, {
        rating: reviewRating,
        title: reviewTitle.trim() || 'Avis vérifié',
        comment: reviewComment.trim(),
        photo: reviewPhoto || undefined,
      });
      showToast('✓ Votre avis a été mis à jour avec succès !');
    } else {
      addProductReview({
        productId: reviewModalItem.product.id,
        productName: reviewModalItem.product.name_fr || reviewModalItem.product.name,
        productImage: reviewModalItem.product.images?.[0] || '',
        orderId: reviewModalItem.order.id,
        orderNumber: reviewModalItem.order.orderNumber,
        customerName: user.name || 'Client Aymard Store',
        customerEmail: user.email,
        rating: reviewRating,
        title: reviewTitle.trim() || 'Avis vérifié après achat',
        comment: reviewComment.trim(),
        photo: reviewPhoto || undefined,
        verifiedPurchase: true,
        status: 'APPROVED',
        likesCount: 1
      });

      // Reward +50 VIP Loyalty Points for writing an authentic review
      addPointTransaction({
        userEmail: user.email,
        userName: user.name,
        type: 'BONUS',
        amount: 50,
        description: `Bonus VIP : Avis client vérifié sur ${reviewModalItem.product.name_fr || reviewModalItem.product.name}`,
        sourceOrderId: reviewModalItem.order.id
      });

      grantClientBonusPoints(user.email, 50, `Avis vérifié déposé`);

      addNotification({
        targetEmail: user.email,
        title: '⭐ 50 Points VIP Gagnés !',
        message: `Merci pour votre avis sur ${reviewModalItem.product.name_fr || (reviewModalItem.product as any).name}. 50 points de fidélité VIP ont été crédités sur votre compte.`,
        type: 'SYSTEM'
      });

      showToast('🎉 Merci ! Votre avis a été publié et +50 Points VIP vous ont été offerts.');
    }

    closeReviewModal();
  };

  // Selected Order for Modal Preview & Printable View
  const [previewOrder, setPreviewOrder] = useState<Order | null>(null);

  // Selected Order for Live Tracking Modal
  const [trackingModalOrder, setTrackingModalOrder] = useState<Order | null>(null);

  // Loyalty Club Explanation Modal State
  const [showLoyaltyModal, setShowLoyaltyModal] = useState(false);
  const [newlyGeneratedPromo, setNewlyGeneratedPromo] = useState<{ code: string; discountAmount: number; pointsUsed: number } | null>(null);

  // Dark Mode Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Notifications Dropdown State
  const [showNotificationsDropdown, setShowNotificationsDropdown] = useState(false);

  useEffect(() => {
    if (!showNotificationsDropdown) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('#notifications-dropdown-container')) {
        setShowNotificationsDropdown(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showNotificationsDropdown]);

  // Profile Edit State
  const [profileName, setProfileName] = useState(activeUser.name);
  const [profilePhone, setProfilePhone] = useState(activeUser.phone || '');
  const [customConvertPoints, setCustomConvertPoints] = useState<string>('');
  
  // Marketing Alerts Preferences
  const existingSub = useMemo(() => {
    if (!user?.email) return null;
    return (marketingSubscribers || []).find(s => s.email && s.email.toLowerCase() === user.email.toLowerCase());
  }, [marketingSubscribers, user?.email]);

  const [profileWantWhatsapp, setProfileWantWhatsapp] = useState(
    existingSub ? existingSub.channels.includes('WHATSAPP') : true
  );
  const [profileWantEmail, setProfileWantEmail] = useState(
    existingSub ? existingSub.channels.includes('EMAIL') : true
  );

  useEffect(() => {
    if (user) {
      setProfileName(user.name);
      setProfilePhone(user.phone || '');
      if (existingSub) {
        setProfileWantWhatsapp(existingSub.channels.includes('WHATSAPP') && existingSub.active);
        setProfileWantEmail(existingSub.channels.includes('EMAIL') && existingSub.active);
      }
      if (!user.referralCode) {
        const code = generateReferralCode(user.email, user.name);
        updateUserProfile({ referralCode: code });
      }
    }
  }, [user, existingSub, updateUserProfile]);

  // Address Modal State
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [newAddrLabel, setNewAddrLabel] = useState('Domicile');
  const [newAddrFullName, setNewAddrFullName] = useState(activeUser.name);
  const [newAddrStreet, setNewAddrStreet] = useState('');
  const [newAddrCity, setNewAddrCity] = useState('');
  const [newAddrCountry, setNewAddrCountry] = useState<'benin' | 'france' | 'belgique'>('benin');
  const [newAddrPhone, setNewAddrPhone] = useState(activeUser.phone || '');
  const [newAddrDefault, setNewAddrDefault] = useState(false);
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);

  const citySuggestions = useMemo(() => {
    return filterCities(newAddrCity, newAddrCountry);
  }, [newAddrCity, newAddrCountry]);

  // Real Customer Orders strictly filtered by user email
  const customerOrders = useMemo(() => {
    if (!user || !user.email) return [];
    const targetEmail = user.email.toLowerCase();
    return orders.filter(o => {
      const email = o.customerEmail || (o as any).customer_email;
      return email && email.toLowerCase() === targetEmail;
    });
  }, [orders, user]);

  // Synchronisation avec la base relationnelle SQL serveur
  useEffect(() => {
    if (!user?.email) return;
    async function syncServerOrders() {
      try {
        const res = await fetch(`/api/orders?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.orders)) {
            const currentOrders = useAppStore.getState().orders || [];
            const mergedMap = new Map<string, Order>();
            currentOrders.forEach(o => mergedMap.set(o.id || o.orderNumber || (o as any).order_number, o));
            data.orders.forEach((o: any) => {
              const normalized: Order = {
                ...o,
                id: o.id || o.orderNumber || o.order_number,
                orderNumber: o.orderNumber || o.order_number,
                customerEmail: o.customerEmail || o.customer_email,
                customerName: o.customerName || o.customer_name,
                customerPhone: o.customerPhone || (o.shippingAddress?.phone || o.shipping_address?.phone),
                date: o.date || (o.created_at ? new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) : ''),
                discountApplied: o.discountApplied ?? o.discount_applied ?? 0,
                promoCodeUsed: o.promoCodeUsed ?? o.promo_code_used,
                paymentStatus: o.paymentStatus || o.payment_status || 'UNPAID',
                paymentMethod: o.paymentMethod || o.payment_method || 'COD',
                paymentTransactionId: o.paymentTransactionId || o.payment_transaction_id,
                trackingNumber: o.trackingNumber || o.tracking_number,
                shippingAddress: o.shippingAddress || o.shipping_address,
                carrierName: o.carrierName || o.carrier_name,
                carrierPhone: o.carrierPhone || o.carrier_phone,
                currentLocation: o.currentLocation || o.current_location,
                trackingStatusText: o.trackingStatusText || o.tracking_status_text,
                trackingStep: o.trackingStep ?? o.tracking_step ?? 1,
                estimatedDeliveryDate: o.estimatedDeliveryDate || o.estimated_delivery_date,
                trackingHistory: o.trackingHistory || o.tracking_history,
                items: o.items || [],
                total: o.total || 0,
                currency: o.currency || 'FCFA',
                status: o.status || 'PENDING',
              };
              mergedMap.set(normalized.id || normalized.orderNumber, normalized);
            });
            useAppStore.setState({ orders: Array.from(mergedMap.values()) });
          }
        }
      } catch (err) {
        console.error('Erreur synchronisation commandes SQL:', err);
      }
    }
    syncServerOrders();
  }, [user?.email]);

  const favoriteProducts = useMemo(() => {
    const favs = products.filter(p => favorites.includes(p.id));
    return favs.length > 0 ? favs : products.slice(0, 4);
  }, [products, favorites]);

  const totalSpent = useMemo(() => {
    return customerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [customerOrders]);

  // STRICT UNIVERSAL POINTS RULE: 1 € = 1 PT · 1 000 FCFA = 1 PT
  // Purchases made with a promo code or discount DO NOT earn loyalty points
  const loyaltyEligibleOrders = useMemo(() => {
    return customerOrders.filter(o => !o.promoCodeUsed && (!o.discountApplied || o.discountApplied <= 0));
  }, [customerOrders]);

  const loyaltyEligibleSpent = useMemo(() => {
    return loyaltyEligibleOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  }, [loyaltyEligibleOrders]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  }, [cart]);

  const totalCartCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  // VIP Criteria: 100 validated orders or admin override
  const isVipMember = customerOrders.length >= 100 || Boolean(activeUser.isVipOverride);
  const vipProgressPct = Math.min(100, Math.round((customerOrders.length / 100) * 100));
  const ordersLeftForVip = Math.max(0, 100 - customerOrders.length);

  const bonusPoints = activeUser.bonusPoints || 0;
  
  // Strict points calculation based on universal ratio (1€ = 1 PT / 1 000 FCFA = 1 PT)
  const rawLoyaltyPoints = useMemo(() => {
    const ordersPoints = loyaltyEligibleOrders.reduce((sum, o) => {
      return sum + calculatePointsEarned(o.total || 0, o.currency || 'EUR');
    }, 0);
    return ordersPoints + bonusPoints;
  }, [loyaltyEligibleOrders, bonusPoints]);

  const availableLoyaltyPoints = Math.max(0, rawLoyaltyPoints - spentLoyaltyPoints);

  // User Referral & Affiliation Data
  const userRefCode = useMemo(() => {
    return user?.referralCode || generateReferralCode(activeUser.email, activeUser.name);
  }, [user, activeUser]);

  const userPointTransactions = useMemo(() => {
    const email = (activeUser.email || '').toLowerCase();
    return (pointTransactions || []).filter(tx => tx.userEmail.toLowerCase() === email);
  }, [pointTransactions, activeUser.email]);

  const myReferrals = useMemo(() => {
    const cleanRef = (userRefCode || '').trim().toUpperCase();
    return (clients || []).filter(c => c.referredBy && c.referredBy.trim().toUpperCase() === cleanRef);
  }, [clients, userRefCode]);

  const referralClicks = user?.referralClicks || 0;
  const referralSignups = Math.max(myReferrals.length, user?.referralSignupsCount || 0);

  const referralOrdersCount = useMemo(() => {
    const referredEmails = myReferrals.map(r => r.email.toLowerCase());
    const ordersByReferrals = (orders || []).filter(o => o.customerEmail && referredEmails.includes(o.customerEmail.toLowerCase()));
    return Math.max(user?.referralOrdersCount || 0, ordersByReferrals.length);
  }, [myReferrals, orders, user?.referralOrdersCount]);

  const referralPointsTotal = useMemo(() => {
    const txPoints = userPointTransactions
      .filter(tx => tx.type === 'REFERRAL_SIGNUP' || tx.type === 'REFERRAL_PURCHASE')
      .reduce((sum, tx) => sum + (tx.amount > 0 ? tx.amount : 0), 0);

    const referredEmails = myReferrals.map(r => r.email.toLowerCase());
    const ordersByReferrals = (orders || []).filter(o => o.customerEmail && referredEmails.includes(o.customerEmail.toLowerCase()));
    const ordersPointsCommission = ordersByReferrals.reduce((sum, o) => {
      const orderPts = calculatePointsEarned(o.total || 0, o.currency || 'EUR');
      return sum + Math.max(1, Math.round(orderPts * 0.10));
    }, 0);
    const signupPointsBonus = myReferrals.length * 50;

    return Math.max(user?.referralPointsEarned || 0, txPoints, ordersPointsCommission + signupPointsBonus);
  }, [userPointTransactions, myReferrals, orders, user?.referralPointsEarned]);

  const handleConvertPointsUniversal = (pointsToConvert?: number) => {
    const pts = typeof pointsToConvert === 'number' && pointsToConvert > 0 && pointsToConvert <= availableLoyaltyPoints
      ? pointsToConvert 
      : availableLoyaltyPoints;

    if (pts <= 0) {
      showToast(`⚠️ Solde insuffisant : vous avez 0 point disponible.`);
      return;
    }
    
    const res = convertPointsToCoupon(activeUser.email, pts, currency);
    if (res.success && res.promoCode) {
      const discountAmount = currency === 'FCFA' ? pts * 100 : Math.round(pts * 0.10);
      setNewlyGeneratedPromo({
        code: res.promoCode,
        discountAmount,
        pointsUsed: pts
      });
      if (typeof navigator !== 'undefined') {
        navigator.clipboard.writeText(res.promoCode);
      }
      showToast(`🎉 Coupon ${res.promoCode} généré avec succès (-${formatPrice(convertPrice(discountAmount, currency), currency)}) !`);
    } else {
      showToast(`❌ ${res.message || 'Erreur lors de la création du coupon.'}`);
    }
  };

  const handleConvertPointsToPromo = (pointsToConvert?: number) => {
    handleConvertPointsUniversal(pointsToConvert);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateUserProfile({ name: profileName, phone: profilePhone });
    
    if (activeUser.email) {
      const channels: ('EMAIL' | 'WHATSAPP')[] = [];
      if (profileWantWhatsapp && (profilePhone || activeUser.phone)) channels.push('WHATSAPP');
      if (profileWantEmail && activeUser.email) channels.push('EMAIL');

      if (channels.length > 0) {
        subscribeToMarketing({
          name: profileName || activeUser.name,
          email: activeUser.email,
          phone: profilePhone || activeUser.phone,
          channels,
          source: 'ACCOUNT'
        });
      } else {
        unsubscribeMarketing(activeUser.email);
      }
    }

    showToast('✨ Vos informations et préférences d\'alertes ont été enregistrées avec succès !');
  };

  const handleAddAddress = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrStreet || !newAddrCity) {
      showToast('⚠️ Veuillez renseigner tous les champs obligatoires.');
      return;
    }

    const countryLabels = {
      benin: 'Bénin',
      france: 'France',
      belgique: 'Belgique'
    };

    const newAddress: Address = {
      id: 'addr_' + Date.now(),
      label: newAddrLabel || 'Domicile',
      fullName: newAddrFullName || activeUser.name,
      street: newAddrStreet,
      city: newAddrCity,
      zipCode: '00000',
      country: countryLabels[newAddrCountry] || 'Bénin',
      phone: newAddrPhone || activeUser.phone || OFFICIAL_WHATSAPP_NUMBER,
      isDefault: newAddrDefault
    };

    addSavedAddress(newAddress);
    setShowAddressModal(false);
    setNewAddrStreet('');
    setNewAddrCity('');
    showToast('📍 Nouvelle adresse enregistrée dans votre carnet.');
  };

  // ROBUST PDF / INVOICE GENERATOR & INSTANT PRINT ENGINE
  const handleDownloadInvoice = (order: Order) => {
    const orderFormattedTotal = formatPrice(convertPrice(order.total, currency), currency);
    const orderDate = new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="utf-8" />
        <title>Facture_${order.orderNumber}_AYMARD_STORE.pdf</title>
        <style>
          @page { size: A4; margin: 15mm; }
          * { box-sizing: border-box; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #09090b; margin: 0; padding: 24px; font-size: 13px; line-height: 1.5; background: #ffffff; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #09090b; padding-bottom: 20px; margin-bottom: 25px; }
          .brand { font-size: 26px; font-weight: 900; letter-spacing: 2px; color: #09090b; }
          .sub-brand { font-size: 11px; color: #71717a; text-transform: uppercase; letter-spacing: 1px; margin-top: 4px; font-weight: 700; }
          .contacts { font-size: 11.5px; color: #52525b; margin-top: 8px; line-height: 1.5; }
          .invoice-meta { text-align: right; }
          .invoice-title { font-size: 20px; font-weight: 900; color: #09090b; margin: 0 0 4px 0; letter-spacing: 0.5px; }
          .grid-info { display: flex; justify-content: space-between; gap: 20px; margin-bottom: 25px; }
          .info-box { flex: 1; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; }
          .info-title { font-size: 11px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px; letter-spacing: 0.8px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 25px; }
          th { background: #09090b; color: #ffffff; padding: 11px 14px; font-size: 11.5px; font-weight: 800; text-align: left; text-transform: uppercase; letter-spacing: 0.5px; }
          td { padding: 12px 14px; border-bottom: 1px solid #e2e8f0; font-size: 12.5px; }
          .totals-wrap { display: flex; justify-content: flex-end; margin-bottom: 25px; }
          .totals-table { width: 340px; border-collapse: collapse; }
          .totals-table td { padding: 8px 12px; border: none; }
          .total-highlight { font-size: 17px; font-weight: 900; color: #09090b; border-top: 2px solid #09090b !important; }
          .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 11px; font-weight: 800; background: #dcfce7; color: #15803d; border: 1px solid #86efac; }
          .guarantee { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 12px; padding: 14px 18px; font-size: 12px; color: #166534; margin-bottom: 25px; line-height: 1.5; }
          .footer { text-align: center; font-size: 11px; color: #a1a1aa; border-top: 1px solid #e4e4e7; padding-top: 15px; margin-top: 30px; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="brand">AYMARD STORE</div>
            <div class="sub-brand">Sneakers d'Exception &amp; Mode Streetwear Premium</div>
            <div class="contacts">
              <strong>SARL AYMARD STORE</strong> · Cotonou (Bénin) &amp; Paris (France)<br/>
              Email : <strong>${OFFICIAL_EMAIL}</strong><br/>
              WhatsApp : <strong>${OFFICIAL_WHATSAPP_NUMBER}</strong>
            </div>
          </div>
          <div class="invoice-meta">
            <div class="invoice-title">FACTURE D'ACHAT</div>
            <div><strong>N° Facture :</strong> FACT-${order.orderNumber}</div>
            <div><strong>Date d'Émission :</strong> ${orderDate}</div>
            <div style="margin-top: 8px;"><span class="badge">✓ ACQUITTÉE / PAYÉE</span></div>
          </div>
        </div>

        <div class="grid-info">
          <div class="info-box">
            <div class="info-title">Acheteur / Client</div>
            <strong style="font-size: 14px;">${order.shippingAddress?.fullName || activeUser.name}</strong><br/>
            Email : ${order.customerEmail || activeUser.email}<br/>
            Téléphone : ${order.shippingAddress?.phone || activeUser.phone || OFFICIAL_WHATSAPP_NUMBER}
          </div>
          <div class="info-box">
            <div class="info-title">Adresse de Livraison</div>
            <strong>${order.shippingAddress?.street || 'Adresse principale'}</strong><br/>
            ${order.shippingAddress?.city || 'Cotonou'}, ${order.shippingAddress?.country || 'Bénin'}<br/>
            <span style="color: #0284c7; font-weight: 700;">Expédition : Livraison Express Sécurisée</span>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th>Article</th>
              <th>Pointure / Taille</th>
              <th style="text-align: center;">Qté</th>
              <th style="text-align: right;">Prix Unitaire</th>
              <th style="text-align: right;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${order.items.map(it => `
              <tr>
                <td><strong>${it.product?.name_fr || 'Article Aymard Store'}</strong></td>
                <td><span style="background: #f4f4f5; padding: 3px 8px; border-radius: 6px; font-weight: 700;">${it.size ? `${it.size}` : 'Unique'}</span></td>
                <td style="text-align: center; font-weight: 800;">${it.quantity}</td>
                <td style="text-align: right;">${formatPrice(convertPrice(it.product?.price || 0, currency), currency)}</td>
                <td style="text-align: right; font-weight: 900;">${formatPrice(convertPrice((it.product?.price || 0) * it.quantity, currency), currency)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="totals-wrap">
          <table class="totals-table">
            <tr>
              <td>Sous-total :</td>
              <td style="text-align: right; font-weight: 800;">${orderFormattedTotal}</td>
            </tr>
            <tr>
              <td>Frais de Livraison :</td>
              <td style="text-align: right; color: #16a34a; font-weight: 800;">OFFERT (Privilège VIP)</td>
            </tr>
            <tr>
              <td>Taxes &amp; Authentification :</td>
              <td style="text-align: right; color: #71717a;">Incluses (0,00 €)</td>
            </tr>
            <tr class="total-highlight">
              <td>Total TTC Réglé :</td>
              <td style="text-align: right; color: #09090b;">${orderFormattedTotal}</td>
            </tr>
          </table>
        </div>

        <div class="guarantee">
          🛡️ <strong>Certificat d'Authenticité &amp; Traçabilité :</strong><br/>
          Chaque article a été authentifié avec rigueur par notre équipe d'experts. En raison du caractère exclusif de nos éditions, les retours ne sont pas acceptés après validation de commande.
        </div>

        <div class="footer">
          Merci pour votre confiance sur AYMARD STORE · Support VIP : <strong>${OFFICIAL_EMAIL}</strong> | <strong>${OFFICIAL_WHATSAPP_NUMBER}</strong><br/>
          Document généré électroniquement tenant lieu de facture d'achat originale.
        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.open();
      printWin.document.write(htmlContent);
      printWin.document.close();
      showToast(`📄 Facture N° ${order.orderNumber} ouverte pour téléchargement / impression !`);
    } else {
      // Fallback: Open in-app preview modal
      setPreviewOrder(order);
      showToast('📄 Facture ouverte dans votre navigateur !');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa', color: '#09090b', fontFamily: 'inherit', paddingBottom: '100px', overflowX: 'hidden' }}>
      
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          background: '#09090b',
          color: '#ffffff',
          padding: '14px 24px',
          borderRadius: '30px',
          boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
          zIndex: 99999,
          fontWeight: 700,
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span>✨</span>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. EDITORIAL LUXURY TOP HERO: CLEAN MINIMALIST MONOCHROME + GOLD VIP */}
      {/* ========================================================================= */}
      <header style={{
        background: isDarkMode ? '#0d0d10' : '#f8fafc',
        borderBottom: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
        padding: '24px 0',
        transition: 'background 0.25s ease, border-color 0.25s ease'
      }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
          
          {/* Main Luxury Profile Card */}
          <div style={{
            background: isDarkMode ? '#18181b' : '#ffffff',
            border: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
            borderRadius: '24px',
            padding: '18px 20px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
          }}>
            
            {/* Top Identity Row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
              {/* Avatar Initials */}
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: isDarkMode ? '#27272a' : '#09090b',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 900,
                letterSpacing: '1px',
                border: isVipMember ? '2px solid #facc15' : `2px solid ${isDarkMode ? '#3f3f46' : '#e2e8f0'}`,
                boxShadow: isVipMember ? '0 0 12px rgba(250, 204, 21, 0.3)' : undefined,
                flexShrink: 0
              }}>
                {activeUser.name ? activeUser.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'JA'}
              </div>

              {/* User Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.3px', margin: 0, color: isDarkMode ? '#ffffff' : '#09090b' }}>
                    {activeUser.name}
                  </h1>
                  <span style={{
                    background: isVipMember ? 'linear-gradient(135deg, #09090b, #18181b)' : (isDarkMode ? '#27272a' : '#f1f5f9'),
                    color: isVipMember ? '#facc15' : (isDarkMode ? '#d4d4d8' : '#475569'),
                    border: isVipMember ? '1.5px solid #facc15' : `1px solid ${isDarkMode ? '#3f3f46' : '#cbd5e1'}`,
                    fontSize: '9.5px',
                    fontWeight: 900,
                    textTransform: 'uppercase',
                    letterSpacing: '0.6px',
                    padding: '2px 8px',
                    borderRadius: '100px',
                    whiteSpace: 'nowrap'
                  }}>
                    {isVipMember 
                      ? (activeUser.isVipOverride ? 'VIP BOUTIQUE' : 'MEMBRE VIP (100+)')
                      : `MEMBRE PRIVILÈGE (${customerOrders.length}/100)`
                    }
                  </span>
                </div>

                {/* Contact info strictly non-wrapping */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '12px', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 500 }}>Email :</span>
                    <span style={{ fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', color: isDarkMode ? '#ffffff' : '#09090b' }}>{activeUser.email}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontWeight: 500 }}>Tél :</span>
                    <span style={{ fontWeight: 700, color: isDarkMode ? '#ffffff' : '#09090b' }}>{activeUser.phone || OFFICIAL_WHATSAPP_NUMBER}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Row */}
            <div id="notifications-dropdown-container" style={{
              position: 'relative',
              display: 'grid',
              gridTemplateColumns: '1fr auto auto',
              gap: '8px',
              marginTop: '16px',
              paddingTop: '14px',
              borderTop: `1px solid ${isDarkMode ? '#27272a' : '#f1f5f9'}`
            }}>
              {/* Modifier le profil */}
              <button
                onClick={() => setActiveTab('profile')}
                style={{
                  background: isDarkMode ? '#ffffff' : '#09090b',
                  color: isDarkMode ? '#09090b' : '#ffffff',
                  border: 'none',
                  padding: '11px 16px',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                }}
              >
                Modifier le profil
              </button>

              {/* Notifications Button */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotificationsDropdown(!showNotificationsDropdown);
                }}
                style={{
                  position: 'relative',
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: showNotificationsDropdown ? (isDarkMode ? '#ffffff' : '#09090b') : (isDarkMode ? '#27272a' : '#f1f5f9'),
                  color: showNotificationsDropdown ? (isDarkMode ? '#09090b' : '#ffffff') : (isDarkMode ? '#ffffff' : '#09090b'),
                  border: `1px solid ${isDarkMode ? '#3f3f46' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                title="Mes Notifications"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadNotifsCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 900,
                    minWidth: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 2px',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                  }}>
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* Mode Sombre / Clair Icon Button */}
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '14px',
                  background: isDarkMode ? '#27272a' : '#f1f5f9',
                  color: isDarkMode ? '#facc15' : '#09090b',
                  border: `1px solid ${isDarkMode ? '#3f3f46' : '#e2e8f0'}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
                title={isDarkMode ? 'Passer en mode clair' : 'Passer en mode sombre'}
              >
                {isDarkMode ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}
              </button>

              {/* Dropdown Menu */}
              {showNotificationsDropdown && (
                <div
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 'calc(100% + 10px)',
                    width: '100%',
                    maxWidth: '380px',
                    background: isDarkMode ? '#18181b' : '#ffffff',
                    border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`,
                    borderRadius: '20px',
                    boxShadow: '0 18px 45px rgba(0,0,0,0.22)',
                    zIndex: 1000,
                    overflow: 'hidden',
                    animation: 'fadeIn 0.18s ease-out'
                  }}
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Dropdown Header */}
                  <div style={{
                    padding: '14px 18px',
                    borderBottom: `1px solid ${isDarkMode ? '#27272a' : '#f1f5f9'}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: isDarkMode ? '#202024' : '#fafafa'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <strong style={{ fontSize: '13px', color: isDarkMode ? '#ffffff' : '#09090b', fontWeight: 900 }}>
                        Notifications
                      </strong>
                      <span style={{ fontSize: '11px', fontWeight: 800, background: isDarkMode ? '#27272a' : '#e4e4e7', color: isDarkMode ? '#a1a1aa' : '#52525b', padding: '1px 6px', borderRadius: '10px' }}>
                        {userNotifications.length}
                      </span>
                    </div>

                    {unreadNotifsCount > 0 && (
                      <button
                        type="button"
                        onClick={() => markAllNotificationsAsRead(user?.email)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0284c7',
                          fontSize: '11px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          padding: 0
                        }}
                      >
                        Tout marquer lu
                      </button>
                    )}
                  </div>

                  {/* Dropdown Notification Items */}
                  <div style={{ maxHeight: '320px', overflowY: 'auto', padding: '8px 0' }}>
                    {userNotifications.length === 0 ? (
                      <div style={{ padding: '24px 16px', textAlign: 'center', color: isDarkMode ? '#71717a' : '#a1a1aa', fontSize: '12px' }}>
                        Aucune notification pour le moment.
                      </div>
                    ) : (
                      userNotifications.map((notif) => (
                        <div
                          key={notif.id}
                          onClick={() => markNotificationAsRead(notif.id)}
                          style={{
                            padding: '12px 18px',
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'flex-start',
                            background: !notif.read ? (isDarkMode ? 'rgba(56, 189, 248, 0.06)' : 'rgba(2, 132, 199, 0.04)') : 'transparent',
                            borderBottom: `1px solid ${isDarkMode ? '#202024' : '#f8fafc'}`,
                            cursor: 'pointer',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          {/* Unread Status Dot */}
                          <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: !notif.read ? '#0284c7' : 'transparent',
                            marginTop: '5px',
                            flexShrink: 0
                          }} />

                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '8px' }}>
                              <strong style={{ fontSize: '12.5px', color: isDarkMode ? '#ffffff' : '#09090b', fontWeight: !notif.read ? 800 : 600 }}>
                                {notif.title}
                              </strong>
                              <span style={{ fontSize: '10px', color: isDarkMode ? '#71717a' : '#a1a1aa', flexShrink: 0 }}>
                                {notif.date}
                              </span>
                            </div>
                            <p style={{ fontSize: '11.5px', color: isDarkMode ? '#a1a1aa' : '#52525b', margin: '2px 0 0 0', lineHeight: 1.4 }}>
                              {notif.message}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Quick Metrics Bar: 3 Refined Luxury Cards */}
          <div className="account-metric-cards-grid">
            
            {/* Card 1: Dépenses Totales */}
            <div style={{ background: isDarkMode ? '#18181b' : '#fafafa', padding: '16px 20px', borderRadius: '18px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Dépenses Totales
                </span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', letterSpacing: '-0.5px' }}>
                {formatPrice(convertPrice(totalSpent, currency), currency)}
              </div>
            </div>

            {/* Card 2: Commandes Passées */}
            <div style={{ background: isDarkMode ? '#18181b' : '#fafafa', padding: '16px 20px', borderRadius: '18px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div style={{ marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Commandes Passées
                </span>
              </div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', letterSpacing: '-0.5px' }}>
                {customerOrders.length} acquisition{customerOrders.length > 1 ? 's' : ''}
              </div>
              <span style={{ fontSize: '11px', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                Suivi en direct connecté
              </span>
            </div>

            {/* Card 3: Points Fidélité VIP (Information & Direct Guidance to Codes Promo) */}
            <div style={{
              background: isDarkMode ? 'linear-gradient(135deg, #18181b, #27272a)' : 'linear-gradient(135deg, #09090b, #18181b)',
              padding: '16px 20px',
              borderRadius: '18px',
              border: isDarkMode ? '1px solid #3f3f46' : '1px solid #27272a',
              color: '#ffffff',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#facc15', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  Points Fidélité VIP
                </span>
                <button
                  type="button"
                  onClick={() => setShowLoyaltyModal(true)}
                  style={{
                    background: 'rgba(255,255,255,0.12)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.2)',
                    borderRadius: '20px',
                    padding: '3px 10px',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                  title="Découvrir comment fonctionnent vos points fidélité"
                >
                  Infos &amp; Paliers
                </button>
              </div>

              <div style={{ fontSize: '22px', fontWeight: 900, color: '#facc15', letterSpacing: '-0.5px', marginTop: '2px' }}>
                {availableLoyaltyPoints} Pts <span style={{ fontSize: '12px', color: '#a1a1aa', fontWeight: 700 }}>({isVipMember ? 'Membre VIP' : 'Membre Privilège'})</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '11.5px', color: '#a1a1aa', flexWrap: 'wrap', gap: '8px' }}>
                <span>Valeur : <strong style={{ color: '#ffffff' }}>~{formatPrice(convertPrice((availableLoyaltyPoints / 100) * 5, currency), currency)}</strong></span>
                <button
                  type="button"
                  onClick={() => setActiveTab('coupons')}
                  style={{
                    background: '#facc15',
                    color: '#09090b',
                    border: 'none',
                    borderRadius: '10px',
                    padding: '5px 12px',
                    fontSize: '11px',
                    fontWeight: 900,
                    cursor: 'pointer'
                  }}
                  title="Rendez-vous dans l'onglet Codes Promo pour convertir vos points"
                >
                  Convertir en Promo ➔
                </button>
              </div>
            </div>

          </div>

          {/* Newly Generated Promo Code Notification Banner */}
          {newlyGeneratedPromo && (
            <div style={{
              background: 'linear-gradient(135deg, #09090b, #1e293b)',
              border: '2px solid #facc15',
              borderRadius: '20px',
              padding: '16px 20px',
              marginTop: '16px',
              color: '#ffffff',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '14px',
              boxShadow: '0 10px 30px rgba(250, 204, 21, 0.15)',
              animation: 'fadeIn 0.3s ease-out'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '10.5px', fontWeight: 900, background: '#facc15', color: '#09090b', padding: '2px 8px', borderRadius: '6px' }}>
                    CODE PROMO DISPONIBLE
                  </span>
                  <strong style={{ fontSize: '13.5px', color: '#22c55e' }}>
                    -{formatPrice(convertPrice(newlyGeneratedPromo.discountAmount, currency), currency)} immédiat
                  </strong>
                </div>
                <div style={{ fontSize: '12.5px', color: '#94a3b8', marginTop: '3px' }}>
                  Code : <code style={{ color: '#ffffff', background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '6px', fontSize: '13.5px', fontWeight: 900, letterSpacing: '1px' }}>{newlyGeneratedPromo.code}</code>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined') navigator.clipboard.writeText(newlyGeneratedPromo.code);
                    showToast(`Code ${newlyGeneratedPromo.code} copié !`);
                  }}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    color: '#ffffff',
                    border: '1px solid rgba(255,255,255,0.3)',
                    padding: '8px 14px',
                    borderRadius: '20px',
                    fontSize: '11.5px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Copier
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined') navigator.clipboard.writeText(newlyGeneratedPromo.code);
                    setActiveTab('cart');
                    showToast(`Code ${newlyGeneratedPromo.code} copié ! Collez-le dans votre panier.`);
                  }}
                  style={{
                    background: '#facc15',
                    color: '#09090b',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    fontSize: '11.5px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(250, 204, 21, 0.3)'
                  }}
                >
                  Appliquer au Panier ➔
                </button>
              </div>
            </div>
          )}

          {/* VIP Progression Bar (100 Orders Rule) */}
          <div style={{
            background: isDarkMode ? '#18181b' : '#fafafa',
            border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`,
            borderRadius: '18px',
            padding: '14px 18px',
            marginTop: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px'
          }}>
            {/* Top row: Palier counter & completion percentage */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Palier VIP : <strong>{customerOrders.length} / 100 commandes</strong></span>
                {isVipMember && (
                  <span style={{ color: '#16a34a', fontWeight: 900 }}>(VIP Débloqué)</span>
                )}
              </span>
              <span style={{ fontSize: '11.5px', fontWeight: 900, color: isVipMember ? '#d97706' : '#0284c7', flexShrink: 0 }}>
                {vipProgressPct}% complété
              </span>
            </div>

            {/* Subtitle row on separate line to avoid wrapping issues */}
            {!isVipMember && (
              <div style={{ fontSize: '11px', color: isDarkMode ? '#a1a1aa' : '#71717a', fontWeight: 600, marginTop: '-2px' }}>
                {ordersLeftForVip} commande{ordersLeftForVip > 1 ? 's' : ''} restante{ordersLeftForVip > 1 ? 's' : ''} pour le Statut VIP automatique
              </div>
            )}

            {/* Progress track */}
            <div style={{ width: '100%', height: '8px', borderRadius: '10px', background: isDarkMode ? '#27272a' : '#e4e4e7', overflow: 'hidden' }}>
              <div style={{
                width: `${vipProgressPct}%`,
                height: '100%',
                borderRadius: '10px',
                background: isVipMember ? 'linear-gradient(90deg, #f59e0b, #d97706)' : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                transition: 'width 0.4s ease'
              }} />
            </div>
          </div>

          {/* Exclusive Perks & Gifts Accorded by Admin */}
          {activeUser.customPerks && activeUser.customPerks.length > 0 && (
            <div style={{
              background: isDarkMode ? 'linear-gradient(135deg, #2e1065, #1e1b4b)' : 'linear-gradient(135deg, #fdf4ff, #fae8ff)',
              border: `1.5px solid ${isDarkMode ? '#6b21a8' : '#d8b4fe'}`,
              borderRadius: '20px',
              padding: '18px 24px',
              marginTop: '16px',
              color: isDarkMode ? '#e9d5ff' : '#581c87'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 900, margin: 0, color: isDarkMode ? '#f5d0fe' : '#581c87', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Vos Avantages Spéciaux
                </h3>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px' }}>
                {activeUser.customPerks.map((pk) => (
                  <div key={pk.id} style={{ background: isDarkMode ? '#18181b' : '#ffffff', border: `1px solid ${isDarkMode ? '#3b0764' : '#e9d5ff'}`, borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                    <div>
                      <strong style={{ fontSize: '13px', color: isDarkMode ? '#ffffff' : '#581c87', display: 'block' }}>{pk.title}</strong>
                      <p style={{ fontSize: '11.5px', color: isDarkMode ? '#c084fc' : '#7e22ce', margin: '2px 0 0 0', lineHeight: '1.4' }}>{pk.description}</p>
                      <span style={{ fontSize: '10px', color: isDarkMode ? '#a855f7' : '#a855f7', fontWeight: 700, display: 'block', marginTop: '4px' }}>Accordé le {pk.dateGranted}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. TWO-COLUMN ARCHITECTURE (FARFETCH / SSENSE STYLE) */}
      {/* ========================================================================= */}
      <main style={{
        background: isDarkMode ? '#09090b' : '#fcfcfd',
        minHeight: '80vh',
        padding: '36px 0 60px 0',
        transition: 'background 0.25s ease'
      }}>
        <div className="container" style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 16px' }}>
        
        <div className="account-main-grid">
          
          {/* Left Navigation Sidebar */}
          <aside className="account-nav-sidebar" style={{ background: isDarkMode ? '#121215' : '#ffffff', borderRadius: '24px', padding: '14px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, position: 'sticky', top: '24px', boxShadow: isDarkMode ? '0 10px 30px rgba(0,0,0,0.5)' : '0 8px 30px rgba(0,0,0,0.04)' }}>
            
            {/* Sidebar User Mini-Header */}
            <div style={{ padding: '8px 10px 14px 10px', borderBottom: `1px solid ${isDarkMode ? '#27272a' : '#f1f5f9'}`, marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #eab308 0%, #ca8a04 100%)',
                color: '#09090b',
                fontWeight: 900,
                fontSize: '13.5px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(234, 179, 8, 0.3)'
              }}>
                {(user?.name || 'A').charAt(0).toUpperCase()}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: '13.5px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'Mon Compte'}
                </div>
                <div style={{ fontSize: '10.5px', color: '#ca8a04', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Membre Privilège
                </div>
              </div>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
              
              {/* 1. Mes Commandes */}
              <button
                onClick={() => setActiveTab('orders')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: activeTab === 'orders' ? 'none' : `1px solid ${isDarkMode ? '#1e1e24' : '#f4f4f5'}`,
                  background: activeTab === 'orders' ? (isDarkMode ? 'linear-gradient(135deg, #27272a 0%, #18181b 100%)' : 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)') : (isDarkMode ? '#18181b' : '#fafafa'),
                  color: activeTab === 'orders' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569'),
                  fontWeight: activeTab === 'orders' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: activeTab === 'orders' ? '0 4px 14px rgba(0,0,0,0.18)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: activeTab === 'orders' ? 'rgba(250, 204, 21, 0.2)' : (isDarkMode ? '#27272a' : '#f1f5f9'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'orders' ? '#facc15' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z"/>
                      <path d="M3 6h18"/>
                      <path d="M16 10a4 4 0 0 1-8 0"/>
                    </svg>
                  </div>
                  <span>Mes Commandes</span>
                </div>
                <span style={{
                  background: activeTab === 'orders' ? '#ffffff' : (isDarkMode ? '#27272a' : '#e2e8f0'),
                  color: activeTab === 'orders' ? '#09090b' : (isDarkMode ? '#a1a1aa' : '#475569'),
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {customerOrders.length}
                </span>
              </button>

              {/* 2. Mon Panier VIP */}
              <button
                onClick={() => setActiveTab('cart')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: activeTab === 'cart' ? 'none' : `1px solid ${isDarkMode ? '#1e1e24' : '#f4f4f5'}`,
                  background: activeTab === 'cart' ? (isDarkMode ? 'linear-gradient(135deg, #27272a 0%, #18181b 100%)' : 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)') : (isDarkMode ? '#18181b' : '#fafafa'),
                  color: activeTab === 'cart' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569'),
                  fontWeight: activeTab === 'cart' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: activeTab === 'cart' ? '0 4px 14px rgba(0,0,0,0.18)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: activeTab === 'cart' ? 'rgba(250, 204, 21, 0.2)' : (isDarkMode ? '#27272a' : '#f1f5f9'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'cart' ? '#facc15' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="8" cy="21" r="1"/>
                      <circle cx="19" cy="21" r="1"/>
                      <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
                    </svg>
                  </div>
                  <span>Mon Panier VIP</span>
                </div>
                {cart.length > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    {cart.length}
                  </span>
                )}
              </button>

              {/* 3. Mes Favoris */}
              <button
                onClick={() => setActiveTab('wishlist')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: activeTab === 'wishlist' ? 'none' : `1px solid ${isDarkMode ? '#1e1e24' : '#f4f4f5'}`,
                  background: activeTab === 'wishlist' ? (isDarkMode ? 'linear-gradient(135deg, #27272a 0%, #18181b 100%)' : 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)') : (isDarkMode ? '#18181b' : '#fafafa'),
                  color: activeTab === 'wishlist' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569'),
                  fontWeight: activeTab === 'wishlist' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: activeTab === 'wishlist' ? '0 4px 14px rgba(0,0,0,0.18)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: activeTab === 'wishlist' ? 'rgba(250, 204, 21, 0.2)' : (isDarkMode ? '#27272a' : '#f1f5f9'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'wishlist' ? '#facc15' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>
                    </svg>
                  </div>
                  <span>Mes Favoris</span>
                </div>
                <span style={{
                  background: activeTab === 'wishlist' ? '#ffffff' : (isDarkMode ? '#27272a' : '#e2e8f0'),
                  color: activeTab === 'wishlist' ? '#09090b' : (isDarkMode ? '#a1a1aa' : '#475569'),
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {favorites.length}
                </span>
              </button>

              {/* 4. Adresses de Livraison */}
              <button
                onClick={() => setActiveTab('addresses')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: activeTab === 'addresses' ? 'none' : `1px solid ${isDarkMode ? '#1e1e24' : '#f4f4f5'}`,
                  background: activeTab === 'addresses' ? (isDarkMode ? 'linear-gradient(135deg, #27272a 0%, #18181b 100%)' : 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)') : (isDarkMode ? '#18181b' : '#fafafa'),
                  color: activeTab === 'addresses' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569'),
                  fontWeight: activeTab === 'addresses' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: activeTab === 'addresses' ? '0 4px 14px rgba(0,0,0,0.18)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: activeTab === 'addresses' ? 'rgba(250, 204, 21, 0.2)' : (isDarkMode ? '#27272a' : '#f1f5f9'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'addresses' ? '#facc15' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <span>Adresses de Livraison</span>
                </div>
              </button>

              {/* 5. Codes Promo VIP */}
              <button
                onClick={() => setActiveTab('coupons')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: activeTab === 'coupons' ? 'none' : `1px solid ${isDarkMode ? '#1e1e24' : '#f4f4f5'}`,
                  background: activeTab === 'coupons' ? (isDarkMode ? 'linear-gradient(135deg, #27272a 0%, #18181b 100%)' : 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)') : (isDarkMode ? '#18181b' : '#fafafa'),
                  color: activeTab === 'coupons' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569'),
                  fontWeight: activeTab === 'coupons' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: activeTab === 'coupons' ? '0 4px 14px rgba(0,0,0,0.18)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: activeTab === 'coupons' ? 'rgba(250, 204, 21, 0.2)' : (isDarkMode ? '#27272a' : '#f1f5f9'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'coupons' ? '#facc15' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
                      <path d="M13 5v2"/>
                      <path d="M13 17v2"/>
                      <path d="M13 11v2"/>
                    </svg>
                  </div>
                  <span>Codes Promo VIP</span>
                </div>
                {promoCodes.length > 0 && (
                  <span style={{
                    background: '#facc15',
                    color: '#09090b',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    {promoCodes.length}
                  </span>
                )}
              </button>

              {/* 6. Parrainage & Affiliation */}
              <button
                onClick={() => setActiveTab('affiliation')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: activeTab === 'affiliation' ? 'none' : `1px solid ${isDarkMode ? '#1e1e24' : '#f4f4f5'}`,
                  background: activeTab === 'affiliation' ? (isDarkMode ? 'linear-gradient(135deg, #27272a 0%, #18181b 100%)' : 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)') : (isDarkMode ? '#18181b' : '#fafafa'),
                  color: activeTab === 'affiliation' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569'),
                  fontWeight: activeTab === 'affiliation' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: activeTab === 'affiliation' ? '0 4px 14px rgba(0,0,0,0.18)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: activeTab === 'affiliation' ? 'rgba(250, 204, 21, 0.2)' : (isDarkMode ? '#27272a' : '#f1f5f9'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'affiliation' ? '#facc15' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
                      <circle cx="9" cy="7" r="4"/>
                      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
                      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
                    </svg>
                  </div>
                  <span>Parrainage &amp; Affiliation</span>
                </div>
                <span style={{
                  background: 'linear-gradient(135deg, #facc15, #f59e0b)',
                  color: '#09090b',
                  fontSize: '9.5px',
                  fontWeight: 900,
                  padding: '2px 6px',
                  borderRadius: '6px'
                }}>
                  10%
                </span>
              </button>

              {/* 7. Notifications */}
              <button
                onClick={() => setActiveTab('notifications')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: activeTab === 'notifications' ? 'none' : `1px solid ${isDarkMode ? '#1e1e24' : '#f4f4f5'}`,
                  background: activeTab === 'notifications' ? (isDarkMode ? 'linear-gradient(135deg, #27272a 0%, #18181b 100%)' : 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)') : (isDarkMode ? '#18181b' : '#fafafa'),
                  color: activeTab === 'notifications' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569'),
                  fontWeight: activeTab === 'notifications' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: activeTab === 'notifications' ? '0 4px 14px rgba(0,0,0,0.18)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: activeTab === 'notifications' ? 'rgba(250, 204, 21, 0.2)' : (isDarkMode ? '#27272a' : '#f1f5f9'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'notifications' ? '#facc15' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                    </svg>
                  </div>
                  <span>Notifications</span>
                </div>
                {unreadNotifsCount > 0 && (
                  <span style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 900,
                    padding: '2px 8px',
                    borderRadius: '10px'
                  }}>
                    {unreadNotifsCount}
                  </span>
                )}
              </button>

              {/* 8. Mes Avis Produits */}
              <button
                onClick={() => setActiveTab('reviews')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: activeTab === 'reviews' ? 'none' : `1px solid ${isDarkMode ? '#1e1e24' : '#f4f4f5'}`,
                  background: activeTab === 'reviews' ? (isDarkMode ? 'linear-gradient(135deg, #27272a 0%, #18181b 100%)' : 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)') : (isDarkMode ? '#18181b' : '#fafafa'),
                  color: activeTab === 'reviews' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569'),
                  fontWeight: activeTab === 'reviews' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: activeTab === 'reviews' ? '0 4px 14px rgba(0,0,0,0.18)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: activeTab === 'reviews' ? 'rgba(250, 204, 21, 0.2)' : (isDarkMode ? '#27272a' : '#f1f5f9'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'reviews' ? '#facc15' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                    </svg>
                  </div>
                  <span>Mes Avis Produits</span>
                </div>
                <span style={{
                  background: activeTab === 'reviews' ? '#ffffff' : (isDarkMode ? '#27272a' : '#e2e8f0'),
                  color: activeTab === 'reviews' ? '#09090b' : (isDarkMode ? '#a1a1aa' : '#475569'),
                  fontSize: '11px',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '10px'
                }}>
                  {userReviews.length}
                </span>
              </button>

              {/* 9. Paramètres & Sécurité */}
              <button
                onClick={() => setActiveTab('profile')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '14px',
                  border: activeTab === 'profile' ? 'none' : `1px solid ${isDarkMode ? '#1e1e24' : '#f4f4f5'}`,
                  background: activeTab === 'profile' ? (isDarkMode ? 'linear-gradient(135deg, #27272a 0%, #18181b 100%)' : 'linear-gradient(135deg, #09090b 0%, #1c1917 100%)') : (isDarkMode ? '#18181b' : '#fafafa'),
                  color: activeTab === 'profile' ? '#ffffff' : (isDarkMode ? '#a1a1aa' : '#475569'),
                  fontWeight: activeTab === 'profile' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: activeTab === 'profile' ? '0 4px 14px rgba(0,0,0,0.18)' : 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: activeTab === 'profile' ? 'rgba(250, 204, 21, 0.2)' : (isDarkMode ? '#27272a' : '#f1f5f9'),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={activeTab === 'profile' ? '#facc15' : 'currentColor'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </div>
                  <span>Paramètres &amp; Sécurité</span>
                </div>
              </button>

            </nav>

            {/* Concierge Box */}
            <div style={{
              marginTop: '16px',
              padding: '14px',
              borderRadius: '16px',
              background: isDarkMode ? 'rgba(250, 204, 21, 0.04)' : 'linear-gradient(135deg, #fefce8 0%, #fef08a 100%)',
              border: `1px solid ${isDarkMode ? 'rgba(250, 204, 21, 0.15)' : '#fef08a'}`,
              textAlign: 'left'
            }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: '#ca8a04', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Conciergerie VIP
              </div>
              <div style={{ fontSize: '12px', color: '#09090b', fontWeight: 700, marginTop: '2px' }}>
                Besoin d&apos;un conseil ?
              </div>
              <button
                onClick={() => window.open('https://wa.me/33757847425', '_blank')}
                style={{
                  marginTop: '8px',
                  width: '100%',
                  padding: '7px 12px',
                  borderRadius: '10px',
                  background: '#25d366',
                  color: '#ffffff',
                  border: 'none',
                  fontSize: '11.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                }}
              >
                WhatsApp Direct 7j/7
              </button>
            </div>

            {/* Logout Button in Sidebar */}
            <button
              onClick={handleLogout}
              style={{
                marginTop: '10px',
                width: '100%',
                padding: '9px 12px',
                borderRadius: '12px',
                background: 'transparent',
                border: `1px solid ${isDarkMode ? '#27272a' : '#fecaca'}`,
                color: '#ef4444',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'all 0.15s ease'
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Se déconnecter</span>
            </button>

          </aside>

          {/* Right Main Stage */}
          <section style={{ minWidth: 0 }}>
            
            {/* -------------------- TAB 1: MES COMMANDES & FACTURES -------------------- */}
            {activeTab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: 'clamp(18px, 4.5vw, 24px)', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0, letterSpacing: '-0.5px' }}>
                      Mes Commandes &amp; Suivi en Direct
                    </h2>
                    <span style={{
                      background: isDarkMode ? '#064e3b' : '#dcfce7',
                      color: isDarkMode ? '#6ee7b7' : '#15803d',
                      fontSize: '11px',
                      fontWeight: 900,
                      padding: '4px 12px',
                      borderRadius: '20px',
                      border: isDarkMode ? '1px solid #059669' : '1px solid #86efac',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '5px'
                    }}>
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16a34a', display: 'inline-block', boxShadow: '0 0 6px #16a34a' }}></span>
                      SUIVI LIVE CONNECTÉ
                    </span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '4px 0 0 0' }}>
                    Suivez la position exacte de votre colis en temps réel (actualisée par la boutique) et téléchargez vos factures officielles certifiées.
                  </p>
                </div>

                {customerOrders.map(order => {
                  const currentStep = order.trackingStep || (order.status === 'DELIVERED' ? 4 : order.status === 'SHIPPED' ? 3 : 2);
                  const activeLocation = order.currentLocation || (order.status === 'DELIVERED' ? 'Remis au client' : order.status === 'SHIPPED' ? 'En cours d\'acheminement coursier' : 'Entrepôt Cotonou (Haie Vive)');
                  const activeStatusText = order.trackingStatusText || (order.status === 'DELIVERED' ? 'Colis livré avec succès et remis en main propre.' : order.status === 'SHIPPED' ? 'Votre coursier a pris en charge le colis et se dirige vers votre adresse.' : 'Votre commande est en cours de préparation et contrôle qualité.');

                  return (
                    <div key={order.id} style={{ background: isDarkMode ? '#121215' : '#ffffff', borderRadius: '24px', padding: '28px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                      
                      {/* Order Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${isDarkMode ? '#27272a' : '#f4f4f5'}`, paddingBottom: '18px', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0 }}>
                              Commande N° {order.orderNumber}
                            </h3>
                            <span style={{
                              background: order.status === 'DELIVERED' ? (isDarkMode ? '#064e3b' : '#dcfce7') : order.status === 'SHIPPED' ? (isDarkMode ? '#0c4a6e' : '#e0f2fe') : (isDarkMode ? '#78350f' : '#fef3c7'),
                              color: order.status === 'DELIVERED' ? (isDarkMode ? '#6ee7b7' : '#15803d') : order.status === 'SHIPPED' ? (isDarkMode ? '#38bdf8' : '#0369a1') : (isDarkMode ? '#fde68a' : '#b45309'),
                              fontSize: '11px',
                              fontWeight: 800,
                              padding: '3px 10px',
                              borderRadius: '12px'
                            }}>
                              {order.status === 'DELIVERED' ? '✓ LIVRÉE' : order.status === 'SHIPPED' ? '🛵 EN LIVRAISON' : '⏳ PRÉPARATION'}
                            </span>
                            {Boolean(order.promoCodeUsed || (order.discountApplied && order.discountApplied > 0)) && (
                              <span style={{
                                background: isDarkMode ? 'rgba(168, 85, 247, 0.15)' : '#faf5ff',
                                color: isDarkMode ? '#c084fc' : '#7e22ce',
                                border: `1px solid ${isDarkMode ? 'rgba(168, 85, 247, 0.3)' : '#e9d5ff'}`,
                                fontSize: '11px',
                                fontWeight: 800,
                                padding: '3px 10px',
                                borderRadius: '12px',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}>
                                <span>🎟️</span>
                                <span>Code promo {order.promoCodeUsed || 'appliqué'} (Points non cumulables)</span>
                              </span>
                            )}
                          </div>
                          <span style={{ fontSize: '12px', color: isDarkMode ? '#a1a1aa' : '#71717a', marginTop: '4px', display: 'block' }}>
                            Passée le {new Date(order.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })} · Destination : <strong style={{ color: isDarkMode ? '#ffffff' : '#09090b' }}>{order.shippingAddress?.city || 'Cotonou'}</strong> ({order.shippingAddress?.country || 'Bénin'})
                          </span>
                        </div>

                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '20px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b' }}>
                            {formatPrice(convertPrice(order.total, currency), currency)}
                          </div>
                          <span style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 700 }}>
                            ✓ Paiement Sécurisé Validé
                          </span>
                        </div>
                      </div>

                      {/* REAL-TIME RADAR TRACKING BOX */}
                      <div style={{
                        background: isDarkMode ? '#18181b' : 'linear-gradient(145deg, #f8fafc, #f1f5f9)',
                        border: `1.5px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
                        borderRadius: '20px',
                        padding: '20px 24px',
                        marginBottom: '24px'
                      }}>
                        
                        {/* Radar Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              background: '#22c55e',
                              color: '#fff',
                              fontSize: '12px',
                              boxShadow: '0 0 10px rgba(34, 197, 94, 0.6)'
                            }}>
                              📍
                            </span>
                            <strong style={{ fontSize: '13.5px', color: isDarkMode ? '#ffffff' : '#0f172a', fontWeight: 900 }}>
                              Où est votre colis en ce moment ?
                            </strong>
                          </div>

                          <div style={{
                            background: isDarkMode ? '#27272a' : '#09090b',
                            color: '#38bdf8',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            padding: '4px 12px',
                            borderRadius: '20px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <span>🛰️</span>
                            <span>{activeLocation}</span>
                          </div>
                        </div>

                        {/* Live Message from Merchant */}
                        <div style={{
                          background: isDarkMode ? '#27272a' : '#ffffff',
                          border: `1px solid ${isDarkMode ? '#3f3f46' : '#e2e8f0'}`,
                          borderRadius: '14px',
                          padding: '12px 18px',
                          fontSize: '13px',
                          color: isDarkMode ? '#e4e4e7' : '#334155',
                          fontWeight: 600,
                          marginBottom: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px'
                        }}>
                          <span style={{ fontSize: '16px' }}>💬</span>
                          <span><strong>Info direct boutique :</strong> {activeStatusText}</span>
                        </div>

                        {/* 4-Step Interactive Pipeline */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', position: 'relative', marginTop: '10px' }}>
                          {[
                            { num: 1, title: '1. Validée', desc: 'Reçue', icon: '📝' },
                            { num: 2, title: '2. Préparation', desc: 'Entrepôt', icon: '📦' },
                            { num: 3, title: '3. En Route', desc: 'Coursier Express', icon: '🛵' },
                            { num: 4, title: '4. Livrée', desc: 'Remis en main', icon: '✨' }
                          ].map((stepItem) => {
                            const isDone = currentStep >= stepItem.num;
                            const isCurrent = currentStep === stepItem.num;

                            return (
                              <div key={stepItem.num} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '50%',
                                  background: isDone ? (isDarkMode ? '#38bdf8' : '#09090b') : (isDarkMode ? '#27272a' : '#e2e8f0'),
                                  color: isDone ? (isDarkMode ? '#09090b' : '#ffffff') : '#94a3b8',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '14px',
                                  fontWeight: 800,
                                  marginBottom: '8px',
                                  boxShadow: isCurrent ? '0 0 0 4px rgba(2, 132, 199, 0.3)' : 'none',
                                  border: isCurrent ? '2px solid #0284c7' : 'none',
                                  transition: 'all 0.3s'
                                }}>
                                  {isDone ? stepItem.icon : stepItem.num}
                                </div>
                                <span style={{ fontSize: '12px', fontWeight: isDone ? 800 : 600, color: isDone ? (isDarkMode ? '#ffffff' : '#09090b') : (isDarkMode ? '#71717a' : '#94a3b8') }}>
                                  {stepItem.title}
                                </span>
                                <span style={{ fontSize: '10.5px', color: isDarkMode ? '#a1a1aa' : '#64748b', marginTop: '2px' }}>
                                  {stepItem.desc}
                                </span>
                              </div>
                            );
                          })}
                        </div>

                        {/* Courier & Time Information bar */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '18px', paddingTop: '14px', borderTop: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`, fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isDarkMode ? '#a1a1aa' : '#475569' }}>
                            <span>🛵</span>
                            <span>Coursier : <strong style={{ color: isDarkMode ? '#ffffff' : '#09090b' }}>{order.carrierName || 'Coursier Express Aymard'}</strong></span>
                            {order.carrierPhone && (
                              <span style={{ color: '#38bdf8', fontWeight: 700 }}>({order.carrierPhone})</span>
                            )}
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: isDarkMode ? '#a1a1aa' : '#475569' }}>
                            <span>⏰</span>
                            <span>Arrivée estimée : <strong style={{ color: '#16a34a' }}>{order.estimatedDeliveryDate || 'Aujourd\'hui ou sous 24h'}</strong></span>
                          </div>
                        </div>

                      </div>

                      {/* Order Items List */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px' }}>
                        {order.items.map((item, idx) => {
                          const itemReview = (reviews || []).find(r => (r.orderId === order.id || r.orderNumber === order.orderNumber) && r.productId === item.product?.id) 
                            || (reviews || []).find(r => r.customerEmail?.toLowerCase() === user?.email?.toLowerCase() && r.productId === item.product?.id);

                          return (
                            <div key={idx} style={{ background: isDarkMode ? '#18181b' : '#fafafa', padding: '16px 20px', borderRadius: '18px', border: `1px solid ${isDarkMode ? '#27272a' : '#f4f4f5'}` }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                  <img 
                                    src={item.product?.images?.[0] || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=200'} 
                                    alt={item.product?.name_fr || 'Product'} 
                                    style={{ width: '56px', height: '56px', borderRadius: '12px', objectFit: 'cover' }} 
                                  />
                                  <div>
                                    <h4 style={{ fontSize: '14px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 2px 0' }}>
                                      {item.product?.name_fr || 'Article Aymard Store'}
                                    </h4>
                                    <div style={{ fontSize: '12px', color: isDarkMode ? '#a1a1aa' : '#71717a' }}>
                                      Quantité : <strong style={{ color: isDarkMode ? '#ffffff' : '#09090b' }}>{item.quantity}</strong> {item.size ? `· Pointure / Taille : ${item.size}` : ''}
                                    </div>
                                  </div>
                                </div>

                                <div style={{ fontSize: '15px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b' }}>
                                  {formatPrice(convertPrice((item.product?.price || 0) * item.quantity, currency), currency)}
                                </div>
                              </div>

                              {/* Customer Review Action Row */}
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '12px', paddingTop: '10px', borderTop: `1px dashed ${isDarkMode ? '#27272a' : '#e4e4e7'}`, flexWrap: 'wrap', gap: '10px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
                                  <span>🛡️ Achat vérifié</span>
                                  <span>·</span>
                                  <span style={{ color: '#f59e0b', fontWeight: 800 }}>+50 Pts VIP par avis</span>
                                </div>

                                {itemReview ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', padding: '4px 10px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                      <span>✓ Avis déposé</span>
                                      <span>({'★'.repeat(itemReview.rating)})</span>
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => openReviewModal(item.product, order, itemReview)}
                                      style={{
                                        background: isDarkMode ? '#27272a' : '#ffffff',
                                        border: `1px solid ${isDarkMode ? '#3f3f46' : '#cbd5e1'}`,
                                        color: isDarkMode ? '#e4e4e7' : '#0f172a',
                                        padding: '4px 12px',
                                        borderRadius: '20px',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        cursor: 'pointer'
                                      }}
                                    >
                                      Modifier mon avis
                                    </button>
                                  </div>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openReviewModal(item.product, order)}
                                    style={{
                                      background: 'linear-gradient(135deg, #09090b 0%, #1e293b 100%)',
                                      color: '#facc15',
                                      border: '1px solid #facc15',
                                      padding: '6px 14px',
                                      borderRadius: '20px',
                                      fontSize: '12px',
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    <span>⭐</span>
                                    <span>Donner mon avis (+50 Pts VIP)</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Order Actions: REAL PDF DOWNLOAD + LIVE TRACKING MODAL */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDarkMode ? '#18181b' : '#f4f4f5', padding: '16px 20px', borderRadius: '16px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: isDarkMode ? '#a1a1aa' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>N° Suivi Colis</div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: isDarkMode ? '#38bdf8' : '#09090b', letterSpacing: '0.8px' }}>
                            {order.trackingNumber || 'BJ-EXP-9948201'}
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                          <button
                            onClick={() => setTrackingModalOrder(order)}
                            style={{
                              background: '#0284c7',
                              color: '#ffffff',
                              border: 'none',
                              borderRadius: '30px',
                              padding: '11px 20px',
                              fontSize: '12.5px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                              boxShadow: '0 4px 12px rgba(2,132,199,0.3)'
                            }}
                          >
                            <span>🛰️</span>
                            <span>Suivre ce colis en direct</span>
                          </button>

                          <button
                            onClick={() => handleDownloadInvoice(order)}
                            style={{
                              background: isDarkMode ? '#27272a' : '#09090b',
                              color: '#ffffff',
                              border: `1px solid ${isDarkMode ? '#3f3f46' : 'none'}`,
                              borderRadius: '30px',
                              padding: '11px 20px',
                              fontSize: '12.5px',
                              fontWeight: 800,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                            }}
                          >
                            <span>📥</span>
                            <span>Télécharger Facture PDF</span>
                          </button>

                          <button
                            onClick={() => setPreviewOrder(order)}
                            style={{
                              background: isDarkMode ? '#18181b' : '#ffffff',
                              color: isDarkMode ? '#ffffff' : '#09090b',
                              border: `1px solid ${isDarkMode ? '#3f3f46' : '#e4e4e7'}`,
                              borderRadius: '30px',
                              padding: '11px 18px',
                              fontSize: '12.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Aperçu Facture
                          </button>
                        </div>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}

            {/* -------------------- TAB 2: MON PANIER -------------------- */}
            {activeTab === 'cart' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0, letterSpacing: '-0.5px' }}>
                    Mon Panier VIP ({totalCartCount} articles)
                  </h2>
                  <p style={{ fontSize: '13.5px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '4px 0 0 0' }}>
                    Finalisez vos achats en toute sécurité avec notre garantie d&apos;authenticité 100%.
                  </p>
                </div>

                {cart.length === 0 ? (
                  <div style={{ background: isDarkMode ? '#121215' : '#ffffff', borderRadius: '24px', padding: '60px 20px', textAlign: 'center', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}` }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '16px' }}>🛍️</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 8px 0' }}>Votre panier est actuellement vide</h3>
                    <p style={{ color: isDarkMode ? '#a1a1aa' : '#71717a', fontSize: '13px', marginBottom: '24px' }}>Découvrez nos dernières sélections de sneakers et vêtements streetwear.</p>
                    <Link href="/products" style={{ background: isDarkMode ? '#27272a' : '#09090b', color: '#ffffff', border: isDarkMode ? '1px solid #3f3f46' : 'none', padding: '12px 28px', borderRadius: '30px', textDecoration: 'none', fontWeight: 800, fontSize: '13px' }}>
                      Explorer le Catalogue ➔
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {cart.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: isDarkMode ? '#121215' : '#ffffff', borderRadius: '20px', padding: '16px 20px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}` }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <img src={item.product.images[0]} alt={item.product.name_fr} style={{ width: '60px', height: '60px', borderRadius: '12px', objectFit: 'cover' }} />
                            <div>
                              <h4 style={{ fontSize: '14px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 4px 0' }}>{item.product.name_fr}</h4>
                              <div style={{ fontSize: '12px', color: isDarkMode ? '#a1a1aa' : '#71717a' }}>
                                {item.size ? `Pointure : ${item.size} · ` : ''} Prix : <strong style={{ color: isDarkMode ? '#ffffff' : '#09090b' }}>{formatPrice(convertPrice(item.product.price, currency), currency)}</strong>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', background: isDarkMode ? '#27272a' : '#f4f4f5', borderRadius: '20px', padding: '4px 10px' }}>
                              <button onClick={() => updateCartQuantity(item.product.id, Math.max(1, item.quantity - 1), item.color, item.size)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 800, color: isDarkMode ? '#fff' : '#09090b' }}>-</button>
                              <span style={{ padding: '0 10px', fontSize: '13px', fontWeight: 800, color: isDarkMode ? '#fff' : '#09090b' }}>{item.quantity}</span>
                              <button onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.color, item.size)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 800, color: isDarkMode ? '#fff' : '#09090b' }}>+</button>
                            </div>
                            <button onClick={() => removeFromCart(item.product.id, item.size)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#ef4444', fontSize: '16px' }}>✕</button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div style={{ background: isDarkMode ? '#121215' : '#ffffff', borderRadius: '24px', padding: '26px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, height: 'fit-content' }}>
                      <h3 style={{ fontSize: '16px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 16px 0' }}>Récapitulatif Panier</h3>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: isDarkMode ? '#a1a1aa' : '#71717a', marginBottom: '10px' }}>
                        <span>Sous-total</span>
                        <span style={{ fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b' }}>{formatPrice(convertPrice(cartSubtotal, currency), currency)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: isDarkMode ? '#a1a1aa' : '#71717a', marginBottom: '16px' }}>
                        <span>Livraison VIP</span>
                        <span style={{ fontWeight: 800, color: '#16a34a' }}>OFFERTE</span>
                      </div>
                      <div style={{ height: '1px', background: isDarkMode ? '#27272a' : '#f4f4f5', margin: '14px 0' }} />
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', marginBottom: '22px' }}>
                        <span>Total TTC</span>
                        <span style={{ color: isDarkMode ? '#facc15' : '#09090b' }}>{formatPrice(convertPrice(cartSubtotal, currency), currency)}</span>
                      </div>
                      <Link href="/cart" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '14px', borderRadius: '30px', background: '#09090b', color: '#ffffff', fontWeight: 800, fontSize: '13px', textDecoration: 'none' }}>
                        Procéder au Paiement ➔
                      </Link>
                    </div>

                  </div>
                )}
              </div>
            )}

            {/* -------------------- TAB 3: FAVORIS -------------------- */}
            {activeTab === 'wishlist' && (
              <div>
                <div style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0, letterSpacing: '-0.5px' }}>
                    Mes Favoris
                  </h2>
                  <p style={{ fontSize: '13.5px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '4px 0 0 0' }}>
                    Vos articles sauvegardés pour vos prochains achats sur Aymard Store.
                  </p>
                </div>

                {favoriteProducts.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: isDarkMode ? '#121215' : '#ffffff',
                    borderRadius: '24px',
                    border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`
                  }}>
                    <div style={{ fontSize: '48px', marginBottom: '14px' }}>❤️</div>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 8px 0' }}>
                      Aucun article dans vos favoris
                    </h3>
                    <p style={{ fontSize: '13.5px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '0 0 24px 0', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
                      Explorez notre catalogue exclusif de sneakers et vêtements et cliquez sur le cœur pour les ajouter à vos favoris.
                    </p>
                    <Link
                      href="/products"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '12px 28px',
                        background: '#09090b',
                        color: '#ffffff',
                        borderRadius: '30px',
                        fontWeight: 800,
                        fontSize: '13px',
                        textDecoration: 'none'
                      }}
                    >
                      <span>Découvrir la boutique</span>
                      <span>➔</span>
                    </Link>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                    {favoriteProducts.map(p => (
                      <div key={p.id} style={{ background: isDarkMode ? '#121215' : '#ffffff', borderRadius: '20px', padding: '16px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, display: 'flex', flexDirection: 'column' }}>
                        <div style={{ height: '170px', borderRadius: '12px', overflow: 'hidden', marginBottom: '14px' }}>
                          <img src={p.images[0]} alt={p.name_fr} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <h3 style={{ fontSize: '13.5px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 6px 0' }}>{p.name_fr}</h3>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', marginBottom: '14px' }}>
                          {formatPrice(convertPrice(p.price, currency), currency)}
                        </div>
                        <button
                          onClick={() => {
                            addToCart(p, 1);
                            showToast('🛍️ Article transféré vers votre panier !');
                          }}
                          style={{
                            marginTop: 'auto',
                            width: '100%',
                            padding: '11px',
                            background: isDarkMode ? '#27272a' : '#09090b',
                            color: '#ffffff',
                            border: isDarkMode ? '1px solid #3f3f46' : 'none',
                            borderRadius: '30px',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Ajouter au Panier
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* -------------------- TAB 4: ADRESSES DE LIVRAISON -------------------- */}
            {activeTab === 'addresses' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0, letterSpacing: '-0.5px' }}>
                      Carnet d&apos;Adresses
                    </h2>
                    <p style={{ fontSize: '13.5px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '4px 0 0 0' }}>
                      Adresses enregistrées pour vos livraisons par coursier ou transporteur.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowAddressModal(true)}
                    style={{ background: isDarkMode ? '#27272a' : '#09090b', color: '#ffffff', border: isDarkMode ? '1px solid #3f3f46' : 'none', borderRadius: '30px', padding: '11px 22px', fontWeight: 800, fontSize: '12.5px', cursor: 'pointer' }}
                  >
                    + Ajouter une Adresse
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                  {activeUser.savedAddresses?.map(addr => (
                    <div key={addr.id} style={{ background: isDarkMode ? '#121215' : '#ffffff', borderRadius: '20px', padding: '24px', border: addr.isDefault ? (isDarkMode ? '2px solid #38bdf8' : '2px solid #09090b') : `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <h3 style={{ fontSize: '15px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0 }}>{addr.label}</h3>
                        {addr.isDefault && (
                          <span style={{ background: isDarkMode ? '#38bdf8' : '#09090b', color: isDarkMode ? '#09090b' : '#ffffff', fontSize: '10px', fontWeight: 800, padding: '3px 8px', borderRadius: '10px' }}>PAR DÉFAUT</span>
                        )}
                      </div>
                      <p style={{ fontSize: '13.5px', color: isDarkMode ? '#ffffff' : '#09090b', fontWeight: 700, margin: '0 0 4px 0' }}>{addr.fullName}</p>
                      <p style={{ fontSize: '13px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '0 0 4px 0' }}>{addr.street}</p>
                      <p style={{ fontSize: '13px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '0 0 8px 0' }}>{addr.city}, {addr.country}</p>
                      <p style={{ fontSize: '12px', color: '#0284c7', margin: 0, fontWeight: 700 }}>Tél : {addr.phone}</p>
                    </div>
                  ))}
                </div>

                {/* Add Address Modal */}
                {showAddressModal && (
                  <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }}>
                    <div style={{ background: '#ffffff', borderRadius: '24px', padding: '32px', maxWidth: '480px', width: '100%', boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Nouvelle Adresse</h3>
                        <button onClick={() => setShowAddressModal(false)} style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer' }}>✕</button>
                      </div>
                      
                      <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#71717a', marginBottom: '4px', textTransform: 'uppercase' }}>Pays</label>
                          <select 
                            value={newAddrCountry} 
                            onChange={e => setNewAddrCountry(e.target.value as any)} 
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e4e4e7', fontSize: '13px' }}
                          >
                            <option value="benin">🇧🇯 Bénin</option>
                            <option value="france">🇫🇷 France</option>
                            <option value="belgique">🇧🇪 Belgique</option>
                          </select>
                        </div>

                        <input type="text" placeholder="Intitulé (ex: Domicile, Bureau)" value={newAddrLabel} onChange={e => setNewAddrLabel(e.target.value)} required style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e4e4e7', fontSize: '13px' }} />
                        <input type="text" placeholder="Nom complet du destinataire" value={newAddrFullName} onChange={e => setNewAddrFullName(e.target.value)} required style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e4e4e7', fontSize: '13px' }} />
                        <input type="text" placeholder="Adresse / Quartier / Rue" value={newAddrStreet} onChange={e => setNewAddrStreet(e.target.value)} required style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e4e4e7', fontSize: '13px' }} />
                        
                        {/* Autocomplete City Input */}
                        <div style={{ position: 'relative' }}>
                          <input 
                            type="text" 
                            placeholder="Ville (Tapez pour voir les suggestions)" 
                            value={newAddrCity} 
                            onFocus={() => setShowCitySuggestions(true)}
                            onChange={e => {
                              setNewAddrCity(e.target.value);
                              setShowCitySuggestions(true);
                            }} 
                            required 
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #e4e4e7', fontSize: '13px', boxSizing: 'border-box' }} 
                          />

                          {showCitySuggestions && citySuggestions.length > 0 && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000, background: '#fff', border: '1px solid #e4e4e7', borderRadius: '10px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', maxHeight: '180px', overflowY: 'auto', padding: '4px', marginTop: '2px' }}>
                              {citySuggestions.map((c, i) => (
                                <div
                                  key={c.name + i}
                                  onClick={() => {
                                    setNewAddrCity(c.name);
                                    setShowCitySuggestions(false);
                                  }}
                                  style={{ padding: '8px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12.5px' }}
                                  onMouseEnter={e => e.currentTarget.style.backgroundColor = '#f4f4f5'}
                                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                >
                                  <strong>{c.name}</strong> <span style={{ fontSize: '11px', color: '#71717a' }}>({c.departmentOrRegion})</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        <input type="tel" placeholder="Numéro de téléphone" value={newAddrPhone} onChange={e => setNewAddrPhone(e.target.value)} required style={{ padding: '10px 14px', borderRadius: '10px', border: '1px solid #e4e4e7', fontSize: '13px' }} />
                        <button type="submit" style={{ padding: '12px', background: '#09090b', color: '#ffffff', borderRadius: '25px', border: 'none', fontWeight: 800, cursor: 'pointer', marginTop: '8px' }}>
                          Enregistrer l&apos;Adresse
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* -------------------- TAB 5: CODES PROMO VIP -------------------- */}
            {activeTab === 'coupons' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div>
                  <h2 style={{ fontSize: '24px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0, letterSpacing: '-0.5px' }}>
                    Codes &amp; Privilèges VIP
                  </h2>
                  <p style={{ fontSize: '13.5px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '4px 0 0 0' }}>
                    Convertissez vos points fidélité en bons d&apos;achat déductibles immédiatement ou appliquez les offres de la boutique.
                  </p>
                </div>

                {/* Loyalty Points Conversion Box in Tab 5 */}
                <div style={{
                  background: isDarkMode ? 'linear-gradient(135deg, #18181b, #27272a)' : 'linear-gradient(135deg, #09090b, #18181b)',
                  borderRadius: '24px',
                  padding: '26px 30px',
                  color: '#ffffff',
                  border: isDarkMode ? '1.5px solid #facc15' : '1.5px solid #facc15',
                  boxShadow: '0 12px 32px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: '28px' }}>★</span>
                      <div>
                        <h3 style={{ fontSize: '18px', fontWeight: 900, color: '#facc15', margin: 0 }}>
                          Solde Fidélité Actuel : {availableLoyaltyPoints} Points
                        </h3>
                        <p style={{ fontSize: '12.5px', color: '#cbd5e1', margin: '3px 0 0 0' }}>
                          Valeur totale déductible : <strong style={{ color: '#ffffff' }}>~{formatPrice(convertPrice((availableLoyaltyPoints / 100) * 5, currency), currency)}</strong>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowLoyaltyModal(true)}
                      style={{
                        background: 'rgba(255,255,255,0.12)',
                        color: '#ffffff',
                        border: '1px solid rgba(255,255,255,0.25)',
                        borderRadius: '20px',
                        padding: '6px 16px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      ℹ️ Guide &amp; Règles Fidélité
                    </button>
                  </div>

                  {/* Clarification Rule on Points Conversion */}
                  <div style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    borderRadius: '14px',
                    padding: '12px 16px',
                    fontSize: '12px',
                    color: '#e2e8f0',
                    lineHeight: '1.5',
                    marginBottom: '18px'
                  }}>
                    💡 <strong>Règle de conversion :</strong> Lorsque vous générez votre code promo, l&apos;intégralité de vos points fidélité disponibles ({availableLoyaltyPoints} pts) est transformée en bon d&apos;achat utilisable au panier, et votre solde de points sera remis à <strong>0 point</strong>.
                  </div>

                  {/* Actions */}
                  {availableLoyaltyPoints > 0 ? (
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <button
                        type="button"
                        onClick={() => handleConvertPointsToPromo(availableLoyaltyPoints)}
                        style={{
                          background: 'linear-gradient(135deg, #facc15, #eab308)',
                          color: '#09090b',
                          border: 'none',
                          borderRadius: '16px',
                          padding: '14px 26px',
                          fontSize: '13.5px',
                          fontWeight: 900,
                          cursor: 'pointer',
                          boxShadow: '0 6px 20px rgba(250, 204, 21, 0.4)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }}
                      >
                        <span>🚀</span>
                        <span>Convertir mes {availableLoyaltyPoints} Points en Code Promo (-{formatPrice(convertPrice((availableLoyaltyPoints / 100) * 5, currency), currency)})</span>
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '8px 0', fontSize: '13px', color: '#a1a1aa' }}>
                      ✓ Vous avez converti tous vos points fidélité. Votre solde est à <strong>0 point</strong>. Vos codes générés sont disponibles ci-dessous.
                    </div>
                  )}

                  {/* Newly Generated Promo Display in Tab 5 */}
                  {newlyGeneratedPromo && (
                    <div style={{
                      marginTop: '18px',
                      background: 'rgba(250, 204, 21, 0.15)',
                      border: '1.5px solid #facc15',
                      borderRadius: '16px',
                      padding: '14px 20px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      flexWrap: 'wrap',
                      gap: '12px'
                    }}>
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', color: '#facc15' }}>
                          NOUVEAU BON DE RÉDUCTION DÉBLOQUÉ
                        </span>
                        <div style={{ fontSize: '16px', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                          Code : <code style={{ color: '#facc15', background: '#09090b', padding: '2px 8px', borderRadius: '6px' }}>{newlyGeneratedPromo.code}</code> (-{formatPrice(convertPrice(newlyGeneratedPromo.discountAmount, currency), currency)})
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== 'undefined') navigator.clipboard.writeText(newlyGeneratedPromo.code);
                            showToast(`📋 Code ${newlyGeneratedPromo.code} copié !`);
                          }}
                          style={{
                            background: 'rgba(255,255,255,0.2)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '14px',
                            fontSize: '12px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Copier
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (typeof navigator !== 'undefined') navigator.clipboard.writeText(newlyGeneratedPromo.code);
                            setActiveTab('cart');
                            showToast(`🛒 Code ${newlyGeneratedPromo.code} prêt à être collé dans votre panier.`);
                          }}
                          style={{
                            background: '#facc15',
                            color: '#09090b',
                            border: 'none',
                            padding: '8px 18px',
                            borderRadius: '14px',
                            fontSize: '12px',
                            fontWeight: 900,
                            cursor: 'pointer'
                          }}
                        >
                          Appliquer au Panier ➔
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px' }}>
                  {promoCodes.map(p => (
                    <div key={p.code} style={{ background: isDarkMode ? '#18181b' : '#ffffff', borderRadius: '20px', padding: '24px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                      <span style={{ fontSize: '10px', fontWeight: 900, background: isDarkMode ? '#854d0e' : '#fef08a', color: isDarkMode ? '#fef08a' : '#854d0e', padding: '3px 8px', borderRadius: '6px' }}>
                        OFFRE OFFICIELLE
                      </span>
                      <h3 style={{ fontSize: '22px', fontWeight: 900, margin: '12px 0 4px 0', color: isDarkMode ? '#ffffff' : '#09090b' }}>
                        {p.type === 'percent' ? `-${p.value}% DE REMISE` : `-${p.value}€ DE REMISE`}
                      </h3>
                      <p style={{ fontSize: '12.5px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '0 0 16px 0' }}>{p.description || 'Remise directe dans votre panier.'}</p>
                      
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: isDarkMode ? '#27272a' : '#f4f4f5', padding: '8px 14px', borderRadius: '12px' }}>
                        <code style={{ fontSize: '14px', fontWeight: 800, color: isDarkMode ? '#facc15' : '#09090b' }}>{p.code}</code>
                        <button
                          onClick={() => {
                            if (typeof navigator !== 'undefined') navigator.clipboard.writeText(p.code);
                            showToast(`📋 Code ${p.code} copié dans le presse-papier !`);
                          }}
                          style={{
                            background: isDarkMode ? '#18181b' : '#ffffff',
                            color: isDarkMode ? '#ffffff' : '#09090b',
                            border: `1px solid ${isDarkMode ? '#3f3f46' : '#e4e4e7'}`,
                            padding: '6px 14px',
                            borderRadius: '10px',
                            fontSize: '11.5px',
                            fontWeight: 800,
                            cursor: 'pointer'
                          }}
                        >
                          Copier
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* -------------------- TAB 5.5: AFFILIATION & PROGRAMME DE PARRAINAGE -------------------- */}
            {activeTab === 'affiliation' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                {/* Header */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0, letterSpacing: '-0.5px' }}>
                      Affiliation
                    </h2>
                    <span style={{
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 900,
                      padding: '3px 10px',
                      borderRadius: '20px',
                      letterSpacing: '0.5px'
                    }}>
                      10% COMMISSION POINTS
                    </span>
                  </div>
                  <p style={{ fontSize: '13.5px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '4px 0 0 0' }}>
                    Recommandez Aymard Store et gagnez 10% en points de fidélité sur chaque commande payée par vos filleuls.
                  </p>
                </div>

                {/* Card: Votre lien d'affiliation */}
                <div style={{
                  background: isDarkMode ? '#121215' : '#ffffff',
                  borderRadius: '24px',
                  padding: '24px 28px',
                  border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                    <div>
                      <h3 style={{ fontSize: '16px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🤝</span> Votre lien d&apos;affiliation
                      </h3>
                      <p style={{ fontSize: '12.5px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '4px 0 0 0' }}>
                        Gagnez 10% en points sur chaque commande de vos filleuls (Barème universel : 1 € = 1 PT · 1 000 FCFA = 1 PT).
                      </p>
                    </div>
                    <span style={{ fontSize: '11px', fontWeight: 800, background: isDarkMode ? '#1f2937' : '#f1f5f9', color: isDarkMode ? '#93c5fd' : '#1e40af', padding: '4px 10px', borderRadius: '10px' }}>
                      Code : <strong style={{ letterSpacing: '1px' }}>{userRefCode}</strong>
                    </span>
                  </div>

                  {/* Referral Link Copy Field + Actions */}
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: isDarkMode ? '#18181b' : '#f8fafc',
                    border: `1px solid ${isDarkMode ? '#27272a' : '#cbd5e1'}`,
                    padding: '8px 12px',
                    borderRadius: '16px',
                    flexWrap: 'wrap'
                  }}>
                    <input
                      type="text"
                      readOnly
                      value={typeof window !== 'undefined' ? `${window.location.origin}/?ref=${userRefCode}` : `https://aymardstore.com/?ref=${userRefCode}`}
                      style={{
                        flex: 1,
                        minWidth: '220px',
                        background: 'transparent',
                        border: 'none',
                        color: isDarkMode ? '#ffffff' : '#09090b',
                        fontSize: '13px',
                        fontWeight: 700,
                        fontFamily: 'monospace',
                        outline: 'none'
                      }}
                    />

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const link = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${userRefCode}` : `https://aymardstore.com/?ref=${userRefCode}`;
                          if (typeof navigator !== 'undefined') navigator.clipboard.writeText(link);
                          showToast(`📋 Lien d'affiliation copié : ${link}`);
                        }}
                        style={{
                          background: isDarkMode ? '#27272a' : '#09090b',
                          color: '#ffffff',
                          border: isDarkMode ? '1px solid #3f3f46' : 'none',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px'
                        }}
                      >
                        <span>📋</span>
                        <span>Copier</span>
                      </button>

                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Salut ! Découvre Aymard Store, la boutique de mode & sneakers de référence. Profite des meilleures offres ici : ${typeof window !== 'undefined' ? window.location.origin : 'https://aymardstore.com'}/?ref=${userRefCode}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#25D366',
                          color: '#ffffff',
                          textDecoration: 'none',
                          padding: '8px 16px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          boxShadow: '0 2px 8px rgba(37, 211, 102, 0.3)'
                        }}
                      >
                        <span>💬</span>
                        <span>WhatsApp</span>
                      </a>
                    </div>
                  </div>
                </div>

                {/* 4 Stat Cards (EasyAfrik inspired layout) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                  
                  {/* Stat 1: Clics sur le lien */}
                  <div style={{ background: isDarkMode ? '#121215' : '#ffffff', padding: '20px', borderRadius: '20px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Clics sur le lien
                      </span>
                      <span style={{ fontSize: '16px' }}>🎯</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b' }}>
                      {referralClicks}
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Visiteurs uniques attirés</span>
                  </div>

                  {/* Stat 2: Inscriptions */}
                  <div style={{ background: isDarkMode ? '#121215' : '#ffffff', padding: '20px', borderRadius: '20px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Inscriptions
                      </span>
                      <span style={{ fontSize: '16px' }}>👥</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#3b82f6' }}>
                      {referralSignups}
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Filleuls enregistrés</span>
                  </div>

                  {/* Stat 3: Commandes générées */}
                  <div style={{ background: isDarkMode ? '#121215' : '#ffffff', padding: '20px', borderRadius: '20px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Commandes générées
                      </span>
                      <span style={{ fontSize: '16px' }}>🛍️</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#10b981' }}>
                      {referralOrdersCount}
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Achats payés par vos filleuls</span>
                  </div>

                  {/* Stat 4: Total points gagnés */}
                  <div style={{ background: isDarkMode ? '#121215' : '#ffffff', padding: '20px', borderRadius: '20px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '11px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#71717a', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        Total points gagnés
                      </span>
                      <span style={{ fontSize: '16px' }}>💎</span>
                    </div>
                    <div style={{ fontSize: '26px', fontWeight: 900, color: '#f59e0b' }}>
                      {referralPointsTotal} <span style={{ fontSize: '14px', fontWeight: 700 }}>Pts</span>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>10% sur chaque commande</span>
                  </div>

                </div>

                {/* Section: Mes Récompenses & Conversion en Coupons d'Achat */}
                <div style={{
                  background: isDarkMode ? '#121215' : '#ffffff',
                  borderRadius: '24px',
                  padding: '28px',
                  border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>🎁</span> Mes Récompenses &amp; Coupons d&apos;Achat
                      </h3>
                      <p style={{ fontSize: '12.5px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '4px 0 0 0' }}>
                        Transformez instantanément vos points en bons d&apos;achat sur la boutique.
                      </p>
                    </div>

                    <span style={{ fontSize: '12px', fontWeight: 800, color: '#059669', background: 'rgba(16,185,129,0.1)', padding: '4px 12px', borderRadius: '12px' }}>
                      Paiement en Coupons d&apos;Achat
                    </span>
                  </div>

                  {/* 3 Status blocks */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '24px' }}>
                    <div style={{ background: isDarkMode ? '#18181b' : '#f8fafc', padding: '16px', borderRadius: '16px', border: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}` }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>⏳ En attente de validation</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: isDarkMode ? '#a1a1aa' : '#475569', marginTop: '4px' }}>0 Pts</div>
                    </div>
                    <div style={{ background: isDarkMode ? '#18181b' : 'rgba(245, 158, 11, 0.06)', padding: '16px', borderRadius: '16px', border: isDarkMode ? '1px solid #78350f' : '1px solid rgba(245, 158, 11, 0.25)' }}>
                      <div style={{ fontSize: '11px', color: '#b45309', fontWeight: 800, textTransform: 'uppercase' }}>✨ Points disponibles</div>
                      <div style={{ fontSize: '22px', fontWeight: 900, color: '#d97706', marginTop: '4px' }}>{availableLoyaltyPoints} Pts</div>
                    </div>
                    <div style={{ background: isDarkMode ? '#18181b' : '#f8fafc', padding: '16px', borderRadius: '16px', border: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}` }}>
                      <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>🎟️ Coupons déjà générés</div>
                      <div style={{ fontSize: '20px', fontWeight: 900, color: isDarkMode ? '#a1a1aa' : '#475569', marginTop: '4px' }}>{spentLoyaltyPoints} Pts</div>
                    </div>
                  </div>

                  {/* Strict User directive note: no cash withdrawal, only discount coupons */}
                  <div style={{
                    background: isDarkMode ? 'rgba(59, 130, 246, 0.08)' : '#eff6ff',
                    border: `1px solid ${isDarkMode ? '#1e3a8a' : '#bfdbfe'}`,
                    borderRadius: '16px',
                    padding: '14px 18px',
                    fontSize: '12.5px',
                    color: isDarkMode ? '#93c5fd' : '#1e40af',
                    lineHeight: '1.5',
                    marginBottom: '20px'
                  }}>
                    <strong>ℹ️ Fonctionnement des récompenses :</strong>
                    <br />
                    Conformément au règlement du programme de parrainage Aymard Store, nous ne procédons à aucun versement d&apos;argent liquide. Tous les points cumulés sont <strong>100% convertibles en coupons d&apos;achat déductibles</strong> de vos futures commandes (Barème universel : <strong>100 Pts = 10 € / 10 000 FCFA</strong>).
                  </div>

                  {/* Instant Coupon Converter Presets & Custom Input */}
                  <div style={{ borderTop: `1px solid ${isDarkMode ? '#27272a' : '#f1f5f9'}`, paddingTop: '20px' }}>
                    <div style={{ fontSize: '13px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', marginBottom: '12px' }}>
                      Convertir vos points en coupon d&apos;achat immédiat :
                    </div>

                    {/* Quick Presets */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                      {[
                        { pts: 50, label: '50 Pts (-5€ / -5 000 F)' },
                        { pts: 100, label: '100 Pts (-10€ / -10 000 F)' },
                        { pts: 250, label: '250 Pts (-25€ / -25 000 F)' },
                        { pts: 500, label: '500 Pts (-50€ / -50 000 F)' },
                        { pts: availableLoyaltyPoints, label: `Tout convertir (${availableLoyaltyPoints} Pts)` }
                      ].map((preset, idx) => {
                        const canAfford = preset.pts > 0 && availableLoyaltyPoints >= preset.pts;
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={!canAfford}
                            onClick={() => handleConvertPointsUniversal(preset.pts)}
                            style={{
                              padding: '10px 16px',
                              borderRadius: '12px',
                              border: canAfford ? '1px solid #f59e0b' : `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
                              background: canAfford ? (isDarkMode ? '#78350f' : '#fef3c7') : (isDarkMode ? '#18181b' : '#f8fafc'),
                              color: canAfford ? (isDarkMode ? '#fef08a' : '#92400e') : (isDarkMode ? '#52525b' : '#94a3b8'),
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: canAfford ? 'pointer' : 'not-allowed',
                              transition: 'all 0.15s ease'
                            }}
                          >
                            🎟️ {preset.label}
                          </button>
                        );
                      })}
                    </div>

                    {/* Custom points input */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      background: isDarkMode ? '#18181b' : '#f8fafc',
                      padding: '12px 16px',
                      borderRadius: '16px',
                      border: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
                      flexWrap: 'wrap'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: '1', minWidth: '200px' }}>
                        <span style={{ fontSize: '12px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
                          Montant personnalisé :
                        </span>
                        <input
                          type="number"
                          min={1}
                          max={availableLoyaltyPoints}
                          placeholder={`Max ${availableLoyaltyPoints} Pts`}
                          value={customConvertPoints}
                          onChange={(e) => setCustomConvertPoints(e.target.value)}
                          style={{
                            width: '120px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            border: `1px solid ${isDarkMode ? '#3f3f46' : '#cbd5e1'}`,
                            background: isDarkMode ? '#09090b' : '#ffffff',
                            color: isDarkMode ? '#ffffff' : '#09090b',
                            fontSize: '13px',
                            fontWeight: 800,
                            outline: 'none'
                          }}
                        />
                        <span style={{ fontSize: '12px', fontWeight: 800, color: '#f59e0b' }}>
                          = {customConvertPoints && Number(customConvertPoints) > 0 ? (
                            currency === 'FCFA' 
                              ? `-${Number(customConvertPoints) * 100} FCFA` 
                              : `-${Math.round(Number(customConvertPoints) * 0.10)} €`
                          ) : '0'}
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={!customConvertPoints || Number(customConvertPoints) <= 0 || Number(customConvertPoints) > availableLoyaltyPoints}
                        onClick={() => {
                          const pts = parseInt(String(customConvertPoints), 10);
                          if (pts > 0 && pts <= availableLoyaltyPoints) {
                            handleConvertPointsUniversal(pts);
                            setCustomConvertPoints('');
                          }
                        }}
                        style={{
                          padding: '10px 18px',
                          borderRadius: '12px',
                          background: customConvertPoints && Number(customConvertPoints) > 0 && Number(customConvertPoints) <= availableLoyaltyPoints ? '#10b981' : (isDarkMode ? '#27272a' : '#e2e8f0'),
                          color: customConvertPoints && Number(customConvertPoints) > 0 && Number(customConvertPoints) <= availableLoyaltyPoints ? '#ffffff' : (isDarkMode ? '#71717a' : '#94a3b8'),
                          border: 'none',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: customConvertPoints && Number(customConvertPoints) > 0 && Number(customConvertPoints) <= availableLoyaltyPoints ? 'pointer' : 'not-allowed'
                        }}
                      >
                        ✓ Générer mon Coupon
                      </button>
                    </div>

                    {/* Active Newly Generated Promo Box */}
                    {newlyGeneratedPromo && (
                      <div style={{
                        marginTop: '16px',
                        padding: '16px 20px',
                        background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.06))',
                        border: '1.5px solid #10b981',
                        borderRadius: '16px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        flexWrap: 'wrap',
                        gap: '12px'
                      }}>
                        <div>
                          <div style={{ fontSize: '11px', fontWeight: 900, color: '#059669', textTransform: 'uppercase' }}>
                            🎉 Votre coupon d&apos;achat est prêt &amp; activé !
                          </div>
                          <div style={{ fontSize: '18px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', fontFamily: 'monospace', marginTop: '2px' }}>
                            {newlyGeneratedPromo.code}
                          </div>
                          <div style={{ fontSize: '12px', color: '#10b981', fontWeight: 700 }}>
                            Valeur : -{formatPrice(convertPrice(newlyGeneratedPromo.discountAmount, currency), currency)} ({newlyGeneratedPromo.pointsUsed} Pts utilisés)
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (typeof navigator !== 'undefined') navigator.clipboard.writeText(newlyGeneratedPromo.code);
                              showToast(`📋 Code ${newlyGeneratedPromo.code} copié !`);
                            }}
                            style={{
                              background: '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              fontSize: '12px',
                              fontWeight: 800,
                              cursor: 'pointer'
                            }}
                          >
                            📋 Copier le code
                          </button>

                          <Link
                            href="/cart"
                            style={{
                              background: isDarkMode ? '#27272a' : '#09090b',
                              color: '#ffffff',
                              textDecoration: 'none',
                              padding: '8px 16px',
                              borderRadius: '10px',
                              fontSize: '12px',
                              fontWeight: 800,
                              display: 'inline-flex',
                              alignItems: 'center'
                            }}
                          >
                            🛒 Aller au Panier
                          </Link>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Section: Mes Filleuls */}
                <div style={{
                  background: isDarkMode ? '#121215' : '#ffffff',
                  borderRadius: '24px',
                  padding: '28px',
                  border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                }}>
                  <h3 style={{ fontSize: '18px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>👥</span> Mes Filleuls ({myReferrals.length})
                  </h3>

                  {myReferrals.length === 0 ? (
                    <div style={{
                      textAlign: 'center',
                      padding: '40px 20px',
                      background: isDarkMode ? '#18181b' : '#f8fafc',
                      borderRadius: '16px',
                      border: `1px dashed ${isDarkMode ? '#27272a' : '#cbd5e1'}`
                    }}>
                      <span style={{ fontSize: '32px' }}>🤝</span>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', marginTop: '8px' }}>
                        Personne pour l&apos;instant
                      </div>
                      <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px auto 16px auto', maxWidth: '400px' }}>
                        Partagez votre lien d&apos;affiliation auprès de vos proches et sur vos réseaux pour commencer à gagner des points et coupons d&apos;achat !
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          const link = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${userRefCode}` : `https://aymardstore.com/?ref=${userRefCode}`;
                          if (typeof navigator !== 'undefined') navigator.clipboard.writeText(link);
                          showToast(`📋 Lien d'affiliation copié : ${link}`);
                        }}
                        style={{
                          background: isDarkMode ? '#27272a' : '#09090b',
                          color: '#ffffff',
                          border: 'none',
                          padding: '10px 20px',
                          borderRadius: '20px',
                          fontSize: '12px',
                          fontWeight: 800,
                          cursor: 'pointer'
                        }}
                      >
                        📋 Copier mon lien maintenant
                      </button>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`, textAlign: 'left' }}>
                            <th style={{ padding: '10px', color: '#64748b', fontWeight: 800 }}>Filleul</th>
                            <th style={{ padding: '10px', color: '#64748b', fontWeight: 800 }}>Date d&apos;inscription</th>
                            <th style={{ padding: '10px', color: '#64748b', fontWeight: 800 }}>Commandes</th>
                            <th style={{ padding: '10px', color: '#64748b', fontWeight: 800, textAlign: 'right' }}>Points générés</th>
                          </tr>
                        </thead>
                        <tbody>
                          {myReferrals.map(ref => (
                            <tr key={ref.id} style={{ borderBottom: `1px solid ${isDarkMode ? '#1f2937' : '#f1f5f9'}` }}>
                              <td style={{ padding: '12px 10px', fontWeight: 700, color: isDarkMode ? '#ffffff' : '#09090b' }}>
                                {ref.name || ref.email}
                              </td>
                              <td style={{ padding: '12px 10px', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
                                {ref.registeredDate || 'Récemment'}
                              </td>
                              <td style={{ padding: '12px 10px', color: isDarkMode ? '#a1a1aa' : '#64748b' }}>
                                {ref.totalOrders || 0} commande(s)
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 900, color: '#10b981' }}>
                                +{ref.referralPointsEarned || 50} Pts
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Section: Journal d'Audit Transparent des Points */}
                <div style={{
                  background: isDarkMode ? '#121215' : '#ffffff',
                  borderRadius: '24px',
                  padding: '28px',
                  border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.03)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span>📜</span> Journal d&apos;Audit des Points ({userPointTransactions.length})
                      </h3>
                      <p style={{ fontSize: '12.5px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '4px 0 0 0' }}>
                        Historique chronologique et transparent de chaque point gagné ou converti.
                      </p>
                    </div>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>
                      Barème : 1 € = 1 PT · 1 000 FCFA = 1 PT
                    </span>
                  </div>

                  {userPointTransactions.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '30px', color: '#64748b', fontSize: '13px' }}>
                      Aucune transaction de points enregistrée pour le moment.
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                        <thead>
                          <tr style={{ borderBottom: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`, textAlign: 'left' }}>
                            <th style={{ padding: '10px', color: '#64748b', fontWeight: 800 }}>Date</th>
                            <th style={{ padding: '10px', color: '#64748b', fontWeight: 800 }}>Type</th>
                            <th style={{ padding: '10px', color: '#64748b', fontWeight: 800 }}>Description</th>
                            <th style={{ padding: '10px', color: '#64748b', fontWeight: 800, textAlign: 'right' }}>Points</th>
                          </tr>
                        </thead>
                        <tbody>
                          {userPointTransactions.map(tx => (
                            <tr key={tx.id} style={{ borderBottom: `1px solid ${isDarkMode ? '#1f2937' : '#f1f5f9'}` }}>
                              <td style={{ padding: '12px 10px', color: isDarkMode ? '#a1a1aa' : '#64748b', whiteSpace: 'nowrap' }}>
                                {tx.date}
                              </td>
                              <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 800,
                                  padding: '2px 8px',
                                  borderRadius: '6px',
                                  background: tx.type === 'REFERRAL_PURCHASE' ? 'rgba(16,185,129,0.15)' : tx.type === 'REFERRAL_SIGNUP' ? 'rgba(59,130,246,0.15)' : tx.type === 'CONVERSION_PROMO' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)',
                                  color: tx.type === 'REFERRAL_PURCHASE' ? '#10b981' : tx.type === 'REFERRAL_SIGNUP' ? '#3b82f6' : tx.type === 'CONVERSION_PROMO' ? '#ef4444' : '#d97706'
                                }}>
                                  {tx.type === 'REFERRAL_PURCHASE' ? 'COMMISSION 10%' : tx.type === 'REFERRAL_SIGNUP' ? 'PARRAINAGE' : tx.type === 'CONVERSION_PROMO' ? 'CONVERSION COUPON' : tx.type === 'ADMIN_GRANT' ? 'ADMIN VIP' : 'ACHAT'}
                                </span>
                              </td>
                              <td style={{ padding: '12px 10px', color: isDarkMode ? '#ffffff' : '#09090b', fontWeight: 600 }}>
                                {tx.description}
                              </td>
                              <td style={{ padding: '12px 10px', textAlign: 'right', fontWeight: 900, whiteSpace: 'nowrap', color: tx.amount > 0 ? '#10b981' : '#ef4444' }}>
                                {tx.amount > 0 ? `+${tx.amount}` : tx.amount} Pts
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

              </div>
            )}

            {/* -------------------- TAB 6: NOTIFICATIONS CLIENT VIP -------------------- */}
            {activeTab === 'notifications' && (
              <div style={{ background: isDarkMode ? '#121215' : '#ffffff', borderRadius: '24px', padding: '32px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px', borderBottom: `1px solid ${isDarkMode ? '#27272a' : '#f1f5f9'}`, paddingBottom: '16px' }}>
                  <div>
                    <h2 style={{ fontSize: '22px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span>🔔</span>
                      <span>Mes Notifications &amp; Alertes</span>
                    </h2>
                    <span style={{ fontSize: '13px', color: isDarkMode ? '#a1a1aa' : '#64748b', marginTop: '4px', display: 'block' }}>
                      Suivi de commandes, promotions exclusives et points de fidélité accordés
                    </span>
                  </div>

                  {unreadNotifsCount > 0 && (
                    <button
                      onClick={() => {
                        markAllNotificationsAsRead(user?.email);
                        showToast('✓ Toutes les notifications ont été marquées comme lues.');
                      }}
                      style={{
                        background: isDarkMode ? 'rgba(255,255,255,0.08)' : '#f1f5f9',
                        color: isDarkMode ? '#38bdf8' : '#0284c7',
                        border: 'none',
                        borderRadius: '20px',
                        padding: '8px 16px',
                        fontSize: '12px',
                        fontWeight: 800,
                        cursor: 'pointer'
                      }}
                    >
                      Tout marquer comme lu
                    </button>
                  )}
                </div>

                {userNotifications.length === 0 ? (
                  <div style={{ padding: '60px 20px', textAlign: 'center', color: isDarkMode ? '#71717a' : '#94a3b8' }}>
                    <span style={{ fontSize: '42px', display: 'block', marginBottom: '12px' }}>🔕</span>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 6px 0' }}>
                      Aucune notification pour le moment
                    </h3>
                    <p style={{ fontSize: '13px', margin: 0 }}>
                      Vous recevrez ici vos confirmations de commandes, suivis de livraison en temps réel et codes promo VIP.
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {userNotifications.map(n => (
                      <div
                        key={n.id}
                        onClick={() => !n.read && markNotificationAsRead(n.id)}
                        style={{
                          padding: '18px 20px',
                          borderRadius: '18px',
                          background: n.read ? (isDarkMode ? '#18181b' : '#fafafa') : (isDarkMode ? 'rgba(56, 189, 248, 0.08)' : 'rgba(2, 132, 199, 0.05)'),
                          border: n.read ? `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}` : '1.5px solid rgba(2, 132, 199, 0.3)',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '6px',
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            {!n.read && (
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0284c7' }} />
                            )}
                            <strong style={{ fontSize: '14.5px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b' }}>
                              {n.title}
                            </strong>
                          </div>
                          <span style={{ fontSize: '11px', color: isDarkMode ? '#a1a1aa' : '#94a3b8', fontWeight: 600 }}>
                            {n.date}
                          </span>
                        </div>

                        <p style={{ fontSize: '13px', color: isDarkMode ? '#d4d4d8' : '#475569', margin: '4px 0 6px 0', lineHeight: 1.5 }}>
                          {n.message}
                        </p>

                        {n.promoCode && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                            <span style={{ background: '#f59e0b', color: '#ffffff', fontSize: '12px', fontWeight: 900, padding: '3px 12px', borderRadius: '8px', letterSpacing: '0.5px' }}>
                              {n.promoCode}
                            </span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (typeof navigator !== 'undefined') navigator.clipboard.writeText(n.promoCode!);
                                showToast(`📋 Code ${n.promoCode} copié !`);
                              }}
                              style={{
                                background: isDarkMode ? '#27272a' : '#09090b',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '8px',
                                padding: '5px 12px',
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer'
                              }}
                            >
                              Copier le code
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* -------------------- TAB 7: MES AVIS & ÉVALUATIONS -------------------- */}
            {activeTab === 'reviews' && (
              <div style={{ background: isDarkMode ? '#121215' : '#ffffff', borderRadius: '24px', padding: '32px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
                  <div>
                    <h2 style={{ fontSize: '24px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0, letterSpacing: '-0.5px' }}>
                      Mes Avis &amp; Évaluations ({userReviews.length})
                    </h2>
                    <p style={{ fontSize: '13.5px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: '4px 0 0 0' }}>
                      Partagez votre avis sur vos achats et gagnez <strong style={{ color: '#f59e0b' }}>+50 Points VIP</strong> par retour d&apos;expérience vérifié.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('orders')}
                    style={{
                      background: isDarkMode ? '#27272a' : '#09090b',
                      color: '#ffffff',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '24px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>📦</span>
                    <span>Voir mes commandes à évaluer</span>
                  </button>
                </div>

                {userReviews.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '60px 20px',
                    background: isDarkMode ? '#18181b' : '#fafafa',
                    borderRadius: '20px',
                    border: `1px dashed ${isDarkMode ? '#27272a' : '#cbd5e1'}`
                  }}>
                    <span style={{ fontSize: '48px', display: 'block', marginBottom: '14px' }}>⭐</span>
                    <h3 style={{ fontSize: '18px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 8px 0' }}>
                      Vous n&apos;avez pas encore rédigé d&apos;avis
                    </h3>
                    <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 auto 24px auto', maxWidth: '440px' }}>
                      Vos retours permettent à toute la communauté d&apos;en savoir plus sur la qualité, la taille et le confort de nos pièces de luxe.
                    </p>
                    <button
                      type="button"
                      onClick={() => setActiveTab('orders')}
                      style={{
                        background: 'linear-gradient(135deg, #09090b 0%, #1e293b 100%)',
                        color: '#facc15',
                        border: '1px solid #facc15',
                        padding: '12px 28px',
                        borderRadius: '30px',
                        fontWeight: 800,
                        fontSize: '13px',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
                      }}
                    >
                      ⭐ Noter mes articles achetés (+50 Pts VIP) ➔
                    </button>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                    {userReviews.map((rev) => (
                      <div
                        key={rev.id}
                        style={{
                          background: isDarkMode ? '#18181b' : '#fafafa',
                          border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`,
                          borderRadius: '20px',
                          padding: '20px',
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'space-between',
                          gap: '14px'
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              {rev.productImage && (
                                <img
                                  src={rev.productImage}
                                  alt={rev.productName || 'Produit'}
                                  style={{ width: '48px', height: '48px', borderRadius: '10px', objectFit: 'cover' }}
                                />
                              )}
                              <div>
                                <strong style={{ fontSize: '13.5px', color: isDarkMode ? '#ffffff' : '#09090b', display: 'block' }}>
                                  {rev.productName || 'Article Aymard Store'}
                                </strong>
                                <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  🛡️ Achat vérifié · {rev.date}
                                </span>
                              </div>
                            </div>
                            <div style={{ color: '#f59e0b', fontSize: '14px', letterSpacing: '2px', fontWeight: 900 }}>
                              {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                            </div>
                          </div>

                          <h4 style={{ fontSize: '14px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 6px 0' }}>
                            {rev.title}
                          </h4>
                          <p style={{ fontSize: '13px', color: isDarkMode ? '#d4d4d8' : '#475569', margin: 0, lineHeight: 1.5 }}>
                            {rev.comment}
                          </p>

                          {rev.photo && (
                            <div style={{ marginTop: '12px', width: '90px', height: '90px', borderRadius: '10px', overflow: 'hidden' }}>
                              <img src={rev.photo} alt="Photo avis" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, paddingTop: '12px' }}>
                          <span style={{ fontSize: '11.5px', color: isDarkMode ? '#a1a1aa' : '#71717a' }}>
                            👍 {rev.likesCount || 0} personnes ont trouvé cet avis utile
                          </span>
                          <button
                            type="button"
                            onClick={() => deleteProductReview(rev.id)}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#ef4444',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer'
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* -------------------- TAB 8: PARAMÈTRES & SÉCURITÉ -------------------- */}
            {activeTab === 'profile' && (
              <div style={{ maxWidth: '560px', background: isDarkMode ? '#121215' : '#ffffff', borderRadius: '24px', padding: '32px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, boxShadow: '0 4px 16px rgba(0,0,0,0.02)' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 20px 0' }}>
                  Coordonnées du Profil
                </h2>
                
                <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#52525b', marginBottom: '6px', textTransform: 'uppercase' }}>Nom Complet</label>
                    <input type="text" value={profileName} onChange={e => setProfileName(e.target.value)} required style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, background: isDarkMode ? '#18181b' : '#ffffff', color: isDarkMode ? '#ffffff' : '#09090b', fontSize: '13.5px', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#52525b', marginBottom: '6px', textTransform: 'uppercase' }}>Adresse Email</label>
                    <input type="email" value={activeUser.email} disabled style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, background: isDarkMode ? '#18181b' : '#f4f4f5', color: isDarkMode ? '#71717a' : '#71717a', fontSize: '13.5px', boxSizing: 'border-box' }} />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#52525b', marginBottom: '6px', textTransform: 'uppercase' }}>Numéro de Téléphone (WhatsApp)</label>
                    <input type="tel" value={profilePhone} onChange={e => setProfilePhone(e.target.value)} placeholder="+229 01 97 36 29 06" style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, background: isDarkMode ? '#18181b' : '#ffffff', color: isDarkMode ? '#ffffff' : '#09090b', fontSize: '13.5px', boxSizing: 'border-box' }} />
                  </div>

                  {/* Marketing & Drops Alerts Preferences */}
                  <div style={{
                    background: isDarkMode ? '#18181b' : '#f8fafc',
                    border: `1px solid ${isDarkMode ? '#27272a' : '#e2e8f0'}`,
                    borderRadius: '16px',
                    padding: '16px 20px',
                    marginTop: '4px'
                  }}>
                    <h3 style={{ fontSize: '14px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>⚡</span> Alertes Nouveaux Drops &amp; Arrivages
                    </h3>
                    <p style={{ fontSize: '12px', color: isDarkMode ? '#a1a1aa' : '#64748b', margin: '0 0 12px 0', lineHeight: 1.4 }}>
                      Choisissez comment vous souhaitez être averti en avant-première des nouvelles sorties.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '13px', color: isDarkMode ? '#ffffff' : '#09090b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>💬</span> Alertes par WhatsApp (+229 / International)
                        </span>
                        <input 
                          type="checkbox" 
                          checked={profileWantWhatsapp} 
                          onChange={e => setProfileWantWhatsapp(e.target.checked)} 
                          style={{ accentColor: '#25d366', width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', fontSize: '13px', color: isDarkMode ? '#ffffff' : '#09090b' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>📧</span> Alertes par Email
                        </span>
                        <input 
                          type="checkbox" 
                          checked={profileWantEmail} 
                          onChange={e => setProfileWantEmail(e.target.checked)} 
                          style={{ accentColor: '#38bdf8', width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                      </label>
                    </div>
                  </div>

                  <button type="submit" style={{ padding: '14px', background: isDarkMode ? '#27272a' : '#09090b', color: '#ffffff', border: isDarkMode ? '1px solid #3f3f46' : 'none', borderRadius: '30px', fontWeight: 800, fontSize: '13px', cursor: 'pointer', marginTop: '10px' }}>
                    Enregistrer les Modifications
                  </button>
                </form>
              </div>
            )}

          </section>

        </div>

        </div>

      </main>

      {/* ========================================================================= */}
      {/* 3. IN-APP INVOICE PREVIEW MODAL */}
      {/* ========================================================================= */}
      {previewOrder && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 99999, padding: '20px' }} onClick={() => setPreviewOrder(null)}>
          <div style={{ background: isDarkMode ? '#18181b' : '#ffffff', borderRadius: '24px', padding: '32px', maxWidth: '640px', width: '100%', maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.35)', border: isDarkMode ? '1px solid #27272a' : 'none' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: `2px solid ${isDarkMode ? '#facc15' : '#09090b'}`, paddingBottom: '18px', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '20px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 4px 0' }}>AYMARD STORE</h3>
                <span style={{ fontSize: '11px', color: isDarkMode ? '#a1a1aa' : '#71717a', textTransform: 'uppercase' }}>Facture N° FACT-{previewOrder.orderNumber}</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => handleDownloadInvoice(previewOrder)}
                  style={{ background: isDarkMode ? '#27272a' : '#09090b', color: '#ffffff', border: isDarkMode ? '1px solid #3f3f46' : 'none', borderRadius: '20px', padding: '8px 16px', fontSize: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  🖨️ Imprimer / PDF
                </button>
                <button onClick={() => setPreviewOrder(null)} style={{ background: isDarkMode ? '#27272a' : '#f4f4f5', color: isDarkMode ? '#ffffff' : '#09090b', border: 'none', borderRadius: '50%', width: '32px', height: '32px', fontSize: '14px', fontWeight: 800, cursor: 'pointer' }}>✕</button>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', background: isDarkMode ? '#202024' : '#f8fafc', padding: '14px', borderRadius: '12px', marginBottom: '20px', fontSize: '12px', border: isDarkMode ? '1px solid #27272a' : 'none' }}>
              <div>
                <strong style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', display: 'block', marginBottom: '4px' }}>CLIENT</strong>
                <div style={{ fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b' }}>{previewOrder.shippingAddress?.fullName || activeUser.name}</div>
                <div style={{ color: isDarkMode ? '#a1a1aa' : '#334155' }}>{previewOrder.customerEmail || activeUser.email}</div>
                <div style={{ color: isDarkMode ? '#a1a1aa' : '#334155' }}>{previewOrder.shippingAddress?.phone || activeUser.phone}</div>
              </div>
              <div>
                <strong style={{ color: isDarkMode ? '#a1a1aa' : '#64748b', display: 'block', marginBottom: '4px' }}>LIVRAISON</strong>
                <div style={{ color: isDarkMode ? '#ffffff' : '#09090b' }}>{previewOrder.shippingAddress?.street}</div>
                <div style={{ color: isDarkMode ? '#a1a1aa' : '#334155' }}>{previewOrder.shippingAddress?.city}, {previewOrder.shippingAddress?.country}</div>
              </div>
            </div>

            <div style={{ border: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`, borderRadius: '12px', overflow: 'hidden', marginBottom: '20px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                <thead>
                  <tr style={{ background: '#09090b', color: '#ffffff' }}>
                    <th style={{ padding: '10px 14px', textAlign: 'left' }}>Article</th>
                    <th style={{ padding: '10px 14px', textAlign: 'center' }}>Qté</th>
                    <th style={{ padding: '10px 14px', textAlign: 'right' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {previewOrder.items.map((it, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f4f4f5' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <strong>{it.product?.name_fr}</strong>
                        {it.size && <span style={{ color: '#71717a', fontSize: '11px', display: 'block' }}>Pointure : {it.size}</span>}
                      </td>
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>{it.quantity}</td>
                      <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 800 }}>{formatPrice(convertPrice((it.product?.price || 0) * it.quantity, currency), currency)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: '#f0fdf4', borderRadius: '14px', border: '1px solid #bbf7d0' }}>
              <span style={{ fontSize: '13px', fontWeight: 800, color: '#166534' }}>Total TTC Acquitté</span>
              <span style={{ fontSize: '20px', fontWeight: 900, color: '#166534' }}>{formatPrice(convertPrice(previewOrder.total, currency), currency)}</span>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. REAL-TIME LIVE TRACKING RADAR & TIMELINE MODAL */}
      {/* ========================================================================= */}
      {trackingModalOrder && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(9, 9, 11, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setTrackingModalOrder(null);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '680px',
              maxHeight: '90vh',
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
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
              borderBottom: '1px solid #e4e4e7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#09090b',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(255,255,255,0.1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  🛰️
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                    Radar de Suivi en Direct
                  </h3>
                  <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '2px 0 0 0' }}>
                    Commande <strong style={{ color: '#38bdf8' }}>{trackingModalOrder.orderNumber}</strong> · Suivi : {trackingModalOrder.trackingNumber || 'BJ-EXP-9948201'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setTrackingModalOrder(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Current Live Location Banner */}
              <div style={{
                background: 'linear-gradient(135deg, #09090b, #18181b)',
                borderRadius: '18px',
                padding: '20px',
                color: '#ffffff',
                border: '1px solid #27272a'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '10px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block', boxShadow: '0 0 8px #22c55e' }}></span>
                    Position Actuelle du Colis
                  </span>

                  <span style={{ fontSize: '11.5px', color: '#a1a1aa' }}>
                    Destination : <strong style={{ color: '#ffffff' }}>{trackingModalOrder.shippingAddress?.city || 'Cotonou'}</strong>
                  </span>
                </div>

                <div style={{ fontSize: '18px', fontWeight: 900, color: '#ffffff', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📍</span>
                  <span>{trackingModalOrder.currentLocation || (trackingModalOrder.status === 'DELIVERED' ? 'Remis au client' : trackingModalOrder.status === 'SHIPPED' ? 'En cours d\'acheminement' : 'Entrepôt Cotonou (Haie Vive)')}</span>
                </div>

                <p style={{ fontSize: '13px', color: '#d4d4d8', margin: 0, lineHeight: '1.5' }}>
                  {trackingModalOrder.trackingStatusText || (trackingModalOrder.status === 'DELIVERED' ? 'Colis réceptionné avec succès.' : 'Votre commande est prise en charge par notre service logistique.')}
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.1)', fontSize: '12px' }}>
                  <span style={{ color: '#a1a1aa' }}>
                    🛵 Livreur : <strong style={{ color: '#ffffff' }}>{trackingModalOrder.carrierName || 'Coursier Express Aymard'}</strong>
                    {trackingModalOrder.carrierPhone && ` (${trackingModalOrder.carrierPhone})`}
                  </span>
                  <span style={{ color: '#22c55e', fontWeight: 800 }}>
                    ⏰ {trackingModalOrder.estimatedDeliveryDate || 'Aujourd\'hui ou sous 24h'}
                  </span>
                </div>
              </div>

              {/* Step-by-Step Chronological History */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#09090b', marginBottom: '14px' }}>
                  Jalons &amp; Historique d&apos;Acheminement
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingLeft: '24px', borderLeft: '2px solid #e4e4e7', marginLeft: '8px' }}>
                  
                  {/* If custom history exists */}
                  {trackingModalOrder.trackingHistory && trackingModalOrder.trackingHistory.length > 0 ? (
                    trackingModalOrder.trackingHistory.map((chk, i) => (
                      <div key={chk.id || i} style={{ position: 'relative' }}>
                        <span style={{
                          position: 'absolute',
                          left: '-31px',
                          top: '2px',
                          width: '12px',
                          height: '12px',
                          borderRadius: '50%',
                          background: i === 0 ? '#0284c7' : '#09090b',
                          border: '2px solid #ffffff',
                          boxShadow: '0 0 0 2px #e4e4e7'
                        }}></span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '8px' }}>
                          <strong style={{ fontSize: '13.5px', color: '#09090b' }}>{chk.title}</strong>
                          <span style={{ fontSize: '11.5px', color: '#71717a', fontWeight: 600 }}>{chk.timestamp}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                          📍 {chk.location}
                        </div>
                        {chk.description && (
                          <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                            {chk.description}
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '-31px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#0284c7', border: '2px solid #ffffff', boxShadow: '0 0 0 2px #e4e4e7' }}></span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <strong style={{ fontSize: '13.5px', color: '#09090b' }}>{trackingModalOrder.trackingStatusText || 'Colis en cours d\'acheminement'}</strong>
                          <span style={{ fontSize: '11.5px', color: '#71717a', fontWeight: 600 }}>En direct</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                          📍 {trackingModalOrder.currentLocation || 'Entrepôt Cotonou (Haie Vive)'}
                        </div>
                      </div>

                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '-31px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#09090b', border: '2px solid #ffffff', boxShadow: '0 0 0 2px #e4e4e7' }}></span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <strong style={{ fontSize: '13.5px', color: '#09090b' }}>Contrôle Qualité &amp; Emballage Certifié</strong>
                          <span style={{ fontSize: '11.5px', color: '#71717a', fontWeight: 600 }}>Étape Validée</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                          📍 Entrepôt Aymard Store
                        </div>
                      </div>

                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: '-31px', top: '2px', width: '12px', height: '12px', borderRadius: '50%', background: '#09090b', border: '2px solid #ffffff', boxShadow: '0 0 0 2px #e4e4e7' }}></span>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                          <strong style={{ fontSize: '13.5px', color: '#09090b' }}>Commande Validée &amp; Paiement Confirmé</strong>
                          <span style={{ fontSize: '11.5px', color: '#71717a', fontWeight: 600 }}>{new Date(trackingModalOrder.date).toLocaleDateString('fr-FR')}</span>
                        </div>
                        <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 700, marginTop: '2px' }}>
                          📍 Boutique Aymard Store
                        </div>
                      </div>
                    </>
                  )}

                </div>
              </div>

              {/* Package Content Details */}
              <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', color: '#64748b', display: 'block', marginBottom: '8px' }}>
                  Contenu du Colis ({trackingModalOrder.items.length} article{trackingModalOrder.items.length > 1 ? 's' : ''})
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {trackingModalOrder.items.map((it, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12.5px' }}>
                      <span><strong>{it.quantity}x</strong> {it.product?.name_fr} {it.size ? `(${it.size})` : ''}</span>
                      <strong style={{ color: '#09090b' }}>{formatPrice(convertPrice((it.product?.price || 0) * it.quantity, currency), currency)}</strong>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 28px',
              borderTop: '1px solid #e4e4e7',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: '#fcfcfc'
            }}>
              <button
                onClick={() => handleDownloadInvoice(trackingModalOrder)}
                style={{
                  background: '#09090b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '30px',
                  padding: '10px 20px',
                  fontSize: '12.5px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>📥</span>
                <span>Télécharger Facture PDF</span>
              </button>

              <button
                onClick={() => setTrackingModalOrder(null)}
                style={{
                  background: '#f4f4f5',
                  color: '#09090b',
                  border: '1px solid #e4e4e7',
                  borderRadius: '30px',
                  padding: '10px 22px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. LOYALTY CLUB PRIVILEGE GUIDE & POINTS EXPLANATION MODAL */}
      {/* ========================================================================= */}
      {showLoyaltyModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            backgroundColor: 'rgba(9, 9, 11, 0.75)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowLoyaltyModal(false);
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '640px',
              maxHeight: '90vh',
              backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalZoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              border: isDarkMode ? '1px solid #27272a' : 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '22px 28px',
              borderBottom: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #09090b, #18181b)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: 'rgba(250, 204, 21, 0.15)',
                  border: '1px solid rgba(250, 204, 21, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: '#facc15'
                }}>
                  ★
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                    Programme Privilège &amp; Points Fidélité
                  </h3>
                  <p style={{ fontSize: '12px', color: '#a1a1aa', margin: '2px 0 0 0' }}>
                    Fonctionnement du cumul et conversion de vos points
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowLoyaltyModal(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '34px',
                  height: '34px',
                  cursor: 'pointer',
                  fontSize: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: '24px 28px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Current Points Summary Banner */}
              <div style={{
                background: isDarkMode ? 'linear-gradient(135deg, #27272a, #1f1f23)' : 'linear-gradient(135deg, #fefce8, #fef9c3)',
                border: isDarkMode ? '1.5px solid #eab308' : '1.5px solid #fde047',
                borderRadius: '18px',
                padding: '18px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <span style={{ fontSize: '11px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8px', color: isDarkMode ? '#facc15' : '#854d0e', display: 'block' }}>
                    VOTRE SOLDE FIDÉLITÉ DISPONIBLE
                  </span>
                  <div style={{ fontSize: '26px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#713f12', marginTop: '2px' }}>
                    {availableLoyaltyPoints} Points Fidélité
                  </div>
                  <span style={{ fontSize: '12px', color: isDarkMode ? '#a1a1aa' : '#a16207', fontWeight: 700 }}>
                    Statut : {isVipMember ? '★ Membre VIP Officiel' : `Membre Privilège (${customerOrders.length}/100)`}
                  </span>
                </div>

                <div style={{ background: isDarkMode ? '#18181b' : '#ffffff', padding: '10px 16px', borderRadius: '14px', border: `1px solid ${isDarkMode ? '#3f3f46' : '#fef08a'}`, textAlign: 'right' }}>
                  <span style={{ fontSize: '11px', color: isDarkMode ? '#a1a1aa' : '#71717a', display: 'block' }}>Valeur déductible :</span>
                  <strong style={{ fontSize: '18px', color: isDarkMode ? '#4ade80' : '#16a34a', fontWeight: 900 }}>
                    ~{formatPrice(convertPrice((availableLoyaltyPoints / 100) * 5, currency), currency)}
                  </strong>
                </div>
              </div>

              {/* 💡 Guidance Callout: How to convert */}
              <div style={{
                background: isDarkMode ? '#27272a' : '#fafafa',
                border: `1.5px solid ${isDarkMode ? '#3f3f46' : '#e4e4e7'}`,
                borderRadius: '18px',
                padding: '20px 22px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px'
              }}>
                <div style={{ maxWidth: '360px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: '18px' }}>🎟️</span>
                    <h4 style={{ fontSize: '14px', fontWeight: 900, color: isDarkMode ? '#ffffff' : '#09090b', margin: 0 }}>
                      Transformer vos points en bon d&apos;achat
                    </h4>
                  </div>
                  <p style={{ fontSize: '12.5px', color: isDarkMode ? '#a1a1aa' : '#71717a', margin: 0, lineHeight: '1.4' }}>
                    La conversion de vos points s&apos;effectue directement dans l&apos;onglet <strong>« Codes Privilèges »</strong>. Votre bon sera créé en 1 clic et prêt pour votre panier.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowLoyaltyModal(false);
                    setActiveTab('coupons');
                  }}
                  style={{
                    background: '#facc15',
                    color: '#09090b',
                    border: 'none',
                    borderRadius: '14px',
                    padding: '12px 20px',
                    fontSize: '12.5px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(250, 204, 21, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <span>🎟️ Ouvrir l&apos;onglet Codes Promo ➔</span>
                </button>
              </div>

              {/* 1. Comment gagner des points */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8px', color: isDarkMode ? '#ffffff' : '#09090b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🎯</span>
                  <span>1. Comment cumuler des points ?</span>
                </h4>
                <div style={{ background: isDarkMode ? '#27272a' : '#fafafa', border: `1px solid ${isDarkMode ? '#3f3f46' : '#e4e4e7'}`, borderRadius: '14px', padding: '14px 18px', fontSize: '13px', color: isDarkMode ? '#d4d4d8' : '#334155', lineHeight: '1.5' }}>
                  Chaque acquisition sur <strong>Aymard Store</strong> vous rapporte automatiquement des points crédités sur votre compte :
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                    <li><strong>1 € dépensé = 1 Point Fidélité</strong></li>
                    <li><strong>1 000 FCFA dépensés = 1.5 Points Fidélité</strong></li>
                    <li><strong>Non-cumul promo</strong> : Les achats réglés à l&apos;aide d&apos;un code promo ou bon fidélité ne génèrent pas de nouveaux points.</li>
                    <li>Les points sont utilisables sans limite de temps sur l&apos;ensemble du catalogue.</li>
                  </ul>
                </div>
              </div>

              {/* 3. Les Paliers du Club VIP */}
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.8px', color: isDarkMode ? '#ffffff' : '#09090b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏆</span>
                  <span>2. Conditions d&apos;accès au Statut VIP &amp; Privilèges</span>
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '14px', background: isDarkMode ? '#27272a' : '#f8fafc', border: `1px solid ${isDarkMode ? '#3f3f46' : '#e2e8f0'}`, fontSize: '12.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>🥉</span>
                      <div>
                        <strong style={{ color: isDarkMode ? '#ffffff' : '#09090b' }}>Membre Standard (Moins de 100 commandes)</strong>
                        <span style={{ fontSize: '11.5px', color: isDarkMode ? '#a1a1aa' : '#64748b', display: 'block', marginTop: '2px' }}>
                          Cumul automatique des points, conversion en codes promo et alertes drops.
                        </span>
                      </div>
                    </div>
                    <span style={{ fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#71717a', whiteSpace: 'nowrap' }}>0 à 99 cmd</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '14px', background: isDarkMode ? '#2e1065' : '#fefce8', border: isDarkMode ? '1.5px solid #8b5cf6' : '1.5px solid #facc15', fontSize: '12.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>★</span>
                      <div>
                        <strong style={{ color: isDarkMode ? '#facc15' : '#854d0e' }}>★ Statut VIP Officiel (Dès 100 commandes passées)</strong>
                        <span style={{ fontSize: '11.5px', color: isDarkMode ? '#e9d5ff' : '#a16207', display: 'block', marginTop: '2px' }}>
                          Déblocage automatique du statut VIP à vie, remises exclusives, invitations aux ventes privées et accès aux paires rares.
                        </span>
                      </div>
                    </div>
                    <span style={{ fontWeight: 900, color: isDarkMode ? '#facc15' : '#854d0e', whiteSpace: 'nowrap' }}>100+ Commandes</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: '14px', background: 'linear-gradient(135deg, #09090b, #18181b)', color: '#ffffff', border: '1px solid #27272a', fontSize: '12.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '18px' }}>👑</span>
                      <div>
                        <strong style={{ color: '#facc15' }}>👑 Surclassement &amp; Cadeaux Accordés par la Boutique</strong>
                        <span style={{ fontSize: '11.5px', color: '#a1a1aa', display: 'block', marginTop: '2px' }}>
                          La direction Aymard Store peut surclasser un client en VIP à tout moment ou lui accorder des privilèges spéciaux (cadeaux offerts, points bonus, livraisons gratuites).
                        </span>
                      </div>
                    </div>
                    <span style={{ fontWeight: 900, color: '#facc15', whiteSpace: 'nowrap' }}>Sur Décision Boutique</span>
                  </div>

                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 28px',
              borderTop: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`,
              display: 'flex',
              justifyContent: 'flex-end',
              background: isDarkMode ? '#121215' : '#fcfcfc'
            }}>
              <button
                onClick={() => setShowLoyaltyModal(false)}
                style={{
                  background: isDarkMode ? '#27272a' : '#09090b',
                  color: '#ffffff',
                  border: `1px solid ${isDarkMode ? '#3f3f46' : 'none'}`,
                  borderRadius: '30px',
                  padding: '10px 24px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                Fermer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CUSTOMER REVIEW SUBMISSION MODAL */}
      {/* ========================================================================= */}
      {reviewModalItem && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeReviewModal();
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              backgroundColor: isDarkMode ? '#18181b' : '#ffffff',
              borderRadius: '24px',
              boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.4)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              animation: 'modalZoomIn 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              border: isDarkMode ? '1px solid #27272a' : 'none'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: `1px solid ${isDarkMode ? '#27272a' : '#e4e4e7'}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              background: 'linear-gradient(135deg, #09090b, #18181b)',
              color: '#ffffff'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: 'rgba(250, 204, 21, 0.15)',
                  border: '1px solid rgba(250, 204, 21, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  color: '#facc15'
                }}>
                  ⭐
                </div>
                <div>
                  <h3 style={{ fontSize: '17px', fontWeight: 900, margin: 0, color: '#ffffff' }}>
                    {reviewModalItem.existingReview ? 'Modifier mon avis vérifié' : 'Donner mon avis client vérifié'}
                  </h3>
                  <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                    Commande #{reviewModalItem.order.orderNumber || reviewModalItem.order.id.slice(0, 8)}
                  </span>
                </div>
              </div>
              <button
                onClick={closeReviewModal}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800
                }}
              >
                ✕
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleSubmitReview} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Product Info Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: isDarkMode ? '#27272a' : '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: `1px solid ${isDarkMode ? '#3f3f46' : '#e2e8f0'}` }}>
                <img
                  src={reviewModalItem.product?.images?.[0] || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=200'}
                  alt={reviewModalItem.product?.name_fr || 'Product'}
                  style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', margin: '0 0 2px 0' }}>
                    {reviewModalItem.product?.name_fr || reviewModalItem.product?.name}
                  </h4>
                  <div style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🛡️ Achat 100% vérifié</span>
                    <span>·</span>
                    <span style={{ color: '#f59e0b', fontWeight: 800 }}>+50 Pts VIP</span>
                  </div>
                </div>
              </div>

              {/* Star Rating Selector */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: isDarkMode ? '#ffffff' : '#09090b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
                  Votre note globale *
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (reviewHoverRating || reviewRating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        onMouseEnter={() => setReviewHoverRating(star)}
                        onMouseLeave={() => setReviewHoverRating(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          fontSize: '32px',
                          cursor: 'pointer',
                          color: isFilled ? '#f59e0b' : (isDarkMode ? '#3f3f46' : '#d1d5db'),
                          transition: 'transform 0.15s ease, color 0.15s ease',
                          padding: '0 2px'
                        }}
                      >
                        ★
                      </button>
                    );
                  })}
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#f59e0b', marginLeft: '6px' }}>
                    {reviewRating === 5 && 'Exceptionnel (5/5)'}
                    {reviewRating === 4 && 'Très bien (4/5)'}
                    {reviewRating === 3 && 'Correct (3/5)'}
                    {reviewRating === 2 && 'Moyen (2/5)'}
                    {reviewRating === 1 && 'Insatisfaisant (1/5)'}
                  </span>
                </div>
              </div>

              {/* Title Field */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#52525b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Titre de votre avis (Optionnel)
                </label>
                <input
                  type="text"
                  placeholder="ex: Paire magnifique, cuir très qualitatif !"
                  value={reviewTitle}
                  onChange={(e) => setReviewTitle(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: `1px solid ${isDarkMode ? '#3f3f46' : '#cbd5e1'}`,
                    background: isDarkMode ? '#27272a' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#09090b',
                    fontSize: '13.5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Detailed Comment Field */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#52525b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Votre retour d&apos;expérience détaillé *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Partagez votre ressenti sur la coupe, le confort, l'authenticité et la rapidité de la livraison..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: `1px solid ${isDarkMode ? '#3f3f46' : '#cbd5e1'}`,
                    background: isDarkMode ? '#27272a' : '#ffffff',
                    color: isDarkMode ? '#ffffff' : '#09090b',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    lineHeight: 1.5
                  }}
                />
              </div>

              {/* Optional Photo Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: isDarkMode ? '#a1a1aa' : '#52525b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Photo de l&apos;article reçu (Optionnel)
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {reviewPhoto && (
                    <div style={{ position: 'relative', width: '56px', height: '56px', borderRadius: '10px', overflow: 'hidden' }}>
                      <img src={reviewPhoto} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <button
                        type="button"
                        onClick={() => setReviewPhoto('')}
                        style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.7)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer' }}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                  <label
                    style={{
                      background: isDarkMode ? '#27272a' : '#f4f4f5',
                      color: isDarkMode ? '#ffffff' : '#09090b',
                      border: `1px dashed ${isDarkMode ? '#3f3f46' : '#cbd5e1'}`,
                      borderRadius: '12px',
                      padding: '10px 16px',
                      fontSize: '12px',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}
                  >
                    <span>📷</span>
                    <span>{reviewPhoto ? 'Remplacer la photo' : 'Ajouter une photo'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      style={{ display: 'none' }}
                      onChange={handleReviewPhotoUpload}
                    />
                  </label>
                </div>
              </div>

              {/* Reward Callout */}
              <div style={{ background: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🎁</span>
                <div style={{ fontSize: '12px', color: isDarkMode ? '#fde047' : '#854d0e', lineHeight: 1.4 }}>
                  <strong>Récompense VIP immédiate :</strong> Vous recevrez automatiquement <strong>+50 Points Fidélité VIP</strong> sur votre compte lors de la publication de cet avis.
                </div>
              </div>

              {/* Actions Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={closeReviewModal}
                  style={{
                    background: 'none',
                    border: `1px solid ${isDarkMode ? '#3f3f46' : '#cbd5e1'}`,
                    color: isDarkMode ? '#a1a1aa' : '#52525b',
                    borderRadius: '30px',
                    padding: '12px 24px',
                    fontSize: '13px',
                    fontWeight: 800,
                    cursor: 'pointer'
                  }}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  style={{
                    background: 'linear-gradient(135deg, #09090b 0%, #1e293b 100%)',
                    color: '#facc15',
                    border: '1px solid #facc15',
                    borderRadius: '30px',
                    padding: '12px 28px',
                    fontSize: '13px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
                  }}
                >
                  {reviewModalItem.existingReview ? 'Mettre à jour mon avis' : 'Publier mon avis (+50 Pts VIP) ➔'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default function AccountPage() {
  return (
    <AppLayout>
      <Suspense fallback={<div style={{ padding: '80px', textAlign: 'center' }}>Chargement de votre Espace Client...</div>}>
        <CustomerAccountPortal />
      </Suspense>
    </AppLayout>
  );
}

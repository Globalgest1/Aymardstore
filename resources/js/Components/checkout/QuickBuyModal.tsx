'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from '@/lib/compat-link';
import { useRouter } from '@/lib/compat-navigation';
import { 
  useAppStore, 
  getProductPrice, 
  getActiveLocation, 
  formatAmount, 
  calculateBeninDelivery, 
  calculatePointsEarned
} from '@/lib/store';
import { trackPixelEvent } from '@/lib/pixel-tracker';
import { openLeekPayCheckout } from '@/lib/leekpay';

const CITIES_BY_COUNTRY: Record<string, string[]> = {
  benin: ['Cotonou', 'Abomey-Calavi', 'Porto-Novo', 'Ouidah', 'Parakou', 'Godomey', 'Akpakpa', 'Haie Vive', 'Cadjehoun', 'Fidjrosse', 'Bohicon', 'Natitingou'],
  france: ['Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille', 'Rennes'],
  belgique: ['Bruxelles', 'Anvers', 'Gand', 'Charleroi', 'Liège', 'Bruges', 'Namur', 'Mons', 'Louvain']
};

export default function QuickBuyModal() {
  const router = useRouter();
  const { 
    quickBuyProduct, 
    setQuickBuyProduct, 
    user, 
    detectedLocationId, 
    deliveryZones,
    promoCodes,
    addOrder,
    processOrderPointsAndReferral,
    addAbandonedCheckout,
    updateAbandonedCheckout,
    monerooSettings,
    subscribeToMarketing
  } = useAppStore();

  const activeLoc = getActiveLocation(detectedLocationId);

  // Modal open status
  const isOpen = Boolean(quickBuyProduct);
  const product = quickBuyProduct?.product;

  // Selected options
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedColor, setSelectedColor] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Address fields
  const defaultAddr = user?.savedAddresses?.find(a => a.isDefault) || user?.savedAddresses?.[0];
  const [fullName, setFullName] = useState(user?.name || defaultAddr?.fullName || '');
  const [phone, setPhone] = useState(user?.phone || defaultAddr?.phone || '');
  const [email, setEmail] = useState(user?.email || '');
  const [city, setCity] = useState(defaultAddr?.city || (activeLoc.id === 'benin' ? 'Cotonou' : activeLoc.id === 'belgique' ? 'Bruxelles' : 'Paris'));
  const [street, setStreet] = useState(defaultAddr?.street || '');
  const [zipCode, setZipCode] = useState(defaultAddr?.zipCode || (activeLoc.id === 'benin' ? '01BP' : '75001'));

  // City autocomplete dropdown state
  const [cityQuery, setCityQuery] = useState(city);
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  const matchedCities = useMemo(() => {
    const pool = CITIES_BY_COUNTRY[activeLoc.id || 'benin'] || CITIES_BY_COUNTRY.benin;
    if (!cityQuery.trim()) return pool.slice(0, 6);
    return pool.filter(c => c.toLowerCase().includes(cityQuery.toLowerCase())).slice(0, 6);
  }, [cityQuery, activeLoc.id]);

  // Promo code
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: 'percent' | 'fixed'; value: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'MOMO' | 'CARD' | 'INSTALLMENTS'>('COD');
  const [installmentPlan, setInstallmentPlan] = useState<'1x' | '2x' | '3x'>('1x');

  // Checkout step state: 'FORM' | 'GATEWAY' | 'SUCCESS' | 'ERROR'
  const [checkoutStep, setCheckoutStep] = useState<'FORM' | 'GATEWAY' | 'SUCCESS' | 'ERROR'>('FORM');
  const [createdOrderNumber, setCreatedOrderNumber] = useState<string>('');
  const [abandonedCheckoutId, setAbandonedCheckoutId] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [optInMarketing, setOptInMarketing] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Sync state when product opens
  useEffect(() => {
    if (quickBuyProduct) {
      setSelectedSize(quickBuyProduct.size || quickBuyProduct.product.sizes?.[0] || '');
      setSelectedColor(quickBuyProduct.color || quickBuyProduct.product.colors?.[0] || '');
      setQuantity(quickBuyProduct.quantity || 1);
      setPaymentMethod(activeLoc.id === 'benin' ? 'COD' : 'CARD');
      setCheckoutStep('FORM');
      setErrorMessage('');
      setAppliedCoupon(null);
      setCouponInput('');
      setCouponError('');

      if (user) {
        if (!fullName && user.name) setFullName(user.name);
        if (!email && user.email) setEmail(user.email);
        if (!phone && user.phone) setPhone(user.phone);
      }
    }
  }, [quickBuyProduct, user, activeLoc.id]);

  // Price calculations
  const priceInfo = product ? getProductPrice(product, detectedLocationId) : null;
  const unitPrice = priceInfo?.price ?? 0;
  const subtotal = unitPrice * quantity;

  // Calculate discount
  let discountAmount = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discountAmount = Math.round(subtotal * (appliedCoupon.value / 100));
    } else {
      const fixedConverted = activeLoc.currency === 'FCFA'
        ? Math.round(appliedCoupon.value * (activeLoc.exchangeRate || 655.957))
        : appliedCoupon.value;
      discountAmount = Math.min(fixedConverted, subtotal);
    }
  }

  // Shipping calculation
  const isBenin = activeLoc.id === 'benin';
  const isFrance = activeLoc.id === 'france';
  const beninDelivery = isBenin ? calculateBeninDelivery(city, deliveryZones) : null;
  const shippingCost = isBenin && beninDelivery
    ? (beninDelivery.fee * (activeLoc.exchangeRate || 655.957))
    : (activeLoc.id === 'belgique' ? 12.99 : 0);
  const totalAmount = Math.max(0, subtotal - discountAmount + shippingCost);

  // Capture lead / abandoned checkout on blur
  const recordOrUpdateLead = (step: 'CONTACT_ENTERED' | 'PAYMENT_OPENED' | 'PAYMENT_FAILED') => {
    if (!product) return;
    if (!phone && !email && !fullName) return;

    const leadData = {
      customerName: fullName || 'Client Anonyme',
      customerEmail: email || undefined,
      customerPhone: phone || 'Non renseigné',
      city: city || undefined,
      street: street || undefined,
      country: activeLoc.name,
      product: {
        id: product.id,
        name: product.name_fr,
        image: product.images?.[0] || '',
        size: selectedSize,
        color: selectedColor,
        price: unitPrice,
        currency: (activeLoc.currency === 'FCFA' ? 'FCFA' : 'EUR') as 'FCFA' | 'EUR',
        quantity
      },
      discountCode: appliedCoupon?.code,
      discountAmount,
      shippingCost,
      totalAmount,
      currency: (activeLoc.currency === 'FCFA' ? 'FCFA' : 'EUR') as 'FCFA' | 'EUR',
      status: step === 'PAYMENT_FAILED' ? 'PAYMENT_FAILED' as const : 'ABANDONED' as const,
      step: step,
      notes: step === 'PAYMENT_FAILED' 
        ? 'Tentative de paiement échouée ou refusée' 
        : 'Formulaire d\'achat express ouvert et coordonnées saisies'
    };

    if (abandonedCheckoutId) {
      updateAbandonedCheckout(abandonedCheckoutId, leadData);
    } else {
      const newId = addAbandonedCheckout(leadData);
      setAbandonedCheckoutId(newId);
    }
  };

  // Capture automatique en direct : dès que le client a saisi son numéro ou son nom,
  // même s'il oublie d'appuyer sur le bouton "Acheter" ou qu'il est distrait !
  useEffect(() => {
    if (!isOpen || !product) return;
    if (!phone || phone.trim().length < 6) return;
    if (checkoutStep === 'SUCCESS') return;

    const timer = setTimeout(() => {
      recordOrUpdateLead('CONTACT_ENTERED');
    }, 1500);

    return () => clearTimeout(timer);
  }, [isOpen, product, phone, fullName, city, street, selectedSize, selectedColor, quantity, checkoutStep]);

  // Capture de secours s'il quitte la page, ferme l'onglet ou passe sur une autre application
  useEffect(() => {
    const handleAppExit = () => {
      if (!isOpen || !product) return;
      if ((phone && phone.trim().length >= 6) || fullName) {
        if (checkoutStep !== 'SUCCESS') {
          recordOrUpdateLead('CONTACT_ENTERED');
        }
      }
    };

    window.addEventListener('beforeunload', handleAppExit);
    document.addEventListener('visibilitychange', handleAppExit);
    return () => {
      window.removeEventListener('beforeunload', handleAppExit);
      document.removeEventListener('visibilitychange', handleAppExit);
    };
  }, [isOpen, product, phone, fullName, checkoutStep]);

  // Close modal and track abandonment if not paid
  const handleClose = () => {
    if ((checkoutStep === 'FORM' || checkoutStep === 'GATEWAY') && (phone || fullName)) {
      recordOrUpdateLead('CONTACT_ENTERED');
    }
    setQuickBuyProduct(null);
  };

  // Apply Coupon
  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const found = (promoCodes || []).find(p => p.code.toUpperCase() === couponInput.trim().toUpperCase());
    if (found) {
      setAppliedCoupon(found);
      setCouponInput('');
    } else {
      setCouponError('Code promo invalide ou expiré');
    }
  };

    // Step 1: Handle Submit (Either direct COD validation or open Gateway for online payment)
  const handleProceedToGateway = () => {
    if (!phone || phone.length < 6) {
      setErrorMessage('Veuillez renseigner votre numéro de téléphone / WhatsApp pour la livraison');
      return;
    }
    if (!fullName) {
      setErrorMessage('Veuillez renseigner votre nom complet');
      return;
    }

    setErrorMessage('');

    // If Paiement à la livraison (COD), validate immediately without opening a credit card gateway!
    if (paymentMethod === 'COD') {
      handleConfirmPaymentSuccess(true);
      return;
    }

    // Online payment: Open LeekPay directly for instantaneous checkout!
    recordOrUpdateLead('PAYMENT_OPENED');
    setCheckoutStep('GATEWAY');
    
    // Auto-launch LeekPay checkout
    handleLaunchLeekPay();
  };

  const handleLaunchLeekPay = () => {
    const amountInFcfa = activeLoc.currency === 'FCFA' 
      ? totalAmount 
      : Math.round(totalAmount * (activeLoc.exchangeRate || 655.957));

    openLeekPayCheckout({
      amount: amountInFcfa,
      currency: 'XOF',
      apiKey: monerooSettings?.publicKey?.trim() || undefined,
      description: `Achat AYMARD STORE - ${product?.name_fr || 'Article'}`,
      customerEmail: email || user?.email || undefined,
      customerName: fullName,
      onSuccess: (tx) => {
        handleConfirmPaymentSuccess(false, tx);
      },
      onCancel: () => {
        handleCancelPayment('Paiement LeekPay interrompu');
      },
      onError: (err) => {
        setErrorMessage(err?.message || 'Erreur lors de la session LeekPay');
      }
    });
  };

  // Step 2: Cancel or Payment Failed (Never creates paid order, never notifies merchant)
  const handleCancelPayment = (reason: string = 'Paiement annulé par le client') => {
    recordOrUpdateLead('PAYMENT_FAILED');
    if (abandonedCheckoutId) {
      updateAbandonedCheckout(abandonedCheckoutId, {
        status: 'PAYMENT_FAILED',
        step: 'PAYMENT_FAILED',
        failureReason: reason
      });
    }
    setErrorMessage('Paiement non finalisé ou annulé. Aucun prélèvement n\'a été effectué et aucune commande n\'a été enregistrée.');
    setCheckoutStep('FORM');
  };

  // Step 3: Payment Confirmed / COD Validated
  const handleConfirmPaymentSuccess = async (isCodOrder: boolean = false, txData?: any) => {
    if (!product) return;
    setIsProcessing(true);
    const orderNum = `AYM-${Date.now().toString().slice(-6)}`;
    const trackingNum = `TRK-BJ-${Math.floor(100000 + Math.random() * 900000)}`;

    try {
      const { merchantSettings } = useAppStore.getState();

      const newOrder = {
        id: orderNum,
        orderNumber: orderNum,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        customerEmail: email || user?.email,
        customerName: fullName,
        customerPhone: phone,
        items: [{
          product: product,
          quantity: quantity,
          selectedSize: selectedSize || undefined,
          selectedColor: selectedColor || undefined
        }],
        total: totalAmount,
        discountApplied: discountAmount,
        promoCodeUsed: appliedCoupon ? appliedCoupon.code : undefined,
        currency: (activeLoc.currency === 'FCFA' ? 'FCFA' : 'EUR') as 'EUR' | 'FCFA',
        status: 'PENDING' as const,
        paymentStatus: (isCodOrder ? 'UNPAID' : 'PAID') as 'PAID' | 'UNPAID',
        paymentMethod: (isCodOrder ? 'COD' : 'LEEKPAY'),
        paymentTransactionId: isCodOrder ? 'COD_DELIVERY_PAYMENT' : (txData?.id || txData?.reference || txData?.custom_url || `tx_leekpay_${Date.now()}`),
        trackingNumber: trackingNum,
        shippingAddress: {
          fullName,
          street: street || 'Non précisée',
          city: city || activeLoc.name,
          zipCode: zipCode || '00000',
          country: activeLoc.name,
          phone: phone,
        }
      };

      // 1. Add order to store & save in SQLite database
      addOrder(newOrder as any);
      processOrderPointsAndReferral(newOrder as any);

      // Enregistrement persistant dans la base relationnelle SQL
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      }).catch(err => console.error('Erreur enregistrement SQL QuickBuy:', err));

      // 2. Track Pixel "Purchase"
      trackPixelEvent({
        eventName: 'Purchase',
        order_id: orderNum,
        value: totalAmount,
        currency: activeLoc.currency === 'FCFA' ? 'XOF' : 'EUR',
        num_items: 1,
        content_ids: [product.id],
        user_data: {
          email: email || user?.email,
          firstName: fullName,
          phone: phone,
          city: city,
          country: activeLoc.name
        }
      });

      // 3. Mark abandoned checkout as recovered
      if (abandonedCheckoutId) {
        updateAbandonedCheckout(abandonedCheckoutId, {
          status: 'RECOVERED',
          step: 'RECOVERED',
          recoveredAt: new Date().toLocaleDateString('fr-FR')
        });
      }

      // 4. Subscribe to marketing if opt-in checked
      if (optInMarketing) {
        subscribeToMarketing({
          name: fullName,
          email: email || user?.email,
          phone: phone,
          channels: ['WHATSAPP', 'EMAIL'],
          source: 'CHECKOUT'
        });
      }

      // 5. Send Merchant Notification (Telegram / Email / WhatsApp) with correct payload
      try {
        await fetch('/api/notify-merchant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'NEW_ORDER',
            order: newOrder,
            merchantSettings: merchantSettings
          })
        });
      } catch (e) {
        console.error('Failed to notify merchant:', e);
      }

      setCreatedOrderNumber(orderNum);
      setCheckoutStep('SUCCESS');

    } catch (err: any) {
      console.error('Error finalizing order:', err);
      handleCancelPayment('Erreur technique lors de la validation');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen || !product) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 99999,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '12px',
      backgroundColor: 'rgba(9, 9, 11, 0.75)',
      backdropFilter: 'blur(8px)',
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div 
        onClick={e => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '460px',
          maxHeight: '90vh',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
          border: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        
        {/* Clean Minimal Header */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#ffffff',
          flexShrink: 0
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: '#09090b', letterSpacing: '-0.2px' }}>
              {checkoutStep === 'GATEWAY' ? 'Paiement Sécurisé' : 'Commande Express'}
            </h3>
            <span style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 500 }}>
              {checkoutStep === 'GATEWAY' ? 'Vérification bancaire' : 'Livraison rapide en 24h/48h'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleClose}
            aria-label="Fermer"
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#f1f5f9',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              fontWeight: 700,
              color: '#64748b'
            }}
          >
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1, WebkitOverflowScrolling: 'touch' }}>

          {/* STEP: GATEWAY (Interactive Payment Processing & Operator Verification) */}
          {checkoutStep === 'GATEWAY' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', textAlign: 'center', padding: '10px 0' }}>
              <div style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(16, 185, 129, 0.08) 100%)',
                border: '1.5px solid rgba(2, 132, 199, 0.25)',
                borderRadius: '20px',
                padding: '20px',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#09090b',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      {paymentMethod === 'MOMO' ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      )}
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 900, color: '#09090b' }}>
                        {paymentMethod === 'MOMO' ? 'Mobile Money Bénin' : 'Carte Bancaire 3D Secure'}
                      </h4>
                      <span style={{ fontSize: '11.5px', color: '#0284c7', fontWeight: 700 }}>
                        {paymentMethod === 'MOMO' ? 'MTN MoMo • Moov Money • Celtiis Cash' : 'Visa • Mastercard (France / Belgique)'}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '10.5px', fontWeight: 800, background: '#10b981', color: '#ffffff', padding: '3px 10px', borderRadius: '12px' }}>
                    SÉCURISÉ 256-BIT
                  </span>
                </div>

                <div style={{ background: '#ffffff', borderRadius: '14px', padding: '14px', border: '1px solid #e2e8f0', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12.5px', color: '#64748b' }}>
                    <span>Article :</span>
                    <strong style={{ color: '#09090b' }}>{product.name_fr} (Taille {selectedSize || 'Standard'})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12.5px', color: '#64748b' }}>
                    <span>Client &amp; Tél :</span>
                    <strong style={{ color: '#09090b' }}>{fullName} ({phone})</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12.5px', color: '#64748b' }}>
                    <span>Livraison :</span>
                    <strong style={{ color: '#09090b' }}>{city}, {activeLoc.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: '6px' }}>
                    <span style={{ fontSize: '13px', fontWeight: 800, color: '#09090b' }}>Montant net à débiter :</span>
                    <span style={{ fontSize: '18px', fontWeight: 900, color: '#059669', fontFamily: 'var(--font-plus-jakarta)' }}>
                      {formatAmount(totalAmount, activeLoc)}
                    </span>
                  </div>
                </div>

                <p style={{ fontSize: '12px', color: '#475569', margin: 0, lineHeight: 1.4 }}>
                  {paymentMethod === 'MOMO' 
                    ? `Une demande d'autorisation de prélèvement de ${formatAmount(totalAmount, activeLoc)} va être envoyée sur votre numéro ${phone}. Veuillez valider pour confirmer votre commande.`
                    : `Votre établissement bancaire va vérifier la transaction de ${formatAmount(totalAmount, activeLoc)} via l'authentification 3D Secure.`}
                </p>
              </div>

              {/* Action Buttons for Verification */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleLaunchLeekPay}
                  style={{
                    width: '100%',
                    height: '52px',
                    borderRadius: '30px',
                    background: '#09090b',
                    color: '#ffffff',
                    border: 'none',
                    fontSize: '14px',
                    fontWeight: 900,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.25)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                  <span>⚡ PAYER VIA LEEKPAY ({formatAmount(totalAmount, activeLoc)})</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleCancelPayment('Paiement interrompu ou annulé par le client')}
                  style={{
                    width: '100%',
                    height: '44px',
                    borderRadius: '30px',
                    background: '#ffffff',
                    color: '#64748b',
                    border: '1px solid #cbd5e1',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px'
                  }}
                >
                  <span>Annuler et modifier ma commande</span>
                </button>
              </div>

              <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                Si vous annulez, aucune commande n&apos;est comptabilisée et aucun compte n&apos;est débité.
              </span>
            </div>
          )}

          {/* STEP: SUCCESS */}
          {checkoutStep === 'SUCCESS' && (
            <div style={{ textAlign: 'center', padding: '24px 8px' }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#ecfdf5',
                border: '2px solid #10b981',
                color: '#10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px auto'
              }}>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              </div>

              <span style={{
                display: 'inline-block',
                background: 'rgba(5,150,105,0.1)',
                color: '#059669',
                fontSize: '11px',
                fontWeight: 900,
                padding: '4px 12px',
                borderRadius: '20px',
                textTransform: 'uppercase',
                letterSpacing: '0.8px',
                marginBottom: '8px'
              }}>
                {paymentMethod === 'COD' ? 'COMMANDE ENREGISTRÉE · LIVRAISON EN COURS' : 'PAIEMENT CONFIRMÉ'}
              </span>

              <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#09090b', margin: '0 0 6px 0' }}>
                Félicitations {fullName.split(' ')[0]} !
              </h3>
              
              <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 20px 0', lineHeight: 1.5 }}>
                {paymentMethod === 'COD' 
                  ? `Votre commande #${createdOrderNumber} est confirmée. Notre service coursier vous contactera au ${phone} pour convenir de l'heure de passage. Préparez ${formatAmount(totalAmount, activeLoc)} à régler à la livraison.`
                  : `Votre commande #${createdOrderNumber} a été validée et enregistrée avec succès.`}
              </p>

              {/* Order Summary Box */}
              <div style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '16px',
                textAlign: 'left',
                marginBottom: '20px',
                display: 'flex',
                gap: '14px',
                alignItems: 'center'
              }}>
                {product.images?.[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.name_fr}
                    style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', background: '#ffffff', border: '1px solid #e2e8f0' }}
                  />
                )}
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#09090b', display: 'block' }}>
                    {product.name_fr}
                  </span>
                  <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                    Taille : <strong>{selectedSize || 'Unique'}</strong> • Qté : {quantity}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', color: '#059669', fontWeight: 800 }}>
                      Livraison à : {city} ({phone})
                    </span>
                    <span style={{ fontSize: '14px', fontWeight: 900, color: '#09090b' }}>
                      {formatAmount(totalAmount, activeLoc)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Confirmation Button */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <a
                  href={`https://wa.me/22997362906?text=${encodeURIComponent(
                    paymentMethod === 'COD'
                      ? `Bonjour Aymard Store ! Je viens de commander ${product.name_fr} (Taille ${selectedSize || 'Standard'}) en paiement à la livraison (Réf: #${createdOrderNumber}, Montant: ${formatAmount(totalAmount, activeLoc)}). Pouvez-vous me confirmer le créneau de livraison à ${city} ?`
                      : `Bonjour Aymard Store ! Je viens de payer ma commande #${createdOrderNumber} pour ${product.name_fr} (${formatAmount(totalAmount, activeLoc)}). Pouvez-vous me confirmer la préparation de mon colis ?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    background: '#25D366',
                    color: '#ffffff',
                    padding: '13px 20px',
                    borderRadius: '30px',
                    textDecoration: 'none',
                    fontWeight: 800,
                    fontSize: '13.5px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 4px 14px rgba(37, 211, 102, 0.3)'
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.04 2c-5.46 0-9.91 4.45-9.91 9.91 0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.816 9.816 0 0 0 12.04 2z"/>
                  </svg>
                  <span>{paymentMethod === 'COD' ? 'Confirmer mon adresse sur WhatsApp' : 'Recevoir le suivi direct sur WhatsApp'}</span>
                </a>

                <button
                  type="button"
                  onClick={() => {
                    setQuickBuyProduct(null);
                    router.push('/account?tab=orders');
                  }}
                  style={{
                    background: '#09090b',
                    color: '#ffffff',
                    padding: '12px 20px',
                    borderRadius: '30px',
                    border: 'none',
                    fontWeight: 800,
                    fontSize: '13px',
                    cursor: 'pointer'
                  }}
                >
                  Voir mes commandes ➔
                </button>
              </div>
            </div>
          )}

          {/* STEP: FORM (Fast Checkout 1-Page) */}
          {(checkoutStep === 'FORM' || checkoutStep === 'ERROR') && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Error banner if any */}
              {errorMessage && (
                <div style={{
                  background: '#fef2f2',
                  border: '1px solid #fca5a5',
                  color: '#991b1b',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  fontSize: '12px',
                  fontWeight: 700
                }}>
                  {errorMessage}
                </div>
              )}

              {/* 1. Product Summary Strip */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '8px 10px'
              }}>
                {product.images?.[0] && (
                  <img
                    src={product.images[0]}
                    alt={product.name_fr}
                    style={{ width: '44px', height: '44px', borderRadius: '8px', objectFit: 'cover', background: '#fff', border: '1px solid #e2e8f0', flexShrink: 0 }}
                  />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#09090b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                    {product.name_fr}
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                    {product.sizes && product.sizes.length > 0 && (
                      <span style={{ fontSize: '10.5px', background: '#ffffff', border: '1px solid #cbd5e1', padding: '0px 5px', borderRadius: '4px', fontWeight: 700 }}>
                        Pointure : {selectedSize || product.sizes[0]}
                      </span>
                    )}
                    <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                      Qté : {quantity}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: '13.5px', fontWeight: 900, color: '#09090b', display: 'block' }}>
                    {priceInfo?.formattedPrice}
                  </span>
                  <span style={{ fontSize: '10px', color: '#059669', fontWeight: 700 }}>
                    +{calculatePointsEarned(subtotal, activeLoc.currency)} Pts VIP
                  </span>
                </div>
              </div>

              {/* 2. Customer Contact & Delivery Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                  Coordonnées de Livraison
                </span>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      Nom et Prénom *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Michel Dossou"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      onBlur={() => recordOrUpdateLead('CONTACT_ENTERED')}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '13px',
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      Numéro WhatsApp (pour le livreur) *
                    </label>
                    <input
                      type="tel"
                      placeholder={activeLoc.id === 'benin' ? 'Ex: +229 01 97 36 29 06' : 'Ex: 06 12 34 56 78'}
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      onBlur={() => recordOrUpdateLead('CONTACT_ENTERED')}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '13px',
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    />
                  </div>
                </div>

                {/* City & Address */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ position: 'relative' }}>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      Ville *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Cotonou"
                      value={cityQuery}
                      onChange={e => {
                        setCityQuery(e.target.value);
                        setCity(e.target.value);
                        setShowCityDropdown(true);
                      }}
                      onFocus={() => setShowCityDropdown(true)}
                      onBlur={() => {
                        setTimeout(() => setShowCityDropdown(false), 200);
                        recordOrUpdateLead('CONTACT_ENTERED');
                      }}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '13px',
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    />

                    {/* Autocomplete suggestions */}
                    {showCityDropdown && matchedCities.length > 0 && (
                      <div style={{
                        position: 'absolute',
                        top: '100%',
                        left: 0,
                        right: 0,
                        zIndex: 100,
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.15)',
                        maxHeight: '140px',
                        overflowY: 'auto',
                        marginTop: '2px'
                      }}>
                        {matchedCities.map(cityName => (
                          <div
                            key={cityName}
                            onMouseDown={() => {
                              setCity(cityName);
                              setCityQuery(cityName);
                              setShowCityDropdown(false);
                              recordOrUpdateLead('CONTACT_ENTERED');
                            }}
                            style={{
                              padding: '6px 10px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              borderBottom: '1px solid #f1f5f9'
                            }}
                          >
                            <strong style={{ color: '#09090b' }}>{cityName}</strong>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label style={{ fontSize: '10.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '2px' }}>
                      Quartier / Repère *
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Haie Vive"
                      value={street}
                      onChange={e => setStreet(e.target.value)}
                      onBlur={() => recordOrUpdateLead('CONTACT_ENTERED')}
                      style={{
                        width: '100%',
                        height: '38px',
                        padding: '0 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '8px',
                        fontSize: '13px',
                        outline: 'none',
                        background: '#ffffff'
                      }}
                    />
                  </div>
                </div>

                {/* Delivery cost badge */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  padding: '6px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11.5px'
                }}>
                  <span style={{ color: '#475569', fontWeight: 600 }}>
                    {isBenin 
                      ? (beninDelivery?.isExpedition ? `Expédition ${beninDelivery.title} (24-48h)` : `Livraison coursier direct (${city})`)
                      : 'Livraison standard'}
                  </span>
                  <span style={{ fontWeight: 800, color: shippingCost === 0 ? '#059669' : '#09090b' }}>
                    {shippingCost === 0 ? 'Offerte' : formatAmount(shippingCost, activeLoc)}
                  </span>
                </div>
              </div>

              {/* 3. Promo Code (Compact) */}
              {appliedCoupon ? (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f0fdf4', padding: '6px 10px', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#16a34a' }}>
                    Code promo {appliedCoupon.code} (-{appliedCoupon.type === 'percent' ? `${appliedCoupon.value}%` : `${appliedCoupon.value}€`})
                  </span>
                  <button
                    type="button"
                    onClick={() => setAppliedCoupon(null)}
                    style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Retirer
                  </button>
                </div>
              ) : (
                <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '6px' }}>
                  <input
                    type="text"
                    placeholder="Code promo (ex: BIENVENUE)"
                    value={couponInput}
                    onChange={e => setCouponInput(e.target.value)}
                    style={{
                      flex: 1,
                      height: '34px',
                      padding: '0 8px',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '11.5px',
                      outline: 'none'
                    }}
                  />
                  <button
                    type="submit"
                    style={{
                      padding: '0 12px',
                      height: '34px',
                      background: '#f1f5f9',
                      color: '#09090b',
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontWeight: 800,
                      cursor: 'pointer'
                    }}
                  >
                    Appliquer
                  </button>
                </form>
              )}

              {/* 4. Payment Method Choice (Compact Segmented) */}
              <div>
                <label style={{ fontSize: '10.5px', fontWeight: 800, color: '#475569', textTransform: 'uppercase', margin: '0 0 6px 0', display: 'block', letterSpacing: '0.4px' }}>
                  Mode de Règlement
                </label>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {/* Option 1: Cash on Delivery (Paiement à la Livraison) */}
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('COD')}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: paymentMethod === 'COD' ? '2px solid #059669' : '1px solid #e2e8f0',
                      background: paymentMethod === 'COD' ? '#f0fdf4' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={paymentMethod === 'COD' ? '#059669' : '#64748b'} strokeWidth="2"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
                      <div>
                        <strong style={{ fontSize: '12px', color: paymentMethod === 'COD' ? '#065f46' : '#09090b', display: 'block' }}>
                          Paiement à la Livraison
                        </strong>
                        <span style={{ fontSize: '10.5px', color: '#64748b' }}>
                          Réglez au livreur après vérification du colis
                        </span>
                      </div>
                    </div>
                    <span style={{
                      fontSize: '9px',
                      fontWeight: 900,
                      background: paymentMethod === 'COD' ? '#059669' : '#f1f5f9',
                      color: paymentMethod === 'COD' ? '#ffffff' : '#475569',
                      padding: '2px 6px',
                      borderRadius: '6px',
                      textTransform: 'uppercase'
                    }}>
                      Recommandé
                    </span>
                  </button>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                    {/* Option 2: Mobile Money Direct */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('MOMO')}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: paymentMethod === 'MOMO' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: paymentMethod === 'MOMO' ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>
                      <div>
                        <strong style={{ fontSize: '11.5px', color: '#09090b', display: 'block' }}>Mobile Money</strong>
                        <span style={{ fontSize: '9.5px', color: '#64748b' }}>MTN, Moov, Celtiis</span>
                      </div>
                    </button>

                    {/* Option 3: Carte Bancaire */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('CARD')}
                      style={{
                        padding: '8px 10px',
                        borderRadius: '10px',
                        border: paymentMethod === 'CARD' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                        background: paymentMethod === 'CARD' ? '#f0f9ff' : '#ffffff',
                        cursor: 'pointer',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px'
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#0284c7" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                      <div>
                        <strong style={{ fontSize: '11.5px', color: '#09090b', display: 'block' }}>Carte Bancaire</strong>
                        <span style={{ fontSize: '9.5px', color: '#64748b' }}>Visa, Mastercard</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Opt-in WhatsApp */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10.5px', color: '#475569', paddingTop: '2px' }}>
                <input
                  type="checkbox"
                  id="quick-buy-optin"
                  checked={optInMarketing}
                  onChange={e => setOptInMarketing(e.target.checked)}
                  style={{ accentColor: '#09090b', cursor: 'pointer' }}
                />
                <label htmlFor="quick-buy-optin" style={{ cursor: 'pointer' }}>
                  Suivi de livraison en direct par WhatsApp
                </label>
              </div>

            </div>
          )}

        </div>

        {/* Dedicated Clean Luxury Modal Footer (Pinned at the bottom) */}
        {checkoutStep === 'FORM' && (
          <div style={{
            borderTop: '1px solid #f1f5f9',
            backgroundColor: '#ffffff',
            padding: '12px 16px',
            boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            flexShrink: 0
          }}>
            {/* Price Breakdown Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <div>
                <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.3px', display: 'block' }}>
                  {paymentMethod === 'COD' ? 'Total à la livraison' : 'Total net'}
                </span>
                <span style={{ fontSize: '10.5px', color: shippingCost === 0 ? '#059669' : '#64748b', fontWeight: 600 }}>
                  {shippingCost === 0 ? 'Livraison offerte' : `+ ${formatAmount(shippingCost, activeLoc)} livraison (${city})`}
                </span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#09090b', fontFamily: 'var(--font-plus-jakarta)', letterSpacing: '-0.3px' }}>
                  {formatAmount(totalAmount, activeLoc)}
                </span>
              </div>
            </div>

            {/* High Impact Action Button */}
            <button
              type="button"
              onClick={handleProceedToGateway}
              disabled={isProcessing}
              style={{
                width: '100%',
                height: '46px',
                borderRadius: '12px',
                background: '#09090b',
                color: '#ffffff',
                border: 'none',
                fontSize: '12.5px',
                fontWeight: 800,
                letterSpacing: '0.4px',
                textTransform: 'uppercase',
                cursor: isProcessing ? 'wait' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 4px 14px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>
                {isProcessing 
                  ? 'Traitement en cours...' 
                  : paymentMethod === 'COD' 
                    ? `Commander · ${formatAmount(totalAmount, activeLoc)}` 
                    : `Payer · ${formatAmount(totalAmount, activeLoc)}`}
              </span>
              {!isProcessing && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              )}
            </button>

            {/* Micro-guarantee Single Line Footer */}
            <div style={{
              textAlign: 'center',
              fontSize: '10.5px',
              color: '#94a3b8',
              fontWeight: 600,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Paiement Sécurisé · Expédition Express · Suivi WhatsApp
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

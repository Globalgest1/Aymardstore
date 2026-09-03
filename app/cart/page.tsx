'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAppStore, convertPrice, formatPrice, getProductPrice, getActiveLocation, formatAmount, Address, calculateBeninDelivery, calculatePointsEarned } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { trackPixelEvent } from '@/lib/pixel-tracker';
import { openLeekPayCheckout } from '@/lib/leekpay';

export default function CartPage() {
  const router = useRouter();
  const { 
    language, 
    currency, 
    cart, 
    removeFromCart, 
    updateCartQuantity, 
    clearCart, 
    user, 
    addOrder,
    processOrderPointsAndReferral,
    addSavedAddress,
    selectedShippingAddress,
    setSelectedShippingAddress,
    freeShippingThreshold,
    deliveryZones,
    promoCodes,
    detectedLocationId,
    locations,
    subscribeToMarketing,
    addAbandonedCheckout,
    updateAbandonedCheckout,
    monerooSettings
  } = useAppStore();
  
  const { t } = useTranslation(language);
  const activeLoc = getActiveLocation(detectedLocationId);

  // Coupon state
  const [couponCode, setCouponCode] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'LEEKPAY' | 'COD'>('LEEKPAY');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; type: 'percent' | 'fixed'; value: number } | null>(null);
  const [couponError, setCouponError] = useState('');
  
  // Installment Payment Options (1X, 2X, 3X Sans Frais)
  const [selectedPaymentPlan, setSelectedPaymentPlan] = useState<'1x' | '2x' | '3x'>('1x');
  
  // Opt-in for WhatsApp & Email Drops Alerts
  const [optInMarketing, setOptInMarketing] = useState(true);

  // Selected Address State (Synchronized with product page & saved addresses)
  const defaultAddr = user?.savedAddresses?.find(a => a.isDefault) || user?.savedAddresses?.[0];
  const initialCity = selectedShippingAddress?.city || defaultAddr?.city || (activeLoc.id === 'benin' ? 'Cotonou' : activeLoc.id === 'belgique' ? 'Bruxelles' : 'Paris');
  const initialStreet = selectedShippingAddress?.street || defaultAddr?.street || '';

  const [selectedAddressId, setSelectedAddressId] = useState<string>(
    selectedShippingAddress?.street ? 'custom' : (defaultAddr?.id || 'new')
  );
  const [customStreet, setCustomStreet] = useState(initialStreet);
  const [customCity, setCustomCity] = useState(initialCity);
  const [customZip, setCustomZip] = useState(defaultAddr?.zipCode || (activeLoc.id === 'benin' ? '01BP' : activeLoc.id === 'belgique' ? '1000' : '75001'));
  const [customPhone, setCustomPhone] = useState(user?.phone || '');
  
  // Save address for future orders checkbox
  const [saveAddressForFuture, setSaveAddressForFuture] = useState(true);
  const [saveAddressLabel, setSaveAddressLabel] = useState('Domicile');

  // Keep store synchronized
  useEffect(() => {
    if (selectedShippingAddress?.city && selectedShippingAddress.city !== customCity) {
      setCustomCity(selectedShippingAddress.city);
    }
    if (selectedShippingAddress?.street && selectedShippingAddress.street !== customStreet) {
      setCustomStreet(selectedShippingAddress.street);
    }
  }, [selectedShippingAddress]);

  // Calculate Subtotal in local currency
  const subtotalLocal = cart.reduce((acc, item) => {
    const pInfo = getProductPrice(item.product, detectedLocationId);
    return acc + pInfo.price * item.quantity;
  }, 0);
  
  // Calculate discount
  let discountLocal = 0;
  if (appliedCoupon) {
    if (appliedCoupon.type === 'percent') {
      discountLocal = subtotalLocal * (appliedCoupon.value / 100);
    } else {
      const convertedFixedCoupon = activeLoc.currency === 'FCFA' 
        ? Math.round(appliedCoupon.value * (activeLoc.exchangeRate || 655.957))
        : appliedCoupon.value;
      discountLocal = Math.min(convertedFixedCoupon, subtotalLocal);
    }
  }

  // Free shipping threshold converted
  const thresholdLocal = activeLoc.currency === 'FCFA' 
    ? Math.round(freeShippingThreshold * (activeLoc.exchangeRate || 655.957))
    : freeShippingThreshold;

  // Shipping cost calculation (0€ included for France clients, dynamic based on Benin address)
  const isFrance = activeLoc.id === 'france';
  const isBenin = activeLoc.id === 'benin' || activeLoc.currency === 'FCFA';
  const beninDelivery = isBenin ? calculateBeninDelivery(customCity, deliveryZones) : null;
  const baseShippingCost = isBenin && beninDelivery
    ? Math.round(beninDelivery.fee * (activeLoc.exchangeRate || 655.957))
    : (activeLoc.currency === 'FCFA' ? 2000 : 5.00);
  const shippingCostLocal = isFrance ? 0 : (subtotalLocal >= thresholdLocal || subtotalLocal === 0 ? 0 : baseShippingCost);
  const taxCostLocal = (subtotalLocal - discountLocal) * 0.18;
  const totalLocal = Math.max(0, subtotalLocal - discountLocal + shippingCostLocal);

  const convertedSubtotal = subtotalLocal;
  const convertedDiscount = discountLocal;
  const convertedShipping = shippingCostLocal;
  const convertedTax = taxCostLocal;
  const convertedTotal = totalLocal;

  const [abandonedCheckoutId, setAbandonedCheckoutId] = useState<string | null>(null);

  // Capture automatique en direct dans le panier :
  // Même si le client oublie d'appuyer sur le bouton "Passer commande" !
  useEffect(() => {
    if (!customPhone || customPhone.trim().length < 6 || cart.length === 0) return;

    const timer = setTimeout(() => {
      const firstItem = cart[0];
      const pInfo = getProductPrice(firstItem.product, detectedLocationId);
      const leadData = {
        customerName: user?.name || (customStreet ? `Client (${customCity})` : 'Client Panier'),
        customerEmail: user?.email || undefined,
        customerPhone: customPhone,
        city: customCity || undefined,
        street: customStreet || undefined,
        country: activeLoc.name,
        product: {
          id: firstItem.product.id,
          name: cart.length > 1 ? `${firstItem.product.name_fr} (+${cart.length - 1} autres)` : firstItem.product.name_fr,
          image: firstItem.product.images?.[0] || '',
          size: firstItem.size,
          color: firstItem.color,
          price: pInfo.price,
          currency: (activeLoc.currency === 'FCFA' ? 'FCFA' : 'EUR') as 'FCFA' | 'EUR',
          quantity: firstItem.quantity,
        },
        discountCode: appliedCoupon?.code,
        discountAmount: discountLocal,
        shippingCost: shippingCostLocal,
        totalAmount: totalLocal,
        currency: (activeLoc.currency === 'FCFA' ? 'FCFA' : 'EUR') as 'FCFA' | 'EUR',
        status: 'ABANDONED' as const,
        step: 'CONTACT_ENTERED' as const,
        notes: 'Coordonnées saisies dans le panier mais bouton non validé',
      };

      if (abandonedCheckoutId) {
        updateAbandonedCheckout(abandonedCheckoutId, leadData);
      } else {
        const newId = addAbandonedCheckout(leadData);
        setAbandonedCheckoutId(newId);
      }
    }, 1500);

    return () => clearTimeout(timer);
  }, [customPhone, customCity, customStreet, cart, totalLocal, abandonedCheckoutId]);

  // Capture de secours s'il quitte la page panier ou ferme le navigateur
  useEffect(() => {
    const handleCartExit = () => {
      if (customPhone && customPhone.trim().length >= 6 && cart.length > 0) {
        const firstItem = cart[0];
        const pInfo = getProductPrice(firstItem.product, detectedLocationId);
        const leadData = {
          customerName: user?.name || (customStreet ? `Client (${customCity})` : 'Client Panier'),
          customerEmail: user?.email || undefined,
          customerPhone: customPhone,
          city: customCity || undefined,
          street: customStreet || undefined,
          country: activeLoc.name,
          product: {
            id: firstItem.product.id,
            name: cart.length > 1 ? `${firstItem.product.name_fr} (+${cart.length - 1} autres)` : firstItem.product.name_fr,
            image: firstItem.product.images?.[0] || '',
            size: firstItem.size,
            color: firstItem.color,
            price: pInfo.price,
            currency: (activeLoc.currency === 'FCFA' ? 'FCFA' : 'EUR') as 'FCFA' | 'EUR',
            quantity: firstItem.quantity,
          },
          discountCode: appliedCoupon?.code,
          discountAmount: discountLocal,
          shippingCost: shippingCostLocal,
          totalAmount: totalLocal,
          currency: (activeLoc.currency === 'FCFA' ? 'FCFA' : 'EUR') as 'FCFA' | 'EUR',
          status: 'ABANDONED' as const,
          step: 'CONTACT_ENTERED' as const,
          notes: 'Session panier interrompue ou page fermée',
        };
        if (abandonedCheckoutId) {
          updateAbandonedCheckout(abandonedCheckoutId, leadData);
        } else {
          const newId = addAbandonedCheckout(leadData);
          setAbandonedCheckoutId(newId);
        }
      }
    };

    window.addEventListener('beforeunload', handleCartExit);
    document.addEventListener('visibilitychange', handleCartExit);
    return () => {
      window.removeEventListener('beforeunload', handleCartExit);
      document.removeEventListener('visibilitychange', handleCartExit);
    };
  }, [customPhone, customCity, customStreet, cart, totalLocal, abandonedCheckoutId]);

  const getProductName = (p: typeof cart[0]['product']) => {
    if (language === 'en') return p.name_en;
    if (language === 'es') return p.name_es;
    return p.name_fr;
  };

  const applySpecificCoupon = (codeToApply: string) => {
    setCouponError('');
    const codeUpper = codeToApply.trim().toUpperCase();
    const found = promoCodes.find(c => c.code.toUpperCase() === codeUpper);
    if (found) {
      if (found.target && found.target !== 'ALL' && (!user || user.email.toLowerCase().trim() !== found.target.toLowerCase().trim())) {
        setCouponError('Ce code promo est exclusif et réservé à un compte client spécifique.');
        return;
      }
      setAppliedCoupon(found);
      setCouponCode('');
    } else {
      setCouponError('Code promo invalide ou expiré.');
    }
  };

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    applySpecificCoupon(couponCode);
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
  };
  const handleCheckout = () => {
    if (!user) {
      router.push('/account');
      return;
    }

    const chosenAddr = selectedAddressId !== 'new' && selectedAddressId !== 'custom'
      ? (user.savedAddresses || []).find(a => a.id === selectedAddressId)
      : null;

    const finalFullName = chosenAddr?.fullName || user.name || 'Client AYMARD STORE';
    const finalStreet = chosenAddr?.street || customStreet || 'Non précisée';
    const finalCity = chosenAddr?.city || customCity || (activeLoc.id === 'benin' ? 'Cotonou' : 'Paris');
    const finalZip = chosenAddr?.zipCode || customZip || '00000';
    const finalCountry = chosenAddr?.country || activeLoc.name;
    const finalPhone = chosenAddr?.phone || customPhone || user.phone || '';

    if (!finalPhone || finalPhone.length < 6) {
      alert('Veuillez renseigner votre numéro de téléphone / WhatsApp pour la livraison');
      return;
    }

    // Automatically save address if requested
    if (saveAddressForFuture && finalStreet.trim()) {
      const alreadyExists = (user.savedAddresses || []).some(
        a => a.street.toLowerCase().trim() === finalStreet.toLowerCase().trim() &&
             a.city.toLowerCase().trim() === finalCity.toLowerCase().trim()
      );
      if (!alreadyExists) {
        addSavedAddress({
          id: 'addr_' + Date.now(),
          label: saveAddressLabel.trim() || 'Mon Adresse',
          fullName: finalFullName,
          street: finalStreet,
          city: finalCity,
          zipCode: finalZip,
          country: finalCountry,
          phone: finalPhone,
          isDefault: (user.savedAddresses || []).length === 0
        });
      }
    }

    // Keep global shipping address synced
    setSelectedShippingAddress({
      street: finalStreet,
      city: finalCity,
      zipCode: finalZip,
      country: finalCountry,
      phone: finalPhone,
      label: chosenAddr?.label || saveAddressLabel
    });

    const finalizeCartOrder = async (isPaid: boolean = false, txData?: any) => {
      const orderNumber = `AYM-${Date.now().toString().slice(-6)}`;
      const trackingNumber = `TRK-BJ-${Math.floor(100000 + Math.random() * 900000)}`;

      const newOrder = {
        id: orderNumber,
        orderNumber,
        date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
        customerEmail: user.email,
        customerName: finalFullName,
        customerPhone: finalPhone,
        items: [...cart],
        total: totalLocal,
        discountApplied: discountLocal,
        promoCodeUsed: appliedCoupon ? appliedCoupon.code : undefined,
        currency: (activeLoc.currency === 'FCFA' ? 'FCFA' : 'EUR') as 'EUR' | 'FCFA',
        status: 'PENDING' as const,
        paymentStatus: isPaid ? 'PAID' : 'UNPAID',
        paymentMethod: isPaid ? 'LEEKPAY' : 'COD',
        paymentTransactionId: isPaid ? (txData?.id || txData?.reference || txData?.custom_url || `tx_leekpay_${Date.now()}`) : 'COD_DELIVERY_PAYMENT',
        trackingNumber,
        shippingAddress: {
          fullName: finalFullName,
          street: finalStreet,
          city: finalCity,
          zipCode: finalZip,
          country: finalCountry,
          phone: finalPhone,
        }
      };

      trackPixelEvent({
        eventName: 'Purchase',
        order_id: orderNumber,
        value: totalLocal,
        currency: activeLoc.currency === 'FCFA' ? 'XOF' : 'EUR',
        num_items: cart.length,
        content_ids: cart.map(i => i.product.id),
        user_data: {
          email: user.email,
          firstName: user.name,
          phone: finalPhone,
          city: finalCity,
          country: finalCountry
        }
      });

      if (optInMarketing && user) {
        subscribeToMarketing({
          name: finalFullName,
          email: user.email,
          phone: finalPhone,
          channels: ['WHATSAPP', 'EMAIL'],
          source: 'CHECKOUT'
        });
      }

      addOrder(newOrder as any);
      processOrderPointsAndReferral(newOrder as any);

      // Enregistrement persistant dans la base relationnelle SQL
      fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrder),
      }).catch(err => console.error('Erreur enregistrement SQL commande:', err));

      // Notify Merchant on Telegram / Email / WhatsApp
      const { merchantSettings } = useAppStore.getState();
      fetch('/api/notify-merchant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'NEW_ORDER',
          order: newOrder,
          merchantSettings: merchantSettings
        })
      }).catch(err => console.error('Notify error:', err));

      if (abandonedCheckoutId) {
        updateAbandonedCheckout(abandonedCheckoutId, { status: 'RECOVERED' });
      }

      clearCart();
      router.push('/account?tab=orders&success=true');
    };

    if (paymentMethod === 'COD') {
      finalizeCartOrder(false);
      return;
    }

    // Launch LeekPay popup
    const amountInFcfa = activeLoc.currency === 'FCFA' 
      ? totalLocal 
      : Math.round(totalLocal * (activeLoc.exchangeRate || 655.957));

    openLeekPayCheckout({
      amount: amountInFcfa,
      currency: 'XOF',
      apiKey: monerooSettings?.publicKey?.trim() || undefined,
      description: `Commande AYMARD STORE (${cart.length} article${cart.length > 1 ? 's' : ''})`,
      customerEmail: user.email,
      customerName: finalFullName,
      onSuccess: (tx) => {
        finalizeCartOrder(true, tx);
      },
      onCancel: () => {
        console.log('Paiement LeekPay annulé');
      },
      onError: (err) => {
        alert(err?.message || 'Erreur lors du traitement du paiement LeekPay');
      }
    });
  };

  if (cart.length === 0) {
    return (
      <div className="container section" style={{ textAlign: 'center', padding: '80px 20px', minHeight: '60vh' }}>
        <span style={{ fontSize: '64px' }}>🛒</span>
        <h2 style={{ fontSize: '24px', fontWeight: 800, marginTop: '24px', color: '#0f172a' }}>{t('cart.empty')}</h2>
        <p style={{ color: '#64748b', marginTop: '8px', marginBottom: '24px' }}>
          Découvrez nos collections exclusives et commencez vos achats dès aujourd&apos;hui.
        </p>
        <Link href="/products" className="btn btn-primary btn-lg" style={{ borderRadius: '30px', padding: '12px 32px' }}>
          {t('cart.continueShopping')}
        </Link>
      </div>
    );
  }

  return (
    <div className="container section" style={{ minHeight: '80vh', padding: '40px 16px' }}>
      <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '32px', fontFamily: 'var(--font-plus-jakarta)', color: '#0f172a' }}>
        {t('cart.title')}
      </h1>
      
      <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
        
        {/* Left Side: Cart Items List */}
        <div style={{ flex: '1 1 600px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {cart.map((item, index) => {
              const pInfo = getProductPrice(item.product, detectedLocationId);
              const itemPrice = pInfo.price;
              const itemTotal = itemPrice * item.quantity;
              
              return (
                <div 
                  key={`${item.product.id}-${item.color}-${item.size}-${index}`}
                  style={{ 
                    display: 'flex', 
                    gap: '20px', 
                    background: '#fff', 
                    padding: '20px', 
                    borderRadius: '16px', 
                    boxShadow: '0 4px 16px rgba(0,0,0,0.04)',
                    border: '1px solid #f1f5f9',
                    alignItems: 'center',
                    flexWrap: 'wrap'
                  }}
                >
                  <div style={{ width: '80px', height: '80px', borderRadius: '12px', background: '#f8fafc', padding: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    <img 
                      src={item.product.images[0]} 
                      alt={getProductName(item.product)} 
                      style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                    />
                  </div>
                  
                  <div style={{ flex: '1 1 200px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 4px 0', color: '#0f172a' }}>
                      <Link href={`/products/${item.product.slug}`} style={{ color: 'inherit' }}>
                        {getProductName(item.product)}
                      </Link>
                    </h3>
                    <div style={{ fontSize: '12px', color: '#64748b', display: 'flex', gap: '12px' }}>
                      {item.color && <span>Couleur : <strong>{item.color}</strong></span>}
                      {item.size && <span>Taille : <strong>{item.size.replace(/\s*EU\b/gi, '')}</strong></span>}
                    </div>
                    <div style={{ fontSize: '14px', fontWeight: 800, marginTop: '6px', color: '#0f172a' }}>
                      {pInfo.formattedPrice}
                    </div>
                  </div>

                  {/* Quantity Control */}
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden', height: '36px' }}>
                    <button 
                      onClick={() => updateCartQuantity(item.product.id, Math.max(1, item.quantity - 1), item.color, item.size)}
                      style={{ width: '32px', height: '100%', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      -
                    </button>
                    <span style={{ width: '28px', textAlign: 'center', fontSize: '13px', fontWeight: 700 }}>{item.quantity}</span>
                    <button 
                      onClick={() => updateCartQuantity(item.product.id, Math.min(item.product.stock, item.quantity + 1), item.color, item.size)}
                      style={{ width: '32px', height: '100%', border: 'none', background: 'none', cursor: 'pointer', fontWeight: 700 }}
                    >
                      +
                    </button>
                  </div>

                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', minWidth: '90px', textAlign: 'right' }}>
                    {formatAmount(itemTotal, activeLoc)}
                  </div>

                  <button 
                    onClick={() => removeFromCart(item.product.id, item.color, item.size)}
                    style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
                    title="Supprimer"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                  </button>
                </div>
              );
            })}
          </div>

          {/* User Delivery Address Selection & Auto-Save Options */}
          {user && (
            <div style={{ marginTop: '24px', background: '#fff', padding: '24px', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>📍</span> Adresse de livraison pour cette commande
                </h3>
                <Link href="/account?tab=addresses" style={{ fontSize: '12px', color: '#0284c7', textDecoration: 'underline', fontWeight: 700 }}>
                  Gérer mon carnet d&apos;adresses
                </Link>
              </div>

              {/* Saved Addresses List */}
              {user.savedAddresses && user.savedAddresses.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px', marginBottom: '16px' }}>
                  {user.savedAddresses.map(addr => {
                    const isSelected = selectedAddressId === addr.id;
                    return (
                      <div 
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setCustomStreet(addr.street);
                          setCustomCity(addr.city);
                          setCustomZip(addr.zipCode);
                          setCustomPhone(addr.phone);
                          setSelectedShippingAddress({
                            street: addr.street,
                            city: addr.city,
                            zipCode: addr.zipCode,
                            country: addr.country,
                            phone: addr.phone,
                            label: addr.label
                          });
                        }}
                        style={{
                          border: isSelected ? '2px solid #111111' : '1px solid #e2e8f0',
                          borderRadius: '12px',
                          padding: '14px',
                          cursor: 'pointer',
                          background: isSelected ? '#f8fafc' : '#ffffff',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: 800, color: '#0f172a' }}>{addr.label}</span>
                          {addr.isDefault && <span style={{ fontSize: '9px', background: '#0284c7', color: '#fff', padding: '2px 6px', borderRadius: '10px', fontWeight: 700 }}>Défaut</span>}
                        </div>
                        <div style={{ fontSize: '12px', color: '#475569' }}>{addr.fullName}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{addr.street}, {addr.city}</div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>📞 {addr.phone}</div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Toggle to input new address */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                <button
                  type="button"
                  onClick={() => setSelectedAddressId(selectedAddressId === 'custom' ? (defaultAddr?.id || 'new') : 'custom')}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#0284c7',
                    fontSize: '12.5px',
                    fontWeight: 800,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  {selectedAddressId === 'custom' ? '← Utiliser une adresse enregistrée' : '✏️ Saisir / modifier une autre adresse de livraison'}
                </button>
              </div>

              {/* Custom Address Input Form */}
              {selectedAddressId === 'custom' && (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '14px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Ville</label>
                      <input
                        type="text"
                        value={customCity}
                        onChange={(e) => {
                          setCustomCity(e.target.value);
                          setSelectedShippingAddress({ street: customStreet, city: e.target.value, zipCode: customZip, country: activeLoc.name, phone: customPhone });
                        }}
                        placeholder="ex: Cotonou, Calavi, Paris..."
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Téléphone de contact</label>
                      <input
                        type="tel"
                        value={customPhone}
                        onChange={(e) => setCustomPhone(e.target.value)}
                        placeholder="+229 01 97 36 29 06"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 800, color: '#475569', marginBottom: '4px', textTransform: 'uppercase' }}>Adresse / Quartier précis</label>
                    <input
                      type="text"
                      value={customStreet}
                      onChange={(e) => {
                        setCustomStreet(e.target.value);
                        setSelectedShippingAddress({ street: e.target.value, city: customCity, zipCode: customZip, country: activeLoc.name, phone: customPhone });
                      }}
                      placeholder="ex: Haie Vive, Rue 310, Immeuble..."
                      style={{ width: '100%', padding: '9px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
              )}

              {/* 💾 Prompt: Save address for future orders */}
              <div style={{ background: '#f8fafc', padding: '14px 16px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                  <input
                    type="checkbox"
                    checked={saveAddressForFuture}
                    onChange={(e) => setSaveAddressForFuture(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#09090b', cursor: 'pointer' }}
                  />
                  <span>💾 Enregistrer cette adresse dans mon carnet pour mes prochaines commandes</span>
                </label>
                {saveAddressForFuture && (
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 700 }}>Nom du lieu :</span>
                    <input
                      type="text"
                      placeholder="ex: Domicile, Bureau, Maison..."
                      value={saveAddressLabel}
                      onChange={(e) => setSaveAddressLabel(e.target.value)}
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '8px', border: '1px solid #cbd5e1', outline: 'none', maxWidth: '200px' }}
                    />
                  </div>
                )}
              </div>

            </div>
          )}
        </div>

        {/* Right Side: Order Summary */}
        <div style={{ width: '380px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Coupon Code Entry Form */}
          <div style={{ background: '#fff', padding: '24px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: 800, color: '#334155' }}>Code de réduction</span>
            
            {appliedCoupon ? (
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc', border: '1px dashed #000', borderRadius: '10px', padding: '10px 14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '13px', fontWeight: 800, color: '#000000' }}>{appliedCoupon.code}</span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    {appliedCoupon.type === 'percent' ? `-${appliedCoupon.value}%` : `-${appliedCoupon.value}€`} appliqué
                  </span>
                </div>
                <button onClick={handleRemoveCoupon} style={{ background: 'none', border: 'none', color: '#ef4444', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Retirer</button>
              </div>
            ) : (
              <form onSubmit={handleApplyCoupon} style={{ display: 'flex', gap: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Ex: PROMO10" 
                  value={couponCode} 
                  onChange={e => setCouponCode(e.target.value)} 
                  style={{ flex: 1, padding: '10px 14px', border: '1px solid #cbd5e1', borderRadius: '10px', fontSize: '13px', outline: 'none' }}
                />
                <button type="submit" style={{ padding: '10px 18px', background: '#111111', color: '#fff', border: 'none', borderRadius: '10px', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}>Appliquer</button>
              </form>
            )}
            {couponError && <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: 600 }}>{couponError}</span>}

            {!appliedCoupon && promoCodes && promoCodes.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  🎁 Offres disponibles :
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {promoCodes
                    .filter(p => !p.target || p.target === 'ALL' || (user?.email && p.target === user.email))
                    .map(p => (
                      <div
                        key={p.code}
                        onClick={() => applySpecificCoupon(p.code)}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          background: 'rgba(2, 132, 199, 0.05)',
                          border: '1px dashed rgba(2, 132, 199, 0.3)',
                          padding: '8px 12px',
                          borderRadius: '10px',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: '12px', fontWeight: 900, color: '#f59e0b', background: 'rgba(245,158,11,0.15)', padding: '2px 8px', borderRadius: '6px' }}>
                            {p.code}
                          </span>
                          <span style={{ fontSize: '11px', color: '#334155', fontWeight: 600 }}>
                            {p.type === 'percent' ? `-${p.value}%` : `-${p.value}€`}
                          </span>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 800, color: '#0284c7' }}>
                          Appliquer ➔
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Checkout Totals Summary Card */}
          <div style={{ background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 16px rgba(0,0,0,0.04)', border: '1px solid #f1f5f9', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 800, borderBottom: '1px solid #f1f5f9', paddingBottom: '12px', margin: 0, color: '#0f172a' }}>
              {t('cart.orderSummary')}
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px' }}>
              <div className="flex-between">
                <span style={{ color: '#64748b' }}>{t('common.subtotal')}</span>
                <span style={{ fontWeight: 700, color: '#0f172a' }}>{formatAmount(convertedSubtotal, activeLoc)}</span>
              </div>
              
              {discountLocal > 0 && (
                <div className="flex-between" style={{ color: '#ef4444', fontWeight: 700 }}>
                  <span>Réduction ({appliedCoupon?.code})</span>
                  <span>-{formatAmount(convertedDiscount, activeLoc)}</span>
                </div>
              )}

              <div className="flex-between">
                <span style={{ color: '#64748b' }}>{t('common.shipping')}</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>
                  {isFrance ? '0,00 € (Inclus dans l\'article)' : shippingCostLocal === 0 ? t('common.freeShipping') : formatAmount(convertedShipping, activeLoc)}
                </span>
              </div>
              <div className="flex-between">
                <span style={{ color: '#64748b' }}>{t('common.tax')} (incluse)</span>
                <span style={{ fontWeight: 600, color: '#94a3b8' }}>{formatAmount(convertedTax, activeLoc)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 800, borderTop: '1px solid #f1f5f9', paddingTop: '16px', color: '#0f172a' }}>
              <span>{t('common.total')}</span>
              <span>{formatAmount(convertedTotal, activeLoc)}</span>
            </div>

            {/* Loyalty Points to Earn (1€ = 1 PT / 1000 FCFA = 1 PT) */}
            <div style={{
              marginTop: '10px',
              padding: '8px 12px',
              borderRadius: '10px',
              background: 'rgba(234, 179, 8, 0.08)',
              border: '1px solid rgba(234, 179, 8, 0.25)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, color: '#b45309' }}>
                <span>💎</span> Points Fidélité à gagner :
              </span>
              <span style={{ fontWeight: 900, color: '#d97706' }}>
                +{calculatePointsEarned(convertedTotal, activeLoc.currency)} Pts
              </span>
            </div>

            {/* Installment Payment Plans (1X, 2X, 3X, 4X Sans Frais) */}
            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>Facilités de paiement</span>
                <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', background: 'rgba(16,185,129,0.1)', padding: '2px 8px', borderRadius: '12px' }}>
                  0 FRAIS
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', marginBottom: '12px' }}>
                {[
                  { id: '1x', label: '1X', sub: 'Comptant' },
                  { id: '2x', label: '2X', sub: `${formatAmount(convertedTotal / 2, activeLoc)}` },
                  { id: '3x', label: '3X', sub: `${formatAmount(convertedTotal / 3, activeLoc)}` },
                ].map(plan => {
                  const isPlanActive = selectedPaymentPlan === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPaymentPlan(plan.id as '1x' | '2x' | '3x')}
                      style={{
                        padding: '8px 4px',
                        borderRadius: '10px',
                        border: isPlanActive ? '2px solid #09090b' : '1px solid #e2e8f0',
                        background: isPlanActive ? '#09090b' : '#f8fafc',
                        color: isPlanActive ? '#ffffff' : '#0f172a',
                        cursor: 'pointer',
                        textAlign: 'center',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                    >
                      <span style={{ fontSize: '12px', fontWeight: 900 }}>{plan.label}</span>
                      <span style={{ fontSize: '10px', opacity: isPlanActive ? 0.9 : 0.7, whiteSpace: 'nowrap' }}>{plan.sub}</span>
                    </button>
                  );
                })}
              </div>

              {/* Installment Breakdown Schedule */}
              {selectedPaymentPlan !== '1x' && (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px', fontSize: '12px', marginBottom: '14px' }}>
                  <div style={{ fontWeight: 800, color: '#0f172a', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>🗓️ Échéancier {selectedPaymentPlan.toUpperCase()} Sans Frais :</span>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', color: '#475569' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• 1ère mensualité (Aujourd&apos;hui) :</span>
                      <strong style={{ color: '#0f172a' }}>
                        {formatAmount(
                          selectedPaymentPlan === '2x'
                            ? convertedTotal / 2
                            : convertedTotal / 3,
                          activeLoc
                        )}
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>• 2ème mensualité (dans 30j) :</span>
                      <strong style={{ color: '#0f172a' }}>
                        {formatAmount(
                          selectedPaymentPlan === '2x'
                            ? convertedTotal / 2
                            : convertedTotal / 3,
                          activeLoc
                        )}
                      </strong>
                    </div>
                    {selectedPaymentPlan === '3x' && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>• 3ème mensualité (dans 60j) :</span>
                        <strong style={{ color: '#0f172a' }}>
                          {formatAmount(
                            convertedTotal / 3,
                            activeLoc
                          )}
                        </strong>
                      </div>
                    )}
                  </div>
                  
                  <div style={{ marginTop: '8px', paddingTop: '6px', borderTop: '1px dashed #cbd5e1', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px' }}>
                    <div style={{ color: '#0369a1', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>📦</span>
                      <span>Remise de l&apos;article : réservation immédiate, expédié dès la dernière tranche soldée.</span>
                    </div>
                    <div style={{ color: '#059669', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>🛡️</span>
                      <span>Paiement sécurisé • 0 frais supplémentaires</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* France Specific Delivery Notice Banner */}
            {isFrance && (
              <div style={{
                background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.08) 0%, rgba(59, 130, 246, 0.04) 100%)',
                border: '1px solid rgba(2, 132, 199, 0.25)',
                borderRadius: '12px',
                padding: '12px 14px',
                fontSize: '12px',
                color: '#0369a1',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}>
                <span style={{ fontSize: '18px', flexShrink: 0 }}>🇫🇷</span>
                <div style={{ lineHeight: '1.4' }}>
                  <strong style={{ display: 'block', color: '#0284c7', marginBottom: '2px' }}>
                    Expédition vers la France incluse
                  </strong>
                  <span style={{ color: '#334155' }}>
                    Les frais d&apos;expédition sont déjà compris dans le tarif de vos articles. Les frais de livraison finale à votre adresse seront à régler directement une fois le colis arrivé en France.
                  </span>
                </div>
              </div>
            )}

            {/* If not logged in, show clear notice */}
            {!user ? (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '12px 14px', fontSize: '12px', color: '#475569', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🔒</span>
                <span>Connectez-vous pour finaliser et suivre votre commande en direct.</span>
              </div>
            ) : (
              <div style={{ background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '12px', padding: '10px 14px', fontSize: '12px', color: '#059669', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✓</span>
                <span>Connecté en tant que <strong>{user.name}</strong></span>
              </div>
            )}
            {/* Clear No-Return Notice */}
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#92400e',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              lineHeight: '1.4'
            }}>
              <span style={{ fontSize: '16px', flexShrink: 0 }}>⚠️</span>
              <span>
                <strong>Rappel :</strong> Retours non acceptés. Veuillez bien vérifier votre pointure et votre modèle avant de finaliser votre commande.
              </span>
            </div>

            {/* Opt-in Marketing Alerts Checkbox */}
            <div style={{
              background: 'rgba(56, 189, 248, 0.06)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: '12px',
              padding: '10px 14px',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <input 
                type="checkbox"
                id="cart-marketing-optin"
                checked={optInMarketing}
                onChange={e => setOptInMarketing(e.target.checked)}
                style={{ marginTop: '2px', accentColor: '#0284c7', cursor: 'pointer' }}
              />
              <label htmlFor="cart-marketing-optin" style={{ cursor: 'pointer', color: '#0f172a', lineHeight: '1.4' }}>
                <strong style={{ display: 'block', color: '#0284c7', marginBottom: '2px' }}>
                  💬 M&apos;avertir en exclusivité des nouveaux drops
                </strong>
                <span style={{ fontSize: '11px', color: '#475569' }}>
                  Recevez les arrivages rares et réductions VIP par WhatsApp et Email. Désinscription en 1 clic.
                </span>
              </label>
            </div>

                        {/* Mode de règlement */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Mode de Paiement
              </span>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {/* LeekPay option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('LEEKPAY')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: paymentMethod === 'LEEKPAY' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                    background: paymentMethod === 'LEEKPAY' ? '#f0f9ff' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#0284c7',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '14px'
                    }}>
                      ⚡
                    </div>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#09090b', display: 'block' }}>
                        Mobile Money &amp; Carte (LeekPay)
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        MTN MoMo, Moov, Celtiis, Visa, Mastercard
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '10px', fontWeight: 800, background: '#0284c7', color: '#ffffff', padding: '2px 8px', borderRadius: '10px' }}>
                    SÉCURISÉ
                  </span>
                </button>

                {/* COD option */}
                <button
                  type="button"
                  onClick={() => setPaymentMethod('COD')}
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: paymentMethod === 'COD' ? '2px solid #059669' : '1px solid #e2e8f0',
                    background: paymentMethod === 'COD' ? '#f0fdf4' : '#ffffff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px',
                      background: '#059669',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 900,
                      fontSize: '14px'
                    }}>
                      💵
                    </div>
                    <div>
                      <strong style={{ fontSize: '13px', color: '#09090b', display: 'block' }}>
                        Paiement à la Livraison (Espèces)
                      </strong>
                      <span style={{ fontSize: '11px', color: '#64748b' }}>
                        Réglez au coursier après réception du colis
                      </span>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            <button 
              className="btn btn-accent btn-lg" 
              style={{ 
                width: '100%', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '50px', 
                gap: '8px', 
                fontSize: '14px',
                fontWeight: 800,
                borderRadius: '30px',
                background: '#111111',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
              }}
              onClick={handleCheckout}
            >
              {!user
                ? '🔐 Se Connecter pour Commander'
                : selectedPaymentPlan === '1x'
                ? `💳 Payer ${formatPrice(convertedTotal, currency)}`
                : `💳 Payer la 1ère mensualité (${formatPrice(
                    selectedPaymentPlan === '2x'
                      ? Math.round((convertedTotal / 2) * 100) / 100
                      : Math.round((convertedTotal / 3) * 100) / 100,
                    currency
                  )}) en ${selectedPaymentPlan.toUpperCase()}`}
            </button>
            
            <Link href="/products" style={{ textAlign: 'center', fontSize: '13px', color: '#64748b', display: 'block', textDecoration: 'underline' }}>
              {t('cart.continueShopping')}
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAppStore, formatPrice, convertPrice, getProductPrice, calculateBeninDelivery, BeninDeliveryCalculation, filterCities, CityItem, calculatePointsEarned } from '@/lib/store';
import { getVariantInfo } from '@/lib/products-data';
import { useTranslation } from '@/lib/i18n';
import { trackPixelEvent } from '@/lib/pixel-tracker';

// Specific aura glow colors per product for the dynamic studio background
const getGlowColor = (id: string) => {
  switch (id) {
    case 'p1': return 'rgba(239, 68, 68, 0.35)'; // Nike Air Red Glow
    case 'p3': return 'rgba(244, 63, 94, 0.35)'; // Heels Rose Glow
    case 'p4': return 'rgba(59, 130, 246, 0.35)'; // Blue T-shirt Glow
    case 'ls1': return 'rgba(168, 85, 247, 0.30)'; // Purple Jersey
    case 'sw1': return 'rgba(239, 68, 68, 0.35)'; // Red Hoodie
    default: return 'rgba(59, 130, 246, 0.25)'; // Default Ice Blue Aura
  }
};

const colorMap: Record<string, string> = {
  'Noir': '#111111',
  'Blanc': '#ffffff',
  'Rouge': '#ef4444',
  'Bleu': '#3b82f6',
  'Gris': '#9ca3af',
  'Beige': '#d4b895',
  'Marine': '#1e3a8a',
  'Bleu Délavé': '#60a5fa',
  'Rose': '#f472b6',
  'Jaune': '#eab308',
  'Marron': '#78350f',
  'Cognac': '#9a3412',
  'Gris Anthracite': '#374151',
  'Bleu Marine': '#1e3a8a',
  'Argent': '#cbd5e1',
  'Doré': '#eab308',
  'Or': '#eab308',
  'Or Rose': '#fda4af',
  'Naturel': '#fef08a',
  'Vert': '#10b981',
  'Kaki': '#57534e',
  'Camel': '#b45309',
  'Bordeaux': '#881337',
  'Corail': '#f43f5e',
  'Violet': '#8b5cf6',
  'Bronze': '#78350f',
  'Nude': '#f5d0c5',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  
  const { 
    language, 
    currency, 
    addToCart, 
    toggleFavorite, 
    favorites, 
    products, 
    setProducts, 
    deliveryZones, 
    freeShippingThreshold, 
    detectedLocationId, 
    locations, 
    user, 
    selectedShippingAddress, 
    setSelectedShippingAddress,
    reviews,
    likeProductReview,
    addProductReview,
    addPointTransaction,
    grantClientBonusPoints,
    addNotification,
    blogPosts,
    setQuickBuyProduct
  } = useAppStore();
  const { t } = useTranslation(language);

  // Auto sync products if not loaded yet
  useEffect(() => {
    async function sync() {
      try {
        const res = await fetch('/api/products');
        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.products) && data.products.length > 0) {
            setProducts(data.products);
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    if (products.length === 0) {
      sync();
    }
  }, [products.length, setProducts]);

  // Look up product dynamically from Zustand
  const product = useMemo(() => products.find(p => p.slug === slug), [products, slug]);

  // Dynamic Product Reviews
  const productReviews = useMemo(() => {
    if (!product?.id) return [];
    return (reviews || []).filter(r => r.productId === product.id && r.status !== 'REJECTED');
  }, [reviews, product?.id]);

  const avgRating = useMemo(() => {
    if (productReviews.length === 0) return product?.rating || 5.0;
    const sum = productReviews.reduce((acc, r) => acc + r.rating, 0);
    return Math.round((sum / productReviews.length) * 10) / 10;
  }, [productReviews, product?.rating]);

  const totalReviewsCount = productReviews.length > 0 ? productReviews.length : (product?.reviewCount || 0);

  // Review Form Modal State
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewHoverRating, setReviewHoverRating] = useState(0);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [reviewPhoto, setReviewPhoto] = useState('');
  const [reviewToast, setReviewToast] = useState<string | null>(null);

  const showToastMsg = (msg: string) => {
    setReviewToast(msg);
    setTimeout(() => setReviewToast(null), 3500);
  };

  const handleProductReviewPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result as string;
      if (result) {
        setReviewPhoto(result);
        showToastMsg('Photo jointe avec succès !');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProductSubmitReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;
    if (!user) {
      router.push(`/auth/login?redirect=/products/${slug}`);
      return;
    }
    if (!reviewComment.trim()) {
      showToastMsg('⚠️ Veuillez rédiger un bref commentaire.');
      return;
    }

    addProductReview({
      productId: product.id,
      productName: product.name_fr,
      productImage: product.images?.[0] || '',
      customerName: user.name || 'Client Aymard Store',
      customerEmail: user.email,
      rating: reviewRating,
      title: reviewTitle.trim() || 'Avis vérifié',
      comment: reviewComment.trim(),
      photo: reviewPhoto || undefined,
      verifiedPurchase: true,
      status: 'APPROVED',
      likesCount: 1
    });

    addPointTransaction({
      userEmail: user.email,
      userName: user.name,
      type: 'BONUS',
      amount: 50,
      description: `Bonus VIP : Avis client sur ${product.name_fr}`,
    });

    grantClientBonusPoints(user.email, 50, `Avis client déposé`);

    addNotification({
      targetEmail: user.email,
      title: '⭐ 50 Points VIP Gagnés !',
      message: `Merci pour votre retour sur ${product.name_fr}. 50 points de fidélité ont été ajoutés à votre solde.`,
      type: 'SYSTEM'
    });

    showToastMsg('🎉 Merci pour votre avis ! +50 Points VIP vous ont été crédités.');
    setShowReviewModal(false);
    setReviewTitle('');
    setReviewComment('');
    setReviewPhoto('');
  };

  // UI state
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [mainImage, setMainImage] = useState('');
  const [addedToast, setAddedToast] = useState(false);
  
  // Helper to format shoe/product size without 'EU'
  const formatSizeDisplay = (s?: string) => s ? s.replace(/\s*EU\b/gi, '').trim() : '';

  const activeLoc = useMemo(() => {
    return locations.find(l => l.id === detectedLocationId) || locations[0];
  }, [locations, detectedLocationId]);

  const isBenin = activeLoc.id === 'benin' || currency === 'FCFA';
  const isFrance = !isBenin && activeLoc.id === 'france';

  // Delivery Location State (Connected with global store & saved addresses)
  const defaultSaved = user?.savedAddresses?.find(a => a.isDefault) || user?.savedAddresses?.[0];
  const initialCity = selectedShippingAddress?.city || defaultSaved?.city || (isBenin ? 'Cotonou' : (isFrance ? 'Paris' : 'Bruxelles'));
  const initialAddress = selectedShippingAddress?.street || defaultSaved?.street || '';

  const [customCity, setCustomCity] = useState(initialCity);
  const [customAddress, setCustomAddress] = useState(initialAddress);
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [debouncedCity, setDebouncedCity] = useState(initialCity);
  const [showCityDropdown, setShowCityDropdown] = useState(false);

  // Sync back to store if user navigates or changes location
  useEffect(() => {
    if (selectedShippingAddress?.city && selectedShippingAddress.city !== customCity) {
      setCustomCity(selectedShippingAddress.city);
    }
    if (selectedShippingAddress?.street && selectedShippingAddress.street !== customAddress) {
      setCustomAddress(selectedShippingAddress.street);
    }
  }, [selectedShippingAddress]);

  // Filtered city list based on user typed query and active country
  const citySuggestions = useMemo(() => {
    return filterCities(customCity, activeLoc.id);
  }, [customCity, activeLoc.id]);

  // Live calculation timing based on city: updates within ~150ms (< 1s)
  useEffect(() => {
    setIsCalculatingDelivery(true);
    const timer = setTimeout(() => {
      setDebouncedCity(customCity);
      setIsCalculatingDelivery(false);
      setSelectedShippingAddress({
        city: customCity,
        street: customAddress,
        zipCode: '01BP',
        country: activeLoc.name
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [customCity, customAddress, activeLoc.name, setSelectedShippingAddress]);

  const beninCalc = useMemo(() => {
    return calculateBeninDelivery(debouncedCity, deliveryZones);
  }, [debouncedCity, deliveryZones]);

  // Installment plan choice & explainer (Max 3X sans frais)
  const [selectedInstallmentPlan, setSelectedInstallmentPlan] = useState<'1x' | '2x' | '3x'>('1x');
  const [showInstallmentExplainer, setShowInstallmentExplainer] = useState(false);
  
  // Size Guide Modal state
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [sizeGuideTab, setSizeGuideTab] = useState<'clothing' | 'shoes'>('clothing');
  
  // Accordions state
  const [accordions, setAccordions] = useState({
    description: true,
    shipping: false,
    details: false
  });

  // Hype dynamic views counter
  const [liveViews, setLiveViews] = useState(124);

  // 3D Tilt Style for the Product Showcase
  const [tiltStyle, setTiltStyle] = useState<React.CSSProperties>({});

  // Initial values setup
  useEffect(() => {
    if (product) {
      if (product.colors && product.colors.length > 0) setSelectedColor(product.colors[0]);
      if (product.sizes && product.sizes.length > 0) setSelectedSize(product.sizes[0]);
      if (product.images && product.images.length > 0) setMainImage(product.images[0]);
    }
  }, [product]);

  // Simulating live views fluctuation
  useEffect(() => {
    setLiveViews(Math.floor(Math.random() * 30) + 85);
    const interval = setInterval(() => {
      setLiveViews(prev => {
        const delta = Math.floor(Math.random() * 5) - 2;
        return Math.max(70, Math.min(160, prev + delta));
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Localized price resolution for detected country (Bénin, France, Belgique)
  const priceInfo = useMemo(() => {
    return product ? getProductPrice(product, detectedLocationId) : {
      price: 0,
      comparePrice: undefined as number | undefined,
      currency: 'EUR',
      currencySymbol: '€',
      formattedPrice: '0 €',
      formattedComparePrice: undefined as string | undefined,
      isCustom: false,
      location: locations[0]
    };
  }, [product, detectedLocationId, locations]);
  const convertedPrice = priceInfo.price;
  const convertedComparePrice = priceInfo.comparePrice;
  const discount = priceInfo.comparePrice ? Math.round(((priceInfo.comparePrice - priceInfo.price) / priceInfo.comparePrice) * 100) : 0;

  // Track ViewContent on Product Page Load
  useEffect(() => {
    if (product) {
      trackPixelEvent({
        eventName: 'ViewContent',
        content_name: product.name_fr,
        content_category: product.category,
        content_ids: [product.id],
        value: convertedPrice,
        currency: currency === 'FCFA' ? 'XOF' : 'EUR'
      });
    }
  }, [product, convertedPrice, currency]);

  if (!product) {
    return (
      <div className="product-detail-container" style={{ textAlign: 'center', padding: '100px 20px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Produit non trouvé</h2>
        <p style={{ color: '#64748b', marginTop: '8px' }}>L&apos;article recherché n&apos;est plus disponible ou a été déplacé.</p>
        <button onClick={() => router.push('/products')} className="btn btn-primary" style={{ marginTop: '24px', borderRadius: '30px', padding: '12px 30px' }}>
          Explorer le Catalogue
        </button>
      </div>
    );
  }

  const productName = product[`name_${language}` as keyof typeof product] as string || product.name_fr;
  const productDesc = product[`description_${language}` as keyof typeof product] as string || product.description_fr;
  const isShoe = product.category === 'shoes';
  const isWished = favorites.includes(product.id);

  const featuredBlogPosts = useMemo(() => {
    if (!product || !blogPosts) return [];
    return blogPosts.filter(bp => 
      bp.published !== false && 
      Array.isArray(bp.linkedProductIds) && 
      (bp.linkedProductIds.includes(product.id) || bp.linkedProductIds.includes(product.slug || ''))
    );
  }, [product, blogPosts]);

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor || undefined, selectedSize || undefined);
    trackPixelEvent({
      eventName: 'AddToCart',
      content_name: product.name_fr,
      content_category: product.category,
      content_ids: [product.id],
      value: convertedPrice * quantity,
      currency: currency === 'FCFA' ? 'XOF' : 'EUR',
      num_items: quantity
    });
    setAddedToast(true);
    setTimeout(() => setAddedToast(false), 3000);
  };

  const renderStars = (rating: number) => {
    return [1, 2, 3, 4, 5].map((star) => (
      <svg
        key={star}
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill={star <= Math.round(rating) ? '#f59e0b' : 'none'}
        stroke={star <= Math.round(rating) ? '#f59e0b' : '#d1d5db'}
        strokeWidth="2"
      >
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ));
  };

  // 3D Tilt calculation based on cursor position (Desktop only)
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) return;
    const box = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - box.left - box.width / 2;
    const y = e.clientY - box.top - box.height / 2;
    
    const rotateX = -(y / (box.height / 2)) * 10;
    const rotateY = (x / (box.width / 2)) * 10;
    
    setTiltStyle({
      transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.02)`,
      transition: 'none'
    });
  };

  const handleMouseLeave = () => {
    setTiltStyle({
      transform: 'perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)',
      transition: 'transform 0.4s ease'
    });
  };

  const toggleAccordion = (key: 'description' | 'shipping' | 'details') => {
    setAccordions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="product-detail-container">
      
      {/* Added to Cart Notification Toast */}
      {addedToast && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          background: '#111111',
          color: '#ffffff',
          padding: '14px 24px',
          borderRadius: '30px',
          boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '13px',
          fontWeight: 700,
          animation: 'fadeIn 0.3s ease'
        }}>
          <span style={{ fontSize: '16px' }}>✓</span>
          <span>Produit ajouté au panier !</span>
          <Link href="/cart" style={{ color: '#38bdf8', textDecoration: 'underline', marginLeft: '8px' }}>
            Voir le panier
          </Link>
        </div>
      )}

      {/* Breadcrumbs Navigation */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: '#64748b', marginBottom: '20px', flexWrap: 'wrap' }}>
        <Link href="/" style={{ color: '#64748b' }}>Accueil</Link>
        <span>/</span>
        <Link href="/products" style={{ color: '#64748b' }}>Produits</Link>
        <span>/</span>
        <Link href={`/products?category=${product.category}`} style={{ color: '#64748b', textTransform: 'capitalize' }}>
          {product.category}
        </Link>
        <span>/</span>
        <span style={{ color: '#0f172a', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
          {productName}
        </span>
      </nav>
      
      {/* Product Main Info Grid */}
      <div className="product-detail-grid">
        
        {/* Left Side: Dynamic Showcase (Sticky on PC) */}
        <div className="product-detail-gallery">
          
          {/* Showcase Box */}
          <div 
            className="product-showcase-box"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={tiltStyle}
          >
            {/* Soft Aura Glow */}
            <div 
              style={{
                position: 'absolute',
                width: '75%',
                height: '75%',
                borderRadius: '50%',
                background: getGlowColor(product.id),
                filter: 'blur(70px)',
                opacity: 0.3,
                zIndex: 0,
                pointerEvents: 'none'
              }}
            />

            {/* Pedestal Shadow */}
            <div 
              style={{
                position: 'absolute',
                bottom: '12px',
                width: '60%',
                height: '14px',
                background: 'radial-gradient(ellipse at center, rgba(0, 0, 0, 0.14) 0%, rgba(0, 0, 0, 0) 70%)',
                zIndex: 1,
                pointerEvents: 'none'
              }}
            />

            {mainImage && (
              <img 
                src={mainImage} 
                alt={productName} 
                className={`product-showcase-img ${isShoe ? 'shoe' : ''}`}
              />
            )}
            
            {/* Promo Tag */}
            {discount > 0 && (
              <span style={{ position: 'absolute', top: '14px', left: '14px', background: '#ef4444', color: '#ffffff', padding: '5px 12px', fontSize: '11px', fontWeight: 800, borderRadius: '20px', zIndex: 10 }}>
                -{discount}%
              </span>
            )}

            {/* 48H Delivery Badge */}
            {product.delivery48H && (
              <span style={{ position: 'absolute', top: '14px', right: '14px', background: '#111111', color: '#ffffff', padding: '5px 12px', fontSize: '11px', fontWeight: 800, borderRadius: '20px', zIndex: 10, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                48H
              </span>
            )}
          </div>
          
          {/* Thumbnails row (horizontal swipe on mobile) */}
          {product.images && product.images.length > 1 && (
            <div className="product-thumbnails-scroll">
              {product.images.map((img, index) => (
                <button 
                  key={index} 
                  onClick={() => setMainImage(img)}
                  className={`product-thumb-item ${mainImage === img ? 'active' : ''}`}
                  aria-label={`Vue ${index + 1}`}
                >
                  <img src={img} alt={`${productName} ${index + 1}`} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right Side: Options, Pricing & Purchase Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', textAlign: 'left' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '1.5px', display: 'block', marginBottom: '4px' }}>
              {product.brand || 'AYMARD STORE'}
            </span>

            <h1 className="product-title-heading" style={{ margin: '0 0 8px 0', fontSize: '24px', fontWeight: 900, color: '#09090b', letterSpacing: '-0.3px', lineHeight: 1.25 }}>
              {productName}
            </h1>
            
            {/* Rating & Stock Status Line */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', marginBottom: '14px' }}>
              {totalReviewsCount > 0 ? (
                <div 
                  onClick={() => {
                    const el = document.getElementById('customer-reviews-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '4px', cursor: 'pointer' }}
                  title="Consulter les avis clients vérifiés"
                >
                  {renderStars(avgRating)}
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 700, marginLeft: '4px' }}>
                    {avgRating.toFixed(1)} ({totalReviewsCount} avis)
                  </span>
                </div>
              ) : (
                <div 
                  onClick={() => {
                    const el = document.getElementById('customer-reviews-section');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}
                  title="Donner le premier avis"
                >
                  <span style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 700 }}>
                    ⭐ 0 avis (Soyez le premier à noter)
                  </span>
                </div>
              )}
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: product.stock > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', color: product.stock > 0 ? '#059669' : '#dc2626', fontSize: '11px', fontWeight: 800, padding: '3px 10px', borderRadius: '12px' }}>
                <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'currentColor' }} />
                {product.stock > 0 ? 'En Stock' : 'Épuisé'}
              </span>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>
                • Ref: #{product.id.slice(0, 6)}
              </span>
            </div>
          </div>

          {/* Pricing Display */}
          <div style={{ borderBottom: '1px solid #f1f5f9', paddingBottom: '14px', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '12px', flexWrap: 'wrap' }}>
              <span className="product-price-display" style={{ fontSize: '26px', fontWeight: 900, color: '#09090b', fontFamily: 'var(--font-plus-jakarta)' }}>
                {priceInfo.formattedPrice}
              </span>
              {priceInfo.formattedComparePrice && (
                <span style={{ fontSize: '16px', textDecoration: 'line-through', color: '#94a3b8', fontWeight: 600 }}>
                  {priceInfo.formattedComparePrice}
                </span>
              )}
            </div>
            <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>Paiement à la livraison disponible</span>
              <span>·</span>
              <span>Option 3x sans frais</span>
            </div>
          </div>

          {/* Color Selection */}
          {product.colors && product.colors.length > 0 && (
            <div style={{ marginBottom: '16px' }}>
              <h4 style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '8px', color: '#09090b' }}>
                Couleur : <span style={{ fontWeight: 600, color: '#64748b', textTransform: 'none' }}>{selectedColor}</span>
              </h4>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {product.colors.map(color => {
                  const hex = colorMap[color] || '#e5e7eb';
                  const isSelected = selectedColor === color;
                  const isWhite = hex.toLowerCase() === '#ffffff';
                  return (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className="product-option-btn"
                      style={{
                        border: isSelected ? '2px solid #09090b' : '1px solid #e2e8f0',
                        background: isSelected ? '#f8fafc' : '#ffffff',
                        color: '#09090b',
                        gap: '6px',
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: 700
                      }}
                    >
                      <span 
                        style={{ 
                          width: '10px', 
                          height: '10px', 
                          borderRadius: '50%', 
                          backgroundColor: hex,
                          border: isWhite ? '1px solid #d1d5db' : 'none',
                          display: 'inline-block'
                        }} 
                      />
                      {color}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Size / Variant Selection */}
          {product.sizes && product.sizes.length > 0 && (() => {
            const variantInfo = getVariantInfo(product);
            return (
              <div style={{ marginBottom: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ fontSize: '11.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: '#09090b', margin: 0 }}>
                    {variantInfo.label} : <span style={{ fontWeight: 700, color: '#09090b', textTransform: 'none' }}>{formatSizeDisplay(selectedSize)}</span>
                  </h4>
                  {variantInfo.type !== 'unique' && (
                    <button 
                      type="button"
                      onClick={() => {
                        setSizeGuideTab(isShoe ? 'shoes' : 'clothing');
                        setShowSizeGuide(true);
                      }}
                      style={{ background: 'none', border: 'none', textDecoration: 'underline', fontSize: '11.5px', fontWeight: 700, color: '#64748b', cursor: 'pointer', padding: 0 }}
                    >
                      Guide des Tailles
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {product.sizes.map(size => {
                    const isSelected = selectedSize === size;
                    return (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className="product-option-btn"
                        style={{
                          minWidth: '46px',
                          height: '42px',
                          border: isSelected ? '2px solid #09090b' : '1px solid #e2e8f0',
                          background: isSelected ? '#09090b' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#09090b',
                          fontWeight: 800,
                          fontSize: '13px',
                          borderRadius: '12px',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        {formatSizeDisplay(size)}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Actions: Direct Buy Now, Add to Cart, Quantity & Wishlist */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
            
            {/* Primary Action: High-converting luxury CTA */}
            <button 
              type="button"
              style={{ 
                width: '100%', 
                height: '52px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                gap: '10px', 
                backgroundColor: '#09090b', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '30px', 
                fontWeight: 900, 
                letterSpacing: '0.6px', 
                textTransform: 'uppercase',
                fontSize: '13px',
                cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                transition: 'all 0.2s ease'
              }}
              onClick={() => {
                if (product.stock > 0) {
                  setQuickBuyProduct({
                    product,
                    size: selectedSize || product.sizes?.[0],
                    color: selectedColor || product.colors?.[0],
                    quantity: quantity
                  });
                }
              }}
              disabled={product.stock === 0}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              <span>{product.stock > 0 ? 'COMMANDER MAINTENANT' : 'PRODUIT ÉPUISÉ'}</span>
            </button>

            {/* Secondary Action Row: Add to Cart + Quantity + Wishlist */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button 
                type="button"
                style={{ 
                  flex: 1,
                  height: '44px', 
                  display: 'flex', 
                  justifyContent: 'center', 
                  alignItems: 'center', 
                  gap: '8px', 
                  backgroundColor: '#ffffff', 
                  color: '#09090b', 
                  border: '1.5px solid #e2e8f0', 
                  borderRadius: '24px', 
                  fontWeight: 800, 
                  fontSize: '12.5px',
                  cursor: product.stock === 0 ? 'not-allowed' : 'pointer',
                  transition: 'all 0.15s ease'
                }}
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <span>Ajouter au Panier</span>
              </button>

              {/* Quantity selector */}
              <div style={{ display: 'flex', alignItems: 'center', border: '1px solid #e2e8f0', borderRadius: '24px', overflow: 'hidden', background: '#ffffff', height: '44px' }}>
                <button 
                  onClick={() => setQuantity(q => Math.max(1, q - 1))}
                  style={{ width: '32px', height: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 700, color: '#09090b' }}
                  aria-label="Diminuer quantité"
                >
                  -
                </button>
                <span style={{ width: '24px', textAlign: 'center', fontSize: '12.5px', fontWeight: 800, color: '#09090b' }}>{quantity}</span>
                <button 
                  onClick={() => setQuantity(q => Math.min(product.stock, q + 1))}
                  style={{ width: '32px', height: '100%', background: 'none', border: 'none', cursor: 'pointer', fontSize: '16px', fontWeight: 700, color: '#09090b' }}
                  disabled={quantity >= product.stock}
                  aria-label="Augmenter quantité"
                >
                  +
                </button>
              </div>

              {/* Wishlist Button */}
              <button 
                onClick={() => toggleFavorite(product.id)}
                aria-label={isWished ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                style={{ 
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '1px solid #e2e8f0',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: isWished ? '#dc2626' : '#64748b',
                  flexShrink: 0
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill={isWished ? '#dc2626' : 'none'} stroke={isWished ? '#dc2626' : 'currentColor'} strokeWidth="2.2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Micro-Reassurance Strip */}
          <div style={{
            marginTop: '16px',
            padding: '10px 14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '11px',
            fontWeight: 700,
            color: '#475569',
            flexWrap: 'wrap',
            gap: '8px'
          }}>
            <span>✓ 100% Authentique &amp; Neuf</span>
            <span>✓ Expédition 24/48h</span>
            <span>✓ Suivi WhatsApp</span>
          </div>

          {/* Collapsible Drawers (Accordions) */}
          <div style={{ display: 'flex', flexDirection: 'column', borderTop: '1px solid #e2e8f0', marginTop: '16px' }}>
            
            {/* Description Drawer */}
            <div style={{ borderBottom: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => toggleAccordion('description')}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#111111' }}
              >
                <span>Description du Produit</span>
                <span style={{ fontSize: '16px', fontWeight: 400 }}>{accordions.description ? '−' : '+'}</span>
              </button>
              {accordions.description && (
                <div style={{ paddingBottom: '14px', fontSize: '13px', lineHeight: 1.7, color: '#475569' }}>
                  {productDesc}
                </div>
              )}
            </div>

            {/* Shipping & Returns Drawer */}
            <div style={{ borderBottom: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => toggleAccordion('shipping')}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#111111' }}
              >
                <span>Livraison &amp; Retours</span>
                <span style={{ fontSize: '16px', fontWeight: 400 }}>{accordions.shipping ? '−' : '+'}</span>
              </button>
              {accordions.shipping && (
                <div style={{ paddingBottom: '14px', fontSize: '13px', lineHeight: 1.7, color: '#475569' }}>
                  Nos colis sont soigneusement expédiés sous emballage renforcé avec numéro de suivi en direct via WhatsApp.
                  <div style={{ marginTop: '8px', padding: '8px 12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', color: '#475569', fontSize: '12px' }}>
                    En raison du caractère rare et exclusif de nos collections, les vérifications se font à la réception.
                  </div>
                </div>
              )}
            </div>

            {/* Product Details Drawer */}
            <div style={{ borderBottom: '1px solid #e2e8f0' }}>
              <button 
                onClick={() => toggleAccordion('details')}
                style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: '#111111' }}
              >
                <span>Détails &amp; Entretien</span>
                <span style={{ fontSize: '16px', fontWeight: 400 }}>{accordions.details ? '−' : '+'}</span>
              </button>
              {accordions.details && (
                <div style={{ paddingBottom: '14px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', fontWeight: 700, color: '#111111', width: '140px' }}>Catégorie</td>
                        <td style={{ padding: '8px 0', color: '#475569', textTransform: 'capitalize' }}>{product.category}</td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={{ padding: '8px 0', fontWeight: 700, color: '#111111' }}>Disponibilité</td>
                        <td style={{ padding: '8px 0', color: '#475569' }}>{product.stock} exemplaires en stock</td>
                      </tr>
                      <tr>
                        <td style={{ padding: '8px 0', fontWeight: 700, color: '#111111' }}>Authenticité</td>
                        <td style={{ padding: '8px 0', color: '#475569' }}>100% Neuf certifié avec boîte d&apos;origine</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ========================================================================= */}
      {/* 📖 FEATURED IN AYMARD JOURNAL / BLOG EDITORIAL */}
      {/* ========================================================================= */}
      {featuredBlogPosts.length > 0 && (
        <section
          style={{
            maxWidth: '1280px',
            margin: '40px auto 10px auto',
            padding: '0 20px',
            boxSizing: 'border-box'
          }}
        >
          <div style={{
            background: 'linear-gradient(135deg, #121215 0%, #18181b 100%)',
            border: '1px solid #27272a',
            borderRadius: '24px',
            padding: '28px 32px',
            color: '#ffffff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <span style={{ fontSize: '11px', color: '#38bdf8', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>📰</span> LE JOURNAL AYMARD STORE
                </span>
                <h3 style={{ fontSize: '22px', fontWeight: 900, color: '#ffffff', margin: '4px 0 0 0' }}>
                  Vu dans notre Journal &amp; Conseils de Style
                </h3>
              </div>
              <Link 
                href="/blog" 
                style={{ color: '#ffffff', fontSize: '12.5px', fontWeight: 800, textDecoration: 'none', background: '#27272a', padding: '8px 16px', borderRadius: '20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                Explorer le Journal ➔
              </Link>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '16px'
            }}>
              {featuredBlogPosts.map(bp => (
                <Link
                  key={bp.id}
                  href={`/blog/${bp.slug}`}
                  style={{
                    background: '#09090b',
                    border: '1px solid #27272a',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    textDecoration: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'border-color 0.2s ease'
                  }}
                >
                  <img src={bp.coverImage} alt={bp.title} style={{ width: '100%', height: '140px', objectFit: 'cover' }} />
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 800, textTransform: 'uppercase' }}>
                        {bp.category}
                      </span>
                      <span style={{ fontSize: '10.5px', color: '#71717a' }}>⏱️ {bp.readTime}</span>
                    </div>
                    <strong style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', lineHeight: 1.35, marginBottom: '8px' }}>
                      {bp.title}
                    </strong>
                    <p style={{ fontSize: '12px', color: '#a1a1aa', lineHeight: 1.5, margin: '0 0 12px 0', flex: 1 }}>
                      {bp.excerpt}
                    </p>
                    <span style={{ fontSize: '11.5px', fontWeight: 800, color: '#38bdf8', marginTop: 'auto' }}>
                      Lire l&apos;article ➔
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ========================================================================= */}
      {/* DYNAMIC CUSTOMER REVIEWS & EXPERIENCES SECTION */}
      {/* ========================================================================= */}
      <section
        id="customer-reviews-section"
        style={{
          maxWidth: '1280px',
          margin: '40px auto 20px auto',
          padding: '0 20px',
          boxSizing: 'border-box'
        }}
      >
        <div style={{
          background: '#ffffff',
          borderRadius: '24px',
          border: '1px solid #e2e8f0',
          padding: '28px 24px',
          boxShadow: '0 4px 20px -4px rgba(0,0,0,0.03)'
        }}>
          {/* Clean Header row */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '16px',
            borderBottom: '1px solid #f1f5f9',
            paddingBottom: '20px',
            marginBottom: '24px'
          }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#f1f5f9', color: '#09090b', padding: '3px 10px', borderRadius: '12px', fontSize: '10.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: '6px' }}>
                Retours vérifiés
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 900, color: '#09090b', margin: 0, letterSpacing: '-0.3px' }}>
                Avis &amp; Expériences ({totalReviewsCount})
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: '2px 0 0 0' }}>
                Tous les avis proviennent de commandes réelles et certifiées.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (!user) {
                  router.push(`/auth/login?redirect=/products/${slug}`);
                } else {
                  setShowReviewModal(true);
                }
              }}
              style={{
                background: '#09090b',
                color: '#ffffff',
                border: 'none',
                borderRadius: '20px',
                padding: '9px 18px',
                fontSize: '12px',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 10px rgba(0,0,0,0.12)',
                transition: 'all 0.15s ease'
              }}
            >
              <span>{user ? 'Rédiger un avis (+50 Pts VIP)' : 'Donner mon avis'}</span>
            </button>
          </div>

          {/* If 0 reviews: Single elegant empty state */}
          {productReviews.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '36px 20px',
              background: '#f8fafc',
              borderRadius: '18px',
              border: '1px dashed #cbd5e1',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px'
            }}>
              <div style={{ display: 'flex', gap: '3px', color: '#cbd5e1', fontSize: '20px' }}>
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#09090b', margin: 0 }}>
                Soyez le premier à donner votre avis sur cette pièce
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', margin: 0, maxWidth: '400px', lineHeight: 1.5 }}>
                Commandez cet article dès aujourd&apos;hui et partagez votre expérience avec la communauté Aymard Store.
              </p>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    router.push(`/auth/login?redirect=/products/${slug}`);
                  } else {
                    setShowReviewModal(true);
                  }
                }}
                style={{
                  background: '#09090b',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '20px',
                  padding: '9px 20px',
                  fontSize: '12px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  marginTop: '4px'
                }}
              >
                Laisser le 1er avis →
              </button>
            </div>
          ) : (
            <div>
              {/* Ratings Overview Card */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '20px',
                background: '#f8fafc',
                borderRadius: '16px',
                padding: '20px',
                marginBottom: '24px',
                border: '1px solid #e2e8f0'
              }}>
                {/* Score Big */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                  <div style={{ fontSize: '40px', fontWeight: 900, color: '#09090b', lineHeight: 1 }}>
                    {avgRating.toFixed(1)}
                  </div>
                  <div style={{ display: 'flex', gap: '3px', fontSize: '16px', color: '#f59e0b', margin: '6px 0 2px 0' }}>
                    {renderStars(avgRating)}
                  </div>
                  <div style={{ fontSize: '11.5px', color: '#64748b', fontWeight: 600 }}>
                    Basé sur {totalReviewsCount} avis authentiques
                  </div>
                </div>

                {/* Stars Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', justifyContent: 'center' }}>
                  {[5, 4, 3, 2, 1].map((star) => {
                    const count = productReviews.filter(r => r.rating === star).length;
                    const percent = totalReviewsCount > 0 ? Math.round((count / totalReviewsCount) * 100) : 0;
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px' }}>
                        <span style={{ width: '32px', fontWeight: 700, color: '#475569', display: 'flex', alignItems: 'center', gap: '2px' }}>
                          <span>{star}</span>
                          <span style={{ color: '#f59e0b' }}>★</span>
                        </span>
                        <div style={{ flex: 1, height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                          <div style={{ width: `${percent}%`, height: '100%', background: '#09090b', borderRadius: '3px' }} />
                        </div>
                        <span style={{ width: '30px', textAlign: 'right', fontWeight: 700, color: '#64748b', fontSize: '11px' }}>
                          {percent}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Reviews List */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {productReviews.map((rev) => (
                  <div
                    key={rev.id}
                    style={{
                      background: '#fcfcfc',
                      border: '1px solid #e2e8f0',
                      borderRadius: '16px',
                      padding: '18px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '12px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <div>
                          <strong style={{ fontSize: '13px', color: '#09090b', display: 'block' }}>
                            {rev.customerName || 'Client Vérifié'}
                          </strong>
                          <span style={{ fontSize: '10.5px', color: '#059669', fontWeight: 700 }}>
                            ✓ Achat Vérifié
                          </span>
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                          {rev.date}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '2px', color: '#f59e0b', fontSize: '13px', marginBottom: '6px' }}>
                        {renderStars(rev.rating)}
                      </div>

                      <h4 style={{ fontSize: '13px', fontWeight: 800, color: '#09090b', margin: '0 0 4px 0' }}>
                        {rev.title}
                      </h4>
                      <p style={{ fontSize: '12.5px', color: '#475569', margin: 0, lineHeight: 1.5 }}>
                        {rev.comment}
                      </p>

                      {rev.photo && (
                        <div style={{ marginTop: '10px', width: '80px', height: '80px', borderRadius: '10px', overflow: 'hidden', border: '1px solid #e2e8f0' }}>
                          <img src={rev.photo} alt="Photo avis" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #f1f5f9', paddingTop: '10px' }}>
                      <button
                        type="button"
                        onClick={() => likeProductReview(rev.id)}
                        style={{
                          background: 'none',
                          border: '1px solid #e2e8f0',
                          borderRadius: '16px',
                          padding: '3px 10px',
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#475569',
                          cursor: 'pointer'
                        }}
                      >
                        Utile ({rev.likesCount || 0})
                      </button>
                      <span style={{ fontSize: '10.5px', color: '#94a3b8' }}>
                        Aymard VIP
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mobile Sticky Bottom Fast Buy Bar (Optimized for Mobile) */}
      <div className="mobile-sticky-buy-bar">
        <div>
          <div style={{ fontSize: '10.5px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
            {selectedSize ? (isShoe ? `Pointure ${formatSizeDisplay(selectedSize)}` : `Taille ${formatSizeDisplay(selectedSize)}`) : 'Prix'}
          </div>
          <div style={{ fontSize: '15px', fontWeight: 900, color: '#09090b', fontFamily: 'var(--font-plus-jakarta)' }}>
            {formatPrice(convertedPrice, currency)}
          </div>
        </div>
        <button 
          onClick={() => {
            if (product.stock > 0) {
              setQuickBuyProduct({
                product,
                size: selectedSize || product.sizes?.[0],
                color: selectedColor || product.colors?.[0],
                quantity: quantity
              });
            }
          }}
          className="mobile-sticky-buy-btn"
          disabled={product.stock === 0}
          style={{
            background: '#09090b',
            color: '#ffffff',
            borderRadius: '24px',
            height: '44px',
            padding: '0 20px',
            fontSize: '12.5px',
            fontWeight: 800,
            letterSpacing: '0.4px',
            textTransform: 'uppercase',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            boxShadow: '0 4px 14px rgba(0,0,0,0.2)'
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
          <span>{product.stock > 0 ? 'Commander' : 'Épuisé'}</span>
        </button>
      </div>

      {/* Size Guide Modal matching exact structure of uploaded screenshot with smart clothing/shoes tabs */}
      {showSizeGuide && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(5px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setShowSizeGuide(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '580px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '28px 30px',
              position: 'relative',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              border: '1px solid #e2e8f0'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header matching image */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '22px' }}>📏</span>
                <h2 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: 0, fontFamily: 'serif' }}>
                  Guide des Tailles
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setShowSizeGuide(false)}
                aria-label="Fermer"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  border: 'none',
                  color: '#0f172a',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  fontWeight: 800,
                  cursor: 'pointer'
                }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 18px 0', lineHeight: 1.5 }}>
              Correspondance indicative pour les vêtements et chaussures / claquettes Aymard Store.
            </p>

            {/* Smart Category Tabs */}
            <div style={{ display: 'flex', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '14px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => setSizeGuideTab('clothing')}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: sizeGuideTab === 'clothing' ? '#ffffff' : 'transparent',
                  color: sizeGuideTab === 'clothing' ? '#0f172a' : '#64748b',
                  fontWeight: sizeGuideTab === 'clothing' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: sizeGuideTab === 'clothing' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>👕</span> Vêtements
              </button>

              <button
                type="button"
                onClick={() => setSizeGuideTab('shoes')}
                style={{
                  flex: 1,
                  padding: '9px 14px',
                  borderRadius: '10px',
                  border: 'none',
                  background: sizeGuideTab === 'shoes' ? '#ffffff' : 'transparent',
                  color: sizeGuideTab === 'shoes' ? '#0f172a' : '#64748b',
                  fontWeight: sizeGuideTab === 'shoes' ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  boxShadow: sizeGuideTab === 'shoes' ? '0 2px 8px rgba(0,0,0,0.06)' : 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <span>👟</span> Chaussures &amp; Claquettes
              </button>
            </div>

            {/* 1. Vêtements Table */}
            {sizeGuideTab === 'clothing' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#e8f5e9', color: '#166534' }}>
                        <th style={{ padding: '12px 14px', fontWeight: 800, width: '70px' }}>Taille</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800 }}>Poids conseillé</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800 }}>Tour de poitrine</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800 }}>Stature</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800 }}>Coupe &amp; Style</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { size: 'S', weight: '48 - 60 kg', chest: '88 - 94 cm', height: '160 - 170 cm', fit: 'Coupe ajustée / Slim' },
                        { size: 'M', weight: '60 - 72 kg', chest: '95 - 102 cm', height: '170 - 178 cm', fit: 'Coupe standard régulière' },
                        { size: 'L', weight: '72 - 84 kg', chest: '103 - 110 cm', height: '175 - 185 cm', fit: 'Coupe confort / Tendance' },
                        { size: 'XL', weight: '84 - 95 kg', chest: '111 - 118 cm', height: '180 - 190 cm', fit: 'Coupe large / Ample' },
                        { size: 'XXL', weight: '95 - 110 kg', chest: '119 - 128 cm', height: '185 cm+', fit: 'Grande taille confort' },
                        { size: '3XL', weight: '110 kg+', chest: '129 cm+', height: '185 cm+', fit: 'Coupe oversize max' },
                      ].map((row, i) => (
                        <tr key={row.size} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a' }}>{row.size}</td>
                          <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>{row.weight}</td>
                          <td style={{ padding: '12px 14px', color: '#475569' }}>{row.chest}</td>
                          <td style={{ padding: '12px 14px', color: '#475569' }}>{row.height}</td>
                          <td style={{ padding: '12px 14px', color: '#047857', fontWeight: 600 }}>{row.fit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                  👕 <strong>Conseil Coupe :</strong> Si vous hésitez entre 2 tailles ou préférez un tombé <em>oversize streetwear</em>, nous vous conseillons de sélectionner la taille au-dessus.
                </div>
              </div>
            )}

            {/* 2. Chaussures & Claquettes Table */}
            {sizeGuideTab === 'shoes' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '18px' }}>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '14px', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ background: '#e8f5e9', color: '#166534' }}>
                        <th style={{ padding: '12px 14px', fontWeight: 800, width: '80px' }}>Pointure (EU)</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800 }}>Longueur Pied</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800 }}>US (H/F)</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800 }}>UK</th>
                        <th style={{ padding: '12px 14px', fontWeight: 800 }}>Morphologie &amp; Conseil</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { eu: '36', cm: '22.5 cm', us: '4.5 / 5.5', uk: '3.5', fit: 'Pied fin à standard' },
                        { eu: '37', cm: '23.5 cm', us: '5.0 / 6.0', uk: '4.0', fit: 'Pied fin à standard' },
                        { eu: '38', cm: '24.0 cm', us: '6.0 / 7.0', uk: '5.0', fit: 'Pied fin à standard' },
                        { eu: '39', cm: '24.5 cm', us: '6.5 / 7.5', uk: '5.5', fit: 'Prenez votre pointure habituelle' },
                        { eu: '40', cm: '25.0 cm', us: '7.0 / 8.0', uk: '6.0', fit: 'Prenez votre pointure habituelle' },
                        { eu: '41', cm: '26.0 cm', us: '8.0 / 9.0', uk: '7.0', fit: 'Prenez votre pointure habituelle' },
                        { eu: '42', cm: '26.5 cm', us: '8.5 / 9.5', uk: '7.5', fit: 'Standard (Si pied fort : 43)' },
                        { eu: '43', cm: '27.5 cm', us: '9.5 / 10.5', uk: '8.5', fit: 'Confort standard optimal' },
                        { eu: '44', cm: '28.0 cm', us: '10.0 / 11.0', uk: '9.0', fit: 'Pied standard à large' },
                        { eu: '45', cm: '29.0 cm', us: '11.0 / 12.0', uk: '10.0', fit: 'Pied large' },
                        { eu: '46', cm: '29.5 cm', us: '12.0 / 13.0', uk: '11.0', fit: 'Pied grand / large' },
                      ].map((row, i) => (
                        <tr key={row.eu} style={{ borderTop: '1px solid #f1f5f9', background: i % 2 === 1 ? '#fafafa' : '#ffffff' }}>
                          <td style={{ padding: '12px 14px', fontWeight: 800, color: '#0f172a' }}>{row.eu}</td>
                          <td style={{ padding: '12px 14px', color: '#334155', fontWeight: 600 }}>{row.cm}</td>
                          <td style={{ padding: '12px 14px', color: '#475569' }}>{row.us}</td>
                          <td style={{ padding: '12px 14px', color: '#475569' }}>{row.uk}</td>
                          <td style={{ padding: '12px 14px', color: '#047857', fontWeight: 600 }}>{row.fit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={{ background: '#f8fafc', padding: '10px 14px', borderRadius: '10px', fontSize: '12px', color: '#475569', lineHeight: 1.4 }}>
                  👟 <strong>Comment mesurer son pied :</strong> Posez votre talon contre un mur sur une feuille, tracez un trait devant votre orteil le plus long et mesurez la distance en cm (+0.5 cm de marge de confort).
                </div>
              </div>
            )}

            {/* Bottom Note & WhatsApp Callout matching exact phrasing from image */}
            <div style={{
              background: '#fffbeb',
              border: '1px solid #fef3c7',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <span style={{ fontSize: '18px', flexShrink: 0 }}>💡</span>
              <div style={{ fontSize: '12.5px', color: '#92400e', lineHeight: 1.5, fontStyle: 'italic' }}>
                Un doute sur votre taille ?{' '}
                <a
                  href={`https://wa.me/2290197362906?text=${encodeURIComponent(`Bonjour Aymard Store, j'aimerais un conseil sur le choix de la taille pour l'article : ${product.name_fr}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: '#047857', fontWeight: 800, textDecoration: 'underline', fontStyle: 'normal' }}
                >
                  Contactez-nous sur WhatsApp (+229 01 97 36 29 06)
                </a>
                , notre équipe vous conseille en fonction de votre morphologie.
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Product Review Submission Modal */}
      {showReviewModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setShowReviewModal(false)}
        >
          <div 
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '24px',
              maxWidth: '560px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.3)',
              border: '1px solid #e2e8f0',
              overflow: 'hidden'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid #e2e8f0',
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
                    Donner mon avis d&apos;acheteur
                  </h3>
                  <span style={{ fontSize: '11px', color: '#a1a1aa' }}>
                    {product.name_fr}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReviewModal(false)}
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

            {/* Modal Form */}
            <form onSubmit={handleProductSubmitReview} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
              {/* Product Info Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', background: '#f8fafc', padding: '12px 16px', borderRadius: '16px', border: '1px solid #e2e8f0' }}>
                <img
                  src={product.images?.[0] || 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=200'}
                  alt={product.name_fr || 'Product'}
                  style={{ width: '52px', height: '52px', borderRadius: '10px', objectFit: 'cover' }}
                />
                <div>
                  <h4 style={{ fontSize: '13.5px', fontWeight: 800, color: '#09090b', margin: '0 0 2px 0' }}>
                    {product.name_fr}
                  </h4>
                  <div style={{ fontSize: '11.5px', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span>🛡️ Avis vérifié</span>
                    <span>·</span>
                    <span style={{ color: '#f59e0b', fontWeight: 800 }}>+50 Points VIP</span>
                  </div>
                </div>
              </div>

              {/* Star Rating */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#09090b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px' }}>
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
                          color: isFilled ? '#f59e0b' : '#d1d5db',
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
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
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#09090b',
                    fontSize: '13.5px',
                    boxSizing: 'border-box'
                  }}
                />
              </div>

              {/* Comment Field */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Votre retour d&apos;expérience détaillé *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Partagez votre ressenti sur la coupe, le confort, l'authenticité et la qualité des finitions..."
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    color: '#09090b',
                    fontSize: '13.5px',
                    boxSizing: 'border-box',
                    lineHeight: 1.5
                  }}
                />
              </div>

              {/* Optional Photo Upload */}
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 800, color: '#52525b', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Photo de l&apos;article (Optionnel)
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
                      background: '#f4f4f5',
                      color: '#09090b',
                      border: '1px dashed #cbd5e1',
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
                      onChange={handleProductReviewPhoto}
                    />
                  </label>
                </div>
              </div>

              {/* Reward Callout */}
              <div style={{ background: 'rgba(250, 204, 21, 0.1)', border: '1px solid rgba(250, 204, 21, 0.3)', borderRadius: '14px', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '20px' }}>🎁</span>
                <div style={{ fontSize: '12px', color: '#854d0e', lineHeight: 1.4 }}>
                  <strong>Bonus VIP Immédiat :</strong> Vous recevrez automatiquement <strong>+50 Points VIP</strong> sur votre compte lors de la publication de cet avis.
                </div>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => setShowReviewModal(false)}
                  style={{
                    background: 'none',
                    border: '1px solid #cbd5e1',
                    color: '#52525b',
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
                  Publier mon avis (+50 Pts VIP) ➔
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Review Toast Message */}
      {reviewToast && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#09090b',
          color: '#ffffff',
          padding: '14px 28px',
          borderRadius: '30px',
          fontSize: '13px',
          fontWeight: 800,
          boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
          zIndex: 10000,
          border: '1px solid rgba(250,204,21,0.4)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'slideUp 0.25s ease-out'
        }}>
          <span>{reviewToast}</span>
        </div>
      )}

    </div>
  );
}

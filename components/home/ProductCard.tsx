'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAppStore, convertPrice, formatPrice, getProductPrice } from '@/lib/store';
import { useTranslation } from '@/lib/i18n';
import { trackPixelEvent } from '@/lib/pixel-tracker';

interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  badge?: string | null;
  stock: number;
}

export default function ProductCard({ id, name, slug, price, comparePrice, image, rating, reviewCount, badge, stock }: ProductCardProps) {
  const { language, currency, favorites, toggleFavorite, addToCart, products, detectedLocationId } = useAppStore();
  const { t } = useTranslation(language);

  const isWished = favorites.includes(id);
  const currentProduct = products.find(p => p.id === id);

  const priceInfo = currentProduct 
    ? getProductPrice(currentProduct, detectedLocationId)
    : {
        price: convertPrice(price, currency),
        comparePrice: comparePrice ? convertPrice(comparePrice, currency) : undefined,
        formattedPrice: formatPrice(convertPrice(price, currency), currency),
        formattedComparePrice: comparePrice ? formatPrice(convertPrice(comparePrice, currency), currency) : undefined
      };

  const discount = priceInfo.comparePrice && priceInfo.comparePrice > priceInfo.price
    ? Math.round((1 - priceInfo.price / priceInfo.comparePrice) * 100)
    : (comparePrice ? Math.round((1 - price / comparePrice) * 100) : 0);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (stock === 0) return;
    if (currentProduct) {
      addToCart(currentProduct, 1);
      trackPixelEvent({
        eventName: 'AddToCart',
        content_name: currentProduct.name_fr,
        content_category: currentProduct.category,
        content_ids: [currentProduct.id],
        value: priceInfo.price,
        currency: currency === 'FCFA' ? 'XOF' : 'EUR',
        num_items: 1
      });
      alert(t('common.addToCart') + ' : ' + name);
    }
  };

  const handleWishlistToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(id);
  };

  const isShoe = currentProduct?.category === 'shoes';
  const showStartingFrom = isShoe;
  const productBrand = currentProduct?.brand || 'AYMARD STORE';
  const hasDelivery48H = currentProduct?.delivery48H;

  return (
    <div className="slider-card product-card">
      <Link href={`/products/${slug}`} className="slider-card-image-link" style={{ display: 'block', textDecoration: 'none' }}>
        <div className="slider-card-image-wrapper">
          {/* Badge Top Left */}
          {badge && (
            <span className="slider-card-badge">
              {badge === 'new' ? 'NEW' : badge === 'promo' ? `-${discount}%` : badge === 'hot' ? '🔥 HOT' : badge}
            </span>
          )}
          {discount > 0 && !badge && (
            <span className="slider-card-badge">-{discount}%</span>
          )}
          
          {/* Delivery Top Right */}
          {hasDelivery48H && (
            <span className="slider-card-delivery">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{marginRight:'2px'}}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              48H
            </span>
          )}

          {/* Floating Wishlist Button */}
          <button 
            className={`product-wishlist ${isWished ? 'wished' : ''}`} 
            onClick={handleWishlistToggle} 
            aria-label="Add to favorites"
            style={{
              position: 'absolute',
              top: '12px',
              right: hasDelivery48H ? '55px' : '12px',
              background: '#ffffff',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              cursor: 'pointer',
              zIndex: 3,
              transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill={isWished ? '#dc2626' : 'none'} stroke={isWished ? '#dc2626' : '#555555'} strokeWidth="2.5">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </button>
          
          {/* Image with next/image */}
          <Image 
            src={image} 
            alt={name} 
            className={`slider-card-img ${isShoe ? 'shoe-img' : ''}`}
            loading="lazy"
            decoding="async"
            fill
            sizes="(max-width: 768px) 165px, 260px"
            style={{ objectFit: 'contain' }}
          />

          {/* Quick Add Button */}
          <button 
            className="slider-card-quick-add" 
            onClick={handleAddToCart}
            style={stock === 0 ? { backgroundColor: '#888888', cursor: 'not-allowed', border: 'none' } : { border: 'none' }}
            aria-label={stock === 0 ? t('common.outOfStock') : t('common.addToCart')}
          >
            {stock === 0 ? t('common.outOfStock') : t('common.addToCart')}
          </button>
        </div>
      </Link>
      
      <div className="slider-card-info" style={{ textAlign: 'left' }}>
        {/* Rating stars or Authenticity badge */}
        {reviewCount > 0 ? (
          <div className="slider-card-rating">
            <span className="stars">{'★'.repeat(Math.round(rating))}</span>
            <span className="rating-num">{rating.toFixed(1)} ({reviewCount})</span>
          </div>
        ) : (
          <div className="slider-card-rating" style={{ minHeight: '18px' }}>
            <span style={{ fontSize: '11px', color: '#10b981', fontWeight: 700 }}>
              ✔ 100% Authentique
            </span>
          </div>
        )}

        <h3 className="slider-card-name">
          <Link href={`/products/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>{name}</Link>
        </h3>
        <div className="slider-card-price">
          {showStartingFrom ? (
            <span className="price-start-label">à partir de </span>
          ) : null}
          <span className="price-current">{priceInfo.formattedPrice}</span>
          {priceInfo.formattedComparePrice && (
            <span className="price-compare">{priceInfo.formattedComparePrice}</span>
          )}
        </div>
      </div>
    </div>
  );
}

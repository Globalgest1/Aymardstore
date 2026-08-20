export interface Category {
  id: string;
  name_fr: string;
  name_en: string;
  name_es: string;
  slug: string;
  icon: string;
}

export interface Product {
  id: string;
  name_fr: string;
  name_en: string;
  name_es: string;
  brand?: string;
  slug: string;
  price: number;
  comparePrice?: number;
  category: string;
  images: string[];
  rating: number;
  reviewCount: number;
  stock: number;
  isNew: boolean;
  isFeatured: boolean;
  description_fr: string;
  description_en: string;
  description_es: string;
  badge: string | null;
  colors?: string[];
  sizes?: string[];
  delivery48H?: boolean;
  locationPrices?: {
    benin?: number;
    france?: number;
    belgique?: number;
    [key: string]: number | undefined;
  };
  locationComparePrices?: {
    benin?: number;
    france?: number;
    belgique?: number;
    [key: string]: number | undefined;
  };
  variantType?: 'pointure' | 'taille' | 'volume' | 'dimension' | 'unique';
  variantLabel?: string;
}

export const getVariantInfo = (product: Product): {
  type: 'pointure' | 'taille' | 'volume' | 'dimension' | 'unique';
  label: string;
  guideTitle: string;
  guideText: string;
  icon: string;
} => {
  if (product.variantType && product.variantLabel) {
    if (product.variantType === 'pointure') {
      return {
        type: 'pointure',
        label: 'Pointure',
        guideTitle: '📏 Guide des Pointures',
        guideText: "Guide des pointures : Choisissez votre pointure habituelle. En cas d'hésitation entre deux pointures, nous vous conseillons de prendre une demi-pointure au-dessus.",
        icon: '👟'
      };
    }
    if (product.variantType === 'taille') {
      return {
        type: 'taille',
        label: 'Taille',
        guideTitle: '📏 Guide des Tailles',
        guideText: 'Guide des tailles vêtements : Prenez votre taille habituelle pour une coupe standard, ou une taille au-dessus pour un style oversize tendance.',
        icon: '👕'
      };
    }
    if (product.variantType === 'volume') {
      return {
        type: 'volume',
        label: 'Volume / Contenance',
        guideTitle: '🧴 Guide des Formats',
        guideText: 'Contenance : Choisissez le volume adapté à votre utilisation (flacon nomade 30-50ml ou format classique 100-200ml).',
        icon: '🧴'
      };
    }
  }

  const name = (product.name_fr || product.name_en || '').toLowerCase();
  const cat = (product.category || '').toLowerCase();

  // Volume / Perfume / Cosmetics
  if (
    cat === 'beauty' || cat === 'cosmetics' ||
    name.includes('parfum') || name.includes('eau de') || name.includes('flacon') ||
    name.includes('creme') || name.includes('lotion') || name.includes('huile') || name.includes('spray') ||
    (product.sizes && product.sizes.some(s => /ml|cl|l\b|litre/i.test(s)))
  ) {
    return {
      type: 'volume',
      label: 'Volume / Contenance',
      guideTitle: '🧴 Guide des Formats',
      guideText: 'Contenance : Choisissez le volume adapté (30ml, 50ml, 100ml, 200ml).',
      icon: '🧴'
    };
  }

  // Shoes / Sneakers
  if (
    cat === 'shoes' || cat === 'chaussures' ||
    name.includes('sneaker') || name.includes('chaussure') || name.includes('basket') ||
    name.includes('dunk') || name.includes('jordan') || name.includes('samba') || name.includes('spezial') ||
    (product.sizes && product.sizes.some(s => /^\d{2}(\s*(eu|us|uk))?$/i.test(s.trim())))
  ) {
    return {
      type: 'pointure',
      label: 'Pointure',
      guideTitle: '📏 Guide des Pointures',
      guideText: "Guide des pointures : Choisissez votre pointure habituelle. En cas d'hésitation entre deux pointures, nous vous conseillons de prendre une demi-pointure au-dessus.",
      icon: '👟'
    };
  }

  // Clothing
  if (
    cat === 'clothing' || cat === 'vetements' || cat === 'vêtements' ||
    name.includes('pull') || name.includes('sweat') || name.includes('hoodie') ||
    name.includes('t-shirt') || name.includes('veste') || name.includes('pantalon') ||
    name.includes('short') || name.includes('maillot') || name.includes('chemise') ||
    (product.sizes && product.sizes.some(s => /^(xs|s|m|l|xl|xxl|3xl)$/i.test(s.trim())))
  ) {
    return {
      type: 'taille',
      label: 'Taille',
      guideTitle: '📏 Guide des Tailles',
      guideText: 'Guide des tailles vêtements : Prenez votre taille habituelle pour une coupe standard, ou une taille au-dessus pour un style oversize tendance.',
      icon: '👕'
    };
  }

  return {
    type: 'unique',
    label: 'Format',
    guideTitle: '📏 Format',
    guideText: 'Format standard universel.',
    icon: '📐'
  };
};

export const categories: Category[] = [
  { id: 'c1', name_fr: 'Chaussures', name_en: 'Shoes', name_es: 'Zapatos', slug: 'shoes', icon: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop' },
  { id: 'c2', name_fr: 'Vêtements', name_en: 'Clothing', name_es: 'Ropa', slug: 'clothing', icon: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=200&auto=format&fit=crop' },
  { id: 'c3', name_fr: 'Sacs', name_en: 'Bags', name_es: 'Bolsos', slug: 'bags', icon: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=200&auto=format&fit=crop' },
  { id: 'c4', name_fr: 'Bijoux', name_en: 'Jewelry', name_es: 'Joyas', slug: 'jewelry', icon: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=200&auto=format&fit=crop' },
  { id: 'c5', name_fr: 'Montres', name_en: 'Watches', name_es: 'Relojes', slug: 'watches', icon: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=200&auto=format&fit=crop' },
  { id: 'c6', name_fr: 'Accessoires', name_en: 'Accessories', name_es: 'Accesorios', slug: 'accessories', icon: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=200&auto=format&fit=crop' },
];

// Real products database from data/products.json
import rawProducts from '../data/products.json';
export const products: Product[] = (rawProducts as unknown as Product[]) || [];

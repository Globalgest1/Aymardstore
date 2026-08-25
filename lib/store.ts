import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Product, products as defaultProducts } from './products-data';

export interface CartItem {
  product: Product;
  quantity: number;
  color?: string;
  size?: string;
}

export interface Address {
  id: string;
  label: string;
  fullName: string;
  street: string;
  city: string;
  zipCode: string;
  country: string;
  phone: string;
  isDefault?: boolean;
}

export interface ClientPerk {
  id: string;
  title: string;
  description: string;
  icon?: string;
  dateGranted: string;
}

export interface PointTransaction {
  id: string;
  userEmail: string;
  userName?: string;
  date: string;
  type: 'PURCHASE' | 'REFERRAL_SIGNUP' | 'REFERRAL_PURCHASE' | 'ADMIN_GRANT' | 'CONVERSION_PROMO' | 'BONUS';
  amount: number; // Positive for earned, negative for spent/converted
  description: string;
  sourceOrderId?: string;
  referredClientName?: string;
  referredClientEmail?: string;
  currency?: 'EUR' | 'FCFA';
}

export interface User {
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN';
  phone?: string;
  avatar?: string;
  savedAddresses?: Address[];
  isVipOverride?: boolean;
  bonusPoints?: number;
  spentLoyaltyPoints?: number;
  customPerks?: ClientPerk[];
  referralCode?: string;
  referredBy?: string;
  referralClicks?: number;
  referralSignupsCount?: number;
  referralOrdersCount?: number;
  referralPointsEarned?: number;
}

export interface TrackingCheckpoint {
  id: string;
  timestamp: string;
  title: string;
  location: string;
  description?: string;
  status: 'COMPLETED' | 'IN_PROGRESS' | 'PENDING';
}

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customerEmail?: string;
  customerName?: string;
  items: CartItem[];
  total: number;
  discountApplied?: number;
  promoCodeUsed?: string;
  currency: 'EUR' | 'FCFA';
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED';
  paymentStatus?: 'PAID' | 'PENDING_PAYMENT' | 'UNPAID' | 'PENDING_DELIVERY_PAYMENT' | 'FAILED' | 'REFUNDED' | 'AWAITING_TRANSFER';
  paymentMethod?: string; // 'COD' | 'FEDAPAY_MOMO' | 'FEDAPAY_CARD' | 'MANUAL_WHATSAPP' | 'INSTALLMENTS'
  paymentTransactionId?: string;
  trackingNumber?: string;
  carrierName?: string;
  carrierPhone?: string;
  currentLocation?: string;
  trackingStatusText?: string;
  trackingStep?: number; // 1: Validée, 2: Préparée, 3: En acheminement / Pris par coursier, 4: Livrée
  estimatedDeliveryDate?: string;
  trackingHistory?: TrackingCheckpoint[];
  shippingAddress: {
    fullName: string;
    street: string;
    city: string;
    zipCode: string;
    country: string;
    phone: string;
  };
}

export interface AbandonedCheckout {
  id: string;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  city?: string;
  street?: string;
  country?: string;
  product: {
    id: string;
    name: string;
    image: string;
    size?: string;
    color?: string;
    price: number;
    currency: 'EUR' | 'FCFA';
    quantity: number;
  };
  discountCode?: string;
  discountAmount?: number;
  shippingCost?: number;
  totalAmount: number;
  currency: 'EUR' | 'FCFA';
  status: 'ABANDONED' | 'PAYMENT_FAILED' | 'RECOVERED';
  step: 'CONTACT_ENTERED' | 'PAYMENT_OPENED' | 'PAYMENT_FAILED' | 'RECOVERED';
  failureReason?: string;
  recoveryAttempts?: number;
  lastContactedAt?: string;
  recoveredAt?: string;
  notes?: string;
}

export interface MonerooSettings {
  publicKey?: string;
  secretKey: string;
  appId?: string;
  environment: 'sandbox' | 'live';
  enabled: boolean;
}

export interface PromoCode {
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  target?: 'ALL' | string; // 'ALL' or specific user email / client ID
  targetClientName?: string;
  minPurchase?: number;
  expiryDate?: string;
  description?: string;
  createdAt?: string;
}

export interface AppNotification {
  id: string;
  targetEmail: 'ALL' | string; // 'ALL' or specific email
  targetName?: string;
  title: string;
  message: string;
  type: 'PROMO' | 'ORDER' | 'SYSTEM' | 'NEWSLETTER';
  promoCode?: string;
  date: string;
  read: boolean;
}

export const DEFAULT_PROMO_CODES: PromoCode[] = [
  { code: 'WELCOME10', type: 'fixed', value: 10, target: 'ALL', description: 'Remise de bienvenue (-10€ / -10 000 FCFA)' },
  { code: 'HYPE20', type: 'percent', value: 20, target: 'ALL', description: 'Remise VIP de 20% sur la boutique' }
];

export const DEFAULT_NOTIFICATIONS: AppNotification[] = [];

export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalOrders: number;
  totalSpent: number;
  registeredDate: string;
  isVipOverride?: boolean;
  bonusPoints?: number;
  spentLoyaltyPoints?: number;
  customPerks?: ClientPerk[];
  referralCode?: string;
  referredBy?: string;
  referralClicks?: number;
  referralSignupsCount?: number;
  referralOrdersCount?: number;
  referralPointsEarned?: number;
}

/**
 * STRICT UNIVERSAL POINTS RULE:
 * 1 € = 1 PT
 * 1 000 FCFA = 1 PT
 */
export function calculatePointsEarned(amount: number, currency: 'EUR' | 'FCFA' | string = 'EUR'): number {
  if (!amount || amount <= 0) return 0;
  if (currency === 'FCFA') {
    return Math.floor(amount / 1000);
  }
  return Math.floor(amount);
}

export function generateReferralCode(email: string, name?: string): string {
  const cleanName = (name || email.split('@')[0] || 'AYM')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4);
  const hash = Math.abs(email.split('').reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0))
    .toString(36)
    .toUpperCase()
    .slice(0, 4);
  return `AYM-${cleanName || 'VIP'}${hash}`;
}

export const DEFAULT_POINT_TRANSACTIONS: PointTransaction[] = [];

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
}

export interface SupplyOrder {
  id: string;
  supplierId: string;
  date: string;
  items: { productName: string; quantity: number; unitCost: number }[];
  totalCost: number;
  status: 'PENDING' | 'RECEIVED' | 'CANCELLED';
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  salary: number;
  startDate: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface EmployeePayment {
  id: string;
  employeeId: string;
  amount: number;
  date: string;
  period: string;
  method: 'CASH' | 'TRANSFER' | 'MOBILE';
}

export type ExpenseCategory = 'STOCK' | 'LOGISTICS' | 'MARKETING' | 'SALARIES' | 'RENT' | 'SOFTWARE' | 'FEES' | 'OTHER';

export interface Expense {
  id: string;
  title: string;
  category: ExpenseCategory;
  amount: number; // base EUR
  amountFcfa?: number;
  currency: 'EUR' | 'FCFA';
  date: string;
  paymentMethod: 'CASH' | 'TRANSFER' | 'CARD' | 'MOBILE_MONEY' | 'PAYPAL';
  status: 'PAID' | 'PENDING';
  supplierId?: string;
  receiptNumber?: string;
  notes?: string;
}

export const DEFAULT_EXPENSES: Expense[] = [];


export interface LocationConfig {
  id: 'benin' | 'france' | 'belgique' | string;
  name: string;
  flag: string;
  countryCode: string;
  currency: 'FCFA' | 'EUR' | string;
  currencySymbol: string;
  symbolPosition: 'prefix' | 'suffix';
  exchangeRate: number; // rate vs base EUR (655.957 for FCFA, 1 for EUR)
  decimals: number;
  isDefault?: boolean;
  active: boolean;
}

export const DEFAULT_LOCATIONS: LocationConfig[] = [
  {
    id: 'benin',
    name: 'Bénin',
    flag: '🇧🇯',
    countryCode: 'BJ',
    currency: 'FCFA',
    currencySymbol: 'FCFA',
    symbolPosition: 'suffix',
    exchangeRate: 655.957,
    decimals: 0,
    isDefault: true,
    active: true,
  },
  {
    id: 'france',
    name: 'France',
    flag: '🇫🇷',
    countryCode: 'FR',
    currency: 'EUR',
    currencySymbol: '€',
    symbolPosition: 'suffix',
    exchangeRate: 1,
    decimals: 2,
    isDefault: false,
    active: true,
  },
  {
    id: 'belgique',
    name: 'Belgique',
    flag: '🇧🇪',
    countryCode: 'BE',
    currency: 'EUR',
    currencySymbol: '€',
    symbolPosition: 'suffix',
    exchangeRate: 1,
    decimals: 2,
    isDefault: false,
    active: true,
  },
];

export interface DeliveryZone {
  id: string;
  name: string;
  fee: number;
  estimatedDays: string;
}

export const DEFAULT_DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'dz_bj_cotonou', name: 'Cotonou Intramuros (Bénin)', fee: 2.29, estimatedDays: '24h chrono (ou le jour même)' }, // ~1 500 FCFA
  { id: 'dz_bj_calavi', name: 'Abomey-Calavi & Godomey (Bénin)', fee: 3.05, estimatedDays: '24h - 48h' }, // ~2 000 FCFA
  { id: 'dz_bj_expedition', name: 'Expédition Bénin (Hors Cotonou & Calavi)', fee: 4.57, estimatedDays: '24h - 48h (Gare / Bus / Relais)' }, // ~3 000 FCFA
  { id: 'dz1', name: 'France Métropolitaine', fee: 5.99, estimatedDays: '2-4 jours' },
  { id: 'dz2', name: 'Belgique & Europe', fee: 12.99, estimatedDays: '3-6 jours' },
  { id: 'dz3', name: "Afrique de l'Ouest (Sous-région)", fee: 15.00, estimatedDays: '4-7 jours' },
  { id: 'dz4', name: 'International', fee: 24.99, estimatedDays: '7-14 jours' },
];

export interface CityItem {
  name: string;
  departmentOrRegion: string;
  country: 'benin' | 'france' | 'belgique';
  isPopular?: boolean;
}

export const BENIN_CITIES: CityItem[] = [
  // Littoral
  { name: 'Cotonou', departmentOrRegion: 'Littoral (Akpakpa, Cadjehoun, Haie Vive, Agla...)', country: 'benin', isPopular: true },

  // Atlantique
  { name: 'Abomey-Calavi', departmentOrRegion: 'Atlantique (Calavi, Godomey, Tankpè, Arconville...)', country: 'benin', isPopular: true },
  { name: 'Godomey', departmentOrRegion: 'Atlantique (Godomey, Dékoungbé, Togoudo...)', country: 'benin', isPopular: true },
  { name: 'Ouidah', departmentOrRegion: 'Atlantique (Pahou, Djègbadji...)', country: 'benin', isPopular: true },
  { name: 'Allada', departmentOrRegion: 'Atlantique (Sékou, Attogon...)', country: 'benin' },
  { name: 'Sô-Ava', departmentOrRegion: 'Atlantique (Ganvié, Vekky...)', country: 'benin' },
  { name: 'Tori-Bossito', departmentOrRegion: 'Atlantique', country: 'benin' },
  { name: 'Kpomassè', departmentOrRegion: 'Atlantique', country: 'benin' },
  { name: 'Toffo', departmentOrRegion: 'Atlantique (Houègbo...)', country: 'benin' },
  { name: 'Zè', departmentOrRegion: 'Atlantique (Hêkanmè...)', country: 'benin' },

  // Ouémé
  { name: 'Porto-Novo', departmentOrRegion: 'Ouémé (Capitale)', country: 'benin', isPopular: true },
  { name: 'Sèmè-Kpodji', departmentOrRegion: 'Ouémé (Sèmè-Podji, Ekpè, Djeffa...)', country: 'benin', isPopular: true },
  { name: 'Adjarra', departmentOrRegion: 'Ouémé', country: 'benin' },
  { name: 'Akpro-Missérété', departmentOrRegion: 'Ouémé', country: 'benin' },
  { name: 'Avrankou', departmentOrRegion: 'Ouémé', country: 'benin' },
  { name: 'Adjohoun', departmentOrRegion: 'Ouémé', country: 'benin' },
  { name: 'Dangbo', departmentOrRegion: 'Ouémé', country: 'benin' },
  { name: 'Bonou', departmentOrRegion: 'Ouémé', country: 'benin' },
  { name: 'Aguégués', departmentOrRegion: 'Ouémé', country: 'benin' },

  // Zou
  { name: 'Bohicon', departmentOrRegion: 'Zou', country: 'benin', isPopular: true },
  { name: 'Abomey', departmentOrRegion: 'Zou', country: 'benin', isPopular: true },
  { name: 'Covè', departmentOrRegion: 'Zou', country: 'benin' },
  { name: 'Za-Kpota', departmentOrRegion: 'Zou', country: 'benin' },
  { name: 'Zogbodomey', departmentOrRegion: 'Zou', country: 'benin' },
  { name: 'Djidja', departmentOrRegion: 'Zou', country: 'benin' },
  { name: 'Agbangnizoun', departmentOrRegion: 'Zou', country: 'benin' },
  { name: 'Zagnanado', departmentOrRegion: 'Zou', country: 'benin' },
  { name: 'Ouinhi', departmentOrRegion: 'Zou', country: 'benin' },

  // Borgou
  { name: 'Parakou', departmentOrRegion: 'Borgou (Métropole du Nord)', country: 'benin', isPopular: true },
  { name: 'Bembèrèkè', departmentOrRegion: 'Borgou', country: 'benin' },
  { name: 'N\'Dali', departmentOrRegion: 'Borgou', country: 'benin' },
  { name: 'Tchaourou', departmentOrRegion: 'Borgou', country: 'benin' },
  { name: 'Nikki', departmentOrRegion: 'Borgou', country: 'benin' },
  { name: 'Pèrèrè', departmentOrRegion: 'Borgou', country: 'benin' },
  { name: 'Sinendé', departmentOrRegion: 'Borgou', country: 'benin' },
  { name: 'Kalalé', departmentOrRegion: 'Borgou', country: 'benin' },

  // Alibori
  { name: 'Kandi', departmentOrRegion: 'Alibori', country: 'benin', isPopular: true },
  { name: 'Malanville', departmentOrRegion: 'Alibori', country: 'benin', isPopular: true },
  { name: 'Banikoara', departmentOrRegion: 'Alibori', country: 'benin' },
  { name: 'Gogounou', departmentOrRegion: 'Alibori', country: 'benin' },
  { name: 'Karimama', departmentOrRegion: 'Alibori', country: 'benin' },
  { name: 'Ségbana', departmentOrRegion: 'Alibori', country: 'benin' },

  // Atacora
  { name: 'Natitingou', departmentOrRegion: 'Atacora', country: 'benin', isPopular: true },
  { name: 'Tanguiéta', departmentOrRegion: 'Atacora', country: 'benin' },
  { name: 'Kouandé', departmentOrRegion: 'Atacora', country: 'benin' },
  { name: 'Cobly', departmentOrRegion: 'Atacora', country: 'benin' },
  { name: 'Toucountouna', departmentOrRegion: 'Atacora', country: 'benin' },
  { name: 'Boukoumbé', departmentOrRegion: 'Atacora', country: 'benin' },
  { name: 'Matéri', departmentOrRegion: 'Atacora', country: 'benin' },
  { name: 'Péhunco', departmentOrRegion: 'Atacora', country: 'benin' },
  { name: 'Kérou', departmentOrRegion: 'Atacora', country: 'benin' },

  // Donga
  { name: 'Djougou', departmentOrRegion: 'Donga', country: 'benin', isPopular: true },
  { name: 'Bassila', departmentOrRegion: 'Donga', country: 'benin' },
  { name: 'Copargo', departmentOrRegion: 'Donga', country: 'benin' },
  { name: 'Ouaké', departmentOrRegion: 'Donga', country: 'benin' },

  // Collines
  { name: 'Dassa-Zoumè', departmentOrRegion: 'Collines', country: 'benin', isPopular: true },
  { name: 'Savalou', departmentOrRegion: 'Collines', country: 'benin', isPopular: true },
  { name: 'Savè', departmentOrRegion: 'Collines', country: 'benin', isPopular: true },
  { name: 'Glazoué', departmentOrRegion: 'Collines', country: 'benin' },
  { name: 'Bantè', departmentOrRegion: 'Collines', country: 'benin' },
  { name: 'Ouèssè', departmentOrRegion: 'Collines', country: 'benin' },

  // Plateau
  { name: 'Pobè', departmentOrRegion: 'Plateau', country: 'benin', isPopular: true },
  { name: 'Sakété', departmentOrRegion: 'Plateau', country: 'benin', isPopular: true },
  { name: 'Kétou', departmentOrRegion: 'Plateau', country: 'benin', isPopular: true },
  { name: 'Adja-Ouèrè', departmentOrRegion: 'Plateau', country: 'benin' },
  { name: 'Ifangni', departmentOrRegion: 'Plateau', country: 'benin' },

  // Mono
  { name: 'Lokossa', departmentOrRegion: 'Mono', country: 'benin', isPopular: true },
  { name: 'Comè', departmentOrRegion: 'Mono', country: 'benin', isPopular: true },
  { name: 'Grand-Popo', departmentOrRegion: 'Mono', country: 'benin', isPopular: true },
  { name: 'Athiémé', departmentOrRegion: 'Mono', country: 'benin' },
  { name: 'Bopa', departmentOrRegion: 'Mono', country: 'benin' },
  { name: 'Houéyogbé', departmentOrRegion: 'Mono', country: 'benin' },

  // Couffo
  { name: 'Aplahoué', departmentOrRegion: 'Couffo', country: 'benin', isPopular: true },
  { name: 'Dogbo', departmentOrRegion: 'Couffo', country: 'benin', isPopular: true },
  { name: 'Klouékanmè', departmentOrRegion: 'Couffo', country: 'benin' },
  { name: 'Toviklin', departmentOrRegion: 'Couffo', country: 'benin' },
  { name: 'Lalo', departmentOrRegion: 'Couffo', country: 'benin' },
  { name: 'Djakotomey', departmentOrRegion: 'Couffo', country: 'benin' },
];

export const FRANCE_CITIES: CityItem[] = [
  { name: 'Paris', departmentOrRegion: 'Île-de-France (75)', country: 'france', isPopular: true },
  { name: 'Marseille', departmentOrRegion: 'Bouches-du-Rhône (13)', country: 'france', isPopular: true },
  { name: 'Lyon', departmentOrRegion: 'Rhône (69)', country: 'france', isPopular: true },
  { name: 'Toulouse', departmentOrRegion: 'Haute-Garonne (31)', country: 'france', isPopular: true },
  { name: 'Nice', departmentOrRegion: 'Alpes-Maritimes (06)', country: 'france', isPopular: true },
  { name: 'Nantes', departmentOrRegion: 'Loire-Atlantique (44)', country: 'france', isPopular: true },
  { name: 'Montpellier', departmentOrRegion: 'Hérault (34)', country: 'france', isPopular: true },
  { name: 'Strasbourg', departmentOrRegion: 'Bas-Rhin (67)', country: 'france', isPopular: true },
  { name: 'Bordeaux', departmentOrRegion: 'Gironde (33)', country: 'france', isPopular: true },
  { name: 'Lille', departmentOrRegion: 'Nord (59)', country: 'france', isPopular: true },
  { name: 'Rennes', departmentOrRegion: 'Ille-et-Vilaine (35)', country: 'france', isPopular: true },
  { name: 'Reims', departmentOrRegion: 'Marne (51)', country: 'france' },
  { name: 'Saint-Étienne', departmentOrRegion: 'Loire (42)', country: 'france' },
  { name: 'Toulon', departmentOrRegion: 'Var (83)', country: 'france' },
  { name: 'Le Havre', departmentOrRegion: 'Seine-Maritime (76)', country: 'france' },
  { name: 'Grenoble', departmentOrRegion: 'Isère (38)', country: 'france' },
  { name: 'Dijon', departmentOrRegion: 'Côte-d\'Or (21)', country: 'france' },
  { name: 'Angers', departmentOrRegion: 'Maine-et-Loire (49)', country: 'france' },
  { name: 'Villeurbanne', departmentOrRegion: 'Rhône (69)', country: 'france' },
  { name: 'Saint-Denis', departmentOrRegion: 'Seine-Saint-Denis (93)', country: 'france' },
  { name: 'Nîmes', departmentOrRegion: 'Gard (30)', country: 'france' },
  { name: 'Clermont-Ferrand', departmentOrRegion: 'Puy-de-Dôme (63)', country: 'france' },
  { name: 'Aix-en-Provence', departmentOrRegion: 'Bouches-du-Rhône (13)', country: 'france' },
  { name: 'Le Mans', departmentOrRegion: 'Sarthe (72)', country: 'france' },
  { name: 'Brest', departmentOrRegion: 'Finistère (29)', country: 'france' },
  { name: 'Tours', departmentOrRegion: 'Indre-et-Loire (37)', country: 'france' },
  { name: 'Amiens', departmentOrRegion: 'Somme (80)', country: 'france' },
  { name: 'Limoges', departmentOrRegion: 'Haute-Vienne (87)', country: 'france' },
  { name: 'Annecy', departmentOrRegion: 'Haute-Savoie (74)', country: 'france' },
  { name: 'Perpignan', departmentOrRegion: 'Pyrénées-Orientales (66)', country: 'france' },
  { name: 'Metz', departmentOrRegion: 'Moselle (57)', country: 'france' },
  { name: 'Besançon', departmentOrRegion: 'Doubs (25)', country: 'france' },
  { name: 'Orléans', departmentOrRegion: 'Loiret (45)', country: 'france' },
  { name: 'Rouen', departmentOrRegion: 'Seine-Maritime (76)', country: 'france' },
  { name: 'Caen', departmentOrRegion: 'Calvados (14)', country: 'france' },
  { name: 'Nancy', departmentOrRegion: 'Meurthe-et-Moselle (54)', country: 'france' },
  { name: 'Avignon', departmentOrRegion: 'Vaucluse (84)', country: 'france' },
  { name: 'Poitiers', departmentOrRegion: 'Vienne (86)', country: 'france' },
  { name: 'La Rochelle', departmentOrRegion: 'Charente-Maritime (17)', country: 'france' },
  { name: 'Cannes', departmentOrRegion: 'Alpes-Maritimes (06)', country: 'france' },
];

export const BELGIQUE_CITIES: CityItem[] = [
  { name: 'Bruxelles', departmentOrRegion: 'Région de Bruxelles-Capitale', country: 'belgique', isPopular: true },
  { name: 'Anvers', departmentOrRegion: 'Flandre (Antwerpen)', country: 'belgique', isPopular: true },
  { name: 'Gand', departmentOrRegion: 'Flandre-Orientale (Gent)', country: 'belgique', isPopular: true },
  { name: 'Charleroi', departmentOrRegion: 'Hainaut', country: 'belgique', isPopular: true },
  { name: 'Liège', departmentOrRegion: 'Province de Liège', country: 'belgique', isPopular: true },
  { name: 'Bruges', departmentOrRegion: 'Flandre-Occidentale (Brugge)', country: 'belgique', isPopular: true },
  { name: 'Namur', departmentOrRegion: 'Province de Namur (Capitale wallonne)', country: 'belgique', isPopular: true },
  { name: 'Louvain', departmentOrRegion: 'Brabant flamand (Leuven)', country: 'belgique' },
  { name: 'Mons', departmentOrRegion: 'Hainaut', country: 'belgique', isPopular: true },
  { name: 'Alost', departmentOrRegion: 'Flandre-Orientale (Aalst)', country: 'belgique' },
  { name: 'Malines', departmentOrRegion: 'Province d\'Anvers (Mechelen)', country: 'belgique' },
  { name: 'La Louvière', departmentOrRegion: 'Hainaut', country: 'belgique' },
  { name: 'Courtrai', departmentOrRegion: 'Flandre-Occidentale (Kortrijk)', country: 'belgique' },
  { name: 'Hasselt', departmentOrRegion: 'Limbourg', country: 'belgique' },
  { name: 'Saint-Nicolas', departmentOrRegion: 'Flandre-Orientale (Sint-Niklaas)', country: 'belgique' },
  { name: 'Ostende', departmentOrRegion: 'Flandre-Occidentale (Oostende)', country: 'belgique' },
  { name: 'Tournai', departmentOrRegion: 'Hainaut', country: 'belgique' },
  { name: 'Genk', departmentOrRegion: 'Limbourg', country: 'belgique' },
  { name: 'Seraing', departmentOrRegion: 'Province de Liège', country: 'belgique' },
  { name: 'Roulers', departmentOrRegion: 'Flandre-Occidentale (Roeselare)', country: 'belgique' },
  { name: 'Verviers', departmentOrRegion: 'Province de Liège', country: 'belgique' },
  { name: 'Mouscron', departmentOrRegion: 'Hainaut', country: 'belgique' },
  { name: 'Ixelles', departmentOrRegion: 'Bruxelles (Elsene)', country: 'belgique' },
  { name: 'Uccle', departmentOrRegion: 'Bruxelles (Ukkel)', country: 'belgique' },
  { name: 'Schaerbeek', departmentOrRegion: 'Bruxelles', country: 'belgique' },
];

export function filterCities(query: string, countryId: string = 'benin'): CityItem[] {
  const normQuery = query.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
  
  let sourceList = BENIN_CITIES;
  if (countryId === 'france') sourceList = FRANCE_CITIES;
  if (countryId === 'belgique') sourceList = BELGIQUE_CITIES;

  if (!normQuery) {
    return sourceList.filter(c => c.isPopular).slice(0, 8);
  }

  // 1. Prefix matches (starts with typed letters, e.g. "C" -> Cotonou, Calavi, Covè, Comè...)
  const prefixMatches = sourceList.filter(c => {
    const normName = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return normName.startsWith(normQuery);
  });

  // 2. Contains matches (if not in prefix)
  const containsMatches = sourceList.filter(c => {
    const normName = c.name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const normRegion = c.departmentOrRegion.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    return !normName.startsWith(normQuery) && (normName.includes(normQuery) || normRegion.includes(normQuery));
  });

  return [...prefixMatches, ...containsMatches].slice(0, 10);
}

export interface BeninDeliveryCalculation {
  zoneType: 'COTONOU' | 'CALAVI' | 'EXPEDITION' | 'DEFAULT';
  isExpedition: boolean;
  zoneId: string;
  zoneName: string;
  fee: number;
  estimatedDays: string;
  title: string;
  description: string;
  badge: string;
}

export function calculateBeninDelivery(city: string, zones: DeliveryZone[] = DEFAULT_DELIVERY_ZONES): BeninDeliveryCalculation {
  const norm = (city || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const zoneCotonou = zones.find(z => z.id === 'dz_bj_cotonou' || z.name.toLowerCase().includes('cotonou')) || DEFAULT_DELIVERY_ZONES[0];
  const zoneCalavi = zones.find(z => z.id === 'dz_bj_calavi' || z.name.toLowerCase().includes('calavi')) || DEFAULT_DELIVERY_ZONES[1];
  const zoneExpedition = zones.find(z => z.id === 'dz_bj_expedition' || z.name.toLowerCase().includes('expédition') || z.name.toLowerCase().includes('expedition')) || DEFAULT_DELIVERY_ZONES[2];

  if (!norm) {
    return {
      zoneType: 'DEFAULT',
      isExpedition: false,
      zoneId: zoneCotonou.id,
      zoneName: zoneCotonou.name,
      fee: zoneCotonou.fee,
      estimatedDays: '24h - 48h',
      title: 'Indiquez votre ville',
      description: 'Saisissez votre ville pour calculer le tarif exact en direct.',
      badge: '📍 CALCUL AUTOMATIQUE'
    };
  }

  // 1. Département du LITTORAL (Cotonou et tous ses quartiers)
  const littoralKeywords = [
    'cotonou', 'littoral', 'akpakpa', 'cadjehoun', 'cadjehun', 'haie vive', 'agla', 'fidjrosse', 'fidjrossè',
    'menontin', 'mènontin', 'zogbo', 'zogbohoue', 'vedoko', 'vèdoko', 'kouhounou', 'maro militaire',
    'gbegamey', 'gbégamey', 'saint michel', 'dantokpa', 'erivan', 'patte d\'oie', 'patte doie',
    'placodji', 'jonquet', 'agbato', 'dedokpo', 'maro-militaire', 'avotrou', 'suru lere', 'surulere',
    'segbeya', 'missite', 'houenoussou', 'guinkomey', 'ganhi', 'champ de foire', 'tokplegbe',
    'aidjedo', 'aïdjèdo', 'gbenan', 'gbénan', 'ste rita', 'sainte rita', 'fifadji', 'jéricho', 'jericho',
    'jak', 'enagnon', 'les cocotiers', 'zone residentielle'
  ];

  // 2. Département de l'ATLANTIQUE (Abomey-Calavi, Ouidah, Allada, Sô-Ava, Tori-Bossito, Kpomassè, Toffo, Zè)
  const atlantiqueKeywords = [
    'atlantique',
    // Abomey-Calavi
    'calavi', 'abomey-calavi', 'abomey calavi', 'godomey', 'arconville', 'tankpe', 'tankpè',
    'zogbadje', 'zogbadjè', 'bidossessi', 'akassato', 'ouedo', 'ouédo', 'togoudo', 'kpota',
    'hevie', 'hêvié', 'zinvie', 'zinvié', 'glo-djigbe', 'glo djigbe', 'golo-djigbe',
    'cocotomey', 'cococodji', 'maria gleta', 'mariagléta', 'womey', 'dado', 'togbin', 'adjagbo',
    'kansoukpa', 'parana', 'togba', 'missessinto',
    // Ouidah
    'ouidah', 'pahou', 'djegbadji', 'djègbadji', 'ahozon', 'savi', 'gakpe', 'gakpé',
    // Allada
    'allada', 'attogon', 'avakpa', 'sekou', 'sékou', 'hinvi', 'lissegazoun',
    // Sô-Ava
    'so-ava', 'sô-ava', 'so ava', 'ganvie', 'ganvié', 'houedo-aguekon', 'vekky',
    // Tori-Bossito
    'tori', 'tori-bossito', 'tori bossito', 'tori-gare', 'tori-cada',
    // Kpomassè
    'kpomasse', 'kpomassè', 'dekanme', 'tokpa-dome',
    // Toffo
    'toffo', 'houegbo', 'houègbo', 'colli', 'coussi',
    // Zè
    'ze', 'zè', 'hekanme', 'hêkanmè', 'sedje-denou', 'yokpo', 'tangbo'
  ];

  // Check Littoral
  if (littoralKeywords.some(kw => norm.includes(kw))) {
    return {
      zoneType: 'COTONOU',
      isExpedition: false,
      zoneId: zoneCotonou.id,
      zoneName: zoneCotonou.name,
      fee: zoneCotonou.fee,
      estimatedDays: '24h chrono (ou le jour même)',
      title: 'Livraison Coursier Moto (Littoral / Cotonou)',
      description: 'Livraison directe et rapide par coursier à votre adresse dans le Littoral (Cotonou).',
      badge: '⚡ EXPRESS LITTORAL'
    };
  }

  // Check Atlantique
  if (atlantiqueKeywords.some(kw => norm.includes(kw))) {
    return {
      zoneType: 'CALAVI',
      isExpedition: false,
      zoneId: zoneCalavi.id,
      zoneName: zoneCalavi.name,
      fee: zoneCalavi.fee,
      estimatedDays: '24h - 48h',
      title: 'Livraison Coursier Moto (Atlantique / Calavi & environs)',
      description: 'Livraison coursier moto à votre adresse dans le département de l\'Atlantique.',
      badge: '🛵 LIVRAISON ATLANTIQUE'
    };
  }

  // Outside Atlantique & Littoral -> Propose Expedition (Ouémé, Plateau, Zou, Collines, Borgou, Alibori, Atacora, Donga, Mono, Couffo)
  return {
    zoneType: 'EXPEDITION',
    isExpedition: true,
    zoneId: zoneExpedition.id,
    zoneName: zoneExpedition.name,
    fee: zoneExpedition.fee,
    estimatedDays: '24h - 48h (Gare / Bus / Relais)',
    title: `Expédition vers ${city.trim()}`,
    description: `Votre ville (${city.trim()}) se situe en dehors des départements Atlantique et Littoral : nous vous proposons une expédition sécurisée via nos gares et transporteurs partenaires.`,
    badge: '📦 EXPÉDITION PROVINCE'
  };
}

export interface MerchantNotificationSettings {
  adminEmail: string;
  resendApiKey?: string;
  emailAlertsEnabled: boolean;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  whatsappEnabled: boolean;
  whatsappPhoneNumber: string;
  whatsappWebhookUrl: string;
  notifyOnNewOrder: boolean;
  notifyOnPayment: boolean;
  notifyOnNewUser: boolean;
}

export const DEFAULT_MERCHANT_SETTINGS: MerchantNotificationSettings = {
  adminEmail: 'judesinaberogui@gmail.com',
  emailAlertsEnabled: true,
  telegramEnabled: false,
  telegramBotToken: '',
  telegramChatId: '',
  whatsappEnabled: true,
  whatsappPhoneNumber: '+229 01 97 36 29 06',
  whatsappWebhookUrl: '',
  notifyOnNewOrder: true,
  notifyOnPayment: true,
  notifyOnNewUser: true,
};

export interface PixelItem {
  id: string;
  pixelId: string;
  capiToken?: string;
  eventsApiToken?: string;
  enabled: boolean;
}

export interface PixelSettings {
  facebookPixels: PixelItem[];
  tiktokPixels: PixelItem[];
  googleAnalytics: {
    measurementId: string;
    gtmId?: string;
    enabled: boolean;
  };
  snapchatPixels: PixelItem[];
  pinterestPixels: PixelItem[];
  autoTrackEvents: {
    pageView: boolean;
    viewContent: boolean;
    addToCart: boolean;
    initiateCheckout: boolean;
    purchase: boolean;
  };
}

export const DEFAULT_PIXEL_SETTINGS: PixelSettings = {
  facebookPixels: [
    { id: 'fb-1', pixelId: '2608798626157940', capiToken: '', enabled: true }
  ],
  tiktokPixels: [
    { id: 'tt-1', pixelId: '', eventsApiToken: '', enabled: false }
  ],
  googleAnalytics: {
    measurementId: '',
    gtmId: '',
    enabled: false
  },
  snapchatPixels: [],
  pinterestPixels: [],
  autoTrackEvents: {
    pageView: true,
    viewContent: true,
    addToCart: true,
    initiateCheckout: true,
    purchase: true
  }
};

export interface SubCategory {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export interface DynamicCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  image?: string;
  subCategories?: SubCategory[];
}

export interface HeroSlideItem {
  id: number;
  image: string;
  leftText: string;
  promoTitle: string;
  promoSubtitle: string;
  accentColor: string;
  link: string;
}

export interface CategoryTileConfig {
  id: string;
  categoryKey: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  tag: string;
}

export interface LookbookConfig {
  tag: string;
  title: string;
  description: string;
  image1: string;
  image2: string;
  buttonText1: string;
  buttonLink1: string;
  buttonText2: string;
  buttonLink2: string;
}

export interface FAQEditorialItemConfig {
  title: string;
  image: string;
  link: string;
}

export interface FAQEditorialConfig {
  main: {
    title: string;
    image: string;
    link: string;
  };
  item1: FAQEditorialItemConfig;
  item2: FAQEditorialItemConfig;
  item3: FAQEditorialItemConfig;
}

export interface CommunityPhotoConfig {
  id: string;
  image: string;
  user: string;
  tag: string;
}

export interface HomepageMediaSettings {
  categoryTiles: CategoryTileConfig[];
  lookbook: LookbookConfig;
  faqEditorial: FAQEditorialConfig;
  communityPhotos: CommunityPhotoConfig[];
}

export const DEFAULT_CATEGORY_TILES: CategoryTileConfig[] = [
  {
    id: 'tile_sneakers',
    categoryKey: 'shoes',
    title: 'SNEAKERS CULTURE',
    subtitle: 'Silhouettes rares & collaborations exclusives',
    image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=800&auto=format&fit=crop',
    link: '/products?category=shoes',
    tag: 'TENDANCE',
  },
  {
    id: 'tile_streetwear',
    categoryKey: 'clothing',
    title: 'STREETWEAR & HOODIES',
    subtitle: 'Coupes oversize, vestes & pièces selects',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800&auto=format&fit=crop',
    link: '/products?category=clothing',
    tag: 'NOUVEAU',
  },
  {
    id: 'tile_bags',
    categoryKey: 'bags',
    title: 'MAROQUINERIE DE LUXE',
    subtitle: 'Sacs en cuir véritable & sacs cabas',
    image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
    link: '/products?category=bags',
    tag: 'PREMIUM',
  },
  {
    id: 'tile_jewelry',
    categoryKey: 'jewelry',
    title: 'JOAILLERIE & MONTRES',
    subtitle: 'Or massif 18k, argent 925 & chronographes',
    image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?q=80&w=800&auto=format&fit=crop',
    link: '/products?category=jewelry',
    tag: 'ÉLÉGANCE',
  },
  {
    id: 'tile_jersey',
    categoryKey: 'jersey',
    title: 'MAILLOTS & RÉTRO FOOT',
    subtitle: 'Équipe de France, éditions vintage & collectors',
    image: '/france_jersey_hero.jpg',
    link: '/products?search=jersey',
    tag: 'DROP SPÉCIAL',
  },
  {
    id: 'tile_accessories',
    categoryKey: 'accessories',
    title: 'ACCESSOIRES & CASQUETTES',
    subtitle: 'Lunettes UV, bobs & finitions stylisées',
    image: 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=800&auto=format&fit=crop',
    link: '/products?category=accessories',
    tag: 'ESSENTIELS',
  }
];

export const DEFAULT_LOOKBOOK: LookbookConfig = {
  tag: 'ÉDITORIAL SAISON 2026',
  title: "L'Élégance Streetwear dans sa Plus Pure Expression",
  description: "Des sneakers iconiques aux hoodies de créateurs, chaque pièce est sélectionnée pour son authenticité, ses matières d'exception et sa rareté sur le marché international.",
  image1: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?q=80&w=1200&auto=format&fit=crop',
  image2: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=80&w=1200&auto=format&fit=crop',
  buttonText1: 'Découvrir le Lookbook',
  buttonLink1: '/products?filter=new',
  buttonText2: 'Collection Vêtements',
  buttonLink2: '/products?category=clothing',
};

export const DEFAULT_FAQ_EDITORIAL: FAQEditorialConfig = {
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
};

export const DEFAULT_COMMUNITY_PHOTOS: CommunityPhotoConfig[] = [];

export const DEFAULT_HOMEPAGE_MEDIA: HomepageMediaSettings = {
  categoryTiles: DEFAULT_CATEGORY_TILES,
  lookbook: DEFAULT_LOOKBOOK,
  faqEditorial: DEFAULT_FAQ_EDITORIAL,
  communityPhotos: DEFAULT_COMMUNITY_PHOTOS
};

export interface SupportChatMessage {
  id: string;
  sender: 'user' | 'bot' | 'agent';
  senderName?: string;
  text: string;
  time: string;
  options?: { label: string; action: string }[];
  image?: string;
}

export type SupportConversationStatus = 'PENDING_AGENT' | 'IN_PROGRESS' | 'SATISFIED' | 'CLOSED' | 'BOT';

export interface SupportConversation {
  id: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  topic: string;
  status: SupportConversationStatus;
  unreadByAdmin: boolean;
  messages: SupportChatMessage[];
  createdAt: string;
  lastUpdated: string;
}

export const DEFAULT_SUPPORT_CONVERSATIONS: SupportConversation[] = [];

export interface ProductReview {
  id: string;
  productId: string;
  productName?: string;
  productImage?: string;
  orderId?: string;
  orderNumber?: string;
  customerName: string;
  customerEmail: string;
  rating: number; // 1 to 5
  title: string;
  comment: string;
  date: string;
  verifiedPurchase: boolean;
  photo?: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  likesCount?: number;
}

export const DEFAULT_PRODUCT_REVIEWS: ProductReview[] = [];

export const DEFAULT_ABANDONED_CHECKOUTS: AbandonedCheckout[] = [];

export const DEFAULT_MONEROO_SETTINGS: MonerooSettings = {
  publicKey: '',
  secretKey: '',
  appId: '',
  environment: 'live',
  enabled: false
};

export interface GoogleSheetConfig {
  sheetUrl: string;
  lastSynced: string | null;
  status: 'DISCONNECTED' | 'CONNECTED' | 'SYNCING' | 'ERROR';
}

export interface MarketingSubscriber {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  channels: ('EMAIL' | 'WHATSAPP')[];
  subscribedAt: string;
  active: boolean;
  preferredCategory?: string;
  source?: 'FOOTER' | 'CHECKOUT' | 'ACCOUNT' | 'POPUP' | 'MANUAL';
}

export interface ProductBroadcastLog {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  productPrice?: number;
  currency?: 'EUR' | 'FCFA';
  sentAt: string;
  channels: ('EMAIL' | 'WHATSAPP')[];
  recipientsCount: number;
  messageText: string;
  targetCountEmail?: number;
  targetCountWhatsapp?: number;
}

export const DEFAULT_MARKETING_SUBSCRIBERS: MarketingSubscriber[] = [];

export const DEFAULT_BROADCAST_LOGS: ProductBroadcastLog[] = [];

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  category: 'Sneakers Culture' | 'Guides & Conseils' | 'Lookbooks & Style' | 'Actualités & Drops';
  author: {
    name: string;
    role: string;
    avatar?: string;
  };
  publishedAt: string;
  readTime: string;
  tags: string[];
  linkedProductIds: string[];
  isFeatured?: boolean;
  published: boolean;
  viewsCount?: number;
  likesCount?: number;
}

export const DEFAULT_BLOG_POSTS: BlogPost[] = [
  {
    id: 'blog-jordan-4-style-2026',
    title: 'Guide Style 2026 : Comment porter la Jordan 4 Retro au quotidien',
    slug: 'guide-style-comment-porter-la-jordan-4-retro',
    excerpt: 'Silhouettes amples, contrastes de matières et astuces pointures : découvrez comment intégrer l\'incontournable Jordan 4 dans vos tenues décontractées et habillées.',
    coverImage: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1200&auto=format&fit=crop',
    category: 'Lookbooks & Style',
    author: {
      name: 'Sandro K.',
      role: 'Styliste & Curateur Aymard Store',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop'
    },
    publishedAt: '18 Août 2026',
    readTime: '4 min',
    tags: ['Jordan 4', 'Streetwear', 'Conseils Mode', 'Lookbook'],
    linkedProductIds: ['shoes-1', 'sw1'],
    isFeatured: true,
    published: true,
    viewsCount: 428,
    likesCount: 36,
    content: `## L'avènement d'une légende intemporelle

Depuis sa création par Tinker Hatfield en 1989, la **Air Jordan 4** transcende les époques et s'impose aujourd'hui comme le pilier indiscutable de la garde-robe streetwear contemporaine. Que ce soit sur les boulevards parisiens ou dans les rues animées de Cotonou, sa silhouette sculptée et ses empiècements en mesh grillagé confèrent immédiatement une prestance unique à n'importe quel outfit.

---

### 1. La règle du tombé de pantalon : Privilégier le Baggy & Cargo

Pour mettre en valeur la structure volumineuse de la Jordan 4, évitez les pantalons trop serrés au niveau de la cheville. 

* **Le pantalon Cargo déstructuré :** Avec des poches latérales bien placées et un bas légèrement resserré ou tombant pile sur la languette, vous créez une harmonie parfaite.
* **Le Denim Brut Large (Loose Fit) :** Le jean délavé oversize qui s'arrête juste au-dessus des œillets de la sneaker offre ce look vintage recherché.
* **Le Short Molleton Court :** En période estivale ou sous le climat tropical, associez la paire à des chaussettes montantes blanches pour un style californien maîtrisé.

> « La Jordan 4 ne se porte pas simplement comme une chaussure de sport ; elle structure l'ensemble de votre posture et donne le ton de votre allure. »

---

### 2. Sizing & Confort : Quelle pointure choisir ?

La Jordan 4 possède une empeigne plus rigide et ajustée que d'autres modèles rétros. **Nous vous conseillons généralement de prendre votre pointure habituelle**, ou une demi-pointure au-dessus si vous avez le pied légèrement large.

---

### 3. Comment préserver sa paire immaculée

Le cuir suédé et les plastiques des œillets nécessitent un soin attentif :
1. Appliquez un spray imperméabilisant dès la réception de votre boîte.
2. Utilisez une brosse à poils doux pour éliminer la poussière après chaque port.
3. Conservez vos embauchoirs pour éviter les pliures prononcées sur la toe-box.`
  },
  {
    id: 'blog-asics-gel-nyc-culture',
    title: 'Pourquoi la Asics Gel-NYC est la paire running-lifestyle incontournable en 2026',
    slug: 'pourquoi-la-asics-gel-nyc-est-incontournable',
    excerpt: 'Fusion parfaite entre héritage technique des années 2000 et design futuriste, décryptage du raz-de-marée Asics dans la mode urbaine.',
    coverImage: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&auto=format&fit=crop',
    category: 'Sneakers Culture',
    author: {
      name: 'Aymard J.',
      role: 'Fondateur & Passionné de Kicks',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
    },
    publishedAt: '12 Août 2026',
    readTime: '3 min',
    tags: ['Asics', 'Gel-NYC', 'Running Y2K', 'Tendance'],
    linkedProductIds: ['shoes-1'],
    isFeatured: false,
    published: true,
    viewsCount: 560,
    likesCount: 52,
    content: `## L'alliance du confort absolu et du style Y2K

La vague du « Tech Runner » a conquis le monde de la mode, et au sommet de cette révolution trône sans conteste la **Asics Gel-NYC**. Conçue en puisant dans les archives légendaires de la marque japonaise, cette silhouette combine l'empeigne de la Gel-Nimbus 3 avec la semelle technologique de la Gel-Cumulus 16.

---

### Pourquoi tout le monde l'adopte ?

1. **Un amorti Gel révolutionnaire :** Vous pouvez marcher des kilomètres entiers sans ressentir la moindre fatigue plantaire.
2. **Une versatilité stylistique totale :** Elle se marie aussi bien avec un ensemble sweat minimaliste qu'avec un pantalon de tailleur fluide pour un contraste chic & décontracté.
3. **Des finitions ultra qualitatives :** Mesh respirant, renforts en daim synthétique et détails réfléchissants qui captent la lumière en soirée.`
  },
  {
    id: 'blog-entretien-sneakers-cuir',
    title: 'Entretien & Protection : 5 gestes d\'experts pour garder vos sneakers immaculées',
    slug: '5-astuces-entretien-sneakers-blanches-neuves',
    excerpt: 'Poussière, pluie ou frottements : la routine complète pour nourrir le cuir, nettoyer les semelles et décupler la longévité de vos paires de collection.',
    coverImage: 'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=1200&auto=format&fit=crop',
    category: 'Guides & Conseils',
    author: {
      name: 'Clarisse M.',
      role: 'Spécialiste Rénovation & Soin',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=200&auto=format&fit=crop'
    },
    publishedAt: '05 Août 2026',
    readTime: '5 min',
    tags: ['Entretien', 'Protection', 'Sneakers Cuir', 'Astuces'],
    linkedProductIds: ['shoes-1', 'sw1'],
    isFeatured: false,
    published: true,
    viewsCount: 310,
    likesCount: 24,
    content: `## Prendre soin de son investissement sneaker

Une belle paire de sneakers n'est pas un simple achat, c'est une pièce de passion et d'expression personnelle. Avec quelques réflexes simples mais rigoureux, vous pouvez conserver l'aspect "sortie de boîte" pendant plusieurs années.

---

### Les 5 commandements de l'entretien :

1. **L'imperméabilisation préventive :** Avant même le premier port, appliquez 2 couches fines de spray protecteur à 20 cm de distance.
2. **Le nettoyage sans trempage :** Ne mettez JAMAIS vos sneakers en machine à laver ! Utilisez une mousse nettoyante spécifique et un chiffon microfibre humide.
3. **Le déjaunissement des semelles :** Pour les semelles blanches en caoutchouc, une brosse à poils durs et un nettoyant doux suffisent à redonner leur éclat originel.
4. **La gestion des plis (Creases) :** Insérez des embauchoirs en bois de cèdre ou en plastique rigide dès que vous retirez vos chaussures.
5. **Le stockage aéré :** Conservez vos paires à l'abri de l'humidité directe et du soleil brûlant qui décolore les pigments du cuir.`
  }
];

interface AppState {
  language: 'fr' | 'en' | 'es';
  currency: 'EUR' | 'FCFA';
  cart: CartItem[];
  favorites: string[];
  user: User | null;
  orders: Order[];
  
  // Locations & Localized Pricing
  locations: LocationConfig[];
  detectedLocationId: string;
  
  // Dynamic Settings and Database
  products: Product[];
  exchangeRate: number;
  freeShippingThreshold: number;
  announcements: string[];
  promoCodes: PromoCode[];
  
  // New entities
  clients: Client[];
  suppliers: Supplier[];
  supplyOrders: SupplyOrder[];
  employees: Employee[];
  employeePayments: EmployeePayment[];
  deliveryZones: DeliveryZone[];
  dynamicCategories: DynamicCategory[];
  heroSlides: HeroSlideItem[];
  homepageMedia: HomepageMediaSettings;
  googleSheetConfig: GoogleSheetConfig;

  // Customer Reviews & Feedback
  reviews: ProductReview[];
  addProductReview: (review: Omit<ProductReview, 'id' | 'date'> & { id?: string; date?: string }) => void;
  updateProductReview: (id: string, updates: Partial<ProductReview>) => void;
  deleteProductReview: (id: string) => void;
  likeProductReview: (id: string) => void;

  // Marketing & Opt-in Drops Alerts (WhatsApp / Email)
  marketingSubscribers: MarketingSubscriber[];
  broadcastLogs: ProductBroadcastLog[];
  subscribeToMarketing: (subscriber: {
    name?: string;
    email?: string;
    phone?: string;
    channels: ('EMAIL' | 'WHATSAPP')[];
    preferredCategory?: string;
    source?: 'FOOTER' | 'CHECKOUT' | 'ACCOUNT' | 'POPUP' | 'MANUAL';
  }) => { success: boolean; message: string };
  unsubscribeMarketing: (emailOrPhone: string) => void;
  toggleSubscriberStatus: (id: string) => void;
  deleteSubscriber: (id: string) => void;
  recordBroadcast: (log: Omit<ProductBroadcastLog, 'id' | 'sentAt'>) => void;

  // Blog & Editorial Journal with Linked Products
  blogPosts: BlogPost[];
  addBlogPost: (post: Omit<BlogPost, 'id' | 'viewsCount' | 'likesCount'> & { id?: string }) => void;
  updateBlogPost: (id: string, updates: Partial<BlogPost>) => void;
  deleteBlogPost: (id: string) => void;
  togglePublishBlogPost: (id: string) => void;
  likeBlogPost: (id: string) => void;
  incrementBlogViews: (id: string) => void;
  
  setLanguage: (lang: 'fr' | 'en' | 'es') => void;
  setCurrency: (curr: 'EUR' | 'FCFA') => void;
  setDetectedLocation: (locationId: string) => void;
  updateLocation: (id: string, updates: Partial<LocationConfig>) => void;
  addLocation: (loc: LocationConfig) => void;
  deleteLocation: (id: string) => void;
  updateLocationPrice: (productId: string, locationId: string, price: number, comparePrice?: number) => void;
  
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  removeFromCart: (productId: string, color?: string, size?: string) => void;
  updateCartQuantity: (productId: string, quantity: number, color?: string, size?: string) => void;
  clearCart: () => void;
  
  toggleFavorite: (productId: string) => void;
  
  login: (email: string, name: string, role: 'CUSTOMER' | 'ADMIN', phone?: string) => void;
  logout: () => void;
  updateUserProfile: (updates: Partial<User>) => void;
  addSavedAddress: (address: Address) => void;
  deleteSavedAddress: (addressId: string) => void;
  selectedShippingAddress: Partial<Address> | null;
  setSelectedShippingAddress: (addr: Partial<Address> | null) => void;
  spentLoyaltyPoints: number;
  setSpentLoyaltyPoints: (points: number) => void;
  
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: 'PENDING' | 'SHIPPED' | 'DELIVERED') => void;
  updateOrderTracking: (orderId: string, trackingUpdates: Partial<Order>) => void;
  addTrackingCheckpoint: (orderId: string, checkpoint: Omit<TrackingCheckpoint, 'id'>) => void;
  
  // Admin product actions
  setProducts: (products: Product[]) => void;
  addProduct: (product: Product) => void;
  deleteProduct: (productId: string) => void;
  updateProduct: (productId: string, updates: Partial<Product>) => void;
  notifications: AppNotification[];
  addNotification: (notification: Omit<AppNotification, 'id' | 'date' | 'read'>) => void;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: (userEmail?: string) => void;
  deleteNotification: (id: string) => void;
  clearNotifications: () => void;
  
  merchantSettings: MerchantNotificationSettings;
  updateMerchantSettings: (updates: Partial<MerchantNotificationSettings>) => void;
  
  pixelSettings: PixelSettings;
  updatePixelSettings: (updates: Partial<PixelSettings>) => void;
  
  updateExchangeRate: (rate: number) => void;
  updateFreeShippingThreshold: (threshold: number) => void;
  updateAnnouncements: (announcements: string[]) => void;
  addPromoCode: (promoCode: PromoCode, notifyClients?: boolean, customMessage?: string) => void;
  removePromoCode: (code: string) => void;
  
  // Points Audit & Referral / Affiliation Actions
  pointTransactions: PointTransaction[];
  addPointTransaction: (tx: Omit<PointTransaction, 'id' | 'date'>) => void;
  trackReferralClick: (refCode: string) => void;
  registerReferralSignup: (newClientEmail: string, refCode: string) => void;
  processOrderPointsAndReferral: (order: Order) => void;
  convertPointsToCoupon: (userEmail: string, points: number, currency: 'EUR' | 'FCFA') => { success: boolean; promoCode?: string; message?: string };

  // Client actions
  addClient: (client: Client) => void;
  deleteClient: (clientId: string) => void;
  toggleClientVip: (clientIdOrEmail: string) => void;
  grantClientBonusPoints: (clientIdOrEmail: string, points: number, reason?: string) => void;
  grantClientPerk: (clientIdOrEmail: string, perk: { title: string; description: string; icon?: string }) => void;
  removeClientPerk: (clientIdOrEmail: string, perkId: string) => void;
  
  // Supplier actions
  addSupplier: (supplier: Supplier) => void;
  updateSupplier: (supplierId: string, updates: Partial<Supplier>) => void;
  deleteSupplier: (supplierId: string) => void;
  
  // Supply order actions
  addSupplyOrder: (order: SupplyOrder) => void;
  updateSupplyOrderStatus: (orderId: string, status: 'PENDING' | 'RECEIVED' | 'CANCELLED') => void;
  
  // Employee actions
  addEmployee: (employee: Employee) => void;
  updateEmployee: (employeeId: string, updates: Partial<Employee>) => void;
  deleteEmployee: (employeeId: string) => void;
  toggleEmployeeStatus: (employeeId: string) => void;
  
  // Employee payment actions
  addEmployeePayment: (payment: EmployeePayment) => void;
  
  // Delivery zone actions
  addDeliveryZone: (zone: DeliveryZone) => void;
  updateDeliveryZone: (zoneId: string, updates: Partial<DeliveryZone>) => void;
  deleteDeliveryZone: (zoneId: string) => void;
  
  // Dynamic category actions
  addDynamicCategory: (category: DynamicCategory) => void;
  deleteDynamicCategory: (categoryId: string) => void;
  addSubCategory: (categoryId: string, subCategory: SubCategory) => void;
  deleteSubCategory: (categoryId: string, subCategoryId: string) => void;
  
  // Hero slides actions
  updateHeroSlide: (id: number, updates: Partial<HeroSlideItem>) => void;
  addHeroSlide: (slide: HeroSlideItem) => void;
  deleteHeroSlide: (id: number) => void;
  
  // Homepage Media & Visual CMS actions
  updateHomepageMedia: (updates: Partial<HomepageMediaSettings>) => void;
  updateCategoryTile: (id: string, updates: Partial<CategoryTileConfig>) => void;
  updateLookbook: (updates: Partial<LookbookConfig>) => void;
  updateFaqEditorial: (updates: Partial<FAQEditorialConfig>) => void;
  updateCommunityPhoto: (id: string, updates: Partial<CommunityPhotoConfig>) => void;
  addCommunityPhoto: (photo: CommunityPhotoConfig) => void;
  deleteCommunityPhoto: (id: string) => void;
  resetHomepageMedia: () => void;
  
  // Google Sheets & CSV actions
  updateGoogleSheetConfig: (updates: Partial<GoogleSheetConfig>) => void;
  importProductsCSV: (csvText: string) => number;
  clearCSVProducts: () => number;

  // Accounting & Expenses
  expenses: Expense[];
  addExpense: (expense: Expense) => void;
  updateExpense: (id: string, updates: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;
  clearAccountingData: () => void;
  clearAllMockData: () => void;

  // Support & Live Chat Actions
  supportConversations: SupportConversation[];
  currentConversationId: string;
  startNewSupportConversation: (customerName?: string, topic?: string) => string;
  sendSupportMessage: (text: string, sender?: 'user' | 'bot' | 'agent', options?: { label: string; action: string }[], image?: string, convId?: string, topic?: string) => void;
  switchToHumanAgent: (convId?: string, topic?: string) => void;
  adminReplySupportMessage: (conversationId: string, text: string, image?: string) => void;
  updateSupportConversationStatus: (conversationId: string, status: SupportConversationStatus) => void;
  markConversationAsRead: (conversationId: string) => void;
  closeSupportConversation: (conversationId: string, status?: SupportConversationStatus) => void;
  deleteSupportConversation: (conversationId: string) => void;
  setCurrentConversationId: (id: string) => void;

  // Abandoned Checkouts & Recovery Studio
  abandonedCheckouts: AbandonedCheckout[];
  addAbandonedCheckout: (item: Omit<AbandonedCheckout, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => string;
  updateAbandonedCheckout: (id: string, updates: Partial<AbandonedCheckout>) => void;
  deleteAbandonedCheckout: (id: string) => void;
  clearRecoveredCheckouts: () => void;

  // Moneroo & Payment Gateway Settings
  monerooSettings: MonerooSettings;
  updateMonerooSettings: (settings: Partial<MonerooSettings>) => void;

  // 1-Click Fast Express Buy State
  quickBuyProduct: { product: Product; size?: string; color?: string; quantity?: number } | null;
  setQuickBuyProduct: (data: { product: Product; size?: string; color?: string; quantity?: number } | null) => void;

  // Hydration state
  _hasHydrated: boolean;
  setHasHydrated: (hasHydrated: boolean) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      _hasHydrated: false,
      setHasHydrated: (h) => set({ _hasHydrated: h }),

      language: 'fr',
      currency: 'EUR',
      cart: [],
      favorites: [],
      user: (() => {
        if (typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('aymard_user_session');
            if (raw) {
              const u = JSON.parse(raw);
              if (u && u.email) return u;
            }
          } catch {}
        }
        return null;
      })(),
      orders: [],
      spentLoyaltyPoints: 0,
      pointTransactions: DEFAULT_POINT_TRANSACTIONS,
      
      abandonedCheckouts: DEFAULT_ABANDONED_CHECKOUTS,
      monerooSettings: DEFAULT_MONEROO_SETTINGS,
      quickBuyProduct: null,

      supportConversations: DEFAULT_SUPPORT_CONVERSATIONS,
      currentConversationId: '',
      reviews: DEFAULT_PRODUCT_REVIEWS,

      products: defaultProducts,
      exchangeRate: 655.957,
      freeShippingThreshold: 180,
      announcements: [
        "Paiement en 2, 3 ou 4 fois sans frais",
        "⚠️ Retours non acceptés : merci de bien choisir votre pointure et votre article avant validation",
        "Livraison offerte dès {threshold}{currency}",
        "Authenticité 100% Certifiée & Vérifiée par nos experts"
      ],
      heroSlides: [
        {
          id: 1,
          image: '/france_jersey_hero.jpg',
          leftText: 'LAST\nSUMMER',
          promoTitle: "JUSQU'À\n-60%",
          promoSubtitle: '+ LIVRAISON OFFERTE',
          accentColor: '#a855f7',
          link: '/products?category=clothing'
        },
        {
          id: 2,
          image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=1600&auto=format&fit=crop',
          leftText: 'SNEAKERS\nCULTURE',
          promoTitle: 'EXCLUSIF\nLIMITED',
          promoSubtitle: 'SÉLECTION PREMIUM',
          accentColor: '#0284c7',
          link: '/products?category=shoes'
        },
        {
          id: 3,
          image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
          leftText: 'STREETWEAR\nDROP',
          promoTitle: 'PROMO\n-30%',
          promoSubtitle: 'DERNIÈRES TENDANCES',
          accentColor: '#ef4444',
          link: '/products?category=clothing'
        },
        {
          id: 4,
          image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop',
          leftText: 'PREMIUM\nBOUTIQUE',
          promoTitle: 'EXPÉDIÉ\nEN 48H',
          promoSubtitle: 'COLLECTION LUXE',
          accentColor: '#10b981',
          link: '/products'
        }
      ],
      homepageMedia: DEFAULT_HOMEPAGE_MEDIA,
      googleSheetConfig: {
        sheetUrl: '',
        lastSynced: null,
        status: 'DISCONNECTED'
      },
      promoCodes: DEFAULT_PROMO_CODES,
      notifications: DEFAULT_NOTIFICATIONS,
      merchantSettings: DEFAULT_MERCHANT_SETTINGS,
      pixelSettings: DEFAULT_PIXEL_SETTINGS,
      marketingSubscribers: DEFAULT_MARKETING_SUBSCRIBERS,
      broadcastLogs: DEFAULT_BROADCAST_LOGS,
      blogPosts: DEFAULT_BLOG_POSTS,
      
      clients: [],
      suppliers: [],
      supplyOrders: [],
      employees: [],
      employeePayments: [],
      expenses: DEFAULT_EXPENSES,
      deliveryZones: DEFAULT_DELIVERY_ZONES,
      dynamicCategories: [
        { 
          id: 'dc1', 
          name: 'Chaussures', 
          slug: 'shoes', 
          icon: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=200&auto=format&fit=crop',
          description: 'Sneakers hype, talons de soirée, mocassins et bottes de luxe.',
          image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop',
          subCategories: [
            { id: 'sc1-1', name: 'Sneakers Hype', slug: 'sneakers-hype' },
            { id: 'sc1-2', name: 'Baskets Running', slug: 'baskets-running' },
            { id: 'sc1-3', name: 'Talons & Escarpins', slug: 'talons-escarpins' },
            { id: 'sc1-4', name: 'Mocassins & Loafers', slug: 'mocassins-loafers' },
            { id: 'sc1-5', name: 'Bottes en Cuir', slug: 'bottes-cuir' },
          ]
        },
        { 
          id: 'dc2', 
          name: 'Vêtements', 
          slug: 'clothing', 
          icon: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=200&auto=format&fit=crop',
          description: 'Streetwear, vestes premium, t-shirts coton bio et collections exclusives.',
          image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop',
          subCategories: [
            { id: 'sc2-1', name: 'T-Shirts & Tops', slug: 't-shirts-tops' },
            { id: 'sc2-2', name: 'Vestes & Blousons', slug: 'vestes-blousons' },
            { id: 'sc2-3', name: 'Pulls & Sweatshirts', slug: 'pulls-sweatshirts' },
            { id: 'sc2-4', name: 'Robes & Jupes', slug: 'robes-jupes' },
            { id: 'sc2-5', name: 'Pantalons & Chinos', slug: 'pantalons-chinos' },
          ]
        },
        { 
          id: 'dc3', 
          name: 'Sacs', 
          slug: 'bags', 
          icon: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=200&auto=format&fit=crop',
          description: 'Maroquinerie fine, sacs à dos urbains et pochettes de soirée.',
          image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop',
          subCategories: [
            { id: 'sc3-1', name: 'Sacs à Main Cuir', slug: 'sacs-main-cuir' },
            { id: 'sc3-2', name: 'Sacs à Dos Urbains', slug: 'sacs-dos-urbains' },
            { id: 'sc3-3', name: 'Pochettes de Soirée', slug: 'pochettes-soiree' },
            { id: 'sc3-4', name: 'Sacs Cabas & Tote', slug: 'sacs-cabas' },
          ]
        },
        { 
          id: 'dc4', 
          name: 'Bijoux', 
          slug: 'jewelry', 
          icon: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=200&auto=format&fit=crop',
          description: "Or 18 carats, argent sterling 925, perles de culture et parures d'exception.",
          image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop',
          subCategories: [
            { id: 'sc4-1', name: 'Bagues en Or 18k', slug: 'bagues-or-18k' },
            { id: 'sc4-2', name: 'Bracelets Argent 925', slug: 'bracelets-argent' },
            { id: 'sc4-3', name: 'Colliers & Pendentifs', slug: 'colliers-pendentifs' },
            { id: 'sc4-4', name: "Boucles d'Oreilles", slug: 'boucles-oreilles' },
          ]
        },
        { 
          id: 'dc5', 
          name: 'Montres', 
          slug: 'watches', 
          icon: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=200&auto=format&fit=crop',
          description: 'Horlogerie de précision, chronographes cuir et montres intelligentes.',
          image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=800&auto=format&fit=crop',
          subCategories: [
            { id: 'sc5-1', name: 'Montres Classiques Cuir', slug: 'montres-classiques-cuir' },
            { id: 'sc5-2', name: 'Montres Connectées Sport', slug: 'montres-connectees-sport' },
            { id: 'sc5-3', name: 'Chronographes Automatiques', slug: 'chronographes-automatiques' },
          ]
        },
        { 
          id: 'dc6', 
          name: 'Accessoires', 
          slug: 'accessories', 
          icon: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=200&auto=format&fit=crop',
          description: 'Lunettes de soleil aviateur, ceintures en cuir, écharpes et casquettes.',
          image: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?q=80&w=800&auto=format&fit=crop',
          subCategories: [
            { id: 'sc6-1', name: 'Lunettes de Soleil Aviateur', slug: 'lunettes-soleil-aviateur' },
            { id: 'sc6-2', name: 'Ceintures en Cuir Réversibles', slug: 'ceintures-cuir' },
            { id: 'sc6-3', name: 'Écharpes Laine Mérinos', slug: 'echarpes-laine' },
            { id: 'sc6-4', name: 'Casquettes & Chapeaux', slug: 'casquettes-chapeaux' },
          ]
        },
      ],
      locations: DEFAULT_LOCATIONS,
      detectedLocationId: 'benin',

      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      setDetectedLocation: (locationId) => set((state) => {
        const loc = state.locations.find(l => l.id === locationId);
        const curr = loc?.currency === 'FCFA' ? 'FCFA' : 'EUR';
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('aymard_geo_location_id', locationId);
        }
        return { detectedLocationId: locationId, currency: curr };
      }),
      updateLocation: (id, updates) => set((state) => ({
        locations: state.locations.map(l => l.id === id ? { ...l, ...updates } : l)
      })),
      addLocation: (loc) => set((state) => ({
        locations: [...state.locations, loc]
      })),
      deleteLocation: (id) => set((state) => ({
        locations: state.locations.filter(l => l.id !== id)
      })),
      updateLocationPrice: (productId, locationId, price, comparePrice) => set((state) => {
        const updatedProducts = state.products.map(p => {
          if (p.id === productId) {
            const locPrices = { ...(p.locationPrices || {}), [locationId]: price };
            const locComparePrices = { ...(p.locationComparePrices || {}) };
            if (comparePrice !== undefined) {
              locComparePrices[locationId] = comparePrice;
            }
            return {
              ...p,
              locationPrices: locPrices,
              locationComparePrices: locComparePrices
            };
          }
          return p;
        });
        if (typeof window !== 'undefined') {
          fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: updatedProducts }),
          }).catch(() => {});
        }
        return { products: updatedProducts };
      }),
      
      addToCart: (product, quantity = 1, color, size) => set((state) => {
        const existingIndex = state.cart.findIndex(
          (item) => item.product.id === product.id && item.color === color && item.size === size
        );
        const newCart = [...state.cart];
        if (existingIndex > -1) {
          newCart[existingIndex] = { ...newCart[existingIndex], quantity: newCart[existingIndex].quantity + quantity };
        } else {
          newCart.push({ product, quantity, color, size });
        }
        return { cart: newCart };
      }),
      
      removeFromCart: (productId, color, size) => set((state) => ({
        cart: state.cart.filter(
          (item) => !(item.product.id === productId && item.color === color && item.size === size)
        ),
      })),
      
      updateCartQuantity: (productId, quantity, color, size) => set((state) => ({
        cart: state.cart.map((item) =>
          item.product.id === productId && item.color === color && item.size === size
            ? { ...item, quantity: Math.max(1, quantity) }
            : item
        ),
      })),
      
      clearCart: () => set({ cart: [] }),
      
      toggleFavorite: (productId) => set((state) => {
        const isFav = state.favorites.includes(productId);
        return { favorites: isFav ? state.favorites.filter((id) => id !== productId) : [...state.favorites, productId] };
      }),
      
      login: (email, name, role, phone) => set((state) => {
        const existingClient = state.clients.find(c => c.email.toLowerCase() === email.toLowerCase());
        const refCode = state.user?.referralCode || existingClient?.referralCode || generateReferralCode(email, name);
        const storedReferrer = typeof window !== 'undefined' ? localStorage.getItem('aymard_referrer_code') : null;
        const referredBy = state.user?.referredBy || existingClient?.referredBy || storedReferrer || undefined;

        // Ensure client exists in clients list with referral data
        let nextClients = [...state.clients];
        if (existingClient) {
          nextClients = nextClients.map(c => c.email.toLowerCase() === email.toLowerCase() ? {
            ...c,
            referralCode: refCode,
            referredBy: c.referredBy || referredBy
          } : c);
        } else {
          nextClients.unshift({
            id: 'cli_' + Date.now(),
            name,
            email,
            phone: phone || '',
            totalOrders: 0,
            totalSpent: 0,
            registeredDate: new Date().toLocaleDateString('fr-FR'),
            referralCode: refCode,
            referredBy,
            referralClicks: 0,
            referralSignupsCount: 0,
            referralOrdersCount: 0,
            referralPointsEarned: 0
          });
        }

        const newUser = { 
          email, 
          name, 
          role, 
          phone: phone || state.user?.phone || existingClient?.phone || '',
          referralCode: refCode,
          referredBy,
          bonusPoints: existingClient?.bonusPoints || state.user?.bonusPoints || 0,
          spentLoyaltyPoints: existingClient?.spentLoyaltyPoints || state.user?.spentLoyaltyPoints || 0,
          customPerks: existingClient?.customPerks || state.user?.customPerks || [],
          referralClicks: existingClient?.referralClicks || state.user?.referralClicks || 0,
          referralSignupsCount: existingClient?.referralSignupsCount || state.user?.referralSignupsCount || 0,
          referralOrdersCount: existingClient?.referralOrdersCount || state.user?.referralOrdersCount || 0,
          referralPointsEarned: existingClient?.referralPointsEarned || state.user?.referralPointsEarned || 0,
          savedAddresses: state.user?.savedAddresses || []
        };

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('aymard_user_session', JSON.stringify(newUser));
            document.cookie = `aymard_user_session=${encodeURIComponent(JSON.stringify({ email, name, role }))}; path=/; max-age=31536000; SameSite=Lax`;
          } catch {}
        }

        return { 
          clients: nextClients,
          user: newUser 
        };
      }),
      logout: () => {
        if (typeof window !== 'undefined') {
          try {
            localStorage.removeItem('aymard_user_session');
            document.cookie = "aymard_user_session=; path=/; max-age=0";
          } catch {}
        }
        set({ user: null });
      },
      updateUserProfile: (updates) => set((state) => {
        if (!state.user) return {};
        const nextSpent = typeof updates.spentLoyaltyPoints === 'number'
          ? updates.spentLoyaltyPoints
          : state.spentLoyaltyPoints;
        const nextUser = { ...state.user, ...updates, spentLoyaltyPoints: nextSpent };
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('aymard_user_session', JSON.stringify(nextUser));
          } catch {}
        }
        return {
          user: nextUser,
          spentLoyaltyPoints: nextSpent
        };
      }),
      setSpentLoyaltyPoints: (points) => set((state) => ({
        spentLoyaltyPoints: points,
        user: state.user ? { ...state.user, spentLoyaltyPoints: points } : null
      })),
      addSavedAddress: (address) => set((state) => {
        if (!state.user) return {};
        const currentAddrs = state.user.savedAddresses || [];
        const nextAddrs = address.isDefault
          ? [address, ...currentAddrs.map(a => ({ ...a, isDefault: false }))]
          : [...currentAddrs, address];
        return {
          user: { ...state.user, savedAddresses: nextAddrs }
        };
      }),
      deleteSavedAddress: (addressId) => set((state) => {
        if (!state.user) return {};
        return {
          user: {
            ...state.user,
            savedAddresses: (state.user.savedAddresses || []).filter(a => a.id !== addressId)
          }
        };
      }),
      selectedShippingAddress: null,
      setSelectedShippingAddress: (addr) => set({ selectedShippingAddress: addr }),

      addOrder: (order) => set((state) => {
        const nextOrders = [order, ...state.orders];
        if (typeof window !== 'undefined') {
          fetch('/api/notify-merchant', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'NEW_ORDER',
              order,
              merchantSettings: state.merchantSettings
            })
          }).catch(err => console.error('Merchant alert notification error:', err));
        }
        return { orders: nextOrders };
      }),
      updateOrderStatus: (orderId, status) => set((state) => ({
        orders: state.orders.map((o) => o.id === orderId ? { ...o, status } : o)
      })),
      updateOrderTracking: (orderId, trackingUpdates) => set((state) => ({
        orders: state.orders.map((o) => o.id === orderId ? { ...o, ...trackingUpdates } : o)
      })),
      addTrackingCheckpoint: (orderId, checkpoint) => set((state) => ({
        orders: state.orders.map((o) => {
          if (o.id !== orderId) return o;
          const newCheckpoint: TrackingCheckpoint = {
            id: 'chk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            ...checkpoint
          };
          const history = o.trackingHistory || [];
          return {
            ...o,
            currentLocation: checkpoint.location || o.currentLocation,
            trackingStatusText: checkpoint.title || o.trackingStatusText,
            trackingHistory: [newCheckpoint, ...history]
          };
        })
      })),

      setProducts: (products) => set({ products }),
      addProduct: (product) => set((state) => {
        const nextProducts = [product, ...state.products];
        if (typeof window !== 'undefined') {
          fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: nextProducts }),
          }).catch(() => {});
        }
        return { products: nextProducts };
      }),
      deleteProduct: (productId) => set((state) => {
        const nextProducts = state.products.filter(p => p.id !== productId);
        if (typeof window !== 'undefined') {
          fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: nextProducts }),
          }).catch(() => {});
        }
        return { products: nextProducts };
      }),
      updateProduct: (productId: string, updates: Partial<Product>) => set((state) => {
        const nextProducts = state.products.map(p => p.id === productId ? { ...p, ...updates } : p);
        if (typeof window !== 'undefined') {
          fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ products: nextProducts }),
          }).catch(() => {});
        }
        return { products: nextProducts };
      }),
      addNotification: (notification) => set((state) => {
        const newNotif: AppNotification = {
          ...notification,
          id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
          date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
          read: false
        };
        return { notifications: [newNotif, ...(state.notifications || [])] };
      }),
      markNotificationAsRead: (id) => set((state) => ({
        notifications: (state.notifications || []).map(n => n.id === id ? { ...n, read: true } : n)
      })),
      markAllNotificationsAsRead: (userEmail) => set((state) => ({
        notifications: (state.notifications || []).map(n => {
          if (!userEmail || n.targetEmail === 'ALL' || n.targetEmail === userEmail) {
            return { ...n, read: true };
          }
          return n;
        })
      })),
      deleteNotification: (id) => set((state) => ({
        notifications: (state.notifications || []).filter(n => n.id !== id)
      })),
      clearNotifications: () => set({ notifications: [] }),

      updateExchangeRate: (exchangeRate) => set({ exchangeRate }),
      updateFreeShippingThreshold: (freeShippingThreshold) => set({ freeShippingThreshold }),
      updateAnnouncements: (announcements) => set({ announcements }),
      addPromoCode: (promoCode, notifyClients, customMessage) => set((state) => {
        const nextPromos = [promoCode, ...state.promoCodes.filter(c => c.code !== promoCode.code)];
        let nextNotifs = [...(state.notifications || [])];
        
        if (notifyClients) {
          const defaultMsg = promoCode.type === 'percent'
            ? `Offre privilège : Le code ${promoCode.code} vous offre -${promoCode.value}% sur toute la boutique !`
            : `Offre privilège : Le code ${promoCode.code} vous offre une réduction immédiate !`;
            
          const newNotif: AppNotification = {
            id: 'notif-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            targetEmail: promoCode.target || 'ALL',
            targetName: promoCode.targetClientName,
            title: `🎁 Code Promo : ${promoCode.code}`,
            message: customMessage || defaultMsg,
            type: 'PROMO',
            promoCode: promoCode.code,
            date: new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }),
            read: false
          };
          nextNotifs = [newNotif, ...nextNotifs];
        }
        
        return { promoCodes: nextPromos, notifications: nextNotifs };
      }),
      removePromoCode: (code) => set((state) => ({ promoCodes: state.promoCodes.filter(c => c.code !== code) })),

      updateMerchantSettings: (updates) => set((state) => ({ merchantSettings: { ...(state.merchantSettings || DEFAULT_MERCHANT_SETTINGS), ...updates } })),
      updatePixelSettings: (updates) => set((state) => ({ pixelSettings: { ...(state.pixelSettings || DEFAULT_PIXEL_SETTINGS), ...updates } })),

      // Client actions
      addClient: (client) => set((state) => ({ clients: [client, ...state.clients] })),
      deleteClient: (clientId) => set((state) => ({ clients: state.clients.filter(c => c.id !== clientId) })),
      toggleClientVip: (clientIdOrEmail) => set((state) => {
        const nextClients = state.clients.map(c => {
          if (c.id === clientIdOrEmail || c.email === clientIdOrEmail) {
            return { ...c, isVipOverride: !c.isVipOverride };
          }
          return c;
        });
        let nextUser = state.user;
        if (state.user && (state.user.email === clientIdOrEmail || clientIdOrEmail === 'all')) {
          nextUser = { ...state.user, isVipOverride: !state.user.isVipOverride };
        }
        return { clients: nextClients, user: nextUser };
      }),
      // Points Audit & Referral Actions
      addPointTransaction: (tx) => set((state) => ({
        pointTransactions: [
          {
            id: 'tx_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            date: new Date().toLocaleDateString('fr-FR'),
            ...tx
          },
          ...(state.pointTransactions || [])
        ]
      })),

      trackReferralClick: (refCode) => set((state) => {
        if (!refCode) return {};
        const cleanRef = refCode.trim().toUpperCase();
        const nextClients = (state.clients || []).map(c => {
          const clientCode = c.referralCode || generateReferralCode(c.email, c.name);
          if (clientCode === cleanRef) {
            return { ...c, referralCode: clientCode, referralClicks: (c.referralClicks || 0) + 1 };
          }
          return c;
        });
        let nextUser = state.user;
        if (state.user) {
          const userCode = state.user.referralCode || generateReferralCode(state.user.email, state.user.name);
          if (userCode === cleanRef) {
            nextUser = { ...state.user, referralCode: userCode, referralClicks: (state.user.referralClicks || 0) + 1 };
          }
        }
        return { clients: nextClients, user: nextUser };
      }),

      registerReferralSignup: (newClientEmail, refCode) => set((state) => {
        if (!refCode || !newClientEmail) return {};
        const cleanRef = refCode.trim().toUpperCase();
        const cleanEmail = newClientEmail.trim().toLowerCase();

        const referrer = (state.clients || []).find(c => (c.referralCode || generateReferralCode(c.email, c.name)) === cleanRef) || 
          (state.user && (state.user.referralCode || generateReferralCode(state.user.email, state.user.name)) === cleanRef ? state.user : null);

        const signupBonusPoints = 50; // Bonus for referrer
        let newTransactions = [...(state.pointTransactions || [])];

        if (referrer && referrer.email.toLowerCase() !== cleanEmail) {
          newTransactions.unshift({
            id: 'tx_sgn_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            userEmail: referrer.email,
            userName: referrer.name,
            date: new Date().toLocaleDateString('fr-FR'),
            type: 'REFERRAL_SIGNUP',
            amount: signupBonusPoints,
            description: `Parrainage : Inscription de votre filleul (${cleanEmail})`,
            referredClientEmail: cleanEmail
          });
        }

        const nextClients = (state.clients || []).map(c => {
          const clientCode = c.referralCode || generateReferralCode(c.email, c.name);
          if (clientCode === cleanRef) {
            return {
              ...c,
              referralCode: clientCode,
              referralSignupsCount: (c.referralSignupsCount || 0) + 1,
              bonusPoints: (c.bonusPoints || 0) + signupBonusPoints
            };
          }
          if (c.email.toLowerCase() === cleanEmail) {
            return { ...c, referredBy: cleanRef };
          }
          return c;
        });

        let nextUser = state.user;
        if (state.user) {
          const userCode = state.user.referralCode || generateReferralCode(state.user.email, state.user.name);
          if (userCode === cleanRef) {
            nextUser = {
              ...state.user,
              referralCode: userCode,
              referralSignupsCount: (state.user.referralSignupsCount || 0) + 1,
              bonusPoints: (state.user.bonusPoints || 0) + signupBonusPoints
            };
          } else if (state.user.email.toLowerCase() === cleanEmail) {
            nextUser = { ...state.user, referredBy: cleanRef };
          }
        }

        return {
          clients: nextClients,
          user: nextUser,
          pointTransactions: newTransactions
        };
      }),

      processOrderPointsAndReferral: (order) => set((state) => {
        const customerEmail = (order.customerEmail || state.user?.email || '').trim().toLowerCase();
        if (!customerEmail) return {};

        const orderPoints = calculatePointsEarned(order.total, order.currency);
        let newTransactions = [...(state.pointTransactions || [])];

        // 1. Transaction for customer personal purchase (1€ = 1 PT / 1000 FCFA = 1 PT)
        if (orderPoints > 0) {
          newTransactions.unshift({
            id: 'tx_ord_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
            userEmail: customerEmail,
            userName: order.customerName || state.user?.name || customerEmail,
            date: new Date().toLocaleDateString('fr-FR'),
            type: 'PURCHASE',
            amount: orderPoints,
            description: `Achat sur commande #${order.orderNumber || order.id} (${order.total} ${order.currency})`,
            sourceOrderId: order.orderNumber || order.id,
            currency: order.currency
          });
        }

        // 2. Check if this customer has a referrer
        const customerClient = (state.clients || []).find(c => c.email.toLowerCase() === customerEmail) || 
          (state.user?.email.toLowerCase() === customerEmail ? state.user : null);

        let storedRef: string | null = null;
        if (typeof window !== 'undefined') {
          try {
            storedRef = localStorage.getItem('aymard_referrer_code');
          } catch {
            storedRef = null;
          }
        }
        const referrerCode = customerClient?.referredBy || storedRef;
        let nextClients = [...(state.clients || [])];
        let nextUser = state.user ? { ...state.user } : null;

        if (referrerCode) {
          const cleanRef = referrerCode.trim().toUpperCase();
          const referrer = nextClients.find(c => (c.referralCode || generateReferralCode(c.email, c.name)) === cleanRef) || 
            (state.user && (state.user.referralCode || generateReferralCode(state.user.email, state.user.name)) === cleanRef ? state.user : null);

          if (referrer && referrer.email.toLowerCase() !== customerEmail) {
            // 10% referral commission in points (1€ = 1 PT / 1000 FCFA = 1 PT)
            const commissionPoints = Math.max(1, Math.round(orderPoints * 0.10));

            newTransactions.unshift({
              id: 'tx_ref_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
              userEmail: referrer.email.toLowerCase(),
              userName: referrer.name,
              date: new Date().toLocaleDateString('fr-FR'),
              type: 'REFERRAL_PURCHASE',
              amount: commissionPoints,
              description: `Commission d'affiliation 10% sur commande #${order.orderNumber || order.id} de votre filleul (${customerClient?.name || customerEmail})`,
              sourceOrderId: order.orderNumber || order.id,
              referredClientName: customerClient?.name || customerEmail,
              referredClientEmail: customerEmail,
              currency: order.currency
            });

            nextClients = nextClients.map(c => {
              const code = c.referralCode || generateReferralCode(c.email, c.name);
              if (code === cleanRef) {
                return {
                  ...c,
                  referralCode: code,
                  referralOrdersCount: (c.referralOrdersCount || 0) + 1,
                  referralPointsEarned: (c.referralPointsEarned || 0) + commissionPoints,
                  bonusPoints: (c.bonusPoints || 0) + commissionPoints
                };
              }
              return c;
            });

            if (nextUser) {
              const uCode = nextUser.referralCode || generateReferralCode(nextUser.email, nextUser.name);
              if (uCode === cleanRef) {
                nextUser = {
                  ...nextUser,
                  referralCode: uCode,
                  referralOrdersCount: (nextUser.referralOrdersCount || 0) + 1,
                  referralPointsEarned: (nextUser.referralPointsEarned || 0) + commissionPoints,
                  bonusPoints: (nextUser.bonusPoints || 0) + commissionPoints
                };
              }
            }
          }
        }

        return {
          pointTransactions: newTransactions,
          clients: nextClients,
          user: nextUser
        };
      }),

      convertPointsToCoupon: (userEmail, points, currency) => {
        const state = get();
        if (points <= 0) {
          return { success: false, message: 'Montant de points invalide.' };
        }

        // Calculate discount value based on universal rule:
        // 100 Points = 10 € / 10 000 FCFA
        const discountValue = currency === 'FCFA' ? points * 100 : Math.round(points * 0.10);
        const code = `VIP-${points}PTS-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

        const newPromo: PromoCode = {
          code,
          type: 'fixed',
          value: discountValue,
          target: userEmail,
          targetClientName: state.user?.name || userEmail,
          description: `Coupon d'achat Fidélité / Affiliation (${points} Pts = -${discountValue} ${currency})`,
          createdAt: new Date().toLocaleDateString('fr-FR')
        };

        const newTx: PointTransaction = {
          id: 'tx_conv_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          userEmail,
          userName: state.user?.name,
          date: new Date().toLocaleDateString('fr-FR'),
          type: 'CONVERSION_PROMO',
          amount: -points,
          description: `Conversion de ${points} Points en bon d'achat [${code}] (-${discountValue} ${currency})`
        };

        const currentSpent = state.spentLoyaltyPoints || 0;
        const nextSpent = currentSpent + points;

        set((st) => ({
          spentLoyaltyPoints: nextSpent,
          user: st.user ? { ...st.user, spentLoyaltyPoints: nextSpent } : null,
          promoCodes: [newPromo, ...st.promoCodes],
          pointTransactions: [newTx, ...(st.pointTransactions || [])]
        }));

        return {
          success: true,
          promoCode: code,
          message: `Félicitations ! Votre coupon de ${discountValue} ${currency} (${code}) est activé.`
        };
      },

      grantClientBonusPoints: (clientIdOrEmail, points, reason) => set((state) => {
        let clientName = '';
        let clientEmail = '';
        const nextClients = state.clients.map(c => {
          if (c.id === clientIdOrEmail || c.email === clientIdOrEmail) {
            clientName = c.name;
            clientEmail = c.email;
            const currentBonus = c.bonusPoints || 0;
            return { ...c, bonusPoints: currentBonus + points };
          }
          return c;
        });
        let nextUser = state.user;
        if (state.user && (state.user.email === clientIdOrEmail || clientIdOrEmail === 'all')) {
          clientName = state.user.name;
          clientEmail = state.user.email;
          nextUser = { ...state.user, bonusPoints: (state.user.bonusPoints || 0) + points };
        }

        const newTx: PointTransaction = {
          id: 'tx_adm_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
          userEmail: clientEmail || clientIdOrEmail,
          userName: clientName || clientIdOrEmail,
          date: new Date().toLocaleDateString('fr-FR'),
          type: 'ADMIN_GRANT',
          amount: points,
          description: reason || `Attribution manuelle de +${points} points bonus par l'administrateur`
        };

        const newNotif: AppNotification = {
          id: 'notif_' + Date.now(),
          targetEmail: clientIdOrEmail,
          title: '★ Points Bonus VIP Accordés !',
          message: reason || `Félicitations ! La boutique vous a accordé +${points} points fidélité VIP d'exception.`,
          type: 'PROMO',
          date: new Date().toLocaleDateString('fr-FR'),
          read: false
        };
        return { 
          clients: nextClients, 
          user: nextUser, 
          notifications: [newNotif, ...state.notifications],
          pointTransactions: [newTx, ...(state.pointTransactions || [])]
        };
      }),
      grantClientPerk: (clientIdOrEmail, perk) => set((state) => {
        const newPerk: ClientPerk = {
          id: 'perk_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
          title: perk.title,
          description: perk.description,
          icon: perk.icon || '🎁',
          dateGranted: new Date().toLocaleDateString('fr-FR')
        };
        const nextClients = state.clients.map(c => {
          if (c.id === clientIdOrEmail || c.email === clientIdOrEmail) {
            const existing = c.customPerks || [];
            return { ...c, customPerks: [newPerk, ...existing] };
          }
          return c;
        });
        let nextUser = state.user;
        if (state.user && (state.user.email === clientIdOrEmail || clientIdOrEmail === 'all')) {
          nextUser = { ...state.user, customPerks: [newPerk, ...(state.user.customPerks || [])] };
        }
        const newNotif: AppNotification = {
          id: 'notif_' + Date.now(),
          targetEmail: clientIdOrEmail,
          title: `🎁 Privilège Accordé : ${perk.title}`,
          message: perk.description || 'Un nouveau privilège exclusif vient d\'être ajouté à votre compte.',
          type: 'ORDER',
          date: new Date().toLocaleDateString('fr-FR'),
          read: false
        };
        return { clients: nextClients, user: nextUser, notifications: [newNotif, ...state.notifications] };
      }),
      removeClientPerk: (clientIdOrEmail, perkId) => set((state) => {
        const nextClients = state.clients.map(c => {
          if (c.id === clientIdOrEmail || c.email === clientIdOrEmail) {
            return { ...c, customPerks: (c.customPerks || []).filter(p => p.id !== perkId) };
          }
          return c;
        });
        let nextUser = state.user;
        if (state.user && (state.user.email === clientIdOrEmail || clientIdOrEmail === 'all')) {
          nextUser = { ...state.user, customPerks: (state.user.customPerks || []).filter(p => p.id !== perkId) };
        }
        return { clients: nextClients, user: nextUser };
      }),
      
      // Supplier actions
      addSupplier: (supplier) => set((state) => ({ suppliers: [supplier, ...state.suppliers] })),
      updateSupplier: (supplierId, updates) => set((state) => ({
        suppliers: state.suppliers.map(s => s.id === supplierId ? { ...s, ...updates } : s)
      })),
      deleteSupplier: (supplierId) => set((state) => ({ suppliers: state.suppliers.filter(s => s.id !== supplierId) })),
      
      // Supply order actions
      addSupplyOrder: (order) => set((state) => ({ supplyOrders: [order, ...state.supplyOrders] })),
      updateSupplyOrderStatus: (orderId, status) => set((state) => ({
        supplyOrders: state.supplyOrders.map(o => o.id === orderId ? { ...o, status } : o)
      })),
      
      // Employee actions
      addEmployee: (employee) => set((state) => ({ employees: [employee, ...state.employees] })),
      updateEmployee: (employeeId, updates) => set((state) => ({
        employees: state.employees.map(e => e.id === employeeId ? { ...e, ...updates } : e)
      })),
      deleteEmployee: (employeeId) => set((state) => ({ employees: state.employees.filter(e => e.id !== employeeId) })),
      toggleEmployeeStatus: (employeeId) => set((state) => ({
        employees: state.employees.map(e => e.id === employeeId ? { ...e, status: e.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' } : e)
      })),
      
      // Employee payment actions
      addEmployeePayment: (payment) => set((state) => ({ employeePayments: [payment, ...state.employeePayments] })),
      
      // Delivery zone actions
      addDeliveryZone: (zone) => set((state) => ({ deliveryZones: [...state.deliveryZones, zone] })),
      updateDeliveryZone: (zoneId, updates) => set((state) => ({
        deliveryZones: state.deliveryZones.map(z => z.id === zoneId ? { ...z, ...updates } : z)
      })),
      deleteDeliveryZone: (zoneId) => set((state) => ({ deliveryZones: state.deliveryZones.filter(z => z.id !== zoneId) })),
      
      // Dynamic category actions
      addDynamicCategory: (category) => set((state) => ({ dynamicCategories: [...state.dynamicCategories, category] })),
      deleteDynamicCategory: (categoryId) => set((state) => ({ dynamicCategories: state.dynamicCategories.filter(c => c.id !== categoryId) })),
      addSubCategory: (categoryId, subCategory) => set((state) => ({
        dynamicCategories: state.dynamicCategories.map(c => {
          if (c.id === categoryId) {
            const subs = c.subCategories || [];
            return { ...c, subCategories: [...subs, subCategory] };
          }
          return c;
        })
      })),
      deleteSubCategory: (categoryId, subCategoryId) => set((state) => ({
        dynamicCategories: state.dynamicCategories.map(c => {
          if (c.id === categoryId) {
            return { ...c, subCategories: (c.subCategories || []).filter(sc => sc.id !== subCategoryId) };
          }
          return c;
        })
      })),

      // Hero slides actions
      updateHeroSlide: (id, updates) => set((state) => ({
        heroSlides: state.heroSlides.map(s => s.id === id ? { ...s, ...updates } : s)
      })),
      addHeroSlide: (slide) => set((state) => ({ heroSlides: [...state.heroSlides, slide] })),
      deleteHeroSlide: (id) => set((state) => ({ heroSlides: state.heroSlides.filter(s => s.id !== id) })),
      
      // Homepage Media & Visual CMS actions
      updateHomepageMedia: (updates) => set((state) => ({
        homepageMedia: { ...(state.homepageMedia || DEFAULT_HOMEPAGE_MEDIA), ...updates }
      })),
      updateCategoryTile: (id, updates) => set((state) => {
        const currentMedia = state.homepageMedia || DEFAULT_HOMEPAGE_MEDIA;
        const currentTiles = currentMedia.categoryTiles || DEFAULT_CATEGORY_TILES;
        return {
          homepageMedia: {
            ...currentMedia,
            categoryTiles: currentTiles.map(t => t.id === id ? { ...t, ...updates } : t)
          }
        };
      }),
      updateLookbook: (updates) => set((state) => {
        const currentMedia = state.homepageMedia || DEFAULT_HOMEPAGE_MEDIA;
        return {
          homepageMedia: {
            ...currentMedia,
            lookbook: { ...(currentMedia.lookbook || DEFAULT_LOOKBOOK), ...updates }
          }
        };
      }),
      updateFaqEditorial: (updates) => set((state) => {
        const currentMedia = state.homepageMedia || DEFAULT_HOMEPAGE_MEDIA;
        return {
          homepageMedia: {
            ...currentMedia,
            faqEditorial: { ...(currentMedia.faqEditorial || DEFAULT_FAQ_EDITORIAL), ...updates }
          }
        };
      }),
      updateCommunityPhoto: (id, updates) => set((state) => {
        const currentMedia = state.homepageMedia || DEFAULT_HOMEPAGE_MEDIA;
        const currentPhotos = currentMedia.communityPhotos || DEFAULT_COMMUNITY_PHOTOS;
        return {
          homepageMedia: {
            ...currentMedia,
            communityPhotos: currentPhotos.map(p => p.id === id ? { ...p, ...updates } : p)
          }
        };
      }),
      addCommunityPhoto: (photo) => set((state) => {
        const currentMedia = state.homepageMedia || DEFAULT_HOMEPAGE_MEDIA;
        const currentPhotos = currentMedia.communityPhotos || DEFAULT_COMMUNITY_PHOTOS;
        return {
          homepageMedia: {
            ...currentMedia,
            communityPhotos: [...currentPhotos, photo]
          }
        };
      }),
      deleteCommunityPhoto: (id) => set((state) => {
        const currentMedia = state.homepageMedia || DEFAULT_HOMEPAGE_MEDIA;
        const currentPhotos = currentMedia.communityPhotos || DEFAULT_COMMUNITY_PHOTOS;
        return {
          homepageMedia: {
            ...currentMedia,
            communityPhotos: currentPhotos.filter(p => p.id !== id)
          }
        };
      }),
      resetHomepageMedia: () => set({ homepageMedia: DEFAULT_HOMEPAGE_MEDIA }),
      
      // Google Sheets & CSV actions
      updateGoogleSheetConfig: (updates) => set((state) => ({
        googleSheetConfig: { ...state.googleSheetConfig, ...updates }
      })),
      importProductsCSV: (csvText) => {
        try {
          // RFC 4180 Compliant Multi-line CSV Parser
          const parseFullCSV = (text: string): string[][] => {
            const rows: string[][] = [];
            let currentRow: string[] = [];
            let currentCell = '';
            let insideQuotes = false;

            for (let i = 0; i < text.length; i++) {
              const char = text[i];
              const nextChar = text[i + 1];

              if (char === '"') {
                if (insideQuotes && nextChar === '"') {
                  currentCell += '"';
                  i++;
                } else {
                  insideQuotes = !insideQuotes;
                }
              } else if (char === ',' && !insideQuotes) {
                currentRow.push(currentCell.trim());
                currentCell = '';
              } else if ((char === '\r' || char === '\n') && !insideQuotes) {
                if (char === '\r' && nextChar === '\n') {
                  i++;
                }
                currentRow.push(currentCell.trim());
                currentCell = '';
                if (currentRow.some(c => c.length > 0)) {
                  rows.push(currentRow);
                }
                currentRow = [];
              } else {
                currentCell += char;
              }
            }

            if (currentCell.length > 0 || currentRow.length > 0) {
              currentRow.push(currentCell.trim());
              if (currentRow.some(c => c.length > 0)) {
                rows.push(currentRow);
              }
            }

            return rows;
          };

          const extractCleanUrls = (text: string): string[] => {
            if (!text) return [];
            const matches = text.match(/https?:\/\/[^\s"'`<>•\)\(\]\,\;]+/gi);
            if (!matches) return [];
            const cleaned: string[] = [];
            for (let m of matches) {
              let u = m.replace(/[\,\.]$/, '').trim();
              if (u.includes('drive.google.com/file/d/')) {
                const idMatch = u.match(/\/file\/d\/([^\/]+)/);
                if (idMatch && idMatch[1]) u = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
              } else if (u.includes('drive.google.com/open?id=')) {
                const idMatch = u.match(/id=([^&]+)/);
                if (idMatch && idMatch[1]) u = `https://lh3.googleusercontent.com/d/${idMatch[1]}`;
              } else if (u.includes('dropbox.com')) {
                u = u.replace('www.dropbox.com', 'dl.dropboxusercontent.com').replace('?dl=0', '');
              }
              if (u.startsWith('http://') || u.startsWith('https://')) {
                cleaned.push(u);
              }
            }
            return cleaned;
          };

          const detectCategory = (title: string, imageUrls: string[], description: string, rawType: string): string => {
            const textToScan = `${title} ${imageUrls.join(' ')} ${description} ${rawType}`.toLowerCase();
            
            if (/shoe|sneaker|basket|boot|talon|chaussure|footwear|kicks|running|air-force|jordan|dunk|stan-smith|yeezy|moccasin|derby|ow-photoroom|off-white|spezial|sambas|gazelle|campus|bape-sta/.test(textToScan)) {
              return 'shoes';
            }
            if (/t-shirt|tee|shirt|veste|jacket|pantalon|jean|robe|pull|hoodie|maillot|vêtement|suit|skirt|top|short|jogging|sweat|coat|manteau|jersey|pokemon|carte|booster|tripack/.test(textToScan)) {
              return 'clothing';
            }
            if (/bag|sac|pochette|backpack|sacoche|tote|handbag|clutch|valise|cabas|bessace/.test(textToScan)) {
              return 'bags';
            }
            if (/ring|bague|bracelet|jewel|bijou|earring|boucle|or-18k|argent-925/.test(textToScan)) {
              return 'jewelry';
            }
            if (/watch|montre|horloge|smartwatch|chronographe/.test(textToScan)) {
              return 'watches';
            }
            if (/hat|cap|casquette|chapeau|bonnet|snapback|panama|beret/.test(textToScan)) {
              return 'hats';
            }
            if (/sock|chaussette|bas/.test(textToScan)) {
              return 'socks';
            }
            if (/necklace|collier|pendentif|chaîne|pearl/.test(textToScan)) {
              return 'necklaces';
            }
            if (/lunette|sunglasses|ceinture|belt|echarpe|scarf|gant|glove|accessoire|accessories/.test(textToScan)) {
              return 'accessories';
            }
            
            return 'clothing';
          };

          const getDefaultImage = (cat: string): string => {
            switch (cat) {
              case 'shoes': return 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=800&auto=format&fit=crop';
              case 'clothing': return 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=800&auto=format&fit=crop';
              case 'bags': return 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?q=80&w=800&auto=format&fit=crop';
              case 'jewelry': return 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop';
              case 'watches': return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop';
              case 'hats': return 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=800&auto=format&fit=crop';
              default: return 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=800&auto=format&fit=crop';
            }
          };

          const rows = parseFullCSV(csvText);
          if (rows.length < 2) return 0;

          // Header analysis
          const headers = rows[0].map(h => h.toLowerCase().trim());
          const handleIdx = headers.findIndex(h => h === 'handle' || h.includes('handle'));
          const titleIdx = headers.findIndex(h => h === 'title' || h.includes('titre') || h.includes('nom') || h.includes('name'));
          const bodyIdx = headers.findIndex(h => h.includes('body') || h.includes('desc') || h.includes('html'));
          const vendorIdx = headers.findIndex(h => h.includes('vendor') || h.includes('marque') || h.includes('brand'));
          const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('category') || h.includes('catégorie'));
          const priceIdx = headers.findIndex(h => h.includes('variant price') || h.includes('prix') || h.includes('price'));
          const comparePriceIdx = headers.findIndex(h => h.includes('variant compare at price') || h.includes('compare at price') || h.includes('ancien prix'));
          const stockIdx = headers.findIndex(h => h.includes('variant inventory qty') || h.includes('inventory qty') || h.includes('stock') || h.includes('quant'));
          const imageSrcIdx = headers.findIndex(h => h.includes('image src') || h.includes('image') || h.includes('photo') || h.includes('img') || h.includes('src'));
          const variantImageIdx = headers.findIndex(h => h.includes('variant image'));
          const option1Idx = headers.findIndex(h => h.includes('option1 value') || h.includes('taille') || h.includes('size'));

          // Group products by handle or title
          interface ProductGroup {
            handle: string;
            title: string;
            body: string;
            vendor: string;
            type: string;
            prices: number[];
            comparePrices: number[];
            sizes: string[];
            images: string[];
            stockTotal: number;
          }

          const productMap = new Map<string, ProductGroup>();

          for (let i = 1; i < rows.length; i++) {
            const r = rows[i];
            const handle = handleIdx !== -1 && r[handleIdx] ? r[handleIdx] : (titleIdx !== -1 && r[titleIdx] ? r[titleIdx] : `prod_${i}`);
            const title = titleIdx !== -1 && r[titleIdx] ? r[titleIdx] : '';
            const body = bodyIdx !== -1 && r[bodyIdx] ? r[bodyIdx] : '';
            const vendor = vendorIdx !== -1 && r[vendorIdx] ? r[vendorIdx] : '';
            const type = typeIdx !== -1 && r[typeIdx] ? r[typeIdx] : '';
            const price = priceIdx !== -1 && r[priceIdx] ? parseFloat(r[priceIdx].replace(/[^0-9.]/g, '')) : NaN;
            const comparePrice = comparePriceIdx !== -1 && r[comparePriceIdx] ? parseFloat(r[comparePriceIdx].replace(/[^0-9.]/g, '')) : NaN;
            const stockQty = stockIdx !== -1 && r[stockIdx] ? parseInt(r[stockIdx].replace(/[^0-9-]/g, '')) || 0 : 10;
            const size = option1Idx !== -1 && r[option1Idx] ? r[option1Idx] : '';

            // Extract all image URLs from Image Src and Variant Image
            const rawImg = imageSrcIdx !== -1 && r[imageSrcIdx] ? r[imageSrcIdx] : '';
            const rawVarImg = variantImageIdx !== -1 && r[variantImageIdx] ? r[variantImageIdx] : '';
            const foundUrls = [...extractCleanUrls(rawImg), ...extractCleanUrls(rawVarImg)];

            if (!productMap.has(handle)) {
              productMap.set(handle, {
                handle,
                title: title || handle,
                body,
                vendor,
                type,
                prices: !isNaN(price) && price > 0 ? [price] : [],
                comparePrices: !isNaN(comparePrice) && comparePrice > 0 ? [comparePrice] : [],
                sizes: size ? [size] : [],
                images: foundUrls,
                stockTotal: stockQty > 0 ? stockQty : 10,
              });
            } else {
              const existing = productMap.get(handle)!;
              if (title && (!existing.title || existing.title === existing.handle)) existing.title = title;
              if (body && !existing.body) existing.body = body;
              if (vendor && !existing.vendor) existing.vendor = vendor;
              if (type && !existing.type) existing.type = type;
              if (!isNaN(price) && price > 0) existing.prices.push(price);
              if (!isNaN(comparePrice) && comparePrice > 0) existing.comparePrices.push(comparePrice);
              if (stockQty > 0) existing.stockTotal += stockQty;
              if (size && !existing.sizes.includes(size)) existing.sizes.push(size);
              for (const u of foundUrls) {
                if (!existing.images.includes(u)) existing.images.push(u);
              }
            }
          }

          const newProducts: Product[] = [];
          let idx = 0;

          productMap.forEach((group) => {
            idx++;
            // Strip HTML tags from description
            const cleanDesc = group.body
              ? group.body.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim()
              : `${group.title} disponible chez Aymard Store.`;

            // Smart category detection
            const detectedCategory = detectCategory(group.title, group.images, cleanDesc, group.type);

            // Final images array (preserve 100% of real images found)
            const finalImages = group.images.length > 0 ? group.images : [getDefaultImage(detectedCategory)];
            const finalPrice = group.prices.length > 0 ? Math.min(...group.prices) : 49.99;
            const finalComparePrice = group.comparePrices.length > 0 ? Math.max(...group.comparePrices) : undefined;
            
            // Calculate discount badge strictly if comparePrice is higher than price
            let discountBadge: string | null = null;
            if (finalComparePrice && finalComparePrice > finalPrice) {
              const discount = Math.round(((finalComparePrice - finalPrice) / finalComparePrice) * 100);
              if (discount > 0) discountBadge = `-${discount}%`;
            }

            const p: Product = {
              id: 'p_csv_' + Date.now() + '_' + idx + '_' + Math.floor(Math.random() * 1000),
              name_fr: group.title,
              name_en: group.title,
              name_es: group.title,
              slug: group.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || `product-${idx}`,
              price: finalPrice,
              comparePrice: finalComparePrice,
              category: detectedCategory,
              images: finalImages,
              rating: 0,
              reviewCount: 0,
              stock: group.stockTotal,
              isNew: true,
              isFeatured: true,
              description_fr: cleanDesc,
              description_en: cleanDesc,
              description_es: cleanDesc,
              badge: discountBadge,
              brand: group.vendor || undefined,
              sizes: group.sizes.length > 0 ? group.sizes : undefined,
            };

            newProducts.push(p);
          });

          if (newProducts.length > 0) {
            set((state) => {
              const all = [...newProducts, ...state.products];
              if (typeof window !== 'undefined') {
                fetch('/api/products', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ products: all }),
                }).catch(() => {});
              }
              return { products: all };
            });
          }
          return newProducts.length;
        } catch (e) {
          console.error('Shopify CSV import error:', e);
          return 0;
        }
      },
      clearCSVProducts: () => {
        const count = get().products.length;
        set({ products: [] });
        if (typeof window !== 'undefined') {
          fetch('/api/products', { method: 'DELETE' }).catch(() => {});
        }
        return count;
      },

      // Accounting & Expense actions
      addExpense: (expense) => set((state) => ({
        expenses: [expense, ...(state.expenses || [])]
      })),
      updateExpense: (id, updates) => set((state) => ({
        expenses: (state.expenses || []).map(exp => exp.id === id ? { ...exp, ...updates } : exp)
      })),
      deleteExpense: (id) => set((state) => ({
        expenses: (state.expenses || []).filter(exp => exp.id !== id)
      })),
      clearAccountingData: () => set({
        expenses: [],
        employeePayments: [],
        supplyOrders: []
      }),
      clearAllMockData: () => set({
        orders: [],
        expenses: [],
        clients: [],
        suppliers: [],
        supplyOrders: [],
        employees: [],
        employeePayments: [],
        supportConversations: [],
        reviews: [],
        abandonedCheckouts: [],
        marketingSubscribers: [],
        broadcastLogs: [],
        pointTransactions: []
      }),

      // Support & Live Chat Actions
      startNewSupportConversation: (customerName, topic) => {
        const newId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const nowDate = new Date().toLocaleDateString('fr-FR');
        const user = get().user;
        const name = customerName || user?.name || 'Visiteur VIP';
        const initialTopic = topic || 'Conseil & Renseignements';

        const welcomeText = user
          ? `Bonjour ${user.name} ! ✨\nJe suis Alex de la conciergerie Aymard Store. Comment puis-je vous accompagner aujourd'hui ?`
          : `Bonjour et bienvenue sur Aymard Store ! ✨\nJe suis Alex de la conciergerie Aymard Store. Que ce soit pour un conseil pointure, une commande ou parler directement à un conseiller, je suis à votre disposition.`;

        const newConv: SupportConversation = {
          id: newId,
          customerName: name,
          customerEmail: user?.email,
          customerPhone: user?.phone,
          topic: initialTopic,
          status: 'BOT',
          unreadByAdmin: false,
          createdAt: `${nowDate} à ${nowTime}`,
          lastUpdated: `${nowDate} à ${nowTime}`,
          messages: [
            {
              id: `msg-${Date.now()}`,
              sender: 'bot',
              senderName: 'Alex (Conciergerie VIP)',
              text: welcomeText,
              time: nowTime,
              options: [
                { label: 'Guide des pointures & Tailles', action: 'sizes_help' },
                { label: 'Suivre ma commande', action: 'track_order' },
                { label: 'Paiement en 2X, 3X, 4X sans frais', action: 'payment_plans' },
                { label: 'Authenticité & Politique de Vente', action: 'authenticity' },
                { label: 'Conseiller Aymard Store en direct', action: 'human_agent' }
              ]
            }
          ]
        };

        set((state) => ({
          currentConversationId: newId,
          supportConversations: [newConv, ...(state.supportConversations || [])]
        }));

        return newId;
      },

      sendSupportMessage: (text, sender = 'user', options, image, convId, topic) => set((state) => {
        const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const nowDate = new Date().toLocaleDateString('fr-FR');
        const fullDateTime = `${nowDate} à ${nowTime}`;
        
        let targetConvId = convId || state.currentConversationId;
        const convs = state.supportConversations || [];
        const existingConv = convs.find(c => c.id === targetConvId);

        if (!targetConvId || !existingConv) {
          targetConvId = `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        }

        const newMsg: SupportChatMessage = {
          id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          sender,
          senderName: sender === 'agent' ? 'Conseiller Aymard Store' : sender === 'bot' ? 'Alex (Conciergerie VIP)' : (state.user?.name || 'Client'),
          text,
          time: nowTime,
          options,
          image
        };

        let updatedConvs: SupportConversation[];

        if (existingConv) {
          updatedConvs = convs.map(c => c.id === targetConvId ? {
            ...c,
            customerName: state.user?.name || c.customerName || 'Visiteur VIP',
            customerEmail: state.user?.email || c.customerEmail,
            topic: topic || c.topic || (text ? (text.slice(0, 45) + (text.length > 45 ? '...' : '')) : 'Demande générale'),
            unreadByAdmin: sender === 'user' ? true : c.unreadByAdmin,
            lastUpdated: fullDateTime,
            messages: [...c.messages, newMsg]
          } : c);
        } else {
          const newConv: SupportConversation = {
            id: targetConvId,
            customerName: state.user?.name || 'Visiteur VIP',
            customerEmail: state.user?.email,
            customerPhone: state.user?.phone,
            topic: topic || (text ? (text.slice(0, 45) + (text.length > 45 ? '...' : '')) : 'Demande générale'),
            status: 'BOT',
            unreadByAdmin: sender === 'user',
            createdAt: fullDateTime,
            lastUpdated: fullDateTime,
            messages: [newMsg]
          };
          updatedConvs = [newConv, ...convs];
        }

        return {
          currentConversationId: targetConvId,
          supportConversations: updatedConvs
        };
      }),

      switchToHumanAgent: (convId, topic) => set((state) => {
        const targetConvId = convId || state.currentConversationId || `conv-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const nowDate = new Date().toLocaleDateString('fr-FR');
        const fullDateTime = `${nowDate} à ${nowTime}`;
        
        const transferMsg: SupportChatMessage = {
          id: `msg-trans-${Date.now()}`,
          sender: 'bot',
          senderName: 'Alex (Conciergerie VIP)',
          text: "**Vous êtes maintenant en direct avec un conseiller Aymard Store.**\nUn conseiller a reçu votre notification prioritaire et vous répond directement ici.\n\nVous pouvez également échanger instantanément sur WhatsApp :",
          time: nowTime,
          options: [
            { label: 'Continuer sur WhatsApp Direct', action: 'open_whatsapp' },
            { label: 'Suivre ma commande', action: 'track_order' },
            { label: 'Paiement 3X Sans Frais', action: 'payment_plans' }
          ]
        };

        const convs = state.supportConversations || [];
        const existingConv = convs.find(c => c.id === targetConvId);
        let updatedConvs: SupportConversation[];

        if (existingConv) {
          updatedConvs = convs.map(c => c.id === targetConvId ? {
            ...c,
            status: 'PENDING_AGENT' as const,
            topic: topic || c.topic || '👤 Demande Conseiller Aymard Store',
            unreadByAdmin: true,
            lastUpdated: fullDateTime,
            messages: [...c.messages, transferMsg]
          } : c);
        } else {
          const newConv: SupportConversation = {
            id: targetConvId,
            customerName: state.user?.name || 'Visiteur VIP',
            customerEmail: state.user?.email,
            customerPhone: state.user?.phone,
            topic: topic || '👤 Demande Conseiller Aymard Store',
            status: 'PENDING_AGENT',
            unreadByAdmin: true,
            createdAt: fullDateTime,
            lastUpdated: fullDateTime,
            messages: [transferMsg]
          };
          updatedConvs = [newConv, ...convs];
        }

        return {
          currentConversationId: targetConvId,
          supportConversations: updatedConvs
        };
      }),

      adminReplySupportMessage: (conversationId, text, image) => set((state) => {
        const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const nowDate = new Date().toLocaleDateString('fr-FR');
        const fullDateTime = `${nowDate} à ${nowTime}`;

        const replyMsg: SupportChatMessage = {
          id: `msg-adm-${Date.now()}`,
          sender: 'agent',
          senderName: 'Conseiller Aymard Store',
          text,
          time: nowTime,
          image
        };

        const updatedConvs = (state.supportConversations || []).map(c => c.id === conversationId ? {
          ...c,
          status: (c.status === 'PENDING_AGENT' || c.status === 'BOT' ? 'IN_PROGRESS' : c.status) as SupportConversationStatus,
          unreadByAdmin: false,
          lastUpdated: fullDateTime,
          messages: [...c.messages, replyMsg]
        } : c);

        return { supportConversations: updatedConvs };
      }),

      updateSupportConversationStatus: (conversationId, status) => set((state) => {
        const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const nowDate = new Date().toLocaleDateString('fr-FR');
        return {
          supportConversations: (state.supportConversations || []).map(c => c.id === conversationId ? {
            ...c,
            status,
            unreadByAdmin: status === 'SATISFIED' || status === 'CLOSED' ? false : c.unreadByAdmin,
            lastUpdated: `${nowDate} à ${nowTime}`
          } : c)
        };
      }),

      markConversationAsRead: (conversationId) => set((state) => ({
        supportConversations: (state.supportConversations || []).map(c => c.id === conversationId ? { ...c, unreadByAdmin: false } : c)
      })),

      closeSupportConversation: (conversationId, status = 'CLOSED') => set((state) => {
        const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const nowDate = new Date().toLocaleDateString('fr-FR');
        return {
          supportConversations: (state.supportConversations || []).map(c => c.id === conversationId ? {
            ...c,
            status: status || 'CLOSED',
            unreadByAdmin: false,
            lastUpdated: `${nowDate} à ${nowTime}`
          } : c)
        };
      }),

      deleteSupportConversation: (conversationId) => set((state) => ({
        supportConversations: (state.supportConversations || []).filter(c => c.id !== conversationId),
        currentConversationId: state.currentConversationId === conversationId ? '' : state.currentConversationId
      })),

      addProductReview: (review) => set((state) => {
        const newReview: ProductReview = {
          ...review,
          id: review.id || `rev-${Date.now()}`,
          date: review.date || new Date().toLocaleDateString('fr-FR'),
          status: review.status || 'APPROVED',
          likesCount: review.likesCount || 0,
          verifiedPurchase: review.verifiedPurchase ?? true
        };
        return {
          reviews: [newReview, ...(state.reviews || [])]
        };
      }),

      updateProductReview: (id, updates) => set((state) => ({
        reviews: (state.reviews || []).map(r => r.id === id ? { ...r, ...updates } : r)
      })),

      deleteProductReview: (id) => set((state) => ({
        reviews: (state.reviews || []).filter(r => r.id !== id)
      })),

      likeProductReview: (id) => set((state) => ({
        reviews: (state.reviews || []).map(r => r.id === id ? { ...r, likesCount: (r.likesCount || 0) + 1 } : r)
      })),

      subscribeToMarketing: (subscriber) => {
        let result = { success: false, message: '' };
        set((state) => {
          const emailClean = (subscriber.email || '').trim().toLowerCase();
          const phoneClean = (subscriber.phone || '').trim();

          if (!emailClean && !phoneClean) {
            result = { success: false, message: 'Veuillez renseigner un email ou un numéro WhatsApp.' };
            return state;
          }

          const existingIndex = (state.marketingSubscribers || []).findIndex(s => 
            (emailClean && s.email && s.email.toLowerCase() === emailClean) ||
            (phoneClean && s.phone && s.phone === phoneClean)
          );

          if (existingIndex >= 0) {
            const updated = [...state.marketingSubscribers];
            const current = updated[existingIndex];
            const mergedChannels = Array.from(new Set([...current.channels, ...subscriber.channels]));
            updated[existingIndex] = {
              ...current,
              name: subscriber.name || current.name,
              email: emailClean || current.email,
              phone: phoneClean || current.phone,
              channels: mergedChannels as any,
              preferredCategory: subscriber.preferredCategory || current.preferredCategory || 'all',
              active: true
            };
            result = { success: true, message: 'Vos préférences d\'alertes WhatsApp / Email ont été mises à jour avec succès !' };
            return { marketingSubscribers: updated };
          }

          const newSub: MarketingSubscriber = {
            id: `sub-${Date.now()}`,
            name: subscriber.name || (emailClean ? emailClean.split('@')[0] : 'Client VIP'),
            email: emailClean || undefined,
            phone: phoneClean || undefined,
            channels: subscriber.channels && subscriber.channels.length > 0 ? subscriber.channels : ['WHATSAPP', 'EMAIL'],
            subscribedAt: new Date().toLocaleDateString('fr-FR'),
            active: true,
            preferredCategory: subscriber.preferredCategory || 'all',
            source: subscriber.source || 'FOOTER'
          };

          result = { success: true, message: '🎉 Félicitations ! Vous recevrez nos nouveaux drops et arrivages exclusifs.' };
          return {
            marketingSubscribers: [newSub, ...(state.marketingSubscribers || [])]
          };
        });
        return result;
      },

      unsubscribeMarketing: (emailOrPhone) => set((state) => {
        const query = (emailOrPhone || '').trim().toLowerCase();
        return {
          marketingSubscribers: (state.marketingSubscribers || []).map(s => {
            if ((s.email && s.email.toLowerCase() === query) || (s.phone && s.phone.includes(query))) {
              return { ...s, active: false };
            }
            return s;
          })
        };
      }),

      toggleSubscriberStatus: (id) => set((state) => ({
        marketingSubscribers: (state.marketingSubscribers || []).map(s => s.id === id ? { ...s, active: !s.active } : s)
      })),

      deleteSubscriber: (id) => set((state) => ({
        marketingSubscribers: (state.marketingSubscribers || []).filter(s => s.id !== id)
      })),

      recordBroadcast: (log) => set((state) => {
        const newLog: ProductBroadcastLog = {
          ...log,
          id: `bcast-${Date.now()}`,
          sentAt: new Date().toLocaleString('fr-FR')
        };
        return {
          broadcastLogs: [newLog, ...(state.broadcastLogs || [])]
        };
      }),

      addBlogPost: (post) => set((state) => {
        const id = post.id || `blog-${Date.now()}`;
        const newPost: BlogPost = {
          ...post,
          id,
          viewsCount: 0,
          likesCount: 0,
        };
        return {
          blogPosts: [newPost, ...(state.blogPosts || [])]
        };
      }),

      updateBlogPost: (id, updates) => set((state) => ({
        blogPosts: (state.blogPosts || []).map(p => p.id === id ? { ...p, ...updates } : p)
      })),

      deleteBlogPost: (id) => set((state) => ({
        blogPosts: (state.blogPosts || []).filter(p => p.id !== id)
      })),

      togglePublishBlogPost: (id) => set((state) => ({
        blogPosts: (state.blogPosts || []).map(p => p.id === id ? { ...p, published: !p.published } : p)
      })),

      likeBlogPost: (id) => set((state) => ({
        blogPosts: (state.blogPosts || []).map(p => p.id === id ? { ...p, likesCount: (p.likesCount || 0) + 1 } : p)
      })),

      incrementBlogViews: (id) => set((state) => ({
        blogPosts: (state.blogPosts || []).map(p => p.id === id ? { ...p, viewsCount: (p.viewsCount || 0) + 1 } : p)
      })),

      addAbandonedCheckout: (item) => {
        const id = item.id || `ab_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const now = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        const newRecord: AbandonedCheckout = {
          ...item,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          const existing = (state.abandonedCheckouts || []).find(a => 
            (item.customerPhone && a.customerPhone === item.customerPhone) ||
            (item.customerEmail && a.customerEmail === item.customerEmail && a.product.id === item.product.id)
          );
          if (existing) {
            return {
              abandonedCheckouts: state.abandonedCheckouts.map(a => a.id === existing.id ? { ...existing, ...item, updatedAt: now } : a)
            };
          }
          return {
            abandonedCheckouts: [newRecord, ...(state.abandonedCheckouts || [])]
          };
        });
        return id;
      },

      updateAbandonedCheckout: (id, updates) => set((state) => {
        const now = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }) + ' ' + new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
        return {
          abandonedCheckouts: (state.abandonedCheckouts || []).map(a => a.id === id ? { ...a, ...updates, updatedAt: now } : a)
        };
      }),

      deleteAbandonedCheckout: (id) => set((state) => ({
        abandonedCheckouts: (state.abandonedCheckouts || []).filter(a => a.id !== id)
      })),

      clearRecoveredCheckouts: () => set((state) => ({
        abandonedCheckouts: (state.abandonedCheckouts || []).filter(a => a.status !== 'RECOVERED')
      })),

      updateMonerooSettings: (settings) => set((state) => ({
        monerooSettings: { ...(state.monerooSettings || DEFAULT_MONEROO_SETTINGS), ...settings }
      })),

      setQuickBuyProduct: (data) => set({ quickBuyProduct: data }),

      setCurrentConversationId: (id) => set({ currentConversationId: id }),
    }),
    {
      name: 'aymard-store-storage',
      version: 30,
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        if (state && state.products) {
          state.products = state.products.map(p => ({
            ...p,
            brand: (!p.brand || p.brand.toLowerCase() === 'king of caps') ? 'AYMARD STORE' : p.brand,
            images: (p.images || []).map(img => img.replace(/\/products\/kingofcaps\//g, '/products/caps/'))
          }));
        }
        if (state && !state.user && typeof window !== 'undefined') {
          try {
            const raw = localStorage.getItem('aymard_user_session');
            if (raw) {
              const u = JSON.parse(raw);
              if (u && u.email) {
                state.user = u;
              }
            }
          } catch {}
        }
      },
      migrate: (persistedState: any, version: number) => {
        if (version < 30 && persistedState) {
          // Sync with clean products and standardized sizes
          persistedState.products = defaultProducts;
        }
        if (version < 18 && persistedState) {
          persistedState.reviews = [];
          persistedState.abandonedCheckouts = [];
          persistedState.marketingSubscribers = [];
          persistedState.broadcastLogs = [];
          persistedState.supportConversations = [];
          persistedState.pointTransactions = [];
          persistedState.expenses = [];
          if (persistedState.homepageMedia) {
            persistedState.homepageMedia.communityPhotos = [];
          }
          persistedState.clients = (persistedState.clients || []).filter(
            (c: any) => c.email && !c.email.includes('example.com')
          );
          if (!persistedState.products || persistedState.products.length === 0) {
            persistedState.products = defaultProducts;
          }
          if (!persistedState.blogPosts || persistedState.blogPosts.length === 0) {
            persistedState.blogPosts = DEFAULT_BLOG_POSTS;
          }
          if (persistedState.user) {
            persistedState.user.savedAddresses = (persistedState.user.savedAddresses || []).filter(
              (a: any) => a.id !== 'addr_1' && a.id !== 'addr_default'
            );
            if (!persistedState.user.referralCode && persistedState.user.email) {
              persistedState.user.referralCode = generateReferralCode(persistedState.user.email, persistedState.user.name);
            }
          }
        }
        return persistedState;
      }
    }
  )
);

// Get active location configuration
export const getActiveLocation = (locationId?: string): LocationConfig => {
  const store = useAppStore.getState();
  const targetId = locationId || store.detectedLocationId || 'benin';
  const loc = store.locations?.find(l => l.id === targetId && l.active) 
    || store.locations?.find(l => l.isDefault && l.active) 
    || DEFAULT_LOCATIONS[0];
  return loc;
};

// Format amount with currency symbol according to location rules
export const formatAmount = (amount: number, location?: LocationConfig): string => {
  const loc = location || getActiveLocation();
  const formattedNum = loc.decimals === 0 
    ? Math.round(amount).toLocaleString('fr-FR')
    : amount.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  
  if (loc.currencySymbol === '€') {
    return `${formattedNum} €`;
  }
  if (loc.currencySymbol === 'FCFA') {
    return `${formattedNum} FCFA`;
  }
  return loc.symbolPosition === 'prefix' ? `${loc.currencySymbol}${formattedNum}` : `${formattedNum} ${loc.currencySymbol}`;
};

// Central Product Price Resolver (Uses custom location price if set, otherwise auto-converts)
export const getProductPrice = (product: Product, locationId?: string) => {
  const loc = getActiveLocation(locationId);
  const customPrice = product.locationPrices?.[loc.id];
  const customComparePrice = product.locationComparePrices?.[loc.id];

  let finalPrice: number;
  let finalComparePrice: number | undefined = undefined;
  let isCustom = false;

  if (typeof customPrice === 'number' && customPrice > 0) {
    finalPrice = customPrice;
    isCustom = true;
  } else {
    // Auto calculate based on base price (in EUR) and exchange rate
    if (loc.currency === 'FCFA') {
      finalPrice = Math.round(product.price * (loc.exchangeRate || 655.957));
    } else {
      finalPrice = Math.round(product.price * (loc.exchangeRate || 1) * 100) / 100;
    }
  }

  if (typeof customComparePrice === 'number' && customComparePrice > 0) {
    finalComparePrice = customComparePrice;
  } else if (product.comparePrice && product.comparePrice > product.price) {
    if (loc.currency === 'FCFA') {
      finalComparePrice = Math.round(product.comparePrice * (loc.exchangeRate || 655.957));
    } else {
      finalComparePrice = Math.round(product.comparePrice * (loc.exchangeRate || 1) * 100) / 100;
    }
  }

  const formattedPrice = formatAmount(finalPrice, loc);
  const formattedComparePrice = finalComparePrice ? formatAmount(finalComparePrice, loc) : undefined;

  return {
    price: finalPrice,
    comparePrice: finalComparePrice,
    currency: loc.currency,
    currencySymbol: loc.currencySymbol,
    formattedPrice,
    formattedComparePrice,
    isCustom,
    location: loc
  };
};

// Currency Converter utility
export const convertPrice = (priceInEUR: number, currency?: 'EUR' | 'FCFA' | string) => {
  const store = useAppStore.getState();
  const loc = getActiveLocation();
  const targetCurrency = currency || loc.currency;
  
  if (targetCurrency === 'FCFA') {
    const rate = loc.exchangeRate || store.exchangeRate || 655.957;
    return Math.round(priceInEUR * rate);
  }
  return priceInEUR;
};

export const formatPrice = (price: number, currency?: 'EUR' | 'FCFA' | string) => {
  const loc = getActiveLocation();
  const targetCurrency = currency || loc.currency;
  if (targetCurrency === 'FCFA') {
    return `${Math.round(price).toLocaleString('fr-FR')} FCFA`;
  }
  return `${price.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
};

// LeekPay Integration Helper for AYMARD STORE
// Handles Mobile Money (MTN, Moov, Celtiis) and Cards in FCFA (XOF)

declare global {
  interface Window {
    LeekPay?: {
      configure: (options: any) => void;
      checkout: (options: {
        amount: number;
        currency?: string;
        apiKey: string;
        description?: string;
        customerEmail?: string;
        customerName?: string;
        returnUrl?: string;
        onSuccess?: (transaction: any) => void;
        onCancel?: () => void;
        onError?: (error: any) => void;
      }) => void;
      close: (triggerCancel?: boolean) => void;
    };
  }
}

export const LEEKPAY_PUBLIC_KEY = process.env.NEXT_PUBLIC_LEEKPAY_PUBLIC_KEY || 'pk_live_O5SZdfU4qvpn651kMnmes9PWdo5eMxsd';

/**
 * Ensures the official LeekPay popup widget script is loaded
 */
export function loadLeekPayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if (window.LeekPay) return resolve();

    const existing = document.querySelector('script[src="https://leekpay.fr/js/leekpay.js"]');
    if (existing) {
      if ((existing as any).loaded || window.LeekPay) {
        return resolve();
      }
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://leekpay.fr/js/leekpay.js';
    script.async = true;
    script.onload = () => {
      (script as any).loaded = true;
      resolve();
    };
    script.onerror = (e) => reject(e);
    document.head.appendChild(script);
  });
}

export interface LeekPayCheckoutOptions {
  amount: number;
  currency?: 'XOF' | 'EUR' | 'USD';
  description?: string;
  customerEmail?: string;
  customerName?: string;
  onSuccess: (transaction: any) => void;
  onCancel?: () => void;
  onError?: (error: any) => void;
}

/**
 * Triggers LeekPay checkout popup for Mobile Money & Card payment
 */
export async function openLeekPayCheckout(options: LeekPayCheckoutOptions) {
  try {
    await loadLeekPayScript();
    
    if (!window.LeekPay) {
      throw new Error('Le module LeekPay est indisponible pour le moment.');
    }

    window.LeekPay.checkout({
      amount: Math.max(100, Math.round(options.amount)),
      currency: options.currency || 'XOF',
      apiKey: LEEKPAY_PUBLIC_KEY,
      description: options.description || 'Commande AYMARD STORE',
      customerEmail: options.customerEmail || undefined,
      customerName: options.customerName || undefined,
      returnUrl: typeof window !== 'undefined' ? (window.location.origin + window.location.pathname) : undefined,
      onSuccess: (transaction) => {
        console.log('[LeekPay] Paiement validé avec succès:', transaction);
        options.onSuccess(transaction);
      },
      onCancel: () => {
        console.log('[LeekPay] Paiement annulé par l utilisateur');
        options.onCancel?.();
      },
      onError: (err) => {
        console.error('[LeekPay] Erreur de transaction:', err);
        options.onError?.(err);
      }
    });
  } catch (err: any) {
    console.error('[LeekPay] Failed to open checkout:', err);
    if (options.onError) {
      options.onError(err);
    } else {
      alert(err.message || 'Impossible d ouvrir la passerelle de paiement LeekPay.');
    }
  }
}

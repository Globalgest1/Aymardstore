// ==========================================
// AYMARD STORE - MARKETING PIXELS & ANALYTICS TRACKER
// Supports Facebook/Meta Pixel, CAPI, TikTok Pixel & Google Analytics (GA4)
// ==========================================

export interface TrackEventPayload {
  eventName: 'PageView' | 'ViewContent' | 'AddToCart' | 'InitiateCheckout' | 'Purchase' | string;
  content_name?: string;
  content_category?: string;
  content_ids?: string[];
  content_type?: string;
  value?: number;
  currency?: string;
  num_items?: number;
  order_id?: string;
  user_data?: {
    email?: string;
    phone?: string;
    firstName?: string;
    lastName?: string;
    city?: string;
    country?: string;
  };
  custom_data?: Record<string, any>;
}

declare global {
  interface Window {
    fbq?: any;
    _fbq?: any;
    ttq?: any;
    gtag?: any;
    dataLayer?: any[];
    snaptr?: any;
    pintrk?: any;
  }
}

/**
 * Client-Side Pixel Event Dispatcher
 */
export function trackPixelEvent(payload: TrackEventPayload) {
  if (typeof window === 'undefined') return;

  const { eventName, value, currency = 'XOF', content_name, content_category, content_ids, num_items, order_id } = payload;

  const eventData: Record<string, any> = {
    content_name,
    content_category,
    content_ids,
    content_type: 'product',
    value,
    currency,
    num_items,
    order_id
  };

  // 1. Meta / Facebook Pixel (fbq)
  try {
    if (window.fbq) {
      if (['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase'].includes(eventName)) {
        window.fbq('track', eventName, eventData);
      } else {
        window.fbq('trackCustom', eventName, eventData);
      }
      console.log('[Meta Pixel] Event Tracked: ' + eventName, eventData);
    }
  } catch (e) {
    console.debug('[Meta Pixel] Tracking notice:', e);
  }

  // 2. TikTok Pixel (ttq)
  try {
    if (window.ttq) {
      const ttEventMap: Record<string, string> = {
        PageView: 'PageView',
        ViewContent: 'ViewContent',
        AddToCart: 'AddToCart',
        InitiateCheckout: 'InitiateCheckout',
        Purchase: 'CompletePayment'
      };
      const ttEvent = ttEventMap[eventName] || eventName;
      window.ttq.track(ttEvent, {
        content_name,
        content_category,
        content_id: content_ids?.[0],
        value,
        currency,
        quantity: num_items
      });
      console.log('[TikTok Pixel] Event Tracked: ' + ttEvent, eventData);
    }
  } catch (e) {
    console.debug('[TikTok Pixel] Tracking notice:', e);
  }

  // 3. Google Analytics 4 (gtag)
  try {
    if (window.gtag) {
      const gaEventMap: Record<string, string> = {
        PageView: 'page_view',
        ViewContent: 'view_item',
        AddToCart: 'add_to_cart',
        InitiateCheckout: 'begin_checkout',
        Purchase: 'purchase'
      };
      const gaEvent = gaEventMap[eventName] || eventName.toLowerCase();
      window.gtag('event', gaEvent, {
        currency,
        value,
        transaction_id: order_id,
        items: content_ids?.map((id) => ({
          item_id: id,
          item_name: content_name,
          item_category: content_category,
          price: value,
          quantity: num_items || 1
        }))
      });
      console.log('[Google Analytics 4] Event Tracked: ' + gaEvent, eventData);
    }
  } catch (e) {
    console.debug('[Google Analytics] Tracking notice:', e);
  }
}

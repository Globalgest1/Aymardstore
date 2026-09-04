'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from '@/lib/compat-navigation';
import { useAppStore } from '@/lib/store';
import { trackPixelEvent } from '@/lib/pixel-tracker';

export default function PixelProvider() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { pixelSettings } = useAppStore();

  // 1. Inject Meta Pixel Scripts
  useEffect(() => {
    if (typeof window === 'undefined' || !pixelSettings) return;

    const activeFbPixels = (pixelSettings.facebookPixels || []).filter(p => p.enabled && p.pixelId?.trim());
    if (activeFbPixels.length > 0 && !window.fbq) {
      /* eslint-disable */
      (function(f: any, b: any, e: any, v: any, n?: any, t?: any, s?: any) {
        if (f.fbq) return;
        n = f.fbq = function() {
          n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
      })(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */

      activeFbPixels.forEach(p => {
        try {
          window.fbq('init', p.pixelId.trim());
        } catch (e) {}
      });
    }

    // 2. Inject TikTok Pixel Scripts
    const activeTtPixels = (pixelSettings.tiktokPixels || []).filter(p => p.enabled && p.pixelId?.trim());
    if (activeTtPixels.length > 0 && !window.ttq) {
      /* eslint-disable */
      (function(w: any, d: any, t: any) {
        w.TiktokAnalyticsObject = t;
        var ttq = (w[t] = w[t] || []);
        ttq.methods = [
          'page',
          'track',
          'identify',
          'instances',
          'debug',
          'on',
          'off',
          'once',
          'ready',
          'alias',
          'group',
          'enableCookie',
          'disableCookie'
        ];
        ttq.setAndDefer = function(t: any, e: any) {
          t[e] = function() {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          };
        };
        for (var i = 0; i < ttq.methods.length; i++) ttq.setAndDefer(ttq, ttq.methods[i]);
        ttq.instance = function(t: any) {
          for (var e = ttq._i[t] || [], n = 0; n < ttq.methods.length; n++) ttq.setAndDefer(e, ttq.methods[n]);
          return e;
        };
        ttq.load = function(e: any, n: any) {
          var i = 'https://analytics.tiktok.com/i18n/pixel/events.js';
          (ttq._i = ttq._i || {}), (ttq._i[e] = []), (ttq._i[e]._u = i), (ttq._t = ttq._t || {}), (ttq._t[e] = +new Date());
          var o = d.createElement('script');
          (o.type = 'text/javascript'), (o.async = !0), (o.src = i + '?sdkid=' + e + '&lib=' + t);
          var a = d.getElementsByTagName('script')[0];
          a.parentNode.insertBefore(o, a);
        };
      })(window, document, 'ttq');
      /* eslint-enable */

      activeTtPixels.forEach(p => {
        try {
          window.ttq.load(p.pixelId.trim());
          window.ttq.page();
        } catch (e) {}
      });
    }

    // 3. Inject Google Analytics (GA4)
    if (pixelSettings.googleAnalytics?.enabled && pixelSettings.googleAnalytics?.measurementId?.trim()) {
      const gId = pixelSettings.googleAnalytics.measurementId.trim();
      const existingScript = document.getElementById('ga4-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'ga4-script';
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${gId}`;
        document.head.appendChild(script);

        window.dataLayer = window.dataLayer || [];
        window.gtag = function() {
          window.dataLayer?.push(arguments);
        };
        window.gtag('js', new Date());
        window.gtag('config', gId);
      }
    }
  }, [pixelSettings]);

  // PageView tracking on route change
  useEffect(() => {
    if (pixelSettings?.autoTrackEvents?.pageView !== false) {
      trackPixelEvent({
        eventName: 'PageView',
        custom_data: {
          path: pathname,
          search: searchParams?.toString()
        }
      });
    }
  }, [pathname, searchParams, pixelSettings]);

  return null;
}

if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import '../css/app.css';

const appName = typeof window !== 'undefined' && window.document.getElementsByTagName('title')[0]?.innerText
  ? window.document.getElementsByTagName('title')[0].innerText
  : 'Aymard Store';

function initApp() {
  const el = typeof document !== 'undefined' ? document.getElementById('app') : null;
  let initialPage: any = undefined;

  if (el?.dataset?.page) {
    try {
      initialPage = JSON.parse(el.dataset.page);
    } catch (e) {
      console.error('Failed to parse el.dataset.page:', e);
    }
  }

  if (!initialPage && typeof document !== 'undefined') {
    const scriptTag = document.querySelector('script[data-page="app"][type="application/json"]');
    if (scriptTag?.textContent) {
      try {
        initialPage = JSON.parse(scriptTag.textContent);
      } catch (e) {}
    }
  }

  createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    page: initialPage,
    resolve: (name) =>
      resolvePageComponent(
        `./Pages/${name}.tsx`,
        import.meta.glob('./Pages/**/*.tsx')
      ),
    setup({ el: element, App, props }) {
      const container = element || el;
      if (container) {
        const root = createRoot(container);
        root.render(<App {...props} />);
      }
    },
    progress: {
      color: '#38bdf8',
      showSpinner: true,
    },
  });
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
}

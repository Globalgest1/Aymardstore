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
  createInertiaApp({
    title: (title) => (title ? `${title} — ${appName}` : appName),
    resolve: (name) =>
      resolvePageComponent(
        `./Pages/${name}.tsx`,
        import.meta.glob('./Pages/**/*.tsx')
      ),
    setup({ el, App, props }) {
      const container = el || (typeof document !== 'undefined' ? document.getElementById('app') : null);
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

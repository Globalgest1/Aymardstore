if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || { env: {} };
}

import React from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import '../css/app.css';

const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'Aymard Store';

const el = typeof document !== 'undefined' ? document.getElementById('app') : null;
const initialPage = el?.dataset?.page ? JSON.parse(el.dataset.page) : undefined;

createInertiaApp({
  title: (title) => (title ? `${title} — ${appName}` : appName),
  page: initialPage,
  resolve: (name) =>
    resolvePageComponent(
      `./Pages/${name}.tsx`,
      import.meta.glob('./Pages/**/*.tsx')
    ),
  setup({ el, App, props }) {
    if (!el) return;
    const root = createRoot(el);
    root.render(<App {...props} />);
  },
  progress: {
    color: '#38bdf8',
    showSpinner: true,
  },
});

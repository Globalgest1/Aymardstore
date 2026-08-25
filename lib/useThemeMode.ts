'use client';

import { useState, useEffect } from 'react';

export function useThemeMode(): boolean {
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const checkTheme = () => {
      const isDark =
        document.documentElement.classList.contains('dark') ||
        (typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark');
      setIsDarkMode(isDark);
    };

    checkTheme();

    const observer = new MutationObserver(mutations => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          checkTheme();
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    window.addEventListener('storage', checkTheme);

    return () => {
      observer.disconnect();
      window.removeEventListener('storage', checkTheme);
    };
  }, []);

  return isDarkMode;
}

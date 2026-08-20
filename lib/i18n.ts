import fr from '../messages/fr.json';
import en from '../messages/en.json';
import es from '../messages/es.json';

const translations = { fr, en, es };

export type Locale = 'fr' | 'en' | 'es';

export const useTranslation = (lang: Locale = 'fr') => {
  const t = (keyPath: string, replacements?: Record<string, string | number>) => {
    const keys = keyPath.split('.');
    let result: any = translations[lang] || translations['fr'];
    for (const key of keys) {
      if (result && result[key] !== undefined) {
        result = result[key];
      } else {
        return keyPath;
      }
    }
    if (typeof result !== 'string') return keyPath;
    
    let text = result;
    if (replacements) {
      Object.entries(replacements).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };
  return { t };
};

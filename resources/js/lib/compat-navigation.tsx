import { router, usePage } from '@inertiajs/react';

export function useRouter() {
  const page = usePage();
  return {
    push: (url: string) => router.visit(url),
    replace: (url: string) => router.replace(url),
    back: () => window.history.back(),
    forward: () => window.history.forward(),
    reload: () => router.reload(),
    prefetch: () => {},
  };
}

export function usePathname(): string {
  try {
    const { url } = usePage();
    return url ? url.split('?')[0] : (typeof window !== 'undefined' ? window.location.pathname : '/');
  } catch {
    return typeof window !== 'undefined' ? window.location.pathname : '/';
  }
}

export function useSearchParams(): URLSearchParams {
  try {
    const { url } = usePage();
    const search = url && url.includes('?') ? url.split('?')[1] : '';
    return new URLSearchParams(typeof window !== 'undefined' ? window.location.search : search);
  } catch {
    return new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
  }
}

export function useParams(): Record<string, any> {
  try {
    const { props } = usePage<any>();
    return props?.params || props || {};
  } catch {
    return {};
  }
}

export function redirect(url: string) {
  if (typeof window !== 'undefined') {
    router.visit(url);
  }
}

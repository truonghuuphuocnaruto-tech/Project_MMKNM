import { useState, useEffect, useCallback } from 'react';

export function getBasePath(): string {
  const base = import.meta.env.BASE_URL || '/';
  return base.replace(/\/+$/, '');
}

export function toAppPath(fullPath: string): string {
  const base = getBasePath();
  let path = fullPath;
  if (base && path.startsWith(base)) {
    path = path.slice(base.length);
  }
  return normalizePath(path);
}

export function toFullPath(appPath: string): string {
  const base = getBasePath();
  if (!base) return appPath;
  if (appPath.startsWith('#')) return appPath;
  if (appPath.startsWith('/#')) return `${base}${appPath}`;
  const clean = appPath.startsWith('/') ? appPath : `/${appPath}`;
  return `${base}${clean}`;
}

export function normalizePath(pathname: string): string {
  const clean = pathname.trim().replace(/\/+$/, '') || '/';
  return clean;
}

export function isAppRoute(pathname: string): boolean {
  const appPath = toAppPath(pathname);
  return appPath === '/app' || appPath.startsWith('/app/');
}

export function navigateTo(to: string) {
  if (to.startsWith('#')) {
    const targetEl = document.querySelector(to);
    if (targetEl) {
      const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      targetEl.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
      window.history.replaceState(null, '', to);
    }
    return;
  }

  // Handle URL with hash, e.g. /#tinh-huong
  if (to.startsWith('/#')) {
    const hash = to.slice(1);
    const currentAppPath = toAppPath(window.location.pathname);
    if (currentAppPath !== '/') {
      const full = toFullPath(to);
      window.history.pushState(null, '', full);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(() => {
        const el = document.querySelector(hash);
        if (el) {
          const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
        }
      }, 100);
      return;
    } else {
      const el = document.querySelector(hash);
      if (el) {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        el.scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
        window.history.replaceState(null, '', hash);
      }
      return;
    }
  }

  const fullDestination = toFullPath(to);
  window.history.pushState(null, '', fullDestination);
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'instant' });
}

export function usePath(): [string, (to: string) => void] {
  const [currentPath, setCurrentPath] = useState<string>(() => toAppPath(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(toAppPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = useCallback((to: string) => {
    navigateTo(to);
    setCurrentPath(toAppPath(window.location.pathname));
  }, []);

  return [currentPath, navigate];
}


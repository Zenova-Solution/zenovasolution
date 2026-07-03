import type { Theme } from '@/types/tweaks';
import { TWEAK_DEFAULTS } from '@/config/tweaks';

const STORAGE_KEY = 'zenova-theme';

function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light';
}

/**
 * Stored user choice wins; the current `data-theme` attribute (set by the
 * inline anti-FOUC script) is the next fallback; the tweak default is only the
 * first-visit fallback.
 */
export function getInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isTheme(stored)) return stored;
  } catch { /* noop */ }
  if (typeof document !== 'undefined') {
    const attr = document.documentElement.getAttribute('data-theme');
    if (isTheme(attr)) return attr;
  }
  return TWEAK_DEFAULTS.theme;
}

/** Returns the opposite theme. */
export function toggleTheme(current: Theme): Theme {
  return current === 'dark' ? 'light' : 'dark';
}

export function applyTheme(theme: Theme) {
  const write = () => {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* private mode */ }
  };
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown };
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(write);
  } else {
    write();
  }
}

/**
 * Sync theme across tabs and surfaces (public site ↔ portals). Fires `cb` with
 * the new theme whenever another tab writes the shared key, and mirrors it onto
 * `data-theme`. Returns an unsubscribe.
 */
export function subscribeTheme(cb: (theme: Theme) => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY || !isTheme(e.newValue)) return;
    document.documentElement.setAttribute('data-theme', e.newValue);
    cb(e.newValue);
  };
  window.addEventListener('storage', onStorage);
  return () => window.removeEventListener('storage', onStorage);
}

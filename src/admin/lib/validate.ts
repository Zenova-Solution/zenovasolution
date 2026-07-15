/**
 * Client-side mirrors of the backend validation constraints so the admin can
 * block a bad save with a friendly message instead of round-tripping into a
 * raw 422. Keep these regexes in lock-step with `backend/app/schemas.py`.
 */

/** `Slug` — `^[a-z0-9][a-z0-9\-_]*$`, max 120 (schemas.py:16). */
const SLUG_RE = /^[a-z0-9][a-z0-9\-_]*$/;
export const SLUG_MAX = 120;

/** `HexColor` — `#` + 3/4/6/8 hex digits (schemas.py:17). */
const HEX_RE = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

/** Pragmatic email shape; the backend uses Pydantic `EmailStr`. */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidSlug(v: string): boolean {
  return v.length > 0 && v.length <= SLUG_MAX && SLUG_RE.test(v);
}

export function isValidHex(v: string): boolean {
  return HEX_RE.test(v);
}

export function isValidEmail(v: string): boolean {
  return EMAIL_RE.test(v.trim());
}

/**
 * Slugs that can never be used by content served at a top-level URL
 * (SEO pages live at zenova.agency/<slug>). Mirrors
 * `RESERVED_TOP_LEVEL_SLUGS` in schemas.py — keep in lock-step.
 */
export const RESERVED_TOP_LEVEL_SLUGS = new Set([
  'new',
  'services',
  'pricing',
  'work',
  'about',
  'contact',
  'careers',
  'privacy',
  'terms',
  'blog',
  'process',
  'admin',
  'client',
  'team',
  'login',
  'signin',
  'assets',
  'uploads',
  'api',
  'index',
  'home',
  '404',
]);

export function isReservedSlug(v: string): boolean {
  return RESERVED_TOP_LEVEL_SLUGS.has(v);
}

/**
 * Coerce arbitrary text into a valid `Slug`: lowercase, collapse whitespace and
 * underscores to dashes, drop anything outside `[a-z0-9-_]`, strip leading
 * non-alphanumerics (the slug must start with `[a-z0-9]`) and cap the length.
 * Returns a string that always satisfies `isValidSlug` — except the empty
 * string, which callers should treat as "not yet valid".
 */
export function slugify(input: string): string {
  const cleaned = input
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^a-z0-9\-_]/g, '')
    .replace(/^[^a-z0-9]+/, '')
    .slice(0, SLUG_MAX);
  return cleaned;
}

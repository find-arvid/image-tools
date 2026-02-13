/**
 * Where each hex colour is used in the UI (e.g. globals.css tokens).
 * Used by the style guide to show "where this colour is used" in a dialog.
 */

export type ColorUsage = {
  file: string;
  token: string;
  context: string;
};

/** Normalize hex for lookup: uppercase with # */
function n(hex: string): string {
  const h = hex.replace(/^#/, '').toUpperCase();
  return h.length === 6 ? `#${h}` : `#${h}`;
}

/** All known hex → usages. Built from app/globals.css. */
const USAGES: Record<string, ColorUsage[]> = {
  [n('#030304')]: [{ file: 'app/globals.css', token: '--color-soft-black-990', context: '@theme' }],
  [n('#050607')]: [{ file: 'app/globals.css', token: '--color-soft-black-975', context: '@theme' }],
  [n('#0a0b0d')]: [
    { file: 'app/globals.css', token: '--color-soft-black-950', context: '@theme' },
    { file: 'app/globals.css', token: '--primary-foreground', context: '.dark' },
    { file: 'app/globals.css', token: '--accent-foreground', context: '.dark' },
    { file: 'app/globals.css', token: '--sidebar-primary-foreground', context: '.dark' },
  ],
  [n('#0f1012')]: [{ file: 'app/globals.css', token: '--color-soft-black-900', context: '@theme' }],
  [n('#151619')]: [
    { file: 'app/globals.css', token: '--color-soft-black-800', context: '@theme' },
    { file: 'app/globals.css', token: '--secondary-hover', context: '.dark' },
    { file: 'app/globals.css', token: '--sidebar-accent', context: '.dark' },
  ],
  [n('#1a1b1f')]: [
    { file: 'app/globals.css', token: '--color-soft-black-700', context: '@theme' },
    { file: 'app/globals.css', token: '--primary-hover', context: ':root' },
    { file: 'app/globals.css', token: '--primary-hover', context: '.theme-preview-light' },
  ],
  [n('#1F2024')]: [
    { file: 'app/globals.css', token: '--color-soft-black-600', context: '@theme' },
    { file: 'app/globals.css', token: '--foreground', context: ':root' },
    { file: 'app/globals.css', token: '--primary', context: ':root' },
    { file: 'app/globals.css', token: '--sidebar-primary', context: ':root' },
    { file: 'app/globals.css', token: '--foreground', context: '.theme-preview-light' },
    { file: 'app/globals.css', token: '--primary', context: '.theme-preview-light' },
  ],
  [n('#25262b')]: [{ file: 'app/globals.css', token: '--color-soft-black-500', context: '@theme' }],
  [n('#2c2d32')]: [{ file: 'app/globals.css', token: '--color-soft-black-400', context: '@theme' }],
  [n('#42525E')]: [
    { file: 'app/globals.css', token: '--color-slate-blue', context: '@theme' },
    { file: 'app/globals.css', token: '--chart-2', context: ':root' },
    { file: 'app/globals.css', token: '--chart-2', context: '.dark' },
  ],
  [n('#E7ECEE')]: [
    { file: 'app/globals.css', token: '--background', context: ':root' },
    { file: 'app/globals.css', token: '--primary-foreground', context: ':root' },
    { file: 'app/globals.css', token: '--sidebar-primary-foreground', context: ':root' },
    { file: 'app/globals.css', token: '--foreground', context: '.dark' },
    { file: 'app/globals.css', token: '--background', context: '.theme-preview-light' },
  ],
  [n('#9CB4B4')]: [
    { file: 'app/globals.css', token: '--color-storm-blue-600', context: '@theme' },
    { file: 'app/globals.css', token: '--secondary-hover', context: ':root' },
    { file: 'app/globals.css', token: '--secondary-hover', context: '.theme-preview-light' },
  ],
  [n('#BEDBDC')]: [
    { file: 'app/globals.css', token: '--secondary', context: ':root' },
    { file: 'app/globals.css', token: '--muted', context: ':root' },
    { file: 'app/globals.css', token: '--chart-3', context: ':root' },
    { file: 'app/globals.css', token: '--sidebar-accent', context: ':root' },
    { file: 'app/globals.css', token: '--secondary', context: '.theme-preview-light' },
    { file: 'app/globals.css', token: '--muted', context: '.theme-preview-light' },
    { file: 'app/globals.css', token: '--chart-3', context: '.dark' },
    { file: 'app/globals.css', token: '--secondary', context: '.theme-preview-dark' },
    { file: 'app/globals.css', token: '--muted', context: '.theme-preview-dark' },
  ],
  [n('#E3ED85')]: [
    { file: 'app/globals.css', token: '--color-find-gold-400', context: '@theme' },
    { file: 'app/globals.css', token: '--accent-hover', context: ':root' },
    { file: 'app/globals.css', token: '--accent-hover', context: '.dark' },
    { file: 'app/globals.css', token: '--accent-hover', context: '.theme-preview-light' },
    { file: 'app/globals.css', token: '--accent-hover', context: '.theme-preview-dark' },
  ],
  [n('#AAB825')]: [
    { file: 'app/globals.css', token: '--color-find-gold-600', context: '@theme' },
    { file: 'app/globals.css', token: '--primary-hover', context: '.dark' },
    { file: 'app/globals.css', token: '--primary-hover', context: '.theme-preview-dark' },
  ],
  [n('#CFE02D')]: [
    { file: 'app/globals.css', token: '--accent', context: ':root' },
    { file: 'app/globals.css', token: '--chart-4', context: ':root' },
    { file: 'app/globals.css', token: '--primary', context: '.dark' },
    { file: 'app/globals.css', token: '--accent', context: '.dark' },
    { file: 'app/globals.css', token: '--chart-4', context: '.dark' },
    { file: 'app/globals.css', token: '--sidebar-primary', context: '.dark' },
    { file: 'app/globals.css', token: '--accent', context: '.theme-preview-light' },
    { file: 'app/globals.css', token: '--primary', context: '.theme-preview-dark' },
    { file: 'app/globals.css', token: '--accent', context: '.theme-preview-dark' },
  ],
  [n('#2BACC1')]: [
    { file: 'app/globals.css', token: '--ring', context: ':root' },
    { file: 'app/globals.css', token: '--chart-1', context: ':root' },
    { file: 'app/globals.css', token: '--sidebar-ring', context: ':root' },
    { file: 'app/globals.css', token: '--ring', context: '.dark' },
    { file: 'app/globals.css', token: '--chart-1', context: '.dark' },
    { file: 'app/globals.css', token: '--sidebar-ring', context: '.dark' },
    { file: 'app/globals.css', token: '--ring', context: '.theme-preview-light' },
    { file: 'app/globals.css', token: '--ring', context: '.theme-preview-dark' },
  ],
  [n('#238a9c')]: [
    { file: 'app/globals.css', token: '--chart-5', context: ':root' },
    { file: 'app/globals.css', token: '--chart-5', context: '.dark' },
  ],
  [n('#DC2626')]: [
    { file: 'app/globals.css', token: '--palette-destructive-500', context: ':root' },
    { file: 'app/globals.css', token: '--destructive', context: ':root' },
    { file: 'app/globals.css', token: '--destructive', context: '.theme-preview-light' },
  ],
  [n('#B41F1F')]: [
    { file: 'app/globals.css', token: '--palette-destructive-600', context: ':root' },
    { file: 'app/globals.css', token: '--destructive', context: '.dark' },
    { file: 'app/globals.css', token: '--destructive-hover', context: ':root' },
    { file: 'app/globals.css', token: '--destructive-hover', context: '.dark' },
    { file: 'app/globals.css', token: '--destructive', context: '.theme-preview-dark' },
    { file: 'app/globals.css', token: '--destructive-hover', context: '.theme-preview-dark' },
  ],
  [n('#FEFEFE')]: [
    { file: 'app/globals.css', token: '--palette-ghost-white-50', context: ':root' },
    { file: 'app/globals.css', token: '--card', context: ':root' },
    { file: 'app/globals.css', token: '--popover', context: ':root' },
    { file: 'app/globals.css', token: '--sidebar', context: ':root' },
    { file: 'app/globals.css', token: '--card', context: '.theme-preview-light' },
    { file: 'app/globals.css', token: '--popover', context: '.theme-preview-light' },
  ],
};

export function getColorUsages(hex: string): ColorUsage[] {
  const key = n(hex);
  return USAGES[key] ?? [];
}

/** Palette token name for a brand colour shade (e.g. --palette-ghost-white-500). Every colour in the app has one. */
export function getPaletteTokenName(brandSlug: string, shade: number): string {
  return `--palette-${brandSlug}-${shade}`;
}

/** Display name → slug for palette tokens */
export const BRAND_SLUGS: Record<string, string> = {
  'Find.co Gold': 'find-gold',
  'Soft Black': 'soft-black',
  'Slate Blue': 'slate-blue',
  'Sky Blue': 'sky-blue',
  'Storm Blue': 'storm-blue',
  'Ghost White': 'ghost-white',
  'Destructive': 'destructive',
};

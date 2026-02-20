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

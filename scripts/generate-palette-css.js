/**
 * Generates the full palette CSS from the grid definition (7 families × 11 shades + black, white, gold).
 * Run: node scripts/generate-palette-css.js
 * Output is the :root palette block to paste into app/globals.css (or we could overwrite).
 */

const TAILWIND_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
const LIGHT_WEIGHTS = { 50: 0.96, 100: 0.9, 200: 0.78, 300: 0.62, 400: 0.42 };
const DARK_WEIGHTS = { 600: 0.18, 700: 0.35, 800: 0.52, 900: 0.68, 950: 0.82 };

function parseHex(hex) {
  const s = hex.replace(/^#/, '');
  if (s.length === 6) {
    return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
  }
  throw new Error('Invalid hex: ' + hex);
}

function toHex(r, g, b) {
  return [r, g, b]
    .map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

function blend(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function generateShades(baseHex) {
  const base = parseHex(baseHex);
  const white = [255, 255, 255];
  const black = [0, 0, 0];
  const result = {};
  for (const shade of TAILWIND_SHADES) {
    if (shade === 500) {
      result[500] = baseHex.replace(/^#/, '').toUpperCase();
      continue;
    }
    if (shade < 500) {
      const t = LIGHT_WEIGHTS[shade];
      const rgb = blend(base, white, t);
      result[shade] = toHex(rgb[0], rgb[1], rgb[2]);
    } else {
      const t = DARK_WEIGHTS[shade];
      const rgb = blend(base, black, t);
      result[shade] = toHex(rgb[0], rgb[1], rgb[2]);
    }
  }
  return result;
}

const FAMILIES = [
  { slug: 'find-gold', base: '#CFE02D' },
  { slug: 'soft-black', base: '#1F2024' },
  { slug: 'slate-blue', base: '#42525E' },
  { slug: 'sky-blue', base: '#2BACC1' },
  { slug: 'storm-blue', base: '#BEDBDC' },
  { slug: 'ghost-white', base: '#E7ECEE' },
  { slug: 'destructive', base: '#DC2626' },
];

const lines = [
  '/* Palette: grid source of truth – 7 families × 11 shades (50–950) + black, white, gold */',
  ':root {',
];

for (const { slug, base } of FAMILIES) {
  const shades = generateShades(base);
  for (const shade of TAILWIND_SHADES) {
    const hex = '#' + shades[shade];
    lines.push(`  --palette-${slug}-${shade}: ${hex};`);
  }
}

lines.push('  /* Image creation (YouTube thumbnail) – approved */');
lines.push('  --palette-black: #000000;');
lines.push('  --palette-white: #FFFFFF;');
lines.push('  --palette-gold: #FFD700;');
lines.push('}');

console.log(lines.join('\n'));

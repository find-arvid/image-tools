/**
 * Generate Tailwind-style shade scales (50–950) from a base hex.
 * Base colour is used as 500; lighter shades blend with white, darker with black.
 */

const TAILWIND_SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;

/** Blend weights for lighter shades (50–400): how much white to mix in */
const LIGHT_WEIGHTS: Record<number, number> = {
  50: 0.96,
  100: 0.9,
  200: 0.78,
  300: 0.62,
  400: 0.42,
};

/** Blend weights for darker shades (600–950): how much black to mix in */
const DARK_WEIGHTS: Record<number, number> = {
  600: 0.18,
  700: 0.35,
  800: 0.52,
  900: 0.68,
  950: 0.82,
};

function parseHex(hex: string): [number, number, number] {
  const s = hex.replace(/^#/, '');
  if (s.length === 6) {
    return [
      parseInt(s.slice(0, 2), 16),
      parseInt(s.slice(2, 4), 16),
      parseInt(s.slice(4, 6), 16),
    ];
  }
  if (s.length === 3) {
    return [
      parseInt(s[0] + s[0], 16),
      parseInt(s[1] + s[1], 16),
      parseInt(s[2] + s[2], 16),
    ];
  }
  throw new Error(`Invalid hex: ${hex}`);
}

function toHex(r: number, g: number, b: number): string {
  return [r, g, b]
    .map((x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

/** Linear blend of two RGB colours. t in [0,1]: 0 = a, 1 = b */
function blend(
  a: [number, number, number],
  b: [number, number, number],
  t: number
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

/** Relative luminance (0–1). Used to pick light vs dark text on a swatch */
export function luminance(hex: string): number {
  const [r, g, b] = parseHex(hex).map((x) => x / 255);
  const fn = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * fn(r) + 0.7152 * fn(g) + 0.0722 * fn(b);
}

export type ShadeScale = Record<(typeof TAILWIND_SHADES)[number], string>;

export function generateShades(baseHex: string): ShadeScale {
  const base = parseHex(baseHex);
  const white: [number, number, number] = [255, 255, 255];
  const black: [number, number, number] = [0, 0, 0];

  const result: Partial<ShadeScale> = {};

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

  return result as ShadeScale;
}

export const TAILWIND_SHADE_KEYS = TAILWIND_SHADES;

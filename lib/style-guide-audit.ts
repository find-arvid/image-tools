/**
 * Style guide audit: parses app/globals.css to build palette, semantic tokens,
 * and usage-by-hex so the style guide reflects the current state of the site.
 * Scans the codebase for colours not in the palette and reports them.
 * Run on the server when the style guide page loads.
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

export type ColorUsage = {
  token: string;
  context: string;
  file: string;
};

/** Where a colour is consumed in the codebase (Tailwind class in a component). */
export type ComponentColorUsage = {
  file: string;
  line: number;
  token: string;
};

export type UnauthorisedColour = {
  value: string;
  hex: string;
  file: string;
  line: number;
};

/** One occurrence of a typography token or raw class */
export type TypographyOccurrence = { file: string; line: number };

export type TypographyAudit = {
  /** Token (e.g. --text-heading-1) → list of occurrences in codebase */
  byToken: Record<string, TypographyOccurrence[]>;
  /** Raw Tailwind class (e.g. text-3xl) used instead of token → occurrences */
  byRawClass: Record<string, TypographyOccurrence[]>;
  /** List of known typography tokens from globals */
  tokens: string[];
};

export type ButtonVariantSummary = {
  variant: string;
  count: number;
};

export type ButtonAudit = {
  /** Count per variant (default, cta, outline, ghost, link, destructive) */
  byVariant: ButtonVariantSummary[];
  /** Total Button usages */
  total: number;
};

export type StyleGuideAudit = {
  /** Canonical hex (uppercase with #) → list of tokens that use it */
  usageByHex: Record<string, ColorUsage[]>;
  /** Canonical hex → list of component/file locations where this colour is used (Tailwind classes) */
  componentUsageByHex: Record<string, ComponentColorUsage[]>;
  /** Palette token → hex (e.g. --palette-soft-black-700 → #1A1B1F) */
  palette: Record<string, string>;
  /** Semantic token → resolved hex or null (e.g. --primary → #1F2024) per context */
  semanticByContext: { context: string; tokens: Record<string, string | null> }[];
  /** Colours found in the codebase that are not in the palette */
  unauthorised: UnauthorisedColour[];
  /** Typography token and raw-class usage */
  typography: TypographyAudit;
  /** Button variant usage summary */
  buttons: ButtonAudit;
};

const DECL_RE = /--([a-zA-Z0-9-]+)\s*:\s*([^;]+);/g;
const BLOCK_RE = /([^{]+)\{([^}]+)\}/g;

function normalizeHex(hex: string): string {
  let h = hex.replace(/^#/, '').trim().toUpperCase();
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return h.length === 6 ? `#${h}` : hex;
}

/** Tailwind utility name from a CSS token (e.g. --color-find-gold-600 → find-gold-600, --accent-hover → accent-hover). */
function tokenToSlug(token: string): string {
  const withoutLeading = token.startsWith('--') ? token.slice(2) : token;
  return withoutLeading.startsWith('color-') ? withoutLeading.slice(7) : withoutLeading;
}

/** Escape for use in RegExp. */
function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Find lines where slug appears in a Tailwind-class-like context (e.g. bg-find-gold-600, text-accent). */
function findComponentUsages(
  slug: string,
  allFiles: { rel: string; content: string }[]
): Array<{ file: string; line: number }> {
  const escaped = escapeRegex(slug);
  const re = new RegExp(
    `(?:^|[\\s"'.\`]|[\\-/])${escaped}(?:/[\\d.]+)?(?=[\\s"'.\`)]|$)`,
    'gm'
  );
  const results: Array<{ file: string; line: number }> = [];
  const seen = new Set<string>();
  for (const { rel, content } of allFiles) {
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      re.lastIndex = 0;
      if (re.test(lines[i])) {
        const key = `${rel}:${i + 1}`;
        if (!seen.has(key)) {
          seen.add(key);
          results.push({ file: rel, line: i + 1 });
        }
      }
    }
  }
  return results;
}

function extractDeclarations(blockBody: string): Map<string, string> {
  const map = new Map<string, string>();
  let m: RegExpExecArray | null;
  DECL_RE.lastIndex = 0;
  while ((m = DECL_RE.exec(blockBody)) !== null) {
    map.set(`--${m[1]}`, m[2].trim());
  }
  return map;
}

function resolveToHex(
  value: string,
  palette: Record<string, string>,
  blockResolved: Map<string, string>
): string | null {
  const varMatch = value.match(/var\(\s*(--[a-zA-Z0-9-]+)\s*\)/);
  if (!varMatch) {
    const hexMatch = value.match(/#([0-9A-Fa-f]{3,8})/);
    return hexMatch ? normalizeHex(value) : null;
  }
  const ref = varMatch[1];
  if (palette[ref]) return palette[ref];
  const fromBlock = blockResolved.get(ref);
  return fromBlock ?? null;
}

/** Recursively collect paths of files matching ext in dir (relative to root). */
function collectFiles(root: string, dir: string, exts: string[]): string[] {
  const results: string[] = [];
  const skip = new Set(['node_modules', '.next', '.git', 'dist']);
  try {
    const entries = readdirSync(join(root, dir), { withFileTypes: true });
    for (const e of entries) {
      const rel = dir ? `${dir}/${e.name}` : e.name;
      if (e.isDirectory()) {
        if (!skip.has(e.name)) results.push(...collectFiles(root, rel, exts));
      } else if (exts.some((ext) => e.name.endsWith(ext))) {
        results.push(rel);
      }
    }
  } catch {
    // ignore permission errors etc.
  }
  return results;
}

const HEX_RE = /#([0-9A-Fa-f]{3})\b|#([0-9A-Fa-f]{6})\b|#([0-9A-Fa-f]{8})\b/g;
const RGBA_RE = /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*[\d.]+\s*)?\)/g;

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.max(0, Math.min(255, x)).toString(16).padStart(2, '0')).join('').toUpperCase();
}

function findUnauthorisedInContent(
  content: string,
  file: string,
  authorisedHexes: Set<string>
): UnauthorisedColour[] {
  const out: UnauthorisedColour[] = [];
  const lines = content.split(/\r?\n/);

  const checkHex = (raw: string, lineIndex: number) => {
    const hex = normalizeHex(raw);
    const hex6 = hex.slice(0, 7); // #RRGGBB
    if (!authorisedHexes.has(hex6)) out.push({ value: raw, hex: hex6, file, line: lineIndex + 1 });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    let m: RegExpExecArray | null;
    HEX_RE.lastIndex = 0;
    while ((m = HEX_RE.exec(line)) !== null) {
      const raw = '#' + (m[1] ?? m[2] ?? m[3] ?? '');
      checkHex(raw, i);
    }
    RGBA_RE.lastIndex = 0;
    while ((m = RGBA_RE.exec(line)) !== null) {
      const r = parseInt(m[1], 10);
      const g = parseInt(m[2], 10);
      const b = parseInt(m[3], 10);
      const hex = rgbToHex(r, g, b);
      if (!authorisedHexes.has(hex)) {
        out.push({ value: `rgba(${r}, ${g}, ${b}, …)`, hex, file, line: i + 1 });
      }
    }
  }
  return out;
}

/**
 * Run the audit by reading app/globals.css and parsing palette + semantic tokens.
 * Call from a Server Component or API route.
 */
export function runStyleGuideAudit(cssContent?: string): StyleGuideAudit {
  const root = process.cwd();
  const css =
    cssContent ?? readFileSync(join(root, 'app', 'globals.css'), 'utf-8');

  const AUDIT_FILE = 'app/globals.css';
  const palette: Record<string, string> = {};
  const usageByHex: Record<string, ColorUsage[]> = {};
  const semanticByContext: { context: string; tokens: Record<string, string | null> }[] = [];

  const blocks: { selector: string; body: string }[] = [];
  let blockMatch: RegExpExecArray | null;
  BLOCK_RE.lastIndex = 0;
  while ((blockMatch = BLOCK_RE.exec(css)) !== null) {
    const selector = blockMatch[1].trim();
    const body = blockMatch[2];
    blocks.push({ selector, body });
  }

  // First: collect palette from the first block that defines --palette-*
  for (const { selector, body } of blocks) {
    const decls = extractDeclarations(body);
    let hasPalette = false;
    for (const [token, value] of decls) {
      if (token.startsWith('--palette-')) {
        const hex = value.match(/#([0-9A-Fa-f]{3,8})/)?.[0];
        if (hex) {
          palette[token] = normalizeHex(hex);
          hasPalette = true;
        }
      }
    }
    if (hasPalette) break;
  }
  // Do not add palette definitions as "usage" – only semantic and @theme refs count.
  // This keeps the style guide grid from showing every colour as "used" just because it's in the palette.

  // Semantic blocks (in order): :root then .dark then theme-preview-*
  const semanticSelectors = [':root', '.dark', '.theme-preview-light', '.theme-preview-dark'];
  for (const { selector, body } of blocks) {
    const context = selector.split(',')[0].trim();
    const isSemantic = semanticSelectors.some(
      (s) => context === s || (s.startsWith('.') && context.includes(s.slice(1)))
    );
    if (!isSemantic) continue;
    const decls = extractDeclarations(body);
    // Skip palette-only block (first :root has only --palette-*)
    const hasNonPalette = Array.from(decls.keys()).some((k) => !k.startsWith('--palette-'));
    if (!hasNonPalette) continue;
    const blockResolved = new Map<string, string>();
    const tokenOrder = Array.from(decls.keys());
    for (const token of tokenOrder) {
      const raw = decls.get(token)!;
      const hex = resolveToHex(raw, palette, blockResolved);
      if (hex) blockResolved.set(token, hex);
    }
    const tokensRecord: Record<string, string | null> = {};
    for (const token of tokenOrder) {
      const hex = blockResolved.get(token) ?? null;
      tokensRecord[token] = hex;
      if (hex && !token.startsWith('--palette-')) {
        const normalized = normalizeHex(hex);
        if (!usageByHex[normalized]) usageByHex[normalized] = [];
        usageByHex[normalized].push({ token, context, file: AUDIT_FILE });
      }
    }
    semanticByContext.push({ context, tokens: tokensRecord });
  }

  // @theme inline: --color-* that point directly to --palette-* get usage entries
  for (const { selector, body } of blocks) {
    if (!selector.includes('theme')) continue;
    const decls = extractDeclarations(body);
    for (const [token, value] of decls) {
      if (!token.startsWith('--color-')) continue;
      const varMatch = value.match(/var\(\s*(--[a-zA-Z0-9-]+)\s*\)/);
      if (!varMatch) continue;
      const ref = varMatch[1];
      const hex = palette[ref] ?? null;
      if (hex) {
        const normalized = normalizeHex(hex);
        if (!usageByHex[normalized]) usageByHex[normalized] = [];
        usageByHex[normalized].push({ token, context: '@theme', file: AUDIT_FILE });
      }
    }
  }

  // Scan codebase for colours not in the palette (exclude style-guide so grid swatches aren't flagged)
  const authorisedHexes = new Set(Object.values(palette).map(normalizeHex));
  const unauthorised: UnauthorisedColour[] = [];
  const scanDirs = ['app', 'components', 'lib'];
  const exts = ['.tsx', '.ts', '.css'];
  const allFiles: { rel: string; content: string }[] = [];
  for (const dir of scanDirs) {
    const files = collectFiles(root, dir, exts);
    for (const rel of files) {
      if (rel.includes('style-guide')) continue;
      try {
        const content = readFileSync(join(root, rel), 'utf-8');
        allFiles.push({ rel, content });
        unauthorised.push(...findUnauthorisedInContent(content, rel, authorisedHexes));
      } catch {
        // ignore
      }
    }
  }

  // Typography audit: tokens from globals + scan for token usage and raw classes
  const typography = runTypographyAudit(css, allFiles);
  const buttons = runButtonAudit(allFiles);

  // Component-level usage: for each hex, find files/lines where its tokens are used as Tailwind classes
  const componentUsageByHex: Record<string, ComponentColorUsage[]> = {};
  for (const [hex, usages] of Object.entries(usageByHex)) {
    const seen = new Set<string>();
    const list: ComponentColorUsage[] = [];
    for (const u of usages) {
      const slug = tokenToSlug(u.token);
      const locations = findComponentUsages(slug, allFiles);
      for (const { file, line } of locations) {
        const key = `${file}:${line}`;
        if (!seen.has(key)) {
          seen.add(key);
          list.push({ file, line, token: u.token });
        }
      }
    }
    list.sort((a, b) => a.file.localeCompare(b.file) || a.line - b.line);
    componentUsageByHex[hex] = list;
  }

  return {
    usageByHex,
    componentUsageByHex,
    palette,
    semanticByContext,
    unauthorised,
    typography,
    buttons,
  };
}

const TYPOGRAPHY_TOKENS = [
  '--text-heading-1',
  '--text-heading-2',
  '--text-heading-3',
  '--text-body',
  '--text-small',
  '--text-caption',
];
const TYPOGRAPHY_UTILITY_CLASSES = [
  'text-heading-1',
  'text-heading-2',
  'text-heading-3',
  'text-body-token',
  'text-small-token',
  'text-caption-token',
];
const RAW_TYPE_CLASSES = ['text-3xl', 'text-2xl', 'text-xl', 'text-lg', 'text-base', 'text-sm', 'text-xs'];

function runTypographyAudit(
  cssContent: string,
  files: { rel: string; content: string }[]
): TypographyAudit {
  const byToken: Record<string, TypographyOccurrence[]> = {};
  const byRawClass: Record<string, TypographyOccurrence[]> = {};
  for (const t of TYPOGRAPHY_TOKENS) byToken[t] = [];
  for (const c of RAW_TYPE_CLASSES) byRawClass[c] = [];

  // Token usage: var(--text-*) or utility class names (escape - for regex)
  const tokenVarRe = new RegExp(`var\\(\\s*(${TYPOGRAPHY_TOKENS.map((x) => x.replace(/-/g, '\\-')).join('|')})\\s*\\)`, 'g');
  const tokenClassRe = new RegExp(`\\b(${TYPOGRAPHY_UTILITY_CLASSES.join('|').replace(/-/g, '\\-')})\\b`, 'g');
  const rawClassRe = new RegExp(`\\b(${RAW_TYPE_CLASSES.join('|').replace(/-/g, '\\-')})\\b`, 'g');

  for (const { rel, content } of files) {
    const lines = content.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      let m: RegExpExecArray | null;
      tokenVarRe.lastIndex = 0;
      while ((m = tokenVarRe.exec(line)) !== null) {
        const token = m[1];
        if (byToken[token]) byToken[token].push({ file: rel, line: i + 1 });
      }
      tokenClassRe.lastIndex = 0;
      while ((m = tokenClassRe.exec(line)) !== null) {
        const cls = m[1];
        const token = cls === 'text-body-token' ? '--text-body' : cls === 'text-small-token' ? '--text-small' : `--${cls}`;
        if (byToken[token]) byToken[token].push({ file: rel, line: i + 1 });
      }
      rawClassRe.lastIndex = 0;
      while ((m = rawClassRe.exec(line)) !== null) {
        const cls = m[1];
        if (byRawClass[cls]) byRawClass[cls].push({ file: rel, line: i + 1 });
      }
    }
  }

  return { byToken, byRawClass, tokens: TYPOGRAPHY_TOKENS };
}

const BUTTON_VARIANTS = ['default', 'cta', 'destructive', 'outline', 'ghost', 'link'];

function runButtonAudit(files: { rel: string; content: string }[]): ButtonAudit {
  const counts: Record<string, number> = {};
  for (const v of BUTTON_VARIANTS) counts[v] = 0;
  let total = 0;

  // Match <Button ... > and capture the tag; then check for variant="x" or variant={"x"}
  const buttonTagRe = /<Button\s[^>]*>|<Button>/g;
  const variantInTagRe = /variant\s*=\s*\{?\s*["'](\w+)["']\s*\}?/;

  for (const { content } of files) {
    const fullContent = content;
    let m: RegExpExecArray | null;
    buttonTagRe.lastIndex = 0;
    while ((m = buttonTagRe.exec(fullContent)) !== null) {
      const tag = m[0];
      total++;
      const variantMatch = tag.match(variantInTagRe);
      const variant = variantMatch && BUTTON_VARIANTS.includes(variantMatch[1]) ? variantMatch[1] : 'default';
      counts[variant] = (counts[variant] ?? 0) + 1;
    }
  }

  const byVariant: ButtonVariantSummary[] = BUTTON_VARIANTS.map((variant) => ({
    variant,
    count: counts[variant] ?? 0,
  })).filter((s) => s.count > 0);

  return { byVariant, total };
}

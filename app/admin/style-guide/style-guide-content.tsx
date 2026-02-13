'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dropzone,
  DropzoneContent,
  DropzoneEmptyState,
} from '@/components/ui/shadcn-io/dropzone';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxValue,
  useComboboxAnchor,
} from '@/components/ui/combobox';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '@/components/ui/input-group';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu';
import { Upload, Home, X, Info, Copy } from 'lucide-react';
import { generateShades, luminance, TAILWIND_SHADE_KEYS } from '@/lib/color-shades';
import { getPaletteTokenName, BRAND_SLUGS } from '@/lib/color-usage';
import type { StyleGuideAudit } from '@/lib/style-guide-audit';

function normalizeHex(hex: string): string {
  let h = hex.replace(/^#/, '').trim().toUpperCase();
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return h.length === 6 ? `#${h}` : hex;
}

function getColorUsagesFromAudit(hex: string, audit: StyleGuideAudit) {
  const key = normalizeHex(hex.startsWith('#') ? hex : `#${hex}`);
  return audit.usageByHex[key] ?? [];
}

export function StyleGuideContent({ audit }: { audit: StyleGuideAudit }) {
  const getColorUsages = (hex: string) => getColorUsagesFromAudit(hex, audit);
  const [colorDialogOpen, setColorDialogOpen] = useState(false);
  const [selectedColorHex, setSelectedColorHex] = useState<string | null>(null);
  const [selectedColorToken, setSelectedColorToken] = useState<string | null>(null);
  const [dialogCopied, setDialogCopied] = useState<'hex' | 'token' | null>(null);
  const [copiedSwatchKey, setCopiedSwatchKey] = useState<string | null>(null);
  const [copiedLandedKey, setCopiedLandedKey] = useState<string | null>(null);
  const copyTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const FLIP_MS = 500;
  const COPIED_DISPLAY_MS = 1500;

  const copyHex = (hex: string, swatchKey: string) => {
    const fullHex = hex.startsWith('#') ? hex : `#${hex}`;
    navigator.clipboard.writeText(fullHex);
    copyTimeoutsRef.current.forEach(clearTimeout);
    copyTimeoutsRef.current = [];
    setCopiedSwatchKey(swatchKey);
    copyTimeoutsRef.current.push(
      setTimeout(() => {
        setCopiedSwatchKey(null);
        setCopiedLandedKey(swatchKey);
      }, FLIP_MS)
    );
    copyTimeoutsRef.current.push(
      setTimeout(() => setCopiedLandedKey(null), FLIP_MS + COPIED_DISPLAY_MS)
    );
  };

  const openColorDialog = (e: React.MouseEvent, hex: string, token: string) => {
    e.stopPropagation();
    setSelectedColorHex(hex.startsWith('#') ? hex : `#${hex}`);
    setSelectedColorToken(token);
    setDialogCopied(null);
    setColorDialogOpen(true);
  };

  const copyFromDialog = (value: string, kind: 'hex' | 'token') => {
    navigator.clipboard.writeText(value);
    setDialogCopied(kind);
    setTimeout(() => setDialogCopied(null), 2000);
  };

  const usages = selectedColorHex ? getColorUsages(selectedColorHex) : [];
  const usageCount = usages.length;

  useEffect(() => {
    if (!colorDialogOpen) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setColorDialogOpen(false);
    };
    window.addEventListener('keydown', onEscape);
    return () => window.removeEventListener('keydown', onEscape);
  }, [colorDialogOpen]);

  return (
    <main className="min-h-screen w-full max-w-5xl mx-auto px-4 py-10 space-y-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Style Guide & Design System</h1>
        <p className="text-muted-foreground max-w-2xl">
          Documentation of styles and components used across this app. Use this page to reference
          tokens, try components, and experiment with UI.
        </p>
      </header>

      {/* Colors */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
          Colors
        </h2>

        {/* Unauthorised colours report (from audit) */}
        {audit.unauthorised.length > 0 && (
          <Alert variant="destructive" className="rounded-lg">
            <AlertTitle>Unauthorised colours ({audit.unauthorised.length})</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
                <p className="text-sm">
                  The following colours were found in the codebase but are not in the palette (app/globals.css).
                  Replace them with a palette token or add the shade to the palette.
                </p>
                <ul className="list-inside list-disc space-y-1 text-sm font-mono">
                  {audit.unauthorised.map((u, i) => (
                    <li key={i}>
                      <span className="text-foreground">{u.value}</span>
                      {' → '}
                      <span className="text-destructive">{u.hex}</span>
                      {' in '}
                      <span className="text-muted-foreground">{u.file}</span>
                      {u.line != null && <span className="text-muted-foreground"> line {u.line}</span>}
                    </li>
                  ))}
                </ul>
            </AlertDescription>
          </Alert>
        )}

        {/* Brand colour shades – Tailwind-style scale per brand colour */}
        <div className="pt-6 w-full">
          <h3 className="text-sm font-semibold text-foreground mb-2">Brand colour shades (Tailwind scale)</h3>
          <div className="grid grid-cols-11 gap-1 w-full">
            {[
              { name: 'Find.co Gold', base: '#CFE02D' },
              { name: 'Soft Black', base: '#1F2024' },
              { name: 'Slate Blue', base: '#42525E' },
              { name: 'Sky Blue', base: '#2BACC1' },
              { name: 'Storm Blue', base: '#BEDBDC' },
              { name: 'Ghost White', base: '#E7ECEE' },
              { name: 'Destructive', base: '#DC2626' },
            ].flatMap(({ name, base }) => {
              const shades = generateShades(base);
              const slug = BRAND_SLUGS[name] ?? name.toLowerCase().replace(/\s+/g, '-');
              return TAILWIND_SHADE_KEYS.map((shade) => {
                const hex = shades[shade];
                const bg = `#${hex}`;
                const isLight = luminance(bg) > 0.45;
                const textColor = isLight ? '#1F2024' : '#E7ECEE';
                const isBase = shade === 500;
                const token = getPaletteTokenName(slug, shade);
                const swatchUsages = getColorUsages(bg);
                const hasUsage = swatchUsages.length > 0;
                const swatchKey = `${name}-${shade}`;
                const isFlipping = copiedSwatchKey === swatchKey;
                const isLanded = copiedLandedKey === swatchKey;
                return (
                  <div key={swatchKey} className="min-h-[4.5rem]">
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => copyHex(bg, swatchKey)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyHex(bg, swatchKey); } }}
                      title={`Copy ${bg}`}
                      className={`flex flex-col items-center justify-center rounded-lg min-h-[4.5rem] relative cursor-pointer transition-opacity hover:opacity-90 active:opacity-95 ${isFlipping ? 'animate__animated animate__flip animate__faster' : ''}`}
                      style={{ backgroundColor: bg }}
                    >
                        {isLanded ? (
                          <span className="text-[11px] font-semibold leading-tight" style={{ color: textColor }}>
                            Copied
                          </span>
                        ) : (
                        <>
                          {hasUsage && (
                            <span
                              className="absolute top-1.5 left-1.5 min-w-[14px] h-4 px-1 rounded flex items-center justify-center bg-soft-black-990/40 text-[9px] font-medium text-inverse-foreground"
                              aria-hidden
                            >
                              {swatchUsages.length}
                            </span>
                          )}
                          {hasUsage && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute top-1.5 right-1.5 h-4 w-4 min-w-0 rounded flex items-center justify-center opacity-70 hover:opacity-100 bg-transparent hover:bg-soft-black-990/20 border-0"
                              style={{ color: textColor }}
                              aria-label="Colour info"
                              onClick={(e) => openColorDialog(e, bg, token)}
                            >
                              <Info className="h-3 w-3" />
                            </Button>
                          )}
                          <span className="text-[11px] font-semibold leading-tight" style={{ color: textColor }}>
                            {shade}
                          </span>
                          <span className="text-[9px] font-mono leading-tight" style={{ color: textColor }}>
                            {hex}
                          </span>
                          {isBase && (
                            <span
                              className="absolute bottom-1.5 left-1.5 right-1.5 text-[11px] font-medium leading-tight"
                              style={{ color: textColor }}
                            >
                              {name}
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              });
            })}
          </div>
        </div>

        {/* Authorised colours for image creation (e.g. YouTube thumbnail) – same card format as grid */}
        <div className="pt-8 space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Image creation colours</h3>
          <p className="text-xs text-muted-foreground">
            Authorised palette colours used when generating images (e.g. canvas text and effects). Tokens: <span className="font-mono text-foreground">--palette-black</span>, <span className="font-mono text-foreground">--palette-white</span>, <span className="font-mono text-foreground">--palette-gold</span>.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 w-full max-w-[32rem]">
            {[
              { name: 'Black', hex: '#000000', token: '--palette-black', page: 'YouTube thumbnail' },
              { name: 'White', hex: '#FFFFFF', token: '--palette-white', page: 'YouTube thumbnail' },
              { name: 'Gold', hex: '#FFD700', token: '--palette-gold', page: 'YouTube thumbnail' },
            ].map(({ name, hex, token, page }) => {
              const bg = hex;
              const isLight = luminance(bg) > 0.45;
              const textColor = isLight ? '#1F2024' : '#E7ECEE';
              const swatchUsages = getColorUsages(bg);
              const hasUsage = swatchUsages.length > 0;
              const swatchKey = `image-${name.toLowerCase()}`;
              const isFlipping = copiedSwatchKey === swatchKey;
              const isLanded = copiedLandedKey === swatchKey;
              return (
                <div key={hex} className="min-h-[4.5rem]">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => copyHex(bg, swatchKey)}
                    onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copyHex(bg, swatchKey); } }}
                    title={`Copy ${bg}`}
                    className={`flex flex-col items-center justify-center rounded-lg min-h-[4.5rem] relative cursor-pointer transition-opacity hover:opacity-90 active:opacity-95 ${isFlipping ? 'animate__animated animate__flip animate__faster' : ''}`}
                    style={{ backgroundColor: bg }}
                  >
                    {isLanded ? (
                      <span className="text-[11px] font-semibold leading-tight" style={{ color: textColor }}>
                        Copied
                      </span>
                    ) : (
                      <>
                        {hasUsage && (
                          <span
                            className="absolute top-1.5 left-1.5 min-w-[14px] h-4 px-1 rounded flex items-center justify-center bg-soft-black-990/40 text-[9px] font-medium text-inverse-foreground"
                            aria-hidden
                          >
                            {swatchUsages.length}
                          </span>
                        )}
                        {hasUsage && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute top-1.5 right-1.5 h-4 w-4 min-w-0 rounded flex items-center justify-center opacity-70 hover:opacity-100 bg-transparent hover:bg-soft-black-990/20 border-0"
                            style={{ color: textColor }}
                            aria-label="Colour info"
                            onClick={(e) => openColorDialog(e, bg, token)}
                          >
                            <Info className="h-3 w-3" />
                          </Button>
                        )}
                        <span className="text-[11px] font-semibold leading-tight" style={{ color: textColor }}>
                          {name}
                        </span>
                        <span className="text-[9px] font-mono leading-tight" style={{ color: textColor }}>
                          {hex.replace(/^#/, '')}
                        </span>
                        <span
                          className="absolute bottom-1.5 left-1.5 right-1.5 text-[11px] font-medium leading-tight text-left truncate"
                          style={{ color: textColor }}
                          title={page}
                        >
                          {page}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Typography – table view + audit usage */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
          Typography
        </h2>
        <p className="text-xs text-muted-foreground">
          Font: Space Grotesk (<code className="text-foreground">--font-space-grotesk</code>). Text colour: <code className="text-foreground">var(--foreground)</code>; muted: <code className="text-foreground">text-muted-foreground</code>. Use tokens via <code className="text-foreground">font: var(--text-*)</code> or utility classes below.
        </p>
        {/* Typography audit: token vs raw usage */}
        {audit.typography && (
          <div className="rounded-lg border border-border bg-muted/30 p-3 text-xs">
            <p className="font-medium text-foreground mb-1.5">Usage (site-wide audit)</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-muted-foreground mb-0.5">Token / utility</p>
                <ul className="space-y-0.5 font-mono">
                  {audit.typography.tokens.map((token) => {
                    const occurrences = audit.typography.byToken[token] ?? [];
                    return (
                      <li key={token} className="flex items-center gap-2">
                        <span className="text-foreground">{token}</span>
                        <span className="text-muted-foreground">({occurrences.length})</span>
                      </li>
                    );
                  })}
                </ul>
              </div>
              <div>
                <p className="text-muted-foreground mb-0.5">Raw classes (prefer tokens)</p>
                <ul className="space-y-0.5 font-mono">
                  {Object.entries(audit.typography.byRawClass)
                    .filter(([, occ]) => occ.length > 0)
                    .sort((a, b) => b[1].length - a[1].length)
                    .map(([cls, occurrences]) => (
                      <li key={cls} className="flex items-center gap-2">
                        <span className="text-foreground">{cls}</span>
                        <span className="text-muted-foreground">({occurrences.length})</span>
                      </li>
                    ))}
                </ul>
                {Object.values(audit.typography.byRawClass).every((a) => a.length === 0) && (
                  <p className="text-muted-foreground italic">None found</p>
                )}
              </div>
            </div>
          </div>
        )}
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-[11px] font-semibold text-foreground">Style</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-foreground">Sample</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-foreground">Token</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-foreground">Class</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-foreground">Usage</th>
                <th className="px-3 py-2 text-[11px] font-semibold text-foreground">Page</th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: 'Heading 1', token: '--text-heading-1', tokenClass: 'text-heading-1', class: 'text-3xl font-bold', page: 'Page titles', muted: false, size: '--text-heading-1-size', weight: '--text-heading-1-weight', height: '--text-heading-1-height' },
                { label: 'Heading 2', token: '--text-heading-2', tokenClass: 'text-heading-2', class: 'text-xl font-semibold', page: 'Section headings', muted: false, size: '--text-heading-2-size', weight: '--text-heading-2-weight', height: '--text-heading-2-height' },
                { label: 'Heading 3', token: '--text-heading-3', tokenClass: 'text-heading-3', class: 'text-lg font-medium', page: 'Subsections', muted: false, size: '--text-heading-3-size', weight: '--text-heading-3-weight', height: '--text-heading-3-height' },
                { label: 'Body text', token: '--text-body', tokenClass: 'text-body-token', class: 'text-base', page: 'Body copy', muted: false, size: '--text-body-size', weight: '--text-body-weight', height: '--text-body-height' },
                { label: 'Small / muted', token: '--text-small', tokenClass: 'text-small-token text-muted-foreground', class: 'text-sm text-muted-foreground', page: 'Labels, captions', muted: true, size: '--text-small-size', weight: '--text-small-weight', height: '--text-small-height' },
              ].map(({ label, token, tokenClass, class: typeClass, page, muted, size, weight, height }) => (
                <tr key={label} className="border-b border-border last:border-b-0">
                  <td className="px-3 py-2 text-[11px] font-medium text-foreground">{label}</td>
                  <td className="px-3 py-2">
                    <span
                      className={muted ? 'text-muted-foreground' : 'text-foreground'}
                      style={{
                        fontSize: `var(${size})`,
                        fontWeight: `var(${weight})`,
                        lineHeight: `var(${height})`,
                        fontFamily: 'var(--font-family-sans)',
                      }}
                    >
                      {label}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-[9px] font-mono text-muted-foreground">{token}</td>
                  <td className="px-3 py-2 text-[9px] font-mono text-muted-foreground">{typeClass}</td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground">
                    {audit.typography ? (audit.typography.byToken[token] ?? []).length : 0}
                  </td>
                  <td className="px-3 py-2 text-[11px] text-muted-foreground">{page}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Radius & spacing */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
          Radius & spacing
        </h2>
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Where used:</strong> All rounded corners and spacing (cards, buttons, inputs, gaps).
        </p>
        <p className="text-sm text-muted-foreground">
          Base radius: <code className="text-foreground">--radius: 0.625rem</code>. Tailwind:
          radius-sm, radius-md, radius-lg, radius-xl. Use spacing scale (e.g. gap-2, p-4) for
          consistency.
        </p>
        <div className="flex flex-wrap gap-4">
          <div className="h-16 w-16 rounded-sm border-2 border-primary bg-card" title="rounded-sm" />
          <div className="h-16 w-16 rounded-md border-2 border-primary bg-card" title="rounded-md" />
          <div className="h-16 w-16 rounded-lg border-2 border-primary bg-card" title="rounded-lg" />
          <div className="h-16 w-16 rounded-xl border-2 border-primary bg-card" title="rounded-xl" />
        </div>
      </section>

      {/* Buttons – default slate blue (grey), CTA (green) used sparingly + audit summary */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Buttons
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            <strong className="text-foreground">Where used:</strong> Footer (theme, Admin tools, Submit feedback), Brand assets page, Admin (brand-assets, images), Home (tool cards), YouTube thumbnail, Webo news overlay, CCN image optimiser, Combobox, Input group.
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            <strong className="text-foreground">Default</strong> = Slate blue (grey); use for most actions. <strong className="text-foreground">CTA (Call to action)</strong> = Green (Find.co Gold); use at most one per section or page for the main action (e.g. Submit, Start). All variants shown in both themes.
          </p>
          {/* Button audit summary */}
          {audit.buttons && (
            <div className="mt-3 rounded-lg border border-border bg-muted/30 p-3 text-xs">
              <p className="font-medium text-foreground mb-1.5">Usage summary (site-wide)</p>
              <p className="text-muted-foreground">
                Total <strong className="text-foreground">{audit.buttons.total}</strong> Button
                {audit.buttons.total !== 1 ? 's' : ''}
                {audit.buttons.byVariant.length > 0 ? (
                  <> · {audit.buttons.byVariant.map((s) => `${s.variant}: ${s.count}`).join(', ')}</>
                ) : null}
              </p>
            </div>
          )}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Light mode */}
          <div className="theme-preview-light rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Light mode</h3>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Variants</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="default">Default</Button>
                  <Button variant="cta">CTA</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Sizes</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="default">Default</Button>
                  <Button size="sm">Small</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon" aria-label="Icon">↑</Button>
                  <Button size="icon-sm" aria-label="Icon sm">↑</Button>
                  <Button size="icon-lg" aria-label="Icon lg">↑</Button>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Outline + sizes</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="default">Default</Button>
                  <Button variant="outline" size="sm">Small</Button>
                  <Button variant="outline" size="lg">Large</Button>
                  <Button variant="outline" size="icon" aria-label="Icon">↑</Button>
                </div>
              </div>
            </div>
          </div>
          {/* Dark mode */}
          <div className="theme-preview-dark rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Dark mode</h3>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Variants</p>
                <div className="flex flex-wrap gap-2">
                  <Button variant="default">Default</Button>
                  <Button variant="cta">CTA</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Sizes</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="default">Default</Button>
                  <Button size="sm">Small</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon" aria-label="Icon">↑</Button>
                  <Button size="icon-sm" aria-label="Icon sm">↑</Button>
                  <Button size="icon-lg" aria-label="Icon lg">↑</Button>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Outline + sizes</p>
                <div className="flex flex-wrap items-center gap-2">
                  <Button variant="outline" size="default">Default</Button>
                  <Button variant="outline" size="sm">Small</Button>
                  <Button variant="outline" size="lg">Large</Button>
                  <Button variant="outline" size="icon" aria-label="Icon">↑</Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form controls – Input, Textarea, Select, Switch */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Form controls
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            <strong className="text-foreground">Where used:</strong> Input/Textarea: Admin brand-assets (logo, colour, font forms). Select: Brand assets page (view/sort), style guide. Switch: YouTube thumbnail, style guide.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="theme-preview-light rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Light mode</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Input</label>
                <Input placeholder="Placeholder" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Textarea</label>
                <Textarea placeholder="Multi-line" rows={2} />
              </div>
              <Select defaultValue="one">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one">Option one</SelectItem>
                  <SelectItem value="two">Option two</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-4">
                <Switch defaultChecked />
                <Switch />
              </div>
            </div>
          </div>
          <div className="theme-preview-dark rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Dark mode</h3>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Input</label>
                <Input placeholder="Placeholder" />
              </div>
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Textarea</label>
                <Textarea placeholder="Multi-line" rows={2} />
              </div>
              <Select defaultValue="one">
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one">Option one</SelectItem>
                  <SelectItem value="two">Option two</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex items-center gap-4">
                <Switch defaultChecked />
                <Switch />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cards */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Cards
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            <strong className="text-foreground">Where used:</strong> Home (tool cards), Statistics, Admin brand-assets, Style guide.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="theme-preview-light rounded-xl border border-border overflow-hidden bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Light mode</h3>
            <Card>
              <CardHeader>
                <CardTitle>Card with header</CardTitle>
                <CardDescription>CardDescription uses text-muted-foreground</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">CardContent. CardFooter for actions.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">Action</Button>
              </CardFooter>
            </Card>
          </div>
          <div className="theme-preview-dark rounded-xl border border-border overflow-hidden bg-background p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Dark mode</h3>
            <Card>
              <CardHeader>
                <CardTitle>Card with header</CardTitle>
                <CardDescription>CardDescription uses text-muted-foreground</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">CardContent. CardFooter for actions.</p>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm">Action</Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Alerts */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Alerts
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            <strong className="text-foreground">Where used:</strong> Webo news overlay, CCN image optimiser.
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="theme-preview-light rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Light mode</h3>
            </div>
            <div className="p-4 space-y-3">
              <Alert>
                <AlertTitle>Default alert</AlertTitle>
                <AlertDescription>Neutral or informational messages.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTitle>Destructive</AlertTitle>
                <AlertDescription>Errors or destructive actions.</AlertDescription>
              </Alert>
            </div>
          </div>
          <div className="theme-preview-dark rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Dark mode</h3>
            </div>
            <div className="p-4 space-y-3">
              <Alert>
                <AlertTitle>Default alert</AlertTitle>
                <AlertDescription>Neutral or informational messages.</AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <AlertTitle>Destructive</AlertTitle>
                <AlertDescription>Errors or destructive actions.</AlertDescription>
              </Alert>
            </div>
          </div>
        </div>
      </section>

      {/* Skeleton */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
          Skeleton
        </h2>
        <p className="text-xs text-muted-foreground">
          <strong className="text-foreground">Where used:</strong> Loading states: Admin (style-guide, brand-assets, images), Statistics, YouTube thumbnail, Webo news overlay, CCN image optimiser.
        </p>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="theme-preview-light rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Light mode</h3>
            </div>
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-full max-w-[200px]" />
              <Skeleton className="h-4 w-full max-w-[280px]" />
              <Skeleton className="h-4 w-full max-w-[240px]" />
            </div>
          </div>
          <div className="theme-preview-dark rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Dark mode</h3>
            </div>
            <div className="p-4 space-y-2">
              <Skeleton className="h-4 w-full max-w-[200px]" />
              <Skeleton className="h-4 w-full max-w-[280px]" />
              <Skeleton className="h-4 w-full max-w-[240px]" />
            </div>
          </div>
        </div>
      </section>

      {/* Dropdown menu */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Dropdown menu
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            <strong className="text-foreground">Where used:</strong> Footer (Admin tools: Upload images, Brand assets admin, Style guide, Statistics).
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="theme-preview-light rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Light mode</h3>
            </div>
            <div className="p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Open menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Menu</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Item one</DropdownMenuItem>
                  <DropdownMenuItem>Item two</DropdownMenuItem>
                  <DropdownMenuItem>Item three</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="theme-preview-dark rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Dark mode</h3>
            </div>
            <div className="p-4">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline">Open menu</Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  <DropdownMenuLabel>Menu</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem>Item one</DropdownMenuItem>
                  <DropdownMenuItem>Item two</DropdownMenuItem>
                  <DropdownMenuItem>Item three</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </section>

      {/* Combobox */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Combobox
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            <strong className="text-foreground">Where used:</strong> Admin brand-assets (tags for logos, colours, fonts).
          </p>
        </div>
        <ComboboxDemo />
      </section>

      {/* Input group */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Input group
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            <strong className="text-foreground">Where used:</strong> Inside Combobox (input with trigger/clear button).
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="theme-preview-light rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Light mode</h3>
            </div>
            <div className="p-4 space-y-4">
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>https://</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput placeholder="example.com" />
              </InputGroup>
              <InputGroup>
                <InputGroupInput placeholder="Search…" />
                <InputGroupAddon align="inline-end">
                  <span className="text-muted-foreground text-xs">⌘K</span>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
          <div className="theme-preview-dark rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Dark mode</h3>
            </div>
            <div className="p-4 space-y-4">
              <InputGroup>
                <InputGroupAddon align="inline-start">
                  <InputGroupText>https://</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput placeholder="example.com" />
              </InputGroup>
              <InputGroup>
                <InputGroupInput placeholder="Search…" />
                <InputGroupAddon align="inline-end">
                  <span className="text-muted-foreground text-xs">⌘K</span>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        </div>
      </section>

      {/* Dropzone */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Dropzone
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            <strong className="text-foreground">Where used:</strong> Webo news overlay, CCN image optimiser (file upload).
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="theme-preview-light rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Light mode</h3>
            </div>
            <div className="p-4">
              <DropzoneDemo />
            </div>
          </div>
          <div className="theme-preview-dark rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Dark mode</h3>
            </div>
            <div className="p-4">
              <DropzoneDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Navigation menu */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">
            Navigation menu
          </h2>
          <p className="text-xs text-muted-foreground mt-2">
            <strong className="text-foreground">Where used:</strong> Main site navigation (Image creation tools, Brand assets mega menus).
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="theme-preview-light rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Light mode</h3>
            </div>
            <div className="p-4">
              <NavigationMenuDemo />
            </div>
          </div>
          <div className="theme-preview-dark rounded-xl border border-border overflow-hidden bg-background">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-sm font-semibold text-foreground">Dark mode</h3>
            </div>
            <div className="p-4">
              <NavigationMenuDemo />
            </div>
          </div>
        </div>
      </section>

      {/* Experiment */}
      <section className="space-y-4 border border-dashed border-border rounded-lg p-6 bg-muted/20">
        <h2 className="text-xl font-semibold text-foreground">Experiment</h2>
        <p className="text-sm text-muted-foreground">
          This page is the right place to try new UI ideas: add sections, tweak tokens, or drop in
          new components. Changes here don’t affect production flows until you copy patterns into
          the rest of the app.
        </p>
      </section>

      {/* Colour usage modal – custom so it always shows (no Radix portal) */}
      {colorDialogOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="color-dialog-title"
        >
          <div
            className="absolute inset-0 bg-soft-black-990/80"
            onClick={() => setColorDialogOpen(false)}
          />
          <div className="relative z-[101] w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-border bg-background p-6 shadow-lg gap-4 flex flex-col">
            {usageCount > 0 && (
              <div className="absolute left-4 top-4 rounded-md bg-muted px-2 py-1 text-xs font-medium text-foreground">
                {usageCount} {usageCount === 1 ? 'usage' : 'usages'}
              </div>
            )}
            <div className="pt-6 pr-10 space-y-2">
              <h2 id="color-dialog-title" className="text-lg font-semibold leading-none tracking-tight flex items-center gap-2 flex-wrap">
                {selectedColorHex != null && (
                  <span
                    className="inline-block h-6 w-6 rounded border border-border shrink-0"
                    style={{ backgroundColor: selectedColorHex }}
                  />
                )}
                <span className="font-mono text-base">{selectedColorHex}</span>
                {selectedColorHex != null && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5"
                    onClick={() => copyFromDialog(selectedColorHex, 'hex')}
                  >
                    {dialogCopied === 'hex' ? (
                      'Copied!'
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy hex
                      </>
                    )}
                  </Button>
                )}
              </h2>
              {selectedColorToken != null && (
                <p className="text-sm text-muted-foreground font-mono flex items-center gap-2 flex-wrap">
                  Token: <span className="text-foreground">{selectedColorToken}</span>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-7 gap-1.5"
                    onClick={() => copyFromDialog(selectedColorToken, 'token')}
                  >
                    {dialogCopied === 'token' ? (
                      'Copied!'
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        Copy token
                      </>
                    )}
                  </Button>
                </p>
              )}
            </div>
            <div className="min-h-0 flex flex-col">
              <p className="text-xs font-medium text-foreground mb-2 shrink-0">Where this colour is used</p>
              {usages.length > 0 ? (
                <ul className="space-y-2 text-sm overflow-y-auto min-h-0 max-h-[40vh] pr-1">
                  {usages.map((u, i) => (
                    <li key={i} className="flex flex-wrap items-baseline gap-x-2 gap-y-1 font-mono text-muted-foreground">
                      <span className="text-foreground">{u.token}</span>
                      <span className="text-xs">in {u.file}</span>
                      <span className="text-xs">({u.context})</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Not used yet. Add <span className="font-mono text-foreground">{selectedColorToken}</span> to the palette in globals.css when you need this shade.
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4"
              aria-label="Close"
              onClick={() => setColorDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </main>
  );
}

function ComboboxDemo() {
  const anchorRefLight = useComboboxAnchor();
  const anchorRefDark = useComboboxAnchor();
  const items = ['Apple', 'Banana', 'Cherry', 'Date'];
  const [valueLight, setValueLight] = useState<string | null>('Apple');
  const [valueDark, setValueDark] = useState<string | null>('Apple');
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="theme-preview-light rounded-xl border border-border overflow-hidden bg-background">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Light mode</h3>
        </div>
        <div className="p-4" ref={anchorRefLight}>
          <Combobox value={valueLight} onValueChange={setValueLight} items={items}>
            <ComboboxInput placeholder="Select…" className="w-full" />
            <ComboboxValue />
            <ComboboxContent anchor={anchorRefLight}>
              <ComboboxList>
                <ComboboxEmpty>No results</ComboboxEmpty>
                {items.map((item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>
      <div className="theme-preview-dark rounded-xl border border-border overflow-hidden bg-background">
        <div className="px-4 py-3 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Dark mode</h3>
        </div>
        <div className="p-4" ref={anchorRefDark}>
          <Combobox value={valueDark} onValueChange={setValueDark} items={items}>
            <ComboboxInput placeholder="Select…" className="w-full" />
            <ComboboxValue />
            <ComboboxContent anchor={anchorRefDark}>
              <ComboboxList>
                <ComboboxEmpty>No results</ComboboxEmpty>
                {items.map((item) => (
                  <ComboboxItem key={item} value={item}>
                    {item}
                  </ComboboxItem>
                ))}
              </ComboboxList>
            </ComboboxContent>
          </Combobox>
        </div>
      </div>
    </div>
  );
}

function DropzoneDemo() {
  const [files, setFiles] = useState<File[]>([]);
  return (
    <Dropzone
      src={files}
      onDrop={(accepted) => setFiles(accepted)}
      accept={{ 'image/*': ['.png', '.jpg', '.webp'] }}
      maxFiles={1}
    >
      {files.length > 0 ? (
        <DropzoneContent>
          <div className="flex flex-col items-center gap-2">
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">{files[0].name}</p>
            <p className="text-xs text-muted-foreground">Drag and drop or click to replace</p>
          </div>
        </DropzoneContent>
      ) : (
        <DropzoneEmptyState />
      )}
    </Dropzone>
  );
}

function NavigationMenuDemo() {
  return (
    <NavigationMenu>
      <NavigationMenuList className="flex flex-col md:flex-row gap-1">
        <NavigationMenuItem>
          <NavigationMenuTrigger>Menu</NavigationMenuTrigger>
          <NavigationMenuContent>
            <div className="grid gap-2 p-2 w-[200px]">
              <NavigationMenuLink href="#" className="flex items-center gap-2">
                <Home className="size-4" />
                <span>All tools</span>
              </NavigationMenuLink>
              <NavigationMenuLink href="#">Item one</NavigationMenuLink>
              <NavigationMenuLink href="#">Item two</NavigationMenuLink>
            </div>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}

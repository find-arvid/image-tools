'use client';

import { Suspense, useEffect, useState, type SyntheticEvent, type MouseEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Copy, Download, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { BrandAsset, BrandAssetType } from '@/lib/brand-assets-database';

type SectionedAssets = Record<BrandAssetType, BrandAsset[]>;

const initialSections: SectionedAssets = {
  logo: [],
  'logo-version': [],
  color: [],
  font: [],
  icon: [],
  'project-logo': [],
  'menu-logo': [], // Not shown on this page; only used in nav dropdown
};

const BRANDS = ['find.co', 'Webopedia', 'CCN', 'CryptoManiaks'] as const;

const BRAND_LABELS: Record<string, string> = {
  find: 'Find.co',
  webopedia: 'Webopedia',
  ccn: 'CCN',
  cryptomaniaks: 'CryptoManiaks',
};

/** Preview images for font cards (font name -> path in /public) */
const FONT_PREVIEW_IMAGES: Record<string, string> = {
  'Space Grotesk': '/space grotesk.png',
  'Acid Grotesk': '/acid grotesk.png',
};

function hexToRgba(hex: string, alpha: number): string {
  let value = hex.trim().replace('#', '');
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (value.length !== 6) {
    return `rgba(255, 255, 255, ${alpha})`;
  }
  const num = parseInt(value, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function getContrastColor(hex: string): '#000000' | '#ffffff' {
  let value = hex.trim().replace('#', '');
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('');
  }
  if (value.length !== 6) {
    return '#ffffff';
  }
  const num = parseInt(value, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
  return brightness > 186 ? '#000000' : '#ffffff';
}

type ColorCardProps = {
  color: BrandAsset;
  hex: string;
  isCopied: boolean;
  onCopy: (hex: string) => void;
  variant: 'primary' | 'secondary';
};

function ColorCard({ color, hex, isCopied, onCopy, variant }: ColorCardProps) {
  // Only the copy button triggers copy; card click just highlights.
  const [isHighlighted, setIsHighlighted] = useState(false);

  const triggerHighlight = () => {
    setIsHighlighted(true);
    setTimeout(() => {
      setIsHighlighted(false);
    }, 2000);
  };

  const handleCopyClick = (e: MouseEvent) => {
    e.stopPropagation();
    onCopy(hex);
    triggerHighlight();
  };

  const displayHex = (color.hex || hex).toUpperCase();
  const contrastColor = getContrastColor(hex);

  return (
    <div
      className="relative border border-card-border rounded-lg p-3 bg-card/60 flex flex-col gap-3 h-full hover:border-muted-foreground/30 transition-colors"
      onClick={triggerHighlight}
      style={{
        borderColor: isHighlighted ? hex : undefined,
        backgroundColor: isHighlighted ? hexToRgba(hex, 0.1) : undefined,
      }}
    >
      <div
        className={`relative overflow-hidden ${variant === 'primary' ? 'h-32' : 'h-16'} w-full rounded-md border-2 border-transparent flex items-center justify-center`}
        style={{ backgroundColor: hex }}
      >
        <button
          type="button"
          className="relative z-10 inline-flex items-center gap-2 rounded-md border bg-transparent px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-ring"
          onClick={handleCopyClick}
          title={`Copy ${hex}`}
          style={{
            color: contrastColor,
            borderColor: contrastColor,
          }}
        >
          <span className="font-mono">{displayHex}</span>
          {isCopied ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <Copy className="w-3.5 h-3.5" />
          )}
        </button>
      </div>
      <div className="flex-1 flex flex-col gap-2">
        <p className="font-semibold text-base text-foreground">{color.name}</p>
        {color.usage && (
          <p className="text-sm text-muted-foreground">{color.usage}</p>
        )}
      </div>
    </div>
  );
}

function BrandAssetsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const urlBrand = (searchParams.get('brand') || 'find').toLowerCase();
  const [brand, setBrand] = useState<string>(urlBrand);
  const [assetsByType, setAssetsByType] = useState<SectionedAssets>(initialSections);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<Record<string, { width: number; height: number }>>({});
  const [copiedHex, setCopiedHex] = useState<string | null>(null);
  const [logoView, setLogoView] = useState<'list' | 'cards'>('cards');

  const copyHex = (hex: string) => {
    if (!hex) return;
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 2000);
  };

  useEffect(() => {
    const loadAssets = async () => {
      try {
        setLoading(true);
        const queryBrand = brand || 'find';
        const res = await fetch(`/api/brand-assets?brand=${encodeURIComponent(queryBrand)}`);
        if (!res.ok) {
          throw new Error(`Failed to load brand assets: ${res.status} ${res.statusText}`);
        }
        const data = await res.json();
        // Build fresh section buckets each time to avoid accumulating
        // items across React Strict Mode double-invocations in dev.
        const sections: SectionedAssets = {
          logo: [],
          'logo-version': [],
          color: [],
          font: [],
          icon: [],
          'project-logo': [],
          'menu-logo': [],
        };
        const seenIds = new Set<string>();
        (data.assets as BrandAsset[]).forEach(asset => {
          if (seenIds.has(asset.id)) return;
          if (asset.type === 'menu-logo') return; // Only used in nav dropdown, not on this page
          seenIds.add(asset.id);
          const bucket = sections[asset.type as keyof typeof sections];
          if (bucket) bucket.push(asset);
        });
        setAssetsByType(sections);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load brand assets');
      } finally {
        setLoading(false);
      }
    };

    loadAssets();
  }, [brand]);

  const handleImageLoad = (id: string) => (e: SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    if (!img.naturalWidth || !img.naturalHeight) return;
    setDimensions(prev => ({
      ...prev,
      [id]: { width: img.naturalWidth, height: img.naturalHeight },
    }));
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes || bytes <= 0) return '—';
    if (bytes < 1024) return `${bytes} B`;
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    const mb = kb / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const displayBrand =
    BRAND_LABELS[brand.toLowerCase() as keyof typeof BRAND_LABELS] ?? 'Find.co';

  const sortedLogos = [...(assetsByType.logo ?? []), ...(assetsByType['logo-version'] ?? [])].sort(
    (a, b) => (a.order ?? 999999) - (b.order ?? 999999)
  );

  return (
    <main className="min-h-screen w-full max-w-6xl mx-auto px-4 py-10 space-y-12">
      <header className="space-y-4">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            {displayBrand} Brand Assets
          </h1>
          <p className="text-muted-foreground max-w-2xl">
            Logos, colours, fonts and icons for creating on-brand visuals. Designers can keep this
            library up to date without code changes.
          </p>
        </div>
      </header>

      {error && (
        <p className="text-sm text-destructive">Error: {error}</p>
      )}

      {/* Logos */}
      <section className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-xl font-semibold text-foreground">Logos</h2>
          <div className="flex flex-wrap items-center gap-5">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="whitespace-nowrap">View</span>
              <Select
                value={logoView}
                onValueChange={(value) => setLogoView(value as 'list' | 'cards')}
              >
                <SelectTrigger className="h-8 w-[7rem]" size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cards">Cards</SelectItem>
                  <SelectItem value="list">List</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {loading ? (
          logoView === 'list' ? (
            <div className="overflow-x-auto border border-card-border rounded-lg bg-card/60">
              <table className="min-w-full text-sm">
                <thead className="bg-muted/40">
                  <tr className="text-left">
                    <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Preview</th>
                    <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Name</th>
                    <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Format</th>
                    <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Resolution</th>
                    <th className="px-3 py-2 font-medium text-xs text-muted-foreground">File size</th>
                    <th className="px-3 py-2 font-medium text-xs text-muted-foreground text-right">Download</th>
                  </tr>
                </thead>
                <tbody>
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="border-t border-border/60">
                      <td className="px-3 py-2 align-middle">
                        <Skeleton className="h-10 w-20" />
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="mt-1 h-3 w-24" />
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <Skeleton className="h-3 w-12" />
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <Skeleton className="h-3 w-16" />
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <Skeleton className="h-3 w-10" />
                      </td>
                      <td className="px-3 py-2 align-middle text-right">
                        <Skeleton className="h-8 w-20 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="border border-card-border rounded-lg p-3 bg-card/60 flex flex-col gap-3 w-full sm:w-[260px]"
                >
                  <Skeleton className="h-24 w-full rounded-md" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          )
        ) : (assetsByType.logo?.length ?? 0) + (assetsByType['logo-version']?.length ?? 0) === 0 ? (
          <p className="text-muted-foreground text-sm">No logos added yet.</p>
        ) : (
          <>
            {logoView === 'list' ? (
              <div className="overflow-x-auto border border-card-border rounded-lg bg-card/60">
                <table className="min-w-full text-sm">
                  <thead className="bg-muted/40">
                    <tr className="text-left">
                      <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Preview</th>
                      <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Name</th>
                      <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Format</th>
                      <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Resolution</th>
                      <th className="px-3 py-2 font-medium text-xs text-muted-foreground">File size</th>
                      <th className="px-3 py-2 font-medium text-xs text-muted-foreground text-right">Download</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedLogos.map((logo, index) => {
                      const isLogoVersion = logo.type === 'logo-version';
                      const previewUrl = isLogoVersion
                        ? (logo.pngPublicUrl || logo.svgPublicUrl)
                        : logo.publicUrl;
                      const dim = dimensions[logo.id];
                      const res =
                        dim?.width && dim.height
                          ? `${dim.width} × ${dim.height}`
                          : logo.width && logo.height
                          ? `${logo.width} × ${logo.height}`
                          : isLogoVersion && logo.pngWidth != null && logo.pngHeight != null
                          ? `${logo.pngWidth} × ${logo.pngHeight}`
                          : '—';
                      return (
                        <tr key={`${logo.id}-${index}`} className="border-t border-border/60">
                          <td className="px-3 py-2 align-middle">
                            {previewUrl && (
                              <div className="h-10 w-20 bg-muted/20 rounded-md flex items-center justify-center overflow-hidden">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={previewUrl}
                                  alt={logo.name}
                                  className="max-h-full max-w-full object-contain"
                                  onLoad={handleImageLoad(logo.id)}
                                />
                              </div>
                            )}
                          </td>
                          <td className="px-3 py-2 align-middle">
                            <div className="flex flex-col">
                              <span className="text-sm text-foreground">{logo.name}</span>
                              {logo.description && (
                                <span className="text-xs text-muted-foreground line-clamp-1">
                                  {logo.description}
                                </span>
                              )}
                              {logo.tags && logo.tags.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {logo.tags.map((tag) => (
                                    <span
                                      key={tag}
                                      className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                            {isLogoVersion ? (
                              <span className="inline-flex flex-wrap gap-1">
                                {logo.pngPublicUrl && (
                                  <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-mono uppercase">
                                    PNG
                                  </span>
                                )}
                                {logo.svgPublicUrl && (
                                  <span className="inline-flex rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-mono uppercase">
                                    SVG
                                  </span>
                                )}
                              </span>
                            ) : logo.format ? (
                              <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-mono uppercase">
                                {logo.format.toUpperCase()}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                            {res}
                          </td>
                          <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                            {isLogoVersion
                              ? `PNG: ${formatBytes(logo.pngFileSizeBytes)} / SVG: ${formatBytes(logo.svgFileSizeBytes)}`
                              : formatBytes(logo.fileSizeBytes)}
                          </td>
                          <td className="px-3 py-2 align-middle text-right">
                            {isLogoVersion ? (
                              <div className="flex justify-end gap-1">
                                {logo.pngPublicUrl && (
                                  <Button asChild size="icon" variant="outline">
                                    <a
                                      href={`/api/brand-assets/${logo.id}/download?format=png`}
                                      aria-label={`Download ${logo.name} (PNG)`}
                                    >
                                      <Download className="w-4 h-4" />
                                    </a>
                                  </Button>
                                )}
                                {logo.svgPublicUrl && (
                                  <Button asChild size="icon" variant="outline">
                                    <a
                                      href={`/api/brand-assets/${logo.id}/download?format=svg`}
                                      aria-label={`Download ${logo.name} (SVG)`}
                                    >
                                      <Download className="w-4 h-4" />
                                    </a>
                                  </Button>
                                )}
                              </div>
                            ) : logo.publicUrl ? (
                              <Button asChild size="icon" variant="outline">
                                <a
                                  href={`/api/brand-assets/${logo.id}/download`}
                                  aria-label={`Download ${logo.name}`}
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {sortedLogos.map((logo, index) => {
                  const isLogoVersion = logo.type === 'logo-version';
                  const previewUrl = isLogoVersion
                    ? (logo.pngPublicUrl || logo.svgPublicUrl)
                    : logo.publicUrl;
                  const dim = dimensions[logo.id];
                  const res =
                    dim?.width && dim.height
                      ? `${dim.width} × ${dim.height}`
                      : logo.width && logo.height
                      ? `${logo.width} × ${logo.height}`
                      : isLogoVersion && logo.pngWidth && logo.pngHeight
                      ? `${logo.pngWidth} × ${logo.pngHeight}`
                      : '—';
                  return (
                    <div
                      key={`${logo.id}-${index}`}
                      className="border border-card-border rounded-lg p-3 bg-card/60 flex flex-col gap-3 w-full sm:w-[260px]"
                    >
                      <div
                        className="h-32 w-full rounded-md flex items-center justify-center overflow-hidden p-4"
                        style={{
                          backgroundColor: 'var(--card)',
                          backgroundImage: `
                            linear-gradient(45deg, var(--muted) 25%, transparent 25%),
                            linear-gradient(-45deg, var(--muted) 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, var(--muted) 75%),
                            linear-gradient(-45deg, transparent 75%, var(--muted) 75%),
                            linear-gradient(45deg, rgba(255,255,255,0.2) 25%, transparent 25%),
                            linear-gradient(-45deg, rgba(255,255,255,0.2) 25%, transparent 25%),
                            linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.2) 75%),
                            linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.2) 75%)
                          `,
                          backgroundSize: '24px 24px',
                          backgroundPosition: '0 0, 0 12px, 12px -12px, -12px 0px, 0 0, 0 12px, 12px -12px, -12px 0px',
                        }}
                      >
                        {previewUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={previewUrl}
                            alt={logo.name}
                            className="max-h-full max-w-full object-contain"
                            onLoad={handleImageLoad(logo.id)}
                          />
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">{logo.name}</p>
                        {logo.description && (
                          <p className="text-xs text-muted-foreground">
                            {logo.description}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                          {isLogoVersion ? (
                            <>
                              <span>
                                <span className="font-semibold">PNG: </span>
                                {formatBytes(logo.pngFileSizeBytes)}
                              </span>
                              <span>
                                <span className="font-semibold">SVG: </span>
                                {formatBytes(logo.svgFileSizeBytes)}
                              </span>
                              {logo.pngWidth != null && logo.pngHeight != null && (
                                <span>
                                  <span className="font-semibold">Res: </span>
                                  {res}
                                </span>
                              )}
                            </>
                          ) : (
                            <>
                              <span>
                                <span className="font-semibold">Size: </span>
                                {formatBytes(logo.fileSizeBytes)}
                              </span>
                              <span>
                                <span className="font-semibold">Res: </span>
                                {res}
                              </span>
                            </>
                          )}
                        </div>
                        {logo.tags && logo.tags.length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {logo.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs uppercase tracking-wide text-muted-foreground"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {isLogoVersion ? (
                          <>
                            {logo.pngPublicUrl && (
                              <span className="inline-flex items-center rounded-md border border-border bg-muted/60 px-2.5 py-1 text-sm font-semibold uppercase tracking-wide text-foreground">
                                PNG
                              </span>
                            )}
                            {logo.svgPublicUrl && (
                              <span className="inline-flex items-center rounded-md border border-border bg-muted/60 px-2.5 py-1 text-sm font-semibold uppercase tracking-wide text-foreground">
                                SVG
                              </span>
                            )}
                            <div className="flex gap-1 ml-auto shrink-0">
                              {logo.pngPublicUrl && (
                                <Button asChild size="icon" variant="outline">
                                  <a
                                    href={`/api/brand-assets/${logo.id}/download?format=png`}
                                    aria-label={`Download ${logo.name} (PNG)`}
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                              {logo.svgPublicUrl && (
                                <Button asChild size="icon" variant="outline">
                                  <a
                                    href={`/api/brand-assets/${logo.id}/download?format=svg`}
                                    aria-label={`Download ${logo.name} (SVG)`}
                                  >
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </>
                        ) : (
                          <>
                            {logo.format && (
                              <span className="inline-flex items-center rounded-md border border-border bg-muted/60 px-2.5 py-1 text-sm font-semibold uppercase tracking-wide text-foreground">
                                {logo.format}
                              </span>
                            )}
                            {logo.publicUrl && (
                              <Button asChild size="icon" variant="outline" className="ml-auto shrink-0">
                                <a
                                  href={`/api/brand-assets/${logo.id}/download`}
                                  aria-label={`Download ${logo.name}`}
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>

      {/* Colours */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Colours</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-card-border rounded-lg p-3 bg-card/60 flex flex-col gap-3">
                <Skeleton className="h-16 w-full rounded-md" />
                <div className="space-y-1 pr-8">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-20" />
                </div>
              </div>
            ))}
          </div>
        ) : assetsByType.color.length === 0 ? (
          <p className="text-muted-foreground text-sm">No colours added yet.</p>
        ) : (
          <div className="space-y-6">
            {(() => {
              const sorted = [...assetsByType.color].sort(
                (a, b) => (a.order ?? 999999) - (b.order ?? 999999)
              );
              const primary = sorted.filter(
                (c) => (c.colorCategory || 'primary') === 'primary'
              );
              const secondary = sorted.filter(
                (c) => (c.colorCategory || 'primary') === 'secondary'
              );

              const renderGrid = (items: BrandAsset[], variant: 'primary' | 'secondary') => (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {items.map((color, index) => {
                    const hex = color.hex || '#000000';
                    const isCopied = copiedHex === hex;
                    return (
                      <ColorCard
                        key={`${color.id}-${index}`}
                        color={color}
                        hex={hex}
                        isCopied={isCopied}
                        onCopy={copyHex}
                        variant={variant}
                      />
                    );
                  })}
                </div>
              );

              return (
                <>
                  {primary.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground/80">Primary</p>
                      {renderGrid(primary, 'primary')}
                    </div>
                  )}
                  {secondary.length > 0 && (
                    <div className="space-y-3">
                      <p className="text-sm font-medium text-foreground/80">Secondary</p>
                      {renderGrid(secondary, 'secondary')}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}
      </section>

      {/* Fonts */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Fonts</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-card-border rounded-lg p-4 bg-card/60 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-2/3" />
                <div className="flex gap-2 mt-2">
                  <Skeleton className="h-8 w-28" />
                  <Skeleton className="h-8 w-32" />
                </div>
              </div>
            ))}
          </div>
        ) : assetsByType.font.length === 0 ? (
          <p className="text-muted-foreground text-sm">No fonts added yet.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assetsByType.font.map((font, index) => {
              const previewSrc = font.previewImageUrl || FONT_PREVIEW_IMAGES[font.name];
              return (
                <div
                  key={`${font.id}-${index}`}
                  className="border border-card-border rounded-lg pl-4 pr-0 pt-0 pb-0 bg-card/60 flex flex-col sm:flex-row gap-0"
                >
                  <div className="flex-1 min-w-0 space-y-2 pt-4 pb-4">
                    <p className="font-semibold text-sm text-foreground">{font.name}</p>
                    {font.usage && (
                      <p className="text-xs text-muted-foreground">{font.usage}</p>
                    )}
                    {font.weights && font.weights.length > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Weights: {font.weights.join(', ')}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {font.googleFontUrl && (
                        <Button asChild size="sm" variant="outline">
                          <a href={font.googleFontUrl} target="_blank" rel="noreferrer">
                            View font page
                          </a>
                        </Button>
                      )}
                      {font.downloadUrl && (
                        <Button asChild size="sm">
                          <a href={font.downloadUrl} download>
                            Download font files
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                  {previewSrc && (
                    <div className="shrink-0 w-full sm:w-48 sm:max-w-[12rem] sm:self-stretch relative rounded-b-lg sm:rounded-b-none sm:rounded-r-lg overflow-hidden bg-muted/20">
                      <Image
                        src={previewSrc}
                        alt={`${font.name} sample`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 640px) 100vw, 12rem"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Icons / Project logos */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-foreground">Icons &amp; Project Logos</h2>
        {loading ? (
          <div className="overflow-x-auto border border-card-border rounded-lg bg-card/60">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Preview</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Name</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Type</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Resolution</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">File size</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Tags</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground text-right">Download</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="border-t border-border/60">
                    <td className="px-3 py-2 align-middle">
                      <Skeleton className="h-10 w-10" />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Skeleton className="h-4 w-24" />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Skeleton className="h-3 w-16" />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Skeleton className="h-3 w-16" />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Skeleton className="h-3 w-10" />
                    </td>
                    <td className="px-3 py-2 align-middle">
                      <Skeleton className="h-3 w-20" />
                    </td>
                    <td className="px-3 py-2 align-middle text-right">
                      <Skeleton className="h-8 w-20 ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : assetsByType.icon.length === 0 && assetsByType['project-logo'].length === 0 ? (
          <p className="text-muted-foreground text-sm">No icons or project logos added yet.</p>
        ) : (
          <div className="overflow-x-auto border border-card-border rounded-lg bg-card/60">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Preview</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Name</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Type</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Resolution</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">File size</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Tags</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground text-right">Download</th>
                </tr>
              </thead>
              <tbody>
                {[...assetsByType.icon, ...assetsByType['project-logo']].map((asset, index) => {
                  const dim = dimensions[asset.id];
                  const res =
                    dim?.width && dim.height
                      ? `${dim.width} × ${dim.height}`
                      : asset.width && asset.height
                      ? `${asset.width} × ${asset.height}`
                      : '—';
                  return (
                    <tr key={`${asset.id}-${index}`} className="border-t border-border/60">
                      <td className="px-3 py-2 align-middle">
                        {asset.publicUrl && (
                          <div className="h-10 w-10 bg-muted/20 rounded-md flex items-center justify-center overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={asset.publicUrl}
                              alt={asset.name}
                              className="max-h-full max-w-full object-contain"
                              onLoad={handleImageLoad(asset.id)}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <span className="text-sm text-foreground">{asset.name}</span>
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                        {asset.type === 'icon' ? 'Icon' : 'Project logo'}
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                        {res}
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                        {formatBytes(asset.fileSizeBytes)}
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                        {asset.tags && asset.tags.length > 0
                          ? asset.tags.join(', ')
                          : '—'}
                      </td>
                      <td className="px-3 py-2 align-middle text-right">
                        {asset.publicUrl && (
                          <Button asChild size="icon" variant="outline">
                            <a
                              href={`/api/brand-assets/${asset.id}/download`}
                              aria-label={`Download ${asset.name}`}
                            >
                              <Download className="w-4 h-4" />
                            </a>
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function BrandAssetsSkeleton() {
  return (
    <main className="min-h-screen w-full max-w-6xl mx-auto px-4 py-10 space-y-12">
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-2">
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-4 w-full max-w-2xl" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-9 w-28" />
          </div>
        </div>
      </header>
      <section className="space-y-4">
        <Skeleton className="h-6 w-16" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </section>
      <section className="space-y-4">
        <Skeleton className="h-6 w-20" />
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32 rounded-lg" />
          ))}
        </div>
      </section>
      <section className="space-y-4">
        <Skeleton className="h-6 w-16" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-lg" />
          ))}
        </div>
      </section>
    </main>
  );
}

export default function BrandAssetsPage() {
  return (
    <Suspense fallback={<BrandAssetsSkeleton />}>
      <BrandAssetsContent />
    </Suspense>
  );
}

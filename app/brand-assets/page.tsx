'use client';

import { Suspense, useEffect, useState, type SyntheticEvent } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { BrandAsset, BrandAssetType } from '@/lib/brand-assets-database';

type SectionedAssets = Record<BrandAssetType, BrandAsset[]>;

const initialSections: SectionedAssets = {
  logo: [],
  color: [],
  font: [],
  icon: [],
  'project-logo': [],
};

const BRANDS = ['find.co', 'Webopedia', 'CCN', 'CryptoManiaks'] as const;

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

  const copyHex = (hex: string) => {
    if (!hex) return;
    navigator.clipboard.writeText(hex);
    setCopiedHex(hex);
    setTimeout(() => setCopiedHex(null), 1500);
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
        const sections: SectionedAssets = { ...initialSections };
        const seenIds = new Set<string>();
        (data.assets as BrandAsset[]).forEach(asset => {
          if (seenIds.has(asset.id)) return;
          seenIds.add(asset.id);
          sections[asset.type].push(asset);
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

  return (
    <main className="min-h-screen w-full max-w-6xl mx-auto px-4 py-10 space-y-12">
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold text-white">Brand Assets</h1>
            <p className="text-muted-foreground max-w-2xl">
              Logos, colours, fonts and icons for creating on-brand visuals. Designers can keep this
              library up to date without code changes.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Brand</span>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={brand}
              onChange={(e) => {
                const next = e.target.value;
                setBrand(next);
                const params = new URLSearchParams(searchParams.toString());
                if (next && next !== 'find') {
                  params.set('brand', next);
                } else {
                  params.delete('brand');
                }
                router.push(`/brand-assets?${params.toString()}`);
              }}
            >
              <option value="find">Find.co</option>
              <option value="webopedia" disabled>Webopedia (coming soon)</option>
              <option value="ccn" disabled>CCN (coming soon)</option>
              <option value="cryptomaniaks" disabled>CryptoManiaks (coming soon)</option>
            </select>
          </div>
        </div>
      </header>

      {error && (
        <p className="text-sm text-red-400">Error: {error}</p>
      )}

      {/* Logos */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Logos</h2>
        {loading ? (
          <div className="overflow-x-auto border border-border rounded-lg bg-card/60">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Preview</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Name</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Format</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Resolution</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">File size</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Variants</th>
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
        ) : assetsByType.logo.length === 0 ? (
          <p className="text-muted-foreground text-sm">No logos added yet.</p>
        ) : (
          <div className="overflow-x-auto border border-border rounded-lg bg-card/60">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Preview</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Name</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Format</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Resolution</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">File size</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground">Variants</th>
                  <th className="px-3 py-2 font-medium text-xs text-muted-foreground text-right">Download</th>
                </tr>
              </thead>
              <tbody>
                {assetsByType.logo.map((logo, index) => {
                  const dim = dimensions[logo.id];
                  const res =
                    dim?.width && dim.height
                      ? `${dim.width} × ${dim.height}`
                      : logo.width && logo.height
                      ? `${logo.width} × ${logo.height}`
                      : '—';
                  return (
                    <tr key={`${logo.id}-${index}`} className="border-t border-border/60">
                      <td className="px-3 py-2 align-middle">
                        {logo.publicUrl && (
                          <div className="h-10 w-20 bg-muted/20 rounded-md flex items-center justify-center overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={logo.publicUrl}
                              alt={logo.name}
                              className="max-h-full max-w-full object-contain"
                              onLoad={handleImageLoad(logo.id)}
                            />
                          </div>
                        )}
                      </td>
                      <td className="px-3 py-2 align-middle">
                        <div className="flex flex-col">
                          <span className="text-sm text-white">{logo.name}</span>
                          {logo.description && (
                            <span className="text-xs text-muted-foreground line-clamp-1">
                              {logo.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                        {logo.format || '—'}
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                        {res}
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                        {formatBytes(logo.fileSizeBytes)}
                      </td>
                      <td className="px-3 py-2 align-middle text-xs text-muted-foreground">
                        {logo.variants && logo.variants.length > 0
                          ? logo.variants.join(', ')
                          : '—'}
                      </td>
                      <td className="px-3 py-2 align-middle text-right">
                        {logo.publicUrl && (
                          <Button asChild size="sm" variant="outline">
                            <a href={logo.publicUrl} download>
                              Download
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

      {/* Colours */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Colours</h2>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="border border-border rounded-lg p-3 bg-card/60 flex flex-col gap-3">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {assetsByType.color.map((color, index) => {
              const hex = color.hex || '#000000';
              const isCopied = copiedHex === hex;
              return (
                <div
                  key={`${color.id}-${index}`}
                  role="button"
                  tabIndex={0}
                  className="relative border border-border rounded-lg p-3 bg-card/60 flex flex-col gap-3 cursor-pointer hover:border-muted-foreground/30 transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background"
                  onClick={() => copyHex(hex)}
                  onKeyDown={(e) => e.key === 'Enter' && copyHex(hex)}
                  title={`Copy ${hex}`}
                >
                  <div
                    className="h-16 w-full rounded-md border-2 border-transparent"
                    style={{ backgroundColor: hex }}
                  >
                    {isCopied && (
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium text-white bg-black/60 m-2">
                        Copied!
                      </span>
                    )}
                  </div>
                  <div className="space-y-1 pr-8">
                    <p className="font-medium text-sm text-white">{color.name}</p>
                    {color.usage && (
                      <p className="text-xs text-muted-foreground">{color.usage}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="underline underline-offset-2">{color.hex}</span>
                      {color.rgb && <span>· rgb({color.rgb})</span>}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="absolute bottom-3 right-3 p-1.5 rounded-md bg-muted/80 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                    onClick={(e) => {
                      e.stopPropagation();
                      copyHex(hex);
                    }}
                    title={`Copy ${hex}`}
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Fonts */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Fonts</h2>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="border border-border rounded-lg p-4 bg-card/60 space-y-2">
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
            {assetsByType.font.map((font, index) => (
              <div key={`${font.id}-${index}`} className="border border-border rounded-lg p-4 bg-card/60 space-y-2">
                <p className="font-semibold text-sm text-white">{font.name}</p>
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
                        View on Google Fonts
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
            ))}
          </div>
        )}
      </section>

      {/* Icons / Project logos */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-white">Icons &amp; Project Logos</h2>
        {loading ? (
          <div className="overflow-x-auto border border-border rounded-lg bg-card/60">
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
          <div className="overflow-x-auto border border-border rounded-lg bg-card/60">
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
                        <span className="text-sm text-white">{asset.name}</span>
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
                          <Button asChild size="sm" variant="outline">
                            <a href={asset.publicUrl} download>
                              Download
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

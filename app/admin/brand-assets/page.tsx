'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BrandAsset, BrandAssetType } from '@/lib/brand-assets-database';

type SimpleBrandAsset = BrandAsset;

export default function AdminBrandAssetsPage() {
  const [assets, setAssets] = useState<SimpleBrandAsset[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>('find');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Upload state
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<BrandAssetType>('logo');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [assetName, setAssetName] = useState('');
  const [assetDescription, setAssetDescription] = useState('');
  const [assetTags, setAssetTags] = useState('');
  const [assetVariants, setAssetVariants] = useState('');

  // Colour form
  const [colorName, setColorName] = useState('');
  const [colorHex, setColorHex] = useState('#cfe02d');
  const [colorUsage, setColorUsage] = useState('');
  // Font form
  const [fontName, setFontName] = useState('');
  const [fontUsage, setFontUsage] = useState('');
  const [fontGoogleUrl, setFontGoogleUrl] = useState('');
  const [fontDownloadUrl, setFontDownloadUrl] = useState('');

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: acceptedFiles => {
      if (acceptedFiles.length > 0) {
        setSelectedFile(acceptedFiles[0]);
      }
    },
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp', '.svg'],
    },
    maxFiles: 1,
  });

  const loadAssets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/brand-assets?brand=${encodeURIComponent(selectedBrand)}`);
      if (!res.ok) {
        throw new Error(`Failed to load brand assets: ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      setAssets(data.assets as BrandAsset[]);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load brand assets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssets();
  }, [selectedBrand]);

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', uploadType);
      formData.append('brand', selectedBrand);
      if (assetName.trim()) formData.append('name', assetName.trim());
      if (assetDescription.trim()) formData.append('description', assetDescription.trim());
      if (assetTags.trim()) formData.append('tags', assetTags.trim());
      if (assetVariants.trim()) formData.append('variants', assetVariants.trim());

      const res = await fetch('/api/brand-assets/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.details || `Upload failed: ${res.status}`);
      }

      // Refresh list
      await loadAssets();

      // Reset form
      setSelectedFile(null);
      setAssetName('');
      setAssetDescription('');
      setAssetTags('');
      setAssetVariants('');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateColor = async () => {
    if (!colorName.trim() || !colorHex.trim()) return;

    try {
      setUploading(true);
      setError(null);

      const res = await fetch('/api/brand-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'color',
          name: colorName.trim(),
          hex: colorHex.trim(),
          usage: colorUsage.trim() || undefined,
          brand: selectedBrand,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.details || `Failed to create colour: ${res.status}`);
      }

      // Refresh list
      await loadAssets();

      // Reset form
      setColorName('');
      setColorUsage('');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to create colour');
    } finally {
      setUploading(false);
    }
  };

  const handleCreateFont = async () => {
    if (!fontName.trim()) return;

    try {
      setUploading(true);
      setError(null);

      const res = await fetch('/api/brand-assets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'font',
          name: fontName.trim(),
          usage: fontUsage.trim() || undefined,
          googleFontUrl: fontGoogleUrl.trim() || undefined,
          downloadUrl: fontDownloadUrl.trim() || undefined,
          brand: selectedBrand,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.details || `Failed to create font: ${res.status}`);
      }

      await loadAssets();

      setFontName('');
      setFontUsage('');
      setFontGoogleUrl('');
      setFontDownloadUrl('');
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to create font');
    } finally {
      setUploading(false);
    }
  };

  const logos = assets.filter(a => a.type === 'logo');
  const colors = assets.filter(a => a.type === 'color');
  const fonts = assets.filter(a => a.type === 'font');

  return (
    <main className="min-h-screen w-full max-w-6xl mx-auto px-4 py-10 space-y-10">
      <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Brand Assets Admin</h1>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Upload logos and icons, define colours and fonts for designers to use across the brand.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Brand</span>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
            >
              <option value="find">Find.co</option>
              <option value="webopedia" disabled>Webopedia (coming soon)</option>
              <option value="ccn" disabled>CCN (coming soon)</option>
              <option value="cryptomaniaks" disabled>CryptoManiaks (coming soon)</option>
            </select>
          </div>
          <Link href={`/brand-assets?brand=${encodeURIComponent(selectedBrand)}`}>
            <Button variant="outline" size="sm">
              View brand assets page
            </Button>
          </Link>
        </div>
      </header>

      {error && (
        <p className="text-sm text-red-400">{error}</p>
      )}

      {/* Upload logos / icons / project logos */}
      <section className="space-y-4 border border-border rounded-lg p-4 bg-card/60">
        <h2 className="text-lg font-semibold text-white">File assets (logos, icons, project logos)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              Asset type
            </label>
            <select
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
              value={uploadType}
              onChange={e => setUploadType(e.target.value as BrandAssetType)}
            >
              <option value="logo">Logo</option>
              <option value="icon">Icon</option>
              <option value="project-logo">Project logo</option>
              <option value="color" disabled>Colour (use colour form below)</option>
              <option value="font" disabled>Font (coming later)</option>
            </select>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Name
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={assetName}
                onChange={e => setAssetName(e.target.value)}
                placeholder="e.g. Webo logo – full colour horizontal"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Description
              </label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground min-h-[60px]"
                value={assetDescription}
                onChange={e => setAssetDescription(e.target.value)}
                placeholder="Optional: when and where to use this asset"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Tags
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={assetTags}
                onChange={e => setAssetTags(e.target.value)}
                placeholder="Comma-separated, e.g. dark, horizontal, mono"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Variants
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={assetVariants}
                onChange={e => setAssetVariants(e.target.value)}
                placeholder="Comma-separated, e.g. full-colour, mono"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-xs font-medium text-muted-foreground mb-1">
              File
            </label>
            <div
              {...getRootProps()}
              className={`flex items-center justify-center border border-dashed rounded-md px-4 py-8 text-sm cursor-pointer ${
                isDragActive ? 'border-white/60 bg-white/5' : 'border-border'
              }`}
            >
              <input {...getInputProps()} />
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Upload className="h-5 w-5" />
                {selectedFile ? (
                  <span>{selectedFile.name}</span>
                ) : (
                  <span>Drag &amp; drop or click to select an image</span>
                )}
              </div>
            </div>

            <Button
              type="button"
              onClick={handleFileUpload}
              disabled={!selectedFile || uploading}
              className="mt-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Uploading…
                </>
              ) : (
                'Upload asset'
              )}
            </Button>
          </div>
        </div>
      </section>

      {/* Font assets */}
      <section className="space-y-4 border border-border rounded-lg p-4 bg-card/60">
        <h2 className="text-lg font-semibold text-white">Fonts</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Font form */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Font name
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={fontName}
                onChange={(e) => setFontName(e.target.value)}
                placeholder="e.g. Space Grotesk"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Intended use
              </label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground min-h-[60px]"
                value={fontUsage}
                onChange={(e) => setFontUsage(e.target.value)}
                placeholder="e.g. Headlines, body copy, captions"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Google Fonts URL
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={fontGoogleUrl}
                onChange={(e) => setFontGoogleUrl(e.target.value)}
                placeholder="https://fonts.google.com/specimen/Space+Grotesk"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Download URL (optional)
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={fontDownloadUrl}
                onChange={(e) => setFontDownloadUrl(e.target.value)}
                placeholder="Link to zipped font files (if available)"
              />
            </div>
            <Button
              type="button"
              onClick={handleCreateFont}
              disabled={!fontName.trim() || uploading}
            >
              Add font
            </Button>
          </div>

          {/* Existing fonts */}
          <div className="md:col-span-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Existing fonts for this brand
            </p>
            {fonts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No fonts defined yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {fonts.map((font) => (
                  <div
                    key={font.id}
                    className="border border-border rounded-md p-3 bg-background/40 flex flex-col gap-2"
                  >
                    <p className="text-sm font-medium text-white">{font.name}</p>
                    {font.usage && (
                      <p className="text-xs text-muted-foreground line-clamp-3">
                        {font.usage}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2 mt-1">
                      {font.googleFontUrl && (
                        <Button asChild size="sm" variant="outline">
                          <a href={font.googleFontUrl} target="_blank" rel="noreferrer">
                            Google Fonts
                          </a>
                        </Button>
                      )}
                      {font.downloadUrl && (
                        <Button asChild size="sm">
                          <a href={font.downloadUrl} download>
                            Download
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Colour assets */}
      <section className="space-y-4 border border-border rounded-lg p-4 bg-card/60">
        <h2 className="text-lg font-semibold text-white">Colours</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Name
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={colorName}
                onChange={e => setColorName(e.target.value)}
                placeholder="e.g. Brand lilac"
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Hex
              </label>
              <input
                type="color"
                className="h-9 w-16 rounded-md border border-input bg-background p-1"
                value={colorHex}
                onChange={e => setColorHex(e.target.value)}
              />
              <input
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={colorHex}
                onChange={e => setColorHex(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Usage
              </label>
              <textarea
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground min-h-[60px]"
                value={colorUsage}
                onChange={e => setColorUsage(e.target.value)}
                placeholder="Optional: where to use this colour"
              />
            </div>
            <Button
              type="button"
              onClick={handleCreateColor}
              disabled={!colorName.trim() || !colorHex.trim() || uploading}
            >
              Add colour
            </Button>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Existing colours
            </p>
            {colors.length === 0 ? (
              <p className="text-xs text-muted-foreground">No colours defined yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {colors.map(color => (
                  <div key={color.id} className="border border-border rounded-md p-2 flex flex-col gap-2 bg-background/40">
                    <div className="h-10 w-full rounded-sm" style={{ backgroundColor: color.hex || '#000000' }} />
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-white">{color.name}</p>
                      <p className="text-[11px] text-muted-foreground">{color.hex}</p>
                      {color.usage && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">{color.usage}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Simple overview of latest logos */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Latest logos</h2>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : logos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No logos uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {logos.slice(0, 6).map(logo => (
              <div key={logo.id} className="border border-border rounded-md p-2 bg-background/40 flex flex-col gap-2">
                {logo.publicUrl && (
                  <div className="relative w-full aspect-video bg-muted/20 rounded-sm overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logo.publicUrl}
                      alt={logo.name}
                      className="max-h-full max-w-full object-contain"
                    />
                  </div>
                )}
                <p className="text-xs font-medium text-white truncate">{logo.name}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}


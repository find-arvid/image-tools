'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Loader2, Pencil, Trash2, GripVertical } from 'lucide-react';
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
  const [colorCategory, setColorCategory] = useState<'primary' | 'secondary'>('primary');
  const [editingColorId, setEditingColorId] = useState<string | null>(null);
  const [colorToDelete, setColorToDelete] = useState<BrandAsset | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [orderedColors, setOrderedColors] = useState<BrandAsset[]>([]);
  const [draggedColorId, setDraggedColorId] = useState<string | null>(null);
  const [dragOverColorId, setDragOverColorId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  // Font form
  const [fontName, setFontName] = useState('');
  const [fontUsage, setFontUsage] = useState('');
  const [fontGoogleUrl, setFontGoogleUrl] = useState('');
  const [fontDownloadUrl, setFontDownloadUrl] = useState('');
  const [editingFontId, setEditingFontId] = useState<string | null>(null);
  const [fontToDelete, setFontToDelete] = useState<BrandAsset | null>(null);
  const [isDeletingFont, setIsDeletingFont] = useState(false);
  const [orderedFonts, setOrderedFonts] = useState<BrandAsset[]>([]);
  const [draggedFontId, setDraggedFontId] = useState<string | null>(null);
  const [dragOverFontId, setDragOverFontId] = useState<string | null>(null);
  const [savingFontOrder, setSavingFontOrder] = useState(false);
  // Logo editing
  const [logoToEdit, setLogoToEdit] = useState<BrandAsset | null>(null);
  const [logoEditName, setLogoEditName] = useState('');
  const [logoEditDescription, setLogoEditDescription] = useState('');
  const [logoEditTags, setLogoEditTags] = useState('');
  const [logoEditVariants, setLogoEditVariants] = useState('');
  const [savingLogoEdit, setSavingLogoEdit] = useState(false);

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

  // Always jump to top when opening this page
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, []);

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

  // Sync ordered colors when assets load
  useEffect(() => {
    const cols = assets
      .filter((a): a is BrandAsset => a.type === 'color')
      .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
    setOrderedColors(cols);
  }, [assets]);

  // Sync ordered fonts when assets load
  useEffect(() => {
    const fnts = assets
      .filter((a): a is BrandAsset => a.type === 'font')
      .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
    setOrderedFonts(fnts);
  }, [assets]);

  // Populate colour form when editing
  useEffect(() => {
    if (editingColorId) {
      const color = assets.find(a => a.type === 'color' && a.id === editingColorId);
      if (color) {
        setColorName(color.name);
        setColorHex(color.hex || '#000000');
        setColorUsage(color.usage || '');
        setColorCategory(color.colorCategory || 'primary');
      }
    } else {
      setColorName('');
      setColorHex('#cfe02d');
      setColorUsage('');
      setColorCategory('primary');
    }
  }, [editingColorId, assets]);

  // Populate logo edit form when editing
  useEffect(() => {
    if (logoToEdit) {
      setLogoEditName(logoToEdit.name);
      setLogoEditDescription(logoToEdit.description || '');
      setLogoEditTags((logoToEdit.tags || []).join(', '));
      setLogoEditVariants((logoToEdit.variants || []).join(', '));
    } else {
      setLogoEditName('');
      setLogoEditDescription('');
      setLogoEditTags('');
      setLogoEditVariants('');
    }
  }, [logoToEdit]);

  // Populate font form when editing
  useEffect(() => {
    if (editingFontId) {
      const font = assets.find(a => a.type === 'font' && a.id === editingFontId);
      if (font) {
        setFontName(font.name);
        setFontUsage(font.usage || '');
        setFontGoogleUrl(font.googleFontUrl || '');
        setFontDownloadUrl(font.downloadUrl || '');
      }
    } else {
      setFontName('');
      setFontUsage('');
      setFontGoogleUrl('');
      setFontDownloadUrl('');
    }
  }, [editingFontId, assets]);

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

      const payload = {
        name: colorName.trim(),
        hex: colorHex.trim(),
        usage: colorUsage.trim() || undefined,
        colorCategory,
      };

      const res = editingColorId
        ? await fetch(`/api/brand-assets/${editingColorId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/brand-assets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              type: 'color',
              brand: selectedBrand,
              ...payload,
            }),
          });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.details || `Failed to ${editingColorId ? 'update' : 'create'} colour: ${res.status}`);
      }

      await loadAssets();
      setColorName('');
      setColorUsage('');
      setEditingColorId(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : `Failed to ${editingColorId ? 'update' : 'create'} colour`);
    } finally {
      setUploading(false);
    }
  };

  const handleColorDragStart = (e: React.DragEvent, id: string) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setDraggedColorId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleColorDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverColorId(id);
  };

  const handleColorDragLeave = () => {
    setDragOverColorId(null);
  };

  const handleColorDrop = (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    setDragOverColorId(null);
    if (!draggedColorId || draggedColorId === dropId) return;
    const from = orderedColors.findIndex((c) => c.id === draggedColorId);
    const to = orderedColors.findIndex((c) => c.id === dropId);
    if (from === -1 || to === -1) return;
    const item = orderedColors[from];
    const newArr = orderedColors.filter((_, i) => i !== from);
    const insertAt = from < to ? to - 1 : to;
    newArr.splice(insertAt, 0, item);
    setOrderedColors(newArr);
  };

  const handleColorDragEnd = async () => {
    if (!draggedColorId) return;
    setDraggedColorId(null);
    const prevOrdered = assets
      .filter((a): a is BrandAsset => a.type === 'color')
      .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
    const orderChanged =
      orderedColors.length !== prevOrdered.length ||
      orderedColors.some((c, i) => c.id !== prevOrdered[i]?.id);
    if (!orderChanged) return;
    setSavingOrder(true);
    setError(null);
    try {
      await Promise.all(
        orderedColors.map((c, index) =>
          fetch(`/api/brand-assets/${c.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: index }),
          })
        )
      );
      await loadAssets();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save order');
    } finally {
      setSavingOrder(false);
    }
  };

  const handleFontDragStart = (e: React.DragEvent, id: string) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setDraggedFontId(id);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', id);
  };

  const handleFontDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverFontId(id);
  };

  const handleFontDragLeave = () => {
    setDragOverFontId(null);
  };

  const handleFontDrop = (e: React.DragEvent, dropId: string) => {
    e.preventDefault();
    setDragOverFontId(null);
    if (!draggedFontId || draggedFontId === dropId) return;
    const from = orderedFonts.findIndex((f) => f.id === draggedFontId);
    const to = orderedFonts.findIndex((f) => f.id === dropId);
    if (from === -1 || to === -1) return;
    const item = orderedFonts[from];
    const newArr = orderedFonts.filter((_, i) => i !== from);
    const insertAt = from < to ? to - 1 : to;
    newArr.splice(insertAt, 0, item);
    setOrderedFonts(newArr);
  };

  const handleFontDragEnd = async () => {
    if (!draggedFontId) return;
    setDraggedFontId(null);
    const prevOrdered = assets
      .filter((a): a is BrandAsset => a.type === 'font')
      .sort((a, b) => (a.order ?? 999999) - (b.order ?? 999999));
    const orderChanged =
      orderedFonts.length !== prevOrdered.length ||
      orderedFonts.some((f, i) => f.id !== prevOrdered[i]?.id);
    if (!orderChanged) return;
    setSavingFontOrder(true);
    setError(null);
    try {
      await Promise.all(
        orderedFonts.map((f, index) =>
          fetch(`/api/brand-assets/${f.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ order: index }),
          })
        )
      );
      await loadAssets();
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to save font order');
    } finally {
      setSavingFontOrder(false);
    }
  };

  const handleDeleteColor = async () => {
    if (!colorToDelete) return;
    try {
      setIsDeleting(true);
      setError(null);
      const res = await fetch(`/api/brand-assets/${colorToDelete.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.details || `Delete failed: ${res.status}`);
      }
      await loadAssets();
      setColorToDelete(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to delete colour');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteFont = async () => {
    if (!fontToDelete) return;
    try {
      setIsDeletingFont(true);
      setError(null);
      const res = await fetch(`/api/brand-assets/${fontToDelete.id}`, { method: 'DELETE' });
      if (!res.ok && res.status !== 404) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || body.details || `Delete failed: ${res.status}`);
      }
      await loadAssets();
      setFontToDelete(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to delete font');
    } finally {
      setIsDeletingFont(false);
    }
  };

  const handleCreateFont = async () => {
    if (!fontName.trim()) return;

    try {
      setUploading(true);
      setError(null);

      const payload = {
        name: fontName.trim(),
        usage: fontUsage.trim() || undefined,
        googleFontUrl: fontGoogleUrl.trim() || undefined,
        downloadUrl: fontDownloadUrl.trim() || undefined,
      };

      const res = editingFontId
        ? await fetch(`/api/brand-assets/${editingFontId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/brand-assets', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'font',
              brand: selectedBrand,
              ...payload,
            }),
          });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          body.error ||
            body.details ||
            `Failed to ${editingFontId ? 'update' : 'create'} font: ${res.status}`,
        );
      }

      await loadAssets();

      setEditingFontId(null);
      setFontName('');
      setFontUsage('');
      setFontGoogleUrl('');
      setFontDownloadUrl('');
    } catch (err) {
      console.error(err);
      setError(
        err instanceof Error
          ? err.message
          : `Failed to ${editingFontId ? 'update' : 'create'} font`,
      );
    } finally {
      setUploading(false);
    }
  };

  const logos = assets.filter(a => a.type === 'logo');
  const colors = assets.filter(a => a.type === 'color');
  const fonts = assets.filter(a => a.type === 'font');
  const allTags = Array.from(
    new Set(
      logos.flatMap(logo => Array.isArray(logo.tags) ? logo.tags : (typeof logo.tags === 'string' ? logo.tags.split(',') : []))
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0),
    ),
  ).sort((a, b) => a.localeCompare(b));

  const handleSaveLogoEdit = async () => {
    if (!logoToEdit) return;

    const trimmedName = logoEditName.trim();
    if (!trimmedName) {
      alert('Please enter a name for the logo.');
      return;
    }

    setSavingLogoEdit(true);
    try {
      const tagsArray = logoEditTags
        ? logoEditTags.split(',').map(t => t.trim()).filter(Boolean)
        : [];
      const variantsArray = logoEditVariants
        ? logoEditVariants.split(',').map(v => v.trim()).filter(Boolean)
        : [];

      const res = await fetch(`/api/brand-assets/${logoToEdit.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: trimmedName,
          description: logoEditDescription.trim() || undefined,
          tags: tagsArray,
          variants: variantsArray,
        }),
      });

      if (!res.ok) {
        console.error('Failed to update logo metadata', await res.text());
        alert('Failed to update logo details. Please try again.');
        return;
      }

      await loadAssets();
      setLogoToEdit(null);
    } catch (err) {
      console.error('Error updating logo metadata', err);
      alert('Something went wrong while updating the logo.');
    } finally {
      setSavingLogoEdit(false);
    }
  };

  const toggleTagInInput = (tag: string) => {
    const current = assetTags
      .split(',')
      .map(t => t.trim())
      .filter(t => t.length > 0);
    const exists = current.includes(tag);
    const next = exists ? current.filter(t => t !== tag) : [...current, tag];
    setAssetTags(next.join(', '));
  };

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
              {allTags.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {allTags.map(tag => {
                    const current = assetTags
                      .split(',')
                      .map(t => t.trim())
                      .filter(t => t.length > 0);
                    const active = current.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTagInInput(tag)}
                        className={`text-[11px] px-2 py-0.5 rounded-full border transition-colors ${
                          active
                            ? 'bg-white text-black border-white'
                            : 'bg-muted/40 text-muted-foreground border-border hover:bg-muted/60'
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              )}
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
                Font reference URL
              </label>
              <input
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={fontGoogleUrl}
                onChange={(e) => setFontGoogleUrl(e.target.value)}
                placeholder="Link to font page or spec"
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
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleCreateFont}
                disabled={!fontName.trim() || uploading}
              >
                {editingFontId ? 'Save changes' : 'Add font'}
              </Button>
              {editingFontId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingFontId(null)}
                  disabled={uploading}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          {/* Existing fonts */}
          <div className="md:col-span-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Existing fonts — drag to reorder
            </p>
            {orderedFonts.length === 0 ? (
              <p className="text-xs text-muted-foreground">No fonts defined yet.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {orderedFonts.map((font) => (
                  <div
                    key={font.id}
                    draggable
                    onDragStart={(e) => handleFontDragStart(e, font.id)}
                    onDragOver={(e) => handleFontDragOver(e, font.id)}
                    onDragLeave={handleFontDragLeave}
                    onDrop={(e) => handleFontDrop(e, font.id)}
                    onDragEnd={handleFontDragEnd}
                    className={`border border-border rounded-md p-3 bg-background/40 flex flex-col gap-2 cursor-grab active:cursor-grabbing transition-shadow ${
                      draggedFontId === font.id ? 'opacity-50' : ''
                    } ${dragOverFontId === font.id ? 'ring-2 ring-primary/50' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                      <div className="flex-1 h-8 rounded-sm bg-muted/10 flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">Aa</span>
                      </div>
                    </div>
                    <div className="space-y-1 mt-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-white">{font.name}</p>
                          {font.usage && (
                            <p className="text-xs text-muted-foreground line-clamp-3">
                              {font.usage}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2"
                            onClick={() => setEditingFontId(font.id)}
                            disabled={!!fontToDelete}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-destructive hover:text-destructive"
                            onClick={() => setFontToDelete(font)}
                            disabled={!!editingFontId}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {font.googleFontUrl && (
                        <Button asChild size="sm" variant="outline">
                          <a href={font.googleFontUrl} target="_blank" rel="noreferrer">
                            Open link
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
            {savingFontOrder && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving font order…
              </p>
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
            <div className="space-y-1">
              <label className="block text-xs font-medium text-muted-foreground mb-1">
                Category
              </label>
              <select
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                value={colorCategory}
                onChange={(e) => setColorCategory(e.target.value as 'primary' | 'secondary')}
              >
                <option value="primary">Primary</option>
                <option value="secondary">Secondary</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                onClick={handleCreateColor}
                disabled={!colorName.trim() || !colorHex.trim() || uploading}
              >
                {editingColorId ? 'Save changes' : 'Add colour'}
              </Button>
              {editingColorId && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setEditingColorId(null)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>

          <div className="md:col-span-2 space-y-3">
            <p className="text-xs text-muted-foreground">
              Existing colours — drag to reorder
            </p>
            {orderedColors.length === 0 ? (
              <p className="text-xs text-muted-foreground">No colours defined yet.</p>
            ) : (
              <div className="space-y-4">
                {(() => {
                  const primary = orderedColors.filter(
                    (c) => (c.colorCategory || 'primary') === 'primary'
                  );
                  const secondary = orderedColors.filter(
                    (c) => (c.colorCategory || 'primary') === 'secondary'
                  );

                  const renderGrid = (items: BrandAsset[]) => (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {items.map((color) => (
                        <div
                          key={color.id}
                          draggable
                          onDragStart={(e) => handleColorDragStart(e, color.id)}
                          onDragOver={(e) => handleColorDragOver(e, color.id)}
                          onDragLeave={handleColorDragLeave}
                          onDrop={(e) => handleColorDrop(e, color.id)}
                          onDragEnd={handleColorDragEnd}
                          className={`border rounded-md p-2 flex flex-col gap-2 bg-background/40 cursor-grab active:cursor-grabbing transition-shadow ${
                            editingColorId === color.id ? 'border-primary ring-1 ring-primary' : 'border-border'
                          } ${draggedColorId === color.id ? 'opacity-50' : ''} ${
                            dragOverColorId === color.id ? 'ring-2 ring-primary/50' : ''
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div
                              className="h-10 flex-1 rounded-sm"
                              style={{ backgroundColor: color.hex || '#000000' }}
                            />
                          </div>
                          <div className="space-y-0.5">
                            <div className="flex items-center justify-between gap-1">
                              <p className="text-xs font-medium text-white">{color.name}</p>
                              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                                {(color.colorCategory || 'primary') === 'primary' ? 'Primary' : 'Secondary'}
                              </span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{color.hex}</p>
                            {color.usage && (
                              <p className="text-[11px] text-muted-foreground line-clamp-2">
                                {color.usage}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1 mt-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2"
                              onClick={() => setEditingColorId(color.id)}
                              disabled={!!editingColorId && editingColorId !== color.id}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-destructive hover:text-destructive"
                              onClick={() => setColorToDelete(color)}
                              disabled={!!editingColorId}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  );

                  return (
                    <>
                      {primary.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-white/80">Primary</p>
                          {renderGrid(primary)}
                        </div>
                      )}
                      {secondary.length > 0 && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-white/80">Secondary</p>
                          {renderGrid(secondary)}
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}
            {savingOrder && (
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving order…
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Delete colour confirmation modal */}
      {colorToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold">Delete colour</h3>
            <p className="text-muted-foreground">
              Are you sure you want to delete <span className="font-medium">{colorToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setColorToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteColor}
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete font confirmation modal */}
      {fontToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full space-y-4">
            <h3 className="text-lg font-semibold">Delete font</h3>
            <p className="text-muted-foreground">
              Are you sure you want to delete <span className="font-medium">{fontToDelete.name}</span>? This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setFontToDelete(null)}
                disabled={isDeletingFont}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteFont}
                disabled={isDeletingFont}
              >
                {isDeletingFont ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Simple overview of latest logos */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Latest logos</h2>
          <p className="text-xs text-muted-foreground">
            Click edit to change logo name, description or tags.
          </p>
        </div>
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : logos.length === 0 ? (
          <p className="text-sm text-muted-foreground">No logos uploaded yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {logos.slice(0, 6).map(logo => (
                <div
                  key={logo.id}
                  className="border border-border rounded-md p-2 bg-background/40 flex flex-col gap-2"
                >
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
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <p className="text-xs font-medium text-white truncate">{logo.name}</p>
                      {logo.description && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2">
                          {logo.description}
                        </p>
                      )}
                      {logo.tags && logo.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {logo.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-7 px-2"
                      onClick={() => setLogoToEdit(logo)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {logoToEdit && (
              <div className="mt-4 border border-border rounded-lg bg-card/70 p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h3 className="text-sm font-semibold text-white">
                      Edit logo details
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Updating text only – the file stays the same.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setLogoToEdit(null)}
                  >
                    Cancel
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Name
                      </label>
                      <input
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                        value={logoEditName}
                        onChange={e => setLogoEditName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Description
                      </label>
                      <textarea
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground min-h-[60px]"
                        value={logoEditDescription}
                        onChange={e => setLogoEditDescription(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Tags
                      </label>
                      <input
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                        value={logoEditTags}
                        onChange={e => setLogoEditTags(e.target.value)}
                        placeholder="Comma-separated, e.g. dark, horizontal, mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">
                        Variants
                      </label>
                      <input
                        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                        value={logoEditVariants}
                        onChange={e => setLogoEditVariants(e.target.value)}
                        placeholder="Comma-separated, e.g. full-colour, mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setLogoToEdit(null)}
                    disabled={savingLogoEdit}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleSaveLogoEdit}
                    disabled={savingLogoEdit}
                  >
                    {savingLogoEdit ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving…
                      </>
                    ) : (
                      'Save changes'
                    )}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </main>
  );
}


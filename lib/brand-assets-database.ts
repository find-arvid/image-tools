/**
 * Database schema and helper functions for brand assets
 * Reuses the same Upstash Redis pattern as image-database.ts
 */

import { Redis } from '@upstash/redis';

// Brand asset types
export type BrandAssetType = 'logo' | 'color' | 'font' | 'icon' | 'project-logo' | 'menu-logo';

export interface BrandAsset {
  id: string;
  type: BrandAssetType;
  name: string;
  description?: string;

  // Brand identifier (e.g. find, webopedia, ccn, cryptomaniaks)
  // Default brand is 'find' when not specified.
  brand?: string;

  // File-based assets (logos, icons, project logos, optional font packages)
  r2Key?: string;
  publicUrl?: string;
  format?: string; // e.g. svg, png, webp
  variants?: string[]; // e.g. ['horizontal', 'stacked', 'mono']

  // Color assets
  hex?: string; // #RRGGBB
  rgb?: string; // e.g. "207, 224, 45"
  usage?: string; // short usage description

  // Colour categorisation
  colorCategory?: 'primary' | 'secondary';

  // Font assets
  googleFontUrl?: string;
  downloadR2Key?: string;
  downloadUrl?: string;
  weights?: string[];
  previewImageUrl?: string; // Sample/preview image for font cards

  // Generic metadata
  tags?: string[];
  fileSizeBytes?: number;
  width?: number;
  height?: number;
  order?: number; // Display order (lower = first)
  createdAt: number;
  updatedAt: number;
}

function getRedisClient(): Redis | null {
  const url =
    process.env.KV_REST_API_URL ||
    process.env.UPSTASH_REDIS_REST_URL ||
    process.env.UPSTASH_REST_API_URL;

  const token =
    process.env.KV_REST_API_TOKEN ||
    process.env.UPSTASH_REDIS_REST_TOKEN ||
    process.env.UPSTASH_REST_API_TOKEN;

  if (!url || !token) {
    return null;
  }

  try {
    return new Redis({ url, token });
  } catch (error) {
    console.error('Failed to create Redis client (brand assets):', error);
    return null;
  }
}

const ASSET_KEY_PREFIX = 'brand:asset:';

function getAssetKey(id: string): string {
  return `${ASSET_KEY_PREFIX}${id}`;
}

/**
 * Save or update a brand asset
 */
export async function saveBrandAsset(asset: BrandAsset): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error('Redis not configured for brand assets');
  }

  try {
    const key = getAssetKey(asset.id);

    await redis.hset(key, {
      id: asset.id,
      type: asset.type,
      name: asset.name,
      description: asset.description || '',
      brand: asset.brand || 'find',
      r2Key: asset.r2Key || '',
      publicUrl: asset.publicUrl || '',
      format: asset.format || '',
      variants: asset.variants ? JSON.stringify(asset.variants) : '[]',
      hex: asset.hex || '',
      rgb: asset.rgb || '',
      usage: asset.usage || '',
      colorCategory: asset.colorCategory || '',
      googleFontUrl: asset.googleFontUrl || '',
      downloadR2Key: asset.downloadR2Key || '',
      downloadUrl: asset.downloadUrl || '',
      weights: asset.weights ? JSON.stringify(asset.weights) : '[]',
      previewImageUrl: asset.previewImageUrl || '',
      tags: asset.tags ? JSON.stringify(asset.tags) : '[]',
      fileSizeBytes: asset.fileSizeBytes ?? 0,
      width: asset.width ?? 0,
      height: asset.height ?? 0,
      order: asset.order ?? 0,
      createdAt: asset.createdAt,
      updatedAt: asset.updatedAt,
    });

    // Indexes
    await redis.sadd(`brand:assets:type:${asset.type}`, asset.id);
    await redis.sadd('brand:assets:all', asset.id);

    if (asset.tags && asset.tags.length > 0) {
      for (const tag of asset.tags) {
        const tagKey = tag.toLowerCase().trim();
        if (tagKey) {
          await redis.sadd(`brand:assets:tag:${tagKey}`, asset.id);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error saving brand asset:', error);
    throw error;
  }
}

/**
 * Hydrate a BrandAsset from a Redis hash
 */
function mapHashToBrandAsset(data: Record<string, unknown> | null): BrandAsset | null {
  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  const parseJsonArray = (value: unknown): string[] => {
    if (!value) return [];
    try {
      const parsed = JSON.parse(String(value));
      return Array.isArray(parsed) ? (parsed as string[]) : [];
    } catch {
      return [];
    }
  };

  return {
    id: String(data.id),
    type: data.type as BrandAssetType,
    name: String(data.name),
    description: (data.description as string) || undefined,
    brand: (data.brand as string) || 'find',
    r2Key: (data.r2Key as string) || undefined,
    publicUrl: (data.publicUrl as string) || undefined,
    format: (data.format as string) || undefined,
    variants: parseJsonArray(data.variants),
    hex: (data.hex as string) || undefined,
    rgb: (data.rgb as string) || undefined,
    usage: (data.usage as string) || undefined,
    colorCategory: (data.colorCategory as 'primary' | 'secondary') || undefined,
    googleFontUrl: (data.googleFontUrl as string) || undefined,
    downloadR2Key: (data.downloadR2Key as string) || undefined,
    downloadUrl: (data.downloadUrl as string) || undefined,
    weights: parseJsonArray(data.weights),
    previewImageUrl: (data.previewImageUrl as string) || undefined,
    tags: parseJsonArray(data.tags),
    fileSizeBytes: data.fileSizeBytes ? Number(data.fileSizeBytes) : undefined,
    width: data.width ? Number(data.width) : undefined,
    height: data.height ? Number(data.height) : undefined,
    order: data.order !== undefined ? Number(data.order) : undefined,
    createdAt: Number(data.createdAt ?? Date.now()),
    updatedAt: Number(data.updatedAt ?? Date.now()),
  };
}

export async function getBrandAsset(id: string): Promise<BrandAsset | null> {
  const redis = getRedisClient();
  if (!redis) {
    console.error('Redis client not available in getBrandAsset');
    return null;
  }

  try {
    const key = getAssetKey(id);
    const data = await redis.hgetall(key);
    return mapHashToBrandAsset(data);
  } catch (error) {
    console.error('Error fetching brand asset:', error);
    return null;
  }
}

export async function getBrandAssetsByType(type: BrandAssetType): Promise<BrandAsset[]> {
  const redis = getRedisClient();
  if (!redis) {
    return [];
  }

  try {
    const ids = await redis.smembers<string[]>(`brand:assets:type:${type}`);
    if (!ids || ids.length === 0) {
      return [];
    }

    const assets = await Promise.all(ids.map(id => getBrandAsset(id)));
    return assets.filter((a): a is BrandAsset => a !== null);
  } catch (error) {
    console.error('Error fetching brand assets by type:', error);
    return [];
  }
}

export async function getAllBrandAssets(): Promise<BrandAsset[]> {
  const redis = getRedisClient();
  if (!redis) {
    return [];
  }

  try {
    const ids = await redis.smembers<string[]>('brand:assets:all');
    if (!ids || ids.length === 0) {
      return [];
    }

    const assets = await Promise.all(ids.map(id => getBrandAsset(id)));
    return assets.filter((a): a is BrandAsset => a !== null);
  } catch (error) {
    console.error('Error fetching all brand assets:', error);
    return [];
  }
}

export async function getBrandAssetsByBrand(brand: string): Promise<BrandAsset[]> {
  const all = await getAllBrandAssets();
  const brandKey = brand.toLowerCase().trim() || 'find';
  return all.filter((a) => (a.brand || 'find').toLowerCase() === brandKey);
}

export async function getBrandAssetsByBrandAndType(brand: string, type: BrandAssetType): Promise<BrandAsset[]> {
  const byType = await getBrandAssetsByType(type);
  const brandKey = brand.toLowerCase().trim() || 'find';
  return byType.filter((a) => (a.brand || 'find').toLowerCase() === brandKey);
}

export async function getBrandAssetsByTag(tag: string): Promise<BrandAsset[]> {
  const redis = getRedisClient();
  if (!redis) {
    return [];
  }

  try {
    const tagKey = tag.toLowerCase().trim();
    const ids = await redis.smembers<string[]>(`brand:assets:tag:${tagKey}`);
    if (!ids || ids.length === 0) {
      return [];
    }

    const assets = await Promise.all(ids.map(id => getBrandAsset(id)));
    return assets.filter((a): a is BrandAsset => a !== null);
  } catch (error) {
    console.error('Error fetching brand assets by tag:', error);
    return [];
  }
}

export async function deleteBrandAsset(id: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) {
    console.error('Redis client not available for deleteBrandAsset');
    return false;
  }

  try {
    const asset = await getBrandAsset(id);
    if (!asset) {
      return false;
    }

    await redis.del(getAssetKey(id));
    await redis.srem(`brand:assets:type:${asset.type}`, id);
    await redis.srem('brand:assets:all', id);

    if (asset.tags && asset.tags.length > 0) {
      for (const tag of asset.tags) {
        const tagKey = tag.toLowerCase().trim();
        if (tagKey) {
          await redis.srem(`brand:assets:tag:${tagKey}`, id);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error deleting brand asset:', error);
    return false;
  }
}


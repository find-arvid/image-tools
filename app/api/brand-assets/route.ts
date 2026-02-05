import { NextRequest, NextResponse } from 'next/server';
import {
  type BrandAsset,
  type BrandAssetType,
  saveBrandAsset,
  getBrandAsset,
  getBrandAssetsByType,
  getAllBrandAssets,
  getBrandAssetsByBrand,
  getBrandAssetsByBrandAndType,
} from '@/lib/brand-assets-database';
import { v4 as uuidv4 } from 'uuid';

/**
 * GET /api/brand-assets
 * Query params:
 *  - type?: 'logo' | 'color' | 'font' | 'icon' | 'project-logo'
 *  - id?: string
 *  - brand?: string (e.g. 'find', 'webopedia')
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const type = searchParams.get('type') as BrandAssetType | null;
    const brand = searchParams.get('brand'); // optional brand filter

    if (id) {
      const asset = await getBrandAsset(id);
      if (!asset) {
        return NextResponse.json(
          { error: 'Brand asset not found' },
          { status: 404 },
        );
      }
      return NextResponse.json({ asset });
    }

    if (type && brand) {
      const assets = await getBrandAssetsByBrandAndType(brand, type);
      return NextResponse.json({
        assets,
        count: assets.length,
      });
    }

    if (type) {
      const assets = await getBrandAssetsByType(type);
      return NextResponse.json({
        assets,
        count: assets.length,
      });
    }

    if (brand) {
      const assets = await getBrandAssetsByBrand(brand);
      return NextResponse.json({
        assets,
        count: assets.length,
      });
    }

    const assets = await getAllBrandAssets();
    return NextResponse.json({
      assets,
      count: assets.length,
    });
  } catch (error) {
    console.error('Error fetching brand assets:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch brand assets',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/brand-assets
 * Create or update non-file brand assets (e.g. colors, fonts)
 * Body: partial BrandAsset; id will be generated if missing.
 */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as Partial<BrandAsset>;

    if (!body.type || !body.name) {
      return NextResponse.json(
        { error: 'Missing required fields: type, name' },
        { status: 400 },
      );
    }

    const now = Date.now();
    const id = body.id || uuidv4();

    const asset: BrandAsset = {
      id,
      type: body.type,
      name: body.name,
      description: body.description,
      r2Key: body.r2Key,
      publicUrl: body.publicUrl,
      format: body.format,
      variants: body.variants || [],
      hex: body.hex,
      rgb: body.rgb,
      usage: body.usage,
      googleFontUrl: body.googleFontUrl,
      downloadR2Key: body.downloadR2Key,
      downloadUrl: body.downloadUrl,
      weights: body.weights || [],
      tags: body.tags || [],
      createdAt: body.createdAt ?? now,
      updatedAt: now,
    };

    await saveBrandAsset(asset);

    return NextResponse.json(
      {
        success: true,
        asset,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error saving brand asset:', error);
    return NextResponse.json(
      {
        error: 'Failed to save brand asset',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}


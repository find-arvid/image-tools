import { NextResponse } from 'next/server';
import { getBrandAssetsByBrandAndType } from '@/lib/brand-assets-database';

const BRANDS = ['find', 'webopedia', 'ccn', 'cryptomaniaks'] as const;

export type MenuLogosResponse = Record<(typeof BRANDS)[number], string | null>;

/**
 * GET /api/brand-assets/menu-logos
 * Returns the menu logo URL for each brand (used in the main nav dropdown).
 * Null when no menu logo has been uploaded for that brand.
 */
export async function GET() {
  try {
    const result: MenuLogosResponse = {
      find: null,
      webopedia: null,
      ccn: null,
      cryptomaniaks: null,
    };

    for (const brand of BRANDS) {
      const assets = await getBrandAssetsByBrandAndType(brand, 'menu-logo');
      const first = assets.sort((a, b) => (a.order ?? 999) - (b.order ?? 999))[0];
      if (first?.publicUrl) {
        result[brand] = first.publicUrl;
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching menu logos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch menu logos' },
      { status: 500 },
    );
  }
}

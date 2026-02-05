import { NextRequest, NextResponse } from 'next/server';
import {
  getBrandAsset,
  saveBrandAsset,
  deleteBrandAsset,
} from '@/lib/brand-assets-database';
import type { BrandAsset } from '@/lib/brand-assets-database';

/**
 * PATCH /api/brand-assets/[id]
 * Update a brand asset (partial update)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existing = await getBrandAsset(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Brand asset not found' },
        { status: 404 }
      );
    }

    const body = (await request.json()) as Partial<BrandAsset>;
    const now = Date.now();

    const asset: BrandAsset = {
      ...existing,
      ...body,
      id: existing.id, // never change id
      type: existing.type, // never change type
      updatedAt: now,
    };

    await saveBrandAsset(asset);

    return NextResponse.json({ success: true, asset });
  } catch (error) {
    console.error('Error updating brand asset:', error);
    return NextResponse.json(
      {
        error: 'Failed to update brand asset',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/brand-assets/[id]
 * Delete a brand asset
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deleted = await deleteBrandAsset(id);
    if (!deleted) {
      return NextResponse.json(
        { error: 'Brand asset not found' },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting brand asset:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete brand asset',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

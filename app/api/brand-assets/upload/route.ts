import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, getR2PublicUrl } from '@/lib/r2-client';
import { saveBrandAsset, getBrandAssetsByBrandAndType, deleteBrandAsset, type BrandAssetType, type BrandAsset } from '@/lib/brand-assets-database';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/brand-assets/upload
 * Handles file uploads for logo / icon / project-logo brand assets (and future file-based assets).
 *
 * Expects multipart/form-data with:
 *  - file: File (required)
 *  - type: 'logo' | 'icon' | 'project-logo' (required for now)
 *  - name: string (optional; falls back to filename without extension)
 *  - description?: string
 *  - tags?: string (comma-separated)
 *  - variants?: string (comma-separated, e.g. "horizontal,mono")
 */
export async function POST(request: NextRequest) {
  try {
    // Check R2 configuration
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      console.error('R2 configuration missing for brand-assets upload:', {
        hasAccountId: !!process.env.R2_ACCOUNT_ID,
        hasAccessKeyId: !!process.env.R2_ACCESS_KEY_ID,
        hasSecretAccessKey: !!process.env.R2_SECRET_ACCESS_KEY,
      });
      return NextResponse.json(
        { error: 'R2 configuration incomplete. Check environment variables.' },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const type = formData.get('type') as BrandAssetType | null;
    const nameFromForm = formData.get('name') as string | null;
    const description = formData.get('description') as string | null;
    const tagsRaw = formData.get('tags') as string | null;
    const variantsRaw = formData.get('variants') as string | null;
    const brandRaw = formData.get('brand') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 },
      );
    }

    if (!type || !['logo', 'icon', 'project-logo', 'menu-logo'].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "logo", "icon", "project-logo" or "menu-logo"' },
        { status: 400 },
      );
    }

    const tags = tagsRaw
      ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean)
      : [];

    const variants = variantsRaw
      ? variantsRaw.split(',').map(v => v.trim()).filter(Boolean)
      : [];
    const brand = (brandRaw || 'find').toLowerCase().trim() || 'find';

    // For menu-logo: only one per brand — remove existing menu-logos for this brand
    if (type === 'menu-logo') {
      const existing = await getBrandAssetsByBrandAndType(brand, 'menu-logo');
      for (const a of existing) {
        await deleteBrandAsset(a.id);
      }
    }

    // Generate unique ID and R2 key
    const id = uuidv4();
    const fileExtension = (file.name.split('.').pop() || 'png').toLowerCase();
    const safeExt = fileExtension === 'svg' ? 'svg' : fileExtension;
    const r2Key = type === 'menu-logo'
      ? `brand-assets/menu-logos/${brand}-${id}.${safeExt}`
      : `brand-assets/${type}s/${id}.${safeExt}`;

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to R2
    try {
      const uploadCommand = new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        Body: buffer,
        ContentType: file.type || `image/${safeExt}`,
      });

      await r2Client.send(uploadCommand);
      console.log('Successfully uploaded brand asset to R2:', r2Key);
    } catch (r2Error) {
      console.error('R2 upload error (brand asset):', r2Error);
      throw new Error(
        `Failed to upload brand asset to R2: ${
          r2Error instanceof Error ? r2Error.message : 'Unknown error'
        }`,
      );
    }

    // Get public URL
    let publicUrl: string;
    try {
      publicUrl = getR2PublicUrl(r2Key);
    } catch (urlError) {
      console.error('Failed to generate public URL for brand asset:', urlError);
      throw new Error(
        `Failed to generate public URL: ${
          urlError instanceof Error ? urlError.message : 'Unknown error'
        }`,
      );
    }

    const now = Date.now();
    const baseName = file.name.replace(/\.[^/.]+$/, '');
    const name = nameFromForm?.trim() || baseName;

    const asset: BrandAsset = {
      id,
      type,
      name,
      description: description || undefined,
      r2Key,
      publicUrl,
      format: safeExt,
      variants,
      tags,
      fileSizeBytes: file.size,
      brand,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await saveBrandAsset(asset);
      console.log('Successfully saved brand asset metadata:', id);
    } catch (redisError) {
      console.error('Redis save error (brand asset):', redisError);
      // File is already uploaded; still return success but flag metadata issue
      return NextResponse.json(
        {
          success: true,
          asset,
          warning: 'File uploaded but failed to save metadata to Redis',
        },
        { status: 201 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        asset,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error uploading brand asset:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;

    return NextResponse.json(
      {
        error: 'Failed to upload brand asset',
        details: errorMessage,
        ...(process.env.NODE_ENV === 'development' && { stack: errorStack }),
      },
      { status: 500 },
    );
  }
}


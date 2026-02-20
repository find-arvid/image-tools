import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, getR2PublicUrl } from '@/lib/r2-client';
import { saveBrandAsset, getBrandAssetsByType, type BrandAsset } from '@/lib/brand-assets-database';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/brand-assets/logo-version
 * Create a logo version with name, description, and two files: PNG and SVG.
 * Expects multipart/form-data: name, description (optional), png (file), svg (file).
 */
export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.R2_ACCOUNT_ID ||
      !process.env.R2_ACCESS_KEY_ID ||
      !process.env.R2_SECRET_ACCESS_KEY
    ) {
      return NextResponse.json(
        { error: 'R2 configuration incomplete. Check environment variables.' },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const name = (formData.get('name') as string | null)?.trim();
    const description = (formData.get('description') as string | null)?.trim() || undefined;
    const brand = ((formData.get('brand') as string | null) || 'find').toLowerCase().trim() || 'find';
    const pngFile = formData.get('png') as File | null;
    const svgFile = formData.get('svg') as File | null;

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }
    if (!pngFile || !(pngFile instanceof File) || pngFile.size === 0) {
      return NextResponse.json({ error: 'PNG file is required' }, { status: 400 });
    }
    if (!svgFile || !(svgFile instanceof File) || svgFile.size === 0) {
      return NextResponse.json({ error: 'SVG file is required' }, { status: 400 });
    }

    const pngExt = (pngFile.name.split('.').pop() || 'png').toLowerCase();
    const svgExt = (svgFile.name.split('.').pop() || 'svg').toLowerCase();
    if (pngExt !== 'png') {
      return NextResponse.json({ error: 'PNG file must have .png extension' }, { status: 400 });
    }
    if (svgExt !== 'svg') {
      return NextResponse.json({ error: 'SVG file must have .svg extension' }, { status: 400 });
    }

    const id = uuidv4();
    const pngR2Key = `brand-assets/logo-versions/${id}.png`;
    const svgR2Key = `brand-assets/logo-versions/${id}.svg`;

    const pngBuffer = Buffer.from(await pngFile.arrayBuffer());
    const svgBuffer = Buffer.from(await svgFile.arrayBuffer());

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: pngR2Key,
        Body: pngBuffer,
        ContentType: pngFile.type || 'image/png',
      }),
    );
    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: svgR2Key,
        Body: svgBuffer,
        ContentType: svgFile.type || 'image/svg+xml',
      }),
    );

    const pngPublicUrl = getR2PublicUrl(pngR2Key);
    const svgPublicUrl = getR2PublicUrl(svgR2Key);

    const existingLogos = await getBrandAssetsByType('logo-version');
    const maxOrder = existingLogos.reduce(
      (max, a) => Math.max(max, a.order ?? 0),
      0,
    );

    const now = Date.now();
    const asset: BrandAsset = {
      id,
      type: 'logo-version',
      name,
      description,
      brand,
      pngR2Key,
      pngPublicUrl,
      pngFileSizeBytes: pngFile.size,
      svgR2Key,
      svgPublicUrl,
      svgFileSizeBytes: svgFile.size,
      order: maxOrder + 1,
      createdAt: now,
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
    console.error('Error creating logo version:', error);
    return NextResponse.json(
      {
        error: 'Failed to create logo version',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

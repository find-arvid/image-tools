import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME, getR2PublicUrl } from '@/lib/r2-client';
import { v4 as uuidv4 } from 'uuid';

/**
 * POST /api/brand-assets/upload-font-preview
 * Upload a font preview/sample image. Returns public URL to store on the font asset.
 * Body: multipart/form-data with "file" (image)
 */
export async function POST(request: NextRequest) {
  try {
    if (!process.env.R2_ACCOUNT_ID || !process.env.R2_ACCESS_KEY_ID || !process.env.R2_SECRET_ACCESS_KEY) {
      return NextResponse.json(
        { error: 'R2 configuration missing' },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 },
      );
    }

    const fileExtension = (file.name.split('.').pop() || 'png').toLowerCase();
    const safeExt = ['png', 'jpg', 'jpeg', 'webp', 'gif'].includes(fileExtension) ? fileExtension : 'png';
    const r2Key = `brand-assets/font-previews/${uuidv4()}.${safeExt}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    await r2Client.send(
      new PutObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: r2Key,
        Body: buffer,
        ContentType: file.type || `image/${safeExt}`,
      }),
    );

    const publicUrl = getR2PublicUrl(r2Key);

    return NextResponse.json(
      { success: true, publicUrl },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error uploading font preview:', error);
    return NextResponse.json(
      {
        error: 'Failed to upload font preview',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

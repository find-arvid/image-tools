import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2-client';
import { getBrandAsset } from '@/lib/brand-assets-database';

function safeFilename(name: string, ext: string): string {
  const base = name.replace(/[^a-zA-Z0-9-_]/g, '_').slice(0, 100) || 'download';
  return `${base}.${ext}`;
}

/**
 * GET /api/brand-assets/[id]/download
 * Streams the asset file from R2 with Content-Disposition: attachment
 * so the browser downloads instead of opening the image in the tab.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    if (!id) {
      return NextResponse.json({ error: 'Asset ID required' }, { status: 400 });
    }

    const asset = await getBrandAsset(id);
    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
    }

    if (!asset.r2Key) {
      return NextResponse.json(
        { error: 'This asset has no file to download' },
        { status: 400 },
      );
    }

    const getObjectCommand = new GetObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: asset.r2Key,
    });

    const response = await r2Client.send(getObjectCommand);
    if (!response.Body) {
      return NextResponse.json(
        { error: 'File not found in storage' },
        { status: 404 },
      );
    }

    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    const buffer = Buffer.concat(chunks);

    const ext = asset.format || asset.r2Key.split('.').pop() || 'png';
    const contentType =
      response.ContentType ||
      (ext === 'svg' ? 'image/svg+xml' : `image/${ext === 'jpg' ? 'jpeg' : ext}`);
    const filename = safeFilename(asset.name, ext);

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Brand asset download error:', error);
    return NextResponse.json(
      { error: 'Failed to download asset' },
      { status: 500 },
    );
  }
}

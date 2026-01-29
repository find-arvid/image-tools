import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2-client';
import { getImageMetadata } from '@/lib/image-database';

/**
 * GET /api/images/proxy/[id]
 * Proxy images from R2 through Next.js to avoid CORS issues
 * Uses path parameter instead of query string for Next.js Image compatibility
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: imageId } = await params;

    if (!imageId) {
      return NextResponse.json(
        { error: 'Image ID is required' },
        { status: 400 }
      );
    }

    // Get image metadata to find the R2 key
    const image = await getImageMetadata(imageId);
    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Fetch image from R2
    try {
      const getObjectCommand = new GetObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: image.r2Key,
      });

      const response = await r2Client.send(getObjectCommand);
      
      if (!response.Body) {
        return NextResponse.json(
          { error: 'Image body not found' },
          { status: 404 }
        );
      }

      // Convert stream to buffer
      const chunks: Uint8Array[] = [];
      for await (const chunk of response.Body as any) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      // Determine content type
      const contentType = response.ContentType || `image/${image.filename.split('.').pop() || 'png'}`;

      // Return image with proper headers (no CORS needed since same origin)
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      });
    } catch (r2Error) {
      console.error('Error fetching image from R2:', r2Error);
      return NextResponse.json(
        { error: 'Failed to fetch image from R2' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in image proxy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

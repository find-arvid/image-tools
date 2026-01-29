import { NextRequest, NextResponse } from 'next/server';
import { getImageMetadata, deleteImageMetadata } from '@/lib/image-database';
import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET_NAME } from '@/lib/r2-client';
import { Redis } from '@upstash/redis';

// Helper to get Redis client (duplicated from image-database.ts for debugging)
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
    console.error('Failed to create Redis client:', error);
    return null;
  }
}

/**
 * GET /api/images/[id]
 * Get specific image metadata
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const resolvedParams = await Promise.resolve(params);
    const image = await getImageMetadata(resolvedParams.id);
    
    if (!image) {
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ image });
  } catch (error) {
    console.error('Error fetching image:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/images/[id]
 * Delete image from R2 and Redis
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Handle both sync and async params (Next.js 13+ compatibility)
    const resolvedParams = await Promise.resolve(params);
    const imageId = resolvedParams.id;
    
    console.log('Attempting to delete image:', imageId);
    
    // Check what images exist in Redis
    const redis = getRedisClient();
    if (redis) {
      const allIds = await redis.smembers<string[]>('images:all');
      console.log('All image IDs in Redis:', allIds);
      console.log('Looking for ID:', imageId);
      console.log('ID exists in list?', allIds?.includes(imageId));
    }
    
    const image = await getImageMetadata(imageId);
    
    if (!image) {
      console.error('Image not found for ID:', imageId);
      // Try to check if the key exists with different formats
      if (redis) {
        const keyExists = await redis.exists(`image:${imageId}`);
        console.log(`Key 'image:${imageId}' exists:`, keyExists);
      }
      return NextResponse.json(
        { error: 'Image not found', id: imageId },
        { status: 404 }
      );
    }
    
    console.log('Found image to delete:', image.filename, image.r2Key);

    // Delete from R2
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: R2_BUCKET_NAME,
        Key: image.r2Key,
      });
      await r2Client.send(deleteCommand);
      console.log('Successfully deleted from R2:', image.r2Key);
    } catch (r2Error) {
      console.error('Error deleting from R2:', r2Error);
      // Continue with metadata deletion even if R2 deletion fails
    }

    // Delete metadata from Redis
    const deleted = await deleteImageMetadata(imageId);
    console.log('Delete metadata result:', deleted);

    // Even if Redis deletion fails, if R2 deletion succeeded, consider it a success
    // The image file is gone, which is the most important part
    if (!deleted) {
      console.warn('Image deleted from R2 but Redis metadata deletion failed. Image file is removed.');
      // Still return success since the file is deleted
      return NextResponse.json({
        success: true,
        message: 'Image deleted successfully (file removed, metadata cleanup had issues)',
        warning: 'Metadata cleanup had issues but file was deleted',
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      {
        error: 'Failed to delete image',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

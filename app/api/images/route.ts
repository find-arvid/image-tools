import { NextRequest, NextResponse } from 'next/server';
import {
  getImagesByType,
  getImagesByEmotion,
  getImagesByEmotions,
  getAllImages,
  getImageMetadata,
} from '@/lib/image-database';

/**
 * GET /api/images
 * Fetch images with optional filters
 * 
 * Query parameters:
 * - type: 'foreground' | 'background'
 * - emotion: single emotion tag
 * - emotions: comma-separated emotion tags (OR logic)
 * - id: specific image ID
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') as 'foreground' | 'background' | null;
    const emotion = searchParams.get('emotion');
    const emotions = searchParams.get('emotions');
    const id = searchParams.get('id');

    // Get specific image by ID
    if (id) {
      const image = await getImageMetadata(id);
      if (!image) {
        return NextResponse.json(
          { error: 'Image not found' },
          { status: 404 }
        );
      }
      return NextResponse.json({ image });
    }

    // Get images by multiple emotions (OR logic)
    if (emotions) {
      const emotionArray = emotions.split(',').map(e => e.trim()).filter(e => e.length > 0);
      const images = await getImagesByEmotions(emotionArray);
      
      // Filter by type if provided
      const filtered = type
        ? images.filter(img => img.type === type)
        : images;
      
      return NextResponse.json({
        images: filtered,
        count: filtered.length,
      });
    }

    // Get images by single emotion
    if (emotion) {
      const images = await getImagesByEmotion(emotion);
      
      // Filter by type if provided
      const filtered = type
        ? images.filter(img => img.type === type)
        : images;
      
      return NextResponse.json({
        images: filtered,
        count: filtered.length,
      });
    }

    // Get images by type
    if (type) {
      console.log(`Fetching images by type: ${type}`);
      const images = await getImagesByType(type);
      console.log(`Found ${images.length} images of type ${type}:`, images);
      return NextResponse.json({
        images,
        count: images.length,
      });
    }

    // Get all images
    const images = await getAllImages();
    console.log(`Returning ${images.length} images. IDs:`, images.map(img => img.id));
    return NextResponse.json({
      images,
      count: images.length,
    });
  } catch (error) {
    console.error('Error fetching images:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch images',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

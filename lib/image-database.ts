/**
 * Database schema and helper functions for image metadata
 * Uses Upstash Redis to store image metadata
 */

import { Redis } from '@upstash/redis';

// Get Redis client (reuse existing function pattern)
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

export interface ImageMetadata {
  id: string; // Unique ID (UUID or timestamp-based)
  filename: string; // Original filename
  r2Key: string; // Key/path in R2 bucket
  publicUrl: string; // Public URL to access the image
  emotions: string[]; // Array of emotion tags
  category?: string; // Optional category (e.g., 'poses', 'backgrounds')
  uploadedBy?: string; // Uploader identifier
  uploadedAt: number; // Timestamp
  type: 'foreground' | 'background'; // Image type
}

/**
 * Save image metadata to Redis
 */
export async function saveImageMetadata(metadata: ImageMetadata): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) {
    throw new Error('Redis not configured');
  }

  try {
    const key = `image:${metadata.id}`;
    
    // Save individual image metadata
    await redis.hset(key, {
      id: metadata.id,
      filename: metadata.filename,
      r2Key: metadata.r2Key,
      publicUrl: metadata.publicUrl,
      emotions: JSON.stringify(metadata.emotions),
      category: metadata.category || '',
      uploadedBy: metadata.uploadedBy || '',
      uploadedAt: metadata.uploadedAt,
      type: metadata.type,
    });

    // Add to index by type
    await redis.sadd(`images:type:${metadata.type}`, metadata.id);

    // Add to index by each emotion tag
    for (const emotion of metadata.emotions) {
      const emotionKey = emotion.toLowerCase().trim();
      await redis.sadd(`images:emotion:${emotionKey}`, metadata.id);
    }

    // Add to category index if provided
    if (metadata.category) {
      await redis.sadd(`images:category:${metadata.category}`, metadata.id);
    }

    // Add to all images set
    await redis.sadd('images:all', metadata.id);

    return true;
  } catch (error) {
    console.error('Error saving image metadata:', error);
    throw error;
  }
}

/**
 * Get image metadata by ID
 */
export async function getImageMetadata(id: string): Promise<ImageMetadata | null> {
  const redis = getRedisClient();
  if (!redis) {
    console.error('Redis client not available in getImageMetadata');
    return null;
  }

  try {
    const key = `image:${id}`;
    console.log(`Fetching metadata for key: ${key}, ID: ${id}`);
    const data = await redis.hgetall(key);
    console.log(`Redis hgetall result for ${key}:`, data);
    
    if (!data || Object.keys(data).length === 0) {
      console.log(`No data found for key: ${key}`);
      // Check if the key exists at all
      const exists = await redis.exists(key);
      console.log(`Key exists check for ${key}:`, exists);
      return null;
    }

    // Parse emotions - handle both JSON array string and plain string
    let emotionsArray: string[] = [];
    try {
      const emotionsStr = data.emotions as string || '[]';
      // Try to parse as JSON first
      const parsed = JSON.parse(emotionsStr);
      if (Array.isArray(parsed)) {
        emotionsArray = parsed;
      } else if (typeof parsed === 'string') {
        // If it's a single string, wrap it in an array
        emotionsArray = [parsed];
      }
    } catch (e) {
      // If parsing fails, treat it as a single emotion string
      const emotionsStr = data.emotions as string || '';
      if (emotionsStr) {
        emotionsArray = [emotionsStr];
      }
    }

    return {
      id: data.id as string,
      filename: data.filename as string,
      r2Key: data.r2Key as string,
      publicUrl: data.publicUrl as string,
      emotions: emotionsArray,
      category: data.category as string || undefined,
      uploadedBy: data.uploadedBy as string || undefined,
      uploadedAt: Number(data.uploadedAt),
      type: data.type as 'foreground' | 'background',
    };
  } catch (error) {
    console.error('Error fetching image metadata:', error);
    return null;
  }
}

/**
 * Get all images by type (foreground or background)
 */
export async function getImagesByType(type: 'foreground' | 'background'): Promise<ImageMetadata[]> {
  const redis = getRedisClient();
  if (!redis) {
    console.error('Redis client not available');
    return [];
  }

  try {
    const key = `images:type:${type}`;
    console.log(`Fetching image IDs from Redis key: ${key}`);
    const imageIds = await redis.smembers<string[]>(key);
    console.log(`Found ${imageIds?.length || 0} image IDs for type ${type}:`, imageIds);
    
    if (!imageIds || imageIds.length === 0) {
      console.log(`No images found for type ${type}`);
      return [];
    }

    const images = await Promise.all(
      imageIds.map(id => getImageMetadata(id))
    );

    const validImages = images.filter((img): img is ImageMetadata => img !== null);
    console.log(`Retrieved ${validImages.length} valid images out of ${imageIds.length} IDs`);
    return validImages;
  } catch (error) {
    console.error('Error fetching images by type:', error);
    return [];
  }
}

/**
 * Get images by emotion tag
 */
export async function getImagesByEmotion(emotion: string): Promise<ImageMetadata[]> {
  const redis = getRedisClient();
  if (!redis) {
    return [];
  }

  try {
    const emotionKey = emotion.toLowerCase().trim();
    const imageIds = await redis.smembers<string[]>(`images:emotion:${emotionKey}`);
    if (!imageIds || imageIds.length === 0) {
      return [];
    }

    const images = await Promise.all(
      imageIds.map(id => getImageMetadata(id))
    );

    return images.filter((img): img is ImageMetadata => img !== null);
  } catch (error) {
    console.error('Error fetching images by emotion:', error);
    return [];
  }
}

/**
 * Get images by multiple emotions (OR logic - matches any)
 */
export async function getImagesByEmotions(emotions: string[]): Promise<ImageMetadata[]> {
  const redis = getRedisClient();
  if (!redis) {
    return [];
  }

  try {
    // Get image IDs for each emotion
    const emotionSets = await Promise.all(
      emotions.map(emotion => {
        const emotionKey = emotion.toLowerCase().trim();
        return redis.smembers<string[]>(`images:emotion:${emotionKey}`);
      })
    );

    // Combine all IDs (union)
    const allIds = new Set<string>();
    emotionSets.forEach(ids => {
      ids.forEach(id => allIds.add(id));
    });

    if (allIds.size === 0) {
      return [];
    }

    // Fetch metadata for all unique IDs
    const images = await Promise.all(
      Array.from(allIds).map(id => getImageMetadata(id))
    );

    return images.filter((img): img is ImageMetadata => img !== null);
  } catch (error) {
    console.error('Error fetching images by emotions:', error);
    return [];
  }
}

/**
 * Get all images
 */
export async function getAllImages(): Promise<ImageMetadata[]> {
  const redis = getRedisClient();
  if (!redis) {
    return [];
  }

  try {
    const imageIds = await redis.smembers<string[]>('images:all');
    if (!imageIds || imageIds.length === 0) {
      return [];
    }

    const images = await Promise.all(
      imageIds.map(id => getImageMetadata(id))
    );

    return images.filter((img): img is ImageMetadata => img !== null);
  } catch (error) {
    console.error('Error fetching all images:', error);
    return [];
  }
}

/**
 * Delete image metadata
 */
export async function deleteImageMetadata(id: string): Promise<boolean> {
  const redis = getRedisClient();
  if (!redis) {
    console.error('Redis client not available for deletion');
    return false;
  }

  try {
    console.log(`Attempting to delete metadata for image ID: ${id}`);
    const metadata = await getImageMetadata(id);
    if (!metadata) {
      console.error(`Image metadata not found for ID: ${id}`);
      return false;
    }

    console.log(`Found metadata, deleting from Redis. Type: ${metadata.type}, R2Key: ${metadata.r2Key}`);

    // Remove from all indexes
    await redis.del(`image:${id}`);
    console.log(`Deleted key: image:${id}`);
    
    await redis.srem(`images:type:${metadata.type}`, id);
    console.log(`Removed from images:type:${metadata.type}`);
    
    await redis.srem('images:all', id);
    console.log(`Removed from images:all`);

    if (metadata.category) {
      await redis.srem(`images:category:${metadata.category}`, id);
      console.log(`Removed from images:category:${metadata.category}`);
    }

    for (const emotion of metadata.emotions) {
      const emotionKey = emotion.toLowerCase().trim();
      await redis.srem(`images:emotion:${emotionKey}`, id);
      console.log(`Removed from images:emotion:${emotionKey}`);
    }

    console.log(`Successfully deleted metadata for image ID: ${id}`);
    return true;
  } catch (error) {
    console.error('Error deleting image metadata:', error);
    return false;
  }
}

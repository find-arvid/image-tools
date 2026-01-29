/**
 * Fetch images from the API and convert to the format expected by the thumbnail creator
 */

import type { BackgroundAsset, ForegroundAsset } from './youtube-thumbnail-assets';
import type { ImageMetadata } from './image-database';

/**
 * Convert ImageMetadata to ForegroundAsset format
 */
export function imageToForegroundAsset(image: ImageMetadata): ForegroundAsset {
  return {
    id: image.id,
    name: image.emotions[0] || 'Untitled', // Use first emotion as name
    path: image.publicUrl,
    category: image.category,
    emotions: image.emotions,
  };
}

/**
 * Convert ImageMetadata to BackgroundAsset format
 */
export function imageToBackgroundAsset(image: ImageMetadata): BackgroundAsset {
  return {
    id: image.id,
    name: image.category || image.filename.replace(/\.[^/.]+$/, ''), // Use category or filename without extension
    path: image.publicUrl,
    category: image.category,
  };
}

/**
 * Fetch foreground images from API
 */
export async function fetchForegroundImages(): Promise<ForegroundAsset[]> {
  try {
    const response = await fetch('/api/images?type=foreground');
    if (!response.ok) {
      console.error('Failed to fetch foreground images:', response.status, response.statusText);
      return [];
    }
    const data = await response.json();
    console.log('Foreground images API response:', data);
    if (!data.images || !Array.isArray(data.images)) {
      console.error('Invalid response format:', data);
      return [];
    }
    return data.images.map(imageToForegroundAsset);
  } catch (error) {
    console.error('Error fetching foreground images:', error);
    return [];
  }
}

/**
 * Fetch background images from API
 */
export async function fetchBackgroundImages(): Promise<BackgroundAsset[]> {
  try {
    const response = await fetch('/api/images?type=background');
    if (!response.ok) {
      console.error('Failed to fetch background images:', response.status, response.statusText);
      return [];
    }
    const data = await response.json();
    console.log('Background images API response:', data);
    if (!data.images || !Array.isArray(data.images)) {
      console.error('Invalid response format:', data);
      return [];
    }
    return data.images.map(imageToBackgroundAsset);
  } catch (error) {
    console.error('Error fetching background images:', error);
    return [];
  }
}

/**
 * Fetch images by emotion tags
 */
export async function fetchImagesByEmotions(
  emotions: string[],
  type?: 'foreground' | 'background'
): Promise<ForegroundAsset[] | BackgroundAsset[]> {
  try {
    const emotionsParam = emotions.join(',');
    const url = type
      ? `/api/images?emotions=${emotionsParam}&type=${type}`
      : `/api/images?emotions=${emotionsParam}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Failed to fetch images by emotions');
      return [];
    }
    const data = await response.json();
    
    if (type === 'background') {
      return data.images.map(imageToBackgroundAsset);
    }
    return data.images.map(imageToForegroundAsset);
  } catch (error) {
    console.error('Error fetching images by emotions:', error);
    return [];
  }
}

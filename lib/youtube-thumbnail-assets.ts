/**
 * Configuration for YouTube thumbnail assets
 * Add your background and foreground images to the respective directories
 * and reference them here.
 */

export interface BackgroundAsset {
  id: string;
  name: string;
  path: string;
  category?: string;
}

export interface ForegroundAsset {
  id: string;
  name: string;
  path: string;
  category?: string;
  emotions: string[]; // First emotion is main, rest are secondary
}

/**
 * Available background images
 * Add backgrounds to /public/youtube-thumbnail/backgrounds/
 * and reference them here
 */
export const BACKGROUNDS: BackgroundAsset[] = [
  {
    id: 'blue',
    name: 'Blue',
    path: '/youtube-thumbnail/backgrounds/webopedia-yt-thumbnail-background-blue.png',
    category: 'gradients',
  },
  {
    id: 'green',
    name: 'Green',
    path: '/youtube-thumbnail/backgrounds/webopedia-yt-thumbnail-background-green.png',
    category: 'gradients',
  },
  {
    id: 'lilac',
    name: 'Lilac',
    path: '/youtube-thumbnail/backgrounds/webopedia-yt-thumbnail-background-lilac.png',
    category: 'gradients',
  },
  {
    id: 'purple',
    name: 'Purple',
    path: '/youtube-thumbnail/backgrounds/webopedia-yt-thumbnail-background-purple.png',
    category: 'gradients',
  },
  {
    id: 'red',
    name: 'Red',
    path: '/youtube-thumbnail/backgrounds/webopedia-yt-thumbnail-background-red.png',
    category: 'gradients',
  },
];

/**
 * Helper function to parse emotions from filename
 * Extracts emotions from filename like "animated-expressive-energetic.png"
 * Returns array with first emotion as main, rest as secondary
 */
function parseEmotionsFromFilename(filename: string): string[] {
  // Remove extension and split by hyphens
  const baseName = filename.replace(/\.(png|jpg|jpeg|webp)$/i, '');
  const parts = baseName.split('-');
  
  // Capitalize first letter of each emotion
  return parts.map(part => {
    return part.charAt(0).toUpperCase() + part.slice(1);
  });
}

/**
 * Available foreground elements
 * Add foregrounds to /public/youtube-thumbnail/foregrounds/
 * and reference them here
 */
export const FOREGROUNDS: ForegroundAsset[] = [
  {
    id: 'amazed-shocked',
    name: 'Amazed',
    path: '/youtube-thumbnail/foregrounds/amazed-shocked.png',
    category: 'poses',
    emotions: parseEmotionsFromFilename('amazed-shocked.png'),
  },
  {
    id: 'animated-expressive-energetic',
    name: 'Animated',
    path: '/youtube-thumbnail/foregrounds/animated-expressive-energetic.png',
    category: 'poses',
    emotions: parseEmotionsFromFilename('animated-expressive-energetic.png'),
  },
  {
    id: 'curious-attentive-thoughtful',
    name: 'Curious',
    path: '/youtube-thumbnail/foregrounds/curious-attentive-thoughtful.png',
    category: 'poses',
    emotions: parseEmotionsFromFilename('curious-attentive-thoughtful.png'),
  },
  {
    id: 'doubtful-curious-considering',
    name: 'Doubtful',
    path: '/youtube-thumbnail/foregrounds/doubtful-curious-considering.png',
    category: 'poses',
    emotions: parseEmotionsFromFilename('doubtful-curious-considering.png'),
  },
  {
    id: 'enthusiastic-presenting-upbeat-pointing',
    name: 'Enthusiastic',
    path: '/youtube-thumbnail/foregrounds/enthusiastic-presenting-upbeat-pointing.png',
    category: 'poses',
    emotions: parseEmotionsFromFilename('enthusiastic-presenting-upbeat-pointing.png'),
  },
  {
    id: 'excited-enthusiastic-approachable',
    name: 'Excited',
    path: '/youtube-thumbnail/foregrounds/excited-enthusiastic-approachable.png',
    category: 'poses',
    emotions: parseEmotionsFromFilename('excited-enthusiastic-approachable.png'),
  },
  {
    id: 'explaining-engaged-confident',
    name: 'Explaining Confident',
    path: '/youtube-thumbnail/foregrounds/explaining-engaged-confident.png',
    category: 'poses',
    emotions: parseEmotionsFromFilename('explaining-engaged-confident.png'),
  },
  {
    id: 'pointing-inviting-smiling',
    name: 'Pointing',
    path: '/youtube-thumbnail/foregrounds/pointing-inviting-smiling.png',
    category: 'poses',
    emotions: parseEmotionsFromFilename('pointing-inviting-smiling.png'),
  },
  {
    id: 'questioning-thoughtful-sceptical',
    name: 'Questioning',
    path: '/youtube-thumbnail/foregrounds/questioning-thoughtful-sceptical.png',
    category: 'poses',
    emotions: parseEmotionsFromFilename('questioning-thoughtful-sceptical.png'),
  },
  {
    id: 'shocked-startled-alarmed',
    name: 'Shocked',
    path: '/youtube-thumbnail/foregrounds/shocked-startled-alarmed.png',
    category: 'poses',
    emotions: parseEmotionsFromFilename('shocked-startled-alarmed.png'),
  },
];

/**
 * Get background by ID
 */
export function getBackgroundById(id: string): BackgroundAsset | undefined {
  return BACKGROUNDS.find(bg => bg.id === id);
}

/**
 * Get foreground by ID
 */
export function getForegroundById(id: string): ForegroundAsset | undefined {
  return FOREGROUNDS.find(fg => fg.id === id);
}

/**
 * Get backgrounds by category
 */
export function getBackgroundsByCategory(category: string): BackgroundAsset[] {
  return BACKGROUNDS.filter(bg => bg.category === category);
}

/**
 * Get foregrounds by category
 */
export function getForegroundsByCategory(category: string): ForegroundAsset[] {
  return FOREGROUNDS.filter(fg => fg.category === category);
}

/**
 * Get all unique background categories
 */
export function getBackgroundCategories(): string[] {
  const categories = BACKGROUNDS.map(bg => bg.category).filter((cat): cat is string => !!cat);
  return [...new Set(categories)];
}

/**
 * Get all unique foreground categories
 */
export function getForegroundCategories(): string[] {
  const categories = FOREGROUNDS.map(fg => fg.category).filter((cat): cat is string => !!cat);
  return [...new Set(categories)];
}

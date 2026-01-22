# YouTube Thumbnail Assets

This directory contains assets for the YouTube thumbnail generator.

## Directory Structure

```
youtube-thumbnail/
├── backgrounds/     # Background images for thumbnails
└── foregrounds/    # Foreground elements (icons, shapes, etc.)
```

## Adding Assets

### Adding Backgrounds

1. Add your background image files to `backgrounds/` directory
2. Recommended formats: `.webp` (preferred), `.png`, `.jpg`
3. Recommended dimensions: 1280x720px (YouTube thumbnail standard) or 1920x1080px
4. Update `lib/youtube-thumbnail-assets.ts` to register your background:

```typescript
export const BACKGROUNDS: BackgroundAsset[] = [
  {
    id: 'my-background',
    name: 'My Background',
    path: '/youtube-thumbnail/backgrounds/my-background.webp',
    category: 'gradients', // optional
  },
  // ... more backgrounds
];
```

### Adding Foregrounds

1. Add your foreground image files to `foregrounds/` directory
2. Recommended formats: `.png` (with transparency), `.webp`
3. Update `lib/youtube-thumbnail-assets.ts` to register your foreground:

```typescript
export const FOREGROUNDS: ForegroundAsset[] = [
  {
    id: 'my-icon',
    name: 'My Icon',
    path: '/youtube-thumbnail/foregrounds/my-icon.png',
    category: 'icons', // optional
  },
  // ... more foregrounds
];
```

## File Naming Conventions

- Use kebab-case for file names: `blue-gradient.webp`, `arrow-up.png`
- Keep names descriptive and consistent
- Use `.webp` for backgrounds when possible (better compression)
- Use `.png` for foregrounds when transparency is needed

## Usage in Code

Assets are referenced using the paths defined in `lib/youtube-thumbnail-assets.ts`:

```typescript
import { BACKGROUNDS, FOREGROUNDS } from '@/lib/youtube-thumbnail-assets';

// Get all backgrounds
const allBackgrounds = BACKGROUNDS;

// Get background by ID
const bg = getBackgroundById('my-background');

// Get backgrounds by category
const gradientBackgrounds = getBackgroundsByCategory('gradients');
```

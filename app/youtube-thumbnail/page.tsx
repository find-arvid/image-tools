'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import NextImage from 'next/image';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import Link from 'next/link';
import { type BackgroundAsset, type ForegroundAsset } from '@/lib/youtube-thumbnail-assets';
import { trackToolUsage } from '@/lib/track-usage';
import { fetchForegroundImages, fetchBackgroundImages } from '@/lib/fetch-images';

// Load Google Font for canvas rendering
// This function loads a Google Font and makes it available for canvas rendering
const loadGoogleFont = async (fontFamily: string, fontWeight: string = '700'): Promise<void> => {
  // Check if font is already loaded
  if (document.fonts.check(`${fontWeight} 1em "${fontFamily}"`)) {
    return Promise.resolve();
  }

  try {
    // First, inject the Google Fonts stylesheet to ensure font is available
    const linkId = `google-font-${fontFamily.replace(/\s+/g, '-').toLowerCase()}`;
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@${fontWeight}&display=swap`;
      document.head.appendChild(link);
      
      // Wait a bit for the stylesheet to load
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Now load the font using FontFace API
    // Fetch the CSS to get the actual font file URL
    const cssUrl = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s+/g, '+')}:wght@${fontWeight}&display=swap`;
    const response = await fetch(cssUrl);
    const cssText = await response.text();
    
    // Extract the woff2 URL (preferred format)
    const urlMatch = cssText.match(/url\(([^)]+\.woff2[^)]*)\)/);
    if (urlMatch) {
      const fontUrl = urlMatch[1].replace(/['"]/g, '');
      const fontFace = new FontFace(fontFamily, `url(${fontUrl})`, {
        weight: fontWeight,
        display: 'swap',
      });
      
      await fontFace.load();
      document.fonts.add(fontFace);
    }
  } catch (error) {
    console.warn('Error loading Google Font, falling back to system font:', error);
  }
};

export default function YouTubeThumbnail() {
  // State for available images (from database only)
  const [availableBackgrounds, setAvailableBackgrounds] = useState<BackgroundAsset[]>([]);
  const [availableForegrounds, setAvailableForegrounds] = useState<ForegroundAsset[]>([]);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  const [selectedBackground, setSelectedBackground] = useState<BackgroundAsset | null>(null);
  const [selectedForeground, setSelectedForeground] = useState<ForegroundAsset | null>(null);
  const [textLines, setTextLines] = useState<Array<{ text: string; color: 'white' | 'yellow' }>>([
    { text: 'this is', color: 'white' }, // Supporting text
    { text: 'Important', color: 'yellow' }, // Main title (emphasis)
  ]);
  const [combinedPreview, setCombinedPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [expandedEmotionId, setExpandedEmotionId] = useState<string | null>(null);
  const [emotionSearch, setEmotionSearch] = useState('');
  const previewSectionRef = useRef<HTMLDivElement>(null);
  const textInputRefs = useRef<Map<number, HTMLInputElement>>(new Map());

  // Fetch images from database on mount
  useEffect(() => {
    const loadImages = async () => {
      try {
        console.log('Loading images from database...');
        const [foregrounds, backgrounds] = await Promise.all([
          fetchForegroundImages(),
          fetchBackgroundImages(),
        ]);

        console.log('Fetched foregrounds:', foregrounds.length, foregrounds);
        console.log('Fetched backgrounds:', backgrounds.length, backgrounds);

        // Use database images only (no fallback to static)
        setAvailableForegrounds(foregrounds);
        setSelectedForeground(foregrounds[0] || null);

        setAvailableBackgrounds(backgrounds);
        setSelectedBackground(backgrounds[0] || null);
      } catch (error) {
        console.error('Error loading images:', error);
        // Don't fallback to static images - just use empty arrays
        setAvailableForegrounds([]);
        setAvailableBackgrounds([]);
        setSelectedForeground(null);
        setSelectedBackground(null);
      } finally {
        setImagesLoaded(true);
      }
    };

    loadImages();
  }, []);

  // Generate combined preview when background or foreground changes
  useEffect(() => {
    if (!imagesLoaded) return; // Wait for images to load

    const generatePreview = async () => {
      // Use selected background or first available, or skip if none
      const bg = selectedBackground || (availableBackgrounds.length > 0 ? availableBackgrounds[0] : null);
      if (!bg) {
        setCombinedPreview(null);
        return;
      }

      setIsGenerating(true);

      try {
        // Validate background path
        if (!bg.path) {
          throw new Error(`Background image path is missing. Background: ${JSON.stringify(bg)}`);
        }

        // Load background image
        // Note: crossOrigin='anonymous' is required for canvas operations, which means CORS must be configured on R2
        const backgroundImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = (error) => {
            const errorDetails: any = {
              path: bg.path,
              error,
            };
            if (error instanceof Event) {
              errorDetails.errorType = error.type;
              errorDetails.errorTarget = error.target;
            }
            console.error('Failed to load background image:', errorDetails);
            reject(new Error(`Failed to load background image from ${bg.path}. This is likely a CORS issue. Please configure CORS on your Cloudflare R2 bucket to allow your domain.`));
          };
          img.src = bg.path;
        });

        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          setIsGenerating(false);
          return;
        }

        // YouTube thumbnail standard size: 1280x720 (16:9)
        const targetWidth = 1280;
        const targetHeight = 720;
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Draw background
        ctx.drawImage(backgroundImg, 0, 0, targetWidth, targetHeight);

        // Draw text in white text box if provided (middle layer between background and foreground)
        const hasText = textLines.some(line => line.text.trim());
        if (hasText) {
          // Load Google Font weights before rendering (500 for white, 800 for yellow)
          await Promise.all([
            loadGoogleFont('Funnel Display', '500'),
            loadGoogleFont('Funnel Display', '800'),
          ]);
          
          ctx.save();
          const fontFamily = '"Funnel Display", Arial, sans-serif';
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          
          // Define text box area (left side of thumbnail) - transparent holder
          // Text box takes up 40% width and 70% height, positioned slightly below top
          const textBoxWidth = targetWidth * 0.4; // 40% of width (left portion)
          const textBoxHeight = targetHeight * 0.7; // 70% of height
          const textBoxX = 0;
          const textBoxY = targetHeight * 0.05; // Lowered by 5% of image height
          
          // Filter out empty lines and limit to 4 lines
          const linesToRender = textLines
            .filter(line => line.text.trim())
            .slice(0, 4);
          
          const numLines = linesToRender.length;
          
          // Font size scales based on number of lines (2 lines = 100% base)
          const baseFontSize = 160 * 0.9025; // Reduced by 10% total (5% + 5%)
          const fontSizeMap: Record<number, number> = {
            1: baseFontSize * 1.1,  // 110% - 10% larger
            2: baseFontSize * 1.0,  // 100% - base size
            3: baseFontSize * 0.9,  // 90% - 10% smaller
            4: baseFontSize * 0.8,  // 80% - 20% smaller
          };
          const fontSize = fontSizeMap[numLines] || baseFontSize * 1.0;
          const lineHeight = fontSize * 1.0;
          
          // Calculate total text height
          const totalTextHeight = numLines * lineHeight;
          
          // Center text vertically within the text box area
          const textStartY = textBoxY + (textBoxHeight - totalTextHeight) / 2;
          const paddingX = textBoxX + 50; // Padding from left edge
          
          ctx.lineWidth = 8;
          
          // Draw each line with selected color and font weight
          linesToRender.forEach((line, index) => {
            // Set font weight and color based on selection
            if (line.color === 'white') {
              ctx.font = `500 ${fontSize}px ${fontFamily}`; // Medium 500
              ctx.fillStyle = '#FFFFFF'; // White text
            } else {
              ctx.font = `800 ${fontSize}px ${fontFamily}`; // ExtraBold 800
              ctx.fillStyle = '#FFD700'; // Yellow
            }
            
            const y = textStartY + (index * lineHeight);
            const text = line.text.trim();
            
            // Draw text without any effects
            ctx.fillText(text, paddingX, y);
          });

          ctx.restore();
        }

        // Draw foreground - use selected or first available (top layer)
        const fg = selectedForeground || (availableForegrounds.length > 0 ? availableForegrounds[0] : null);
        if (fg) {
          if (!fg.path) {
            console.warn('Foreground image path is missing, skipping foreground:', fg);
          } else {
            const foregroundImg = await new Promise<HTMLImageElement>((resolve, reject) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => resolve(img);
              img.onerror = (error) => {
                const errorDetails: any = {
                  path: fg.path,
                  error,
                };
                if (error instanceof Event) {
                  errorDetails.errorType = error.type;
                  errorDetails.errorTarget = error.target;
                }
                console.error('Failed to load foreground image:', errorDetails);
                reject(new Error(`Failed to load foreground image from ${fg.path}. This is likely a CORS issue. Please configure CORS on your Cloudflare R2 bucket to allow your domain.`));
              };
              img.src = fg.path;
            });

            // Overlay foreground at same size as background (1:1 overlay)
            ctx.drawImage(foregroundImg, 0, 0, targetWidth, targetHeight);
          }
        }

        // Convert to data URL
        const dataUrl = canvas.toDataURL('image/webp', 0.9);
        setCombinedPreview(dataUrl);

        // Scroll to preview when it's ready
        if (previewSectionRef.current) {
          setTimeout(() => {
            previewSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }, 100);
        }
      } catch (error) {
        console.error('Error generating preview:', {
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorStack: error instanceof Error ? error.stack : undefined,
          selectedBackground: selectedBackground?.path,
          selectedForeground: selectedForeground?.path,
          availableBackgrounds: availableBackgrounds.length,
          availableForegrounds: availableForegrounds.length,
        });
        setCombinedPreview(null);
      } finally {
        setIsGenerating(false);
      }
    };

    generatePreview();
  }, [selectedBackground, selectedForeground, textLines, imagesLoaded, availableBackgrounds, availableForegrounds]);

  const handleDownload = useCallback(() => {
    if (!combinedPreview) return;

    // Generate filename from title text
    const titleText = textLines
      .filter(line => line.text.trim())
      .map(line => line.text.trim())
      .join('-')
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-') // Replace non-alphanumeric chars with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
    
    const filename = titleText ? `webo-yt-${titleText}` : 'webo-yt-youtube-thumbnail';

    const link = document.createElement('a');
    link.href = combinedPreview;
    link.download = `${filename}.webp`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Track usage
    trackToolUsage('youtube-thumbnail');
    
    // Show confirmation
    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
    }, 2000);
  }, [combinedPreview, textLines]);

  const handleReset = () => {
    if (availableBackgrounds.length > 0) {
      setSelectedBackground(availableBackgrounds[0]);
    }
    if (availableForegrounds.length > 0) {
      setSelectedForeground(availableForegrounds[0]);
    }
    setTextLines([{ text: '', color: 'white' }]);
    setCombinedPreview(null);
    setDownloaded(false);
  };

  const updateTextLine = (index: number, text: string) => {
    const newLines = [...textLines];
    newLines[index] = { ...newLines[index], text };
    setTextLines(newLines);
  };

  const updateTextColor = (index: number, color: 'white' | 'yellow') => {
    const newLines = [...textLines];
    
    if (color === 'yellow') {
      // Set this line to yellow
      newLines[index] = { ...newLines[index], color: 'yellow' };
      
      // Find all yellow lines
      const yellowIndices = newLines
        .map((line, i) => line.color === 'yellow' ? i : -1)
        .filter(i => i !== -1);
      
      // Check if yellow lines form a connected block
      if (yellowIndices.length > 0) {
        const minYellow = Math.min(...yellowIndices);
        const maxYellow = Math.max(...yellowIndices);
        
        // Make all lines between min and max yellow (to ensure connection)
        for (let i = minYellow; i <= maxYellow; i++) {
          newLines[i] = { ...newLines[i], color: 'yellow' };
        }
      }
    } else {
      // Setting to white - check if this breaks a yellow block
      const yellowIndices = newLines
        .map((line, i) => line.color === 'yellow' ? i : -1)
        .filter(i => i !== -1);
      
      if (yellowIndices.length > 0) {
        const minYellow = Math.min(...yellowIndices);
        const maxYellow = Math.max(...yellowIndices);
        
        // If this line is in the middle of a yellow block, don't allow changing to white
        if (index > minYellow && index < maxYellow) {
          // Don't allow breaking the middle of a yellow block
          return;
        }
        
        // If it's at the edge, allow changing to white
        newLines[index] = { ...newLines[index], color: 'white' };
      } else {
        // No yellow lines, allow white
        newLines[index] = { ...newLines[index], color: 'white' };
      }
    }
    
    setTextLines(newLines);
  };
  
  // Check if a yellow button should be disabled
  const isYellowDisabled = (index: number): boolean => {
    const yellowIndices = textLines
      .map((line, i) => line.color === 'yellow' ? i : -1)
      .filter(i => i !== -1);
    
    if (yellowIndices.length === 0) {
      return false; // No yellow lines, can add one
    }
    
    const minYellow = Math.min(...yellowIndices);
    const maxYellow = Math.max(...yellowIndices);
    
    // Can only add yellow adjacent to existing yellow block
    // Allow if this line is next to the yellow block (minYellow - 1 or maxYellow + 1)
    return index !== minYellow - 1 && index !== maxYellow + 1;
  };

  const addTextLine = (currentIndex?: number) => {
    if (textLines.length < 4) {
      const newIndex = textLines.length;
      setTextLines([...textLines, { text: '', color: 'white' }]);
      // Focus the new line's input after state updates
      setTimeout(() => {
        const newInput = textInputRefs.current.get(newIndex);
        newInput?.focus();
      }, 10);
    }
  };

  const removeTextLine = (index: number) => {
    if (textLines.length > 1) {
      const newLines = textLines.filter((_, i) => i !== index);
      setTextLines(newLines);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header - Always visible */}
      <header className="w-full max-w-7xl mx-auto px-4 pt-8 pb-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">YouTube Video Thumbnail</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Create custom YouTube video thumbnails by combining backgrounds, foregrounds, and text. Choose from a variety of options and export optimized thumbnails ready for YouTube.
          </p>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 pb-8">
        <div className="flex flex-col gap-6 py-8">
          {/* Container: Preview and Editor together */}
          <div className="relative w-full lg:max-h-[calc(100vh-200px)]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
              {/* Preview Section - Left (Fixed within container) */}
              <div className="w-full lg:sticky lg:top-6 lg:self-start lg:h-fit">
              {combinedPreview ? (
                <div ref={previewSectionRef} className="w-full">
                  <div className="flex flex-col items-center gap-4 p-6 border border-border rounded-lg bg-card">
                    <h2 className="text-xl font-bold">Preview</h2>
                    <div className="w-full rounded-lg overflow-hidden border border-border">
                      <img
                        src={combinedPreview}
                        alt="Combined thumbnail preview"
                        className="w-full h-auto"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleDownload}
                        disabled={downloaded}
                        size="sm"
                        className="min-w-[100px]"
                      >
                        {downloaded ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Downloaded
                          </>
                        ) : (
                          'Download'
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleReset}
                      >
                        Reset
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="w-full p-6 border border-border rounded-lg bg-card flex items-center justify-center min-h-[400px]">
                  <p className="text-muted-foreground">Select a background to see preview</p>
                </div>
              )}
            </div>

            {/* Editor Section - Right (Scrollable within container) */}
            <div className="w-full space-y-6 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto lg:pr-2 pb-6">
              {/* Text Section - Top */}
              <div className="w-full border-b border-border pb-6 pl-5">
                <h2 className="text-xl font-bold mb-4">Video Title</h2>
                <p className="text-sm text-muted-foreground mb-4">Add the title text that will appear on your YouTube thumbnail</p>
                <div className="space-y-3">
                  {textLines.map((line, index) => {
                    const yellowDisabled = isYellowDisabled(index);
                    const isYellow = line.color === 'yellow';
                    
                    return (
                      <div key={index} className="flex gap-3 items-center">
                        {/* Switch for Yellow - checked when yellow, unchecked when white */}
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={isYellow}
                            onCheckedChange={(checked) => {
                              if (!checked) {
                                // Unchecking - change to white (but check if it's in middle of yellow block)
                                const yellowIndices = textLines
                                  .map((l, i) => l.color === 'yellow' ? i : -1)
                                  .filter(i => i !== -1);
                                
                                if (yellowIndices.length > 0) {
                                  const minYellow = Math.min(...yellowIndices);
                                  const maxYellow = Math.max(...yellowIndices);
                                  
                                  // Don't allow unchecking if in middle of yellow block
                                  if (index > minYellow && index < maxYellow) {
                                    return;
                                  }
                                }
                                updateTextColor(index, 'white');
                              } else {
                                // Checking - change to yellow
                                if (!yellowDisabled) {
                                  updateTextColor(index, 'yellow');
                                }
                              }
                            }}
                            disabled={yellowDisabled && !isYellow}
                          />
                          <span className="text-sm text-muted-foreground w-20">
                            {isYellow ? 'Emphasis' : 'Regular'}
                          </span>
                        </div>
                        
                        {/* Text Input */}
                        <div className="flex-1">
                          <input
                            ref={(el) => {
                              if (el) {
                                textInputRefs.current.set(index, el);
                              } else {
                                textInputRefs.current.delete(index);
                              }
                            }}
                            type="text"
                            value={line.text}
                            onChange={(e) => updateTextLine(index, e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && textLines.length < 4) {
                                e.preventDefault();
                                addTextLine(index);
                              }
                            }}
                            placeholder={index === 0 ? 'this is' : index === 1 ? 'Important' : `Line ${index + 1} (${line.color})...`}
                            className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                          />
                        </div>
                        
                        {/* Remove Button */}
                        {textLines.length > 1 && (
                          <button
                            onClick={() => removeTextLine(index)}
                            className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors"
                            title="Remove line"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* Add Line Button */}
                  {textLines.length < 4 && (
                    <button
                      onClick={() => addTextLine()}
                      className="w-full px-4 py-2 rounded-md border border-dashed border-border hover:border-white/40 transition-colors text-sm text-muted-foreground hover:text-foreground"
                    >
                      + Add Line
                    </button>
                  )}
                  
                  <p className="text-xs text-muted-foreground">
                    Click white or yellow to set the color for each line. Yellow lines must be connected (consecutive). Press Enter to add a new line. Up to 4 lines. Text appears in the top left of the thumbnail.
                  </p>
                </div>
              </div>

              {/* Foregrounds Section */}
              <div className="w-full">
                <h2 className="text-xl font-bold mb-3">
                  Vibe
                </h2>
                <input
                  type="text"
                  placeholder="Search vibes..."
                  value={emotionSearch}
                  onChange={(e) => setEmotionSearch(e.target.value)}
                  className="w-full mb-3 px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-white"
                />
                <div className="flex flex-wrap gap-3">
                  {availableForegrounds.filter((foreground) => {
                    const mainEmotion = (foreground.emotions && foreground.emotions[0]) || foreground.name || '';
                    const mainEmotionStr = typeof mainEmotion === 'string' ? mainEmotion : String(mainEmotion);
                    const allEmotions = (foreground.emotions || []).join(' ').toLowerCase();
                    const searchLower = emotionSearch.toLowerCase();
                    return mainEmotionStr.toLowerCase().includes(searchLower) || 
                           allEmotions.includes(searchLower);
                  }).map((foreground) => {
                    const isExpanded = expandedEmotionId === foreground.id;
                    const mainEmotionRaw = (foreground.emotions && foreground.emotions[0]) || foreground.name || '';
                    const mainEmotion = typeof mainEmotionRaw === 'string' ? mainEmotionRaw : String(mainEmotionRaw);
                    const secondaryEmotions = (foreground.emotions || []).slice(1);
                    const hasSecondaryEmotions = secondaryEmotions.length > 0;
                    
                    return (
                      <div key={foreground.id} className="flex flex-col gap-2">
                        <button
                          onClick={() => {
                            if (hasSecondaryEmotions) {
                              setExpandedEmotionId(isExpanded ? null : foreground.id);
                            }
                            setSelectedForeground(foreground);
                          }}
                          className={`flex items-stretch gap-0 p-0 rounded-lg border-2 transition-all bg-muted/20 overflow-hidden ${
                            selectedForeground?.id === foreground.id
                              ? 'border-white ring-2 ring-white/20 bg-white/10'
                              : 'border-border hover:border-white/40'
                          }`}
                          title={foreground.name}
                        >
                          <span className="text-sm font-medium whitespace-nowrap px-2 flex items-center">{mainEmotion}</span>
                          <img
                            src={foreground.path}
                            alt={foreground.name}
                            className="w-[68px] h-auto flex-shrink-0 -mr-[2px] -mt-[2px] -mb-[2px] object-contain"
                          />
                        </button>
                        
                        {/* Expanded state - show all emotions */}
                        {isExpanded && hasSecondaryEmotions && (
                          <div className="flex flex-wrap gap-2 pl-2">
                            {secondaryEmotions.map((emotion, index) => (
                              <span
                                key={index}
                                className="text-xs px-2 py-1 rounded-md bg-muted/40 text-muted-foreground border border-border"
                              >
                                {emotion}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Backgrounds Section */}
              <div className="w-full pb-8">
                <h2 className="text-xl font-bold mb-3">
                  Background
                </h2>
                <div className="flex flex-wrap gap-3 pb-2 pl-2 pr-4">
                  {availableBackgrounds.map((background) => (
                    <button
                      key={background.id}
                      onClick={() => setSelectedBackground(background)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                        selectedBackground?.id === background.id
                          ? 'border-white ring-2 ring-white/20 scale-110'
                          : 'border-border hover:border-white/40'
                      }`}
                      title={background.name}
                    >
                      <div className="relative w-full h-full">
                        <NextImage
                          src={background.path}
                          alt={background.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            </div>
          </div>

          {/* Loading State */}
          {isGenerating && (
            <div className="w-full flex items-center justify-center py-8">
              <p className="text-muted-foreground">Generating preview...</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

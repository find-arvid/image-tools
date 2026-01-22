'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import NextImage from 'next/image';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { BACKGROUNDS, FOREGROUNDS, type BackgroundAsset, type ForegroundAsset } from '@/lib/youtube-thumbnail-assets';
import { trackToolUsage } from '@/lib/track-usage';

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
  const [selectedBackground, setSelectedBackground] = useState<BackgroundAsset | null>(BACKGROUNDS[0] || null);
  const [selectedForeground, setSelectedForeground] = useState<ForegroundAsset | null>(FOREGROUNDS[0] || null);
  const [textLines, setTextLines] = useState<Array<{ text: string; color: 'white' | 'yellow' }>>([
    { text: '', color: 'white' }, // Default white
  ]);
  const [combinedPreview, setCombinedPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [expandedEmotionId, setExpandedEmotionId] = useState<string | null>(null);
  const previewSectionRef = useRef<HTMLDivElement>(null);

  // Generate combined preview when background or foreground changes
  useEffect(() => {
    const generatePreview = async () => {
      // Always use default background if none selected
      const bg = selectedBackground || BACKGROUNDS[0];
      if (!bg) {
        setCombinedPreview(null);
        return;
      }

      setIsGenerating(true);

      try {
        // Load background image
        const backgroundImg = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
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

        // Draw foreground - always use default if none selected
        const fg = selectedForeground || FOREGROUNDS[0];
        if (fg) {
          const foregroundImg = await new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = fg.path;
          });

          // Overlay foreground at same size as background (1:1 overlay)
          ctx.drawImage(foregroundImg, 0, 0, targetWidth, targetHeight);
        }

        // Draw text in top left if provided
        const hasText = textLines.some(line => line.text.trim());
        if (hasText) {
          // Load Google Font weights before rendering (500 for white, 800 for yellow)
          await Promise.all([
            loadGoogleFont('Funnel Display', '500'),
            loadGoogleFont('Funnel Display', '800'),
          ]);
          
          ctx.save();
          const fontSize = 160; // Increased from 120
          const fontFamily = '"Funnel Display", Arial, sans-serif';
          ctx.lineWidth = 8; // Increased from 6
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';
          
          // Position in left with padding, top padding matches left padding when max lines
          const paddingX = 50;
          const paddingY = 50; // Same as left padding
          const lineHeight = fontSize * 1.0; // Line spacing (reduced from 1.2)
          
          // Filter out empty lines and limit to 4 lines
          const linesToRender = textLines
            .filter(line => line.text.trim())
            .slice(0, 4);
          
          // Draw each line with selected color and font weight
          linesToRender.forEach((line, index) => {
            // Set font weight and color based on selection
            if (line.color === 'white') {
              ctx.font = `500 ${fontSize}px ${fontFamily}`; // Medium 500
              ctx.fillStyle = '#FFFFFF';
            } else {
              ctx.font = `800 ${fontSize}px ${fontFamily}`; // ExtraBold 800
              ctx.fillStyle = '#FFD700'; // Yellow
            }
            
            const y = paddingY + (index * lineHeight);
            const text = line.text.trim();
            
            // Create 3D shadow effect - draw shadow layers first (enhanced)
            ctx.save();
            
            // Shadow layer 1: Large offset shadow (main 3D effect) - increased
            ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
            ctx.shadowBlur = 0;
            ctx.shadowOffsetX = 12;
            ctx.shadowOffsetY = 12;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Darker shadow color
            ctx.fillText(text, paddingX, y);
            
            // Shadow layer 2: Medium offset for depth - increased
            ctx.shadowOffsetX = 8;
            ctx.shadowOffsetY = 8;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillText(text, paddingX, y);
            
            // Shadow layer 3: Small offset for smooth transition - increased
            ctx.shadowOffsetX = 4;
            ctx.shadowOffsetY = 4;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            ctx.fillText(text, paddingX, y);
            
            // Shadow layer 4: Extra small offset for smoother gradient
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.fillText(text, paddingX, y);
            
            ctx.restore();
            
            // Draw stroke (outline) for definition - increased
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 6;
            ctx.strokeText(text, paddingX, y);
            
            // Draw main text on top
            if (line.color === 'white') {
              ctx.fillStyle = '#FFFFFF';
            } else {
              ctx.fillStyle = '#FFD700';
            }
            ctx.fillText(text, paddingX, y);
          });
          
          ctx.restore();
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
        console.error('Error generating preview:', error);
      } finally {
        setIsGenerating(false);
      }
    };

    generatePreview();
  }, [selectedBackground, selectedForeground, textLines]);

  const handleDownload = useCallback(() => {
    if (!combinedPreview) return;

    const link = document.createElement('a');
    link.href = combinedPreview;
    link.download = `youtube-thumbnail-${selectedBackground?.id || 'default'}-${selectedForeground?.id || 'none'}.webp`;
    
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
  }, [combinedPreview, selectedBackground, selectedForeground]);

  const handleReset = () => {
    setSelectedBackground(BACKGROUNDS[0] || null);
    setSelectedForeground(FOREGROUNDS[0] || null);
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

  const addTextLine = () => {
    if (textLines.length < 4) {
      setTextLines([...textLines, { text: '', color: 'white' }]);
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
          {/* Main Content: Preview Left, Controls Right */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Preview Section - Left */}
            <div className="w-full">
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

            {/* Controls Section - Right */}
            <div className="w-full space-y-6">
              {/* Foregrounds Section */}
              <div className="w-full">
                <h2 className="text-xl font-bold mb-3">
                  Emotion
                </h2>
                <div className="flex flex-wrap gap-3">
                  {FOREGROUNDS.map((foreground) => {
                    const isExpanded = expandedEmotionId === foreground.id;
                    const mainEmotion = foreground.emotions[0] || foreground.name;
                    const secondaryEmotions = foreground.emotions.slice(1);
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
              <div className="w-full">
                <h2 className="text-xl font-bold mb-3">
                  Background
                </h2>
                <div className="flex flex-wrap gap-3">
                  {BACKGROUNDS.map((background) => (
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

          {/* Text Section - Bottom, Full Width */}
          <div className="w-full border-t border-border pt-6">
            <h2 className="text-xl font-bold mb-4">Add Text</h2>
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
                      <span className="text-sm text-muted-foreground w-12">
                        {isYellow ? 'Yellow' : 'White'}
                      </span>
                    </div>
                    
                    {/* Text Input */}
                    <div className="flex-1">
                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => updateTextLine(index, e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && textLines.length < 4) {
                            e.preventDefault();
                            addTextLine();
                            // Focus the new line's input after state updates
                            setTimeout(() => {
                              const inputs = document.querySelectorAll<HTMLInputElement>('input[type="text"]');
                              const newLineInput = inputs[inputs.length - 1];
                              newLineInput?.focus();
                            }, 10);
                          }
                        }}
                        placeholder={`Line ${index + 1} (${line.color})...`}
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
                  onClick={addTextLine}
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

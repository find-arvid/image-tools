'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Check, ArrowLeft, AlertCircle } from 'lucide-react';
import { Dropzone, DropzoneContent, DropzoneEmptyState } from "@/components/ui/shadcn-io/dropzone";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

export default function Home() {
  const [files, setFiles] = useState<File[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [greyscalePreview, setGreyscalePreview] = useState<string | null>(null);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedImages, setCroppedImages] = useState<{
    blue: string | null;
    green: string | null;
    purple: string | null;
    red: string | null;
  }>({
    blue: null,
    green: null,
    purple: null,
    red: null,
  });
  const [croppedImageInfo, setCroppedImageInfo] = useState<{
    blue: { width: number; height: number; size: number } | null;
    green: { width: number; height: number; size: number } | null;
    purple: { width: number; height: number; size: number } | null;
    red: { width: number; height: number; size: number } | null;
  }>({
    blue: null,
    green: null,
    purple: null,
    red: null,
  });
  const [selectedOverlay, setSelectedOverlay] = useState<'blue' | 'green' | 'purple' | 'red' | null>(null);
  const [downloadedOverlay, setDownloadedOverlay] = useState<'blue' | 'green' | 'purple' | 'red' | null>(null);
  const [articleName, setArticleName] = useState<string>('');
  const [showArticleNameInput, setShowArticleNameInput] = useState(false);
  const [pendingDownloadColor, setPendingDownloadColor] = useState<'blue' | 'green' | 'purple' | 'red' | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  const validationErrorRef = useRef<string | null>(null);
  const cropSectionRef = useRef<HTMLDivElement>(null);
  const articleNameSectionRef = useRef<HTMLDivElement>(null);
  const croppedImagesSectionRef = useRef<HTMLDivElement>(null);

  // Scroll to crop interface when it becomes visible
  useEffect(() => {
    if (showCrop && cropSectionRef.current) {
      setTimeout(() => {
        cropSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [showCrop]);

  // Scroll to article name input when it becomes visible
  useEffect(() => {
    if (showArticleNameInput && articleNameSectionRef.current) {
      setTimeout(() => {
        articleNameSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [showArticleNameInput]);

  // Scroll to cropped images when they become available
  useEffect(() => {
    if ((croppedImages.blue || croppedImages.green || croppedImages.purple || croppedImages.red) && croppedImagesSectionRef.current) {
      setTimeout(() => {
        croppedImagesSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [croppedImages.blue, croppedImages.green, croppedImages.purple, croppedImages.red]);

  // Validation function
  const validateFile = (file: File): string | null => {
    const acceptedTypes = ['image/png', 'image/jpeg', 'image/heic', 'image/webp'];
    const acceptedExtensions = ['.png', '.jpg', '.jpeg', '.heic', '.webp'];
    
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = acceptedTypes.includes(file.type) || acceptedExtensions.includes(fileExtension);
    
    if (!isValidType) {
      return `Invalid file type. Accepted formats: PNG, JPEG, HEIC, WebP`;
    }
    
    return null;
  };

  const validateImageDimensions = (width: number, height: number): string | null => {
    const minWidth = 1600;
    const minHeight = 900;
    
    const errors: string[] = [];
    
    if (width < minWidth) {
      errors.push(`Width must be at least ${minWidth}px (current: ${width}px)`);
    }
    
    if (height < minHeight) {
      errors.push(`Height must be at least ${minHeight}px (current: ${height}px)`);
    }
    
    if (errors.length > 0) {
      return errors.join('. ');
    }
    
    return null;
  };

  useEffect(() => {
    if (files.length > 0) {
      // Validate file type first
      const fileTypeError = validateFile(files[0]);
      if (fileTypeError) {
        validationErrorRef.current = fileTypeError;
        setValidationError(fileTypeError);
        // Delay clearing files to ensure error is displayed
        setTimeout(() => {
          setFiles([]);
        }, 0);
        return;
      }
      
      validationErrorRef.current = null;
      setValidationError(null);
      const objectUrl = URL.createObjectURL(files[0]);
      setImagePreview(objectUrl);

      const img = new Image();
      img.onload = () => {
        const width = img.naturalWidth;
        const height = img.naturalHeight;
        setImageDimensions({ width, height });

        // Validate dimensions
        const dimensionError = validateImageDimensions(width, height);
        if (dimensionError) {
          validationErrorRef.current = dimensionError;
          setValidationError(dimensionError);
          // Delay clearing files to ensure error is displayed
          setTimeout(() => {
            setFiles([]);
          }, 0);
          URL.revokeObjectURL(objectUrl);
          return;
        }

        // Create greyscale version
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;

          // Convert to greyscale
          for (let i = 0; i < data.length; i += 4) {
            const grey = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
            data[i] = grey;     // Red
            data[i + 1] = grey; // Green
            data[i + 2] = grey; // Blue
            // data[i + 3] is alpha, leave it unchanged
          }

          ctx.putImageData(imageData, 0, 0);
          setGreyscalePreview(canvas.toDataURL());
          // Automatically show crop interface when greyscale is ready
          setShowCrop(true);
        }
      };
      img.onerror = () => {
        const errorMsg = 'Failed to load image. Please try a different file.';
        validationErrorRef.current = errorMsg;
        setValidationError(errorMsg);
        // Delay clearing files to ensure error is displayed
        setTimeout(() => {
          setFiles([]);
        }, 0);
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;

      return () => {
        URL.revokeObjectURL(objectUrl);
        setGreyscalePreview(null);
      };
    } else {
      setImagePreview(null);
      setImageDimensions(null);
      setGreyscalePreview(null);
      setCroppedImages({ blue: null, green: null, purple: null, red: null });
      setCroppedImageInfo({ blue: null, green: null, purple: null, red: null });
      setSelectedOverlay(null);
      setDownloadedOverlay(null);
      setShowCrop(false);
      setArticleName('');
      setShowArticleNameInput(false);
      setPendingDownloadColor(null);
      // Preserve validation error if it exists (from validation failure)
      if (validationErrorRef.current) {
        setValidationError(validationErrorRef.current);
      }
    }
  }, [files]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = useCallback(async () => {
    if (!greyscalePreview || !croppedAreaPixels) return;

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = greyscalePreview;
    });

    const overlayColors: Array<'blue' | 'green' | 'purple' | 'red'> = ['blue', 'green', 'purple', 'red'];
    const overlayPaths = {
      blue: '/overlay/Webopedia-news-overlay-blue-1600x900.png',
      green: '/overlay/Webopedia-news-overlay-green-1600x900.png',
      purple: '/overlay/Webopedia-news-overlay-purple-1600x900.png',
      red: '/overlay/Webopedia-news-overlay-red-1600x900.png',
    };

    const results: { [key: string]: string | null } = {};
    const infoResults: { [key: string]: { width: number; height: number; size: number } | null } = {};

    // Helper function to calculate file size from data URL
    const getFileSize = (dataUrl: string): number => {
      // Remove data:image/png;base64, prefix
      const base64 = dataUrl.split(',')[1];
      // Calculate size: base64 is ~33% larger than binary
      return Math.round((base64.length * 3) / 4);
    };

    // Generate all four versions
    for (const color of overlayColors) {
      try {
        const overlay = await new Promise<HTMLImageElement>((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = overlayPaths[color];
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          results[color] = null;
          infoResults[color] = null;
          continue;
        }

        // Target final output resolution (16:9)
        const targetWidth = 1600;
        const targetHeight = 900;

        canvas.width = croppedAreaPixels.width;
        canvas.height = croppedAreaPixels.height;

        // Draw the cropped greyscale image
        ctx.drawImage(
          image,
          croppedAreaPixels.x,
          croppedAreaPixels.y,
          croppedAreaPixels.width,
          croppedAreaPixels.height,
          0,
          0,
          croppedAreaPixels.width,
          croppedAreaPixels.height
        );

        // Composite the overlay on top
        ctx.drawImage(
          overlay,
          0,
          0,
          canvas.width,
          canvas.height
        );

        let finalImageUrl: string;
        let finalImageWidth: number;
        let finalImageHeight: number;

        // Always scale to the target resolution (1600x900)
        const resizedCanvas = document.createElement('canvas');
        const resizedCtx = resizedCanvas.getContext('2d');
        if (resizedCtx) {
          resizedCanvas.width = targetWidth;
          resizedCanvas.height = targetHeight;

          resizedCtx.drawImage(
            canvas,
            0,
            0,
            canvas.width,
            canvas.height,
            0,
            0,
            targetWidth,
            targetHeight
          );

          // Convert to WebP with quality optimization (0.85 for good balance)
          finalImageUrl = resizedCanvas.toDataURL('image/webp', 0.85);
          finalImageWidth = targetWidth;
          finalImageHeight = targetHeight;
        } else {
          // Fallback: keep original canvas size
          finalImageUrl = canvas.toDataURL('image/webp', 0.85);
          finalImageWidth = canvas.width;
          finalImageHeight = canvas.height;
        }

        results[color] = finalImageUrl;
        infoResults[color] = {
          width: finalImageWidth,
          height: finalImageHeight,
          size: getFileSize(finalImageUrl),
        };
      } catch (error) {
        results[color] = null;
        infoResults[color] = null;
      }
    }

    setCroppedImages({
      blue: results.blue || null,
      green: results.green || null,
      purple: results.purple || null,
      red: results.red || null,
    });
    
    setCroppedImageInfo({
      blue: infoResults.blue || null,
      green: infoResults.green || null,
      purple: infoResults.purple || null,
      red: infoResults.red || null,
    });
    
    // Set first available overlay as selected
    const firstAvailable = overlayColors.find(color => results[color] !== null);
    setSelectedOverlay(firstAvailable || null);
    setShowCrop(false);
  }, [greyscalePreview, croppedAreaPixels]);

  const downloadGreyscale = () => {
    if (!greyscalePreview || !files[0]) return;

    const link = document.createElement('a');
    link.href = greyscalePreview;
    
    // Get original filename and add greyscale suffix
    const originalName = files[0].name;
    const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.')) || originalName;
    const ext = originalName.substring(originalName.lastIndexOf('.')) || '.png';
    link.download = `${nameWithoutExt}-greyscale${ext}`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatArticleName = (name: string): string => {
    // Currency symbol mappings
    const currencyMap: { [key: string]: string } = {
      '$': 'USD',
      '€': 'EUR',
      '£': 'GBP',
      '¥': 'JPY',
      '₹': 'INR',
      '₽': 'RUB',
      '₩': 'KRW',
      '₨': 'PKR',
      '₦': 'NGN',
      '₡': 'CRC',
      '₪': 'ILS',
      '₫': 'VND',
      '₭': 'LAK',
      '₮': 'MNT',
      '₯': 'GRD',
      '₰': 'DEM',
      '₱': 'PHP',
      '₲': 'PYG',
      '₳': 'ARA',
      '₴': 'UAH',
      '₵': 'GHS',
      '₶': 'BYN',
      '₷': 'KZT',
      '₸': 'KZT',
    };

    return name
      .replace(/%/g, 'percent') // Convert % to "percent"
      .replace(/\$|€|£|¥|₹|₽|₩|₨|₦|₡|₪|₫|₭|₮|₯|₰|₱|₲|₳|₴|₵|₶|₷|₸/g, (match) => currencyMap[match] || match) // Convert currency symbols
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')  // Replace spaces with dashes
      .replace(/[^a-z0-9-]/g, '')  // Remove special characters (keep only alphanumeric and dashes)
      .replace(/-+/g, '-')  // Replace multiple consecutive dashes with single dash
      .replace(/^-+|-+$/g, '');  // Remove leading and trailing dashes
  };

  const downloadCropped = (color: 'blue' | 'green' | 'purple' | 'red') => {
    if (!croppedImages[color] || !files[0]) return;

    // Show article name input instead of downloading immediately
    setPendingDownloadColor(color);
    setShowArticleNameInput(true);
    setArticleName('');
  };

  const performDownload = () => {
    if (!pendingDownloadColor || !croppedImages[pendingDownloadColor] || !files[0]) return;
    if (!articleName.trim()) return;

    const link = document.createElement('a');
    link.href = croppedImages[pendingDownloadColor]!;
    
    const formattedName = formatArticleName(articleName);
    link.download = `${formattedName}.webp`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show confirmation check icon
    setDownloadedOverlay(pendingDownloadColor);
    
    // Reset article name input
    setShowArticleNameInput(false);
    setArticleName('');
    setPendingDownloadColor(null);
    
    // Reset confirmation after 2 seconds
    setTimeout(() => {
      setDownloadedOverlay(null);
    }, 2000);
  };

  const handleRestart = () => {
    validationErrorRef.current = null;
    setFiles([]);
    setImagePreview(null);
    setGreyscalePreview(null);
    setImageDimensions(null);
    setShowCrop(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCroppedImages({ blue: null, green: null, purple: null, red: null });
    setCroppedImageInfo({ blue: null, green: null, purple: null, red: null });
    setSelectedOverlay(null);
    setDownloadedOverlay(null);
    setArticleName('');
    setShowArticleNameInput(false);
    setPendingDownloadColor(null);
    setValidationError(null);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Back to Home Button */}
      <div className="fixed top-4 left-4 z-20">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </Link>
      </div>
      
      {/* Header - Always visible */}
      <header className="w-full max-w-4xl mx-auto px-4 pt-8 pb-4">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Webopedia News Image Generator</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Quickly create branded visuals for Webopedia news articles. Upload an image, customise it with our preset styles and generate an on-brand graphic in seconds.
          </p>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pb-8">

        {/* Article Name Step - Highest Priority */}
        {showArticleNameInput && pendingDownloadColor ? (
          <div ref={articleNameSectionRef} className="flex min-h-[calc(100vh-20rem)] items-center justify-center">
            <div className="w-full max-w-md flex flex-col items-center gap-4 p-6 border border-border rounded-lg bg-card">
              <p className="text-sm font-medium">Name your image</p>
              <div className="text-xs text-muted-foreground text-left w-full space-y-2">
                <p>Paste the article name into the box. We'll turn it into an optimised file name before download. Here's what happens:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>All letters become lowercase</li>
                  <li>Words are separated by hyphens</li>
                  <li>Special characters are removed (e.g. ! ? &)</li>
                  <li>% and currency symbols are converted (e.g. 50% → 50percent, €10 → 10EUR)</li>
                </ul>
              </div>
              <input
                type="text"
                value={articleName}
                onChange={(e) => setArticleName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && articleName.trim()) {
                    performDownload();
                  }
                }}
                placeholder="Article title"
                className="w-full px-4 py-2 rounded-md border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                autoFocus
              />
              <div className="flex gap-2 w-full">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowArticleNameInput(false);
                    setArticleName('');
                    setPendingDownloadColor(null);
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={performDownload}
                  disabled={!articleName.trim()}
                  className="flex-1"
                >
                  Download
                </Button>
              </div>
            </div>
          </div>
        ) : /* Crop Step */
        showCrop && greyscalePreview && !(croppedImages.blue || croppedImages.green || croppedImages.purple || croppedImages.red) ? (
          <div ref={cropSectionRef} className="flex min-h-[calc(100vh-20rem)] items-center justify-center flex-col gap-4">
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4 p-4 border border-border rounded-lg bg-card">
              <div className="relative w-full" style={{ height: '400px' }}>
                <Cropper
                  image={greyscalePreview}
                  crop={crop}
                  zoom={zoom}
                  aspect={16 / 9}
                  onCropChange={setCrop}
                  onZoomChange={setZoom}
                  onCropComplete={onCropComplete}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="default"
                  size="sm"
                  onClick={createCroppedImage}
                >
                  Apply Crop
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setFiles([]);
                    setShowCrop(false);
                    setCrop({ x: 0, y: 0 });
                    setZoom(1);
                    setValidationError(null);
                    validationErrorRef.current = null;
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        ) : /* Results Step */
        (croppedImages.blue || croppedImages.green || croppedImages.purple || croppedImages.red) ? (
          <div ref={croppedImagesSectionRef} className="flex min-h-[calc(100vh-20rem)] items-center justify-center">
            <div className="w-full flex flex-col items-center gap-4">
              <p className="text-sm font-medium">Cropped Images with Overlays (16:9)</p>
              <div className="grid grid-cols-2 gap-4 w-full">
                {Object.entries(croppedImages).map(([color, imageUrl]) => {
                  if (!imageUrl) return null;
                  const info = croppedImageInfo[color as keyof typeof croppedImageInfo];
                  const formatFileSize = (bytes: number): string => {
                    if (bytes < 1024) return `${bytes} B`;
                    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
                    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
                  };
                  
                  return (
                    <div
                      key={color}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border-2 border-border"
                    >
                      <p className="text-xs font-medium capitalize">{color}</p>
                      <div className="w-full rounded-lg overflow-hidden border border-border">
                        <img
                          src={imageUrl}
                          alt={`Cropped greyscale ${color}`}
                          className="w-full h-auto max-h-48 object-contain"
                        />
                      </div>
                      {info && (
                        <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                          <p>{info.width} × {info.height} px</p>
                          <p>{formatFileSize(info.size)}</p>
                        </div>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => downloadCropped(color as 'blue' | 'green' | 'purple' | 'red')}
                        className="w-full"
                        disabled={downloadedOverlay === color}
                      >
                        {downloadedOverlay === color ? (
                          <>
                            <Check className="mr-2 h-4 w-4" />
                            Downloaded
                          </>
                        ) : (
                          'Download'
                        )}
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : /* Image Preview Step */
        files.length > 0 && imagePreview ? (
          <div className="flex min-h-[calc(100vh-20rem)] items-center justify-center">
            <div className="w-full text-center flex flex-col items-center gap-4">
              <div className="w-full rounded-lg overflow-hidden border border-border">
                <img
                  src={imagePreview}
                  alt={files[0].name}
                  className="w-full h-auto max-h-96 object-contain"
                />
              </div>
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm text-muted-foreground">Uploaded file:</p>
                <p className="font-medium">{files[0].name}</p>
                {imageDimensions && (
                  <p className="text-sm text-muted-foreground">
                    Resolution: {imageDimensions.width} × {imageDimensions.height} px
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : /* Upload Step */
        (
          <div className="flex min-h-[calc(100vh-20rem)] items-center justify-center">
            <div className="w-full flex flex-col items-center gap-4">
              <Dropzone
                src={files}
                onDrop={(acceptedFiles) => {
                  setFiles(acceptedFiles);
                }}
                onError={(error) => {
                  const errorMsg = error.message || 'Invalid file type. Accepted formats: PNG, JPEG, HEIC, WebP';
                  validationErrorRef.current = errorMsg;
                  setValidationError(errorMsg);
                }}
                accept={{
                  'image/png': ['.png'],
                  'image/jpeg': ['.jpeg', '.jpg'],
                  'image/heic': ['.heic'],
                  'image/webp': ['.webp']
                }}
                className="w-full"
              >
                <DropzoneEmptyState />
                <DropzoneContent />
              </Dropzone>
              {validationError && (
                <Alert variant="destructive" className="w-full max-w-md">
                  <AlertCircle />
                  <AlertTitle>Upload Error</AlertTitle>
                  <AlertDescription>{validationError}</AlertDescription>
                </Alert>
              )}
              <div className="w-full max-w-md text-center space-y-2">
                <p className="text-sm font-medium">Image Requirements</p>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong>Accepted formats:</strong> PNG, JPEG, HEIC, WebP</p>
                  <p><strong>Minimum dimensions:</strong> Height at least 900px, width at least 1600px</p>
                  <p className="text-xs opacity-75">Images will be cropped to 16:9 and resized to 1600 × 900 px</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
      
      {/* Fixed Restart Button at Bottom - Visible on all steps except upload */}
      {files.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center pb-6 z-10">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRestart}
          >
            Restart
          </Button>
        </div>
      )}
    </div>
  );
}


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
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);
  const [showCrop, setShowCrop] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [croppedImageInfo, setCroppedImageInfo] = useState<{ width: number; height: number; size: number } | null>(null);
  const [articleName, setArticleName] = useState<string>('');
  const [showArticleNameInput, setShowArticleNameInput] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const validationErrorRef = useRef<string | null>(null);
  const cropSectionRef = useRef<HTMLDivElement>(null);
  const articleNameSectionRef = useRef<HTMLDivElement>(null);
  const croppedImageSectionRef = useRef<HTMLDivElement>(null);

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

  // Scroll to cropped image when it becomes available
  useEffect(() => {
    if (croppedImage && croppedImageSectionRef.current) {
      setTimeout(() => {
        croppedImageSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [croppedImage]);

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
    const minWidth = 1920;
    const minHeight = 1080;
    
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
          setTimeout(() => {
            setFiles([]);
          }, 0);
          URL.revokeObjectURL(objectUrl);
          return;
        }

        // Automatically show crop interface when image is ready
        setShowCrop(true);
      };
      img.onerror = () => {
        const errorMsg = 'Failed to load image. Please try a different file.';
        validationErrorRef.current = errorMsg;
        setValidationError(errorMsg);
        setTimeout(() => {
          setFiles([]);
        }, 0);
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;

      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setImagePreview(null);
      setImageDimensions(null);
      setCroppedImage(null);
      setCroppedImageInfo(null);
      setShowCrop(false);
      setArticleName('');
      setShowArticleNameInput(false);
      setDownloaded(false);
      if (validationErrorRef.current) {
        setValidationError(validationErrorRef.current);
      }
    }
  }, [files]);

  const onCropComplete = useCallback((croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const createCroppedImage = useCallback(async () => {
    if (!imagePreview || !croppedAreaPixels) return;

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imagePreview;
    });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Target final output resolution (1920x1080)
    const targetWidth = 1920;
    const targetHeight = 1080;

    // Draw the cropped image
    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

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

    // Resize to target resolution (1920x1080)
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

      // Convert to WebP with quality optimization (higher compression)
      const finalImageUrl = resizedCanvas.toDataURL('image/webp', 0.70);
      
      // Calculate file size
      const getFileSize = (dataUrl: string): number => {
        const base64 = dataUrl.split(',')[1];
        return Math.round((base64.length * 3) / 4);
      };

      setCroppedImage(finalImageUrl);
      setCroppedImageInfo({
        width: targetWidth,
        height: targetHeight,
        size: getFileSize(finalImageUrl),
      });
      setShowCrop(false);
    }
  }, [imagePreview, croppedAreaPixels]);

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
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const downloadCropped = () => {
    if (!croppedImage || !files[0]) return;

    // Show article name input instead of downloading immediately
    setShowArticleNameInput(true);
    setArticleName('');
  };

  const performDownload = () => {
    if (!croppedImage || !files[0]) return;
    if (!articleName.trim()) return;

    const link = document.createElement('a');
    link.href = croppedImage;
    
    const formattedName = formatArticleName(articleName);
    link.download = `${formattedName}.webp`;
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Show confirmation
    setDownloaded(true);
    setShowArticleNameInput(false);
    setArticleName('');
    
    // Reset confirmation after 2 seconds
    setTimeout(() => {
      setDownloaded(false);
    }, 2000);
  };

  const handleRestart = () => {
    validationErrorRef.current = null;
    setFiles([]);
    setImagePreview(null);
    setImageDimensions(null);
    setShowCrop(false);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setCroppedImage(null);
    setCroppedImageInfo(null);
    setArticleName('');
    setShowArticleNameInput(false);
    setDownloaded(false);
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
          <h1 className="text-3xl font-bold mb-4">CCN Image Optimiser</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Crop and resize any image to meet CCN image guidelines. Upload an image, crop it to the required dimensions, and export an optimized file ready to upload.
          </p>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-4xl mx-auto px-4 pb-8">
        {/* Article Name Step - Highest Priority */}
        {showArticleNameInput ? (
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
        showCrop && imagePreview && !croppedImage ? (
          <div ref={cropSectionRef} className="flex min-h-[calc(100vh-20rem)] items-center justify-center flex-col gap-4">
            <div className="w-full max-w-2xl mx-auto flex flex-col items-center gap-4 p-4 border border-border rounded-lg bg-card">
              <div className="relative w-full" style={{ height: '400px' }}>
                <Cropper
                  image={imagePreview}
                  crop={crop}
                  zoom={zoom}
                  aspect={1920 / 1080}
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
        croppedImage ? (
          <div ref={croppedImageSectionRef} className="flex min-h-[calc(100vh-20rem)] items-center justify-center">
            <div className="w-full flex flex-col items-center gap-4">
              <p className="text-sm font-medium">Cropped Image (1920 × 1080)</p>
              <div className="w-full max-w-4xl flex flex-col items-center gap-4">
                <div className="w-full rounded-lg overflow-hidden border border-border">
                  <img
                    src={croppedImage}
                    alt="Cropped image"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
                {croppedImageInfo && (
                  <div className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
                    <p>{croppedImageInfo.width} × {croppedImageInfo.height} px</p>
                    <p>
                      {croppedImageInfo.size < 1024
                        ? `${croppedImageInfo.size} B`
                        : croppedImageInfo.size < 1024 * 1024
                        ? `${(croppedImageInfo.size / 1024).toFixed(1)} KB`
                        : `${(croppedImageInfo.size / (1024 * 1024)).toFixed(1)} MB`}
                    </p>
                  </div>
                )}
                <Button
                  variant="default"
                  size="sm"
                  onClick={downloadCropped}
                  className="w-full max-w-md"
                  disabled={downloaded}
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
                  <p><strong>Minimum dimensions:</strong> Width at least 1920px, height at least 1080px</p>
                  <p className="text-xs opacity-75">Images will be cropped to 1920 × 1080 px</p>
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


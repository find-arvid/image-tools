'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Loader2, Check, Tag, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageMetadata {
  id: string;
  filename: string;
  r2Key: string;
  publicUrl: string;
  emotions: string[];
  category?: string;
  uploadedBy?: string;
  uploadedAt: number;
  type: 'foreground' | 'background';
}

export default function AdminImagesPage() {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [uploadedImages, setUploadedImages] = useState<ImageMetadata[]>([]);
  const [loadingImages, setLoadingImages] = useState(true);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageType, setImageType] = useState<'foreground' | 'background'>('foreground');
  const [emotions, setEmotions] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'foreground' | 'background'>('all');
  const [imageToDelete, setImageToDelete] = useState<ImageMetadata | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [highlightedImageId, setHighlightedImageId] = useState<string | null>(null);
  const imageRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
    maxFiles: 1,
  });

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setUploadProgress('Uploading image...');

    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('type', imageType);
      formData.append('emotions', emotions);

      const response = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let error;
        try {
          error = await response.json();
        } catch (e) {
          // If response isn't JSON, get text
          const text = await response.text();
          console.error('Upload error (non-JSON):', text);
          throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
        }
        const errorMessage = error.error || error.details || `Upload failed: ${response.status} ${response.statusText}`;
        console.error('Upload error response:', error);
        console.error('Response status:', response.status);
        throw new Error(errorMessage);
      }

      const data = await response.json();
      const newImage = data.image;
      setUploadedImages(prev => [newImage, ...prev]);
      setUploadProgress('Upload successful!');
      
      // Reset form
      setSelectedFile(null);
      setEmotions('');
      
      setTimeout(() => {
        setUploadProgress('');
      }, 2000);

      // Scroll to and highlight the new image
      setTimeout(() => {
        const imageElement = imageRefs.current.get(newImage.id);
        if (imageElement) {
          imageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setHighlightedImageId(newImage.id);
          
          // Remove highlight after 5 seconds
          setTimeout(() => {
            setHighlightedImageId(null);
          }, 5000);
        }
      }, 100);
    } catch (error) {
      console.error('Upload error:', error);
      setUploadProgress(`Error: ${error instanceof Error ? error.message : 'Upload failed'}`);
    } finally {
      setUploading(false);
    }
  };

  // Load all images on mount
  useEffect(() => {
    const loadAllImages = async () => {
      try {
        setLoadingImages(true);
        const response = await fetch('/api/images');
        if (!response.ok) {
          throw new Error('Failed to fetch images');
        }
        const data = await response.json();
        setUploadedImages(data.images || []);
      } catch (error) {
        console.error('Error loading images:', error);
      } finally {
        setLoadingImages(false);
      }
    };

    loadAllImages();
  }, []);

  const handleDeleteClick = (image: ImageMetadata) => {
    setImageToDelete(image);
  };

  const handleDeleteConfirm = async () => {
    if (!imageToDelete) return;

    setIsDeleting(true);
    const id = imageToDelete.id;

    try {
      console.log('Deleting image with ID:', id);
      const response = await fetch(`/api/images/${id}`, {
        method: 'DELETE',
      });

      const result = await response.json();
      
      if (!response.ok) {
        // Check if it's a 404 (image not found) - treat as success since it's already deleted
        if (response.status === 404) {
          console.log('Image not found (already deleted), removing from list');
          setUploadedImages(prev => prev.filter(img => img.id !== id));
          setImageToDelete(null);
          setIsDeleting(false);
          return;
        }
        
        // For other errors, show the error
        const errorMessage = result.error || result.details || `Delete failed: ${response.status} ${response.statusText}`;
        throw new Error(errorMessage);
      }

      console.log('Delete successful:', result);

      // Remove from local state
      setUploadedImages(prev => prev.filter(img => img.id !== id));
      setImageToDelete(null);
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setImageToDelete(null);
  };

  // Filter images by type
  const filteredImages = filterType === 'all' 
    ? uploadedImages 
    : uploadedImages.filter(img => img.type === filterType);

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Image upload</h1>
          <p className="text-muted-foreground">
            Upload and tag images for the YouTube thumbnail creator
          </p>
        </div>

        {/* Upload Form */}
        <div className="bg-card border border-border rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold">Upload new image</h2>

          {/* File Dropzone */}
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            {selectedFile ? (
              <div className="space-y-2">
                <Check className="w-12 h-12 mx-auto text-green-500" />
                <p className="font-medium">{selectedFile.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedFile(null);
                  }}
                >
                  <X className="w-4 h-4 mr-2" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
                <p className="font-medium">
                  {isDragActive ? 'Drop the file here' : 'Drag & drop an image here'}
                </p>
                <p className="text-sm text-muted-foreground">
                  or click to select (PNG, JPG, WEBP)
                </p>
              </div>
            )}
          </div>

          {/* Image Type */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Image type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="foreground"
                  checked={imageType === 'foreground'}
                  onChange={(e) => setImageType(e.target.value as 'foreground' | 'background')}
                  className="w-4 h-4"
                />
                <span>Foreground</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="type"
                  value="background"
                  checked={imageType === 'background'}
                  onChange={(e) => setImageType(e.target.value as 'foreground' | 'background')}
                  className="w-4 h-4"
                />
                <span>Background</span>
              </label>
            </div>
          </div>

          {/* Emotions - Only show for foreground images */}
          {imageType === 'foreground' && (
            <div className="space-y-2">
              <label className="text-sm font-medium flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Emotion tags <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={emotions}
                onChange={(e) => setEmotions(e.target.value)}
                placeholder="e.g., amazed, shocked, excited (comma-separated)"
                className="w-full px-3 py-2 rounded-md border border-border bg-background"
              />
              <p className="text-xs text-muted-foreground">
                Separate multiple emotions with commas
              </p>
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || uploading || (imageType === 'foreground' && !emotions.trim())}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {uploadProgress || 'Uploading...'}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload image
              </>
            )}
          </Button>

          {uploadProgress && (
            <p className={`text-sm ${uploadProgress.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
              {uploadProgress}
            </p>
          )}
        </div>

        {/* All Uploaded Images */}
        <div className="bg-card border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Uploaded Images ({filteredImages.length})
            </h2>
            <div className="flex gap-2">
              <Button
                variant={filterType === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('all')}
              >
                All
              </Button>
              <Button
                variant={filterType === 'foreground' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('foreground')}
              >
                Foreground
              </Button>
              <Button
                variant={filterType === 'background' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setFilterType('background')}
              >
                Background
              </Button>
            </div>
          </div>
          
          {loadingImages ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading images...</span>
            </div>
          ) : filteredImages.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {filterType === 'all' 
                ? 'No images uploaded yet' 
                : `No ${filterType} images found`}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.id}
                  ref={(el) => {
                    if (el) {
                      imageRefs.current.set(image.id, el);
                    } else {
                      imageRefs.current.delete(image.id);
                    }
                  }}
                  className={`border rounded-lg p-4 space-y-2 transition-all duration-500 ${
                    highlightedImageId === image.id
                      ? 'border-[#cfe02d] ring-4 ring-[#cfe02d]/30 bg-[#cfe02d]/10'
                      : 'border-border'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{image.filename}</p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {image.type}
                      </p>
                      <p className="text-xs text-muted-foreground/50 font-mono mt-1 truncate" title={image.id}>
                        ID: {image.id.substring(0, 8)}...
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteClick(image)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                      title={`Delete image: ${image.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {image.emotions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {image.emotions.map((emotion, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                        >
                          {emotion}
                        </span>
                      ))}
                    </div>
                  )}
                  <img
                    src={`/api/images/proxy/${image.id}`}
                    alt={image.filename}
                    className="w-full h-32 object-contain rounded border border-border"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Delete Confirmation Modal */}
        {imageToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-lg p-6 max-w-md w-full space-y-4">
              <h3 className="text-lg font-semibold">Delete Image</h3>
              <p className="text-muted-foreground">
                Are you sure you want to delete <span className="font-medium">{imageToDelete.filename}</span>? 
                This action cannot be undone.
              </p>
              {imageToDelete.emotions.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {imageToDelete.emotions.map((emotion, idx) => (
                    <span
                      key={idx}
                      className="text-xs px-2 py-1 bg-primary/10 text-primary rounded"
                    >
                      {emotion}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={handleDeleteCancel}
                  disabled={isDeleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

import React, { useState, useCallback, useRef } from 'react';
import { Button } from '../../ui/Button';
import { Input } from '../../ui/Input';
import { Label } from '../../ui/Label';
import { Badge } from '../../ui/Badge';
import { Card, CardContent } from '../../ui/Card';
import { toast } from 'react-hot-toast';
import {
  Upload,
  X,
  Star,
  StarOff,
  Move,
  Edit2,
  Eye,
  AlertTriangle,
  ImageIcon,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  Download,
  Copy,
  Trash2,
  Check
} from 'lucide-react';
import type { CreateImageInput, UpdateImageInput } from '../../../types';

interface ImageData extends CreateImageInput {
  id?: string;
  isPrimary?: boolean;
  uploadProgress?: number;
  isUploading?: boolean;
  error?: string;
}

interface ProductImageManagerProps {
  images: ImageData[];
  onImageAdd: (imageData: { url: string; alt_text?: string }) => void;
  onImageRemove: (index: number) => void;
  onImageReorder: (fromIndex: number, toIndex: number) => void;
  onImageUpdate: (index: number, data: Partial<ImageData>) => void;
  maxImages?: number;
  allowedTypes?: string[];
  maxFileSize?: number; // in MB
}

const ProductImageManager: React.FC<ProductImageManagerProps> = ({
  images,
  onImageAdd,
  onImageRemove,
  onImageReorder,
  onImageUpdate,
  maxImages = 10,
  allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  maxFileSize = 5
}) => {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [editingImage, setEditingImage] = useState<number | null>(null);
  const [newAltText, setNewAltText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // File upload handler
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`);
      return;
    }

    setIsUploading(true);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File type ${file.type} not supported. Use JPEG, PNG, or WebP.`);
        continue;
      }

      // Validate file size
      if (file.size > maxFileSize * 1024 * 1024) {
        toast.error(`File ${file.name} is too large. Maximum size is ${maxFileSize}MB.`);
        continue;
      }

      try {
        // Create form data for upload
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'products');

        // Upload to server
        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Upload failed');
        }

        const result = await response.json();

        // Add uploaded image to list
        onImageAdd({
          url: result.url,
          alt_text: `Product image ${images.length + 1}`
        });

        toast.success(`${file.name} uploaded successfully`);
      } catch (error) {
        console.error('Upload error:', error);
        toast.error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [images.length, maxImages, allowedTypes, maxFileSize, onImageAdd]);

  // Handle drag and drop
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDrop = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onImageReorder(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  }, [draggedIndex, onImageReorder]);

  const handleFileDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files);
    }
  }, [handleFileUpload]);

  // Set primary image
  const setPrimaryImage = useCallback((index: number) => {
    images.forEach((_, i) => {
      onImageUpdate(i, { isPrimary: i === index });
    });
    toast.success('Primary image updated');
  }, [images, onImageUpdate]);

  // Update alt text
  const updateAltText = useCallback((index: number) => {
    if (newAltText.trim()) {
      onImageUpdate(index, { alt_text: newAltText.trim() });
      setEditingImage(null);
      setNewAltText('');
      toast.success('Alt text updated');
    }
  }, [newAltText, onImageUpdate]);

  // Copy image URL
  const copyImageUrl = useCallback(async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Image URL copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy URL');
    }
  }, []);

  // Download image
  const downloadImage = useCallback(async (url: string, index: number) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `product-image-${index + 1}.${blob.type.split('/')[1]}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('Image downloaded');
    } catch (error) {
      toast.error('Failed to download image');
    }
  }, []);

  const hasImages = images.length > 0;
  const canAddMore = images.length < maxImages;

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        ref={dropZoneRef}
        onDragOver={handleDragOver}
        onDrop={handleFileDrop}
        className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          isUploading
            ? 'border-blue-400 bg-blue-50'
            : canAddMore
            ? 'border-gray-300 hover:border-red-400 hover:bg-red-50'
            : 'border-gray-200 bg-gray-50'
        }`}
      >
        {isUploading ? (
          <div className="space-y-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-blue-600 font-medium">Uploading images...</p>
          </div>
        ) : (
          <div className="space-y-3">
            <Upload className={`h-12 w-12 mx-auto ${canAddMore ? 'text-gray-400' : 'text-gray-300'}`} />
            <div>
              <p className={`text-lg font-medium ${canAddMore ? 'text-gray-900' : 'text-gray-500'}`}>
                {canAddMore ? 'Upload Product Images' : `Maximum ${maxImages} images reached`}
              </p>
              {canAddMore && (
                <p className="text-gray-500 text-sm">
                  Drag and drop images here, or{' '}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-red-600 hover:text-red-700 underline"
                  >
                    browse files
                  </button>
                </p>
              )}
            </div>
            <div className="text-xs text-gray-400">
              <p>Supported formats: JPEG, PNG, WebP (max {maxFileSize}MB each)</p>
              <p>First image will be used as the primary image</p>
            </div>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={allowedTypes.join(',')}
          onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
          className="hidden"
          disabled={!canAddMore || isUploading}
        />
      </div>

      {/* Image Grid */}
      {hasImages && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              Uploaded Images ({images.length})
            </h3>
            <Badge variant="outline" className="text-xs">
              Drag to reorder
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {images.map((image, index) => (
              <Card
                key={`image-${index}`}
                className={`relative overflow-hidden transition-all ${
                  draggedIndex === index ? 'opacity-50 scale-95' : ''
                } ${
                  selectedImage === index ? 'ring-2 ring-red-500' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
              >
                <CardContent className="p-0">
                  {/* Image Display */}
                  <div className="relative aspect-square bg-gray-100">
                    <img
                      src={image.url}
                      alt={image.alt_text || `Product image ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjNmNGY2Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzljYTNhZiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkltYWdlIG5vdCBmb3VuZDwvdGV4dD48L3N2Zz4=';
                      }}
                    />

                    {/* Primary Badge */}
                    {(image.isPrimary || index === 0) && (
                      <Badge className="absolute top-2 left-2 bg-green-600 hover:bg-green-700">
                        <Star className="h-3 w-3 mr-1" />
                        Primary
                      </Badge>
                    )}

                    {/* Order Badge */}
                    <Badge
                      variant="outline"
                      className="absolute top-2 right-2 bg-white/90"
                    >
                      #{index + 1}
                    </Badge>

                    {/* Drag Handle */}
                    <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity bg-black/20 flex items-center justify-center">
                      <Move className="h-6 w-6 text-white" />
                    </div>
                  </div>

                  {/* Image Controls */}
                  <div className="p-3 space-y-2">
                    {/* Alt Text */}
                    <div className="space-y-1">
                      {editingImage === index ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={newAltText}
                            onChange={(e) => setNewAltText(e.target.value)}
                            placeholder="Enter alt text..."
                            className="text-xs"
                            autoFocus
                          />
                          <Button
                            size="sm"
                            onClick={() => updateAltText(index)}
                            disabled={!newAltText.trim()}
                          >
                            <Check className="h-3 w-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setEditingImage(null);
                              setNewAltText('');
                            }}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-start justify-between">
                          <p className="text-xs text-gray-600 flex-1 min-h-4">
                            {image.alt_text || 'No alt text'}
                          </p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setEditingImage(index);
                              setNewAltText(image.alt_text || '');
                            }}
                            className="h-6 w-6 p-0 ml-2"
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {/* Set Primary */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setPrimaryImage(index)}
                          disabled={image.isPrimary || index === 0}
                          className="h-6 w-6 p-0"
                          title="Set as primary"
                        >
                          {image.isPrimary || index === 0 ? (
                            <Star className="h-3 w-3 text-yellow-500" />
                          ) : (
                            <StarOff className="h-3 w-3" />
                          )}
                        </Button>

                        {/* Move Up */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onImageReorder(index, Math.max(0, index - 1))}
                          disabled={index === 0}
                          className="h-6 w-6 p-0"
                          title="Move up"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </Button>

                        {/* Move Down */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onImageReorder(index, Math.min(images.length - 1, index + 1))}
                          disabled={index === images.length - 1}
                          className="h-6 w-6 p-0"
                          title="Move down"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="flex items-center gap-1">
                        {/* Copy URL */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => copyImageUrl(image.url)}
                          className="h-6 w-6 p-0"
                          title="Copy URL"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>

                        {/* Download */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => downloadImage(image.url, index)}
                          className="h-6 w-6 p-0"
                          title="Download"
                        >
                          <Download className="h-3 w-3" />
                        </Button>

                        {/* Remove */}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to remove this image?')) {
                              onImageRemove(index);
                              toast.success('Image removed');
                            }
                          }}
                          className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                          title="Remove image"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Image Management Tips */}
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <ImageIcon className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-medium text-blue-900">Image Management Tips</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• The first image (or marked primary) will be used as the main product thumbnail</li>
                    <li>• Drag images to reorder them - customers will see them in this order</li>
                    <li>• Add descriptive alt text for better accessibility and SEO</li>
                    <li>• Use high-quality images (at least 800x800px) for best results</li>
                    <li>• Keep file sizes under {maxFileSize}MB for faster loading</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty State */}
      {!hasImages && !isUploading && (
        <Card className="border-dashed">
          <CardContent className="p-8 text-center">
            <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Images Yet</h3>
            <p className="text-gray-600 mb-4">
              Add some appetizing photos to showcase your menu item. Great photos can significantly boost orders!
            </p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={!canAddMore}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add First Image
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ProductImageManager;
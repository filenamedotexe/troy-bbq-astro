import React, { useState, useCallback } from 'react';
import { Button } from '../../ui/Button';
import AdminFileUpload, { type UploadedFile } from '../shared/AdminFileUpload';
import { Badge } from '../../ui/Badge';
import {
  Star,
  Image as ImageIcon,
  Eye,
  X,
  Move,
  Upload,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { DatabaseProductImage, CreateImageInput } from '../../../types';

export interface ProductImageUploadProps {
  productId?: string;
  images: DatabaseProductImage[];
  onImagesChange: (images: DatabaseProductImage[]) => void;
  onUpload?: (files: File[]) => Promise<DatabaseProductImage[]>;
  maxImages?: number;
  disabled?: boolean;
  className?: string;
}

const ProductImageUpload: React.FC<ProductImageUploadProps> = ({
  productId,
  images,
  onImagesChange,
  onUpload,
  maxImages = 10,
  disabled = false,
  className
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Convert database images to uploaded files format for display
  const existingFiles: UploadedFile[] = images.map(image => ({
    id: image.id,
    file: new File([], image.url.split('/').pop() || 'image', { type: 'image/jpeg' }),
    url: image.url,
    preview: image.url,
    status: 'success' as const,
    progress: 100,
    metadata: {
      alt_text: image.alt_text || '',
      sort_order: image.sort_order
    }
  }));

  // Handle file upload
  const handleUpload = useCallback(async (files: File[]) => {
    if (!onUpload) {
      // Simulate upload if no handler provided
      const newImages: DatabaseProductImage[] = files.map((file, index) => ({
        id: `temp_${Date.now()}_${index}`,
        product_id: productId || '',
        url: URL.createObjectURL(file),
        alt_text: '',
        sort_order: images.length + index,
        metadata: {},
        created_at: new Date()
      }));

      onImagesChange([...images, ...newImages]);
      return;
    }

    setIsUploading(true);

    try {
      const uploadedImages = await onUpload(files);
      onImagesChange([...images, ...uploadedImages]);
      setUploadedFiles([]); // Clear uploaded files after successful upload
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  }, [onUpload, productId, images, onImagesChange]);

  // Handle file changes (for preview)
  const handleFilesChange = useCallback((files: UploadedFile[]) => {
    setUploadedFiles(files);
  }, []);

  // Set image as primary (sort_order = 0)
  const setPrimaryImage = (imageId: string) => {
    const updatedImages = images.map((image, index) => ({
      ...image,
      sort_order: image.id === imageId ? 0 : index + 1
    }));

    // Sort to ensure primary image is first
    updatedImages.sort((a, b) => a.sort_order - b.sort_order);
    onImagesChange(updatedImages);
  };

  // Remove image
  const removeImage = (imageId: string) => {
    const filteredImages = images.filter(image => image.id !== imageId);
    // Reorder remaining images
    const reorderedImages = filteredImages.map((image, index) => ({
      ...image,
      sort_order: index
    }));
    onImagesChange(reorderedImages);
  };

  // Update image metadata
  const updateImageMetadata = (imageId: string, metadata: Partial<DatabaseProductImage>) => {
    const updatedImages = images.map(image =>
      image.id === imageId
        ? { ...image, ...metadata }
        : image
    );
    onImagesChange(updatedImages);
  };

  // Handle drag and drop reordering
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newImages = [...images];
    const draggedImage = newImages[draggedIndex];
    newImages.splice(draggedIndex, 1);
    newImages.splice(dropIndex, 0, draggedImage);

    // Update sort order
    const reorderedImages = newImages.map((image, index) => ({
      ...image,
      sort_order: index
    }));

    onImagesChange(reorderedImages);
    setDraggedIndex(null);
  };

  const totalImages = images.length + uploadedFiles.filter(f => f.status !== 'error').length;
  const canAddMore = totalImages < maxImages;

  return (
    <div className={cn("space-y-6", className)}>
      {/* Upload area */}
      {canAddMore && (
        <AdminFileUpload
          accept="image/*"
          multiple={true}
          maxFiles={maxImages - images.length}
          maxSize={5}
          files={uploadedFiles}
          onFilesChange={handleFilesChange}
          onUpload={handleUpload}
          disabled={disabled || isUploading}
          showPreview={false}
          allowReorder={false}
          folder="products"
          supportedFormats={['JPG', 'PNG', 'WebP', 'GIF']}
        />
      )}

      {/* Existing images */}
      {images.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Product Images ({images.length}/{maxImages})
            </h4>
            <div className="text-xs text-gray-500">
              Drag to reorder • First image is the primary image
            </div>
          </div>

          <div className="grid gap-4">
            {images
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((image, index) => (
                <div
                  key={image.id}
                  draggable={!disabled}
                  onDragStart={(e) => !disabled && handleDragStart(e, index)}
                  onDragOver={(e) => !disabled && handleDragOver(e, index)}
                  onDrop={(e) => !disabled && handleDrop(e, index)}
                  className={cn(
                    "flex items-start gap-4 p-4 border rounded-lg bg-white transition-all",
                    !disabled && "cursor-move hover:bg-gray-50",
                    draggedIndex === index && "opacity-50",
                    image.sort_order === 0 && "border-blue-200 bg-blue-50"
                  )}
                >
                  {/* Image preview */}
                  <div className="relative">
                    <div className="w-20 h-20 bg-gray-100 rounded border overflow-hidden">
                      <img
                        src={image.url}
                        alt={image.alt_text || 'Product image'}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Primary image badge */}
                    {image.sort_order === 0 && (
                      <div className="absolute -top-2 -right-2">
                        <Badge className="bg-blue-600 text-white flex items-center gap-1 text-xs">
                          <Star className="h-3 w-3" />
                          Primary
                        </Badge>
                      </div>
                    )}

                    {/* Drag handle */}
                    {!disabled && (
                      <div className="absolute -top-1 -left-1 bg-white border rounded p-1">
                        <Move className="h-3 w-3 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Image details */}
                  <div className="flex-1 min-w-0 space-y-3">
                    {/* Image info */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h5 className="text-sm font-medium text-gray-900">
                          Image {index + 1}
                        </h5>
                        {image.sort_order === 0 && (
                          <Badge variant="outline" className="text-xs">
                            Primary
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-gray-500">
                        {image.url.split('/').pop()}
                      </p>
                    </div>

                    {/* Alt text input */}
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Alt Text (for accessibility)
                      </label>
                      <input
                        type="text"
                        value={image.alt_text || ''}
                        onChange={(e) => updateImageMetadata(image.id, { alt_text: e.target.value })}
                        placeholder="Describe this image..."
                        disabled={disabled}
                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-50 disabled:text-gray-500"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(image.url, '_blank')}
                      className="h-8 w-8 p-0"
                      title="View full size"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>

                    {image.sort_order !== 0 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setPrimaryImage(image.id)}
                        disabled={disabled}
                        className="h-8 w-8 p-0"
                        title="Set as primary image"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}

                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeImage(image.id)}
                      disabled={disabled}
                      className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                      title="Remove image"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Image guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <div className="flex-shrink-0">
            <ImageIcon className="h-5 w-5 text-blue-600" />
          </div>
          <div className="text-sm">
            <h4 className="font-medium text-blue-900 mb-1">Image Guidelines</h4>
            <ul className="text-blue-700 space-y-1">
              <li>• Use high-quality images (minimum 800x800px recommended)</li>
              <li>• First image will be used as the primary product image</li>
              <li>• Supported formats: JPG, PNG, WebP, GIF</li>
              <li>• Maximum file size: 5MB per image</li>
              <li>• Add descriptive alt text for better accessibility</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Upload status */}
      {isUploading && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-yellow-600" />
            <span className="text-sm text-yellow-800">Uploading images...</span>
          </div>
        </div>
      )}

      {/* Limits warning */}
      {totalImages >= maxImages && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Maximum images reached</p>
              <p>You've added the maximum number of images ({maxImages}). Remove an image to add a new one.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductImageUpload;
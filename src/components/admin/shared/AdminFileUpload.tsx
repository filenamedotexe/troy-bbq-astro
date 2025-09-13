import React, { useState, useRef, useCallback } from 'react';
import { Button } from '../../ui/Button';
import { Badge } from '../../ui/Badge';
import {
  Upload,
  X,
  Image as ImageIcon,
  File,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Move
} from 'lucide-react';
import { cn } from '../../../lib/utils';

export interface UploadedFile {
  id: string;
  file: File;
  url?: string;
  preview?: string;
  status: 'uploading' | 'success' | 'error';
  progress?: number;
  error?: string;
  metadata?: {
    alt_text?: string;
    sort_order?: number;
    [key: string]: any;
  };
}

export interface AdminFileUploadProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number; // in MB
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
  onUpload?: (files: File[]) => Promise<void>;
  disabled?: boolean;
  className?: string;
  showPreview?: boolean;
  allowReorder?: boolean;
  folder?: string;
  supportedFormats?: string[];
}

const AdminFileUpload: React.FC<AdminFileUploadProps> = ({
  accept = "image/*",
  multiple = false,
  maxFiles = 10,
  maxSize = 5, // 5MB default
  files,
  onFilesChange,
  onUpload,
  disabled = false,
  className,
  showPreview = true,
  allowReorder = true,
  folder = 'products',
  supportedFormats = ['JPG', 'PNG', 'WebP', 'GIF']
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate preview URL for file
  const generatePreview = useCallback((file: File): string => {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file);
    }
    return '';
  }, []);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    // Check file size
    if (file.size > maxSize * 1024 * 1024) {
      return `File size exceeds ${maxSize}MB limit`;
    }

    // Check file type
    if (accept !== "*/*" && !file.type.match(accept.replace(/\*/g, '.*'))) {
      return `File type not supported. Accepted formats: ${supportedFormats.join(', ')}`;
    }

    return null;
  }, [maxSize, accept, supportedFormats]);

  // Handle file selection
  const handleFileSelect = useCallback((selectedFiles: FileList | File[]) => {
    const fileArray = Array.from(selectedFiles);
    const newFiles: UploadedFile[] = [];

    // Check if adding these files would exceed maxFiles
    if (files.length + fileArray.length > maxFiles) {
      alert(`Cannot add more than ${maxFiles} files`);
      return;
    }

    fileArray.forEach((file, index) => {
      const error = validateFile(file);
      const preview = generatePreview(file);

      const uploadedFile: UploadedFile = {
        id: `${Date.now()}-${index}`,
        file,
        preview,
        status: error ? 'error' : 'uploading',
        progress: 0,
        error,
        metadata: {
          alt_text: '',
          sort_order: files.length + index
        }
      };

      newFiles.push(uploadedFile);
    });

    const updatedFiles = [...files, ...newFiles];
    onFilesChange(updatedFiles);

    // Trigger upload for valid files
    if (onUpload) {
      const validFiles = newFiles.filter(f => !f.error).map(f => f.file);
      if (validFiles.length > 0) {
        onUpload(validFiles).catch((error) => {
          console.error('Upload failed:', error);
          // Update file status to error
          const errorFiles = updatedFiles.map(f => {
            if (validFiles.includes(f.file)) {
              return { ...f, status: 'error' as const, error: 'Upload failed' };
            }
            return f;
          });
          onFilesChange(errorFiles);
        });
      }
    } else {
      // If no upload handler, mark as success
      setTimeout(() => {
        const successFiles = updatedFiles.map(f =>
          f.error ? f : { ...f, status: 'success' as const, progress: 100 }
        );
        onFilesChange(successFiles);
      }, 1000);
    }
  }, [files, maxFiles, validateFile, generatePreview, onFilesChange, onUpload]);

  // Handle drag and drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (disabled) return;

    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles);
    }
  }, [disabled, handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles);
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  }, [handleFileSelect]);

  // Remove file
  const handleRemoveFile = useCallback((fileId: string) => {
    const updatedFiles = files.filter(f => f.id !== fileId);
    onFilesChange(updatedFiles);
  }, [files, onFilesChange]);

  // Update file metadata
  const handleUpdateMetadata = useCallback((fileId: string, metadata: Partial<UploadedFile['metadata']>) => {
    const updatedFiles = files.map(f =>
      f.id === fileId
        ? { ...f, metadata: { ...f.metadata, ...metadata } }
        : f
    );
    onFilesChange(updatedFiles);
  }, [files, onFilesChange]);

  // Handle reordering
  const handleDragStart = useCallback((e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const handleDragOverItem = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  const handleDropItem = useCallback((e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();

    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      return;
    }

    const newFiles = [...files];
    const draggedFile = newFiles[draggedIndex];
    newFiles.splice(draggedIndex, 1);
    newFiles.splice(dropIndex, 0, draggedFile);

    // Update sort order
    const reorderedFiles = newFiles.map((file, index) => ({
      ...file,
      metadata: { ...file.metadata, sort_order: index }
    }));

    onFilesChange(reorderedFiles);
    setDraggedIndex(null);
  }, [draggedIndex, files, onFilesChange]);

  // Render file status icon
  const renderFileStatus = (file: UploadedFile) => {
    switch (file.status) {
      case 'uploading':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      {/* Upload area */}
      <div
        className={cn(
          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
          isDragOver
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-gray-100 rounded-full">
            <Upload className="h-6 w-6 text-gray-600" />
          </div>

          <div>
            <p className="text-lg font-medium text-gray-900">
              {isDragOver ? 'Drop files here' : 'Upload files'}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {multiple
                ? `Drag and drop files here, or click to select (max ${maxFiles} files)`
                : 'Drag and drop a file here, or click to select'
              }
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Supported formats: {supportedFormats.join(', ')} • Max size: {maxSize}MB
            </p>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || files.length >= maxFiles}
          >
            <Upload className="h-4 w-4 mr-2" />
            Choose Files
          </Button>

          <input
            ref={fileInputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleInputChange}
            disabled={disabled}
            className="hidden"
          />
        </div>
      </div>

      {/* Files list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Files ({files.length}/{maxFiles})
            </h4>
            {allowReorder && files.length > 1 && (
              <span className="text-xs text-gray-500">
                Drag to reorder
              </span>
            )}
          </div>

          <div className="grid gap-3">
            {files.map((file, index) => (
              <div
                key={file.id}
                draggable={allowReorder && !disabled}
                onDragStart={(e) => allowReorder && handleDragStart(e, index)}
                onDragOver={(e) => allowReorder && handleDragOverItem(e, index)}
                onDrop={(e) => allowReorder && handleDropItem(e, index)}
                className={cn(
                  "flex items-center gap-4 p-3 border rounded-lg bg-white",
                  file.status === 'error' && "border-red-200 bg-red-50",
                  file.status === 'success' && "border-green-200 bg-green-50",
                  allowReorder && "cursor-move hover:bg-gray-50"
                )}
              >
                {/* File preview */}
                {showPreview && file.preview ? (
                  <img
                    src={file.preview}
                    alt={file.metadata?.alt_text || file.file.name}
                    className="w-12 h-12 object-cover rounded border"
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded border flex items-center justify-center">
                    {file.file.type.startsWith('image/') ? (
                      <ImageIcon className="h-6 w-6 text-gray-400" />
                    ) : (
                      <File className="h-6 w-6 text-gray-400" />
                    )}
                  </div>
                )}

                {/* File info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {file.file.name}
                    </p>
                    {renderFileStatus(file)}
                  </div>
                  <p className="text-xs text-gray-500">
                    {(file.file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                  {file.error && (
                    <p className="text-xs text-red-600 mt-1">{file.error}</p>
                  )}

                  {/* Progress bar */}
                  {file.status === 'uploading' && typeof file.progress === 'number' && (
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${file.progress}%` }}
                      />
                    </div>
                  )}

                  {/* Alt text input for images */}
                  {file.status === 'success' && file.file.type.startsWith('image/') && (
                    <input
                      type="text"
                      placeholder="Alt text (optional)"
                      value={file.metadata?.alt_text || ''}
                      onChange={(e) => handleUpdateMetadata(file.id, { alt_text: e.target.value })}
                      className="w-full mt-2 px-2 py-1 text-xs border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  {allowReorder && (
                    <Move className="h-4 w-4 text-gray-400" />
                  )}

                  {file.preview && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(file.preview, '_blank')}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveFile(file.id)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-800 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFileUpload;
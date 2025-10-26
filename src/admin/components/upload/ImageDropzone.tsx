/**
 * Image Dropzone Component
 * Drag-and-drop file upload for images
 */

import { useCallback } from "react";
import { useImageDropzone } from "../../hooks/useImageUpload";
import { ImageRef } from "../../types/admin-config";
import { Upload, X } from "lucide-react";

// ============================================================================
// Component Props
// ============================================================================

interface ImageDropzoneProps {
  onImageSelect: (imageRef: ImageRef) => void;
  maxSizeMB?: number;
  allowedTypes?: string[];
  currentImage?: ImageRef | null;
  onImageRemove?: () => void;
  autoResize?: boolean;
  maxDimension?: number;
}

// ============================================================================
// Component
// ============================================================================

export default function ImageDropzone({
  onImageSelect,
  maxSizeMB = 10,
  allowedTypes = ["image/jpeg", "image/png"],
  currentImage = null,
  onImageRemove,
  autoResize = true,
  maxDimension = 1920,
}: ImageDropzoneProps) {
  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isUploading,
    preview,
    imageRef,
    error,
    clearImage,
  } = useImageDropzone({
    maxSizeMB,
    allowedTypes,
    autoResize,
    maxDimension,
  });

  // Handle image selection
  const handleImageSelected = useCallback(() => {
    if (imageRef) {
      onImageSelect(imageRef);
    }
  }, [imageRef, onImageSelect]);

  // Handle image removal
  const handleRemove = () => {
    clearImage();
    if (onImageRemove) {
      onImageRemove();
    }
  };

  // Show current or uploaded image
  const displayImage = currentImage || (preview ? imageRef : null);

  return (
    <div className="space-y-3">
      {displayImage ? (
        // Image Preview
        <div className="relative group">
          <img
            src={displayImage.url || preview || ""}
            alt="Upload preview"
            className="w-full h-48 object-cover rounded-lg border-2 border-gray-200"
          />

          {/* Remove Button */}
          <button
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-700"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Image Info */}
          <div className="mt-2 text-xs text-gray-600">
            <p>
              {displayImage.filename} • {Math.round(displayImage.size / 1024)}KB
              • {displayImage.width} × {displayImage.height}
            </p>
          </div>
        </div>
      ) : (
        // Dropzone
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400 hover:bg-gray-50"
          } ${isUploading ? "opacity-50 cursor-wait" : ""}`}
        >
          <input {...getInputProps()} />

          <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />

          {isUploading ? (
            <p className="text-sm text-gray-600">Uploading...</p>
          ) : isDragActive ? (
            <p className="text-sm text-blue-600 font-medium">
              Drop image here...
            </p>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-1">
                Drag & drop an image here, or click to browse
              </p>
              <p className="text-xs text-gray-500">
                JPEG or PNG, max {maxSizeMB}MB
              </p>
            </>
          )}
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
          {error}
        </div>
      )}

      {/* Upload Button (when image is selected but not confirmed) */}
      {imageRef && !currentImage && (
        <button
          onClick={handleImageSelected}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Use This Image
        </button>
      )}
    </div>
  );
}

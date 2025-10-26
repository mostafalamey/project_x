/**
 * Panoramic Upload Modal
 * Upload a single 360° panoramic image for street view tour points
 */

import { useState, useCallback, useRef } from "react";
import { X, Upload, Image as ImageIcon } from "lucide-react";
import type { ImageRef } from "../../types/admin-config";

// ============================================================================
// Component Props
// ============================================================================

interface PanoramicUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (image: ImageRef) => Promise<void>;
  tourPointName: string;
  existingImage?: ImageRef;
}

// ============================================================================
// Component
// ============================================================================

export default function PanoramicUploadModal({
  isOpen,
  onClose,
  onUpload,
  tourPointName,
  existingImage,
}: PanoramicUploadModalProps) {
  const [selectedImage, setSelectedImage] = useState<ImageRef | null>(
    existingImage || null
  );
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Handle file selection
  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    // Read image
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const imageRef: ImageRef = {
        id: crypto.randomUUID(),
        filename: file.name,
        blob: file,
        url: objectUrl,
        width: img.width,
        height: img.height,
        size: file.size,
        mimeType: file.type as "image/jpeg" | "image/png",
        uploadedAt: new Date().toISOString(),
      };

      setSelectedImage(imageRef);
    };

    img.src = objectUrl;
  };

  // Handle drag and drop
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  }, []);

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  // Handle upload
  const handleUpload = async () => {
    if (!selectedImage) {
      alert("Please select a panoramic image first");
      return;
    }

    setIsUploading(true);

    try {
      // Convert blob to data URL
      const reader = new FileReader();
      reader.onload = async () => {
        const dataUrl = reader.result as string;
        const imageWithDataURL: ImageRef = {
          ...selectedImage,
          url: dataUrl,
        };

        await onUpload(imageWithDataURL);
        onClose();
      };
      reader.readAsDataURL(selectedImage.blob!);
    } catch (error) {
      console.error("Upload failed:", error);
      alert("Failed to upload panoramic image. Please try again.");
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Upload Panoramic Image
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Upload a 360° panoramic image for:{" "}
              <strong>{tourPointName}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedImage ? (
            /* Upload Area */
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 hover:border-gray-400"
              }`}
            >
              <ImageIcon className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                Drop your panoramic image here
              </p>
              <p className="text-sm text-gray-500 mb-4">
                or click to browse for a file
              </p>
              <p className="text-xs text-gray-400 mb-4">
                Recommended: 360° equirectangular panorama (2:1 aspect ratio)
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Upload className="w-5 h-5" />
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                aria-label="Upload panoramic image"
              />
            </div>
          ) : (
            /* Preview */
            <div className="space-y-4">
              <div className="relative rounded-lg overflow-hidden bg-gray-100">
                <img
                  src={selectedImage.url}
                  alt="Panoramic preview"
                  className="w-full h-auto"
                />
              </div>

              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Filename:</span>
                  <span className="font-medium text-gray-900">
                    {selectedImage.filename}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Dimensions:</span>
                  <span className="font-medium text-gray-900">
                    {selectedImage.width} × {selectedImage.height}px
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Size:</span>
                  <span className="font-medium text-gray-900">
                    {(selectedImage.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Aspect Ratio:</span>
                  <span
                    className={`font-medium ${
                      Math.abs(selectedImage.width / selectedImage.height - 2) <
                      0.1
                        ? "text-green-600"
                        : "text-yellow-600"
                    }`}
                  >
                    {(selectedImage.width / selectedImage.height).toFixed(2)}:1
                    {Math.abs(selectedImage.width / selectedImage.height - 2) <
                    0.1
                      ? " ✓"
                      : " (Recommended: 2:1)"}
                  </span>
                </div>
              </div>

              <button
                onClick={() => {
                  if (selectedImage.url) {
                    URL.revokeObjectURL(selectedImage.url);
                  }
                  setSelectedImage(null);
                }}
                className="w-full px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Choose Different Image
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-6 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!selectedImage || isUploading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2"
          >
            {isUploading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload Panoramic
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Transition Upload Modal
 * Upload multiple frame images for angle-to-angle transition sequences
 */

import { useState, useCallback, useEffect } from "react";
import { X, Upload, Trash2, Film, CheckCircle } from "lucide-react";
import type { ImageRef, TransitionSequence } from "../../types/admin-config";

// ============================================================================
// Component Props
// ============================================================================

interface TransitionUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (frames: ImageRef[]) => Promise<void>;
  onDelete?: () => void;
  currentAngleIndex: number;
  nextAngleIndex: number;
  existingTransition?: TransitionSequence;
}

// ============================================================================
// Component
// ============================================================================

export default function TransitionUploadModal({
  isOpen,
  onClose,
  onUpload,
  onDelete,
  currentAngleIndex,
  nextAngleIndex,
  existingTransition,
}: TransitionUploadModalProps) {
  const [frames, setFrames] = useState<ImageRef[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [hasModifications, setHasModifications] = useState(false);

  // Load existing frames when modal opens
  useEffect(() => {
    if (isOpen && existingTransition?.frames) {
      setFrames(existingTransition.frames);
      setHasModifications(false);
    } else if (isOpen && !existingTransition) {
      setFrames([]);
      setHasModifications(false);
    }
  }, [isOpen, existingTransition]);

  // Handle file selection
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFrames: ImageRef[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith("image/")) continue;

      // Read image dimensions
      const img = new Image();
      const objectUrl = URL.createObjectURL(file);

      await new Promise<void>((resolve) => {
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

          newFrames.push(imageRef);
          resolve();
        };
        img.src = objectUrl;
      });
    }

    setFrames((prev) =>
      [...prev, ...newFrames].sort((a, b) =>
        a.filename.localeCompare(b.filename)
      )
    );
    setHasModifications(true);
  }, []);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(false);

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleFiles(e.dataTransfer.files);
      }
    },
    [handleFiles]
  );

  // Handle file input change
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) {
        handleFiles(e.target.files);
      }
    },
    [handleFiles]
  );

  // Remove frame
  const handleRemoveFrame = useCallback((frameId: string) => {
    setFrames((prev) => {
      const frame = prev.find((f) => f.id === frameId);
      if (frame?.url && frame.url.startsWith("blob:")) {
        URL.revokeObjectURL(frame.url);
      }
      return prev.filter((f) => f.id !== frameId);
    });
    setHasModifications(true);
  }, []);

  // Handle upload
  const handleUpload = useCallback(async () => {
    if (frames.length === 0) return;

    setIsUploading(true);
    try {
      await onUpload(frames);

      // Clean up object URLs (only for newly added blob URLs)
      frames.forEach((frame) => {
        if (frame.url && frame.url.startsWith("blob:")) {
          URL.revokeObjectURL(frame.url);
        }
      });

      setFrames([]);
      setHasModifications(false);
      onClose();
    } catch (error) {
      console.error("Upload failed:", error);
      alert(
        `Upload failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setIsUploading(false);
    }
  }, [frames, onUpload, onClose]);

  // Handle close
  const handleClose = useCallback(() => {
    // Clean up only blob URLs (newly uploaded files)
    frames.forEach((frame) => {
      if (frame.url && frame.url.startsWith("blob:")) {
        URL.revokeObjectURL(frame.url);
      }
    });
    setFrames([]);
    setHasModifications(false);
    onClose();
  }, [frames, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <Film className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                Upload Transition Frames
              </h2>
              <p className="text-sm text-gray-600">
                Angle {currentAngleIndex + 1} → Angle {nextAngleIndex + 1}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={isUploading}
            title="Close modal"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Existing Transition Info Banner - Only show if no modifications yet */}
          {existingTransition && !hasModifications && frames.length > 0 && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-blue-700">
                    Viewing {existingTransition.frameCount} existing frames
                  </span>
                </div>
                {onDelete && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          "Delete entire transition? This will remove all frames and cannot be undone."
                        )
                      ) {
                        onDelete();
                        onClose();
                      }
                    }}
                    className="text-sm text-red-600 hover:text-red-700 font-medium"
                    disabled={isUploading}
                  >
                    Delete All
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Frames Preview */}
          {frames.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium text-gray-900">
                  Transition Frames ({frames.length})
                </h3>
                {frames.length > 1 && (
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Clear all ${frames.length} frames? This cannot be undone.`
                        )
                      ) {
                        frames.forEach((frame) => {
                          if (frame.url && frame.url.startsWith("blob:")) {
                            URL.revokeObjectURL(frame.url);
                          }
                        });
                        setFrames([]);
                        setHasModifications(true);
                      }
                    }}
                    className="text-sm text-red-600 hover:text-red-700"
                    disabled={isUploading}
                  >
                    Clear All
                  </button>
                )}
              </div>

              <div className="grid grid-cols-6 gap-3">
                {frames.map((frame, index) => (
                  <div
                    key={frame.id}
                    className="relative aspect-square bg-gray-100 rounded-lg overflow-hidden group"
                  >
                    <img
                      src={frame.url}
                      alt={`Frame ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex items-center justify-center">
                      <button
                        onClick={() => handleRemoveFrame(frame.id)}
                        className="opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all"
                        disabled={isUploading}
                        title="Remove frame"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="absolute bottom-1 left-1 right-1 bg-black/75 text-white text-xs py-1 px-2 rounded text-center">
                      #{index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upload Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-purple-500 bg-purple-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Upload
              className={`w-12 h-12 mx-auto mb-4 ${
                dragActive ? "text-purple-500" : "text-gray-400"
              }`}
            />
            <p className="text-sm text-gray-600 mb-2">
              Drag and drop transition frames here, or click to browse
            </p>
            <p className="text-xs text-gray-500 mb-4">
              Upload frames in sequence order (they will be sorted by filename)
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={handleInputChange}
              className="hidden"
              id="transition-upload"
              disabled={isUploading}
            />
            <label
              htmlFor="transition-upload"
              className="inline-block px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors cursor-pointer"
            >
              Browse Files
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-600">
            {frames.length === 0
              ? "No frames yet"
              : hasModifications
              ? `${frames.length} frame${
                  frames.length === 1 ? "" : "s"
                } (modified)`
              : `${frames.length} frame${frames.length === 1 ? "" : "s"}`}
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              disabled={isUploading}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={frames.length === 0 || isUploading || !hasModifications}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading
                ? "Saving..."
                : hasModifications
                ? "Save Changes"
                : existingTransition
                ? "No Changes"
                : "Upload Transition"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

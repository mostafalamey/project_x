/**
 * Model 360° Rotation Uploader Component
 * Upload and manage 360° rotation frame sequences
 */

import { useState, useEffect, useRef } from "react";
import { Rotation360Config, ImageRef } from "../../types/admin-config";
import { useImageUpload } from "../../hooks/useImageUpload";
import { Upload, X, Play, Pause, AlertCircle, CheckCircle } from "lucide-react";

// ============================================================================
// Component Props
// ============================================================================

interface Model360RotationUploaderProps {
  rotation360?: Rotation360Config | null;
  onRotationUpdate: (config: Rotation360Config | null) => void;
}

// ============================================================================
// Component
// ============================================================================

export default function Model360RotationUploader({
  rotation360,
  onRotationUpdate,
}: Model360RotationUploaderProps) {
  const { selectFiles, isUploading, progress, error } = useImageUpload({
    maxSizeMB: 10,
    allowedTypes: ["image/jpeg", "image/png"],
    autoResize: true,
    maxDimension: 1920,
  });

  const [frames, setFrames] = useState<ImageRef[]>([]);
  const [frameCount, setFrameCount] = useState(12);
  const [filenamePattern, setFilenamePattern] = useState("");
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load existing rotation config
  useEffect(() => {
    if (rotation360) {
      setFrames(rotation360.frames || []);
      setFrameCount(rotation360.frameCount);
      setFilenamePattern(rotation360.filenamePattern || "");
    }
  }, [rotation360]);

  // Auto-play animation
  useEffect(() => {
    if (isPlaying && frames.length > 1) {
      intervalRef.current = setInterval(() => {
        setCurrentFrame((prev) => (prev + 1) % frames.length);
      }, 100); // 10 FPS
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, frames.length]);

  // Validate frames
  const validateFrames = (uploadedFrames: ImageRef[]): string[] => {
    const errors: string[] = [];

    // Check minimum frame count
    if (uploadedFrames.length < 12) {
      errors.push(`Minimum 12 frames required (got ${uploadedFrames.length})`);
    }

    // Check consistent dimensions
    if (uploadedFrames.length > 0) {
      const firstFrame = uploadedFrames[0];
      const inconsistent = uploadedFrames.some(
        (frame) =>
          frame.width !== firstFrame.width || frame.height !== firstFrame.height
      );

      if (inconsistent) {
        errors.push(
          `All frames must have the same dimensions (${firstFrame.width}×${firstFrame.height})`
        );
      }
    }

    return errors;
  };

  // Handle file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    try {
      const uploadedFrames = await selectFiles(files);

      // Validate frames
      const errors = validateFrames(uploadedFrames);
      setValidationErrors(errors);

      if (errors.length === 0) {
        // Sort frames by filename
        const sortedFrames = [...uploadedFrames].sort((a, b) =>
          a.filename.localeCompare(b.filename)
        );

        setFrames(sortedFrames);
        setFrameCount(sortedFrames.length);

        // Auto-detect filename pattern
        if (sortedFrames.length > 0) {
          const pattern = detectFilenamePattern(sortedFrames);
          setFilenamePattern(pattern);
        }

        // Update parent
        const config: Rotation360Config = {
          frameCount: sortedFrames.length,
          filenamePattern: filenamePattern || "frame_{index}.jpg",
          folder: "rotation360",
          frames: sortedFrames,
        };
        onRotationUpdate(config);
      }
    } catch (err) {
      console.error("Failed to upload frames:", err);
    }
  };

  // Detect filename pattern
  const detectFilenamePattern = (frames: ImageRef[]): string => {
    if (frames.length < 2) return "";

    const firstFile = frames[0].filename;
    const match = firstFile.match(/^(.+?)(\d+)(\.\w+)$/);

    if (match) {
      const [, prefix, , extension] = match;
      return `${prefix}{index}${extension}`;
    }

    return "";
  };

  // Handle frame removal
  const handleRemoveFrame = (index: number) => {
    const newFrames = frames.filter((_, i) => i !== index);
    setFrames(newFrames);
    setFrameCount(newFrames.length);

    if (newFrames.length === 0) {
      onRotationUpdate(null);
      setValidationErrors([]);
    } else {
      const config: Rotation360Config = {
        frameCount: newFrames.length,
        filenamePattern,
        folder: "rotation360",
        frames: newFrames,
      };
      onRotationUpdate(config);
    }
  };

  // Handle remove all
  const handleRemoveAll = () => {
    setFrames([]);
    setFrameCount(12);
    setFilenamePattern("");
    setCurrentFrame(0);
    setIsPlaying(false);
    setValidationErrors([]);
    onRotationUpdate(null);
  };

  // Toggle playback
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            360° Rotation Frames
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Upload {frameCount}+ sequential images for 360° view
          </p>
        </div>

        {frames.length > 0 && (
          <button
            onClick={handleRemoveAll}
            className="text-xs text-red-600 hover:text-red-700"
          >
            Remove All
          </button>
        )}
      </div>

      {/* Upload Area */}
      {frames.length === 0 ? (
        <label className="block">
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png"
            onChange={handleFileUpload}
            className="hidden"
          />
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
            <Upload className="w-12 h-12 mx-auto mb-3 text-gray-400" />
            {isUploading ? (
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Uploading frames...</p>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500">{Math.round(progress)}%</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-gray-600 mb-1">
                  Click to select multiple frames
                </p>
                <p className="text-xs text-gray-500">
                  JPEG or PNG, max 10MB each, minimum {frameCount} frames
                </p>
              </>
            )}
          </div>
        </label>
      ) : (
        <>
          {/* Preview */}
          <div className="relative bg-gray-900 rounded-lg aspect-video overflow-hidden">
            {frames[currentFrame]?.url && (
              <img
                src={frames[currentFrame].url}
                alt={`Frame ${currentFrame + 1}`}
                className="w-full h-full object-contain"
              />
            )}

            {/* Controls Overlay */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black bg-opacity-30">
              <button
                onClick={togglePlayback}
                className="p-4 bg-white rounded-full shadow-lg hover:scale-110 transition-transform"
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 text-gray-900" />
                ) : (
                  <Play className="w-6 h-6 text-gray-900 ml-1" />
                )}
              </button>
            </div>

            {/* Frame Counter */}
            <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
              Frame {currentFrame + 1} / {frames.length}
            </div>

            {/* Validation Status */}
            <div className="absolute top-3 right-3">
              {validationErrors.length === 0 ? (
                <div className="flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded">
                  <CheckCircle className="w-3 h-3" />
                  Valid
                </div>
              ) : (
                <div className="flex items-center gap-1 bg-red-600 text-white text-xs px-2 py-1 rounded">
                  <AlertCircle className="w-3 h-3" />
                  Issues
                </div>
              )}
            </div>
          </div>

          {/* Scrubber */}
          <div className="space-y-2">
            <input
              type="range"
              min="0"
              max={frames.length - 1}
              value={currentFrame}
              onChange={(e) => {
                setIsPlaying(false);
                setCurrentFrame(parseInt(e.target.value));
              }}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              aria-label="360 degree rotation scrubber"
              style={{
                background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                  (currentFrame / (frames.length - 1)) * 100
                }%, #e5e7eb ${
                  (currentFrame / (frames.length - 1)) * 100
                }%, #e5e7eb 100%)`,
              }}
            />
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>0°</span>
              <span>180°</span>
              <span>360°</span>
            </div>
          </div>

          {/* Frame Info */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Total Frames:</span>
              <span className="font-medium text-gray-900">{frames.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Dimensions:</span>
              <span className="font-medium text-gray-900">
                {frames[0]?.width} × {frames[0]?.height}
              </span>
            </div>
            {filenamePattern && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Pattern:</span>
                <span className="font-mono text-xs text-gray-900">
                  {filenamePattern}
                </span>
              </div>
            )}
          </div>
        </>
      )}

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900 mb-1">
                Validation Issues:
              </p>
              <ul className="text-sm text-red-800 space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>• {error}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Upload Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Frame Grid (optional, for managing individual frames) */}
      {frames.length > 0 && (
        <details className="border border-gray-200 rounded-lg">
          <summary className="px-3 py-2 cursor-pointer hover:bg-gray-50 text-sm font-medium text-gray-700">
            Manage Individual Frames ({frames.length})
          </summary>
          <div className="p-3 grid grid-cols-6 gap-2 max-h-64 overflow-y-auto">
            {frames.map((frame, index) => (
              <div
                key={frame.id}
                className="relative group aspect-square bg-gray-100 rounded border border-gray-200 overflow-hidden"
              >
                <img
                  src={frame.url}
                  alt={`Frame ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => handleRemoveFrame(index)}
                  className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Remove frame"
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-1 left-1 bg-black bg-opacity-70 text-white text-xs px-1 rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

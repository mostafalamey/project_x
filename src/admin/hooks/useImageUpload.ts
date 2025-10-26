/**
 * useImageUpload Hook
 * Handles image file uploads with validation, preview, and processing
 */

import { useState, useCallback } from "react";
import {
  validateImageFile,
  validateImageDimensions,
  loadAndValidateImage,
} from "../services/validation/imageValidator";
import { processUploadedImage } from "../utils/imageProcessing";
import type { ImageRef } from "../types/admin-config";
import type { ValidationResult } from "../types/editor";

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseImageUploadOptions {
  maxSizeMB?: number;
  allowedTypes?: string[];
  minWidth?: number;
  minHeight?: number;
  maxWidth?: number;
  maxHeight?: number;
  autoResize?: boolean;
  maxDimension?: number;
}

export interface UseImageUploadReturn {
  // State
  isUploading: boolean;
  progress: number;
  preview: string | null;
  imageRef: ImageRef | null;
  error: string | null;
  validation: ValidationResult | null;

  // Actions
  selectFile: (file: File) => Promise<void>;
  selectFiles: (files: File[]) => Promise<ImageRef[]>;
  clearImage: () => void;
  clearError: () => void;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useImageUpload(
  options: UseImageUploadOptions = {}
): UseImageUploadReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageRef, setImageRef] = useState<ImageRef | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [validation, setValidation] = useState<ValidationResult | null>(null);

  // Select and process a single file
  const selectFile = useCallback(
    async (file: File) => {
      try {
        setIsUploading(true);
        setProgress(0);
        setError(null);
        setValidation(null);

        // Validate file
        const fileValidation = validateImageFile(file);
        setValidation(fileValidation);

        if (!fileValidation.isValid) {
          const errorMsg = fileValidation.errors
            .map((e) => e.message)
            .join(", ");
          setError(errorMsg);
          setIsUploading(false);
          return;
        }

        setProgress(25);

        // Load and validate image
        const imgResult = await loadAndValidateImage(file);
        setProgress(50);

        if (!imgResult.isValid || !imgResult.image) {
          const errorMsg = imgResult.errors.map((e) => e.message).join(", ");
          setError(errorMsg);
          setIsUploading(false);
          return;
        }

        const img = imgResult.image;

        // Validate dimensions
        const dimValidation = validateImageDimensions(img.width, img.height);

        setValidation(dimValidation);

        if (!dimValidation.isValid) {
          const errorMsg = dimValidation.errors
            .map((e) => e.message)
            .join(", ");
          setError(errorMsg);
          setIsUploading(false);
          return;
        }

        setProgress(75);

        // Process image (resize if needed)
        const processedImageRef = await processUploadedImage(
          file,
          options.autoResize ? options.maxDimension : undefined
        );

        setProgress(90);

        // Create preview URL
        const previewUrl = URL.createObjectURL(processedImageRef.blob!);
        setPreview(previewUrl);
        setImageRef(processedImageRef);

        setProgress(100);
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to upload image";
        setError(errorMsg);
        console.error("Image upload failed:", err);
      } finally {
        setIsUploading(false);
      }
    },
    [options]
  );

  // Select and process multiple files
  const selectFiles = useCallback(
    async (files: File[]): Promise<ImageRef[]> => {
      const results: ImageRef[] = [];

      try {
        setIsUploading(true);
        setError(null);

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          setProgress(((i + 1) / files.length) * 100);

          // Validate file
          const fileValidation = validateImageFile(file);
          if (!fileValidation.isValid) {
            console.warn(`Skipping invalid file: ${file.name}`);
            continue;
          }

          // Process image
          const processedImageRef = await processUploadedImage(
            file,
            options.autoResize ? options.maxDimension : undefined
          );

          results.push(processedImageRef);
        }

        return results;
      } catch (err) {
        const errorMsg =
          err instanceof Error ? err.message : "Failed to upload images";
        setError(errorMsg);
        throw err;
      } finally {
        setIsUploading(false);
        setProgress(0);
      }
    },
    [options]
  );

  // Clear current image
  const clearImage = useCallback(() => {
    if (preview) {
      URL.revokeObjectURL(preview);
    }
    setPreview(null);
    setImageRef(null);
    setError(null);
    setValidation(null);
    setProgress(0);
  }, [preview]);

  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isUploading,
    progress,
    preview,
    imageRef,
    error,
    validation,

    // Actions
    selectFile,
    selectFiles,
    clearImage,
    clearError,
  };
}

// ============================================================================
// Helper Hook for Dropzone Integration
// ============================================================================

export interface UseImageDropzoneReturn extends UseImageUploadReturn {
  getRootProps: () => {
    onDrop: (e: React.DragEvent) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
  };
  getInputProps: () => {
    type: string;
    accept: string;
    multiple: boolean;
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  };
  isDragActive: boolean;
}

export function useImageDropzone(
  options: UseImageUploadOptions & { multiple?: boolean } = {}
): UseImageDropzoneReturn {
  const upload = useImageUpload(options);
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragActive(false);
      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        if (options.multiple) {
          upload.selectFiles(files);
        } else {
          upload.selectFile(files[0]);
        }
      }
    },
    [options.multiple, upload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        if (options.multiple) {
          upload.selectFiles(files);
        } else {
          upload.selectFile(files[0]);
        }
      }
    },
    [options.multiple, upload]
  );

  return {
    ...upload,
    getRootProps: () => ({
      onDrop: handleDrop,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
    }),
    getInputProps: () => ({
      type: "file",
      accept: "image/jpeg,image/png",
      multiple: options.multiple || false,
      onChange: handleInputChange,
    }),
    isDragActive,
  };
}

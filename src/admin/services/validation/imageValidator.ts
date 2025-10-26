/**
 * Image Validator
 * Validates image uploads for format, size, and dimensions
 */

import type { ValidationResult, ValidationError } from "../../types/editor";

// ============================================================================
// Validation Constants
// ============================================================================

export const IMAGE_CONSTRAINTS = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB in bytes
  ALLOWED_MIME_TYPES: ["image/jpeg", "image/png"] as const,
  MIN_DIMENSIONS: {
    width: 100,
    height: 100,
  },
  MAX_DIMENSIONS: {
    width: 8192,
    height: 8192,
  },
};

// ============================================================================
// Validation Functions
// ============================================================================

/**
 * Validate image file
 */
export function validateImageFile(file: File): ValidationResult {
  const errors: ValidationError[] = [];

  // Check file size
  if (file.size > IMAGE_CONSTRAINTS.MAX_FILE_SIZE) {
    errors.push({
      field: "size",
      message: `File size (${formatBytes(
        file.size
      )}) exceeds maximum allowed size of ${formatBytes(
        IMAGE_CONSTRAINTS.MAX_FILE_SIZE
      )}`,
      code: "FILE_TOO_LARGE",
    });
  }

  // Check MIME type
  if (!IMAGE_CONSTRAINTS.ALLOWED_MIME_TYPES.includes(file.type as any)) {
    errors.push({
      field: "type",
      message: `File type "${file.type}" is not allowed. Only JPEG and PNG images are supported.`,
      code: "INVALID_FILE_TYPE",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
}

/**
 * Validate image dimensions
 */
export function validateImageDimensions(
  width: number,
  height: number
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check minimum dimensions
  if (
    width < IMAGE_CONSTRAINTS.MIN_DIMENSIONS.width ||
    height < IMAGE_CONSTRAINTS.MIN_DIMENSIONS.height
  ) {
    errors.push({
      field: "dimensions",
      message: `Image dimensions (${width}×${height}) are below minimum required (${IMAGE_CONSTRAINTS.MIN_DIMENSIONS.width}×${IMAGE_CONSTRAINTS.MIN_DIMENSIONS.height})`,
      code: "DIMENSIONS_TOO_SMALL",
    });
  }

  // Check maximum dimensions
  if (
    width > IMAGE_CONSTRAINTS.MAX_DIMENSIONS.width ||
    height > IMAGE_CONSTRAINTS.MAX_DIMENSIONS.height
  ) {
    errors.push({
      field: "dimensions",
      message: `Image dimensions (${width}×${height}) exceed maximum allowed (${IMAGE_CONSTRAINTS.MAX_DIMENSIONS.width}×${IMAGE_CONSTRAINTS.MAX_DIMENSIONS.height})`,
      code: "DIMENSIONS_TOO_LARGE",
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
}

/**
 * Validate 360° rotation frame sequence
 */
export function validate360Frames(
  frames: { width: number; height: number }[]
): ValidationResult {
  const errors: ValidationError[] = [];

  // Check minimum frame count
  if (frames.length < 12) {
    errors.push({
      field: "frameCount",
      message: `360° rotation requires at least 12 frames (got ${frames.length})`,
      code: "INSUFFICIENT_FRAMES",
    });
  }

  // Check consistent dimensions
  if (frames.length > 0) {
    const firstFrame = frames[0];
    const inconsistent = frames.some(
      (frame) =>
        frame.width !== firstFrame.width || frame.height !== firstFrame.height
    );

    if (inconsistent) {
      errors.push({
        field: "dimensions",
        message: "All 360° rotation frames must have identical dimensions",
        code: "INCONSISTENT_DIMENSIONS",
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings: [],
  };
}

/**
 * Load and validate image from file
 */
export async function loadAndValidateImage(file: File): Promise<{
  isValid: boolean;
  image?: HTMLImageElement;
  errors: ValidationError[];
}> {
  // Validate file first
  const fileValidation = validateImageFile(file);
  if (!fileValidation.isValid) {
    return {
      isValid: false,
      errors: fileValidation.errors,
    };
  }

  // Load image
  try {
    const image = await loadImage(file);

    // Validate dimensions
    const dimensionValidation = validateImageDimensions(
      image.width,
      image.height
    );

    if (!dimensionValidation.isValid) {
      return {
        isValid: false,
        errors: dimensionValidation.errors,
      };
    }

    return {
      isValid: true,
      image,
      errors: [],
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        {
          field: "file",
          message: `Failed to load image: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
          code: "LOAD_FAILED",
        },
      ],
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Load image from file
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      const img = new Image();

      img.onload = () => {
        resolve(img);
      };

      img.onerror = () => {
        reject(new Error("Failed to decode image"));
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      reject(new Error("Failed to read file"));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

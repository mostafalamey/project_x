/**
 * Image Processing Utilities
 * Resize images and generate thumbnails
 */

import type { ImageRef } from "../types/admin-config";

// ============================================================================
// Image Loading
// ============================================================================

/**
 * Load an image from a File or Blob
 */
export function loadImageFromFile(
  file: File | Blob
): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to load image"));
    };

    img.src = url;
  });
}

/**
 * Load an image from a URL or data URL
 */
export function loadImageFromUrl(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from ${url}`));

    img.src = url;
  });
}

// ============================================================================
// Image Resizing
// ============================================================================

/**
 * Resize image to fit within max dimensions while preserving aspect ratio
 * @param image - Source image element
 * @param maxWidth - Maximum width in pixels
 * @param maxHeight - Maximum height in pixels
 * @param quality - JPEG quality 0-1 (default 0.9)
 * @returns Resized image as Blob
 */
export async function resizeImage(
  image: HTMLImageElement,
  maxWidth: number,
  maxHeight: number,
  quality: number = 0.9
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Calculate new dimensions
  let width = image.width;
  let height = image.height;

  if (width > maxWidth) {
    height = (height * maxWidth) / width;
    width = maxWidth;
  }

  if (height > maxHeight) {
    width = (width * maxHeight) / height;
    height = maxHeight;
  }

  // Set canvas size
  canvas.width = width;
  canvas.height = height;

  // Draw resized image
  ctx.drawImage(image, 0, 0, width, height);

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create blob"));
        }
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Generate a thumbnail from an image
 * @param image - Source image element
 * @param size - Thumbnail size (width and height will be this value)
 * @param quality - JPEG quality 0-1 (default 0.85)
 * @returns Thumbnail as Blob
 */
export async function generateThumbnail(
  image: HTMLImageElement,
  size: number = 200,
  quality: number = 0.85
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Set canvas size to square
  canvas.width = size;
  canvas.height = size;

  // Calculate crop dimensions to maintain aspect ratio
  const aspectRatio = image.width / image.height;
  let cropWidth = image.width;
  let cropHeight = image.height;
  let cropX = 0;
  let cropY = 0;

  if (aspectRatio > 1) {
    // Landscape - crop width
    cropWidth = image.height;
    cropX = (image.width - cropWidth) / 2;
  } else {
    // Portrait - crop height
    cropHeight = image.width;
    cropY = (image.height - cropHeight) / 2;
  }

  // Draw cropped and resized image
  ctx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, size, size);

  // Convert to blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to create thumbnail blob"));
        }
      },
      "image/jpeg",
      quality
    );
  });
}

// ============================================================================
// Image Format Conversion
// ============================================================================

/**
 * Convert image to JPEG format
 * @param image - Source image element
 * @param quality - JPEG quality 0-1 (default 0.9)
 * @returns JPEG blob
 */
export async function convertToJPEG(
  image: HTMLImageElement,
  quality: number = 0.9
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  canvas.width = image.width;
  canvas.height = image.height;

  // Fill with white background (in case source has transparency)
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw image
  ctx.drawImage(image, 0, 0);

  // Convert to JPEG blob
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to convert to JPEG"));
        }
      },
      "image/jpeg",
      quality
    );
  });
}

/**
 * Convert image to PNG format
 */
export async function convertToPNG(image: HTMLImageElement): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  canvas.width = image.width;
  canvas.height = image.height;

  // Draw image
  ctx.drawImage(image, 0, 0);

  // Convert to PNG blob
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("Failed to convert to PNG"));
      }
    }, "image/png");
  });
}

// ============================================================================
// Image Upload Helpers
// ============================================================================

/**
 * Process uploaded image file and create ImageRef
 * @param file - Uploaded file
 * @param maxDimension - Optional max dimension for resizing
 * @returns ImageRef object
 */
export async function processUploadedImage(
  file: File,
  maxDimension?: number
): Promise<ImageRef> {
  // Load image
  const img = await loadImageFromFile(file);

  // Optionally resize
  let blob: Blob = file;
  let width = img.width;
  let height = img.height;

  if (maxDimension && (width > maxDimension || height > maxDimension)) {
    blob = await resizeImage(img, maxDimension, maxDimension);
    const resizedImg = await loadImageFromFile(blob);
    width = resizedImg.width;
    height = resizedImg.height;
  }

  // Ensure JPEG format
  if (file.type !== "image/jpeg") {
    blob = await convertToJPEG(img);
  }

  return {
    id: crypto.randomUUID(),
    filename: file.name,
    blob,
    url: URL.createObjectURL(blob),
    width,
    height,
    size: blob.size,
    mimeType: "image/jpeg",
    uploadedAt: new Date().toISOString(),
  };
}

/**
 * Create data URL from ImageRef blob
 */
export async function imageRefToDataURL(imageRef: ImageRef): Promise<string> {
  if (!imageRef.blob) {
    throw new Error("ImageRef has no blob data");
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.readAsDataURL(imageRef.blob!);
  });
}

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

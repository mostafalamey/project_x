/**
 * ZIP Extractor Service
 * Extracts and parses imported ZIP files
 */

import JSZip from "jszip";

// ============================================================================
// Types
// ============================================================================

export interface ExtractedProject {
  // Configuration files
  project: any;
  models: any[];
  landmarks: any[];
  masterplan: any;
  buildings: any[];
  floors: any[];
  tours: any[];

  // Images as blobs with their paths
  images: Map<string, Blob>;

  // Metadata
  metadata?: {
    exportDate: string;
    version: string;
    projectName: string;
  };
}

// ============================================================================
// Extraction Functions
// ============================================================================

/**
 * Extract and parse a project ZIP file
 */
export async function extractProjectZip(
  zipFile: File
): Promise<ExtractedProject> {
  try {
    const zip = await JSZip.loadAsync(zipFile);

    // Extract configuration files
    const project = await extractJsonFile(zip, "config/project_settings.json");
    const models = await extractJsonFile(zip, "config/models.json", []);
    const landmarks = await extractJsonFile(zip, "config/landmarks.json", []);
    const masterplan = await extractJsonFile(zip, "config/masterplan.json", {});
    const buildings = await extractJsonFile(zip, "config/buildings.json", []);
    const floors = await extractJsonFile(zip, "config/floors.json", []);
    const tours = await extractJsonFile(zip, "config/tours.json", []);

    // Extract metadata
    const metadata = await extractJsonFile(zip, "metadata.json");

    // Extract images
    const images = await extractImages(zip);

    return {
      project,
      models,
      landmarks,
      masterplan,
      buildings,
      floors,
      tours,
      images,
      metadata,
    };
  } catch (error) {
    console.error("Failed to extract project ZIP:", error);
    throw new Error(
      `Failed to extract ZIP file: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract and parse a JSON file from the ZIP
 */
async function extractJsonFile(
  zip: JSZip,
  path: string,
  defaultValue: any = null
): Promise<any> {
  try {
    const file = zip.file(path);
    if (!file) {
      console.warn(`File not found in ZIP: ${path}`);
      return defaultValue;
    }

    const content = await file.async("string");
    return JSON.parse(content);
  } catch (error) {
    console.error(`Failed to extract JSON file ${path}:`, error);
    return defaultValue;
  }
}

/**
 * Extract all images from the ZIP
 */
async function extractImages(zip: JSZip): Promise<Map<string, Blob>> {
  const images = new Map<string, Blob>();
  const imagesFolder = zip.folder("images");

  if (!imagesFolder) {
    console.warn("No images folder found in ZIP");
    return images;
  }

  // Get all files in the images folder
  const imageFiles: Array<{ path: string; file: JSZip.JSZipObject }> = [];
  zip.folder("images")?.forEach((relativePath, file) => {
    if (!file.dir) {
      // Only process files, not directories
      imageFiles.push({ path: relativePath, file });
    }
  });

  // Extract each image
  for (const { path, file } of imageFiles) {
    try {
      const blob = await file.async("blob");
      images.set(path, blob);
    } catch (error) {
      console.error(`Failed to extract image ${path}:`, error);
    }
  }

  return images;
}

/**
 * Validate ZIP structure
 */
export async function validateZipStructure(zipFile: File): Promise<{
  isValid: boolean;
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    const zip = await JSZip.loadAsync(zipFile);

    // Check required files
    const requiredFiles = [
      "config/project_settings.json",
      "metadata.json",
      "README.md",
    ];

    for (const requiredFile of requiredFiles) {
      if (!zip.file(requiredFile)) {
        errors.push(`Missing required file: ${requiredFile}`);
      }
    }

    // Check optional files (warnings if missing)
    const optionalFiles = [
      "config/models.json",
      "config/landmarks.json",
      "config/masterplan.json",
      "config/buildings.json",
      "config/floors.json",
      "config/tours.json",
    ];

    for (const optionalFile of optionalFiles) {
      if (!zip.file(optionalFile)) {
        warnings.push(`Optional file missing: ${optionalFile}`);
      }
    }

    // Check for images folder
    const imagesFolder = zip.folder("images");
    if (!imagesFolder) {
      warnings.push("No images folder found");
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    return {
      isValid: false,
      errors: [
        `Failed to read ZIP file: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      ],
      warnings: [],
    };
  }
}

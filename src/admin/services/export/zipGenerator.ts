/**
 * ZIP Generator Service
 * Creates ZIP archives for project export
 */

import JSZip from "jszip";
import { saveAs } from "file-saver";

// ============================================================================
// Types
// ============================================================================

export interface ProjectExport {
  // Configuration files
  project: any;
  models: any[];
  landmarks: any[];
  masterplan: any;
  buildings: any[];
  floors: any[];
  tours: any[];

  // Images (as base64 or blob)
  images: {
    [key: string]: Blob | string; // path -> blob or base64
  };

  // Metadata
  exportDate: string;
  version: string;
}

// ============================================================================
// Export Functions
// ============================================================================

/**
 * Generate and download a ZIP file containing the full project
 */
export async function exportProjectToZip(
  projectData: ProjectExport,
  projectName: string = "project"
): Promise<void> {
  try {
    const zip = new JSZip();

    // Create folder structure
    const configFolder = zip.folder("config");
    const imagesFolder = zip.folder("images");

    if (!configFolder || !imagesFolder) {
      throw new Error("Failed to create ZIP folders");
    }

    // Add configuration files
    configFolder.file(
      "project_settings.json",
      JSON.stringify(projectData.project, null, 2)
    );
    configFolder.file(
      "models.json",
      JSON.stringify(projectData.models, null, 2)
    );
    configFolder.file(
      "landmarks.json",
      JSON.stringify(projectData.landmarks, null, 2)
    );
    configFolder.file(
      "masterplan.json",
      JSON.stringify(projectData.masterplan, null, 2)
    );
    configFolder.file(
      "buildings.json",
      JSON.stringify(projectData.buildings, null, 2)
    );
    configFolder.file(
      "floors.json",
      JSON.stringify(projectData.floors, null, 2)
    );
    configFolder.file("tours.json", JSON.stringify(projectData.tours, null, 2));

    // Add images
    for (const [path, imageData] of Object.entries(projectData.images)) {
      if (imageData instanceof Blob) {
        imagesFolder.file(path, imageData);
      } else if (typeof imageData === "string") {
        // Assume base64 data URL
        const base64Data = imageData.split(",")[1] || imageData;
        imagesFolder.file(path, base64Data, { base64: true });
      }
    }

    // Add README
    const readmeContent = generateReadme(projectData);
    zip.file("README.md", readmeContent);

    // Add metadata
    zip.file(
      "metadata.json",
      JSON.stringify(
        {
          exportDate: projectData.exportDate,
          version: projectData.version,
          projectName: projectData.project?.name || projectName,
        },
        null,
        2
      )
    );

    // Generate ZIP
    const blob = await zip.generateAsync({ type: "blob" });

    // Download
    const filename = `${sanitizeFilename(projectName)}-export.zip`;
    saveAs(blob, filename);
  } catch (error) {
    console.error("Failed to export project to ZIP:", error);
    throw error;
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Generate README.md content
 */
function generateReadme(projectData: ProjectExport): string {
  const project = projectData.project || {};

  return `# ${project.name || "Real Estate Project"} - Export

## Export Information

- **Export Date**: ${new Date(projectData.exportDate).toLocaleString()}
- **Export Version**: ${projectData.version}
- **Project Name**: ${project.name || "N/A"}
- **Project Slug**: ${project.slug || "N/A"}

## Project Structure

\`\`\`
config/
  ├── project_settings.json  # Project metadata and settings
  ├── models.json            # Apartment models
  ├── landmarks.json         # Map landmarks and POIs
  ├── masterplan.json        # Master plan with angles and buildings
  ├── buildings.json         # Building configurations
  ├── floors.json            # Floor plans with units
  └── tours.json             # Virtual tours

images/                      # All project images
  ├── map/
  ├── masterplan/
  ├── buildings/
  ├── floors/
  └── tours/

metadata.json               # Export metadata
README.md                   # This file
\`\`\`

## Project Statistics

- **Models**: ${projectData.models?.length || 0}
- **Buildings**: ${projectData.buildings?.length || 0}
- **Floors**: ${projectData.floors?.length || 0}
- **Tours**: ${projectData.tours?.length || 0}
- **Landmarks**: ${projectData.landmarks?.length || 0}

## Developer Information

${
  project.developer
    ? `- **Developer**: ${project.developer.name || "N/A"}
- **Contact**: ${project.developer.email || "N/A"}
- **Phone**: ${project.developer.phone || "N/A"}
- **Website**: ${project.developer.website || "N/A"}`
    : "No developer information available"
}

## Import Instructions

1. Open the admin dashboard
2. Click "Import Project"
3. Select this ZIP file
4. Review the validation summary
5. Confirm import

## Notes

This export was generated by the Project X Admin Dashboard.
`;
}

/**
 * Sanitize filename for safe file system usage
 */
function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-z0-9_-]/gi, "_")
    .replace(/_+/g, "_")
    .toLowerCase();
}

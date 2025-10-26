/**
 * Project X Admin Server
 * Handles file operations for the admin dashboard
 */

import express from "express";
import cors from "cors";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Path to public/data directory
const PUBLIC_DATA_PATH = path.join(__dirname, "..", "public", "data");
const MODELS_PATH = path.join(PUBLIC_DATA_PATH, "models");

// Ensure directories exist
async function ensureDirectories() {
  try {
    await fs.mkdir(PUBLIC_DATA_PATH, { recursive: true });
    await fs.mkdir(MODELS_PATH, { recursive: true });
    console.log("✓ Directories ready");
  } catch (error) {
    console.error("Failed to create directories:", error);
  }
}

// ============================================================================
// API Routes
// ============================================================================

/**
 * POST /api/export/models
 * Export models with images to public/data/models
 */
app.post("/api/export/models", async (req, res) => {
  try {
    const { models } = req.body;

    if (!models || !Array.isArray(models)) {
      return res.status(400).json({ error: "Invalid models data" });
    }

    console.log(`\n📦 Exporting ${models.length} models...`);

    const exportedModels = [];
    let imageCount = 0;

    // Process each model
    for (const model of models) {
      const modelId = model.id;
      console.log(`  → Processing model ${modelId}...`);

      const modelData = {
        id: modelId,
        title: model.title,
        description: model.description,
        areaM2: model.areaM2,
        bedrooms: model.bedrooms,
        bathrooms: model.bathrooms,
        tourPath: model.tourPath || null,
        imagePath: `/data/models/model-${modelId}.jpg`,
      };

      // Save thumbnail image
      if (model.thumbnail && model.thumbnail.url) {
        try {
          const base64Data = model.thumbnail.url.replace(
            /^data:image\/\w+;base64,/,
            ""
          );
          const buffer = Buffer.from(base64Data, "base64");
          const ext = model.thumbnail.mimeType === "image/png" ? "png" : "jpg";
          const filename = `model-${modelId}.${ext}`;
          const filePath = path.join(MODELS_PATH, filename);

          await fs.writeFile(filePath, buffer);
          modelData.imagePath = `/data/models/${filename}`;
          imageCount++;
          console.log(`    ✓ Saved thumbnail: ${filename}`);
        } catch (err) {
          console.error(
            `    ✗ Failed to save thumbnail for ${modelId}:`,
            err.message
          );
        }
      }

      // Save 360° rotation frames
      if (
        model.rotation360 &&
        model.rotation360.frames &&
        model.rotation360.frames.length > 0
      ) {
        try {
          const model360Path = path.join(MODELS_PATH, `model-${modelId}`);
          await fs.mkdir(model360Path, { recursive: true });

          const frames = model.rotation360.frames;
          // Determine padding based on frame count (0000 for up to 9999 frames)
          const maxDigits = frames.length.toString().length;
          const padding = Math.max(4, maxDigits); // At least 4 digits

          for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            if (frame.url) {
              const base64Data = frame.url.replace(
                /^data:image\/\w+;base64,/,
                ""
              );
              const buffer = Buffer.from(base64Data, "base64");
              const ext = frame.mimeType === "image/png" ? "png" : "jpg";
              const frameNumber = i.toString().padStart(padding, "0");
              const filename = `model-${modelId}_${frameNumber}.${ext}`;
              const filePath = path.join(model360Path, filename);

              await fs.writeFile(filePath, buffer);
              imageCount++;
            }
          }

          modelData.rotation360 = {
            folder: `/data/models/model-${modelId}`,
            frameCount: frames.length,
            filenamePattern: `model-${modelId}_{index}.jpg`,
          };

          console.log(`    ✓ Saved ${frames.length} rotation frames`);
        } catch (err) {
          console.error(
            `    ✗ Failed to save 360° frames for ${modelId}:`,
            err.message
          );
        }
      }

      exportedModels.push(modelData);
    }

    // Write models.json
    const modelsJsonPath = path.join(PUBLIC_DATA_PATH, "models.json");
    await fs.writeFile(modelsJsonPath, JSON.stringify(exportedModels, null, 2));
    console.log(`\n✓ Saved models.json (${exportedModels.length} models)`);
    console.log(`✓ Saved ${imageCount} image files\n`);

    res.json({
      success: true,
      message: `Exported ${exportedModels.length} models with ${imageCount} images`,
      modelsCount: exportedModels.length,
      imagesCount: imageCount,
      path: PUBLIC_DATA_PATH,
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/export/project
 * Export complete project configuration
 */
app.post("/api/export/project", async (req, res) => {
  try {
    const { project, models } = req.body;

    if (!project) {
      return res.status(400).json({ error: "Invalid project data" });
    }

    console.log(`\n📦 Exporting complete project...`);

    // Export models first
    if (models && Array.isArray(models)) {
      const modelsResponse = await new Promise((resolve) => {
        req.body = { models };
        app.handle(
          { ...req, url: "/api/export/models", method: "POST" },
          { json: resolve, status: () => ({ json: resolve }) }
        );
      });
    }

    // Write project.json
    const projectJsonPath = path.join(PUBLIC_DATA_PATH, "project.json");
    await fs.writeFile(projectJsonPath, JSON.stringify(project, null, 2));
    console.log(`✓ Saved project.json\n`);

    res.json({
      success: true,
      message: "Complete project exported successfully",
      path: PUBLIC_DATA_PATH,
    });
  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/export/map
 * Export map image and landmarks to public/data
 */
app.post("/api/export/map", async (req, res) => {
  try {
    const { mapImage, landmarks, projectId } = req.body;

    if (!landmarks || !Array.isArray(landmarks)) {
      return res.status(400).json({ error: "Invalid landmarks data" });
    }

    console.log("\n🗺️  Exporting Map Data...");
    console.log(`Project ID: ${projectId || "default"}`);

    let imageFilename = null;

    // Save map image if provided
    if (mapImage && mapImage.url) {
      try {
        // Extract base64 data
        const base64Match = mapImage.url.match(
          /^data:image\/(\w+);base64,(.+)$/
        );

        if (base64Match) {
          const ext = base64Match[1];
          const base64Data = base64Match[2];
          const buffer = Buffer.from(base64Data, "base64");

          imageFilename = `map.${ext}`;
          const imagePath = path.join(PUBLIC_DATA_PATH, imageFilename);

          await fs.writeFile(imagePath, buffer);
          console.log(`✓ Map image saved: ${imageFilename}`);
        }
      } catch (err) {
        console.error("✗ Failed to save map image:", err.message);
        // Continue even if image save fails
      }
    }

    // Save landmarks.json
    const landmarksPath = path.join(PUBLIC_DATA_PATH, "landmarks.json");
    await fs.writeFile(
      landmarksPath,
      JSON.stringify(landmarks, null, 2),
      "utf8"
    );
    console.log(
      `✓ Landmarks saved: landmarks.json (${landmarks.length} landmarks)`
    );

    res.json({
      success: true,
      message: "Map and landmarks exported successfully",
      files: {
        landmarks: "/data/landmarks.json",
        mapImage: imageFilename ? `/data/${imageFilename}` : null,
      },
    });
  } catch (error) {
    console.error("Export map error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/export/masterplan
 * Export master plan with angles and building hotspots
 */
app.post("/api/export/masterplan", async (req, res) => {
  try {
    const { angles, buildings, tourPoints, projectId } = req.body;

    if (!angles || !Array.isArray(angles)) {
      return res.status(400).json({ error: "Invalid angles data" });
    }

    if (!buildings || !Array.isArray(buildings)) {
      return res.status(400).json({ error: "Invalid buildings data" });
    }

    console.log("\n🏢 Exporting Master Plan...");
    console.log(`Project ID: ${projectId || "default"}`);
    console.log(`Angles: ${angles.length}`);
    console.log(`Buildings: ${buildings.length}`);
    console.log(`Tour Points: ${tourPoints?.length || 0}`);

    // Log transition info received
    console.log("\n📹 Transition Data Received:");
    angles.forEach((angle, idx) => {
      if (angle.transitionToNext) {
        console.log(`  Angle ${idx} → ${idx + 1}:`, {
          hasFrames: !!angle.transitionToNext.frames,
          frameCount: angle.transitionToNext.frameCount,
          framesLength: angle.transitionToNext.frames?.length,
        });
      }
    });

    // Create masterplan directory structure
    const masterplanPath = path.join(PUBLIC_DATA_PATH, "masterplan");
    const anglesPath = path.join(masterplanPath, "angles");
    await fs.mkdir(anglesPath, { recursive: true });

    let imageCount = 0;
    const exportedAngles = [];

    // Process each angle
    for (const angle of angles) {
      console.log(`\n  → Processing angle ${angle.sequenceIndex}...`);

      const angleData = {
        id: angle.id,
        sequenceIndex: angle.sequenceIndex, // Store for sorting
        image: null,
        hotspots: [],
      };

      // Save angle background image
      if (angle.backgroundImage && angle.backgroundImage.url) {
        try {
          const base64Match = angle.backgroundImage.url.match(
            /^data:image\/(\w+);base64,(.+)$/
          );

          if (base64Match) {
            const ext = base64Match[1];
            const base64Data = base64Match[2];
            const buffer = Buffer.from(base64Data, "base64");

            const filename = `angle-${angle.sequenceIndex}.${ext}`;
            const filePath = path.join(anglesPath, filename);

            await fs.writeFile(filePath, buffer);
            angleData.image = `/data/masterplan/angles/${filename}`;
            imageCount++;
            console.log(`    ✓ Saved angle image: ${filename}`);
          }
        } catch (err) {
          console.error(
            `    ✗ Failed to save angle ${angle.sequenceIndex} image:`,
            err.message
          );
        }
      }

      // Process hotspots for this angle
      if (angle.hotspots && Array.isArray(angle.hotspots)) {
        for (const hotspot of angle.hotspots) {
          // Convert hotspot geometry to masterplan format
          if (hotspot.geometry && hotspot.geometry.vertices) {
            // Flatten vertices array into a single polygon array [x1, y1, x2, y2, ...]
            const flatPolygon = hotspot.geometry.vertices.flatMap((vertex) => [
              vertex.x,
              vertex.y,
            ]);

            angleData.hotspots.push({
              buildingId: hotspot.buildingId,
              polygons: [flatPolygon], // Wrap in array as per schema
            });
          }
        }
        console.log(`    ✓ Processed ${angleData.hotspots.length} hotspots`);
      }

      // Process transition frames if available
      if (angle.transitionToNext && angle.transitionToNext.frames) {
        const transitionFrames = angle.transitionToNext.frames;

        // Determine next angle index (loop back to 0 if this is the last angle)
        const isLastAngle = !angles.some(
          (a) => a.sequenceIndex === angle.sequenceIndex + 1
        );
        const nextAngleIndex = isLastAngle ? 0 : angle.sequenceIndex + 1;

        const transitionFolder = `angle-${angle.sequenceIndex}-to-${nextAngleIndex}`;
        const transitionPath = path.join(
          masterplanPath,
          "transitions",
          transitionFolder
        );

        console.log(
          `    📹 Processing transition: ${transitionFrames.length} frames${
            isLastAngle ? " (closing/loop)" : ""
          }`
        );

        // Create transition folder
        await fs.mkdir(transitionPath, { recursive: true });

        let framesSaved = 0;
        for (let i = 0; i < transitionFrames.length; i++) {
          const frame = transitionFrames[i];
          if (frame.url) {
            try {
              const base64Match = frame.url.match(
                /^data:image\/(\w+);base64,(.+)$/
              );

              if (base64Match) {
                const ext = base64Match[1];
                const base64Data = base64Match[2];
                const buffer = Buffer.from(base64Data, "base64");

                const filename = `frame-${i}.${ext}`;
                const filePath = path.join(transitionPath, filename);

                await fs.writeFile(filePath, buffer);
                framesSaved++;
              }
            } catch (err) {
              console.error(
                `    ✗ Failed to save transition frame ${i}:`,
                err.message
              );
            }
          }
        }

        if (framesSaved > 0) {
          angleData.sequenceToNext = {
            folder: `/data/masterplan/transitions/${transitionFolder}`,
            frameCount: framesSaved,
            filenamePattern: "frame-{index}",
          };
          console.log(`    ✓ Saved ${framesSaved} transition frames`);
        }
      }

      exportedAngles.push(angleData);
    }

    // Sort angles by sequence index to ensure sequential order (0, 1, 2, 3...)
    exportedAngles.sort((a, b) => a.sequenceIndex - b.sequenceIndex);

    console.log(
      `\n📋 Sorted angles:`,
      exportedAngles.map((a) => `angle-${a.sequenceIndex}`).join(" → ")
    );

    // Remove sequenceIndex from final output (not needed in JSON schema)
    exportedAngles.forEach((angle) => delete angle.sequenceIndex);

    // Process buildings list with summary information
    const exportedBuildings = buildings.map((building) => ({
      id: building.id,
      name: building.name,
      summary: {
        totalFloors: building.totalFloors || 0,
        availableUnits: building.availableUnits || 0,
      },
    }));

    // Process tour points with positions for each angle
    const exportedTourPoints = [];
    if (tourPoints && Array.isArray(tourPoints) && tourPoints.length > 0) {
      console.log(`\n🗺️ Processing ${tourPoints.length} tour points...`);

      for (const tourPoint of tourPoints) {
        const tourPointData = {
          id: tourPoint.id,
          name: tourPoint.name,
          positions: [],
        };

        // Add position for each angle
        if (tourPoint.positions && Array.isArray(tourPoint.positions)) {
          for (const posData of tourPoint.positions) {
            // Find the angle's sequenceIndex
            const angle = angles.find((a) => a.id === posData.angleId);
            if (angle) {
              tourPointData.positions.push({
                angleIndex: angle.sequenceIndex,
                x: Math.round(posData.position.x),
                y: Math.round(posData.position.y),
              });
            }
          }
        }

        // Add panoramic image path if exists
        if (tourPoint.panoramicImage) {
          tourPointData.panoramicImage = `/data/tours/street-view/${tourPoint.id}.jpg`;
        }

        // Add initial view if exists
        if (tourPoint.initialView) {
          tourPointData.initialView = tourPoint.initialView;
        }

        exportedTourPoints.push(tourPointData);
        console.log(
          `    ✓ ${tourPoint.name}: ${tourPointData.positions.length} position(s)`
        );
      }
    }

    // Create master plan JSON structure
    const masterPlanData = {
      angles: exportedAngles,
      buildings: exportedBuildings,
      tourPoints: exportedTourPoints,
    };

    // Write buildings.json
    const buildingsJsonPath = path.join(masterplanPath, "buildings.json");
    await fs.writeFile(
      buildingsJsonPath,
      JSON.stringify(masterPlanData, null, 4),
      "utf8"
    );

    // ========================================================================
    // Export Street View Tour Points
    // ========================================================================

    console.log("\n🗺️ Exporting Street View Tour...");

    if (tourPoints && Array.isArray(tourPoints) && tourPoints.length > 0) {
      console.log(`  → Found ${tourPoints.length} tour points`);

      // Create street-view tours directory
      const streetViewPath = path.join(
        PUBLIC_DATA_PATH,
        "tours",
        "street-view"
      );
      await fs.mkdir(streetViewPath, { recursive: true });

      const tourScenes = [];
      let panoramicImageCount = 0;

      for (const tourPoint of tourPoints) {
        // Save panoramic image if it exists
        let imageFilename = null;
        if (tourPoint.panoramicImage && tourPoint.panoramicImage.url) {
          try {
            const base64Match = tourPoint.panoramicImage.url.match(
              /^data:image\/(\w+);base64,(.+)$/
            );

            if (base64Match) {
              const ext = base64Match[1];
              const base64Data = base64Match[2];
              const buffer = Buffer.from(base64Data, "base64");

              imageFilename = `${tourPoint.id}.${ext}`;
              const imagePath = path.join(streetViewPath, imageFilename);

              await fs.writeFile(imagePath, buffer);
              panoramicImageCount++;
              console.log(`    ✓ Saved panoramic image: ${imageFilename}`);
            }
          } catch (err) {
            console.error(
              `    ✗ Failed to save panoramic for ${tourPoint.id}:`,
              err.message
            );
          }
        }

        // Create scene entry
        if (imageFilename) {
          const scene = {
            id: tourPoint.id,
            image: `/data/tours/street-view/${imageFilename}`,
            links: [], // Links can be added later if needed
            initialView: tourPoint.initialView || {
              yaw: 0,
              pitch: 0,
              fov: 90,
            },
          };

          if (tourPoint.name) {
            scene.name = tourPoint.name;
          }

          tourScenes.push(scene);
        }
      }

      // Generate tour.json
      if (tourScenes.length > 0) {
        const tourData = {
          modelId: null,
          startSceneId: tourScenes[0].id,
          scenes: tourScenes,
        };

        const tourJsonPath = path.join(streetViewPath, "tour.json");
        await fs.writeFile(
          tourJsonPath,
          JSON.stringify(tourData, null, 4),
          "utf8"
        );

        console.log(`    ✓ Saved tour.json with ${tourScenes.length} scenes`);
        console.log(`    ✓ Saved ${panoramicImageCount} panoramic images`);
      } else {
        console.log(`    ⚠️ No tour points with panoramic images`);
      }
    } else {
      console.log(`  → No tour points to export`);
    }

    console.log(`\n✓ Master plan exported successfully`);
    console.log(`  - Angles: ${exportedAngles.length}`);
    console.log(`  - Buildings: ${exportedBuildings.length}`);
    console.log(`  - Images: ${imageCount}`);
    console.log(
      `  - Total hotspots: ${exportedAngles.reduce(
        (sum, a) => sum + a.hotspots.length,
        0
      )}`
    );

    res.json({
      success: true,
      message: "Master plan exported successfully",
      files: {
        masterplan: "/data/masterplan/buildings.json",
      },
      stats: {
        angles: exportedAngles.length,
        buildings: exportedBuildings.length,
        images: imageCount,
        hotspots: exportedAngles.reduce((sum, a) => sum + a.hotspots.length, 0),
      },
    });
  } catch (error) {
    console.error("Export master plan error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/export/building/:buildingId
 * Export a single building with floors to public/data/buildings/{buildingId}
 */
app.post("/api/export/building/:buildingId", async (req, res) => {
  try {
    const { buildingId } = req.params;
    const { building } = req.body;

    if (!building) {
      return res.status(400).json({ error: "Invalid building data" });
    }

    console.log(`\n🏢 Exporting Building ${buildingId}...`);

    // Create building directory
    const buildingPath = path.join(PUBLIC_DATA_PATH, "buildings", buildingId);
    await fs.mkdir(buildingPath, { recursive: true });

    // Save building exterior image
    let elevationImageFilename = null;
    if (building.exteriorImage && building.exteriorImage.url) {
      try {
        const base64Match = building.exteriorImage.url.match(
          /^data:image\/(\w+);base64,(.+)$/
        );

        if (base64Match) {
          const ext = base64Match[1];
          const base64Data = base64Match[2];
          const buffer = Buffer.from(base64Data, "base64");

          elevationImageFilename = `elevation.${ext}`;
          const imagePath = path.join(buildingPath, elevationImageFilename);

          await fs.writeFile(imagePath, buffer);
          console.log(`  ✓ Saved elevation image: ${elevationImageFilename}`);
        }
      } catch (err) {
        console.error("  ✗ Failed to save elevation image:", err.message);
        return res.status(500).json({ error: "Failed to save building image" });
      }
    } else {
      return res
        .status(400)
        .json({ error: "Building exterior image is required" });
    }

    // Transform floors to match schema
    const exportedFloors = building.floors.map((floor) => {
      // Convert hotspot vertices to flat polygon array [x1, y1, x2, y2, ...]
      const elevationPolygons = floor.hotspot
        ? [floor.hotspot.vertices.flatMap((v) => [v.x, v.y])]
        : [];

      return {
        id: `floor-${floor.floorNumber}`,
        number: floor.floorNumber,
        elevationPolygons,
      };
    });

    // Create building export data matching schema
    const buildingExport = {
      id: building.id,
      name: building.name,
      elevationImage: `/data/buildings/${buildingId}/${elevationImageFilename}`,
      floors: exportedFloors,
    };

    // Write building.json
    const buildingJsonPath = path.join(buildingPath, "building.json");
    await fs.writeFile(
      buildingJsonPath,
      JSON.stringify(buildingExport, null, 2)
    );

    console.log(`  ✓ Saved building.json`);
    console.log(`  ✓ Exported ${exportedFloors.length} floors`);

    res.json({
      success: true,
      message: `Building ${buildingId} exported successfully`,
      path: `/data/buildings/${buildingId}`,
      files: {
        json: `/data/buildings/${buildingId}/building.json`,
        image: `/data/buildings/${buildingId}/${elevationImageFilename}`,
      },
      stats: {
        floors: exportedFloors.length,
      },
    });
  } catch (error) {
    console.error("Export building error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/export/floor/:buildingId/:floorNumber
 * Export floor configuration with units
 */
app.post("/api/export/floor/:buildingId/:floorNumber", async (req, res) => {
  try {
    const { buildingId, floorNumber } = req.params;
    const { floor, building, models } = req.body;

    if (!floor || !building) {
      return res.status(400).json({ error: "Invalid floor or building data" });
    }

    console.log(
      `\n🏢 Exporting Floor ${floorNumber} for Building ${buildingId}...`
    );

    // Create floors directory
    const floorsPath = path.join(
      PUBLIC_DATA_PATH,
      "buildings",
      buildingId,
      "floors"
    );
    await fs.mkdir(floorsPath, { recursive: true });

    // Save floor plan image if present
    let floorPlanFilename = null;
    if (floor.floorPlanImage && floor.floorPlanImage.url) {
      try {
        const base64Match = floor.floorPlanImage.url.match(
          /^data:image\/(\w+);base64,(.+)$/
        );

        if (base64Match) {
          const ext = base64Match[1];
          const base64Data = base64Match[2];
          const buffer = Buffer.from(base64Data, "base64");

          floorPlanFilename = `floor-${floorNumber}-plan.${ext}`;
          const imagePath = path.join(floorsPath, floorPlanFilename);

          await fs.writeFile(imagePath, buffer);
          console.log(`  ✓ Saved floor plan image: ${floorPlanFilename}`);
        }
      } catch (err) {
        console.error("  ✗ Failed to save floor plan image:", err.message);
        // Continue anyway - floor plan image is optional
      }
    }

    // Transform units to match schema
    const exportedUnits = floor.units.map((unit) => {
      // Find model details
      const model = models.find((m) => m.id === unit.modelId);

      // Convert polygon vertices to flat array [x1, y1, x2, y2, ...]
      const polygon =
        unit.geometry && unit.geometry.vertices
          ? unit.geometry.vertices.flatMap((v) => [v.x, v.y])
          : [];

      return {
        unitNumber: unit.unitNumber,
        modelId: unit.modelId,
        modelTitle: model?.title || "Unknown Model",
        availability: unit.availability,
        pricing: unit.pricing || undefined,
        polygon,
      };
    });

    // Get unique model IDs referenced by units
    const modelIdsReferenced = [...new Set(floor.units.map((u) => u.modelId))];

    // Create floor export data matching schema
    const floorExport = {
      id: floor.id,
      name: floor.name,
      floorNumber: floor.floorNumber,
      buildingId: floor.buildingId,
      buildingName: building.name,
      floorPlanImage: floorPlanFilename
        ? `/data/buildings/${buildingId}/floors/${floorPlanFilename}`
        : null,
      units: exportedUnits,
    };

    // Write floor JSON
    const floorJsonPath = path.join(floorsPath, `floor-${floorNumber}.json`);
    await fs.writeFile(floorJsonPath, JSON.stringify(floorExport, null, 2));

    console.log(`  ✓ Saved floor-${floorNumber}.json`);
    console.log(`  ✓ Exported ${exportedUnits.length} units`);
    console.log(`  ✓ References ${modelIdsReferenced.length} models`);

    res.json({
      success: true,
      message: `Floor ${floorNumber} exported successfully`,
      files: {
        floor: `/data/buildings/${buildingId}/floors/floor-${floorNumber}.json`,
      },
      stats: {
        units: exportedUnits.length,
        modelsReferenced: modelIdsReferenced.length,
      },
    });
  } catch (error) {
    console.error("Export floor error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/export/tour/:modelId
 * Export virtual tour configuration with panoramas and hotspots
 */
app.post("/api/export/tour/:modelId", async (req, res) => {
  try {
    const { modelId } = req.params;
    const tourData = req.body;

    if (!tourData || !tourData.scenes) {
      return res.status(400).json({ error: "Invalid tour data" });
    }

    console.log(`\n🎬 Exporting virtual tour for model ${modelId}...`);

    // Create tours directory
    const toursPath = path.join(PUBLIC_DATA_PATH, "tours", modelId);
    await fs.mkdir(toursPath, { recursive: true });

    let imageCount = 0;

    // Process and save panorama images
    for (const scene of tourData.scenes) {
      if (scene.panoramaImage && scene.panoramaImage.url) {
        try {
          // Check if it's a base64 data URL
          const base64Match = scene.panoramaImage.url.match(
            /^data:image\/(\w+);base64,(.+)$/
          );

          if (base64Match) {
            const ext = base64Match[1];
            const base64Data = base64Match[2];
            const buffer = Buffer.from(base64Data, "base64");

            const filename = `scene-${scene.id}.${ext}`;
            const imagePath = path.join(toursPath, filename);

            await fs.writeFile(imagePath, buffer);

            // Update scene to use relative path
            scene.panoramaImage.url = `/data/tours/${modelId}/${filename}`;
            imageCount++;
            console.log(`  ✓ Saved panorama: ${filename}`);
          } else if (scene.panoramaImage.url.startsWith("/data/")) {
            // Already exported, keep the path
            console.log(`  → Panorama already exported: ${scene.id}`);
          }
        } catch (err) {
          console.error(
            `  ✗ Failed to save panorama for scene ${scene.id}:`,
            err.message
          );
        }
      }
    }

    // Write tour JSON
    const tourJsonPath = path.join(toursPath, "tour.json");
    await fs.writeFile(tourJsonPath, JSON.stringify(tourData, null, 2));

    console.log(`  ✓ Saved tour.json`);
    console.log(`  ✓ Exported ${tourData.scenes.length} scenes`);
    console.log(`  ✓ Saved ${imageCount} panorama images`);
    console.log(`  ✓ Total hotspots: ${tourData.metadata.totalHotspots}`);

    res.json({
      success: true,
      message: `Virtual tour for model ${modelId} exported successfully`,
      filename: `/data/tours/${modelId}/tour.json`,
      stats: {
        scenes: tourData.scenes.length,
        hotspots: tourData.metadata.totalHotspots,
        images: imageCount,
      },
    });
  } catch (error) {
    console.error("Export tour error:", error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/health
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// ============================================================================
// Server Startup
// ============================================================================

async function startServer() {
  await ensureDirectories();

  app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════════════╗
║   Project X Admin Server                       ║
║   Running on http://localhost:${PORT}            ║
║                                                ║
║   Endpoints:                                   ║
║   POST /api/export/models                      ║
║   POST /api/export/map                         ║
║   POST /api/export/masterplan                  ║
║   POST /api/export/building/:buildingId        ║
║   POST /api/export/floor/:buildingId/:floorNum ║
║   POST /api/export/tour/:modelId               ║
║   POST /api/export/project                     ║
║   GET  /api/health                             ║
╚════════════════════════════════════════════════╝
    `);
  });
}

startServer().catch(console.error);

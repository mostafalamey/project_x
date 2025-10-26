/**
 * Model Editor Component
 * Form for creating and editing apartment models
 */

import { useState, useEffect } from "react";
import { Model, Rotation360Config, ImageRef } from "../../types/admin-config";
import { useModelsStore } from "../../stores/modelsStore";
import { FormField, FormSection } from "../panels/PropertiesPanel";
import { Save, X } from "lucide-react";
import { ImageDropzone } from "../upload";
import { Model360RotationUploader } from "./";
import { imageRefToDataURL } from "../../utils/imageProcessing";

// ============================================================================
// Component Props
// ============================================================================

interface ModelEditorProps {
  model: Model | null;
  onClose: () => void;
}

// ============================================================================
// Form Data Interface
// ============================================================================

interface ModelFormData {
  id: string;
  title: string;
  description: string;
  areaM2: number;
  bedrooms: number;
  bathrooms: number;
}

// ============================================================================
// Component
// ============================================================================

export default function ModelEditor({ model, onClose }: ModelEditorProps) {
  const { addModel, updateModel } = useModelsStore();
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [thumbnail, setThumbnail] = useState<ImageRef | null>(null);
  const [rotation360, setRotation360] = useState<Rotation360Config | null>(
    null
  );

  const [formData, setFormData] = useState<ModelFormData>({
    id: "",
    title: "",
    description: "",
    areaM2: 0,
    bedrooms: 0,
    bathrooms: 0,
  });

  // Load existing model data
  useEffect(() => {
    if (model) {
      setFormData({
        id: model.id,
        title: model.title || "",
        description: model.description || "",
        areaM2: model.areaM2 || 0,
        bedrooms: model.bedrooms || 0,
        bathrooms: model.bathrooms || 0,
      });
      setThumbnail(model.thumbnail || null);
      setRotation360(model.rotation360 || null);
    }
  }, [model]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.id.trim()) {
      newErrors.id = "Model ID is required";
    } else if (!/^[A-Za-z0-9-]+$/.test(formData.id)) {
      newErrors.id = "ID must be alphanumeric with hyphens only";
    }

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    } else if (formData.title.length < 3) {
      newErrors.title = "Title must be at least 3 characters";
    }

    if (formData.areaM2 <= 0) {
      newErrors.areaM2 = "Area must be greater than 0";
    }

    if (formData.bedrooms < 0) {
      newErrors.bedrooms = "Bedrooms cannot be negative";
    }

    if (formData.bathrooms < 0) {
      newErrors.bathrooms = "Bathrooms cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (field: keyof ModelFormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle save
  const handleSave = async () => {
    if (!validate()) {
      return;
    }

    setIsSaving(true);

    try {
      // Convert thumbnail blob to data URL for persistence
      let thumbnailToSave = thumbnail;
      if (thumbnail && thumbnail.blob) {
        const dataURL = await imageRefToDataURL(thumbnail);
        thumbnailToSave = { ...thumbnail, url: dataURL };
      }

      // Convert 360 rotation frame blobs to data URLs for persistence
      let rotation360ToSave = rotation360;
      if (rotation360 && rotation360.frames) {
        const framesWithDataURLs = await Promise.all(
          rotation360.frames.map(async (frame) => {
            if (frame.blob) {
              const dataURL = await imageRefToDataURL(frame);
              return { ...frame, url: dataURL };
            }
            return frame;
          })
        );
        rotation360ToSave = { ...rotation360, frames: framesWithDataURLs };
      }

      const modelData: Partial<Model> = {
        id: formData.id,
        projectId: "default", // TODO: Get from project store
        title: formData.title,
        description: formData.description,
        areaM2: formData.areaM2,
        bedrooms: formData.bedrooms,
        bathrooms: formData.bathrooms,
        tourPath: model?.tourPath || null,
        imagePath: thumbnailToSave
          ? `/data/models/model-${formData.id}.jpg`
          : "",
        rotation360: rotation360ToSave || undefined,
        thumbnail: thumbnailToSave || model?.thumbnail || undefined,
        displayOrder: model?.displayOrder || 0,
      };

      if (model) {
        await updateModel(model.id, modelData);
      } else {
        await addModel(modelData as Model);
      }

      onClose();
    } catch (error) {
      console.error("Failed to save model:", error);
      setErrors({ submit: "Failed to save model. Please try again." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Form Content */}
      <div className="flex-1 overflow-y-auto">
        {errors.submit && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
            {errors.submit}
          </div>
        )}

        {/* Basic Information */}
        <FormSection title="Basic Information">
          <FormField label="Model ID" required error={errors.id}>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => handleChange("id", e.target.value.toUpperCase())}
              disabled={!!model}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.id ? "border-red-300" : "border-gray-300"
              } ${model ? "bg-gray-100 cursor-not-allowed" : ""}`}
              placeholder="e.g., A-1, B-2"
            />
          </FormField>

          <FormField label="Title" required error={errors.title}>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange("title", e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.title ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="e.g., Modern 3-Bedroom Apartment"
            />
          </FormField>

          <FormField label="Description">
            <textarea
              value={formData.description}
              onChange={(e) => handleChange("description", e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Detailed description of the model..."
            />
          </FormField>
        </FormSection>

        {/* Specifications */}
        <FormSection title="Specifications">
          <FormField label="Area (m²)" required error={errors.areaM2}>
            <input
              type="number"
              value={formData.areaM2}
              onChange={(e) =>
                handleChange("areaM2", parseFloat(e.target.value) || 0)
              }
              min="0"
              step="0.1"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                errors.areaM2 ? "border-red-300" : "border-gray-300"
              }`}
              placeholder="120.5"
            />
          </FormField>

          <div className="grid grid-cols-2 gap-4">
            <FormField label="Bedrooms" error={errors.bedrooms}>
              <input
                type="number"
                value={formData.bedrooms}
                onChange={(e) =>
                  handleChange("bedrooms", parseInt(e.target.value) || 0)
                }
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.bedrooms ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="3"
              />
            </FormField>

            <FormField label="Bathrooms" error={errors.bathrooms}>
              <input
                type="number"
                value={formData.bathrooms}
                onChange={(e) =>
                  handleChange("bathrooms", parseInt(e.target.value) || 0)
                }
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.bathrooms ? "border-red-300" : "border-gray-300"
                }`}
                placeholder="2"
              />
            </FormField>
          </div>
        </FormSection>

        {/* Thumbnail */}
        <FormSection title="Thumbnail Image">
          <ImageDropzone
            onImageSelect={(imageRef: ImageRef) => {
              setThumbnail(imageRef);
            }}
            currentImage={thumbnail}
            onImageRemove={() => setThumbnail(null)}
            maxSizeMB={10}
          />
        </FormSection>

        {/* 360° Rotation */}
        <FormSection title="360° Rotation (Optional)">
          <Model360RotationUploader
            rotation360={rotation360}
            onRotationUpdate={setRotation360}
          />
        </FormSection>
      </div>

      {/* Actions */}
      <div className="border-t border-gray-200 p-4 flex items-center justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              {model ? "Update Model" : "Create Model"}
            </>
          )}
        </button>
      </div>
    </div>
  );
}

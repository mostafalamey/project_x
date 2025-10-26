/**
 * Landmark Editor Component
 * Properties panel for editing landmark details
 */

import { useState, useEffect } from "react";
import { X, Save, Trash2, MapPin } from "lucide-react";
import type { Landmark } from "../../types/admin-config";

// ============================================================================
// Component Props
// ============================================================================

interface LandmarkEditorProps {
  landmark: Landmark | null;
  onSave: (updates: Partial<Landmark>) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function LandmarkEditor({
  landmark,
  onSave,
  onDelete,
  onClose,
}: LandmarkEditorProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    distance: "",
    time: "",
    category: "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form when landmark changes
  useEffect(() => {
    if (landmark) {
      setFormData({
        name: landmark.name || "",
        description: landmark.description || "",
        distance: landmark.metadata?.distanceK?.toString() || "",
        time: landmark.metadata?.timeMin?.toString() || "",
        category: landmark.metadata?.category || "",
      });
      setErrors({});
    }
  }, [landmark]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (formData.distance && isNaN(parseFloat(formData.distance))) {
      newErrors.distance = "Distance must be a number";
    }

    if (formData.distance && parseFloat(formData.distance) < 0) {
      newErrors.distance = "Distance must be positive";
    }

    if (formData.time && isNaN(parseFloat(formData.time))) {
      newErrors.time = "Time must be a number";
    }

    if (formData.time && parseFloat(formData.time) < 0) {
      newErrors.time = "Time must be positive";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle save
  const handleSave = () => {
    if (!landmark || !validate()) return;

    const updates: Partial<Landmark> = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      metadata: {
        ...landmark.metadata,
        distanceK: formData.distance
          ? parseFloat(formData.distance)
          : undefined,
        timeMin: formData.time ? parseFloat(formData.time) : undefined,
        category: formData.category.trim() || undefined,
      },
    };

    onSave(updates);
  };

  // Handle delete
  const handleDelete = () => {
    if (!landmark) return;

    if (
      window.confirm(
        `Delete landmark "${landmark.name}"? This will also delete any connected paths.`
      )
    ) {
      onDelete(landmark.id);
      onClose();
    }
  };

  if (!landmark) return null;

  return (
    <div className="absolute right-0 top-0 bottom-0 w-96 bg-white shadow-2xl flex flex-col z-10 border-l border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">Edit Landmark</h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-100 rounded transition-colors"
          title="Close"
        >
          <X className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Form */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Type (readonly) */}
        <div>
          <label
            htmlFor="landmark-type"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Type
          </label>
          <input
            id="landmark-type"
            type="text"
            value={
              landmark.type === "poi" ? "Point of Interest" : "Main Complex"
            }
            disabled
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
          />
        </div>

        {/* Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter landmark name"
          />
          {errors.name && (
            <p className="text-red-500 text-sm mt-1">{errors.name}</p>
          )}
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Enter description"
          />
        </div>

        {/* Distance, Time, and Category - Only for POI landmarks */}
        {landmark.type === "poi" && (
          <>
            {/* Distance */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Distance (km)
              </label>
              <input
                type="text"
                value={formData.distance}
                onChange={(e) =>
                  setFormData({ ...formData, distance: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.distance ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 1.5"
              />
              {errors.distance && (
                <p className="text-red-500 text-sm mt-1">{errors.distance}</p>
              )}
            </div>

            {/* Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Time (minutes)
              </label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) =>
                  setFormData({ ...formData, time: e.target.value })
                }
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.time ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="e.g., 5"
              />
              {errors.time && (
                <p className="text-red-500 text-sm mt-1">{errors.time}</p>
              )}
            </div>

            {/* Category */}
            <div>
              <label
                htmlFor="landmark-category"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Category
              </label>
              <select
                id="landmark-category"
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select category</option>
                <option value="amenity">Amenity</option>
                <option value="transport">Transport</option>
                <option value="shopping">Shopping</option>
                <option value="healthcare">Healthcare</option>
                <option value="education">Education</option>
                <option value="recreation">Recreation</option>
                <option value="dining">Dining</option>
                <option value="other">Other</option>
              </select>
            </div>
          </>
        )}

        {/* Geometry Info (readonly) */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Geometry</h4>
          {"center" in landmark.geometry ? (
            <div className="text-sm text-gray-600 space-y-1">
              <p>Type: Circle</p>
              <p>
                Center: ({landmark.geometry.center.x.toFixed(1)},{" "}
                {landmark.geometry.center.y.toFixed(1)})
              </p>
              <p>Radius: {landmark.geometry.radius}px</p>
            </div>
          ) : (
            <div className="text-sm text-gray-600 space-y-1">
              <p>Type: Polygon</p>
              <p>Vertices: {landmark.geometry.vertices.length}</p>
              <p>Closed: {landmark.geometry.closed ? "Yes" : "No"}</p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 flex gap-2">
        <button
          onClick={handleSave}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Save className="w-4 h-4" />
          Save Changes
        </button>
        <button
          onClick={handleDelete}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          title="Delete Landmark"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

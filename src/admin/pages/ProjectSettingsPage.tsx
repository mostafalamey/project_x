/**
 * Project Settings Page
 * Configure project metadata and basic information
 */

import { useState, useEffect } from "react";
import { useProjectStore } from "../stores/projectStore";
import { AdminLayout } from "../components/layout";
import { Save, AlertCircle } from "lucide-react";
import { useAutosave } from "../hooks/useAutosave";

// ============================================================================
// Types
// ============================================================================

interface ProjectFormData {
  name: string;
  slug: string;
  developerName: string;
  developerLogo: string;
  email: string;
  phone: string;
  website: string;
  location: string;
  description: string;
  completionDate: string;
  totalUnits: number;
}

interface FormErrors {
  [key: string]: string;
}

// ============================================================================
// Component
// ============================================================================

export default function ProjectSettingsPage() {
  const { config, updateProject } = useProjectStore();
  const { save, isSaving, lastSaved, hasUnsavedChanges, markDirty } =
    useAutosave();

  const [formData, setFormData] = useState<ProjectFormData>({
    name: "",
    slug: "",
    developerName: "",
    developerLogo: "",
    email: "",
    phone: "",
    website: "",
    location: "",
    description: "",
    completionDate: "",
    totalUnits: 0,
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showSuccess, setShowSuccess] = useState(false);

  // Load existing config
  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name || "",
        slug: config.slug || "",
        developerName: config.developer?.name || "",
        developerLogo: config.developer?.logo || "",
        email: config.developer?.contact?.email || "",
        phone: config.developer?.contact?.phone || "",
        website: config.developer?.contact?.website || "",
        location: config.metadata?.location || "",
        description: config.metadata?.description || "",
        completionDate: config.metadata?.completionDate || "",
        totalUnits: config.metadata?.totalUnits || 0,
      });
    }
  }, [config]);

  // Validate form
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    // Name validation (3-100 characters)
    if (!formData.name.trim()) {
      newErrors.name = "Project name is required";
    } else if (formData.name.length < 3) {
      newErrors.name = "Project name must be at least 3 characters";
    } else if (formData.name.length > 100) {
      newErrors.name = "Project name must not exceed 100 characters";
    }

    // Slug validation (alphanumeric and hyphens only)
    if (!formData.slug.trim()) {
      newErrors.slug = "Project slug is required";
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = "Slug must be lowercase alphanumeric with hyphens only";
    }

    // Email validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    // Website validation
    if (formData.website && !/^https?:\/\/.+/.test(formData.website)) {
      newErrors.website = "Website must start with http:// or https://";
    }

    // Total units validation
    if (formData.totalUnits < 0) {
      newErrors.totalUnits = "Total units cannot be negative";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input change
  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    markDirty();
    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // Handle form submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    try {
      const projectUpdate = {
        name: formData.name,
        slug: formData.slug,
        developer: {
          name: formData.developerName,
          logo: formData.developerLogo || undefined,
          contact: {
            email: formData.email || undefined,
            phone: formData.phone || undefined,
            website: formData.website || undefined,
          },
        },
        metadata: {
          location: formData.location || undefined,
          description: formData.description || undefined,
          completionDate: formData.completionDate || undefined,
          totalUnits: formData.totalUnits || undefined,
        },
      };

      await updateProject(projectUpdate);
      await save("project-settings", formData);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (error) {
      console.error("Failed to save project settings:", error);
      setErrors({
        submit: "Failed to save project settings. Please try again.",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Project Settings
          </h1>
          <p className="text-gray-600">
            Configure project metadata and contact information
          </p>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <Save className="w-5 h-5 text-green-600" />
            <p className="text-green-800">
              Project settings saved successfully!
            </p>
          </div>
        )}

        {/* Error Message */}
        {errors.submit && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-red-800">{errors.submit}</p>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Basic Information
            </h2>

            <div className="space-y-4">
              {/* Project Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleChange("name", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.name ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="e.g., Riverside Towers"
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Project Slug <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    handleChange("slug", e.target.value.toLowerCase())
                  }
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.slug ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="e.g., riverside-towers"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lowercase letters, numbers, and hyphens only
                </p>
                {errors.slug && (
                  <p className="mt-1 text-sm text-red-600">{errors.slug}</p>
                )}
              </div>

              {/* Developer */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Developer Name
                </label>
                <input
                  type="text"
                  value={formData.developerName}
                  onChange={(e) =>
                    handleChange("developerName", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., ABC Development Corporation"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the project..."
                />
              </div>
            </div>
          </section>

          {/* Contact Information */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Contact Information
            </h2>

            <div className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.email ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="contact@example.com"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Website */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Website
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => handleChange("website", e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.website ? "border-red-300" : "border-gray-300"
                  }`}
                  placeholder="https://www.example.com"
                />
                {errors.website && (
                  <p className="mt-1 text-sm text-red-600">{errors.website}</p>
                )}
              </div>
            </div>
          </section>

          {/* Location */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Location
            </h2>

            <div className="space-y-4">
              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange("location", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Downtown Dubai, UAE"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Full address or general location description
                </p>
              </div>
            </div>
          </section>

          {/* Project Details */}
          <section className="bg-white rounded-lg border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Project Details
            </h2>

            <div className="grid grid-cols-2 gap-4">
              {/* Completion Date */}
              <div>
                <label
                  htmlFor="completionDate"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Completion Date
                </label>
                <input
                  id="completionDate"
                  type="date"
                  value={formData.completionDate}
                  onChange={(e) =>
                    handleChange("completionDate", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  aria-label="Project completion date"
                />
              </div>

              {/* Total Units */}
              <div>
                <label
                  htmlFor="totalUnits"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Total Units
                </label>
                <input
                  id="totalUnits"
                  type="number"
                  value={formData.totalUnits}
                  onChange={(e) =>
                    handleChange("totalUnits", parseInt(e.target.value) || 0)
                  }
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.totalUnits ? "border-red-300" : "border-gray-300"
                  }`}
                  aria-label="Total number of units in project"
                  placeholder="0"
                />
                {errors.totalUnits && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.totalUnits}
                  </p>
                )}
              </div>
            </div>
          </section>

          {/* Submit Button */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {hasUnsavedChanges && (
                <span className="text-amber-600">Unsaved changes</span>
              )}
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </AdminLayout>
  );
}

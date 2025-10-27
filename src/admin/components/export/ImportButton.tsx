/**
 * Import Button Component
 * Handles project import from ZIP files
 */

import { useState, useRef } from "react";
import { Upload, AlertCircle, CheckCircle, X } from "lucide-react";
import {
  extractProjectZip,
  validateZipStructure,
} from "../../services/import/zipExtractor";
import {
  validateProjectConfig,
  type ValidationResult,
} from "../../services/import/configValidator";
import { importProjectData } from "../../services/import/projectImporter";
import { useProjectStore } from "../../stores/projectStore";

// ============================================================================
// Component
// ============================================================================

export default function ImportButton() {
  const { loadProject } = useProjectStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setValidationResult(null);
    setExtractedData(null);

    try {
      // Validate ZIP structure
      const structureValidation = await validateZipStructure(file);
      if (!structureValidation.isValid) {
        setError(
          `Invalid ZIP structure:\n${structureValidation.errors.join("\n")}`
        );
        setIsProcessing(false);
        return;
      }

      // Extract ZIP contents
      const extracted = await extractProjectZip(file);
      setExtractedData(extracted);

      // Validate configuration
      const validation = validateProjectConfig({
        project: extracted.project,
        models: extracted.models,
        landmarks: extracted.landmarks,
        masterplan: extracted.masterplan,
        buildings: extracted.buildings,
        floors: extracted.floors,
        tours: extracted.tours,
      });

      setValidationResult(validation);
      setIsProcessing(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to process ZIP file"
      );
      setIsProcessing(false);
    }
  };

  // Handle import confirmation
  const handleImport = async () => {
    if (!extractedData || !validationResult?.isValid) return;

    try {
      setIsProcessing(true);

      // Import data into IndexedDB
      await importProjectData(extractedData);

      // Load the imported project into the project store
      await loadProject(extractedData.project.id);

      alert("Project imported successfully!");
      setIsModalOpen(false);
      setExtractedData(null);
      setValidationResult(null);

      // Reload page to refresh all stores
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import project");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle import cancellation
  const handleCancel = () => {
    setIsModalOpen(false);
    setExtractedData(null);
    setValidationResult(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <>
      {/* Import Button */}
      <button
        onClick={() => setIsModalOpen(true)}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
      >
        <Upload className="w-4 h-4" />
        Import Project
      </button>

      {/* Import Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                Import Project
              </h2>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
                aria-label="Close import dialog"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* File Input */}
              {!extractedData && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select ZIP File
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".zip"
                    onChange={handleFileSelect}
                    disabled={isProcessing}
                    title="Select ZIP file to import"
                    aria-label="Select ZIP file to import"
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-lg file:border-0
                      file:text-sm file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              {/* Processing State */}
              {isProcessing && (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Processing...</span>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-900 mb-1">Error</h3>
                    <p className="text-sm text-red-700 whitespace-pre-line">
                      {error}
                    </p>
                  </div>
                </div>
              )}

              {/* Validation Results */}
              {validationResult && !isProcessing && (
                <div className="space-y-4">
                  {/* Success Message */}
                  {validationResult.isValid && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-start gap-3">
                      <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-green-900 mb-1">
                          Validation Successful
                        </h3>
                        <p className="text-sm text-green-700">
                          The project configuration is valid and ready to
                          import.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Validation Errors */}
                  {validationResult.errors.length > 0 && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h3 className="font-semibold text-red-900 mb-2 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5" />
                        Validation Errors ({validationResult.errors.length})
                      </h3>
                      <ul className="space-y-1 text-sm text-red-700">
                        {validationResult.errors.map((err, index) => (
                          <li key={index}>
                            <strong>{err.field}:</strong> {err.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Validation Warnings */}
                  {validationResult.warnings.length > 0 && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
                      <h3 className="font-semibold text-amber-900 mb-2">
                        Warnings ({validationResult.warnings.length})
                      </h3>
                      <ul className="space-y-1 text-sm text-amber-700">
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index}>
                            <strong>{warning.field}:</strong> {warning.message}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Project Summary */}
                  {extractedData && (
                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <h3 className="font-semibold text-gray-900 mb-3">
                        Project Summary
                      </h3>
                      <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <dt className="text-gray-600">Project Name:</dt>
                        <dd className="font-medium text-gray-900">
                          {extractedData.project?.name || "N/A"}
                        </dd>

                        <dt className="text-gray-600">Models:</dt>
                        <dd className="font-medium text-gray-900">
                          {extractedData.models?.length || 0}
                        </dd>

                        <dt className="text-gray-600">Buildings:</dt>
                        <dd className="font-medium text-gray-900">
                          {extractedData.buildings?.length || 0}
                        </dd>

                        <dt className="text-gray-600">Floors:</dt>
                        <dd className="font-medium text-gray-900">
                          {extractedData.floors?.length || 0}
                        </dd>

                        <dt className="text-gray-600">Images:</dt>
                        <dd className="font-medium text-gray-900">
                          {extractedData.images?.size || 0}
                        </dd>
                      </dl>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                onClick={handleCancel}
                disabled={isProcessing}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              {extractedData && validationResult?.isValid && (
                <button
                  onClick={handleImport}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  Import Project
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

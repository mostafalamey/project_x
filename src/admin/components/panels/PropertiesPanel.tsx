/**
 * Properties Panel Component
 * Fixed-position right sidebar for editing properties
 */

import { ReactNode } from "react";
import { X } from "lucide-react";

// ============================================================================
// Component Props
// ============================================================================

interface PropertiesPanelProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  width?: string;
}

// ============================================================================
// Component
// ============================================================================

export default function PropertiesPanel({
  title,
  isOpen,
  onClose,
  children,
  width = "w-96",
}: PropertiesPanelProps) {
  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-25 z-20"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 h-full ${width} bg-white shadow-2xl z-30 flex flex-col`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title="Close"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">{children}</div>

        {/* Footer (optional, can be passed as children) */}
      </div>
    </>
  );
}

// ============================================================================
// Form Field Components
// ============================================================================

export function FormField({
  label,
  children,
  error,
  required,
}: {
  label: string;
  children: ReactNode;
  error?: string;
  required?: boolean;
}) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}

export function FormSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="mb-6">
      <h4 className="text-sm font-semibold text-gray-900 mb-3 pb-2 border-b border-gray-200">
        {title}
      </h4>
      {children}
    </div>
  );
}

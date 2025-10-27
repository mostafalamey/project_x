/**
 * Properties Panel Component
 * Fixed-position overlay panel for editing object properties
 */

import { ReactNode } from "react";
import { X, Minimize2, Maximize2 } from "lucide-react";

// ============================================================================
// Component Props
// ============================================================================

interface PropertiesPanelProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
  width?: number;
  maxHeight?: number;
}

// ============================================================================
// Component
// ============================================================================

export default function PropertiesPanel({
  title,
  isOpen,
  onClose,
  children,
  isMinimized = false,
  onToggleMinimize,
  width = 320,
  maxHeight = 600,
}: PropertiesPanelProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed right-6 top-20 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden"
      style={{
        zIndex: 20,
        width: `${width}px`,
        maxHeight: isMinimized ? "auto" : `${maxHeight}px`,
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-2">
          {onToggleMinimize && (
            <button
              onClick={onToggleMinimize}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
              title={isMinimized ? "Maximize" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="w-4 h-4" />
              ) : (
                <Minimize2 className="w-4 h-4" />
              )}
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      {!isMinimized && (
        <div
          className="overflow-y-auto"
          style={{ maxHeight: `${maxHeight - 60}px` }}
        >
          {children}
        </div>
      )}
    </div>
  );
}

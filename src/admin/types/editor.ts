/**
 * Editor Types
 * Types for editor state and UI management
 */

// ============================================================================
// Editor Mode
// ============================================================================

export type EditorMode =
  | "view" // Read-only viewing mode
  | "draw" // Drawing new shapes
  | "edit" // Editing existing shapes
  | "select"; // Selecting shapes

// ============================================================================
// Selection State
// ============================================================================

export interface SelectionState {
  selectedIds: string[]; // Multiple selection support
  primaryId: string | null; // Primary selected item
  selectionType:
    | "shape"
    | "landmark"
    | "hotspot"
    | "building"
    | "floor"
    | "unit"
    | null;
}

// ============================================================================
// Panel State
// ============================================================================

export interface PanelState {
  properties: {
    visible: boolean;
    position: "right" | "left";
    width: number;
  };
  toolbar: {
    visible: boolean;
    position: "top" | "bottom";
  };
  sidebar: {
    visible: boolean;
    collapsed: boolean;
    width: number;
  };
  statusBar: {
    visible: boolean;
  };
}

// ============================================================================
// Form State
// ============================================================================

export interface FormState<T> {
  data: T;
  errors: Partial<Record<keyof T, string>>;
  touched: Partial<Record<keyof T, boolean>>;
  isDirty: boolean;
  isValid: boolean;
  isSubmitting: boolean;
}

// ============================================================================
// Upload State
// ============================================================================

export interface UploadState {
  isUploading: boolean;
  progress: number; // 0-100
  file: File | null;
  preview: string | null; // Data URL or object URL
  error: string | null;
}

// ============================================================================
// Validation Result
// ============================================================================

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
}

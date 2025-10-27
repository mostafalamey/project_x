/**
 * Autosave Indicator Component
 * Shows autosave status in the admin header
 */

import { useEffect, useState } from "react";
import { Check, AlertCircle, Loader2, Clock } from "lucide-react";

// ============================================================================
// Component Props
// ============================================================================

interface AutosaveIndicatorProps {
  isSaving: boolean;
  lastSaved: Date | null;
  error: string | null;
}

// ============================================================================
// Component
// ============================================================================

export default function AutosaveIndicator({
  isSaving,
  lastSaved,
  error,
}: AutosaveIndicatorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute to show relative timestamps
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

  // Format relative time
  const getRelativeTime = (date: Date): string => {
    const seconds = Math.floor((currentTime.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return "just now";
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60);
      return `${minutes}m ago`;
    }
    if (seconds < 86400) {
      const hours = Math.floor(seconds / 3600);
      return `${hours}h ago`;
    }

    return date.toLocaleDateString();
  };

  // Render based on status
  if (error) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
        <AlertCircle className="w-4 h-4" />
        <span>Autosave failed</span>
      </div>
    );
  }

  if (isSaving) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Saving...</span>
      </div>
    );
  }

  if (lastSaved) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
        <Check className="w-4 h-4" />
        <span>Saved {getRelativeTime(lastSaved)}</span>
      </div>
    );
  }

  // No save yet
  return (
    <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 text-sm">
      <Clock className="w-4 h-4" />
      <span>Not saved</span>
    </div>
  );
}

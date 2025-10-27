/**
 * Map Page
 * Interactive map editor with landmark and path drawing tools
 */

import { AdminLayout } from "../components/layout";
import { MapEditor } from "../components/editors";

// ============================================================================
// Component
// ============================================================================

export default function MapPage() {
  const projectId = "default"; // TODO: Get from project store

  return (
    <AdminLayout fullViewport={true}>
      <MapEditor projectId={projectId} />
    </AdminLayout>
  );
}

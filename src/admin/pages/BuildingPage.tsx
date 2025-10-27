/**
 * Building Page
 * Building configuration editor with floor hotspots
 */

import { AdminLayout } from "../components/layout";
import { BuildingEditor } from "../components/editors";

// ============================================================================
// Component
// ============================================================================

export default function BuildingPage() {
  const projectId = "default"; // TODO: Get from project store

  return (
    <AdminLayout fullViewport={true}>
      <BuildingEditor projectId={projectId} />
    </AdminLayout>
  );
}

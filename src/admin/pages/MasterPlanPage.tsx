/**
 * Master Plan Page
 * Master plan editor with angle viewer and building hotspot configuration
 */

import { AdminLayout } from "../components/layout";
import { MasterPlanEditor } from "../components/editors";

// ============================================================================
// Component
// ============================================================================

export default function MasterPlanPage() {
  const projectId = "default"; // TODO: Get from project store

  return (
    <AdminLayout>
      <MasterPlanEditor projectId={projectId} />
    </AdminLayout>
  );
}

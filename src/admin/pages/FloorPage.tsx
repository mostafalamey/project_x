/**
 * Floor Plans Page
 * Container for floor plan editor
 */

import { AdminLayout } from "../components/layout";
import { FloorEditor } from "../components/editors";

// ============================================================================
// Component
// ============================================================================

export default function FloorPage() {
  const projectId = "default"; // TODO: Get from project store

  return (
    <AdminLayout>
      <FloorEditor projectId={projectId} />
    </AdminLayout>
  );
}

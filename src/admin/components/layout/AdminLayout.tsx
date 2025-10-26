/**
 * Admin Layout Component
 * Main layout wrapper with sidebar and content area
 */

import { ReactNode, useState } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";

// ============================================================================
// Component Props
// ============================================================================

interface AdminLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showHeader?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function AdminLayout({
  children,
  showSidebar = true,
  showHeader = true,
}: AdminLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      {showSidebar && (
        <AdminSidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Header */}
        {showHeader && <AdminHeader />}

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-white">{children}</main>
      </div>
    </div>
  );
}

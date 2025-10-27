/**
 * Admin Layout Component
 * Main layout wrapper with sidebar and content area
 */

import { ReactNode } from "react";
import AdminSidebar from "./AdminSidebar";
import AdminHeader from "./AdminHeader";
import { useSidebar } from "../../contexts/SidebarContext";

// ============================================================================
// Component Props
// ============================================================================

interface AdminLayoutProps {
  children: ReactNode;
  showSidebar?: boolean;
  showHeader?: boolean;
  fullViewport?: boolean; // New prop for full-viewport canvas pages
}

// ============================================================================
// Component
// ============================================================================

export default function AdminLayout({
  children,
  showSidebar = true,
  showHeader = true,
  fullViewport = false,
}: AdminLayoutProps) {
  const { isCollapsed, setIsCollapsed } = useSidebar();

  // For full viewport mode (Map, Master Plan, Building, Floor editors)
  if (fullViewport) {
    return (
      <>
        {/* Sidebar - Fixed overlay */}
        {showSidebar && (
          <AdminSidebar
            isCollapsed={isCollapsed}
            onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
          />
        )}

        {/* Full viewport content (canvas fills entire screen) */}
        {/* Note: Header is hidden in full viewport mode - canvas editors have their own toolbars */}
        {children}
      </>
    );
  }

  // Regular layout mode (Dashboard, Settings, etc.)
  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      {/* Sidebar */}
      {showSidebar && (
        <AdminSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
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

/**
 * Admin Sidebar Component
 * Navigation sidebar for admin sections
 */

import { Link, useLocation } from "react-router-dom";
import {
  Settings,
  Home,
  Map,
  Layers,
  Building2,
  Layout,
  Video,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

// ============================================================================
// Component Props
// ============================================================================

interface AdminSidebarProps {
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

// ============================================================================
// Navigation Items
// ============================================================================

const navItems = [
  {
    path: "/admin",
    label: "Dashboard",
    icon: Home,
    exact: true,
  },
  {
    path: "/admin/project",
    label: "Project Settings",
    icon: Settings,
  },
  {
    path: "/admin/models",
    label: "Models",
    icon: Home,
  },
  {
    path: "/admin/map",
    label: "Map",
    icon: Map,
  },
  {
    path: "/admin/masterplan",
    label: "Master Plan",
    icon: Layers,
  },
  {
    path: "/admin/buildings",
    label: "Buildings",
    icon: Building2,
  },
  {
    path: "/admin/floors",
    label: "Floor Plans",
    icon: Layout,
  },
  {
    path: "/admin/tours",
    label: "Virtual Tours",
    icon: Video,
  },
];

// ============================================================================
// Component
// ============================================================================

export default function AdminSidebar({
  isCollapsed,
  onToggleCollapse,
}: AdminSidebarProps) {
  const location = useLocation();

  const isActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`bg-gray-900 text-white flex flex-col transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* Logo / Title */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
        {!isCollapsed && <h1 className="text-xl font-bold">Admin</h1>}
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-gray-800 rounded transition-colors"
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <ChevronLeft className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path, item.exact);

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded transition-colors ${
                    active
                      ? "bg-blue-600 text-white"
                      : "text-gray-300 hover:bg-gray-800 hover:text-white"
                  }`}
                  title={isCollapsed ? item.label : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
                    <span className="text-sm font-medium">{item.label}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded transition-colors"
          title={isCollapsed ? "Back to Viewer" : undefined}
        >
          <Home className="w-5 h-5 flex-shrink-0" />
          {!isCollapsed && (
            <span className="text-sm font-medium">Back to Viewer</span>
          )}
        </Link>
      </div>
    </aside>
  );
}

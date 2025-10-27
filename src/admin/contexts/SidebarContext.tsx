/**
 * Sidebar Context
 * Provides sidebar collapse state to all admin components
 */

import { createContext, useContext, ReactNode, useState } from "react";

// ============================================================================
// Context Type
// ============================================================================

interface SidebarContextType {
  isCollapsed: boolean;
  setIsCollapsed: (collapsed: boolean) => void;
  sidebarWidth: number; // In pixels
}

// ============================================================================
// Context
// ============================================================================

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

interface SidebarProviderProps {
  children: ReactNode;
}

export function SidebarProvider({ children }: SidebarProviderProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Calculate sidebar width based on collapse state
  const sidebarWidth = isCollapsed ? 64 : 256; // w-16 : w-64

  return (
    <SidebarContext.Provider
      value={{
        isCollapsed,
        setIsCollapsed,
        sidebarWidth,
      }}
    >
      {children}
    </SidebarContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useSidebar() {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within SidebarProvider");
  }
  return context;
}

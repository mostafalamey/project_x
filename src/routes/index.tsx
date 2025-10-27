import { AnimatePresence } from "framer-motion";
import {
  HashRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { useEffect } from "react";

import { TransitionProvider } from "../contexts/TransitionContext";
import { SidebarProvider } from "../admin/contexts/SidebarContext";
import { BuildingView } from "../pages/BuildingView";
import { FloorPlanView } from "../pages/FloorPlanView";
import { MapView } from "../pages/MapView";
import { MasterPlanView } from "../pages/MasterPlanView";
import { ModelView } from "../pages/ModelView";
import { TourViewer } from "../pages/TourViewer";

// Admin Pages
import AdminDashboard from "../admin/pages/AdminDashboard";
import ProjectSettingsPage from "../admin/pages/ProjectSettingsPage";
import ModelsPage from "../admin/pages/ModelsPage";
import MapPage from "../admin/pages/MapPage";
import MasterPlanPage from "../admin/pages/MasterPlanPage";
import BuildingPage from "../admin/pages/BuildingPage";
import FloorPage from "../admin/pages/FloorPage";

const AnimatedRoutes = () => {
  const location = useLocation();

  // Force scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={() => {
        // Ensure DOM is ready for next view
        window.scrollTo(0, 0);
      }}
    >
      {isAdminRoute ? (
        <SidebarProvider>
          <Routes location={location} key={location.pathname}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/project" element={<ProjectSettingsPage />} />
            <Route path="/admin/models" element={<ModelsPage />} />
            <Route path="/admin/map" element={<MapPage />} />
            <Route path="/admin/masterplan" element={<MasterPlanPage />} />
            <Route path="/admin/buildings" element={<BuildingPage />} />
            <Route path="/admin/floors" element={<FloorPage />} />
          </Routes>
        </SidebarProvider>
      ) : (
        <Routes location={location} key={location.pathname}>
          {/* Viewer Routes */}
          <Route path="/" element={<MapView />} />
          <Route path="/masterplan" element={<MasterPlanView />} />
          <Route path="/model/:modelId" element={<ModelView />} />
          <Route path="/building/:buildingId" element={<BuildingView />} />
          <Route
            path="/building/:buildingId/floor/:floorId"
            element={<FloorPlanView />}
          />
          <Route path="/tour/:tourId" element={<TourViewer />} />

          {/* 404 Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      )}
    </AnimatePresence>
  );
};

export const AppRouter = () => {
  return (
    <HashRouter>
      <TransitionProvider>
        <AnimatedRoutes />
      </TransitionProvider>
    </HashRouter>
  );
};

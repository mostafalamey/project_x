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
import { BuildingView } from "../pages/BuildingView";
import { FloorPlanView } from "../pages/FloorPlanView";
import { MapView } from "../pages/MapView";
import { MasterPlanView } from "../pages/MasterPlanView";
import { ModelView } from "../pages/ModelView";
import { TourViewer } from "../pages/TourViewer";

const AnimatedRoutes = () => {
  const location = useLocation();

  // Force scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <AnimatePresence
      mode="wait"
      initial={false}
      onExitComplete={() => {
        // Ensure DOM is ready for next view
        window.scrollTo(0, 0);
      }}
    >
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

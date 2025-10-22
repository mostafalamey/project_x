import { HashRouter, Navigate, Route, Routes } from "react-router-dom";

import { BuildingView } from "../pages/BuildingView";
import { FloorPlanView } from "../pages/FloorPlanView";
import { MapView } from "../pages/MapView";
import { MasterPlanView } from "../pages/MasterPlanView";
import { TourViewer } from "../pages/TourViewer";

export const AppRouter = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<MapView />} />
        <Route path="/masterplan" element={<MasterPlanView />} />
        <Route path="/building/:buildingId" element={<BuildingView />} />
        <Route
          path="/building/:buildingId/floor/:floorId"
          element={<FloorPlanView />}
        />
        <Route path="/tour/:tourId" element={<TourViewer />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  );
};

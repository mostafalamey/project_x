declare module "react-photo-sphere-viewer" {
  import type { ComponentType } from "react";

  export interface ReactPhotoSphereViewerProps {
    src: string;
    height?: string | number;
    width?: string | number;
    littlePlanet?: boolean;
    pitch?: number;
    yaw?: number;
    fov?: number;
    onReady?: () => void;
  }

  export const ReactPhotoSphereViewer: ComponentType<ReactPhotoSphereViewerProps>;
}

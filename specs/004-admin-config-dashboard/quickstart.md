# Admin Dashboard Quickstart Guide

**Feature**: Admin Configuration Dashboard  
**Audience**: Developers working on or extending the admin dashboard  
**Last Updated**: 2025-10-24

## Overview

This guide provides a quick-start path for developers to understand, set up, and extend the Admin Configuration Dashboard. The dashboard is a visual editor for configuring real estate complex viewers, built with React + TypeScript + Vite.

---

## Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+ or yarn 1.22+
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)
- Basic familiarity with React, TypeScript, and Canvas/SVG

---

## Technology Stack

| Layer           | Technology                          | Purpose                               |
| --------------- | ----------------------------------- | ------------------------------------- |
| **Framework**   | React 18.3.1 + TypeScript 5.3.3     | UI components and type safety         |
| **Build Tool**  | Vite 5.x                            | Fast development and optimized builds |
| **Routing**     | React Router DOM 6.25+ (HashRouter) | Client-side navigation                |
| **Styling**     | TailwindCSS 3.4.7                   | Utility-first CSS                     |
| **State**       | Zustand 4.x                         | Global state management               |
| **Canvas**      | Konva.js 9.x + React-Konva 18.x     | Interactive polygon drawing           |
| **File Upload** | React Dropzone 14.x                 | Drag-and-drop image uploads           |
| **360° Viewer** | React Photo Sphere Viewer 2.0+      | Panoramic tour editing                |
| **Persistence** | Dexie.js 4.x (IndexedDB)            | Browser storage                       |
| **Export**      | JSZip 3.x + FileSaver.js 2.x        | Configuration downloads               |
| **Icons**       | Lucide-react                        | UI icons                              |
| **Animation**   | Framer Motion 11.x                  | UI transitions                        |

---

## Project Structure

```text
src/admin/                   # Admin dashboard root
├── components/              # React components
│   ├── layout/              # Layout components (sidebar, header)
│   ├── canvas/              # Canvas drawing tools
│   ├── overlays/            # Overlay UI panels
│   ├── editors/             # Section-specific editors
│   ├── upload/              # Image upload components
│   └── export/              # Export/import UI
├── pages/                   # Route pages
├── stores/                  # Zustand state stores
├── services/                # Business logic
│   ├── persistence/         # Dexie.js database
│   ├── export/              # ZIP generation
│   ├── import/              # Configuration import
│   └── validation/          # Schema validation
├── hooks/                   # Custom React hooks
├── types/                   # TypeScript definitions
└── utils/                   # Utility functions
```

---

## Getting Started

### 1. Install Dependencies

```bash
# Install all dependencies
npm install

# Or with yarn
yarn install
```

### 2. Start Development Server

```bash
npm run dev
```

Vite will start the development server, typically at `http://localhost:5173`.

### 3. Navigate to Admin Dashboard

Open your browser and go to:

```text
http://localhost:5173/#/admin
```

The `#` indicates hash-based routing (required for static deployment).

---

## Development Workflow

### Creating a New Section Page

1. **Create the page component**:

    ```typescript
    // src/admin/pages/NewSectionPage.tsx
    import { useState } from "react";
    import AdminLayout from "../components/layout/AdminLayout";
    import FullViewportCanvas from "../components/canvas/FullViewportCanvas";

    export default function NewSectionPage() {
    return (
        <AdminLayout>
        <FullViewportCanvas>{/* Canvas content */}</FullViewportCanvas>
        </AdminLayout>
    );
    }
    ```

2. **Add route**:

    ```typescript
    // src/routes/index.tsx
    import NewSectionPage from "@/admin/pages/NewSectionPage";

    const routes = [
    // ... existing routes
    {
        path: "/admin/new-section",
        element: <NewSectionPage />,
    },
    ];
    ```

3. **Add to sidebar navigation**:

    ```typescript
    // src/admin/components/layout/AdminSidebar.tsx
    const navItems = [
    // ... existing items
    {
        path: "/admin/new-section",
        label: "New Section",
        icon: <NewIcon />,
    },
    ];
    ```

### Creating a Zustand Store

```typescript
// src/admin/stores/newSectionStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NewSectionState {
  data: any[];
  selectedId: string | null;

  // Actions
  loadData: () => Promise<void>;
  addItem: (item: any) => Promise<void>;
  updateItem: (id: string, updates: Partial<any>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  selectItem: (id: string | null) => void;
}

export const useNewSectionStore = create<NewSectionState>()(
  persist(
    (set, get) => ({
      data: [],
      selectedId: null,

      loadData: async () => {
        // Load from Dexie
        const items = await db.newSection.toArray();
        set({ data: items });
      },

      addItem: async (item) => {
        const id = await db.newSection.add(item);
        set((state) => ({
          data: [...state.data, { ...item, id }],
        }));
      },

      updateItem: async (id, updates) => {
        await db.newSection.update(id, updates);
        set((state) => ({
          data: state.data.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        }));
      },

      deleteItem: async (id) => {
        await db.newSection.delete(id);
        set((state) => ({
          data: state.data.filter((item) => item.id !== id),
        }));
      },

      selectItem: (id) => set({ selectedId: id }),
    }),
    {
      name: "new-section-storage",
    }
  )
);
```

### Canvas Drawing with Konva

```typescript
// src/admin/components/canvas/PolygonDrawingTool.tsx
import { Layer, Line, Circle } from "react-konva";
import { useState } from "react";

export default function PolygonDrawingTool() {
  const [points, setPoints] = useState<number[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);

  const handleStageClick = (e: any) => {
    if (!isDrawing) return;

    const stage = e.target.getStage();
    const pointerPos = stage.getPointerPosition();

    setPoints([...points, pointerPos.x, pointerPos.y]);
  };

  const handleFinishDrawing = () => {
    // Save polygon to store
    const vertices = [];
    for (let i = 0; i < points.length; i += 2) {
      vertices.push({ x: points[i], y: points[i + 1] });
    }

    // Save to store...
    setPoints([]);
    setIsDrawing(false);
  };

  return (
    <Layer onClick={handleStageClick}>
      {/* Draw polygon line */}
      {points.length > 0 && (
        <Line points={points} stroke="blue" strokeWidth={2} closed={false} />
      )}

      {/* Draw vertex circles */}
      {points.map((_, i) => {
        if (i % 2 === 0) {
          return (
            <Circle
              key={i}
              x={points[i]}
              y={points[i + 1]}
              radius={5}
              fill="blue"
            />
          );
        }
        return null;
      })}
    </Layer>
  );
}
```

### Image Upload with React Dropzone

```typescript
// src/admin/components/upload/ImageDropzone.tsx
import { useDropzone } from "react-dropzone";
import { useCallback } from "react";

interface ImageDropzoneProps {
  onUpload: (file: File, dataUrl: string) => void;
  accept?: string;
  maxSize?: number;
}

export default function ImageDropzone({
  onUpload,
  accept = "image/jpeg,image/png",
  maxSize = 10485760, // 10MB
}: ImageDropzoneProps) {
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      for (const file of acceptedFiles) {
        // Validate and load image
        const dataUrl = await loadImageAsDataURL(file);
        onUpload(file, dataUrl);
      }
    },
    [onUpload]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
    multiple: false,
  });

  return (
    <div
      {...getRootProps()}
      className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
        ${isDragActive ? "border-blue-500 bg-blue-50" : "border-gray-300"}`}
    >
      <input {...getInputProps()} />
      {isDragActive ? (
        <p>Drop image here...</p>
      ) : (
        <p>Drag & drop an image, or click to select</p>
      )}
    </div>
  );
}

function loadImageAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}
```

---

## Key Patterns

### Full-Viewport Canvas with Overlays

```tsx
<div className="relative w-screen h-screen overflow-hidden">
  {/* Canvas Background (z-0) */}
  <div className="fixed inset-0 z-0">
    <Stage width={window.innerWidth} height={window.innerHeight}>
      {/* Canvas content */}
    </Stage>
  </div>

  {/* Overlay UI (z-10+) */}
  <Sidebar className="fixed left-0 top-0 bottom-0 z-10 w-64" />
  <Toolbar className="fixed top-4 right-4 z-10" />
  <PropertiesPanel className="fixed right-0 top-0 bottom-0 z-20 w-96" />
</div>
```

### Autosave Hook

```typescript
// src/admin/hooks/useAutosave.ts
import { useEffect, useRef } from "react";
import { db } from "../services/persistence/dexieDB";

export function useAutosave<T>(
  key: string,
  data: T,
  debounceMs: number = 30000
) {
  const timeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(async () => {
      try {
        await db.autosave.put({
          key,
          data: JSON.stringify(data),
          timestamp: Date.now(),
        });
        console.log("Autosaved:", key);
      } catch (error) {
        console.error("Autosave failed:", error);
      }
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [key, data, debounceMs]);
}
```

### Referential Integrity Check

```typescript
// src/admin/services/validation/integrityChecker.ts
export class IntegrityChecker {
  checkBeforeDelete(
    entityType: string,
    entityId: string,
    allData: FullConfig
  ): { canDelete: boolean; dependencies: string[]; warning?: string } {
    const dependencies: string[] = [];

    if (entityType === "model") {
      // Check unit references
      for (const floor of allData.floors) {
        for (const unit of floor.units) {
          if (unit.modelId === entityId) {
            dependencies.push(`Unit ${unit.unitNumber} on Floor ${floor.name}`);
          }
        }
      }
    }

    if (dependencies.length > 0) {
      return {
        canDelete: false,
        dependencies,
        warning: `This ${entityType} is used by ${dependencies.length} other entities. Delete them first or unlink them.`,
      };
    }

    return { canDelete: true, dependencies: [] };
  }
}
```

---

## Testing

### Unit Test Example (Vitest)

```typescript
// src/admin/services/validation/__tests__/integrityChecker.test.ts
import { describe, it, expect } from "vitest";
import { IntegrityChecker } from "../integrityChecker";

describe("IntegrityChecker", () => {
  it("detects orphaned unit references when deleting model", () => {
    const checker = new IntegrityChecker();
    const config = {
      models: [{ id: "m1", title: "Model A" }],
      floors: [
        {
          id: "f1",
          units: [
            { id: "u1", modelId: "m1", unitNumber: "101" },
            { id: "u2", modelId: "m2", unitNumber: "102" }, // m2 doesn't exist
          ],
        },
      ],
    };

    const result = checker.checkBeforeDelete("model", "m1", config);

    expect(result.canDelete).toBe(false);
    expect(result.dependencies).toHaveLength(1);
    expect(result.dependencies[0]).toContain("Unit 101");
  });
});
```

### Component Test Example (React Testing Library)

```typescript
// src/admin/components/upload/__tests__/ImageDropzone.test.tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import ImageDropzone from "../ImageDropzone";

describe("ImageDropzone", () => {
  it("accepts valid JPEG image", async () => {
    const onUpload = vi.fn();
    render(<ImageDropzone onUpload={onUpload} />);

    const file = new File(["image"], "test.jpg", { type: "image/jpeg" });
    const input = screen.getByLabelText(/drag/i);

    await userEvent.upload(input, file);

    expect(onUpload).toHaveBeenCalledWith(file, expect.any(String));
  });

  it("rejects invalid file types", async () => {
    const onUpload = vi.fn();
    render(<ImageDropzone onUpload={onUpload} accept="image/jpeg,image/png" />);

    const file = new File(["image"], "test.gif", { type: "image/gif" });
    const input = screen.getByLabelText(/drag/i);

    await userEvent.upload(input, file);

    expect(onUpload).not.toHaveBeenCalled();
  });
});
```

---

## Common Tasks

### Export Configuration

```typescript
import JSZip from "jszip";
import { saveAs } from "file-saver";

async function exportProject(config: FullConfig) {
  const zip = new JSZip();

  // Add JSON files
  zip.file("config/project.json", JSON.stringify(config.project, null, 2));
  zip.file("config/models.json", JSON.stringify(config.models, null, 2));

  // Add images
  const images = await db.images.toArray();
  for (const img of images) {
    zip.file(`images/${img.path}`, img.blob);
  }

  // Generate and download
  const blob = await zip.generateAsync({
    type: "blob",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  saveAs(blob, `${config.project.name}-export.zip`);
}
```

### Import Configuration

```typescript
import JSZip from "jszip";

async function importProject(zipFile: File) {
  const zip = await JSZip.loadAsync(zipFile);

  // Extract JSON files
  const projectJson = await zip.file("config/project.json")?.async("string");
  const project = JSON.parse(projectJson);

  // Extract images
  const imageFiles = zip.folder("images").files;
  for (const [path, file] of Object.entries(imageFiles)) {
    const blob = await file.async("blob");
    await db.images.add({ path, blob });
  }

  // Load into stores
  useProjectStore.getState().updateProject(project);
  // ... load other entities
}
```

---

## Troubleshooting

### Issue: Canvas not responding to clicks

**Solution**: Check z-index stacking. Canvas should be at z-0, overlays at z-10+.

### Issue: Images not displaying after refresh

**Solution**: Check IndexedDB persistence. Images should be stored as Blobs, not data URLs.

### Issue: Autosave not working

**Solution**: Verify Dexie.js database is initialized. Check browser console for quota errors.

### Issue: Export ZIP is empty

**Solution**: Ensure all image blobs are loaded from IndexedDB before zipping.

---

## Next Steps

- Review [Data Model](./data-model.md) for complete entity definitions
- Check [Research](./research.md) for technology decisions and best practices
- See [Contracts](./contracts/README.md) for JSON schema validation
- Read [Spec](./spec.md) for feature requirements and user scenarios

---

## Resources

- [React Documentation](https://react.dev/)
- [Konva.js Docs](https://konvajs.org/docs/)
- [React-Konva API](https://konvajs.org/docs/react/)
- [Zustand Guide](https://docs.pmnd.rs/zustand/getting-started/introduction)
- [Dexie.js Tutorial](https://dexie.org/docs/Tutorial/React)
- [React Photo Sphere Viewer](https://photo-sphere-viewer.js.org/)
- [TailwindCSS](https://tailwindcss.com/docs)

---

Happy coding! 🚀

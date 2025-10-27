/**
 * Models Page
 * Manage apartment models with CRUD operations
 */

import { useState, useEffect } from "react";
import { useModelsStore } from "../stores/modelsStore";
import { useFloorsStore } from "../stores/floorsStore";
import { AdminLayout } from "../components/layout";
import { PropertiesPanel } from "../components/panels";
import { ExportMenu } from "../components/export";
import { Plus, Edit, Trash2, GripVertical, Home, Camera } from "lucide-react";
import { Model } from "../types/admin-config";
import { ModelEditor, TourSceneEditor } from "../components/editors";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// ============================================================================
// Sortable Model Card Component
// ============================================================================

interface SortableModelCardProps {
  model: Model;
  isSelected: boolean;
  onEdit: (model: Model) => void;
  onDelete: (modelId: string) => void;
  onTour: (model: Model) => void;
}

function SortableModelCard({
  model,
  isSelected,
  onEdit,
  onDelete,
  onTour,
}: SortableModelCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: model.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white rounded-lg border-2 transition-all hover:shadow-lg ${
        isSelected ? "border-blue-500" : "border-gray-200"
      }`}
    >
      {/* Drag Handle */}
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200 rounded-t-lg">
        <div
          {...attributes}
          {...listeners}
          className="flex items-center gap-2 text-gray-500 cursor-move"
        >
          <GripVertical className="w-4 h-4" />
          <span className="text-sm font-medium">{model.id}</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => onTour(model)}
            className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
            title="Virtual tour"
          >
            <Camera className="w-4 h-4" />
          </button>

          <button
            onClick={() => onEdit(model)}
            className="p-1.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
            title="Edit model"
          >
            <Edit className="w-4 h-4" />
          </button>

          <button
            onClick={() => onDelete(model.id)}
            className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            title="Delete model"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Thumbnail */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {model.thumbnail?.url ? (
          <img
            src={model.thumbnail.url}
            alt={model.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}

        {model.rotation360 && (
          <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded">
            360°
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1">
          {model.title || "Untitled Model"}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {model.description || "No description"}
        </p>

        {/* Specs */}
        <div className="flex items-center gap-4 text-xs text-gray-500">
          <span>{model.areaM2 || 0} m²</span>
          <span>{model.bedrooms || 0} bed</span>
          <span>{model.bathrooms || 0} bath</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Component
// ============================================================================

export default function ModelsPage() {
  const {
    models,
    loadModels,
    deleteModel,
    selectModel,
    selectedModelId,
    reorderModels,
  } = useModelsStore();

  const { floors, loadAllFloors } = useFloorsStore();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isTourEditorOpen, setIsTourEditorOpen] = useState(false);
  const [tourModel, setTourModel] = useState<Model | null>(null);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Load models on mount
  useEffect(() => {
    const projectId = "default"; // TODO: Get from project store
    loadModels(projectId);
    loadAllFloors(projectId);
  }, [loadModels, loadAllFloors]);

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = models.findIndex((m) => m.id === active.id);
      const newIndex = models.findIndex((m) => m.id === over.id);

      const reorderedModels = arrayMove(models, oldIndex, newIndex);
      const modelIds = reorderedModels.map((m) => m.id);

      await reorderModels(modelIds);
    }
  };

  // Handle new model
  const handleNewModel = () => {
    setEditingModel(null);
    setIsEditorOpen(true);
  };

  // Handle edit model
  const handleEditModel = (model: Model) => {
    setEditingModel(model);
    setIsEditorOpen(true);
    selectModel(model.id);
  };

  // Handle open tour editor
  const handleOpenTourEditor = (model: Model) => {
    setTourModel(model);
    setIsTourEditorOpen(true);
    selectModel(model.id);
  };

  // Handle delete model
  const handleDeleteModel = async (modelId: string) => {
    // Check if model is referenced by any units across all floors
    const referencingUnits: Array<{ floor: string; unit: string }> = [];

    for (const floor of floors) {
      for (const unit of floor.units) {
        if (unit.modelId === modelId) {
          referencingUnits.push({
            floor: `${floor.name} (Floor ${floor.floorNumber})`,
            unit: unit.unitNumber,
          });
        }
      }
    }

    if (referencingUnits.length > 0) {
      const unitList = referencingUnits
        .slice(0, 5)
        .map((ref) => `• ${ref.unit} on ${ref.floor}`)
        .join("\n");

      const moreUnits =
        referencingUnits.length > 5
          ? `\n...and ${referencingUnits.length - 5} more units`
          : "";

      const confirmed = window.confirm(
        `⚠️ This model is referenced by ${referencingUnits.length} unit(s):\n\n${unitList}${moreUnits}\n\n` +
          `Deleting this model will break these unit references. Are you sure you want to continue?`
      );

      if (!confirmed) {
        setDeleteConfirmId(null);
        return;
      }
    }

    await deleteModel(modelId);
    setDeleteConfirmId(null);
  };

  // Handle close editor
  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setEditingModel(null);
  };

  return (
    <AdminLayout>
      <div className="h-full flex flex-col ml-64">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Apartment Models
              </h1>
              <p className="text-gray-600 mt-1">
                Manage model types with images and 360° rotations
              </p>
            </div>

            <button
              onClick={handleNewModel}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Model
            </button>

            <ExportMenu projectId="default" />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {models.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <Home className="w-16 h-16 mb-4" />
              <p className="text-lg mb-2">No models yet</p>
              <p className="text-sm">
                Click "Add Model" to create your first apartment model
              </p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={models.map((m) => m.id)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {models.map((model) => (
                    <SortableModelCard
                      key={model.id}
                      model={model}
                      isSelected={selectedModelId === model.id}
                      onEdit={handleEditModel}
                      onDelete={() => setDeleteConfirmId(model.id)}
                      onTour={handleOpenTourEditor}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* Model Editor Panel */}
      <PropertiesPanel
        title={editingModel ? "Edit Model" : "New Model"}
        isOpen={isEditorOpen}
        onClose={handleCloseEditor}
        width="w-[600px]"
      >
        <ModelEditor model={editingModel} onClose={handleCloseEditor} />
      </PropertiesPanel>

      {/* Virtual Tour Editor */}
      {isTourEditorOpen && tourModel && (
        <TourSceneEditor
          modelId={tourModel.id}
          projectId="default" // TODO: Get from project store
          onClose={() => {
            setIsTourEditorOpen(false);
            setTourModel(null);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Delete Model?
            </h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this model? This action cannot be
              undone.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteModel(deleteConfirmId)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

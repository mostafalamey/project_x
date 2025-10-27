/**
 * Admin Dashboard - Entry Point
 * Main navigation hub for the admin configuration dashboard
 */

import { useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Settings,
  Building2,
  Map,
  Layers,
  Home,
  Layout,
  Video,
} from "lucide-react";
import { ProjectExportButton, ImportButton } from "../components/export";
import { useProjectStore } from "../stores/projectStore";

// ============================================================================
// Component
// ============================================================================

export default function AdminDashboard() {
  const { config, createProject, loadProject } = useProjectStore();

  // Initialize default project on mount if none exists
  useEffect(() => {
    const initializeProject = async () => {
      if (!config) {
        try {
          // Try to load from localStorage or create new
          const savedProjectId = localStorage.getItem("currentProjectId");

          if (savedProjectId) {
            // Try to load saved project
            try {
              await loadProject(savedProjectId);
            } catch (error) {
              console.error("Failed to load saved project, creating new one");
              await createDefaultProject();
            }
          } else {
            // Create a new default project
            await createDefaultProject();
          }
        } catch (error) {
          console.error("Failed to initialize project:", error);
        }
      }
    };

    const createDefaultProject = async () => {
      const newProject = await createProject({
        name: "My Real Estate Project",
        slug: "my-project",
        developer: {
          name: "Developer Name",
          contact: {},
        },
        metadata: {},
      });

      // Save project ID to localStorage
      localStorage.setItem("currentProjectId", newProject.id);
    };

    initializeProject();
  }, [config, createProject, loadProject]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-gray-900">
              Admin Dashboard
            </h1>
            <div className="flex items-center gap-3">
              <ImportButton />
              <ProjectExportButton />
            </div>
          </div>
          <p className="text-lg text-gray-600">
            Configure your real estate project - models, maps, floor plans, and
            virtual tours
          </p>
        </div>

        {/* Navigation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Project Settings */}
          <NavCard
            to="/admin/project"
            icon={<Settings className="w-8 h-8" />}
            title="Project Settings"
            description="Configure project details, developer info, and metadata"
            color="blue"
          />

          {/* Models */}
          <NavCard
            to="/admin/models"
            icon={<Home className="w-8 h-8" />}
            title="Apartment Models"
            description="Manage apartment types with 360° rotations and specs"
            color="green"
          />

          {/* Interactive Map */}
          <NavCard
            to="/admin/map"
            icon={<Map className="w-8 h-8" />}
            title="Interactive Map"
            description="Draw landmarks and paths on site location map"
            color="purple"
          />

          {/* Master Plan */}
          <NavCard
            to="/admin/masterplan"
            icon={<Layers className="w-8 h-8" />}
            title="Master Plan"
            description="Configure 360° master plan with building hotspots"
            color="orange"
          />

          {/* Buildings & Floors */}
          <NavCard
            to="/admin/buildings"
            icon={<Building2 className="w-8 h-8" />}
            title="Buildings & Floors"
            description="Manage building structures and add floor"
            color="red"
          />

          {/* Floor Plans */}
          <NavCard
            to="/admin/floors"
            icon={<Layout className="w-8 h-8" />}
            title="Floor Plans"
            description="Draw unit hotspots on floor plan images"
            color="teal"
          />

          {/* Virtual Tours */}
          <NavCard
            to="/admin/tours"
            icon={<Video className="w-8 h-8" />}
            title="Virtual Tours"
            description="Create 360° panorama tours with hotspot navigation"
            color="indigo"
          />
        </div>

        {/* Back to Viewer */}
        <div className="mt-12 text-center">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <Home className="w-5 h-5" />
            <span>Back to Viewer</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Navigation Card Component
// ============================================================================

interface NavCardProps {
  to: string;
  icon: React.ReactNode;
  title: string;
  description: string;
  color: "blue" | "green" | "purple" | "orange" | "red" | "teal" | "indigo";
}

function NavCard({ to, icon, title, description, color }: NavCardProps) {
  const colorClasses = {
    blue: "bg-blue-500 text-white",
    green: "bg-green-500 text-white",
    purple: "bg-purple-500 text-white",
    orange: "bg-orange-500 text-white",
    red: "bg-red-500 text-white",
    teal: "bg-teal-500 text-white",
    indigo: "bg-indigo-500 text-white",
  };

  return (
    <Link
      to={to}
      className="block group bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-200 overflow-hidden"
    >
      {/* Icon Header */}
      <div
        className={`p-6 ${colorClasses[color]} group-hover:brightness-110 transition-all`}
      >
        <div className="flex items-center justify-center">{icon}</div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-gray-700 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}

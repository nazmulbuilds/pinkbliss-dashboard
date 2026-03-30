"use client";

import * as React from "react";
import NextImage from "next/image";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import {
  Save,
  RotateCcw,
  Download,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  XCircle,
  Plus,
  LayoutGrid,
  Layers,
  Grid3X3,
  Image,
  Ticket,
  Compass,
  Heart,
  Sparkles,
  Flame,
  Award,
  Percent,
  Focus,
  TrendingUp,
  Star,
  Crown,
  Megaphone,
  Palette,
  BadgePercent,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/toast";
import { SortableSection } from "./sortable-section";
import type { Section, SectionConfig, SectionType } from "@/lib/types/sections";
import { SECTION_TYPE_LABELS } from "@/lib/types/sections";
import { createSectionFromTemplate } from "@/lib/data/section-templates";
import { getToken } from "@/lib/auth";
import { cn } from "@/lib/utils";

interface SectionManagerProps {
  initialConfig: SectionConfig;
  apiEndpoint?: string;
  fasterCheckout?: boolean;
  onSave?: (config: SectionConfig) => void;
}

type SaveStatus = "idle" | "saving" | "success" | "error";
type ViewMode = "templates" | "active";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// Icon mapping for section types
const SECTION_ICONS: Record<SectionType, React.ElementType> = {
  featured_categories: Grid3X3,
  featured_section: Image,
  promo_code_banner: Ticket,
  explore_top_brands: Compass,
  loyalty_deals: Heart,
  new_arrivals: Sparkles,
  hot_list: Flame,
  featured_brands: Award,
  special_discount: Percent,
  focus_on: Focus,
  best_seller_brands: TrendingUp,
  luxury_lineup: Crown,
  ads_banner: Megaphone,
  k_studio: Palette,
  sale_update: BadgePercent,
};

// Preview image mapping for section types
const SECTION_PREVIEW_IMAGES: Record<SectionType, string> = {
  featured_categories: "/assets/images/featured_categories.png",
  featured_section: "/assets/images/featured_section.png",
  promo_code_banner: "/assets/images/promo_code_banner.png",
  explore_top_brands: "/assets/images/explore_top_brands.png",
  loyalty_deals: "/assets/images/loyalty_deals.png",
  new_arrivals: "/assets/images/new_arrivals.png",
  hot_list: "/assets/images/hot_list.png",
  featured_brands: "/assets/images/featured_brands.png",
  special_discount: "/assets/images/special_discount.png",
  focus_on: "/assets/images/focus_on.png",
  best_seller_brands: "/assets/images/best_seller_brands.png",
  luxury_lineup: "/assets/images/luxury_lineup.png",
  ads_banner: "/assets/images/ads_banner.png",
  k_studio: "/assets/images/k_studio.png",
  sale_update: "/assets/images/sale_update.png",
};

// All available section types
const ALL_SECTION_TYPES: SectionType[] = [
  "featured_categories",
  "featured_section",
  "promo_code_banner",
  "explore_top_brands",
  "loyalty_deals",
  "new_arrivals",
  "hot_list",
  "featured_brands",
  "special_discount",
  "focus_on",
  "best_seller_brands",
  "luxury_lineup",
  "ads_banner",
  "k_studio",
  "sale_update",
];

export function SectionManager({
  initialConfig,
  apiEndpoint = "/api/sections",
  fasterCheckout = false,
  onSave,
}: SectionManagerProps) {
  const [sections, setSections] = React.useState<Section[]>(
    [...initialConfig.sections].sort((a, b) => a.order - b.order)
  );
  const [hasChanges, setHasChanges] = React.useState(false);
  const [saveStatus, setSaveStatus] = React.useState<SaveStatus>("idle");
  const [errorMessage, setErrorMessage] = React.useState<string>("");
  const [viewMode, setViewMode] = React.useState<ViewMode>("active");
  const { addToast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const reordered = arrayMove(items, oldIndex, newIndex);
        // Update order values
        return reordered.map((item, index) => ({
          ...item,
          order: index + 1,
        }));
      });
      setHasChanges(true);
    }
  };

  const handleToggle = (sectionId: string, enabled: boolean) => {
    setSections((items) =>
      items.map((item) => (item.id === sectionId ? { ...item, enabled } : item))
    );
    setHasChanges(true);
  };

  const handleUpdate = (sectionId: string, settings: Section["settings"]) => {
    setSections((items) =>
      items.map((item) =>
        item.id === sectionId ? { ...item, settings } : item
      )
    );
    setHasChanges(true);
  };

  const handleAddTemplate = (type: SectionType) => {
    const newSection = createSectionFromTemplate(type, sections.length + 1);
    setSections((prev) => [...prev, newSection]);
    setHasChanges(true);
    setViewMode("active");
    addToast({
      title: "Section Added",
      description: `${SECTION_TYPE_LABELS[type]} has been added`,
      variant: "success",
      duration: 2000,
    });
  };

  const handleRemoveSection = (sectionId: string) => {
    setSections((items) => {
      const filtered = items.filter((item) => item.id !== sectionId);
      // Recalculate order values
      return filtered.map((item, index) => ({
        ...item,
        order: index + 1,
      }));
    });
    setHasChanges(true);
  };

  const handleDuplicate = (sectionId: string) => {
    setSections((items) => {
      const sectionIndex = items.findIndex((item) => item.id === sectionId);
      if (sectionIndex === -1) return items;

      const originalSection = items[sectionIndex];

      // Create a deep copy of the section
      const duplicatedSection: Section = {
        ...originalSection,
        id: `${originalSection.id}_copy_${Date.now()}`,
        order: originalSection.order + 1,
        enabled: true,
        settings: JSON.parse(JSON.stringify(originalSection.settings)),
      };

      // Insert the duplicated section right after the original
      const newSections = [...items];
      newSections.splice(sectionIndex + 1, 0, duplicatedSection);

      // Recalculate order values for all sections
      return newSections.map((item, index) => ({
        ...item,
        order: index + 1,
      }));
    });
    setHasChanges(true);
  };

  const handleSave = async () => {
    const payload = { sections: [...sections], fasterCheckout };

    setSaveStatus("saving");
    setErrorMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/home-sections-v2`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.message || `Failed to save (${response.status})`
        );
      }

      setSaveStatus("success");
      setHasChanges(false);
      onSave?.({ sections });

      addToast({
        title: "Success!",
        description: "Configuration saved successfully",
        variant: "success",
        duration: 3000,
      });

      setTimeout(() => setSaveStatus("idle"), 3000);
    } catch (error) {
      setSaveStatus("error");
      const errorMsg =
        error instanceof Error ? error.message : "Failed to save configuration";
      setErrorMessage(errorMsg);

      addToast({
        title: "Error",
        description: errorMsg,
        variant: "error",
        duration: 5000,
      });

      setTimeout(() => {
        setSaveStatus("idle");
        setErrorMessage("");
      }, 5000);
    }
  };

  const handleReset = () => {
    setSections([...initialConfig.sections].sort((a, b) => a.order - b.order));
    setHasChanges(false);
  };

  const handleExport = () => {
    const config: SectionConfig = { sections };
    const blob = new Blob([JSON.stringify(config, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sections-config.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleAllSections = (enabled: boolean) => {
    setSections((items) => items.map((item) => ({ ...item, enabled })));
    setHasChanges(true);
  };

  const enabledCount = sections.filter((s) => s.enabled).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Section Manager
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sections.length === 0
              ? "Add sections from templates to get started"
              : `${enabledCount} of ${sections.length} sections enabled`}
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-2 p-1 bg-muted rounded-xl">
          <button
            type="button"
            onClick={() => setViewMode("templates")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
              viewMode === "templates"
                ? "bg-white dark:bg-gray-800 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground  "
            )}
          >
            <LayoutGrid className="h-4 w-4" />
            Templates
          </button>
          <button
            type="button"
            onClick={() => setViewMode("active")}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
              viewMode === "active"
                ? "bg-white dark:bg-gray-800 text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Layers className="h-4 w-4" />
            Active ({sections.length})
          </button>
        </div>
      </div>

      {/* Templates View */}
      {viewMode === "templates" && (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Click on a template to add it to your active sections. Hover to
            preview.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {ALL_SECTION_TYPES.map((type) => {
              const Icon = SECTION_ICONS[type];
              const label = SECTION_TYPE_LABELS[type];
              const previewImage = SECTION_PREVIEW_IMAGES[type];
              return (
                <div key={type} className="group/template relative">
                  <button
                    type="button"
                    onClick={() => handleAddTemplate(type)}
                    className={cn(
                      "w-full relative flex flex-col items-center gap-3 p-4 rounded-2xl border-2 border-dashed",
                      "bg-card hover:bg-accent/50 hover:border-primary/50",
                      "transition-all duration-200",
                      "focus:outline-none focus:ring-2 focus:ring-primary/20"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-xl",
                        "bg-gradient-to-br from-primary/10 to-primary/5 text-primary",
                        "group-hover/template:from-primary/20 group-hover/template:to-primary/10",
                        "transition-colors duration-200"
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-sm font-medium text-center">
                      {label}
                    </span>
                    {/* Preview indicator icon */}
                    <div
                      className={cn(
                        "absolute top-2 left-2 flex h-6 w-6 items-center justify-center rounded-full",
                        "bg-blue-500/10 text-blue-500 opacity-0 group-hover/template:opacity-100",
                        "transition-opacity duration-200"
                      )}
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </div>
                    {/* Add icon */}
                    <div
                      className={cn(
                        "absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full",
                        "bg-primary/10 text-primary opacity-0 group-hover/template:opacity-100",
                        "transition-opacity duration-200"
                      )}
                    >
                      <Plus className="h-4 w-4" />
                    </div>
                  </button>
                  {/* Preview Image Tooltip */}
                  <div
                    className={cn(
                      "absolute left-1/2 -translate-x-1/2 bottom-full mb-3 z-50",
                      "w-64 rounded-xl overflow-hidden shadow-2xl border bg-card",
                      "opacity-0 invisible scale-95 group-hover/template:opacity-100 group-hover/template:visible group-hover/template:scale-100",
                      "transition-all duration-200 pointer-events-none"
                    )}
                  >
                    <div className="relative aspect-[16/9] w-full bg-muted">
                      <NextImage
                        src={previewImage}
                        alt={`${label} preview`}
                        fill
                        className="object-contain object-center"
                        sizes="256px"
                      />
                    </div>
                    <div className="p-2 text-center border-t bg-muted/50">
                      <span className="text-xs font-medium text-muted-foreground">
                        {label}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Sections View */}
      {viewMode === "active" && (
        <>
          {sections.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed rounded-2xl bg-muted/30">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-muted mb-4">
                <Layers className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-1">
                No sections yet
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Add sections from templates to build your page layout
              </p>
              <Button
                type="button"
                onClick={() => setViewMode("templates")}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Add from Templates
              </Button>
            </div>
          ) : (
            <>
              {/* Quick Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <Button
                className="cursor-pointer"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setViewMode("templates")}
                >
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Section
                </Button>
                <Button
                className="cursor-pointer"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllSections(true)}
                >
                  <Eye className="h-4 w-4 mr-1.5" />
                  Show All
                </Button>
                <Button
                className="cursor-pointer"
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => toggleAllSections(false)}
                >
                  <EyeOff className="h-4 w-4 mr-1.5" />
                  Hide All
                </Button>
              </div>

              {/* Section List */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sections.map((s) => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3">
                    {sections.map((section) => (
                      <SortableSection
                        key={section.id}
                        section={section}
                        onToggle={(enabled) =>
                          handleToggle(section.id, enabled)
                        }
                        onUpdate={(settings) =>
                          handleUpdate(section.id, settings)
                        }
                        onDuplicate={() => handleDuplicate(section.id)}
                        onRemove={() => handleRemoveSection(section.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </>
          )}
        </>
      )}

      {/* Footer Actions */}
      <div className="sticky bottom-0 -mx-4 -mb-4 border-t bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 px-4 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* <Button type="button" variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-1.5" />
              Export
            </Button> */}
          </div>
          <div className="flex items-center gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className={!hasChanges ? "cursor-not-allowed" : "cursor-pointer"}
                  disabled={!hasChanges}
                >
                  <RotateCcw className="h-4 w-4 mr-1.5" />
                  Reset
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Reset Changes?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will discard all unsaved changes and revert to the initial configuration.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="cursor-pointer">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleReset} className="cursor-pointer">
                    Continue  
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || saveStatus === "saving"}
              className={
                saveStatus === "success"
                  ? "bg-emerald-600 hover:bg-emerald-600 cursor-not-allowed"
                  : saveStatus === "error"
                  ? "bg-destructive hover:bg-destructive cursor-not-allowed"
                  : "cursor-pointer"
              }
            >
              {saveStatus === "saving" ? (
                <>
                  <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                  Saving...
                </>
              ) : saveStatus === "success" ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                  Saved!
                </>
              ) : saveStatus === "error" ? (
                <>
                  <XCircle className="h-4 w-4 mr-1.5" />
                  Failed
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-1.5" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
        {hasChanges && saveStatus === "idle" && (
          <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
            You have unsaved changes
          </p>
        )}
        {saveStatus === "success" && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-2">
            Configuration saved successfully!
          </p>
        )}
        {saveStatus === "error" && errorMessage && (
          <p className="text-xs text-destructive mt-2">{errorMessage}</p>
        )}
      </div>
    </div>
  );
}

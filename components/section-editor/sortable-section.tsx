"use client";

import * as React from "react";
import NextImage from "next/image";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
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
  Settings2,
  ChevronDown,
  Copy,
  Pencil,
  Check,
  X,
  Trash2,
  Eye,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SectionSettingsEditor } from "./section-settings-editor";
import type { Section, SectionType } from "@/lib/types/sections";
import { SECTION_TYPE_LABELS } from "@/lib/types/sections";

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

interface SortableSectionProps {
  section: Section;
  onToggle: (enabled: boolean) => void;
  onUpdate: (settings: Section["settings"]) => void;
  onDuplicate: () => void;
  onRemove?: () => void;
}

export function SortableSection({
  section,
  onToggle,
  onUpdate,
  onDuplicate,
  onRemove,
}: SortableSectionProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isEditingTitle, setIsEditingTitle] = React.useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const Icon = SECTION_ICONS[section.type] || Settings2;
  const defaultLabel = SECTION_TYPE_LABELS[section.type] || section.type;
  const previewImage = SECTION_PREVIEW_IMAGES[section.type];

  // Get title from settings.title
  const settings = section.settings as Record<string, unknown>;
  const settingsTitle = settings.title as string | undefined;
  const displayTitle = settingsTitle || defaultLabel;
  const [titleValue, setTitleValue] = React.useState(settingsTitle || "");

  const handleTitleSave = () => {
    const newTitle = titleValue.trim() || defaultLabel;
    // Update settings.title
    onUpdate({
      ...settings,
      title: newTitle,
    } as Section["settings"]);
    setIsEditingTitle(false);
  };

  const handleTitleCancel = () => {
    setTitleValue(settingsTitle || "");
    setIsEditingTitle(false);
  };

  React.useEffect(() => {
    setTitleValue(settingsTitle || "");
  }, [settingsTitle]);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-2xl border bg-card text-card-foreground transition-all duration-200",
        isDragging && "shadow-2xl ring-2 ring-primary/20 z-50 opacity-95",
        !section.enabled && "opacity-60",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        {/* Drag Handle */}
        <button
          type="button"
          className={cn(
            "flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-xl",
            "bg-muted/50 text-muted-foreground transition-colors",
            "hover:bg-muted hover:text-foreground",
            "active:cursor-grabbing",
            isDragging && "cursor-grabbing bg-primary/10 text-primary",
          )}
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Icon and Label */}
        <div className="flex flex-1 items-center gap-3 min-w-0">
          {/* Icon with preview on hover */}
          <div className="group/preview relative shrink-0">
            <div
              className={cn(
                "flex h-10 w-10 items-center justify-center rounded-xl cursor-pointer",
                "bg-gradient-to-br from-primary/10 to-primary/5 text-primary",
                "group-hover/preview:from-primary/20 group-hover/preview:to-primary/10",
                "transition-colors duration-200",
              )}
            >
              <Icon className="h-5 w-5 group-hover/preview:opacity-0 transition-opacity duration-200" />
              <Eye className="h-4 w-4 absolute opacity-0 group-hover/preview:opacity-100 transition-opacity duration-200 text-blue-500" />
            </div>
            {/* Preview Image Tooltip */}
            {previewImage && (
              <div
                className={cn(
                  "absolute left-0 top-full mt-2 z-50",
                  "w-56 rounded-xl overflow-hidden shadow-2xl border bg-card",
                  "opacity-0 invisible scale-95 group-hover/preview:opacity-100 group-hover/preview:visible group-hover/preview:scale-100",
                  "transition-all duration-200 pointer-events-none",
                )}
              >
                <div className="relative aspect-video w-full bg-muted">
                  <NextImage
                    src={previewImage}
                    alt={`${defaultLabel} preview`}
                    fill
                    className="object-contain object-center"
                    sizes="224px"
                  />
                </div>
                <div className="p-2 text-center border-t bg-muted/50">
                  <span className="text-xs font-medium text-muted-foreground">
                    {defaultLabel}
                  </span>
                </div>
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            {isEditingTitle ? (
              <div className="flex items-center gap-1">
                <Input
                  value={titleValue}
                  onChange={(e) => setTitleValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleTitleSave();
                    } else if (e.key === "Escape") {
                      handleTitleCancel();
                    }
                  }}
                  className="h-7 text-sm font-medium"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleTitleSave}
                  className="text-emerald-600 hover:text-emerald-700"
                >
                  <Check className="h-3 w-3" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleTitleCancel}
                  className="text-destructive hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group/title">
                <h3 className="font-medium text-sm truncate">{displayTitle}</h3>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsEditingTitle(true);
                  }}
                  className="opacity-0 group-hover/title:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                  title="Edit title"
                >
                  <Pencil className="h-3 w-3" />
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground truncate">
              Type: <span className="font-medium">{section.type}</span> • Order:{" "}
              {section.order} • {section.enabled ? "Visible" : "Hidden"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onDuplicate}
            className="text-muted-foreground hover:text-foreground"
            title="Duplicate section"
          >
            <Copy className="h-4 w-4" />
          </Button>
          {onRemove && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onRemove}
              className="text-muted-foreground hover:text-destructive"
              title="Remove section"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
          <Switch checked={section.enabled} onCheckedChange={onToggle} />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsExpanded(!isExpanded)}
            className={cn(
              "transition-transform duration-200",
              isExpanded && "bg-muted",
            )}
          >
            <ChevronDown
              className={cn(
                "h-4 w-4 transition-transform duration-200",
                isExpanded && "rotate-180",
              )}
            />
          </Button>
        </div>
      </div>

      {/* Expandable Content */}
      {isExpanded && (
        <div className="border-t bg-muted/20 p-4">
          <SectionSettingsEditor section={section} onUpdate={onUpdate} />
        </div>
      )}
    </div>
  );
}

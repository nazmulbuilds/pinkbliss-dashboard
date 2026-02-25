"use client";

import * as React from "react";
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
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, ImageIcon, Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "@/components/ui/combobox";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import type {
  Section,
  BannerItem,
  BannerWithDiscount,
  NewArrivalItem,
  LuxuryBrand,
  KBeautyBrand,
  ImageNavigationData,
} from "@/lib/types/sections";

interface SectionSettingsEditorProps {
  section: Section;
  onUpdate: (settings: Section["settings"]) => void;
}

// Filter/sort options. Use __none__ as sentinel for "clear selection" (stored as "").
const FILTER_SORT_OPTIONS = [
  { label: "No filter", value: "__none__" },
  { label: "Sort by Popularity", value: "popularity" },
  { label: "Sort by Average rating", value: "rating" },
  { label: "Sort by latest", value: "date" },
  { label: "Sort by price: low to high", value: "price" },
] as const;

// Flattened category for combobox (id + name)
interface CategoryOption {
  id: number;
  name: string;
}

function flattenCategories(
  categories: { id: number; name: string; subCategories?: unknown[] }[],
  out: CategoryOption[] = [],
): CategoryOption[] {
  for (const c of categories) {
    out.push({ id: c.id, name: c.name });
    if (Array.isArray(c.subCategories) && c.subCategories.length > 0) {
      flattenCategories(
        c.subCategories as {
          id: number;
          name: string;
          subCategories?: unknown[];
        }[],
        out,
      );
    }
  }
  return out;
}

async function fetchCategories(): Promise<CategoryOption[]> {
  const res = await fetch("/api/categories");
  if (!res.ok) throw new Error("Failed to fetch categories");
  const data: { id: number; name: string; subCategories?: unknown[] }[] =
    await res.json();
  return flattenCategories(data);
}

function CategoryCombobox({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
}) {
  const { data: options = [], isLoading } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const selectedOption =
    value === "" ? null : options.find((o) => String(o.id) === value) ?? null;

  const handleValueChange = React.useCallback(
    (option: CategoryOption | null) => {
      onChange(option ? String(option.id) : "");
    },
    [onChange],
  );

  return (
    <Combobox
      items={options}
      value={selectedOption}
      onValueChange={handleValueChange}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => String(item.id)}
      isItemEqualToValue={(item, val) =>
        item.id ===
        (val && typeof val === "object" && "id" in val
          ? (val as CategoryOption).id
          : Number(val))
      }
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={isLoading ? "Loading…" : "Search or select category"}
        className="h-8 text-xs w-full"
        showClear={!!value}
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {isLoading ? "Loading categories…" : "No category found."}
        </ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id} value={item}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// Brand option for combobox (id + name)
interface BrandOption {
  id: number;
  name: string;
}

async function fetchBrands(): Promise<BrandOption[]> {
  const res = await fetch("/api/brands");
  if (!res.ok) throw new Error("Failed to fetch brands");
  const data: { terms: { id: number; name: string }[] } = await res.json();
  return (data.terms ?? []).map((t) => ({ id: t.id, name: t.name }));
}

function BrandCombobox({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (brandId: string) => void;
  disabled?: boolean;
}) {
  const { data: options = [], isLoading } = useQuery({
    queryKey: ["brands"],
    queryFn: fetchBrands,
  });

  const selectedOption =
    value === "" ? null : options.find((o) => String(o.id) === value) ?? null;

  const handleValueChange = React.useCallback(
    (option: BrandOption | null) => {
      onChange(option ? String(option.id) : "");
    },
    [onChange],
  );

  return (
    <Combobox
      items={options}
      value={selectedOption}
      onValueChange={handleValueChange}
      itemToStringLabel={(item) => item.name}
      itemToStringValue={(item) => String(item.id)}
      isItemEqualToValue={(item, val) =>
        item.id ===
        (val && typeof val === "object" && "id" in val
          ? (val as BrandOption).id
          : Number(val))
      }
      disabled={disabled}
    >
      <ComboboxInput
        placeholder={isLoading ? "Loading…" : "Search or select brand"}
        className="h-8 text-xs w-full"
        showClear={!!value}
      />
      <ComboboxContent>
        <ComboboxEmpty>
          {isLoading ? "Loading brands…" : "No brand found."}
        </ComboboxEmpty>
        <ComboboxList>
          {(item) => (
            <ComboboxItem key={item.id} value={item}>
              {item.name}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}

// Sortable Image Input Component
function SortableImageInput({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-center gap-2", isDragging && "opacity-50 z-50")}
    >
      <button
        type="button"
        className={cn(
          "flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg",
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
      <div className="relative flex-1">
        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="pl-9"
        />
      </div>
    </div>
  );
}

function NavigationFields({
  data,
  onChange,
}: {
  data: ImageNavigationData;
  onChange: (updates: Partial<ImageNavigationData>) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 mt-2 border-t pt-3 border-border/50">
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Name</Label>
        <Input
          value={data.name || ""}
          onChange={(e) => onChange({ name: e.target.value })}
          placeholder="Display Name"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Category</Label>
        <CategoryCombobox
          value={data.category || ""}
          onChange={(id) => onChange({ category: id })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Brand</Label>
        <BrandCombobox
          value={data.brand?.toString() || ""}
          onChange={(id) => onChange({ brand: id })}
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Filter</Label>
        <Select
          value={
            data.filter !== undefined && data.filter !== ""
              ? data.filter
              : "__none__"
          }
          onValueChange={(value) =>
            onChange({ filter: value === "__none__" ? "" : value })
          }
        >
          <SelectTrigger size="sm" className="h-8 text-xs w-full">
            <SelectValue placeholder="Select sort order" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {FILTER_SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Search Query</Label>
        <Input
          value={data.searchQuery || ""}
          onChange={(e) => onChange({ searchQuery: e.target.value })}
          placeholder="e.g. sale"
          className="h-8 text-xs"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs text-muted-foreground">Product ID</Label>
        <Input
          value={data.productId || ""}
          onChange={(e) => onChange({ productId: e.target.value })}
          placeholder="e.g. 123"
          className="h-8 text-xs"
        />
      </div>
    </div>
  );
}

// Sortable Banner Item Component
function SortableBannerItem({
  id,
  banner,
  index,
  onChange,
}: {
  id: string;
  banner: BannerItem;
  index: number;
  onChange: (banner: BannerItem) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-2 p-3 border rounded-xl bg-muted/20",
        isDragging && "opacity-50 z-50 bg-muted",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={cn(
            "flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg",
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
        <div className="relative flex-1">
          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={banner.image}
            onChange={(e) => onChange({ ...banner, image: e.target.value })}
            placeholder={`Banner ${index + 1} image URL`}
            className="pl-9"
          />
        </div>
      </div>
      <NavigationFields
        data={banner}
        onChange={(updates) => onChange({ ...banner, ...updates })}
      />
    </div>
  );
}

// Sortable Brand String Component with Remove
function SortableBrandStringWithRemove({
  id,
  value,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  id: string;
  value: string;
  index: number;
  onChange: (value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn("flex items-center gap-2", isDragging && "opacity-50 z-50")}
    >
      <button
        type="button"
        className={cn(
          "flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg",
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
      <div className="relative flex-1">
        <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`Brand ${index + 1} image URL`}
          className="pl-9"
        />
      </div>
      {canRemove && (
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onRemove}
          className="text-destructive hover:text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// Image input component for banner images
function ImageInput({
  value,
  onChange,
  placeholder = "Enter image URL",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative">
      <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}

// Section for title/subtitle fields
function TitleSubtitleFields({
  title,
  subtitle,
  onTitleChange,
  onSubtitleChange,
  showSubtitle = true,
}: {
  title?: string;
  subtitle?: string;
  onTitleChange: (value: string) => void;
  onSubtitleChange?: (value: string) => void;
  showSubtitle?: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={title || ""}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter title"
        />
      </div>
      {showSubtitle && onSubtitleChange && (
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Input
            value={subtitle || ""}
            onChange={(e) => onSubtitleChange(e.target.value)}
            placeholder="Enter subtitle"
          />
        </div>
      )}
    </div>
  );
}

// Sortable Banner Item with Remove Button
function SortableBannerItemWithRemove({
  id,
  banner,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  id: string;
  banner: BannerItem;
  index: number;
  onChange: (banner: BannerItem) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex flex-col gap-2 p-3 border rounded-xl bg-muted/20",
        isDragging && "opacity-50 z-50 bg-muted",
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          className={cn(
            "flex h-9 w-9 shrink-0 cursor-grab items-center justify-center rounded-lg",
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
        <div className="relative flex-1">
          <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={banner.image}
            onChange={(e) => onChange({ ...banner, image: e.target.value })}
            placeholder={`Banner ${index + 1} image URL`}
            className="pl-9"
          />
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <NavigationFields
        data={banner}
        onChange={(updates) => onChange({ ...banner, ...updates })}
      />
    </div>
  );
}

// Banners list editor (reorderable with add/remove)
function BannersEditor({
  banners,
  onChange,
  label = "Banners",
  minItems,
  maxItems,
}: {
  banners: BannerItem[];
  onChange: (banners: BannerItem[]) => void;
  label?: string;
  minItems?: number;
  maxItems?: number;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((_, i) => `banner-${i}` === active.id);
      const newIndex = banners.findIndex((_, i) => `banner-${i}` === over.id);
      onChange(arrayMove(banners, oldIndex, newIndex));
    }
  };

  const canAdd = maxItems === undefined || banners.length < maxItems;
  const canRemove = minItems === undefined || banners.length > minItems;

  const addBanner = () => {
    if (canAdd) {
      onChange([...banners, { image: "" }]);
    }
  };

  const removeBanner = (index: number) => {
    if (canRemove) {
      onChange(banners.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {maxItems && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({banners.length}/{maxItems})
            </span>
          )}
        </Label>
        {canAdd && (
          <Button
            type="button"
            className="cursor-pointer"
            variant="outline"
            size="sm"
            onClick={addBanner}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={banners.map((_, i) => `banner-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {banners.map((banner, index) => (
              <SortableBannerItemWithRemove
                key={`banner-${index}`}
                id={`banner-${index}`}
                banner={banner}
                index={index}
                onChange={(updated) => {
                  const newBanners = [...banners];
                  newBanners[index] = updated;
                  onChange(newBanners);
                }}
                onRemove={() => removeBanner(index)}
                canRemove={canRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// String brands list editor (reorderable with add/remove)
function BrandsEditor({
  brands,
  onChange,
  label = "Brand Images",
  minItems = 1,
  maxItems,
}: {
  brands: string[];
  onChange: (brands: string[]) => void;
  label?: string;
  minItems?: number;
  maxItems?: number;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = brands.findIndex((_, i) => `brand-${i}` === active.id);
      const newIndex = brands.findIndex((_, i) => `brand-${i}` === over.id);
      onChange(arrayMove(brands, oldIndex, newIndex));
    }
  };

  const canAdd = maxItems === undefined || brands.length < maxItems;
  const canRemove = brands.length > minItems;

  const addBrand = () => {
    if (canAdd) {
      onChange([...brands, ""]);
    }
  };

  const removeBrand = (index: number) => {
    if (canRemove) {
      onChange(brands.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          {label}
          {maxItems && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({brands.length}/{maxItems})
            </span>
          )}
        </Label>
        {canAdd && (
          <Button type="button" variant="outline" size="sm" onClick={addBrand}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={brands.map((_, i) => `brand-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">
            {brands.map((brand, index) => (
              <SortableBrandStringWithRemove
                key={`brand-${index}`}
                id={`brand-${index}`}
                value={brand}
                index={index}
                onChange={(value) => {
                  const newBrands = [...brands];
                  newBrands[index] = value;
                  onChange(newBrands);
                }}
                onRemove={() => removeBrand(index)}
                canRemove={canRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// Sortable Discount Banner Item
function SortableDiscountBannerItem({
  id,
  banner,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  id: string;
  banner: BannerWithDiscount;
  index: number;
  onChange: (banner: BannerWithDiscount) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 border rounded-xl space-y-3 bg-muted/30",
        isDragging && "opacity-50 z-50",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              "flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg",
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
          <span className="text-sm font-medium">Banner {index + 1}</span>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <ImageInput
        value={banner.image}
        onChange={(value) => onChange({ ...banner, image: value })}
        placeholder="Image URL"
      />
      <div className="space-y-2">
        <Label>Discount %</Label>
        <Input
          type="number"
          min={0}
          max={100}
          value={banner.discount}
          onChange={(e) =>
            onChange({ ...banner, discount: parseInt(e.target.value) || 0 })
          }
          placeholder="Discount percentage"
        />
      </div>
      <NavigationFields
        data={banner}
        onChange={(updates) => onChange({ ...banner, ...updates })}
      />
    </div>
  );
}

// Discount banners editor (reorderable with add/remove)
function DiscountBannersEditor({
  banners,
  onChange,
  minItems,
  maxItems,
}: {
  banners: BannerWithDiscount[];
  onChange: (banners: BannerWithDiscount[]) => void;
  minItems?: number;
  maxItems?: number;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex(
        (_, i) => `discount-banner-${i}` === active.id,
      );
      const newIndex = banners.findIndex(
        (_, i) => `discount-banner-${i}` === over.id,
      );
      onChange(arrayMove(banners, oldIndex, newIndex));
    }
  };

  const canAdd = maxItems === undefined || banners.length < maxItems;
  const canRemove = minItems === undefined || banners.length > minItems;

  const addBanner = () => {
    if (canAdd) {
      onChange([...banners, { image: "", discount: 0 }]);
    }
  };

  const removeBanner = (index: number) => {
    if (canRemove) {
      onChange(banners.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          Discount Banners
          {maxItems && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({banners.length}/{maxItems})
            </span>
          )}
        </Label>
        {canAdd && (
          <Button type="button" variant="outline" size="sm" onClick={addBanner}>
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={banners.map((_, i) => `discount-banner-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {banners.map((banner, index) => (
              <SortableDiscountBannerItem
                key={`discount-banner-${index}`}
                id={`discount-banner-${index}`}
                banner={banner}
                index={index}
                onChange={(updated) => {
                  const newBanners = [...banners];
                  newBanners[index] = updated;
                  onChange(newBanners);
                }}
                onRemove={() => removeBanner(index)}
                canRemove={canRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// Sortable New Arrival Item
function SortableNewArrivalItem({
  id,
  item,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  id: string;
  item: NewArrivalItem;
  index: number;
  onChange: (item: NewArrivalItem) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 border rounded-xl space-y-3 bg-muted/30",
        isDragging && "opacity-50 z-50",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              "flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg",
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
          <span className="text-sm font-medium">Item {index + 1}</span>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={item.title}
            onChange={(e) => onChange({ ...item, title: e.target.value })}
            placeholder="Item title"
          />
        </div>
        <div className="space-y-2">
          <Label>Subtitle</Label>
          <Input
            value={item.subtitle}
            onChange={(e) => onChange({ ...item, subtitle: e.target.value })}
            placeholder="e.g., Up to 20% Off"
          />
        </div>
        <ImageInput
          value={item.image}
          onChange={(value) => onChange({ ...item, image: value })}
          placeholder="Item image URL"
        />
        <NavigationFields
          data={item}
          onChange={(updates) => onChange({ ...item, ...updates })}
        />
      </div>
    </div>
  );
}

// New arrival items editor (reorderable with add/remove)
function NewArrivalItemsEditor({
  items,
  onChange,
  minItems,
  maxItems,
}: {
  items: NewArrivalItem[];
  onChange: (items: NewArrivalItem[]) => void;
  minItems?: number;
  maxItems?: number;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = items.findIndex(
        (_, i) => `arrival-item-${i}` === active.id,
      );
      const newIndex = items.findIndex(
        (_, i) => `arrival-item-${i}` === over.id,
      );
      onChange(arrayMove(items, oldIndex, newIndex));
    }
  };

  const canAdd = maxItems === undefined || items.length < maxItems;
  const canRemove = minItems === undefined || items.length > minItems;

  const addItem = () => {
    if (canAdd) {
      onChange([...items, { title: "", subtitle: "", image: "" }]);
    }
  };

  const removeItem = (index: number) => {
    if (canRemove) {
      onChange(items.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          Items
          {maxItems && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({items.length}/{maxItems})
            </span>
          )}
        </Label>
        {canAdd && (
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((_, i) => `arrival-item-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {items.map((item, index) => (
              <SortableNewArrivalItem
                key={`arrival-item-${index}`}
                id={`arrival-item-${index}`}
                item={item}
                index={index}
                onChange={(updated) => {
                  const newItems = [...items];
                  newItems[index] = updated;
                  onChange(newItems);
                }}
                onRemove={() => removeItem(index)}
                canRemove={canRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// Sortable Luxury Brand Item
function SortableLuxuryBrandItem({
  id,
  brand,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  id: string;
  brand: LuxuryBrand;
  index: number;
  onChange: (brand: LuxuryBrand) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 border rounded-xl space-y-3 bg-muted/30",
        isDragging && "opacity-50 z-50",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              "flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg",
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
          <span className="text-sm font-medium">Brand {index + 1}</span>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={brand.name}
            onChange={(e) => onChange({ ...brand, name: e.target.value })}
            placeholder="Brand name"
          />
        </div>
        <div className="space-y-2">
          <Label>Image</Label>
          <ImageInput
            value={brand.image}
            onChange={(value) => onChange({ ...brand, image: value })}
            placeholder="Brand image URL"
          />
        </div>

        <NavigationFields
          data={brand}
          onChange={(updates) => onChange({ ...brand, ...updates })}
        />
      </div>
    </div>
  );
}

// Luxury brands editor (reorderable with add/remove)
function LuxuryBrandsEditor({
  brands,
  onChange,
  minItems = 1,
  maxItems,
}: {
  brands: LuxuryBrand[];
  onChange: (brands: LuxuryBrand[]) => void;
  minItems?: number;
  maxItems?: number;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = brands.findIndex(
        (_, i) => `luxury-brand-${i}` === active.id,
      );
      const newIndex = brands.findIndex(
        (_, i) => `luxury-brand-${i}` === over.id,
      );
      onChange(arrayMove(brands, oldIndex, newIndex));
    }
  };

  const canAdd = maxItems === undefined || brands.length < maxItems;
  const canRemove = brands.length > minItems;

  const addBrand = () => {
    if (canAdd) {
      onChange([...brands, { name: "", image: "" }]);
    }
  };

  const removeBrand = (index: number) => {
    if (canRemove) {
      onChange(brands.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          Luxury Brands
          {maxItems && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({brands.length}/{maxItems})
            </span>
          )}
        </Label>
        {canAdd && (
          <Button type="button" variant="outline" size="sm" onClick={addBrand}>
            <Plus className="h-4 w-4 mr-1" />
            Add Brand
          </Button>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={brands.map((_, i) => `luxury-brand-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {brands.map((brand, index) => (
              <SortableLuxuryBrandItem
                key={`luxury-brand-${index}`}
                id={`luxury-brand-${index}`}
                brand={brand}
                index={index}
                onChange={(updated) => {
                  const newBrands = [...brands];
                  newBrands[index] = updated;
                  onChange(newBrands);
                }}
                onRemove={() => removeBrand(index)}
                canRemove={canRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// Sortable K-Beauty Brand Item
function SortableKBeautyBrandItem({
  id,
  brand,
  index,
  onChange,
  onRemove,
  canRemove,
}: {
  id: string;
  brand: KBeautyBrand;
  index: number;
  onChange: (brand: KBeautyBrand) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "p-4 border rounded-xl space-y-3 bg-muted/30",
        isDragging && "opacity-50 z-50",
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            type="button"
            className={cn(
              "flex h-8 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg",
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
          <span className="text-sm font-medium">Brand {index + 1}</span>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onRemove}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="grid gap-3">
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={brand.title}
            onChange={(e) => onChange({ ...brand, title: e.target.value })}
            placeholder="Brand title"
          />
        </div>
        <ImageInput
          value={brand.image}
          onChange={(value) => onChange({ ...brand, image: value })}
          placeholder="Brand image URL"
        />
        <NavigationFields
          data={brand}
          onChange={(updates) => onChange({ ...brand, ...updates })}
        />
      </div>
    </div>
  );
}

// K-Beauty brands editor (reorderable with add/remove)
function KBeautyBrandsEditor({
  brands,
  onChange,
  minItems,
  maxItems,
}: {
  brands: KBeautyBrand[];
  onChange: (brands: KBeautyBrand[]) => void;
  minItems?: number;
  maxItems?: number;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = brands.findIndex(
        (_, i) => `kbeauty-brand-${i}` === active.id,
      );
      const newIndex = brands.findIndex(
        (_, i) => `kbeauty-brand-${i}` === over.id,
      );
      onChange(arrayMove(brands, oldIndex, newIndex));
    }
  };

  const canAdd = maxItems === undefined || brands.length < maxItems;
  const canRemove = minItems === undefined || brands.length > minItems;

  const addBrand = () => {
    if (canAdd) {
      onChange([...brands, { title: "", image: "" }]);
    }
  };

  const removeBrand = (index: number) => {
    if (canRemove) {
      onChange(brands.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label>
          K-Beauty Brands
          {maxItems && (
            <span className="ml-2 text-xs text-muted-foreground font-normal">
              ({brands.length}/{maxItems})
            </span>
          )}
        </Label>
        {canAdd && (
          <Button type="button" variant="outline" size="sm" onClick={addBrand}>
            <Plus className="h-4 w-4 mr-1" />
            Add Brand
          </Button>
        )}
      </div>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={brands.map((_, i) => `kbeauty-brand-${i}`)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-4">
            {brands.map((brand, index) => (
              <SortableKBeautyBrandItem
                key={`kbeauty-brand-${index}`}
                id={`kbeauty-brand-${index}`}
                brand={brand}
                index={index}
                onChange={(updated) => {
                  const newBrands = [...brands];
                  newBrands[index] = updated;
                  onChange(newBrands);
                }}
                onRemove={() => removeBrand(index)}
                canRemove={canRemove}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

// Main section settings editor component
export function SectionSettingsEditor({
  section,
  onUpdate,
}: SectionSettingsEditorProps) {
  const settings = section.settings as Record<string, unknown>;
  const assets = (settings.assets || {}) as Record<string, unknown>;

  const updateSettings = (updates: Partial<Section["settings"]>) => {
    onUpdate({ ...settings, ...updates } as Section["settings"]);
  };

  const updateAssets = (assetUpdates: Record<string, unknown>) => {
    onUpdate({
      ...settings,
      assets: { ...assets, ...assetUpdates },
    } as Section["settings"]);
  };

  // Render different editors based on section type
  switch (section.type) {
    case "featured_categories":
      return (
        <BannersEditor
          banners={(assets.items as BannerItem[]) || []}
          onChange={(items) => updateAssets({ items })}
          label="Categories"
        />
      );

    case "hot_list":
      return (
        <div className="text-sm text-muted-foreground text-center py-6">
          This section has no configurable settings
        </div>
      );

    case "featured_section":
      return (
        <BannersEditor
          banners={(assets.items as BannerItem[]) || []}
          onChange={(items) => updateAssets({ items })}
        />
      );

    case "promo_code_banner":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Promo Code</Label>
            <Input
              value={(settings.subtitle as string) || ""}
              onChange={(e) => updateSettings({ subtitle: e.target.value })}
              placeholder="e.g., PINKBLISS10"
            />
          </div>
          <div className="space-y-2">
            <Label>Banner Image</Label>
            <ImageInput
              value={(assets.mainBanner as string) || ""}
              onChange={(value) => updateAssets({ mainBanner: value })}
              placeholder="Promo banner image URL"
            />
          </div>
        </div>
      );

    case "explore_top_brands":
      return (
        <div className="space-y-6">
          <TitleSubtitleFields
            title={settings.title as string}
            subtitle={settings.subtitle as string}
            onTitleChange={(value) => updateSettings({ title: value })}
            onSubtitleChange={(value) => updateSettings({ subtitle: value })}
          />
          <BannersEditor
            banners={(assets.items as BannerItem[]) || []}
            onChange={(items) => updateAssets({ items })}
          />
        </div>
      );

    case "focus_on":
      return (
        <div className="space-y-6">
          <TitleSubtitleFields
            title={settings.title as string}
            subtitle={settings.subtitle as string}
            onTitleChange={(value) => updateSettings({ title: value })}
            onSubtitleChange={(value) => updateSettings({ subtitle: value })}
          />
          <BannersEditor
            banners={(assets.items as BannerItem[]) || []}
            onChange={(items) => updateAssets({ items })}
            minItems={1}
          />
        </div>
      );

    case "loyalty_deals":
      return (
        <div className="space-y-6">
          <TitleSubtitleFields
            title={settings.title as string}
            subtitle={settings.subtitle as string}
            onTitleChange={(value) => updateSettings({ title: value })}
            onSubtitleChange={(value) => updateSettings({ subtitle: value })}
          />
          <div className="space-y-2">
            <Label>Main Banner</Label>
            <ImageInput
              value={(assets.mainBanner as string) || ""}
              onChange={(value) => updateAssets({ mainBanner: value })}
              placeholder="Main banner image URL"
            />
          </div>
          <BannersEditor
            banners={(assets.items as BannerItem[]) || []}
            onChange={(items) => updateAssets({ items })}
            label="Additional Banners"
          />
        </div>
      );

    case "new_arrivals":
      return (
        <div className="space-y-6">
          <TitleSubtitleFields
            title={settings.title as string}
            subtitle={settings.subtitle as string}
            onTitleChange={(value) => updateSettings({ title: value })}
            onSubtitleChange={(value) => updateSettings({ subtitle: value })}
          />

          <NewArrivalItemsEditor
            items={(assets.items as NewArrivalItem[]) || []}
            onChange={(items) => updateAssets({ items })}
            minItems={1}
          />
        </div>
      );

    case "featured_brands":
      return (
        <div className="space-y-6">
          <TitleSubtitleFields
            title={settings.title as string}
            subtitle={settings.subtitle as string}
            onTitleChange={(value) => updateSettings({ title: value })}
            onSubtitleChange={() => {}}
            showSubtitle={false}
          />
          <BannersEditor
            banners={(assets.items as BannerItem[]) || []}
            onChange={(items) => updateAssets({ items })}
            label="Brands"
          />
        </div>
      );

    case "best_seller_brands":
      return (
        <TitleSubtitleFields
          title={settings.title as string}
          subtitle={settings.subtitle as string}
          onTitleChange={(value) => updateSettings({ title: value })}
          onSubtitleChange={() => {}}
          showSubtitle={false}
        />
      );

    case "sale_update":
      return (
        <div className="space-y-2">
          <Label>Title</Label>
          <Input
            value={(settings.title as string) || ""}
            onChange={(e) => updateSettings({ title: e.target.value })}
            placeholder="Sale announcement text"
            className="text-sm"
          />
        </div>
      );

    case "special_discount":
      return (
        <div className="space-y-6">
          <TitleSubtitleFields
            title={settings.title as string}
            subtitle={settings.subtitle as string}
            onTitleChange={(value) => updateSettings({ title: value })}
            onSubtitleChange={(value) => updateSettings({ subtitle: value })}
          />
          <div className="space-y-2">
            <Label>Main Banner</Label>
            <ImageInput
              value={(assets.mainBanner as string) || ""}
              onChange={(value) => updateAssets({ mainBanner: value })}
              placeholder="Main banner image URL"
            />
          </div>
          <DiscountBannersEditor
            banners={(assets.items as BannerWithDiscount[]) || []}
            onChange={(items) => updateAssets({ items })}
            minItems={1}
          />
        </div>
      );

    case "luxury_lineup":
      return (
        <div className="space-y-6">
          <TitleSubtitleFields
            title={settings.title as string}
            subtitle={settings.subtitle as string}
            onTitleChange={(value) => updateSettings({ title: value })}
            onSubtitleChange={(value) => updateSettings({ subtitle: value })}
          />
          <LuxuryBrandsEditor
            brands={(assets.items as LuxuryBrand[]) || []}
            onChange={(items) => updateAssets({ items })}
          />
        </div>
      );

    case "ads_banner":
      return (
        <div className="space-y-2">
          <Label>Ads Banners</Label>
          <BannersEditor
            banners={(assets.items as BannerItem[]) || []}
            onChange={(items) => updateAssets({ items })}
            label="Ads"
          />
        </div>
      );

    case "k_studio":
      return (
        <div className="space-y-6">
          <TitleSubtitleFields
            title={settings.title as string}
            subtitle={settings.subtitle as string}
            onTitleChange={(value) => updateSettings({ title: value })}
            onSubtitleChange={(value) => updateSettings({ subtitle: value })}
          />
          <KBeautyBrandsEditor
            brands={(assets.items as KBeautyBrand[]) || []}
            onChange={(items) => updateAssets({ items })}
            minItems={1}
          />
        </div>
      );

    default:
      return (
        <div className="text-sm text-muted-foreground text-center py-6">
          Unknown section type
        </div>
      );
  }
}

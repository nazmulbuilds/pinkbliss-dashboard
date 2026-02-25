// Section Types
export type SectionType =
  | "featured_categories"
  | "featured_section"
  | "promo_code_banner"
  | "explore_top_brands"
  | "loyalty_deals"
  | "new_arrivals"
  | "hot_list"
  | "featured_brands"
  | "special_discount"
  | "focus_on"
  | "best_seller_brands"
  | "luxury_lineup"
  | "ads_banner"
  | "k_studio"
  | "sale_update";

// Banner Types
export interface ImageNavigationData {
  category?: string;
  brand?: number | string;
  filter?: string;
  searchQuery?: string;
  productId?: string;
  name?: string;
}

export interface BannerItem extends ImageNavigationData {
  image: string;
}

export interface BannerWithDiscount extends BannerItem {
  discount: number;
}

export interface NewArrivalItem extends ImageNavigationData {
  title: string;
  subtitle: string;
  image: string;
}

export interface LuxuryBrand extends ImageNavigationData {
  name: string;
  image: string;
}

export interface KBeautyBrand extends ImageNavigationData {
  title: string;
  image: string;
}

// Settings Types for each section
export interface FeaturedCategoriesSettings {
  assets: {
    items: BannerItem[];
  };
}

export interface FeaturedSectionSettings {
  assets: {
    items: BannerItem[];
  };
}

export interface PromoCodeBannerSettings {
  subtitle: string;
  assets: {
    mainBanner: string;
  };
}

export interface ExploreTopBrandsSettings {
  title: string;
  subtitle: string;
  assets: {
    items: BannerItem[];
  };
}

export interface LoyaltyDealsSettings {
  title: string;
  subtitle: string;
  assets: {
    mainBanner: string;
    items: BannerItem[];
  };
}

export interface NewArrivalsSettings {
  title: string;
  subtitle: string;
  assets: {
    mainBanner?: string;
    items: NewArrivalItem[];
  };
}

export interface HotListSettings {}

export interface FeaturedBrandsSettings {
  title: string;
  assets: {
    items: BannerItem[];
  };
}

export interface SpecialDiscountSettings {
  title: string;
  subtitle: string;
  assets: {
    mainBanner: string;
    items: BannerWithDiscount[];
  };
}

export interface FocusOnSettings {
  title: string;
  subtitle: string;
  assets: {
    items: BannerItem[];
  };
}

export interface BestSellerBrandsSettings {
  title: string;
}

export interface LuxuryLineupSettings {
  title: string;
  subtitle: string;
  assets: {
    items: LuxuryBrand[];
  };
}

export interface AdsBannerSettings {
  assets: {
    items: BannerItem[];
  };
}

export interface KStudioSettings {
  title: string;
  subtitle: string;
  assets: {
    items: KBeautyBrand[];
  };
}

export interface SaleUpdateSettings {
  title: string;
}

// Union type for all settings
export type SectionSettings =
  | FeaturedCategoriesSettings
  | FeaturedSectionSettings
  | PromoCodeBannerSettings
  | ExploreTopBrandsSettings
  | LoyaltyDealsSettings
  | NewArrivalsSettings
  | HotListSettings
  | FeaturedBrandsSettings
  | SpecialDiscountSettings
  | FocusOnSettings
  | BestSellerBrandsSettings
  | LuxuryLineupSettings
  | AdsBannerSettings
  | KStudioSettings
  | SaleUpdateSettings;

// Base Section Interface
export interface Section {
  id: string;
  type: SectionType;
  enabled: boolean;
  order: number;
  title?: string; // Optional custom display title
  settings: SectionSettings;
}

// Section Configuration for UI
export interface SectionConfig {
  sections: Section[];
}

// Display names for section types
export const SECTION_TYPE_LABELS: Record<SectionType, string> = {
  featured_categories: "Featured Categories",
  featured_section: "Featured Banners",
  promo_code_banner: "Promo Code Banner",
  explore_top_brands: "Explore Top Brands",
  loyalty_deals: "Loyalty Deals",
  new_arrivals: "New Arrivals",
  hot_list: "Hot List",
  featured_brands: "Featured Brands",
  special_discount: "Special Discount",
  focus_on: "Focus On",
  best_seller_brands: "Best Seller Brands",
  luxury_lineup: "Luxury Lineup",
  ads_banner: "Ads Banner",
  k_studio: "K-Studio",
  sale_update: "Sale Update",
};

// Icons for section types (using lucide icon names)
export const SECTION_TYPE_ICONS: Record<SectionType, string> = {
  featured_categories: "Grid3X3",
  featured_section: "Image",
  promo_code_banner: "Ticket",
  explore_top_brands: "Compass",
  loyalty_deals: "Heart",
  new_arrivals: "Sparkles",
  hot_list: "Flame",
  featured_brands: "Award",
  special_discount: "Percent",
  focus_on: "Focus",
  best_seller_brands: "TrendingUp",
  luxury_lineup: "Crown",
  ads_banner: "Megaphone",
  k_studio: "Palette",
  sale_update: "BadgePercent",
};

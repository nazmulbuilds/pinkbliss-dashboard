import type { Section, SectionType } from "@/lib/types/sections";

// Template definitions for each section type with default settings
export const SECTION_TEMPLATES: Record<
  SectionType,
  Omit<Section, "id" | "order">
> = {
  featured_categories: {
    type: "featured_categories",
    enabled: true,
    settings: {
      assets: {
        items: [],
      },
    },
  },
  featured_section: {
    type: "featured_section",
    enabled: true,
    settings: {
      assets: {
        items: [{ image: "" }],
      },
    },
  },
  promo_code_banner: {
    type: "promo_code_banner",
    enabled: true,
    settings: {
      subtitle: "PROMOCODE",
      assets: {
        mainBanner: "",
      },
    },
  },
  explore_top_brands: {
    type: "explore_top_brands",
    enabled: true,
    settings: {
      title: "Explore Top Brands",
      subtitle: "Curated Collection from Industry Leaders",
      assets: {
        items: [{ image: "" }],
      },
    },
  },
  loyalty_deals: {
    type: "loyalty_deals",
    enabled: true,
    settings: {
      title: "Loyalty Deals",
      subtitle: "& Exclusive Offers",
      assets: {
        mainBanner: "",
        items: [{ image: "" }],
      },
    },
  },
  new_arrivals: {
    type: "new_arrivals",
    enabled: true,
    settings: {
      title: "New Arrivals",
      subtitle: "See What's Fresh!",
      assets: {
        items: [{ title: "Brand", subtitle: "Offer", image: "" }],
      },
    },
  },
  hot_list: {
    type: "hot_list",
    enabled: true,
    settings: {},
  },
  featured_brands: {
    type: "featured_brands",
    enabled: true,
    settings: {
      title: "Featured Brands",
      assets: {
        items: [{ image: "" }],
      },
    },
  },
  special_discount: {
    type: "special_discount",
    enabled: true,
    settings: {
      title: "Special Discount",
      subtitle: "& Exclusive Offers",
      assets: {
        mainBanner: "",
        items: [{ image: "", discount: 0 }],
      },
    },
  },
  focus_on: {
    type: "focus_on",
    enabled: true,
    settings: {
      title: "Focus On",
      subtitle: "Curated Collection from Industry Leaders",
      assets: {
        items: [{ image: "" }],
      },
    },
  },
  best_seller_brands: {
    type: "best_seller_brands",
    enabled: true,
    settings: {
      title: "Best Seller Brands",
    },
  },

  luxury_lineup: {
    type: "luxury_lineup",
    enabled: true,
    settings: {
      title: "Luxe",
      subtitle: "Explore Luxury Lineup",
      assets: {
        items: [{ name: "Brand Name", image: "" }],
      },
    },
  },
  ads_banner: {
    type: "ads_banner",
    enabled: true,
    settings: {
      assets: {
        items: [{ image: "" }],
      },
    },
  },
  k_studio: {
    type: "k_studio",
    enabled: true,
    settings: {
      title: "K-STUDIO",
      subtitle: "K-Beauty Essentials",
      assets: {
        items: [{ title: "Brand", image: "" }],
      },
    },
  },
  sale_update: {
    type: "sale_update",
    enabled: true,
    settings: {
      title: "Sale Update banner",
    },
  },
};

// Create a new section from template
export function createSectionFromTemplate(
  type: SectionType,
  order: number,
): Section {
  const template = SECTION_TEMPLATES[type];
  return {
    ...template,
    id: `${type}_${Date.now()}`,
    order,
    settings: JSON.parse(JSON.stringify(template.settings)), // Deep copy
  };
}

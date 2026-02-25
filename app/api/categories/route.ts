import { NextResponse } from "next/server";

export interface CategoryImage {
  id: string;
  src: string;
}

export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
  description: string;
  order: string;
  image: CategoryImage | null;
  count: number;
  subCategories: ApiCategory[];
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (!baseUrl) {
    return NextResponse.json(
      { message: "NEXT_PUBLIC_API_BASE_URL is not configured" },
      { status: 500 }
    );
  }

  try {
    const url = `${baseUrl.replace(/\/$/, "")}/categories/`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: `Categories API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data: ApiCategory[] = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { message: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

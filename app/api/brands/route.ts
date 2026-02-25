import { NextResponse } from "next/server";

export interface BrandTerm {
  id: number;
  name: string;
  slug: string;
  group: number;
  parent: number;
  count: number;
  metadata?: Record<string, unknown>;
}

export interface PaBrandResponse {
  name: string;
  slug: string;
  description: string;
  terms: BrandTerm[];
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
    const url = `${baseUrl.replace(/\/$/, "")}/product-attributes/pa_brand`;
    const res = await fetch(url, {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: `Brands API returned ${res.status}` },
        { status: res.status }
      );
    }

    const data: PaBrandResponse = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch brands:", error);
    return NextResponse.json(
      { message: "Failed to fetch brands" },
      { status: 500 }
    );
  }
}

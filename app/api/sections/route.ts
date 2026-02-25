import { NextResponse } from "next/server";
import type { SectionConfig } from "@/lib/types/sections";

export async function POST(request: Request) {
  try {
    const config: SectionConfig = await request.json();

    // Validate the config structure
    if (!config.sections || !Array.isArray(config.sections)) {
      return NextResponse.json(
        { message: "Invalid configuration: sections array is required" },
        { status: 400 }
      );
    }

    // Here you would typically save to a database
    // For now, we'll just log and return success
    console.log("Received sections config:", JSON.stringify(config, null, 2));
    console.log(`Total sections: ${config.sections.length}`);
    console.log(
      `Enabled sections: ${config.sections.filter((s) => s.enabled).length}`
    );

    // Simulate a small delay like a real API would have
    await new Promise((resolve) => setTimeout(resolve, 500));

    return NextResponse.json({
      success: true,
      message: "Configuration saved successfully",
      sectionsCount: config.sections.length,
    });
  } catch (error) {
    console.error("Error saving sections config:", error);
    return NextResponse.json(
      { message: "Failed to save configuration" },
      { status: 500 }
    );
  }
}

export async function GET() {
  // You could load from database here
  return NextResponse.json({
    message: "Use POST to save sections configuration",
  });
}

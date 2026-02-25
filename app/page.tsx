"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { SectionManager } from "@/components/section-editor";
import { Header } from "@/components/header";
import { isAuthenticated, getToken } from "@/lib/auth";
import type { SectionConfig } from "@/lib/types/sections";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

export default function HomePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(true);
    const [sectionsConfig, setSectionsConfig] = React.useState<SectionConfig | null>(null);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/login");
            return;
        }

        // Fetch sections from API
        const fetchSections = async () => {
            try {
                const token = getToken();
                const response = await fetch(`${API_BASE_URL}/home-sections-v2`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token && { Authorization: `Bearer ${token}` }),
                    },
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch sections (${response.status})`);
                }

                const data = await response.json();
                // Handle both array response and object with sections property
                const sections = Array.isArray(data) ? data : (data?.sections || []);
                setSectionsConfig({ sections });
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load sections");
            } finally {
                setIsLoading(false);
            }
        };

        fetchSections();
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-pink-500 border-t-transparent" />
                    <p className="text-sm text-muted-foreground">Loading sections...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/30">
                <div className="flex flex-col items-center gap-4 text-center px-4">
                    <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                        <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-sm text-pink-600 hover:text-pink-700 underline"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    if (!sectionsConfig) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/30">
            <Header />
            <main>
                <div className="mx-auto max-w-3xl px-4 py-8">
                    <SectionManager initialConfig={sectionsConfig} />
                </div>
            </main>
        </div>
    );
}

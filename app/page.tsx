"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Layers, Settings } from "lucide-react";
import { SectionManager, SettingsManager } from "@/components/section-editor";
import { Header } from "@/components/header";
import { isAuthenticated, authFetch } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { SectionConfig } from "@/lib/types/sections";

type ActiveTab = "sections" | "settings";

export default function HomePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(true);
    const [sectionsConfig, setSectionsConfig] = React.useState<SectionConfig | null>(null);
    const [error, setError] = React.useState<string | null>(null);
    const [activeTab, setActiveTab] = React.useState<ActiveTab>("sections");
    const [fastrrCheckout, setFastrrCheckout] = React.useState(false);
    const [razorPay, setRazorPay] = React.useState(false);

    React.useEffect(() => {
        if (!isAuthenticated()) {
            router.push("/login");
            return;
        }

        const fetchSections = async () => {
            try {
                const response = await authFetch("/home-sections-v2", {
                    method: "GET",
                });

                if (!response.ok) {
                    throw new Error(`Failed to fetch sections (${response.status})`);
                }

                const data = await response.json();
                const sections = Array.isArray(data) ? data : (data?.sections || []);
                const isFastrrCheckout = !Array.isArray(data) && data?.fastrrCheckout === true;
                const isRazorPay = !Array.isArray(data) && data?.razorPay === true;
                setSectionsConfig({ sections });
                setFastrrCheckout(isFastrrCheckout);
                setRazorPay(isRazorPay);
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
                    {/* Tab Navigation */}
                    <div className="flex items-center gap-1 p-1 mb-8 bg-muted rounded-xl w-fit">
                        <button
                            type="button"
                            onClick={() => setActiveTab("sections")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                                activeTab === "sections"
                                    ? "bg-white dark:bg-gray-800 text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Layers className="h-4 w-4" />
                            Sections
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveTab("settings")}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer",
                                activeTab === "settings"
                                    ? "bg-white dark:bg-gray-800 text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <Settings className="h-4 w-4" />
                            Settings
                        </button>
                    </div>

                    {activeTab === "sections" && (
                        <SectionManager
                            initialConfig={sectionsConfig}
                            fastrrCheckout={fastrrCheckout}
                        />
                    )}

                    {activeTab === "settings" && (
                        <SettingsManager
                            initialFastrrCheckout={fastrrCheckout}
                            initialRazorPay={razorPay}
                            sections={sectionsConfig.sections}
                            onFastrrCheckoutChange={setFastrrCheckout}
                            onRazorPayChange={setRazorPay}
                        />
                    )}
                </div>
            </main>
        </div>
    );
}

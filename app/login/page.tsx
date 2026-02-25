"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login, isAuthenticated } from "@/lib/auth";

export default function LoginPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = React.useState(false);
    const [showPassword, setShowPassword] = React.useState(false);
    const [error, setError] = React.useState("");
    const [formData, setFormData] = React.useState({
        emailOrUsername: "",
        password: "",
    });

    // Redirect if already authenticated
    React.useEffect(() => {
        if (isAuthenticated()) {
            router.push("/");
        }
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            await login(formData);
            router.push("/");
        } catch (err) {
            setError(err instanceof Error ? err.message : "Login failed. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
        if (error) setError("");
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 p-4">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23f9a8d4%22%20fill-opacity%3D%220.1%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50" />

            <div className="relative w-full max-w-md">
                {/* Logo/Brand */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-lg shadow-pink-500/25 mb-4">
                        <span className="text-2xl font-bold">P</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Welcome Back
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-1">
                        Sign in to your PinkBliss account
                    </p>
                </div>

                {/* Login Card */}
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-xl shadow-gray-200/50 dark:shadow-none border border-white/50 dark:border-gray-700/50 p-8">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Error Message */}
                        {error && (
                            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/30">
                                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                            </div>
                        )}

                        {/* Email/Username Field */}
                        <div className="space-y-2">
                            <Label htmlFor="emailOrUsername" className="text-gray-700 dark:text-gray-300">
                                Email or Username
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    id="emailOrUsername"
                                    name="emailOrUsername"
                                    type="text"
                                    placeholder="Enter your email or username"
                                    value={formData.emailOrUsername}
                                    onChange={handleChange}
                                    className={cn(
                                        "pl-10 h-12 rounded-xl border-gray-200 dark:border-gray-700",
                                        "focus:border-pink-500 focus:ring-pink-500/20",
                                        "bg-white dark:bg-gray-900"
                                    )}
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700 dark:text-gray-300">
                                Password
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <Input
                                    id="password"
                                    name="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={cn(
                                        "pl-10 pr-10 h-12 rounded-xl border-gray-200 dark:border-gray-700",
                                        "focus:border-pink-500 focus:ring-pink-500/20",
                                        "bg-white dark:bg-gray-900"
                                    )}
                                    required
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-5 w-5" />
                                    ) : (
                                        <Eye className="h-5 w-5" />
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isLoading}
                            className={cn(
                                "w-full h-12 rounded-xl text-base font-medium",
                                "bg-gradient-to-r from-pink-500 to-rose-500",
                                "hover:from-pink-600 hover:to-rose-600",
                                "shadow-lg shadow-pink-500/25",
                                "transition-all duration-200",
                                "disabled:opacity-50 disabled:cursor-not-allowed"
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Signing in...
                                </>
                            ) : (
                                "Sign In"
                            )}
                        </Button>
                    </form>
                </div>

                {/* Footer */}
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
                    PinkBliss Dashboard &copy; {new Date().getFullYear()}
                </p>
            </div>
        </div>
    );
}


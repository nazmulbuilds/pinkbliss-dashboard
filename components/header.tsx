"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { getUser, isAuthenticated, logout, type User as UserType } from "@/lib/auth";

export function Header() {
  const router = useRouter();
  const [user, setUser] = React.useState<UserType | null>(null);
  // Tracked separately from `user`, and this is the point: a browser can hold a
  // token whose stored user is unreadable — one saved by a build before the
  // operator cutover, or a `user` key cleared on its own. Gating the menu on
  // `user` alone hid Sign out in exactly that case, stranding a session with no
  // way to end it. The token is what says a session exists; the name is
  // decoration.
  const [signedIn, setSignedIn] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setUser(getUser());
    setSignedIn(isAuthenticated());
  }, []);

  // Close dropdown when clicking outside
  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const getInitials = (username: string) => username.slice(0, 2).toUpperCase();

  // Shown when the token is there but the name is not.
  const displayName = user?.username ?? "Signed in";

  return (
    <header className="sticky top-0 z-40 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md shadow-pink-500/20">
              <span className="text-sm font-bold">P</span>
            </div>
            <span className="font-semibold text-gray-900 dark:text-white">
              Dashboard
            </span>
          </div>

          {/* Profile Dropdown */}
          {signedIn && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2 transition-colors cursor-pointer",
                  "hover:bg-gray-100 dark:hover:bg-gray-800",
                  isDropdownOpen && "bg-gray-100 dark:bg-gray-800"
                )}
              >
                {/* Avatar */}
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-400 text-white text-sm font-medium">
                  {getInitials(displayName)}
                </div>
                {/* Name */}
                <div className="hidden sm:block text-left">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {displayName}
                  </p>
                </div>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-gray-500 transition-transform",
                    isDropdownOpen && "rotate-180"
                  )}
                />
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg shadow-gray-200/50 dark:shadow-none overflow-hidden animate-in fade-in-0 zoom-in-95 slide-in-from-top-2">
                  {/* User Info */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-pink-400 to-rose-400 text-white font-medium">
                        {getInitials(displayName)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 dark:text-white truncate">
                          {displayName}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


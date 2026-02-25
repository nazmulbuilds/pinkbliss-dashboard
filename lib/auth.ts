// Auth Types
export interface User {
  id: number;
  userLogin: string;
  userNicename: string;
  userEmail: string;
  userUrl: string;
  userRegistered: string;
  userActivationKey: string;
  userStatus: number;
  displayName: string;
}

export interface LoginCredentials {
  emailOrUsername: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  user: User;
}

// Storage keys
const TOKEN_KEY = "accessToken";
const USER_KEY = "user";

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "";

// Login function
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/authentication`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(credentials),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || "Invalid credentials");
  }

  const data: AuthResponse = await response.json();

  // Store in localStorage
  if (typeof window !== "undefined") {
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  }

  return data;
}

// Logout function
export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

// Get current user
export function getUser(): User | null {
  if (typeof window === "undefined") return null;

  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;

  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

// Get access token
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

// Check if user is authenticated
export function isAuthenticated(): boolean {
  return !!getToken();
}


// Auth Types
//
// The dashboard signs in as an **Operator** (pinkbliss ADR-0012): a
// username/password pair configured in the backend's `ADMIN_USERS`, not a
// Shopify customer. An Operator has no id, no email and no phone — there is no
// record of them anywhere but that env var — so the stored user is just a name.
export interface User {
  username: string;
}

export interface LoginCredentials {
  username: string;
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
  const response = await fetch(`${API_BASE_URL}/operator-auth/login`, {
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
    const parsed = JSON.parse(userStr) as Partial<User>;
    // A browser that logged in before the Operator cutover still holds the old
    // WordPress-shaped user (`userLogin`, `displayName`, …). Rendering that
    // gives a header reading "undefined", so treat anything without a username
    // as no user at all — the token beside it is dead anyway, signed with a
    // secret the backend no longer accepts.
    if (typeof parsed?.username !== "string" || !parsed.username) return null;
    return { username: parsed.username };
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

/**
 * Clears the session and sends the browser to the login page.
 *
 * `location.replace`, not the Next router: this runs from inside failed
 * requests anywhere in the tree, and replacing the history entry means the
 * back button cannot return to a dashboard whose token is already gone.
 */
export function signOutAndRedirect(): void {
  logout();
  if (typeof window !== "undefined" && window.location.pathname !== "/login") {
    window.location.replace("/login");
  }
}

/**
 * Every call to the backend goes through here.
 *
 * A 401 is the normal end of a session, not an exceptional error — the token
 * is revoked, expired, or was minted by an older build — and it needs handling
 * in one place because the dashboard cannot detect it any other way: the
 * homepage read is a public endpoint, so a dead token still loads the app
 * perfectly and only reveals itself when a save fails. Without this the
 * operator gets a red toast reading "Failed to save (401)", their unsaved work
 * on screen and no route forward but clearing storage by hand.
 */
export async function authFetch(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (response.status === 401) {
    signOutAndRedirect();
    throw new Error("Your session has ended. Please sign in again.");
  }

  return response;
}

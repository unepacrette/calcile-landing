// Base URL of the calcile-api backend. NEXT_PUBLIC_* env vars are inlined
// at build time; the fallback keeps the site working even in an
// environment where the var hasn't been set explicitly.
export const API_URL =
  process.env.NEXT_PUBLIC_CALCILE_API_URL ||
  "https://web-production-853a5.up.railway.app";

export const AUTH_TOKEN_KEY = "calcile_token";

export function getStoredToken(): string | null {
  try {
    return window.localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string): void {
  try {
    window.localStorage.setItem(AUTH_TOKEN_KEY, token);
  } catch {
    // ignore (private browsing, etc.)
  }
}

export function clearStoredToken(): void {
  try {
    window.localStorage.removeItem(AUTH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function authHeaders(token: string): HeadersInit {
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

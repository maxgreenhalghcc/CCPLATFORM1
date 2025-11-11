import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines multiple class values into a single, deduplicated Tailwind-compatible class string.
 *
 * @param inputs - Class values (strings, arrays, objects) to merge
 * @returns The merged class string with Tailwind classes deduplicated and normalized
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface ThemeSettings {
  name: string;
  slug: string;
  theme: Record<string, string>;
}

/**
 * Convert a theme map into CSS custom property entries.
 *
 * @param theme - Mapping of token names to CSS values (e.g., `{ "color-primary": "#fff" }`)
 * @returns An object where each key is the original token name prefixed with `--` (CSS variable) and each value is the same CSS value
 */
export function themeToCssVars(theme: Record<string, string>): Record<string, string> {
  return Object.entries(theme).reduce<Record<string, string>>((acc, [key, value]) => {
    acc[`--${key}`] = value;
    return acc;
  }, {});
}

/**
 * Resolve and normalize the application's API base URL.
 *
 * Ensures the configured NEXT_PUBLIC_API_URL is present, removes a trailing slash if any, and guarantees the result ends with `/v1`.
 *
 * @returns The normalized API base URL ending with `/v1`.
 * @throws Error if the `NEXT_PUBLIC_API_URL` environment variable is not configured.
 */
export function getApiUrl(): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    throw new Error('NEXT_PUBLIC_API_URL is not configured');
  }
  const normalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  return normalized.endsWith('/v1') ? normalized : `${normalized}/v1`;
}

/**
 * Fetches JSON from the given URL and returns the parsed response.
 *
 * @param url - The request URL
 * @param init - Optional fetch init options (headers, method, body, etc.)
 * @returns The parsed JSON response as type `T`
 * @throws Error if the response has a non-OK HTTP status; the error message includes the status code
 */
export async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, init);
  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }
  return (await response.json()) as T;
}